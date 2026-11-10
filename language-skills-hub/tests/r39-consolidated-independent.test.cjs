#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const catalog=json('data/cards.json').entries;
const manifest=json('version.json');
const sourceCore=require('../self-check/listening/listening-core.js');
const listening=require('../self-check/test-banks/listening/test-bank-core.js');
const inventory=require('./r35-content-coverage.cjs');
const topics=catalog.filter(x=>x.skill==='poslech');
test('R39 full teacher-review corpus reports 120 Reading + 18 Listening, none structurally missing',()=>{
 assert.equal(inventory.expected.total,138);
 assert.equal(inventory.actual.draftReading,120);
 assert.equal(inventory.actual.draftListening,18);
 assert.equal(inventory.actual.draft,138);
 assert.equal(inventory.actual.missing,0);
 assert.equal(inventory.actual.invalid,0);
 assert.equal(inventory.actual.approvedForStudents,0);
 assert.equal(manifest.version,'R31');
 assert.equal(manifest.backendEnabled,false);
 assert.equal(manifest.officialGradesEnabled,false);
});
test('R39 all 18 authored Listening banks have valid source binding and 6+2 own items',()=>{
 assert.equal(topics.length,3);
 let total=0;
 for(const entry of topics){
  const html=read(entry.relative),originalHash=createHash('sha256').update(
   fs.readFileSync(path.join(root,entry.relative))).digest('hex');
  assert.equal(originalHash,manifest.contentHashes[entry.id],entry.id);
  const data=sourceCore.extractJson(html,'DATA');
  for(const level of sourceCore.LEVELS){
   const file='self-check/test-banks/listening/'+entry.id+'/en-'+level+'.json';
   const b=json(file),variant=sourceCore.variant(data,level);
   try{assert.equal(listening.validate(b,variant,originalHash),true,file)}
   catch(error){throw new Error(file+': '+error.message,{cause:error})}
   assert.equal(b.published,false);
   assert.equal(b.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
   assert.equal(b.objective.length,6);
   assert.equal(b.written.length,2);
   const originalStems=new Set([...variant.gist,...variant.detail].map(x=>x.title.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim()));
   for(const q of b.objective){
    assert.equal(originalStems.has(q.q.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim()),false,file+' duplicated practice');
    assert.equal(q.options.length,4);
    assert.ok(q.sourceEvidence.length>=5);
   }
   const answer=Object.fromEntries(b.objective.map(q=>[q.id,q.answer]));
   const scored=listening.score(b,answer,[null,null]);
   assert.equal(scored.objectiveEarned,6);
   assert.equal(scored.pending,2);
   assert.equal(scored.totalEarned,null);
   assert.equal(scored.officialSchoolResult,false);
   const reviewed=listening.score(b,answer,[1,0]);
   assert.equal(reviewed.totalEarned,7);
   assert.equal(reviewed.totalMax,8);
   assert.equal(reviewed.pending,0);
   total++;
  }
 }
 assert.equal(total,18);
});
test('R39 no automatically approved test or student entry point was added',()=>{
 const manifest=json('version.json');
 assert.equal(manifest.gradedTestsEnabled,false);
 assert.equal(manifest.officialGradesEnabled,false);
 const home=read('index.html'),hub=read('assets/hub.js');
 assert.doesNotMatch(home,/self-check\/test-banks\/(?:reading|listening)\/preview/);
 assert.doesNotMatch(hub,/self-check\/test-banks\/(?:reading|listening)\/preview/);
 const qa=read('self-check/test-banks/listening/preview.js');
 assert.match(qa,/Original media source checksum mismatch/);
 assert.match(qa,/DRAFT|unapproved/i);
 assert.doesNotMatch(qa,/sendBeacon\s*\(|XMLHttpRequest|navigator\.mediaDevices\.getUserMedia/);
});
