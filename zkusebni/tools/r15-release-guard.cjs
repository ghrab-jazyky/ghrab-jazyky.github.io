#!/usr/bin/env node
/* R15 offline manual release gate. Append ONLY to disposable R12 review ZIP.
 * No answer-key generation, publication, or real student data. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const STAGE=path.resolve(__dirname,'..'),REPO=path.resolve(STAGE,'..');
const out=process.argv[2]&&path.resolve(process.argv[2]);
assert.ok(out,'Usage: node tools/r15-release-guard.cjs <existing-R12-review-bundle>');
assert.ok(out!==REPO&&!out.startsWith(REPO+path.sep),'Never write into public repository');
const read=name=>fs.readFileSync(path.join(out,name),'utf8');
const json=name=>JSON.parse(read(name));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const m=json('R10_REVIEW_MANIFEST.json'),r11=json('R11_REVIEW_MATRIX.json'),
 r12=json('R12_CONTENT_TRIAGE.json');
assert.equal(m.catalogSize,29);assert.equal(m.entries.length,29);
assert.equal(r11.variantCount,642);assert.equal(r11.variants.length,642);
assert.equal(r11.bundleId,r12.sourceBundleId,'Review/triage mismatch');
assert.equal(m.teacherApproval,false);assert.equal(m.approvedForRelease,false);
assert.equal(m.testModeReady,false);assert.equal(m.privateTeacherKeysBundled,false);
assert.equal(r11.teacherApproval,false);assert.equal(r12.teacherApproval,false);
assert.equal(r12.privateTeacherKeysIncluded,false);
assert.equal(new Set(r11.variants.map(x=>x.id)).size,642);
for(const e of m.entries){
 assert.match(e.relative,/^(konverzace|cteni|poslech)\/[a-z0-9-]+\/index\.html$/);
 assert.equal(sha(fs.readFileSync(path.join(out,e.relative))),e.sha256,
  'R15 must never change a source card: '+e.id);
}
const gates=[
 ['convo_r8','Conversation R8 – schválení 12 změn','Prověřit všech 7 A1 a dalších 5 jazykových návrhů.'],
 ['reading_r7','Reading R7 – schválení 17 změn','Porovnat nové soukromé klíče s historickými, bez jejich publikace.'],
 ['listening_c1','Listening R7 – věcná správnost C1','Porovnat opravenou otázku Peaky s reálným videem.'],
 ['matthew','Matthew – média a časování','Přehrát ve školní síti úsek od 1:10 a ověřit časování úloh.'],
 ['peaky','Peaky – média a časování','Ověřit primární i záložní video, přesný střih.'],
 ['harrison','Harrison – média a časování','Prověřit dostupnost Facebooku bez přihlášení.'],
 ['peaky_age','Peaky – věková přiměřenost','Vulgarity, drogy, výhrůžky – písemné schválení pro cílový ročník.'],
 ['win','Windows – školní počítač','Ověřit katalog, QR, offline HTML, slovníček a interakce.'],
 ['android','Android – reálný telefon','Bez fullscreen a bez horizontálního posunu.'],
 ['iphone','iPhone – Safari','Dotyk, offline, přepínače, notche a slovníček.'],
 ['ipad','iPad – Safari a Split View','Včetně Split View a Slide Over.'],
 ['offline','Offline ZIP / QR','Ověřit otevření HTML z lokálního souboru a přepínače.'],
 ['privacy','Ochrana údajů','Žádné údaje žáků ani soukromé klíče v veřejných souborech.'],
 ['leadership','Vydávací rozhodnutí vedení','Samostatné schválení a řízená změna po přejímce.']
];
const d={bundleId:r11.bundleId,topics:29,variants:642,
 validVariantIds:r11.variants.map(v=>v.id),
 gates:gates.map(([id,title,help])=>({id,title,help})),
 media:{matthew:'https://www.youtube.com/watch?v=wD2cVhC-63I&t=70s',
  peakyPrimary:'https://www.youtube.com/watch?v=DRLSRX1nF0s',
  peakyAlternative:'https://www.youtube.com/watch?v=_hzgUPl3YWU',
  harrison:'https://www.facebook.com/netflixus/videos/harrison-ford-sag-life-achievement-award/796302026840392/'},
 reportSha:sha(fs.readFileSync(path.join(out,'R10_REVIEW_MANIFEST.json')))};
const template=fs.readFileSync(path.join(STAGE,'assets/lsh/r15/release-template.html'),'utf8');
assert.equal(template.split('@@DATA@@').length,2,'Missing or repeated JSON placeholder');
const html=template.replace('@@DATA@@',JSON.stringify(d).replace(/</g,'\\u003c'));
assert.doesNotMatch(html,/<script[^>]+src=/);
assert.match(html,/Klasifikované testování: NO-GO/);
fs.writeFileSync(path.join(out,'release-check.html'),html);
const indexPath=path.join(out,'index.html'),existing=fs.readFileSync(indexPath,'utf8');
assert.ok(existing.includes('<main>'));
if(!existing.includes('href="release-check.html"'))
 fs.writeFileSync(indexPath,existing.replace('<main>',
  '<p><a href="release-check.html">R15 · Připravenost k vydání a fyzická UAT (NO-GO)</a></p><main>'));
const report={schemaVersion:1,kind:'R15_RELEASE_GUARD_ONLY',
 sourceReviewBundleId:r11.bundleId,sourceManifestSha256:d.reportSha,
 topics:29,variants:642,teacherApproval:false,approvedForRelease:false,
 published:false,testModeReady:false,classifiedTestingAllowed:false,
 privateKeysBundled:false,privateReadingKeysComparedInThisPublicCI:false,
 manualDeviceTestingCompleted:false,mediaVerifiedAtSchool:false,manualSignOff:false,
 warning:'Never infer release readiness from CI; answer keys present inside student practice HTML prohibit secure classified tests.'};
fs.writeFileSync(path.join(out,'R15_RELEASE_GATES.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(out,'R15_UAT_CEKLIST.md'),
 '# Language Skills Hub R15 — NO-GO pro klasifikované testování\n\n'+
 'CI kontroluje pouze integritu. Žádné soukromé učitelské klíče ani schválení.\n\n'+
 gates.map(([,title,help])=>'- [ ] '+title+' — '+help).join('\n')+'\n\n'+
 'Přejímka není automatickým schválením, neslučovat PR do main.\n');
for(const e of m.entries)
 assert.equal(sha(fs.readFileSync(path.join(out,e.relative))),e.sha256,'Student card mutated after R15');
console.log('PASS R15 642 variants, 14 manual gates, fixed NO-GO classified testing, 29 intact source cards, no keys');
