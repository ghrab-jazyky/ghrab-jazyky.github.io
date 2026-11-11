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

 /* R33: finished, completely automatic Listening result. No teacher marking. */
 function listeningAuto(normalized,meta){
  const m=metadata('listening',meta);
  requireValid(normalized&&normalized.skill==='listening'&&
   normalized.status==='AUTO_CLOSED_COMPLETED'&&
   normalized.written.total===0&&normalized.written.forTeacherReview===0,
   'Listening automatic result is not final.');
  const proposed=grade.proposal(normalized.points.earned,normalized.points.max);
  return Object.freeze({
   ...m,objective_points:proposed.earned,objective_max:proposed.max,
   written_points:0,written_max:0,total_points:proposed.earned,
   total_max:proposed.max,success_percent:proposed.displayedPercent,
   proposed_grade:proposed.grade,written_pending:0,teacher_marks:''
  });
 }
 /* Question-level report deliberately exports only the score and internal
  * question key, NEVER the text of a student's answers or reflection. */
 function questionRows(report,skill){
  const source=skill==='reading'?report&&report.details:
   skill==='listening'?report&&report.review:null;
  requireValid(Array.isArray(source)&&source.length>0&&source.length<=150,
   'Invalid question report.');
  return Object.freeze(source.map((item,i)=>{
   requireValid(item&&typeof item.correct==='boolean','Invalid question score.');
   const key=skill==='reading'?item.id:
    String(item.phase||'objective')+'-'+String(item.number||i+1);
   requireValid(id(key),'Invalid question identifier.');
   const kind=skill==='reading'?item.kind:item.phase;
   requireValid(id(kind),'Invalid question type.');
   return Object.freeze({
    question_number:i+1,question_id:key,question_type:kind,
    awarded_points:item.correct?1:0,maximum_points:1
   });
  }));
 }
 const REPORT_FIELDS=Object.freeze([
  ...FIELDS,'exported_utc',
  'question_number','question_id','question_type','awarded_points','maximum_points'
 ]);
 function detailedCsv(receipt,rows,exportedAt){
  csv(receipt); // Validate the original R31 receipt contract.
  requireValid(Array.isArray(rows)&&rows.length>0&&rows.length<=150,
   'No question outcomes to export.');
  requireValid(int(exportedAt)&&exportedAt<=8640000000000000,
   'Invalid export timestamp');
  const stamp=new Date(exportedAt).toISOString();
  return '\uFEFF'+REPORT_FIELDS.map(csvCell).join(',')+'\r\n'+rows.map(row=>{
   requireValid(row&&id(row.question_id)&&id(row.question_type)&&
    int(row.question_number)&&row.question_number>0&&
    [0,1].includes(row.awarded_points)&&row.maximum_points===1,
    'Invalid detailed question outcome');
   const data={...receipt,exported_utc:stamp,...row};
   return REPORT_FIELDS.map(k=>csvCell(data[k])).join(',');
  }).join('\r\n')+'\r\n';
 }
 function reportText(receipt,rows,exportedAt){
  // Validate before displaying/copying and avoid copying private free text.
  detailedCsv(receipt,rows,exportedAt);
  const detail=rows.map(row=>row.question_number+'. '+row.question_id+
   ' ('+row.question_type+'): '+row.awarded_points+'/'+row.maximum_points).join('\n');
  return [
   'LANGUAGE SKILLS HUB - VYSLEDEK TESTU',
   'NEOVERENY MISTNI ZAZNAM - pouze navrh znamky',
   'Laborator: '+receipt.skill,
   'Tema: '+receipt.topic,
   'Jazyk a uroven: '+receipt.language.toUpperCase()+' / '+receipt.level,
   'Body: '+receipt.total_points+'/'+receipt.total_max,
   'Uspesnost: '+receipt.success_percent+' %',
   'Navrh znamky: '+receipt.proposed_grade,
   'Odevzdano (UTC): '+(receipt.submitted_utc||'neuvedeno'),
   'Exportovano (UTC): '+new Date(exportedAt).toISOString(),
   'Vysledky jednotlivych uloh:',
   detail,
   'Upozorneni: Udaje nejsou technicky overenym skolnim zaznamem.'
  ].join('\n');
 }
 async function copyReport(receipt,rows,doc,clipboard,exportedAt=Date.now()){
  const documentRef=doc||root.document;
  const value=reportText(receipt,rows,exportedAt);
  const board=clipboard||(root.navigator&&root.navigator.clipboard);
  if(board&&typeof board.writeText==='function'){
   try{await board.writeText(value);return value;}catch(_){}
  }
  requireValid(documentRef&&documentRef.body&&
   typeof documentRef.execCommand==='function','Clipboard not available.');
  const area=documentRef.createElement('textarea');
  area.value=value;area.readOnly=true;area.style.position='fixed';
  area.style.left='-10000px';area.setAttribute('aria-hidden','true');
  documentRef.body.appendChild(area);
  try{
   area.focus();area.select();
   requireValid(documentRef.execCommand('copy')===true,
    'Clipboard copy was not confirmed.');
  }finally{area.remove();}
  return value;
 }
 function downloadDetailed(receipt,rows,doc,exportedAt=Date.now()){
  const documentRef=doc||root.document;
  requireValid(documentRef&&documentRef.body&&typeof Blob!=='undefined'&&
   typeof URL!=='undefined'&&typeof URL.createObjectURL==='function',
   'Local browser download unavailable.');
  const content=detailedCsv(receipt,rows,exportedAt);
  const blob=new Blob([content],{type:'text/csv;charset=utf-8'});
  const objectUrl=URL.createObjectURL(blob);
  const unique=Math.floor(Math.random()*65536).toString(16).padStart(4,'0');
  const stamp=new Date(exportedAt).toISOString().replace(/[:.]/g,'-');
  const filename='lsh-'+receipt.skill+'-'+receipt.topic+'-'+
   receipt.language+'-'+receipt.level.toLowerCase()+
   '-'+stamp+'-'+unique+'.csv';
  const a=documentRef.createElement('a');
  a.href=objectUrl;a.download=filename;a.hidden=true;
  documentRef.body.appendChild(a);
  try{a.click();}finally{
   a.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),2000);
  }
  return filename;
 }
 const api=Object.freeze({KIND,FIELDS,REPORT_FIELDS,reading,listening,listeningAuto,
  csv,download,questionRows,detailedCsv,reportText,copyReport,downloadDetailed});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHExportCore=api;
})(typeof window!=='undefined'?window:this);
