#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const topics=['ll-matthew-oscars','ll-peaky-no-fighting'];
const base='http://127.0.0.1:8765/language-skills-hub/';
for(const [engineName,engine]of [['chromium',chromium],['webkit',webkit]]){
 for(const topic of topics){
  test('R38 '+engineName+' '+topic+' grade-review restore and CSV without answers',async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
    const u=new URL('self-check/test-banks/listening/preview.html?topic='+topic+'&level=B2&timer=20&attempt=r38'+topic.replace(/[^a-z0-9]/g,'')+'x',base);
    assert.equal((await page.goto(u.href)).status(),200);
    await page.locator('#sessionStart').waitFor({timeout:30000});
    assert.match(await page.locator('.mode').textContent(),/UNAPPROVED/);
    await page.locator('#sessionStart').click();
    await page.locator('#workspace:not([hidden])').waitFor();
    assert.equal(await page.locator('fieldset.question').count(),5);
    assert.equal(await page.locator('.written-response').count(),2);
    await page.locator('fieldset.question').first().locator('input').first().check();
    await page.locator('.written-response').first().fill('Private written response no export');
    await page.locator('#submitButton').click();
    await page.locator('#manualGrade:not([hidden])').waitFor();
    const marks=page.locator('#manualGradeTasks select');
    assert.equal(await marks.count(),2);
    await marks.first().selectOption('1');await marks.nth(1).selectOption('0');
    assert.equal(await page.locator('#exportResult').isDisabled(),false);
    await page.reload();
    await page.locator('#manualGrade:not([hidden])').waitFor();
    assert.equal(await marks.first().inputValue(),'1');
    assert.equal(await marks.nth(1).inputValue(),'0');
    const downloadPromise=page.waitForEvent('download',{timeout:15000});
    await page.locator('#exportResult').click();
    const file=await downloadPromise,csv=fs.readFileSync(await file.path(),'utf8');
    assert.match(csv,/LOCAL_UNVERIFIED_NOT_SCHOOL_RECORD/);
    assert.match(csv,new RegExp(topic));
    assert.doesNotMatch(csv,/Private written response no export/);
    assert.deepEqual(errors,[]);
   }finally{await browser.close()}
  });
 }
}
