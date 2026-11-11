#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('data/cards.json'));
const manifest=JSON.parse(read('version.json'));
const policy=JSON.parse(read('data/test-mode-policy.json'));
const grades=JSON.parse(read('data/r25-grading-review.json'));

test('R27 actually enables only explicit public local self-checks, never secure classified exams',()=>{
 assert.equal(manifest.version,'R35');
 assert.equal(manifest.sourceSnapshot,'R17');
 assert.equal(manifest.selfCheckEnabled,true);
 assert.equal(manifest.backendEnabled,false);
 assert.equal(manifest.gradedTestsEnabled,false);
 assert.equal(manifest.officialGradesEnabled,false);
 assert.equal(policy.deployment,'GITHUB_PAGES_STATIC_ONLY');
 assert.equal(policy.status,'PUBLIC_LOCAL_GRADE_PROPOSALS');
 assert.equal(policy.selfCheckEnabled,true);
 assert.equal(policy.testUiEnabled,true);
 assert.equal(policy.gradedTestsEnabled,false);
 assert.equal(policy.officialGradesEnabled,false);
 assert.equal(policy.clientAnswerKeySecrecyGuaranteed,false);
 assert.equal(policy.tamperProofResultsGuaranteed,false);
 assert.deepEqual(policy.plannedLocalSelfCheckSkills,['cteni','poslech']);
 assert.deepEqual(policy.forbiddenSelfCheckSkills,['konverzace']);
 assert.equal(grades.enabled,false);
 assert.equal(grades.schoolGradesEnabled,false);
 assert.equal(grades.roundingRule,'UNDECIDED');
 assert.equal(grades.workingSource.schoolApprovalVerified,false);
});
test('R27 preserves 29 original practice cards with exact hashes and 642 variants',()=>{
 assert.equal(catalog.entries.length,29);
 assert.equal(manifest.topicCount,29);
 assert.equal(manifest.variantCount,642);
 const types={konverzace:0,cteni:0,poslech:0};
 let variants=0;
 for(const entry of catalog.entries){
  types[entry.skill]++;variants+=entry.languages.length*entry.levels.length;
  const sha=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,entry.relative))).digest('hex');
  assert.equal(sha,manifest.contentHashes[entry.id],entry.id);
 }
 assert.deepEqual(types,{konverzace:21,cteni:5,poslech:3});
 assert.equal(variants,642);
});
test('R27 catalog exposes an explicitly non-graded action ONLY in Reading and Listening',()=>{
 const src=read('assets/hub.js'),html=read('index.html');
 assert.match(src,/one\('a','action test','TEST'\)/);
 assert.match(src,/if\(localSelfCheck&&\['cteni','poslech'\]/);
 assert.match(src,/self-check\/reading\/teacher\.html/);
 assert.match(src,/self-check\/listening\/teacher\.html/);
 assert.match(src,/policy\?\.gradedTestsEnabled===false/);
 assert.match(src,/policy\?\.officialGradesEnabled===false/);
 assert.match(html,/<em>TEST<\/em>/);
 assert.match(html,/návrh známky 1–5/);
 assert.doesNotMatch(src,/self-check\/conversation|konverzace\/teacher\.html/);
 assert.doesNotMatch(src,/studentAuth|teacherAuth|serverSubmit|scoreToGrade/);
});
test('R27 Reading/Listening teacher pages generate QR locally, fixed student URL; students never play audio',()=>{
 const reading=read('self-check/reading/teacher.html');
 const listening=read('self-check/listening/teacher.html');
 const rjs=read('self-check/reading/reading-teacher.js');
 const ljs=read('self-check/listening/listening-teacher.js');
 const helper=read('self-check/results/share-tools.js');
 const studentListening=read('self-check/listening/student.html');
 for(const html of [reading,listening]){
  assert.match(html,/id="qrMount"/);
  assert.match(html,/id="studentUrl"/);
  assert.match(html,/id="copyUrl"/);
  assert.match(html,/id="downloadQr"/);
  assert.match(html,/\bscript defer src="\.\.\/\.\.\/assets\/qr\.js"/);
  assert.match(html,/\.\.\/results\/share-tools\.js/);
 }
 assert.match(rjs,/core\.readingEntry/);
 assert.match(rjs,/url\.searchParams\.set\('lang',language\)/);
 assert.match(rjs,/url\.searchParams\.set\('level',level\)/);
 assert.match(ljs,/shareTools\.render/);
 assert.match(ljs,/passes<2/);
 assert.match(helper,/CLBQRCode\.svg/);
 assert.match(helper,/URL\.createObjectURL/);
 assert.match(helper,/navigator\.clipboard/);
 assert.doesNotMatch(studentListening,/<(?:audio|video|iframe)\b/);
});
test('R27 pages and results remain public, no secrets, no PII collection or grade creation',()=>{
 const files=[
  'self-check/reading/teacher.html','self-check/reading/index.html',
  'self-check/listening/teacher.html','self-check/listening/student.html',
  'self-check/results/result-core.js'
 ];
 for(const file of files){
  const content=read(file);
  assert.doesNotMatch(content,/(?:private[_-]?key|SECRET_[A-Z0-9_]+|teacherPassword|passwordHash)/);
 }
 const score=read('self-check/results/result-core.js');
 assert.match(score,/officialSchoolGrade:null/);
 assert.match(score,/officialResult:false/);
 assert.doesNotMatch(score,/fetch\(|navigator\.sendBeacon/);
 const teacher=read('self-check/reading/teacher.html')+
  read('self-check/listening/teacher.html');
 assert.match(teacher,/ZNÁMKA 1–5/);
 const readme=fs.readFileSync(path.resolve(root,'..','README.md'),'utf8');
 assert.match(readme,/\*\*TEST\*\*/);
 assert.match(readme,/https:\/\/ghrab-jazyky\.github\.io\/language-skills-hub\//);
});
