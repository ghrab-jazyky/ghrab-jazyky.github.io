/* R35–R37 independent Listening A1–C2 authoring references. No release, no student credentials. */
(function(root){
 'use strict';
 const KIND='LSH_INDEPENDENT_LISTENING_TEST_DRAFT_R35_V1';
 const STATUS='DRAFT_PENDING_TEACHER_CONTENT_APPROVAL';
 const requireValid=(ok,msg)=>{if(!ok)throw new Error(msg)};
 const isText=(s,n=2000)=>typeof s==='string'&&s.trim().length>=5&&s.length<=n;
 const clean=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
 function validate(bank,sourceVariant,sourceHash){
  requireValid(bank&&typeof bank==='object'&&bank.kind===KIND&&
   bank.status===STATUS&&bank.published===false,
   'Independent Listening bank must remain unapproved');
  const CEFR=['A1','A2','B1','B2','C1','C2'];
  const topics={
   'll-harrison-ford':'hf','ll-matthew-oscars':'mm','ll-peaky-no-fighting':'pk'
  };
  requireValid(Object.prototype.hasOwnProperty.call(topics,bank.topic)&&
   bank.language==='en'&&CEFR.includes(bank.level),'Unsupported Listening reference');
  const isHarrison=bank.topic==='ll-harrison-ford';
  const audit=isHarrison?(bank.level==='B2'?'R35-AUTHOR-DRAFT-1':'R36-AUTHOR-DRAFT-1'):
   'R37-AUTHOR-DRAFT-1';
  const prefix=isHarrison?(bank.level==='B2'?'r35-hf-b2-':'r36-hf-'+bank.level.toLowerCase()+'-'):
   'r37-'+topics[bank.topic]+'-'+bank.level.toLowerCase()+'-';
  requireValid(bank.auditRevision===audit,'Unsupported Listening reference audit revision');
  requireValid(Number.isInteger(bank.durationMinutesSuggested)&&
   bank.durationMinutesSuggested>=5&&bank.durationMinutesSuggested<=120,
   'Invalid suggested timer');
  requireValid(/^[a-f0-9]{64}$/.test(sourceHash)&&bank.sourcePracticeContentHash===sourceHash,
   'Listening original source integrity mismatch');
  requireValid(sourceVariant&&typeof sourceVariant.goal==='string'&&
   Array.isArray(sourceVariant.gist)&&Array.isArray(sourceVariant.detail),
   'Missing original Listening variant');
  const original=new Set([...sourceVariant.gist,...sourceVariant.detail].map(q=>clean(q.title)));
  requireValid(Array.isArray(bank.objective)&&bank.objective.length===6&&
   Array.isArray(bank.written)&&bank.written.length===2,'Unsupported Listening test size');
  const ids=new Set();
  for(const q of bank.objective){
   requireValid(q&&new RegExp('^'+prefix+'[0-9]{2}$').test(q.id)&&!ids.has(q.id)&&
    isText(q.q)&&!original.has(clean(q.q)),'Reused or invalid objective item');
   ids.add(q.id);
   requireValid(Array.isArray(q.options)&&q.options.length===4&&
    q.options.every(x=>isText(x,500))&&
    new Set(q.options.map(clean)).size===4,
    'Invalid Listening choices');
   requireValid(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4&&
    isText(q.explanation,1500)&&isText(q.sourceEvidence,1500),
    'Invalid Listening key or evidence');
  }
  for(const q of bank.written){
   requireValid(q&&new RegExp('^'+prefix+'w[0-9]+$').test(q.id)&&!ids.has(q.id),
    'Reused or invalid written item');
   ids.add(q.id);
   requireValid(isText(q.q)&&isText(q.modelAnswer,3000)&&
    isText(q.teacherCriterion,2000)&&isText(q.sourceEvidence,1500),
    'Missing teacher-assessment criterion');
  }
  requireValid(bank.scoreRule.startsWith('6 objectively scored multiple-choice tasks'),
   'Unknown Listening scoring contract');
  return true;
 }
 function score(bank,answers,marks){
  requireValid(bank&&bank.kind===KIND&&Array.isArray(bank.objective)&&
   bank.objective.length===6&&Array.isArray(bank.written)&&bank.written.length===2,
   'Invalid Listening pilot');
  requireValid(answers&&typeof answers==='object'&&!Array.isArray(answers),'Missing responses');
  let earned=0,answered=0;
  const details=bank.objective.map(q=>{
   const n=answers[q.id];
   requireValid(n===undefined||n===null||(Number.isInteger(n)&&n>=0&&n<4),
    'Invalid objective response');
   const present=Number.isInteger(n);
   const correct=present&&n===q.answer;
   if(present)answered++;
   if(correct)earned++;
   return {id:q.id,prompt:q.q,correct,answered:present,
    picked:present?q.options[n]:null,answer:q.options[q.answer],explanation:q.explanation};
  });
  const written=bank.written.map(q=>{
   const a=answers[q.id]===undefined?'':answers[q.id];
   requireValid(typeof a==='string'&&a.length<=5000,'Invalid written response');
   if(a.trim())answered++;
   return {id:q.id,prompt:q.q,response:a,modelAnswer:q.modelAnswer,teacherCriterion:q.teacherCriterion};
  });
  const m=marks===undefined||marks===null?[null,null]:marks;
  requireValid(Array.isArray(m)&&m.length===2&&m.every(x=>x===0||x===1||x===null),
   'Invalid 0/1 teacher marks');
  const pending=m.filter(x=>x===null).length;
  const objectiveEarned=earned,totalEarned=earned+m.filter(x=>x===1).length;
  return {objectiveEarned,objectiveMax:6,writtenEarned:m.filter(x=>x===1).length,
   writtenMax:2,totalEarned:pending===0?totalEarned:null,totalMax:8,pending,
   answered,unanswered:8-answered,
   details,written,marks:m.slice(),
   officialSchoolResult:false,localOnly:true};
 }
 const api=Object.freeze({KIND,STATUS,validate,score});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHIndependentListeningCore=api;
})(typeof window!=='undefined'?window:this);
