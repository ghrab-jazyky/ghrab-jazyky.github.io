#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const dir=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(dir,p),'utf8');
const manifest=JSON.parse(read('version.json')),catalog=JSON.parse(read('data/cards.json'));
const reading=require('../self-check/reading/reading-core.js');
const listening=require('../self-check/listening/listening-core.js');
const manual=require('../self-check/test-banks/reading/test-bank-core.js');
const candidate=require('../self-check/test-banks/candidate-core.js');
const levels=['A1','A2','B1','B2','C1','C2'],langs=['en','es','de','fr'];
const entries=catalog.entries.filter(e=>['cteni','poslech'].includes(e.skill));
const hash=b=>createHash('sha256').update(b).digest('hex');
const source=e=>{
 const file=path.join(dir,e.relative),bytes=fs.readFileSync(file),digest=hash(bytes);
 assert.equal(digest,manifest.contentHashes[e.id],'Published source changed: '+e.id);
 return bytes.toString('utf8');
};
const collectionPath=(skill,id)=>'self-check/test-banks/'+skill+'/collections/'+id+'.json';
test('R34 complete catalogue inventory and compatibility with production R31',()=>{
 assert.equal(manifest.version,'R31');
 assert.equal(manifest.topicCount,29);
 assert.equal(manifest.variantCount,642);
 assert.equal(catalog.entries.filter(e=>e.skill==='konverzace').length,21);
 assert.equal(entries.filter(e=>e.skill==='cteni').length,5);
 assert.equal(entries.filter(e=>e.skill==='poslech').length,3);
 assert.equal(manifest.backendEnabled,false);
 assert.equal(manifest.officialGradesEnabled,false);
});
test('R34 all 120 Reading variants have exactly one bank, no exact practice stem and valid source evidence',()=>{
 let variants=0,manualCount=0,candidateCount=0,questions=0;
 for(const e of entries.filter(e=>e.skill==='cteni')){
  const data=reading.parseReadingData(source(e));
  const col=JSON.parse(read(collectionPath('reading',e.id)));
  assert.equal(col.topic,e.id);
  assert.equal(col.published,false);
  for(const lang of langs)for(const level of levels){
   const practice=reading.variantFromData(data,lang,level);
   if(e.id==='rl-can-mistakes'&&lang==='en'&&['B1','B2'].includes(level)){
    const bank=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'));
    assert.equal(manual.validate(bank,practice,manifest.contentHashes[e.id]),true);
    reading.validateVariant(manual.makeQaVariant(bank,practice,manifest.contentHashes[e.id]));
    assert.equal(col.variants[lang][level],undefined);
    manualCount++;questions+=bank.questions.length;
   }else{
    const variant=col.variants[lang]?.[level];
    assert.ok(variant,'Missing '+e.id+' '+lang+' '+level);
    const ctx={topic:e.id,lang,level,sourceHash:manifest.contentHashes[e.id]};
    assert.equal(candidate.validateReading(col,variant,practice,ctx),true);
    const q=candidate.readingVariant(col,variant,practice,ctx);
    reading.validateVariant(q);
    const correct=Object.fromEntries(q.questions.map(x=>[x.id,x.answer]));
    const score=reading.score(q,correct);
    assert.equal(score.points,q.questions.length);
    assert.equal(score.unanswered,0);
    assert.equal(variant.published,false);
    assert.equal(variant.stage,'CLAUDE_CONTENT_REWRITE_PENDING');
    candidateCount++;questions+=variant.questions.length;
   }
   variants++;
  }
 }
 assert.equal(variants,120);assert.equal(manualCount,2);assert.equal(candidateCount,118);
 assert.equal(questions,1002);
});
test('R34 all 18 Listening variants contain independently drafted tasks and remain blocked pending video and Claude audit',()=>{
 let variants=0,tasks=0;
 for(const e of entries.filter(e=>e.skill==='poslech')){
  const d=listening.extractJson(source(e),'DATA');
  const col=JSON.parse(read(collectionPath('listening',e.id)));
  assert.equal(col.topic,e.id);
  assert.equal(col.published,false);
  for(const level of levels){
   const sourceVariant=listening.variant(d,level),v=col.variants[level];
   const ctx={topic:e.id,level,sourceHash:manifest.contentHashes[e.id]};
   assert.equal(candidate.validateListening(col,v,sourceVariant,ctx),true);
   listening.validate(v);
   assert.equal(v.stage,'CLAUDE_CONTENT_AUDIT_PENDING');
   assert.match(v.provenance,/audit|review/i);
   const count=x=>x.gist.length+x.detail.length+x.sequence.length+x.facts.length+x.open.length;
   const filled={
    gist:v.gist.map(q=>q.correct),detail:v.detail.map(q=>q.correct),
    sequence:v.sequence.map((_,i)=>i),facts:v.facts.map(()=>'Unverified student response'),
    open:v.open.map(()=>'Unverified interpretation')
   };
   const assessment=listening.assess(v,filled);
   assert.equal(assessment.objectiveCorrect,assessment.objectiveMax);
   assert.equal(assessment.writing.length,2);
   assert.ok(count(v)<count(sourceVariant),'Listening seed should be shorter than practice');
   variants++;tasks+=count(v);
  }
 }
 assert.equal(variants,18);
 assert.equal(tasks,192);
});
test('R34 mismatched source and premature publication fail closed',()=>{
 const e=entries.find(e=>e.id==='rl-plastic-ocean');
 const sourceData=reading.parseReadingData(source(e));
 const practice=reading.variantFromData(sourceData,'fr','C1');
 const col=JSON.parse(read(collectionPath('reading',e.id)));
 const original=col.variants.fr.C1,ctx={topic:e.id,lang:'fr',level:'C1',sourceHash:manifest.contentHashes[e.id]};
 assert.throws(()=>candidate.validateReading({...col,published:true},original,practice,ctx),/Unapproved/);
 assert.throws(()=>candidate.validateReading(col,{...original,published:true},practice,ctx),/Unapproved/);
 assert.throws(()=>candidate.validateReading(col,original,practice,{...ctx,sourceHash:'0'.repeat(64)}),/Unapproved/);
 assert.throws(()=>candidate.validateReading(col,original,{...practice,title:'altered'},ctx),/does not match/);
 const bad=JSON.parse(JSON.stringify(original));bad.questions[0].evidence='an impossible sentence';
 assert.throws(()=>candidate.validateReading(col,bad,practice,ctx),/Evidence must be verbatim/);
 const l=entries.find(e=>e.skill==='poslech'),d=listening.extractJson(source(l),'DATA'),lv=listening.variant(d,'B2');
 const lc=JSON.parse(read(collectionPath('listening',l.id))),cv=lc.variants.B2;
 assert.throws(()=>candidate.validateListening(lc,{...cv,published:true},lv,{topic:l.id,level:'B2',sourceHash:manifest.contentHashes[l.id]}),/Unapproved/);
});
test('R34 no original practice assets, public teacher UI or main student runtime are modified',()=>{
 const root=read('index.html'),hub=read('assets/hub.js');
 const activeReading=read('self-check/reading/reading.js');
 const activeListening=read('self-check/listening/listening-student.js');
 for(const content of [root,hub,activeReading,activeListening])
  assert.doesNotMatch(content,/LSH_READING_TEST_CANDIDATE_R34|LSH_LISTENING_TEST_CANDIDATE_R34|r34-full-content/);
});
