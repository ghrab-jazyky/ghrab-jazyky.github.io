#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const topics=['rl-asteroids','rl-plastic-ocean','rl-email-friend','rl-instant-messages'];
const base='http://127.0.0.1:8765/language-skills-hub/';
const u=(topic)=>new URL('self-check/test-banks/reading/preview.html?topic='+topic+
 '&lang=en&level=B2&timer=20&attempt=r36'+topic.replace(/[^a-z0-9]/g,'')+'test',base).href;
for(const [browserName,browserType]of [['chromium',chromium],['webkit',webkit]]){
 for(const topic of topics){
  test('R36 '+browserName+' '+topic+' independent B2 9/10 and mistakes-only feedback',async()=>{
   const browser=await browserType.launch({headless:true});
   try{
    const ctx=await browser.newContext({viewport:{width:390,height:844}});
    const page=await ctx.newPage(),errors=[],uploads=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))uploads.push(r.method())});
    page.on('dialog',d=>d.accept());
    assert.equal((await page.goto(u(topic))).status(),200);
    await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:30000});
    assert.equal(await page.locator('fieldset.question').count(),10);
    assert.equal(await page.locator('#results').isHidden(),true);
    await page.locator('#sessionStart').click();
    await page.locator('#workspace:not([hidden])').waitFor();
    const bank=JSON.parse(fs.readFileSync(path.resolve(__dirname,
     '../self-check/test-banks/reading/'+topic+'/en-B2.json'),'utf8'));
    for(let i=0;i<10;i++){
     const field=page.locator('fieldset.question').nth(i);
     const id=await field.locator('input').first().getAttribute('name');
     const q=bank.questions.find(q=>q.id===id);
     assert.ok(q,'Unknown rendered task '+id);
     const option=i===0?(q.answer+1)%4:q.answer;
     await field.locator('input').nth(option).check();
    }
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    assert.equal(await page.locator('#resultDetails article.review').count(),1);
    assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'1');
    assert.equal(await page.locator('#submitButton').isDisabled(),true);
    await page.reload();
    await page.locator('#results:not([hidden])').waitFor({timeout:30000});
    assert.equal(await page.locator('#resultDetails article.review').count(),1);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2);
    assert.deepEqual(errors,[]);assert.deepEqual(uploads,[]);
   }finally{await browser.close()}
  });
 }
}
