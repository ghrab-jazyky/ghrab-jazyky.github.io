#!/usr/bin/env node
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('R29 '+engineName+' Reading all-correct submission shows no correct answer review cards',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}});
   const errors=[];
   page.on('pageerror',err=>errors.push(err.message));
   page.on('dialog',dialog=>dialog.accept());
   const url=new URL('self-check/reading/index.html?topic=rl-asteroids&lang=en&level=B1',base);
   assert.equal((await page.goto(url.href)).status(),200);
   await page.locator('#workspace:not([hidden])').waitFor();
   const correct=await page.evaluate(async()=>{
    const catalog=await (await fetch('../../data/cards.json')).json();
    const entry=window.LSHReadingCore.readingEntry(catalog,'rl-asteroids');
    const html=await (await fetch('../../'+entry.relative)).text();
    const data=window.LSHReadingCore.parseReadingData(html);
    return window.LSHReadingCore.variantFromData(data,'en','B1').questions.map(q=>q.answer);
   });
   const questions=page.locator('fieldset.question');
   assert.equal(await questions.count(),correct.length);
   for(let i=0;i<correct.length;i++)await questions.nth(i).locator('input[type=radio]').nth(correct[i]).check();
   assert.equal(await page.locator('#results').isHidden(),true);
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal((await page.locator('#gradeProposal .grade-number').textContent()).trim(),'1');
   assert.equal(await page.locator('#resultDetails article.review').count(),0);
   assert.match(await page.locator('#resultDetails').textContent(),/All answers are correct/);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test('R29 '+engineName+' Reading one incorrect answer shows only one review card with correction',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}});
   const errors=[];
   page.on('pageerror',err=>errors.push(err.message));
   page.on('dialog',dialog=>dialog.accept());
   assert.equal((await page.goto(new URL('self-check/reading/index.html?topic=rl-asteroids&lang=en&level=B1',base).href)).status(),200);
   await page.locator('#workspace:not([hidden])').waitFor();
   const correct=await page.evaluate(async()=>{
    const catalog=await (await fetch('../../data/cards.json')).json();
    const entry=window.LSHReadingCore.readingEntry(catalog,'rl-asteroids');
    const data=window.LSHReadingCore.parseReadingData(await (await fetch('../../'+entry.relative)).text());
    return window.LSHReadingCore.variantFromData(data,'en','B1').questions.map(q=>q.answer);
   });
   const questions=page.locator('fieldset.question');
   for(let i=0;i<correct.length;i++){
    const total=await questions.nth(i).locator('input[type=radio]').count();
    await questions.nth(i).locator('input[type=radio]').nth(i===0?(correct[i]+1)%total:correct[i]).check();
   }
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#resultDetails article.review').count(),1);
   assert.match(await page.locator('#resultDetails article.review').textContent(),/Correct answer/);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test('R29 '+engineName+' Listening result displays only objective mistakes but all teacher-reviewed writing',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}});
   const errors=[];
   page.on('pageerror',err=>errors.push(err.message));
   page.on('dialog',dialog=>dialog.accept());
   const u=new URL('self-check/listening/student.html?topic=ll-matthew-oscars&level=B1',base);
   assert.equal((await page.goto(u.href)).status(),200);
   await page.locator('#workspace:not([hidden])').waitFor();
   const plan=await page.evaluate(async()=>{
    const catalog=await (await fetch('../../data/cards.json')).json();
    const entry=window.LSHListeningCore.catalogEntry(catalog,'ll-matthew-oscars');
    const data=window.LSHListeningCore.extractJson(await (await fetch('../../'+entry.relative)).text(),'DATA');
    return window.LSHListeningCore.variant(data,'B1');
   });
   for(const [part,offset]of [['gist',0],['detail',plan.gist.length]]){
    for(let i=0;i<plan[part].length;i++){
     const q=plan[part][i];
     const field=page.locator('fieldset.question').nth(offset+i);
     if(q.type==='single')await field.locator('input').nth(q.correct).check();
     else for(const idx of q.correct)await field.locator('input').nth(idx).check();
    }
   }
   for(let i=0;i<plan.sequence.length;i++){
    const selects=page.locator('#taskList select.select-response');
    const opts=await selects.nth(i).locator('option').evaluateAll(els=>els.map(el=>({value:el.value,text:el.textContent})));
    const expected=plan.sequence[i];
    const match=opts.find(o=>o.text.endsWith(' — '+expected));
    assert.ok(match,'Expected sequence statement available');
    await selects.nth(i).selectOption(match.value);
   }
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#resultDetails article.review:not(.manual)').count(),0);
   assert.equal(await page.locator('#resultDetails article.review.manual').count(),plan.facts.length+plan.open.length);
   assert.match(await page.locator('#resultDetails').textContent(),/No objective mistakes to review/);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
