#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const reading=require('../self-check/reading/reading-core.js');
const schema=require('../self-check/test-banks/reading/independent-schema.js');
const grade=require('../self-check/results/grade-core.js');
const manifest=JSON.parse(read('version.json'));
const topics=['rl-asteroids','rl-can-mistakes','rl-plastic-ocean','rl-email-friend','rl-instant-messages'];
const routes=JSON.parse(read('data/cards.json')).entries;
test('R36 every Reading catalog topic has one distinct EN B2 bank, none published',()=>{
 const fingerprints=new Set();
 for(const topic of topics){
  const entry=routes.find(x=>x.id===topic&&x.skill==='cteni');
  assert.ok(entry,'Missing approved practice entry '+topic);
  const original=read(entry.relative);
  const hash=crypto.createHash('sha256').update(original).digest('hex');
  assert.equal(hash,manifest.contentHashes[topic]);
  const variant=reading.variantFromData(reading.parseReadingData(original),'en','B2');
  const bank=JSON.parse(read('self-check/test-banks/reading/'+topic+'/en-B2.json'));
  assert.equal(bank.topic,topic);assert.equal(bank.language,'en');assert.equal(bank.level,'B2');
  assert.equal(bank.published,false);
  assert.equal(schema.validate(bank,{topic,lang:'en',level:'B2'},variant,hash).approved,false);
  const qa=schema.qaVariant(bank,{topic,lang:'en',level:'B2'},variant,hash);
  reading.validateVariant(qa);
  assert.equal(qa.questions.length,10);
  assert.deepEqual(qa.paragraphs,variant.paragraphs);
  const originalIds=new Set(variant.questions.map(q=>q.id));
  const originalStems=new Set(variant.questions.map(q=>q.q.toLocaleLowerCase().replace(/\s+/g,' ').trim()));
  const ids=new Set(qa.questions.map(q=>q.id));
  assert.equal(ids.size,10);
  const distribution=[0,0,0,0];
  for(const q of qa.questions){
   assert.equal(originalIds.has(q.id),false);
   assert.equal(originalStems.has(q.q.toLocaleLowerCase().replace(/\s+/g,' ').trim()),false);
   assert.ok(q.explanation.length>=30);
   distribution[q.answer]++;
  }
  assert.ok(distribution.every(n=>n>=2&&n<=3),topic+' key distribution '+distribution);
  const perfect=Object.fromEntries(qa.questions.map(q=>[q.id,q.answer]));
  const result=reading.score(qa,perfect);
  assert.equal(result.points,10);assert.equal(result.maxPoints,10);
  assert.equal(grade.proposal(result.points,result.maxPoints).grade,1);
  const fingerprint=qa.questions.map(q=>q.q).join('|');
  assert.ok(!fingerprints.has(fingerprint),'Test bank reused between topics');
  fingerprints.add(fingerprint);
 }
});
test('R36 entire Reading/Listening inventory counts ten authored draft banks and no unexpected publication',()=>{
 const result=JSON.parse(execFileSync(process.execPath,[
  path.join(root,'tools/independent-assessment-worklist.cjs'),'--json'],{encoding:'utf8'}));
 assert.equal(result.overview.total,138);
 assert.equal(result.overview.states.draft,10);
 assert.equal(result.overview.states.missing,128);
 for(const topic of topics){
  assert.ok(result.rows.some(x=>x.topic===topic&&x.language==='en'&&x.level==='B2'&&x.state==='draft'));
 }
 assert.ok(!result.rows.some(x=>x.state==='unexpected-published'||x.state==='invalid'));
});
