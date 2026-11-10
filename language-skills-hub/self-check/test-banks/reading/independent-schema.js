/* Independent Reading test-bank schema for all catalog variants.
 * Explicit per-topic, language and level validation. Content approval stays
 * separate; this does not make any bank trusted or authorize publication.
 */
(function(root){
 'use strict';
 const isObj=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
 const nonempty=(s,min=1)=>typeof s==='string'&&s.trim().length>=min;
 const norm=s=>s.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
 const levels=['A1','A2','B1','B2','C1','C2'];
 const langs=['en','es','de','fr'];
 function need(valid,message){if(!valid)throw new Error(message)}
 function validate(bank,selection,practice,sourceHash){
  need(isObj(selection)&&/^rl-[a-z0-9-]+$/.test(selection.topic)&&
   langs.includes(selection.lang)&&levels.includes(selection.level),'Invalid selection');
  need(isObj(bank)&&bank.kind==='LSH_INDEPENDENT_READING_TEST_DRAFT_R32_V1',
   'Invalid independent test bank schema');
  need(bank.topic===selection.topic&&bank.language===selection.lang&&
   bank.level===selection.level,'Test bank selection mismatch');
  need(bank.published===false&&bank.status==='DRAFT_PENDING_TEACHER_CONTENT_APPROVAL',
   'Only unpublished teacher-review drafts are permitted here');
  need(/^[a-f0-9]{64}$/.test(sourceHash)&&sourceHash===bank.sourcePracticeContentHash,
   'Original practice source checksum mismatch');
  need(isObj(practice)&&nonempty(practice.title)&&
   Array.isArray(practice.paragraphs)&&practice.paragraphs.length>=1&&
   Array.isArray(practice.questions)&&practice.questions.length>0,
   'Missing validated original practice content');
  need(Array.isArray(bank.tabs)&&bank.tabs.length>=2&&bank.tabs.length<=6,
   'Invalid independent test section list');
  const tabs=new Set();
  for(const t of bank.tabs){
   need(isObj(t)&&/^[a-z][a-z0-9-]{1,32}$/.test(t.id)&&nonempty(t.title),
    'Invalid assessment section');
   need(!tabs.has(t.id),'Duplicate section');
   tabs.add(t.id);
  }
  need(Array.isArray(bank.questions)&&bank.questions.length>=5&&bank.questions.length<=40,
   'Independent test question count must be 5-40');
  const practiceStems=new Set(practice.questions.map(q=>norm(q.q)));
  const practiceIds=new Set(practice.questions.map(q=>q.id));
  const stems=new Set(),ids=new Set(),distribution=[0,0,0,0];
  for(const q of bank.questions){
   need(isObj(q)&&/^[a-z0-9-]{8,90}$/.test(q.id)&&tabs.has(q.tab)&&q.kind==='mc',
    'Malformed assessment item');
   need(!ids.has(q.id)&&!practiceIds.has(q.id),'Duplicate or reused assessment ID');
   ids.add(q.id);
   need(nonempty(q.q,12)&&!practiceStems.has(norm(q.q))&&!stems.has(norm(q.q)),
    'Practice stem copied into independent test or repeated');
   stems.add(norm(q.q));
   need(Number.isSafeInteger(q.sourceParagraph)&&q.sourceParagraph>=1&&
    q.sourceParagraph<=practice.paragraphs.length,'Evidence paragraph out of range');
   need(Array.isArray(q.choices)&&q.choices.length===4&&
    q.choices.every(c=>nonempty(c,3))&&new Set(q.choices.map(norm)).size===4,
    'Invalid answer options');
   need(Number.isSafeInteger(q.answer)&&q.answer>=0&&q.answer<=3,
    'Missing correct option');
   distribution[q.answer]++;
   need(nonempty(q.explanation,25),'Missing teacher explanation');
  }
  need(nonempty(bank.auditRevision)&&/^R[0-9]+-/.test(bank.auditRevision),
   'Missing content review version');
  need(nonempty(bank.scoreRule),'Missing assessment scoring contract');
  need(Number.isInteger(bank.durationMinutesSuggested)&&
   bank.durationMinutesSuggested>=5&&bank.durationMinutesSuggested<=120,
   'Invalid suggested timer');
  return Object.freeze({topic:bank.topic,lang:bank.language,level:bank.level,
   questions:bank.questions.length,answerDistribution:distribution,
   draft:true,approved:false});
 }
 function qaVariant(bank,selection,practice,sourceHash){
  validate(bank,selection,practice,sourceHash);
  return {
   title:practice.title+' — independent '+selection.level+' draft',
   paragraphs:practice.paragraphs.slice(),
   tabs:bank.tabs.map(t=>({...t})),
   questions:bank.questions.map(q=>({...q,choices:q.choices.slice()})),
   open:''
  };
 }
 const api=Object.freeze({validate,qaVariant});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHIndependentReadingSchema=api;
})(typeof window!=='undefined'?window:this);
