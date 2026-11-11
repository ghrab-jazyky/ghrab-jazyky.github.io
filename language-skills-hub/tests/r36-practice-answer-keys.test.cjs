#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const reading=require('../self-check/reading/reading-core.js');
const listening=require('../self-check/listening/listening-core.js');
const key=require('../self-check/practice-answers/teacher-key.js');
const entries=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8')).entries
 .filter(x=>['cteni','poslech'].includes(x.skill));
const source=e=>fs.readFileSync(path.join(root,e.lockSource||e.relative),'utf8');

test('All 120 Reading practice variants have a complete, source-faithful teacher key',()=>{
 const items=entries.filter(x=>x.skill==='cteni');assert.equal(items.length,5);
 let count=0;
 for(const entry of items){
  const data=reading.parseReadingData(source(entry));
  for(const lang of entry.languages)for(const level of entry.levels){
   const v=reading.variantFromData(data,lang,level);
   const model=key.buildReading(v,entry,lang,level);
   key.validate(model);
   assert.equal(model.skill,'reading');
   const answers=model.groups.flatMap(g=>g.items);
   for(const q of v.questions){
    const matching=answers.filter(a=>a.question===q.q&&a.answer===q.choices[q.answer]);
    assert.ok(matching.length>=1,entry.id+' '+lang+' '+level+': '+q.id);
   }
   assert.ok(model.groups.some(g=>g.title.includes('Otevřená otázka')));
   assert.ok(model.groups.every(g=>g.items.every(q=>q.question&&q.answer)));
   count++;
  }
 }
 assert.equal(count,120);
});
test('All 18 Listening practice variants include choices, sequence, vocabulary, facts and open references',()=>{
 const items=entries.filter(x=>x.skill==='poslech');assert.equal(items.length,3);
 let count=0;
 for(const entry of items){
  const data=listening.extractJson(source(entry),'DATA');
  for(const level of entry.levels){
   const v=listening.variant(data,level);
   const model=key.buildListening(v,entry,'en',level);
   key.validate(model);
   assert.equal(model.skill,'listening');
   const groups=model.groups;
   const required=[
    ['First Listening',v.gist.length],
    ['Listen and Interpret',v.detail.length],
    ['Reconstruction',v.sequence.length],
    ['Vocabulary',v.vocab?.length||0],
    ['Factual questions',v.facts.length],
    ['Open questions',v.open.length]
   ];
   for(const [name,len] of required){
    const g=groups.find(g=>g.title.includes(name));
    if(len===0){continue}
    assert.ok(g,entry.id+' '+level+' missing '+name);
    assert.equal(g.items.length,len,entry.id+' '+level+' '+name);
   }
   for(const g of groups)for(const a of g.items)assert.ok(a.question&&a.answer);
   count++;
  }
 }
 assert.equal(count,18);
});
test('VÝSLEDKY action is for practice cards; student card pages and test scoring are untouched',()=>{
 const hub=fs.readFileSync(path.join(root,'assets/hub.js'),'utf8');
 const page=fs.readFileSync(path.join(root,'self-check/practice-answers/teacher.html'),'utf8');
 const script=fs.readFileSync(path.join(root,'self-check/practice-answers/teacher-key.js'),'utf8');
 assert.match(hub,/VÝSLEDKY/);
 assert.match(hub,/practiceKeyUrl\(e\)/);
 assert.match(hub,/if\(\['cteni','poslech'\]\.includes\(e.skill\)\)/);
 assert.match(page,/id="downloadPdf"/);
 assert.match(page,/id="topic"/);assert.match(page,/id="language"/);assert.match(page,/id="level"/);
 assert.match(script,/e\.lockSource\|\|e\.relative/);
 assert.match(script,/loadSchoolLogo/);
 assert.match(script,/pdfBytes/);
 assert.doesNotMatch(script,/fetch\([^\n]+method:\s*['"]POST/);
 assert.doesNotMatch(script,/studentName|studentEmail|studentAnswer/);
 for(const e of entries){
  const html=source(e);
  assert.doesNotMatch(html,/practice-answers\/teacher\.html/);
 }
});
