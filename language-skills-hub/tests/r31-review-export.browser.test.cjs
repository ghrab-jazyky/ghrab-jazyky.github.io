#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 test('R31 '+name+' fully automatic Listening result survives reload; detailed CSV is anonymous',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   const page=await context.newPage(),errors=[],uploads=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))uploads.push(r.method()+' '+r.url())});
   page.on('dialog',d=>d.accept());
   const student=new URL('self-check/listening/student.html?topic=ll-harrison-ford&level=B2&timer=30&attempt=r31teacherpilot',base);
   assert.equal((await page.goto(student.href)).status(),200);
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   await page.locator('fieldset.question').first().locator('input').first().check();
   await page.locator('#match-0').selectOption('1');
   await page.reload();
   await page.locator('#workspace:not([hidden])').waitFor();
   assert.equal(await page.locator('#match-0').inputValue(),'1');
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#manualGrade').count(),0);
   const before=(await page.locator('#gradeProposal .grade-number').textContent()).trim();
   assert.match(before,/^[1-5]$/);
   assert.equal(await page.locator('#exportResult').isEnabled(),true);
   await page.reload();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),before);
   const downloadEvent=page.waitForEvent('download',{timeout:15000});
   await page.locator('#exportResult').click();
   const download=await downloadEvent;
   assert.match(download.suggestedFilename(),/^lsh-listening-ll-harrison-ford-en-b2-.*\.csv$/);
   const csv=fs.readFileSync(await download.path(),'utf8');
   assert.match(csv,/LOCAL_UNVERIFIED_NOT_SCHOOL_RECORD/);
   assert.match(csv,/ll-harrison-ford/);
   assert.match(csv,/question_id/);
   assert.doesNotMatch(csv,/anonymous_code|studentName|studentEmail|school\.invalid/);
   assert.ok(csv.split('\r\n').length>10);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2);
   assert.deepEqual(errors,[]);
   assert.deepEqual(uploads,[]);
   await context.close();
  }finally{await browser.close()}
 });
 test('R31 '+name+' Reading downloads grade receipt without student responses in EN/ES',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   const page=await context.newPage(),errors=[],uploads=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))uploads.push(r.method()+' '+r.url())});
   page.on('dialog',d=>d.accept());
   const student=new URL('self-check/reading/index.html?topic=rl-asteroids&lang=es&level=B1&timer=20&attempt=r31readingpilot',base);
   assert.equal((await page.goto(student.href)).status(),200);
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   await page.locator('fieldset.question').first().locator('input').first().check();
   const reflection=page.locator('#reflection');
   if(await reflection.isVisible())await reflection.fill('Private student reflection 123@example.invalid');
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#exportResult').isVisible(),true);
   assert.match(await page.locator('#exportResult').textContent(),/CSV/);
   const pending=page.waitForEvent('download',{timeout:15000});
   await page.locator('#exportResult').click();
   const download=await pending;
   assert.match(download.suggestedFilename(),/^lsh-reading-rl-asteroids-es-b1-.*\.csv$/);
   const csv=fs.readFileSync(await download.path(),'utf8');
   assert.match(csv,/LOCAL_UNVERIFIED_NOT_SCHOOL_RECORD/);
   assert.match(csv,/rl-asteroids/);
   assert.doesNotMatch(csv,/Private student reflection|example\.invalid|Correct answer|studentName/);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2);
   assert.deepEqual(errors,[]);
   assert.deepEqual(uploads,[]);
   await context.close();
  }finally{await browser.close()}
 });
}
