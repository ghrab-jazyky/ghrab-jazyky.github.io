#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('data/cards.json'));
const manifest=JSON.parse(read('version.json'));
const coverage=JSON.parse(read('self-check/test-banks/coverage.json'));
const reading=require('../self-check/reading/reading-core.js');
const generic=require('../self-check/test-banks/reading/generic-bank-core.js');
const grade=require('../self-check/results/grade-core.js');
const bank=JSON.parse(read('self-check/test-banks/reading/rl-asteroids/en-B2.json'));
const entry=reading.readingEntry(catalog,'rl-asteroids');
const original=read(entry.relative);
const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,entry.relative))).digest('hex');
const practice=reading.variantFromData(reading.parseReadingData(original),'en','B2');
const selection={language:'en',level:'B2'};

test('R35 generic bank validates actual catalog, source, title, 10 original tasks and grade',()=>{
 assert.equal(manifest.version,'R31');
 assert.equal(manifest.contentHashes[bank.topic],hash);
 assert.equal(practice.title,'Asteroids: A Question of Risk, Not Panic');
 assert.equal(bank.published,false);
 assert.equal(generic.validate(bank,practice,entry,hash,selection),true);
 const testVariant=generic.variant(bank,practice,entry,hash,selection);
 reading.validateVariant(testVariant);
 assert.deepEqual(testVariant.paragraphs,practice.paragraphs);
 assert.equal(testVariant.questions.length,10);
 const originalIds=new Set(practice.questions.map(q=>q.id));
 const originalStems=new Set(practice.questions.map(q=>q.q.toLowerCase().trim()));
 for(const q of testVariant.questions){
  assert.ok(!originalIds.has(q.id));
  assert.ok(!originalStems.has(q.q.toLowerCase().trim()));
  assert.ok(q.sourceParagraph>=1&&q.sourceParagraph<=practice.paragraphs.length);
 }
 const answerMap=Object.fromEntries(testVariant.questions.map(q=>[q.id,q.answer]));
 assert.equal(reading.score(testVariant,answerMap).points,10);
 assert.equal(grade.proposal(10,10).grade,1);
 assert.equal(reading.score(testVariant,{}).unanswered,10);
});

test('R35 independent-bank validator rejects forged topic, lang, CEFR and title',()=>{
 assert.throws(()=>generic.validate({...bank,topic:'rl-email-friend'},practice,entry,hash,selection),/metadata/);
 assert.throws(()=>generic.validate({...bank,language:'ru'},practice,entry,hash,selection),/does not match the requested/);
 assert.throws(()=>generic.validate({...bank,level:'A1'},practice,entry,hash,selection),/does not match the requested/);
 assert.throws(()=>generic.validate({...bank,sourceVariantTitle:'Not The Same'},practice,entry,hash,selection),/does not match/);
 assert.throws(()=>generic.validate({...bank,published:true},practice,entry,hash,selection),/must not/);
 assert.throws(()=>generic.validate({...bank,sourcePracticeContentHash:'0'.repeat(64)},practice,entry,hash,selection),/hash mismatch/);
 assert.throws(()=>generic.validate({...bank,durationMinutesSuggested:130},practice,entry,hash,selection),/time limit/);
});

test('R35 reject duplicated or reused tasks and invalid keys',()=>{
 const questions=bank.questions.map(q=>({...q}));
 questions[1].q=practice.questions[1].q;
 assert.throws(()=>generic.validate({...bank,questions},practice,entry,hash,selection),/must differ/);
 const duplicated=bank.questions.map(q=>({...q}));duplicated[3].id=duplicated[1].id;
 assert.throws(()=>generic.validate({...bank,questions:duplicated},practice,entry,hash,selection),/Duplicate/);
 const badKey=bank.questions.map(q=>({...q,answer:0}));
 assert.throws(()=>generic.validate({...bank,questions:badKey},practice,entry,hash,selection),/unbalanced/);
 const wrongParagraph=bank.questions.map(q=>({...q}));wrongParagraph[0].sourceParagraph=99;
 assert.throws(()=>generic.validate({...bank,questions:wrongParagraph},practice,entry,hash,selection),/passage reference/);
});

test('R35 inventory represents precisely seven unapproved banks and no published assessment',()=>{
 assert.equal(coverage.counts.total,138);
 assert.equal(coverage.counts.drafted,7);
 assert.equal(coverage.counts.missing,131);
 assert.equal(coverage.counts.teacherApproved,0);
 const slot=coverage.slots.find(s=>s.topic==='rl-asteroids'&&s.language==='en'&&s.level==='B2');
 assert.equal(slot.status,'DRAFT_UNAPPROVED');
 assert.equal(slot.testBank,'self-check/test-banks/reading/rl-asteroids/en-B2.json');
 const preview=read('self-check/test-banks/reading/universal-preview.js');
 assert.match(preview,/reading\.readingEntry\(catalog,topic\)/);
 assert.match(preview,/sourceHash\(originalHtml\)/);
 assert.match(preview,/testBank\.variant\(bank,practice,entry,actual,\{language,level\}\)/);
 assert.doesNotMatch(preview,/XMLHttpRequest|sendBeacon|WebSocket|eval\s*\(/);
 for(const page of ['index.html','assets/hub.js','self-check/reading/reading.js']){
  assert.doesNotMatch(read(page),/universal-preview|generic-bank-core|rl-asteroids\/en-B2\.json/);
 }
});
