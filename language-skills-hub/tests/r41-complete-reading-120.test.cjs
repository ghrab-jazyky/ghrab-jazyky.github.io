#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('version.json'));
const cards=JSON.parse(read('data/cards.json')).entries;
const reading=require('../self-check/reading/reading-core.js');
const bankCore=require('../self-check/test-banks/reading/test-bank-core.js');
const inventory=require('./r35-content-coverage.cjs');
const languages=['en','es','de','fr'],levels=['A1','A2','B1','B2','C1','C2'];
const topics=cards.filter(c=>c.skill==='cteni');
const noSpaces=s=>s.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();

test('R41 all 120 Reading banks exist, no unapproved draft has reached public catalog',()=>{
 assert.equal(topics.length,5);
 assert.equal(manifest.version,'R31');
 assert.equal(manifest.topicCount,29);assert.equal(manifest.variantCount,642);
 assert.equal(manifest.backendEnabled,false);assert.equal(manifest.officialGradesEnabled,false);
 assert.equal(inventory.expected.readingVariants,120);
 assert.equal(inventory.expected.listeningVariants,18);
 assert.equal(inventory.actual.draftReading,120);
 assert.equal(inventory.actual.missing,0);
 assert.equal(inventory.actual.invalid,0);
 assert.equal(inventory.actual.approvedForStudents,0);
 assert.equal(inventory.actual.authoredQuestions,1200);
 for(const file of ['index.html','assets/hub.js','self-check/reading/reading.js'])
  assert.doesNotMatch(read(file),/test-banks\/reading|R41-CONTENT-AUDIT/);
});

test('R41 source SHA, exact original title and all independently authored items across 4 languages and 6 levels',()=>{
 let count=0;
 for(const card of topics){
  const source=read(card.relative),digest=createHash('sha256').update(Buffer.from(source,'utf8')).digest('hex');
  assert.equal(digest,manifest.contentHashes[card.id],card.id+' modified approved source');
  const data=reading.parseReadingData(source);
  for(const lang of languages)for(const level of levels){
   const file='self-check/test-banks/reading/'+card.id+'/'+lang+'-'+level+'.json';
   const bank=JSON.parse(read(file));
   assert.equal(bank.topic,card.id,file);
   assert.equal(bank.language,lang,file);assert.equal(bank.level,level,file);
   assert.equal(bank.published,false,file);
   assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL',file);
   assert.ok(/^R\d+-CONTENT-AUDIT-1$/.test(bank.auditRevision),file+' not content-authored');
   assert.ok(!/AUTO_GENERATED|STRUCTURAL|mechanical/i.test(String(bank.editorialStatus||'')+' '+String(bank.generationMethod||'')),file+' contains scaffold metadata');
   const practice=reading.variantFromData(data,lang,level);
   assert.equal(bank.sourceTitle,practice.title,file+' wrong original title');
   assert.equal(bank.sourcePracticeContentHash,digest,file);
   let variant;try{variant=bankCore.makeQaVariant(bank,practice,digest);}
   catch(error){throw new Error(file+': '+error.message,{cause:error});}
   reading.validateVariant(variant);
   assert.deepEqual(variant.paragraphs,practice.paragraphs,file);
   assert.equal(variant.questions.length,10,file);
   const stems=new Set(practice.questions.map(q=>noSpaces(q.q)));
   const options=new Set(),ownStems=new Set();
   const positions=[0,0,0,0];
   for(const q of variant.questions){
    assert.equal(stems.has(noSpaces(q.q)),false,q.id+' practice question copy');
    assert.equal(ownStems.has(noSpaces(q.q)),false,q.id+' repeated within assessment');
    ownStems.add(noSpaces(q.q));
    assert.ok(q.sourceParagraph>=1&&q.sourceParagraph<=practice.paragraphs.length,q.id);
    assert.ok(q.explanation.length>=30,q.id+' insufficient rationale');
    assert.ok(q.choices.every(c=>c.length>=10),q.id+' too-short option');
    assert.ok(new Set(q.choices.map(noSpaces)).size===4,q.id+' duplicate options');
    assert.ok(!q.generationMethod,q.id+' mechanical generation marker');
    positions[q.answer]++;
    options.add(q.id);
   }
   assert.equal(options.size,10,file);
   assert.ok(positions.every(n=>n>=2&&n<=3),file+' unbalanced answers');
   const full=Object.fromEntries(variant.questions.map(q=>[q.id,q.answer]));
   const perfect=reading.score(variant,full);
   assert.equal(perfect.points,10,file);assert.equal(perfect.maxPoints,10,file);
   const incorrect=Object.fromEntries(variant.questions.map(q=>[q.id,(q.answer+1)%4]));
   assert.equal(reading.score(variant,incorrect).points,0,file);
   count++;
  }
 }
 assert.equal(count,120);
});
