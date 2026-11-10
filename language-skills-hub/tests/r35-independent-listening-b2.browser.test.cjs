#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const url=new URL('self-check/test-banks/listening/preview.html?timer=18&attempt=r35pilotteacher',base).href;
async function unlocked(page){
 if(await page.locator('#sessionLock').isVisible()){
  for(const i of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+i).click();
  await page.locator('#sessionLock').waitFor({state:'hidden'});
 }
}
for(const [browserName,engine]of [['chromium',chromium],['webkit',webkit]]){
 test('R35 '+browserName+' independent teacher-controlled Listening B2 6+2 grading survives reload',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   const page=await ctx.newPage(),errors=[],writes=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>d.accept());
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
   const r=await page.goto(url);
   assert.equal(r.status(),200);
   await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:30000});
   assert.match(await page.locator('.mode').textContent(),/R35 DRAFT/);
   assert.equal(await page.locator('audio,video').count(),0);
   assert.equal(await page.locator('#workspace').isHidden(),true);
   assert.equal(await page.locator('fieldset.question').count(),6);
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   await page.locator('fieldset.question').first().locator('input').nth(1).check();
   await page.locator('.written-response').first().fill('Private user answer@example.invalid');
   await page.reload();
   await page.locator('#workspace:not([hidden])').waitFor({timeout:30000});
   await unlocked(page);
   assert.equal(await page.locator('fieldset.question').first().locator('input').nth(1).isChecked(),true);
   assert.equal(await page.locator('.written-response').first().inputValue(),'Private user answer@example.invalid');
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#teacherReview').isHidden(),false);
   assert.equal(await page.locator('#teacherTasks select').count(),2);
   assert.equal(await page.locator('#gradeProposal .grade-number').count(),0);
   assert.equal(await page.locator('#exportResult').isDisabled(),true);
   await page.locator('#teacherTasks select').nth(0).selectOption('1');
   await page.reload();
   await page.locator('#results:not([hidden])').waitFor({timeout:30000});
   assert.equal(await page.locator('#teacherTasks select').nth(0).inputValue(),'1');
   assert.equal(await page.locator('#exportResult').isDisabled(),true);
   await page.locator('#teacherTasks select').nth(1).selectOption('0');
   assert.match((await page.locator('#gradeProposal .grade-number').textContent()).trim(),/^[1-5]$/);
   assert.equal(await page.locator('#exportResult').isDisabled(),false);
   const when=page.waitForEvent('download',{timeout:20000});
   await page.locator('#exportResult').click();
   const down=await when;
   assert.match(down.suggestedFilename(),/lsh-listening-ll-harrison-ford-b2-unverified\.csv/);
   const csv=fs.readFileSync(await down.path(),'utf8');
   assert.match(csv,/LOCAL_UNVERIFIED_NOT_SCHOOL_RECORD/);
   assert.doesNotMatch(csv,/Private user|answer@example\.invalid/);
   await page.reload();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#teacherTasks select').nth(0).inputValue(),'1');
   assert.equal(await page.locator('#teacherTasks select').nth(1).inputValue(),'0');
   await page.locator('#sessionErase').click();
   await page.reload();
   await page.locator('#sessionIntro:not([hidden])').waitFor();
   assert.equal(await page.locator('#results').isHidden(),true);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2);
   assert.deepEqual(errors,[]);
   assert.deepEqual(writes,[]);
   await ctx.close();
  }finally{await browser.close()}
 });
 test('R35 '+browserName+' source tampering and unapproved bank state fail closed',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext(),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/version.json',route=>route.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({version:'R31',backendEnabled:false,contentHashes:{'ll-harrison-ford':'0'.repeat(64)}})}));
   await page.goto(url);
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/checksum mismatch/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   await page.unrouteAll();
   await page.route('**/ll-harrison-ford/en-B2.json',route=>route.fulfill({
    status:200,contentType:'application/json',body:JSON.stringify({
     kind:'LSH_INDEPENDENT_LISTENING_TEST_DRAFT_R35_V1',published:true,status:'APPROVED',
     topic:'ll-harrison-ford',language:'en',level:'B2'
    })
   }));
   await page.goto(url);
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/remain unapproved/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.deepEqual(errors,[]);
   await ctx.close();
  }finally{await browser.close()}
 });
}
