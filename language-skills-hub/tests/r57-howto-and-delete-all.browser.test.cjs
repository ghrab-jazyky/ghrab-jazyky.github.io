'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const root=process.env.LSH_R57_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const engines=process.env.LSH_R57_LIVE==='1'?[['Chromium',chromium]]:[['Chromium',chromium],['WebKit',webkit]];
for(const [label,engine] of engines){
 test('R57 '+label+': header how-to native dialog, X/Esc, preserved search and share modal',
 {timeout:120000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>{if(!/^ResizeObserver loop completed with undelivered notifications\.$/.test(e.message))errors.push(e.message)});
   await page.goto(root+'?skill=cteni');
   await page.locator('#cards article').first().waitFor();
   assert.equal(await page.locator('main #howto, main .footnote').count(),0,'No help content at bottom');
   await page.locator('#search').fill('asteroids');
   const cards=await page.locator('#cards article').count();
   await page.locator('#howtoOpen').click();
   await page.locator('#howto[open]').waitFor();
   assert.ok((await page.locator('#howto').textContent()).includes('VÝSLEDKY'));
   assert.ok((await page.locator('#howto').textContent()).includes('TEST'));
   assert.ok(await page.evaluate(()=>document.querySelector('#howto')?.matches(':modal')));
   await page.locator('#howtoClose').click();
   await page.waitForFunction(()=>!document.getElementById('howto').open);
   assert.equal(await page.locator('#search').inputValue(),'asteroids');
   assert.equal(await page.locator('#cards article').count(),cards);
   await page.locator('#howtoOpen').click();
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>!document.getElementById('howto').open);
   assert.equal(await page.locator('#howtoOpen').evaluate(el=>el===document.activeElement),true);
   assert.equal(await page.locator('#qrDialog').count(),1);
   await page.locator('#search').fill('');
   await page.locator('#cards article').first().locator('button.action').click();
   await page.locator('#qrDialog[open]').waitFor();
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>!document.getElementById('qrDialog').open);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=3));
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
 test('R57 '+label+': delete all words from all languages, cancel with ESC, reload, restore backup',
 {timeout:160000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   const page=await context.newPage(),errors=[],writes=[];
   page.on('pageerror',e=>{if(!/^ResizeObserver loop completed with undelivered notifications\.$/.test(e.message))errors.push(e.message)});
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method()+' '+r.url())});
   page.on('dialog',d=>d.accept());
   const response=await page.goto(root+'slovnicek/index.html',{waitUntil:'load'});
   assert.equal(response.status(),200);
   await page.locator('#wordCount').waitFor();
   await page.waitForFunction(()=>document.getElementById('storageStatus').textContent.includes('IndexedDB'));
   assert.equal(await page.locator('#deleteAllWords').isDisabled(),true);
   await page.evaluate(async()=>{
    const st=window.LSH_STORE.createStore({mode:'production'});
    await st.saveAnswers({skill:'cteni',topicId:'rl-asteroids',language:'en',level:'B1',
      dataVersion:'r57-preserve',answers:{},activePart:null});
    st.close();
   });
   for(const [lang,term,meaning] of [['en','apple','jablko'],['es','libro','kniha'],['fr','soleil','slunce']]){
    await page.locator('#addLanguage').selectOption(lang);
    await page.locator('#addTerm').fill(term);
    await page.locator('#addTranslation').fill(meaning);
    await page.locator('#addForm button[type=submit]').click();
    await page.waitForFunction(n=>document.querySelectorAll('.word-row').length===n,
      ['en','es','fr'].indexOf(lang)+1);
   }
   assert.equal(await page.locator('#deleteAllWords').isEnabled(),true);
   const downloadPromise=page.waitForEvent('download');
   await page.locator('#exportBtn').click();
   const d=await downloadPromise;
   const fs=require('node:fs');
   const archive=JSON.parse(fs.readFileSync(await d.path(),'utf8'));
   assert.equal(archive.words.length,3);
   await page.locator('#languageFilter').selectOption('es');
   assert.equal(await page.locator('.word-row').count(),1);
   await page.locator('#deleteAllWords').click();
   await page.locator('#clearVocabularyDialog[open]').waitFor();
   assert.match(await page.locator('#clearWordsCount').textContent(),/3 uložených/);
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>!document.getElementById('clearVocabularyDialog').open);
   assert.match(await page.locator('#wordCount').textContent(),/^3 uložených/);
   await page.locator('#deleteAllWords').click();
   await page.locator('#cancelClearWords').click();
   await page.waitForFunction(()=>!document.getElementById('clearVocabularyDialog').open);
   assert.equal(await page.locator('.word-row').count(),1);
   await page.locator('#deleteAllWords').click();
   await page.locator('#confirmClearWords').click();
   await page.waitForFunction(()=>document.getElementById('wordCount').textContent.startsWith('0 uložených'));
   assert.equal(await page.locator('#deleteAllWords').isDisabled(),true);
   assert.equal(await page.locator('#exportBtn').isDisabled(),true);
   assert.equal(await page.locator('#wordList .word-row').count(),0);
   assert.equal(await page.evaluate(async()=>{
    const st=window.LSH_STORE.createStore({mode:'production'});await st.open();
    const data={words:(await st.listWords()).length,cleared:await st.wasWordsCleared(),
      answer:await st.getAnswers('cteni','rl-asteroids','en','B1')};
    st.close();return data;
   }).then(x=>x.words===0&&x.cleared===true&&x.answer?.dataVersion==='r57-preserve'),true);
   await page.evaluate(()=>localStorage.setItem('reading-lab-vocabulary-fallback-v1',
    JSON.stringify([{id:'retired-1',language:'en',term:'ghost',meaningCs:'duch',topicIds:['instant-messages']}])));
   await page.reload();
   await page.waitForFunction(()=>document.getElementById('wordCount').textContent.startsWith('0 uložených'));
   assert.equal(await page.locator('#deleteAllWords').isDisabled(),true,'Explicitly cleared old words did not reappear');
   await page.locator('#importFile').setInputFiles({
    name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(archive))
   });
   await page.waitForFunction(()=>document.getElementById('wordCount').textContent.startsWith('3 uložených'));
   assert.equal(await page.locator('#deleteAllWords').isEnabled(),true);
   await page.locator('#languageFilter').selectOption('all');
   assert.equal(await page.locator('.word-row').count(),3);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=3));
   assert.deepEqual(writes,[]);
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
}
