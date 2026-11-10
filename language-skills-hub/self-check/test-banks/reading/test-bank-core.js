/* R32–R34 independent Reading draft validator: six EN CEFR levels, NO auto-publish.
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
 function validate(bank,practice,expectedSourceHash){
  check(bank&&typeof bank==='object'&&!Array.isArray(bank)&&bank.kind===KIND,
   'Invalid pilot test-bank format');
  check(bank.status===STATUS&&bank.published===false,
   'R32 content cannot be published without teacher approval');
  const permittedLevels={
   A1:{prefix:'r34',audit:'R34-CONTENT-AUDIT-1',title:'I Can Try Again'},
   A2:{prefix:'r34',audit:'R34-CONTENT-AUDIT-1',title:'A Small Change, a Better Result'},
   B1:{prefix:'r33',audit:'R33-CONTENT-AUDIT-1',title:'The Problem with Being Good at Everything'},
   B2:{prefix:'r32',audit:'R32-CONTENT-AUDIT-1',title:'When Feedback Feels Like Failure'},
   C1:{prefix:'r34',audit:'R34-CONTENT-AUDIT-1',title:'The Hidden Cost of Constant Improvement'},
   C2:{prefix:'r34',audit:'R34-CONTENT-AUDIT-1',title:'When Resilience Becomes an Obligation'}
  };
  const rules=permittedLevels[bank.level];
  check(bank.topic==='rl-can-mistakes'&&bank.language==='en'&&!!rules,
   'This draft validator supports only Can Mistakes EN/A1-C2');
  check(/^[a-f0-9]{64}$/.test(expectedSourceHash)&&
   bank.sourcePracticeContentHash===expectedSourceHash,'The practice source has changed');
  check(practice&&practice.title===rules.title&&Array.isArray(practice.paragraphs)&&
   practice.paragraphs.length>=3&&Array.isArray(practice.questions),
   'Practice source does not match this bank level and passage');
  check(Array.isArray(bank.tabs)&&bank.tabs.length===3&&
   bank.tabs.every(t=>text(t.id)&&text(t.title)&&/^[a-z][a-z0-9-]+$/.test(t.id)),
   'Invalid pilot test sections');
  const ids=new Set(bank.tabs.map(t=>t.id));
  check(ids.size===bank.tabs.length,'Duplicate test section');
  check(Array.isArray(bank.questions)&&bank.questions.length===10,
   'Independent EN/A1-C2 test draft must have exactly 10 tasks');
  const stems=new Set(practice.questions.map(q=>norm(q.q)));
  const practiceIds=new Set(practice.questions.map(q=>q.id));
  const seen=new Set();
  const answerPositions=[0,0,0,0];
  for(const q of bank.questions){
   check(q&&text(q.id)&&new RegExp('^'+rules.prefix+'-en-'+bank.level.toLowerCase()+'-[a-z0-9-]+$').test(q.id)&&
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
  check(bank.auditRevision===rules.audit,
   'Independent pedagogy audit not completed');
  check(bank.scoreRule.startsWith('1 point per correct MC item'),'Unknown scoring method');
  return true;
 }
 function makeQaVariant(bank,practice,expectedSourceHash){
  validate(bank,practice,expectedSourceHash);
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
