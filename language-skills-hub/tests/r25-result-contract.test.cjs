#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const readingCore=require('../self-check/reading/reading-core.js');
const listeningCore=require('../self-check/listening/listening-core.js');
const resultCore=require('../self-check/results/result-core.js');
const catalog=JSON.parse(read('data/cards.json'));
const version=JSON.parse(read('version.json'));
const policy=JSON.parse(read('data/test-mode-policy.json'));
const grading=JSON.parse(read('data/r25-grading-review.json'));
const reading=catalog.entries.filter(x=>x.skill==='cteni');
const listening=catalog.entries.filter(x=>x.skill==='poslech');
const labels={points:'Points',objectivePercent:'Objective success',completion:'Answered tasks',
 manualReview:'Written answers for teacher review',schoolGrade:'Official school grade',noGrade:'—'};

test('R25 school bands remain an unapproved reference and can never issue a grade',()=>{
 assert.equal(grading.kind,'LSH_R25_GRADING_REVIEW_V1');
 assert.equal(grading.status,'UNAPPROVED_WORKING_REFERENCE');
 assert.equal(grading.enabled,false);
 assert.equal(grading.schoolGradesEnabled,false);
 assert.equal(grading.workingSource.schoolApprovalVerified,false);
 assert.equal(grading.decimalPercentRule,'UNDECIDED');
 assert.equal(grading.roundingRule,'UNDECIDED');
 assert.equal(grading.weightingOfObjectiveAndWrittenTasks,'UNDECIDED');
 assert.equal(grading.exportAsOfficialSchoolGrade,false);
 assert.equal(policy.officialGradesEnabled,false);
 assert.equal(policy.gradedTestsEnabled,false);
 assert.equal(policy.testUiEnabled,true);
 assert.equal(policy.selfCheckEnabled,true);
 assert.equal(version.gradedTestsEnabled,false);
 assert.equal(catalog.gradedTestsEnabled,false);
 assert.deepEqual(grading.illustrativeWholePercentBands.map(b=>[b.grade,b.minimumInclusive,b.maximumInclusive]),
  [[1,88,100],[2,74,87],[3,59,73],[4,44,58],[5,0,43]]);
 // Working ranges classify whole percentages only, never fractional values or real students.
 const ranges=grading.illustrativeWholePercentBands;
 for(let p=0;p<=100;p++){
  const matching=ranges.filter(b=>p>=b.minimumInclusive&&p<=b.maximumInclusive);
  assert.equal(matching.length,1,'Working integer coverage '+p);
 }
 for(const p of [87.5,73.5,58.5,43.5,0.5,99.5])
  assert.equal(Number.isInteger(p),false,'No fractional rule approved for '+p);
});

test('R25 shared Reading results preserve 120 real language/CEFR variants and objective-only status',()=>{
 let count=0,items=0;
 for(const entry of reading){
  const raw=read(entry.relative);
  assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),version.contentHashes[entry.id]);
  const data=readingCore.parseReadingData(raw);
  for(const language of entry.languages)for(const level of entry.levels){
   const v=readingCore.variantFromData(data,language,level);
   const choices=Object.create(null);
   for(const q of v.questions)choices[q.id]=q.answer;
   const full=readingCore.score(v,choices);
   const normalized=resultCore.reviewReading(full);
   assert.equal(normalized.kind,'LSH_LOCAL_RESULT_R25_V1');
   assert.equal(normalized.skill,'reading');
   assert.equal(normalized.points.earned,v.questions.length);
   assert.equal(normalized.points.max,v.questions.length);
   assert.equal(normalized.points.displayedPercent,100);
   assert.equal(normalized.completion.answered,v.questions.length);
   assert.equal(normalized.written.total,0);
   assert.equal(normalized.schoolGradingEnabled,false);
   assert.equal(normalized.officialSchoolGrade,null);
   assert.equal(normalized.finalSchoolPercentage,null);
   assert.equal(normalized.officialResult,false);
   const empty=resultCore.reviewReading(readingCore.score(v,Object.create(null)));
   assert.equal(empty.points.earned,0);
   assert.equal(empty.completion.answered,0);
   assert.equal(empty.completion.unanswered,v.questions.length);
   const tiles=resultCore.scoreTiles(normalized,labels,language);
   assert.equal(tiles.length,4);
   assert.equal(tiles.at(-1).value,labels.noGrade);
   assert.equal(tiles[1].value,'100 %');
   count++;items+=v.questions.length;
  }
 }
 assert.equal(count,120);
 assert.equal(items,1800);
});

test('R25 shared Listening results preserve 18 real variants and manual-review status',()=>{
 let count=0,objective=0,written=0;
 for(const entry of listening){
  const raw=read(entry.relative);
  assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),version.contentHashes[entry.id]);
  const data=listeningCore.extractJson(raw,'DATA');
  for(const level of entry.levels){
   const v=listeningCore.variant(data,level);
   const answers={gist:v.gist.map(q=>q.correct),
    detail:v.detail.map(q=>q.correct),
    sequence:v.sequence.map((_,i)=>i),
    facts:v.facts.map(()=>'reasonable response'),
    open:v.open.map(()=>'plausible written explanation')};
   const report=listeningCore.assess(v,answers);
   const normalized=resultCore.reviewListening(report);
   assert.equal(normalized.points.earned,normalized.points.max);
   assert.equal(normalized.points.displayedPercent,100);
   assert.equal(normalized.written.total,v.facts.length+v.open.length);
   assert.equal(normalized.written.forTeacherReview,v.facts.length+v.open.length);
   assert.equal(normalized.status,'WRITTEN_TEACHER_REVIEW_REQUIRED');
   assert.equal(normalized.officialSchoolGrade,null);
   assert.equal(normalized.finalSchoolPercentage,null);
   assert.equal(normalized.officialResult,false);
   const tiles=resultCore.scoreTiles(normalized,labels,'en');
   assert.equal(tiles.length,5);
   assert.equal(tiles[3].value,(v.facts.length+v.open.length)+' / '+(v.facts.length+v.open.length));
   assert.equal(tiles.at(-1).value,labels.noGrade);
   const zero=resultCore.reviewListening(listeningCore.assess(v,{}));
   assert.equal(zero.points.earned,0);
   assert.equal(zero.written.forTeacherReview,0);
   assert.equal(zero.officialSchoolGrade,null);
   objective+=report.objectiveMax;written+=report.writing.length;count++;
  }
 }
 assert.equal(count,18);
 assert.equal(objective,251);
 assert.equal(written,84);
});

