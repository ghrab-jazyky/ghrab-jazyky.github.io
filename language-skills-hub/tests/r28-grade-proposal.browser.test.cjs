#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/self-check/';
for(const [engineName,engine]of [['chromium',chromium],['webkit',webkit]]){
 for(const spec of [{lang:'en',topic:'rl-asteroids',level:'B2',width:1280,height:880},
  {lang:'es',topic:'rl-can-mistakes',level:'B1',width:390,height:844}]){
  test('R28 '+engineName+' Reading '+spec.lang+'/'+spec.level+' grade after submission only',async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const ctx=await browser.newContext({viewport:{width:spec.width,height:spec.height}});
    const page=await ctx.newPage(),errors=[],writes=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method()+' '+r.url())});
    page.on('dialog',d=>d.accept());
    const u=new URL('reading/index.html',base);
    u.searchParams.set('topic',spec.topic);u.searchParams.set('lang',spec.lang);u.searchParams.set('level',spec.level);
    assert.equal((await page.goto(u.href,{waitUntil:'domcontentloaded'})).status(),200);
    await page.waitForSelector('#workspace:not([hidden])');
    assert.equal(await page.locator('#results').isHidden(),true);
    assert.equal(await page.locator('#gradeProposal .grade-number').count(),0);
    await page.locator('fieldset.question').first().locator('input[type=radio]').first().check();
    await page.locator('#submitButton').click();
    await page.waitForSelector('#results:not([hidden])');
    const grade=(await page.locator('#gradeProposal .grade-number').textContent()).trim();
    assert.match(grade,/^[1-5]$/);
    assert.match(await page.locator('#gradeProposal').textContent(),/teacher|docente|Lehrkraft|enseignant/i);
    assert.match(await page.locator('#resultDetails').textContent(),/./);
    const oldSchoolTile=(await page.locator('#scoreSummary .score-value').last().textContent()).trim();
    assert.match(oldSchoolTile,/—/,'Provisional local grade must not fill official school grade field');
    assert.equal(await page.locator('#submitButton').isDisabled(),true);
    assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2);
    assert.equal(writes.length,0);
    assert.deepEqual(errors,[]);
    await ctx.close();
   }finally{await browser.close()}
  });
 }
 test('R28 '+engineName+' Listening computes grade after automatic closed-task submission',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844}}),page=await ctx.newPage(),errors=[],writes=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method()+' '+r.url())});
   page.on('dialog',d=>d.accept());
   const u=new URL('listening/student.html',base);
   u.searchParams.set('topic','ll-harrison-ford');u.searchParams.set('level','B2');
   assert.equal((await page.goto(u.href,{waitUntil:'domcontentloaded'})).status(),200);
   await page.waitForSelector('#workspace:not([hidden])');
   assert.equal(await page.locator('#gradeProposal .grade-number').count(),0);
   assert.equal(await page.locator('textarea.written-response').count(),0);
   assert.ok(await page.locator('.matching-row select').count()>=3);
   await page.locator('fieldset.question').first().locator('input').first().check();
   await page.locator('.matching-row select').first().selectOption('0');
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.match((await page.locator('#gradeProposal .grade-number').textContent()).trim(),/^[1-5]$/);
   assert.equal(await page.locator('#manualGrade').count(),0);
   assert.equal(await page.locator('#exportPdf').isEnabled(),true);
   assert.equal(await page.locator('#submitButton').isDisabled(),true);
   assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
   await ctx.close();
  }finally{await browser.close()}
 });

}
