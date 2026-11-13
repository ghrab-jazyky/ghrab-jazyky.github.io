#!/usr/bin/env node
'use strict';
// R64: the catalog opens lockSource || relative. A lockSource copy must be a byte-identical
// mirror of the canonical card so that fixes can never again reach only one of the two files.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const entries=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8')).entries;
test('R64: every lockSource copy is a byte-identical mirror of its canonical card',()=>{
 const mirrored=entries.filter(e=>e.lockSource);
 assert.equal(mirrored.length,4);
 for(const e of mirrored){
  assert.ok(e.lockSource.startsWith('r11/variant-copies/'),e.id);
  assert.ok(fs.readFileSync(path.join(root,e.lockSource)).equals(fs.readFileSync(path.join(root,e.relative))),
   e.id+': '+e.lockSource+' differs from '+e.relative);
 }
});
test('R64: all 29 real catalog sources load the shared vocabulary modules and no legacy Reading bank',()=>{
 assert.equal(entries.length,29);
 for(const e of entries){
  const html=fs.readFileSync(path.join(root,e.lockSource||e.relative),'utf8');
  assert.doesNotMatch(html,/Reading Lab personal vocabulary v1\.2/,e.id+' still embeds the legacy vocabulary');
  if(e.skill==='konverzace')continue;
  for(const mod of ['model.js','store.js','card-vocabulary.js'])
   assert.equal(html.split('assets/lsh/v3/'+mod).length-1,1,e.id+' '+mod);
  if(e.skill==='cteni'&&['rl-email-friend','rl-instant-messages','rl-can-mistakes','rl-plastic-ocean'].includes(e.id))
   assert.equal(html.split('assets/lsh/reading-return.js').length-1,1,e.id+' reading-return.js');
 }
});
