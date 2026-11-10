#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
const base='http://127.0.0.1:8765/language-skills-hub/';
function loadBank(level){return JSON.parse(fs.readFileSync(path.join(root,
 'self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'),'utf8'))}
for(const [engineName,engine]of [['chromium',chromium],['webkit',webkit]]){
 for(const level of ['A1','A2','C1','C2']){
  test('R34 '+engineName+' '+level+' uses independent original bank and mistakes-only result',async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage(),errors=[],writes=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',d=>d.accept());
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
    const bank=loadBank(level),time=bank.durationMinutesSuggested;
    const link=new URL('self-check/test-banks/reading/preview.html?level='+level+
     '&timer='+time+'&attempt=r34pilotcase',base);
    assert.equal((await page.goto(link.href)).status(),200);
    await page.locator('#sessionStart').waitFor({timeout:30000});
    assert.match(await page.title(),new RegExp('Reading '+level));
    assert.match(await page.locator('.mode').textContent(),new RegExp(level));
    assert.equal(await page.locator('#readingParagraphs p').count(),bank.level==='A1'||bank.level==='A2'?3:4);
    assert.equal(await page.locator('fieldset.question').count(),10);
    assert.equal(await page.locator('#results').isHidden(),true);
    await page.locator('#sessionStart').click();
    await page.locator('#workspace:not([hidden])').waitFor();
    assert.match(await page.locator('#timeRemaining').textContent(),new RegExp(time+':|'+(time-1)+':'));
    for(let i=0;i<10;i++){
     const q=bank.questions[i],picked=i===0?(q.answer+1)%4:q.answer;
     await page.locator('fieldset.question').nth(i).locator('input').nth(picked).check();
    }
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    assert.equal(await page.locator('#resultDetails .review').count(),1);
    assert.equal(await page.locator('#gradeProposal .grade-number').textContent(),'1');
    await page.reload();
    await page.locator('#results:not([hidden])').waitFor({timeout:30000});
    assert.equal(await page.locator('#resultDetails .review').count(),1);
    assert.equal(await page.locator('#submitButton').isDisabled(),true);
    assert.deepEqual(errors,[]);
    assert.deepEqual(writes,[]);
    await context.close();
   }finally{await browser.close()}
  });
 }
}
