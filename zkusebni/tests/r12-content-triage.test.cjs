#!/usr/bin/env node
/* R12: independent validation of content-triage report and immutable sources. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const STAGE=path.resolve(__dirname,'..');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const exec=(script,out)=>execFileSync(process.execPath,[path.join(STAGE,'tools',script),out],
 {encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
test('R12 642 CEFR data: 80 hidden gaps; 30 decisions; signals do not approve',{timeout:240000},()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r12-test-'));
 const out=path.join(temp,'bundle');
 try{
  assert.match(exec('r10-unified-review-bundle.cjs',out),/PASS R10/);
  assert.match(exec('r11-review-matrix.cjs',out),/PASS R11/);
  const root=fs.readFileSync(path.join(out,'R10_REVIEW_MANIFEST.json'));
  const cards=JSON.parse(root).entries;
  const before=new Map(cards.map(e=>[e.relative,sha(fs.readFileSync(path.join(out,e.relative)))]));
  const log=exec('r12-content-triage.cjs',out);
  assert.match(log,/PASS R12 content triage: 642 variants, 80 verified masks, 30 specific decisions/);
  const d=JSON.parse(fs.readFileSync(path.join(out,'R12_CONTENT_TRIAGE.json'),'utf8'));
  assert.equal(d.kind,'R12_CONTENT_TRIAGE_NOT_PEDAGOGICAL_APPROVAL');
  assert.equal(d.validated.variantCount,642);
  assert.equal(d.validated.readingVariants,120);
  assert.equal(d.validated.verifiedReadingGapMasks,80);
  assert.equal(d.pending.strongDecisions,30);
  assert.equal(d.pending.mediaReviews,3);
  assert.equal(d.pending.reusedPromptSignals,30);
  assert.ok(d.pending.shorterReadingSignals>=10);
  for(const k of ['teacherApproval','approvedForRelease','testModeReady','published','privateTeacherKeysIncluded'])
   assert.equal(d[k],false,'No automatic approval or teacher keys: '+k);
  assert.deepEqual(d.decisions.reduce((a,x)=>(a[x.group]=(a[x.group]||0)+1,a),{}),
   {R8_A1:7,R8_LANGUAGE:5,READING_R7:17,LISTENING_R7:1});
  const map=JSON.parse(fs.readFileSync(path.join(out,'R10_REVIEW_MANIFEST.json'),'utf8'));
  assert.equal(d.reviewManifestSha256,sha(root));
  assert.equal(Object.keys(d.sources).length,29);
  for(const e of cards)assert.equal(d.sources[e.id],e.sha256);
  for(const [file,expected] of before)assert.equal(sha(fs.readFileSync(path.join(out,file))),expected,
   'Audit modified original student card: '+file);
  for(const o of [...d.decisions,...d.mediaReviews,...d.editorialSignals.shortReadings]){
   assert.ok(o.url.includes('?lang=')&&o.url.includes('&level='),'No fixed variant: '+o.url);
   assert.ok(fs.existsSync(path.join(out,o.url.split('?')[0])),'Broken offline review URL: '+o.url);
   assert.ok(o.topicId&&o.language&&o.level);
  }
  const example=d.editorialSignals.shortReadings.find(x=>x.topicId==='rl-can-mistakes'&&x.language==='es'&&x.level==='A1');
  assert.ok(example&&example.wordsPerQuestion<10,'Spanish A1 short text triage unexpectedly changed');
  assert.ok(d.editorialSignals.repeatedPrompts.some(x=>
   x.language==='en'&&x.level==='A1'&&x.examples.some(a=>a.topicId==='cl-zivot-bez-ai')));
  const report=fs.readFileSync(path.join(out,'triage.html'),'utf8');
  assert.match(report,/NEJDE O SCHVÁLENÍ/);
  assert.match(report,/Matice 642 variant/);
  assert.match(report,/80 z 80 úloh/);
  assert.match(report,/noindex,nofollow/);
  assert.equal((report.match(/<section>/g)||[]).length,4);
  assert.doesNotMatch(report,/teacherKeyUrl|privateAnswerKey|studentEmail|apikey/i);
  console.log('PASS R12 exact source checks, 642 variants and actionable review queue; no publication or source edits');
 }finally{fs.rmSync(temp,{recursive:true,force:true,maxRetries:3,retryDelay:100})}
});
test('R12 rejects writing into the public checkout',{timeout:15000},()=>{
 const dest=path.join(STAGE,'temporary-r12-forbidden');
 assert.equal(fs.existsSync(dest),false);
 assert.throws(()=>exec('r12-content-triage.cjs',dest));
 assert.equal(fs.existsSync(dest),false);
});
