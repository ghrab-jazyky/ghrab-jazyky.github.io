#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
const levels=['A1','A2','C1','C2'];
const base='http://127.0.0.1:8765/language-skills-hub/';
const bank=Object.fromEntries(levels.map(level=>[level,JSON.parse(fs.readFileSync(
 path.join(root,'self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'),'utf8'))]));
const url=(level,attempt)=>new URL('self-check/test-banks/reading/preview.html?level='+level+
 '&timer=20&attempt='+attempt,base).href;
async function unlock(page){
 if(await page.locator('#sessionLock').isVisible()){
  for(const corner of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+corner).click();
  await page.locator('#sessionLock').waitFor({state:'hidden'});
 }
}
for(const [browserName,engine]of [['chromium',chromium],['webkit',webkit]]){
 for(const level of levels){
  test('R34 '+browserName+' EN/'+level+' independent 10-question exam restores and shows only one incorrect answer',async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage(),errors=[],writes=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',d=>d.accept());
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method()+' '+r.url())});
    const response=await page.goto(url(level,'r34reference'+level.toLowerCase()));
    assert.equal(response.status(),200);
    await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:30000});
    assert.match(await page.title(),new RegExp('Reading '+level));
    assert.match(await page.locator('.mode').textContent(),new RegExp('EN/'+level));
    assert.equal(await page.locator('#workspace').isHidden(),true);
    assert.equal(await page.locator('#resultDetails .review').count(),0);
    assert.equal(await page.locator('fieldset.question').count(),10);
    await page.locator('#sessionStart').click();
    await page.locator('#workspace:not([hidden])').waitFor();
    for(let i=0;i<10;i++){
     const q=bank[level].questions[i],picked=i===1?(q.answer+1)%4:q.answer;
     await page.locator('fieldset.question').nth(i).locator('input').nth(picked).check();
    }
    await page.reload();
    await page.locator('#workspace:not([hidden])').waitFor();
    await unlock(page);
    assert.equal(await page.locator('fieldset.question').nth(1).locator('input').nth(
     (bank[level].questions[1].answer+1)%4).isChecked(),true);
    assert.equal(await page.locator('#resultDetails .review').count(),0);
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'1');
    assert.equal(await page.locator('#resultDetails .review').count(),1);
    assert.match(await page.locator('#resultDetails .review').textContent(),/Correct answer/);
    await page.reload();
    await page.locator('#results:not([hidden])').waitFor();
    assert.equal(await page.locator('#resultDetails .review').count(),1);
    assert.equal(await page.locator('#submitButton').isDisabled(),true);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)<=2);
    assert.deepEqual(errors,[]);
    assert.deepEqual(writes,[]);
    await context.close();
   }finally{await browser.close()}
  });
 }
 test('R34 '+browserName+' EN/A1 and EN/C2 never restore each other on the same class link',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const page=await context.newPage();
   await page.goto(url('A1','r34sametopicclass'));
   await page.locator('#sessionStart').waitFor({timeout:30000});
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   await page.locator('fieldset.question').first().locator('input').first().check();
   const different=await context.newPage();
   await different.goto(url('C2','r34sametopicclass'));
   await different.locator('#sessionStart').waitFor({timeout:30000});
   assert.equal(await different.locator('#workspace').isHidden(),true);
   await different.locator('#sessionStart').click();
   await different.locator('#workspace:not([hidden])').waitFor();
   assert.equal(await different.locator('fieldset.question').first().locator('input:checked').count(),0);
   const keys=await different.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('lsh:local-attempt:r30:reading')));
   assert.ok(keys.some(k=>k.includes(':A1:')));
   assert.ok(keys.some(k=>k.includes(':C2:')));
   await context.close();
  }finally{await browser.close()}
 });
}
