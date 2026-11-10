/* R37 independent Listening draft schema. Static client cannot conceal keys. */
(function(root){
 'use strict';
 const core=typeof module!=='undefined'&&module.exports?
  require('../../listening/listening-core.js'):root.LSHListeningCore;
 const nonempty=s=>typeof s==='string'&&s.trim().length>0;
 const norm=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
 function must(ok,msg){if(!ok)throw new Error(msg)}
 function validate(bank,selection,practice,sourceHash){
  must(bank&&bank.kind==='LSH_INDEPENDENT_LISTENING_DRAFT_R37_V1','Invalid independent Listening bank');
  must(bank.published===false&&bank.status==='DRAFT_PENDING_TEACHER_CONTENT_APPROVAL',
   'Independent Listening content published without teacher approval');
  must(selection&&['ll-harrison-ford','ll-matthew-oscars','ll-peaky-no-fighting'].includes(selection.topic)&&selection.lang==='en'&&selection.level==='B2',
   'Unsupported independent Listening pilot variant');
  must(bank.topic===selection.topic&&bank.language===selection.lang&&bank.level===selection.level,
   'Independent Listening selection mismatch');
  must(/^[a-f0-9]{64}$/.test(sourceHash)&&bank.sourcePracticeContentHash===sourceHash,
   'Original Listening source checksum mismatch');
  must(bank.durationMinutesSuggested===20&&bank.listeningPasses===2,
   'Listening reference uses 20 minutes and two teacher-controlled playbacks');
  must(['R37-AUTHOR-DRAFT-1','R38-AUTHOR-DRAFT-1'].includes(bank.auditRevision)&&nonempty(bank.scoreRule),
   'Invalid author review tag or scoring contract');
  core.validate(practice);core.validate(bank.variant);
  const v=bank.variant,objective=v.gist.length+v.detail.length+v.sequence.length,
   written=v.facts.length+v.open.length;
  must(objective===8&&written===2,'Independent B2 reference must contain 8 objective and 2 written items');
  const practiceStems=new Set([...practice.gist,...practice.detail,...practice.facts,...practice.open].map(q=>norm(q.title)));
  const stems=new Set(),positions=[0,0,0,0];
  for(const q of [...v.gist,...v.detail,...v.facts,...v.open]){
   must(nonempty(q.title)&&!practiceStems.has(norm(q.title))&&!stems.has(norm(q.title)),
    'Independent Listening question copied from practice or duplicated');
   stems.add(norm(q.title));
   if(q.type==='single'){
    must(q.options.length===4,'Independent multiple choice must have four options');
    positions[q.correct]++;
    must(nonempty(q.why)&&q.why.length>=30,'Missing explanation of objective item');
   }
  }
  must(positions.every(n=>n>=1)&&positions.reduce((a,b)=>a+b,0)===5,
   'Listening key must use all four answer positions');
  must(v.sequence.every(s=>!practice.sequence.includes(s)),
   'Reconstruction sentence copied from practice');
  return Object.freeze({draft:true,approved:false,objective,written,total:objective+written});
 }
 const api=Object.freeze({validate});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHIndependentListeningSchema=api;
})(typeof window!=='undefined'?window:this);
