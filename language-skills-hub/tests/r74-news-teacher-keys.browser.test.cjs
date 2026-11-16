#!/usr/bin/env node
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,firefox,webkit}=require('playwright');
const listening=require('../self-check/listening/listening-core.js');
const teacher=require('../self-check/practice-answers/teacher-key.js');
const ROOT=path.resolve(__dirname,'..'),id='ll-how-to-choose-your-news';
const html=fs.readFileSync(path.join(ROOT,'poslech/how-to-choose-your-news/index.html'),'utf8');
const data=listening.extractJson(html,'DATA');
const entry=JSON.parse(fs.readFileSync(path.join(ROOT,'data/cards.json'),'utf8')).entries.find(e=>e.id===id);
const origin='http://127.0.0.1:8765/language-skills-hub/';
const LEVELS=['A1','A2','B1','B2','C1','C2'];
function link(level,mode='test'){
 const u=new URL('self-check/practice-answers/teacher.html',origin);
 for(const [k,v] of Object.entries({topic:id,skill:'poslech',lang:'en',level,mode}))u.searchParams.set(k,v);
 return u.href;
}
function expected(level){
 const v=listening.variant(data,level);
 return teacher.validate(teacher.buildListening(teacher.newsPracticeVariant(data,level,v),entry,'en',level));
}
for(const [browserName,engine] of [['Chromium',chromium],['Firefox',firefox],['WebKit',webkit]]){
 test('Stage A '+browserName+': NEWS practice key stays faithful and TEST URL cannot expose test key',
  {timeout:240000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:490,height:860}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   for(const level of LEVELS){
    const studentUrl=new URL('poslech/how-to-choose-your-news/index.html',origin);
    studentUrl.searchParams.set('level',level);
    assert.equal((await page.goto(studentUrl.href,{waitUntil:'load',timeout:25000})).status(),200);
    await page.locator('#afterQuestions li').first().waitFor({timeout:25000});
    const visiblePre=await page.locator('#preQuestions li').allTextContents();
    const visibleAfter=await page.locator('#afterQuestions li .news-prompt').allTextContents();
    const visibleVocab=await page.locator('#vocabTasks .vocab-line strong').allTextContents();
    const model=expected(level);
    const byTitle=title=>model.groups.find(g=>g.title===title)?.items.map(i=>i.question);
    assert.deepEqual(byTitle('Před poslechem – diskuse'),visiblePre);
    assert.deepEqual(byTitle('Speaking follow-up – diskuse'),visibleAfter);
    assert.deepEqual(byTitle('Vocabulary – významy'),visibleVocab);
    const studentSequence=await page.locator('#newsSequenceItems .seq-text').allTextContents();
    assert.deepEqual([...studentSequence].sort(),[...data.practice[level].sequence].sort());
    const challenge=await page.locator('#newsChallengePrompts .news-prompt').allTextContents();
    assert.deepEqual(byTitle('Challenge – otevřené úkoly')||[],challenge);
    assert.equal((await page.goto(link(level,'test'),{waitUntil:'load',timeout:25000})).status(),200);
    await page.locator('#downloadPdf:enabled').waitFor({timeout:30000});
    assert.equal(new URL(page.url()).searchParams.get('mode'),'practice');
    assert.equal(await page.locator('#answerMode').count(),0);
    assert.match(await page.locator('.preview-mode').innerText(),/PROCVIČOVACÍ VERZE/);
    const rows=model.groups.flatMap(g=>g.items);
    assert.equal(await page.locator('#answerPreview .key-item').count(),rows.length);
    const preview=await page.locator('#answerPreview').innerText();
    for(const row of rows){assert.ok(preview.includes(row.question));assert.ok(preview.includes(row.answer))}
    const waiting=page.waitForEvent('download',{timeout:45000});
    await page.locator('#downloadPdf').click();
    const download=await waiting,buf=fs.readFileSync(await download.path());
    assert.equal(download.suggestedFilename(),'lsh-vysledky-procvicovani-'+id+'-en-'+level.toLowerCase()+'.pdf');
    assert.equal(buf.subarray(0,8).toString('ascii'),'%PDF-1.4');
    assert.ok(buf.length>12000);
   }
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
