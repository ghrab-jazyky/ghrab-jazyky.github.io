#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const pageUrl='http://127.0.0.1:8765/language-skills-hub/slovnicek/index.html';
for(const [name,engine]of[['Chromium',chromium],['WebKit',webkit]]){
 test('R43 '+name+' create -> share JSON -> confirm external backup -> edit -> warning -> export; no network writes',{timeout:130000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({acceptDownloads:true,viewport:{width:390,height:844}});
   await context.addInitScript(()=>{
    Object.defineProperty(navigator,'canShare',{configurable:true,value:(x)=>Array.isArray(x?.files)&&x.files[0]?.name.endsWith('.json')});
    Object.defineProperty(navigator,'share',{configurable:true,value:async(data)=>{
     window.__lastSharedFile={name:data.files[0].name,text:await data.files[0].text()};
    }});
   });
   const page=await context.newPage(),errors=[],writes=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.url())});
   await page.goto(pageUrl);
   assert.equal(await page.locator('#backupSafety').count(),1);
   assert.equal(await page.locator('#shareBackupBtn').isVisible(),true);
   await page.locator('#addTerm').fill('apple');
   await page.locator('#addTranslation').fill('jablko');
   await page.locator('#addForm button[type=submit]').click();
   await page.waitForFunction(()=>document.querySelector('#backupSafety')?.dataset.backup==='missing');
   await page.locator('#shareBackupBtn').click();
   await page.locator('#confirmBackupBtn').waitFor({state:'visible'});
   const shared=await page.evaluate(()=>window.__lastSharedFile);
   assert.match(shared.name,/LSH-My-Vocabulary-.+\.json/);
   assert.equal(JSON.parse(shared.text).words[0].term,'apple');
   assert.equal(await page.locator('#backupSafety').getAttribute('data-backup'),'missing','share is NOT a confirmed save');
   await page.locator('#confirmBackupBtn').click();
   await page.waitForFunction(()=>document.querySelector('#backupSafety')?.dataset.backup==='ok');
   await page.locator('#addTerm').fill('book');
   await page.locator('#addTranslation').fill('kniha');
   await page.locator('#addForm button[type=submit]').click();
   await page.waitForFunction(()=>document.querySelector('#backupSafety')?.dataset.backup==='changed');
   const wait=page.waitForEvent('download');
   await page.locator('#exportBtn').click();
   const download=await wait;
   assert.match(download.suggestedFilename(),/\.json$/);
   await page.locator('#confirmBackupBtn').waitFor({state:'visible'});
   await page.locator('#confirmBackupBtn').click();
   await page.waitForFunction(()=>document.querySelector('#backupSafety')?.dataset.backup==='ok');
   await page.reload({waitUntil:'load'});
   await page.waitForFunction(()=>document.querySelector('#backupSafety')?.dataset.backup==='ok');
   assert.equal(await page.locator('.word-row').count(),2);
   assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
   await context.close();
  }finally{await browser.close()}
 });
}
