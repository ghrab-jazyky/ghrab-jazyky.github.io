#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const core=require('../self-check/listening/listening-core.js');
const root=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8'));
const listening=catalog.entries.filter(e=>e.skill==='poslech'&&e.id!=='ll-sad');
const variant=(entry,level)=>{
 const html=fs.readFileSync(path.join(root,entry.relative),'utf8');
 return core.variant(core.extractJson(html,'DATA'),level);
};
const correctAnswers=(v,topic,level)=>({
 gist:v.gist.map(q=>Array.isArray(q.correct)?q.correct.slice():q.correct),
 detail:v.detail.map(q=>Array.isArray(q.correct)?q.correct.slice():q.correct),
 sequence:v.sequence.map((_,i)=>i),
 cloze:core.cloze(v,topic,level).map(task=>task.accepted[0])
});
const checked=(v,responses,topic,level)=>core.assessAuto(v,responses,topic,level)
 .reviewed.filter(x=>x.phase==='cloze');

test('R37: all authored factual variants are case-insensitive across 18 Listening versions',()=>{
 assert.equal(listening.length,3);
 let levels=0,acceptedCount=0;
 for(const entry of listening)for(const level of core.LEVELS){
  const v=variant(entry,level),answers=correctAnswers(v,entry.id,level);
  const tasks=core.cloze(v,entry.id,level);
  assert.equal(tasks.length,v.facts.length);
  for(const [index,task] of tasks.entries())for(const accepted of task.accepted){
   const mixed=[...accepted].map((c,i)=>i%2===0?c.toUpperCase():c.toLowerCase()).join('');
   const spellings=[
    accepted,accepted.toUpperCase(),accepted.toLowerCase(),mixed,
    ' \t '+accepted.toUpperCase()+'!? \n  '
   ];
   for(const spelling of new Set(spellings)){
    const trial={...answers,cloze:answers.cloze.slice()};
    trial.cloze[index]=spelling;
    const reviewed=checked(v,trial,entry.id,level);
    assert.equal(reviewed[index].correct,true,
     entry.id+' '+level+' cloze #'+(index+1)+' rejected '+JSON.stringify(spelling));
    assert.equal(reviewed[index].awarded,undefined);
    assert.equal(reviewed[index].chosen[0],spelling.trim(),
     'Feedback should preserve the typed answer, rather than overwriting its capitalization');
    acceptedCount++;
   }
  }
  levels++;
 }
 assert.equal(levels,18);
 assert.ok(acceptedCount>250,'Test must exercise every authored form under several capitalization variants');
});

test('R37: punctuation, accents, hyphens and spelling variants do not cause false negatives',()=>{
 const ford=listening.find(e=>e.id==='ll-harrison-ford');
 const v=variant(ford,'B1');
 const cases=[
  '  FIFTEEN YEARS!!! ','fifteen years','15 years','ABOUT 15 YEARS',
  ' About FIFTEEN Years... '
 ];
 for(const value of cases){
  const report=checked(v,{cloze:[value,'CARPENTER','STEVEN SPIELBERG']},ford.id,'B1');
  assert.deepEqual(report.map(x=>x.correct),[true,true,true],value);
 }
 const matthew=listening.find(e=>e.id==='ll-matthew-oscars');
 const b2=variant(matthew,'B2');
 for(const value of ['VALLÉE','vallée','VALLEE','jean-marc vallée','JEAN MARC VALLEE']){
  const review=checked(b2,{cloze:[value]},matthew.id,'B2');
  assert.equal(review[0].correct,true,value);
 }
 for(const value of ['JARED LETO & JENNIFER GARNER','jennifer garner and jared leto',
  'Jennifer Garner; Jared Leto']){
  const review=checked(b2,{cloze:['vallee',value]},matthew.id,'B2');
  assert.equal(review[1].correct,true,value);
 }
});

test('R37: wrong facts and incomplete proper names are not auto-accepted',()=>{
 const ford=listening.find(e=>e.id==='ll-harrison-ford'),b1=variant(ford,'B1'),b2=variant(ford,'B2');
 for(const wrong of ['14','fourteen','about fourteen years','150','15 days']){
  assert.equal(checked(b1,{cloze:[wrong]},ford.id,'B1')[0].correct,false,wrong);
 }
 for(const wrong of ['George Lucas','Steven Spielberg','George Lucas and nobody',
   '15','GEORGE LUCAS STEVEN SPIELBERG OTHER NAME']){
  assert.equal(checked(b2,{cloze:[wrong]},ford.id,'B2')[0].correct,false,wrong);
 }
 const peaky=listening.find(e=>e.id==='ll-peaky-no-fighting');
 const a1=variant(peaky,'A1');
 for(const wrong of ['GRACIE','grace and john','grace extra word']){
  assert.equal(checked(a1,{cloze:[wrong]},peaky.id,'A1')[0].correct,false,wrong);
 }
 assert.throws(()=>core.assessAuto(a1,{cloze:['G'.repeat(121)]},peaky.id,'A1'),
  /Invalid short cloze response/);
});

test('R37: student instructions describe the actual case-insensitive rules',()=>{
 const script=fs.readFileSync(path.join(root,'self-check/listening/listening-student.js'),'utf8');
 assert.match(script,/Capitalization, accents, punctuation and extra spaces do not affect your score/);
 assert.match(script,/The factual detail and spelling still need to match an accepted answer/);
 assert.match(script,/core\.assessAuto\(/);
 assert.doesNotMatch(script,/openTask\(|teacherReview\(/);
});
