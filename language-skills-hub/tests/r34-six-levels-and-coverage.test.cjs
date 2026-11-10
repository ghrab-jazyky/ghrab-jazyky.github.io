#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=require('../self-check/reading/reading-core.js');
const draft=require('../self-check/test-banks/reading/test-bank-core.js');
const grade=require('../self-check/results/grade-core.js');
const manifest=JSON.parse(read('version.json'));
const html=read('cteni/can-mistakes/index.html');
const data=core.parseReadingData(html);
const levels=['A1','A2','B1','B2','C1','C2'];
const hash=manifest.contentHashes['rl-can-mistakes'];
test('R34 six independently authored EN levels are source-bound, scoped and not approved',()=>{
 const real=crypto.createHash('sha256').update(Buffer.from(html)).digest('hex');
 assert.equal(real,hash);
 const stems=new Set(),ids=new Set();
 for(const level of levels){
  const bank=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'));
  const practice=core.variantFromData(data,'en',level);
  const qa=draft.makeQaVariant(bank,practice,hash);
  assert.ok(draft.validate(bank,practice,hash));
  assert.equal(qa.questions.length,10);
  assert.deepEqual(qa.paragraphs,practice.paragraphs);
  assert.equal(bank.published,false);
  assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
  assert.equal(bank.sourcePracticeContentHash,hash);
  assert.equal(bank.level,level);
  assert.equal(bank.topic,'rl-can-mistakes');
  assert.equal(bank.language,'en');
  assert.equal(bank.durationMinutesSuggested,['C1','C2'].includes(level)?25:20);
  core.validateVariant(qa);
  const localIds=new Set(practice.questions.map(q=>q.id));
  const practiceStems=new Set(practice.questions.map(q=>q.q.toLowerCase().trim()));
  const positions=[0,0,0,0];
  for(const q of qa.questions){
   assert.ok(!localIds.has(q.id));
   assert.ok(!practiceStems.has(q.q.toLowerCase().trim()));
   assert.ok(!ids.has(q.id),'Cross-level ID collision');
   ids.add(q.id);
   assert.ok(!stems.has(level+q.q.toLowerCase().trim()));
   stems.add(level+q.q.toLowerCase().trim());
   assert.ok(q.sourceParagraph>=1&&q.sourceParagraph<=practice.paragraphs.length);
   positions[q.answer]++;
  }
  assert.ok(positions.every(n=>n>=2&&n<=3));
  const correct=core.score(qa,Object.fromEntries(qa.questions.map(q=>[q.id,q.answer])));
  assert.equal(correct.points,10);
  assert.equal(correct.maxPoints,10);
  assert.equal(grade.proposal(correct.points,correct.maxPoints).grade,1);
  const noAnswers=core.score(qa,{});
  assert.equal(noAnswers.points,0);
  assert.equal(noAnswers.unanswered,10);
  assert.equal(grade.proposal(0,10).grade,5);
 }
});
test('R34 wrong level, source and publication status cannot silently access a different bank',()=>{
 const all=levels.map(level=>({
  level,
  bank:JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json')),
  practice:core.variantFromData(data,'en',level)
 }));
 for(let i=0;i<all.length;i++)for(let j=0;j<all.length;j++){
  const x=all[i],y=all[j];
  if(i!==j)assert.throws(()=>draft.validate(x.bank,y.practice,hash));
  assert.throws(()=>draft.validate({...x.bank,published:true},x.practice,hash));
  assert.throws(()=>draft.validate({...x.bank,status:'TEACHER_APPROVED'},x.practice,hash));
  assert.throws(()=>draft.validate(x.bank,x.practice,'0'.repeat(64)));
 }
 assert.throws(()=>draft.validate({...all[0].bank,level:'B3'},all[0].practice,hash));
});
test('R34 coverage inventory is complete without pretending content banks are approved',()=>{
 const coverage=require('../tools/independent-coverage.cjs').summary;
 assert.equal(coverage.total,138);
 assert.equal(coverage.reading.total,120);
 assert.equal(coverage.listening.total,18);
 assert.equal(coverage.problems.length,0,coverage.problems.join(', '));
 assert.ok(coverage.authored>=6);
 assert.ok(coverage.missing<=132);
 assert.equal(coverage.approved,0);
 assert.equal(coverage.records.filter(r=>r.id==='rl-can-mistakes'&&r.language==='en'&&r.available).length,6);
 assert.equal(coverage.records.some(r=>r.status==='BLOCKED'),false);
});
