#!/usr/bin/env node
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const URL='http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html';
async function launch(viewport={width:1280,height:900}){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport});
 const errors=[],external=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/')&&!r.url().startsWith('data:'))external.push(r.url());});
 return {browser,page,errors,external};
}
async function go(page,lang='en',level='B1'){
 await page.goto(URL+'?lang='+lang+'&level='+level,{waitUntil:'load'});
 await page.locator('#f1Stations button').first().waitFor();
}
test('City/Metro picker is unavailable at A1/A2 and usable at B1-C2 in all four languages',async()=>{
 const {browser,page,errors,external}=await launch();
 try{
  for(const lang of ['en','es','de','fr']){
   for(const level of ['A1','A2']){
    await go(page,lang,level);
    assert.equal(await page.locator('#cqModePicker').isVisible(),false,lang+level);
    assert.equal(await page.locator('#metroPilotToggle').isVisible(),false,lang+level);
   }
   for(const level of ['B1','C2']){
    await go(page,lang,level);
    assert.equal(await page.locator('#cqModePicker').isVisible(),true,lang+level);
    assert.equal(await page.locator('#cityOnlyToggle').getAttribute('aria-pressed'),'true');
    await page.locator('#metroPilotToggle').click();
    assert.equal(await page.locator('#metroPilotToggle').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#f1Stations button').count(),8);
    await page.locator('#cityOnlyToggle').click();
    assert.equal(await page.locator('#metroPilotToggle').getAttribute('aria-pressed'),'false');
   }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 }finally{await browser.close();}
});
test('Changing modes after City 05 completion warns and preserves or resets progress correctly',async()=>{
 const {browser,page,errors}=await launch();
 try{
  await go(page);
  await page.locator('#f1Stations button').nth(4).click();
  const solution=await page.evaluate(()=>{
   const g=window.CityQuestF2Engine,l='B1';
   return g.servicesForLevel(l).find(s=>g.checkTransport({line:s.line,depart:s.depart,stop:s.to},l).correct);
  });
  assert.ok(solution);
  const selects=page.locator('#f1Panel .f2-select-group select');
  await selects.nth(0).selectOption(solution.line);
  await selects.nth(1).selectOption(solution.depart);
  await selects.nth(2).selectOption(solution.to);
  await page.locator('#f1Panel .f2-actions button.primary').click();
  assert.match(await page.locator('#f1ProgressText').innerText(),/1\s*\/\s*8/);
  await page.locator('#metroPilotToggle').click();
  assert.equal(await page.locator('#cqModeConfirm').evaluate(e=>e.open),true);
  await page.locator('#cqModeCancel').click();
  assert.equal(await page.locator('#metroPilotToggle').getAttribute('aria-pressed'),'false');
  assert.match(await page.locator('#f1ProgressText').innerText(),/1\s*\/\s*8/);
  await page.locator('#metroPilotToggle').click();
  await page.locator('#cqModeApply').click();
  assert.equal(await page.locator('#metroPilotToggle').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('#f1ProgressText').innerText(),/0\s*\/\s*8/);
  assert.match(await page.locator('#f1Panel .f2-card-head h2').innerText(),/Find the Right Line/);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test('Teacher guide is collapsed but follows city/metro mission and gives concrete Czech method notes',async()=>{
 const {browser,page,errors}=await launch();
 try{
  await go(page,'de','B2');
  assert.equal(await page.locator('#cqTeacherGuide').evaluate(e=>e.open),false);
  assert.match(await page.locator('#cqTeacherMeta').innerText(),/MĚSTO.*B2.*12–19/);
  await page.locator('#cqTeacherGuide summary').click();
  assert.equal(await page.locator('#cqTeacherGuide').evaluate(e=>e.open),true);
  assert.ok((await page.locator('#cqTeacherGoal').innerText()).length>20);
  for(const id of ['cqTeacherVocab','cqTeacherSpeak','cqTeacherWeak','cqTeacherStrong'])
   assert.ok((await page.locator('#'+id).innerText()).length>15,id);
  await page.locator('#f1Stations button').nth(4).click();
  assert.match(await page.locator('#cqTeacherGoal').innerText(),/jízdní řád/);
  await page.locator('#metroPilotToggle').click();
  assert.match(await page.locator('#cqTeacherMeta').innerText(),/METRO/);
  assert.match(await page.locator('#cqTeacherGoal').innerText(),/linku/);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test('Localized actionable feedback replaces generic wrong-choice messages',async()=>{
 const {browser,page,errors}=await launch();
 try{
  await go(page,'es','B1');
  const wrongIndex=await page.evaluate(()=>{
   const g=window.CityQuestF2Engine,f=g.F,q=f.explore[0];
   const ordered=g.orderChoices(g.exploreChoices(q,'B1',0),'es','B1',1,0);
   return ordered.findIndex(id=>id!==q.correct);
  });
  assert.ok(wrongIndex>=0);
  await page.locator('#f1Panel .f2-choice-list button').nth(wrongIndex).click();
  assert.match(await page.locator('#f1Panel .f2-status').innerText(),/no corresponde a la pista/);
  await page.locator('#f1Stations button').nth(2).click();
  const wrong=await page.evaluate(()=>{
    const p=window.CityQuestF2Content.profile('es','B1');
    return window.CityQuestF2Engine.dialogueDistractors(p.dialogueAnswer,'es').wrong;
  });
  await page.locator('#f1Panel .f2-choice-list button').filter({hasText:wrong}).first().click();
  assert.match(await page.locator('#f1Panel .f2-status').innerText(),/alejaría al turista del museo/);
  await go(page,'en','B1');
  await page.locator('#f1Stations button').nth(1).click();
  await page.locator('.f2-quick-west').click();
  assert.match(await page.locator('#f1Panel .f2-status').innerText(),/leaves the city map/);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test('Mobile mission selection reveals the task or map without page horizontal overflow',async()=>{
 const {browser,page,errors}=await launch({width:390,height:844});
 try{
  for(const width of [320,390,430]){
   await page.setViewportSize({width,height:844});
   await go(page,'de','B2');
   await page.locator('#f1Stations button').first().click();
   await page.waitForTimeout(80);
   let box=await page.locator('#f1Panel').boundingBox();
   assert.ok(box&&box.y<844&&box.y>-120,'Task not on screen at '+width+': '+JSON.stringify(box));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,'Overflow '+width);
   await page.locator('#f1Stations button').nth(1).click();
   await page.waitForTimeout(80);
   box=await page.locator('.layout .map-card').boundingBox();
   assert.ok(box&&box.y<844&&box.y>-120,'Map not on screen at '+width+': '+JSON.stringify(box));
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
