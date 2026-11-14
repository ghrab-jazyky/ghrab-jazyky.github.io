#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=x=>fs.readFileSync(path.join(root,x),'utf8');
const data=JSON.parse(read('data/cards.json')).entries;
const version=JSON.parse(read('version.json'));
const MODEL=require('../assets/lsh/v3/model.js'),legacy=require('../assets/lsh/v3/legacy-reading-migration.js');
const bridge=require('../assets/lsh/v3/card-bridge.js');
test('R49: every one of 30 cards uses exactly one canonical vocabulary bridge',()=>{
 assert.equal(data.length,32);
 assert.deepEqual(['konverzace','cteni','poslech'].map(skill=>data.filter(e=>e.skill===skill).length),[22,5,5]);
 for(const e of data){
  const html=read(e.relative);
  assert.equal(crypto.createHash('sha256').update(html).digest('hex'),version.contentHashes[e.id],
   'Content integrity broken '+e.id);
  if(e.skill==='konverzace'){
   assert.equal((html.match(/assets\/lsh\/v3\/card-bridge\.js/g)||[]).length,1,e.id);
   assert.doesNotMatch(html,/card-vocabulary\.js|reading-lab-vocabulary/,e.id);
  }else{
   assert.equal((html.match(/assets\/lsh\/v3\/card-vocabulary\.js/g)||[]).length,1,e.id);
   if(e.skill==='cteni'){
    assert.equal((html.match(/assets\/lsh\/v3\/legacy-reading-migration\.js/g)||[]).length,1,e.id);
    for(const removed of [/ReadingLabVocab/,/rl-vocab-button/,/rl-word-add/,/reading-lab-vocabulary/])
     assert.doesNotMatch(html,removed,'Legacy bank not retired '+e.id);
   }else assert.doesNotMatch(html,/ReadingLabVocab|legacy-reading-migration\.js/,e.id);
  }
 }
});
test('R49: shared nav, a single inline Reading save form and no native prompt',()=>{
 const s=read('assets/lsh/v3/card-vocabulary.js');
 const css=read('assets/lsh/v3/card-vocabulary.css');
 assert.match(s,/createStore\(\{mode:'production'\}\)/);
 assert.match(s,/const a=make\('a','My Vocabulary','lsh-vocab-nav'\)/);
 assert.match(s,/const form=make\('form',undefined,'lsh-vocab-reading-form'\)/);
 assert.match(s,/save\(term,translation,/);
 assert.doesNotMatch(s,/root\.prompt\(/);
 assert.match(css,/\.lsh-vocab-nav\{/);
 assert.match(css,/\.lsh-vocab-reading-form\{/);
 assert.match(read('slovnicek/index.html'),/legacy-reading-migration\.js/);
 assert.match(read('slovnicek/vocabulary.js'),/migrateLegacyReading\(/);
});
test('R49: 5 known legacy Reading topics map to real cards with canonical sense IDs',()=>{
 assert.deepEqual(Object.keys(legacy.LEGACY_TOPICS).sort(),[
  'an-email-from-a-friend','asteroids-planetary-defence','can-mistakes-help-us-learn',
  'instant-messages','plastic-ocean-and-our-choices'].sort());
 const source={id:'en|orbit|oběžná dráha',term:'orbit',meaningCs:'oběžná dráha',
  language:'en',level:'B2',topicIds:['asteroids-planetary-defence'],
  context:'an orbit',createdAt:'2026-11-01T09:00:00.000Z',updatedAt:'2026-11-01T10:00:00.000Z'};
 const converted=legacy.convertWord(source,'2026-11-12T00:00:00.000Z');
 assert.equal(converted.id,'en:'+legacy.senseId('en','orbit','oběžná dráha'));
 assert.equal(converted.senseId,bridge.senseId('en','orbit','cz:oběžná dráha'));
 assert.equal(converted.translationCs,'oběžná dráha');
 assert.deepEqual(converted.sources,[{skill:'cteni',topicId:'rl-asteroids',savedAt:source.createdAt}]);
 assert.equal(converted.createdAt,source.createdAt);
 assert.equal(MODEL.normalizeWord(converted).id,converted.id);
});
test('R49: old JSON Reading backups convert without losing words or damaging new format',()=>{
 const now='2026-11-12T00:00:00.000Z';
 const first={id:'en|orbit|oběžná dráha',term:'orbit',meaningCs:'oběžná dráha',
  language:'en',level:'B1',topicIds:['asteroids-planetary-defence'],
  createdAt:'2026-11-11T01:00:00.000Z',updatedAt:'2026-11-11T01:00:00.000Z'};
 const old=JSON.stringify({kind:'reading-lab-vocabulary-backup',schemaVersion:1,
  exportedAt:now,vocabulary:[first]});
 const fresh=MODEL.validateImport(legacy.convertBackup(old,now),now);
 assert.equal(fresh.length,1);
 assert.equal(fresh[0].term,'orbit');
 assert.equal(fresh[0].sources[0].topicId,'rl-asteroids');
 assert.throws(()=>legacy.convertBackup('bad'),/JSON/);
 assert.throws(()=>legacy.convertBackup(old.replace('reading-lab-vocabulary-backup','fake')),/formát/);
 assert.throws(()=>legacy.convertBackup(JSON.stringify({kind:'reading-lab-vocabulary-backup',schemaVersion:1,
  vocabulary:[{...first,meaningCs:''}]})),/formátu/);
});
test('R49: temporary canonical storage cannot claim a successful legacy migration',async()=>{
 const temp={open:async()=>null,listWords:async()=>[],status:()=>({mode:'temporary'})};
 const words=[{id:'en|orbit|oběžná dráha',term:'orbit',meaningCs:'oběžná dráha',language:'en',
  topicIds:['asteroids-planetary-defence']}];
 const fake={getItem:key=>key===legacy.FALLBACK_KEY?JSON.stringify(words):null,setItem:()=>{throw Error('should never set checkpoint')}};
 await assert.rejects(()=>legacy.migrate(temp,{indexedDB:null,localStorage:fake}),/bez trvalého/);
});
test('R49: old data is kept read-only and changes never go to the retired database',()=>{
 const s=read('assets/lsh/v3/legacy-reading-migration.js');
 assert.doesNotMatch(s,/deleteDatabase|\.clear\(/);
 assert.doesNotMatch(s,/XMLHttpRequest|sendBeacon|\bfetch\s*\(/);
 assert.match(s,/transaction\(STORE_NAME,'readonly'\)/);
 assert.match(s,/CHECKPOINT/);
});
