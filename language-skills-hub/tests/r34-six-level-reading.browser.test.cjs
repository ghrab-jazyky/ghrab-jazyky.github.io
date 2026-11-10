#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const cases=[['A1',15],['A2',15],['C1',25],['C2',25]];
function url(level,timer,attempt){
 return new URL('self-check/test-banks/reading/preview.html?level='+level+
  '&timer='+timer+'&attempt='+attempt,base).href;
}
async function unlocked(page){
 if(await page.locator('#sessionLock').isVisible()){
  for(const corner of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+corner).click();
  await page.locator('#sessionLock').waitFor({state:'hidden'});
 }
}
for(const [engineName,browserType] of [['chromium',chromium],['webkit',webkit]]){
 for(const [level,timer]of cases){
  test('R34 '+engineName+' '+level+' independent draft: 10/10, mistakes-only, timer, reload',async()=>{
   const browser=await browserType.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage(),errors=[],writes=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',d=>d.accept());
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
    const bank=JSON.parse(fs.readFileSync(path.join(__dirname,
     '../self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'),'utf8'));
    assert.equal((await page.goto(url(level,timer,'r34pilot'+level.toLowerCase()))).status(),200);
    await page.locator('#sessionStart').waitFor({timeout:30000});
    assert.match(await page.locator('.mode').textContent(),new RegExp(level));
    assert.match(await page.locator('.subtitle').textContent(),new RegExp(timer+' minutes'));
    assert.equal(await page.locator('fieldset.question').count(),10);
    assert.equal(await page.locator('#readingParagraphs p').count(),level==='A1'||level==='A2'?3:4);
    assert.equal(await page.locator('#gradeProposal .grade-number').count(),0);
    assert.equal(await page.locator('#results').isHidden(),true);
    await page.locator('#sessionStart').click();
    await page.locator('#workspace:not([hidden])').waitFor();
    for(let i=0;i<10;i++){
     const q=bank.questions[i],choice=i===0?(q.answer+1)%4:q.answer;
     await page.locator('fieldset.question').nth(i).locator('input').nth(choice).check();
    }
    await page.reload();
    await page.locator('#workspace:not([hidden])').waitFor({timeout:30000});
    await unlocked(page);
    assert.equal(await page.locator('fieldset.question').first()
     .locator('input').nth((bank.questions[0].answer+1)%4).isChecked(),true);
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    assert.equal(await page.locator('#resultDetails article.review').count(),1);
    assert.match(await page.locator('#resultDetails article.review').textContent(),/Correct answer/);
    assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'1');
    await page.reload();
    await page.locator('#results:not([hidden])').waitFor({timeout:30000});
    assert.equal(await page.locator('#resultDetails article.review').count(),1);
    assert.equal(await page.locator('#submitButton').isDisabled(),true);
    await page.locator('#sessionErase').click();
    await page.reload();
    await page.locator('#sessionStart').waitFor({timeout:30000});
    assert.equal(await page.locator('#results').isHidden(),true);
    assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
    await context.close();
   }finally{await browser.close()}
  });
  test('R34 '+engineName+' '+level+' wrong timer fails closed',async()=>{
   const browser=await browserType.launch({headless:true});
   try{
    const page=await browser.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const wrong=timer===15?25:15;
    await page.goto(url(level,wrong,'r34wrongtimer'+level.toLowerCase()));
    await page.locator('#loading.error').waitFor({timeout:30000});
    assert.match(await page.locator('#loading').textContent(),/Timer must match/);
    assert.equal(await page.locator('#sessionStart').count(),0);
    assert.equal(await page.locator('#workspace').isHidden(),true);
    assert.deepEqual(errors,[]);
   }finally{await browser.close()}
  });
 }
}
