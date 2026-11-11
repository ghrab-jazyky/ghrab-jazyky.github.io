#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const path=(name,params)=>{const u=new URL(name,base);for(const [k,v]of Object.entries(params))u.searchParams.set(k,v);return u.href};
for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 test('R33 '+name+' Listening tests are closed, score immediately and export anonymous CSV/copy',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   const page=await context.newPage(),errors=[],uploads=[];
   page.on('dialog',d=>d.accept());
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))uploads.push(r.method()+' '+r.url())});
   for(const [topic,level] of [
    ['ll-matthew-oscars','A1'],['ll-harrison-ford','B2'],['ll-peaky-no-fighting','C2']
   ]){
    assert.equal((await page.goto(path('self-check/listening/student.html',{topic,level}))).status(),200);
    await page.locator('#taskList .matching-bank p').first().waitFor();
    assert.equal(await page.locator('#taskList textarea').count(),0);
    assert.equal(await page.locator('#taskList .written-response').count(),0);
    assert.equal(await page.locator('#manualGrade').count(),0);
    const matches=await page.locator('.matching-row select').count();
    assert.ok(matches>=3,topic+' '+level);
    assert.equal(await page.locator('.matching-bank p').count(),matches);
    assert.deepEqual(await page.locator('#taskList .stage h3').allTextContents(),
     ['First Listening','Listen and Interpret','Listen, Match and Reconstruct']);
    assert.equal(await page.locator('#gradeProposal .grade-number').count(),0);
    await page.locator('.matching-row select').first().selectOption('0');
    await page.locator('fieldset.question').first().locator('input').first().check();
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    assert.match((await page.locator('#gradeProposal .grade-number').textContent()).trim(),/^[1-5]$/);
    assert.equal(await page.locator('#scoreSummary .score-value').count(),4);
    assert.equal(await page.locator('#exportResult').isEnabled(),true);
    assert.equal(await page.locator('#exportCopy').isEnabled(),true);
    const downloadEvent=page.waitForEvent('download',{timeout:15000});
    await page.locator('#exportResult').click();
    const download=await downloadEvent;
    assert.match(download.suggestedFilename(),new RegExp('^lsh-listening-'+topic+'-en-'+level.toLowerCase()+'-.*\\.csv$'));
    const csv=fs.readFileSync(await download.path(),'utf8');
    const expected=await page.locator('#taskList fieldset.question').count()+
     await page.locator('#taskList .sequence-row').count()+matches;
    assert.equal(csv.split('\r\n').length,expected+2);
    assert.doesNotMatch(csv,/anonymous_code|student_name|student_email/);
    assert.match(csv,/proposed_grade/);
    assert.match(csv,/awarded_points/);
    assert.match(csv,/exported_utc/);
    assert.doesNotMatch(csv,/written-response|email|studentName|teacher_review_required/);
    await page.evaluate(()=>{
     Object.defineProperty(navigator,'clipboard',{configurable:true,
      value:{writeText:async value=>{window.__r33Copied=value}}});
    });
    await page.locator('#exportCopy').click();
    await page.waitForFunction(()=>typeof window.__r33Copied==='string');
    const copied=await page.evaluate(()=>window.__r33Copied);
    assert.match(copied,/LANGUAGE SKILLS HUB/);
    assert.doesNotMatch(copied,/anonymous_code|student_name|student_email|Kod:/);
    assert.match(copied,/Navrh znamky/);
    assert.match(copied,new RegExp(topic));
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(overflow<=3,topic+' '+level+' mobile horizontal overflow '+overflow);
   }
   assert.deepEqual(errors,[]);
   assert.deepEqual(uploads,[]);
  }finally{await browser.close()}
 });
 test('R33 '+name+' Reading local archive works in ES and FR without including reflection',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
   for(const lang of ['es','fr']){
    assert.equal((await page.goto(path('self-check/reading/index.html',
     {topic:'rl-asteroids',lang,level:'B1'}))).status(),200);
    await page.locator('#questionList fieldset.question').first().waitFor();
    if(await page.locator('#reflection').isVisible())await page.locator('#reflection').fill('PRIVATE_NOTE@invalid.school');
    await page.locator('#questionList fieldset.question').first().locator('input').first().check();
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    assert.equal(await page.locator('#exportCopy').isVisible(),true);
    assert.equal(await page.locator('#exportResult').isVisible(),true);
    const downloadEvent=page.waitForEvent('download',{timeout:15000});
    await page.locator('#exportResult').click();
    const download=await downloadEvent;
    assert.match(download.suggestedFilename(),new RegExp('^lsh-reading-rl-asteroids-'+lang+'-b1-.*\\.csv$'));
    const csv=fs.readFileSync(await download.path(),'utf8');
    assert.doesNotMatch(csv,/anonymous_code|student_name|student_email/);
    assert.match(csv,/question_id/);
    assert.doesNotMatch(csv,/PRIVATE_NOTE|invalid\.school/);
    const total=await page.locator('#questionList fieldset.question').count();
    assert.equal(csv.split('\r\n').length,total+2);
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,
     value:{writeText:async value=>{window.__r33Copied=value}}}));
    await page.locator('#exportCopy').click();
    await page.waitForFunction(()=>typeof window.__r33Copied==='string');
    assert.match(await page.evaluate(()=>window.__r33Copied),/VYSLEDEK TESTU/);
   }
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test('R33 '+name+' timed Listening matching selections survive reload and grade is automatic',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const page=await context.newPage();
   page.on('dialog',d=>d.accept());
   const href=path('self-check/listening/student.html',
    {topic:'ll-harrison-ford',level:'B1',timer:'20',attempt:'r33-match-'+name+'-session'});
   assert.equal((await page.goto(href)).status(),200);
   await page.locator('#sessionStart').click();
   await page.locator('#taskList .matching-row select').first().waitFor();
   await page.locator('#match-0').selectOption('1');
   await page.reload();
   await page.locator('#taskList .matching-row select').first().waitFor();
   assert.equal(await page.locator('#match-0').inputValue(),'1');
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.match((await page.locator('#gradeProposal .grade-number').textContent()).trim(),/^[1-5]$/);
   await page.reload();
   await page.locator('#results:not([hidden])').waitFor();
   assert.match((await page.locator('#gradeProposal .grade-number').textContent()).trim(),/^[1-5]$/);
  }finally{await browser.close()}
 });
}
