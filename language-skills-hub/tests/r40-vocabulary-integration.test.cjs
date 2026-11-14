#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const model=require('../assets/lsh/v3/model.js');
const store=require('../assets/lsh/v3/store.js');
const practice=require('../slovnicek/practice.js');
const catalog=JSON.parse(read('data/cards.json')).entries;
const manifest=JSON.parse(read('version.json'));
test('R40: all 30 cards are connected to a shared production vocabulary store',()=>{
 assert.equal(catalog.length,32);
 const conv=catalog.filter(x=>x.skill==='konverzace'),readers=catalog.filter(x=>x.skill==='cteni'),listeners=catalog.filter(x=>x.skill==='poslech');
 assert.deepEqual([conv.length,readers.length,listeners.length],[22,5,5]);
 const convBridge=read('assets/lsh/v3/card-bridge.js'),shared=read('assets/lsh/v3/card-vocabulary.js');
 assert.match(convBridge,/createStore\(\{mode:'production'\}\)/);
 assert.doesNotMatch(convBridge,/createStore\(\{mode:'staging'\}\)/);
 assert.match(shared,/createStore\(\{mode:'production'\}\)/);
 for(const e of catalog){
  const source=read(e.relative);
  assert.equal(crypto.createHash('sha256').update(source).digest('hex'),manifest.contentHashes[e.id],e.id);
  if(e.skill==='konverzace'){
   assert.match(source,/assets\/lsh\/v3\/card-bridge\.js/);
   assert.match(source,/assets\/lsh\/v3\/store\.js/);
  }else{
   for(const filename of ['model.js','store.js','card-vocabulary.js'])
    assert.match(source,new RegExp('assets/lsh/v3/'+filename.replace('.','\\.') ),e.id+' '+filename);
  }
 }
 assert.match(read('slovnicek/index.html'),/id="exportBtn"/);
 assert.match(read('slovnicek/index.html'),/id="importFile"/);
 assert.match(read('slovnicek/index.html'),/data-mode="flash"/);
 assert.match(read('slovnicek/index.html'),/data-mode="choice"/);
 assert.match(read('slovnicek/index.html'),/data-mode="match"/);
 assert.match(read('slovnicek/index.html'),/data-mode="test"/);
});
test('R40: game answers are case/diacritic tolerant but not falsely fuzzy',()=>{
 const examples=[{id:'1',term:'fifteen',translationCs:'patnáct',language:'en'},
  {id:'2',term:'apple',translationCs:'jablko',language:'en'},
  {id:'3',term:'pear',translationCs:'hruška',language:'en'},
  {id:'4',term:'book',translationCs:'kniha',language:'en'}];
 assert.equal(practice.gradeWritten(examples[0],'PATNACT!!!').correct,true);
 assert.equal(practice.gradeWritten(examples[0],'patnact').correct,true);
 assert.equal(practice.gradeWritten(examples[0],'patnacte').correct,false);
 assert.equal(practice.gradeWritten(examples[0],'').correct,false);
 assert.equal(practice.selectChoices(examples[0],examples,()=>.75).length,4);
 assert.equal(practice.selectChoices(examples[0],examples,()=>.75).filter(x=>x.correct).length,1);
 const match=practice.buildMatch(examples,()=>.33);
 assert.equal(match.pairs.length,4);
 assert.equal(new Set(match.left.map(x=>x.id)).size,4);
 assert.deepEqual(practice.summarize([{correct:true},{correct:false},{correct:true}]),{count:3,correct:2,wrong:1,percent:67});
});
test('R40: validated full backup round-trip with merge and replace; no student identifiers',()=>{
 const a=model.normalizeWord({id:'manual:11111111-1111-4111-8111-111111111111',
   language:'en',term:'book',translationCs:'kniha',senseId:null,
   sources:[{skill:'cteni',topicId:'rl-asteroids',savedAt:'2026-11-11T00:00:00.000Z'}]},
  '2026-11-11T00:00:00.000Z');
 const b=model.normalizeWord({id:'manual:22222222-2222-4222-8222-222222222222',
   language:'es',term:'libro',translationCs:'kniha',senseId:null,
   sources:[{skill:'konverzace',topicId:'cl-skola',savedAt:'2026-11-11T00:00:00.000Z'}]},
  '2026-11-11T00:00:00.000Z');
 const json=model.serializeExport([a,b],'2026-11-11T00:00:00.000Z');
 assert.match(json,/"kind": "lsh-slovnicek"/);
 assert.doesNotMatch(json,/studentEmail|studentId|schoolAccount|authToken/);
 const recovered=model.validateImport(json,'2026-11-11T00:00:00.000Z');
 assert.deepEqual(recovered.map(w=>w.term),['book','libro']);
 assert.equal(model.combineImport([a],recovered,false,'2026-11-11T00:00:00.000Z').length,2);
 assert.equal(model.combineImport([a],recovered,true,'2026-11-11T00:00:00.000Z').length,2);
 assert.throws(()=>model.validateImport(json.replace('lsh-slovnicek','other-brand')),/Unsupported/);
 assert.throws(()=>model.validateImport(json.replace('"schemaVersion": 1','"schemaVersion": 42')),/Unsupported/);
 assert.throws(()=>model.validateImport('{'),/Invalid JSON/);
});
test('R40: store exposes local save, export, import and failure warning',async()=>{
 const db=store.createStore({mode:'production',indexedDB:null,BroadcastChannel:null,storage:null});
 await db.open();
 assert.equal(db.status().mode,'temporary');
 const first=await db.addManualWord({language:'en',term:'apple',translationCs:'jablko'},
  '2026-11-11T00:00:00.000Z',{randomUUID:()=> '11111111-1111-4111-8111-111111111111'});
 assert.equal(first.storedInIndexedDB,false);
 assert.equal((await db.listWords()).length,1);
 const backup=await db.exportWords('2026-11-11T00:00:00.000Z');
 const other=store.createStore({mode:'production',indexedDB:null,BroadcastChannel:null,storage:null});
 await other.open();
 assert.equal((await other.listWords()).length,0);
 const merged=await other.importWords(backup,{replace:false,now:'2026-11-11T00:00:00.000Z'});
 assert.equal(merged.count,1);
 assert.equal((await other.listWords())[0].term,'apple');
 const deleted=await other.importWords(model.serializeExport([],'2026-11-11T00:00:00.000Z'),
  {replace:true,now:'2026-11-11T00:00:00.000Z'});
 assert.equal(deleted.count,0);
 assert.equal((await other.listWords()).length,0);
 db.close();other.close();
});
