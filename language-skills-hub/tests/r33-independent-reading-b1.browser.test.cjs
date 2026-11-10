#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const bankB1=JSON.parse(fs.readFileSync(path.join(__dirname,
 '../self-check/test-banks/reading/rl-can-mistakes/en-B1.json'),'utf8'));
const bankB2=JSON.parse(fs.readFileSync(path.join(__dirname,
 '../self-check/test-banks/reading/rl-can-mistakes/en-B2.json'),'utf8'));
const base='http://127.0.0.1:8765/language-skills-hub/';
const url=(level,attempt)=>new URL(
 'self-check/test-banks/reading/preview.html?level='+level+'&timer=20&attempt='+attempt,base).href;
async function start(page){
 await page.locator('#sessionStart').waitFor({timeout:30000});
 await page.locator('#sessionStart').click();
 await page.locator('#workspace:not([hidden])').waitFor();
}
async function unlockIfNeeded(page){
 if(await page.locator('#sessionLock').isVisible()){
  for(const corner of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+corner).click();
  await page.locator('#sessionLock').waitFor({state:'hidden'});
 }
}
for(const [engineName,engine]of [['chromium',chromium],['webkit',webkit]]){
 test('R33 '+engineName+' B1 9/10 with one wrong shows exactly that correction and survives reload',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const page=await context.newPage(),errors=[],writes=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>d.accept());
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
   assert.equal((await page.goto(url('B1','r33b1scenarioone'))).status(),200);
   await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:30000});
   assert.match(await page.locator('.mode').textContent(),/B1/);
   assert.match(await page.title(),/Reading B1/);
   assert.match(await page.locator('#title').textContent(),/The Problem with Being Good at Everything/);
   assert.equal(await page.locator('#readingParagraphs p').count(),4);
   assert.equal(await page.locator('fieldset.question').count(),10);
   assert.equal(await page.locator('#results').isHidden(),true);
   await start(page);
   for(let i=0;i<bankB1.questions.length;i++){
    const q=bankB1.questions[i],answer=i===0?(q.answer+1)%4:q.answer;
    await page.locator('fieldset.question').nth(i).locator('input').nth(answer).check();
   }
   assert.equal(await page.locator('#results').isHidden(),true);
   await page.reload();
   await page.locator('#workspace:not([hidden])').waitFor({timeout:30000});
   await unlockIfNeeded(page);
   assert.equal(await page.locator('fieldset.question').first().locator('input').nth((bankB1.questions[0].answer+1)%4).isChecked(),true);
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#resultDetails article.review').count(),1);
   assert.match(await page.locator('#resultDetails article.review').first().textContent(),/Correct answer/);
   assert.match(await page.locator('#resultDetails article.review').first().textContent(),/PARAGRAPH 1/);
   assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'1');
   await page.reload();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#resultDetails article.review').count(),1);
   await page.locator('#sessionErase').click();
   assert.match(await page.locator('#timeRemaining').textContent(),/Local answers erased/);
   await page.reload();
   await page.locator('#sessionIntro:not([hidden])').waitFor();
   assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
   await context.close();
  }finally{await browser.close()}
 });
 test('R33 '+engineName+' B1 all correct produces a full-score grade with no review cards',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
   await page.goto(url('B1','r33allcorrectcase'));
   await start(page);
   for(let i=0;i<bankB1.questions.length;i++)
    await page.locator('fieldset.question').nth(i).locator('input').nth(bankB1.questions[i].answer).check();
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'1');
   assert.equal(await page.locator('#resultDetails article.review').count(),0);
   assert.match(await page.locator('#resultDetails').textContent(),/All ten answers are correct/);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test('R33 '+engineName+' level changes never restore answers from a different bank',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const b1=await context.newPage(),errors=[];
   b1.on('pageerror',e=>errors.push(e.message));
   await b1.goto(url('B1','r33sameclasslink'));
   await start(b1);
   await b1.locator('fieldset.question').first().locator('input').first().check();
   const b2=await context.newPage();
   b2.on('pageerror',e=>errors.push(e.message));
   await b2.goto(url('B2','r33sameclasslink'));
   await b2.locator('#sessionIntro:not([hidden])').waitFor();
   assert.equal(await b2.locator('#workspace').isHidden(),true);
   assert.match(await b2.locator('#title').textContent(),/When Feedback Feels Like Failure/);
   await start(b2);
   assert.equal(await b2.locator('fieldset.question').first().locator('input:checked').count(),0);
   const keys=await b2.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('lsh:local-attempt:r30:reading:')));
   assert.ok(keys.some(k=>k.includes(':B1:')), 'B1 record must exist');
   assert.ok(keys.some(k=>k.includes(':B2:')), 'B2 record must be isolated');
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
 test('R33 '+engineName+' mixed-level bank and unsupported B3 are rejected before test begins',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext(),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/rl-can-mistakes/en-B1.json',route=>route.fulfill({
    status:200,contentType:'application/json',body:JSON.stringify(bankB2)
   }));
   await page.goto(url('B1','r33wrongbankcase'));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/does not match this bank level/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   await page.unrouteAll();
   await page.goto(url('B3','r33unsupportedcase'));
   await page.locator('#loading.error').waitFor();
   assert.match(await page.locator('#loading').textContent(),/Unsupported independent test level/);
   assert.equal(await page.locator('#workspace').isHidden(),true);
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
}
