/* Language Skills Hub teacher-only Cloudflare Worker — fail-closed auth.
   No static assets bypass, no client-side teacher keys, no JWT-header trust.
   Requires Cloudflare Access on this Worker AND an explicit staff allowlist. */
import manifest from '../../zkusebni/data/manifest.json' with {type:'json'};
import {PAGE,CSS,APP} from './ui.mjs';
import {QR} from './qr-asset.mjs';

const SKILLS=new Set(['konverzace','cteni','poslech']);
const LIVE=new Set(['ZKONTROLOVANO','PUBLIKOVANO']);
const ID_RE=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PATH_RE=/^(?:konverzace|cteni|poslech)\/[a-z0-9-]+\/$/;
const NO_CACHE='private, no-store, max-age=0, must-revalidate';
const DEFAULT_HEADERS={
  'Cache-Control':NO_CACHE,
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer',
  'X-Robots-Tag':'noindex, nofollow, noarchive',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Resource-Policy':'same-origin',
  'Strict-Transport-Security':'max-age=31536000',
};
const CONTENT_SECURITY_POLICY=[
  "default-src 'none'","base-uri 'none'","object-src 'none'",
  "script-src 'self'","style-src 'self'","img-src 'self' data:",
  "connect-src 'self'","font-src 'self'","frame-ancestors 'none'",
  "form-action 'none'"
].join('; ');

function response(body,status=200,type='text/plain; charset=utf-8',extra={}){
  return new Response(body,{status,headers:{...DEFAULT_HEADERS,...extra,'Content-Type':type}});
}
function error(status){return response(status===403?'Přístup pouze pro oprávněné učitele.':'Nenalezeno.',status);}
function cleanBase(raw){
  if(typeof raw!=='string'||!raw)return null;
  try{
    const u=new URL(raw);
    if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||!u.pathname.endsWith('/'))return null;
    return u.href;
  }catch{return null;}
}
function registeredTeacher(email,env){
  if(typeof email!=='string'||typeof env.AUTHORIZED_TEACHERS!=='string')return false;
  const identity=email.trim().toLowerCase();
  if(!/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(identity))return false;
  const allowed=env.AUTHORIZED_TEACHERS.split(',').map(v=>v.trim().toLowerCase()).filter(Boolean);
  return allowed.length>0&&allowed.includes(identity);
}
async function authorize(ctx,env){
  // ctx.access is set by Cloudflare only after an Access-authenticated direct Worker invocation.
  // Never accept CF-Access-Jwt-Assertion, CF_Authorization or client supplied email headers.
  if(!ctx?.access||typeof ctx.access.getIdentity!=='function')return false;
  try{
    const user=await ctx.access.getIdentity();
    return registeredTeacher(user?.email,env);
  }catch{return false;}
}
function safeTopics(){
  if(!Array.isArray(manifest.topics))return [];
  return manifest.topics.filter(t=>
    t&&SKILLS.has(t.skill)&&ID_RE.test(t.id)&&ID_RE.test(t.slug)&&
    PATH_RE.test(t.cardPath)&&t.cardPath===t.skill+'/'+t.slug+'/'&&
    Array.isArray(t.variants)&&t.variants.length>0&&t.variants.length<=24&&
    typeof t.shortCode==='string'&&/^[A-HJ-NP-Z2-9]{4}$/.test(t.shortCode)
  ).map(t=>({
    id:t.id,skill:t.skill,slug:t.slug,cardPath:t.cardPath,
    title:t.title,summary:t.summary,status:t.status,version:t.version,
    shortCode:t.shortCode,durationMinutes:t.durationMinutes,
    variants:t.variants,defaultLevel:t.defaultLevel,demo:Boolean(t.demo),
    // Deliberately only metadata. Correct answers and teacher keys never enter this API.
    teacherKeyAvailable:LIVE.has(t.status)&&t.hasTeacherKey===true
  }));
}
async function handle(request,env,ctx){
  if(!await authorize(ctx,env))return error(403);
  const base=cleanBase(env?.STUDENT_BASE_URL);
  if(!base)return response('Chybí bezpečná konfigurace veřejných studentských odkazů.',503);
  const url=new URL(request.url);
  if(request.method!=='GET'&&request.method!=='HEAD')return response('Metoda není povolena.',405,'text/plain; charset=utf-8',{'Allow':'GET, HEAD'});
  const path=url.pathname;
  if(path==='/'||path==='/teacher')return response(null,302,'text/plain; charset=utf-8',{'Location':'/teacher/'});
  let r;
  if(path==='/teacher/'){
    r=response(PAGE,200,'text/html; charset=utf-8',{'Content-Security-Policy':CONTENT_SECURITY_POLICY});
  }else if(path==='/teacher/app.js'){
    r=response(APP,200,'text/javascript; charset=utf-8');
  }else if(path==='/teacher/qr.js'){
    r=response(QR,200,'text/javascript; charset=utf-8');
  }else if(path==='/teacher/styles.css'){
    r=response(CSS,200,'text/css; charset=utf-8');
  }else if(path==='/teacher/api/catalog'){
    r=response(JSON.stringify({
      version:1,environment:manifest.environment,
      releaseStatus:manifest.releaseStatus,studentBase:base,
      topics:safeTopics()
    }),200,'application/json; charset=utf-8');
  }else if(path.startsWith('/teacher/api/key/')){
    let id;
    try{id=decodeURIComponent(path.slice('/teacher/api/key/'.length));}catch{return error(404);}
    if(!ID_RE.test(id))return error(404);
    const topic=safeTopics().find(t=>t.id===id&&t.teacherKeyAvailable);
    if(!topic||typeof env?.TEACHER_KEYS?.get!=='function')return error(404);
    // A private KV namespace is required. Never use a public URL or repo file for keys.
    let html;
    try{html=await env.TEACHER_KEYS.get('lsh:teacher-key:'+topic.id+':'+topic.version);}
    catch{return response('Úložiště klíčů není dostupné.',503);}
    if(typeof html!=='string'||!html)return error(404);
    r=response(html,200,'application/octet-stream',{'Content-Disposition':'attachment; filename="'+topic.slug+'-teacher-key.html"'});
  }else return error(404);
  // HEAD must not expose bodies, while retaining the same auth and headers.
  if(request.method==='HEAD')return new Response(null,{status:r.status,headers:r.headers});
  return r;
}
export default {fetch:handle};
export const _test={authorize,registeredTeacher,cleanBase,safeTopics,handle,CONTENT_SECURITY_POLICY};
