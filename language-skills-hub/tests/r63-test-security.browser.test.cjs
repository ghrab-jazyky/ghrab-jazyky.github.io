#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const samples=[
 'self-check/reading/index.html?topic=rl-asteroids&lang=en&level=B1&timer=15&attempt=r63-readingabc',
 'self-check/listening/student.html?topic=ll-harrison-ford&level=B1&timer=15&attempt=r63-listenabc'
];
async function unlock(page){
 for(const c of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+c).click();
 await page.locator('#sessionLock').waitFor({state:'hidden',timeout:12000});
}
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('R63 '+name+' print guard and complete incident report in Reading and Listening',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const route of samples){
    const context=await browser.newContext({viewport:{width:800,height:750},acceptDownloads:true});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    page.on('dialog',dialog=>dialog.accept());
    assert.equal((await page.goto(base+route)).status(),200);
    await page.locator('#sessionStart').click();
    await page.locator('#workspace:not([hidden])').waitFor();
    await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
    await page.locator('#sessionLock:not([hidden])').waitFor();
    assert.match(await page.locator('#sessionLockReason').textContent(),/print/i);
    await page.emulateMedia({media:'print'});
    assert.equal(await page.locator('#workspace').evaluate(el=>getComputedStyle(el).visibility),'hidden');
    await page.emulateMedia({media:'screen'});
    await unlock(page);
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    await page.evaluate(()=>{
     Object.defineProperty(navigator,'clipboard',{configurable:true,
      value:{writeText:async text=>window.__r63Copy=text}});
    });
    await page.locator('#exportCopy').click();
    await page.waitForFunction(()=>typeof window.__r63Copy==='string');
    const text=await page.evaluate(()=>window.__r63Copy);
    assert.match(text,/BEZPECNOSTNI PROTOKOL/);
    assert.match(text,/Pokus o tisk nebo náhled tisku/);
    assert.match(text,/Test znovu zpřístupněn učitelem/);
    assert.match(text,/Spravna odpoved/);
    assert.deepEqual(errors,[]);
    await context.close();
   }
  }finally{await browser.close()}
 });
 test('R63 '+name+' other active LSH test in same browser locks concurrent attempt',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:800,height:750}});
   const first=await context.newPage(),second=await context.newPage();
   first.on('dialog',d=>d.accept());second.on('dialog',d=>d.accept());
   await first.goto(base+samples[0]);
   await first.locator('#sessionStart').click();
   await first.locator('#workspace:not([hidden])').waitFor();
   await second.goto(base+samples[1]);
   await second.bringToFront();
   await second.locator('#sessionStart').click();
   await second.locator('#sessionLock:not([hidden])').waitFor({timeout:12000});
   assert.match(await second.locator('#sessionLockReason').textContent(),/another active/i);
   assert.equal(await second.locator('#workspace').getAttribute('inert'),'');
   await first.close();
   await unlock(second);
   assert.equal(await second.locator('#workspace').getAttribute('inert'),null);
   await context.close();
  }finally{await browser.close()}
 });
}
