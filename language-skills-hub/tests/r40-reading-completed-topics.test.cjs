#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const cards=JSON.parse(read('data/cards.json')).entries;
const manifest=JSON.parse(read('version.json'));
const core=require('../self-check/reading/reading-core.js');
const draft=require('../self-check/test-banks/reading/test-bank-core.js');
const coverage=require('./r35-content-coverage.cjs');
const topics=['rl-can-mistakes','rl-asteroids','rl-plastic-ocean'];
const languages=['en','es','de','fr'],levels=['A1','A2','B1','B2','C1','C2'];
test('R40 three Reading topics have 72/72 isolated unapproved draft variants',()=>{
 for(const topic of topics){
  const rows=coverage.rows.filter(row=>row.topic===topic&&row.skill==='cteni');
  assert.equal(rows.length,24);
  assert.ok(rows.every(r=>r.status==='DRAFT_UNAPPROVED'),topic+' missing/invalid');
 }
 assert.ok(coverage.actual.draftReading>=72);
 assert.equal(coverage.actual.approvedForStudents,0);
 assert.equal(coverage.actual.invalid,0);
});
test('R40 all 72 independent banks use their real language-specific source with valid scoring',()=>{
 const cache=new Map();
 for(const topic of topics){
  const entry=cards.find(c=>c.id===topic&&c.skill==='cteni');
  assert.ok(entry);
  const html=read(entry.relative);
  const hash=createHash('sha256').update(Buffer.from(html,'utf8')).digest('hex');
  assert.equal(hash,manifest.contentHashes[topic]);
  cache.set(topic,{entry,hash,data:core.parseReadingData(html)});
 }
 let n=0;
 for(const topic of topics)for(const lang of languages)for(const level of levels){
  const {hash,data}=cache.get(topic);
  const file='self-check/test-banks/reading/'+topic+'/'+lang+'-'+level+'.json';
  const bank=JSON.parse(read(file));
  assert.equal(bank.topic,topic,file);
  assert.equal(bank.language,lang,file);
  assert.equal(bank.level,level,file);
  assert.equal(bank.published,false,file);
  const practice=core.variantFromData(data,lang,level);
  const qa=draft.makeQaVariant(bank,practice,hash);
  core.validateVariant(qa);
  assert.equal(qa.title.includes(level),true);
  assert.deepEqual(qa.paragraphs,practice.paragraphs,file);
  assert.equal(qa.questions.length,10,file);
  const correct=Object.fromEntries(qa.questions.map(q=>[q.id,q.answer]));
  const wrong=Object.fromEntries(qa.questions.map(q=>[q.id,(q.answer+1)%4]));
  assert.equal(core.score(qa,correct).points,10,file);
  assert.equal(core.score(qa,wrong).points,0,file);
  n++;
 }
 assert.equal(n,72);
});
test('R40 public catalogue still has no draft-only assessment source references',()=>{
 for(const file of ['index.html','assets/hub.js','self-check/reading/reading.js']){
  assert.doesNotMatch(read(file),/test-banks\/reading|R40-CONTENT-AUDIT/);
 }
});
