#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const BASE='http://127.0.0.1:8765/language-skills-hub/';
const active=[
 {slug:'sad',list:'sequenceList',status:'seqStatus',review:'sequenceReview'},
 {slug:'conlangs',list:'sequenceList',status:'seqStatus',review:'sequenceReview'},
 {slug:'how-to-choose-your-news',list:'newsSequenceItems',status:'newsSequenceStatus',review:'newsSequenceReview'}
];
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('R75 '+engineName+' optional ordering works, persists, resets and is independent by CEFR',
 {timeout:230000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.on('dialog',dialog=>dialog.accept());
   for(const card of active){
    assert.equal((await page.goto(BASE+'poslech/'+card.slug+'/index.html?level=B2',{waitUntil:'load'})).status(),200);
    const items=page.locator('#'+card.list+' .seq-card');
    await items.first().waitFor({timeout:25000});
    assert.equal(await items.count(),7,card.slug);
    assert.equal(await page.locator('#'+card.list+' .seq-grip').count(),7);
    const initial=await page.locator('#'+card.list+' .seq-text').allTextContents();
    await items.nth(0).click();await items.nth(1).click();
    assert.equal(await page.locator('#'+card.list+' .seq-text').first().innerText(),initial[1]);
    await page.locator('#checkSequenceBtn').click();
    assert.match(await page.locator('#'+card.status).innerText(),/Reconstruction: 3 \/ 7/);
    assert.equal(await page.locator('#'+card.review+' .review.wrong').count(),4);
    await page.reload({waitUntil:'load'});
    await items.first().waitFor();
    assert.equal(await page.locator('#'+card.list+' .seq-text').first().innerText(),initial[1],
     card.slug+' order lost on reload');
    await page.locator('#levelPills button[data-level="A1"]').click();
    assert.equal(await items.count(),4,card.slug+' A1 count');
    await page.locator('#levelPills button[data-level="C2"]').click();
    assert.equal(await items.count(),7,card.slug+' C2 count');
    await page.locator('#levelPills button[data-level="B2"]').click();
    assert.equal(await page.locator('#'+card.list+' .seq-text').first().innerText(),initial[1],
     card.slug+' B2 order lost after CEFR switch');
    await page.locator('#clearBtn').click();
    await page.reload({waitUntil:'load'});await items.first().waitFor();
    assert.equal(await page.locator('#'+card.list+' .seq-text').first().innerText(),initial[0],
     card.slug+' reset failed');
    assert.ok(await page.locator('#listeningReconstruction, #newsSequenceSection').count());
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(overflow<=3,card.slug+' mobile horizontal overflow '+overflow);
   }
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
 test('R75 '+engineName+' classic Harrison / Matthew / Peaky still expose their sequence activity',
 {timeout:160000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}});
   for(const slug of ['harrison-ford','matthew-oscars','peaky-no-fighting']){
    assert.equal((await page.goto(BASE+'poslech/'+slug+'/index.html?level=B2',{waitUntil:'load'})).status(),200);
    await page.locator('#sequenceList .seq-card').first().waitFor({timeout:25000});
    assert.ok(await page.locator('#sequenceList .seq-card').count()>=3,slug);
   }
  }finally{await browser.close()}
 });
}
