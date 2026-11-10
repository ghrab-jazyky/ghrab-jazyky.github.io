#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const attemptCore=require('../self-check/session/attempt-core.js');
const grade=require('../self-check/results/grade-core.js');
const receipts=require('../self-check/results/export-core.js');
const resultCore=require('../self-check/results/result-core.js');
function store(){
 const data=new Map();
 return {data,getItem:k=>data.has(k)?data.get(k):null,
  setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
}
function cfg(storage,now){
 return {skill:'listening',topic:'ll-harrison-ford',lang:'en',level:'B2',
  attempt:'class20261110a-0123456789abcdef01234567',limitMinutes:20,
  storage,now};
}
test('R31 teacher marks can only be saved after submission and survive reload',()=>{
 const storage=store();let now=9000000;
 const input=cfg(storage,()=>now);
 const a=attemptCore.open(input);
 assert.throws(()=>a.saveReviewMarks([1,0]),/after submission/);
 a.start();a.saveAnswers({facts:['student writing should stay local']});
 assert.throws(()=>a.saveReviewMarks([1,0]),/after submission/);
 now+=5000;a.finish();
 a.saveReviewMarks([1,null,0]);
 const state=attemptCore.open(input).status();
 assert.deepEqual(state.reviewMarks,[1,null,0]);
 assert.equal(state.phase,'submitted');
 assert.deepEqual(state.answers,{facts:['student writing should stay local']});
 assert.throws(()=>attemptCore.open(input).saveReviewMarks([1,0]),/count changed/);
 assert.throws(()=>attemptCore.open(input).saveReviewMarks([1,2,0]),/Invalid teacher/);
 assert.throws(()=>attemptCore.open(input).saveReviewMarks(['1',0,0]),/Invalid teacher/);
 const b=attemptCore.open(input);b.saveReviewMarks([0,1,1]);
 assert.deepEqual(attemptCore.open(input).status().reviewMarks,[0,1,1]);
 b.clear();
 assert.equal(attemptCore.open(input).status().reviewMarks,null);
});
test('R31 R30 local snapshots without reviewMarks remain readable',()=>{
 const storage=store(),input=cfg(storage,()=>123456);
 const a=attemptCore.open(input);a.start();a.finish();
 const old=JSON.parse(storage.getItem(a.id));delete old.reviewMarks;
 storage.setItem(a.id,JSON.stringify(old));
 assert.equal(attemptCore.open(input).status().reviewMarks,null);
 const restored=attemptCore.open(input);
 restored.saveReviewMarks([0,1]);
 assert.deepEqual(attemptCore.open(input).status().reviewMarks,[0,1]);
});
test('R31 Reading receipt includes only score, grade proposal, topic, CEFR and no personal answers',()=>{
 const report={points:8,maxPoints:10,details:[
  {question:'Student secret answer',selectedAnswer:'Sensitive personal text'}
 ]};
 const meta={topic:'rl-asteroids',language:'es',level:'B2',
  submittedAt:1731234567890,interruptionCount:1};
 const r=receipts.reading(report,meta),txt=receipts.csv(r);
 assert.equal(r.record_kind,receipts.KIND);
 assert.equal(r.proposed_grade,2);
 assert.equal(r.total_points,8);
 assert.equal(r.total_max,10);
 assert.equal(r.success_percent,80);
 assert.equal(r.verification,'LOCAL_UNVERIFIED_NOT_SCHOOL_RECORD');
 assert.equal(r.written_pending,0);
 assert.match(txt,/\uFEFF/);
 assert.match(txt,/LOCAL_UNVERIFIED_NOT_SCHOOL_RECORD/);
 assert.doesNotMatch(txt,/Student secret answer|Sensitive personal text|email|studentName/);
 assert.equal(txt.split('\r\n').length,3);
 assert.equal(receipts.FIELDS.length,18);
 assert.throws(()=>receipts.reading(report,{...meta,topic:'=1+1'}));
});
test('R31 Listening receipt with pending written answers cannot masquerade as final grade',()=>{
 const normalized={
  kind:'LSH_LOCAL_RESULT_R25_V1',skill:'listening',
  officialSchoolGrade:null,officialResult:false,
  points:{earned:4,max:6},
  writtenReview:[
   {question:'What is your name?',answer:'PERSONAL DETAIL never export'},
   {question:'What was the message?',answer:'secret'},
   {question:'Explain why',answer:'private text'}
  ]
 };
 const meta={topic:'ll-harrison-ford',language:'en',level:'B2',
  submittedAt:null,interruptionCount:0};
 const pending=receipts.listening(normalized,[1,null,0],meta);
 assert.equal(pending.written_pending,1);
 assert.equal(pending.proposed_grade,'');
 assert.equal(pending.total_points,'');
 assert.equal(pending.success_percent,'');
 assert.equal(pending.teacher_marks,'1|?|0');
 const final=receipts.listening(normalized,[1,0,1],meta);
 const suggested=grade.proposal(6,9);
 assert.equal(final.total_points,6);
 assert.equal(final.total_max,9);
 assert.equal(final.proposed_grade,suggested.grade);
 assert.equal(final.written_pending,0);
 const txt=receipts.csv(final);
 assert.doesNotMatch(txt,/PERSONAL DETAIL|secret|private text|What is your name/);
 assert.match(txt,/1\|0\|1/);
 assert.throws(()=>receipts.listening(normalized,[1,2,1],meta));
});
test('R31 local exporter sanitizes formula-like values and has no uploading behavior',()=>{
 const src=fs.readFileSync(path.resolve(__dirname,'../self-check/results/export-core.js'),'utf8');
 assert.doesNotMatch(src,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|document.cookie|postMessage\s*\(/);
 const r=receipts.reading({points:9,maxPoints:10},{topic:'rl-asteroids',language:'en',level:'A1',submittedAt:null,interruptionCount:0});
 const altered={...r,topic:'=HYPERLINK("https://example.com")'};
 const csv=receipts.csv(altered);
 assert.match(csv,/'=HYPERLINK/);
 assert.ok(!Object.keys(r).some(k=>/student|name|email|answer|response|reflection|url|sessionId/i.test(k)));
});
