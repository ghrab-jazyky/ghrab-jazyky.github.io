#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const reading=require('../self-check/reading/reading-core.js');
const contract=require('../self-check/test-banks/reading/generic-core.js');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=JSON.parse(read('version.json'));
const source=reading.parseReadingData(read('cteni/can-mistakes/index.html'));
test('R34 generic draft contract validates all six source-bound independent EN banks',()=>{
 for(const level of reading.LEVELS){
  const bank=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'));
  const practice=reading.variantFromData(source,'en',level);
  const ctx={topic:'rl-can-mistakes',lang:'en',level,sourceHash:version.contentHashes['rl-can-mistakes']};
  assert.equal(contract.validate(bank,practice,ctx),true);
  const ready=contract.compile(bank,practice,ctx);
  reading.validateVariant(ready);
  assert.equal(ready.questions.length,10);
  assert.deepEqual(ready.paragraphs,practice.paragraphs);
  assert.deepEqual(ready.questions.map(q=>q.sourceParagraph),bank.questions.map(q=>q.sourceParagraph));
  assert.equal(bank.published,false);
  assert.throws(()=>contract.validate({...bank,published:true},practice,ctx),/remain unpublished/);
  assert.throws(()=>contract.validate(bank,practice,{...ctx,lang:'es'}),/does not match requested/);
  assert.throws(()=>contract.validate(bank,practice,{...ctx,topic:'rl-asteroids'}),/does not match requested/);
  assert.throws(()=>contract.validate(bank,practice,{...ctx,sourceHash:'0'.repeat(64)}),/checksum mismatch/);
 }
});
test('R34 contract rejects practice questions, absent evidence, duplicate options and invalid timers',()=>{
 const bank=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-B2.json'));
 const practice=reading.variantFromData(source,'en','B2');
 const ctx={topic:bank.topic,lang:bank.language,level:bank.level,sourceHash:bank.sourcePracticeContentHash};
 function bad(changed){
  const questions=bank.questions.map(q=>({...q,choices:q.choices.slice()}));
  const change=changed(questions[0]);
  questions[0]={...questions[0],...change};
  return {...bank,questions};
 }
 assert.throws(()=>contract.validate(bad(q=>({q:practice.questions[0].q})),practice,ctx),/repeats practice/);
 assert.throws(()=>contract.validate(bad(q=>({sourceParagraph:999})),practice,ctx),/paragraph/);
 assert.throws(()=>contract.validate(bad(q=>({choices:[q.choices[0],q.choices[0],q.choices[2],q.choices[3]]})),practice,ctx),/duplicate/);
 assert.throws(()=>contract.validate({...bank,durationMinutesSuggested:0},practice,ctx),/timer/);
 assert.throws(()=>contract.validate({...bank,questions:[]},practice,ctx),/question count/);
});
test('R34 universal preview is isolated from current teacher/student production URLs',()=>{
 const ui=read('self-check/test-banks/reading/universal.js');
 assert.match(ui,/get\('\.\.\/\.\.\/\.\.\/data\/cards\.json'/);
 assert.match(ui,/manifest\.contentHashes\[topic\]/);
 assert.match(ui,/reading\.readingEntry\(catalog,topic\)/);
 assert.match(ui,/testBank\.compile\(bank,practice,\{topic,lang,level,sourceHash:actual\}\)/);
 assert.doesNotMatch(ui,/sendBeacon|XMLHttpRequest|WebSocket|eval\s*\(/);
 for(const file of ['index.html','assets/hub.js','self-check/reading/reading.js']){
  assert.doesNotMatch(read(file),/universal\.html|generic-core\.js/);
 }
});
