#!/usr/bin/env node
'use strict';
// R64: the PDF report never leaves without the official school logo.
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const page_url='http://127.0.0.1:8765/language-skills-hub/self-check/listening/student.html?topic=ll-harrison-ford&level=B2';
const LOGO='**/assets/school-logo.png*';
const load=page=>page.evaluate(()=>window.LSHPdfReport.loadSchoolLogo(document).then(i=>'ok:'+i.naturalWidth,e=>'error:'+e.message));
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('R64 '+name+': logo fetched at page load survives a later loss of connection',{timeout:120000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await (await browser.newContext()).newPage();
   await page.goto(page_url);
   await page.waitForFunction(()=>!!window.LSHPdfReport);
   assert.equal(await page.evaluate(()=>window.LSHPdfReport.preloadSchoolLogo(document).then(i=>i.naturalWidth)),384);
   await page.route(LOGO,r=>r.abort());
   assert.equal(await load(page),'ok:384');
  }finally{await browser.close()}
 });
 test('R64 '+name+': logo download is retried and a permanent failure gives a clear message and no PDF',{timeout:120000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await (await browser.newContext()).newPage();
   let calls=0;
   await page.route(LOGO,r=>{calls++;return calls<=2?r.abort():r.continue()});
   await page.goto(page_url);
   await page.waitForFunction(()=>!!window.LSHPdfReport);
   assert.equal(await load(page),'ok:384');
   assert.ok(calls>=3,'the logo request was retried');
   const page2=await (await browser.newContext()).newPage();
   await page2.route(LOGO,r=>r.abort());
   await page2.goto(page_url);
   await page2.waitForFunction(()=>!!window.LSHPdfReport);
   assert.match(await load(page2),/^error:Logo školy se nepodařilo načíst/);
   assert.match(await page2.evaluate(()=>window.LSHPdfReport.generate({}).then(()=> 'pdf',e=>'error:'+e.message)),/^error:/);
  }finally{await browser.close()}
 });
}
