#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),
 {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=require('../self-check/listening/listening-core.js');
const schema=require('../self-check/test-banks/listening/independent-schema.js');
const manifest=JSON.parse(read('version.json'));
const catalog=JSON.parse(read('data/cards.json')).entries;
const topics=['ll-matthew-oscars','ll-harrison-ford','ll-peaky-no-fighting'];
test('R38 independent EN B2 Listening content covers all three existing topics without editing original HTML',()=>{
 for(const topic of topics){
  const entry=catalog.find(x=>x.id===topic&&x.skill==='poslech');
  assert.ok(entry);
  const original=read(entry.relative);
  const hash=crypto.createHash('sha256').update(original).digest('hex');
  assert.equal(hash,manifest.contentHashes[topic]);
  const originalB2=core.variant(core.extractJson(original,'DATA'),'B2');
  const bank=JSON.parse(read('self-check/test-banks/listening/'+topic+'/en-B2.json'));
  const stats=schema.validate(bank,{topic,lang:'en',level:'B2'},originalB2,hash);
  assert.equal(bank.published,false);
  assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
  assert.deepEqual({...stats},{draft:true,approved:false,objective:8,written:2,total:10});
  assert.equal(bank.variant.gist.length,2);
  assert.equal(bank.variant.detail.length,3);
  assert.equal(bank.variant.sequence.length,3);
  assert.equal(bank.variant.facts.length+bank.variant.open.length,2);
  assert.ok(bank.variant.gist.every(q=>q.options.length===4));
  const seen=new Set([...originalB2.gist,...originalB2.detail,...originalB2.facts,...originalB2.open].map(q=>q.title));
  assert.ok([...bank.variant.gist,...bank.variant.detail,...bank.variant.facts,...bank.variant.open].every(q=>!seen.has(q.title)));
 }
});
test('R38 original Listening data still yields teacher-reviewed 0/1 local grade and 3 topic drafts in inventory',()=>{
 const resultCore=require('../self-check/results/result-core.js');
 const grade=require('../self-check/results/grade-core.js');
 for(const topic of topics){
  const bank=JSON.parse(read('self-check/test-banks/listening/'+topic+'/en-B2.json'));
  const v=bank.variant;
  const a={gist:v.gist.map(q=>q.correct),detail:v.detail.map(q=>q.correct),
   sequence:v.sequence.map((_,i)=>i),facts:['a supported personal detail'],
   open:['a clearly connected interpretation']};
  const review=core.assess(v,a),norm=resultCore.reviewListening(review);
  assert.equal(review.objectiveCorrect,8);
  assert.equal(review.writing.length,2);
  assert.equal(grade.listening(norm,[1,null]).suggested,null);
  assert.equal(grade.listening(norm,[1,1]).suggested.grade,1);
 }
 const report=JSON.parse(execFileSync(process.execPath,[
  path.join(root,'tools/independent-assessment-worklist.cjs'),'--json'],{encoding:'utf8'}));
 assert.equal(report.overview.total,138);
 assert.equal(report.overview.states.draft,13);
 assert.equal(report.overview.states.missing,125);
 assert.equal(report.rows.filter(x=>x.skill==='listening'&&x.state==='draft').length,3);
});
test('R38 no independent Listening draft is advertised from existing public teaching setup',()=>{
 assert.doesNotMatch(read('self-check/listening/listening-teacher.js'),/test-banks\/listening/);
 assert.doesNotMatch(read('self-check/listening/listening-student.js'),/test-banks\/listening/);
 assert.doesNotMatch(read('index.html'),/test-banks\/listening/);
});
