'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const cp=require('node:child_process');
const {run,MAX_BYTES}=require('../tools/reading-v34-preflight.cjs');
const SHELL='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Test</title><style>body{color:black}</style><script>const words="";</script></head><body><main>Original synthetic test content</main></body></html>';
const find=(r,id)=>r.checks.find(c=>c.id===id);
test('Synthetic standalone HTML passes only objective source checks, never release',()=>{
  const r=run(SHELL,{file:'synthetic.html'});
  assert.equal(r.counts.FAIL,0);
  assert.equal(r.releaseDecision,'NO_GO');
  assert.equal(r.verdict,'STATIC_PRECHECK_ONLY');
  assert.equal(r.validationKind,'STATIC_ONLY');
  assert.equal(r.actualReferenceExecuted,false);
  assert.equal(find(r,'self-contained-assets').status,'PASS');
  assert.equal(find(r,'teacher-teacher-boundary'),undefined);
  assert.equal(find(r,'24-variants').status,'REVIEW');
  assert.equal(find(r,'pedagogical-qa').status,'REVIEW');
  assert.equal(find(r,'dictionary-identity').status,'REVIEW');
  assert.match(r.sha256,/^[0-9a-f]{64}$/);
});
test('External scripts and CSS cannot pass offline single-file structural checks',()=>{
  const html=SHELL.replace('<script>','<script src="https://cdn.example.com/engine.js"></script><script>')
    .replace('<style>','<link rel="stylesheet" href="./reading.css"><style>');
  const r=run(html);
  assert.equal(find(r,'self-contained-assets').status,'FAIL');
  assert.match(find(r,'self-contained-assets').detail,/engine\.js/);
  assert.match(find(r,'self-contained-assets').detail,/reading\.css/);
});
test('In HTML image src relative assets are not silently considered offline complete',()=>{
  const r=run(SHELL.replace('<main>','<main><img src="../cover.png" alt="cover">'));
  assert.equal(find(r,'self-contained-assets').status,'FAIL');
});
test('Data URI image and inline vector style do not trigger external dependencies',()=>{
  const r=run(SHELL.replace('<main>','<main><img alt="test" src="data:image/png;base64,iVBORw0KGgo=">'));
  assert.equal(find(r,'self-contained-assets').status,'PASS');
});
test('Teacher key URL inside student-facing anchor is a release-blocking failure',()=>{
  const r=run(SHELL.replace('<main>','<main><a href="/keys/teacher/secret">Key</a>'));
  assert.equal(find(r,'student-teacher-boundary').status,'FAIL');
});
test('Browser zoom restrictions violate accessible default',()=>{
  const r=run(SHELL.replace('width=device-width,initial-scale=1','width=device-width, maximum-scale=1, user-scalable=no'));
  assert.equal(find(r,'zoom-and-viewport').status,'FAIL');
});
test('Missing HTML shell or charset cannot silently pass',()=>{
  const r=run(SHELL.replace('<!doctype html>','').replace('charset="utf-8"','charset="windows-1250"'));
  assert.equal(find(r,'html-document').status,'FAIL');
  assert.equal(find(r,'utf8').status,'FAIL');
});
test('Contains words from the v3.4 spec but cannot fake working feature PASS',()=>{
  const r=run(SHELL.replace('<main>','<main>reading-lab-vocabulary-backup reading-lab-vocabulary sessionStorage firstAttempt tablist tabpanel evidence topicId</main>'));
  for(const id of ['dictionary-identity','answer-session-isolation','first-attempt','evidence-navigation','reading-tabs'])
    assert.equal(find(r,id).status,'REVIEW',id);
});
test('CLI JSON exit 0 is structural-only; malformed HTML or external asset exits 1',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-e4b-'));
 const file=path.join(dir,'reading.html');
 try{
  fs.writeFileSync(file,SHELL);
  let x=cp.spawnSync(process.execPath,[path.resolve(__dirname,'../tools/reading-v34-preflight.cjs'),file],{encoding:'utf8'});
  assert.equal(x.status,0,x.stderr);
  assert.equal(JSON.parse(x.stdout).releaseDecision,'NO_GO');
  fs.writeFileSync(file,SHELL.replace('<script>','<script src="./outside.js"></script><script>'));
  x=cp.spawnSync(process.execPath,[path.resolve(__dirname,'../tools/reading-v34-preflight.cjs'),file],{encoding:'utf8'});
  assert.equal(x.status,1);
  assert.equal(JSON.parse(x.stdout).releaseDecision,'NO_GO');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('No unbounded or untrusted source file is required by the scanner',()=>{
  assert.ok(MAX_BYTES>1024*1024&&MAX_BYTES<100*1024*1024);
});
