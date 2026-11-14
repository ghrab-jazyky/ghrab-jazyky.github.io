#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const entries=require('../data/cards.json').entries.filter(e=>['cteni','poslech'].includes(e.skill)&&e.id!=='ll-sad');
const base='http://127.0.0.1:8765/language-skills-hub/';
function url(topic,skill,lang,level){
 const u=new URL('self-check/practice-answers/teacher.html',base);
 if(topic!==null)u.searchParams.set('topic',topic);
 if(skill!==null)u.searchParams.set('skill',skill);
 if(lang!==null)u.searchParams.set('lang',lang);
 if(level!==null)u.searchParams.set('level',level);
 return u.href;
}
for(const [name,engine]of[['chromium',chromium],['webkit',webkit]]){
 test('R50 '+name+' keeps each practice result within its topic and lab',{timeout:240000},async()=>{
  const b=await engine.launch({headless:true});
  try{
   const page=await b.newPage({viewport:{width:390,height:844},acceptDownloads:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const e of entries){
    await page.goto(url(e.id,e.skill,e.languages[0],'B2'),{waitUntil:'load'});
    await page.locator('#downloadPdf:enabled').waitFor({timeout:25000});
    assert.equal(await page.locator('#topicTitle').getAttribute('data-topic-id'),e.id);
    assert.equal(await page.locator('#topicTitle').textContent(),e.title);
    assert.equal(await page.locator('select#topic').count(),0);
    assert.equal(await page.locator('#labName').textContent(),e.skill==='cteni'?'Reading Lab':'Listening Lab');
    assert.equal(await page.locator('#languageFixedWrap').isVisible(),e.languages.length===1);
    assert.equal(await page.locator('#languageSelectWrap').isVisible(),e.languages.length>1);
    assert.equal(await page.locator('#level').inputValue(),'B2');
    assert.ok(await page.locator('#answerPreview .key-item').count()>9);
    assert.equal(new URL(await page.locator('#backToCatalog').getAttribute('href')).searchParams.get('skill'),e.skill);
    await page.locator('#level').selectOption('C1');
    await page.locator('#answerPreview h2').filter({hasText:/C1$/}).waitFor({timeout:25000});
    assert.equal(new URL(page.url()).searchParams.get('topic'),e.id);
    assert.equal(new URL(page.url()).searchParams.get('skill'),e.skill);
    assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=3);
   }
   await page.goto(url('ll-harrison-ford','poslech','en','B1'),{waitUntil:'load'});
   await page.locator('#downloadPdf:enabled').waitFor({timeout:25000});
   const dl=page.waitForEvent('download',{timeout:25000});
   await page.locator('#downloadPdf').click();
   const file=await dl;
   assert.equal(file.suggestedFilename(),'lsh-vysledky-procvicovani-ll-harrison-ford-en-b1.pdf');
   const bytes=fs.readFileSync(await file.path());
   assert.ok(bytes.length>12000);
   assert.equal(bytes.subarray(0,8).toString('ascii'),'%PDF-1.4');
   await page.goto(url('ll-harrison-ford','poslech','en',null),{waitUntil:'load'});
   await page.locator('#topicTitle[data-topic-id="ll-harrison-ford"]').waitFor({timeout:25000});
   assert.equal(await page.locator('#level').inputValue(),'');
   assert.equal(await page.locator('#downloadPdf').isDisabled(),true);
   await page.locator('#level').selectOption('A1');
   await page.locator('#downloadPdf:enabled').waitFor({timeout:25000});
   for(const bad of [url('ll-harrison-ford','cteni','en','B2'),url('rl-asteroids','poslech','en','B2'),url('absent','poslech','en','B2'),url(null,'poslech','en','B2')]){
    await page.goto(bad,{waitUntil:'load'});
    await page.locator('#status').filter({hasText:'Neplatný odkaz'}).waitFor({timeout:25000});
    assert.equal(await page.locator('#downloadPdf').isDisabled(),true);
    assert.equal(await page.locator('#answerPreview .key-item').count(),0);
   }
   assert.deepEqual(errors,[]);
  }finally{await b.close()}
 });
}
