#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const inventory=require('./r35-content-coverage.cjs');
const core=require('../self-check/reading/reading-core.js');
const bankCore=require('../self-check/test-banks/reading/test-bank-core.js');
const manifest=JSON.parse(read('version.json'));
const topics=['rl-can-mistakes','rl-asteroids'];
const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
test('R37 independent Reading has all 24 Asteroids variants, never approved automatically',()=>{
 for(const topic of topics){
  const rows=inventory.rows.filter(x=>x.topic===topic);
  assert.equal(rows.length,24);
  for(const row of rows)assert.equal(row.status,'DRAFT_UNAPPROVED',row.file+' missing or unsafe');
 }
 assert.equal(inventory.expected.total,138);
 assert.equal(inventory.actual.draftReading>=48,true);
 assert.equal(inventory.actual.draftListening,0);
 assert.equal(inventory.actual.approvedForStudents,0);
 assert.equal(inventory.actual.invalid,0);
});
test('R37 every Asteroids bank is grounded in the right source, original passage, points and private status',()=>{
 const source=read('cteni/asteroids/index.html');
 const hash=createHash('sha256').update(Buffer.from(source,'utf8')).digest('hex');
 assert.equal(hash,manifest.contentHashes['rl-asteroids']);
 const data=core.parseReadingData(source);
 for(const lang of LANGS)for(const level of LEVELS){
  const p='self-check/test-banks/reading/rl-asteroids/'+lang+'-'+level+'.json';
  const b=JSON.parse(read(p)),original=core.variantFromData(data,lang,level);
  assert.equal(b.sourcePracticeContentHash,hash,p);
  assert.equal(b.sourceTitle,original.title,p);
  const v=bankCore.makeQaVariant(b,original,hash);
  core.validateVariant(v);
  assert.equal(v.questions.length,10,p);
  assert.deepEqual(v.paragraphs,original.paragraphs,p);
  const answers=Object.fromEntries(v.questions.map(q=>[q.id,q.answer]));
  assert.equal(core.score(v,answers).points,10,p);
  const wrong=Object.fromEntries(v.questions.map(q=>[q.id,(q.answer+1)%4]));
  assert.equal(core.score(v,wrong).points,0,p);
  const positions=[0,0,0,0];v.questions.forEach(q=>positions[q.answer]++);
  assert.ok(positions.every(n=>n>=2&&n<=3),p+' must use balanced answer positions');
  assert.equal(b.published,false,p);
  assert.equal(b.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL',p);
 }
});
test('R37 spot regression: repaired Asteroids EN B2/C2 keys map to defensible correct answer texts',()=>{
 const b2=JSON.parse(read('self-check/test-banks/reading/rl-asteroids/en-B2.json'));
 const c2=JSON.parse(read('self-check/test-banks/reading/rl-asteroids/en-C2.json'));
 const cases=[
  [b2,5,/expected to change with evidence/i],
  [b2,6,/can alter an orbit/i],
  [b2,7,/takes planning/i],
  [b2,9,/evidence, careful preparation and cooperation/i],
  [c2,4,/additional evidence can transform/i],
  [c2,6,/guarantees a solution for every asteroid/i],
  [c2,8,/benefits.*invisible/i]
 ];
 for(const [bank,index,correct]of cases){
  const q=bank.questions[index];
  assert.match(q.choices[q.answer],correct,q.id+' answer index must match actual correct content');
 }
});
test('R37 missing content must not silently use practice questions',()=>{
 const src=read('self-check/test-banks/reading/preview.js');
 assert.match(src,/get\(topic\+'\/'\+lang\+'-'\+level\+'\.json',true\)/);
 assert.match(src,/testBank\.makeQaVariant/);
 assert.match(src,/Original source checksum mismatch/);
 assert.doesNotMatch(read('assets/hub.js'),/test-banks\/reading/);
 assert.doesNotMatch(read('index.html'),/test-banks\/reading/);
});
