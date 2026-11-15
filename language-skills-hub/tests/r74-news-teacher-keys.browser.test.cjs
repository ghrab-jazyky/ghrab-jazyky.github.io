#!/usr/bin/env node
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const listening=require('../self-check/listening/listening-core.js');
const teacher=require('../self-check/practice-answers/teacher-key.js');
const ROOT=path.resolve(__dirname,'..'),id='ll-how-to-choose-your-news';
const html=fs.readFileSync(path.join(ROOT,'poslech/how-to-choose-your-news/index.html'),'utf8');
const data=listening.extractJson(html,'DATA');
const entry=JSON.parse(fs.readFileSync(path.join(ROOT,'data/cards.json'),'utf8')).entries.find(e=>e.id===id);
const origin='http://127.0.0.1:8765/language-skills-hub/';
const LEVELS=['A1','A2','B1','B2','C1','C2'];
function link(level,mode){
 const u=new URL('self-check/practice-answers/teacher.html',origin);
 for(const [k,v] of Object.entries({topic:id,skill:'poslech',lang:'en',level,mode}))u.searchParams.set(k,v);
 return u.href;
}
function expected(level,mode){
 const v=listening.variant(data,level);
 return teacher.validate(mode==='practice'?
  teacher.buildListening(teacher.newsPracticeVariant(data,level,v),entry,'en',level):
  teacher.buildListeningTest(v,entry,'en',level,listening.cloze(v,id,level)));
}
async function checkPreview(page,model,level,mode){
 const rows=model.groups.flatMap(g=>g.items);
 await page.waitForFunction(n=>document.querySelectorAll('#answerPreview .key-item').length===n,
  rows.length,{timeout:25000});
 assert.equal(await page.locator('#answerMode').inputValue(),mode);
 assert.equal(await page.locator('#level').inputValue(),level);
 assert.equal(await page.locator('#topicTitle').getAttribute('data-topic-id'),id);
 const view=await page.locator('#answerPreview').textContent();
 for(const row of rows){
  assert.ok(view.includes(row.question),level+' '+mode+' missing question '+row.question.slice(0,75));
  assert.ok(view.includes(row.answer),level+' '+mode+' missing answer '+row.answer.slice(0,75));
 }
 assert.equal(rows.length===17,mode==='test',level+' '+mode+' unexpected key size');
 const event=page.waitForEvent('download',{timeout:45000});
 await page.locator('#downloadPdf').click();
 const download=await event,buf=fs.readFileSync(await download.path());
 assert.equal(buf.subarray(0,8).toString('ascii'),'%PDF-1.4',level+' '+mode+' PDF signature');
 assert.ok(buf.length>12000,level+' '+mode+' PDF too small');
}
for(const [browserName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('R74 '+browserName+': six-level NEWS practice/test teacher keys preserve separate questions and branded PDFs',
  {timeout:240000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:490,height:860}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   for(const level of LEVELS){
    // Compare teacher keys against real student-rendered PRACTICE prompts,
    // not solely against a teacher-side transformation of the same data.
    const studentUrl=new URL('poslech/how-to-choose-your-news/index.html',origin);
    studentUrl.searchParams.set('level',level);
    assert.equal((await page.goto(studentUrl.href,{waitUntil:'load',timeout:25000})).status(),200);
    await page.locator('#afterQuestions li').first().waitFor({timeout:25000});
    const visiblePre=await page.locator('#preQuestions li').allTextContents();
    const visibleAfter=await page.locator('#afterQuestions li .news-prompt').allTextContents();
    assert.equal(await page.locator('#afterQuestions .news-writing').count(),visibleAfter.length);
    const visibleVocab=await page.locator('#vocabTasks .vocab-line strong').allTextContents();
    const teacherModel=expected(level,'practice');
    const byTitle=title=>teacherModel.groups.find(g=>g.title===title)?.items.map(i=>i.question);
    assert.deepEqual(byTitle('Před poslechem – diskuse'),visiblePre,level+' student PRE parity');
    assert.deepEqual(byTitle('Speaking follow-up – diskuse'),visibleAfter,level+' student AFTER parity');
    assert.deepEqual(byTitle('Vocabulary – významy'),visibleVocab,level+' student vocabulary parity');
    const studentSequence=await page.locator('#newsSequenceItems .seq-text').allTextContents();
    const referenceSequence=data.practice[level].sequence;
    assert.deepEqual([...studentSequence].sort(),[...referenceSequence].sort(),
      level+' student reconstruction statements parity');
    assert.deepEqual(byTitle('Reconstruction – správné pořadí')?.map((_,i)=>
      teacherModel.groups.find(g=>g.title==='Reconstruction – správné pořadí').items[i].answer),
      referenceSequence,level+' teacher reconstruction answers');
    const studentChallenge=await page.locator('#newsChallengePrompts .news-prompt').allTextContents();
    const keyChallenge=byTitle('Challenge – otevřené úkoly')||[];
    assert.deepEqual(keyChallenge,studentChallenge,level+' C1-C2 extension parity');
    assert.equal(await page.locator('#newsChallengeSection').isHidden(),studentChallenge.length===0,
      level+' advanced-only visibility');
    assert.equal((await page.locator('#questionsA .task').count())+
      (await page.locator('#questionsB .task').count())+
      (await page.locator('#questionsC .task').count()),17,level+' scored student task count');
    assert.equal((await page.goto(link(level,'test'),{waitUntil:'load',timeout:25000})).status(),200);
    await page.locator('#downloadPdf:enabled').waitFor({timeout:25000});
    const testModel=expected(level,'test'),practiceModel=expected(level,'practice');
    assert.notDeepEqual(testModel.groups.flatMap(g=>g.items).map(x=>x.question),
      practiceModel.groups.flatMap(g=>g.items).map(x=>x.question),
      level+' TEST and PRACTICE keys were substituted');
    await checkPreview(page,testModel,level,'test');
    await page.locator('#answerMode').selectOption('practice');
    await page.locator('#downloadPdf:enabled').waitFor({timeout:25000});
    await checkPreview(page,practiceModel,level,'practice');
   }
   assert.deepEqual(errors,[]);
   await ctx.close();
  }finally{await browser.close()}
 });
}