#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const matrix=read('self-check/test-banks/review-matrix.json');
const version=read('version.json'),cards=read('data/cards.json');
test('R34 all 138 variants are individually tracked as not approved',()=>{
 assert.equal(matrix.kind,'LSH_R34_CONTENT_REVIEW_MATRIX_V1');
 assert.equal(matrix.productionBaseline,version.version);
 assert.equal(matrix.status,'DRAFT_NEVER_PUBLIC_STUDENT');
 assert.equal(matrix.variants.length,138);
 const ids=new Set(matrix.variants.map(x=>x.id));
 assert.equal(ids.size,138);
 assert.equal(matrix.variants.filter(x=>x.skill==='reading').length,120);
 assert.equal(matrix.variants.filter(x=>x.skill==='listening').length,18);
 assert.equal(matrix.manualReading,2);
 assert.equal(matrix.mechanicalReading,118);
 assert.equal(matrix.authoredListening,18);
 for(const item of matrix.variants){
  assert.equal(item.studentPublicationApproved,false,item.id);
  assert.equal(item.teacherApproved,false,item.id);
  assert.equal(item.sourceEvidenceVerified,false,item.id);
  assert.equal(item.cefrVerified,false,item.id);
  assert.equal(item.distractionQualityVerified,false,item.id);
  assert.equal(item.practiceIndependenceVerified,false,item.id);
  assert.ok(cards.entries.some(e=>e.id===item.topic));
  assert.equal(item.sourcePracticeContentHash,version.contentHashes[item.topic]);
  assert.ok(fs.existsSync(path.resolve(root,'..',item.content)),item.content);
  if(item.skill==='reading'){
   assert.equal(item.sourceRecordingVerified,null);
   assert.ok(['mechanically-seeded','authored-pilot'].includes(item.provenance));
   assert.ok(item.questionCount>=6&&item.questionCount<=10);
  }else{
   assert.equal(item.sourceRecordingVerified,false);
   assert.equal(item.provenance,'assistant-authored-from-practice-metadata');
   assert.equal(item.language,'en');
   assert.ok(item.questionCount>=8&&item.questionCount<=12);
  }
 }
});
test('R34 matrix cannot be used as a release permit',()=>{
 const src=fs.readFileSync(path.join(root,'self-check/test-banks/qa.js'),'utf8');
 assert.doesNotMatch(src,/releaseApproved|teacherApprovalGranted|publishOnMain|postMessage\s*\(/);
 assert.match(src,/sourceVerified:true/);
 assert.match(src,/studentPublicationApproved:false/);
 const html=fs.readFileSync(path.join(root,'self-check/test-banks/qa.html'),'utf8');
 assert.match(html,/NEOVĚŘENÝ OBSAH/);
});
