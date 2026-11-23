#!/usr/bin/env node
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const locales=['en','es','de','fr'];
const levels=['B2','C1','C2'];
const fixtures=Object.fromEntries(locales.map(x=>[x,require(path.resolve(__dirname,'../../docs/city-quest/stage3-oracy-'+x+'.json'))]));
const URL='http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html';
async function browserPage(width=1280,height=900){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width,height}});
 const errors=[],remote=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/')&&!r.url().startsWith('data:'))remote.push(r.url());});
 return {browser,page,errors,remote};
}
async function enter(page,lang,level){
 await page.goto(URL+'?lang='+lang+'&level='+level,{waitUntil:'load'});
 await page.locator('#f1Stations button').first().waitFor();
}
test('All 144 mission-and-CEFR oral tasks show the exact native-language authored prompt',async()=>{
 const {browser,page,errors,remote}=await browserPage();
 try{
  let checked=0;
  for(const lang of locales){
   for(const level of levels){
    await enter(page,lang,level);
    const fixture=fixtures[lang];
    for(let n=1;n<=8;n++){
     await page.locator('#f1Stations button').nth(n-1).click();
     assert.equal(await page.locator('.cq-advanced-oracy-task').innerText(),
       fixture.city[String(n)][level],lang+'/city/'+n+'/'+level);
     assert.match(await page.locator('.cq-advanced-oracy-title').innerText(),
       new RegExp(level));
     assert.equal(await page.locator('.cq-advanced-oracy-criteria li').count(),3);
     assert.equal(await page.locator('#cqTeacherOracyRow').evaluate(e=>e.hidden),false);
     checked++;
    }
    await page.locator('#metroPilotToggle').click();
    assert.equal(await page.locator('#metroPilotToggle').getAttribute('aria-pressed'),'true');
    for(let n=5;n<=8;n++){
     await page.locator('#f1Stations button').nth(n-1).click();
     assert.equal(await page.locator('.cq-advanced-oracy-task').innerText(),
       fixture.metro[String(n)][level],lang+'/metro/'+n+'/'+level);
     assert.equal(await page.locator('.cq-advanced-oracy-criteria li').count(),3);
     checked++;
    }
   }
  }
  assert.equal(checked,144);
  assert.deepEqual(errors,[]);
  assert.deepEqual(remote,[]);
 }finally{await browser.close();}
});
test('A1, A2 and B1 remain uncluttered; B1 metro still works',async()=>{
 const {browser,page,errors}=await browserPage();
 try{
  for(const lang of locales){
   for(const level of ['A1','A2','B1']){
    await enter(page,lang,level);
    for(let n of [1,4,8]){
     await page.locator('#f1Stations button').nth(n-1).click();
     assert.equal(await page.locator('.cq-advanced-oracy').count(),0,lang+level+n);
     assert.equal(await page.locator('#cqTeacherOracyRow').evaluate(e=>e.hidden),true);
    }
    if(level==='B1'){
     await page.locator('#metroPilotToggle').click();
     assert.equal(await page.locator('#metroPilotToggle').getAttribute('aria-pressed'),'true');
     for(let n of [5,8]){
      await page.locator('#f1Stations button').nth(n-1).click();
      assert.equal(await page.locator('.cq-advanced-oracy').count(),0);
     }
    }else assert.equal(await page.locator('#cqModePicker').isVisible(),false);
   }
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test('A B2 student can finish a real city mission and review oral criteria without auto grading',async()=>{
 const {browser,page,errors}=await browserPage();
 try{
  await enter(page,'en','B2');
  for(let round=0;round<6;round++){
   const correctIndex=await page.evaluate(round=>{
     const G=window.CityQuestF2Engine,question=G.F.explore[round];
     const options=G.orderChoices(G.exploreChoices(question,'B2',round),'en','B2',1,round);
     return options.indexOf(question.correct);
   },round);
   assert.ok(correctIndex>=0);
   await page.locator('#f1Panel .f2-choice-list button').nth(correctIndex).click();
  }
  assert.equal(await page.locator('.cq-advanced-reflection-list li').count(),3);
  assert.match(await page.locator('.cq-advanced-oracy-disclaimer').last().innerText(),/does not record or grade/);
  assert.match(await page.locator('#f1ProgressText').innerText(),/1\s*\/\s*8/);
  const sample=page.locator('#f1Panel .f2-help p[hidden]').first();
  assert.equal(await sample.count(),1);
  await page.locator('#f1Panel .f2-help button').first().click();
  assert.equal(await sample.evaluate(e=>e.hidden),false);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test('C2 task content remains readable on 320px mobile and high text zoom',async()=>{
 const {browser,page,errors}=await browserPage(320,780);
 try{
  for(const lang of ['de','fr']){
   await enter(page,lang,'C2');
   for(const mission of [1,5,8]){
    await page.locator('#f1Stations button').nth(mission-1).click();
    assert.ok((await page.locator('.cq-advanced-oracy-task').innerText()).length>75);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,lang+'/'+mission+'/normal');
    await page.evaluate(()=>document.documentElement.style.fontSize='200%');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,lang+'/'+mission+'/200%');
    await page.evaluate(()=>document.documentElement.style.fontSize='');
   }
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
