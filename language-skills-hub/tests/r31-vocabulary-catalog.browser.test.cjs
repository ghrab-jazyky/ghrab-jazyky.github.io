#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path'),{chromium}=require('playwright');
const ROOT='http://127.0.0.1:8765/language-skills-hub/';
const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/cards.json'),'utf8'));
const cards=catalog.entries.filter(item=>item.skill==='konverzace');
test('All 21 production Conversation cards expose working shared vocabulary navigation',{timeout:180000},async()=>{
 assert.equal(cards.length,21,'Card count changed: update coverage intentionally');
 const browser=await chromium.launch({headless:true});
 let context;
 try{
  context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  const exceptions=[];
  page.on('pageerror',e=>exceptions.push(page.url()+': '+e.message));
  for(let i=0;i<cards.length;i++){
   const card=cards[i],url=ROOT+card.relative;
   const response=await page.goto(url,{waitUntil:'domcontentloaded'});
   assert.ok(response&&response.ok(),'Missing '+card.id+' '+url);
   await page.locator('#lshBridgeVocabularyLink').waitFor({state:'visible',timeout:14000});
   const vocabUrl=await page.locator('#lshBridgeVocabularyLink').getAttribute('href');
   const absolute=new URL(vocabUrl,page.url());
   assert.equal(absolute.pathname,'/language-skills-hub/slovnicek/','Broken vocabulary URL: '+card.id);
   assert.equal(absolute.searchParams.get('zpet'),new URL(url).pathname,'Broken return URL: '+card.id);
   if(i===0){
    await page.waitForFunction(()=>document.querySelector('#vocabGrid .lsh-bridge-save')!==null);
    await page.locator('#vocabGrid .lsh-bridge-save').first().click();
    await page.waitForFunction(()=>document.querySelector('#lshBridgeVocabularyLink')?.textContent?.includes('(1)'));
   }
   if(i===1){
    await page.waitForFunction(()=>document.querySelector('#lshBridgeVocabularyLink')?.textContent?.includes('(1)'));
   }
  }
  assert.deepEqual(exceptions,[],'Conversation card JS exceptions');
 }finally{
  if(context)await context.close();
  await browser.close();
 }
});
