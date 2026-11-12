#!/usr/bin/env node
/* R11: build a teacher-only, offline-first 642-variant review matrix.
 * The matrix records preliminary human REVIEW NOTES, NEVER approvals.
 * No network, no student identities, no teacher keys, no publication.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const output=process.argv[2]&&path.resolve(process.argv[2]);
assert.ok(output,'Usage: node zkusebni/tools/r11-review-matrix.cjs <existing R10 output>');
const repo=path.resolve(ROOT,'..');
assert.ok(output!==repo&&!output.startsWith(repo+path.sep),
 'Refuse to write a review tool into the public repository');
assert.ok(fs.existsSync(output)&&fs.statSync(output).isDirectory(),
 'R10 output folder must exist');
const r10File=path.join(output,'R10_REVIEW_MANIFEST.json');
const r10=JSON.parse(fs.readFileSync(r10File,'utf8'));
assert.equal(r10.kind,'R10_UNIFIED_OFFLINE_REVIEW_ONLY');
assert.equal(r10.teacherApproval,false);assert.equal(r10.approvedForRelease,false);
assert.equal(r10.published,false);assert.equal(r10.testModeReady,false);
assert.equal(r10.privateTeacherKeysBundled,false);
assert.deepEqual(r10.counts,{konverzace:21,cteni:5,poslech:3});
assert.equal(r10.entries.length,29);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const langs=['en','es','de','fr'],levels=['A1','A2','B1','B2','C1','C2'];
const permitted=['konverzace','cteni','poslech'];
const variantRows=[];const cardIDs=new Set(),copyManifest=[];
const bridgePaths={
 'rl-email-friend':'integrace/cteni/email-friend/index.html',
 'rl-instant-messages':'integrace/cteni/instant-messages/index.html',
 'll-harrison-ford':'integrace/poslech/harrison-ford/index.html',
 'll-peaky-no-fighting':'integrace/poslech/peaky-blinders/index.html'
};
function createFixedReviewCopy(e,source,sourceHash){
 const file=bridgePaths[e.id];
 assert.ok(file,'No known review-only variant adapter for '+e.id);
 const integrated=fs.readFileSync(path.join(ROOT,file),'utf8');
 const all=[...integrated.matchAll(/<script>\n\/\* LSH-R5 variant bridge:[\s\S]*?<\/script>\n/g)];
 assert.equal(all.length,1,'Missing unique audited R5 URL bridge: '+e.id);
 const bridge=all[0][0];
 const code=bridge.replace(/^<script>\n/,'').replace(/<\/script>\n$/,'');
 new vm.Script(code,{filename:'bridge-'+e.id+'.js'});
 const base=source.toString('utf8');
 assert.equal(base.includes('LSH-R5 variant bridge'),false,'Review candidate unexpectedly already bridged');
 assert.equal(base.split('</body>').length,2,'Expected exactly one closing body element');
 const patched=base.replace('</body>',bridge+'</body>');
 assert.equal(patched.replace(bridge,''),base,'Review-only bridge changed candidate source');
 const rel='r11/variant-copies/'+e.id+'.html';
 const outputPath=path.join(output,rel);
 fs.mkdirSync(path.dirname(outputPath),{recursive:true});
 fs.writeFileSync(outputPath,patched,{flag:'wx'});
 const copyHash=hash(Buffer.from(patched,'utf8'));
 copyManifest.push({id:e.id,reviewFile:rel,sourceSha256:sourceHash,
  reviewSha256:copyHash,bridgeSource:file,sourceUnmodified:true});
 return rel;
}

for(const e of r10.entries){
 assert.ok(/^(cl|rl|ll)-[a-z0-9-]+$/.test(e.id)&&!cardIDs.has(e.id),
  'Duplicate/invalid source card ID');
 cardIDs.add(e.id);
 assert.ok(permitted.includes(e.skill));
 assert.match(e.relative,/^(konverzace|cteni|poslech)\/[a-z0-9-]+\/index\.html$/);
 assert.ok(e.relative.startsWith(e.skill+'/'));
 assert.ok(Array.isArray(e.languageCoverage)&&e.languageCoverage.length);
 assert.ok(e.languageCoverage.every(x=>langs.includes(x)));
 assert.deepEqual(e.cefrLevels,levels);
 assert.equal(e.teacherApproval,false);assert.equal(e.published,false);
 const disk=path.join(output,e.relative);const bytes=fs.readFileSync(disk);
 assert.equal(hash(bytes),e.sha256,'Candidate was modified: '+e.id);
 const reviewHref=(e.sourceTier==='READING_R7'||e.sourceTier==='LISTENING_R7')
  ?createFixedReviewCopy(e,bytes,e.sha256):e.relative;
 for(const lang of e.languageCoverage)for(const level of levels){
  variantRows.push({id:e.id+'|'+lang+'|'+level,topicId:e.id,title:e.title,
   skill:e.skill,lang,level,tier:e.sourceTier,
   href:reviewHref+'?lang='+lang+'&level='+level+'&zamek=1&practice=1',
   teacherKeySync:e.keySynchronizationNeeded===true,
   mediaCheck:e.mediaValidationNeeded===true});
 }
}
assert.equal(variantRows.length,642,'The exact 642 variant coverage changed');
assert.equal(new Set(variantRows.map(x=>x.id)).size,642);
const covered=variantRows.reduce((m,v)=>(m[v.skill]=(m[v.skill]||0)+1,m),{});
assert.deepEqual(covered,{konverzace:504,cteni:120,poslech:18});
assert.equal(copyManifest.length,4,'Expected exactly 4 R7 review-only URL bridges');
const seal=hash(Buffer.from(r10.entries.map(e=>e.id+'='+e.sha256).sort().join('\n'),'utf8'));
const manifest={schemaVersion:1,kind:'LSH_R11_PRELIMINARY_REVIEW_NOT_APPROVAL',
 bundleId:seal,variantCount:642,topicCount:29,counts:covered,
 sourceManifest:'R10_REVIEW_MANIFEST.json',
 teacherApproval:false,approvedForRelease:false,published:false,
 testModeReady:false,privateTeacherKeysBundled:false,
 statuses:['todo','reviewed','issue'],
 instructions:'Preliminary local review tracking only. Do not publish this record as teacher approval.',
 reviewOnlyAdapters:copyManifest,variants:variantRows};
const json=JSON.stringify(manifest);
assert.ok(!json.includes('</script'),'Unexpected HTML script breakout');
const dir=path.join(ROOT,'assets/lsh/r11');
const template=fs.readFileSync(path.join(dir,'matrix-template.html'),'utf8');
const css=fs.readFileSync(path.join(dir,'matrix.css'),'utf8');
const js=fs.readFileSync(path.join(dir,'matrix-ui.js'),'utf8');
assert.ok(!js.includes('</script')&&!css.includes('</style'),'Unexpected embedded closing tag');
const slots=['<!--R11_CSS-->','<!--R11_DATA-->','<!--R11_SCRIPT-->'];
for(const slot of slots)assert.equal(template.split(slot).length,2,'Invalid template slot '+slot);
const doc=template.replace(slots[0],'<style>\n'+css+'\n</style>')
 .replace(slots[1],'<script id="r11-matrix-data" type="application/json">'+
  json.replace(/</g,'\\u003c')+'</script>')
 .replace(slots[2],'<script>\n'+js+'\n</script>');
for(const slot of slots)assert.ok(!doc.includes(slot));
const outputHTML=path.join(output,'review.html');
const outputJSON=path.join(output,'R11_REVIEW_MATRIX.json');
assert.ok(!fs.existsSync(outputHTML)&&!fs.existsSync(outputJSON),
 'Refuse to overwrite an earlier review matrix or user progress');
// Write both to disposable R10 artifact directory, no source mutation.
fs.writeFileSync(outputJSON,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
try{fs.writeFileSync(outputHTML,doc,{flag:'wx'});}
catch(err){fs.rmSync(outputJSON,{force:true});throw err}
console.log('PASS R11 matrix: 642 variants, 4 isolated R7 URL bridge copies; review.html; NO APPROVAL');
