#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=require('../self-check/reading/reading-core.js');
const draft=require('../self-check/test-banks/reading/test-bank-core.js');
const grade=require('../self-check/results/grade-core.js');
const bank=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-B2.json'));
const manifest=JSON.parse(read('version.json'));
const practice=core.variantFromData(core.parseReadingData(
 read('cteni/can-mistakes/index.html')),'en','B2');
test('R32 draft cannot change or publish original practice',()=>{
 assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
 assert.equal(bank.published,false);
 assert.equal(manifest.version,'R31');
 assert.equal(manifest.topicCount,29);
 assert.equal(manifest.variantCount,642);
 assert.equal(practice.questions.length,18);
 assert.equal(bank.questions.length,10);
 assert.equal(draft.validate(bank,practice,manifest.contentHashes[bank.topic]),true);
 assert.throws(()=>draft.validate({...bank,published:true},practice,
  manifest.contentHashes[bank.topic]),/without teacher approval/);
});
test('R32 independent test uses unchanged passage and a smaller distinct question set',()=>{
 const qa=draft.makeQaVariant(bank,practice,manifest.contentHashes[bank.topic]);
 core.validateVariant(qa);
 assert.equal(qa.questions.length,10);
 assert.deepEqual(qa.paragraphs,practice.paragraphs);
 assert.deepEqual(qa.tabs.map(t=>t.id),['interpretation','argument','transfer']);
 assert.equal(Object.prototype.hasOwnProperty.call(qa,'gap'),false);
 const practiceStems=new Set(practice.questions.map(q=>q.q.toLowerCase().trim()));
 for(const q of qa.questions){
  assert.ok(!practiceStems.has(q.q.toLowerCase().trim()));
  assert.ok(!practice.questions.some(old=>old.id===q.id));
 }
 assert.throws(()=>draft.validate(bank,practice,'a'.repeat(64)),/changed/);
});
test('R32 correct, incomplete and wrong student answers are scored using existing Reading core',()=>{
 const qa=draft.makeQaVariant(bank,practice,manifest.contentHashes[bank.topic]);
 const correct=Object.fromEntries(qa.questions.map(q=>[q.id,q.answer]));
 const score=core.score(qa,correct);
 assert.equal(score.total,10);
 assert.equal(score.correct,10);
 assert.equal(score.maxPoints,10);
 assert.equal(grade.proposal(score.points,score.maxPoints).grade,1);
 const wrong=Object.fromEntries(qa.questions.map(q=>[q.id,(q.answer+1)%4]));
 const lost=core.score(qa,wrong);
 assert.equal(lost.correct,0);
 assert.equal(grade.proposal(lost.points,lost.maxPoints).grade,5);
 const half=core.score(qa,Object.fromEntries(qa.questions.slice(0,5).map(q=>[q.id,q.answer])));
 assert.equal(half.answered,5);
 assert.equal(half.unanswered,5);
 assert.equal(half.points,5);
});
test('R32 original practice contains no runtime reference to unapproved test bank',()=>{
 const publicUi=read('self-check/reading/reading.js');
 const catalog=read('assets/hub.js');
 assert.doesNotMatch(publicUi,/test-banks\/reading|LSHIndependentTestBank/);
 assert.doesNotMatch(catalog,/test-banks\/reading|LSHIndependentTestBank/);
 const independent=read('self-check/test-banks/reading/test-bank-core.js');
 assert.doesNotMatch(independent,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|eval\s*\(/);
});
