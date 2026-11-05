'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const tools=path.resolve(__dirname,'../tools');
const moduleFiles={css:fs.readFileSync(path.join(tools,'reading-nav-v2_2.css'),'utf8'),
 js:fs.readFileSync(path.join(tools,'reading-nav-v2_2.js'),'utf8')};
const {review}=require('../tools/reading-nav-integrity.cjs');
const SOURCE=path.join(__dirname,'fixtures','e4d-nav-synthetic.html');
const original=fs.readFileSync(SOURCE,'utf8');
function gen(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'e4d-integrity-')),target=path.join(dir,'patched.html');
 const r=cp.spawnSync('python3',[path.join(tools,'patch_nav.py'),SOURCE,target],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 return {target,dir,patched:fs.readFileSync(target,'utf8')};
}
test('Exact patch preserved original student content, data and markup',()=>{
 const x=gen();try{
  const result=review(original,x.patched,moduleFiles.css,moduleFiles.js);
  assert.equal(result.counts.failed,0,JSON.stringify(result.results));
  assert.equal(result.releaseDecision,'NO_GO');
  assert.notEqual(result.originalSHA256,result.patchedSHA256);
  assert.equal(fs.readFileSync(SOURCE,'utf8'),original);
 }finally{fs.rmSync(x.dir,{recursive:true,force:true});}
});
test('Changing even one original question after applying patch is blocked',()=>{
 const x=gen();try{
  const tampered=x.patched.replace('Synthetic question','Different question');
  assert.notEqual(tampered,x.patched);
  const result=review(original,tampered,moduleFiles.css,moduleFiles.js);
  assert.ok(result.counts.failed>=1);
  assert.equal(result.results.find(v=>v.id==='canonical-patch-byte-exact').status,'FAIL');
 }finally{fs.rmSync(x.dir,{recursive:true,force:true});}
});
test('Absence of navigation module and duplicate patch are blocked',()=>{
 const x=gen();try{
  const absent=review(original,original,moduleFiles.css,moduleFiles.js);
  assert.ok(absent.counts.failed>0);
  const duplicate=review(original,x.patched+x.patched,moduleFiles.css,moduleFiles.js);
  assert.ok(duplicate.counts.failed>0);
 }finally{fs.rmSync(x.dir,{recursive:true,force:true});}
});
test('Runtime CLI returns 0 for exact patch, 1 for tamper',()=>{
 const x=gen(),cmd=path.join(tools,'reading-nav-integrity.cjs');
 try{
  let r=cp.spawnSync(process.execPath,[cmd,SOURCE,x.target],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const report=JSON.parse(r.stdout);
  assert.equal(report.counts.failed,0);
  fs.writeFileSync(x.target,x.patched.replace('Synthetic question','Other question'));
  r=cp.spawnSync(process.execPath,[cmd,SOURCE,x.target],{encoding:'utf8'});
  assert.equal(r.status,1,'Tampering should fail source-to-candidate verification');
 }finally{fs.rmSync(x.dir,{recursive:true,force:true});}
});
