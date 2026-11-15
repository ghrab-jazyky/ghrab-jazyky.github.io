#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const core=require('../self-check/listening/listening-core.js');
const html=fs.readFileSync(path.join(__dirname,'../poslech/how-to-choose-your-news/index.html'),'utf8');
const data=core.extractJson(html,'DATA');
const topic='ll-how-to-choose-your-news';
const base='http://127.0.0.1:8765/language-skills-hub/';
const url=(level,attempt,timer)=>{
 const u=new URL('self-check/listening/student.html',base);
 u.searchParams.set('topic',topic);u.searchParams.set('level',level);
 if(timer!==null)u.searchParams.set('timer',String(timer));
 if(attempt)u.searchParams.set('attempt',attempt);
 return u.href;
};
const unlock=async page=>{
 for(const c of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+c).click();
};
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('E4 '+name+' NEWS timed: lock, wrong/correct gesture, restore, mistakes-only, PDF/CSV, one attempt',
  {timeout:240000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1280,height:800},screen:{width:1280,height:800},acceptDownloads:true});
   const page=await context.newPage(),errors=[],uploads=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>d.accept());
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))uploads.push(r.method());});
   const link=url('B2','r73-news-b2-class',5),v=core.variant(data,'B2');
   await page.goto(link);
   await page.locator('#sessionIntro:not([hidden])').waitFor();
   assert.equal(await page.locator('#workspace').isHidden(),true);
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   assert.equal(await page.locator('#sessionLock').isHidden(),true);
   await page.locator('input[name="gist-0"][value="'+v.gist[0].correct+'"]').check();
   await page.locator('#matching-0').selectOption(String(v.matching.items[0].correct));
   await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,value:true});
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document,'hidden',{configurable:true,value:false});
   });
   await page.locator('#sessionLock:not([hidden])').waitFor();
   assert.equal(await page.locator('#workspace').getAttribute('inert'),'');
   await page.locator('.lsh-corner-tr').click();
   assert.equal(await page.locator('#sessionLock').isVisible(),true);
   await unlock(page);
   await page.locator('#sessionLock').waitFor({state:'hidden'});
   await page.reload();
   await page.locator('#sessionLock:not([hidden])').waitFor();
   assert.equal(await page.locator('input[name="gist-0"][value="'+v.gist[0].correct+'"]').isChecked(),true);
   assert.equal(await page.locator('#matching-0').inputValue(),String(v.matching.items[0].correct));
   await page.goto(url('B2','r73-news-b2-class',120));
   await page.locator('#sessionLock:not([hidden])').waitFor();
   assert.match(await page.locator('#timeRemaining').innerText(),/0[45]:[0-5]\d/);
   await unlock(page);
   await page.locator('#sessionLock').waitFor({state:'hidden'});
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#resultDetails article.review.wrong').count(),15);
   const visible=await page.locator('#resultDetails').innerText();
   assert.equal(visible.includes(v.gist[0].title),false);
   assert.equal(visible.includes(v.matching.items[0].title),false);
   assert.match(await page.locator('#gradeProposal .grade-number').innerText(),/^[1-5]$/);
   assert.equal(await page.locator('#submitButton').isDisabled(),true);
   const waitPdf=page.waitForEvent('download',{timeout:35000});
   await page.locator('#exportPdf').click();
   const pdf=await waitPdf,bytes=fs.readFileSync(await pdf.path());
   assert.equal(bytes.subarray(0,5).toString('ascii'),'%PDF-');
   assert.ok(bytes.length>12000);
   const waitCsv=page.waitForEvent('download',{timeout:30000});
   await page.locator('#exportResult').click();
   const csv=fs.readFileSync(await (await waitCsv).path()).toString('utf8');
   assert.ok(csv.includes(topic));
   assert.doesNotMatch(csv,/studentName|studentEmail|password/i);
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,
    value:{writeText:async value=>{window.__r73Report=value}}}));
   await page.locator('#exportCopy').click();
   await page.waitForFunction(()=>typeof window.__r73Report==='string');
   assert.match(await page.evaluate(()=>window.__r73Report),/BEZPECNOSTNI PROTOKOL/);
   await page.locator('#sessionErase').click();
   await page.goto(link);
   await page.locator('#sessionBlocked').waitFor();
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.deepEqual(errors,[]);
   assert.deepEqual(uploads,[]);
  }finally{await browser.close()}
 });
 test('E4 '+name+' NEWS restricted viewport is NOT unlockable until size is restored',
  {timeout:110000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1280,height:800},screen:{width:1280,height:800}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
   await page.goto(url('C1','r73-news-viewport',5));
   await page.locator('#sessionIntro:not([hidden])').waitFor();
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   assert.equal(await page.locator('#sessionLock').isHidden(),true);
   await page.setViewportSize({width:600,height:800});
   const dimensions=await page.evaluate(()=>({screen:screen.width,width:innerWidth,height:innerHeight}));
   assert.ok(dimensions.screen>=900&&dimensions.width<dimensions.screen*0.70);
   await page.locator('#sessionLock:not([hidden])').waitFor({timeout:12000});
   await unlock(page);
   assert.equal(await page.locator('#sessionLock').isVisible(),true);
   assert.equal(await page.locator('#workspace').getAttribute('inert'),'');
   assert.match(await page.locator('#sessionLockReason').innerText(),/restricted|divided/i);
   await page.setViewportSize({width:1280,height:800});
   await unlock(page);
   await page.locator('#sessionLock').waitFor({state:'hidden'});
   await page.evaluate(()=>document.dispatchEvent(new Event('paste',{bubbles:true,cancelable:true})));
   await page.locator('#sessionLock:not([hidden])').waitFor();
   assert.match(await page.locator('#sessionLockReason').innerText(),/Clipboard/i);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test('E4 '+name+' NEWS timer expiry auto-submits and untimed route carries warning',
  {timeout:110000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const page=await context.newPage(),errors=[];
   await page.clock.install();
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>{errors.push('Unexpected dialog: '+d.message());d.accept();});
   await page.goto(url('A1','r73-news-expiry',5));
   await page.locator('#sessionIntro:not([hidden])').waitFor();
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   await page.clock.fastForward(6*60*1000);
   await page.locator('#results:not([hidden])').waitFor({timeout:12000});
   assert.equal(await page.locator('#submitButton').isDisabled(),true);
   assert.equal(await page.locator('#resultDetails article.review.wrong').count(),17);
   await page.reload();
   await page.locator('#results:not([hidden])').waitFor();
   await page.goto(url('A1',null,null));
   await page.locator('#sessionUnsupervised').waitFor();
   assert.match(await page.locator('#sessionUnsupervised').innerText(),/without supervision/i);
   assert.equal(await page.locator('#sessionLock').count(),0);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}