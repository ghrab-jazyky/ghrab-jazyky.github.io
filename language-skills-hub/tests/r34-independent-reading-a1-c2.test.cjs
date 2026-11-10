#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=require('../self-check/reading/reading-core.js');
const bankCore=require('../self-check/test-banks/reading/test-bank-core.js');
const grade=require('../self-check/results/grade-core.js');
const manifest=JSON.parse(read('version.json')),html=read('cteni/can-mistakes/index.html');
const data=core.parseReadingData(html),hash=createHash('sha256').update(html).digest('hex');
const levels=['A1','A2','B1','B2','C1','C2'];
test('R34 original unchanged reference: all six English source variants available',()=>{
 assert.equal(manifest.version,'R31');
 assert.equal(hash,manifest.contentHashes['rl-can-mistakes']);
 assert.equal(manifest.topicCount,29);
 assert.equal(manifest.variantCount,642);
 for(const level of levels)assert.ok(core.variantFromData(data,'en',level).paragraphs.length>=3);
});
for(const level of levels){
 test('R34 independent '+level+' bank has original B2-compatible schema and correct 10-point scoring',()=>{
  const bank=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'));
  const original=core.variantFromData(data,'en',level);
  const qa=bankCore.makeQaVariant(bank,original,hash);
  core.validateVariant(qa);
  assert.equal(bank.level,level);
  assert.equal(bank.published,false);
  assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
  assert.equal(qa.questions.length,10);
  assert.deepEqual(qa.paragraphs,original.paragraphs);
  assert.equal(qa.open,'');
  const origIds=new Set(original.questions.map(q=>q.id));
  const origStems=new Set(original.questions.map(q=>q.q.toLowerCase().replace(/\s+/g,' ').trim()));
  const balance=[0,0,0,0];
  for(const q of qa.questions){
   assert.ok(!origIds.has(q.id),q.id+' duplicated practice ID');
   assert.ok(!origStems.has(q.q.toLowerCase().replace(/\s+/g,' ').trim()),q.q+' duplicated practice question');
   assert.ok(q.sourceParagraph>=1&&q.sourceParagraph<=original.paragraphs.length);
   balance[q.answer]++;
  }
  assert.deepEqual(balance,[2,3,2,3]);
  const correct=core.score(qa,Object.fromEntries(qa.questions.map(q=>[q.id,q.answer])));
  assert.equal(correct.correct,10);
  assert.equal(correct.points,10);
  assert.equal(grade.proposal(correct.points,correct.maxPoints).grade,1);
  const allWrong=core.score(qa,Object.fromEntries(qa.questions.map(q=>[q.id,(q.answer+1)%4])));
  assert.equal(allWrong.points,0);
  assert.equal(grade.proposal(allWrong.points,allWrong.maxPoints).grade,5);
  const incomplete=core.score(qa,Object.fromEntries(qa.questions.slice(0,5).map(q=>[q.id,q.answer])));
  assert.equal(incomplete.unanswered,5);
  assert.equal(incomplete.points,5);
  assert.throws(()=>bankCore.validate({...bank,published:true},original,hash),/teacher approval/);
  assert.throws(()=>bankCore.validate(bank,original,'0'.repeat(64)),/changed/);
 });
}
test('R34 no cross-level text-bank substitution, for every English CEFR pair',()=>{
 const banks=Object.fromEntries(levels.map(l=>[l,JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-'+l+'.json'))]));
 for(const level of levels)for(const other of levels){
  if(level===other)continue;
  assert.throws(()=>bankCore.validate(banks[level],core.variantFromData(data,'en',other),hash),
   /does not match this bank level/);
 }
});
test('R34 draft remains separate from production student pages and catalogue',()=>{
 assert.doesNotMatch(read('index.html'),/r34-en-a1|r34-en-c2|test-banks\/reading/);
 assert.doesNotMatch(read('assets/hub.js'),/r34-en-a1|r34-en-c2|test-banks\/reading/);
 assert.doesNotMatch(read('self-check/reading/reading.js'),/r34-en-a1|r34-en-c2|test-banks\/reading/);
 const ui=read('self-check/test-banks/reading/preview.js');
 assert.match(ui,/\['A1','A2','B1','B2','C1','C2'\]/);
 assert.match(ui,/sourceHash\(originalHtml\)/);
 assert.match(ui,/testBank.makeQaVariant\(bank,practice,actual\)/);
});
