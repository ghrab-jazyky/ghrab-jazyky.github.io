#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,firefox,webkit}=require('playwright');
const entries=require('../data/cards.json').entries.filter(e=>['cteni','poslech'].includes(e.skill));
const base='http://127.0.0.1:8765/language-skills-hub/';
function url(e,level='B2',mode='test'){
 const u=new URL('self-check/practice-answers/teacher.html',base);
 for(const [k,v] of Object.entries({topic:e.id,skill:e.skill,lang:e.languages[0],level,mode}))
  u.searchParams.set(k,v);
 return u.href;
}
for(const [name,engine] of [['Chromium',chromium],['Firefox',firefox],['WebKit',webkit]]){
 test('Stage A '+name+': public key ignores mode=test and keeps practice PDF',{timeout:180000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   for(const e of entries){
    const response=await page.goto(url(e),{waitUntil:'load'});
    assert.equal(response.status(),200);
    await page.locator('#downloadPdf:enabled').waitFor({timeout:30000});
    assert.equal(await page.locator('#topicTitle').getAttribute('data-topic-id'),e.id);
    assert.equal(await page.locator('#answerMode').count(),0);
    assert.equal(new URL(page.url()).searchParams.get('mode'),'practice');
    assert.match(await page.locator('.preview-mode').innerText(),/PROCVIČOVACÍ VERZE/);
    assert.match(await page.locator('#downloadPdf').innerText(),/procvičování/);
    assert.ok(await page.locator('.key-item').count()>8);
    assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=3,e.id+' overflow');
   }
   const e=entries.find(e=>e.id==='ll-how-to-choose-your-news');
   await page.goto(url(e,'C1','test'),{waitUntil:'load'});
   await page.locator('#downloadPdf:enabled').waitFor({timeout:30000});
   const waiting=page.waitForEvent('download');
   await page.locator('#downloadPdf').click();
   const download=await waiting;
   assert.equal(download.suggestedFilename(),'lsh-vysledky-procvicovani-'+e.id+'-en-c1.pdf');
   const pdf=fs.readFileSync(await download.path());
   assert.equal(pdf.subarray(0,8).toString('ascii'),'%PDF-1.4');
   assert.ok(pdf.length>12000);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
