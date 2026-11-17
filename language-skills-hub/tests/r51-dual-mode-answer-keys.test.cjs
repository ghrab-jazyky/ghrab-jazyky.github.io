#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const reading=require('../self-check/reading/reading-core.js');
const listening=require('../self-check/listening/listening-core.js');
const key=require('../self-check/practice-answers/teacher-key.js');
const entries=JSON.parse(read('data/cards.json')).entries.filter(e=>['cteni','poslech'].includes(e.skill));
test('Stage A: public answer key has a fixed PRACTICE mode and no test model builder',()=>{
 const html=read('self-check/practice-answers/teacher.html');
 const js=read('self-check/practice-answers/teacher-key.js');
 assert.match(html,/id="modeFixed"/);assert.doesNotMatch(html,/id="answerMode"|value="test"/);
 assert.doesNotMatch(js,/buildReadingTest|buildListeningTest|mode==='test'/);
 assert.equal(typeof key.buildReadingTest,'undefined');
 assert.equal(typeof key.buildListeningTest,'undefined');
 assert.match(js,/searchParams.set\('mode','practice'\)/);
 assert.match(js,/lsh-vysledky-procvicovani-/);
 assert.match(html,/id="topicTitle"/);
 assert.doesNotMatch(html,/<select id="topic"/);
});
test('Stage A: practice models are complete on all 156 variants, test mode is rejected',()=>{
 let count=0,readingQuestions=0;
 for(const e of entries){
  const html=read(e.lockSource||e.relative);
  const data=e.skill==='cteni'?reading.parseReadingData(html):listening.extractJson(html,'DATA');
  for(const language of e.languages)for(const level of e.levels){
   const source=e.skill==='cteni'?reading.variantFromData(data,language,level):listening.variant(data,level);
   const practice=e.skill==='cteni'?key.buildReading(source,e,language,level):
    key.buildListening(e.id==='ll-conlangs'?key.conlangsPracticeVariant(data,level,source):
     e.id==='ll-how-to-choose-your-news'?key.newsPracticeVariant(data,level,source):source,e,language,level);
   key.validate(practice);
   assert.equal(practice.mode,'practice');
   assert.equal(practice.topicId,e.id);
   assert.ok(practice.groups.flatMap(g=>g.items).length>0,e.id+' '+level);
   assert.throws(()=>key.validate({...practice,mode:'test'}),/Neplatný učitelský klíč/);
   if(e.skill==='cteni'){
    const rows=practice.groups.flatMap(g=>g.items);
    for(const q of source.questions)assert.ok(rows.some(r=>r.question===q.q&&r.answer===q.choices[q.answer]),e.id+' '+language+' '+level+' '+q.id);
    readingQuestions+=source.questions.length;
   }
   count++;
  }
 }
 assert.equal(count,156);
 assert.equal(readingQuestions,1800);
});
