/* LSH R28 – transparent LOCAL grade proposal (1–5); never an authenticated school record.
 * Source bands: 2026 unapproved school-rules working draft, article 1(24).
 * Exact ratio is compared to thresholds without rounding. NO student tracking.
 */
(function(host){
 'use strict';
 const BANDS=Object.freeze([{grade:1,min:88},{grade:2,min:74},
  {grade:3,min:59},{grade:4,min:44},{grade:5,min:0}]);
 const valid=n=>Number.isSafeInteger(n)&&n>=0;
 function check(ok,message){if(!ok)throw new Error(message)}
 function proposal(earned,max){
  check(valid(earned)&&valid(max)&&max>0&&earned<=max,'Invalid grade points');
  const grade=BANDS.find(b=>earned*100>=b.min*max).grade;
  return {
   kind:'LSH_LOCAL_GRADE_PROPOSAL_R28_V1',
   grade,earned,max,displayedPercent:Math.round(earned*10000/max)/100,
   exactFraction:[earned,max],thresholdMethod:'EXACT_RATIO_NO_ROUNDING',
   schoolApproved:false,schoolRecorded:false,verifiedIdentity:false,
   warning:'Unverified local proposal; teacher decides whether to record a grade.'
  };
 }
 function listening(normalized,marks){
  check(normalized&&normalized.kind==='LSH_LOCAL_RESULT_R25_V1'&&
   normalized.skill==='listening'&&normalized.officialSchoolGrade===null&&
   normalized.officialResult===false,'Invalid ungraded listening report');
  const tasks=normalized.writtenReview;
  check(Array.isArray(tasks)&&tasks.length>0&&Array.isArray(marks)&&marks.length===tasks.length,
   'Missing teacher marks');
  check(marks.every(x=>x===null||x===0||x===1),'Teacher marks must be 0, 1 or pending');
  const pending=marks.filter(x=>x===null).length;
  const correct=marks.filter(x=>x===1).length;
  const objective=normalized.points.earned,max=normalized.points.max+tasks.length;
  const awarded=objective+correct;
  return {
   kind:'LSH_LOCAL_LISTENING_TEACHER_REVIEW_R28_V1',
   objectiveEarned:objective,objectiveMax:normalized.points.max,
   writtenEarned:correct,writtenMax:tasks.length,
   earned:awarded,max,pending,
   final:pending===0,
   suggested:pending===0?proposal(awarded,max):null,
   officialSchoolGrade:null,
   schoolRecorded:false,
   rule:'One point for each accepted written answer, zero for an incorrect or missing answer.'
  };
 }
 const api=Object.freeze({BANDS,proposal,listening});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else host.LSHGradeCore=api;
})(typeof window!=='undefined'?window:this);
