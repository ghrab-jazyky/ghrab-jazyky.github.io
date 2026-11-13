#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const entries=JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','cards.json'),'utf8')).entries;
const base='http://127.0.0.1:8765/language-skills-hub/';
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('R64 '+engineName+': all 29 real catalog URLs expose the shared My Vocabulary and honour the level preset',{timeout:300000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const e of entries){
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',x=>{if(!/^ResizeObserver loop/.test(x.message))errors.push(x.message)});
    const src=e.lockSource||e.relative;
    assert.equal((await page.goto(base+src+'?practice=1&lang=en&level=B1&zamek=1',{waitUntil:'load'})).status(),200,e.id);
    await page.locator('a.lsh-vocab-nav, #lshBridgeVocabularyLink').first().waitFor({state:'attached',timeout:8000}).catch(()=>{});
    const state=await page.evaluate(async()=>({
     vocab:!!document.querySelector('a.lsh-vocab-nav, #lshBridgeVocabularyLink'),
     legacy:(await indexedDB.databases()).some(d=>d.name==='reading-lab-vocabulary'),
     hint:!!document.getElementById('lshVariantHint'),
     back:document.querySelectorAll('#backToQuestion').length
    }));
    assert.equal(state.vocab,true,e.id+' has no shared vocabulary entry on '+src);
    assert.equal(state.legacy,false,e.id+' opened the legacy Reading vocabulary database');
    if(e.lockSource)assert.equal(state.hint,true,e.id+' ignored the teacher preset');
    if(e.lockSource&&e.skill==='cteni')assert.equal(state.back,1,e.id+' has no Back to question control');
    assert.deepEqual(errors,[],e.id);
    await context.close();
   }
  }finally{await browser.close()}
 });
}
