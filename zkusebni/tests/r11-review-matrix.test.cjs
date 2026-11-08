#!/usr/bin/env node
/* R11 static gates: 642 review rows, isolated R7 bridge copies, no publication. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const STAGE=path.resolve(__dirname,'..');
const R10=path.join(STAGE,'tools/r10-unified-review-bundle.cjs');
const R11=path.join(STAGE,'tools/r11-review-matrix.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const langs=['en','es','de','fr'],levels=['A1','A2','B1','B2','C1','C2'];
test('R11: all 642 source-pinned variants and 4 reversible review-only bridges',{timeout:240000},()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r11-'));
 try{
  const dest=path.join(tmp,'out');
  execFileSync(process.execPath,[R10,dest],{timeout:180000});
  const r10=JSON.parse(fs.readFileSync(path.join(dest,'R10_REVIEW_MANIFEST.json'),'utf8'));
  assert.match(execFileSync(process.execPath,[R11,dest],{encoding:'utf8',timeout:180000}),/PASS R11 matrix: 642 variants/);
  const r11=JSON.parse(fs.readFileSync(path.join(dest,'R11_REVIEW_MATRIX.json'),'utf8'));
  assert.equal(r11.kind,'LSH_R11_PRELIMINARY_REVIEW_NOT_APPROVAL');
  assert.equal(r11.variantCount,642);assert.equal(r11.topicCount,29);
  assert.equal(r11.bundleId.length,64);
  assert.deepEqual(r11.counts,{konverzace:504,cteni:120,poslech:18});
  assert.deepEqual(r11.statuses,['todo','reviewed','issue']);
  for(const key of ['teacherApproval','approvedForRelease','published','testModeReady','privateTeacherKeysBundled'])
   assert.equal(r11[key],false,'Review implies approval: '+key);
  const ids=new Set(r11.variants.map(v=>v.id));
  assert.equal(ids.size,642);
  for(const item of r10.entries){
   const v=r11.variants.filter(x=>x.topicId===item.id);
   assert.equal(v.length,item.languageCoverage.length*6,'Missing variant '+item.id);
   for(const lang of item.languageCoverage)for(const level of levels){
    const row=v.find(x=>x.lang===lang&&x.level===level);
    assert.ok(row,'Missing CEFR combination: '+item.id+'/'+lang+'/'+level);
    assert.equal(row.id,item.id+'|'+lang+'|'+level);
    assert.ok(row.href.includes('lang='+lang+'&level='+level+'&zamek=1&practice=1'));
    const original=fs.readFileSync(path.join(dest,item.relative));
    assert.equal(sha(original),item.sha256,'Protected R10 file mutated');
    const link=row.href.split('?')[0];
    assert.ok(fs.existsSync(path.join(dest,link)),'Broken review link '+link);
   }
  }
  assert.equal(r11.reviewOnlyAdapters.length,4);
  const special=new Set(['rl-email-friend','rl-instant-messages','ll-harrison-ford','ll-peaky-no-fighting']);
  for(const copy of r11.reviewOnlyAdapters){
   assert.ok(special.has(copy.id));
   const base=r10.entries.find(e=>e.id===copy.id);
   const protectedBytes=fs.readFileSync(path.join(dest,base.relative));
   const patched=fs.readFileSync(path.join(dest,copy.reviewFile),'utf8');
   const integrated=fs.readFileSync(path.join(STAGE,copy.bridgeSource),'utf8');
   const bridge=integrated.match(/<script>\n\/\* LSH-R5 variant bridge:[\s\S]*?<\/script>\n/g);
   assert.ok(bridge&&bridge.length===1);
   assert.equal(patched.replace(bridge[0],''),protectedBytes.toString('utf8'),'Source data changed in review copy');
   assert.equal(copy.sourceSha256,sha(protectedBytes));
   assert.equal(copy.reviewSha256,sha(Buffer.from(patched)));
  }
  const doc=fs.readFileSync(path.join(dest,'review.html'),'utf8');
  assert.match(doc,/Obsahov&#225; revize 642 variant/);
  assert.match(doc,/NESCHV&#193;LENO/);
  assert.doesNotMatch(doc,/src="https?:|href="https?:/);
  const embedded=doc.match(/<script id="r11-matrix-data" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(embedded,'Inline JSON should be portable under file://');
  assert.deepEqual(JSON.parse(embedded[1]),r11);
  console.log('PASS R11: 642 review rows, 4 reversible R7 bridges, original SHA-256 intact');
 }finally{fs.rmSync(tmp,{recursive:true,force:true,maxRetries:3,retryDelay:100})}
});
test('R11 safety: do not write to public working tree or overwrite state',{timeout:15000},()=>{
 const dest=path.join(STAGE,'r11-public-output-must-not-exist');
 assert.equal(fs.existsSync(dest),false);
 assert.throws(()=>execFileSync(process.execPath,[R11,dest],{timeout:15000,stdio:['ignore','pipe','pipe']}));
 assert.equal(fs.existsSync(dest),false);
});
