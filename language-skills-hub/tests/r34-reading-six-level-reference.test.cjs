#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('version.json'));
const core=require('../self-check/reading/reading-core.js');
const bankCore=require('../self-check/test-banks/reading/test-bank-core.js');
const grade=require('../self-check/results/grade-core.js');
const source=read('cteni/can-mistakes/index.html');
const data=core.parseReadingData(source),hash=manifest.contentHashes['rl-can-mistakes'];
const levels=core.LEVELS;
test('R34 content checksum and historic R31 live version remain unchanged',()=>{
 assert.equal(manifest.version,'R31');
 assert.equal(manifest.topicCount,29);
 assert.equal(manifest.variantCount,642);
 assert.equal(manifest.gradedTestsEnabled,false);
 assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'cteni/can-mistakes/index.html'))).digest('hex'),hash);
});
for(const level of levels){
 test('R34 EN/'+level+' independently authored ten-item teacher-draft score and source integrity',()=>{
  const bank=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'));
  const original=core.variantFromData(data,'en',level);
  assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
  assert.equal(bank.published,false);
  assert.equal(bank.language,'en');
  assert.equal(bank.level,level);
  assert.equal(bank.sourcePracticeContentHash,hash);
  assert.equal(bankCore.validate(bank,original,hash),true);
  const v=bankCore.makeQaVariant(bank,original,hash);
  core.validateVariant(v);
  assert.equal(v.questions.length,10);
  assert.deepEqual(v.paragraphs,original.paragraphs);
  assert.ok(v.title.includes(level));
  const originalQuestions=new Set(original.questions.map(q=>q.q.toLowerCase().replace(/\s+/g,' ').trim()));
  const originalIds=new Set(original.questions.map(q=>q.id));
  const positions=[0,0,0,0],answerKeys=new Set();
  for(const q of v.questions){
   assert.ok(!originalQuestions.has(q.q.toLowerCase().replace(/\s+/g,' ').trim()));
   assert.ok(!originalIds.has(q.id));assert.ok(!answerKeys.has(q.id));
   answerKeys.add(q.id);
   assert.ok(q.sourceParagraph>=1&&q.sourceParagraph<=original.paragraphs.length);
   assert.ok(q.explanation.length>=30);
   positions[q.answer]++;
  }
  assert.ok(positions.every(n=>n>=2&&n<=3));
  const correct=Object.fromEntries(v.questions.map(q=>[q.id,q.answer]));
  const full=core.score(v,correct),none=core.score(v,{});
  assert.equal(full.correct,10);
  assert.equal(full.points,10);
  assert.equal(full.maxPoints,10);
  assert.equal(grade.proposal(full.points,full.maxPoints).grade,1);
  assert.equal(none.points,0);
  assert.equal(none.unanswered,10);
  const wrong=Object.fromEntries(v.questions.map(q=>[q.id,(q.answer+1)%q.choices.length]));
  assert.equal(core.score(v,wrong).correct,0);
 });
}
test('R34 all EN level boundaries fail closed on a different passage',()=>{
 for(const level of levels){
  const bank=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'));
  const otherLevel=levels[(levels.indexOf(level)+1)%levels.length];
  assert.throws(()=>bankCore.validate(bank,core.variantFromData(data,'en',otherLevel),hash),
   /does not match this bank level/);
  assert.throws(()=>bankCore.validate({...bank,published:true},core.variantFromData(data,'en',level),hash),
   /without teacher approval/);
  assert.throws(()=>bankCore.validate({...bank,sourcePracticeContentHash:'0'.repeat(64)},
   core.variantFromData(data,'en',level),hash),/source has changed/);
 }
});
test('R34 no approved practice links or card sources changed',()=>{
 assert.doesNotMatch(read('assets/hub.js'),/r34-en-|test-banks\/reading/);
 assert.doesNotMatch(read('self-check/reading/reading.js'),/r34-en-|test-banks\/reading/);
 assert.doesNotMatch(read('index.html'),/r34-en-|test-banks\/reading/);
 assert.doesNotMatch(read('self-check/test-banks/reading/preview.js'),/sendBeacon|XMLHttpRequest|WebSocket|eval\s*\(/);
});
