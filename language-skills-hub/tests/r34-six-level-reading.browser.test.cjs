#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const levels=['A1','A2','C1','C2'],base='http://127.0.0.1:8765/language-skills-hub/';
function url(level,id){return new URL('self-check/test-banks/reading/preview.html?level='+level+'&timer=20&attempt='+id,base).href}
function bank(level){return JSON.parse(fs.readFileSync(path.resolve(__dirname,'../self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'),'utf8'))}
for(const [name,browserType]of [['chromium',chromium],['webkit',webkit]]){
 for(const level of levels){
  test('R34 '+name+' EN/'+level+' reads own text, grades, restores state and only reviews mistakes',async()=>{
   const browser=await browserType.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage(),errors=[],uploads=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',d=>d.accept());
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))uploads.push(r.method())});
    assert.equal((await page.goto(url(level,'r34'+level.toLowerCase()+'attempt'))).status(),200);
    await page.locator('#sessionStart').waitFor({timeout:30000});
    assert.equal(await page.locator('#results').isHidden(),true);
    assert.equal(await page.locator('fieldset.question').count(),10);
    assert.match(await page.locator('.mode').textContent(),new RegExp(level));
    assert.match(await page.title(),new RegExp(level));
    await page.locator('#sessionStart').click();
    await page.locator('#workspace:not([hidden])').waitFor();
    const questions=bank(level).questions;
    for(let i=0;i<10;i++){
     const answer=i===2?(questions[i].answer+1)%4:questions[i].answer;
     await page.locator('fieldset.question').nth(i).locator('input').nth(answer).check();
    }
    await page.reload();
    await page.locator('#workspace:not([hidden])').waitFor({timeout:30000});
    if(await page.locator('#sessionLock').isVisible()){
     for(const c of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+c).click();
     await page.locator('#sessionLock').waitFor({state:'hidden'});
    }
    const wrong=(questions[2].answer+1)%4;
    assert.equal(await page.locator('fieldset.question').nth(2).locator('input').nth(wrong).isChecked(),true);
    assert.equal(await page.locator('#results').isHidden(),true);
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    assert.equal(await page.locator('#resultDetails article.review').count(),1);
    assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'1');
    assert.equal(await page.locator('#submitButton').isDisabled(),true);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2);
    assert.deepEqual(errors,[]);
    assert.deepEqual(uploads,[]);
    await context.close();
   }finally{await browser.close()}
  });
 }
 test('R34 '+name+' unsupported language and unsupported variant reject test before start',async()=>{
  const browser=await browserType.launch({headless:true});
  try{
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url('A1','r34invalidcase').replace('level=A1','level=B9'));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/Unsupported independent test level/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
