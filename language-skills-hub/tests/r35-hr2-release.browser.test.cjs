#!/usr/bin/env node
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const ROOT='http://127.0.0.1:8765/language-skills-hub/';
for(const [engine,launcher] of [['Chromium',chromium],['WebKit',webkit]]){
 test('R35-HR2 '+engine+': production My Vocabulary and teacher preset',{timeout:90000},async()=>{
  const browser=await launcher.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(ROOT+'konverzace/human-rights/index.html?lang=es&level=A1&zamek=1',{waitUntil:'load'});
   await page.locator('#lshBridgeVocabularyLink').waitFor({state:'visible',timeout:18000});
   assert.equal(await page.locator('#languageSelect').inputValue(),'es');
   assert.equal(await page.locator('#languageSelect').isDisabled(),true);
   assert.equal(await page.locator('#levelSwitch button.active').getAttribute('data-level'),'A1');
   assert.equal(await page.locator('#vocabGrid .vocab-item .lsh-bridge-save').count(),12);
   const item=page.locator('#vocabGrid .vocab-item').first();
   assert.equal((await item.locator('b').textContent()).trim(),'el derecho');
   await item.locator('.lsh-bridge-save').click();
   await page.waitForFunction(async()=>{
     if(!window.LSH_STORE)return false;
     const s=window.LSH_STORE.createStore({mode:'production'});
     await s.open();return (await s.listWords()).some(w=>w.language==='es'&&w.term==='el derecho'&&w.translationCs==='právo'&&w.sources?.some(x=>x.topicId==='cl-human-rights'));
   },null,{timeout:18000});
   await page.reload({waitUntil:'load'});
   const saved=await page.evaluate(async()=>{
     const s=window.LSH_STORE.createStore({mode:'production'});
     await s.open();
     return (await s.listWords()).some(w=>w.term==='el derecho'&&w.translationCs==='právo');
   });
   assert.ok(saved,'IndexedDB did not preserve the saved Spanish word');
   const check=await page.evaluate(()=>({general:CZ_GLOSSARY.words.en.right,contextual:CZ_GLOSSARY.recommended.en.right,spanish:CZ_GLOSSARY.phrases.es['da un ejemplo']}));
   assert.equal(check.general,'právo; správný');
   assert.equal(check.contextual,'právo');
   assert.equal(check.spanish,'uveď příklad');
   assert.deepEqual(errors,[]);
  }finally{await context.close();await browser.close();}
 });
 test('R35-HR2 '+engine+': mobile timer and navigation',{timeout:60000},async()=>{
  const browser=await launcher.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  try{
   await page.goto(ROOT+'konverzace/human-rights/index.html?lang=fr&level=B2',{waitUntil:'load'});
   await page.locator('#lshBridgeVocabularyLink').waitFor({state:'visible',timeout:18000});
   assert.equal(await page.locator('#levelSwitch button.active').getAttribute('data-level'),'B2');
   assert.equal(await page.locator('#timerPanel').evaluate(x=>getComputedStyle(x).position),'fixed');
   await page.locator('#timerFloatToggle').click();
   assert.ok(await page.locator('#timerPanel').evaluate(x=>x.classList.contains('mobile-expanded')));
   await page.locator('#timerFloatToggle').click();
   await page.locator('#sectionNav button').nth(3).click();
   assert.equal((await page.locator('#stationNum').textContent()).trim(),'4');
   const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}));
   assert.ok(d.scroll<=d.inner+4,JSON.stringify(d));
  }finally{await context.close();await browser.close();}
 });
}
