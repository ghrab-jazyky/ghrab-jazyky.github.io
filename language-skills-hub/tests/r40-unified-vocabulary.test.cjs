#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=filename=>fs.readFileSync(path.join(root,filename),'utf8');
const catalog=JSON.parse(read('data/cards.json')).entries;
const manifest=JSON.parse(read('version.json'));
const MODEL=require('../assets/lsh/v3/model.js');
const STORE=require('../assets/lsh/v3/store.js');
const MIG=require('../assets/lsh/v3/migration.js');
const ENGINE=require('../slovnicek/practice-engine.js');
const ISO='2026-11-11T12:00:00.000Z';
const sample=(term,translationCs,language='en')=>MODEL.normalizeWord({
 language,term,translationCs,senseId:'test-'+term.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
 sources:[{skill:'cteni',topicId:'rl-asteroids',savedAt:ISO}]
},ISO);
test('R40: all 29 catalog cards expose shared My Vocabulary and retain integrity hashes',()=>{
 assert.equal(catalog.length,29);
 const counts={konverzace:0,cteni:0,poslech:0};
 for(const entry of catalog){
  counts[entry.skill]++;
  const source=read(entry.relative);
  const hash=crypto.createHash('sha256').update(source).digest('hex');
  assert.equal(hash,manifest.contentHashes[entry.id],entry.id+' unexpected original source change');
  if(entry.skill==='konverzace'){
   assert.match(source,/assets\/lsh\/v3\/card-bridge\.js/,entry.id+' missing common bridge');
  }else if(entry.skill==='cteni'){
   const html=read(entry.lockSource||entry.relative);
   assert.match(html,/<script defer src="\.\.\/\.\.\/assets\/lsh\/v3\/reading-bridge\.js"><\/script>/,
    entry.id+' missing unified Reading vocabulary');
  }else{
   const html=read(entry.lockSource||entry.relative);
   assert.match(html,/assets\/lsh\/v3\/listening-bridge\.js/,entry.id);
   assert.ok(html.includes('data-topic-id="'+entry.id+'"'),entry.id);
  }
 }
 assert.deepEqual(counts,{konverzace:21,cteni:5,poslech:3});
 const bridge=read('assets/lsh/v3/card-bridge.js');
 assert.match(bridge,/createStore\(\{mode:'production'\}\)/);
 assert.doesNotMatch(bridge,/createStore\(\{mode:'staging'\}\)/);
 assert.match(bridge,/slovnicek\/\?zpet=/);
 const html=read('slovnicek/index.html');
 assert.match(html,/id="startFlash"/);assert.match(html,/id="startMatch"/);
 assert.match(html,/id="startExam"/);assert.match(html,/id="exportBackup"/);
 assert.match(html,/id="importBackup"/);assert.match(html,/id="replaceBackup"/);
});
test('R40: explicit legacy Reading conversion retains language, Czech translation and sources',()=>{
 const old={term:'  asteroidy  ',meaningCs:'vesmírná tělesa',language:'en',level:'B2',
  topicIds:['asteroids-planetary-defence','asteroids-planetary-defence'],context:'  from the article ',
  createdAt:ISO,updatedAt:ISO};
 const w=MIG.convertReading(old,ISO);
 assert.equal(w.language,'en');
 assert.equal(w.translationCs,'vesmírná tělesa');
 assert.equal(w.term,'asteroidy');assert.equal(w.level,'B2');
 assert.equal(w.context,'from the article');
 assert.deepEqual(w.sources.map(x=>x.topicId),['asteroids-planetary-defence']);
 assert.ok(/^en:rl-[0-9a-f]{16}$/.test(w.id));
 assert.equal(MIG.convertReading(old,ISO).id,w.id);
 assert.throws(()=>MIG.convertReading({...old,language:'zz'},ISO),/Neplatné/);
 assert.throws(()=>MIG.convertReading({...old,meaningCs:''},ISO),/Neplatné/);
});
test('R40: accept old Reading JSON backups, reject forged payloads, and convert to LSH schema',()=>{
 const old=MIG.convertReadingBackup(JSON.stringify({
  kind:'reading-lab-vocabulary-backup',schemaVersion:1,exportedAt:ISO,vocabulary:[
   {term:'  decision  ',meaningCs:'rozhodnutí',language:'en',level:'B1',
    topicIds:['asteroids-planetary-defence']}
  ]
 }),ISO);
 const converted=MODEL.validateImport(old,ISO);
 assert.equal(converted.length,1);
 assert.equal(converted[0].translationCs,'rozhodnutí');
 assert.equal(converted[0].language,'en');
 assert.throws(()=>MIG.convertReadingBackup('{"__proto__":1}',ISO),/Neznámý/);
 assert.throws(()=>MIG.convertReadingBackup('not JSON',ISO),/JSON/);
 const duplicate={term:'one',meaningCs:'jeden',language:'en'};
 assert.throws(()=>MIG.convertReadingBackup(JSON.stringify({kind:'reading-lab-vocabulary-backup',
   schemaVersion:1,vocabulary:[duplicate,duplicate]}),ISO),/Duplicitní/);
});
test('R40: new canonical JSON backup round-trips including learning progress and is validated',()=>{
 const a=sample('decision','rozhodnutí'),b=sample('journey','cesta');
 const reviewed=MODEL.reviewWord(a,'umim',ISO);
 const payload=MODEL.serializeExport([reviewed,b],ISO);
 const restored=MODEL.validateImport(payload,ISO);
 assert.equal(restored.length,2);
 assert.equal(restored[0].term,'decision');
 assert.equal(restored[0].reviews.length,1);
 assert.equal(restored[0].box,2);
 assert.equal(restored[0].sources[0].topicId,'rl-asteroids');
 const incoming=MODEL.combineImport([a],[b],false,ISO);
 assert.equal(incoming.length,2);
 assert.equal(MODEL.combineImport([a],[b],true,ISO).length,1);
 assert.throws(()=>MODEL.validateImport('{"kind":"evil"}',ISO),/Unsupported/);
 assert.throws(()=>MODEL.validateImport('['+' '.repeat(3*1024*1024)+']',ISO),/3 MB/);
});
test('R40: flashcards/matching and typed testing use strict, fair language matching',()=>{
 assert.equal(ENGINE.checkAnswer('rozhodnutí','Rozhodnutí!'),true);
 assert.equal(ENGINE.checkAnswer('společenský tlak','SPOLECENSKY tlak.'),true);
 assert.equal(ENGINE.checkAnswer('překonat; zvládnout','ZVLADNOUT'),true);
 assert.equal(ENGINE.checkAnswer('překonat; zvládnout','překonat'),true);
 assert.equal(ENGINE.checkAnswer('překonat; zvládnout','překon'),false);
 assert.equal(ENGINE.checkAnswer('15 let','14 let'),false);
 assert.equal(ENGINE.checkAnswer('jít domů','jít'),false);
 const a=sample('decide','rozhodnout'),b=sample('settle','rozhodnout'),c=sample('travel','cestovat');
 const pool=ENGINE.matchingDeck([a,b,c],3,()=>0.5);
 assert.equal(pool.length,2,'Matching must never show identical meanings twice');
 const deck=ENGINE.selectForTest([a,b,c],30,()=>0.5);
 assert.equal(deck.length,3);
 const answers=deck.map(w=>w.term==='travel'?'cestovat':'wrong');
 const result=ENGINE.grade(deck,answers);
 assert.equal(result.total,3);assert.equal(result.correct,1);
 assert.equal(result.rows.filter(x=>!x.correct).length,2);
 assert.throws(()=>ENGINE.grade(deck,['one']),/Incomplete/);
});
test('R40: IndexedDB-disabled mode is explicitly temporary; it still supports portable backups',async()=>{
 const stub=STORE.createStore({mode:'production',indexedDB:null,BroadcastChannel:null,storage:null});
 await stub.open();
 assert.equal(stub.status().mode,'temporary');
 const word=sample('planet','planeta');
 const written=await stub.saveWord(word,ISO);
 assert.equal(written.storedInIndexedDB,false);
 const json=await stub.exportWords(ISO);
 assert.equal(MODEL.validateImport(json,ISO)[0].term,'planet');
 const r=await stub.importWords(MODEL.serializeExport([sample('moon','měsíc')],ISO),{replace:true,now:ISO});
 assert.equal(r.count,1);
 assert.equal((await stub.listWords())[0].term,'moon');
 stub.close();
});
