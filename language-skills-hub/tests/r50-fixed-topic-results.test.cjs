#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const entries=JSON.parse(read('data/cards.json')).entries.filter(e=>['cteni','poslech'].includes(e.skill)&&e.id!=='ll-sad');
const html=read('self-check/practice-answers/teacher.html');
const js=read('self-check/practice-answers/teacher-key.js');
const hub=read('assets/hub.js');
test('R50: one fixed teacher result topic, no selector spanning labs',()=>{
 assert.equal(entries.length,8);
 assert.equal(entries.filter(x=>x.skill==='cteni').length,5);
 assert.equal(entries.filter(x=>x.skill==='poslech').length,3);
 assert.match(html,/id="topicTitle"/);
 assert.match(html,/id="labName"/);
 assert.match(html,/id="level"/);
 assert.match(html,/id="languageFixedWrap"/);
 assert.doesNotMatch(html,/<select\s+id="topic"/);
 assert.match(js,/qs\.get\('topic'\),requestedSkill=qs\.get\('skill'\)/);
 assert.match(js,/requestedSkill===null\|\|requestedSkill===e\.skill/);
 assert.match(js,/entries\.find\(x=>x\.id===topicId\)/);
 assert.doesNotMatch(js,/fill\('topic'/);
 assert.match(hub,/url\.searchParams\.set\('skill',e\.skill\)/);
});
test('R50: preserve all 120 Reading and 18 Listening combinations',()=>{
 let reading=0,listening=0;
 for(const e of entries){
  assert.equal(e.levels.length,6);
  for(const lang of e.languages)for(const level of e.levels){
   assert.match(level,/^(A1|A2|B1|B2|C1|C2)$/);
   if(e.skill==='cteni')reading++;
   else{assert.equal(lang,'en');listening++}
  }
 }
 assert.equal(reading,120);assert.equal(listening,18);
});
