#!/usr/bin/env node
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'konverzace/city-quest-f2/index.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const script=html.match(/<script>([\s\S]*?)<\/script>/);
const css=html.match(/<style>([\s\S]*?)<\/style>/);
const sourceLine=name=>html.split('\n').find(line=>line.startsWith('  const '+name+'='));
const asData=name=>JSON.parse(sourceLine(name).slice(('  const '+name+'=').length,-1));
test('City Quest source integrity, inlined CSP and unchanged no-network design',()=>{
 assert.equal(hash(html),manifest.contentHashes['cl-city-quest-f2']);
 assert.equal((html.match(/<script>/g)||[]).length,1);
 assert.equal((html.match(/<style>/g)||[]).length,1);
 assert.ok(script&&css);
 const digest=body=>crypto.createHash('sha256').update(body,'utf8').digest('base64');
 assert.ok(html.includes("script-src 'sha256-"+digest(script[1])+"'"));
 assert.ok(html.includes("style-src 'sha256-"+digest(css[1])+"'"));
 assert.ok(html.includes("connect-src 'none'"));
 assert.ok(html.includes("default-src 'none'"));
});
test('F-01: Station Road label is beside southern roadworks, not the northern road',()=>{
 const match=html.match(/text\(map,(\d+),(\d+),"STATION ROAD",/);
 assert.ok(match);
 const y=Number(match[2]);
 assert.ok(Math.abs(y-580)<Math.abs(y-136),'Road name must be closer to southern row 3');
 assert.match(html,/reason:"Station Road is closed for roadworks/);
});
test('F-02/F-16/F-18: B2 prompts use correct avenue and deictic direction',()=>{
 const practice=asData('advancedPractice');
 const names={en:'Market Avenue',es:'avenida del Mercado',de:'Marktallee',fr:'avenue du Marché'};
 for(const [lang,name] of Object.entries(names)){
  assert.ok(practice[lang].guided.B2.question.includes(name),lang);
  assert.equal(practice[lang].guided.B2.options.some(entry=>entry[0]==='left'),true);
  assert.equal(practice[lang].guided.C2.options.find(entry=>entry[0]==='closure')?.length,2);
 }
 assert.doesNotMatch(practice.de.guided.B2.options.map(x=>x[1]).join(' '),/Von Osten aus/);
 assert.match(practice.de.guided.B2.options.find(x=>x[0]==='left')[1],/nach Osten gehst/);
 for(const lang of ['es','de','fr']){
  const text=JSON.stringify(practice[lang].guided);
  assert.doesNotMatch(text,/City Museum|Station Road/,lang);
 }
});
test('F-23/F-24: targeted grammar corrections are present',()=>{
 assert.doesNotMatch(html,/hastal Museo/);
 assert.match(asData('advancedDialogueScenes').es.C2.start,/hasta el Museo de la Ciudad/);
 assert.match(html,/Je peux vous le montrer sur le plan/);
});
test('F-03/F-04: metro missions have 4-language introduction and justified final transfer',()=>{
 const narrative=asData('metroNarrative');
 const tokens={en:['Central Station','Market Square','University'],es:['Museum Quarter','Market Square','University'],de:['Museum Quarter','Market Square','University'],fr:['Museum Quarter','Market Square','University']};
 for(const lang of ['en','es','de','fr']){
  assert.deepEqual(Object.keys(narrative[lang]),['5','6','7','8']);
  for(const mission of [5,6,7,8])assert.ok(narrative[lang][mission].length>70,lang+mission);
  for(const token of tokens[lang])assert.ok(JSON.stringify(narrative[lang]).includes(token),lang+': '+token);
  assert.match(narrative[lang][8],/University/);
 }
 assert.match(html,/metroNarrative\[state.language\]\?\.\[n\]/);
 // UX workspace intentionally retains the full native introduction throughout
 // the journey in an accessible disclosure, rather than discarding it after
 // the first move. Browser acceptance checks exact text before and after a move.
 assert.match(html,/const context=el\("details",panel,"cq-ux-context"\)/);
 assert.match(html,/para\(context,metroNarrative\[state.language\]\?\.\[n\]\|\|metroNarrative.en\[n\]\)/);
 assert.match(html,/state.station>=5&&state.station<=8/);
 assert.match(html,/LC.levels.includes\(state.level\)/);
 assert.match(html,/state.done=new Set\(\[\.\.\.state.done\].filter\(n=>n<=4\)\)/);
});
