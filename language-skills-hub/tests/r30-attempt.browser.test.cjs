#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('R30 '+engineName+' Reading timed attempt restores answers, pauses and resumes, then persists submitted result',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const page=await context.newPage(),errors=[],writes=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
   page.on('dialog',d=>d.accept());
   const url=new URL('self-check/reading/index.html?topic=rl-asteroids&lang=en&level=B1&timer=5&attempt=classabc1234',base);
   assert.equal((await page.goto(url.href)).status(),200);
   await page.waitForSelector('#sessionIntro:not([hidden])');
   assert.equal(await page.locator('#workspace').isHidden(),true);
   assert.equal(await page.locator('#results').isHidden(),true);
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   assert.match(await page.locator('#timeRemaining').textContent(),/Time remaining: 0[45]:/);
   await page.locator('fieldset.question').first().locator('input').first().check();
   await page.reload();
   await page.locator('#workspace:not([hidden])').waitFor();
   assert.equal(await page.locator('fieldset.question').first().locator('input').first().isChecked(),true);
   assert.equal(await page.locator('#sessionIntro').isHidden(),true);
   await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,value:true});
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document,'hidden',{configurable:true,value:false});
   });
   await page.locator('#sessionLock:not([hidden])').waitFor();
   assert.equal(await page.locator('#workspace').getAttribute('inert'),'');
   for(const c of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+c).click();
   await page.locator('#sessionLock').waitFor({state:'hidden'});
   assert.equal(await page.locator('#workspace').getAttribute('inert'),null);
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.match((await page.locator('#gradeProposal .grade-number').textContent()).trim(),/^[1-5]$/);
   await page.reload();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#submitButton').isDisabled(),true);
   assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
   await context.close();
  }finally{await browser.close()}
 });
 test('R30 '+engineName+' Listening teacher link includes timer and written response survives reload',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>d.accept());
   const url=new URL('self-check/listening/teacher.html?topic=ll-harrison-ford&level=B1',base);
   assert.equal((await page.goto(url.href)).status(),200);
   await page.locator('#qrMount svg').waitFor();
   await page.locator('#timerMinutes').fill('5');
   const student=await page.locator('#studentUrl').inputValue();
   assert.match(student,/timer=5/);
   assert.match(student,/attempt=class/);
   await page.goto(student);
   await page.locator('#sessionIntro:not([hidden])').waitFor();
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   await page.locator('fieldset.question').first().locator('input').first().check();
   await page.locator('.written-response').first().fill('This is my own answer.');
   await page.reload();
   await page.locator('#workspace:not([hidden])').waitFor();
   assert.equal(await page.locator('fieldset.question').first().locator('input').first().isChecked(),true);
   assert.equal(await page.locator('.written-response').first().inputValue(),'This is my own answer.');
   if(await page.locator('#sessionLock').isVisible()){
    for(const c of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+c).click();
    await page.locator('#sessionLock').waitFor({state:'hidden'});
   }
   await page.locator('#submitButton').click();
   await page.locator('#manualGrade:not([hidden])').waitFor();
   assert.equal(await page.locator('#gradeProposal .grade-number').count(),0);
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
 test('R30 '+engineName+' expired Reading timer auto-submits without opening any confirm dialog',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>{errors.push('Unexpected dialog: '+d.message());d.accept()});
   const url=new URL('self-check/reading/index.html?topic=rl-asteroids&lang=en&level=B1&timer=5&attempt=class-expired',base);
   assert.equal((await page.goto(url.href)).status(),200);
   await page.locator('#sessionIntro:not([hidden])').waitFor();
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   await page.locator('fieldset.question').first().locator('input').first().check();
   await page.evaluate(()=>{
    const key=Object.keys(localStorage).find(k=>k.includes('lsh:local-attempt:r30:reading:'));
    if(!key)throw new Error('No local attempt saved');
    const saved=JSON.parse(localStorage.getItem(key));
    saved.startedAt=Date.now()-6*60000;
    saved.deadlineAt=saved.startedAt+5*60000;
    localStorage.setItem(key,JSON.stringify(saved));
   });
   await page.reload();
   try{
    await page.locator('#results:not([hidden])').waitFor({timeout:7500});
   }catch(e){
    const debug=await page.evaluate(()=>({
     load:document.getElementById('loading')?.textContent,
     loadVisible:!document.getElementById('loading')?.hidden,
     resultVisible:!document.getElementById('results')?.hidden,
     lockVisible:!document.getElementById('sessionLock')?.hidden,
     introVisible:!document.getElementById('sessionIntro')?.hidden,
     workspaceVisible:!document.getElementById('workspace')?.hidden,
     grade:document.getElementById('gradeProposal')?.textContent?.slice(0,80),
     saved:Object.keys(localStorage).filter(k=>k.includes('lsh:local-attempt:r30')).map(k=>{
      let v;try{v=JSON.parse(localStorage.getItem(k));}catch(_){return {k,invalid:true}}
      return {k,phase:v.phase,startedAt:v.startedAt,deadlineAt:v.deadlineAt,submittedAt:v.submittedAt,
       diff:v.deadlineAt-Date.now(),keys:Object.keys(v.answers||{})}
     })
    }));
    throw new Error('R30 expiration diagnostic: '+JSON.stringify(debug)+'; '+String(e));
   }
   assert.equal(await page.locator('#submitButton').isDisabled(),true);
   assert.equal(await page.locator('#sessionIntro').isHidden(),true);
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
}
