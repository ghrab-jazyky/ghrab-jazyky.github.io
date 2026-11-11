#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
for(const [browserName,engine]of[['chromium',chromium],['webkit',webkit]]){
 test('R40 '+browserName+': cross-card persistent vocabulary, games and JSON transfer',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:390,height:800}});
   const page=await ctx.newPage(),errors=[],networkWrites=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))networkWrites.push(r.method()+' '+r.url())});
   const nav=async url=>{const response=await page.goto(new URL(url,base).href,{waitUntil:'load',timeout:45000});assert.equal(response.status(),200)};
   await nav('slovnicek/index.html');
   await page.locator('#addTerm').fill('apple');
   await page.locator('#addTranslation').fill('jablko');
   await page.locator('#addForm button[type=submit]').click();
   await page.locator('.word-row').first().waitFor();
   await page.locator('#addTerm').fill('pear');
   await page.locator('#addTranslation').fill('hruška');
   await page.locator('#addForm button[type=submit]').click();
   await page.locator('.word-row').nth(1).waitFor();
   assert.equal(await page.locator('.word-row').count(),2);
   const dbName=await page.evaluate(()=>window.indexedDB.databases().then(d=>d.map(x=>x.name)));
   assert.ok(dbName.includes('lsh'));
   // Conversation, Reading and Listening should all link into this same origin store.
   for(const card of [
    'konverzace/umela-inteligence/index.html',
    'cteni/asteroids/index.html',
    'poslech/matthew-oscars/index.html'
   ]){
    await nav(card);
    const link=page.locator('a').filter({hasText:'My Vocabulary'}).first();
    await link.waitFor({timeout:20000});
    assert.match(await link.getAttribute('href'),/slovnicek/);
    assert.match(await link.textContent(),/\(2\)/);
   }
   await nav('slovnicek/index.html');
   assert.equal(await page.locator('.word-row').count(),2);
   await page.locator('#selectAll').click();
   await page.locator('[data-mode=flash]').click();
   assert.match(await page.locator('#practiceStatus').textContent(),/Kartička 1 \/ 2/);
   await page.getByRole('button',{name:'Ukázat překlad'}).click();
   await page.getByRole('button',{name:'Umím',exact:true}).click();
   await page.locator('[data-mode=choice]').click();
   assert.match(await page.locator('#game h3').textContent(),/Co znamená/);
   await page.locator('[data-mode=match]').click();
   assert.equal(await page.locator('.match-grid button').count(),4);
   await page.locator('[data-mode=test]').click();
   for(const value of ['JABLKO','HRUSKA']){
    const term=await page.locator('#game h3').textContent();
    const answer=/apple/.test(term)?'JABLKO':'HRUSKA';
    await page.locator('#game input[type=text]').fill(answer);
    await page.locator('#game .controls button').last().click();
    if(value==='HRUSKA')break;
   }
   assert.match(await page.locator('#game h3').textContent(),/Výsledek: 2 \/ 2/);
   const download=page.waitForEvent('download',{timeout:15000});
   await page.locator('#exportBtn').click();
   const dl=await download,bytes=fs.readFileSync(await dl.path()),body=JSON.parse(bytes.toString('utf8'));
   assert.equal(body.kind,'lsh-slovnicek');assert.equal(body.words.length,2);
   await page.reload({waitUntil:'load'});
   assert.equal(await page.locator('.word-row').count(),2);
   // Import into an independent browser context simulates transfer to a second device.
   const second=await browser.newContext({acceptDownloads:true});
   const dest=await second.newPage();
   dest.on('dialog',dialog=>dialog.accept());
   await dest.goto(new URL('slovnicek/index.html',base).href);
   await dest.locator('#importFile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:bytes});
   await dest.locator('.word-row').nth(1).waitFor({timeout:15000});
   assert.equal(await dest.locator('.word-row').count(),2);
   await dest.reload({waitUntil:'load'});
   assert.equal(await dest.locator('.word-row').count(),2);
   // Check that import rejects malformed content and keeps existing words unchanged.
   await dest.locator('#importFile').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{}')});
   assert.match(await dest.locator('#storageStatus').textContent(),/Import odmítnut/);
   assert.equal(await dest.locator('.word-row').count(),2);
   assert.deepEqual(errors,[]);
   assert.deepEqual(networkWrites,[]);
   await second.close();
  }finally{await browser.close()}
 });
}
