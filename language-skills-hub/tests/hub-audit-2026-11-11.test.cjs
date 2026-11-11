#!/usr/bin/env node
'use strict';
// Audit 2026-11-11: regressions for the 2026-11-11 catalog audit (data, timestamps, static pages).
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const attemptCore=require('../self-check/session/attempt-core.js');
const receipts=require('../self-check/results/export-core.js');
const hub=path.resolve(__dirname,'..'),root=path.resolve(hub,'..');
const read=p=>fs.readFileSync(path.resolve(hub,p),'utf8');
function store(){
 const data=new Map();
 return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
}
test('Audit 2026-11-11 status() exposes submittedAt so CSV receipts carry the real submission time',()=>{
 let now=1762850000000;
 const input={skill:'reading',topic:'rl-asteroids',lang:'en',level:'B1',attempt:'classaudit-0123456789abcdef01234567',
  limitMinutes:20,storage:store(),now:()=>now};
 const a=attemptCore.open(input);
 assert.equal(a.status().submittedAt,null);
 a.start();now+=60000;a.finish();
 const state=attemptCore.open(input).status();
 assert.equal(state.submittedAt,now);
 const r=receipts.reading({points:7,maxPoints:10},{topic:'rl-asteroids',language:'en',level:'B1',
  submittedAt:state.submittedAt,interruptionCount:state.incidents.length});
 assert.equal(r.submitted_utc,new Date(now).toISOString());
});
test('Audit 2026-11-11 public catalog texts contain no internal QA notes',()=>{
 const pattern=/opakovan|evidován|zaznamenán|duplicate|duplicad|doppelte|en double/i;
 const i18n=JSON.parse(read('data/catalog-i18n.json'));
 for(const [id,langs] of Object.entries(i18n.entries))
  for(const [lang,t] of Object.entries(langs))
   assert.doesNotMatch(t.title+' '+t.summary,pattern,id+' '+lang);
 for(const e of JSON.parse(read('data/cards.json')).entries)
  assert.doesNotMatch(e.title+' '+e.summary,pattern,e.id);
});
test('Audit 2026-11-11 domain root redirects to the production catalog without scripts',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/http-equiv="refresh" content="0; url=language-skills-hub\/"/);
 assert.match(html,/href="language-skills-hub\/"/);
 assert.doesNotMatch(html,/<script|zkušební|E2/i);
});
test('Audit 2026-11-11 self-check pages no longer put frame-ancestors into a meta CSP',()=>{
 for(const f of ['self-check/reading/index.html','self-check/reading/teacher.html',
  'self-check/listening/student.html','self-check/listening/teacher.html']){
  const html=read(f);
  assert.match(html,/Content-Security-Policy/,f);
  assert.doesNotMatch(html,/frame-ancestors/,f);
 }
});
test('Audit 2026-11-11 timed Reading uses a truthful reload note in every language',()=>{
 const src=read('self-check/reading/reading.js');
 assert.equal((src.match(/^ +submitNoteTimed:'/gm)||[]).length,4);
 assert.match(src,/search\.has\('timer'\)\?ui\.submitNoteTimed:ui\.submitNote/);
 assert.match(read('self-check/reading/index.html'),/id="readingParagraphs" tabindex="0" role="region"/);
 assert.match(read('self-check/listening/teacher.html'),/href="\.\.\/\.\.\/index\.html\?skill=poslech"/);
});
