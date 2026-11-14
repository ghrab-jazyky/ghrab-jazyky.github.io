#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const reading=require('../self-check/reading/reading-core.js');
const listening=require('../self-check/listening/listening-core.js');
const root=path.resolve(__dirname,'..');
const entries=require('../data/cards.json').entries.filter(e=>['cteni','poslech'].includes(e.skill));
const base='http://127.0.0.1:8765/language-skills-hub/';
const url=(entry,lang='en',level='B2',mode='practice')=>{
 const u=new URL('self-check/practice-answers/teacher.html',base);
 if(entry){u.searchParams.set('topic',entry.id);u.searchParams.set('skill',entry.skill)}
 if(lang!==null)u.searchParams.set('lang',lang);
 if(level!==null)u.searchParams.set('level',level);
 if(mode!==null)u.searchParams.set('mode',mode);
 return u.href;
};
function expectedCount(e,lang,level){
 const html=fs.readFileSync(path.join(root,e.lockSource||e.relative),'utf8');
 if(e.skill==='cteni')return reading.variantFromData(reading.parseReadingData(html),lang,level).questions.length;
 const v=listening.variant(listening.extractJson(html,'DATA'),level);
 return v.gist.length+v.detail.length+v.sequence.length+(v.matching?.items.length||0)+listening.cloze(v,e.id,level).length;
}
for(const [browserName,engine]of[['Chromium',chromium],['WebKit',webkit]]){
 test('R51 '+browserName+': all 8 cards keep topic fixed while switching practice/test and CEFR',{timeout:230000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   const page=await context.newPage(),errors=[],writes=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method()+' '+r.url())});
   const loaded=()=>page.locator('#downloadPdf:enabled').waitFor({timeout:30000});
   for(const e of entries){
    const lang=e.languages[0];
    assert.equal((await page.goto(url(e,lang),{waitUntil:'load'})).status(),200);
    await loaded();
    assert.equal(await page.locator('#answerMode').inputValue(),'practice');
    assert.equal(await page.locator('#topicTitle').getAttribute('data-topic-id'),e.id);
    assert.equal(await page.locator('select#topic').count(),0);
    assert.match(await page.locator('.preview-mode').textContent(),/PROCVIČOVACÍ/);
    assert.match(await page.locator('#downloadPdf').textContent(),/procvičování/);
    const practiceCount=await page.locator('#answerPreview .key-item').count();
    await page.locator('#answerMode').selectOption('test');
    await loaded();
    assert.equal(await page.locator('#answerMode').inputValue(),'test');
    assert.equal(new URL(page.url()).searchParams.get('mode'),'test');
    assert.equal(new URL(page.url()).searchParams.get('topic'),e.id);
    assert.equal(new URL(page.url()).searchParams.get('skill'),e.skill);
    assert.match(await page.locator('.preview-mode').textContent(),/TESTOVÁ VERZE/);
    assert.match(await page.locator('#modeHelp').textContent(),/TEST/);
    assert.match(await page.locator('#downloadPdf').textContent(),/testový/);
    const testCount=await page.locator('#answerPreview .key-item').count();
    assert.equal(testCount,expectedCount(e,lang,'B2'),e.id+' test bank mismatch');
    assert.ok(practiceCount>=testCount,e.id+' practice missing content');
    assert.equal(await page.locator('#topicTitle').getAttribute('data-topic-id'),e.id);
    if(e.skill==='poslech'){
     assert.equal(await page.locator('#languageFixedWrap').isVisible(),true);
     if(['ll-sad','ll-conlangs'].includes(e.id))assert.match(await page.locator('#answerPreview').textContent(),/Matching – test/);
      else assert.match(await page.locator('#answerPreview').textContent(),/D · Factual cloze – test/);
     assert.doesNotMatch(await page.locator('#answerPreview').textContent(),/Open questions – vzorové odpovědi/);
    }else{
     assert.equal(await page.locator('#languageSelectWrap').isVisible(),true);
     assert.doesNotMatch(await page.locator('#answerPreview').textContent(),/Otevřená otázka/);
    }
    await page.locator('#level').selectOption('C1');
    await loaded();
    await page.locator('#answerPreview h2').filter({hasText:/C1$/}).waitFor({timeout:20000});
    assert.equal(await page.locator('#answerPreview .key-item').count(),expectedCount(e,lang,'C1'));
    assert.equal(new URL(page.url()).searchParams.get('mode'),'test');
    assert.equal(await page.locator('#topicTitle').getAttribute('data-topic-id'),e.id);
    await page.locator('#answerMode').selectOption('practice');
    await loaded();
    assert.equal(await page.locator('#level').inputValue(),'C1');
    assert.equal(new URL(page.url()).searchParams.get('mode'),'practice');
    assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=3,'mobile overflow '+e.id);
   }
   // Reading localization applies equally to the test key.
   const asteroids=entries.find(e=>e.id==='rl-asteroids');
   await page.goto(url(asteroids,'es','A1','test'),{waitUntil:'load'});
   await loaded();
   assert.equal(await page.locator('#answerMode').inputValue(),'test');
   assert.equal(await page.locator('#language').inputValue(),'es');
   assert.equal(await page.locator('#answerPreview .key-item').count(),expectedCount(asteroids,'es','A1'));
   // Responsive layout: all 3 selectors must remain within viewport.
   for(const width of [320,390,1280]){
    await page.setViewportSize({width,height:844});
    assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=3,'overflow '+width);
   }
   // Both independent PDF variants contain a real PDF (practice name remains backward compatible).
   await page.setViewportSize({width:390,height:844});
   const harrison=entries.find(e=>e.id==='ll-harrison-ford');
   for(const [e,lang,level,mode,prefix]of[
    [harrison,'en','B2','test','lsh-vysledky-test'],
    [harrison,'en','B2','practice','lsh-vysledky-procvicovani'],
    [asteroids,'es','B2','test','lsh-vysledky-test']
   ]){
    await page.goto(url(e,lang,level,mode),{waitUntil:'load'});
    await loaded();
    const waitDownload=page.waitForEvent('download',{timeout:30000});
    await page.locator('#downloadPdf').click();
    const file=await waitDownload;
    assert.equal(file.suggestedFilename(),prefix+'-'+e.id+'-'+lang+'-'+level.toLowerCase()+'.pdf');
    const bytes=fs.readFileSync(await file.path());
    assert.equal(bytes.subarray(0,8).toString('ascii'),'%PDF-1.4');
    assert.ok(bytes.length>12000,e.id+' '+mode+' empty PDF');
   }
   // Old URL defaults to practice; invalid mode fails closed, and no silent level default.
   await page.goto(url(harrison,'en','B2',null),{waitUntil:'load'});
   await loaded();
   assert.equal(await page.locator('#answerMode').inputValue(),'practice');
   await page.goto(url(harrison,'en',null,'test'),{waitUntil:'load'});
   assert.equal(await page.locator('#level').inputValue(),'');
   assert.equal(await page.locator('#downloadPdf').isDisabled(),true);
   await page.locator('#level').selectOption('B2');
   await loaded();
   assert.equal(new URL(page.url()).searchParams.get('mode'),'test');
   await page.goto(url(harrison,'en','B2','unknown'),{waitUntil:'load'});
   await page.locator('#status').filter({hasText:'Neplatný odkaz'}).waitFor({timeout:20000});
   assert.equal(await page.locator('#downloadPdf').isDisabled(),true);
   assert.deepEqual(errors,[]);
   assert.deepEqual(writes,[]);
  }finally{await browser.close()}
 });
}
