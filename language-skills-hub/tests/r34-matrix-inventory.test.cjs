#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const matrix=JSON.parse(read('self-check/test-banks/assessment-matrix.json'));
const catalog=JSON.parse(read('data/cards.json'));
const manifest=JSON.parse(read('version.json'));
test('R34 complete 138-variant matrix is exhaustive, internally consistent and never published',()=>{
 assert.equal(matrix.kind,'LSH_ASSESSMENT_MATRIX_DRAFT_R34_V1');
 assert.equal(matrix.sourceRelease,'R31');
 assert.equal(matrix.sourceSha,manifest.sourceSha);
 assert.equal(matrix.productionUnmodified,true);
 assert.equal(matrix.publishedAssessments,0);
 assert.equal(matrix.verifiedSchoolGrades,false);
 assert.deepEqual(matrix.totals,{
  reading:120,listening:18,all:138,authoredReading:2,
  readingStructuralScaffolds:118,listeningSelectionBlueprints:18,pedagogicallyApproved:0
 });
 assert.equal(matrix.entries.length,138);
 const ids=new Set(),counts={AUTHOR_DRAFT:0,STRUCTURAL_SCAFFOLD:0,SELECTION_BLUEPRINT:0};
 for(const e of matrix.entries){
  assert.equal(ids.has(e.id),false,'Duplicate entry '+e.id);
  ids.add(e.id);
  const ref=catalog.entries.find(x=>x.id===e.topic);
  assert.ok(ref,'Unknown topic: '+e.topic);
  assert.equal(ref.relative,e.sourceFile);
  assert.equal(e.sourceSha256,manifest.contentHashes[e.topic]);
  assert.equal(e.skill,ref.skill==='cteni'?'reading':'listening');
  assert.equal(ref.languages.includes(e.language),true);
  assert.equal(ref.levels.includes(e.level),true);
  assert.equal(e.pedagogicallyApproved,false);
  assert.equal(e.teacherReady,false);
  assert.equal(e.studentPublic,false);
  assert.equal(e.questionCount,10);
  assert.ok(['AUTHOR_DRAFT','STRUCTURAL_SCAFFOLD','SELECTION_BLUEPRINT'].includes(e.contentStage));
  counts[e.contentStage]++;
  assert.ok(fs.existsSync(path.join(root,e.sourceFile)),'Missing original '+e.sourceFile);
  assert.ok(fs.existsSync(path.join(root,e.bankFile)),'Missing draft '+e.bankFile);
  assert.ok(fs.existsSync(path.join(root,e.draftPreviewPath)),'Missing QA route '+e.draftPreviewPath);
  const bank=JSON.parse(read(e.bankFile));
  assert.equal(bank.topic,e.topic);
  assert.equal(bank.language,e.language);
  assert.equal(bank.level,e.level);
  assert.equal(bank.sourcePracticeContentHash,e.sourceSha256);
  assert.equal(bank.published,false);
  if(e.contentStage==='AUTHOR_DRAFT')assert.ok(!bank.editorialStatus||bank.editorialStatus==='AUTHORED_PENDING_REVIEW');
  else if(e.contentStage==='STRUCTURAL_SCAFFOLD')
   assert.equal(bank.editorialStatus,'AUTO_GENERATED_NOT_PEDAGOGICALLY_VALIDATED');
  else assert.equal(bank.editorialStatus,'REQUIRES_NEW_LISTENING_ITEMS_AND_AUDIO_VALIDATION');
 }
 assert.deepEqual(counts,{AUTHOR_DRAFT:2,STRUCTURAL_SCAFFOLD:118,SELECTION_BLUEPRINT:18});
});
test('R34 QA dashboard is isolated from approved catalog and does not generate student QR',()=>{
 const dashboard=read('self-check/test-banks/dashboard.js');
 const page=read('self-check/test-banks/index.html');
 assert.match(page,/DRAFT · ŽÁDNÉ SCHVÁLENÉ TESTY/);
 assert.match(page,/Neposílat žákům/);
 assert.doesNotMatch(page,/qrMount|downloadQr/);
 assert.match(dashboard,/pedagogicallyApproved!==0/);
 assert.match(dashboard,/studentPublic/);
 assert.match(dashboard,/draftPreviewPath/);
 assert.doesNotMatch(read('index.html'),/assessment-matrix\.json|test-banks\/index\.html/);
 assert.doesNotMatch(read('assets/hub.js'),/assessment-matrix\.json|test-banks\/index\.html/);
});
