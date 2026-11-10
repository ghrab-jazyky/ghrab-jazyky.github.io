#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('data/cards.json'));
const manifest=JSON.parse(read('version.json'));
const coverage=JSON.parse(read('self-check/test-banks/coverage.json'));
const reader=require('../self-check/reading/reading-core.js');
const checker=require('../self-check/test-banks/reading/test-bank-core.js');
const scorer=require('../self-check/results/grade-core.js');
const source=read('cteni/can-mistakes/index.html'),data=reader.parseReadingData(source);
const digest=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'cteni/can-mistakes/index.html'))).digest('hex');
const levels=['A1','A2','B1','B2','C1','C2'];

test('R34 coverage includes all 138 Reading/Listening slots and NO invented approval',()=>{
 const expected=[];
 for(const e of catalog.entries.filter(x=>['cteni','poslech'].includes(x.skill))){
  for(const lang of e.languages)for(const level of e.levels)
   expected.push([e.id,lang,level].join(':'));
 }
 assert.equal(expected.length,138);
 assert.equal(coverage.slots.length,expected.length);
 const actual=coverage.slots.map(s=>[s.topic,s.language,s.level].join(':'));
 assert.deepEqual(actual.sort(),expected.sort());
 assert.equal(new Set(actual).size,actual.length);
 assert.deepEqual(coverage.counts,{total:138,reading:120,listening:18,drafted:6,missing:132,teacherApproved:0});
 assert.equal(coverage.productionBaseline,'R31');
 assert.equal(manifest.version,'R31');
 assert.equal(manifest.gradedTestsEnabled,false);
 assert.equal(manifest.backendEnabled,false);
 assert.equal(manifest.officialGradesEnabled,false);
 for(const slot of coverage.slots){
  assert.equal(slot.sourceHash,manifest.contentHashes[slot.topic]);
  if(slot.status==='MISSING')assert.equal(slot.testBank,null);
  else{
   assert.equal(slot.status,'DRAFT_UNAPPROVED');
   assert.equal(slot.topic,'rl-can-mistakes');
   assert.equal(slot.language,'en');
   assert.ok(levels.includes(slot.level));
   assert.ok(slot.testBank.endsWith('en-'+slot.level+'.json'));
  }
 }
});

test('R34 all six English variants use the genuine original paragraphs and independent tasks',()=>{
 assert.equal(digest,manifest.contentHashes['rl-can-mistakes']);
 for(const level of levels){
  const bank=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'));
  const practice=reader.variantFromData(data,'en',level);
  const qa=checker.makeQaVariant(bank,practice,digest);
  reader.validateVariant(qa);
  assert.equal(bank.published,false);
  assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
  assert.equal(qa.questions.length,10);
  assert.deepEqual(qa.paragraphs,practice.paragraphs);
  const existing=new Set(practice.questions.map(q=>q.id));
  const stems=new Set(practice.questions.map(q=>q.q.toLowerCase().replace(/\s+/g,' ').trim()));
  assert.equal(qa.questions.filter(q=>existing.has(q.id)||stems.has(q.q.toLowerCase().replace(/\s+/g,' ').trim())).length,0);
  assert.deepEqual(qa.questions.reduce((arr,q)=>(arr[q.answer]++,arr),[0,0,0,0]),[2,3,2,3]);
  const a=Object.fromEntries(qa.questions.map(q=>[q.id,q.answer]));
  const score=reader.score(qa,a);
  assert.equal(score.points,10);
  assert.equal(scorer.proposal(score.points,score.maxPoints).grade,1);
  const empty=reader.score(qa,{});
  assert.equal(empty.points,0);
  assert.equal(empty.unanswered,10);
  assert.equal(scorer.proposal(empty.points,empty.maxPoints).grade,5);
 }
});

test('R34 level source swapping and altered draft metadata fail closed',()=>{
 const b=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-A1.json'));
 const c=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-C2.json'));
 const A1=reader.variantFromData(data,'en','A1'),C2=reader.variantFromData(data,'en','C2');
 assert.throws(()=>checker.validate(b,C2,digest),/does not match/);
 assert.throws(()=>checker.validate(c,A1,digest),/does not match/);
 assert.throws(()=>checker.validate({...b,published:true},A1,digest),/without teacher approval/);
 assert.throws(()=>checker.validate({...b,durationMinutesSuggested:2},A1,digest),/duration/);
 assert.throws(()=>checker.validate(b,A1,'0'.repeat(64)),/changed/);
 assert.throws(()=>checker.validate({...b,auditRevision:'FAKE'},A1,digest),/audit not completed/);
});

test('R34 student catalog retains no links to unapproved assessment banks',()=>{
 for(const file of ['index.html','assets/hub.js','self-check/reading/reading.js']){
  const content=read(file);
  assert.doesNotMatch(content,/test-banks\/reading|R34-CONTENT-DRAFT-1/);
 }
 assert.equal(coverage.slots.filter(s=>s.status==='DRAFT_UNAPPROVED').length,6);
 assert.equal(coverage.slots.filter(s=>s.status==='TEACHER_APPROVED').length,0);
});
