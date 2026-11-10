#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const reading=require('../self-check/reading/reading-core.js');
const bankCore=require('../self-check/test-banks/reading/test-bank-core.js');
const grade=require('../self-check/results/grade-core.js');
const manifest=JSON.parse(read('version.json'));
const source=read('cteni/asteroids/index.html'),data=reading.parseReadingData(source);
const hash=createHash('sha256').update(fs.readFileSync(path.join(root,'cteni/asteroids/index.html'))).digest('hex');
const levels=['A1','A2','B1','B2','C1','C2'];
const minutes={A1:15,A2:15,B1:20,B2:20,C1:25,C2:25};
const banks=Object.fromEntries(levels.map(l=>[l,JSON.parse(read('self-check/test-banks/reading/rl-asteroids/en-'+l+'.json'))]));
test('R35 Asteroids all six English independent test banks are structurally valid, grounded, and unapproved',()=>{
 assert.equal(manifest.version,'R31');
 assert.equal(hash,manifest.contentHashes['rl-asteroids']);
 const unique=new Set(),sourceIds=new Set();
 for(const level of levels){
  const bank=banks[level],practice=reading.variantFromData(data,'en',level);
  const selection={topic:'rl-asteroids',language:'en',level};
  assert.equal(bankCore.validate(bank,practice,hash,selection),true);
  assert.equal(bank.published,false);
  assert.equal(bank.durationMinutesSuggested,minutes[level]);
  assert.equal(bank.sourceTitle,practice.title);
  const variant=bankCore.makeQaVariant(bank,practice,hash,selection);
  reading.validateVariant(variant);
  assert.deepEqual(variant.paragraphs,practice.paragraphs);
  assert.equal(variant.questions.length,10);
  const originals=new Set(practice.questions.map(q=>q.q.toLowerCase().trim()));
  const positions=[0,0,0,0];
  for(const q of variant.questions){
   assert.ok(!originals.has(q.q.toLowerCase().trim()),'Not a verbatim practice stem');
   assert.ok(!sourceIds.has(q.id),'Unique ID across all 6 banks');
   sourceIds.add(q.id);
   const key=q.q.toLowerCase().trim();
   assert.ok(!unique.has(key),'Unique stem across all 6 banks');
   unique.add(key);
   assert.ok(q.sourceParagraph>=1&&q.sourceParagraph<=practice.paragraphs.length);
   positions[q.answer]++;
  }
  assert.ok(positions.every(n=>n>=2&&n<=3));
  const perfect=reading.score(variant,Object.fromEntries(variant.questions.map(q=>[q.id,q.answer])));
  assert.equal(perfect.points,10);
  assert.equal(grade.proposal(perfect.points,perfect.maxPoints).grade,1);
  const empty=reading.score(variant,{});
  assert.equal(empty.unanswered,10);assert.equal(empty.points,0);
 }
 assert.equal(sourceIds.size,60);
});
test('R35 generic loader rejects cross-topic, cross-level and non-existent bank substitution',()=>{
 const sample=banks.B2,practice=reading.variantFromData(data,'en','B2');
 assert.throws(()=>bankCore.validate(sample,practice,hash,{topic:'rl-can-mistakes',language:'en',level:'B2'}),
  /does not match selected/);
 assert.throws(()=>bankCore.validate(sample,practice,hash,{topic:'rl-asteroids',language:'fr',level:'B2'}),
  /does not match selected/);
 assert.throws(()=>bankCore.validate(sample,reading.variantFromData(data,'en','C1'),hash,
  {topic:'rl-asteroids',language:'en',level:'B2'}),/source does not match/);
 assert.throws(()=>bankCore.validate({...sample,published:true},practice,hash,
  {topic:'rl-asteroids',language:'en',level:'B2'}),/without teacher approval/);
 assert.throws(()=>bankCore.validate({...sample,sourceTitle:'Wrong passage'},practice,hash,
  {topic:'rl-asteroids',language:'en',level:'B2'}),/source does not match/);
});
test('R35 QA loader restricts source paths to catalog and never publishes unapproved banks',()=>{
 const preview=read('self-check/test-banks/reading/preview.js');
 assert.match(preview,/catalog.entries/);
 assert.match(preview,/card.relative/);
 assert.match(preview,/manifest.contentHashes\[topic\]/);
 assert.match(preview,/testBank.makeQaVariant/);
 for(const p of ['index.html','assets/hub.js','self-check/reading/reading.js']){
  assert.doesNotMatch(read(p),/test-banks\/reading|r35-en-/);
 }
});
