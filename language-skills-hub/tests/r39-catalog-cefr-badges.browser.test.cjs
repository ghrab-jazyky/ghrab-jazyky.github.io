#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const config=[
 {skill:'konverzace',lang:'es',alternative:'en',count:22},
 {skill:'cteni',lang:'fr',alternative:'en',count:5},
 {skill:'poslech',lang:'en',alternative:null,count:4}
];
function catalogUrl(spec){
 const url=new URL('index.html',base);
 url.searchParams.set('skill',spec.skill);
 url.searchParams.set('lang',spec.lang);
 url.searchParams.set('level','B2');
 return url.href;
}
const data=async page=>page.locator('#cards .card').evaluateAll(cards=>cards.map(c=>({
 id:c.dataset.topicId,title:c.querySelector('h3')?.textContent,
 language:c.dataset.catalogLanguage,level:c.dataset.catalogLevel,
 badge:c.querySelector('.catalog-variant')?.textContent,
 badgeAria:c.querySelector('.catalog-variant')?.getAttribute('aria-label'),
 open:c.querySelector('a.action.primary')?.href,
 results:[...c.querySelectorAll('a')].find(a=>a.textContent==='VÝSLEDKY')?.href,
 test:c.querySelector('a.action.test')?.href
})));
function titlesEqualById(before,after){
 const map=new Map(before.map(x=>[x.id,x.title]));
 assert.equal(after.length,before.length);
 for(const card of after)assert.equal(card.title,map.get(card.id),
  card.id+' title changed with CEFR level');
}
for(const [name,engine]of[['chromium',chromium],['webkit',webkit]]){
 test('R39 '+name+': stable topics and precise variant badges and links across 3 labs',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}});
   const errors=[];page.on('pageerror',err=>errors.push(err.message));
   for(const spec of config){
    assert.equal((await page.goto(catalogUrl(spec),{waitUntil:'load'})).status(),200);
    await page.waitForFunction(count=>
     document.querySelectorAll('#cards .card').length===count,spec.count,{timeout:25000});
    const initial=await data(page);
    assert.equal(initial.length,spec.count);
    for(const c of initial){
     assert.equal(c.language,spec.lang);
     assert.equal(c.level,'B2');
     assert.equal(c.badge,spec.lang.toUpperCase()+' · B2');
     assert.match(c.badgeAria,/úroveň: B2/);
    }
    // A level switch must NEVER change a topic name in any language or lab.
    await page.locator('#level').selectOption('C1');
    const changed=await data(page);
    titlesEqualById(initial,changed);
    assert.ok(changed.every(c=>c.level==='C1'&&c.badge===spec.lang.toUpperCase()+' · C1'));
    if(spec.alternative){
     // Language, unlike CEFR level, must translate the visible topic title.
     await page.locator('#language').selectOption(spec.alternative);
     const translated=await data(page);
     const former=new Map(changed.map(c=>[c.id,c.title]));
     assert.ok(translated.some(c=>c.title!==former.get(c.id)),
       spec.skill+' did not localize a single topic title');
     assert.ok(translated.every(c=>c.badge===spec.alternative.toUpperCase()+' · C1'));
    }
    await page.locator('#language').selectOption('all');
    const noLanguage=await data(page);
    const languageIndicator=spec.skill==='poslech'?'EN':'4 jazyky';
    assert.ok(noLanguage.every(c=>c.badge===languageIndicator+' · C1'));
    await page.locator('#level').selectOption('all');
    const unfiltered=await data(page);
    assert.ok(unfiltered.every(c=>c.badge===languageIndicator+' · A1–C2'&&c.level==='all'));
    // Restore an explicit variant, and verify every action resolves to that variant.
    await page.locator('#language').selectOption(spec.lang);
    await page.locator('#level').selectOption('B2');
    const current=await data(page);
    assert.equal(current.length,spec.count);
    const first=current[0],url=new URL(first.open);
    assert.equal(url.searchParams.get('practice'),'1');
    assert.equal(url.searchParams.get('lang'),spec.lang);
    assert.equal(url.searchParams.get('level'),'B2');
    assert.equal(url.searchParams.get('zamek'),'1');
    if(spec.skill==='konverzace'){
     assert.equal(first.results,undefined);
     assert.equal(first.test,undefined);
    }else{
     const key=new URL(first.results),testUrl=new URL(first.test);
     for(const value of [key,testUrl]){
      assert.equal(value.searchParams.get('topic'),first.id);
      assert.equal(value.searchParams.get('lang'),spec.lang);
      assert.equal(value.searchParams.get('level'),'B2');
     }
     // The teacher practice solution page must honor the selected CEFR level.
     assert.equal((await page.goto(key.href,{waitUntil:'load'})).status(),200);
     await page.locator('#downloadPdf:enabled').waitFor({timeout:25000});
     assert.equal(await page.locator('#topicTitle').getAttribute('data-topic-id'),first.id);
     assert.equal(await page.locator('select#topic').count(),0);
     assert.equal(key.searchParams.get('skill'),spec.skill);
     assert.equal(await page.locator('#language').inputValue(),spec.lang);
     assert.equal(await page.locator('#level').inputValue(),'B2');
     // Without a CEFR selection the teacher must choose; silent A1 is forbidden.
     key.searchParams.delete('level');
     await page.goto(key.href,{waitUntil:'load'});
     assert.equal(await page.locator('#level').inputValue(),'');
     assert.equal(await page.locator('#downloadPdf').isDisabled(),true);
     assert.match(await page.locator('#status').textContent(),/vyber úroveň A1–C2/);
     await page.locator('#level').selectOption('B2');
     await page.locator('#downloadPdf:enabled').waitFor({timeout:25000});
     if(spec.skill==='cteni'){
      key.searchParams.set('level','B2');
      key.searchParams.delete('lang');
      await page.goto(key.href,{waitUntil:'load'});
      assert.equal(await page.locator('#language').inputValue(),'');
      assert.equal(await page.locator('#downloadPdf').isDisabled(),true);
      await page.locator('#language').selectOption(spec.lang);
      await page.locator('#downloadPdf:enabled').waitFor({timeout:25000});
     }
     // Return to the filtered catalog to verify its independently configured sharing.
     await page.goto(catalogUrl(spec),{waitUntil:'load'});
     await page.locator('#cards .card').first().waitFor({timeout:25000});
    }
    const card=page.locator('#cards .card').first();
    await card.locator('button').filter({hasText:'Sdílet se studenty'}).click();
    await page.locator('#shareFixed').check();
    assert.equal(await page.locator('#shareLanguage').inputValue(),spec.lang);
    assert.equal(await page.locator('#shareLevel').inputValue(),'B2');
    const shareURL=new URL(await page.locator('#qrUrl').inputValue());
    assert.equal(shareURL.searchParams.get('practice'),'1');
    assert.equal(shareURL.searchParams.get('lang'),spec.lang);
    assert.equal(shareURL.searchParams.get('level'),'B2');
    assert.equal(shareURL.searchParams.get('zamek'),'1');
    await page.locator('#qrClose').click();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(overflow<=3,spec.skill+' mobile horizontal overflow '+overflow);
   }
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
