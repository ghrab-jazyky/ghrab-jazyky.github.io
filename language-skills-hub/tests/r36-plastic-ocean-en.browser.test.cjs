#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const durations={A1:15,A2:15,B1:20,B2:20,C1:25,C2:25};
const levels=Object.keys(durations);
const banks=Object.fromEntries(levels.map(level=>[level,
 JSON.parse(fs.readFileSync(path.resolve(__dirname,
 '../self-check/test-banks/reading/rl-plastic-ocean/en-'+level+'.json'),'utf8'))]));
const url=(level,id)=>new URL('self-check/test-banks/reading/preview.html?topic=rl-plastic-ocean&lang=en&level='+
 level+'&timer='+durations[level]+'&attempt='+id,base).href;
async function unlock(page){
 if(await page.locator('#sessionLock').isVisible()){
  for(const corner of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+corner).click();
  await page.locator('#sessionLock').waitFor({state:'hidden'});
 }
}
for(const [engineName,engine]of [['chromium',chromium],['webkit',webkit]]){
 test('R36 '+engineName+' Plastic Ocean six EN levels show authentic passage and no answers before submission',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844}});
   const page=await ctx.newPage(),errors=[],writes=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>d.accept());
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
   for(const level of levels){
    const bank=banks[level];
    assert.equal((await page.goto(url(level,'r36six'+level.toLowerCase()))).status(),200);
    await page.locator('#sessionStart').waitFor({timeout:30000});
    assert.equal((await page.locator('#title').textContent()).trim(),bank.sourceTitle);
    assert.match(await page.locator('.subtitle').textContent(),new RegExp(durations[level]+' minutes'));
    assert.equal(await page.locator('#readingParagraphs p').count(),level==='C1'||level==='C2'?7:6);
    assert.equal(await page.locator('fieldset.question').count(),10);
    assert.equal(await page.locator('#gradeProposal .grade-number').count(),0);
    assert.equal(await page.locator('#results').isHidden(),true);
    await page.locator('#sessionStart').click();
    await page.locator('#workspace:not([hidden])').waitFor();
    for(let i=0;i<10;i++)await page.locator('fieldset.question').nth(i)
     .locator('input').nth(i===0?(bank.questions[i].answer+1)%4:bank.questions[i].answer).check();
    assert.equal(await page.locator('#results').isHidden(),true);
    await page.reload();
    await page.locator('#workspace:not([hidden])').waitFor({timeout:30000});
    await unlock(page);
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    assert.equal(await page.locator('#resultDetails article.review').count(),1);
    assert.match(await page.locator('#resultDetails').textContent(),/Correct answer/);
    assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'1');
    await page.locator('#sessionErase').click();
    await page.reload();
    await page.locator('#sessionStart').waitFor({timeout:30000});
   }
   assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
   await ctx.close();
  }finally{await browser.close()}
 });
 test('R36 '+engineName+' missing Spanish test bank fails closed without English fallback',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(new URL('self-check/test-banks/reading/preview.html?topic=rl-plastic-ocean&lang=es&level=B2&timer=20&attempt=r36missinges',base).href);
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/Source HTTP 404/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.equal(await page.locator('#workspace').isHidden(),true);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
