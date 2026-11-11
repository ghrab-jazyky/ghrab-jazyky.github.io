#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
const cards=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8')).entries;
const base='http://127.0.0.1:8765/language-skills-hub/';
const url=e=>new URL(e.relative+'?practice=1&lang=en&level=B1&zamek=1',base).href;

async function convoCheck(page,e){
 const errors=[]; const report=err=>errors.push(err.message);
 page.on('pageerror',report);
 await page.goto(url(e),{waitUntil:'load',timeout:45000});
 await page.locator('#lshBridgeSavePopup').waitFor({timeout:10000});
 const w=page.locator('#vocabGrid .vocab-item b').first();
 await w.waitFor({timeout:10000});
 await w.dblclick();
 await page.locator('#lookupPopover:visible').waitFor({timeout:7000});
 const info=await page.evaluate(()=>{
  const pop=document.getElementById('lookupPopover');
  const expression=document.getElementById('lookupExpression');
  const meaning=document.getElementById('lookupTranslation');
  return {
   popup:pop.hidden,expression:expression?.textContent?.trim(),
   meaning:meaning?.textContent?.trim(),save:document.getElementById('lshBridgeSavePopup')?.textContent?.trim(),
   computedDisplay:getComputedStyle(pop).display,
   computedColor:getComputedStyle(expression).color,
   computedBackground:getComputedStyle(pop).backgroundColor
  };
 });
 assert.ok(info.expression,'Empty selected expression: '+JSON.stringify(info));
 assert.ok(info.meaning,'Empty dictionary meaning: '+JSON.stringify(info));
 assert.ok(info.save,'Empty save action: '+JSON.stringify(info));
 assert.equal(info.popup,false);
 assert.notEqual(info.computedDisplay,'none');
 assert.deepEqual(errors,[],'Uncaught JS errors '+e.id);
 page.off('pageerror',report);
 console.log('PASS CONVERSATION',e.id,info.expression,'=>',info.meaning.slice(0,60));
}

async function readingCheck(page,e){
 const errors=[];const report=err=>errors.push(err.message);page.on('pageerror',report);
 await page.goto(url(e),{waitUntil:'load',timeout:45000});
 await page.locator('#lookup').waitFor();
 await page.locator('#readingBody p').first().waitFor({timeout:10000});
 await page.locator('#readingBody p').first().dblclick({position:{x:32,y:13}});
 await page.locator('#lookup:visible').waitFor({timeout:7000});
 const word=(await page.locator('#lookupWord').textContent()||'').trim();
 const meaning=(await page.locator('#lookupMeaning').textContent()||'').trim();
 const shared=await page.locator('a.lsh-vocab-nav').count();
 const duplicate=await page.locator('#rl-vocab-button').count();
 assert.ok(word,'Reading popup word blank '+e.id);
 assert.ok(meaning,'Reading popup meaning blank '+e.id);
 assert.equal(shared,1,'Unified vocabulary link missing '+e.id);
 console.log('READING',e.id,word,meaning.slice(0,60),'legacyManager',duplicate);
 assert.deepEqual(errors,[],'Uncaught JS errors '+e.id);
 page.off('pageerror',report);
}

for(const [name,browserType] of [['Chromium',chromium],['WebKit',webkit]]){
 test('R41 '+name+' all 21 Conversation dictionary popovers show actual data', {timeout:900000}, async()=>{
  const browser=await browserType.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
   const page=await ctx.newPage();
   const failures=[];
   for(const e of cards.filter(e=>e.skill==='konverzace')){
    try{await convoCheck(page,e)}
    catch(err){failures.push(e.id+': '+String(err.message).slice(0,800));console.error('FAIL CONVERSATION',e.id,err.message.slice(0,1000))}
   }
   assert.deepEqual(failures,[],'Conversation dictionary errors');
  }finally{await browser.close()}
 });
 test('R41 '+name+' all 5 Reading dictionary popovers show actual data', {timeout:400000},async()=>{
  const browser=await browserType.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1280,height:900}});
   const failures=[];
   for(const e of cards.filter(e=>e.skill==='cteni')){
    try{await readingCheck(page,e)}catch(err){failures.push(e.id+': '+String(err.message).slice(0,800));console.error('FAIL READING',e.id,err.message.slice(0,1000))}
   }
   assert.deepEqual(failures,[],'Reading dictionary errors');
  }finally{await browser.close()}
 });
}
