#!/usr/bin/env node
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const docs=path.resolve(root,'../docs/city-quest');
const languages=['en','es','de','fr'];
const levels=['B2','C1','C2'];
const html=fs.readFileSync(path.join(root,'konverzace/city-quest-f2/index.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const crypto=require('node:crypto');
function digest(value){return crypto.createHash('sha256').update(value,'utf8').digest('hex')}
const script=html.match(/<script>([\s\S]*?)<\/script>/);
const inline=html.split('\n').find(line=>line.startsWith('  const cqAdvancedOracy='));
assert.ok(inline,'Offline inline oracy authoring matrix must exist');
const embedded=JSON.parse(inline.slice('  const cqAdvancedOracy='.length,-1));
test('Authoring matrix matches offline inline source and contains exactly 144 unique level/mission prompts',()=>{
 let all=[];
 for(const lang of languages){
  const file=JSON.parse(fs.readFileSync(path.join(docs,'stage3-oracy-'+lang+'.json'),'utf8'));
  assert.deepEqual(embedded[lang],file,'Inline authoring drift for '+lang);
  assert.equal(file.language,lang);
  assert.equal(file.schema,'city-quest-stage3-oracy-v1');
  assert.deepEqual(Object.keys(file.city),['1','2','3','4','5','6','7','8']);
  assert.deepEqual(Object.keys(file.metro),['5','6','7','8']);
  for(const mode of ['city','metro']){
   for(const [mission,byLevel] of Object.entries(file[mode])){
    assert.deepEqual(Object.keys(byLevel),levels,lang+'/'+mode+'/'+mission);
    for(const level of levels){
     const prompt=byLevel[level];
     assert.equal(typeof prompt,'string');
     assert.ok(prompt.length>=75 && prompt.length<=450,lang+'/'+mode+'/'+mission+'/'+level);
     assert.doesNotMatch(prompt,/\{[^}]+\}|\bTODO\b|\bTBD\b|\[placeholder\]/i);
     all.push({lang,mode,mission,level,prompt});
    }
   }
  }
  assert.deepEqual(Object.keys(file.rubric),levels);
  for(const level of levels){
   assert.equal(file.rubric[level].length,3);
   assert.equal(new Set(file.rubric[level]).size,3);
   assert.ok(file.rubric[level].every(x=>x.length>=35));
  }
  for(const id of ['title','doFirst','criteria','reflection','teacher'])
   assert.ok(file.ui[id]?.length>=20,lang+'/'+id);
 }
 assert.equal(all.length,144);
 for(const {lang,mode,mission}of all){
  const variants=levels.map(l=>embedded[lang][mode][mission][l]);
  assert.equal(new Set(variants).size,3,lang+'/'+mode+'/'+mission);
 }
 assert.equal(new Set(all.map(x=>x.prompt)).size,144);
});
test('CEFR guard excludes A1/A2/B1 and preserves metro B1 availability',()=>{
 assert.match(html,/if\(!\["B2","C1","C2"\]\.includes\(state.level\)\)return null/);
 assert.match(html,/mode=metroPilot\(\)\?"metro":"city"/);
 assert.match(html,/const metroAvailable=\(\)=>!!MG&&!!LC&&LC.languages.includes\(state.language\)&&LC.levels.includes\(state.level\)/);
 assert.match(html,/const levels=\["B1","B2","C1","C2"\],languages=\["en","es","de","fr"\]/);
 assert.match(html,/renderAdvancedOracy\(index\)/);
 assert.match(html,/const evidence=advancedOracyTask\(state.station\)/);
 assert.match(html,/cqTeacherOracyRow/);
});
test('Inline speech activities are explicitly non-assessing and CSP is intact',()=>{
 assert.ok(script);
 const scriptHash=crypto.createHash('sha256').update(script[1],'utf8').digest('base64');
 assert.ok(html.includes("script-src 'sha256-"+scriptHash+"'"));
 const style=html.match(/<style>([\s\S]*?)<\/style>/);
 assert.ok(style);
 const cssHash=crypto.createHash('sha256').update(style[1],'utf8').digest('base64');
 assert.ok(html.includes("style-src 'sha256-"+cssHash+"'"));
 assert.ok(html.includes("connect-src 'none'"));
 assert.equal(digest(html),manifest.contentHashes['cl-city-quest-f2']);
 assert.match(html,/Speaking is self-checked, never automatically graded/);
 assert.match(html,/const cqTeacherOracyCz=/);
 assert.doesNotMatch(html,/\bid="cqAudioRecorder"/);
});
