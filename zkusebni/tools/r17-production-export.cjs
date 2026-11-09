#!/usr/bin/env node
/* R17 production release export. PUBLIC PRACTICE ONLY – no answers separated
 * for graded testing. Generates a standalone static site in an isolated
 * directory. Never writes into the repository or updates GitHub refs.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict');
const STAGE=path.resolve(__dirname,'..'),REPO=path.resolve(STAGE,'..');
const source=process.argv[2]&&path.resolve(process.argv[2]);
const out=process.argv[3]&&path.resolve(process.argv[3]);
assert.ok(source&&out,'Usage: node zkusebni/tools/r17-production-export.cjs <r11-build> <empty-export-dir>');
assert.ok(!out.startsWith(REPO+path.sep)&&out!==REPO,'No public release files inside source checkout');
assert.ok(source!==out&&!out.startsWith(source+path.sep),'Source/output cannot overlap');
assert.ok(fs.existsSync(source)&&!fs.existsSync(out),'Build destination must not already exist');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const read=p=>fs.readFileSync(path.join(source,p));
const json=p=>JSON.parse(read(p));
const m=json('R10_REVIEW_MANIFEST.json');
const r=json('R11_REVIEW_MATRIX.json');
const sourceCatalog=JSON.parse(fs.readFileSync(path.join(STAGE,'data/reference-pilots.json'),'utf8'));
const originalById=new Map(sourceCatalog.entries.map(e=>[e.id,e]));
assert.equal(sourceCatalog.approvedForTeaching,false,'Source metadata changed; review release policy');
assert.deepEqual(m.counts,{konverzace:21,cteni:5,poslech:3});
assert.equal(m.catalogSize,29);
assert.equal(r.variantCount,642);
assert.equal(r.variants.length,642);
assert.equal(m.privateTeacherKeysBundled,false);
assert.equal(r.privateTeacherKeysBundled,false);
const eligibleSkills=new Set(['konverzace','cteni','poslech']);
const languages=['en','es','de','fr'],levels=['A1','A2','B1','B2','C1','C2'];
const allowed=v=>/^(konverzace|cteni|poslech)\/[a-z0-9-]+\/index\.html$/.test(v);
function put(relative,bytes){
 assert.ok(!relative.startsWith('/')&&!relative.includes('..')&&!relative.includes('\\'));
 const dest=path.resolve(out,relative);assert.ok(dest.startsWith(out+path.sep));
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,bytes,{flag:'wx'});
}
const entries=[],covered=new Set(),proof={};
for(const e of m.entries){
 assert.ok(!covered.has(e.id),'Duplicate topic');covered.add(e.id);
 assert.ok(eligibleSkills.has(e.skill)&&allowed(e.relative));
 const original=originalById.get(e.id);assert.ok(original);
 assert.equal(original.skill,e.skill);
 assert.equal(original.title,e.title);
 const bytes=read(e.relative);
 assert.equal(hash(bytes),e.sha256,'Source card checksum mismatch '+e.id);
 put(e.relative,bytes);
 proof[e.id]=e.sha256;
 const adapter=r.reviewOnlyAdapters.find(x=>x.id===e.id);
 let lockSource=null;
 if(adapter){
  lockSource=adapter.reviewFile;
  assert.match(lockSource,/^r11\/variant-copies\/(?:rl|ll)-[a-z0-9-]+\.html$/);
  const adapterBytes=read(lockSource);
  assert.ok(adapterBytes.length>=bytes.length,'Shortened adapter unexpected');
  put(lockSource,adapterBytes);
 }
 assert.ok(e.languageCoverage.length>0&&e.languageCoverage.every(x=>languages.includes(x)));
 assert.deepEqual(e.cefrLevels,levels);
 entries.push({id:e.id,skill:e.skill,title:e.title,summary:original.summary||'',
  languages:e.languageCoverage,levels:e.cefrLevels,relative:e.relative,lockSource});
}
assert.equal(covered.size,29);
assert.equal(r.reviewOnlyAdapters.length,4);
const required=[
 'assets/lsh/v2/lock.js',
 'assets/lsh/v3/card-bridge.css',
 'assets/lsh/v3/model.js',
 'assets/lsh/v3/store.js',
 'assets/lsh/v3/card-bridge.js'
];
for(const asset of required)put(asset,read(asset));
for(const e of entries.filter(x=>x.skill==='konverzace')){
 const html=read(e.relative).toString('utf8');
 for(const asset of required){
  assert.ok(html.includes('../../'+asset),'Missing runtime reference '+e.id+'/'+asset);
 }
}
put('assets/qr.js',fs.readFileSync(path.join(STAGE,'assets/lsh/v2/qr.js')));
put('assets/hub.css',fs.readFileSync(path.join(STAGE,'assets/lsh/r17/hub.css')));
put('assets/hub.js',fs.readFileSync(path.join(STAGE,'assets/lsh/r17/hub.js')));
put('index.html',fs.readFileSync(path.join(STAGE,'assets/lsh/r17/home.html')));
const grid=new Map(r.variants.map(v=>[v.id,v]));
assert.equal(grid.size,642);
for(const e of entries)for(const lang of e.languages)for(const level of levels){
 const id=e.id+'|'+lang+'|'+level,v=grid.get(id);
 assert.ok(v,'Variant missing: '+id);
 const wanted=(e.lockSource||e.relative)+'?lang='+lang+'&level='+level+'&zamek=1&practice=1';
 assert.equal(v.href,wanted,'Fixed variant link mismatch: '+id);
}
put('data/cards.json',Buffer.from(JSON.stringify({kind:'LSH_PUBLIC_PRACTICE_R17',
 schemaVersion:1,revision:process.env.GITHUB_SHA||'local',
 mode:'practice',gradedTestsEnabled:false,entries},null,2)+'\n'));
put('version.json',Buffer.from(JSON.stringify({name:'Language Skills Hub',
 version:'R17',mode:'public_practice',gradedTestsEnabled:false,topicCount:29,
 variantCount:642,sourceSha:process.env.GITHUB_SHA||null,
 contentHashes:proof},null,2)+'\n'));
const all=[];
for(const e of entries)all.push(e.relative);
for(const a of r.reviewOnlyAdapters)all.push(a.reviewFile);
for(const a of required)all.push(a);
all.push('assets/qr.js','assets/hub.css','assets/hub.js','index.html','data/cards.json','version.json');
assert.equal(all.length,44,'Unexpected public release file count');
assert.equal(new Set(all).size,all.length);
for(const file of all)assert.ok(fs.existsSync(path.join(out,file)));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>
 x.isDirectory()?walk(path.join(d,x.name)):[path.relative(out,path.join(d,x.name)).replace(/\\/g,'/')]);
const actual=walk(out);
assert.deepEqual(new Set(actual),new Set(all),'Extraneous or missing files: no private keys in release');
console.log('PASS R17 public practice site: 29 cards, 642 fixed links, 4 R7 adapters, 5 runtime assets, no private keys, no graded tests.');
