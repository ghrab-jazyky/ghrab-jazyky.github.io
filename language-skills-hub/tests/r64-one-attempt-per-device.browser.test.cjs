#!/usr/bin/env node
'use strict';
// R64: one timed attempt per device (browser profile) and class attempt code.
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const routes={
 Reading:'self-check/reading/index.html?topic=rl-asteroids&lang=en&level=B1&timer=15&attempt=r64device01',
 Listening:'self-check/listening/student.html?topic=ll-harrison-ford&level=B1&timer=15&attempt=r64device01'
};
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]])for(const [name,route] of Object.entries(routes)){
 test('R64 '+engineName+' '+name+': reopening the QR, changing the timer or erasing never yields a second attempt',{timeout:120000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1280,height:800}});
   let page=await context.newPage();page.on('dialog',d=>d.accept());
   await page.goto(base+route);await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   const first=page.url();
   await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
   await page.locator('#sessionLock:not([hidden])').waitFor();
   await page.close();
   // 1) the original QR link without the hash returns to the same locked attempt
   page=await context.newPage();page.on('dialog',d=>d.accept());
   await page.goto(base+route);await page.locator('#sessionLock:not([hidden])').waitFor();
   assert.equal(page.url(),first);
   assert.equal(await page.locator('#sessionStart').isVisible(),false);
   // 2) a changed timer keeps the registered limit and the same attempt
   await page.goto(base+route.replace('timer=15','timer=120'));
   await page.locator('#sessionLock:not([hidden])').waitFor();
   assert.match(await page.locator('#timeRemaining').textContent(),/ 1[0-5]:\d\d$/);
   // 4) unlock, submit, erase: the attempt stays consumed; the report names the attempt
   await page.goto(base+route);await page.locator('#sessionLock:not([hidden])').waitFor();
   for(const c of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+c).click();
   await page.locator('#sessionLock').waitFor({state:'hidden'});
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{window.__copy=t}}}));
   await page.locator('#submitButton').click();await page.locator('#results:not([hidden])').waitFor();
   await page.locator('#exportCopy').click();await page.waitForFunction(()=>typeof window.__copy==='string');
   const report=await page.evaluate(()=>window.__copy);
   assert.match(report,/Kód pokusu: r64device01/);assert.match(report,/Časový limit: 15 min/);
   assert.match(report,/Zaznamenané zámky: [1-9]/);assert.match(report,/Zahájeno/);
   await page.locator('#sessionErase').click();
   await page.goto(base+route);await page.locator('#sessionBlocked').waitFor();
   assert.equal(await page.locator('#sessionStart').count(),0);
   // 5) a link without timer is labelled as unsupervised
   await page.goto(base+route.replace('&timer=15',''));
   await page.locator('#sessionUnsupervised').waitFor();
   await context.close();
  }finally{await browser.close()}
 });
}
