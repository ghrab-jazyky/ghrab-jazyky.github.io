#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const http=require('node:http');
const {createHandler}=require('../src/handler.cjs');
const {ContractError}=require('../src/contract.cjs');
const TEACHER='teacher_verified_fixture_token_123456789';
const ALICE='student_alice_fixture_token_123456789';
const BOB='student_bob_fixture_token_123456789';
let now=1762704000000,server,base,store;
const throttleChecks=[];
const artificialReading={
 topicId:'rl-asteroids',skill:'cteni',language:'en',level:'B2',
 revision:'r22-fixture-2026',title:'Imaginary Planet: Mock Reading',
 stimulus:'Two imaginary moons travel over a blue lake.',
 teacherOnlyKey:'NEVER_EXPOSE_MOCK_KEY',
 timeLimitSeconds:1200,tasks:[
  {id:'q1',type:'single-choice',prompt:'How many imaginary moons?',
   options:[{id:'opone',text:'One'},{id:'optwo',text:'Two'}],
   correct:'optwo',points:2,explanation:'There are two moons.'},
  {id:'q2',type:'short-text',prompt:'Name the colour of the lake',
   accepted:['blue'],reference:'blue',points:2}
 ]
};
const artificialListening={
 topicId:'ll-matthew-oscars',skill:'poslech',language:'en',level:'B1',
 revision:'r22-fixture-2026',title:'Imaginary Audio: Mock Listening',
 teacherMediaUrl:'PRIVATE_TEACHER_MEDIA_REFERENCE',
 timeLimitSeconds:900,tasks:[
  {id:'q1',type:'single-choice',phase:'first-listening',prompt:'What is the topic?',
   options:[{id:'opone',text:'Peace'},{id:'optwo',text:'Space'}],
   correct:'opone',points:1},
  {id:'q2',type:'single-choice',phase:'listen-and-interpret',prompt:'What is the tone?',
   options:[{id:'opone',text:'Hopeful'},{id:'optwo',text:'Sad'}],
   correct:'opone',points:1},
  {id:'q3',type:'short-text',phase:'listen-write-and-reconstruct',
   prompt:'What key word is spoken?',accepted:['hope'],points:2}
 ]
};
function storage(){
 const sessions=new Map(),attempts=new Map(),byStudent=new Set();
 return {
  durable:true,atomicFinalize:true,atomicAttemptStart:true,
  sessions,attempts,
  async createSession(session){
   assert.equal(sessions.has(session.sessionId),false);
   sessions.set(session.sessionId,{...session});
  },
  async getSession(id){return sessions.get(id)||null;},
  async createAttempt(attempt){
   const key=attempt.sessionId+':'+attempt.studentId;
   if(byStudent.has(key))
    throw new ContractError(409,'ATTEMPT_ALREADY_STARTED','Only one attempt per student and test session');
   byStudent.add(key);
   attempts.set(attempt.attemptId,{...attempt});
  },
  async getAttempt(id){return attempts.get(id)||null;},
  async finalizeAttempt({attemptId,studentId,submittedAt,expiresAt,result}){
   const attempt=attempts.get(attemptId);
   if(!attempt||attempt.studentId!==studentId||attempt.status!=='active'||
      attempt.expiresAt!==expiresAt||submittedAt>=expiresAt)return false;
   // This mocked in-memory operation is atomic in the single-threaded test harness.
   // Production MUST use a conditional database write + durable transaction.
   attempt.status='submitted';attempt.submittedAt=submittedAt;attempt.result=result;
   return true;
  }
 };
}
const bank={
 serverOnly:true,
 async load({topicId,language,level,revision}){
  const d=topicId.startsWith('rl-')?artificialReading:
   topicId.startsWith('ll-')?artificialListening:null;
  if(!d||topicId!==d.topicId||language!==d.language||level!==d.level)return null;
  if(revision!==undefined&&revision!==d.revision)return null;
  return d;
 }
};
function service(opts={}){
 const ownStore=storage();
 const handler=createHandler({
  enabled:true,bank,store:ownStore,now:()=>now,allowedOrigin:'https://ghrab-jazyky.github.io',
  teacherAuth:async ({token})=>token===TEACHER?
   {subjectId:'teacher-pseudonym',role:'teacher'}:null,
  studentAuth:async ({token})=>token===ALICE?
   {subjectId:'student-alice-pseudonym',role:'student'}:
   token===BOB?{subjectId:'student-bob-pseudonym',role:'student'}:null,
  throttle:{check:async bucket=>{throttleChecks.push(bucket);return true;}},
  ...opts
 });
 if(!Object.hasOwn(opts,'store'))store=ownStore;
 return handler;
}
test.before(async()=>{
 server=http.createServer(service());
 await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port;
});
test.after(async()=>{
 if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
async function request(route,token,{method='GET',body,origin}={}){
 const headers={};
 if(token)headers.Authorization='Bearer '+token;
 if(body!==undefined)headers['Content-Type']='application/json';
 if(origin)headers.Origin=origin;
 const response=await fetch(base+route,{method,headers,body:body===undefined?undefined:
   typeof body==='string'?body:JSON.stringify(body)});
 const content=response.status===204?null:await response.json();
 return {status:response.status,data:content,headers:response.headers};
}
async function createTeacherSession(topicId='rl-asteroids',language='en',level='B2'){
 return request('/v1/teacher/sessions',TEACHER,{method:'POST',
  body:{topicId,language,level}});
}
async function startAttempt(sessionId,token=ALICE){
 return request('/v1/student/attempts',token,{method:'POST',body:{sessionId}});
}
function mustNotLeak(payload){
 const json=JSON.stringify(payload);
 for(const k of ['NEVER_EXPOSE_MOCK_KEY','PRIVATE_TEACHER_MEDIA_REFERENCE',
  '"correct"','"accepted"','"reference"','"explanation"','"teacherMediaUrl"'])
  assert.ok(!json.includes(k),'Sensitive bank key leaked: '+k);
}
test('R22 refuses to initialize without private bank, durable atomic store, real auth and explicit activation',()=>{
 assert.throws(()=>createHandler(),/disabled by default/);
 assert.throws(()=>createHandler({enabled:true}),/auth adapters/);
 assert.throws(()=>createHandler({enabled:true,teacherAuth:()=>{},
  studentAuth:()=>{},bank:{}}),/Private test bank/);
 assert.throws(()=>service({store:{durable:false}}),/Durable and atomic/);
 assert.throws(()=>service({allowedOrigin:'*'}),/exact HTTPS origin/);
 console.log('PASS R22 fail-closed startup, no default student or teacher identities');
});
test('R22 unauthorized, cross-origin and malformed inputs are blocked without leaking questions',async()=>{
 const missing=await request('/v1/teacher/sessions',null,{method:'POST',
  body:{topicId:'rl-asteroids',language:'en',level:'B2'}});
 assert.equal(missing.status,401);
 const wrongRole=await request('/v1/teacher/sessions',ALICE,{method:'POST',
  body:{topicId:'rl-asteroids',language:'en',level:'B2'}});
 assert.equal(wrongRole.status,403);
 const hostile=await request('/v1/teacher/sessions',TEACHER,{method:'POST',
  origin:'https://unknown.example',body:{topicId:'rl-asteroids',language:'en',level:'B2'}});
 assert.equal(hostile.status,403);
 const invalid=await request('/v1/teacher/sessions',TEACHER,{method:'POST',body:{topicId:'cl-skola',language:'en',level:'B1'}});
 assert.equal(invalid.status,422);
 const unexpected=await request('/v1/teacher/sessions',TEACHER,{method:'POST',
  body:{topicId:'rl-asteroids',language:'en',level:'B2',studentName:'NEVER_ACCEPT_PII'}});
 assert.equal(unexpected.status,422);
 const wrongLanguage=await request('/v1/teacher/sessions',TEACHER,{method:'POST',
  body:{topicId:'ll-matthew-oscars',language:'es',level:'B1'}});
 assert.equal(wrongLanguage.status,422);
 const nonsensical=await request('/v1/teacher/sessions',TEACHER,{method:'POST',body:'nope'});
 assert.equal(nonsensical.status,400);
 const huge=await request('/v1/teacher/sessions',TEACHER,{method:'POST',body:{payload:'x'.repeat(33000)}});
 assert.equal(huge.status,413);
 for(const result of [missing,wrongRole,hostile,invalid,unexpected,wrongLanguage,nonsensical,huge])
  mustNotLeak(result.data);
 console.log('PASS R22 401/403 origin/role, invalid input 422, malformed JSON 400, body limit 413');
});
test('R22 teacher session -> student attempt -> one server submission -> feedback, never before',async()=>{
 const made=await createTeacherSession();
 assert.equal(made.status,201);
 assert.equal(made.data.skill,'cteni');
 assert.equal(made.data.authenticationRequired,true);
 assert.deepEqual(throttleChecks.slice(-2).map(bucket=>bucket.scope),['peer','token']);
 assert.match(throttleChecks.at(-2).keyDigest,/^[a-f0-9]{64}$/);
 assert.match(throttleChecks.at(-1).keyDigest,/^[a-f0-9]{64}$/);
 assert.match(store.sessions.get(made.data.sessionId).bankSha256,/^[a-f0-9]{64}$/);
 assert.equal(made.data.mediaControlledByTeacher,false);
 assert.equal(made.headers.get('cache-control'),'no-store, private');
 assert.equal(made.headers.get('access-control-allow-origin'),null);
 const sessionId=made.data.sessionId;
 assert.match(sessionId,/^[A-Za-z0-9_-]{32}$/);
 const started=await startAttempt(sessionId);
 assert.equal(started.status,201);
 const attemptId=started.data.attemptId;
 assert.match(attemptId,/^[A-Za-z0-9_-]{32}$/);
 assert.equal(store.attempts.get(attemptId).bankSha256,store.sessions.get(sessionId).bankSha256);
 mustNotLeak(started.data);
 assert.equal(started.data.test.restrictions.dictionaryEnabled,false);
 assert.equal(started.data.test.restrictions.myVocabularyEnabled,false);
 assert.equal(started.data.test.restrictions.feedbackBeforeSubmission,false);
 assert.equal(started.data.test.tasks.length,2);
 assert.equal(started.data.test.tasks[0].options[1].text,'Two');
 const other=await request('/v1/student/attempts/'+attemptId,BOB);
 assert.equal(other.status,404);
 const before=await request('/v1/student/attempts/'+attemptId+'/result',ALICE);
 assert.equal(before.status,409);
 mustNotLeak(before.data);
 const peek=await request('/v1/student/attempts/'+attemptId,ALICE);
 assert.equal(peek.status,200);
 mustNotLeak(peek.data);
 const again=await startAttempt(sessionId);
 assert.equal(again.status,409);
 const bad=await request('/v1/student/attempts/'+attemptId+'/submit',ALICE,{method:'POST',
  body:{answers:{q1:'optwo',evil:'x'}}});
 assert.equal(bad.status,422);
 const correct=await request('/v1/student/attempts/'+attemptId+'/submit',ALICE,{method:'POST',
  body:{answers:{q1:'optwo',q2:'blue'}}});
 assert.equal(correct.status,200);
 assert.equal(correct.data.status,'scored');
 assert.equal(correct.data.scoredPoints,4);
 assert.equal(correct.data.maxPoints,4);
 assert.equal(correct.data.percentage,100);
 assert.equal(correct.data.grade,null);
 assert.equal(correct.data.review[0].correctAnswer,'optwo');
 const duplicate=await request('/v1/student/attempts/'+attemptId+'/submit',ALICE,{method:'POST',
  body:{answers:{q1:'opone',q2:'red'}}});
 assert.equal(duplicate.status,409);
 const replay=await request('/v1/student/attempts/'+attemptId,ALICE);
 assert.equal(replay.status,409);
 const final=await request('/v1/student/attempts/'+attemptId+'/result',ALICE);
 assert.equal(final.status,200);
 assert.equal(final.data.percentage,100);
 assert.equal((await request('/v1/student/attempts/'+attemptId+'/result',BOB)).status,404);
 console.log('PASS R22 authenticated teacher->student flow, no pre-submit solutions, durable commit before feedback, replay blocked');
});
test('R22 Listening has 3 phases and server never discloses teacher audio source',async()=>{
 const s=await createTeacherSession('ll-matthew-oscars','en','B1');
 assert.equal(s.status,201);
 assert.equal(s.data.mediaControlledByTeacher,true);
 const a=await startAttempt(s.data.sessionId,BOB);
 assert.equal(a.status,201);
 mustNotLeak(a.data);
 assert.deepEqual(a.data.test.tasks.map(q=>q.phase),
  ['first-listening','listen-and-interpret','listen-write-and-reconstruct']);
 assert.equal(a.data.test.language,'en');
 assert.equal(a.data.test.restrictions.studentMediaPlayerEnabled,false);
 assert.equal(a.data.test.restrictions.allowLevelSwitch,false);
 const submitted=await request('/v1/student/attempts/'+a.data.attemptId+'/submit',BOB,{
  method:'POST',body:{answers:{q1:'opone',q2:'opone',q3:'a plausible paraphrase'}}});
 assert.equal(submitted.status,200);
 assert.equal(submitted.data.status,'needs_teacher_review');
 assert.equal(submitted.data.grade,null);
 assert.equal(submitted.data.percentage,null);
 assert.equal(submitted.data.pendingPoints,2);
 console.log('PASS R22 Listening 3 phases, EN-only, no student media, manual review for nonliteral reconstruction');
});
test('R22 deadline enforced server-side and old attempts cannot be extended by client clock',async()=>{
 const s=await createTeacherSession();
 const a=await startAttempt(s.data.sessionId,BOB);
 assert.equal(a.status,201);
 now+=1201000;
 const expired=await request('/v1/student/attempts/'+a.data.attemptId,BOB);
 assert.equal(expired.status,410);
 const submit=await request('/v1/student/attempts/'+a.data.attemptId+'/submit',BOB,{
  method:'POST',body:{answers:{q1:'optwo'}}});
 assert.equal(submit.status,410);
 const result=await request('/v1/student/attempts/'+a.data.attemptId+'/result',BOB);
 assert.equal(result.status,409);
 console.log('PASS R22 server clock controls deadline, no submit or answer review after unsubmitted expiration');
});
test('R22 concurrent duplicate submission makes only one atomic commit',async()=>{
 const s=await createTeacherSession();
 const a=await startAttempt(s.data.sessionId,ALICE);
 assert.equal(a.status,201);
 const url='/v1/student/attempts/'+a.data.attemptId+'/submit';
 const [x,y]=await Promise.all([
  request(url,ALICE,{method:'POST',body:{answers:{q1:'optwo',q2:'blue'}}}),
  request(url,ALICE,{method:'POST',body:{answers:{q1:'opone',q2:'red'}}})
 ]);
 assert.deepEqual([x.status,y.status].sort(),[200,409]);
 const after=await request('/v1/student/attempts/'+a.data.attemptId+'/result',ALICE);
 assert.equal(after.status,200);
 assert.equal(store.attempts.get(a.data.attemptId).status,'submitted');
 console.log('PASS R22 simultaneous submit at most one committed result, duplicate returns 409');
});
test('R22 pins the private answer key even if the revision label is unchanged',async()=>{
 const s=await createTeacherSession();
 const a=await startAttempt(s.data.sessionId,BOB);
 const saved=artificialReading.tasks[0].correct;
 artificialReading.tasks[0].correct='opone';
 try{
  const read=await request('/v1/student/attempts/'+a.data.attemptId,BOB);
  assert.equal(read.status,409);
  assert.equal(read.data.error,'BANK_CONTENT_CHANGED');
  const submit=await request('/v1/student/attempts/'+a.data.attemptId+'/submit',BOB,{
   method:'POST',body:{answers:{q1:'opone'}}});
  assert.equal(submit.status,409);
  assert.equal(store.attempts.get(a.data.attemptId).status,'active');
 }finally{artificialReading.tasks[0].correct=saved;}
 console.log('PASS R22 immutable bank content even when revision is unchanged');
});
test('R22 rejects submissions crossing the deadline while awaiting the bank',async()=>{
 const s=await createTeacherSession();
 const a=await startAttempt(s.data.sessionId,BOB);
 const saved=bank.load;let crossed=false;
 bank.load=async function(selection){
  const def=await saved.call(this,selection);
  if(selection.bankSha256){now+=1201000;crossed=true;}
  return def;
 };
 try{
  const submitted=await request('/v1/student/attempts/'+a.data.attemptId+'/submit',BOB,{
   method:'POST',body:{answers:{q1:'optwo'}}});
  assert.equal(crossed,true);
  assert.equal(submitted.status,410);
  assert.equal(submitted.data.error,'TIME_EXPIRED');
  assert.equal(store.attempts.get(a.data.attemptId).status,'active');
 }finally{bank.load=saved;}
 console.log('PASS R22 deadline is rechecked after asynchronous bank lookup');
});
test('R22 strict CORS only allows exact configured school Pages origin, without credentials wildcard',async()=>{
 const cors=await request('/v1/teacher/sessions',TEACHER,{method:'POST',
  origin:'https://ghrab-jazyky.github.io',
  body:{topicId:'rl-asteroids',language:'en',level:'B2'}});
 assert.equal(cors.status,201);
 assert.equal(cors.headers.get('access-control-allow-origin'),'https://ghrab-jazyky.github.io');
 assert.equal(cors.headers.get('access-control-allow-credentials'),null);
 assert.equal(cors.headers.get('x-content-type-options'),'nosniff');
 assert.equal(cors.headers.get('referrer-policy'),'no-referrer');
 assert.equal(cors.headers.get('cache-control'),'no-store, private');
 console.log('PASS R22 exact-origin CORS, no wildcard, no shared answer cache');
});
