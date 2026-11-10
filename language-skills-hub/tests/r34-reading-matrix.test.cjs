#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const reading=require('../self-check/reading/reading-core.js');
const bankCore=require('../self-check/test-banks/reading/test-bank-core.js');
const catalog=JSON.parse(read('data/cards.json'));
const manifest=JSON.parse(read('version.json'));
const langs=['en','es','de','fr'],levels=['A1','A2','B1','B2','C1','C2'];
const topics=catalog.entries.filter(e=>e.skill==='cteni');
const originals=new Map(),banks=new Map();
function fixture(entry){
 if(originals.has(entry.id))return originals.get(entry.id);
 const html=read(entry.relative);
 const hash=createHash('sha256').update(html).digest('hex');
 assert.equal(hash,manifest.contentHashes[entry.id],'Original checksum changed: '+entry.id);
 const data=reading.parseReadingData(html);
 originals.set(entry.id,data);return data;
}
function bankPath(topic,lang,level){
 return 'self-check/test-banks/reading/'+topic+'/'+lang+'-'+level+'.json';
}
test('R34 matrix exactly covers 5 approved Reading topics in 4 languages and 6 levels',()=>{
 assert.equal(topics.length,5);
 let authored=0,scaffold=0;
 for(const entry of topics){
  const data=fixture(entry);
  for(const lang of langs)for(const level of levels){
   assert.ok(entry.languages.includes(lang)&&entry.levels.includes(level),'Unsupported catalog variant');
   const name=bankPath(entry.id,lang,level);
   assert.ok(fs.existsSync(path.join(root,name)),'Missing assessment bank: '+name);
   const bank=JSON.parse(read(name));
   const practice=reading.variantFromData(data,lang,level);
   const selection={topic:entry.id,lang,level};
   assert.equal(bankCore.validate(bank,practice,manifest.contentHashes[entry.id],selection),true,name);
   assert.equal(bank.published,false);
   assert.equal(bank.status,'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL');
   const q=bankCore.makeQaVariant(bank,practice,manifest.contentHashes[entry.id],selection);
   reading.validateVariant(q);
   assert.equal(q.questions.length,10,name);
   assert.deepEqual(q.paragraphs,practice.paragraphs);
   assert.equal(q.questions.filter(x=>practice.questions.some(y=>y.id===x.id||y.q===x.q)).length,0,name);
   const score=reading.score(q,Object.fromEntries(q.questions.map(x=>[x.id,x.answer])));
   assert.equal(score.points,10);
   assert.equal(score.maxPoints,10);
   const wrong=reading.score(q,Object.fromEntries(q.questions.map(x=>[x.id,(x.answer+1)%4])));
   assert.equal(wrong.points,0);
   if(bank.editorialStatus==='AUTO_GENERATED_NOT_PEDAGOGICALLY_VALIDATED')scaffold++;
   else authored++;
   banks.set(entry.id+':'+lang+':'+level,bank);
  }
 }
 assert.equal(banks.size,120);
 assert.equal(authored,2,'Only B1/B2 are manually authored, pending external review');
 assert.equal(scaffold,118,'All other test banks are explicitly unvalidated scaffolds');
});
test('R34 no machine-created draft can claim content approval or become a school grade',()=>{
 for(const bank of banks.values()){
  assert.equal(bank.published,false);
  assert.notEqual(bank.status,'APPROVED');
  assert.notEqual(bank.editorialStatus,'PEDAGOGICALLY_APPROVED');
 }
 const preview=read('self-check/test-banks/reading/preview.js');
 assert.match(preview,/AUTO_GENERATED_NOT_PEDAGOGICALLY_VALIDATED/);
 assert.match(preview,/NOT SCORED AS AN ASSESSMENT/);
 assert.match(preview,/sourceHash\(originalHtml\)/);
 assert.match(preview,/manifest.contentHashes\[topic\]/);
 assert.doesNotMatch(preview,/\bsendBeacon\s*\(|XMLHttpRequest|eval\s*\(/);
 assert.doesNotMatch(read('index.html'),/test-banks\/reading\/preview\.html/);
 assert.doesNotMatch(read('assets/hub.js'),/test-banks\/reading\/preview\.html/);
 assert.equal(manifest.version,'R31');
 assert.equal(manifest.backendEnabled,false);
 assert.equal(manifest.officialGradesEnabled,false);
});
test('R34 wrong topic, wrong language and wrong CEFR selection are rejected',()=>{
 const bank=banks.get('rl-asteroids:es:A1');
 const p=reading.variantFromData(fixture(topics.find(e=>e.id==='rl-asteroids')),'es','A1');
 const hash=manifest.contentHashes['rl-asteroids'];
 for(const selection of [
  {topic:'rl-can-mistakes',lang:'es',level:'A1'},
  {topic:'rl-asteroids',lang:'en',level:'A1'},
  {topic:'rl-asteroids',lang:'es',level:'A2'}
 ])assert.throws(()=>bankCore.validate(bank,p,hash,selection),/Wrong topic\/language\/level/);
 assert.throws(()=>bankCore.validate({...bank,published:true},p,hash,{topic:bank.topic,lang:'es',level:'A1'}),/teacher approval/);
 const q=bank.questions.map(x=>({...x,choices:x.choices.slice()}));
 q[0].choices[q[0].answer]='A false statement not in the passage';
 assert.throws(()=>bankCore.validate({...bank,questions:q},p,hash,{topic:bank.topic,lang:'es',level:'A1'}),/not grounded/);
});
