#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const withParams=(part,params)=>{const u=new URL(part,base);for(const [k,v]of Object.entries(params))u.searchParams.set(k,v);return u.href};
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('R27 '+name+' shows Test only for five Reading and three Listening cards',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   for(const [skill,expected]of [['konverzace',0],['cteni',5],['poslech',3]]){
    const res=await page.goto(withParams('index.html',{skill}),{waitUntil:'domcontentloaded'});
    assert.equal(res.status(),200);
    await page.locator('#cards .card').first().waitFor({state:'visible'});
    const buttons=page.locator('#cards .card .action.test');
    assert.equal(await buttons.count(),expected,skill);
    assert.equal(await page.locator('#cards .card .action.primary').count(),skill==='konverzace'?21:expected);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert.ok(overflow<=2,'Catalog overflow '+skill+': '+overflow);
    if(expected){
     const all=await buttons.allTextContents();
     assert.ok(all.every(x=>x==='Test – známka 1–5'));
    }
   }
   await page.goto(withParams('index.html',{skill:'cteni',lang:'es',level:'C1'}));
   await page.locator('#cards .card .action.test').first().waitFor();
   const link=await page.locator('#cards .card .action.test').first().getAttribute('href');
   assert.match(link,/self-check\/reading\/teacher\.html/);
   assert.match(link,/lang=es/);
   assert.match(link,/level=C1/);
   const direct=await page.goto(withParams('index.html',{skill:'poslech',level:'A2'}));
   assert.equal(direct.status(),200);
   await page.locator('#cards .card .action.test').first().waitFor();
   const listenLink=await page.locator('#cards .card .action.test').first().getAttribute('href');
   assert.match(listenLink,/self-check\/listening\/teacher\.html/);
   assert.match(listenLink,/level=A2/);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test('R27 '+name+' Reading teacher setup generates QR and student sees selected ES/B1 with no official grade',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
   const errors=[],writes=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method()+' '+r.url())});
   page.on('dialog',d=>d.accept());
   const r=await page.goto(withParams('self-check/reading/teacher.html',
    {topic:'rl-asteroids',lang:'es',level:'B1'}),{waitUntil:'domcontentloaded'});
   assert.equal(r.status(),200);
   await page.waitForSelector('#qrMount svg',{timeout:30000});
   assert.equal(await page.locator('#topic').inputValue(),'rl-asteroids');
   assert.equal(await page.locator('#language').inputValue(),'es');
   assert.equal(await page.locator('#level').inputValue(),'B1');
   assert.equal(await page.locator('#downloadQr').isEnabled(),true);
   const student=await page.locator('#studentUrl').inputValue();
   assert.equal(await page.locator('#studentPreview').getAttribute('href'),student);
   assert.match(student,/topic=rl-asteroids/);
   assert.match(student,/lang=es/);
   assert.match(student,/level=B1/);
   assert.ok((await page.locator('#qrMount svg').getAttribute('viewBox')).length>4);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(overflow<=2,'Reading teacher overflows '+overflow);
   await page.locator('#language').selectOption('fr');
   await page.locator('#level').selectOption('C2');
   const changed=await page.locator('#studentUrl').inputValue();
   assert.match(changed,/lang=fr/);
   assert.match(changed,/level=C2/);
   assert.notEqual(student,changed);
   assert.match(student,/timer=30/);
   await page.goto(student,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('#sessionIntro:not([hidden])',{timeout:30000});
   await page.locator('#sessionStart').click();
   await page.waitForSelector('#workspace:not([hidden])',{timeout:30000});
   assert.equal(await page.locator('#readingVariant').textContent(),'ES · B1');
   assert.equal(await page.locator('#language').count(),0,'Student cannot switch the language in the UI');
   assert.equal(await page.locator('#readingParagraphs .gap-marker').count(),1);
   assert.equal(await page.locator('#results').isHidden(),true);
   await page.locator('fieldset.question').first().locator('input').first().check();
   await page.locator('#submitButton').click();
   await page.waitForSelector('#results:not([hidden])');
   assert.equal(await page.locator('#scoreSummary .score-value').count(),4);
   assert.match(await page.locator('#scoreSummary').textContent(),/—/);
   assert.equal(writes.length,0);
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
 test('R27 '+name+' Listening teacher provides QR, two playbacks and one student submission',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
   const errors=[],writes=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method()+' '+r.url())});
   page.on('dialog',d=>d.accept());
   const r=await page.goto(withParams('self-check/listening/teacher.html',
    {topic:'ll-peaky-no-fighting',level:'B2'}),{waitUntil:'domcontentloaded'});
   assert.equal(r.status(),200);
   await page.waitForSelector('#qrMount svg',{timeout:30000});
   const student=await page.locator('#studentUrl').inputValue();
   assert.match(student,/self-check\/listening\/student\.html/);
   assert.match(student,/topic=ll-peaky-no-fighting/);
   assert.match(student,/level=B2/);
   assert.equal(await page.locator('#studentPreview').getAttribute('href'),student);
   assert.equal(await page.locator('#downloadQr').isEnabled(),true);
   await page.locator('#markPass').click();
   await page.locator('#markPass').click();
   assert.equal(await page.locator('#passCount').textContent(),'2 / 2');
   assert.match(student,/timer=30/);
   await page.goto(student,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('#sessionIntro:not([hidden])',{timeout:30000});
   await page.locator('#sessionStart').click();
   await page.waitForSelector('#workspace:not([hidden])');
   assert.deepEqual(await page.locator('#taskList .stage h3').allTextContents(),
    ['First Listening','Listen and Interpret','Listen, Complete and Reconstruct']);
   assert.equal(await page.locator('audio,video,iframe').count(),0);
   await page.locator('fieldset.question').first().locator('input').first().check();
   await page.locator('.cloze-row input').first().fill('cavalry');
   await page.locator('#submitButton').click();
   await page.waitForSelector('#results:not([hidden])');
   assert.equal(await page.locator('#scoreSummary .score-value').count(),4);
   assert.match(await page.locator('#scoreSummary').textContent(),/Official school grade/);
   assert.match(await page.locator('#scoreSummary').textContent(),/—/);
   assert.equal(writes.length,0);
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
}
