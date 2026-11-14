#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const R=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(R,p),'utf8');
const core=require('../self-check/listening/listening-core.js');
const sad=require('../poslech/sad/sad-core.js');
const key=require('../self-check/practice-answers/teacher-key.js');
const grade=require('../self-check/results/grade-core.js');
const levels=['A1','A2','B1','B2','C1','C2'];
const catalog=JSON.parse(read('data/cards.json')),entry=catalog.entries.find(e=>e.id==='ll-sad');
const html=read('poslech/sad/index.html'),data=core.extractJson(html,'DATA');
const keysFor=level=>{const v=data[level];return {gist:v.gist.map(q=>q.correct),detail:v.detail.map(q=>q.correct),
 matching:v.matching.items.map(q=>q.correct),sequence:[],cloze:[]};};

test('R68 catalogue: 32 topics, 5 Listening, 678 variants, all CEFR levels',()=>{
 assert.equal(catalog.entries.length,32);
 assert.equal(catalog.entries.filter(e=>e.skill==='poslech').length,5);
 assert.equal(catalog.entries.reduce((a,e)=>a+e.languages.length*e.levels.length,0),678);
 assert.deepEqual(entry.languages,['en']);assert.deepEqual(entry.levels,levels);
 assert.equal(core.catalogEntry(catalog,'ll-sad'),entry);
 assert.ok(core.ALL_TOPICS.includes('ll-sad'));
 assert.deepEqual(core.TOPICS,['ll-matthew-oscars','ll-harrison-ford','ll-peaky-no-fighting']);
});

test('R68 all 6 levels have unique 17-task banks, 2 extra matching choices and complete evidence',()=>{
 sad.validate(data);assert.deepEqual(data.levels,levels);
 const all=[];
 for(const level of levels){
  const b=data.variants[level],v=core.variant(data,level);
  assert.deepEqual([v.gist.length,v.detail.length,v.matching.items.length,v.sequence.length,v.facts.length],[6,6,5,0,0]);
  assert.equal(v.matching.options.length,7);
  assert.deepEqual(b.questionBank.map(q=>q.id),['A1','A2','A3','A4','A5','A6','B1','B2','B3','B4','B5','B6','C1','C2','C3','C4','C5']);
  assert.ok(b.questionBank.every(q=>q.evidence&&q.explanation));
  assert.equal(new Set(v.matching.items.map(x=>x.correct)).size,5);
  assert.equal(core.cloze(v,'ll-sad',level).length,0);
  all.push(b.questionBank.map(q=>q.question).join('|'));
 }
 assert.equal(new Set(all).size,6,'CEFR banks must differ in assessment, not only in label');
});

test('R68 independent B2 provenance: original bank unmodified, matching answer list unmodified',()=>{
 const src=read('poslech/sad/index.html');
 assert.equal(JSON.stringify(data.questionBank),JSON.stringify(data.variants.B2.questionBank));
 assert.equal(JSON.stringify(data.matchingBank),JSON.stringify(data.variants.B2.matchingBank));
 assert.equal((src.match(/\bconst\s+DATA\s*=/g)||[]).length,1);
 assert.equal((src.match(/\bconst\s+SOURCES\s*=/g)||[]).length,1);
 assert.doesNotMatch(src,/src="sad-data\.js"/);
 const version=JSON.parse(read('version.json'));
 assert.equal(version.contentHashes['ll-sad'],crypto.createHash('sha256').update(Buffer.from(src)).digest('hex'));
 assert.equal(version.variantCount,678);assert.equal(version.topicCount,32);
 assert.ok(src.includes('assets/lsh/v3/card-vocabulary.js'));
 assert.equal(core.sourceLinks(src).length,2);
});

