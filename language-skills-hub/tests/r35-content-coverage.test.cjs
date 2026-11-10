#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('version.json'));
const cards=JSON.parse(read('data/cards.json')).entries;
const bankCore=require('../self-check/test-banks/reading/test-bank-core.js');
const reading=require('../self-check/reading/reading-core.js');
const inventory=require('./r35-content-coverage.cjs');
const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
test('R35 planned coverage counts exact approved source variants without claiming completion',()=>{
 assert.equal(cards.filter(x=>x.skill==='cteni').length,5);
 assert.equal(cards.filter(x=>x.skill==='poslech').length,3);
 assert.equal(inventory.expected.readingVariants,120);
 assert.equal(inventory.expected.listeningVariants,18);
 assert.equal(inventory.expected.total,138);
 assert.equal(inventory.actual.approvedForStudents,0);
 assert.equal(inventory.actual.invalid,0);
 assert.equal(inventory.actual.draftReading,24);
 assert.equal(inventory.actual.draftListening,0);
 assert.equal(inventory.actual.authoredQuestions,240);
 assert.equal(inventory.actual.missing,114);
});
test('R35 every authored bank has exact hash/title, separate questions, scoring and publication locks',()=>{
 const practiceCache={};
 let tally=0;
 for(const row of inventory.rows){
  if(row.status!=='DRAFT_UNAPPROVED')continue;
  assert.equal(row.skill,'cteni');
  const entry=cards.find(x=>x.id===row.topic);
  assert.ok(entry&&entry.skill==='cteni');
  const sourcePath=entry.relative,raw=read(sourcePath);
  if(!practiceCache[sourcePath])practiceCache[sourcePath]=reading.parseReadingData(raw);
  const actual=createHash('sha256').update(raw).digest('hex');
  assert.equal(actual,manifest.contentHashes[row.topic]);
  const bank=JSON.parse(read(row.file));
  const original=reading.variantFromData(practiceCache[sourcePath],row.language,row.level);
  const qa=bankCore.makeQaVariant(bank,original,actual);
  reading.validateVariant(qa);
  assert.deepEqual(qa.paragraphs,original.paragraphs);
  assert.equal(bank.published,false);
  assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
  assert.equal(qa.questions.length,10);
  const ids=new Set(original.questions.map(q=>q.id));
  const stems=new Set(original.questions.map(q=>q.q.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim()));
  for(const q of qa.questions){
   assert.equal(ids.has(q.id),false,q.id+' reused practice ID');
   assert.equal(stems.has(q.q.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim()),false,q.id+' reused practice stem');
  }
  const answers=Object.fromEntries(qa.questions.map(q=>[q.id,q.answer]));
  assert.equal(reading.score(qa,answers).points,10);
  tally+=qa.questions.length;
 }
 assert.equal(tally,240);
});
test('R35 no draft bank is exposed through public teacher catalogue',()=>{
 const home=read('index.html');
 const hub=read('assets/hub.js');
 const student=read('self-check/reading/reading.js');
 for(const src of [home,hub,student])
  assert.doesNotMatch(src,/test-banks\/reading|r35-es-a1|r34-en-a1/);
});
