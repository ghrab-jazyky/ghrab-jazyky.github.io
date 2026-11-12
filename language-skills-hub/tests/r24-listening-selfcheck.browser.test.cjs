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
    assert.deepEqual(phases,['First Listening','Listen and Interpret','Listen, Complete and Reconstruct']);
    assert.equal(await page.locator('audio, video, iframe, button[aria-label*="Play"]').count(),0);
    assert.equal(await page.locator('#results').isHidden(),true);
    assert.ok(await page.locator('#taskList fieldset.question').count()>=7);
    assert.ok(await page.locator('.sequence-row select').count()>=3);
    assert.equal(await page.locator('.written-response').count(),0);
    assert.ok(await page.locator('.cloze-row input').count()>=2);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert.ok(overflow<=2,'Horizontal overflow: '+overflow);
    await page.locator('#taskList fieldset.question').first().locator('input').first().check();
    await page.locator('.sequence-row select').first().selectOption({index:1});
    await page.locator('.cloze-row input').first().fill('Grace');
    await page.locator('#submitButton').click();
    await page.waitForSelector('#results:not([hidden])');
    assert.equal(await page.locator('#submitButton').isDisabled(),true);
    assert.equal(await page.locator('#taskList input:not([disabled]),#taskList textarea:not([disabled]),#taskList select:not([disabled])').count(),0);
    assert.match(await page.locator('#resultCaution').textContent(),/NOT a verified school grade/);
    assert.match(await page.locator('#gradeProposal .grade-number').textContent(),/^[1-5]$/);
    assert.match(await page.locator('#scoreSummary').textContent(),/Objective tasks/);
    assert.equal(post.length,0,'Student data POST was made: '+post);
    assert.deepEqual(errors,[]);
    await context.close();
   }finally{await browser.close()}
  });
 }
 test(name+': teacher helper: fixed topic, external media and correct student link',async()=>{
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
   assert.equal(await page.locator('#topicTitle').getAttribute('data-topic-id'),'ll-peaky-no-fighting');
   assert.equal(await page.locator('select#topic').count(),0);
   assert.equal(await page.locator('#passCount,#markPass,#resetPass').count(),0);
   const primary=page.locator('#mediaSources .listening-video-primary');
   assert.equal(await primary.count(),1);
   assert.match(await primary.getAttribute('href'),/^https:\/\/www\.youtube\.com\/watch\?/);
   assert.equal(await primary.getAttribute('target'),'_blank');
   assert.match(await primary.getAttribute('rel'),/noopener noreferrer/);
   await page.locator('#level').selectOption('C1');
   const changed=await page.locator('#studentUrl').inputValue();
   assert.match(changed,/topic=ll-peaky-no-fighting&level=C1/);
   assert.equal(await page.locator('#topicTitle').getAttribute('data-topic-id'),'ll-peaky-no-fighting');
   assert.equal(await page.locator('#mediaSources a').count(),2);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(overflow<=2,'Mobile teacher horizontal overflow: '+overflow);
   assert.deepEqual(posts,[]);
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
}
