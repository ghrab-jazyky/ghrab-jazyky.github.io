#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const {parseReadingData}=require('../self-check/reading/reading-core.js');

const root='http://127.0.0.1:8765/language-skills-hub/cteni/';
const cards=['asteroids','can-mistakes','email-friend','instant-messages','plastic-ocean'];
const langs=['en','es','de','fr'],levels=['A1','A2','B1','B2','C1','C2'];
const words={en:'Back to question',es:'Volver a la pregunta',de:'Zurück zur Frage',fr:'Retour à la question'};
const hasLocate=q=>Array.isArray(q.target)||(Array.isArray(q.targets)&&q.targets.length>0);
const sourceData=slug=>parseReadingData(fs.readFileSync(path.join(__dirname,'..','cteni',slug,'index.html'),'utf8'));

for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 for(const slug of cards){
  test('R44 '+engineName+' '+slug+': each available source link and evidence returns on mobile in 24 variants',
   {timeout:420000},async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[],nonGets=[];
    const data=sourceData(slug);
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))nonGets.push(r.method()+' '+r.url())});
    const response=await page.goto(root+slug+'/index.html?practice=1&lang=en&level=A1',{waitUntil:'load',timeout:45000});
    assert.equal(response.status(),200,slug);
    await page.locator('#questions .qcard').first().waitFor();
    const back=page.locator('#backToQuestion');
    assert.equal(await back.count(),1,'Exactly one return button');
    let variants=0,roundTrips=0,expectedTrips=0,evidenceTrips=0;
    for(const lang of langs){
     await page.locator('#language').selectOption(lang);
     for(const level of levels){
      await page.locator('#levels button[data-level="'+level+'"]').click();
      const variant=data[lang][level];
      variants++;
      assert.equal(await page.locator('#language').inputValue(),lang);
      assert.equal(await page.locator('#levels button[data-level="'+level+'"]').getAttribute('aria-pressed'),'true');
      assert.equal(await back.isHidden(),true,'Stale return button on variant change');
      const withTargets=variant.questions.filter(hasLocate);
      expectedTrips+=withTargets.length;
      for(const tab of [...new Set(withTargets.map(q=>q.tab))]){
       await page.locator('#skillTabs button[data-skill="'+tab+'"]').click();
       for(const q of withTargets.filter(item=>item.tab===tab)){
        const button=page.locator('#questions button[data-locate="'+q.id+'"]');
        assert.equal(await button.count(),1,'Missing Show in text '+slug+' '+lang+'/'+level+' '+q.id);
        await button.click();
        await back.waitFor({state:'visible',timeout:7000});
        assert.ok((await back.textContent()).includes(words[lang]),'Return is not translated for '+lang);
        const highlighted=await page.evaluate(id=>{
         const marks=[...document.querySelectorAll('#readingBody [data-target-for]')];
         return marks.some(m=>m.dataset.targetFor.split(/\s+/).includes(id)&&
          (m.classList.contains('return-target')||m.classList.contains('lsh-return-target')));
        },q.id);
        assert.equal(highlighted,true,'Source highlight missing '+slug+' '+lang+'/'+level+' '+q.id);
        await back.click();
        assert.equal(await back.isHidden(),true,'Return button not reset '+slug+' '+q.id);
        const focused=await page.evaluate(id=>{
         const card=[...document.querySelectorAll('#questions .qcard')].find(el=>el.dataset.question===id);
         return !!card&&card.contains(document.activeElement);
        },q.id);
        assert.ok(focused,'Return failed to focus exact question '+slug+' '+lang+'/'+level+' '+q.id);
        roundTrips++;
       }
      }
      if(level==='B2'){
       await page.locator('#checkAll').click();
       let evidenceReturned=false;
       for(const tab of [...new Set(variant.questions.map(q=>q.tab))]){
        await page.locator('#skillTabs button[data-skill="'+tab+'"]').click();
        for(const q of variant.questions.filter(item=>item.tab===tab&&Array.isArray(item.evidence)&&item.evidence.length>0)){
         const button=page.locator('#questions button[data-evidence="'+q.id+'"]');
         if(!(await button.count()))continue;
         await button.click();
         if(!(await page.locator('#readingBody .evidence-hit').count()))continue;
         await back.waitFor({state:'visible',timeout:7000});
         assert.ok((await back.textContent()).includes(words[lang]),'Evidence return not translated '+lang);
         await back.click();
         assert.equal(await back.isHidden(),true);
         assert.ok(await page.evaluate(id=>{
          const card=[...document.querySelectorAll('#questions .qcard')].find(el=>el.dataset.question===id);
          return !!card&&card.contains(document.activeElement);
         },q.id),'Evidence failed to return to '+q.id);
         evidenceTrips++;evidenceReturned=true;break;
        }
        if(evidenceReturned)break;
       }
       assert.ok(evidenceReturned,'No functional Show exact evidence return '+slug+' '+lang+'/'+level);
      }
     }
    }
    assert.equal(variants,24);
    assert.equal(roundTrips,expectedTrips,'Every existing Show in text must return '+slug);
    assert.ok(roundTrips>0,'No source targets tested in '+slug);
    assert.equal(evidenceTrips,4,'Each language needs one evidence return');
    assert.deepEqual(errors,[],'Unexpected browser errors: '+errors.join('; '));
    assert.deepEqual(nonGets,[],'No network writes allowed');
    await context.close();
   }finally{await browser.close()}
  });
 }
}
