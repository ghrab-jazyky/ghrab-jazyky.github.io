#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
function url(name,params){const u=new URL(name,base);for(const [k,v]of Object.entries(params))u.searchParams.set(k,v);return u.href;}
async function checkPdf(page,skill,topic){
 const pending=page.waitForEvent('download',{timeout:25000});
 await page.locator('#exportPdf').click();
 const dl=await pending;
 assert.match(dl.suggestedFilename(),new RegExp('^lsh-'+skill+'-'+topic+'-.*\\.pdf));
 const bytes=fs.readFileSync(await dl.path());
 assert.ok(bytes.length>12000,'PDF should contain rendered pages');
 assert.equal(bytes.subarray(0,8).toString('ascii'),'%PDF-1.4');
 assert.match(bytes.subarray(-140).toString('latin1'),/%%EOF/);
 const body=bytes.toString('latin1');
 const images=(body.match(/\\/Subtype \\/Image/g)||[]).length;
 const pages=(body.match(/\\/Type \\/Page \\/Parent/g)||[]).length;
 assert.ok(images>=1&&pages===images,'One JPEG image per valid PDF page');
 const result=await page.locator('#exportStatus').textContent();
 assert.match(result,/PDF|pdf/i);
 return {bytes,pages};
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
   const {pages}=await checkPdf(page,'listening',topic);
   assert.ok(pages>=1);
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,
    value:{writeText:async text=>window.__r34Copied=text}}));
   await page.locator('#exportCopy').click();
   await page.waitForFunction(()=>typeof window.__r34Copied==='string');
   const full=await page.evaluate(()=>window.__r34Copied);
   assert.match(full,/Odpoved studenta/);
   assert.match(full,/Spravna odpoved/);
   assert.match(full,/Navrh znamky/);
   assert.doesNotMatch(full,/student_name|anonymous_code|studentEmail/);
   const expected=await page.locator('#taskList fieldset.question').count()+
    await page.locator('#taskList .sequence-row').count()+
    await page.locator('#taskList .matching-row').count();
   assert.equal((full.match(/^Odpoved studenta:/gm)||[]).length,expected);
   assert.match(full,/CHYBNE/);
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
   const {pages}=await checkPdf(page,'reading',topic);
   assert.ok(pages>=1);
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,
    value:{writeText:async text=>window.__r34Copied=text}}));
   await page.locator('#exportCopy').click();
   await page.waitForFunction(()=>typeof window.__r34Copied==='string');
   const complete=await page.evaluate(()=>window.__r34Copied);
   assert.match(complete,/Personal reflection for parent consultation/);
   assert.equal((complete.match(/^Odpoved studenta:/gm)||[]).length,
    await page.locator('#questionList fieldset.question').count());
   assert.match(complete,/CHYBNE/);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
));
 const bytes=fs.readFileSync(await dl.path());
 assert.ok(bytes.length>12000,'PDF should contain rendered pages');
 assert.equal(bytes.subarray(0,8).toString('ascii'),'%PDF-1.4');
 assert.match(bytes.subarray(-140).toString('latin1'),/%%EOF/);
 const body=bytes.toString('latin1');
 const images=(body.match(/\\/Subtype \\/Image/g)||[]).length;
 const pages=(body.match(/\\/Type \\/Page \\/Parent/g)||[]).length;
 assert.ok(images>=1&&pages===images,'One JPEG image per valid PDF page');
 const result=await page.locator('#exportStatus').textContent();
 assert.match(result,/PDF|pdf/i);
 return {bytes,pages};
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
   const {pages}=await checkPdf(page,'listening',topic);
   assert.ok(pages>=1);
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,
    value:{writeText:async text=>window.__r34Copied=text}}));
   await page.locator('#exportCopy').click();
   await page.waitForFunction(()=>typeof window.__r34Copied==='string');
   const full=await page.evaluate(()=>window.__r34Copied);
   assert.match(full,/Odpoved studenta/);
   assert.match(full,/Spravna odpoved/);
   assert.match(full,/Navrh znamky/);
   assert.doesNotMatch(full,/student_name|anonymous_code|studentEmail/);
   const expected=await page.locator('#taskList fieldset.question').count()+
    await page.locator('#taskList .sequence-row').count()+
    await page.locator('#taskList .matching-row').count();
   assert.equal((full.match(/^Odpoved studenta:/gm)||[]).length,expected);
   assert.match(full,/CHYBNE/);
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
   const {pages}=await checkPdf(page,'reading',topic);
   assert.ok(pages>=1);
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,
    value:{writeText:async text=>window.__r34Copied=text}}));
   await page.locator('#exportCopy').click();
   await page.waitForFunction(()=>typeof window.__r34Copied==='string');
   const complete=await page.evaluate(()=>window.__r34Copied);
   assert.match(complete,/Personal reflection for parent consultation/);
   assert.equal((complete.match(/^Odpoved studenta:/gm)||[]).length,
    await page.locator('#questionList fieldset.question').count());
   assert.match(complete,/CHYBNE/);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
