#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=pathIn=>fs.readFileSync(path.join(root,pathIn),'utf8');
const reading=require('../self-check/reading/reading-core.js');
const listening=require('../self-check/listening/listening-core.js');
const key=require('../self-check/practice-answers/teacher-key.js');
const entries=JSON.parse(read('data/cards.json')).entries.filter(e=>['cteni','poslech'].includes(e.skill));
const rows=model=>model.groups.flatMap(g=>g.items);
test('R51 fixed-topic view has one mode selector and no cross-topic dropdown',()=>{
 const html=read('self-check/practice-answers/teacher.html');
 const js=read('self-check/practice-answers/teacher-key.js');
 assert.match(html,/<select id="answerMode" required>/);
 assert.match(html,/<option value="practice">/);
 assert.match(html,/<option value="test">/);
 assert.match(html,/id="language"/);
 assert.match(html,/id="level"/);
 assert.match(html,/id="topicTitle"/);
 assert.doesNotMatch(html,/<select id="topic"/);
 assert.match(js,/mode==='test'\?buildReadingTest/);
 assert.match(js,/mode==='test'\?buildListeningTest/);
 assert.match(js,/listen\.cloze\(v,e\.id,level\)/);
 assert.match(js,/searchParams\.set\('mode',mode\)/);
 assert.match(js,/requestedMode===null\|\|\['practice','test'\]\.includes\(requestedMode\)/);
 assert.match(js,/mode==='test'\?'test':'procvicovani'/);
});
test('R51 Reading: test key matches all scored questions, no non-graded practice tasks (120 variants)',()=>{
 let variants=0,questions=0;
 for(const entry of entries.filter(x=>x.skill==='cteni')){
  const data=reading.parseReadingData(read(entry.lockSource||entry.relative));
  for(const lang of entry.languages)for(const level of entry.levels){
   const v=reading.variantFromData(data,lang,level);
   const practice=key.buildReading(v,entry,lang,level);
   const model=key.buildReadingTest(v,entry,lang,level);
   key.validate(practice);key.validate(model);
   assert.equal(practice.mode,'practice');assert.equal(model.mode,'test');
   assert.equal(model.topicId,entry.id);assert.equal(model.language,lang);assert.equal(model.level,level);
   assert.equal(rows(model).length,v.questions.length);
   assert.ok(model.groups.every(g=>g.type==='answers'&&g.title.startsWith('TEST')));
   for(const q of v.questions){
    const solutions=rows(model).filter(a=>a.question===q.q&&a.answer===q.choices[q.answer]);
    assert.equal(solutions.length,1,entry.id+' '+lang+' '+level+' '+q.id+' missing');
    assert.equal(solutions[0].note,q.explanation||'');
   }
   assert.equal(reading.score(v,{}).total,rows(model).length);
   variants++;questions+=v.questions.length;
  }
 }
 assert.equal(variants,120);assert.equal(questions,1800);
});
test('R51 Listening: test key matches assessAuto for 18 variants, including accepted factual cloze',()=>{
 let variants=0,total=0;
 for(const entry of entries.filter(x=>x.skill==='poslech')){
  const data=listening.extractJson(read(entry.lockSource||entry.relative),'DATA');
  for(const level of entry.levels){
   const v=listening.variant(data,level);
   const cloze=listening.cloze(v,entry.id,level);
   const practice=key.buildListening(v,entry,'en',level);
   const model=key.buildListeningTest(v,entry,'en',level,cloze);
   const score=listening.assessAuto(v,{},entry.id,level);
   key.validate(practice);key.validate(model);
   assert.equal(practice.mode,'practice');assert.equal(model.mode,'test');
   assert.equal(model.topicId,entry.id);assert.equal(model.level,level);
   assert.equal(model.groups.length,4);
   assert.ok(model.groups.every(g=>g.type==='answers'));
   assert.equal(rows(model).length,score.objectiveMax);
   const answers=rows(model);
   for(let i=0;i<score.reviewed.length;i++){
    const reviewed=score.reviewed[i],answer=answers[i];
    assert.equal(answer.question,reviewed.question,entry.id+' '+level+' question '+i);
    assert.equal(answer.answer,reviewed.correctAnswers.join(' / '),entry.id+' '+level+' answer '+i);
   }
   assert.equal(model.groups[3].items.length,cloze.length);
   for(const [i,task]of cloze.entries()){
    const answer=model.groups[3].items[i];
    assert.equal(answer.answer,task.correctAnswer);
    for(const accepted of task.accepted)if(task.accepted.length>1)
     assert.ok(answer.note.includes(accepted),entry.id+' '+level+' missing accepted form');
   }
   // The test excludes the ungraded pre-listening, vocabulary and open discussion content.
   assert.equal(model.groups.some(g=>/Vocabulary|Open questions|Before|Speaking follow-up/i.test(g.title)),false);
   variants++;total+=rows(model).length;
  }
 }
 assert.equal(variants,18);assert.ok(total>350);
});
test('R51 invalid mode is rejected; both PDF modes are independently identified',()=>{
 const entry=entries.find(e=>e.id==='rl-asteroids');
 const v=reading.variantFromData(reading.parseReadingData(read(entry.relative)),'en','B2');
 const model=key.buildReadingTest(v,entry,'en','B2');
 assert.throws(()=>key.validate({...model,mode:'arbitrary'}),/Neplatný učitelský klíč/);
 assert.equal(key.validate(model).mode,'test');
});
