#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const levels=['A1','A2','B1','C1','C2'];
const banks=Object.fromEntries(levels.map(level=>[level,JSON.parse(fs.readFileSync(
 path.join(__dirname,'../self-check/test-banks/listening/ll-harrison-ford/en-'+level+'.json'),'utf8'))]));
const base='http://127.0.0.1:8765/language-skills-hub/';
const url=level=>new URL('self-check/test-banks/listening/preview.html?level='+level+
 '&timer='+banks[level].durationMinutesSuggested+'&attempt=r36teacher'+level.toLowerCase(),base).href;
async function unlock(page){
 if(await page.locator('#sessionLock').isVisible()){
  for(const corner of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+corner).click();
  await page.locator('#sessionLock').waitFor({state:'hidden'});
 }
}
for(const [browserName,engine] of [['chromium',chromium],['webkit',webkit]]){
 for(const level of levels){
  test('R36 '+browserName+' Harrison Ford EN/'+level+' independent timer, restore and manual grading',async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
    const page=await ctx.newPage(),errors=[],writes=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',d=>d.accept());
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
    assert.equal((await page.goto(url(level))).status(),200);
    await page.locator('#sessionStart').waitFor({timeout:30000});
    assert.match(await page.title(),new RegExp('Listening '+level));
    assert.equal(await page.locator('audio,video').count(),0);
    assert.equal(await page.locator('fieldset.question').count(),6);
    await page.locator('#sessionStart').click();
    await page.locator('#workspace:not([hidden])').waitFor();
    const first=banks[level].objective[0].answer;
    await page.locator('fieldset.question').first().locator('input').nth(first).check();
    await page.locator('.written-response').first().fill('Student private text only local.');
    await page.reload();
    await page.locator('#workspace:not([hidden])').waitFor();
    await unlock(page);
    assert.equal(await page.locator('fieldset.question').first().locator('input').nth(first).isChecked(),true);
    assert.equal(await page.locator('.written-response').first().inputValue(),'Student private text only local.');
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    assert.equal(await page.locator('#teacherTasks select').count(),2);
    assert.equal(await page.locator('#exportResult').isDisabled(),true);
    assert.equal(await page.locator('#gradeProposal .grade-number').count(),0);
    await page.locator('#teacherTasks select').nth(0).selectOption('1');
    await page.locator('#teacherTasks select').nth(1).selectOption('0');
    assert.equal(await page.locator('#exportResult').isDisabled(),false);
    assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'5');
    await page.reload();
    await page.locator('#results:not([hidden])').waitFor();
    assert.equal(await page.locator('#teacherTasks select').nth(0).inputValue(),'1');
    assert.equal(await page.locator('#teacherTasks select').nth(1).inputValue(),'0');
    assert.equal(await page.locator('#exportResult').isDisabled(),false);
    const requested=page.waitForEvent('download',{timeout:20000});
    await page.locator('#exportResult').click();
    const downloaded=await requested;
    assert.match(downloaded.suggestedFilename(),new RegExp('harrison-ford-'+level.toLowerCase()+'-unverified\\.csv$'));
    const csv=fs.readFileSync(await downloaded.path(),'utf8');
    assert.match(csv,/LOCAL_UNVERIFIED_NOT_SCHOOL_RECORD/);
    assert.doesNotMatch(csv,/Student private text only local/);
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
    await ctx.close();
   }finally{await browser.close()}
  });
 }
 test('R36 '+browserName+' a valid A1 bank substituted for A2 is rejected before Start',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/ll-harrison-ford/en-A2.json',route=>route.fulfill({
    status:200,contentType:'application/json',body:JSON.stringify(banks.A1)
   }));
   await page.goto(url('A2'));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/not the requested level/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
