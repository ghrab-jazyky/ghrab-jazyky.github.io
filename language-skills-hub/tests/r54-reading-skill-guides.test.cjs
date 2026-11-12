'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const guide=require('../assets/lsh/v3/reading-skill-guides.js');
const core=require('../self-check/reading/reading-core.js');
const entries=require('../data/cards.json').entries.filter(x=>x.skill==='cteni');
const version=JSON.parse(read('version.json'));
test('R54: source integrity and 120 unchanged Reading variants with 1800 questions',()=>{
 assert.equal(entries.length,5);let variants=0,questions=0;
 for(const entry of entries){
  const html=read(entry.relative);
  assert.equal(crypto.createHash('sha256').update(html).digest('hex'),version.contentHashes[entry.id]);
  const data=core.parseReadingData(html);
  for(const lang of entry.languages)for(const level of entry.levels){
   const v=data[lang][level];variants++;questions+=v.questions.length;
   for(const tab of v.tabs){
    assert.ok(guide.guideFor(lang,tab.id),entry.id+' '+lang+'/'+level+'/'+tab.id);
    assert.equal(v.questions.filter(q=>q.tab===tab.id).length,3);
   }
  }
 }assert.equal(variants,120);assert.equal(questions,1800);
});
test('R54: nine strategies and localized explanation plus exam tip',()=>{
 assert.deepEqual(guide.languages,['en','es','de','fr']);
 assert.equal(guide.skillIds.length,9);
 for(const lang of guide.languages){
  const messages=[];
  for(const skill of guide.skillIds){
   const v=guide.guideFor(lang,skill);assert.ok(v);
   assert.ok(v.what.length>=55);assert.ok(v.how.length>=60);
   assert.ok(v.labels.practice.length>12);
   messages.push(v.what);
  }assert.equal(new Set(messages).size,9);
 }
 assert.equal(guide.guideFor('cs','scan'),null);
 assert.equal(guide.guideFor('en','missing'),null);
});
test('R54: no network or storage, shared card module injects Reading-only script',()=>{
 const bridge=read('assets/lsh/v3/card-vocabulary.js'),guideScript=read('assets/lsh/v3/reading-skill-guides.js');
 assert.ok(bridge.includes('reading-skill-guides.js'));
 assert.ok(bridge.includes('language-skills-hub'));
 assert.doesNotMatch(guideScript,/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|indexedDB/i);
 assert.doesNotMatch(guideScript,/innerHTML|insertAdjacentHTML|document\.write/);
 assert.match(guideScript,/MutationObserver/);
 assert.match(read('assets/lsh/v3/reading-skill-guides.css'),/max-width:650px/);
});