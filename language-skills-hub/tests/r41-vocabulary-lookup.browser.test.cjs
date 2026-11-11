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
 await page.locator('#lshBridgeSavePopup').waitFor({state:'attached',timeout:10000});
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
 assert.equal(info.save,'Save to My Vocabulary','Initial save button label blank: '+e.id);
 assert.equal(info.popup,false);
 assert.notEqual(info.computedDisplay,'none');
 await page.locator('#lshBridgeSavePopup').click();
 await page.waitForFunction(()=>
  document.querySelector('.lsh-bridge-popstatus')?.textContent?.includes('Saved in this browser.'),null,{timeout:10000});
 const navLabel=(await page.locator('#lshBridgeVocabularyLink').textContent()||'').trim();
 assert.match(navLabel,/My Vocabulary \([1-9][0-9]*\)/,'Save not reflected in shared bank '+e.id);
 assert.deepEqual(errors,[],'Uncaught JS errors '+e.id);
 page.off('pageerror',report);
 console.log('PASS CONVERSATION',e.id,info.expression,'=>',info.meaning.slice(0,60));
}

async function readingCheck(page,e){
 const errors=[];const report=err=>errors.push(err.message);page.on('pageerror',report);
 await page.goto(url(e),{waitUntil:'load',timeout:45000});
 await page.locator('#lookup').waitFor({state:'attached'});
 await page.locator('#readingBody p').first().waitFor({timeout:10000});
 // Two Reading cards intentionally start with their optional dictionary OFF.
 // Exercise the student's explicit toggle before a word lookup.
 if((await page.locator('#dictionaryToggle').getAttribute('aria-pressed'))!=='true')
  await page.locator('#dictionaryToggle').click();
 await page.locator('#readingBody p').first().dblclick({position:{x:32,y:13}});
 await page.locator('#lookup:visible').waitFor({timeout:7000});
 const word=(await page.locator('#lookupWord').textContent()||'').trim();
 const meaning=(await page.locator('#lookupMeaning').textContent()||'').trim();
 const shared=await page.locator('a.lsh-vocab-nav').count();
 const duplicate=await page.locator('#rl-vocab-button').count();
 assert.ok(word,'Reading popup word blank '+e.id);
 assert.ok(meaning,'Reading popup meaning blank '+e.id);
 assert.equal(shared,1,'Unified vocabulary link missing '+e.id);
 const save=page.locator('#lookup .lsh-vocab-save');
 assert.equal(await save.count(),1,'Reading popup shared save button missing '+e.id);
 assert.match((await save.textContent()||'').trim(),/Přidat do My Vocabulary/);
 console.log('READING',e.id,word,meaning.slice(0,60),'legacyManager',duplicate);
 assert.deepEqual(errors,[],'Uncaught JS errors '+e.id);
 page.off('pageerror',report);
}

async function listeningCheck(page,e){
 const errors=[]; const report=err=>errors.push(err.message);
 page.on('pageerror',report);
 await page.goto(url(e),{waitUntil:'load',timeout:45000});
 await page.locator('#vocabTasks .vocab-line').first().waitFor({timeout:12000});
 const save=page.locator('#vocabTasks .lsh-vocab-save').first();
 await save.waitFor({timeout:10000});
 assert.equal(await page.locator('a.lsh-vocab-nav').count(),1,'Listening link missing '+e.id);
 assert.equal((await save.textContent()||'').trim(),'＋ My Vocabulary','Listening save button blank '+e.id);
 page.once('dialog',dialog=>dialog.accept('testovací význam'));
 await save.click();
 await page.waitForFunction(()=>
  document.querySelector('.lsh-vocab-message')?.textContent?.includes('Slovíčko uloženo do My Vocabulary.'),null,{timeout:10000});
 assert.deepEqual(errors,[],'Uncaught JS errors '+e.id);
 page.off('pageerror',report);
 console.log('PASS LISTENING',e.id);
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
 test('R41 '+name+' all 3 Listening cards have readable save controls and persistent words',{timeout:200000},async()=>{
  const browser=await browserType.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1280,height:900}});
   const failures=[];
   for(const e of cards.filter(e=>e.skill==='poslech')){
    try{await listeningCheck(page,e)}
    catch(err){failures.push(e.id+': '+String(err.message).slice(0,800));console.error('FAIL LISTENING',e.id,err.message.slice(0,1000))}
   }
   assert.deepEqual(failures,[],'Listening vocabulary errors');
  }finally{await browser.close()}
 });
 test('R41 '+name+' Housing Prices B2 reproduces original blank button screenshot on desktop and mobile',{timeout:180000},async()=>{
  const browser=await browserType.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   for(const width of [1280,390]){
    await page.setViewportSize({width,height:844});
    await page.goto(new URL('konverzace/ceny-nemovitosti/index.html?practice=1&lang=en&level=B2',base).href,{waitUntil:'load'});
    await page.locator('#lshBridgeSavePopup').waitFor({state:'attached'});
    assert.equal((await page.locator('#lshBridgeSavePopup').textContent()||'').trim(),'Save to My Vocabulary');
    await page.locator('#mainQuestion').scrollIntoViewIfNeeded();
    const point=await page.evaluate(()=>{
     const parent=document.getElementById('mainQuestion');
     const walker=document.createTreeWalker(parent,NodeFilter.SHOW_TEXT);
     let node;
     while((node=walker.nextNode())){
      const i=node.textContent.toLowerCase().indexOf('affordable');
      if(i<0)continue;
      const r=document.createRange();r.setStart(node,i);r.setEnd(node,i+'affordable'.length);
      const rect=r.getBoundingClientRect();return {x:rect.x+rect.width/2,y:rect.y+rect.height/2};
     }
     return null;
    });
    assert.ok(point,'Housing Prices B2 question should contain affordable');
    await page.mouse.dblclick(point.x,point.y);
    await page.locator('#lookupPopover:visible').waitFor({timeout:7000});
    assert.equal((await page.locator('#lookupExpression').textContent()||'').trim().toLowerCase(),'affordable');
    assert.match((await page.locator('#lookupTranslation').textContent()||''),/cenově dostupný/);
    assert.equal((await page.locator('#lshBridgeSavePopup').textContent()||'').trim(),'Save to My Vocabulary');
    await page.locator('#lshBridgeSavePopup').click();
    await page.waitForFunction(()=>document.querySelector('.lsh-bridge-popstatus')?.textContent?.includes('Saved in this browser.'),null,{timeout:10000});
   }
   for(const [language,expected] of Object.entries({
    es:'Guardar en Mi vocabulario',
    de:'In meinem Wortschatz speichern',
    fr:'Enregistrer dans mon vocabulaire'
   })){
    await page.goto(new URL('konverzace/ceny-nemovitosti/index.html?practice=1&lang='+language+'&level=B2',base).href);
    await page.locator('#lshBridgeSavePopup').waitFor({state:'attached'});
    assert.equal((await page.locator('#lshBridgeSavePopup').textContent()||'').trim(),expected,language);
   }
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });

}
