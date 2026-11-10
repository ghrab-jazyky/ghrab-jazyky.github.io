#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const source=new URL('self-check/test-banks/listening/preview.html?topic=ll-harrison-ford&level=B2&timer=20&attempt=r37harrisonqa',base).href;
for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 test('R37 '+name+' teacher-controlled independent B2 Listening restores 0/1 marks and exports aggregate CSV',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   const page=await ctx.newPage(),errors=[],uploads=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))uploads.push(r.method())});
   page.on('dialog',d=>d.accept());
   assert.equal((await page.goto(source)).status(),200);
   await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:30000});
   assert.match(await page.locator('.mode').textContent(),/UNAPPROVED DRAFT/);
   assert.match(await page.locator('#notice').textContent(),/teacher controls two playbacks/i);
   assert.equal(await page.locator('#workspace').isHidden(),true);
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   assert.equal(await page.locator('.question').count()>=7,true);
   assert.equal(await page.locator('#results').isHidden(),true);
   await page.locator('fieldset.question').first().locator('input').first().check();
   await page.locator('.written-response').first().fill('Student private answer 1234');
   await page.locator('#submitButton').click();
   await page.locator('#manualGrade:not([hidden])').waitFor();
   const marks=page.locator('#manualGradeTasks select');
   assert.equal(await marks.count(),2);
   assert.equal(await page.locator('#exportResult').isDisabled(),true);
   await marks.nth(0).selectOption('1');
   await marks.nth(1).selectOption('1');
   assert.equal(await page.locator('#exportResult').isDisabled(),false);
   await page.reload();
   await page.locator('#manualGrade:not([hidden])').waitFor({timeout:30000});
   assert.equal(await marks.nth(0).inputValue(),'1');
   assert.equal(await marks.nth(1).inputValue(),'1');
   const event=page.waitForEvent('download',{timeout:15000});
   await page.locator('#exportResult').click();
   const download=await event,csv=fs.readFileSync(await download.path(),'utf8');
   assert.match(csv,/LOCAL_UNVERIFIED_NOT_SCHOOL_RECORD/);
   assert.match(csv,/ll-harrison-ford/);
   assert.doesNotMatch(csv,/Student private answer|1234/);
   assert.equal(csv.split('\r\n').length,3);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2);
   assert.deepEqual(errors,[]);
   assert.deepEqual(uploads,[]);
  }finally{await browser.close()}
 });
 test('R37 '+name+' tampered Listening source or bank fail closed before student start',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/version.json',async route=>{
    const raw=JSON.parse(fs.readFileSync(path.join(__dirname,'../version.json'),'utf8'));
    raw.contentHashes['ll-harrison-ford']='0'.repeat(64);
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(raw)});
   });
   await page.goto(source);
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/checksum mismatch/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   await page.unrouteAll();
   await page.goto(source.replace('level=B2','level=C1'));
   await page.locator('#loading.error').waitFor();
   assert.match(await page.locator('#loading').textContent(),/requires fixed topic/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
