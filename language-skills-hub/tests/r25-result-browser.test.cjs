#!/usr/bin/env node
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const root='http://127.0.0.1:8765/language-skills-hub/self-check/';
const examples=[
 {skill:'reading',file:'reading/index.html',topic:'rl-asteroids',lang:'en',level:'B2',
  width:1280,height:900,tiles:4,reviewCount:18},
 {skill:'reading',file:'reading/index.html',topic:'rl-can-mistakes',lang:'es',level:'A1',
  width:390,height:844,tiles:4,reviewCount:9},
 {skill:'listening',file:'listening/student.html',topic:'ll-harrison-ford',level:'B1',
  width:390,height:844,tiles:5}
];
for(const [name,browserType] of [['chromium',chromium],['webkit',webkit]]){
 for(const example of examples){
  test('R25 '+name+' '+example.skill+' '+example.topic+' '+example.level+
   ': uniform after-submit result is never a school grade',async()=>{
   const browser=await browserType.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:example.width,height:example.height}});
    const page=await context.newPage(),errors=[],methods=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(r.method()!=='GET')methods.push(r.method()+' '+r.url())});
    page.on('dialog',d=>d.accept());
    const u=new URL(root+example.file);
    u.searchParams.set('topic',example.topic);
    if(example.lang)u.searchParams.set('lang',example.lang);
    u.searchParams.set('level',example.level);
    const response=await page.goto(u.href,{waitUntil:'domcontentloaded'});
    assert.equal(response.status(),200);
    await page.waitForSelector('#workspace:not([hidden])',{timeout:30000});
    const noGrade=await page.evaluate(()=>window.LSHResultCore&&
      typeof window.LSHResultCore.scoreTiles==='function');
    assert.equal(noGrade,true);
    assert.equal(await page.locator('#results').isHidden(),true);
    const wrongBefore=await page.locator('#resultDetails').textContent();
    assert.equal(wrongBefore,'');
    if(example.skill==='reading'){
     await page.locator('fieldset.question').first().locator('input').first().check();
    }else{
     await page.locator('fieldset.question').first().locator('input').first().check();
     await page.locator('.written-response').first().fill('Needs teacher review');
    }
    await page.locator('#submitButton').click();
    await page.waitForSelector('#results:not([hidden])',{timeout:30000});
    assert.equal(await page.locator('#submitButton').isDisabled(),true);
    assert.equal(await page.locator('#scoreSummary .score-value').count(),example.tiles);
    const vals=await page.locator('#scoreSummary .score-value').allTextContents();
    const displayed=vals.join('|');
    assert.match(displayed,/\d+\s*\/\s*\d+/);
    assert.match(displayed,/%/);
    assert.match(displayed,/—/,'Grade must be unassigned');
    assert.doesNotMatch(displayed,/NaN|Infinity|undefined/);
    assert.ok((await page.locator('#resultDetails .review').count())>=example.reviewCount||1);
    if(example.skill==='listening'){
     assert.match(await page.locator('#resultCaution').textContent(),/NOT final/);
     assert.match(displayed,/Written answers requiring teacher review/);
    }else{
     assert.equal(await page.locator('#resultDetails .review').count(),example.reviewCount);
    }
    assert.equal(methods.length,0,'Unexpected uploaded student results');
    assert.deepEqual(errors,[]);
    await context.close();
   }finally{await browser.close()}
  });
 }
}
