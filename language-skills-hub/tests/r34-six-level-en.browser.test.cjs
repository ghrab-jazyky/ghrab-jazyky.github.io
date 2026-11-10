#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'../self-check/test-banks/reading/rl-can-mistakes');
const levels=['A1','A2','C1','C2'];
const banks=Object.fromEntries(levels.map(x=>[x,JSON.parse(fs.readFileSync(path.join(root,'en-'+x+'.json'),'utf8'))]));
const base='http://127.0.0.1:8765/language-skills-hub/';
const href=(level,name)=>new URL('self-check/test-banks/reading/preview.html?level='+level+
 '&timer=20&attempt='+name,base).href;
async function start(page){
 await page.locator('#sessionStart').waitFor({timeout:25000});
 await page.locator('#sessionStart').click();
 await page.locator('#workspace:not([hidden])').waitFor();
}
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 for(const level of levels){
  test('R34 '+name+' '+level+' original passage, 10 independent responses and mistakes-only result',async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage(),errors=[],writes=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
    page.on('dialog',d=>d.accept());
    assert.equal((await page.goto(href(level,'r34test'+level.toLowerCase()+'instance'))).status(),200);
    await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:25000});
    assert.match(await page.title(),new RegExp('Reading '+level));
    assert.equal(await page.locator('#readingParagraphs p').count(),banks[level].level==='A1'||level==='A2'?3:4);
    assert.equal(await page.locator('fieldset.question').count(),10);
    assert.equal(await page.locator('#results').isHidden(),true);
    await start(page);
    const qs=banks[level].questions;
    for(let i=0;i<qs.length;i++){
     const answer=i===3?(qs[i].answer+1)%4:qs[i].answer;
     await page.locator('fieldset.question').nth(i).locator('input').nth(answer).check();
    }
    assert.equal(await page.locator('#resultDetails article.review').count(),0,'No pre-submit answer disclosure');
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    assert.equal(await page.locator('#resultDetails article.review').count(),1);
    assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'1');
    assert.match(await page.locator('#resultDetails article.review').textContent(),/Correct answer/);
    assert.equal(await page.locator('#submitButton').isDisabled(),true);
    await page.reload();
    await page.locator('#results:not([hidden])').waitFor({timeout:25000});
    assert.equal(await page.locator('#resultDetails article.review').count(),1);
    assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
    await context.close();
   }finally{await browser.close()}
  });
 }
}
