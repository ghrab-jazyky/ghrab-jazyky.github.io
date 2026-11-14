#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const grade=require('../self-check/results/grade-core.js');
const result=require('../self-check/results/result-core.js');
const rc=require('../self-check/reading/reading-core.js');
const lc=require('../self-check/listening/listening-core.js');
const catalog=JSON.parse(read('data/cards.json'));
const policy=JSON.parse(read('data/test-mode-policy.json'));
const manifest=JSON.parse(read('version.json'));
const bands=JSON.parse(read('data/r25-grading-review.json'));

test('R60 exact language grade bands: half-up rounded whole percent, not an official grade',()=>{
 assert.deepEqual(grade.BANDS.map(x=>x.min),[88,74,59,44,0]);
 const cases=[
  [0,100,5],[43,100,5],[44,100,4],[58,100,4],[59,100,3],
  [73,100,3],[74,100,2],[87,100,2],[88,100,1],[100,100,1],
  [175,200,1],[174,200,2],[147,200,2],[146,200,3],
  [117,200,3],[116,200,4],[87,200,4],[86,200,5],
  [437,500,2],[367,500,3],[292,500,4],[217,500,5],
  [171,200,2],[427,500,2],
  [7,8,1],[22,25,1],[8,9,1],[3,5,3],[1,3,5]
 ];
 for(const [points,max,expected]of cases){
  const actual=grade.proposal(points,max);
  assert.equal(actual.grade,expected,points+'/'+max);
  assert.equal(actual.verifiedIdentity,false);
  assert.equal(actual.schoolApproved,false);
  assert.equal(actual.schoolRecorded,false);
  assert.equal(actual.thresholdMethod,'ROUND_HALF_UP_WHOLE_PERCENT_BEFORE_BANDS');
  assert.equal(actual.roundedPercent,Math.round(points*100/max),points+'/'+max);
  assert.deepEqual(actual.exactFraction,[points,max]);
 }
 for(const pair of [[-1,100],[101,100],[0,0],[1,0],[1.5,2],[NaN,10],['99',100]])
  assert.throws(()=>grade.proposal(...pair));
});
test('R60 exhaustive percentage rounding and grade check (all 125750 results up to 500 points)',()=>{
 let count=0;
 for(let max=1;max<=500;max++)for(let earned=0;earned<=max;earned++){
  const calculated=grade.proposal(earned,max);
  const expectedRounded=Math.floor(earned*100/max+0.5);
  const expected=expectedRounded>=88?1:expectedRounded>=74?2:
   expectedRounded>=59?3:expectedRounded>=44?4:5;
  assert.equal(calculated.roundedPercent,expectedRounded,earned+'/'+max+' rounding');
  assert.equal(calculated.grade,expected,earned+'/'+max+' grade');
  count++;
 }
 assert.equal(count,125750);
});
test('R28 all 120 Reading variants yield grade 1 at full accuracy and 5 when all wrong',()=>{
 let variants=0,items=0;
 for(const e of catalog.entries.filter(x=>x.skill==='cteni')){
  const data=rc.parseReadingData(read(e.relative));
  for(const lang of e.languages)for(const lvl of e.levels){
   const v=rc.variantFromData(data,lang,lvl),ans=Object.create(null);
   for(const q of v.questions)ans[q.id]=q.answer;
   const full=result.reviewReading(rc.score(v,ans));
   const empty=result.reviewReading(rc.score(v,Object.create(null)));
   assert.equal(grade.proposal(full.points.earned,full.points.max).grade,1);
   assert.equal(grade.proposal(empty.points.earned,empty.points.max).grade,5);
   assert.equal(full.officialSchoolGrade,null);
   variants++;items+=v.questions.length;
  }
 }
 assert.equal(variants,120);assert.equal(items,1800);
});
test('R28 Listening requires all written marks, then sums objective + 1 point per reviewed answer',()=>{
 let variants=0,objective=0,written=0;
 for(const e of catalog.entries.filter(x=>x.skill==='poslech'&&x.id!=='ll-sad')){
  const data=lc.extractJson(read(e.relative),'DATA');
  for(const lvl of e.levels){
   const v=lc.variant(data,lvl);
   const good={gist:v.gist.map(q=>q.correct),detail:v.detail.map(q=>q.correct),
    sequence:v.sequence.map((_,i)=>i),facts:v.facts.map(()=>'valid'),
    open:v.open.map(()=>'meaningful answer')};
   const reviewed=result.reviewListening(lc.assess(v,good));
   const n=reviewed.writtenReview.length;
   const pending=grade.listening(reviewed,Array(n).fill(null));
   assert.equal(pending.final,false);assert.equal(pending.pending,n);assert.equal(pending.suggested,null);
   const partial=grade.listening(reviewed,[1,...Array(n-1).fill(null)]);
   assert.equal(partial.final,n===1);
   const allGood=grade.listening(reviewed,Array(n).fill(1));
   assert.equal(allGood.final,true);
   assert.equal(allGood.suggested.grade,1);
   assert.equal(allGood.earned,allGood.max);
   assert.equal(allGood.officialSchoolGrade,null);
   const allWrong=grade.listening(reviewed,Array(n).fill(0));
   assert.equal(allWrong.earned,reviewed.points.earned);
   assert.equal(allWrong.max,reviewed.points.max+n);
   assert.equal(allWrong.suggested.grade,grade.proposal(reviewed.points.earned,reviewed.points.max+n).grade);
   assert.throws(()=>grade.listening(reviewed,[...Array(n-1).fill(null),2]));
   variants++;objective+=reviewed.points.max;written+=n;
  }
 }
 assert.equal(variants,18);assert.equal(objective,251);assert.equal(written,84);
});
test('R28 working language scale not falsely presented as officially approved',()=>{
 assert.equal(manifest.version,'R68-SAD-A1C2');
 assert.equal(manifest.localGradeProposalsEnabled,true);
 assert.equal(manifest.gradedTestsEnabled,false);
 assert.equal(manifest.officialGradesEnabled,false);
 assert.equal(policy.status,'PUBLIC_LOCAL_GRADE_PROPOSALS');
 assert.equal(policy.localGradeProposalsEnabled,true);
 assert.equal(policy.officialGradesEnabled,false);
 assert.equal(policy.backendEnabled,false);
 assert.equal(policy.tamperProofResultsGuaranteed,false);
 assert.equal(policy.publication.teacherMustVerifyResults,true);
 assert.equal(bands.workingSource.schoolApprovalVerified,false);
 assert.equal(bands.enabled,false);
 assert.equal(bands.decimalPercentRule,'ROUND_TO_NEAREST_WHOLE_PERCENT_BEFORE_GRADE_BANDS');
 assert.equal(bands.roundingRule,'MATHEMATICAL_HALF_UP_0_5_ROUNDS_UP');
 assert.match(read('self-check/results/grade-core.js'),/schoolApproved:false/);
 assert.match(read('self-check/results/grade-core.js'),/schoolRecorded:false/);
});
test('R28 UI provides provisional grades after Reading and automatic Listening submission',()=>{
 const reading=read('self-check/reading/reading.js');
 const listening=read('self-check/listening/listening-student.js');
 const rhtml=read('self-check/reading/index.html');
 const lhtml=read('self-check/listening/student.html');
 const catalogJs=read('assets/hub.js');
 assert.match(reading,/gradeCore\.proposal\(report\.points,report\.maxPoints\)/);
 assert.match(rhtml,/id="gradeProposal"/);
 assert.match(lhtml,/id="gradeProposal"/);
 assert.doesNotMatch(lhtml,/id="manualGrade"/);
 assert.match(listening,/core\.assessAuto/);
 assert.match(listening,/LSHPdfReport\.download/);
 assert.match(lhtml,/id="exportPdf"/);
 assert.match(catalogJs,/one\('a','action test','TEST'\)/);
 assert.doesNotMatch(read('self-check/results/grade-core.js'),/fetch\(|XMLHttpRequest|navigator\.sendBeacon/);
});

