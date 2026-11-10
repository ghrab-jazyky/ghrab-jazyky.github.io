/* R31 private-by-default local CSV result receipt.
 * This is a manipulable student-side export, NEVER proof of identity or school record.
 * Exports aggregate points + 0/1 teacher marks, never answers, names, emails,
 * notes, full URLs, per-question texts, or local session identifiers.
 */
(function(root){
 'use strict';
 const grade=typeof module!=='undefined'&&module.exports?
  require('./grade-core.js'):root.LSHGradeCore;
 const KIND='LSH_LOCAL_UNVERIFIED_RECEIPT_R31_V1';
 const FIELDS=Object.freeze([
  'record_kind','verification','skill','topic','language','level',
  'objective_points','objective_max','written_points','written_max',
  'total_points','total_max','success_percent','proposed_grade',
  'written_pending','teacher_marks','submitted_utc','interruption_count'
 ]);
 const id=s=>typeof s==='string'&&/^[a-z0-9_-]{1,90}$/i.test(s);
 const int=n=>Number.isSafeInteger(n)&&n>=0;
 function requireValid(ok,msg){if(!ok)throw new Error(msg);}
 function metadata(skill,meta){
  requireValid(meta&&typeof meta==='object'&&id(meta.topic)&&
   ['en','es','de','fr'].includes(meta.language)&&
   ['A1','A2','B1','B2','C1','C2'].includes(meta.level),'Invalid export metadata');
  requireValid(skill==='reading'||skill==='listening','Invalid export skill');
  const submitted=meta.submittedAt;
  requireValid(submitted===null||submitted===undefined||(int(submitted)&&submitted<=8640000000000000),
   'Invalid submitted time');
  requireValid(int(meta.interruptionCount)&&meta.interruptionCount<=40,
   'Invalid local incident count');
  return {
   record_kind:KIND,verification:'LOCAL_UNVERIFIED_NOT_SCHOOL_RECORD',
   skill,topic:meta.topic,language:meta.language,level:meta.level,
   submitted_utc:submitted===null||submitted===undefined?'':new Date(submitted).toISOString(),
   interruption_count:meta.interruptionCount
  };
 }
 function reading(report,meta){
  const m=metadata('reading',meta);
  requireValid(report&&int(report.points)&&int(report.maxPoints)&&report.maxPoints>0&&
   report.points<=report.maxPoints,'Invalid Reading score');
  const proposed=grade.proposal(report.points,report.maxPoints);
  return Object.freeze({
   ...m,objective_points:report.points,objective_max:report.maxPoints,
   written_points:0,written_max:0,total_points:proposed.earned,
   total_max:proposed.max,success_percent:proposed.displayedPercent,
   proposed_grade:proposed.grade,written_pending:0,teacher_marks:''
  });
 }
 function listening(normalized,marks,meta){
  const m=metadata('listening',meta);
  const reviewed=grade.listening(normalized,marks);
  // Do not export partially awarded written points as a final total.
  return Object.freeze({
   ...m,objective_points:reviewed.objectiveEarned,objective_max:reviewed.objectiveMax,
   written_points:reviewed.pending?'':reviewed.writtenEarned,
   written_max:reviewed.writtenMax,
   total_points:reviewed.pending?'':reviewed.earned,
   total_max:reviewed.max,
   success_percent:reviewed.suggested?reviewed.suggested.displayedPercent:'',
   proposed_grade:reviewed.suggested?reviewed.suggested.grade:'',
   written_pending:reviewed.pending,
   teacher_marks:marks.map(n=>n===null?'?':String(n)).join('|')
  });
 }
 function csvCell(value){
  let text=value===null||value===undefined?'':String(value);
  // Excel/Calc formula and tab/CR injection defense.
  if(/^[=+\-@\t\r\n]/.test(text))text="'"+text;
  return '"'+text.replace(/"/g,'""')+'"';
 }
 function csv(receipt){
  requireValid(receipt&&receipt.record_kind===KIND&&
   receipt.verification==='LOCAL_UNVERIFIED_NOT_SCHOOL_RECORD',
   'Not an approved local receipt');
  requireValid(FIELDS.every(k=>Object.prototype.hasOwnProperty.call(receipt,k)),
   'Incomplete local receipt');
  return '\uFEFF'+FIELDS.map(csvCell).join(',')+'\r\n'+FIELDS.map(k=>csvCell(receipt[k])).join(',')+'\r\n';
 }
 function download(receipt,doc){
  const documentRef=doc||root.document;
  requireValid(documentRef&&documentRef.body&&typeof Blob!=='undefined'&&
   typeof URL!=='undefined'&&typeof URL.createObjectURL==='function',
   'Local browser download is unavailable');
  const blob=new Blob([csv(receipt)],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=documentRef.createElement('a');
  a.href=url;
  a.download='lsh-'+receipt.skill+'-'+receipt.topic+'-'+receipt.level.toLowerCase()+'-unverified.csv';
  a.hidden=true;
  documentRef.body.appendChild(a);
  try{a.click()}finally{
   a.remove();
   // Allow download to start before revoking the local blob URL.
   setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
 }
 const api=Object.freeze({KIND,FIELDS,reading,listening,csv,download});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHExportCore=api;
})(typeof window!=='undefined'?window:this);
