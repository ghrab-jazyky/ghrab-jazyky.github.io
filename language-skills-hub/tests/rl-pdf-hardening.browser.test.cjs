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
    if(lang==='en'&&level==='B1'){
     await page.emulateMedia({media:'print'});
     const space=await page.evaluate(()=>({
      reflection:parseFloat(getComputedStyle(document.querySelector('.writing-lines')).height),
      answer:parseFloat(getComputedStyle(document.querySelector('.answer-line')).height),
      font:parseFloat(getComputedStyle(document.querySelector('.reading-paragraphs')).fontSize)
     }));
     assert.ok(space.reflection>=90,'B1 must have three full ruled reflection lines');
     assert.ok(space.answer>=25,'B1 answer line must not be cramped');
     assert.ok(space.font>=14,'B1 reading font must not be made smaller');
     await page.emulateMedia({media:'screen'});
    }
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
   for(const level of ['C1','C2']){
    await page.goto(base+'self-check/reading/print-page.html?topic=rl-asteroids&lang=en&level='+
     level+'&mode=practice&format=text');
    await page.locator('#printButton:not([disabled])').waitFor();
    await page.emulateMedia({media:'print'});
    const geometry=await page.locator('#readingParagraphs').evaluate(el=>{
     const s=getComputedStyle(el);return {font:parseFloat(s.fontSize),line:parseFloat(s.lineHeight)}
    });
    assert.ok(geometry.font>=14.6,'EN C1/C2 remains 11 pt in print');
    assert.ok(geometry.line<=19,'EN C1/C2 uses compact but readable leading');
    await page.emulateMedia({media:'screen'});
   }
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
   await page.waitForFunction(()=>{
    const href=document.querySelector('#materialsPracticeAll')?.getAttribute('href');
    return href&&new URL(href).pathname.endsWith('.pdf');
   });
   assert.match(await page.locator('#materialsReuseWarning').innerText(),
    /stejné otázky/, 'Teacher must see that practice and test share questions');
   const realPdf=new URL(await page.locator('#materialsPracticeAll').getAttribute('href'));
   assert.match(realPdf.searchParams.get('v')||'',/^[a-f0-9]{16}$/,
    'Content-addressed URLs invalidate a stale CDN cache');
   await page.locator('.materials-fallback summary').click();
   const preview=await page.locator('#materialsPracticeAllPreview').getAttribute('href');
   assert.match(preview,/print-page\.html\?topic=rl-asteroids.*mode=practice.*format=all/,
    'Teacher needs a backup even when manifest claims an asset exists');
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
   assert.match(await page.locator('#materialsTestAllPreview').getAttribute('href'),
    /print-page\.html/, 'Backup remains available when manifest is missing');
  }finally{await browser.close()}
 });
}
