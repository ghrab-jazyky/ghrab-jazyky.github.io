#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('RL-PDF hardening '+name+': gap worksheet and localized print controls',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1280,height:900}});
   for(const [lang,level] of [['en','B1'],['es','B2'],['de','C2'],['fr','C1']]){
    const url=base+'self-check/reading/print-page.html?topic=rl-asteroids&lang='+
     lang+'&level='+level+'&mode=practice&format=all';
    await page.goto(url);
    await page.locator('#printButton:not([disabled])').waitFor();
    assert.equal(await page.locator('#warmupSection').isVisible(),true);
    assert.equal(await page.locator('#studentIdentification').isVisible(),true);
    if(lang==='fr')assert.ok((await page.locator('#studentIdentification').innerText())
     .includes('Nom\u202f:'),'French narrow non-breaking space before colon');
    assert.equal(await page.locator('#gapNote').isVisible(),false);
    assert.ok((await page.locator('#readingParagraphs').innerText()).includes('[…]'));
    assert.ok((await page.locator('.exercise-question').count())>0);
    assert.equal(await page.locator('#readingParagraphs p[data-num]').count()>0,true);
    const heading=await page.locator('#readingTitle').innerText();
    assert.equal(heading,{en:'Reading text',es:'Texto de lectura',de:'Lesetext',fr:'Texte à lire'}[lang]);
   }
   await page.goto(base+'self-check/reading/print-page.html?topic=rl-asteroids&lang=en&level=B2&mode=practice&format=text');
   await page.locator('#printButton:not([disabled])').waitFor();
   assert.equal(await page.locator('#warmupSection').isVisible(),false);
   assert.equal(await page.locator('#studentIdentification').isVisible(),false);
   assert.equal((await page.locator('#readingParagraphs').innerText()).includes('[…]'),false);
   await page.goto(base+'self-check/reading/print-page.html?topic=rl-asteroids&lang=en&level=B2&mode=test&format=text');
   await page.locator('#printButton:not([disabled])').waitFor();
   assert.equal(await page.locator('#gapNote').isVisible(),true);
   assert.equal((await page.locator('#readingParagraphs').innerText()).includes('[…]'),true);
   await page.setViewportSize({width:375,height:812});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+5),
    'Mobile print preview must not overflow horizontally');
  }finally{await browser.close()}
 });
 test('RL-PDF hardening '+name+': load state, offline fallback and download',{timeout:120000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true});
   await page.goto(base+'index.html?skill=cteni');
   const materials=page.locator('[data-topic-id="rl-asteroids"] button').filter({hasText:'Materiály PDF'});
   await materials.waitFor();
   await materials.click();
   await page.locator('#materialsDialog[open]').waitFor();
   await page.waitForFunction(()=>document.querySelector('#materialsPracticeAll')?.getAttribute('href')?.endsWith('.pdf'));
   const link=page.locator('#materialsPracticeAll');
   const [download]=await Promise.all([page.waitForEvent('download'),link.click()]);
   assert.match(download.suggestedFilename(),/Reading-Lab-Asteroids.*practice-all\.pdf/);
   await download.delete();
   await page.locator('#materialsClose').click();
   await page.reload();
   await page.route('**/printouts/rl-asteroids/manifest-all.json',route=>
    route.fulfill({status:404,body:'missing'}));
   const button=page.locator('[data-topic-id="rl-asteroids"] button').filter({hasText:'Materiály PDF'});
   await button.waitFor();await button.click();
   await page.locator('#materialsDialog[open]').waitFor();
   await page.locator('#materialsStatus').getByText('Předgenerovaná PDF nejsou dostupná',{exact:false}).waitFor();
   const fallback=await page.locator('#materialsPracticeAll').getAttribute('href');
   assert.match(fallback,/print-page\.html/);
  }finally{await browser.close()}
 });
}
