#!/usr/bin/env node
'use strict';
// Conversation Lab audit 2026-11-11: the AI card explains B2+ questions like every other card.
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/konverzace/';
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('Conversation audit '+name+' AI card Explain button and default level',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'umela-inteligence/index.html?practice=1');
   assert.equal(await page.locator('#levelSwitch button[aria-pressed="true"]').getAttribute('data-level'),'B1');
   for(const lang of ['en','es','de','fr'])for(const level of ['B2','C1','C2']){
    await page.goto(base+'umela-inteligence/index.html?practice=1&lang='+lang+'&level='+level+'&zamek=1');
    const btn=page.locator('#mainExplainBtn');
    await btn.waitFor();
    const label=(await btn.textContent()).trim();
    assert.doesNotMatch(label,/undefined/,lang+' '+level);
    assert.ok(label.length>3,lang+' '+level);
    await btn.click();
    assert.ok(((await page.locator('#mainExplainText').textContent())||'').trim().length>20,lang+' '+level);
    for(const aria of await page.locator('#questions button').evaluateAll(b=>b.map(x=>x.getAttribute('aria-label')||'')))
     assert.doesNotMatch(aria,/undefined|\{n\}/,lang+' '+level);
   }
   await page.goto(base+'rodina/index.html?practice=1&lang=de&level=B1&zamek=1');
   assert.equal((await page.locator('#timerLabel').textContent()).trim(),'RESTZEIT');
   assert.deepEqual(errors,[]);
  }finally{await browser.close();}
 });
}
