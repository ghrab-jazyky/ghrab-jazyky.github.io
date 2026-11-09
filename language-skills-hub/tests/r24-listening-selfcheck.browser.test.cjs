#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const origin='http://127.0.0.1:8765/language-skills-hub/self-check/listening/';
const cases=[
 {name:'Matthew B2 desktop',topic:'ll-matthew-oscars',level:'B2',width:1280,height:860},
 {name:'Harrison B1 mobile',topic:'ll-harrison-ford',level:'B1',width:390,height:844},
 {name:'Peaky B2 desktop',topic:'ll-peaky-no-fighting',level:'B2',width:1024,height:768}
];
for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 for(const spec of cases){
  test(name+': '+spec.name+' student: three stages, no media, one local submit',async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:spec.width,height:spec.height}});
    const page=await context.newPage(),post=[],errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(r.method()!=='GET')post.push(r.method()+' '+r.url())});
    page.on('dialog',d=>d.accept());
    const url=new URL('student.html',origin);
    url.searchParams.set('topic',spec.topic);
    url.searchParams.set('level',spec.level);
    const response=await page.goto(url.href,{waitUntil:'domcontentloaded'});
    assert.equal(response.status(),200);
    await page.waitForSelector('#workspace:not([hidden])',{timeout:30000});
    const phases=await page.locator('#taskList .stage h3').allTextContents();
    assert.deepEqual(phases,['First Listening','Listen and Interpret','Listen, Write and Reconstruct']);
    assert.equal(await page.locator('audio, video, iframe, button[aria-label*="Play"]').count(),0);
    assert.equal(await page.locator('#results').isHidden(),true);
    assert.ok(await page.locator('#taskList fieldset.question').count()>=7);
    assert.ok(await page.locator('.sequence-row select').count()>=3);
    assert.ok(await page.locator('.written-response').count()>=3);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert.ok(overflow<=2,'Horizontal overflow: '+overflow);
    await page.locator('#taskList fieldset.question').first().locator('input').first().check();
    await page.locator('.sequence-row select').first().selectOption({index:1});
    await page.locator('.written-response').first().fill('An answer to check with the teacher');
    await page.locator('#submitButton').click();
    await page.waitForSelector('#results:not([hidden])');
    assert.equal(await page.locator('#submitButton').isDisabled(),true);
    assert.equal(await page.locator('#taskList input:not([disabled]),#taskList textarea:not([disabled]),#taskList select:not([disabled])').count(),0);
    assert.match(await page.locator('#resultCaution').textContent(),/NOT final/);
    assert.match(await page.locator('#scoreSummary').textContent(),/Objective tasks/);
    assert.equal(post.length,0,'Student data POST was made: '+post);
    assert.deepEqual(errors,[]);
    await context.close();
   }finally{await browser.close()}
  });
 }
 test(name+': teacher helper: two manually marked playbacks and correct student link',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const page=await context.newPage(),posts=[],errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(r.method()!=='GET')posts.push(r.method()+' '+r.url())});
   const response=await page.goto(origin+'teacher.html?topic=ll-peaky-no-fighting&level=B2',{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);
   await page.waitForFunction(()=>document.getElementById('mediaSources').querySelectorAll('a').length>0,{timeout:30000});
   assert.match(await page.locator('#mediaCaution').textContent(),/vulgarismy/i);
   const shared=await page.locator('#studentUrl').inputValue();
   assert.match(shared,/student\.html\?topic=ll-peaky-no-fighting&level=B2/);
   assert.equal(await page.locator('#passCount').textContent(),'0 / 2');
   await page.locator('#markPass').click();
   assert.equal(await page.locator('#passCount').textContent(),'1 / 2');
   await page.locator('#markPass').click();
   assert.equal(await page.locator('#passCount').textContent(),'2 / 2');
   assert.equal(await page.locator('#markPass').isDisabled(),true);
   await page.locator('#resetPass').click();
   assert.equal(await page.locator('#passCount').textContent(),'0 / 2');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(overflow<=2,'Mobile teacher horizontal overflow: '+overflow);
   assert.deepEqual(posts,[]);
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
}
