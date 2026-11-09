#!/usr/bin/env node
/* R16 personal UAT launchpad. Offline only, no student data or teacher keys.
 * Must run on disposable R15 review output, never on the public repository.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto');
const STAGE=path.resolve(__dirname,'..'),REPO=path.resolve(STAGE,'..');
const out=process.argv[2]&&path.resolve(process.argv[2]);
assert.ok(out,'Usage: node r16-personal-uat.cjs <existing-R15-output-folder>');
assert.ok(out!==REPO&&!out.startsWith(REPO+path.sep),'R16 must not write into repository');
const file=p=>fs.readFileSync(path.join(out,p));
const read=p=>JSON.parse(file(p));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const m=read('R10_REVIEW_MANIFEST.json'),r=read('R11_REVIEW_MATRIX.json'),
 triage=read('R12_CONTENT_TRIAGE.json'),gate=read('R15_RELEASE_GATES.json');
assert.equal(m.catalogSize,29);
assert.deepEqual(m.counts,{konverzace:21,cteni:5,poslech:3});
assert.equal(r.variantCount,642);
assert.equal(r.variants.length,642);
assert.equal(r.bundleId,triage.sourceBundleId);
assert.equal(gate.sourceReviewBundleId,r.bundleId);
assert.equal(gate.topics,29);assert.equal(gate.variants,642);
assert.equal(m.teacherApproval,false);assert.equal(m.approvedForRelease,false);
assert.equal(m.testModeReady,false);
assert.equal(gate.classifiedTestingAllowed,false);
assert.equal(gate.privateKeysBundled,false);
const allowedSkills=new Set(['konverzace','cteni','poslech']);
const allowedLanguages=new Set(['en','es','de','fr']);
const allowedLevels=new Set(['A1','A2','B1','B2','C1','C2']);
const topics=[],ids=new Set();
for(const e of m.entries){
 assert.ok(!ids.has(e.id),'Duplicate topic ID '+e.id);ids.add(e.id);
 assert.ok(allowedSkills.has(e.skill));
 assert.match(e.relative,/^(konverzace|cteni|poslech)\/[a-z0-9-]+\/index\.html$/);
 assert.equal(sha(file(e.relative)),e.sha256,'Source content hash changed '+e.id);
 assert.ok(Array.isArray(e.languageCoverage)&&e.languageCoverage.length>=1&&
  e.languageCoverage.every(l=>allowedLanguages.has(l)));
 assert.equal(e.cefrLevels.length,6);assert.ok(e.cefrLevels.every(l=>allowedLevels.has(l)));
 topics.push({id:e.id,title:e.title,skill:e.skill,languages:e.languageCoverage,relative:e.relative});
}
const variants=[],variantIds=new Set();
for(const v of r.variants){
 assert.ok(ids.has(v.topicId)&&allowedSkills.has(v.skill));
 assert.ok(allowedLanguages.has(v.lang)&&allowedLevels.has(v.level));
 assert.equal(v.id,v.topicId+'|'+v.lang+'|'+v.level);
 assert.ok(!variantIds.has(v.id),'Duplicate variant ID '+v.id);
 variantIds.add(v.id);
 assert.match(v.href,
 /^(?:(?:konverzace|cteni|poslech)\/[a-z0-9-]+\/index\.html|r11\/variant-copies\/(?:rl|ll)-[a-z0-9-]+\.html)\?lang=(?:en|es|de|fr)&level=(?:A1|A2|B1|B2|C1|C2)&zamek=1&practice=1$/);
 const pathOnly=v.href.split('?')[0];
 const canonical=path.resolve(out,pathOnly);
 assert.ok(canonical.startsWith(out+path.sep),'Remote path in UAT URL');
 assert.ok(fs.existsSync(canonical),'Missing source in UAT URL: '+v.id);
 assert.equal(v.href.includes('lang='+v.lang+'&level='+v.level),true);
 variants.push({id:v.id,href:v.href});
}
assert.equal(variantIds.size,642);
const json={schemaVersion:1,bundleId:r.bundleId,sourceCommit:process.env.GITHUB_SHA||null,
 topics,variants,teacherApproval:false,approvedForRelease:false,
 classifiedTestingAllowed:false};
const template=fs.readFileSync(path.join(STAGE,'assets/lsh/r16/uat-start-template.html'),'utf8');
assert.equal(template.split('__LSH_DATA__').length,2,'Missing unique data placeholder');
const html=template.replace('__LSH_DATA__',JSON.stringify(json).replace(/</g,'\\u003c'));
assert.doesNotMatch(html,/__LSH_DATA__|<script[^>]+src=/);
assert.match(html,/POUZE K TESTOVÁNÍ A PROCVIČOVÁNÍ/);
const target=path.join(out,'start-test.html');
assert.ok(!fs.existsSync(target),'R16 already generated');
fs.writeFileSync(target,html,{flag:'wx'});
const indexPath=path.join(out,'index.html'),index=fs.readFileSync(indexPath,'utf8');
assert.ok(index.includes('<main>')&&!index.includes('href="start-test.html"'));
fs.writeFileSync(indexPath,index.replace('<main>',
 '<p><a href="start-test.html">R16 · Začít osobní testování 29 karet (Conversation / Reading / Listening)</a></p><main>'));
const manifest={kind:'LSH_R16_PERSONAL_UAT_READY_NOT_APPROVED',schemaVersion:1,
 sourceBundleId:r.bundleId,topicCount:29,variantCount:642,sourceCommit:json.sourceCommit,
 originalCardHashes:Object.fromEntries(m.entries.map(e=>[e.id,e.sha256])),
 personalUATEntry:'start-test.html',readyForPersonalUAT:true,
 teacherApproval:false,approvedForRelease:false,classifiedTestingAllowed:false,
 published:false,productionDeployed:false,privateKeysBundled:false};
fs.writeFileSync(path.join(out,'R16_PERSONAL_UAT_MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
const readme=[
 '# Language Skills Hub R16 – ZAČÍT OSOBNÍ TESTOVÁNÍ','',
 '**TOTO JE TESTOVACÍ BALÍČEK, NE OSTRÁ APLIKACE ANI KLASIFIKOVANÝ TEST.**','',
 '1. Stáhni ZIP z GitHub Actions, na počítači ho celý ROZBAL (neotvírej index.html přímo uvnitř ZIPu).',
 '2. Otevři **start-test.html** v Chrome, Edge, Firefoxu nebo Safari.',
 '3. Vyber Conversation / Reading / Listening, téma, jazyk a úroveň A1–C2.',
 '4. Klikni na Otevřít studentskou kartu; otevře se pevně nastavená varianta.',
 '5. Zkoušej tlačítka, slovníček, opravy odpovědí, mobilní šířku, QR a poslechová videa.',
 '6. Případnou chybu zapiš dole na start-test.html. Klikni Exportovat report JSON a soubor uschovej.',
 '7. Pro systematickou pedagogickou revizi použij review.html (642 variant) a release-check.html (14 UAT bodů).',
 '',
 'Pozor: poslechová videa jsou externí a mohou bez internetu chybět.',
 'Na skutečném iPhonu/iPadu může být omezeno otevření místního HTML z Files; jde o bod fyzické UAT.',
 'Nikde nezadávej jména studentů, jejich údaje ani soukromé učitelské klíče.',
 '',
 'Schválení výukového obsahu zůstává nedokončené. Klasifikované testování zůstává NO-GO.',
 ''
];
fs.writeFileSync(path.join(out,'ZACIT_TESTOVAT.md'),readme.join('\n'));
for(const e of m.entries)assert.equal(sha(file(e.relative)),e.sha256,'Source card changed in R16');
console.log('PASS R16: one offline launchpad, 29 topics, 642 verified links, original hashes preserved, classified NO-GO.');
