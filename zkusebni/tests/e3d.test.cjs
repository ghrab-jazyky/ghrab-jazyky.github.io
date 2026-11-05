'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const child=require('node:child_process');
const base=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const m=JSON.parse(read('manifest.webmanifest'));
const catalog=JSON.parse(read('data/manifest.json'));
const scanner=require('../assets/lsh/v3/qr-scanner.js');
const root='https://ghrab-jazyky.github.io';
const prefix='/zkusebni/';
test('PWA staging-only scope/start/id and real icons',()=>{
 assert.equal(m.id,prefix);assert.equal(m.start_url,prefix);assert.equal(m.scope,prefix);
 assert.equal(m.display,'standalone');
 for(const icon of m.icons){
  const b=fs.readFileSync(path.join(base,icon.src));
  assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(b.readUInt32BE(16),Number.parseInt(icon.sizes,10));
  assert.equal(b.readUInt32BE(20),Number.parseInt(icon.sizes,10));
 }
});
test('E3D JS files pass Node syntax check',()=>{
 for(const p of ['sw.js','assets/lsh/v3/pwa.js','assets/lsh/v3/qr-scanner.js']){
  const r=child.spawnSync(process.execPath,['--check',path.join(base,p)],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
 }
});
test('PWA is only injected into shared staging pages; original cards untouched',()=>{
 for(const p of ['index.html','konverzace/index.html','cteni/index.html','poslech/index.html','k/index.html','slovnicek/index.html','stazeno/index.html']){
  const html=read(p);
  assert.match(html,/rel="manifest"/);
  assert.match(html,/assets\/lsh\/v3\/pwa\.js/);
 }
 const html=read('k/index.html');
 assert.match(html,/id="openScanner"/);
 assert.match(html,/id="scanDialog"/);
 assert.match(html,/qr-scanner\.js/);
});
test('Scanner accepts only canonical, catalogued LSH cards and codes',()=>{
 const entry=catalog.topics.find(t=>t.skill==='konverzace');
 assert.ok(entry);
 const code=entry.shortCode+'-ENB2';
 assert.deepEqual(scanner.scanTarget(code,root,prefix,catalog),{kind:'code',value:code});
 const url=root+prefix+entry.cardPath+'?lang=en&level=B2';
 assert.deepEqual(scanner.scanTarget(url,root,prefix,catalog),{kind:'url',value:url});
 assert.equal(scanner.scanTarget(root+prefix+entry.cardPath+'?lang=en&lang=es&level=B2',root,prefix,catalog),null);
 assert.equal(scanner.scanTarget('https://evil.example/zkusebni/'+entry.cardPath,root,prefix,catalog),null);
 assert.equal(scanner.scanTarget(root+'/konverzace/'+entry.slug+'/',root,prefix,catalog),null);
 assert.equal(scanner.scanTarget(root+prefix+'slovnicek/',root,prefix,catalog),null);
 assert.equal(scanner.scanTarget(root+prefix+entry.cardPath+'?lang=en&level=C3',root,prefix,catalog),null);
 assert.equal(scanner.scanTarget('javascript:alert(1)',root,prefix,catalog),null);
 assert.equal(scanner.scanTarget('nonsense',root,prefix,catalog),null);
});
test('Service worker strictly restricts caching to its scope and GET',()=>{
 const sw=read('sw.js');
 assert.match(sw,/request\.method!=='GET'/);
 assert.match(sw,/url\.origin!==BASE\.origin/);
 assert.match(sw,/url\.pathname\.startsWith\(BASE\.pathname\)/);
 assert.match(sw,/cache\.addAll\(SHELL\.map\(scopedURL\)\)/);
 assert.match(sw,/offline\.html/);
});
test('No external network scripts; no student data transfer',()=>{
 for(const p of ['sw.js','assets/lsh/v3/pwa.js','assets/lsh/v3/qr-scanner.js']){
  const text=read(p);
  assert.doesNotMatch(text,/https?:\/\/(?!ghrab-jazyky)/i);
  assert.doesNotMatch(text,/XMLHttpRequest|sendBeacon|analytics|telemetry/i);
 }
});
