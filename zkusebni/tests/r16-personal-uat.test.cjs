#!/usr/bin/env node
/* R16 static manual-UAT handoff: 642 safe links, no key leaks or source edits. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const stage=path.resolve(__dirname,'..');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const run=(name,out)=>execFileSync(process.execPath,[path.join(stage,'tools',name),out],
 {encoding:'utf8',timeout:180000});
test('R16: all 29 topics and 642 links available from one local start page',{timeout:240000},()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r16-test-'));
 const out=path.join(temp,'bundle');
 try{
  for(const name of ['r10-unified-review-bundle.cjs','r11-review-matrix.cjs',
   'r12-content-triage.cjs','r15-release-guard.cjs'])run(name,out);
  const before=JSON.parse(fs.readFileSync(path.join(out,'R10_REVIEW_MANIFEST.json')));
  const hashes=new Map(before.entries.map(e=>[e.relative,digest(fs.readFileSync(path.join(out,e.relative)))]));
  assert.match(run('r16-personal-uat.cjs',out),/PASS R16: one offline launchpad/);
  const r=JSON.parse(fs.readFileSync(path.join(out,'R16_PERSONAL_UAT_MANIFEST.json'),'utf8'));
  assert.equal(r.topicCount,29);assert.equal(r.variantCount,642);
  assert.equal(r.readyForPersonalUAT,true);
  for(const field of ['teacherApproval','approvedForRelease','classifiedTestingAllowed',
   'published','productionDeployed','privateKeysBundled'])assert.equal(r[field],false,field);
  assert.equal(Object.keys(r.originalCardHashes).length,29);
  for(const e of before.entries)assert.equal(digest(fs.readFileSync(path.join(out,e.relative))),
   hashes.get(e.relative),'R16 mutated student HTML');
  const html=fs.readFileSync(path.join(out,'start-test.html'),'utf8');
  assert.match(html,/Začni testovat všech 29 karet/);
  assert.match(html,/POUZE K TESTOVÁNÍ A PROCVIČOVÁNÍ/);
  assert.doesNotMatch(html,/__LSH_DATA__|<script[^>]+src=/);
  assert.ok(html.includes('cl-umela-inteligence|en|A1'));
  assert.ok(html.includes('r11/variant-copies/rl-email-friend.html?lang=fr'));
  assert.ok(fs.readFileSync(path.join(out,'index.html'),'utf8').includes('href="start-test.html"'));
  const guide=fs.readFileSync(path.join(out,'ZACIT_TESTOVAT.md'),'utf8');
  assert.match(guide,/ROZBAL/);assert.match(guide,/NO-GO/);
  console.log('PASS R16 launch, 29 immutable cards, 642 links, unapproved gates');
 }finally{fs.rmSync(temp,{recursive:true,force:true,maxRetries:3,retryDelay:80})}
});
test('R16 rejects generation directly inside public Pages checkout',{timeout:10000},()=>{
 const dest=path.join(stage,'never-r16-here');
 assert.equal(fs.existsSync(dest),false);
 assert.throws(()=>run('r16-personal-uat.cjs',dest));
 assert.equal(fs.existsSync(dest),false);
});
