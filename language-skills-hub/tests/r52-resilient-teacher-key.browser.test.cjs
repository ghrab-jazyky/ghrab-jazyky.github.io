#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const readingCore=require('../self-check/reading/reading-core.js');
const fs=require('node:fs'),path=require('node:path');
const asteroidData=readingCore.parseReadingData(fs.readFileSync(path.join(__dirname,'../cteni/asteroids/index.html'),'utf8'));
const asteroidB2=readingCore.variantFromData(asteroidData,'en','B2');
const base='http://127.0.0.1:8765/language-skills-hub/';
const target=(topic,skill,mode='test')=>{
 const url=new URL('self-check/practice-answers/teacher.html',base);
 for(const [k,v] of Object.entries({topic,skill,lang:'en',level:'B2',mode}))
  url.searchParams.set(k,v);
 return url.href;
};
const reading=target('rl-asteroids','cteni'),listening=target('ll-harrison-ford','poslech');
for(const [name,engine]of[['chromium',chromium],['webkit',webkit]]){
 test('R52 '+name+': broken catalog fetch cannot blank teacher selectors; transient card fetch auto-recovers',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}});
   let catalogRequests=0,sourceRequests=0;
   await page.route('**/data/cards.json',r=>{catalogRequests++;return r.abort('failed')});
   await page.route('**/cteni/asteroids/index.html',r=>{
    sourceRequests++;
    return sourceRequests===1?r.abort('failed'):r.continue();
   });
   await page.goto(reading,{waitUntil:'load'});
   await page.locator('#downloadPdf:enabled').waitFor({timeout:20000});
   assert.equal(catalogRequests,0,'teacher page should not fetch entire catalog');
   assert.equal(sourceRequests,2,'one failed source request must retry automatically');
   assert.equal(await page.locator('#topicTitle').textContent(),'Asteroids');
   assert.equal(await page.locator('#language').inputValue(),'en');
   assert.equal(await page.locator('#level').inputValue(),'B2');
   assert.equal(await page.locator('#answerMode').inputValue(),'test');
   assert.equal(await page.locator('#retryLoad').isVisible(),false);
   assert.equal(await page.locator('#answerPreview .key-item').count(),asteroidB2.questions.length);
   assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=3);
  }finally{await browser.close()}
 });
 test('R52 '+name+': persistent network failure keeps controls populated and manual retry works',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}});
   const source='**/r11/variant-copies/ll-harrison-ford.html';
   let failures=0;
   await page.route(source,r=>{failures++;return r.abort('failed')});
   await page.goto(listening,{waitUntil:'load'});
   await page.locator('#retryLoad:visible').waitFor({timeout:20000});
   assert.equal(failures,3,'transient source failures must be retried with a bound');
   assert.equal(await page.locator('#topicTitle').textContent(),'Harrison Ford — Life Achievement Speech');
   assert.equal(await page.locator('#language').inputValue(),'en');
   assert.equal(await page.locator('#level').inputValue(),'B2');
   assert.equal(await page.locator('#answerMode').inputValue(),'test');
   assert.equal(await page.locator('#downloadPdf').isDisabled(),true);
   assert.match(await page.locator('#status').textContent(),/Opakovat načtení/);
   assert.doesNotMatch(await page.locator('#status').textContent(),/Neplatný odkaz/);
   // Simulate the network coming back without a refresh of the document.
   await page.unroute(source);
   await page.locator('#retryLoad').click();
   await page.locator('#downloadPdf:enabled').waitFor({timeout:20000});
   assert.equal(await page.locator('#retryLoad').isVisible(),false);
   assert.match(await page.locator('#status').textContent(),/Klíč je připraven/);
   assert.ok(await page.locator('#answerPreview .key-item').count()>15);
   // Switching modes and levels still uses the same immutable card.
   await page.locator('#answerMode').selectOption('practice');
   await page.locator('#downloadPdf:enabled').waitFor({timeout:20000});
   await page.locator('#level').selectOption('A1');
   await page.locator('#answerPreview h2').filter({hasText:/A1$/}).waitFor({timeout:20000});
   assert.equal(await page.locator('#topicTitle').getAttribute('data-topic-id'),'ll-harrison-ford');
   assert.equal(new URL(page.url()).searchParams.get('skill'),'poslech');
  }finally{await browser.close()}
 });
}
