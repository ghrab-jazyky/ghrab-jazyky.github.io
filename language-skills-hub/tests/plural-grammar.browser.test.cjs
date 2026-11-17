#!/usr/bin/env node
'use strict';
// Actual HTTP-hosted LSH browser integration; no deployment, no grades, no PII.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const BASE='http://127.0.0.1:8765/language-skills-hub/';
const link=(part,query='')=>new URL(part+query,BASE).href;

for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('Plural '+name+': catalog, teacher lock, language/CEFR, flip, EXTRA and responsive layout',
  {timeout:120000},async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage(),errors=[],csp=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error'&&/Content Security Policy|Refused to/i.test(m.text()))csp.push(m.text())});
    const catalog=await page.goto(link('index.html','?skill=konverzace&lang=es&level=B2'),{waitUntil:'load'});
    assert.equal(catalog.status(),200);
    const item=page.locator('#cards .card[data-topic-id="cl-plural"]');
    await item.waitFor({state:'visible',timeout:20000});
    assert.match(await item.locator('.catalog-variant').innerText(),/ES · B2/);
    const href=await item.locator('a.action.primary').getAttribute('href');
    const target=new URL(href,BASE);
    for(const [key,value] of [['practice','1'],['lang','es'],['level','B2'],['zamek','1']])
     assert.equal(target.searchParams.get(key),value,key);
    assert.match(target.pathname,/konverzace\/plural\/index\.html$/);
    assert.equal((await page.goto(target.href,{waitUntil:'load'})).status(),200);
    await page.locator('#cardsGrid .flip').first().waitFor({timeout:15000});
    assert.equal(await page.locator('#languageSelect').inputValue(),'es');
    assert.equal(await page.locator('#languageSelect').isDisabled(),true);
    assert.equal(await page.locator('#levelSwitch button[data-level="B2"].active').count(),1);
    assert.ok((await page.locator('#levelSwitch button[data-level]').evaluateAll(a=>a.every(x=>x.disabled))));
    assert.equal(await page.locator('#cardsGrid .flip').count(),10);
    assert.ok((await page.locator('#grammarTaskText').innerText()).trim().length>15);
    await page.locator('#cardsGrid .flip').first().click();
    assert.equal(await page.locator('#cardsGrid .flip').first().getAttribute('aria-pressed'),'true');
    await page.locator('#extraBtn').click();
    assert.equal(await page.locator('#extraReveal').isVisible(),true);
    assert.equal(await page.locator('#extraList .flip').count(),3);
    assert.ok((await page.locator('#lshBridgeVocabularyLink').innerText()).length>3);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(overflow<=3,'Horizontal overflow '+overflow);
    assert.deepEqual(csp,[],'CSP errors');
    assert.deepEqual(errors,[],'Browser errors');
    await context.close();
   }finally{await browser.close()}
 });
 test('Plural '+name+': save a singular lemma via real bridge; IndexedDB survives reload',
  {timeout:120000},async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:1280,height:850}});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const url=link('konverzace/plural/index.html','?practice=1&lang=de&level=A1');
    assert.equal((await page.goto(url,{waitUntil:'load'})).status(),200);
    await page.locator('#lshBridgeVocabularyLink').waitFor({state:'visible',timeout:20000});
    const first=page.locator('#vocabGrid .vocab-item').first();
    const singular=(await first.locator('b').innerText()).trim();
    const plural=(await first.locator('.plural-form').innerText()).trim();
    assert.ok(singular.length>3);
    assert.match(plural,/→/);
    assert.ok(!singular.includes('→'),'Do not save a composite singular/plural lemma');
    await first.locator('.lsh-bridge-save').click();
    await page.waitForFunction(()=>{
     const label=document.querySelector('#lshBridgeVocabularyLink')?.textContent||'';
     return /\(1\)/.test(label);
    },null,{timeout:20000});
    const dbStores=await page.evaluate(()=>new Promise((resolve,reject)=>{
     const req=indexedDB.open('lsh');
     req.onsuccess=()=>{const stores=Array.from(req.result.objectStoreNames);req.result.close();resolve(stores)};
     req.onerror=()=>reject(req.error);
    }));
    assert.ok(dbStores.includes('words'),'Expected persistent canonical IndexedDB words store');
    await page.reload({waitUntil:'load'});
    await page.waitForFunction(()=>/\(1\)/.test(
     document.querySelector('#lshBridgeVocabularyLink')?.textContent||''),null,{timeout:20000});
    const nav=await page.locator('#lshBridgeVocabularyLink').getAttribute('href');
    assert.match(nav,/slovnicek/);
    assert.equal((await page.goto(new URL(nav,page.url()).href,{waitUntil:'load'})).status(),200);
    await page.locator('.word-row .word').first().waitFor({timeout:20000});
    const words=await page.locator('.word-row .word').allTextContents();
    assert.ok(words.some(x=>x.trim()===singular),'Saved singular should be visible in shared vocabulary');
    assert.ok(words.every(x=>!x.includes('→')),'Never save composite plural on any word row');
    assert.deepEqual(errors,[],'Browser errors');
    await context.close();
   }finally{await browser.close()}
 });
 test('Plural '+name+': only valid fixed presets lock language/level; DE ES FR available',
  {timeout:120000},async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    for(const [lang,level] of [['fr','C2'],['de','A1'],['es','B1']]){
     const u=link('konverzace/plural/index.html','?practice=1&lang='+lang+'&level='+level);
     assert.equal((await page.goto(u,{waitUntil:'load'})).status(),200);
     await page.locator('#cardsGrid .flip').first().waitFor();
     assert.equal(await page.locator('#languageSelect').inputValue(),lang);
     assert.equal(await page.locator('#levelSwitch button[data-level="'+level+'"].active').count(),1);
     assert.equal(await page.locator('#languageSelect').isDisabled(),false);
     assert.equal(await page.locator('#cardsGrid .flip').count(),10);
     assert.equal(await page.locator('#extraList .flip').count(),3);
     assert.equal(await page.locator('#extraReveal').isVisible(),false);
    }
    // English is unsupported here; a malformed teacher preset must NOT get a misleading lock.
    await page.evaluate(()=>localStorage.clear());
    const invalid=link('konverzace/plural/index.html','?practice=1&lang=en&level=B2&zamek=1');
    assert.equal((await page.goto(invalid,{waitUntil:'load'})).status(),200);
    assert.equal(await page.locator('#languageSelect').isDisabled(),false);
    assert.equal(await page.locator('#languageSelect').inputValue(),'de');
    assert.deepEqual(errors,[]);
   }finally{await browser.close()}
 });
}
