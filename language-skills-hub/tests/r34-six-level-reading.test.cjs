#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const reading=require('../self-check/reading/reading-core.js');
const draft=require('../self-check/test-banks/reading/test-bank-core.js');
const grade=require('../self-check/results/grade-core.js');
const manifest=JSON.parse(read('version.json'));
const data=reading.parseReadingData(read('cteni/can-mistakes/index.html'));
const SHA=createHash('sha256').update(fs.readFileSync(path.join(root,'cteni/can-mistakes/index.html'))).digest('hex');
const levels=['A1','A2','B1','B2','C1','C2'],durations={A1:15,A2:15,B1:20,B2:20,C1:25,C2:25};
const banks=Object.fromEntries(levels.map(level=>[
 level,JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'))
]));
test('R34 six level banks cover CEFR with unchanged original source and publication safeguards',()=>{
 assert.equal(manifest.version,'R31');
 assert.equal(manifest.topicCount,29);assert.equal(manifest.variantCount,642);
 assert.equal(SHA,manifest.contentHashes['rl-can-mistakes']);
 const prompts=new Set(),questionIds=new Set();
 for(const level of levels){
  const bank=banks[level],practice=reading.variantFromData(data,'en',level);
  assert.equal(bank.language,'en');assert.equal(bank.level,level);
  assert.equal(bank.published,false);
  assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
  assert.equal(bank.durationMinutesSuggested,durations[level]);
  assert.equal(draft.validate(bank,practice,SHA),true);
  const qa=draft.makeQaVariant(bank,practice,SHA);
  reading.validateVariant(qa);
  assert.deepEqual(qa.paragraphs,practice.paragraphs);
  assert.equal(qa.questions.length,10);
  const originalQuestions=new Set(practice.questions.map(q=>q.q.toLowerCase().trim()));
  const answerFrequency=[0,0,0,0];
  for(const q of qa.questions){
   assert.ok(!originalQuestions.has(q.q.toLowerCase().trim()));
   assert.ok(!questionIds.has(q.id),'Duplicate ID '+q.id);questionIds.add(q.id);
   assert.ok(!prompts.has(q.q.toLowerCase().trim()),'Duplicate question '+q.q);
   prompts.add(q.q.toLowerCase().trim());
   assert.ok(q.sourceParagraph>=1&&q.sourceParagraph<=practice.paragraphs.length);
   assert.equal(q.choices.length,4);answerFrequency[q.answer]++;
  }
  assert.ok(answerFrequency.every(n=>n>=2&&n<=3));
  const good=reading.score(qa,Object.fromEntries(qa.questions.map(q=>[q.id,q.answer])));
  assert.equal(good.points,10);assert.equal(good.maxPoints,10);
  assert.equal(grade.proposal(good.points,good.maxPoints).grade,1);
  const blank=reading.score(qa,{});
  assert.equal(blank.unanswered,10);assert.equal(blank.points,0);
  assert.equal(grade.proposal(blank.points,blank.maxPoints).grade,5);
 }
 assert.equal(questionIds.size,60);
});
test('R34 rejects cross-level bank substitutions, invalid timer metadata, and forged approval',()=>{
 for(const level of levels){
  const bank=banks[level],practice=reading.variantFromData(data,'en',level);
  assert.throws(()=>draft.validate({...bank,published:true},practice,SHA),/without teacher approval/);
  assert.throws(()=>draft.validate({...bank,durationMinutesSuggested:100},practice,SHA),/test duration/);
  assert.throws(()=>draft.validate({...bank,sourcePracticeContentHash:'0'.repeat(64)},practice,SHA),/source has changed/);
  for(const other of levels.filter(l=>l!==level)){
   const different=reading.variantFromData(data,'en',other);
   assert.throws(()=>draft.validate(bank,different,SHA),/does not match this bank level/);
  }
 }
});
test('R34 test preview resolves all levels and never modifies public practice or teacher catalog',()=>{
 const script=read('self-check/test-banks/reading/preview.js');
 assert.match(script,/\['A1','A2','B1','B2','C1','C2'\]/);
 assert.match(script,/bank.durationMinutesSuggested/);
 assert.match(script,/sourceHash\(originalHtml\)/);
 assert.doesNotMatch(script,/sendBeacon|XMLHttpRequest|WebSocket|eval\s*\(/);
 for(const p of ['index.html','assets/hub.js','self-check/reading/reading.js']){
  const c=read(p);assert.doesNotMatch(c,/test-banks\/reading|r34-en-/);
 }
});
