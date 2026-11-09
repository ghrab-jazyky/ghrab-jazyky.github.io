/* R25 shared local results: same metrics and explicit non-grade status for Reading/Listening.
 * Scores/answer keys remain publicly inspectable. This is NOT school classification.
 */
(function(root){
 'use strict';
 const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const integer=(n,min)=>Number.isSafeInteger(n)&&n>=min;
 function expect(ok,msg){if(!ok)throw new Error(msg)}
 function ratio(earned,max){
  expect(integer(earned,0)&&integer(max,1)&&earned<=max,'Invalid objective points.');
  return {earned,max,exactNumerator:earned*100,exactDenominator:max,
   displayedPercent:Math.round(earned*10000/max)/100};
 }
 function reviewReading(report){
  expect(isObject(report),'Invalid Reading report.');
  expect(report.schoolGrade===null&&report.officialGrade===false&&
   report.localOnly===true,'Official school grading is forbidden.');
  expect(integer(report.total,1)&&integer(report.answered,0)&&
   integer(report.unanswered,0)&&report.answered+report.unanswered===report.total,
   'Incorrect Reading completion totals.');
  expect(report.points===report.correct&&report.maxPoints===report.total,
   'Unexpected Reading scoring weights.');
  expect(integer(report.correct,0)&&report.correct<=report.answered,'Invalid Reading correct answers.');
  expect(Array.isArray(report.details)&&report.details.length===report.total,
   'Missing Reading review details.');
  const points=ratio(report.points,report.maxPoints);
  expect(Math.abs(points.displayedPercent-report.percentage)<0.011,
   'Inconsistent Reading percentage.');
  return {
   kind:'LSH_LOCAL_RESULT_R25_V1',skill:'reading',localOnly:true,
   points,completion:{answered:report.answered,total:report.total,unanswered:report.unanswered},
   written:{total:0,forTeacherReview:0,unanswered:0},
   officialSchoolGrade:null,finalSchoolPercentage:null,
   schoolGradingEnabled:false,officialResult:false,
   status:'OBJECTIVE_SELF_CHECK_ONLY',review:report.details
  };
 }
 function reviewListening(report){
  expect(isObject(report)&&report.kind==='LSH_LOCAL_LISTENING_REVIEW_R24_V1',
   'Invalid Listening report.');
  expect(report.localOnly===true&&report.officialGrade===null&&
   report.resultFinal===false&&report.finalPercentage===null,
   'Listening written answers cannot receive a final automatic grade.');
  expect(integer(report.objectiveCorrect,0)&&integer(report.objectiveMax,1)&&
   report.objectiveCorrect<=report.objectiveMax,'Invalid Listening objective points.');
  expect(Array.isArray(report.reviewed)&&report.reviewed.length===report.objectiveMax,
   'Listening objective answers mismatch.');
  expect(Array.isArray(report.writing)&&report.writing.length>=1,
   'Listening writing tasks must be teacher-reviewed.');
  expect(integer(report.allTaskCount,1)&&report.allTaskCount===
   report.objectiveMax+report.writing.length,'Listening task counts mismatch.');
  expect(integer(report.answered,0)&&integer(report.unanswered,0)&&
   report.answered+report.unanswered===report.allTaskCount,
   'Incorrect Listening completion totals.');
  expect(integer(report.writingReviewCount,0)&&report.writingReviewCount<=report.writing.length,
   'Incorrect Listening teacher-review count.');
  const manual=report.writing.filter(x=>x.state==='teacher_review_required');
  expect(manual.length===report.writingReviewCount,
   'Listening written states mismatch.');
  const points=ratio(report.objectiveCorrect,report.objectiveMax);
  expect(Math.abs(points.displayedPercent-report.objectivePercent)<0.011,
   'Inconsistent Listening percentage.');
  return {
   kind:'LSH_LOCAL_RESULT_R25_V1',skill:'listening',localOnly:true,
   points,completion:{answered:report.answered,total:report.allTaskCount,unanswered:report.unanswered},
   written:{total:report.writing.length,forTeacherReview:manual.length,
    unanswered:report.writing.length-manual.length},
   officialSchoolGrade:null,finalSchoolPercentage:null,
   schoolGradingEnabled:false,officialResult:false,
   status:'WRITTEN_TEACHER_REVIEW_REQUIRED',
   review:report.reviewed,writtenReview:report.writing
  };
 }
 function scoreTiles(normalized,labels,locale){
  expect(isObject(normalized)&&normalized.kind==='LSH_LOCAL_RESULT_R25_V1',
   'Only normalized R25 reports can be shown.');
  expect(normalized.officialSchoolGrade===null&&normalized.officialResult===false,
   'Cannot display a school grade for a local result.');
  expect(isObject(labels)&&typeof labels.points==='string'&&
   typeof labels.objectivePercent==='string'&&typeof labels.completion==='string'&&
   typeof labels.schoolGrade==='string'&&typeof labels.noGrade==='string',
   'Missing result labels.');
  const percent=new Intl.NumberFormat(locale||'en',{minimumFractionDigits:0,
   maximumFractionDigits:2}).format(normalized.points.displayedPercent)+' %';
  const items=[
   {value:normalized.points.earned+' / '+normalized.points.max,label:labels.points},
   {value:percent,label:labels.objectivePercent},
   {value:normalized.completion.answered+' / '+normalized.completion.total,
    label:labels.completion}
  ];
  if(normalized.written.total){
   expect(typeof labels.manualReview==='string','Missing written review label.');
   items.push({value:normalized.written.forTeacherReview+' / '+normalized.written.total,
    label:labels.manualReview});
  }
  items.push({value:labels.noGrade,label:labels.schoolGrade});
  return items;
 }
 const api={reviewReading,reviewListening,scoreTiles};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHResultCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
