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
   assert.match(page.url(),/#lsh_session=[a-f0-9]{24}$/);
   const other=await context.newPage();
   await other.goto(url.href);
   // R64: one attempt per device – the same QR opened again returns to the SAME attempt, locked.
   await other.locator('#sessionLock:not([hidden])').waitFor();
   assert.equal(other.url(),page.url(),'Reopening the class QR must not create a second attempt on this device');
   assert.equal(await other.locator('#sessionStart').isVisible(),false);
   await other.close();
   await page.reload();
   await page.locator('#sessionLock:not([hidden])').waitFor();
   for(const c of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+c).click();
   await page.locator('#sessionLock').waitFor({state:'hidden'});
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
   await page.locator('#sessionErase').click();
   assert.equal(await page.locator('#results').isHidden(),true);
   assert.match(await page.locator('#timeRemaining').textContent(),/Local answers erased/);
   await page.reload();
   // R64: an erased submitted attempt stays consumed; no second attempt on this device.
   await page.locator('#sessionBlocked').waitFor();
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.equal(await page.locator('#workspace').isHidden(),true);
   assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
   await context.close();
  }finally{await browser.close()}
 });
 test('R30 '+engineName+' Listening teacher link includes timer and factual cloze survives reload',async()=>{
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
   await page.locator('#cloze-0').fill('fifteen');
   await page.reload();
   await page.locator('#sessionLock:not([hidden])').waitFor();
   for(const c of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+c).click();
   await page.locator('#sessionLock').waitFor({state:'hidden'});
   await page.locator('#workspace:not([hidden])').waitFor();
   assert.equal(await page.locator('fieldset.question').first().locator('input').first().isChecked(),true);
   assert.equal(await page.locator('#cloze-0').inputValue(),'fifteen');
   if(await page.locator('#sessionLock').isVisible()){
    for(const c of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+c).click();
    await page.locator('#sessionLock').waitFor({state:'hidden'});
   }
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.match((await page.locator('#gradeProposal .grade-number').textContent()).trim(),/^[1-5]$/);
   assert.equal(await page.locator('#manualGrade').count(),0);
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
 test('R30 '+engineName+' expired Reading timer auto-submits without opening any confirm dialog',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const page=await context.newPage(),errors=[];
   await page.clock.install();
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>{errors.push('Unexpected dialog: '+d.message());d.accept()});
   const url=new URL('self-check/reading/index.html?topic=rl-asteroids&lang=en&level=B1&timer=5&attempt=class-expired',base);
   assert.equal((await page.goto(url.href)).status(),200);
   await page.locator('#sessionIntro:not([hidden])').waitFor();
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   await page.locator('fieldset.question').first().locator('input').first().check();
   // Playwright's clock must be installed before page scripts: the attempt
   // engine captures Date.now when initialized. Jumping ahead fires the due
   // timer once and models a suspended device returning after the deadline.
   await page.clock.fastForward(6*60*1000);
   await page.locator('#results:not([hidden])').waitFor({timeout:9000});
   assert.equal(await page.locator('#sessionLock').isHidden(),true);
   await page.reload();
   await page.locator('#results:not([hidden])').waitFor({timeout:12000});
   assert.equal(await page.locator('#submitButton').isDisabled(),true);
   assert.equal(await page.locator('#sessionIntro').isHidden(),true);
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
}
