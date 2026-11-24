#!/usr/bin/env node
'use strict';
// Stage B: human-declared speaking reflection, no microphone or automatic grade.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const BASE='http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html';
const languages=['en','es','de','fr'],levels=['B2','C1','C2'];
async function open(browser,lang,level,width=390,height=844){
 const page=await browser.newPage({viewport:{width,height}});
 const errors=[],remote=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console.error '+m.text());});
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/')&&!r.url().startsWith('data:'))remote.push(r.url());});
 await page.goto(BASE+'?lang='+lang+'&level='+level,{waitUntil:'load'});
 await page.locator('#f1Stations button').first().waitFor();
 return {page,errors,remote};
}
async function inspect(page){
 const details=page.locator('.cq-advanced-oracy-criteria');
 await details.locator('summary').click();
 const inputs=page.locator('.cq-oracy-review-list input[type=checkbox]');
 assert.equal(await inputs.count(),3);
 return {inputs,progress:page.locator('[data-cq-review-progress]')};
}
test('Stage B: 4 languages x B2/C1/C2 have native, ungraded, optional checks',{timeout:180000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const lang of languages)for(const level of levels){
   const {page,errors,remote}=await open(browser,lang,level);
   try{
    const {inputs,progress}=await inspect(page);
    assert.match(await progress.innerText(),/0\/3/);
    await inputs.nth(0).check();
    await inputs.nth(2).check();
    assert.match(await progress.innerText(),/2\/3/);
    assert.equal(await page.locator('[data-cq-partner-confirm]').count(),0);
    await page.locator('#f1Stations button').nth(1).click();
    await page.locator('#f1Stations button').first().click();
    const again=await inspect(page);
    assert.equal(await again.inputs.nth(0).isChecked(),true);
    assert.equal(await again.inputs.nth(1).isChecked(),false);
    assert.equal(await again.inputs.nth(2).isChecked(),true);
    await page.locator('#resetBtn').click();
    const reset=await inspect(page);
    assert.equal(await reset.inputs.nth(0).isChecked(),false);
    assert.match(await reset.progress.innerText(),/0\/3/);
    assert.deepEqual(errors,[],lang+'/'+level+' browser error');
    assert.deepEqual(remote,[],lang+'/'+level+' network request');
   }finally{await page.close();}
  }
 }finally{await browser.close();}
});
test('Stage B: partner confirmation is separate and cleared by practice-mode switch',{timeout:90000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const {page,errors,remote}=await open(browser,'en','B2');
  try{
   await page.locator('#f1Pair').click();
   await inspect(page);
   const peer=page.locator('[data-cq-partner-confirm]');
   assert.equal(await peer.count(),1);
   await peer.check();
   assert.equal(await peer.isChecked(),true);
   await page.locator('#f1Solo').click();
   assert.equal(await page.locator('[data-cq-partner-confirm]').count(),0);
   await page.locator('#f1Pair').click();
   await inspect(page);
   assert.equal(await page.locator('[data-cq-partner-confirm]').isChecked(),false);
   assert.deepEqual(errors,[]);
   assert.deepEqual(remote,[]);
  }finally{await page.close();}
 }finally{await browser.close();}
});
test('Stage B: late spoken self-report prompts world reset; metro records do not leak to city',{timeout:90000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const {page,errors,remote}=await open(browser,'en','B2');
  try{
   await page.locator('#f1Stations button').nth(4).click();
   const city=await inspect(page);
   await city.inputs.first().check();
   await page.locator('#metroPilotToggle').click();
   assert.equal(await page.locator('#cqModeConfirm').isVisible(),true);
   await page.locator('#cqModeApply').click();
   await page.waitForFunction(()=>document.getElementById('metroPilotToggle')?.getAttribute('aria-pressed')==='true');
   assert.equal(await page.locator('#metroPilotToggle').getAttribute('aria-pressed'),'true');
   const metro=await inspect(page);
   assert.match(await metro.progress.innerText(),/0\/3/);
   await metro.inputs.first().check();
   await page.locator('#cityOnlyToggle').click();
   assert.equal(await page.locator('#cqModeConfirm').isVisible(),true);
   await page.locator('#cqModeApply').click();
   await page.waitForFunction(()=>document.getElementById('cityOnlyToggle')?.getAttribute('aria-pressed')==='true');
   const cityAgain=await inspect(page);
   assert.match(await cityAgain.progress.innerText(),/0\/3/);
   assert.deepEqual(errors,[]);
   assert.deepEqual(remote,[]);
  }finally{await page.close();}
 }finally{await browser.close();}
});
test('Stage B: 320px and 200% text still allow keyboard-accessible reflection',{timeout:90000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const lang of ['de','fr']){
   const {page,errors}=await open(browser,lang,'C2',320,780);
   try{
    const {inputs}=await inspect(page);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.evaluate(()=>document.documentElement.style.fontSize='200%');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await inputs.first().focus();
    await page.keyboard.press('Space');
    assert.equal(await inputs.first().isChecked(),true);
    assert.deepEqual(errors,[]);
   }finally{await page.close();}
  }
 }finally{await browser.close();}
});
test('Stage B: negative city-route feedback and B2 wrong turn are localized in four languages',{timeout:240000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const expectedVia={en:'Market Square',es:'Plaza del Mercado',de:'Marktplatz',fr:'Place du Marché'};
 try{
  for(const lang of languages){
   const {page,errors,remote}=await open(browser,lang,'B2',1280,900);
   try{
    await page.locator('#f1Stations button').nth(1).click();
    const bypass=await page.evaluate(()=>{
     const G=window.CityQuestF2Engine,E=window.CityQuestEngine,F=window.CityQuestF1Engine;
     const cfg=G.config('B2'),same=(a,b)=>a.c===b.c&&a.r===b.r;
     const queue=[[E.start,[]]],seen=new Set();
     while(queue.length){
      const [at,steps]=queue.shift(),key=at.c+','+at.r;
      if(seen.has(key))continue;seen.add(key);
      if(same(at,cfg.target))return steps;
      for(const d of ['north','east','south','west']){
       const next=F.nextFromDirection(at,d);
       if(!E.isNode(next)||cfg.via.some(v=>same(v,next)))continue;
       queue.push([next,steps.concat(d)]);
      }
     }
     throw Error('No route around a mandatory via point');
    });
    assert.ok(bypass.length>=3);
    for(const d of bypass)await page.locator('.f2-quick-'+d).click();
    const via=await page.locator('#f1Panel .f2-status').innerText();
    assert.ok(via.includes(expectedVia[lang]),lang+' missing required waypoint: '+via);
    await page.locator('#f1Stations button').nth(3).click();
    const route=await page.evaluate(()=>window.CityQuestF2Engine.guidedPaths.B2);
    for(const d of route)await page.locator('.f2-quick-'+d).click();
    const wrong=await page.evaluate(lang=>{
     const source=document.querySelector('script').textContent;
     const m=source.match(/^\s*const advancedPractice=(\{.*\});$/m);
     const questions=JSON.parse(m[1])[lang].guided.B2;
     const G=window.CityQuestF2Engine;
     const ordered=G.orderChoices(questions.options.map(([value,label])=>({value,label})),lang,'B2',4,'explain');
     return ordered.findIndex(x=>x.value==='right');
    },lang);
    assert.ok(wrong>=0);
    await page.locator('#f1Panel .f2-choice-list button').nth(wrong).click();
    const expected=await page.evaluate(lang=>{
     const source=document.querySelector('script').textContent;
     const m=source.match(/^\s*const cqGuidedFeedback=(\{.*\});$/m);
     return JSON.parse(m[1])[lang].B2;
    },lang);
    assert.equal(await page.locator('#f1Panel .f2-status').innerText(),expected,lang+' incorrect turn feedback');
    assert.deepEqual(errors,[],lang);
    assert.deepEqual(remote,[],lang);
   }finally{await page.close();}
  }
 }finally{await browser.close();}
});
