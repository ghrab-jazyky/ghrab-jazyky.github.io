'use strict';
/*
 * Language Skills Hub R22 – PRIVATE TEST CONTRACT (Node 24, CommonJS).
 * This module defines server-only answer handling. It has NO private bank,
 * student data, credentials or actual school grade thresholds.
 * Never embed these modules or real test banks in GitHub Pages HTML/JS.
 */
const SKILLS=new Set(['cteni','poslech']);
const LANGUAGES=new Set(['en','es','de','fr']);
const LEVELS=new Set(['A1','A2','B1','B2','C1','C2']);
const PHASES=new Set(['first-listening','listen-and-interpret','listen-write-and-reconstruct']);
const TYPES=new Set(['single-choice','multiple-choice','short-text','extended-response']);
class ContractError extends Error{
 constructor(status,code,message){
  super(message);this.name='ContractError';this.status=status;this.code=code;
 }
}
const invalid=(msg)=>{throw new ContractError(422,'INVALID_TEST_DEFINITION',msg);};
const isRecord=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const validText=(s,min,max)=>typeof s==='string'&&s.trim()===s&&s.length>=min&&s.length<=max&&
 !/[\u0000-\u0008\u000b\u000e-\u001f]/.test(s);
function validatePrivateDefinition(def){
 if(!isRecord(def))invalid('Bank must be an object');
 if(!SKILLS.has(def.skill))invalid('Conversation testing is disabled');
 if(!/^((rl)|(ll))-[a-z0-9-]{3,76}$/.test(def.topicId||''))invalid('Invalid topic ID');
 if(def.skill==='cteni'&&!def.topicId.startsWith('rl-')||
    def.skill==='poslech'&&!def.topicId.startsWith('ll-'))invalid('Wrong topic category');
 if(!LANGUAGES.has(def.language)||!LEVELS.has(def.level))invalid('Unsupported language/CEFR');
 if(def.skill==='poslech'&&def.language!=='en')invalid('Listening test must be in English');
 if(!validText(def.revision,4,100)||!/^[a-zA-Z0-9._-]+$/.test(def.revision))invalid('Invalid revision');
 if(!validText(def.title,3,140))invalid('Invalid title');
 if(!Number.isSafeInteger(def.timeLimitSeconds)||
    def.timeLimitSeconds<300||def.timeLimitSeconds>7200)invalid('Invalid test time limit');
 if(def.intro!==undefined&&!validText(def.intro,0,3000))invalid('Invalid introduction');
 if(def.stimulus!==undefined&&!validText(def.stimulus,0,45000))invalid('Invalid reading stimulus');
 if(!Array.isArray(def.tasks)||def.tasks.length<1||def.tasks.length>80)invalid('Invalid task count');
 const ids=new Set(),seenPhases=new Set();
 for(const task of def.tasks){
  if(!isRecord(task)||!/^q[a-z0-9_-]{1,50}$/.test(task.id||'')||ids.has(task.id))
   invalid('Task IDs must be unique');
  ids.add(task.id);
  if(!TYPES.has(task.type)||!validText(task.prompt,3,4000))invalid('Invalid task');
  if(!Number.isSafeInteger(task.points)||task.points<1||task.points>20)
   invalid('Invalid task points');
  if(task.explanation!==undefined&&!validText(task.explanation,0,3000))
   invalid('Invalid explanation');
  if(def.skill==='poslech'){
   if(!PHASES.has(task.phase))invalid('Invalid listening phase');
   seenPhases.add(task.phase);
  }else if(task.phase!==undefined)invalid('Reading has no listening phase');
  if(task.type==='single-choice'||task.type==='multiple-choice'){
   if(!Array.isArray(task.options)||task.options.length<2||task.options.length>8)
    invalid('Invalid choice options');
   const options=new Set();
   for(const option of task.options){
    if(!isRecord(option)||!/^opt[a-z0-9_-]{1,40}$/.test(option.id||'')||
       !validText(option.text,1,1000)||options.has(option.id))
     invalid('Malformed/duplicate option');
    options.add(option.id);
   }
   if(task.type==='single-choice'){
    if(typeof task.correct!=='string'||!options.has(task.correct))
     invalid('Invalid choice answer');
   }else{
    if(!Array.isArray(task.correct)||!task.correct.length||
       task.correct.length>task.options.length||
       new Set(task.correct).size!==task.correct.length||
       !task.correct.every(x=>options.has(x)))invalid('Invalid multiple-choice key');
   }
  }else if(task.type==='short-text'){
   if(!Array.isArray(task.accepted)||!task.accepted.length||task.accepted.length>20||
      !task.accepted.every(x=>validText(x,1,800)))invalid('Invalid accepted answers');
   if(task.reference!==undefined&&!validText(task.reference,1,2500))
    invalid('Invalid short answer reference');
  }else{
   if(!validText(task.reference,1,4000))invalid('Extended response needs private teacher reference');
  }
 }
 if(def.skill==='poslech'&&(seenPhases.size!==3||
   ![...PHASES].every(x=>seenPhases.has(x))))
  invalid('Listening must contain all three assessment sections');
 return def;
}
function safeStudentDefinition(privateDefinition){
 const def=validatePrivateDefinition(privateDefinition);
 return {
  kind:'LSH_STUDENT_TEST_R22_V1',
  topicId:def.topicId,skill:def.skill,language:def.language,level:def.level,
  revision:def.revision,title:def.title,timeLimitSeconds:def.timeLimitSeconds,
  intro:def.intro||'',stimulus:def.skill==='cteni'?(def.stimulus||''):'',
  tasks:def.tasks.map(task=>({
   id:task.id,type:task.type,prompt:task.prompt,points:task.points,
   ...(task.phase?{phase:task.phase}:{}),
   ...((task.type==='single-choice'||task.type==='multiple-choice')?
    {options:task.options.map(option=>({id:option.id,text:option.text}))}:{})
  })),
  restrictions:{
   dictionaryEnabled:false,myVocabularyEnabled:false,
   hintsEnabled:false,supportingPassagesEnabled:false,
   feedbackBeforeSubmission:false,allowLanguageSwitch:false,
   allowLevelSwitch:false,studentMediaPlayerEnabled:false
  }
 };
}
function normalizeText(s){
 return String(s).normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('und');
}
function validateSubmission(def,answers){
 validatePrivateDefinition(def);
 if(!isRecord(answers))throw new ContractError(422,'INVALID_ANSWERS','Answers must be an object');
 const taskMap=new Map(def.tasks.map(task=>[task.id,task]));
 if(Object.keys(answers).length>taskMap.size)
  throw new ContractError(422,'INVALID_ANSWERS','Too many answers');
 for(const [key,value] of Object.entries(answers)){
  if(!Object.hasOwn(answers,key)||!taskMap.has(key))
   throw new ContractError(422,'INVALID_ANSWERS','Unknown task');
  const task=taskMap.get(key);
  if(task.type==='multiple-choice'){
   if(!Array.isArray(value)||value.length>8||new Set(value).size!==value.length||
      !value.every(x=>typeof x==='string'&&x.length<=80))
    throw new ContractError(422,'INVALID_ANSWERS','Invalid multiple-choice answer');
  }else{
   const max=task.type==='extended-response'?5500:task.type==='short-text'?1500:80;
   if(typeof value!=='string'||value.length>max)
    throw new ContractError(422,'INVALID_ANSWERS','Invalid answer text');
  }
 }
 return answers;
}
function scoreSubmitted(privateDefinition,submitted){
 const def=validatePrivateDefinition(privateDefinition);
 const answers=validateSubmission(def,submitted);
 let awarded=0,pending=0,total=0;
 const review=def.tasks.map(task=>{
  total+=task.points;
  const value=Object.hasOwn(answers,task.id)?answers[task.id]:null;
  const blank=value===null||value===''||(Array.isArray(value)&&value.length===0)||
   (typeof value==='string'&&!value.trim());
  let passed=false,manual=false;
  if(!blank){
   if(task.type==='single-choice'){
    passed=value===task.correct;
   }else if(task.type==='multiple-choice'){
    const expected=new Set(task.correct);
    passed=value.length===expected.size&&value.every(x=>expected.has(x));
   }else if(task.type==='short-text'){
    passed=task.accepted.some(a=>normalizeText(a)===normalizeText(value));
    if(!passed)manual=true; // Never mark a plausible paraphrase wrong without review.
   }else manual=true; // Extended writing requires a teacher judgement.
  }
  const earned=manual?null:(passed?task.points:0);
  if(manual)pending+=task.points;else awarded+=earned;
  const correct=task.type==='single-choice'?task.correct:
   task.type==='multiple-choice'?task.correct:
   task.type==='short-text'?task.accepted:(task.reference||null);
  return {
   taskId:task.id,submitted:value,pointsPossible:task.points,
   pointsEarned:earned,state:manual?'needs_teacher_review':passed?'correct':'incorrect',
   correctAnswer:correct,
   explanation:task.explanation||''
  };
 });
 const hasPending=pending>0;
 return {
  kind:'LSH_TEST_RESULT_R22_V1',status:hasPending?'needs_teacher_review':'scored',
  scoredPoints:awarded,pendingPoints:pending,maxPoints:total,
  percentage:hasPending?null:Math.round((awarded/total)*10000)/100,
  grade:null,gradeStatus:'SCHOOL_SCALE_NOT_ACTIVATED_R22',
  review
 };
}
module.exports={ContractError,validatePrivateDefinition,safeStudentDefinition,
 validateSubmission,scoreSubmitted,SKILLS,LANGUAGES,LEVELS,PHASES};
