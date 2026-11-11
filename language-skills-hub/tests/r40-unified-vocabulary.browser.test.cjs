#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const url=path=>new URL(path,base).href;
const formWord=async(page,lang,term,meaning)=>{
 await page.locator('#addLanguage').selectOption(lang);
 await page.locator('#addTerm').fill(term);
 await page.locator('#addMeaning').fill(meaning);
 await page.locator('#addForm button[type=submit]').click();
 await page.locator('#wordList .word-title').filter({hasText:term}).first().waitFor({timeout:20000});
};
const count=async page=>Number(await page.locator('#wordCount').textContent());
function diagnostics(page){
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 return errors;
}
for(const [engineName,engine]of[['chromium',chromium],['webkit',webkit]]){
 test('R40 '+engineName+': 3 games, backup, cross-device import, old Reading and new Listening integration',async()=>{
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
  try{
   const page=await context.newPage(),errors=diagnostics(page);
   assert.equal((await page.goto(url('slovnicek/index.html'),{waitUntil:'load'})).status(),200);
   await page.locator('#storageNotice.ready').waitFor({timeout:20000});
   assert.equal(await count(page),0);
   await formWord(page,'en','decision','rozhodnutí');
   await formWord(page,'es','amistad','přátelství');
   await formWord(page,'de','die Reise','cesta');
   assert.equal(await count(page),3);
   assert.equal(await page.locator('#selectedCount').textContent(),'3');
   // Flashcards: reveal / mark known; changes are saved without leaving page.
   await page.locator('#startFlash').click();
   await page.locator('#practiceArea').getByRole('button',{name:'Ukázat význam'}).click();
   assert.ok(await page.locator('#practiceArea .practice-solution').textContent());
   await page.locator('#practiceArea').getByRole('button',{name:'Umím',exact:true}).click();
   assert.ok(await page.locator('#practiceArea').isVisible());
   await page.locator('#practiceArea').getByRole('button',{name:'Ukončit'}).click();
   // Pairing game: both columns remain stable on each click.
   await page.locator('#startMatch').click();
   const pairs=[['decision · EN','rozhodnutí'],['amistad · ES','přátelství'],['die Reise · DE','cesta']];
   for(const [term,meaning]of pairs){
    await page.locator('#practiceArea').getByRole('button',{name:term}).click();
    await page.locator('#practiceArea').getByRole('button',{name:meaning}).click();
   }
   assert.match(await page.locator('#practiceArea').textContent(),/Všechny dvojice správně/);
   await page.locator('#practiceArea').getByRole('button',{name:'Ukončit'}).click();
   // Test mode: no visible answer bank, no result until all answers submitted.
   await page.locator('#startExam').click();
   const answers={'decision':'ROZHODNUTI.','amistad':'přátelství','die Reise':'cesta'};
   for(let i=0;i<3;i++){
    const term=await page.locator('#practiceArea .practice-term').textContent();
    assert.ok(answers[term],term);
    assert.equal(await page.locator('#practiceArea .exam-results').count(),0);
    await page.locator('#practiceArea .question-wrap input').fill(answers[term]);
    await page.locator('#practiceArea .question-wrap button[type=submit]').click();
   }
   assert.match(await page.locator('.exam-score').textContent(),/3 \/ 3/);
   // Export JSON includes all languages and learning history.
   const event=page.waitForEvent('download',{timeout:20000});
   await page.locator('#exportBackup').click();
   const download=await event,bytes=fs.readFileSync(await download.path());
   const backup=JSON.parse(bytes.toString('utf8'));
   assert.equal(backup.kind,'lsh-slovnicek');
   assert.equal(backup.schemaVersion,1);
   assert.equal(backup.words.length,3);
   assert.ok(backup.words.some(w=>w.language==='es'));
   assert.ok(backup.words.some(w=>w.reviews.length>=1),'Exam/flashcard progress missing');
   const independent=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   try{
    const other=await independent.newPage(),otherErrors=diagnostics(other);
    await other.goto(url('slovnicek/index.html'));
    await other.locator('#storageNotice.ready').waitFor({timeout:20000});
    assert.equal(await count(other),0,'Independent device must not see old local data');
    await other.locator('#importBackup').click();
    await other.locator('#backupFile').setInputFiles({
     name:'lsh-vocab.json',mimeType:'application/json',buffer:bytes});
    await other.waitForFunction(()=>document.querySelector('#wordCount')?.textContent==='3',{timeout:15000});
    assert.equal(await count(other),3);
    await formWord(other,'fr','bonjour','dobrý den');
    assert.equal(await count(other),4);
    await other.locator('#importBackup').click();
    await other.locator('#backupFile').setInputFiles({name:'lsh-vocab.json',mimeType:'application/json',buffer:bytes});
    await other.waitForFunction(()=>/Obnoveno 3 položek/.test(document.querySelector('#globalStatus')?.textContent||''),{timeout:15000});
    assert.equal(await count(other),4,'Merge must keep words already present');
    other.once('dialog',dlg=>dlg.accept());
    await other.locator('#replaceBackup').click();
    await other.locator('#backupFile').setInputFiles({name:'lsh-vocab.json',mimeType:'application/json',buffer:bytes});
    await other.waitForFunction(()=>document.querySelector('#wordCount')?.textContent==='3',{timeout:15000});
    assert.equal(await count(other),3,'Replace must discard only previous set');
    assert.deepEqual(otherErrors,[]);
   }finally{await independent.close()}
   // Existing Reading vocabulary from before R40 is migrated when opening My Vocabulary.
   await page.goto(url('cteni/asteroids/index.html?lang=en&level=B2'),{waitUntil:'domcontentloaded'});
   const readingButton=page.locator('#rl-vocab-button');
   await readingButton.waitFor({timeout:30000});
   await page.waitForFunction(()=>document.querySelector('#rl-vocab-button')?.dataset.lshSharedVocabulary==='true',
    {timeout:30000});
   await page.evaluate(()=>window.ReadingLabVocab.save({
    language:'en',term:'moonrise',meaningCs:'východ měsíce',level:'B2',
    topicIds:['asteroids-planetary-defence']
   }));
   await readingButton.click();
   await page.waitForURL(/\/slovnicek\/index\.html/,{timeout:25000});
   await page.locator('#storageNotice.ready').waitFor({timeout:30000});
   await page.locator('#wordList .word-title').filter({hasText:'moonrise'}).first().waitFor({timeout:30000});
   assert.equal(await count(page),4,'Legacy Reading word not migrated to canonical vocabulary');
   // A deleted legacy word must NOT reappear at the next reload.
   const row=page.locator('.word-entry').filter({hasText:'moonrise'});
   page.once('dialog',dlg=>dlg.accept());
   await row.getByRole('button',{name:'Smazat'}).click();
   await page.waitForFunction(()=>document.querySelector('#wordCount')?.textContent==='3',{timeout:15000});
   await page.reload();
   await page.locator('#storageNotice.ready').waitFor({timeout:30000});
   assert.equal(await count(page),3,'Deleted legacy word resurrected after migration');
   // Listening exposes new navigation and saving without touching score controls.
   await page.goto(url('poslech/matthew-oscars/index.html?level=B2&practice=1'),{waitUntil:'domcontentloaded'});
   await page.locator('#lshSharedVocabulary').waitFor({timeout:25000});
   await page.locator('#vocabTasks .lsh-vocab-save').first().waitFor({timeout:25000});
   assert.ok(await page.locator('#vocabTasks .lsh-vocab-save').count()>=2);
   await page.locator('#vocabTasks .lsh-vocab-save').first().click();
   await page.locator('#lshListeningVocabStatus').getByText(/Saved locally/).waitFor({timeout:15000});
   await page.locator('#lshSharedVocabulary').click();
   await page.waitForURL(/\/slovnicek\/index\.html/,{timeout:15000});
   await page.locator('#storageNotice.ready').waitFor({timeout:15000});
   assert.equal(await count(page),4,'Listening word not saved into shared vocabulary');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=3,'Mobile vocabulary horizontal overflow '+overflow);
   assert.deepEqual(errors,[]);
  }finally{await context.close();await browser.close()}
 });
}
