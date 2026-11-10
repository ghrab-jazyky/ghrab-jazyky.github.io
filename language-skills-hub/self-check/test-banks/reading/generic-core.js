/* R34 generalized independent Reading assessment contract (NOT an approval engine).
 * Static browser and Node-compatible. No bank => test unavailable.
 */
(function(root){
 'use strict';
 const KIND='LSH_INDEPENDENT_READING_TEST_DRAFT_R32_V1';
 const STATUS='DRAFT_PENDING_TEACHER_CONTENT_APPROVAL';
 const LANGUAGES=Object.freeze(['en','es','de','fr']);
 const LEVELS=Object.freeze(['A1','A2','B1','B2','C1','C2']);
 const rxTopic=/^rl-[a-z0-9-]{3,76}$/;
 const rxText=s=>typeof s==='string'&&s.trim().length>0;
 const norm=s=>s.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}]/gu,' ').replace(/\s+/g,' ').trim();
 function check(ok,message){if(!ok)throw new Error(message)}
 function validate(bank,practice,context){
  check(context&&rxTopic.test(context.topic)&&LANGUAGES.includes(context.lang)&&
   LEVELS.includes(context.level)&&/^[a-f0-9]{64}$/.test(context.sourceHash||''),
   'Invalid source-bound assessment context');
  check(bank&&typeof bank==='object'&&!Array.isArray(bank)&&bank.kind===KIND,
   'Invalid independent Reading bank schema');
  check(bank.status===STATUS&&bank.published===false,
   'Unapproved assessment banks must remain unpublished');
  check(bank.topic===context.topic&&bank.language===context.lang&&
   bank.level===context.level,'Independent test bank does not match requested topic/language/level');
  check(bank.sourcePracticeContentHash===context.sourceHash,
   'Independent test bank source checksum mismatch');
  check(practice&&typeof practice.title==='string'&&Array.isArray(practice.paragraphs)&&
   practice.paragraphs.length>=2&&Array.isArray(practice.questions),
   'Source practice content is unavailable');
  check(Number.isInteger(bank.durationMinutesSuggested)&&
   bank.durationMinutesSuggested>=5&&bank.durationMinutesSuggested<=120,
   'Independent test bank requires an explicit validated timer');
  check(typeof bank.auditRevision==='string'&&/^[A-Z0-9-]{10,80}$/.test(bank.auditRevision),
   'Independent test bank audit revision is missing');
  check(Array.isArray(bank.tabs)&&bank.tabs.length>=2&&bank.tabs.length<=8,
   'Independent test sections invalid');
  const ids=new Set();
  for(const tab of bank.tabs){
   check(tab&&/^[a-z][a-z0-9-]{2,48}$/.test(tab.id)&&rxText(tab.title)&&
    !ids.has(tab.id),'Duplicate/invalid section');
   ids.add(tab.id);
  }
  check(Array.isArray(bank.questions)&&bank.questions.length>=5&&bank.questions.length<=35,
   'Independent question count outside supported scope');
  const oldIds=new Set(practice.questions.map(q=>q.id));
  const oldStems=new Set(practice.questions.map(q=>norm(q.q)));
  const seenIds=new Set(),seenStems=new Set();
  const correctPositions=new Map();
  for(const q of bank.questions){
   check(q&&typeof q.id==='string'&&/^[a-z][a-z0-9-]{8,100}$/.test(q.id)&&
    !oldIds.has(q.id)&&!seenIds.has(q.id),'Missing or duplicated question identifier');
   seenIds.add(q.id);
   const stem=rxText(q.q)?norm(q.q):'';
   check(stem.length>=16&&!oldStems.has(stem)&&!seenStems.has(stem),
    'Question repeats practice content or another independent question');
   seenStems.add(stem);
   check(ids.has(q.tab)&&q.kind==='mc','Unknown section or answer type');
   check(Number.isInteger(q.sourceParagraph)&&q.sourceParagraph>=1&&
    q.sourceParagraph<=practice.paragraphs.length,'Source paragraph reference invalid');
   check(Array.isArray(q.choices)&&q.choices.length>=3&&q.choices.length<=5&&
    q.choices.every(c=>rxText(c)&&c.trim().length>=3)&&
    new Set(q.choices.map(norm)).size===q.choices.length,'Missing or duplicate answer options');
   check(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length,
    'Correct answer index invalid');
   check(rxText(q.explanation)&&q.explanation.trim().length>=28,
    'Evidence rationale missing');
   correctPositions.set(q.answer,(correctPositions.get(q.answer)||0)+1);
  }
  // For ten-question four-choice banks, discourage obvious letter-pattern leakage.
  if(bank.questions.length===10&&bank.questions.every(q=>q.choices.length===4))
   check([0,1,2,3].every(i=>(correctPositions.get(i)||0)>=1),
    'Correct answer key omits one of four positions');
  return true;
 }
 function compile(bank,practice,context){
  validate(bank,practice,context);
  return {title:practice.title+' — independent draft '+context.level,
   paragraphs:practice.paragraphs.slice(),
   tabs:bank.tabs.map(t=>({id:t.id,title:t.title,description:t.description||''})),
   questions:bank.questions.map(q=>({...q,choices:q.choices.slice()})),
   open:''};
 }
 const api=Object.freeze({KIND,STATUS,validate,compile});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHReadingBankContract=api;
})(typeof window!=='undefined'?window:this);
