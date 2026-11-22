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
    // C1 intentionally uses 1.27 leading; C2 uses a more comfortable 1.35
    // because its two pages are balanced at paragraph boundaries.
    assert.ok(geometry.line/geometry.font<=(level==='C1'?1.30:1.37),
     'EN '+level+' uses its approved readable line-height ratio');
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
 test('R-12 '+name+': revised ES/FR C1 clears only stale answers and checked tabs',
 {timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const key='reading-lab-answers:asteroids-planetary-defence:v2.3';
   for(const lang of ['es','fr']){
    const page=await browser.newPage({viewport:{width:1100,height:900}});
    await page.goto(base+'cteni/asteroids/index.html?lang=en&level=A1');
    const affected=lang+':C1',scan=lang+'-c1-scan-1',
     vocab=lang+'-c1-vocab-1',gist=lang+'-c1-gist-1';
    const oldBook={
     [affected]:{values:{[scan]:'0',[vocab]:'1',[gist]:'2'},
      first:{[scan]:'0',[vocab]:'1',[gist]:'2'},
      checkedTabs:['scan','vocab','gist'],open:'unchanged text'},
     'en:C1':{values:{'en-c1-gist-1':'2'},first:{},
      checkedTabs:['gist'],open:'unchanged English response'}
    };
    await page.evaluate(({key,oldBook})=>
     sessionStorage.setItem(key,JSON.stringify(oldBook)),{key,oldBook});
    await page.goto(base+'cteni/asteroids/index.html?lang='+lang+'&level=C1');
    await page.locator('#levels [data-level="C1"]').waitFor();
    const saved=await page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)),key);
    assert.equal(saved[affected].itemRevision,'es-fr-c1-r12-20261122');
    assert.equal(Object.hasOwn(saved[affected].values,scan),false);
    assert.equal(Object.hasOwn(saved[affected].values,vocab),false);
    assert.equal(Object.hasOwn(saved[affected].first,scan),false);
    assert.equal(Object.hasOwn(saved[affected].first,vocab),false);
    assert.equal(saved[affected].values[gist],'2','Untouched gist answer survives');
    assert.deepEqual(saved[affected].checkedTabs,[],
     'R12 scan/vocab and R13 gist revisions invalidate only affected checked sections');
    assert.equal(saved[affected].open,'unchanged text');
    assert.equal(saved['en:C1'].values['en-c1-gist-1'],'2',
     'Other languages must not be reset');
    await page.reload();
    const savedAgain=await page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)),key);
    assert.equal(savedAgain[affected].itemRevision,'es-fr-c1-r12-20261122');
    assert.equal(savedAgain[affected].values[gist],'2');
    await page.close();
   }
  }finally{await browser.close()}
 });

 test('R-13 '+name+': ES/FR C1 migration clears revised items once and keeps unrelated answers',
 {timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const storageKey='reading-lab-answers:asteroids-planetary-defence:v2.3';
   const changed={
    es:['gist-3','inference-1','inference-2','inference-3','vocab-2','vocab-3','matching-1','matching-2','structure-1'],
    fr:['gist-2','gist-3','detail-3','inference-1','inference-2','vocab-2','vocab-3','matching-1','matching-2','matching-3','structure-1']
   };
   for(const lang of ['es','fr']){
    const page=await browser.newPage({viewport:{width:1100,height:900}});
    await page.goto(base+'cteni/asteroids/index.html?lang=en&level=A1');
    const variant=lang+':C1',items=changed[lang].map(id=>lang+'-c1-'+id);
    const values=Object.fromEntries(items.map((id,i)=>[id,String(i%4)]));
    values[lang+'-c1-scan-1']='1';
    values[lang+'-c1-gist-1']='2';
    const original={
     [variant]:{values,first:{...values},checkedTabs:['scan','gist','detail','inference','vocab','matching','structure'],
      open:'Keep this student reflection',
      itemRevision:'es-fr-c1-r12-20261122'},
     'en:C1':{values:{'en-c1-gist-1':'2'},first:{},checkedTabs:['gist'],open:'English'}
    };
    await page.evaluate(({storageKey,original})=>
     sessionStorage.setItem(storageKey,JSON.stringify(original)),{storageKey,original});
    await page.goto(base+'cteni/asteroids/index.html?lang='+lang+'&level=C1');
    await page.locator('#levels [data-level="C1"]').waitFor();
    const saved=await page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)),storageKey);
    assert.equal(saved[variant].itemRevisionR13,'es-fr-c1-r13-20261122');
    assert.equal(saved[variant].itemRevision,'es-fr-c1-r12-20261122');
    for(const id of items){
     assert.equal(Object.hasOwn(saved[variant].values,id),false,id+' value cleared');
     assert.equal(Object.hasOwn(saved[variant].first,id),false,id+' first attempt cleared');
    }
    assert.equal(saved[variant].values[lang+'-c1-scan-1'],'1');
    assert.equal(saved[variant].values[lang+'-c1-gist-1'],'2');
    assert.deepEqual(saved[variant].checkedTabs,lang==='es'?['scan','detail']:['scan']);
    assert.equal(saved[variant].open,'Keep this student reflection');
    assert.equal(saved['en:C1'].values['en-c1-gist-1'],'2');
    await page.reload();
    const again=await page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)),storageKey);
    assert.equal(again[variant].itemRevisionR13,'es-fr-c1-r13-20261122');
    assert.equal(again[variant].values[lang+'-c1-scan-1'],'1');
    assert.equal(again[variant].open,'Keep this student reflection');
    await page.close();
   }
  }finally{await browser.close()}
 });

}
