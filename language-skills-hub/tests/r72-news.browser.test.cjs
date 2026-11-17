#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base=process.env.LSH_R72_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const url=(p,params={})=>{const u=new URL(p,base);for(const [k,v] of Object.entries(params))u.searchParams.set(k,v);return u.href;};
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('R72 '+engineName+' all 6 CEFR: native practice, accessibility, separated banks, 320-1280 layout', {timeout:180000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({acceptDownloads:true});
   for(const level of ['A1','A2','B1','B2','C1','C2']){
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const response=await page.goto(url('poslech/how-to-choose-your-news/index.html',{level}));
    assert.equal(response.status(),200);
    await page.locator('#questionsA .task').first().waitFor();
    assert.equal(await page.locator('#questionsA .task').count(),6);
    assert.equal(await page.locator('#questionsB .task').count(),6);
    assert.equal(await page.locator('#questionsC .task').count(),5);
    assert.equal((await page.locator('#topLevelText').innerText()).trim(),level);
    assert.equal(await page.locator('#questionsA fieldset .sr-only-task-legend').count(),6);
    assert.equal(await page.locator('#questionsB fieldset .sr-only-task-legend').count(),6);
    assert.equal(await page.locator('.lsh-vocab-save').count()>=5,true);
    assert.equal(await page.locator('#afterQuestions .news-prompt').count(),3);
    assert.equal(await page.locator('#afterQuestions textarea.news-writing').count(),3);
    assert.equal(await page.locator('#newsAfter0').getAttribute('aria-describedby'),'newsAfterPrompt0');
    assert.equal(await page.locator('#newsVocabQuiz select').count(),7);
    assert.equal(await page.locator('#newsSequenceItems>li').count(),
     level==='A1'?4:level==='A2'?5:level==='B1'?6:7);
    assert.equal(await page.locator('#newsChallengePrompts .news-prompt').count(),
     (level==='C1'||level==='C2')?2:0);
    assert.equal(await page.locator('#newsChallengeSection').isHidden(),
     level!=='C1'&&level!=='C2');
    assert.equal(await page.locator('.side nav a[href="#newsSequenceSection"]').count(),1);
    assert.match(await page.locator('#newsScaffold').innerText(),new RegExp('Level '+level));
    assert.match(await page.locator('#newsDuration').innerText(),/Suggested .*min/);
    assert.equal(await page.locator('link[href="news-practice-extras.css"]').count(),1);
    await page.locator('#questionsA .task').first().locator('input[type=radio]').first().check();
    assert.match((await page.locator('#progressStatus').innerText()),/^1 of 17/);
    await page.locator('#checkA').click();
    assert.match((await page.locator('#statusA').innerText()),/Correct answers:/);
    for(const width of [320,390,768,1280]){
     await page.setViewportSize({width,height:840});
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
     assert.equal(overflow,false,'horizontal overflow '+level+' '+width);
    }
    assert.deepEqual(errors,[],'page errors '+level);
    await page.close();
   }
   await context.close();
  }finally{await browser.close()}
 });
 test('R72 '+engineName+' native teacher TEST setup, student 17 objectives, mistake-only review and keys',{timeout:160000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:390,height:844}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url('self-check/listening/teacher.html',{topic:'ll-how-to-choose-your-news',level:'B2'}));
   assert.equal(await page.locator('#topicTitle').getAttribute('data-topic-id'),'ll-how-to-choose-your-news');
   assert.equal(await page.locator('#studentUrl').inputValue(),'','Unconfirmed draft must have no link');
    await page.locator('#confirmTest:enabled').click();
    const studentLink=await page.locator('#studentUrl').inputValue();
   assert.match(studentLink,/topic=ll-how-to-choose-your-news/);
   assert.match(studentLink,/timer=/);
   const student=await ctx.newPage();student.on('pageerror',e=>errors.push(e.message));student.on('dialog',d=>d.accept());
   await student.goto(url('self-check/listening/student.html',{topic:'ll-how-to-choose-your-news',level:'B2'}));
   await student.locator('#workspace:not([hidden])').waitFor();
   assert.equal(await student.locator('fieldset.question').count(),12);
   assert.equal(await student.locator('select[id^="matching-"]').count(),5);
   assert.equal(await student.locator('iframe,video,audio').count(),0);
   await student.locator('#submitButton').click();
   await student.locator('#results:not([hidden])').waitFor();
   assert.ok(await student.locator('#resultDetails').innerText());
   assert.equal(await student.locator('#submitButton').isDisabled(),true);
   const key=await ctx.newPage();key.on('pageerror',e=>errors.push(e.message));
   await key.goto(url('self-check/practice-answers/teacher.html',{
    topic:'ll-how-to-choose-your-news',skill:'poslech',lang:'en',level:'B2',mode:'test'
   }));
   await key.locator('#downloadPdf:not([disabled])').waitFor();
   const examText=await key.locator('#answerPreview').innerText();
   assert.ok(examText.includes('How to Choose Your News'));
   await key.locator('#answerMode').selectOption('practice');
   await key.locator('#downloadPdf:not([disabled])').waitFor();
   const practiceText=await key.locator('#answerPreview').innerText();
   assert.notEqual(examText,practiceText);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });

 test('R72 '+engineName+' E8 practice writing persistence, check-all, TXT export and embedded replay', {timeout:150000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:390,height:844}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',dialog=>dialog.accept());
   await page.route('**/youtube-nocookie.com/**',route=>route.abort());
   assert.equal((await page.goto(url('poslech/how-to-choose-your-news/index.html',{level:'B2'}))).status(),200);
   await page.locator('#newsAfter0').waitFor();
   await page.locator('#newsNotes').fill('Compare primary sources with editorial reports.');
   await page.locator('#newsAfter0').fill('Check original material and compare different sources.');
   await page.locator('#newsSentence').fill('The headline may be misleading.');
   await page.locator('#newsVocabPractice summary').click();
   await page.locator('#newsVocabSelect0').selectOption('0');
   await page.locator('#checkVocabBtn').click();
   assert.match(await page.locator('#newsVocabStatus').innerText(),/Optional vocabulary: 1 \/ 7 correct/);
   await page.locator('#questionsA .task').first().locator('input[type=radio]').first().check();
   assert.match(await page.locator('#writingStatus').innerText(),/1 \/ 3 after-listening responses drafted/);
   assert.match(await page.locator('#progressStatus').innerText(),/^1 of 17/);
   await page.locator('#checkAllBtn').click();
   assert.equal(await page.locator('#reviewA .review').count(),6);
   assert.equal(await page.locator('#reviewB .review').count(),6);
   assert.equal(await page.locator('#reviewC .review').count(),5);
   for(const section of 'ABC')assert.match(await page.locator('#status'+section).innerText(),/Correct answers:/);
   const event=page.waitForEvent('download',{timeout:20000});
   await page.locator('#exportBtn').click();
   const download=await event;
   assert.equal(download.suggestedFilename(),'LSH_News_Practice_B2_Answers.txt');
   const saved=fs.readFileSync(await download.path(),'utf8');
   for(const phrase of ['Compare primary sources with editorial reports.',
    'Check original material and compare different sources.',
    'The headline may be misleading.','AUTOMATICALLY CHECKABLE PRACTICE','AFTER LISTENING']){
    assert.ok(saved.includes(phrase),'Missing exported item: '+phrase);
   }
   await page.reload();
   await page.locator('#newsAfter0').waitFor();
   assert.equal(await page.locator('#newsNotes').inputValue(),'Compare primary sources with editorial reports.');
   assert.equal(await page.locator('#newsAfter0').inputValue(),
    'Check original material and compare different sources.');
   assert.equal(await page.locator('#newsSentence').inputValue(),'The headline may be misleading.');
   assert.equal(await page.locator('#newsVocabSelect0').inputValue(),'0');
   assert.match(await page.locator('#progressStatus').innerText(),/^1 of 17/);
   await page.locator('#levelPills button[data-level="A1"]').click();
   assert.equal(await page.locator('#newsNotes').inputValue(),'');
   assert.equal(await page.locator('#newsVocabSelect0').inputValue(),'');
   await page.locator('#newsAfter0').fill('A1 has its own notes.');
   await page.locator('#levelPills button[data-level="B2"]').click();
   assert.equal(await page.locator('#newsAfter0').inputValue(),
    'Check original material and compare different sources.');
   assert.equal(await page.locator('#newsVocabSelect0').inputValue(),'0');
   await page.locator('#loadVideo').click();
   assert.equal(await page.locator('#videoFrame iframe').count(),1);
   assert.equal(await page.locator('#closeVideoBtn').isHidden(),false);
   await page.locator('#closeVideoBtn').click();
   assert.equal(await page.locator('#videoFrame iframe').count(),0);
   assert.equal(await page.locator('#videoFrame #videoCover').count(),1);
   await page.locator('#loadVideo').click();
   assert.equal(await page.locator('#videoFrame iframe').count(),1);
   await page.locator('#closeVideoBtn').click();
   await page.locator('#clearBtn').click();
   await page.reload();
   await page.locator('#newsAfter0').waitFor();
   assert.equal(await page.locator('#newsNotes').inputValue(),'');
   assert.equal(await page.locator('#newsAfter0').inputValue(),'');
   assert.equal(await page.locator('#newsSentence').inputValue(),'');
   assert.equal(await page.locator('#newsVocabSelect0').inputValue(),'');
   assert.match(await page.locator('#progressStatus').innerText(),/^0 of 17/);
   assert.deepEqual(errors,[]);
   await ctx.close();
  }finally{await browser.close()}
 });


 test('R72 '+engineName+' E9 optional reconstruction and C1-C2 writing persist independently of TEST', {timeout:150000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:390,height:844}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>d.accept());
   assert.equal((await page.goto(url('poslech/how-to-choose-your-news/index.html',{level:'C2'}))).status(),200);
   await page.locator('#newsSequenceItems>li').first().waitFor();
   assert.equal(await page.locator('#newsSequenceItems>li').count(),7);
   assert.equal(await page.locator('#newsChallengePrompts textarea').count(),2);
   const initial=await page.locator('#newsSequenceItems .seq-text').allTextContents();
   assert.equal(await page.locator('#newsSequenceItems .seq-grip').count(),7);
   // Harrison-style: tap a card, then tap its target position.
   await page.locator('#newsSequenceItems .seq-card').nth(0).click();
   await page.locator('#newsSequenceItems .seq-card').nth(1).click();
   await page.locator('#checkSequenceBtn').click();
   assert.match(await page.locator('#newsSequenceStatus').innerText(),/Reconstruction: 3 \/ 7/);
   assert.equal(await page.locator('#newsSequenceReview .review').count(),4);
   assert.equal(await page.locator('#newsSequenceItems .seq-text').first().innerText(),initial[1]);
   await page.locator('#newsSequenceItems .seq-card').nth(2).click();
   await page.locator('#newsSequenceItems .seq-card').nth(3).click();
   await page.locator('#newsSequenceItems .seq-card').nth(4).click();
   await page.locator('#newsSequenceItems .seq-card').nth(5).click();
   await page.locator('#checkSequenceBtn').click();
   assert.match(await page.locator('#newsSequenceStatus').innerText(),/Reconstruction: 7 \/ 7/);
   assert.equal(await page.locator('#newsSequenceReview .review').count(),0);
   await page.locator('#newsChallenge0').fill(
    'More sources may amplify the same error without independent verification.');
   await page.locator('#newsChallenge1').fill(
    'I would verify original evidence and wait for independent confirmation.');
   const downloadEvent=page.waitForEvent('download',{timeout:20000});
   await page.locator('#exportBtn').click();
   const dl=await downloadEvent,content=fs.readFileSync(await dl.path(),'utf8');
   for(const key of ['RECONSTRUCTION OF IDEAS',
    'ADVANCED EXTENSION','More sources may amplify the same error',
    'I would verify original evidence','Position 7:'])
    assert.ok(content.includes(key),'E9 TXT missing '+key);
   await page.reload();await page.locator('#newsSequenceItems>li').first().waitFor();
   assert.equal(await page.locator('#newsSequenceItems .seq-text').first().innerText(),initial[1]);
   assert.match(await page.locator('#newsChallenge0').inputValue(),/More sources may amplify/);
   await page.locator('#levelPills button[data-level="A1"]').click();
   assert.equal(await page.locator('#newsSequenceItems>li').count(),4);
   assert.equal(await page.locator('#newsChallengeSection').isHidden(),true);
   await page.locator('#levelPills button[data-level="C2"]').click();
   assert.equal(await page.locator('#newsSequenceItems>li').count(),7);
   assert.equal(await page.locator('#newsChallengeSection').isHidden(),false);
   assert.match(await page.locator('#newsChallenge0').inputValue(),/More sources may amplify/);
   await page.locator('#clearBtn').click();
   await page.reload();await page.locator('#newsSequenceItems>li').first().waitFor();
   assert.equal(await page.locator('#newsSequenceItems .seq-text').first().innerText(),initial[0]);
   assert.equal(await page.locator('#newsChallenge0').inputValue(),'');
   assert.deepEqual(errors,[]);
   await ctx.close();
  }finally{await browser.close()}
 });


 test('E10 '+engineName+' safe storage failure: visible save warning, failed erase not falsely confirmed',
  {timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844}});
   const page=await ctx.newPage(),errors=[],alerts=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',async d=>{if(d.type()==='alert')alerts.push(d.message());await d.accept()});
   await page.goto(url('poslech/how-to-choose-your-news/index.html',{level:'B1'}));
   await page.locator('#questionsA .task').first().waitFor();
   await page.evaluate(()=>{
    window.__originalSetItem=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
     if(key.startsWith('lsh:how-to-choose-your-news:practice:e3:'))
      throw Error('E10 simulated storage write failure');
     return window.__originalSetItem.call(this,key,value);
    };
   });
   await page.locator('#questionsA .task').first().locator('input[type=radio]').first().check();
   assert.match(await page.locator('#progressStatus').innerText(),/1 of 17 questions answered/);
   assert.match(await page.locator('#progressStatus').innerText(),/Local saving unavailable/);
   await page.evaluate(()=>{Storage.prototype.setItem=window.__originalSetItem});
   await page.locator('#newsNotes').fill('My independent written explanation.');
   const saved=await page.evaluate(()=>localStorage.getItem('lsh:how-to-choose-your-news:writing:e8:B1'));
   assert.ok(saved&&saved.includes('My independent written explanation.'));
   await page.evaluate(()=>{
    window.__originalRemoveItem=Storage.prototype.removeItem;
    Storage.prototype.removeItem=function(key){
     if(key.startsWith('lsh:how-to-choose-your-news:writing:e8:'))
      throw Error('E10 simulated deletion failure');
     return window.__originalRemoveItem.call(this,key);
    };
   });
   await page.locator('#clearBtn').click();
   assert.ok(alerts.some(m=>m.includes('Deletion could not be verified')));
   assert.equal(await page.locator('#newsNotes').inputValue(),'My independent written explanation.');
   assert.ok((await page.evaluate(()=>localStorage.getItem(
    'lsh:how-to-choose-your-news:writing:e8:B1'))).includes('My independent written explanation.'));
   await page.evaluate(()=>{Storage.prototype.removeItem=window.__originalRemoveItem});
   await page.locator('#clearBtn').click();
   assert.equal(await page.locator('#newsNotes').inputValue(),'');
   assert.deepEqual(errors,[]);
   await ctx.close();
  }finally{await browser.close()}
 });

}
