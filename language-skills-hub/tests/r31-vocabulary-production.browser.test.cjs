#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const ROOT='http://127.0.0.1:8765/language-skills-hub/';

for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('R31 production vocabulary: card save, isolated store, return, reload, export and import in '+name,
 {timeout:180000},async()=>{
  const browser=await engine.launch({headless:true});
  let context;
  try{
   context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   const page=await context.newPage(),errors=[],uploads=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))uploads.push(r.method())});
   page.on('dialog',d=>d.accept());
   const card=ROOT+'konverzace/ceny-nemovitosti/index.html';
   const response=await page.goto(card,{waitUntil:'domcontentloaded'});
   assert.ok(response&&response.ok(),'Production Conversation card not available');
   await page.locator('#lshBridgeVocabularyLink').waitFor({state:'visible',timeout:20000});
   await page.waitForFunction(()=>document.querySelectorAll('#vocabGrid .vocab-item .lsh-bridge-save').length>0);
   const term=(await page.locator('#vocabGrid .vocab-item b').first().textContent()).trim();
   // Pre-existing staging data must survive unchanged, never silently migrate.
   await page.evaluate(async()=>{
    const stage=window.LSH_STORE.createStore({mode:'staging'});
    await stage.open();
    await stage.addManualWord({language:'es',term:'isolated staging word',
      translationCs:'jen testovací databáze',level:'A2'});
    stage.close();
   });
   await page.locator('#vocabGrid .vocab-item .lsh-bridge-save').first().click();
   await page.waitForFunction(()=>document.querySelector('#lshBridgeVocabularyLink')?.textContent?.includes('(1)'));
   const stageCount=await page.evaluate(async()=>{
    const stage=window.LSH_STORE.createStore({mode:'staging'});
    await stage.open();
    const count=(await stage.listWords()).length;stage.close();return count;
   });
   assert.equal(stageCount,1,'Production modified the existing staging database!');
   await page.locator('#lshBridgeVocabularyLink').click();
   await page.waitForURL('**/language-skills-hub/slovnicek/**');
   await page.waitForFunction(()=>document.querySelector('#wordCount')?.textContent==='1');
   const recovery=page.locator('details.vocab-recovery');
   await recovery.locator('summary').click();
   assert.equal(await recovery.locator('a').getAttribute('href'),'../../zkusebni/slovnicek/');
   assert.ok(await recovery.getByText('Export JSON').isVisible());
   // Independent of the markup: the storage configured on this page is production.
   assert.equal(await page.evaluate(()=>window.LSH_CONFIG.mode),'production');
   await page.locator('#backToCard').waitFor({state:'visible',timeout:10000});
   assert.match(await page.locator('#backToCard').getAttribute('href'),/ceny-nemovitosti\/index\.html$/);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#wordCount')?.textContent==='1');
   // Responsive safety: no horizontal clipping on phone, tablet or desktop.
   for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:850});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert.ok(overflow<=2,'Horizontal overflow at '+width+'px: '+overflow);
   }
   await page.setViewportSize({width:390,height:844});
   const downloadEvent=page.waitForEvent('download',{timeout:12000});
   await page.locator('#exportBtn').click();
   const download=await downloadEvent;
   const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
   assert.equal(backup.kind,'lsh-slovnicek');
   assert.equal(backup.words.length,1);
   assert.equal(backup.words[0].term,term);
   await page.locator('#wordList').getByRole('button',{name:'Smazat'}).first().click();
   await page.waitForFunction(()=>document.querySelector('#wordCount')?.textContent==='0');
   await page.locator('#importFile').setInputFiles({
    name:'lsh-backup.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(backup),'utf8')
   });
   await page.waitForFunction(()=>document.querySelector('#wordCount')?.textContent==='1');
   await page.locator('#backToCard').click();
   await page.waitForURL('**/konverzace/ceny-nemovitosti/index.html');
   await page.waitForFunction(()=>document.querySelector('#lshBridgeVocabularyLink')?.textContent?.includes('(1)'));
   // An untrusted zpet URL may not turn the vocabulary into an open redirect.
   await page.goto(ROOT+'slovnicek/?zpet='+encodeURIComponent('https://example.org/steal'),{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#wordCount')?.textContent==='1');
   assert.equal(await page.locator('#backToCard').isVisible(),false,'External return URL was accepted');
   assert.deepEqual(errors,[],'Unexpected JS errors: '+errors.join('; '));
   assert.deepEqual(uploads,[],'Unexpected uploads from local vocabulary!');
  }finally{
   if(context)await context.close();
   await browser.close();
  }
 });
}