test('R68 shared automatic engine: 17/17, empty 0/17 and each mutation for every level',()=>{
 for(const level of levels){
  const v=core.variant(data,level),correct=keysFor(level);
  const full=core.assessAuto(v,correct,'ll-sad',level);
  assert.equal(full.objectiveMax,17);assert.equal(full.objectiveCorrect,17);
  assert.equal(full.answered,17);assert.equal(full.unanswered,0);
  assert.equal(full.reviewed.length,17);assert.equal(full.writing.length,0);
  const blank=core.assessAuto(v,{},'ll-sad',level);
  assert.equal(blank.objectiveCorrect,0);assert.equal(blank.objectiveMax,17);
  assert.equal(blank.unanswered,17);
  for(let i=0;i<6;i++){
   const changed=JSON.parse(JSON.stringify(correct));
   changed.gist[i]= (v.gist[i].correct+1)%v.gist[i].options.length;
   assert.equal(core.assessAuto(v,changed,'ll-sad',level).objectiveCorrect,16);
  }
  for(let i=0;i<6;i++){
   const changed=JSON.parse(JSON.stringify(correct));
   changed.detail[i]= (v.detail[i].correct+1)%3;
   assert.equal(core.assessAuto(v,changed,'ll-sad',level).objectiveCorrect,16);
  }
  for(let i=0;i<5;i++){
   const changed=JSON.parse(JSON.stringify(correct));
   const available=[0,1,2,3,4,5,6].filter(x=>!correct.matching.includes(x));
   changed.matching[i]=available[0];
   assert.equal(core.assessAuto(v,changed,'ll-sad',level).objectiveCorrect,16);
  }
  assert.throws(()=>core.assessAuto(v,{matching:[0,0]},'ll-sad',level),/Matching answer used more than once/);
  const original=Object.fromEntries(data.variants[level].questionBank.map(q=>[q.id,q.correct]));
  assert.equal(sad.gradeAnswers(data,original,level).correct,17);
 }
});

test('R68 native teacher keys: same topic, six levels, PDF contract and 17 exact solutions',()=>{
 assert.equal(key.keyEntries.length,10);
 assert.deepEqual(key.keyEntries.map(e=>e.id),catalog.entries.filter(e=>['cteni','poslech'].includes(e.skill)).map(e=>e.id));
 for(const level of levels){
  const v=core.variant(data,level);
  const practice=key.validate(key.buildListening(v,entry,'en',level));
  const exam=key.validate(key.buildListeningTest(v,entry,'en',level,core.cloze(v,'ll-sad',level)));
  assert.equal(practice.mode,'practice');assert.equal(exam.mode,'test');
  assert.equal(exam.groups.flatMap(g=>g.items).length,17);
  assert.ok(exam.groups.some(g=>g.title.includes('Matching')&&g.items.length===5));
  assert.ok(practice.groups.some(g=>g.title.includes('Vocabulary')));
  assert.ok(practice.groups.some(g=>g.title.includes('Open questions')));
 }
});

test('R68 catalog uses one student, teacher, result, vocabulary, and timer route',()=>{
 const hub=read('assets/hub.js'),teacher=read('self-check/listening/listening-teacher.js');
 const student=read('self-check/listening/listening-student.js');
 assert.doesNotMatch(hub,/poslech\/sad\/teacher-key\.html/);
 assert.match(hub,/self-check\/practice-answers\/teacher\.html/);
 assert.match(teacher,/new URL\('student\.html',location\.href\)/);
 assert.doesNotMatch(teacher,/sad-student\.html/);
 assert.match(teacher,/ll-sad/);
 assert.match(student,/phase==='matching'/);
 assert.doesNotMatch(read('self-check/listening/student.html'),/<(?:iframe|video|audio)\b/);
 assert.equal(grade.proposal(17,17).grade,1);
 assert.equal(grade.proposal(10,17).grade,3);
 assert.equal(grade.proposal(0,17).grade,5);
});

test('R68 existing three Listening cards remain byte-pinned and retain six CEFR levels',()=>{
 const version=JSON.parse(read('version.json'));
 for(const id of core.TOPICS){
  const e=catalog.entries.find(x=>x.id===id);assert.ok(e);
  assert.deepEqual(e.levels,levels);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(R,e.relative))).digest('hex'),
   version.contentHashes[id],id+' original source unexpectedly modified');
 }
});
