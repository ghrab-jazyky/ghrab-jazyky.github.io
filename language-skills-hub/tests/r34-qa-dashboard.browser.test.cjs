#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const url=(skill,topic,lang,level,attempt)=>new URL(
 'self-check/test-banks/'+skill+'/preview.html?topic='+topic+'&lang='+lang+
 '&level='+level+'&timer=20&attempt='+attempt,base).href;
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('R34 '+name+' editorial dashboard routes all skill previews without exposing approved cards',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   assert.equal((await page.goto(new URL('self-check/test-banks/index.html',base))).status(),200);
   await page.locator('.r34-stat').first().waitFor();
   assert.equal(await page.locator('.r34-stat').count(),7);
   assert.match(await page.locator('.r34-stat').last().textContent(),/0.*pedagogicky schválených/);
   await page.locator('#topic').selectOption('rl-asteroids');
   await page.locator('#language').selectOption('es');
   await page.locator('#level').selectOption('A1');
   assert.match(await page.locator('#variantStatus').textContent(),/Automatický pracovní návrh/);
   const readingLink=await page.locator('#previewLink').getAttribute('href');
   assert.match(readingLink,/\/language-skills-hub\/self-check\/test-banks\/reading\/preview\.html/);
   assert.match(readingLink,/lang=es/);
   await page.locator('#skill').selectOption('listening');
   assert.equal(await page.locator('#language').isDisabled(),true);
   await page.locator('#topic').selectOption('ll-harrison-ford');
   await page.locator('#level').selectOption('B2');
   assert.match(await page.locator('#variantStatus').textContent(),/Pouze výběr cvičných úloh/);
   const listeningLink=await page.locator('#previewLink').getAttribute('href');
   assert.match(listeningLink,/\/language-skills-hub\/self-check\/test-banks\/listening\/preview\.html/);
   assert.match(listeningLink,/topic=ll-harrison-ford/);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test('R34 '+name+' generated Reading ES/A1 draft runs with no visible grade or student upload',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],uploads=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))uploads.push(r.method())});
   page.on('dialog',d=>d.accept());
   await page.goto(url('reading','rl-asteroids','es','A1','r34readinges1'));
   await page.locator('#sessionStart').waitFor({timeout:30000});
   assert.match(await page.locator('#pilotWarning').textContent(),/AUTOMATED CONTENT SCAFFOLD/);
   assert.match(await page.locator('.mode').textContent(),/ES\/A1/);
   await page.locator('#sessionStart').click();
   await page.locator('fieldset.question').first().locator('input').first().check();
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#gradeProposal .grade-number').count(),0);
   assert.match(await page.locator('#gradeProposal').textContent(),/NOT SCORED AS AN ASSESSMENT/);
   assert.ok((await page.locator('#resultDetails .review').count())>=9);
   assert.equal(await page.locator('#questionList fieldset.question').count(),10);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2);
   assert.deepEqual(errors,[]);assert.deepEqual(uploads,[]);
  }finally{await browser.close()}
 });
 test('R34 '+name+' generated Reading French/C2 loads correct source and 10 questions',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url('reading','rl-plastic-ocean','fr','C2','r34readingfrc2'));
   await page.locator('#sessionStart').waitFor({timeout:30000});
   assert.match(await page.locator('.mode').textContent(),/FR\/C2/);
   assert.equal(await page.locator('fieldset.question').count(),10);
   assert.equal(await page.locator('#readingParagraphs p').count(),7);
   assert.equal(await page.locator('#results').isHidden(),true);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test('R34 '+name+' Listening selected-task preview restores teacher 0/1 marks but issues no grade',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],uploads=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))uploads.push(r.method())});
   page.on('dialog',d=>d.accept());
   await page.goto(url('listening','ll-harrison-ford','en','B2','r34listeningqa'));
   await page.locator('#sessionStart').waitFor({timeout:30000});
   assert.match(await page.locator('#notice').textContent(),/UNAPPROVED QA ONLY/);
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   assert.equal(await page.locator('fieldset.question').count(),5);
   assert.equal(await page.locator('.written-response').count(),2);
   assert.equal(await page.locator('#results').isHidden(),true);
   await page.locator('.written-response').first().fill('Answer for private QA');
   await page.locator('#submitButton').click();
   await page.locator('#manualGrade:not([hidden])').waitFor();
   assert.equal(await page.locator('#manualGradeTasks select').count(),2);
   assert.equal(await page.locator('#gradeProposal').isHidden(),true);
   assert.equal(await page.locator('#exportResult').isHidden(),true);
   await page.locator('#manualGradeTasks select').first().selectOption('1');
   await page.reload();
   await page.locator('#manualGrade:not([hidden])').waitFor();
   assert.equal(await page.locator('#manualGradeTasks select').first().inputValue(),'1');
   assert.equal(await page.locator('#gradeProposal').isHidden(),true);
   assert.match(await page.locator('#resultCaution').textContent(),/UNAPPROVED LISTENING BLUEPRINT/);
   assert.deepEqual(errors,[]);assert.deepEqual(uploads,[]);
  }finally{await browser.close()}
 });
 test('R34 '+name+' refuses modified Listening blueprint and mismatching SHA',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/version.json',route=>route.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({version:'R31',backendEnabled:false,officialGradesEnabled:false,
     contentHashes:{'ll-matthew-oscars':'0'.repeat(64)}})}));
   await page.goto(url('listening','ll-matthew-oscars','en','A1','r34shaerror'));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/checksum mismatch/);
   assert.equal(await page.locator('#workspace').isHidden(),true);
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
