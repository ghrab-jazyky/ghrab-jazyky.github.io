#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const levels=[['A1',15],['A2',15],['B1',20],['B2',20],['C1',25],['C2',25]];
const banks=Object.fromEntries(levels.map(([level])=>[level,
 JSON.parse(fs.readFileSync(path.resolve(__dirname,'../self-check/test-banks/reading/rl-asteroids/en-'+level+'.json'),'utf8'))]));
function url(topic,lang,level,minutes,id){
 return new URL('self-check/test-banks/reading/preview.html?topic='+topic+'&lang='+lang+
  '&level='+level+'&timer='+minutes+'&attempt='+id,base).href;
}
for(const [engineName,engine]of [['chromium',chromium],['webkit',webkit]]){
 test('R35 '+engineName+' Asteroids six EN levels display distinct text, answers, and CEFR timer',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844}});
   const page=await ctx.newPage(),errors=[],writes=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>d.accept());
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
   for(const [level,minutes]of levels){
    const bank=banks[level];
    assert.equal((await page.goto(url('rl-asteroids','en',level,minutes,'r35pilot'+level.toLowerCase()))).status(),200);
    await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:30000});
    assert.match(await page.title(),new RegExp('EN/'+level));
    assert.equal((await page.locator('#title').textContent()).trim(),bank.sourceTitle);
    assert.match(await page.locator('.subtitle').textContent(),new RegExp(minutes+' minutes'));
    assert.equal(await page.locator('#readingParagraphs p').count(),['B1','B2','C1','C2'].includes(level)?5:4);
    assert.equal(await page.locator('fieldset.question').count(),10);
    assert.equal(await page.locator('#gradeProposal .grade-number').count(),0);
    await page.locator('#sessionStart').click();
    await page.locator('#workspace:not([hidden])').waitFor();
    for(let i=0;i<bank.questions.length;i++)
     await page.locator('fieldset.question').nth(i).locator('input').nth(bank.questions[i].answer).check();
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    assert.equal(await page.locator('#resultDetails article.review').count(),0);
    assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'1');
   }
   assert.deepEqual(errors,[]);
   assert.deepEqual(writes,[]);
   await ctx.close();
  }finally{await browser.close()}
 });
 test('R35 '+engineName+' missing bank and wrong topic/language are rejected before Start',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url('rl-asteroids','es','A1',15,'r35missinges'));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/Source HTTP 404/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   await page.goto(url('rl-not-a-topic','en','B1',20,'r35badtopic'));
   await page.locator('#loading.error').waitFor();
   assert.match(await page.locator('#loading').textContent(),/Unsupported or unpublished Reading variant/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   await page.goto(url('rl-asteroids','de','B2',20,'r35missingde'));
   await page.locator('#loading.error').waitFor();
   assert.equal(await page.locator('#workspace').isHidden(),true);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
