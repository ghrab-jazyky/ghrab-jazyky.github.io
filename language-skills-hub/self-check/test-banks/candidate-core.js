/* R34: exhaustively scoped, UNAPPROVED candidate test banks.
 * These are machine-synthesized source-anchor exercises, NOT independently
 * validated pedagogical assessment tasks. The publication gate stays closed.
 */
(function(root){
 'use strict';
 const COLLECTION='LSH_READING_DRAFT_COLLECTION_R34_V1';
 const CANDIDATE='LSH_READING_TEST_CANDIDATE_R34_V1';
 const STAGE='CLAUDE_CONTENT_REWRITE_PENDING';
 const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const text=x=>typeof x==='string'&&x.trim().length>0;
 const norm=x=>x.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
 function check(ok,msg){if(!ok)throw new Error(msg)}
 function validateReading(collection,candidate,practice,ctx){
  check(obj(ctx)&&/^rl-[a-z0-9-]+$/.test(ctx.topic)&&LANGS.includes(ctx.lang)&&
   LEVELS.includes(ctx.level)&&/^[a-f0-9]{64}$/.test(ctx.sourceHash),
   'Invalid source context');
  check(obj(collection)&&collection.kind===COLLECTION&&
   collection.published===false&&collection.auditStatus===STAGE&&
   collection.topic===ctx.topic&&collection.sourcePracticeContentHash===ctx.sourceHash,
   'Unapproved or mismatched Reading collection');
  check(obj(candidate)&&candidate.kind===CANDIDATE&&candidate.stage===STAGE&&
   candidate.published===false&&candidate.topic===ctx.topic&&
   candidate.language===ctx.lang&&candidate.level===ctx.level&&
   candidate.sourcePracticeContentHash===ctx.sourceHash,'Unapproved or mismatched candidate');
  check(obj(practice)&&text(practice.title)&&practice.title===candidate.title&&
   Array.isArray(practice.paragraphs)&&practice.paragraphs.length>=3&&
   Array.isArray(practice.questions),'Practice data does not match the candidate');
  const expected=['A1','A2'].includes(ctx.level)?6:ctx.level==='B1'?8:10;
  check(Array.isArray(candidate.questions)&&candidate.questions.length===expected&&
   candidate.maxPoints===expected,'Unexpected candidate score or question count');
  check(Array.isArray(candidate.tabs)&&candidate.tabs.length===3&&
   new Set(candidate.tabs.map(t=>t.id)).size===3,'Invalid test sections');
  const tabIds=new Set(candidate.tabs.map(t=>t.id));
  check(['locate','evidence','cohesion'].every(t=>tabIds.has(t)),
   'Missing test section');
  const oldQ=new Set(practice.questions.map(q=>norm(q.q)));
  const ids=new Set(),itemSignatures=new Set();
  for(const q of candidate.questions){
   check(obj(q)&&/^r34-[a-z0-9-]+$/.test(q.id)&&!ids.has(q.id)&&
    q.kind==='mc'&&tabIds.has(q.tab)&&text(q.q)&&!oldQ.has(norm(q.q))&&
    !itemSignatures.has(norm(q.q)+'|'+q.choices.map(norm).join('|')),
    'Missing, reused or duplicated candidate question');
   ids.add(q.id);itemSignatures.add(norm(q.q)+'|'+q.choices.map(norm).join('|'));
   check(Number.isInteger(q.sourceParagraph)&&q.sourceParagraph>=1&&
    q.sourceParagraph<=practice.paragraphs.length,'Bad evidence paragraph');
   const para=practice.paragraphs[q.sourceParagraph-1];
   check(text(q.evidence)&&text(q.explanation)&&para.includes(q.evidence),
    'Evidence must be verbatim in the original paragraph');
   check(Array.isArray(q.choices)&&q.choices.length>=3&&q.choices.length<=7&&
    q.choices.every(text)&&new Set(q.choices.map(norm)).size===q.choices.length,
    'Invalid or duplicated choices');
   check(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length,
    'Invalid answer index');
   if(q.tab==='evidence'){
    check(para.includes(q.choices[q.answer]),'Correct option not in expected paragraph');
    check(q.choices.every((c,i)=>i===q.answer||!para.includes(c)),
     'Ambiguous evidence: another choice is also in the target paragraph');
   }
   if(q.tab==='cohesion'){
    check(q.evidence.includes(q.choices[q.answer]),
     'Correct continuation must appear in the source');
   }
   if(q.tab==='locate'){
    check(q.answer===q.sourceParagraph-1,'Wrong paragraph-location key');
    check(q.choices.length===practice.paragraphs.length,'Paragraph list is incomplete');
   }
  }
  return true;
 }
 function readingVariant(collection,candidate,practice,ctx){
  validateReading(collection,candidate,practice,ctx);
  return {title:practice.title+' — candidate test (not approved)',paragraphs:practice.paragraphs.slice(),
   tabs:candidate.tabs.map(t=>({...t})),
   questions:candidate.questions.map(q=>({...q,choices:q.choices.slice()})),open:''};
 }
 const LCOLLECTION='LSH_LISTENING_DRAFT_COLLECTION_R34_V2';
 const LCANDIDATE='LSH_INDEPENDENT_LISTENING_DRAFT_R34_V2';
 const LSTAGE='CLAUDE_CONTENT_AUDIT_PENDING';
 function validateListening(collection,candidate,practice,ctx){
  check(obj(ctx)&&/^ll-[a-z0-9-]+$/.test(ctx.topic)&&LEVELS.includes(ctx.level)&&
   /^[a-f0-9]{64}$/.test(ctx.sourceHash),'Invalid Listening context');
  check(obj(collection)&&collection.kind===LCOLLECTION&&collection.published===false&&
   collection.authoredDraft===true&&collection.auditStatus===LSTAGE&&
   collection.topic===ctx.topic&&collection.sourcePracticeContentHash===ctx.sourceHash,
   'Unapproved or mismatched Listening collection');
  check(obj(candidate)&&candidate.kind===LCANDIDATE&&candidate.stage===LSTAGE&&
   candidate.published===false&&candidate.topic===ctx.topic&&
   candidate.level===ctx.level&&candidate.language==='en'&&
   candidate.sourcePracticeContentHash===ctx.sourceHash,
   'Unapproved or mismatched Listening candidate');
  check(candidate.teacherControlledPasses===2,'Unsupported playback contract');
  check(obj(practice)&&text(practice.goal)&&candidate.goal===practice.goal,
   'Listening practice source mismatch');
  check(candidate.sourceIndices===undefined&&text(candidate.provenance)&&
   /audit|review/i.test(candidate.provenance),'Original question provenance or audit status missing');
  const sections=['gist','detail','sequence','facts','open'];
  for(const part of sections)check(Array.isArray(candidate[part])&&
   candidate[part].length>0,'Missing Listening section '+part);
  check(candidate.gist.length===2&&candidate.detail.length===3&&
   [3,4].includes(candidate.sequence.length)&&candidate.facts.length===1&&
   candidate.open.length===1,'Unexpected Listening assessment blueprint size');
  for(const part of ['gist','detail']){
   const stems=new Set(practice[part].map(q=>norm(q.title)));
   for(const q of candidate[part]){
    check(obj(q)&&q.type==='single'&&text(q.title)&&q.title.length>=12&&
     !stems.has(norm(q.title)),'Unrewritten practice prompt found in Listening');
    check(Array.isArray(q.options)&&q.options.length>=3&&q.options.length<=5&&
     q.options.every(text)&&new Set(q.options.map(norm)).size===q.options.length&&
     Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length,
     'Invalid Listening objective options or key');
    check(text(q.why)&&q.why.length>=25,'Missing Listening teacher rationale');
   }
  }
  const oldSequence=new Set(practice.sequence.map(norm));
  check(candidate.sequence.every(s=>text(s)&&s.length>=14&&!oldSequence.has(norm(s)))&&
   new Set(candidate.sequence.map(norm)).size===candidate.sequence.length,
   'Unrewritten or duplicated Listening reconstruction');
  for(const part of ['facts','open']){
   const old=new Set(practice[part].map(q=>norm(q.title)));
   for(const q of candidate[part]){
    check(obj(q)&&text(q.title)&&!old.has(norm(q.title))&&text(q.answer)&&
     text(q.criteria),'Invalid or duplicated written question');
   }
  }
  return true;
 }
 const api=Object.freeze({COLLECTION,CANDIDATE,STAGE,LCOLLECTION,LCANDIDATE,LSTAGE,
  validateReading,readingVariant,validateListening});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHCandidateCore=api;
})(typeof window!=='undefined'?window:this);
