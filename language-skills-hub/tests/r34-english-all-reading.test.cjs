#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const data=p=>fs.readFileSync(path.join(root,p),'utf8');
const reading=require('../self-check/reading/reading-core.js');
const contract=require('../self-check/test-banks/reading/generic-core.js');
const coverage=require('../tools/independent-coverage.cjs').summary;
const manifest=JSON.parse(data('version.json'));
const catalog=JSON.parse(data('data/cards.json'));
const topics=catalog.entries.filter(e=>e.skill==='cteni');
test('R34 all five Reading topics have separate original EN A1–C2 drafts',()=>{
 assert.equal(topics.length,5);
 let count=0,items=0;
 for(const entry of topics){
  const html=data(entry.relative),source=reading.parseReadingData(html);
  const hash=crypto.createHash('sha256').update(Buffer.from(html)).digest('hex');
  assert.equal(hash,manifest.contentHashes[entry.id]);
  for(const level of reading.LEVELS){
   const filepath='self-check/test-banks/reading/'+entry.id+'/en-'+level+'.json';
   const bank=JSON.parse(data(filepath)),practice=reading.variantFromData(source,'en',level);
   const ctx={topic:entry.id,lang:'en',level,sourceHash:hash};
   assert.equal(contract.validate(bank,practice,ctx),true,filepath);
   const qa=contract.compile(bank,practice,ctx);
   reading.validateVariant(qa);
   assert.deepEqual(qa.paragraphs,practice.paragraphs);
   assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
   assert.equal(bank.published,false);
   assert.equal(bank.durationMinutesSuggested>=5,true);
   assert.equal(qa.questions.length,10);
   const oldIds=new Set(practice.questions.map(q=>q.id));
   const oldStems=new Set(practice.questions.map(q=>q.q.toLowerCase().trim()));
   for(const q of qa.questions){
    assert.equal(oldIds.has(q.id),false);
    assert.equal(oldStems.has(q.q.toLowerCase().trim()),false);
    assert.ok(q.sourceParagraph>=1&&q.sourceParagraph<=practice.paragraphs.length);
   }
   const correct=Object.fromEntries(qa.questions.map(q=>[q.id,q.answer]));
   assert.equal(reading.score(qa,correct).points,10);
   assert.equal(reading.score(qa,{}).unanswered,10);
   count++;items+=qa.questions.length;
  }
 }
 assert.equal(count,30);
 assert.equal(items,300);
 assert.ok(coverage.authored>=30);
 assert.equal(coverage.approved,0);
 assert.equal(coverage.problems.length,0,coverage.problems.join('\n'));
});
test('R34 no unauthorized practice mutations or approved publication from English drafts',()=>{
 for(const entry of topics){
  for(const level of reading.LEVELS){
   const b=JSON.parse(data('self-check/test-banks/reading/'+entry.id+'/en-'+level+'.json'));
   assert.equal(b.published,false);
   assert.equal(b.review?.contentApproved,true,false);
  }
 }
 assert.equal(manifest.version,'R31');
 assert.equal(manifest.gradedTestsEnabled,false);
 assert.equal(manifest.officialGradesEnabled,false);
});
