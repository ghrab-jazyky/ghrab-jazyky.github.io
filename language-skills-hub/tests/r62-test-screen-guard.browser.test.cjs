#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const urls=[
 'self-check/reading/index.html?topic=rl-asteroids&lang=en&level=B1&timer=15&attempt=r62readingabc',
 'self-check/listening/student.html?topic=ll-harrison-ford&level=B1&timer=15&attempt=r62listeningabc'
];
async function unlock(page){
 for(const c of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+c).click();
 await page.locator('#sessionLock').waitFor({state:'hidden'});
}
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('R62 '+name+' both skills: stealth gesture, visibility, clipboard and reload lock',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const route of urls){
    const context=await browser.newContext({viewport:{width:1280,height:800}});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',d=>d.accept());
    assert.equal((await page.goto(base+route)).status(),200);
    await page.locator('#sessionStart').click();
    await page.locator('#workspace:not([hidden])').waitFor();
    assert.equal(await page.locator('#sessionLock').isHidden(),true);
    await page.evaluate(()=>{
      Object.defineProperty(document,'hidden',{configurable:true,value:true});
      document.dispatchEvent(new Event('visibilitychange'));
      Object.defineProperty(document,'hidden',{configurable:true,value:false});
    });
    await page.locator('#sessionLock:not([hidden])').waitFor();
    assert.match(await page.locator('#sessionLockReason').textContent(),/hidden/i);
    assert.equal(await page.locator('.lsh-session-hint').count(),0);
    assert.equal(await page.locator('.lsh-corner button').count(),0);
    assert.equal(await page.locator('.lsh-corner').first().textContent(),'');
    assert.equal(await page.locator('#workspace').getAttribute('inert'),'');
    await unlock(page);
    await page.evaluate(()=>document.dispatchEvent(new Event('paste',{bubbles:true,cancelable:true})));
    await page.locator('#sessionLock:not([hidden])').waitFor();
    assert.match(await page.locator('#sessionLockReason').textContent(),/clipboard/i);
    await unlock(page);
    await page.reload();
    await page.locator('#sessionLock:not([hidden])').waitFor();
    assert.match(await page.locator('#sessionLockReason').textContent(),/refresh|left/i);
    await unlock(page);
    assert.equal(await page.locator('#workspace').getAttribute('inert'),null);
    assert.deepEqual(errors,[]);
    await context.close();
   }
  }finally{await browser.close()}
 });
}
test('R62 incident kinds persist and cannot mutate submitted attempts',()=>{
 const core=require('../self-check/session/attempt-core.js');
 const data=new Map(),storage={
  getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)
 };
 const cfg={skill:'reading',topic:'rl-asteroids',lang:'en',level:'B1',
  attempt:'r62unitabc',limitMinutes:15,storage,now:()=>1700000000000};
 const a=core.open(cfg);a.start();a.interrupt('viewport-change');
 assert.equal(a.status().phase,'interrupted');
 assert.equal(a.status().incidents[0].kind,'viewport-change');
 const b=core.open(cfg);assert.equal(b.status().phase,'interrupted');
 b.resume();b.finish();
 b.interrupt('clipboard');
 assert.equal(b.status().phase,'submitted');
 assert.equal(b.status().incidents.length,1);
});
