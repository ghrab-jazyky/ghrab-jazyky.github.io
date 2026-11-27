'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {integrityContent}=require('./reading-content-integrity.cjs');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const raw=fs.readFileSync(path.join(root,'cteni/asteroids/index.html'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const approved='3661b936059d812991fd1ee0b6662d9e817ae74ddd643a81807eaca4c7106bf8';
const originalApproved='59167c05eb80b492300b368fc0a1f45f19c1af6631d4a19c560dae98e0d45bac';
const originalBlob='d0ddfe9aae769eff948ee7cf52092139678b64d3';
const css='<link rel="stylesheet" href="../../self-check/reading/reading-annotations.css">\n';
test('D3/F3: full candidate bytes, exact R12 bytes outside additive bank and manifest parity',()=>{
 assert.equal(sha(raw),approved);
 assert.equal(sha(integrityContent('rl-asteroids',raw)),approved);
 assert.equal(sha(integrityContent('rl-asteroids',raw.toString('utf8'))),approved);
 assert.equal(manifest.contentHashes['rl-asteroids'],approved);
 assert.equal(crypto.createHash('sha1').update('blob '+raw.length+'\0').update(raw).digest('hex'),'bc02c45a471db70a186088015a095318bb72b191');
 const marker='<script type="application/json" id="lsh-smart-feedback-asteroids-v1">';
 const source=raw.toString('utf8');assert.equal(source.split(marker).length,2);
 const start=source.indexOf(marker),end=source.indexOf('</script>\n',start);assert.ok(end>start);
 const baseline=Buffer.from(source.slice(0,start)+source.slice(end+'</script>\n'.length),'utf8');
 assert.equal(sha(baseline),originalApproved);
 assert.equal(crypto.createHash('sha1').update('blob '+baseline.length+'\0').update(baseline).digest('hex'),originalBlob);
});
test('D3: missing, duplicated or changed annotation hooks fail closed',()=>{
 const source=raw.toString('utf8');
 for(const altered of [source.replace(css,''),source.replace(css,css+css),source.replace('reading-practice-annotations.js','unexpected.js')]){
  assert.throws(()=>integrityContent('rl-asteroids',altered));
 }
});
test('D3: arbitrary additional bytes cannot normalize to approved integrity hash',()=>{
 assert.notEqual(sha(integrityContent('rl-asteroids',Buffer.concat([raw,Buffer.from('\n')]))),approved);
 const all=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8')).entries;
 assert.equal(all.length,35);
 for(const e of all){
  const bytes=fs.readFileSync(path.join(root,e.relative));
  assert.equal(sha(integrityContent(e.id,bytes)),sha(bytes),e.id);
  assert.equal(sha(bytes),manifest.contentHashes[e.id],e.id);
 }
});
