#!/usr/bin/env node
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const {once}=require('node:events');
const {answer}=require('./server.cjs');

test('R26 local preview serves original catalog and draft Reading/Listening only over loopback',async t=>{
 const server=http.createServer(answer);
 server.listen(0,'127.0.0.1');
 await once(server,'listening');
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const base='http://127.0.0.1:'+server.address().port;
 for(const [route,mime] of [
  ['/language-skills-hub/','text/html'],
  ['/language-skills-hub/index.html','text/html'],
  ['/language-skills-hub/self-check/reading/index.html','text/html'],
  ['/language-skills-hub/self-check/reading/reading.js','text/javascript'],
  ['/language-skills-hub/self-check/listening/student.html','text/html'],
  ['/language-skills-hub/self-check/listening/teacher.html','text/html'],
  ['/language-skills-hub/self-check/results/result-core.js','text/javascript'],
  ['/language-skills-hub/data/cards.json','application/json']
 ]){
  const response=await fetch(base+route);
  assert.equal(response.status,200,route);
  assert.match(response.headers.get('content-type'),new RegExp('^'+mime),route);
  assert.equal(response.headers.get('cache-control'),'no-store',route);
  assert.equal(response.headers.get('x-content-type-options'),'nosniff',route);
  const body=await response.text();
  assert.ok(body.length>100,route+' empty');
  if(route.endsWith('data/cards.json')){
   const data=JSON.parse(body);
   assert.equal(data.entries.length,29);
   assert.equal(data.gradedTestsEnabled,false);
  }
 }
 const head=await fetch(base+'/language-skills-hub/',{method:'HEAD'});
 assert.equal(head.status,200);
 assert.equal((await head.text()).length,0);
 const denied=await fetch(base+'/language-skills-hub/',{method:'POST'});
 assert.equal(denied.status,405);
 assert.equal(denied.headers.get('allow'),'GET, HEAD');
 for(const route of ['/.git/config','/README.md','/preview-tools/server.cjs',
  '/language-skills-hub/../../README.md']){
  const response=await fetch(base+route);
  assert.ok([403,404].includes(response.status),'Leaked non-application file '+route);
 }
});
