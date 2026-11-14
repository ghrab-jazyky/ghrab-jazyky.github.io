#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const hub='http://127.0.0.1:8765/language-skills-hub/';
const entries=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/cards.json'),'utf8')).entries;
const url=relative=>new URL(relative,hub).href;
const oldWord=(term,meaningCs,topicId='asteroids-planetary-defence')=>({
 id:'en|'+term.toLocaleLowerCase()+'|'+meaningCs.toLocaleLowerCase(),
 term,meaningCs,language:'en',level:'B2',topicIds:[topicId],
 context:'From the reading text.',createdAt:'2026-11-10T07:30:00.000Z',
 updatedAt:'2026-11-11T07:30:00.000Z'
});
async function seedLegacy(page,word){
 await page.evaluate(async row=>{
  await new Promise((resolve,reject)=>{
   const req=indexedDB.open('reading-lab-vocabulary',1);
   req.onupgradeneeded=()=>{
    if(!req.result.objectStoreNames.contains('words'))
     req.result.createObjectStore('words',{keyPath:'id'});
   };
   req.onerror=()=>reject(req.error);
   req.onsuccess=()=>{
    const db=req.result,tx=db.transaction('words','readwrite');
    tx.objectStore('words').put(row);
    tx.oncomplete=()=>{db.close();resolve()};
    tx.onerror=()=>{db.close();reject(tx.error)};
   };
  });
 },word);
}
async function bankWords(page){
 return page.locator('.word-row .word').allTextContents();
}
async function checkNoOverflow(page){
 for(const width of [390,1280]){
  await page.setViewportSize({width,height:860});
  const res=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(res.doc<=res.viewport+2,'Horizontal overflow at '+width+'px');
 }
}
for(const [engineName,engine]of[['Chromium',chromium],['WebKit',webkit]]){
 test('R49 '+engineName+': one My Vocabulary link in every one of 29 cards',
  {timeout:360000},async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>{if(!/^ResizeObserver loop completed/.test(e.message))errors.push(e.message)});
    for(const e of entries){
     const dest=(e.lockSource||e.relative)+'?practice=1&lang=en&level=B2';
     const response=await page.goto(url(dest),{waitUntil:'load',timeout:45000});
     assert.equal(response.status(),200,'Cannot open '+e.id);
     const selector=e.skill==='konverzace'?'#lshBridgeVocabularyLink':'a.lsh-vocab-nav';
     await page.locator(selector).waitFor({state:'visible',timeout:15000});
     assert.equal(await page.locator('a.lsh-vocab-nav, #lshBridgeVocabularyLink').count(),1,
      'Exactly one vocabulary navigation in '+e.id);
     assert.equal(await page.locator('#rl-vocab-button, #rl-vocab-add, .rl-vocab-modal').count(),0,
      'Legacy Reading vocabulary controls still present in '+e.id);
     if(e.skill==='cteni'){
      assert.equal(await page.locator('#lookup .lsh-vocab-reading-form').count(),1);
      assert.equal(await page.locator('#lookup .lsh-vocab-save').count(),1);
      assert.equal(await page.evaluate(()=>typeof window.ReadingLabVocab),'undefined');
      assert.ok(await page.locator('#lookup .lsh-vocab-reading-input').count());
     }else if(e.skill==='poslech'){
      assert.equal(await page.locator('.lsh-vocab-add-open').count(),1);
      assert.equal(await page.locator('#lsh-vocab-editor').count(),1);
     }else{
      assert.equal(await page.locator('#lookupPopover #lshBridgeSavePopup').count(),1);
     }
     const target=await page.locator(selector).getAttribute('href');
     assert.match(target,/slovnicek/,'Navigation not canonical '+e.id);
     console.log('PASS SINGLE VOCAB',engineName,e.id);
    }
    assert.deepEqual(errors,[],'Card errors: '+errors.join(' | '));
    await context.close();
   }finally{await browser.close();}
 });
 test('R49 '+engineName+': old Reading DB and fallback migrate, new save goes to single bank, backups transfer',
  {timeout:200000},async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
    const page=await ctx.newPage(),errors=[],dialogs=[];
    page.on('pageerror',e=>{if(!/^ResizeObserver loop completed/.test(e.message))errors.push(e.message)});
    page.on('dialog',d=>{dialogs.push(d.type());d.accept()});
    assert.equal((await page.goto(url('slovnicek/index.html'))).status(),200);
    const previous=oldWord('cosmic orbit','kosmická dráha');
    const local=oldWord('meteor trail','stopa meteoru');
    await seedLegacy(page,previous);
    await page.evaluate(([key,word])=>localStorage.setItem(key,JSON.stringify([word])),
     ['reading-lab-vocabulary-fallback-v1',local]);
    const reading=url('cteni/asteroids/index.html?practice=1&lang=en&level=B2');
    assert.equal((await page.goto(reading)).status(),200);
    await page.waitForFunction(()=>/My Vocabulary \(2\)/.test(
     document.querySelector('a.lsh-vocab-nav')?.textContent||''),null,{timeout:15000});
    assert.equal(await page.locator('a.lsh-vocab-nav').count(),1);
    assert.equal(await page.locator('#lookup .lsh-vocab-save').count(),1);
    assert.equal(await page.locator('#rl-vocab-button, #rl-vocab-add').count(),0);
    assert.equal(await page.evaluate(()=>typeof window.ReadingLabVocab),'undefined');
    const oldCount=await page.evaluate(()=>new Promise((resolve,reject)=>{
     const req=indexedDB.open('reading-lab-vocabulary');
     req.onsuccess=()=>{
      const db=req.result,read=db.transaction('words').objectStore('words').count();
      read.onsuccess=()=>{db.close();resolve(read.result)};
      read.onerror=()=>{db.close();reject(read.error)};
     };
     req.onerror=()=>reject(req.error);
    }));
    assert.equal(oldCount,1,'Old words must not be deleted from original database');
    // Open dictionary from genuine original text, not injected test buttons.
    await page.locator('#readingBody p').first().dblclick({position:{x:95,y:18}});
    await page.locator('#lookup:not([hidden])').waitFor({timeout:12000});
    const word=(await page.locator('#lookupWord').textContent()).trim();
    assert.ok(word,'Could not select a Reading term');
    const input=page.locator('#lsh-vocab-reading-meaning');
    await input.fill('ověřený význam z Reading Labu');
    await page.locator('#lookup .lsh-vocab-save').click();
    await page.waitForFunction(()=>/My Vocabulary \(3\)/.test(
     document.querySelector('a.lsh-vocab-nav')?.textContent||''),null,{timeout:15000});
    assert.match(await page.locator('#lookup .lsh-vocab-save').textContent(),/Uloženo/);
    await checkNoOverflow(page);
    await page.locator('a.lsh-vocab-nav').click();
    await page.locator('.word-row').nth(2).waitFor({timeout:12000});
    let words=await bankWords(page);
    assert.equal(words.length,3,'Old IDB, old fallback and new Reading save should be merged');
    assert.ok(words.some(x=>x.includes(previous.term)));
    assert.ok(words.some(x=>x.includes(local.term)));
    assert.ok(words.some(x=>x.includes(word)));
    const pending=page.waitForEvent('download');
    await page.locator('#exportBtn').click();
    const dl=await pending,buffer=fs.readFileSync(await dl.path());
    const payload=JSON.parse(buffer.toString('utf8'));
    assert.equal(payload.kind,'lsh-slovnicek');
    assert.equal(payload.words.length,3,'Canonical backup must contain all sources');
    await page.goto(reading);
    await page.waitForFunction(()=>/My Vocabulary \(3\)/.test(
     document.querySelector('a.lsh-vocab-nav')?.textContent||''),null,{timeout:12000});
    // Conversation and Listening open the same shared bank.
    for(const relative of ['konverzace/umela-inteligence/index.html','poslech/matthew-oscars/index.html']){
     await page.goto(url(relative+'?practice=1&lang=en&level=B2'));
     const sel=relative.startsWith('konverzace')?'#lshBridgeVocabularyLink':'a.lsh-vocab-nav';
     await page.waitForFunction(sel=>{
      const el=document.querySelector(sel);
      return el&&/\(3\)/.test(el.textContent);
     },sel,{timeout:12000});
    }
    // A second browser device/context starts empty, importing only via JSON file.
    const other=await browser.newContext({acceptDownloads:true});
    const dest=await other.newPage();
    dest.on('dialog',d=>d.accept());
    await dest.goto(url('slovnicek/index.html'));
    await dest.locator('#importFile').setInputFiles({name:'shared.json',
     mimeType:'application/json',buffer});
    await dest.locator('.word-row').nth(2).waitFor({timeout:15000});
    assert.equal((await bankWords(dest)).length,3);
    // Legacy JSON exports also import into the same bank.
    const backup=Buffer.from(JSON.stringify({kind:'reading-lab-vocabulary-backup',
     schemaVersion:1,exportedAt:'2026-11-11T00:00:00.000Z',
     vocabulary:[oldWord('comet','kometa','an-email-from-a-friend')]}));
    await dest.locator('#importFile').setInputFiles({name:'old-reading.json',
     mimeType:'application/json',buffer:backup});
    await dest.locator('.word-row').nth(3).waitFor({timeout:15000});
    assert.ok((await bankWords(dest)).some(x=>x.includes('comet')));
    assert.match(await dest.locator('#storageStatus').textContent(),/Import hotov/);
    assert.deepEqual(errors,[]);
    assert.ok(dialogs.every(x=>x==='confirm'),'No native prompt in unified Reading saving');
    await other.close();await ctx.close();
   }finally{await browser.close();}
 });
}
