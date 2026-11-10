#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const reading=require('../self-check/reading/reading-core.js');
const banks=require('../self-check/test-banks/reading/test-bank-core.js');
const grades=require('../self-check/results/grade-core.js');
const manifest=JSON.parse(read('version.json')),source=read('cteni/email-friend/index.html');
const data=reading.parseReadingData(source);
const hash=createHash('sha256').update(fs.readFileSync(path.join(root,'cteni/email-friend/index.html'))).digest('hex');
const levels=['A1','A2','B1','B2','C1','C2'],durations={A1:15,A2:15,B1:20,B2:20,C1:25,C2:25};
const json=Object.fromEntries(levels.map(level=>[level,JSON.parse(read('self-check/test-banks/reading/rl-email-friend/en-'+level+'.json'))]));
test('R37 all six EN Email Friend banks match source/CEFR and are not approved',()=>{
 assert.equal(manifest.version,'R31');assert.equal(hash,manifest.contentHashes['rl-email-friend']);
 const ids=new Set(),stems=new Set();
 for(const level of levels){
  const bank=json[level],practice=reading.variantFromData(data,'en',level);
  assert.equal(bank.published,false);
  assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
  assert.equal(bank.auditRevision,'R37-AUTHOR-DRAFT-1');
  assert.equal(bank.sourceTitle,practice.title);
  assert.equal(bank.durationMinutesSuggested,durations[level]);
  assert.equal(banks.validate(bank,practice,hash,{topic:'rl-email-friend',language:'en',level}),true);
  const quiz=banks.makeQaVariant(bank,practice,hash,{topic:'rl-email-friend',language:'en',level});
  reading.validateVariant(quiz);assert.deepEqual(quiz.paragraphs,practice.paragraphs);
  assert.equal(quiz.questions.length,10);
  const old=new Set(practice.questions.map(q=>q.q.toLowerCase().trim()));
  const positions=[0,0,0,0];
  for(const q of quiz.questions){
   assert.ok(!old.has(q.q.toLowerCase().trim()),'New question must not repeat practice stem');
   assert.ok(!ids.has(q.id));ids.add(q.id);
   assert.ok(!stems.has(q.q.toLowerCase().trim()));stems.add(q.q.toLowerCase().trim());
   assert.ok(q.sourceParagraph>=1&&q.sourceParagraph<=practice.paragraphs.length);
   positions[q.answer]++;
  }
  assert.ok(positions.every(x=>x>=2&&x<=3));
  const right=reading.score(quiz,Object.fromEntries(quiz.questions.map(q=>[q.id,q.answer])));
  assert.equal(right.points,10);assert.equal(grades.proposal(right.points,10).grade,1);
  assert.equal(reading.score(quiz,{}).unanswered,10);
 }
 assert.equal(ids.size,60);
});
test('R37 cannot substitute another source, level or language, or mark draft as approved',()=>{
 const bank=json.B2,practice=reading.variantFromData(data,'en','B2');
 assert.throws(()=>banks.validate(bank,practice,hash,{topic:'rl-plastic-ocean',language:'en',level:'B2'}),/metadata does not match/);
 assert.throws(()=>banks.validate(bank,practice,hash,{topic:'rl-email-friend',language:'es',level:'B2'}),/metadata does not match/);
 assert.throws(()=>banks.validate(bank,reading.variantFromData(data,'en','C1'),hash),/source does not match/);
 assert.throws(()=>banks.validate({...bank,published:true},practice,hash),/teacher approval/);
 assert.throws(()=>banks.validate({...bank,sourceTitle:'Unrelated letter'},practice,hash),/source does not match/);
 assert.throws(()=>banks.validate({...bank,sourcePracticeContentHash:'f'.repeat(64)},practice,hash),/source has changed/);
});
test('R37 no authoring draft is connected to the official teacher catalogue',()=>{
 for(const p of ['index.html','assets/hub.js','self-check/reading/reading.js']){
  assert.doesNotMatch(read(p),/test-banks\/reading|r37-en-/);
 }
});
