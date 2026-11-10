#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 test('R39 '+name+' editor opens an isolated Reading draft with a custom 25-minute timer',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   assert.equal((await page.goto(new URL('self-check/test-banks/index.html',base).href)).status(),200);
   await page.locator('#stats .r39-stat').first().waitFor({timeout:30000});
   assert.equal(await page.locator('#stats .r39-stat').count(),4);
   assert.match(await page.locator('body').textContent(),/138 VARIANT/);
   await page.locator('#topic').selectOption('rl-email-friend');
   await page.locator('#language').selectOption('es');
   await page.locator('#level').selectOption('A1');
   await page.locator('#timer').fill('25');
   await page.waitForFunction(()=>document.querySelector('#previewLink')?.getAttribute('aria-disabled')==='false');
   const href=await page.locator('#previewLink').getAttribute('href'),url=new URL(href);
   assert.equal(url.searchParams.get('topic'),'rl-email-friend');
   assert.equal(url.searchParams.get('lang'),'es');
   assert.equal(url.searchParams.get('level'),'A1');
   assert.equal(url.searchParams.get('timer'),'25');
   assert.match(url.searchParams.get('attempt'),/^r37qa[a-z0-9]+$/i);
   assert.match(await page.locator('#variantStatus').textContent(),/schválení/);
   const pilot=await context.newPage();pilot.on('pageerror',e=>errors.push(e.message));
   assert.equal((await pilot.goto(href)).status(),200);
   await pilot.locator('#sessionIntro:not([hidden])').waitFor({timeout:30000});
   assert.equal(await pilot.locator('fieldset.question').count(),10);
   assert.match(await pilot.locator('.subtitle').textContent(),/25 minutes/);
   await pilot.locator('#sessionStart').click();
   assert.match(await pilot.locator('#timeRemaining').textContent(),/2[45]:[0-5][0-9]/);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test('R39 '+name+' Listening teacher selector rejects unsupported language and enables a 30-minute draft',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(new URL('self-check/test-banks/index.html',base).href);
   await page.locator('#stats .r39-stat').first().waitFor({timeout:30000});
   await page.locator('#skill').selectOption('listening');
   assert.equal(await page.locator('#language').isDisabled(),true);
   assert.equal(await page.locator('#language').inputValue(),'en');
   await page.locator('#topic').selectOption('ll-harrison-ford');
   await page.locator('#level').selectOption('B2');
   await page.locator('#timer').fill('30');
   await page.waitForFunction(()=>document.querySelector('#previewLink')?.getAttribute('aria-disabled')==='false');
   const href=await page.locator('#previewLink').getAttribute('href'),url=new URL(href);
   assert.equal(url.searchParams.get('topic'),'ll-harrison-ford');
   assert.equal(url.searchParams.get('lang'),'en');
   assert.equal(url.searchParams.get('level'),'B2');
   assert.equal(url.searchParams.get('timer'),'30');
   const pilot=await context.newPage();pilot.on('pageerror',e=>errors.push(e.message));
   assert.equal((await pilot.goto(href)).status(),200);
   await pilot.locator('#sessionStart').waitFor({timeout:30000});
   assert.match(await pilot.locator('.subtitle').textContent(),/30 minutes/);
   await pilot.locator('#sessionStart').click();
   await pilot.locator('#workspace:not([hidden])').waitFor();
   await page.locator('#timer').fill('121');
   assert.equal(await page.locator('#copyLink').isDisabled(),true);
   assert.equal(await page.locator('#previewLink').getAttribute('aria-disabled'),'true');
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
