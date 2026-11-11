#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const root='http://127.0.0.1:8765/language-skills-hub/cteni/';
const cards=['asteroids','can-mistakes','email-friend','instant-messages','plastic-ocean'];
const langs=['en','es','de','fr'],levels=['A1','A2','B1','B2','C1','C2'];
const words={en:'Back to question',es:'Volver a la pregunta',de:'Zurück zur Frage',fr:'Retour à la question'};
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 for(const slug of cards){
  test('R44 '+engineName+' '+slug+': mobile question ↔ passage in all 24 variants',{timeout:240000},async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[],nonGets=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))nonGets.push(r.method()+' '+r.url())});
    const r=await page.goto(root+slug+'/index.html?practice=1&lang=en&level=A1',{waitUntil:'load',timeout:45000});
    assert.equal(r.status(),200,slug);
    await page.locator('#questions .qcard').first().waitFor();
    const back=page.locator('#backToQuestion');
    assert.equal(await back.count(),1,'Exactly one return button');
    let roundTrips=0,evidenceTrips=0,emptyVariants=0;
    for(const lang of langs){
     await page.locator('#language').selectOption(lang);
     for(const level of levels){
      await page.locator('#levels button[data-level="'+level+'"]').click();
      assert.equal(await page.locator('#language').inputValue(),lang);
      assert.equal(await page.locator('#levels button[data-level="'+level+'"]').getAttribute('aria-pressed'),'true');
      assert.equal(await back.isHidden(),true,'No stale return button on variant change');
      const button=page.locator('#questions button[data-locate]').first();
      if(await button.count()){
       const id=await button.getAttribute('data-locate');
       await button.click();
       await back.waitFor({state:'visible',timeout:7000});
       assert.match(await back.textContent(),new RegExp(words[lang]));
       const highlighted=await page.evaluate(id=>{
        const marks=[...document.querySelectorAll('#readingBody [data-target-for]')];
        return marks.some(m=>m.dataset.targetFor.split(' ').includes(id)&&
          (m.classList.contains('return-target')||m.classList.contains('lsh-return-target')));
       },id);
       assert.equal(highlighted,true,'Correct source highlight missing '+slug+' '+lang+'/'+level+' '+id);
       await back.click();
       assert.equal(await back.isHidden(),true);
       const focusInQuestion=await page.evaluate(id=>{
        const q=[...document.querySelectorAll('#questions .qcard')].find(x=>x.dataset.question===id);
        return q&&q.contains(document.activeElement);
       },id);
       assert.ok(focusInQuestion,'Return failed to focus originating question '+slug+' '+lang+'/'+level);
       roundTrips++;
      }else emptyVariants++;
      if(level==='B2'){
       await page.locator('#checkAll').click();
       const evidence=page.locator('#questions button[data-evidence]').first();
       await evidence.waitFor();
       const id=await evidence.getAttribute('data-evidence');
       await evidence.click();
       await back.waitFor({state:'visible',timeout:7000});
       assert.ok(await page.locator('#readingBody .evidence-hit').count(),'Evidence not highlighted');
       await back.click();
       assert.equal(await back.isHidden(),true);
       evidenceTrips++;
      }
     }
    }
    assert.ok(roundTrips>=18,'Insufficient available exact targets '+slug+': '+roundTrips);
    assert.equal(evidenceTrips,4,'Each language should support evidence return');
    assert.deepEqual(errors,[],'Unexpected browser errors: '+errors.join('; '));
    assert.deepEqual(nonGets,[],'No network writes allowed');
    await context.close();
   }finally{await browser.close()}
  });
 }
}
