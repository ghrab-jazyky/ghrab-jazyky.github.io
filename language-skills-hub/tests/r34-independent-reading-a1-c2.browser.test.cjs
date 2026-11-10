#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const levels=['A1','A2','C1','C2'];
const banks=Object.fromEntries(levels.map(level=>[level,JSON.parse(fs.readFileSync(path.join(__dirname,
 '../self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'),'utf8'))]));
const base='http://127.0.0.1:8765/language-skills-hub/';
const url=(level,attempt)=>new URL('self-check/test-banks/reading/preview.html?level='+level+'&timer=20&attempt='+attempt,base).href;
for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 for(const level of levels){
  test('R34 '+name+' EN '+level+' independent 10-item passage, exact score, mistakes-only feedback and reload',async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage(),errors=[],writes=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.url())});
    await page.goto(url(level,'r34pilot'+level.toLowerCase()));
    await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:30000});
    assert.match(await page.title(),new RegExp('Reading EN/'+level));
    assert.match(await page.locator('.mode').textContent(),new RegExp(level));
    assert.equal(await page.locator('fieldset.question').count(),10);
    assert.equal(await page.locator('#results').isHidden(),true);
    await page.locator('#sessionStart').click();
    await page.locator('#workspace:not([hidden])').waitFor();
    const bank=banks[level];
    for(let i=0;i<10;i++){
     const q=bank.questions[i],choice=i===0?(q.answer+1)%4:q.answer;
     await page.locator('fieldset.question').nth(i).locator('input').nth(choice).check();
    }
    await page.reload();await page.locator('#workspace:not([hidden])').waitFor({timeout:30000});
    if(await page.locator('#sessionLock').isVisible()){
     for(const corner of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+corner).click();
     await page.locator('#sessionLock').waitFor({state:'hidden'});
    }
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    assert.equal(await page.locator('#resultDetails article.review').count(),1);
    assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'1');
    await page.reload();await page.locator('#results:not([hidden])').waitFor();
    assert.equal(await page.locator('#resultDetails article.review').count(),1);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2);
    assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
    await context.close();
   }finally{await browser.close()}
  });
 }
}
