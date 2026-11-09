'use strict';
/*
 * LSH R22 Node 24 HTTP service boundary – no listener, no test-bank files,
 * no default users, no public deployment, no cookies or CORS wildcard.
 *
 * Production MUST inject real verified auth, server-only bank access, durable
 * atomic storage and distributed throttling. Startup throws without them.
 */
const {randomBytes,createHash}=require('node:crypto');
const {
 ContractError,validatePrivateDefinition,safeStudentDefinition,scoreSubmitted,
 SKILLS,LANGUAGES,LEVELS
}=require('./contract.cjs');
const ERROR=(status,code,message)=>new ContractError(status,code,message);
const isRecord=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const sessionIdValid=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{28,80}$/.test(s);
const tokenValue=s=>typeof s==='string'&&/^Bearer [A-Za-z0-9._~-]{20,2048}$/.test(s);
const epoch=()=>Date.now();
const freshId=()=>randomBytes(24).toString('base64url');
const METHODS=[
 ['bank.load','bank','load'],['store.createSession','store','createSession'],
 ['store.getSession','store','getSession'],['store.createAttempt','store','createAttempt'],
 ['store.getAttempt','store','getAttempt'],['store.finalizeAttempt','store','finalizeAttempt'],
 ['throttle.check','throttle','check']
];
function createHandler(options={}){
 if(options.enabled!==true)throw new Error('R22 test backend is disabled by default');
 if(typeof options.teacherAuth!=='function'||typeof options.studentAuth!=='function')
  throw new Error('Verified teacher and student auth adapters are REQUIRED');
 if(!options.bank||options.bank.serverOnly!==true)
  throw new Error('Private test bank adapter is REQUIRED');
 if(!options.store||options.store.durable!==true||options.store.atomicFinalize!==true||
    options.store.atomicAttemptStart!==true)
  throw new Error('Durable and atomic attempt storage is REQUIRED');
 if(!options.throttle)throw new Error('Distributed throttling adapter is REQUIRED');
 for(const [label,group,fn] of METHODS)
  if(typeof options[group]?.[fn]!=='function')throw new Error(label+' must be provided');
 if(options.allowedOrigin!==undefined){
  let checked;
  try{checked=new URL(options.allowedOrigin);}
  catch(_){throw new Error('CORS origin must be an exact HTTPS origin');}
  if(checked.protocol!=='https:'||checked.origin!==options.allowedOrigin||
     checked.username||checked.password)
   throw new Error('CORS origin must be an exact HTTPS origin, never a path or wildcard');
 }
 const now=typeof options.now==='function'?options.now:epoch;
 const teacherAuth=options.teacherAuth,studentAuth=options.studentAuth;
 const bank=options.bank,store=options.store,throttle=options.throttle;
 const sessionLifetime=Number.isSafeInteger(options.sessionLifetimeMs)&&
   options.sessionLifetimeMs>=60000&&options.sessionLifetimeMs<=14400000?
    options.sessionLifetimeMs:10800000; // 3 hours, configurable externally.
 const allowedOrigin=options.allowedOrigin||null;
 function send(res,status,body){
  res.statusCode=status;
  res.setHeader('Cache-Control','no-store, private');
  res.setHeader('Pragma','no-cache');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Cross-Origin-Resource-Policy','cross-origin');
  const text=JSON.stringify(body);
  res.setHeader('Content-Length',Buffer.byteLength(text));
  res.end(text);
 }
 async function readJson(req){
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))
   throw ERROR(415,'JSON_REQUIRED','Content-Type must be application/json');
  const headerLen=Number(req.headers['content-length']||0);
  if(!Number.isSafeInteger(headerLen)||headerLen>32768)
   throw ERROR(413,'BODY_TOO_LARGE','Request body too large');
  let bytes=0;const chunks=[];
  for await(const chunk of req){
   bytes+=chunk.length;
   if(bytes>32768)throw ERROR(413,'BODY_TOO_LARGE','Request body too large');
   chunks.push(chunk);
  }
  let value;
  try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}
  catch(_){throw ERROR(400,'INVALID_JSON','Invalid JSON request');}
  if(!isRecord(value))throw ERROR(422,'INVALID_INPUT','Expected a JSON object');
  return value;
 }
 function exactKeys(object,keys){
  if(Object.keys(object).length!==keys.length||
      keys.some(key=>!Object.hasOwn(object,key)))
   throw ERROR(422,'INVALID_INPUT','Unexpected or missing request field');
 }
 async function verify(req,role){
  const authorization=req.headers.authorization;
  if(!tokenValue(authorization))
   throw ERROR(401,'AUTH_REQUIRED','Bearer authentication required');
  const token=authorization.slice(7);
  const tokenDigest=createHash('sha256').update(token).digest('hex');
  if(await throttle.check({route:req.url.split('?')[0],method:req.method,
   tokenDigest})!==true)
   throw ERROR(429,'RATE_LIMIT','Request frequency exceeded');
  // Auth adapters MUST validate signatures, expiry, audience and role server-side.
  const provider=role==='teacher'?teacherAuth:studentAuth;
  let principal;
  try{principal=await provider({token,request:req});}
  catch(_){throw ERROR(401,'AUTH_REQUIRED','Authentication failed');}
  if(!isRecord(principal)||principal.role!==role||
     typeof principal.subjectId!=='string'||
     !/^[a-zA-Z0-9._:@-]{3,160}$/.test(principal.subjectId))
   throw ERROR(403,'FORBIDDEN','Insufficient permissions');
  return principal;
 }
 async function loadBank(selection){
  const definition=await bank.load(selection);
  if(!definition)throw ERROR(404,'TEST_UNAVAILABLE','No approved test bank for this variant');
  validatePrivateDefinition(definition);
  if(definition.topicId!==selection.topicId||
     definition.language!==selection.language||definition.level!==selection.level||
     (selection.revision!==undefined&&definition.revision!==selection.revision))
   throw ERROR(409,'REVISION_MISMATCH','Test bank revision has changed');
  return definition;
 }
 function validateSelection(data){
  exactKeys(data,['topicId','language','level']);
  if(typeof data.topicId!=='string'||!/^((rl)|(ll))-[a-z0-9-]{3,76}$/.test(data.topicId)||
     !LANGUAGES.has(data.language)||!LEVELS.has(data.level))
   throw ERROR(422,'INVALID_SELECTION','Unknown language, level or topic');
  if(data.topicId.startsWith('ll-')&&data.language!=='en')
   throw ERROR(422,'INVALID_SELECTION','Listening is English-only');
 }
 async function getOwnedAttempt(attemptId,principal){
  if(!sessionIdValid(attemptId))throw ERROR(404,'NOT_FOUND','Attempt not found');
  const attempt=await store.getAttempt(attemptId);
  // Never reveal existence of another student's attempt.
  if(!attempt||attempt.studentId!==principal.subjectId)
   throw ERROR(404,'NOT_FOUND','Attempt not found');
  return attempt;
 }
 async function getDefinitionForAttempt(attempt){
  return loadBank({topicId:attempt.topicId,language:attempt.language,
   level:attempt.level,revision:attempt.revision});
 }
 async function execute(req,method,url){
  if(method==='POST'&&url.pathname==='/v1/teacher/sessions'){
   const teacher=await verify(req,'teacher');
   const body=await readJson(req);validateSelection(body);
   const definition=await loadBank(body);
   const issuedAt=now(),expiresAt=issuedAt+sessionLifetime,sessionId=freshId();
   await store.createSession({sessionId,teacherId:teacher.subjectId,
    topicId:definition.topicId,skill:definition.skill,
    language:definition.language,level:definition.level,
    revision:definition.revision,issuedAt,expiresAt});
   return {status:201,data:{sessionId,topicId:definition.topicId,skill:definition.skill,
    language:definition.language,level:definition.level,
    revision:definition.revision,expiresAt,
    authenticationRequired:true,mediaControlledByTeacher:definition.skill==='poslech'}};
  }
  if(method==='POST'&&url.pathname==='/v1/student/attempts'){
   const student=await verify(req,'student');
   const body=await readJson(req);exactKeys(body,['sessionId']);
   if(!sessionIdValid(body.sessionId))throw ERROR(404,'NOT_FOUND','Session not found');
   const session=await store.getSession(body.sessionId);
   if(!session||session.expiresAt<=now()||session.closed===true)
    throw ERROR(404,'NOT_FOUND','Active session not found');
   const definition=await loadBank({topicId:session.topicId,
    language:session.language,level:session.level,revision:session.revision});
   const startedAt=now(),expiresAt=Math.min(
    startedAt+definition.timeLimitSeconds*1000,session.expiresAt);
   const attemptId=freshId();
   // Store adapter MUST atomically prevent >1 attempt per student/session.
   await store.createAttempt({attemptId,sessionId:body.sessionId,
    studentId:student.subjectId,topicId:session.topicId,
    skill:definition.skill,language:session.language,level:session.level,
    revision:session.revision,startedAt,expiresAt,status:'active'});
   return {status:201,data:{attemptId,startedAt,expiresAt,
    test:safeStudentDefinition(definition)}};
  }
  const path=/^\/v1\/student\/attempts\/([A-Za-z0-9_-]{28,80})(?:\/(submit|result))?$/.exec(url.pathname);
  if(!path)throw ERROR(404,'NOT_FOUND','Endpoint not found');
  const student=await verify(req,'student');
  const attempt=await getOwnedAttempt(path[1],student);
  const operation=path[2]||null;
  if(method==='GET'&&operation==='result'){
   if(attempt.status!=='submitted'||!attempt.result)
    throw ERROR(409,'NOT_SUBMITTED','Result is not available before submission');
   return {status:200,data:{attemptId:attempt.attemptId,...attempt.result,
    submittedAt:attempt.submittedAt}};
  }
  if(method==='GET'&&operation===null){
   if(attempt.status!=='active')
    throw ERROR(409,'ATTEMPT_CLOSED','Test has already been submitted');
   if(attempt.expiresAt<=now())
    throw ERROR(410,'TIME_EXPIRED','Test time has expired');
   const definition=await getDefinitionForAttempt(attempt);
   return {status:200,data:{attemptId:attempt.attemptId,
    startedAt:attempt.startedAt,expiresAt:attempt.expiresAt,
    test:safeStudentDefinition(definition)}};
  }
  if(method==='POST'&&operation==='submit'){
   if(attempt.status!=='active')
    throw ERROR(409,'ATTEMPT_CLOSED','Test has already been submitted');
   if(attempt.expiresAt<=now())
    throw ERROR(410,'TIME_EXPIRED','Test time has expired');
   const body=await readJson(req);exactKeys(body,['answers']);
   const definition=await getDefinitionForAttempt(attempt);
   const result=scoreSubmitted(definition,body.answers);
   // MUST be one durable atomic transaction. Never send corrections before COMMIT.
   const committed=await store.finalizeAttempt({attemptId:attempt.attemptId,
    studentId:student.subjectId,submittedAt:now(),result});
   if(committed!==true)
    throw ERROR(409,'ATTEMPT_CLOSED','Submission already recorded');
   return {status:200,data:{attemptId:attempt.attemptId,...result}};
  }
  throw ERROR(405,'METHOD_NOT_ALLOWED','Unsupported method');
 }
 return async function handler(req,res){
  try{
   const origin=req.headers.origin||null;
   if(origin&&origin!==allowedOrigin)
    throw ERROR(403,'ORIGIN_DENIED','Origin not permitted');
   if(origin&&origin===allowedOrigin){
    res.setHeader('Access-Control-Allow-Origin',allowedOrigin);
    res.setHeader('Vary','Origin');
    res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
    res.setHeader('Access-Control-Max-Age','300');
   }
   if(req.method==='OPTIONS'&&origin===allowedOrigin){
    res.writeHead(204,{'Cache-Control':'no-store'});res.end();return;
   }
   const url=new URL(req.url,'http://local.internal');
   if(url.search||url.hash)
    throw ERROR(400,'INVALID_PATH','API endpoints do not use URL query parameters');
   const result=await execute(req,req.method,url);
   send(res,result.status,result.data);
  }catch(error){
   if(res.headersSent){res.end();return;}
   const safe=error instanceof ContractError?error:
    ERROR(503,'SERVICE_UNAVAILABLE','Secure test service temporarily unavailable');
   send(res,safe.status,{error:safe.code,message:safe.message});
  }
 };
}
module.exports={createHandler};
