#!/usr/bin/env node
'use strict';
// Conversation Lab audit 2026-11-11: shared schema, unified engine and language fixes.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const hub=path.resolve(__dirname,'..');
const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
const cards=JSON.parse(fs.readFileSync(path.join(hub,'data/cards.json'),'utf8')).entries.filter(e=>e.skill==='konverzace');
function literal(src,name){
 const start=src.indexOf('const '+name+' = ')+('const '+name+' = ').length;
 let depth=0,inStr=false,esc=false;
 for(let i=start;i<src.length;i++){
  const ch=src[i];
  if(inStr){if(esc)esc=false;else if(ch==='\\')esc=true;else if(ch==='"')inStr=false;continue;}
  if(ch==='"')inStr=true;else if(ch==='{')depth++;else if(ch==='}'&&--depth===0)return [start,i+1];
 }
 throw new Error('literal not closed: '+name);
}
const loaded=cards.map(e=>{
 const src=fs.readFileSync(path.join(hub,e.relative),'utf8');
 const [a,b]=literal(src,'CONTENT'),content=JSON.parse(src.slice(a,b));
 const [c,d]=literal(src,'CZ_GLOSSARY');
 const engine=(src.slice(0,a)+src.slice(b,c)+src.slice(d)).replace(/const STORAGE = '[^']+'/,"const STORAGE = '*'");
 return {id:e.id,src,content,engine};
});
test('all 21 Conversation Lab cards share one engine',()=>{
 assert.equal(loaded.length,21);
 const engines=new Set(loaded.map(c=>c.engine.slice(c.engine.indexOf('<script>'))));
 assert.equal(engines.size,1,'engine code differs between cards');
 for(const c of loaded)assert.doesNotMatch(c.src,/mainExplanation|mainExplainValue/,c.id);
});
test('every card has the same UI keys and the same station shape in every language',()=>{
 const keys=part=>c=>LANGS.map(l=>Object.keys(c.content[l][part]||{}).sort().join(',')).join('|');
 assert.equal(new Set(loaded.map(keys('ui'))).size,1,'ui keys differ');
 // uiB1 may add topic-specific overrides (hero, strap); the shared keys must exist everywhere.
 const ref=loaded.find(c=>c.id==='cl-rodina');
 for(const c of loaded)for(const l of LANGS)for(const k of Object.keys(ref.content[l].uiB1||{}))
  assert.ok(k in (c.content[l].uiB1||{}),c.id+' '+l+' uiB1.'+k);
 for(const c of loaded)for(const l of LANGS){
  for(const k of ['scenarioLabel','mainExplainLabel','explainAria','step3'])
   assert.ok((c.content[l].ui[k]||'').trim(),c.id+' '+l+' ui.'+k);
  for(const k of ['estimated','timeByLevel'])assert.equal(k in c.content[l].ui,false,c.id+' '+l+' unused '+k);
  for(const lv of LEVELS){
   const v=c.content[l].levels[lv];
   assert.equal(v.stations.length,8);assert.equal(v.vocab.length,12);assert.equal(v.toolkit.length,4);
   v.stations.forEach((s,i)=>{
    assert.equal(s.questions.length,3,c.id+' '+l+' '+lv+' '+i);
    assert.equal(s.support.length,3,c.id+' '+l+' '+lv+' '+i+' support');
    if(['B2','C1','C2'].includes(lv))assert.ok((s.mainExplain||'').trim(),c.id+' '+l+' '+lv+' '+i+' mainExplain');
   });
  }
 }
});
test('a station uses a scenario box either in all languages or in none',()=>{
 for(const c of loaded)for(const lv of LEVELS)for(let i=0;i<8;i++){
  const has=LANGS.map(l=>Boolean((c.content[l].levels[lv].stations[i].scenario||'').trim()));
  assert.equal(new Set(has).size,1,c.id+' '+lv+' station '+(i+1)+' '+has.join(','));
 }
});
test('language fixes from the audit stay fixed',()=>{
 const all=loaded.map(c=>c.src).join('\n');
 for(const bad of ['Kritisier eure','Vergleiche fiktive Situationen und begründe eure','Wärest du','"Denkrahmen: ',
  'après être resté longtemps assis','uved příklad'])
  assert.equal(all.includes(bad),false,bad);
 for(const c of loaded)assert.equal(c.content.de.ui.timerLabel,'RESTZEIT',c.id);
 assert.match(all,/"da un ejemplo":"uveď příklad"/);
});
test('each card CSP allows exactly its own inline script',()=>{
 const crypto=require('node:crypto');
 for(const c of loaded){
  const scripts=[...c.src.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length,1,c.id);
  const hash='sha256-'+crypto.createHash('sha256').update(scripts[0][1],'utf8').digest('base64');
  assert.ok(c.src.includes(hash),c.id+' CSP hash does not match the inline script');
 }
});
