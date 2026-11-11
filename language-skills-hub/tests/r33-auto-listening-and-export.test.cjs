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
function fullAnswers(v){
 const match=core.matching(v);
 const objective=part=>v[part].map(q=>Array.isArray(q.correct)?q.correct.slice():q.correct);
 return {gist:objective('gist'),detail:objective('detail'),
  sequence:v.sequence.map((_,i)=>i),
  match:match.prompts.map(p=>match.options.findIndex(x=>x.sourceIndex===p.index))};
}
test('All 18 Listening variants provide nonambiguous fully automatic matching items',()=>{
 assert.equal(listens.length,3);
 for(const entry of listens)for(const level of core.LEVELS){
  const v=variant(entry,level),bank=core.matching(v);
  assert.equal(bank.prompts.length,v.facts.length+v.open.length,entry.id+' '+level);
  assert.equal(bank.options.length,bank.prompts.length);
  assert.ok(bank.prompts.length>=3);
  assert.equal(new Set(bank.options.map(x=>x.text.trim().toLowerCase())).size,bank.options.length);
  const answers=fullAnswers(v),report=core.assessAuto(v,answers);
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
test('Matching is one-to-one, rejects illegal picks and scores omissions as wrong',()=>{
 const v=variant(listens[0],'B2'),bank=core.matching(v);
 const bad=fullAnswers(v);
 bad.match[1]=bad.match[0];
 assert.throws(()=>core.assessAuto(v,bad),/only once/);
 const out=core.assessAuto(v,{});
 assert.equal(out.answered,0);
 assert.equal(out.objectiveCorrect,0);
 assert.equal(out.unanswered,out.allTaskCount);
 assert.equal(grade.proposal(out.objectiveCorrect,out.objectiveMax).grade,5);
 assert.equal(out.writing.length,0);
 assert.ok(bank.options.length>=5);
});
test('Practice source retains original free-text prompts; student test has no textarea or teacher scoring form',()=>{
 for(const e of listens){
  const s=fs.readFileSync(path.join(root,e.relative),'utf8');
  assert.match(s,/facts/);
  assert.match(s,/open/);
  assert.match(s,/<textarea|document\.createElement\(['"]textarea['"]\)/);
 }
 const html=fs.readFileSync(path.join(root,'self-check/listening/student.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'self-check/listening/listening-student.js'),'utf8');
 assert.doesNotMatch(html,/id="manualGrade"|id="manualGradeTasks"/);
 assert.doesNotMatch(html,/<textarea/i);
 assert.doesNotMatch(js,/written-response|saveReviewMarks\(|teacherReview\(/);
 assert.match(js,/core\.assessAuto\(/);
 assert.match(js,/matchingTask\(/);
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
