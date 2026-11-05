'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {verify,FILES,sha}=require('../tools/e4g-collection-gate.cjs');
const SOURCE='<!doctype html><script>const DATA={"synthetic":true};</script>';
function sandbox(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'e4g-gate-'));
 const status={status:'COMPLETE_NEEDS_MANUAL_VALIDATION',collection_ready:true,
   submitted_cases:80,submitted_answers:528,issues:[],release_decision:'NO_GO'};
 const ready={kind:'LSH_E4G_COLLECTION_READY_V1',status:status.status,
   required_cases:80,required_answers:528,release_decision:'NO_GO',
   source_sha256:sha(SOURCE),files_sha256:{}};
 for(const name of FILES){
  const data=Buffer.from('synthetic '+name);
  fs.writeFileSync(path.join(dir,name),data);
  ready.files_sha256[name]=sha(data);
 }
 function write(){
  fs.writeFileSync(path.join(dir,'COLLECTION_STATUS.json'),JSON.stringify(status));
  fs.writeFileSync(path.join(dir,'COLLECTION_READY.json'),JSON.stringify(ready));
 }
 write();
 return{dir,status,ready,write,close:()=>fs.rmSync(dir,{recursive:true,force:true})};
}
test('Verified synthetic collection allows ONLY local scoring, never a release',()=>{
 const x=sandbox();try{
  const r=verify(x.dir,SOURCE);
  assert.equal(r.verified,true);assert.equal(r.checkedFiles,5);
  assert.equal(r.requiredCases,80);assert.equal(r.requiredAnswers,528);
  assert.equal(r.releaseDecision,'NO_GO');
 }finally{x.close();}
});
test('No ready marker blocks scoring even with all CSV files available',()=>{
 const x=sandbox();try{
  fs.unlinkSync(path.join(x.dir,'COLLECTION_READY.json'));
  assert.throws(()=>verify(x.dir,SOURCE),/incomplete or invalid/);
 }finally{x.close();}
});
test('Partial collection and incorrect case count are rejected',()=>{
 const x=sandbox();try{
  x.status.status='INCOMPLETE';x.status.collection_ready=false;x.status.submitted_cases=79;x.write();
  assert.throws(()=>verify(x.dir,SOURCE),/80-case/);
 }finally{x.close();}
});
test('Collection with a recorded error cannot be scored',()=>{
 const x=sandbox();try{
  x.status.issues.push({code:'CROSS_MODE_ALIAS'});
  x.write();assert.throws(()=>verify(x.dir,SOURCE),/80-case/);
 }finally{x.close();}
});
test('Source HTML mismatch rejects a copied ready marker',()=>{
 const x=sandbox();try{assert.throws(()=>verify(x.dir,SOURCE+' altered'),/fingerprint/);}finally{x.close();}
});
test('Any altered CSV or QA notes are rejected by SHA-256',()=>{
 const x=sandbox();try{
  fs.appendFileSync(path.join(x.dir,'RESPONSES_WITH_TEXT.csv'),'\nA');
  assert.throws(()=>verify(x.dir,SOURCE),/changed after verification/);
 }finally{x.close();}
});
test('A missing declaration or extra declared file cannot pass',()=>{
 const x=sandbox();try{
  delete x.ready.files_sha256['ASSESSOR_DECLARATIONS.csv'];x.write();
  assert.throws(()=>verify(x.dir,SOURCE),/exactly/);
  x.ready.files_sha256['ASSESSOR_DECLARATIONS.csv']=sha(fs.readFileSync(path.join(x.dir,'ASSESSOR_DECLARATIONS.csv')));
  x.ready.files_sha256['unexpected.txt']='0'.repeat(64);x.write();
  assert.throws(()=>verify(x.dir,SOURCE),/exactly/);
 }finally{x.close();}
});
test('Corrupted ready marker, changed release decision and nonexisting source fail',()=>{
 const x=sandbox();try{
  x.ready.release_decision='GO';x.write();
  assert.throws(()=>verify(x.dir,SOURCE),/80-case/);
  x.ready.release_decision='NO_GO';x.write();
  fs.unlinkSync(path.join(x.dir,'manifest.json'));
  assert.throws(()=>verify(x.dir,SOURCE),/ENOENT/);
 }finally{x.close();}
});
