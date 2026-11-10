#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const reading=require('../self-check/reading/reading-core.js'),bankCore=require('../self-check/test-banks/reading/test-bank-core.js');
const grade=require('../self-check/results/grade-core.js'),manifest=JSON.parse(read('version.json'));
const src=read('cteni/plastic-ocean/index.html'),data=reading.parseReadingData(src);
const sha=createHash('sha256').update(fs.readFileSync(path.join(root,'cteni/plastic-ocean/index.html'))).digest('hex');
const levels=['A1','A2','B1','B2','C1','C2'];
const durations={A1:15,A2:15,B1:20,B2:20,C1:25,C2:25};
const banks=Object.fromEntries(levels.map(level=>[level,
 JSON.parse(read('self-check/test-banks/reading/rl-plastic-ocean/en-'+level+'.json'))]));
test('R36 all six Plastic Ocean independent EN banks validate against original reference',()=>{
 assert.equal(manifest.version,'R31');
 assert.equal(sha,manifest.contentHashes['rl-plastic-ocean']);
 const seen=new Set(),stems=new Set();
 for(const level of levels){
  const bank=banks[level],practice=reading.variantFromData(data,'en',level);
  assert.equal(bankCore.validate(bank,practice,sha,{topic:'rl-plastic-ocean',language:'en',level}),true);
  assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');assert.equal(bank.published,false);
  assert.equal(bank.sourceTitle,practice.title);
  assert.equal(bank.durationMinutesSuggested,durations[level]);
  assert.equal(bank.auditRevision,'R36-AUTHOR-DRAFT-1');
  const quiz=bankCore.makeQaVariant(bank,practice,sha,{topic:'rl-plastic-ocean',language:'en',level});
  reading.validateVariant(quiz);
  assert.deepEqual(quiz.paragraphs,practice.paragraphs);
  assert.equal(quiz.questions.length,10);
  const practiceStems=new Set(practice.questions.map(q=>q.q.trim().toLowerCase()));
  const answerCount=[0,0,0,0];
  for(const q of quiz.questions){
   assert.ok(!seen.has(q.id));seen.add(q.id);
   assert.ok(!practiceStems.has(q.q.trim().toLowerCase()),'New stem cannot be literal practice stem');
   assert.ok(!stems.has(q.q.trim().toLowerCase()));stems.add(q.q.trim().toLowerCase());
   assert.ok(q.sourceParagraph>=1&&q.sourceParagraph<=quiz.paragraphs.length);
   answerCount[q.answer]++;
  }
  assert.ok(answerCount.every(n=>n>=2&&n<=3));
  const right=reading.score(quiz,Object.fromEntries(quiz.questions.map(q=>[q.id,q.answer])));
  assert.equal(right.points,10);assert.equal(grade.proposal(right.points,10).grade,1);
  const empty=reading.score(quiz,{});assert.equal(empty.points,0);assert.equal(empty.unanswered,10);
 }
 assert.equal(seen.size,60);
});
test('R36 corrupted selected bank cannot silently use a different level or source',()=>{
 const bank=banks.B2,practice=reading.variantFromData(data,'en','B2');
 assert.throws(()=>bankCore.validate({...bank,published:true},practice,sha),/teacher approval/);
 assert.throws(()=>bankCore.validate({...bank,sourceTitle:'Not the review'},practice,sha),/source does not match/);
 assert.throws(()=>bankCore.validate(bank,reading.variantFromData(data,'en','C2'),sha),/source does not match/);
 assert.throws(()=>bankCore.validate(bank,practice,sha,{topic:'rl-asteroids',language:'en',level:'B2'}),/metadata does not match/);
 assert.throws(()=>bankCore.validate({...bank,sourcePracticeContentHash:'0'.repeat(64)},practice,sha),/source has changed/);
});
