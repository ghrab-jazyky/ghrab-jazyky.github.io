#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
function url(q){const u=new URL('self-check/test-banks/reading/preview.html',base);
 for(const [k,v]of Object.entries({topic:'rl-can-mistakes',lang:'en',level:'B2',timer:'20',
 attempt:'r35generictest',...q}))u.searchParams.set(k,v);
 return u.href;}
for(const [engineName,engine]of [['chromium',chromium],['webkit',webkit]]){
 test('R35 '+engineName+' generic loader works for checked-in B2 bank and preserves original content',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>d.accept());
   assert.equal((await page.goto(url({}))).status(),200);
   await page.locator('#sessionStart').waitFor({timeout:30000});
   assert.equal(await page.locator('#readingParagraphs p').count(),4);
   assert.match(await page.locator('#title').textContent(),/When Feedback Feels Like Failure/);
   assert.match(await page.locator('.mode').textContent(),/EN\/B2/);
   assert.equal(await page.locator('fieldset.question').count(),10);
   assert.equal(await page.locator('#results').isHidden(),true);
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   assert.equal(await page.locator('#resultDetails .review').count(),0);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test('R35 '+engineName+' missing authored bank never falls back to 18 practice questions',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url({topic:'rl-asteroids',level:'B2',attempt:'r35missingbank'}));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/Source HTTP 404/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.equal(await page.locator('fieldset.question').count(),0);
   assert.equal(await page.locator('#results').isHidden(),true);
   await page.goto(url({topic:'rl-can-mistakes',lang:'es',level:'B2',attempt:'r35spanishmissing'}));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/Source HTTP 404/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test('R35 '+engineName+' unsupported reading topic/language fails before accessing a question bank',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url({topic:'ll-harrison-ford',level:'B1',attempt:'r35badskill'}));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/unsupported by approved practice catalog/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   await page.goto(url({lang:'xx',attempt:'r35badlang'}));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/Unsupported independent test language/);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
