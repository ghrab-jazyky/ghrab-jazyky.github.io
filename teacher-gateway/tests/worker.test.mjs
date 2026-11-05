import {test} from 'node:test';
import assert from 'node:assert/strict';
import manifest from '../../zkusebni/data/manifest.json' with {type:'json'};
import worker,{_test as suite} from '../src/worker.mjs';
import {PAGE,CSS,APP} from '../src/ui.mjs';
import {QR} from '../src/qr-asset.mjs';
const BASE='https://teacher.school.example/teacher/';
const env=(extra={})=>({STUDENT_BASE_URL:'https://ghrab-jazyky.github.io/zkusebni/',
  AUTHORIZED_TEACHERS:' pilot@school.example, instructor@school.example ',...extra});
const ctx=(email='pilot@school.example')=>({access:{getIdentity:async()=>({email})}});
const request=(path='',init={})=>new Request(new URL(path,BASE),init);
test('No Access context denies EVEN when request forges Cloudflare headers',async()=>{
 for(const p of ['/teacher/','/teacher/api/catalog','/teacher/qr.js','/teacher/api/key/cl-rodina']){
  const r=await worker.fetch(request(p,{headers:{'Cf-Access-Jwt-Assertion':'forged','CF_Authorization':'forged',
    'X-Forwarded-Email':'pilot@school.example'}}),env(),{});
  assert.equal(r.status,403,p);
  assert.doesNotMatch(await r.text(),/studentBase|Conversation Lab/);
 }
});
test('Identity is not enough: exact allowlist required; deny service token and errors',async()=>{
 for(const [e,c] of [
  [env({AUTHORIZED_TEACHERS:''}),ctx()],
  [env({AUTHORIZED_TEACHERS:'other@school.example'}),ctx()],
  [env(),ctx('outside@school.example')],
  [env(),ctx('pilot@school.example.evil.tld')],
  [env(),{access:{getIdentity:async()=>({})}}],
  [env(),{access:{getIdentity:async()=>{throw Error('identity unavailable');}}}]
 ]){
  const r=await worker.fetch(request('/teacher/api/catalog'),e,c);
  assert.equal(r.status,403);
 }
 assert.equal(suite.registeredTeacher('PILOT@SCHOOL.EXAMPLE',env()),true);
 assert.equal(suite.registeredTeacher(' pilot@school.example ',env()),true);
 assert.equal(suite.registeredTeacher('pilot@school.example.other',env()),false);
});
test('Authorized catalog is only metadata, no scores, teacher keys or user data',async()=>{
 const r=await worker.fetch(request('/teacher/api/catalog'),env(),ctx('PILOT@SCHOOL.EXAMPLE'));
 assert.equal(r.status,200);assert.match(r.headers.get('Content-Type'),/application\/json/);
 assert.equal(r.headers.get('Cache-Control').includes('no-store'),true);
 assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
 const data=await r.json();
 assert.equal(data.environment,'staging');
 assert.equal(data.topics.length,22);
 assert.equal(data.topics.filter(t=>t.skill==='konverzace').length,21);
 assert.equal(data.topics.filter(t=>t.skill==='cteni').length,1);
 assert.equal(data.topics.filter(t=>t.skill==='poslech').length,0);
 assert.ok(data.topics.every(t=>t.teacherKeyAvailable===false));
 assert.ok(data.topics.every(t=>t.variants.length<=24&&t.cardPath===t.skill+'/'+t.slug+'/'));
 const source=JSON.stringify(data);
 assert.ok(!source.includes('teacherKeyUrl'));
 assert.ok(!source.includes('correctAnswers'));
 assert.ok(!source.includes('answerKey'));
 assert.ok(!source.includes('demoContent'));
 assert.ok(!source.includes('studentAnswers'));
 assert.equal(data.studentBase,'https://ghrab-jazyky.github.io/zkusebni/');
});
test('HTML, scripts and styles require Access; browser CSP blocks inline and framing',async()=>{
 for(const [p,type] of [['/teacher/','text/html'],['/teacher/app.js','text/javascript'],
   ['/teacher/qr.js','text/javascript'],['/teacher/styles.css','text/css']]){
  const r=await worker.fetch(request(p),env(),ctx());
  assert.equal(r.status,200,p);assert.ok(r.headers.get('Content-Type').startsWith(type),p);
  assert.equal(r.headers.get('Referrer-Policy'),'no-referrer');
  assert.equal(r.headers.get('X-Frame-Options'),'DENY');
  assert.match(r.headers.get('Cache-Control'),/no-store/);
  const body=await r.text();assert.ok(body.length>100,p);
 }
 const h=await worker.fetch(request('/teacher/'),env(),ctx());
 assert.match(h.headers.get('Content-Security-Policy'),/script-src 'self'/);
 assert.match(h.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);
 assert.doesNotMatch(h.headers.get('Content-Security-Policy'),/unsafe-inline/);
 assert.match(PAGE,/Učitelské klíče nejsou součástí veřejného katalogu/);
 assert.doesNotMatch(APP,/\binnerHTML\s*=/);
 assert.match(QR,/No network dependencies/);
 assert.ok(CSS.length>2000);
});
test('Access exists but unsafe or missing public student base blocks all data',async()=>{
 for(const link of [undefined,'http://attacker.test/','javascript:alert(1)',
   'https://x.test/path?token=x','https://x.test/a#b','https://name:pass@x.test/']){
  const r=await worker.fetch(request('/teacher/api/catalog'),env({STUDENT_BASE_URL:link}),ctx());
  assert.equal(r.status,503,link);
 }
 assert.equal(suite.cleanBase('https://school.example/public/'),'https://school.example/public/');
});
test('Any POST is rejected; HEAD contains no body; unknown path is 404',async()=>{
 let r=await worker.fetch(request('/teacher/api/catalog',{method:'POST'}),env(),ctx());
 assert.equal(r.status,405);assert.equal(r.headers.get('Allow'),'GET, HEAD');
 r=await worker.fetch(request('/teacher/api/catalog',{method:'HEAD'}),env(),ctx());
 assert.equal(r.status,200);assert.equal((await r.text()).length,0);
 r=await worker.fetch(request('/teacher/fake'),env(),ctx());
 assert.equal(r.status,404);
 r=await worker.fetch(request('/teacher/api/key/%E0%A4%A'),env(),ctx());
 assert.equal(r.status,404);
});
test('No authorized teacher key unless card status explicitly approved AND KV binding exists',async()=>{
 const t=manifest.topics.find(x=>x.skill==='konverzace');
 const r=await worker.fetch(request('/teacher/api/key/'+t.id),env({TEACHER_KEYS:{get:async()=>{
   throw Error('KV must never be queried for unapproved topic');
 }}}),ctx());
 assert.equal(r.status,404);
});
test('Approved key is served ONLY after Access + allowlist + KV, as private attachment',async()=>{
 const t=manifest.topics.find(x=>x.skill==='konverzace');
 const old={status:t.status,hasTeacherKey:t.hasTeacherKey};
 let reads=0;
 const mockKV={get:async name=>{
   reads++;assert.equal(name,'lsh:teacher-key:'+t.id+':'+t.version);
   return '<!doctype html><title>synthetic key only</title>';
 }};
 try{
   t.status='ZKONTROLOVANO';t.hasTeacherKey=true;
   let r=await worker.fetch(request('/teacher/api/key/'+t.id),
     env({TEACHER_KEYS:mockKV}),ctx());
   assert.equal(r.status,200);
   assert.equal(reads,1);
   assert.match(r.headers.get('Content-Disposition'),/attachment/);
   assert.match(r.headers.get('Cache-Control'),/no-store/);
   assert.match(await r.text(),/synthetic key only/);
   r=await worker.fetch(request('/teacher/api/key/'+t.id),
     env({TEACHER_KEYS:mockKV}),{});
   assert.equal(r.status,403);assert.equal(reads,1);
   r=await worker.fetch(request('/teacher/api/key/'+t.id),env(),ctx());
   assert.equal(r.status,404);
 }finally{t.status=old.status;t.hasTeacherKey=old.hasTeacherKey;}
});
test('Current published metadata does not allow reading demo keys',async()=>{
 const r=await worker.fetch(request('/teacher/api/key/demo-muzeum-niva'),env(),ctx());
 assert.equal(r.status,404);
});
