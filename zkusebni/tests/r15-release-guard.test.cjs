#!/usr/bin/env node
/* R15 static fail-closed regression: no publication, no teacher keys. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const STAGE=path.resolve(__dirname,'..'),tool=path.join(STAGE,'tools');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const run=(name,d)=>execFileSync(process.execPath,[path.join(tool,name),d],
 {encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
test('R15 preserves 29 cards, 642 variants, 14 manual gates and unconditional classified NO-GO',
 {timeout:240000},()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r15-static-')),out=path.join(tmp,'review');
 try{
  assert.match(run('r10-unified-review-bundle.cjs',out),/PASS R10/);
  assert.match(run('r11-review-matrix.cjs',out),/PASS R11/);
  assert.match(run('r12-content-triage.cjs',out),/PASS R12/);
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'R10_REVIEW_MANIFEST.json')));
  const originals=new Map(manifest.entries.map(e=>[e.relative,hash(fs.readFileSync(path.join(out,e.relative)))]));
  assert.match(run('r15-release-guard.cjs',out),/PASS R15/);
  const report=JSON.parse(fs.readFileSync(path.join(out,'R15_RELEASE_GATES.json'),'utf8'));
  assert.equal(report.kind,'R15_RELEASE_GUARD_ONLY');
  assert.equal(report.topics,29);assert.equal(report.variants,642);
  for(const key of ['teacherApproval','approvedForRelease','published','testModeReady',
   'classifiedTestingAllowed','privateKeysBundled','privateReadingKeysComparedInThisPublicCI',
   'manualDeviceTestingCompleted','mediaVerifiedAtSchool','manualSignOff'])
   assert.equal(report[key],false,'Unsafe release state: '+key);
  for(const [file,expected] of originals)
   assert.equal(hash(fs.readFileSync(path.join(out,file))),expected,'Source card changed: '+file);
  const html=fs.readFileSync(path.join(out,'release-check.html'),'utf8');
  assert.match(html,/Klasifikované testování: NO-GO/);
  assert.match(html,/noindex,nofollow/);
  assert.doesNotMatch(html,/@@DATA@@|<script\s+src=/);
  assert.equal((html.match(/"id":"(?:convo_r8|reading_r7|listening_c1|matthew|peaky|harrison|peaky_age|win|android|iphone|ipad|offline|privacy|leadership)"/g)||[]).length,14);
  assert.ok(fs.readFileSync(path.join(out,'index.html'),'utf8').includes('href="release-check.html"'));
  assert.equal(fs.readFileSync(path.join(out,'R15_UAT_CEKLIST.md'),'utf8').split('\n').filter(x=>x.startsWith('- [ ] ')).length,14);
  const bad=JSON.parse(fs.readFileSync(path.join(out,'R12_CONTENT_TRIAGE.json'),'utf8'));
  const originalBadFile=fs.readFileSync(path.join(out,'R12_CONTENT_TRIAGE.json'));
  bad.sourceBundleId='0'.repeat(64);
  fs.writeFileSync(path.join(out,'R12_CONTENT_TRIAGE.json'),JSON.stringify(bad));
  assert.throws(()=>run('r15-release-guard.cjs',out),/Review\/triage mismatch/);
  fs.writeFileSync(path.join(out,'R12_CONTENT_TRIAGE.json'),originalBadFile);
  console.log('PASS R15 no-go, input hashes, source mismatch guard and 14 manual UAT steps');
 }finally{fs.rmSync(tmp,{recursive:true,force:true,maxRetries:3,retryDelay:100})}
});
test('R15 rejects writes inside the public repository',{timeout:10000},()=>{
 const dest=path.join(STAGE,'r15-must-not-exist');
 assert.equal(fs.existsSync(dest),false);
 assert.throws(()=>run('r15-release-guard.cjs',dest));
 assert.equal(fs.existsSync(dest),false);
});
