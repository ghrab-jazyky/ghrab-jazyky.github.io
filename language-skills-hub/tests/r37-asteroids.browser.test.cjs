#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..'),base='http://127.0.0.1:8765/language-skills-hub/';
const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
const banks=Object.fromEntries(LANGS.flatMap(lang=>LEVELS.map(level=>{
 const key=lang+'-'+level;
 return [key,JSON.parse(fs.readFileSync(path.join(root,
  'self-check/test-banks/reading/rl-asteroids/'+key+'.json'),'utf8'))];
})));
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('R37 '+name+' all 24 Asteroids test drafts render, score and show only the wrong item',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844}}),errors=[],writes=[];
   for(const lang of LANGS)for(const level of LEVELS){
    const page=await ctx.newPage();
    page.on('pageerror',e=>errors.push(lang+'/'+level+': '+e.message));
    page.on('dialog',d=>d.accept());
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method()+' '+r.url())});
    const url=new URL('self-check/test-banks/reading/preview.html',base);
    url.searchParams.set('topic','rl-asteroids');
    url.searchParams.set('lang',lang);
    url.searchParams.set('level',level);
    url.searchParams.set('timer','20');
    url.searchParams.set('attempt','r37'+lang+level.toLowerCase());
    assert.equal((await page.goto(url.href)).status(),200);
    await page.locator('#sessionStart').waitFor({timeout:30000});
    const bank=banks[lang+'-'+level];
    assert.equal(await page.locator('#title').textContent(),bank.sourceTitle,lang+'/'+level);
    assert.equal(await page.locator('html').getAttribute('lang'),lang);
    assert.equal(await page.locator('fieldset.question').count(),10);
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
    assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'1',lang+'/'+level);
    assert.equal(await page.locator('#submitButton').isDisabled(),true);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2,lang+'/'+level);
    await page.close();
   }
   assert.deepEqual(errors,[]);
   assert.deepEqual(writes,[]);
   await ctx.close();
  }finally{await browser.close()}
 });
}
