#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.env.LSH_TEACHER_CHANGELOG_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const STORAGE_KEY='lsh:teacher-whats-new:last-offered-sequence:v1';
// Only the explicitly selected historical baseline replay expects sequence 9.
const historic=process.env.LSH_TEACHER_CHANGELOG_BASELINE==='1';
const latest=historic?9:10;
async function withPage(engine,run,{width=390,height=844}={}) {
 const browser=await engine.launch({headless:true});
 try {
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await run(page,context);
  assert.deepEqual(errors,[],'No uncaught errors in the hub');
 } finally {await browser.close();}
}
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('Stage F '+engineName+' real teacher notes are new, curated and newest first',{timeout:100000},async()=>{
  await withPage(engine,async page=>{
   await page.goto(base);
   await page.locator('#whatsNewPrompt[open]').waitFor();
   assert.match(await page.locator('#wnPromptLead').innerText(),/Připravil jsem krátký přehled/);
   const chooserShown=await page.locator('#skillChooser').isVisible();
   assert.equal(chooserShown,false,'Chooser must not flash before the announcement');
   await page.locator('#wnPromptYes').click();
   await page.locator('#whatsNewCatalog[open]').waitFor();
   assert.deepEqual(await page.locator('.wn-release').evaluateAll(els=>els.map(el=>Number(el.dataset.wnSequence))),historic?[9,8,7,6,5,4,3,2,1]:[10,9,8,7,6,5,4,3,2,1]);
   assert.equal(await page.locator('.wn-change').count(),historic?13:14);
   if(!historic){
    assert.match(await page.locator('.wn-release').first().innerText(),/Smart Feedback pro Asteroids/);
    assert.match(await page.locator('.wn-release').first().innerText(),/A1–C2/);
   }
   const historyIndex=historic?0:1;
   assert.match(await page.locator('.wn-release').nth(historyIndex).innerText(),/Christmas Quest/);
   assert.match(await page.locator('.wn-release').nth(historyIndex+1).innerText(),/Language Skills Hub nyní také jako aplikace/);
   assert.match(await page.locator('.wn-release').nth(historyIndex+2).innerText(),/City Quest/);
   assert.match(await page.locator('.wn-release').nth(historyIndex+3).innerText(),/Reading Lab/i);
   assert.match(await page.locator('.wn-release').nth(historyIndex+3).innerText(),/A1–B1/);
   assert.match(await page.locator('.wn-release').nth(historyIndex+3).innerText(),/B2–C2/);
   assert.match(await page.locator('.wn-release').nth(historyIndex+3).innerText(),/Show exact evidence/);
   assert.match(await page.locator('.wn-release').nth(historyIndex+4).innerText(),/Plurál/i);
   assert.match(await page.locator('.wn-release').nth(historyIndex+5).innerText(),/časovaných testů/i);
   assert.match(await page.locator('.wn-release').nth(historyIndex+6).innerText(),/konverzace v restauraci/i);
   assert.match(await page.locator('.wn-release').nth(historyIndex+7).innerText(),/How to Choose Your News/);
   assert.equal(await page.locator('.wn-benefit').count(),historic?13:14);
   assert.doesNotMatch(await page.locator('#whatsNewCatalog').innerText(),/DEMO|PREPROD|CI\/CD|commit SHA/i);
   await page.locator('#wnCatalogContinue').click();
   await page.locator('#skillChooser:not([hidden])').waitFor();
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),String(latest));
   await page.reload();
   await page.locator('#skillChooser:not([hidden])').waitFor();
   assert.equal(await page.locator('#whatsNewPrompt').evaluate(el=>el.open),false);
  });
 });
 test('Stage F '+engineName+' previously seen release is offered the next release once',{timeout:100000},async()=>{
  await withPage(engine,async page=>{
   // Seed once in the existing origin. An init script would reset the saved
   // release to 8 on every reload, masking that the prompt was acknowledged.
   await page.goto(base+'?skill=cteni');
   await page.evaluate(({key,value})=>localStorage.setItem(key,value),{key:STORAGE_KEY,value:String(latest-1)});
   await page.goto(base);await page.locator('#whatsNewPrompt[open]').waitFor();
   await page.locator('#wnPromptNo').click();
   await page.locator('#skillChooser:not([hidden])').waitFor();
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),String(latest));
   await page.reload();await page.locator('#skillChooser:not([hidden])').waitFor();
   assert.equal(await page.locator('#whatsNewPrompt').evaluate(el=>el.open),false);
  });
 });
 test('Stage F '+engineName+' manual notes return to the same lab and keep its state',{timeout:100000},async()=>{
  await withPage(engine,async page=>{
   await page.goto(base+'?skill=cteni&lang=en&level=B2');
   await page.locator('#catalog:not([hidden])').waitFor();
   await page.locator('#search').fill('asteroids');
   const before={url:page.url(),filter:await page.locator('#language').inputValue(),search:await page.locator('#search').inputValue()};
   await page.locator('#whatsNewOpen').click();
   await page.locator('#whatsNewCatalog[open]').waitFor();
   assert.equal(await page.locator('#wnCatalogContinue').innerText(),'Zavřít katalog');
   await page.locator('#wnCatalogContinue').click();
   assert.equal(await page.locator('#catalog').isVisible(),true);
   assert.equal(page.url(),before.url);
   assert.equal(await page.locator('#language').inputValue(),before.filter);
   assert.equal(await page.locator('#search').inputValue(),before.search);
   assert.equal(await page.locator('#whatsNewOpen').evaluate(el=>document.activeElement===el),true);
  });
 });
 test('Stage F '+engineName+' responsive history fits available viewport',{timeout:100000},async()=>{
  await withPage(engine,async page=>{
   await page.goto(base+'?skill=poslech');
   await page.locator('#catalog:not([hidden])').waitFor();
   for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:750});
    await page.locator('#whatsNewOpen').click();
    await page.locator('#whatsNewCatalog[open]').waitFor();
    const metrics=await page.locator('#whatsNewCatalog').evaluate(el=>{
     const r=el.getBoundingClientRect();
     return {left:r.left,right:r.right,windowWidth:innerWidth,scroll:document.documentElement.scrollWidth-innerWidth,footer:el.querySelector('#wnCatalogContinue').getBoundingClientRect().bottom};
    });
    assert.ok(metrics.left>=-1&&metrics.right<=metrics.windowWidth+1,JSON.stringify(metrics));
    assert.ok(metrics.scroll<=3,JSON.stringify(metrics));
    assert.ok(metrics.footer<=750,JSON.stringify(metrics));
    await page.locator('#wnCatalogClose').click();
    assert.equal(await page.locator('#catalog').isVisible(),true);
   }
  });
 });
 test('Stage F '+engineName+' locally read publication does not relaunch prompt',{timeout:100000},async()=>{
  await withPage(engine,async page=>{
   await page.goto(base);await page.locator('#whatsNewPrompt[open]').waitFor();
   await page.keyboard.press('Escape');
   await page.locator('#skillChooser:not([hidden])').waitFor();
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),String(latest));
   await page.reload();await page.locator('#skillChooser:not([hidden])').waitFor();
   assert.equal(await page.locator('#whatsNewPrompt').evaluate(el=>el.open),false);
  });
 });
 test('Stage F '+engineName+' slow changelog request never blocks entry',{timeout:100000},async()=>{
  await withPage(engine,async page=>{
   await page.route('**/language-skills-hub/data/teacher-changelog.json',route=>new Promise(resolve=>setTimeout(()=>route.abort('failed').then(resolve),6200)));
   const started=Date.now();
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.locator('#skillChooser:not([hidden])').waitFor({timeout:5000});
   assert.ok(Date.now()-started<5200,'Hub should continue before delayed fetch finishes');
   assert.equal(await page.locator('#whatsNewPrompt').evaluate(el=>el.open),false);
  });
 });
}
