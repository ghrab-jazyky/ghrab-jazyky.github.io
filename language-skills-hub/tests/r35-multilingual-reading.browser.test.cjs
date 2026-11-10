#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..'),base='http://127.0.0.1:8765/language-skills-hub/';
const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
const banks=Object.fromEntries(LANGS.flatMap(lang=>LEVELS.map(level=>{
 const name=lang+'-'+level;
 return [name,JSON.parse(fs.readFileSync(path.join(root,
  'self-check/test-banks/reading/rl-can-mistakes/'+name+'.json'),'utf8'))];
})));
for(const [engineName,engine]of [['chromium',chromium],['webkit',webkit]]){
 test('R35 '+engineName+' 24 authored Reading variants use correct local sources and wrong-only feedback',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}}),errors=[],writes=[];
   for(const lang of LANGS)for(const level of LEVELS){
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(lang+'/'+level+':'+e.message));
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method()+' '+r.url())});
    page.on('dialog',d=>d.accept());
    const url=new URL('self-check/test-banks/reading/preview.html',base);
    url.searchParams.set('topic','rl-can-mistakes');
    url.searchParams.set('lang',lang);
    url.searchParams.set('level',level);
    url.searchParams.set('timer','20');
    url.searchParams.set('attempt','r35qa'+lang+level.toLowerCase());
    assert.equal((await page.goto(url.href)).status(),200);
    await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:30000});
    const bank=banks[lang+'-'+level];
    assert.equal(await page.locator('fieldset.question').count(),10,lang+'/'+level);
    assert.equal(await page.locator('html').getAttribute('lang'),lang);
    assert.equal(await page.locator('#title').textContent(),bank.sourceTitle);
    assert.ok((await page.locator('.mode').textContent()).includes(lang.toUpperCase()+'/'+level));
    assert.equal(await page.locator('#results').isHidden(),true);
    await page.locator('#sessionStart').click();
    await page.locator('#workspace:not([hidden])').waitFor();
    for(let i=0;i<bank.questions.length;i++){
     const q=bank.questions[i],idx=i===0?(q.answer+1)%4:q.answer;
     await page.locator('fieldset.question').nth(i).locator('input').nth(idx).check();
    }
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    assert.equal(await page.locator('#resultDetails article.review').count(),1,lang+'/'+level);
    assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'1');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)<=2,
     lang+'/'+level+' must have no horizontal overflow');
    await page.close();
   }
   assert.deepEqual(errors,[]);
   assert.deepEqual(writes,[]);
   await context.close();
  }finally{await browser.close()}
 });
}
