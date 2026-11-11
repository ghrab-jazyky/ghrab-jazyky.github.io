#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
function url(name,params){const u=new URL(name,base);for(const [k,v]of Object.entries(params))u.searchParams.set(k,v);return u.href;}
async function checkPdf(page,skill,topic){
 await page.evaluate(()=>{
  const original=window.LSHPdfReport.download;
  window.LSHPdfReport.download=function(report){
   window.__r34Report=report;
   return original.call(this,report);
  };
 });
 const pending=page.waitForEvent('download',{timeout:25000});
 await page.locator('#exportPdf').click();
 const dl=await pending;
 assert.match(dl.suggestedFilename(),new RegExp('^lsh-'+skill+'-'+topic+'-.*\\.pdf$'));
 const bytes=fs.readFileSync(await dl.path());
 assert.ok(bytes.length>12000,'PDF should contain readable rendered pages');
 assert.equal(bytes.subarray(0,8).toString('ascii'),'%PDF-1.4');
 assert.match(bytes.subarray(-140).toString('latin1'),/%%EOF/);
 const report=await page.evaluate(()=>window.__r34Report);
 assert.ok(report&&report.questions&&report.questions.length>=10);
 assert.equal(report.summary.max,report.questions.length);
 assert.ok(report.questions.every(q=>q.question.length>3&&q.correctAnswer.length>0));
 assert.ok(report.questions.every(q=>q.awarded===(q.correct?1:0)));
 assert.equal(report.topicId,topic);
 assert.ok(!Object.keys(report).some(k=>/studentName|studentEmail|studentCode|anonymousCode/.test(k)));
 const result=await page.locator('#exportStatus').textContent();
 assert.match(result,/PDF|pdf/i);
 return {report,bytes};
}
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('R34 '+name+' full Listening PDF includes all answered and incorrect tasks, copied as text',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   const page=await context.newPage(),errors=[],writes=[];
   page.on('dialog',d=>d.accept());page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.url())});
   const topic='ll-harrison-ford';
   assert.equal((await page.goto(url('self-check/listening/student.html',{topic,level:'B2'}))).status(),200);
   await page.locator('#taskList .matching-row select').first().waitFor();
   assert.equal(await page.locator('#taskList textarea').count(),0);
   await page.locator('#taskList .matching-row select').first().selectOption('0');
   await page.locator('#taskList fieldset.question').first().locator('input').first().check();
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#exportPdf').isVisible(),true);
   const {report}=await checkPdf(page,'listening',topic);
   assert.ok(report.questions.some(q=>q.correct===false),'Must show mistakes');
   assert.ok(report.questions.some(q=>q.studentAnswer!=='Bez odpovědi'),'Must include student responses');
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,
    value:{writeText:async text=>window.__r34Copied=text}}));
   await page.locator('#exportCopy').click();
   await page.waitForFunction(()=>typeof window.__r34Copied==='string');
   const full=await page.evaluate(()=>window.__r34Copied);
   assert.match(full,/Odpoved studenta/);
   assert.match(full,/Spravna odpoved/);
   assert.match(full,/Navrh znamky/);
   assert.doesNotMatch(full,/student_name|anonymous_code|studentEmail/);
   assert.ok(report.questions.length<=70);
   assert.deepEqual(errors,[]);
   assert.deepEqual(writes,[]);
  }finally{await browser.close()}
 });
 test('R34 '+name+' Reading PDF contains all question answers and optional reflection',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   const page=await context.newPage(),errors=[];
   page.on('dialog',d=>d.accept());page.on('pageerror',e=>errors.push(e.message));
   const topic='rl-asteroids';
   assert.equal((await page.goto(url('self-check/reading/index.html',{topic,lang:'es',level:'B1'}))).status(),200);
   await page.locator('#questionList fieldset.question').first().waitFor();
   const reflection=page.locator('#reflection');
   if(await reflection.isVisible())await reflection.fill('Personal reflection for parent consultation');
   await page.locator('#questionList fieldset.question').first().locator('input').first().check();
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   const {report}=await checkPdf(page,'reading',topic);
   assert.ok(report.questions.some(q=>q.correct===false));
   assert.equal(report.reflection,'Personal reflection for parent consultation');
   assert.equal(report.questions.length,await page.locator('#questionList fieldset.question').count());
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
