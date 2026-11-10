/* R32-R35 independent Reading test-bank draft validator. NEVER auto-publish.
 * Passages may be shared with practice but student test prompts must differ.
 * No external API, keys or private student data.
 */
(function(root){
 'use strict';
 const KIND='LSH_INDEPENDENT_READING_TEST_DRAFT_R32_V1';
 const STATUS='DRAFT_PENDING_TEACHER_CONTENT_APPROVAL';
 const text=s=>typeof s==='string'&&s.trim().length>0;
 const norm=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
 function check(ok,msg){if(!ok)throw new Error(msg)}
 function validate(bank,practice,expectedSourceHash,selection){
  check(bank&&typeof bank==='object'&&!Array.isArray(bank)&&bank.kind===KIND,
   'Invalid pilot test-bank format');
  check(bank.status===STATUS&&bank.published===false,
   'R32 content cannot be published without teacher approval');
  const permittedLevels={
   A1:{prefix:'r34',audit:'R34-AUTHOR-DRAFT-1',title:'I Can Try Again',paragraphs:3,minutes:15},
   A2:{prefix:'r34',audit:'R34-AUTHOR-DRAFT-1',title:'A Small Change, a Better Result',paragraphs:3,minutes:15},
   B1:{prefix:'r33',audit:'R33-CONTENT-AUDIT-1',title:'The Problem with Being Good at Everything',paragraphs:4,minutes:20},
   B2:{prefix:'r32',audit:'R32-CONTENT-AUDIT-1',title:'When Feedback Feels Like Failure',paragraphs:4,minutes:20},
   C1:{prefix:'r34',audit:'R34-AUTHOR-DRAFT-1',title:'The Hidden Cost of Constant Improvement',paragraphs:4,minutes:25},
   C2:{prefix:'r34',audit:'R34-AUTHOR-DRAFT-1',title:'When Resilience Becomes an Obligation',paragraphs:4,minutes:25}
  };
  const legacy=bank.topic==='rl-can-mistakes'&&bank.language==='en';
  const rules=legacy?permittedLevels[bank.level]:(
   typeof bank.sourceTitle==='string'&&bank.sourceTitle.trim().length>=5&&
   Number.isInteger(bank.durationMinutesSuggested)&&
   bank.durationMinutesSuggested>=5&&bank.durationMinutesSuggested<=120&&
   /^R[0-9]{2}-AUTHOR-DRAFT-[0-9]+$/.test(bank.auditRevision||'')?
   {prefix:'r'+bank.auditRevision.slice(1,3),audit:bank.auditRevision,
    title:bank.sourceTitle,paragraphs:null,minutes:bank.durationMinutesSuggested}:null
  );
  check(!!rules,'This draft validator supports only valid authored Reading test banks');
  const wanted=selection||{topic:bank.topic,language:bank.language,level:bank.level};
  check(wanted&&bank.topic===wanted.topic&&bank.language===wanted.language&&
   bank.level===wanted.level,'Bank metadata does not match selected Reading variant');
  check(/^rl-[a-z0-9-]+$/.test(bank.topic)&&
   ['en','es','de','fr'].includes(bank.language)&&
   ['A1','A2','B1','B2','C1','C2'].includes(bank.level),
   'Invalid Reading variant identity');
  check(/^[a-f0-9]{64}$/.test(expectedSourceHash)&&
   bank.sourcePracticeContentHash===expectedSourceHash,'The practice source has changed');
  check(practice&&practice.title===rules.title&&Array.isArray(practice.paragraphs)&&
   (rules.paragraphs===null||practice.paragraphs.length===rules.paragraphs)&&
   Array.isArray(practice.questions),
   'Practice source does not match this bank level and passage');
  check(Array.isArray(bank.tabs)&&bank.tabs.length===3&&
   bank.tabs.every(t=>text(t.id)&&text(t.title)&&/^[a-z][a-z0-9-]+$/.test(t.id)),
   'Invalid pilot test sections');
  const ids=new Set(bank.tabs.map(t=>t.id));
  check(ids.size===bank.tabs.length,'Duplicate test section');
  check(Array.isArray(bank.questions)&&bank.questions.length===10,
   'Independent EN A1-C2 pilot must have 10 manually reviewed tasks');
  const stems=new Set(practice.questions.map(q=>norm(q.q)));
  const practiceIds=new Set(practice.questions.map(q=>q.id));
  const seen=new Set();
  const answerPositions=[0,0,0,0];
  for(const q of bank.questions){
   check(q&&text(q.id)&&new RegExp('^'+rules.prefix+'-'+bank.language+'-'+bank.level.toLowerCase()+'-[a-z0-9-]+$').test(q.id)&&
    !seen.has(q.id)&&!practiceIds.has(q.id),'Duplicate or reused question ID');
   seen.add(q.id);
   check(Number.isInteger(q.sourceParagraph)&&q.sourceParagraph>=1&&
    q.sourceParagraph<=practice.paragraphs.length,'Missing or invalid evidence paragraph');
   check(ids.has(q.tab)&&q.kind==='mc'&&text(q.q)&&q.q.length>=24&&
    !stems.has(norm(q.q)),'Test question must be distinct from practice');
   stems.add(norm(q.q));
   check(Array.isArray(q.choices)&&q.choices.length===4&&
    q.choices.every(c=>text(c)&&c.length>=10)&&
    new Set(q.choices.map(norm)).size===4,'Invalid or duplicated options');
   check(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,'Invalid correct-answer index');
   answerPositions[q.answer]++;
   check(text(q.explanation)&&q.explanation.length>=30,'Missing evidence-based explanation');
  }
  check(answerPositions.every(n=>n>=2&&n<=3),
   'Correct answer locations are unbalanced across four positions');
  check(bank.durationMinutesSuggested===rules.minutes,
   'Unexpected CEFR-specific test duration');
  check(bank.auditRevision===rules.audit,
   'Independent pedagogy audit not completed');
  check(bank.scoreRule==='1 point per correct MC item; 10 points maximum; local provisional grade only',
   'Unknown scoring method');
  return true;
 }
 function makeQaVariant(bank,practice,expectedSourceHash,selection){
  validate(bank,practice,expectedSourceHash,selection);
  return {
   title:practice.title+' — independent '+bank.level+' test draft',
   paragraphs:practice.paragraphs.slice(),
   tabs:bank.tabs.map(t=>({...t})),
   questions:bank.questions.map(q=>({...q,choices:q.choices.slice()})),
   // Avoid practice gap masking: this pilot has no gap question.
   open:''
  };
 }
 const api=Object.freeze({KIND,STATUS,validate,makeQaVariant});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHIndependentTestBank=api;
})(typeof window!=='undefined'?window:this);
