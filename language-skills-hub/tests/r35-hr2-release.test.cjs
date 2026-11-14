#!/usr/bin/env node
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const hub=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(hub,p),'utf8');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const catalog=JSON.parse(read('data/cards.json'));
const i18n=JSON.parse(read('data/catalog-i18n.json'));
const version=JSON.parse(read('version.json'));
const cardPath='konverzace/human-rights/index.html';
const html=read(cardPath);
const langs=['en','es','de','fr'];
const levels=['A1','A2','B1','B2','C1','C2'];
const PIN='e08b238ba4058b2f6a162daf21d02e93c5045495f6b35cf43bb5953a33ff0be4';
function literal(src,label){
 const marker='const '+label+' = ';
 const start=src.indexOf(marker);
 assert.ok(start>=0,label+' missing');
 const from=start+marker.length;
 let inString=false,escape=false,depth=0;
 for(let i=from;i<src.length;i++){
  const ch=src[i];
  if(inString){if(escape)escape=false;else if(ch==='\\')escape=true;else if(ch==='"')inString=false;continue;}
  if(ch==='"')inString=true;
  else if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0)return JSON.parse(src.slice(from,i+1));
 }
 throw Error('Unclosed '+label);
}
const content=literal(html,'CONTENT');
const glossary=literal(html,'CZ_GLOSSARY');
test('R35-HR2: 30 topics, 22 Conversation Lab entries and 666 variants',()=>{
 assert.equal(version.version,'R35-HR2');
 assert.equal(catalog.entries.length,30);
 assert.equal(version.topicCount,30);
 assert.equal(version.variantCount,666);
 assert.equal(catalog.entries.filter(x=>x.skill==='konverzace').length,22);
 assert.equal(catalog.entries.reduce((n,x)=>n+x.languages.length*x.levels.length,0),666);
 assert.equal(Object.keys(i18n.entries).length,30);
 assert.equal(version.sourceSha,catalog.revision);
 const item=catalog.entries.find(x=>x.id==='cl-human-rights');
 assert.equal(item?.relative,cardPath);
 assert.deepEqual(item.languages,langs);
 assert.deepEqual(item.levels,levels);
 assert.deepEqual(Object.keys(i18n.entries[item.id]).sort(),['cs',...langs].sort());
});
test('R35-HR2: approved card SHA and all original 29 cards are intact',()=>{
 assert.equal(digest(Buffer.from(html)),PIN);
 assert.equal(version.contentHashes['cl-human-rights'],PIN);
 assert.equal(Object.keys(version.contentHashes).length,30);
 for(const item of catalog.entries){
  const p=path.join(hub,item.relative);
  assert.ok(fs.existsSync(p),item.id);
  assert.equal(digest(fs.readFileSync(p)),version.contentHashes[item.id],item.id);
 }
});
test('R35-HR2: complete EN/ES/DE/FR content across all CEFR variants',()=>{
 assert.deepEqual(Object.keys(content).sort(),langs.slice().sort());
 assert.deepEqual(Object.keys(glossary.recommended).sort(),langs.slice().sort());
 let stations=0,terms=0;
 for(const lang of langs){
  assert.deepEqual(Object.keys(content[lang].levels),levels);
  for(const lv of levels){
   const item=content[lang].levels[lv];
   assert.equal(item.stations.length,8);
   assert.equal(item.vocab.length,12);
   assert.equal(item.toolkit.length,4);
   for(const station of item.stations){
    assert.equal(station.questions.length,3);
    assert.equal(station.support.length,3);
    if(['B2','C1','C2'].includes(lv)){
     assert.ok(station.mainExplain);
     assert.equal(station.explanations.length,3);
    }
    stations++;
   }
   for(const [term] of item.vocab){
    const key=term.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase().replace(/[’‘]/g,"'").replace(/[‐-‒–—]/g,'-');
    const translation=glossary.recommended[lang][key];
    assert.equal(typeof translation,'string',lang+'/'+lv+'/'+term);
    assert.ok(translation.length>0&&!/[;,\/|\r\n]/.test(translation));
    terms++;
   }
  }
 }
 assert.equal(stations,192);
 assert.equal(terms,288);
 assert.equal(glossary.phrases.es['da un ejemplo'],'uveď příklad');
});
test('R35-HR2: CSP integrity, shared vocabulary bridge and teacher lock',()=>{
 const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
 assert.equal(scripts.length,1);
 const h=crypto.createHash('sha256').update(scripts[0][1]).digest('base64');
 assert.ok(html.includes('sha256-'+h));
 assert.match(html,/data-lsh-topic-id="cl-human-rights"/);
 for(const asset of ['../../assets/lsh/v2/lock.js','../../assets/lsh/v3/model.js','../../assets/lsh/v3/store.js','../../assets/lsh/v3/card-bridge.js','../../assets/lsh/v3/card-bridge.css'])
  assert.ok(html.includes(asset),asset);
 const bridge=read('assets/lsh/v3/card-bridge.js');
 assert.match(bridge,/glossary\.recommended&&glossary\.recommended\[language\]/);
 assert.match(bridge,/glossary\.phrases&&glossary\.phrases\[language\]/);
 assert.match(bridge,/glossary\.words&&glossary\.words\[language\]/);
 const hubjs=read('assets/hub.js');
 assert.match(hubjs,/body\.entries\.length!==30/);
 assert.match(hubjs,/Object\.keys\(i18n\.entries\)\.length!==30/);
});
test('R35-HR2: old R24 Listening counts migrated',()=>{
 const old=read('tests/r24-listening-selfcheck.test.cjs');
 assert.ok(old.includes('cards.entries.reduce((sum,x)=>sum+x.languages.length*x.levels.length,0),666'));
 assert.ok(!old.includes('cards.entries.reduce((sum,x)=>sum+x.languages.length*x.levels.length,0),642'));
});
