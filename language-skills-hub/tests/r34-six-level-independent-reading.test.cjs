#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const original=read('cteni/can-mistakes/index.html');
const core=require('../self-check/reading/reading-core.js');
const validator=require('../self-check/test-banks/reading/test-bank-core.js');
const grade=require('../self-check/results/grade-core.js');
const manifest=JSON.parse(read('version.json'));
const DATA=core.parseReadingData(original);
const levels=['A1','A2','B1','B2','C1','C2'];
const titles={
 A1:'I Can Try Again',A2:'A Small Change, a Better Result',
 B1:'The Problem with Being Good at Everything',B2:'When Feedback Feels Like Failure',
 C1:'The Hidden Cost of Constant Improvement',
 C2:'When Resilience Becomes an Obligation'
};
const hash=createHash('sha256').update(Buffer.from(original)).digest('hex');
test('R34 exactly six independent English banks for one source with unchanged original',()=>{
 assert.equal(manifest.version,'R31','Draft work must not silently change production manifest');
 assert.equal(hash,manifest.contentHashes['rl-can-mistakes']);
 assert.equal(manifest.topicCount,29);
 assert.equal(manifest.variantCount,642);
 assert.equal(manifest.backendEnabled,false);
 for(const level of levels){
  const bank=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'));
  const originalVariant=core.variantFromData(DATA,'en',level);
  assert.equal(originalVariant.title,titles[level]);
  assert.equal(bank.topic,'rl-can-mistakes');
  assert.equal(bank.language,'en');
  assert.equal(bank.level,level);
  assert.equal(bank.published,false);
  assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
  assert.equal(validator.validate(bank,originalVariant,hash),true);
  const qa=validator.makeQaVariant(bank,originalVariant,hash);
  core.validateVariant(qa);
  assert.equal(qa.questions.length,10);
  assert.deepEqual(qa.paragraphs,originalVariant.paragraphs);
  assert.ok(!('gap' in qa));
  const stems=new Set(originalVariant.questions.map(q=>q.q.toLowerCase().replace(/\s+/g,' ').trim()));
  const ids=new Set(originalVariant.questions.map(q=>q.id));
  const distribution=[0,0,0,0];
  for(const q of qa.questions){
   assert.ok(!stems.has(q.q.toLowerCase().replace(/\s+/g,' ').trim()),level+' practice stem reused');
   assert.ok(!ids.has(q.id),level+' practice ID reused');
   assert.ok(q.sourceParagraph>=1&&q.sourceParagraph<=qa.paragraphs.length);
   assert.equal(q.choices.length,4);
   distribution[q.answer]++;
  }
  assert.ok(distribution.every(n=>n>=2&&n<=3),level+' answer-position bias '+distribution);
 }
});
test('R34 source/level integrity rejects any cross-level substitution',()=>{
 const bankA1=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-A1.json'));
 const bankC2=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-C2.json'));
 assert.throws(()=>validator.validate(bankA1,core.variantFromData(DATA,'en','A2'),hash),/does not match/);
 assert.throws(()=>validator.validate(bankC2,core.variantFromData(DATA,'en','C1'),hash),/does not match/);
 assert.throws(()=>validator.validate(bankA1,core.variantFromData(DATA,'en','A1'),'f'.repeat(64)),/changed/);
 assert.throws(()=>validator.validate({...bankA1,published:true},core.variantFromData(DATA,'en','A1'),hash),/teacher approval/);
});
test('R34 six test banks are compatible with local provisional scoring',()=>{
 for(const level of levels){
  const bank=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'));
  const qa=validator.makeQaVariant(bank,core.variantFromData(DATA,'en',level),hash);
  const perfect=Object.fromEntries(qa.questions.map(q=>[q.id,q.answer]));
  const report=core.score(qa,perfect);
  assert.equal(report.points,10);
  assert.equal(report.maxPoints,10);
  assert.equal(grade.proposal(report.points,report.maxPoints).grade,1);
  const none=core.score(qa,{});
  assert.equal(none.points,0);
  assert.equal(none.unanswered,10);
  assert.equal(grade.proposal(none.points,none.maxPoints).grade,5);
 }
});
test('R34 all CEFR drafts are still outside normal student catalog',()=>{
 const catalog=read('index.html');
 const app=read('assets/hub.js');
 const runtime=read('self-check/reading/reading.js');
 for(const p of [catalog,app,runtime]){
  assert.doesNotMatch(p,/test-banks\/reading|R34-AUTHOR-DRAFT/);
 }
 const preview=read('self-check/test-banks/reading/preview.js');
 assert.match(preview,/\['A1','A2','B1','B2','C1','C2'\]/);
});
