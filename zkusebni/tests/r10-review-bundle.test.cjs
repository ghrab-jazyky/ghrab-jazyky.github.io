#!/usr/bin/env node
/* R10: completeness, offline bundle integrity and absolute NO-PUBLISH gates. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const stage=path.resolve(__dirname,'..'),gen=path.join(stage,'tools/r10-unified-review-bundle.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const protectedPaths=['data/reference-pilots.json','data/unification-tracker.json',
 'data/claude-audit-queue.json','nahledy/cteni/email-friend/index.html',
 'nahledy/cteni/instant-messages/index.html','nahledy/poslech/harrison-ford/index.html',
 'nahledy/poslech/peaky-blinders/index.html'];
const original=new Map(protectedPaths.map(p=>[p,sha(fs.readFileSync(path.join(stage,p)))]));
test('R10: 29 cards, 25 candidates and 4 original pilots; portable but not approved',{timeout:240000},()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r10-audit-'));
 try{
  const out=path.join(tmp,'bundle');
  assert.match(execFileSync(process.execPath,[gen,out],{encoding:'utf8',timeout:180000}),
   /PASS R10 unified offline review: 29 cards/);
  const m=JSON.parse(fs.readFileSync(path.join(out,'R10_REVIEW_MANIFEST.json'),'utf8'));
  assert.equal(m.kind,'R10_UNIFIED_OFFLINE_REVIEW_ONLY');
  assert.equal(m.sourceStatus,'PILOT_NOT_APPROVED');
  for(const field of ['teacherApproval','approvedForRelease','published','testModeReady','privateTeacherKeysBundled'])
   assert.equal(m[field],false,'Invalid approval state '+field);
  assert.equal(m.catalogSize,29);assert.equal(m.entries.length,29);
  assert.deepEqual(m.counts,{konverzace:21,cteni:5,poslech:3});
  assert.deepEqual(m.tiers,{R8:21,READING_R7:2,LISTENING_R7:2,CURRENT_PILOT:4});
  assert.equal(new Set(m.entries.map(x=>x.id)).size,29);
  for(const e of m.entries){
   assert.equal(e.teacherApproval,false);assert.equal(e.published,false);
   assert.match(e.relative,/^(konverzace|cteni|poslech)\/[a-z0-9-]+\/index\.html$/);
   const bytes=fs.readFileSync(path.join(out,e.relative));
   assert.equal(sha(bytes),e.sha256,'File checksum mismatch: '+e.id);
   assert.equal(bytes.length,e.bytes);assert.ok(bytes.length>5000);
   if(e.sourceTier==='READING_R7')assert.equal(e.keySynchronizationNeeded,true);
   if(e.skill==='poslech')assert.equal(e.mediaValidationNeeded,true);
   if(e.skill==='konverzace'){
    const html=bytes.toString('utf8');
    for(const asset of Object.keys(m.assets)){
     assert.ok(html.includes('../../'+asset),'Missing asset reference '+e.id+'/'+asset);
     assert.ok(fs.existsSync(path.join(out,asset)),'Missing file '+asset);
    }
   }
  }
  for(const [file,checksum] of Object.entries(m.assets))
   assert.equal(sha(fs.readFileSync(path.join(out,file))),checksum);
  const index=fs.readFileSync(path.join(out,'index.html'),'utf8');
  assert.match(index,/NEPUBLIKOVAT/);
  assert.match(index,/noindex,nofollow/);
  assert.equal((index.match(/<article class="item"/g)||[]).length,29);
  assert.equal((index.match(/\?practice=1">Otevřít kartu k revizi/g)||[]).length,29);
  const checklist=fs.readFileSync(path.join(out,'REVIEW_CHECKLIST.md'),'utf8');
  assert.equal(checklist.split('\n').filter(l=>l.startsWith('- [ ] ')&&/\((cl|rl|ll)-/.test(l)).length,29);
  assert.match(checklist,/SOUKROM/);
  for(const [file,hash] of original)
   assert.equal(sha(fs.readFileSync(path.join(stage,file))),hash,'Modified protected source: '+file);
  console.log('PASS all 29 review files, five assets, source immutability and no approval');
 }finally{fs.rmSync(tmp,{recursive:true,force:true,maxRetries:3,retryDelay:100})}
});
test('R10 refuses to write into public repository',{timeout:10000},()=>{
 const dest=path.join(stage,'r10-must-not-exist');
 assert.equal(fs.existsSync(dest),false);
 assert.throws(()=>execFileSync(process.execPath,[gen,dest],{timeout:10000,stdio:['ignore','pipe','pipe']}));
 assert.equal(fs.existsSync(dest),false);
});
