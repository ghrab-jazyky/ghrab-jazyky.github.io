#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const asset=read('assets/temporary-test-lock.js');
function sandbox(hostname,stored='',hash=''){
 const data=new Map(stored?[['lsh:temporary-test-lock:developer:v1',stored]]:[]);
 const document={
  documentElement:{dataset:{}},body:{},getElementById:()=>null,
  readyState:'loading',addEventListener:()=>{}
 };
 const location={hostname,protocol:hostname==='ghrab-jazyky.github.io'?'https:':'http:',
  hash,pathname:'/language-skills-hub/index.html',search:'?skill=cteni'};
 let cleanedUrl=null,hashListener=null;
 const window={
  location,document,history:{state:null,replaceState:(_state,_title,url)=>{
   cleanedUrl=url;location.hash='';
  }},
  addEventListener:(event,listener)=>{
   if(event==='hashchange')hashListener=listener;
  },
  localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}
 };
 vm.runInNewContext(asset,{window},{timeout:1000});
 return {api:window.LSHTemporaryTestLock,document,data,location,
  triggerHashChange:hash=>{location.hash=hash;hashListener?.()},
  get cleanedUrl(){return cleanedUrl}};
}
test('public production defaults locked; local developer exception is convenience only',()=>{
 assert.equal(sandbox('ghrab-jazyky.github.io').api.isLocked(),true);
 assert.equal(sandbox('ghrab-jazyky.github.io','enabled').api.isLocked(),false);
 assert.equal(sandbox('ghrab-jazyky.github.io','disabled').api.isLocked(),true);
 assert.equal(sandbox('ghrab-jazyky.github.io','true').api.isLocked(),true);
});
test('one-click preview link enables only this browser and cleans the address',()=>{
 const enabled=sandbox('ghrab-jazyky.github.io','','#lsh-test-preview=on');
 assert.equal(enabled.api.isLocked(),false);
 assert.equal(enabled.data.get('lsh:temporary-test-lock:developer:v1'),'enabled');
 assert.equal(enabled.location.hash,'');
 assert.equal(enabled.cleanedUrl,'/language-skills-hub/index.html?skill=cteni');
 const disabled=sandbox('ghrab-jazyky.github.io','enabled','#lsh-test-preview=off');
 assert.equal(disabled.api.isLocked(),true);
 assert.equal(disabled.data.has('lsh:temporary-test-lock:developer:v1'),false);
 assert.equal(disabled.location.hash,'');
});
test('a pasted preview link also works on an already-open catalog',()=>{
 const s=sandbox('ghrab-jazyky.github.io');
 assert.equal(s.api.isLocked(),true);
 s.triggerHashChange('#lsh-test-preview=on');
 assert.equal(s.api.isLocked(),false);
 assert.equal(s.location.hash,'');
 s.triggerHashChange('#lsh-test-preview=off');
 assert.equal(s.api.isLocked(),true);
 assert.equal(s.location.hash,'');
});
test('loopback development remains open for legacy browser regressions',()=>{
 assert.equal(sandbox('127.0.0.1').api.isLocked(),false);
 assert.equal(sandbox('localhost').api.isLocked(),false);
});
test('direct teacher pages are guarded; local preview is allowed',()=>{
 const s=sandbox('localhost');
 assert.equal(s.api.guardTeacherPage('../../index.html?skill=cteni'),true);
 assert.equal(s.document.documentElement.dataset.lshTemporaryTestAccess,'developer');
 for(const lab of ['reading','listening']){
  const html=read('self-check/'+lab+'/teacher.html');
  const src=read('self-check/'+lab+'/'+lab+'-teacher.js');
  assert.match(html,/data-lsh-temporary-test-page="teacher"/);
  assert.match(html,/temporary-test-lock\.css/);
  assert.ok(html.indexOf('temporary-test-lock.js')<html.indexOf(lab+'-teacher.js'));
  assert.match(src,/LSHTemporaryTestLock\?\.guardTeacherPage/);
 }
});
test('catalog TEST stays visible but clicking locked TEST shows notice',()=>{
 const html=read('index.html'),hub=read('assets/hub.js');
 assert.match(html,/assets\/temporary-test-lock\.js/);
 assert.match(html,/assets\/temporary-test-lock\.css/);
 assert.match(hub,/one\('a','action test','TEST'\)/);
 assert.match(hub,/LSHTemporaryTestLock\?\.isLocked\(\)/);
 assert.match(hub,/event\.preventDefault\(\);window\.LSHTemporaryTestLock\.showNotice\(\)/);
 assert.match(asset,/Milá kolegyně, milý kolego/);
 assert.match(asset,/Daniel/);
});
test('practice answers remain accessible; TEST keys disabled for normal users',()=>{
 const src=read('self-check/practice-answers/teacher-key.js');
 const html=read('self-check/practice-answers/teacher.html');
 assert.match(src,/testOption\.disabled=true/);
 assert.match(src,/locked\?'practice'/);
 assert.match(src,/mode==='test'&&host\.LSHTemporaryTestLock\?\.isLocked\(\)/);
 assert.match(html,/temporary-test-lock\.js/);
});
test('student pages and static assessment policy remain unchanged',()=>{
 for(const p of ['self-check/reading/index.html','self-check/listening/student.html']){
  assert.doesNotMatch(read(p),/LSHTemporaryTestLock|temporary-test-lock\.(?:css|js)/,p);
 }
 const policy=JSON.parse(read('data/test-mode-policy.json'));
 assert.equal(policy.testUiEnabled,true);
 assert.equal(policy.selfCheckEnabled,true);
 assert.equal(policy.backendEnabled,false);
 assert.equal(policy.gradedTestsEnabled,false);
});
