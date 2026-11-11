#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const cards=[
 {name:'Conversation',path:'konverzace/umela-inteligence/index.html',trigger:'.lshv-launch'},
 {name:'Reading',path:'cteni/asteroids/index.html',trigger:'#rl-vocab-button'},
 {name:'Listening',path:'poslech/matthew-oscars/index.html',trigger:'.lshv-launch'}
];
for(const [engineName,engine]of[['chromium',chromium],['webkit',webkit]]){
 test('R40 '+engineName+': shared vocabulary across three labs, backup transfer, games and typing exam',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({acceptDownloads:true,viewport:{width:440,height:900}});
   const first=await context.newPage();
   const errors=[];
   first.on('pageerror',e=>errors.push(e.message));
   // The same-origin dashboard must be reachable through the real card button.
   assert.equal((await first.goto(base+cards[2].path,{waitUntil:'load',timeout:30000})).status(),200);
   await first.locator(cards[2].trigger).waitFor({timeout:30000});
   const p=first.waitForEvent('popup',{timeout:20000});
   await first.locator(cards[2].trigger).click();
   const dashboard=await p;await dashboard.waitForLoadState('load');
   dashboard.on('pageerror',e=>errors.push(e.message));
   assert.match(dashboard.url(),/my-vocabulary\/index\.html/);
   await dashboard.locator('#wordList').waitFor();
   assert.equal(await dashboard.locator('#newLang').inputValue(),'en');
   const examples=[['House','dům'],['Apple','jablko'],['Book','kniha'],['Water','voda']];
   for(const [term,meaning]of examples){
    await dashboard.locator('#newTerm').fill(term);
    await dashboard.locator('#newMeaning').fill(meaning);
    await dashboard.locator('#addForm button[type=submit]').click();
   }
   await dashboard.waitForFunction(()=>document.querySelectorAll('#wordList li').length===4);
   assert.match(await dashboard.locator('#selectionCount').textContent(),/Vybráno: 4 \/ 4/);
   // Flashcards with reveal and language-independent spelling.
   await dashboard.locator('[data-view="training"]').click();
   await dashboard.locator('[data-training="flash"]').click();
   await dashboard.getByRole('button',{name:'Odhalit význam'}).click();
   assert.ok(await dashboard.locator('#trainingBoard .feedback.good').count()===1);
   await dashboard.locator('[data-training="choice"]').click();
   assert.equal(await dashboard.locator('#trainingBoard .answers button').count(),4);
   await dashboard.locator('[data-training="match"]').click();
   assert.equal(await dashboard.locator('#trainingBoard .pairs .column').count(),2);
   // Personal closed typed test: no answers displayed until final submission.
   await dashboard.locator('[data-view="exam"]').click();
   await dashboard.locator('#examCount').selectOption('all');
   await dashboard.locator('#examSetup button[type=submit]').click();
   assert.equal(await dashboard.locator('#examResults').textContent(),'');
   for(let i=0;i<4;i++){
    const question=await dashboard.locator('#examPrompt').textContent();
    const term=question.match(/^(.+?) \(/)[1];
    const correct=Object.fromEntries(examples)[term].toUpperCase();
    await dashboard.locator('#examAnswer').fill(correct);
    await dashboard.locator('#examQuestion button[type=submit]').click();
   }
   assert.match(await dashboard.locator('#examResults h3').textContent(),/4 \/ 4 správně/);
   await dashboard.locator('[data-view="words"]').click();
   // A portable Reading Lab v1-compatible backup must restore in another browser profile.
   const downloading=dashboard.waitForEvent('download');
   await dashboard.locator('#exportBackup').click();
   const file=await downloading;
   assert.match(file.suggestedFilename(),/LSH_My_vocabulary_.*\.json/);
   const bytes=fs.readFileSync(await file.path());
   const backup=JSON.parse(bytes.toString('utf8'));
   assert.equal(backup.kind,'reading-lab-vocabulary-backup');
   assert.equal(backup.schemaVersion,1);
   assert.equal(backup.vocabulary.length,4);
   const secondContext=await browser.newContext({viewport:{width:390,height:844}});
   const other=await secondContext.newPage();
   await other.goto(base+'my-vocabulary/index.html');
   await other.locator('#wordList').waitFor();
   await other.locator('#backupFile').setInputFiles({name:'slovnicek.json',mimeType:'application/json',buffer:bytes});
   await other.waitForFunction(()=>document.querySelectorAll('#wordList li').length===4,{timeout:30000});
   // Open another original student card: same database and exact four saved words.
   for(const card of cards.slice(0,2)){
    const page=await context.newPage();
    assert.equal((await page.goto(base+card.path,{waitUntil:'load',timeout:30000})).status(),200);
    await page.locator(card.trigger).waitFor({timeout:30000});
    const opened=page.waitForEvent('popup',{timeout:20000});
    await page.locator(card.trigger).click();
    const next=await opened;await next.waitForLoadState('load');
    await next.waitForFunction(()=>document.querySelectorAll('#wordList li').length===4,{timeout:30000});
    assert.equal(await next.locator('#wordList strong').filter({hasText:'House'}).count(),1);
    await next.close();await page.close();
   }
   assert.deepEqual(errors,[]);
   await other.close();await secondContext.close();
  }finally{await browser.close()}
 });
}
