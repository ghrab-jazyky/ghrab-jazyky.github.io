#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const dir=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(dir,p),'utf8');
const reading=require('../self-check/reading/reading-core.js');
const grade=require('../self-check/results/grade-core.js');
const validator=require('../self-check/test-banks/reading/test-bank-core.js');
const data=reading.parseReadingData(read('cteni/can-mistakes/index.html'));
const manifest=JSON.parse(read('version.json'));
const sha=createHash('sha256').update(fs.readFileSync(path.join(dir,'cteni/can-mistakes/index.html'))).digest('hex');
const levels=['A1','A2','B1','B2','C1','C2'];
const banks=Object.fromEntries(levels.map(level=>[level,JSON.parse(
 read('self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'))]));
test('R34 exactly six English CEFR independent drafts, no unauthorized publication',()=>{
 assert.equal(manifest.version,'R31');
 assert.equal(manifest.topicCount,29);assert.equal(manifest.variantCount,642);
 assert.equal(sha,manifest.contentHashes['rl-can-mistakes']);
 assert.equal(manifest.officialGradesEnabled,false);
 for(const level of levels){
  const bank=banks[level],practice=reading.variantFromData(data,'en',level);
  assert.equal(bank.level,level);
  assert.equal(bank.language,'en');
  assert.equal(bank.topic,'rl-can-mistakes');
  assert.equal(bank.published,false);
  assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
  assert.equal(bank.sourcePracticeContentHash,sha);
  assert.equal(validator.validate(bank,practice,sha),true);
  const variant=validator.makeQaVariant(bank,practice,sha);
  reading.validateVariant(variant);
  assert.deepEqual(variant.paragraphs,practice.paragraphs);
  assert.equal(variant.questions.length,10);
  assert.equal(new Set(variant.questions.map(q=>q.id)).size,10);
  assert.deepEqual(variant.questions.reduce((a,q)=>(a[q.answer]++,a),[0,0,0,0]),[2,3,2,3]);
  const oldStems=new Set(practice.questions.map(q=>q.q.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim()));
  const newStems=new Set(variant.questions.map(q=>q.q.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim()));
  for(const stem of newStems)assert.equal(oldStems.has(stem),false);
  const complete=Object.fromEntries(variant.questions.map(q=>[q.id,q.answer]));
  const perfect=reading.score(variant,complete);
  assert.equal(perfect.points,10);
  assert.equal(perfect.maxPoints,10);
  assert.equal(grade.proposal(perfect.points,perfect.maxPoints).grade,1);
  const empty=reading.score(variant,{});
  assert.equal(empty.unanswered,10);assert.equal(empty.points,0);
  assert.equal(grade.proposal(empty.points,empty.maxPoints).grade,5);
 }
});
test('R34 no cross-level or cross-language source substitution, no published draft',()=>{
 for(const a of levels)for(const b of levels){
  if(a===b)continue;
  assert.throws(()=>validator.validate(banks[a],reading.variantFromData(data,'en',b),sha),
   /Practice source does not match/,a+' incorrectly accepted '+b);
 }
 for(const level of levels){
  const bank=banks[level],practice=reading.variantFromData(data,'en',level);
  assert.throws(()=>validator.validate({...bank,published:true},practice,sha),/without teacher approval/);
  assert.throws(()=>validator.validate({...bank,language:'es'},practice,sha),/only Can Mistakes/);
  assert.throws(()=>validator.validate(bank,practice,'0'.repeat(64)),/changed/);
 }
});
test('R34 pilot never modifies public cards, legacy Reading and existing user-grade thresholds',()=>{
 const index=read('index.html'),hub=read('assets/hub.js'),publicReading=read('self-check/reading/reading.js');
 for(const html of [index,hub,publicReading]){
  assert.doesNotMatch(html,/test-banks\/reading|r34-en-a1|r34-en-c2/);
 }
 assert.equal(grade.proposal(9,10).grade,1);
 assert.equal(grade.proposal(8,10).grade,2);
 assert.equal(grade.proposal(7,10).grade,3);
 assert.equal(grade.proposal(5,10).grade,4);
 assert.equal(grade.proposal(4,10).grade,5);
});
