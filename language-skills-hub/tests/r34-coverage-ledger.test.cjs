#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(base,p),'utf8'));
const cover=read('self-check/test-banks/assessment-coverage.json');
const catalog=read('data/cards.json');
const manifest=read('version.json');
test('R34 all 138 Reading/Listening variants have explicit honest coverage',()=>{
 assert.equal(cover.kind,'LSH_INDEPENDENT_ASSESSMENT_COVERAGE_R34_V1');
 assert.equal(cover.productionBaseline,'R31');
 assert.equal(cover.records.length,138);
 const counts={reading:0,listening:0,draft:0,missing:0};
 const seen=new Set();
 for(const row of cover.records){
  assert.ok(['reading','listening'].includes(row.skill));
  const key=row.skill+':'+row.topic+':'+row.language+':'+row.level;
  assert.ok(!seen.has(key));seen.add(key);
  const practice=catalog.entries.find(x=>x.id===row.topic);
  assert.ok(practice);
  assert.ok(practice.languages.includes(row.language));
  assert.ok(practice.levels.includes(row.level));
  assert.equal(practice.relative,row.sourcePractice);
  assert.equal(row.passedHumanAudit,false);
  assert.equal(row.approvedForCatalog,false);
  counts[row.skill]++;
  if(row.state==='draft_authored_unapproved'){
   counts.draft++;
   assert.ok(['reading','listening'].includes(row.skill));
   assert.ok(row.topic==='rl-can-mistakes'||['ll-harrison-ford','ll-matthew-oscars','ll-peaky-no-fighting'].includes(row.topic));
   assert.equal(row.language,'en');
   assert.ok(row.independentBank);
   const bank=read(row.independentBank);
   assert.equal(bank.level,row.level);
   assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
   assert.equal(bank.published,false);
   assert.equal(bank.sourcePracticeContentHash,manifest.contentHashes[row.topic]);
   assert.equal(row.skill==='reading'?bank.questions.length:bank.objective.length, row.skill==='reading'?10:6);
  }else{
   assert.equal(row.state,'content_not_authored');
   counts.missing++;
   assert.equal(row.independentBank,null);
  }
 }
 assert.deepEqual(counts,{reading:120,listening:18,draft:24,missing:114});
 assert.deepEqual(cover.counts,{reading:120,listening:18,drafts:24,missing:114});
});
test('R34 no unapproved draft is auto-exposed by student directory',()=>{
 const index=fs.readFileSync(path.join(base,'index.html'),'utf8');
 const hub=fs.readFileSync(path.join(base,'assets/hub.js'),'utf8');
 assert.doesNotMatch(index,/assessment-coverage|r34-en-a1|test-banks/);
 assert.doesNotMatch(hub,/assessment-coverage|r34-en-a1|test-banks/);
 assert.equal(manifest.version,'R31');
 assert.equal(manifest.gradedTestsEnabled,false);
 assert.equal(manifest.officialGradesEnabled,false);
});
