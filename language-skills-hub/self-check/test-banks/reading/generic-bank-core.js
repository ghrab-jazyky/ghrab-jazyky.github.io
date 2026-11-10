/* R35 independent Reading content contract for all approved PRACTICE sources.
 * Every TEST bank remains DRAFT until separately reviewed. Does not publish.
 */
(function(root){
 'use strict';
 const KIND='LSH_INDEPENDENT_READING_BANK_R35_V1';
 const STATUS='DRAFT_PENDING_TEACHER_CONTENT_APPROVAL';
 const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
 const ID=/^rl-[a-z0-9-]{3,76}$/,TEXT=s=>typeof s==='string'&&s.trim().length>0;
 const normalized=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
 function requireValid(ok,reason){if(!ok)throw new Error(reason)}
 function validate(bank,practice,entry,sourceHash){
  requireValid(bank&&typeof bank==='object'&&!Array.isArray(bank)&&bank.kind===KIND,
   'Invalid independent Reading bank');
  requireValid(bank.published===false&&bank.status===STATUS,
   'Unapproved test must not be presented as published');
  requireValid(entry&&entry.skill==='cteni'&&ID.test(entry.id)&&
   Array.isArray(entry.languages)&&Array.isArray(entry.levels),'Invalid approved practice entry');
  requireValid(bank.topic===entry.id&&LANGS.includes(bank.language)&&
   entry.languages.includes(bank.language)&&LEVELS.includes(bank.level)&&
   entry.levels.includes(bank.level),'Test metadata does not match the practice catalog');
  requireValid(/^[a-f0-9]{64}$/.test(sourceHash)&&bank.sourcePracticeContentHash===sourceHash,
   'Practice source hash mismatch');
  requireValid(practice&&typeof practice==='object'&&
   TEXT(practice.title)&&bank.sourceVariantTitle===practice.title&&
   Array.isArray(practice.paragraphs)&&practice.paragraphs.length>0&&
   Array.isArray(practice.questions),'Bank target reading passage does not match practice');
  requireValid(Number.isInteger(bank.durationMinutesSuggested)&&
   bank.durationMinutesSuggested>=5&&bank.durationMinutesSuggested<=120,
   'Invalid test time limit');
  requireValid(/^R[0-9]+-CONTENT-DRAFT-[0-9]+$/.test(bank.auditRevision||''),
   'Missing explicit content version');
  requireValid(Array.isArray(bank.tabs)&&bank.tabs.length>=2&&bank.tabs.length<=8,
   'Invalid independent assessment sections');
  const tabs=new Set();
  for(const tab of bank.tabs){
   requireValid(tab&&/^[a-z][a-z0-9-]{1,50}$/.test(tab.id)&&
    TEXT(tab.title)&&!tabs.has(tab.id),'Duplicate or invalid assessment section');
   tabs.add(tab.id);
  }
  requireValid(Array.isArray(bank.questions)&&bank.questions.length>=6&&
   bank.questions.length<=30,'Independent test must have 6–30 original tasks');
  const origIds=new Set(practice.questions.map(q=>q.id));
  const practiceStems=new Set(practice.questions.map(q=>normalized(q.q)));
  const ids=new Set(),stems=new Set(),positions=[0,0,0,0];
  for(const item of bank.questions){
   requireValid(item&&typeof item==='object'&&item.kind==='mc'&&
    /^r[0-9]+-[a-z0-9-]{6,100}$/.test(item.id)&&
    !origIds.has(item.id)&&!ids.has(item.id),'Duplicate or reused assessment ID');
   ids.add(item.id);
   requireValid(tabs.has(item.tab)&&TEXT(item.q)&&item.q.length>=15&&
    !practiceStems.has(normalized(item.q))&&!stems.has(normalized(item.q)),
    'Independent assessment question must differ from the practice');
   stems.add(normalized(item.q));
   requireValid(Number.isInteger(item.sourceParagraph)&&item.sourceParagraph>=1&&
    item.sourceParagraph<=practice.paragraphs.length,
    'Question lacks a valid passage reference');
   requireValid(Array.isArray(item.choices)&&item.choices.length===4&&
    item.choices.every(s=>TEXT(s)&&s.length>=8)&&
    new Set(item.choices.map(normalized)).size===4,
    'Question lacks four unique meaningful answer choices');
   requireValid(Number.isInteger(item.answer)&&item.answer>=0&&item.answer<4,
    'Invalid answer key');
   positions[item.answer]++;
   requireValid(TEXT(item.explanation)&&item.explanation.length>=35,
    'Missing explanation of why the answer follows from the text');
  }
  const lower=Math.floor(bank.questions.length/4),upper=Math.ceil(bank.questions.length/4);
  requireValid(positions.every(v=>v>=lower&&v<=upper),
   'Assessment answer positions are seriously unbalanced');
  return true;
 }
 function variant(bank,practice,entry,sourceHash){
  validate(bank,practice,entry,sourceHash);
  return {
   title:practice.title+' — independent '+bank.level+' assessment (DRAFT)',
   paragraphs:practice.paragraphs.slice(),
   tabs:bank.tabs.map(x=>({...x})),
   questions:bank.questions.map(x=>({...x,choices:x.choices.slice()})),
   open:''
  };
 }
 const api=Object.freeze({KIND,STATUS,LANGS,LEVELS,validate,variant});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHGenericReadingBank=api;
})(typeof window!=='undefined'?window:this);
