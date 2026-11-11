#!/usr/bin/env node
'use strict';
// The teacher lock note on Conversation Lab cards follows the locked card language.
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/konverzace/';
const expected={en:'Teacher-selected language and CEFR level.',es:'Idioma y nivel MCER seleccionados por el profesor.',
 de:'Sprache und GER-Niveau wurden von der Lehrkraft gewählt.',fr:'Langue et niveau CECR définis par l’enseignant.'};
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('Lock note '+name+' is shown in the card language',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   for(const card of ['rodina','umela-inteligence'])for(const lang of Object.keys(expected)){
    await page.goto(base+card+'/index.html?practice=1&lang='+lang+'&level=B2&zamek=1');
    const note=page.locator('.controls .pill[role="status"]');
    await note.waitFor();
    assert.equal((await note.textContent()).trim(),'🔒 '+expected[lang],card+' '+lang);
    assert.equal(await note.getAttribute('lang'),lang);
    assert.equal(await page.locator('#languageSelect').isDisabled(),true);
    assert.doesNotMatch(await page.locator('#languageSelect').getAttribute('title'),/učitel|přednastavil/);
   }
   await page.goto(base+'rodina/index.html?practice=1');
   assert.equal(await page.locator('.controls .pill[role="status"]').count(),0,'free mode has no lock note');
   assert.deepEqual(errors,[]);
  }finally{await browser.close();}
 });
}
