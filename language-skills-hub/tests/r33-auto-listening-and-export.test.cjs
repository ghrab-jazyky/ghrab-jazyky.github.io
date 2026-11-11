#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const core=require('../self-check/listening/listening-core.js');
const result=require('../self-check/results/result-core.js');
const grade=require('../self-check/results/grade-core.js');
const exporter=require('../self-check/results/export-core.js');
const root=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8'));
const listens=catalog.entries.filter(e=>e.skill==='poslech');

function variant(entry,level){
 const html=fs.readFileSync(path.join(root,entry.relative),'utf8');
 return core.variant(core.extractJson(html,'DATA'),level);
}
function fullAnswers(v,topic,level){
 const facts=core.cloze(v,topic,level);
 const objective=part=>v[part].map(q=>Array.isArray(q.correct)?q.correct.slice():q.correct);
 return {gist:objective('gist'),detail:objective('detail'),
  sequence:v.sequence.map((_,i)=>i),cloze:facts.map(x=>x.accepted[0])};
}
test('All 18 Listening levels use exact-key short factual cloze instead of an answer bank',()=>{
 assert.equal(listens.length,3);
 for(const entry of listens)for(const level of core.LEVELS){
  const v=variant(entry,level),tasks=core.cloze(v,entry.id,level);
  assert.equal(tasks.length,v.facts.length,entry.id+' '+level);
  assert.ok(tasks.length>=2&&tasks.length<=3,entry.id+' '+level);
  assert.ok(tasks.every(t=>t.accepted.length>=1));
  const answers=fullAnswers(v,entry.id,level);
  const report=core.assessAuto(v,answers,entry.id,level);
  assert.equal(report.autoClosed,true);
  assert.equal(report.assessmentMode,'AUTO_CLOSED');
  assert.equal(report.writing.length,0);
  assert.equal(report.writingReviewCount,0);
  assert.equal(report.objectiveCorrect,report.objectiveMax,entry.id+' '+level);
  assert.equal(report.answered,report.allTaskCount);
  assert.equal(report.unanswered,0);
  const normalized=result.reviewListening(report);
  assert.equal(normalized.status,'AUTO_CLOSED_COMPLETED');
  assert.equal(normalized.written.total,0);
  assert.equal(grade.proposal(normalized.points.earned,normalized.points.max).grade,1);
  const meta={topic:entry.id,language:'en',level,submittedAt:null,interruptionCount:0};
  const receipt=exporter.listeningAuto(normalized,meta);
  assert.equal(receipt.proposed_grade,1);
  assert.equal(receipt.teacher_marks,'');
  const rows=exporter.questionRows(normalized,'listening');
  assert.equal(rows.length,report.allTaskCount);
  const csv=exporter.detailedCsv(receipt,rows,1762848000000);
  assert.doesNotMatch(csv,/anonymous_code|student_name|student_email/);
  assert.match(csv,/question_id/);
  assert.equal(csv.split('\r\n').length,rows.length+2);
  assert.doesNotMatch(csv,/teacher_review_required|PRIVATE_STUDENT_ANSWER/);
 }
});
test('Auto scorer accepts authored spelling variants, rejects guesses and omitted facts',()=>{
 const e=listens[0],v=variant(e,'A1'),good=fullAnswers(v,e.id,'A1');
 assert.equal(core.assessAuto(v,{...good,cloze:['three','ten years']},e.id,'A1').objectiveCorrect,
  core.assessAuto(v,good,e.id,'A1').objectiveMax);
 const wrong={...good,cloze:['wrong',good.cloze[1]]};
 const outcome=core.assessAuto(v,wrong,e.id,'A1');
 assert.equal(outcome.objectiveCorrect,outcome.objectiveMax-1);
 assert.throws(()=>core.assessAuto(v,{cloze:['x'.repeat(121)]},e.id,'A1'),/Invalid short/);
 const empty=core.assessAuto(v,{},e.id,'A1');
 assert.equal(empty.objectiveCorrect,0);
 assert.equal(empty.unanswered,empty.allTaskCount);
 assert.equal(grade.proposal(empty.objectiveCorrect,empty.objectiveMax).grade,5);
 const multi=variant(listens[1],'B2');
 const m=core.cloze(multi,listens[1].id,'B2');
 assert.ok(m.length===3);
 const names=core.assessAuto(multi,{cloze:['Steven Spielberg & George Lucas',
  'Pat McQueeney and Fred Roos','Calista and family']},listens[1].id,'B2');
 assert.equal(names.reviewed.filter(q=>q.phase==='cloze'&&q.correct).length,3);
});
test('Practice keeps free interpretation; test contains no visible keyed bank or teacher scoring form',()=>{
 for(const e of listens){
  const src=fs.readFileSync(path.join(root,e.relative),'utf8');
  assert.match(src,/facts/);assert.match(src,/open/);
  assert.match(src,/<textarea|document\.createElement\(['"]textarea['"]\)/);
 }
 const html=fs.readFileSync(path.join(root,'self-check/listening/student.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'self-check/listening/listening-student.js'),'utf8');
 assert.doesNotMatch(html,/id="manualGrade"|id="manualGradeTasks"/);
 assert.doesNotMatch(html,/<textarea/i);
 assert.doesNotMatch(js,/matchingTask\(|matching-bank|written-response|saveReviewMarks\(|teacherReview\(/);
 assert.match(js,/core\.assessAuto\(/);
 assert.match(js,/clozeTask\(/);
});
test('Private Reading and Listening archive excludes answers and all student identifiers',async()=>{
 const metadata={topic:'rl-asteroids',language:'es',level:'B1',submittedAt:null,interruptionCount:0};
 const raw={points:1,maxPoints:2,details:[
  {id:'first-test',kind:'mc',correct:true,
   selectedAnswer:'SECRET_ANSWER_123',explanation:'SECRET_EXPLANATION'},
  {id:'second-test',kind:'gap',correct:false,selectedAnswer:'PRIVATE_EMAIL@school.invalid'}
 ]};
 const receipt=exporter.reading(raw,metadata),rows=exporter.questionRows(raw,'reading');
 assert.equal(rows.length,2);
 const csv=exporter.detailedCsv(receipt,rows,1762848000000);
 const text=exporter.reportText(receipt,rows,1762848000000);
 assert.doesNotMatch(csv+text,/anonymous_code|student_name|student_email|Kod:/);
 assert.match(text,/VYSLEDEK TESTU/);
 assert.match(text,/1\/2/);
 assert.doesNotMatch(csv+text,/SECRET_|PRIVATE_EMAIL|school\.invalid/);
 assert.throws(()=>exporter.detailedCsv(receipt,rows,-1));
 assert.throws(()=>exporter.detailedCsv(receipt,[{...rows[0],awarded_points:3}],1762848000000));
 let copied='';
 await exporter.copyReport(receipt,rows,null,
  {writeText:async s=>{copied=s}},1762848000000);
 assert.equal(copied,text);
});
