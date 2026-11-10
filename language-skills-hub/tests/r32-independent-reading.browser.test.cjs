#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const bank=JSON.parse(fs.readFileSync(path.join(__dirname,
 '../self-check/test-banks/reading/rl-can-mistakes/en-B2.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../version.json'),'utf8'));
function url(id){return new URL('self-check/test-banks/reading/preview.html?timer=20&attempt='+id,base).href;}
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('R32 '+name+' draft 20m student preview restores, shows mistakes only, then erases local result',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844}});
   const page=await ctx.newPage(),errors=[],writes=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
   page.on('dialog',dialog=>dialog.accept());
   assert.equal((await page.goto(url('r32draftbrowserone'))).status(),200);
   await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:30000});
   assert.match(await page.locator('#pilotWarning').textContent(),/Unapproved/i);
   assert.equal(await page.locator('#readingParagraphs p').count(),4);
   assert.equal(await page.locator('#questionList fieldset.question').count(),10);
   assert.equal(await page.locator('#workspace').isHidden(),true);
   assert.equal(await page.locator('#results').isHidden(),true);
   assert.equal(await page.locator('#gradeProposal .grade-number').count(),0);
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   assert.match(await page.locator('#timeRemaining').textContent(),/Time remaining: 1[89]:|Time remaining: 20:/);
   await page.locator('fieldset.question').first().locator('input').first().check();
   await page.reload();
   await page.locator('#workspace:not([hidden])').waitFor({timeout:30000});
   assert.equal(await page.locator('fieldset.question').first().locator('input').first().isChecked(),true);
   assert.equal(await page.locator('#results').isHidden(),true);
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#resultDetails .review').count(),10);
   assert.match(await page.locator('#resultDetails .review').first().textContent(),/Correct answer/i);
   assert.match(await page.locator('#resultDetails .review').first().textContent(),/PARAGRAPH 1/);
   assert.equal(await page.locator('#submitButton').isDisabled(),true);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2);
   await page.reload();
   await page.locator('#results:not([hidden])').waitFor({timeout:30000});
   assert.equal(await page.locator('#resultDetails .review').count(),10);
   await page.locator('#sessionErase').click();
   assert.match(await page.locator('#timeRemaining').textContent(),/Local answers erased/);
   await page.reload();
   await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:30000});
   assert.equal(await page.locator('#results').isHidden(),true);
   assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
   await ctx.close();
  }finally{await browser.close()}
 });
 test('R32 '+name+' correct B2 answers produce grade proposal 1 and zero erroneous-answer cards',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:1280,height:860}}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.on('dialog',dialog=>dialog.accept());
   await page.goto(url('r32correctbrowser'));
   await page.locator('#sessionStart').waitFor({timeout:30000});
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   for(let i=0;i<bank.questions.length;i++)
    await page.locator('fieldset.question').nth(i).locator('input').nth(bank.questions[i].answer).check();
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'1');
   assert.equal(await page.locator('#resultDetails .review').count(),0);
   assert.match(await page.locator('#resultDetails').textContent(),/All ten answers are correct/);
   assert.equal(await page.locator('#submitButton').isDisabled(),true);
   assert.deepEqual(errors,[]);
   await ctx.close();
  }finally{await browser.close()}
 });
 test('R32 '+name+' changed original checksum is rejected before draft UI appears',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext(),page=await ctx.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/version.json',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({...manifest,contentHashes:{...manifest.contentHashes,'rl-can-mistakes':'0'.repeat(64)}})
   }));
   await page.goto(url('r32badchecksum'));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/checksum mismatch/);
   assert.equal(await page.locator('#workspace').isHidden(),true);
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.equal(await page.locator('#results').isHidden(),true);
   assert.deepEqual(errors,[]);
   await ctx.close();
  }finally{await browser.close()}
 });
 test('R32 '+name+' accidentally published draft bank fails closed',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext(),page=await ctx.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/rl-can-mistakes/en-B2.json',route=>route.fulfill({
    status:200,contentType:'application/json',body:JSON.stringify({...bank,published:true})
   }));
   await page.goto(url('r32publishedaccident'));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/without teacher approval/i);
   assert.equal(await page.locator('#workspace').isHidden(),true);
   assert.equal(await page.locator('#results').isHidden(),true);
   assert.deepEqual(errors,[]);
   await ctx.close();
  }finally{await browser.close()}
 });
}
