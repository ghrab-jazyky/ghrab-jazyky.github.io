#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const ROOT='http://127.0.0.1:8765/language-skills-hub/';
const LEVELS=['A1','A2','B1','B2','C1','C2'];
const href=(p,opts={})=>{const u=new URL(p,ROOT);for(const [k,v] of Object.entries(opts))u.searchParams.set(k,v);return u.href;};
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test(`R69 ${name}: six-level practice, vocabulary, 17 cards, T/F/NS & matching`,{timeout:240000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   for(const level of LEVELS){
    const res=await page.goto(href('poslech/conlangs/index.html',{practice:1,lang:'en',level,zamek:1}),{waitUntil:'load'});
    assert.equal(res.status(),200,level);
    await page.locator('a.lsh-vocab-nav').waitFor({state:'visible',timeout:16000});
    assert.equal((await page.locator('#topLevelText').textContent()).trim(),level);
    assert.equal(await page.locator('#levelPills button').count(),6);
    assert.equal(await page.locator('.task').count(),17);
    assert.equal(await page.locator('#matchingBank .bank-row').count(),7);
    assert.ok((await page.locator('.lsh-vocab-save').count())>=5);
    for(const width of [320,390,768,1280]){
     await page.setViewportSize({width,height:860});
     const diff=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
     assert.ok(diff<=3,'Overflow '+level+' / '+width+' : '+diff);
    }
   }
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test(`R69 ${name}: shared teacher QR supports six selectable levels and original TED-Ed conlangs video`,{timeout:140000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(href('self-check/listening/teacher.html',{topic:'ll-conlangs',level:'A1'}));
   await page.locator('#qrMount svg').waitFor({timeout:15000});
   assert.equal(await page.locator('#topicTitle').getAttribute('data-topic-id'),'ll-conlangs');
   assert.equal(await page.locator('#level option:enabled').count(),6);
   assert.equal(await page.locator('#mediaSources a').count(),2);
   for(const level of LEVELS){
    await page.locator('#level').selectOption(level);
    const u=new URL(await page.locator('#studentUrl').inputValue());
    assert.ok(u.pathname.endsWith('/self-check/listening/student.html'));
    assert.equal(u.searchParams.get('level'),level);
    assert.equal(u.searchParams.get('topic'),'ll-conlangs');
    assert.equal(u.searchParams.get('timer'),'30');
   }
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test(`R69 ${name}: common student engine scores 17 and displays only wrong answers`,{timeout:220000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({acceptDownloads:true,viewport:{width:390,height:844}});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>d.accept());
   for(const level of LEVELS){
    await page.goto(href('self-check/listening/student.html',{topic:'ll-conlangs',level}),{waitUntil:'load'});
    await page.locator('input[name="gist-0"]').first().waitFor({timeout:14000});
    assert.equal(await page.locator('input[name^="gist-"]').count(),24);
    assert.equal(await page.locator('input[name^="detail-"]').count(),18);
    assert.equal(await page.locator('select[id^="matching-"]').count(),5);
    // The first choice is always present. Score is derived from real data, not assumed.
    const correct=await page.evaluate(async lv=>{
     const src=await (await fetch('../../poslech/conlangs/index.html')).text();
     const d=window.LSHListeningCore.extractJson(src,'DATA')[lv];return d.gist[0].correct;
    },level);
    await page.locator(`input[name="gist-0"][value="${correct}"]`).check();
    await page.locator('#submitButton').click();
    await page.locator('#gradeProposal .grade-number').waitFor({timeout:14000});
    assert.match(await page.locator('#scoreSummary').innerText(),/1 \/ 17/);
    assert.equal(await page.locator('#resultDetails .review.wrong').count(),16);
    const result=page.waitForEvent('download');await page.locator('#exportResult').click();
    const csv=await result;assert.ok(csv.suggestedFilename().endsWith('.csv'));
    const bytes=fs.readFileSync(await csv.path()).toString('utf8');assert.ok(bytes.includes('ll-conlangs'));
    const pdfDownload=page.waitForEvent('download');await page.locator('#exportPdf').click();
    const pdf=await pdfDownload;assert.ok(fs.readFileSync(await pdf.path()).subarray(0,4).toString()==='%PDF');
   }
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
 test(`R69 ${name}: one teacher key with practice/test modes, all six levels and branded PDF`,{timeout:220000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({acceptDownloads:true});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const level of LEVELS){
    await page.goto(href('self-check/practice-answers/teacher.html',
     {topic:'ll-conlangs',skill:'poslech',lang:'en',level,mode:'test'}));
    await page.locator('#downloadPdf:enabled').waitFor({timeout:18000});
    assert.equal(await page.locator('#topicTitle').getAttribute('data-topic-id'),'ll-conlangs');
    assert.equal(await page.locator('.key-item').count(),17);
    const download=page.waitForEvent('download');await page.locator('#downloadPdf').click();
    const pdf=await download;assert.ok(fs.readFileSync(await pdf.path()).subarray(0,8).toString()==='%PDF-1.4');
    await page.locator('#answerMode').selectOption('practice');
    await page.locator('#downloadPdf:enabled').waitFor({timeout:14000});
    assert.ok((await page.locator('.key-item').count())>17);
   }
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
}
