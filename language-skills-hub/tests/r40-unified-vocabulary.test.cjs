#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('data/cards.json')).entries;
const manifest=JSON.parse(read('version.json'));
const hash=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
if(process.argv.includes('--hashes')){
 const hashes=Object.fromEntries(catalog.map(e=>[e.id,hash(read(e.relative))]));
 process.stdout.write('R40_MANIFEST_HASHES='+JSON.stringify(hashes)+'\n');
 process.exit(0);
}
test('R40: all 29 live cards and four student lock copies load ONE common vocabulary launcher',()=>{
 assert.equal(catalog.length,29);
 for(const e of catalog){
  const expected='<script defer src="../../assets/vocabulary-launcher.js" data-topic="'+e.id+'" data-skill="'+e.skill+'"></script>';
  const source=read(e.relative);
  assert.equal(source.split(expected).length,2,e.id+' missing or duplicate launcher');
  assert.equal(source.split('</body>').length,2,e.id+' malformed body close');
  assert.equal(hash(source),manifest.contentHashes[e.id],e.id+' source hash mismatch');
  if(e.lockSource){
   const locked=read(e.lockSource);
   assert.equal(locked.split(expected).length,2,e.id+' locked copy missing launcher');
  }
 }
 const source=read('assets/vocabulary-launcher.js');
 assert.match(source,/rl-vocab-button/);
 assert.match(source,/stopImmediatePropagation\(\)/);
 assert.match(source,/my-vocabulary\/index\.html/);
 assert.match(source,/new URL\('\.\.\/my-vocabulary\/index\.html',source\.src\)/);
});
test('R40: common vocabulary page provides list, selection, 3 games, exam and backup controls',()=>{
 const html=read('my-vocabulary/index.html');
 const source=read('my-vocabulary/app.js');
 const css=read('my-vocabulary/vocabulary.css');
 for(const id of ['wordList','selectVisible','clearSelection','addForm','search','filterLang',
  'filterTopic','trainingBoard','examSetup','examQuestion','examResults','examAnswer',
  'exportBackup','importMerge','importReplace','backupFile']){
  assert.match(html,new RegExp('id="'+id+'"'),id);
 }
 for(const key of ['flash','choice','match'])assert.match(html,new RegExp('data-training="'+key+'"'));
 assert.match(source,/db\.correct\(typed,expected\)/);
 assert.match(source,/db\.exportJSON\(\)/);
 assert.match(source,/db\.importJSON\(await file\.text\(\),importMode\)/);
 assert.match(source,/window\.confirm/);
 assert.match(css,/\[hidden\]\{display:none!important\}/);
});
test('R40: saved Reading Lab records and backups remain fully compatible; case and accents ignored',async()=>{
 const memory=new Map();
 globalThis.localStorage={
  getItem:key=>memory.get(key)||null,
  setItem:(key,value)=>memory.set(key,String(value))
 };
 globalThis.indexedDB=undefined;
 const store=require('../my-vocabulary/store.js');
 assert.equal(store.backupKind,'reading-lab-vocabulary-backup');
 const sample={term:'House',meaningCs:'dům',language:'en',level:'B1',topicIds:['rl-asteroids']};
 await store.save(sample);
 assert.equal((await store.all()).length,1);
 const id=(await store.all())[0].id;
 await store.save({...sample,topicIds:['cl-rodina']});
 assert.deepEqual((await store.all())[0].topicIds.sort(),['cl-rodina','rl-asteroids']);
 assert.equal(store.correct(' DŮM! ','dům'),true);
 assert.equal(store.correct('hOuSe','House'),true);
 assert.equal(store.correct(' 15 ','16'),false);
 assert.equal(store.correct('lucas','lucas; george lucas'),true);
 assert.equal(store.correct('luc','lucas; george lucas'),false);
 const backup=JSON.parse(await store.exportJSON());
 assert.equal(backup.kind,'reading-lab-vocabulary-backup');
 assert.equal(backup.schemaVersion,1);
 assert.equal(backup.vocabulary.length,1);
 assert.ok(backup.vocabulary[0].topicIds.includes('cl-rodina'));
 await store.remove(id);assert.equal((await store.all()).length,0);
 await store.importJSON(JSON.stringify(backup),'merge');
 assert.equal((await store.all()).length,1);
 await store.importJSON(JSON.stringify({...backup,vocabulary:[{...sample,term:'Cat',meaningCs:'kočka'}]}),'replace');
 assert.equal((await store.all()).length,1);
 assert.equal((await store.all())[0].term,'Cat');
 await assert.rejects(()=>store.importJSON('{"kind":"invalid","vocabulary":[]}','replace'),/kompatibilní/);
 await assert.rejects(()=>store.importJSON(JSON.stringify({...backup,vocabulary:[{term:'',meaningCs:'x',language:'en'}]}),'replace'),/Každé slovíčko/);
 await assert.rejects(()=>store.importJSON(JSON.stringify({...backup,vocabulary:new Array(5001).fill(sample)}),'merge'),/kompatibilní/);
 assert.equal((await store.all())[0].term,'Cat','invalid imports must not erase data');
});
