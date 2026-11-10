#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const bank=JSON.parse(fs.readFileSync(path.join(__dirname,
 '../self-check/test-banks/reading/rl-asteroids/en-B2.json'),'utf8'));
const base='http://127.0.0.1:8765/language-skills-hub/';
const url=(topic,lang,level,attempt='r35previewpilot')=>new URL(
 'self-check/test-banks/reading/universal-preview.html?topic='+topic+
 '&lang='+lang+'&level='+level+'&timer=20&attempt='+attempt,base).href;
async function unlock(page){
 if(await page.locator('#sessionLock').isVisible()){
  for(const c of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+c).click();
  await page.locator('#sessionLock').waitFor({state:'hidden'});
 }
}
for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 test('R35 '+name+' Asteroids B2 independent test restores and lists one wrong answer only',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const page=await context.newPage(),errors=[],writes=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>d.accept());
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
   assert.equal((await page.goto(url('rl-asteroids','en','B2'))).status(),200);
   await page.locator('#sessionStart').waitFor({timeout:30000});
   assert.match(await page.title(),/English|en B2|EN B2/);
   assert.ok((await page.locator('#title').textContent()).includes('Asteroids: A Question of Risk, Not Panic'));
   assert.match(await page.locator('#pilotWarning').textContent(),/Unapproved/);
   assert.equal(await page.locator('fieldset.question').count(),10);
   assert.equal(await page.locator('#results').isHidden(),true);
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   for(let i=0;i<bank.questions.length;i++){
    const q=bank.questions[i];
    await page.locator('fieldset.question').nth(i).locator('input').nth(i===0?(q.answer+1)%4:q.answer).check();
   }
   await page.reload();
   await page.locator('#workspace:not([hidden])').waitFor();
   await unlock(page);
   assert.equal(await page.locator('fieldset.question input:checked').count(),10);
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'1');
   assert.equal(await page.locator('#resultDetails article.review').count(),1);
   assert.match(await page.locator('#resultDetails article.review').first().textContent(),/PARAGRAPH 1/);
   assert.match(await page.locator('#resultDetails article.review').first().textContent(),/Correct answer/);
   await page.reload();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#resultDetails article.review').count(),1);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)<=2);
   assert.deepEqual(errors,[]);
   assert.deepEqual(writes,[]);
   await context.close();
  }finally{await browser.close()}
 });
 test('R35 '+name+' missing independent bank refuses to fall back to public practice tasks',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url('rl-email-friend','en','B2','r35missingbank'));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/Source HTTP 404/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.equal(await page.locator('#workspace').isHidden(),true);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test('R35 '+name+' forged bank level and altered source digest are rejected',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/rl-asteroids/en-B2.json',route=>route.fulfill({
    status:200,contentType:'application/json',body:JSON.stringify({...bank,level:'C1'})
   }));
   await page.goto(url('rl-asteroids','en','B2','r35wronglevel'));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/does not match the requested/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   await page.unrouteAll();
   await page.route('**/rl-asteroids/en-B2.json',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({...bank,sourcePracticeContentHash:'0'.repeat(64)})
   }));
   await page.goto(url('rl-asteroids','en','B2','r35wrongdigest'));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/hash mismatch/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
