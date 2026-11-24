#!/usr/bin/env node
'use strict';
// Build ONLY the tracked public runtime. The repository is public; this is
// a publication boundary, NOT confidentiality or access control.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'release-preview','site'),evidence=path.join(root,'release-preview','evidence');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(path.join(root,p));
const json=p=>JSON.parse(read(p).toString('utf8'));
const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,maxBuffer:20*1024*1024}).toString('utf8').split('\0').filter(Boolean);
const roots=new Set(['index.html','404.html','robots.txt','SHA256SUMS.txt','language-skills-hub/index.html','language-skills-hub/version.json','language-skills-hub/sw.js','language-skills-hub/manifest.webmanifest']);
const prefixes=['assets/','cteni/','konverzace/','poslech/','slovnicek/','stazeno/','k/','data/',
 'language-skills-hub/assets/','language-skills-hub/cteni/','language-skills-hub/konverzace/',
 'language-skills-hub/poslech/','language-skills-hub/slovnicek/','language-skills-hub/self-check/',
 'language-skills-hub/data/','language-skills-hub/printouts/rl-asteroids/','language-skills-hub/r11/variant-copies/',
 // Existing public trial runtime is retained for URL compatibility. Its
 // authoring notes/tests are excluded. Removing legacy URLs needs separate approval.
 'zkusebni/assets/','zkusebni/cteni/','zkusebni/konverzace/','zkusebni/poslech/','zkusebni/slovnicek/',
 'zkusebni/k/','zkusebni/stazeno/','zkusebni/icons/','zkusebni/data/','zkusebni/vyber/',
 'zkusebni/nahledy/','zkusebni/reference/','zkusebni/revize/'];
for(const p of ['zkusebni/index.html','zkusebni/404.html','zkusebni/manifest.webmanifest','zkusebni/offline.html','zkusebni/sw.js'])roots.add(p);
const assetExtension=/\.(html|css|js|json|webmanifest|svg|png|jpe?g|webp|gif|ico|pdf|woff2?|ttf|mp3|ogg|wav|mp4|webm)$/i;
const forbiddenPart=/(^|\/)(?:\.git(?:hub)?|docs|tests|authoring|scripts|qa|node_modules|release-preview)(\/|$)/i;
function allowed(p){
 if(p.includes('\\')||p.startsWith('/')||p.split('/').some(x=>!x||x==='.'||x==='..')||forbiddenPart.test(p))return false;
 if(/(^|\/)city-quest-f[01](\/|$)/.test(p))return false;
 if(roots.has(p))return true;
 return prefixes.some(prefix=>p.startsWith(prefix))&&assetExtension.test(p);
}
const checked=[
 ['docs/city-quest/stage3-oracy-fr.json',false],
 ['language-skills-hub/docs/private.md',false],
 ['language-skills-hub/authoring/plural/content.json',false],
 ['language-skills-hub/tests/smoke.js',false],
 ['language-skills-hub/scripts/test.js',false],
 ['zkusebni/docs/internal.json',false],
 ['language-skills-hub/konverzace/city-quest-f0/index.html',false],
 ['Language_Skills_Hub_E1_ZKUSEBNI_2026-11-04/zkusebni/index.html',false],
 ['language-skills-hub/konverzace/city-quest-f2/index.html',true],
 ['language-skills-hub/printouts/rl-asteroids/en/A1/test-all.pdf',true],
 ['zkusebni/index.html',true]];
for(const [p,answer] of checked)assert.equal(allowed(p),answer,p);
if(fs.existsSync(path.dirname(output)))throw Error('release-preview already exists; remove explicitly before rebuilding');
const src='language-skills-hub/',cards=json(src+'data/cards.json'),manifest=json(src+'version.json');
assert.equal(cards.entries.length,35);
assert.equal(Object.keys(manifest.contentHashes).length,35);
const asteroids=src+'cteni/asteroids/index.html',ast=read(asteroids);
const astBlob=crypto.createHash('sha1').update('blob '+ast.length+'\0').update(ast).digest('hex');
assert.equal(astBlob,'d0ddfe9aae769eff948ee7cf52092139678b64d3','R12 approved bytes changed; re-audit, do not bless a different card');
const cardChecks=cards.entries.map(c=>{
 const p=src+c.relative;assert.ok(allowed(p),'Catalog entry outside allowlist '+c.id);
 const actual=sha(read(p));assert.equal(actual,manifest.contentHashes[c.id],c.id+' SHA256');
 return {id:c.id,path:p,sha256:actual};
});
const pdfManifest=json(src+'printouts/rl-asteroids/manifest-all.json');
assert.equal(pdfManifest.files.length,96);
for(const f of pdfManifest.files){const p=src+f.path,b=read(p);assert.ok(allowed(p));assert.equal(b.length,f.bytes,p+' bytes');assert.equal(sha(b),f.sha256,p+' hash');}
const include=tracked.filter(allowed),exclude=tracked.filter(p=>!allowed(p));
assert.ok(include.length>0);
for(const f of include){
 const from=path.join(root,f),to=path.join(output,f);
 assert.ok(fs.lstatSync(from).isFile(),'Not regular file '+f);
 // Reject symlinks in any ancestor and keep the copy byte-for-byte.
 let parent=path.dirname(from);while(parent!==root){assert.ok(!fs.lstatSync(parent).isSymbolicLink());parent=path.dirname(parent);}
 fs.mkdirSync(path.dirname(to),{recursive:true});
 fs.copyFileSync(from,to);
}
for(const c of cardChecks)assert.equal(sha(fs.readFileSync(path.join(output,c.path))),c.sha256);
for(const f of pdfManifest.files)assert.equal(sha(fs.readFileSync(path.join(output,src+f.path))),f.sha256);
assert.ok(!fs.existsSync(path.join(output,'docs')));
assert.ok(!fs.existsSync(path.join(output,src+'tests')));
assert.ok(!fs.existsSync(path.join(output,src+'authoring')));
assert.ok(!fs.existsSync(path.join(output,src+'docs')));
for(const f of ['index.html','404.html',src+'index.html',src+'manifest.webmanifest',src+'sw.js','zkusebni/index.html'])assert.ok(fs.existsSync(path.join(output,f)),f);
fs.writeFileSync(path.join(output,'.nojekyll'),'');
const report={schema:'lsh-pages-allowlist-v1',sha:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
 asteroids:{approvedCommit:'88b8a7c212faef3178ecc44539477c2f2d757f2b',gitBlob:astBlob,sha256:sha(ast)},cardChecks,pdfs:pdfManifest.files.length,
 included:include.length,excluded:exclude.length,excludedPaths:exclude,files:include.map(p=>({path:p,sha256:sha(read(p))}))};
fs.mkdirSync(evidence,{recursive:true});fs.writeFileSync(path.join(evidence,'publication-manifest.json'),JSON.stringify(report,null,2)+'\n');
console.log('PASS 35/35 card hashes, '+report.pdfs+'/96 PDF hashes, '+include.length+' allowlisted files, '+exclude.length+' excluded source files.');
