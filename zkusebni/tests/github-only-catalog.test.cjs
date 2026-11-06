'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('data/manifest.json'));
const core=require('../assets/lsh/v2/core.js');
const pages=['index.html','404.html','vyber/index.html','konverzace/index.html',
 'cteni/index.html','poslech/index.html','k/index.html','slovnicek/index.html','stazeno/index.html'];
test('Unified public selector exists, shares one local JS and QR engine and exposes no keys',()=>{
 const doc=read('vyber/index.html');
 assert.match(doc,/data-page="vyber"/);
 assert.match(doc,/id="skillFilter"/);
 assert.match(doc,/id="shareDialog"/);
 assert.match(doc,/id="qrSlot"/);
 assert.match(doc,/id="shareShortCode"/);
 assert.match(doc,/assets\/lsh\/v2\/(app|core|qr)\.js/);
 assert.match(doc,/TECHNICKÝ PILOT RC1/);
 assert.match(doc,/name="robots" content="noindex,nofollow"/);
 assert.match(doc,/Veřejně přístupný katalog/);
 assert.doesNotMatch(doc,/cloudflare|identity|oauth|access\.getIdentity|teacherKeyUrl/i);
});
test('All shell screens link to selector within /zkusebni/ and remain GitHub-only',()=>{
 for(const p of pages){
  const h=read(p);
  const href=(p==='index.html'||p==='404.html')?'vyber/':'../vyber/';
  assert.ok(h.includes('href="'+href+'">Výběr aktivit</a>')||
   h.includes('href="'+href+'" aria-current="page">Výběr aktivit</a>'),
   p+' must link to canonical selector');
  assert.match(h,/name="robots" content="noindex,nofollow"/);
  assert.doesNotMatch(h,/Cloudflare Access/);
 }
 assert.match(read('index.html'),/href="vyber\/">Připravit aktivitu/);
});
test('Catalog remains a truthful pilot with demo hidden in unified selector',()=>{
 core.validateManifest(manifest);
 assert.equal(manifest.environment,'staging');
 assert.equal(manifest.topics.filter(t=>t.skill==='konverzace').length,21);
 assert.equal(manifest.topics.filter(t=>t.skill==='cteni'&&t.demo).length,1);
 assert.ok(manifest.topics.filter(t=>t.skill==='poslech').every(t=>t.status==='PUBLIKOVANO'));
 const js=read('assets/lsh/v2/app.js');
 assert.match(js,/page==='vyber'/);
 assert.match(js,/CORE\.selectCatalogTopics\(m,kind\)/);
 assert.match(js,/const matchesSkill = !selectedSkill/);
 assert.match(js,/normalizeSearch/);
 assert.match(js,/PILOT RC1/);
});
test('Public GitHub manifest categorically rejects teacher-key data or URLs',()=>{
 for(const topic of manifest.topics){
  assert.equal(topic.hasTeacherKey,false);
  assert.equal(topic.teacherKeyUrl,null);
 }
 const bad=JSON.parse(JSON.stringify(manifest));
 const row=bad.topics.find(t=>t.skill==='cteni');
 row.hasTeacherKey=true;
 row.teacherKeyUrl='https://github.com/private/teacher-key.html';
 assert.throws(()=>core.validateManifest(bad),/Public manifest must never contain teacher keys/);
 const blank=JSON.parse(JSON.stringify(manifest));
 blank.topics[0].teacherKeyUrl='https://example.com/private';
 assert.throws(()=>core.validateManifest(blank),/Public manifest must never contain teacher keys/);
});
test('New selector supports offline PWA install without leaving original scope',()=>{
 const sw=read('sw.js');
 assert.match(sw,/'vyber\/'/);
 assert.match(sw,/CACHE_PREFIX\+'2026-11-06-v1'/);
 assert.match(sw,/url\.origin!==BASE\.origin/);
 assert.match(sw,/request\.method!=='GET'/);
 assert.match(read('vyber/index.html'),/assets\/lsh\/v3\/pwa\.js/);
 assert.match(read('vyber/index.html'),/rel="manifest"/);
 assert.match(read('assets/lsh/v2/config.js'),/basePath: '\/zkusebni\/'/);
 assert.ok(read('assets/lsh/v2/config.js').includes("release: '"+manifest.manifestVersion+"'"),'Manifest and shared shell must use the same release version');
});
test('No private teacher key files are included in public tree',()=>{
 const stack=[root];let count=0;
 while(stack.length){
  const dir=stack.pop();
  for(const f of fs.readdirSync(dir,{withFileTypes:true})){
   if(f.name==='node_modules'||f.name==='.git'||f.name==='qa')continue;
   const p=path.join(dir,f.name);
   if(f.isDirectory())stack.push(p);
   else if(f.isFile()){
    count++;
    if(/(?:teacher[-_]?key|ucitel[-_]?sky[-_]?klic|answer[-_]?key|odpovedni[-_]?klic)/i.test(f.name))
      assert.fail('Teacher key must never enter GitHub Pages: '+p);
   }
  }
 }
 assert.ok(count>=60);
});
