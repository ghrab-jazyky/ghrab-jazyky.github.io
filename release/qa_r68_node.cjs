#!/usr/bin/env node
'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),path=require('path');
const root=path.resolve(__dirname,'..');
const bank=JSON.parse(fs.readFileSync(path.join(root,'AUTHORING/sad-R68-COMPILED-REFERENCE.json'),'utf8'));
const engine=require(path.join(root,'language-skills-hub/poslech/sad/sad-core.js'));
engine.validate(bank);
let mutationCount=0;
for(const lv of bank.levels){
 const entries=bank.variants[lv].questionBank;
 const good=Object.fromEntries(entries.map(q=>[q.id,q.correct]));
 const full=engine.gradeAnswers(bank,good,lv),empty=engine.gradeAnswers(bank,{},lv);
 assert.equal(full.correct,17);assert.equal(full.answered,17);assert.equal(full.total,17);
 assert.equal(empty.correct,0);assert.equal(empty.answered,0);
 for(const item of entries){
  const modified={...good};
  if(item.type==='mc')modified[item.id]=item.correct==='A'?'B':'A';
  else if(item.type==='tns')modified[item.id]=item.correct==='TRUE'?'FALSE':'TRUE';
  else{
   const available='ABCDEFG'.split('').filter(code=>!entries.some(q=>q.type==='match'&&q.correct===code));
   modified[item.id]=available[0];
  }
  assert.equal(engine.gradeAnswers(bank,modified,lv).correct,16,lv+' '+item.id);
  mutationCount++;
 }
 const invalid={...good,C2:good.C1};
 assert.throws(()=>engine.gradeAnswers(bank,invalid,lv),/matching letter used twice/);
 const missing={...good,A1:''};assert.equal(engine.gradeAnswers(bank,missing,lv).answered,16);
}
assert.equal(mutationCount,102);
assert.throws(()=>engine.gradeAnswers(bank,{},'E3'),/invalid level/);
console.log('PASS Node: '+mutationCount+' targeted wrong-answer mutations, 6x full/empty/partial/duplicate/invalid-level checks.');
