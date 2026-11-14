/* R30 timed local attempts: convenience and continuity only, never a protected exam.
 * Data stays on this browser. A user can change the clock, URL and local storage.
 * No student identity, telemetry, network submissions or private answer keys.
 */
(function(root){
 'use strict';
 const KIND='LSH_LOCAL_ATTEMPT_R30_V1';
 const STATES=Object.freeze(['ready','running','interrupted','submitted']);
 const INCIDENT_KINDS=Object.freeze(['hidden','fullscreen-exit','fullscreen-denied',
  'focus-loss','viewport-change','restricted-viewport','clipboard',
  'context-menu','page-leave','reload','concurrent-tab','print-attempt','blocked-shortcut']);
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const safeText=s=>typeof s==='string'&&/^[a-z0-9_-]{1,90}$/i.test(s);
 function requireValid(ok,msg){if(!ok)throw new Error(msg);}
 function minutes(value){
  if(value===null||value===undefined||value==='')return null;
  requireValid(typeof value==='string'&&/^[1-9][0-9]{0,2}$/.test(value),
   'Invalid local timer parameter');
  const n=Number(value);
  requireValid(n>=5&&n<=120,'Timer must be 5–120 minutes');
  return n;
 }
 function key(input){
  requireValid(input&&['reading','listening'].includes(input.skill),'Invalid skill');
  for(const field of ['topic','lang','level','attempt'])
   requireValid(safeText(input[field]),'Invalid attempt '+field);
  requireValid(Number.isInteger(input.limitMinutes)&&
   input.limitMinutes>=5&&input.limitMinutes<=120,'Invalid timer');
  return ['lsh','local-attempt','r30',input.skill,input.topic,input.lang,
   input.level,input.limitMinutes,input.attempt].join(':');
 }
 function clone(o){return JSON.parse(JSON.stringify(o));}
 function snapshotValid(s,n){
  if(!s||typeof s!=='object'||Array.isArray(s)||s.kind!==KIND||
   s.limitMinutes!==n||!STATES.includes(s.phase))return false;
  const time=x=>Number.isSafeInteger(x)&&x>=0;
  if(s.phase==='ready'){
   if(s.startedAt!==null||s.deadlineAt!==null||s.submittedAt!==null)return false;
  }else{
   if(!time(s.startedAt)||!time(s.deadlineAt)||
    s.deadlineAt!==s.startedAt+n*60000)return false;
   if(s.phase==='submitted'?!time(s.submittedAt):s.submittedAt!==null)return false;
  }
  if(!s.answers||typeof s.answers!=='object'||Array.isArray(s.answers))return false;
  // R31 is backwards-compatible with R30 saved sessions (no reviewMarks).
  if(s.reviewMarks!==undefined&&s.reviewMarks!==null){
   if(s.phase!=='submitted'||!Array.isArray(s.reviewMarks)||
    s.reviewMarks.length<1||s.reviewMarks.length>50||
    !s.reviewMarks.every(m=>m===null||m===0||m===1))return false;
  }
  if(!Array.isArray(s.incidents)||s.incidents.length>40||
   !s.incidents.every(i=>i&&typeof i==='object'&&
    INCIDENT_KINDS.includes(i.kind)&&time(i.at)))return false;
  // Old R30 sessions had no resume log. Keep those snapshots readable.
  if(s.resumptions!==undefined&&(!Array.isArray(s.resumptions)||
   s.resumptions.length>40||!s.resumptions.every(time)))return false;
  return JSON.stringify(s).length<=160000;
 }
 function open(input){
  requireValid(input&&typeof input==='object','Missing attempt configuration');
  const id=key(input),n=input.limitMinutes;
  const now=typeof input.now==='function'?input.now:Date.now;
  const storage=input.storage||null;
  let persistent=!!storage;
  function clock(){
   const n=now();
   requireValid(Number.isSafeInteger(n)&&n>=0,'Invalid local clock');
   return n;
  }
  const fresh=()=>({
   kind:KIND,limitMinutes:n,phase:'ready',startedAt:null,deadlineAt:null,
   submittedAt:null,answers:{},reviewMarks:null,incidents:[],resumptions:[]
  });
  let state=fresh();
  if(storage){
   let found=null;
   try{found=storage.getItem(id);}
   catch(_){persistent=false;}
   if(found!==null){
    let parsed;
    try{parsed=JSON.parse(found)}catch(_){throw new Error('Corrupted saved attempt');}
    requireValid(snapshotValid(parsed,n),'Corrupted saved attempt');
    state=parsed;
   }
  }
  function persist(){
   if(!storage||!persistent)return;
   try{storage.setItem(id,JSON.stringify(state))}
   catch(_){persistent=false;}
  }
  function remainingMs(){
   return state.deadlineAt===null?n*60000:Math.max(0,state.deadlineAt-clock());
  }
  function expired(){
   return state.deadlineAt!==null&&state.phase!=='submitted'&&remainingMs()===0;
  }
  function status(){return {
   phase:state.phase,startedAt:state.startedAt,deadlineAt:state.deadlineAt,
   submittedAt:state.submittedAt,
   remainingMs:remainingMs(),expired:expired(),persistent,
   answers:clone(state.answers),
   reviewMarks:Array.isArray(state.reviewMarks)?clone(state.reviewMarks):null,
   incidents:clone(state.incidents),resumptions:clone(state.resumptions||[])
  }}
  function start(){
   requireValid(state.phase==='ready','Attempt already started');
   const t=clock();state.startedAt=t;state.deadlineAt=t+n*60000;
   state.phase='running';persist();return status();
  }
  function saveAnswers(answers){
   requireValid(state.phase==='running'&&!expired(),'Attempt is not editable');
   requireValid(answers&&typeof answers==='object'&&!Array.isArray(answers),
    'Invalid answer snapshot');
   const raw=JSON.stringify(answers);
   requireValid(raw&&raw.length<=140000,'Answer snapshot is too large');
   const parsed=JSON.parse(raw);
   requireValid(parsed&&typeof parsed==='object'&&!Array.isArray(parsed),
    'Invalid stored answers');
   state.answers=parsed;persist();return status();
  }
  function saveReviewMarks(marks){
   requireValid(state.phase==='submitted','Review available only after submission');
   requireValid(Array.isArray(marks)&&marks.length>=1&&marks.length<=50&&
    marks.every(x=>x===null||x===0||x===1),'Invalid teacher review marks');
   if(Array.isArray(state.reviewMarks))
    requireValid(state.reviewMarks.length===marks.length,'Review task count changed');
   state.reviewMarks=marks.slice();
   persist();
   return status();
  }
  function interrupt(kind){
   requireValid(INCIDENT_KINDS.includes(kind),'Invalid incident kind');
   if(state.phase==='running'&&!expired()){
    state.phase='interrupted';
    state.incidents.push({kind,at:clock()});
    if(state.incidents.length>40)state.incidents.shift();
    persist();
   }
   return status();
  }
  function resume(){
   requireValid(state.phase==='interrupted'&&!expired(),'Attempt cannot resume');
   state.phase='running';
   if(!Array.isArray(state.resumptions))state.resumptions=[];
   state.resumptions.push(clock());
   if(state.resumptions.length>40)state.resumptions.shift();
   persist();return status();
  }
  function finish(){
   requireValid(state.phase==='running'||state.phase==='interrupted',
    'Attempt cannot finish');
   state.phase='submitted';state.submittedAt=clock();persist();return status();
  }
  function clear(){
   // Only for an explicit local reset performed by a teacher outside an exam.
   state=fresh();
   if(storage){try{storage.removeItem(id)}catch(_){persistent=false;}}
   return status();
  }
  return Object.freeze({id,start,saveAnswers,saveReviewMarks,interrupt,resume,finish,clear,status,remainingMs,expired});
 }
 const api=Object.freeze({KIND,STATES,INCIDENT_KINDS,minutes,key,open});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHAttemptCore=api;
})(typeof window!=='undefined'?window:this);
