#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const hub='http://127.0.0.1:8765/language-skills-hub/';
const entries=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/cards.json'),'utf8')).entries
 .filter(x=>x.skill==='poslech'&&x.id!=='ll-sad');
assert.equal(entries.length,3);
const url=(e,clean=false,level='B2')=>new URL(
 (clean?e.relative.replace(/index\.html$/,''):(e.lockSource||e.relative))+
 '?practice=1&lang=en&level='+level,hub).href;
for(const [engine,browserType] of [['Chromium',chromium],['WebKit',webkit]]){
 test('R42 '+engine+' all 3 Listening cards: add arbitrary and suggested words to shared IndexedDB, clean URL and navigation',{timeout:250000},async()=>{
  const browser=await browserType.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const page=await context.newPage(),jsErrors=[],nativeDialogs=[];
   page.on('pageerror',e=>{
    // WebKit may emit this benign layout warning during responsive navigation.
    // Every actual application error still fails the test.
    if(/^ResizeObserver loop completed with undelivered notifications\.$/.test(e.message))return;
    jsErrors.push(e.message);
   });
   page.on('dialog',async dialog=>{nativeDialogs.push(dialog.type());await dialog.dismiss()});
   for(const e of entries){
    const slug=e.id,own='LSH '+slug+' '+engine;
    // Both catalog /index.html and direct /slug/ links must mount the bridge.
    for(const clean of [false,true]){
     const response=await page.goto(url(e,clean),{waitUntil:'load',timeout:45000});
     assert.equal(response.status(),200,slug+' route');
     await page.locator('.lsh-vocab-add-open').waitFor({state:'visible',timeout:12000});
     assert.equal(await page.locator('a.lsh-vocab-nav').count(),1);
     assert.equal((await page.locator('.lsh-vocab-add-open').textContent()).trim(),'＋ Přidat slovíčko');
    }
    const beforeLabel=await page.locator('a.lsh-vocab-nav').textContent();
    assert.ok(beforeLabel.includes('My Vocabulary ('),'Missing counter '+slug);
    await page.locator('.lsh-vocab-add-open').click();
    const popup=page.locator('#lsh-vocab-editor');
    await popup.waitFor({state:'visible'});
    // Manual add, no window.prompt popup (unlike previous implementation).
    assert.equal(await page.locator('#lsh-vocab-editor-term').inputValue(),'');
    await page.locator('.lsh-vocab-editor-submit').click();
    assert.match((await page.locator('#lsh-vocab-editor-status').textContent()),/Napiš anglické slovo/);
    await page.locator('#lsh-vocab-editor-term').fill(own);
    await page.locator('.lsh-vocab-editor-submit').click();
    assert.match((await page.locator('#lsh-vocab-editor-status').textContent()),/Napiš český význam/);
    await page.locator('#lsh-vocab-editor-meaning').fill('testovací překlad');
    await page.locator('.lsh-vocab-editor-submit').click();
    await popup.waitFor({state:'hidden',timeout:10000});
    await page.waitForFunction(()=>/My Vocabulary \([1-9][0-9]*\)/.test(
      document.querySelector('a.lsh-vocab-nav')?.textContent||''),null,{timeout:10000});
    const label=await page.locator('a.lsh-vocab-nav').textContent();
    // Existing entries from earlier cards survive moving to another card.
    assert.ok(Number(label.match(/\((\d+)\)/)?.[1])>=1,slug+' count');
    await page.locator('a.lsh-vocab-nav').click();
    assert.match(page.url(),/\/language-skills-hub\/slovnicek\/index\.html/);
    await page.locator('.word-row .word').first().waitFor({timeout:10000});
    let bank=await page.locator('.word-row .word').allTextContents();
    assert.ok(bank.some(x=>x.includes(own)),'Manual save not visible in shared bank '+slug);
    await page.goto(url(e,false),{waitUntil:'load'});
    await page.locator('#vocabTasks .vocab-line').first().waitFor({timeout:10000});
    const row=page.locator('#vocabTasks .vocab-line').first();
    const word=(await row.locator('strong').textContent()).trim();
    const rowBtn=row.locator('.lsh-vocab-save');
    await rowBtn.waitFor({state:'visible'});
    assert.equal((await rowBtn.textContent()).trim(),'＋ Uložit do My Vocabulary');
    await rowBtn.click();
    await popup.waitFor({state:'visible'});
    assert.equal((await page.locator('#lsh-vocab-editor-term').inputValue()).trim(),word,'Term not prefilled '+slug);
    await page.locator('#lsh-vocab-editor-meaning').fill('kontrolní význam');
    await page.locator('.lsh-vocab-editor-submit').click();
    await popup.waitFor({state:'hidden'});
    assert.match(await row.locator('.lsh-vocab-row-status').textContent(),/Uloženo do My Vocabulary/);
    await page.locator('a.lsh-vocab-nav').click();
    await page.locator('.word-row .word').first().waitFor();
    bank=await page.locator('.word-row .word').allTextContents();
    assert.ok(bank.some(x=>x.includes(own)), 'Manual word vanished '+slug);
    assert.ok(bank.some(x=>x.includes(word)), 'Recommended word not persisted '+slug);
    // Dynamic CEFR re-render must keep save controls.
    await page.goto(url(e,false,'A1'),{waitUntil:'load'});
    await page.locator('#vocabTasks .vocab-line').first().waitFor();
    await page.locator('#vocabTasks .lsh-vocab-save').first().waitFor({state:'visible'});
    const width=await page.evaluate(()=>({
      doc:document.documentElement.scrollWidth,win:innerWidth,
      dialog:document.getElementById('lsh-vocab-editor').getBoundingClientRect().width
    }));
    assert.ok(width.dialog<=width.win,slug+' dialog exceeds phone screen');
    console.log('PASS LISTENING SAVE',engine,slug,'clean URL, direct entry, row entry, bank persistence, A1',bank.length);
   }
   assert.deepEqual(nativeDialogs,[],'Unexpected native prompt/alert');
   assert.deepEqual(jsErrors,[],'Uncaught JS errors');
  }finally{await browser.close()}
 });
}
