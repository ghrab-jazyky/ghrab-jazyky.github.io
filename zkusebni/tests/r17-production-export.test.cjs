#!/usr/bin/env node
/* R17: production candidate is public practice only, source content intact. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const STAGE=path.resolve(__dirname,'..');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function run(script,...args){return execFileSync(process.execPath,[path.join(STAGE,'tools',script),...args],
 {timeout:180000,encoding:'utf8',maxBuffer:8*1024*1024})}
test('R17 public practice: exactly 29 student activities, 642 links, no test keys and no mutation',
 {timeout:240000},()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r17-'));
 const raw=path.join(root,'review'),out=path.join(root,'public');
 try{
  assert.match(run('r10-unified-review-bundle.cjs',raw),/PASS R10/);
  assert.match(run('r11-review-matrix.cjs',raw),/PASS R11/);
  const m=JSON.parse(fs.readFileSync(path.join(raw,'R10_REVIEW_MANIFEST.json'),'utf8'));
  assert.match(run('r17-production-export.cjs',raw,out),/PASS R17 public practice site: 29 cards/);
  const catalog=JSON.parse(fs.readFileSync(path.join(out,'data/cards.json'),'utf8'));
  assert.equal(catalog.kind,'LSH_PUBLIC_PRACTICE_R17');
  assert.equal(catalog.mode,'practice');
  assert.equal(catalog.gradedTestsEnabled,false);
  assert.equal(catalog.entries.length,29);
  assert.equal(catalog.entries.filter(e=>e.skill==='konverzace').length,21);
  assert.equal(catalog.entries.filter(e=>e.skill==='cteni').length,5);
  assert.equal(catalog.entries.filter(e=>e.skill==='poslech').length,3);
  const version=JSON.parse(fs.readFileSync(path.join(out,'version.json')));
  assert.equal(version.topicCount,29);
  assert.equal(version.variantCount,642);
  assert.equal(version.gradedTestsEnabled,false);
  let variants=0,bridged=0;
  for(const e of catalog.entries){
   const original=m.entries.find(x=>x.id===e.id);assert.ok(original);
   assert.equal(hash(fs.readFileSync(path.join(out,e.relative))),original.sha256);
   for(const lang of e.languages)for(const lev of e.levels)variants++;
   if(e.lockSource){bridged++;assert.ok(fs.existsSync(path.join(out,e.lockSource)))}
   assert.ok(e.title&&e.title.length>=3);
  }
  assert.equal(variants,642);assert.equal(bridged,4);
  const site=fs.readFileSync(path.join(out,'index.html'),'utf8');
  assert.match(site,/Tři dovednosti/);
  assert.match(site,/29/);
  assert.match(site,/Režim procvičování|určený k procvičování/i);
  assert.doesNotMatch(site,/ZKUŠEBNÍ VERZE|E2\s*\/\s*0\.2\.1/);
  assert.doesNotMatch(site,/<script[^>]*src="https?:/);
  const js=fs.readFileSync(path.join(out,'assets/hub.js'),'utf8');
  assert.match(js,/CLBQRCode\.svg/);
  assert.match(js,/URLSearchParams/);
  assert.ok(fs.statSync(path.join(out,'assets/qr.js')).size>5000);
  assert.equal(fs.readdirSync(out).includes('REVIEW_CHECKLIST.md'),false);
  assert.equal(fs.readdirSync(out).includes('R14_PRIVATE_KEYS.json'),false);
  assert.equal(fs.readdirSync(out).includes('review.html'),false);
  console.log('PASS 29 SHA-pinned practice cards, 642 combinations, 4 R7 adapters, QR and no teacher key exports');
 }finally{fs.rmSync(root,{recursive:true,force:true,maxRetries:3,retryDelay:100})}
});
test('R17 refuses to write into the repository or overwrite any existing destination',{timeout:10000},()=>{
 const dest=path.join(STAGE,'r17-must-not-exist');
 assert.equal(fs.existsSync(dest),false);
 assert.throws(()=>run('r17-production-export.cjs','/tmp',dest));
 assert.equal(fs.existsSync(dest),false);
});
