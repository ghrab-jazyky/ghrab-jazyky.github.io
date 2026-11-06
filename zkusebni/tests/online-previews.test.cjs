'use strict';
// Original-byte integrity and publicly safe preview routing.
// Publishing an original student HTML here is a public test, never teacher-only access.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const stage=path.resolve(__dirname,'..');
const config=JSON.parse(fs.readFileSync(path.join(stage,'data/preview-provenance.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(stage,'data/manifest.json'),'utf8'));
const allowedFields=['id','skill','file','sha256','bytes'];
const read=f=>fs.readFileSync(path.join(stage,f),'utf8');

test('ONLINE PREVIEW: school GitHub organization, exactly 5 Reading and 3 Listening originals',()=>{
 assert.equal(config.schemaVersion,1);
 assert.equal(config.host,'ghrab-jazyky.github.io');
 assert.equal(config.repo,'ghrab-jazyky/ghrab-jazyky.github.io');
 assert.equal(config.basePath,'/zkusebni/');
 assert.equal(config.visibility,'PUBLIC_TEST_ONLY');
 assert.equal(config.entries.length,8);
 assert.equal(config.entries.filter(e=>e.skill==='cteni').length,5);
 assert.equal(config.entries.filter(e=>e.skill==='poslech').length,3);
 const ids=new Set();
 for(const e of config.entries){
   assert.deepEqual(Object.keys(e).sort(),allowedFields.slice().sort());
   assert.ok(!ids.has(e.id));ids.add(e.id);
   assert.equal(e.file,'nahledy/'+e.skill+'/'+e.id+'/index.html');
   assert.match(e.sha256,/^[0-9a-f]{64}$/);
   assert.equal(typeof e.bytes,'number');
 }
 assert.doesNotMatch(config.repo+'/ '+config.host,/Daniel22-dev/i);
 assert.ok(config.entries.every(e=>!/teacher|ucitel|answer.?key|password|privateRepo|api_token/i.test(e.file)),
   'No confidential teacher/key file path can appear in public preview list');
});

test('ONLINE PREVIEW: the student HTML is byte-identical to its original uploaded ZIP',()=>{
 const hub=read('nahledy/index.html');
 for(const e of config.entries){
   const buffer=fs.readFileSync(path.join(stage,e.file));
   assert.equal(buffer.length,e.bytes,e.id+' bytes must match original ZIP');
   assert.equal(crypto.createHash('sha256').update(buffer).digest('hex'),e.sha256,e.id+' source SHA-256');
   assert.match(buffer.subarray(0,128).toString('utf8'),/^<!doctype html>/i,e.id+' full HTML');
   assert.match(buffer.subarray(-64).toString('utf8'),/<\/html>\s*$/i,e.id+' HTML closes');
   assert.ok(hub.includes('./'+e.skill+'/'+e.id+'/'),e.id+' public TEST hub link');
   assert.equal(manifest.topics.some(t=>t.slug===e.id && t.skill===e.skill),false,
     'Unreviewed '+e.id+' must not enter the approved/shareable student manifest');
 }
 assert.doesNotMatch(hub,/(?:<iframe[^>]+src|teacher.*key.*href)/i);
 assert.match(hub,/TEST – veřejné náhledy/);
 assert.match(hub,/ghrab-jazyky/);
});

test('ONLINE PREVIEW: all three categories link without exposing teacher keys',()=>{
 const home=read('index.html');
 assert.match(home,/href="nahledy\/"/);
 const reading=read('cteni/index.html');
 const listening=read('poslech/index.html');
 for(const e of config.entries){
   const html=e.skill==='cteni'?reading:listening;
   assert.ok(html.includes('../nahledy/'+e.skill+'/'+e.id+'/'),e.id+' linked from skill page');
 }
 for(const html of [reading,listening,home,read('nahledy/index.html')])
   assert.doesNotMatch(html,/(?:teacher_key|teacher-key|ucitelsky-klic)\.html/i);
 const shell=read('sw.js');
 assert.ok(shell.includes("'nahledy/'"),'PWA shell caches test hub landing page');
 assert.equal(/'nahledy\/cteni\//.test(shell),false,'large test Reading payloads are cached on visit, not at install');
 assert.equal(/'nahledy\/poslech\//.test(shell),false,'test Listening media should not be precached at install');
});

test('ONLINE PREVIEW: forbid unexpected private key files or non-manifest HTML in the preview tree',()=>{
 const allowed=new Set(config.entries.map(e=>path.normalize(e.file)));
 allowed.add(path.normalize('nahledy/index.html'));
 const root=path.join(stage,'nahledy');
 const walk=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>{
   const absolute=path.join(dir,x.name);
   return x.isDirectory()?walk(absolute):[path.normalize(path.relative(stage,absolute))];
 });
 const found=walk(root).sort();
 assert.deepEqual(found,[...allowed].sort());
});
