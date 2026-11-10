#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const levels=[['A1','20','I Can Try Again'],['A2','20','A Small Change, a Better Result'],
 ['C1','20','The Hidden Cost of Constant Improvement'],['C2','25','When Resilience Becomes an Obligation']];
const makeUrl=(level,minutes)=>new URL('self-check/test-banks/reading/preview.html?level='+level+
 '&timer='+minutes+'&attempt=r34independentpilot',base).href;
async function resume(page){
 if(await page.locator('#sessionLock').isVisible()){
  for(const c of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+c).click();
  await page.locator('#sessionLock').waitFor({state:'hidden'});
 }
}
for(const [engineName,browserEngine] of [['chromium',chromium],['webkit',webkit]]){
 for(const [level,minutes,title]of levels){
  test('R34 '+engineName+' '+level+' independent test has valid start, full marks, reload and no leaked answers',async()=>{
   const browser=await browserEngine.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage(),errors=[],writes=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',dialog=>dialog.accept());
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
    const bank=JSON.parse(fs.readFileSync(path.join(__dirname,'../self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'),'utf8'));
    assert.equal((await page.goto(makeUrl(level,minutes))).status(),200);
    await page.locator('#sessionStart').waitFor({timeout:30000});
    assert.ok((await page.title()).includes('Reading '+level));
    assert.ok((await page.locator('#title').textContent()).includes(title));
    assert.equal(await page.locator('fieldset.question').count(),10);
    assert.equal(await page.locator('#results').isHidden(),true);
    assert.equal(await page.locator('#resultDetails').textContent(),'');
    await page.locator('#sessionStart').click();
    await page.locator('#workspace:not([hidden])').waitFor();
    assert.match(await page.locator('#timeRemaining').textContent(),/Time remaining/);
    for(let i=0;i<bank.questions.length;i++){
     const q=bank.questions[i];
     await page.locator('fieldset.question').nth(i).locator('input').nth(q.answer).check();
    }
    await page.reload();
    await page.locator('#workspace:not([hidden])').waitFor();
    await resume(page);
    assert.equal(await page.locator('fieldset.question input:checked').count(),10);
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'1');
    assert.equal(await page.locator('#resultDetails article.review').count(),0);
    await page.reload();
    await page.locator('#results:not([hidden])').waitFor();
    assert.equal(await page.locator('#submitButton').isDisabled(),true);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)<=2);
    assert.deepEqual(errors,[]);
    assert.deepEqual(writes,[]);
    await context.close();
   }finally{await browser.close()}
  });
 }
 test('R34 '+engineName+' rejects C2 20-minute URL rather than changing bank duration',async()=>{
  const browser=await browserEngine.launch({headless:true});
  try{
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(makeUrl('C2','20'));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/timer must match/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