test('R25 fractional boundary scores are displayed precisely but never classified',()=>{
 const report={total:8,answered:8,unanswered:0,correct:7,points:7,maxPoints:8,
  percentage:87.5,schoolGrade:null,officialGrade:false,localOnly:true,
  details:Array.from({length:8},(_,i)=>({id:String(i),correct:i<7}))};
 const normalized=resultCore.reviewReading(report);
 assert.equal(normalized.points.exactNumerator,700);
 assert.equal(normalized.points.exactDenominator,8);
 assert.equal(normalized.points.displayedPercent,87.5);
 assert.equal(resultCore.scoreTiles(normalized,labels,'en')[1].value,'87.5 %');
 assert.equal(normalized.officialSchoolGrade,null);
 for(const [points,max,expected] of [[0,100,0],[43,100,43],[44,100,44],
  [58,100,58],[59,100,59],[73,100,73],[74,100,74],[87,100,87],
  [88,100,88],[100,100,100],[1,3,33.33],[7,8,87.5]]){
  const r={...report,total:max,answered:max,unanswered:0,correct:points,points,maxPoints:max,
   percentage:Math.round(points/max*10000)/100,
   details:Array.from({length:max},()=>({correct:true}))};
  const x=resultCore.reviewReading(r);
  assert.equal(x.points.displayedPercent,expected);
  assert.equal(x.officialSchoolGrade,null);
 }
});

test('R25 shared result contract fails closed on forged grades, impossible scores, and missing manual review',()=>{
 const baseline={total:2,answered:2,unanswered:0,correct:1,points:1,maxPoints:2,
  percentage:50,schoolGrade:null,officialGrade:false,localOnly:true,
  details:[{correct:true},{correct:false}]};
 for(const altered of [
  {...baseline,schoolGrade:1},{...baseline,officialGrade:true},
  {...baseline,points:5},{...baseline,correct:3},{...baseline,percentage:88},
  {...baseline,unanswered:1},{...baseline,details:[]}
 ])assert.throws(()=>resultCore.reviewReading(altered));
 const source=listeningCore.variant(listeningCore.extractJson(read(listening[0].relative),'DATA'),'A1');
 const report=listeningCore.assess(source,{});
 for(const altered of [
  {...report,officialGrade:1},{...report,resultFinal:true},{...report,finalPercentage:0},
  {...report,writing:[]},{...report,writingReviewCount:12},
  {...report,objectivePercent:88},{...report,allTaskCount:999}
 ])assert.throws(()=>resultCore.reviewListening(altered));
 const normalized=resultCore.reviewReading(baseline);
 assert.throws(()=>resultCore.scoreTiles({...normalized,officialSchoolGrade:1},labels,'en'));
 assert.throws(()=>resultCore.scoreTiles(normalized,{points:'Points'},'en'));
});

test('R25 repository README points at the real live school catalog, not the archived pilot',()=>{
 const readme=fs.readFileSync(path.resolve(root,'..','README.md'),'utf8');
 assert.match(readme,/https:\/\/ghrab-jazyky\.github\.io\/language-skills-hub\//);
 assert.match(readme,/Test bez známky/);
 assert.match(readme,/Nejde o zabezpečenou klasifikovanou zkoušku/);
 const live=readme.match(/\[Otevřít Language Skills Hub\]\(([^)]+)\)/);
 assert.ok(live);
 assert.equal(live[1],'https://ghrab-jazyky.github.io/language-skills-hub/');
});
test('R25 public practice cards remain unchanged and local results keep grading off',()=>{
 assert.equal(catalog.entries.length,29);
 assert.equal(catalog.entries.reduce((n,e)=>n+e.languages.length*e.levels.length,0),642);
 for(const entry of catalog.entries){
  const digest=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,entry.relative))).digest('hex');
  assert.equal(digest,version.contentHashes[entry.id]);
 }
 const readHtml=read('self-check/reading/index.html');
 const listenHtml=read('self-check/listening/student.html');
 assert.match(readHtml,/\.\.\/results\/result-core\.js/);
 assert.match(listenHtml,/\.\.\/results\/result-core\.js/);
 assert.match(read('self-check/reading/reading.js'),/resultsCore\.reviewReading/);
 assert.match(read('self-check/listening/listening-student.js'),/resultsCore\.reviewListening/);
 assert.match(read('assets/hub.js'),/self-check\/reading\/teacher\.html/);
 assert.match(read('assets/hub.js'),/self-check\/listening\/teacher\.html/);
 assert.doesNotMatch(read('self-check/results/result-core.js'),
  /(?:https?:\/\/|fetch\(|XMLHttpRequest|navigator\.sendBeacon)/);
});
