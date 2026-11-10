#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const url=(topic,level,timer,attempt)=>
 new URL('self-check/test-banks/reading/universal.html?topic='+topic+
 '&lang=en&level='+level+'&timer='+timer+'&attempt='+attempt,base).href;
for(const [engineName,engine]of [['chromium',chromium],['webkit',webkit]]){
 test('R34 '+engineName+' universal student preview renders the genuine A1 source and scores wrong answers only',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844}});
   const page=await ctx.newPage(),errors=[],uploads=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>d.accept());
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))uploads.push(r.url())});
   assert.equal((await page.goto(url('rl-can-mistakes','A1',20,'r34universaltest'))).status(),200);
   await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:30000});
   assert.match(await page.title(),/I Can Try Again/);
   assert.match(await page.locator('.mode').textContent(),/EN\/A1/);
   assert.equal(await page.locator('#readingParagraphs p').count(),3);
   assert.equal(await page.locator('fieldset.question').count(),10);
   assert.equal(await page.locator('#results').isHidden(),true);
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   await page.locator('fieldset.question').first().locator('input').first().check();
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#resultDetails .review').count(),10);
   await page.reload();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#resultDetails .review').count(),10);
   assert.deepEqual(errors,[]);
   assert.deepEqual(uploads,[]);
   await ctx.close();
  }finally{await browser.close()}
 });
 test('R34 '+engineName+' absent bank and wrong-level bank are rejected, never silently use practice',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext(),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   assert.equal((await page.goto(url('rl-asteroids','B2',20,'r34missingbank'))).status(),200);
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/Source HTTP 404/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.equal(await page.locator('#workspace').isHidden(),true);
   await page.route('**/rl-can-mistakes/en-A1.json',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({kind:'LSH_INDEPENDENT_READING_TEST_DRAFT_R32_V1',
     status:'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL',published:false,
     topic:'rl-asteroids',language:'en',level:'A1'})
   }));
   await page.goto(url('rl-can-mistakes','A1',20,'r34wrongtopic'));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/does not match requested topic/i);
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
}
