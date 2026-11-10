#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=require('../self-check/reading/reading-core.js');
const draft=require('../self-check/test-banks/reading/test-bank-core.js');
const grade=require('../self-check/results/grade-core.js');
const manifest=JSON.parse(read('version.json'));
const data=core.parseReadingData(read('cteni/can-mistakes/index.html'));
const bankB1=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-B1.json'));
const bankB2=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-B2.json'));
const practiceB1=core.variantFromData(data,'en','B1');
const practiceB2=core.variantFromData(data,'en','B2');
const hash=manifest.contentHashes['rl-can-mistakes'];

test('R33 unapproved independent B1/B2 content keeps original approved R31 untouched',()=>{
 assert.equal(manifest.version,'R31');
 assert.equal(manifest.topicCount,29);
 assert.equal(manifest.variantCount,642);
 assert.equal(manifest.backendEnabled,false);
 assert.equal(manifest.gradedTestsEnabled,false);
 assert.equal(manifest.officialGradesEnabled,false);
 assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'cteni/can-mistakes/index.html'))).digest('hex'),hash);
 assert.equal(practiceB1.questions.length,12);
 assert.equal(practiceB2.questions.length,18);
 for(const [bank,practice,audit]of [
  [bankB1,practiceB1,'R33-CONTENT-AUDIT-1'],
  [bankB2,practiceB2,'R32-CONTENT-AUDIT-1']
 ]){
  assert.equal(bank.published,false);
  assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
  assert.equal(bank.sourcePracticeContentHash,hash);
  assert.equal(bank.auditRevision,audit);
  assert.equal(draft.validate(bank,practice,hash),true);
  const qa=draft.makeQaVariant(bank,practice,hash);
  core.validateVariant(qa);
  assert.equal(qa.questions.length,10);
  assert.deepEqual(qa.paragraphs,practice.paragraphs);
  assert.equal(qa.title.includes(bank.level),true);
  const originalIds=new Set(practice.questions.map(q=>q.id));
  const originalStems=new Set(practice.questions.map(q=>q.q.toLowerCase().replace(/\s+/g,' ').trim()));
  assert.equal(qa.questions.filter(q=>originalIds.has(q.id)||originalStems.has(q.q.toLowerCase().replace(/\s+/g,' ').trim())).length,0);
  const frequency=[0,0,0,0];qa.questions.forEach(q=>{frequency[q.answer]++;assert.ok(q.sourceParagraph>=1&&q.sourceParagraph<=4)});
  assert.deepEqual(frequency,[2,3,2,3]);
 }
});

test('R33 B1 and B2 banks cannot be mixed with another CEFR variant',()=>{
 assert.throws(()=>draft.validate(bankB1,practiceB2,hash),/does not match this bank level/);
 assert.throws(()=>draft.validate(bankB2,practiceB1,hash),/does not match this bank level/);
 assert.throws(()=>draft.validate({...bankB1,level:'X9'},practiceB1,hash),/supports only/);
 assert.throws(()=>draft.validate({...bankB1,published:true},practiceB1,hash),/teacher approval/);
 assert.throws(()=>draft.validate({...bankB1,status:'APPROVED'},practiceB1,hash),/teacher approval/);
 assert.throws(()=>draft.validate(bankB1,practiceB1,'0'.repeat(64)),/changed/);
 const invalid=[...bankB1.questions.map(q=>({...q}))];invalid[5].sourceParagraph=8;
 assert.throws(()=>draft.validate({...bankB1,questions:invalid},practiceB1,hash),/evidence paragraph/);
});

test('R33 original B1 test has 10 uniquely keyed questions and consistent local scores',()=>{
 const qa=draft.makeQaVariant(bankB1,practiceB1,hash);
 const correct=Object.fromEntries(qa.questions.map(q=>[q.id,q.answer]));
 const all=core.score(qa,correct);
 assert.equal(all.answered,10);assert.equal(all.correct,10);assert.equal(all.maxPoints,10);
 assert.equal(grade.proposal(all.points,all.maxPoints).grade,1);
 const oneWrong={...correct,[qa.questions[0].id]:(qa.questions[0].answer+1)%4};
 const ninety=core.score(qa,oneWrong);
 assert.equal(ninety.correct,9);assert.equal(ninety.points,9);
 assert.equal(grade.proposal(ninety.points,ninety.maxPoints).grade,1);
 const eighty=core.score(qa,Object.fromEntries(qa.questions.slice(0,8).map(q=>[q.id,q.answer])));
 assert.equal(eighty.unanswered,2);
 assert.equal(eighty.points,8);
 assert.equal(grade.proposal(eighty.points,eighty.maxPoints).grade,2);
 assert.equal(core.score(qa,{}).points,0);
});

test('R33 draft preview selects level from URL but never adds an approved student catalog link',()=>{
 const preview=read('self-check/test-banks/reading/preview.js');
 const html=read('self-check/test-banks/reading/preview.html');
 assert.match(preview,/const level=params.get\('level'\)\|\|'B2'/);
 assert.ok(preview.includes("get(topic+'/'+lang+'-'+level+'.json',true)"));
 assert.match(preview,/sourceHash\(originalHtml\)/);
 assert.ok(preview.includes('manifest.contentHashes[topic]'));
 assert.ok(preview.includes("reading.variantFromData(reading.parseReadingData(originalHtml),lang,level)"));
 assert.match(html,/UNAPPROVED DRAFT/);
 assert.doesNotMatch(read('index.html'),/r33-en-b1|test-banks\/reading/);
 assert.doesNotMatch(read('assets/hub.js'),/r33-en-b1|test-banks\/reading/);
 assert.doesNotMatch(read('self-check/reading/reading.js'),/r33-en-b1|test-banks\/reading/);
 assert.doesNotMatch(preview,/XMLHttpRequest|sendBeacon|WebSocket|eval\s*\(/);
});
