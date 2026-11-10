#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=require('../self-check/test-banks/listening/test-bank-core.js');
const existing=require('../self-check/listening/listening-core.js');
const grade=require('../self-check/results/grade-core.js');
const exportCore=require('../self-check/results/export-core.js');
const bank=JSON.parse(read('self-check/test-banks/listening/ll-harrison-ford/en-B2.json'));
const manifest=JSON.parse(read('version.json'));
const originalHtml=read('poslech/harrison-ford/index.html');
const original=existing.variant(existing.extractJson(originalHtml,'DATA'),'B2');
const hash=createHash('sha256').update(fs.readFileSync(path.join(root,'poslech/harrison-ford/index.html'))).digest('hex');
test('R35 independent Listening B2 uses the unchanged approved public source',()=>{
 assert.equal(manifest.version,'R31');
 assert.equal(manifest.backendEnabled,false);
 assert.equal(manifest.gradedTestsEnabled,false);
 assert.equal(hash,manifest.contentHashes['ll-harrison-ford']);
 assert.equal(core.validate(bank,original,hash),true);
 assert.equal(bank.objective.length,6);
 assert.equal(bank.written.length,2);
 assert.equal(bank.published,false);
 assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
 const oldQ=new Set([...original.gist,...original.detail].map(q=>q.title.toLowerCase().replace(/\s+/g,' ').trim()));
 for(const q of bank.objective)assert.ok(!oldQ.has(q.q.toLowerCase().replace(/\s+/g,' ').trim()));
});
test('R35 Listening draft cannot publish, change topic or bypass source integrity',()=>{
 assert.throws(()=>core.validate({...bank,published:true},original,hash),/remain unapproved/);
 assert.throws(()=>core.validate({...bank,status:'APPROVED'},original,hash),/remain unapproved/);
 assert.throws(()=>core.validate({...bank,topic:'ll-peaky-no-fighting'},original,hash),/Unsupported/);
 assert.throws(()=>core.validate(bank,original,'0'.repeat(64)),/integrity mismatch/);
 const altered={...bank,objective:bank.objective.map(q=>({...q}))};
 altered.objective[0].q=original.gist[0].title;
 assert.throws(()=>core.validate(altered,original,hash),/Reused/);
});
test('R35 Listening objective 6 points and written 2 marks yield only provisional grade',()=>{
 const correct=Object.fromEntries(bank.objective.map(q=>[q.id,q.answer]));
 correct[bank.written[0].id]='This is a private student answer';
 correct[bank.written[1].id]='Another student response';
 const partial=core.score(bank,correct,[1,null]);
 assert.equal(partial.objectiveEarned,6);
 assert.equal(partial.pending,1);
 assert.equal(partial.totalEarned,null);
 assert.equal(partial.totalMax,8);
 const final=core.score(bank,correct,[1,0]);
 assert.equal(final.objectiveEarned,6);
 assert.equal(final.writtenEarned,1);
 assert.equal(final.totalEarned,7);
 assert.equal(grade.proposal(final.totalEarned,final.totalMax).grade,2); // 7/8 = 87.5%, below the exact 88% threshold
 assert.equal(final.officialSchoolResult,false);
 assert.equal(final.localOnly,true);
 const noAnswers=core.score(bank,{},[0,0]);
 assert.equal(noAnswers.answered,0);
 assert.equal(noAnswers.unanswered,8);
 assert.equal(noAnswers.totalEarned,0);
 assert.throws(()=>core.score(bank,{},[2,0]),/teacher marks/);
});
test('R35 independent Listening anonymous CSV receipt excludes full answers',()=>{
 const answers=Object.fromEntries(bank.objective.map(q=>[q.id,q.answer]));
 answers[bank.written[0].id]='Private confidential answer@example.invalid';
 const result=core.score(bank,answers,[1,0]);
 const normalized={
  kind:'LSH_LOCAL_RESULT_R25_V1',skill:'listening',
  officialSchoolGrade:null,officialResult:false,
  points:{earned:result.objectiveEarned,max:6},
  writtenReview:result.written.map(x=>({question:x.prompt,answer:x.response}))
 };
 const csv=exportCore.csv(exportCore.listening(normalized,[1,0],{
  topic:'ll-harrison-ford',language:'en',level:'B2',submittedAt:null,interruptionCount:0
 }));
 assert.match(csv,/LOCAL_UNVERIFIED_NOT_SCHOOL_RECORD/);
 assert.match(csv,/ll-harrison-ford/);
 assert.doesNotMatch(csv,/confidential|answer@example.invalid|Harrison Ford.*Give|modelAnswer|session-id/);
});
test('R35 QA preview cannot contain media player, hidden telemetry or link in student catalog',()=>{
 const html=read('self-check/test-banks/listening/preview.html');
 const js=read('self-check/test-banks/listening/preview.js');
 assert.match(html,/TEACHER QA ONLY/);
 assert.doesNotMatch(html,/<video\b|<audio\b|iframe\b/i);
 assert.match(js,/sha256\(html\)/);
 assert.match(js,/sourceCore\.variant\(sourceCore\.extractJson\(html,'DATA'\),'B2'\)/);
 assert.doesNotMatch(js,/sendBeacon|XMLHttpRequest|WebSocket|eval\s*\(/);
 assert.doesNotMatch(read('index.html'),/r35-hf-b2|test-banks\/listening/);
 assert.doesNotMatch(read('assets/hub.js'),/r35-hf-b2|test-banks\/listening/);
});
