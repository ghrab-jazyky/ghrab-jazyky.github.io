#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const readingCore=require('../self-check/reading/reading-core.js');
const listeningCore=require('../self-check/listening/listening-core.js');
const pdf=require('../self-check/results/pdf-report.js');
const catalog=JSON.parse(read('data/cards.json'));

test('R48: exactly the incorrect or unanswered Reading/Listening tasks are visible in student feedback',()=>{
 const reading=read('self-check/reading/reading.js');
 const listening=read('self-check/listening/listening-student.js');
 const css=read('self-check/reading/reading.css');
 for(const js of [reading,listening]){
  assert.match(js,/const mistakes=report\.(?:details|reviewed)\.filter\((?:item|task)=>!(?:item|task)\.correct\)/);
  assert.match(js,/for\(const (?:item|task) of mistakes\)/);
  assert.match(js,/answerComparison\(/);
  assert.match(js,/feedback-explanation/);
  assert.match(js,/feedback-compare/);
  assert.match(js,/feedback-answer/);
  assert.doesNotMatch(js,/innerHTML\s*=/,'User answers must never be inserted as HTML');
 }
 assert.match(reading,/item\.answered\?item\.selectedAnswer:ui\.notAnswered/);
 assert.match(listening,/task\.chosen\.length\?task\.chosen\.join/);
 assert.match(css,/\.feedback-compare\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:580px\).*\.feedback-compare\{grid-template-columns:minmax\(0,1fr\)/s);
});

test('R48: authored explanations cover every Reading variant and all Listening choice tasks',()=>{
 let readingItems=0,readingExplanations=0,listeningChoices=0,listeningReasons=0;
 for(const entry of catalog.entries.filter(x=>x.skill==='cteni')){
  const data=readingCore.parseReadingData(read(entry.relative));
  for(const lang of entry.languages)for(const level of entry.levels){
   const v=readingCore.variantFromData(data,lang,level);
   for(const q of v.questions){
    readingItems++;
    if(typeof q.explanation==='string'&&q.explanation.trim())readingExplanations++;
   }
  }
 }
 for(const entry of catalog.entries.filter(x=>x.skill==='poslech'&&x.id!=='ll-sad')){
  const data=listeningCore.extractJson(read(entry.relative),'DATA');
  for(const level of entry.levels){
   const v=listeningCore.variant(data,level);
   for(const q of [...v.gist,...v.detail]){
    listeningChoices++;
    if(typeof q.why==='string'&&q.why.trim())listeningReasons++;
   }
  }
 }
 assert.equal(readingItems,1800);
 assert.equal(readingExplanations,readingItems,'Reading should never show fabricated explanations');
 assert.ok(listeningChoices>100);
 assert.equal(listeningReasons,listeningChoices,'Listening explanations only if grounded in authored source');
});

test('R48: full teacher archives are independent of the student mistakes-only view',()=>{
 const reading=read('self-check/reading/reading.js');
 const listening=read('self-check/listening/listening-student.js');
 const receipt=read('self-check/results/export-core.js');
 const pdfCode=read('self-check/results/pdf-report.js');
 assert.match(reading,/questions:lastReport\.details\.map\(item=>/);
 assert.match(listening,/questions:report\.reviewed\.map\(task=>/);
 assert.match(pdfCode,/report\.questions\.forEach\(/);
 assert.match(pdfCode,/if\(q\.explanation\)paragraph\(/);
 assert.match(receipt,/questionRows\(report,skill\)/);
 assert.match(receipt,/awarded_points:item\.correct\?1:0/);
 const report={
  skill:'reading',topicId:'rl-asteroids',topic:'Asteroids',language:'en',level:'B1',
  summary:{earned:1,max:3,percent:33.33,grade:5},
  questions:[
   {question:'Mistake',options:['A','B'],studentAnswer:'A',correctAnswer:'B',correct:false,awarded:0,explanation:'The source supports B.'},
   {question:'Correct',options:['Yes','No'],studentAnswer:'Yes',correctAnswer:'Yes',correct:true,awarded:1,explanation:'Yes is supported.'},
   {question:'Unanswered',options:['Yes','No'],studentAnswer:'Bez odpovědi',correctAnswer:'No',correct:false,awarded:0,explanation:'No is stated.'}
  ],readingText:'Original reading source.'
 };
 const archive=pdf.fullText(report);
 assert.equal((archive.match(/^Odpoved studenta:/gm)||[]).length,3);
 assert.match(archive,/Mistake/);assert.match(archive,/Correct/);
 assert.match(archive,/Unanswered/);assert.match(archive,/Original reading source/);
 assert.match(archive,/Vysvetleni: The source supports B/);
 assert.match(archive,/Vysvetleni: Yes is supported/);
});
