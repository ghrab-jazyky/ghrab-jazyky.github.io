#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=require('../self-check/listening/listening-core.js');
const root=path.resolve(__dirname,'..');
const read=path=>fs.readFileSync(require('node:path').join(root,path),'utf8');
const cards=JSON.parse(read('data/cards.json'));
const version=JSON.parse(read('version.json'));
const entries=cards.entries.filter(x=>x.skill==='poslech'&&core.TOPICS.includes(x.id));

test('R24 has three original Listening topics, 18 English-only A1-C2 variants',()=>{
 assert.equal(entries.length,3);
 assert.deepEqual(entries.map(x=>x.id),core.TOPICS);
 for(const entry of entries){
  assert.deepEqual(entry.languages,['en']);
  assert.deepEqual(entry.levels,core.LEVELS);
  assert.equal(core.catalogEntry(cards,entry.id),entry);
 }
 assert.throws(()=>core.catalogEntry(cards,'rl-asteroids'));
 assert.throws(()=>core.catalogEntry(cards,'cl-rodina'));
 assert.throws(()=>core.catalogEntry(cards,'../../private'));
 assert.equal(cards.gradedTestsEnabled,false);
 assert.equal(version.gradedTestsEnabled,false);
});

test('R24 loads original real public cards; 18 variants preserve all phases and 251 objective / 84 written items',()=>{
 const total={variants:0,gist:0,detail:0,sequence:0,facts:0,open:0,multi:0};
 for(const entry of entries){
  const raw=read(entry.relative);
  const hash=crypto.createHash('sha256').update(raw).digest('hex');
  assert.equal(hash,version.contentHashes[entry.id],entry.id+' practice source unexpectedly modified');
  const data=core.extractJson(raw,'DATA');
  assert.deepEqual(Object.keys(data),core.LEVELS);
  const media=core.sourceLinks(raw);
  assert.ok(media.length>=1);
  for(const link of media){
   assert.match(link.url,/^https:\/\//);
   assert.ok(!link.url.includes('javascript:'));
  }
  for(const level of core.LEVELS){
   const v=core.variant(data,level);
   total.variants++;
   for(const key of ['gist','detail','facts','open','sequence'])
    total[key]+=v[key].length;
   total.multi+=[...v.gist,...v.detail].filter(x=>x.type==='multi').length;
   const good={
    gist:v.gist.map(x=>x.correct),detail:v.detail.map(x=>x.correct),
    sequence:v.sequence.map((_,i)=>i),
    facts:v.facts.map(()=>'Reasonably written answer'),
    open:v.open.map(()=>'Thoughtful interpretation')
   };
   const scored=core.assess(v,good);
   assert.equal(scored.objectiveCorrect,scored.objectiveMax);
   assert.equal(scored.objectivePercent,100);
   assert.equal(scored.resultFinal,false);
   assert.equal(scored.finalPercentage,null);
   assert.equal(scored.officialGrade,null);
   assert.equal(scored.localOnly,true);
   assert.equal(scored.writingReviewCount,v.facts.length+v.open.length);
   assert.equal(scored.reviewed.length,v.gist.length+v.detail.length+v.sequence.length);
   assert.equal(scored.writing.length,v.facts.length+v.open.length);
  }
 }
 assert.deepEqual(total,{variants:18,gist:57,detail:104,sequence:90,facts:45,open:39,multi:4});
});

test('R24 flags missing, wrong, duplicate sequence and invalid multiple answers',()=>{
 const raw=read(entries[1].relative),data=core.extractJson(raw,'DATA'),v=core.variant(data,'B2');
 const empty=core.assess(v,{});
 assert.equal(empty.answered,0);
 assert.equal(empty.objectiveCorrect,0);
 assert.equal(empty.finalPercentage,null);
 assert.equal(empty.writingReviewCount,0);
 const multi=v.gist.find(x=>x.type==='multi');
 assert.ok(multi);
 const partial={gist:v.gist.map(x=>x.type==='multi'?x.correct.slice(0,1):null)};
 const scored=core.assess(v,partial);
 assert.equal(scored.reviewed.find(x=>x.type==='multi').correct,false);
 assert.throws(()=>core.assess(v,{sequence:[0,0]}),/twice/);
 assert.throws(()=>core.assess(v,{sequence:[999]}),/Invalid reconstruction/);
 assert.throws(()=>core.assess(v,{gist:[999]}),/Invalid single response/);
 assert.throws(()=>core.assess(v,{facts:[new Array(5005).join('x')]}),/Invalid written/);
 assert.throws(()=>core.extractJson('<script>const DATA={not-valid};</script>','DATA'),/unreadable/);
 assert.throws(()=>core.extractJson('','DATA'));
});

test('R53 teacher exposes the original media link without playback counters; students remain media-free',()=>{
 const student=read('self-check/listening/student.html');
 const studentJs=read('self-check/listening/listening-student.js');
 const teacher=read('self-check/listening/teacher.html');
 const teacherJs=read('self-check/listening/listening-teacher.js');
 const policy=JSON.parse(read('data/test-mode-policy.json'));
 assert.equal(policy.gradedTestsEnabled,false);
 assert.equal(policy.selfCheckEnabled,true);
 assert.equal(policy.testUiEnabled,true);
 assert.equal(policy.futureSelfCheck.listeningPasses,2);
 assert.deepEqual(policy.futureSelfCheck.listeningSections,core.PHASES);
 assert.doesNotMatch(student,/<(?:iframe|video|audio)\b|youtube\.com|facebook\.com/i);
 assert.doesNotMatch(studentJs,/(?:new Audio\(|createElement\(['"](?:audio|video|iframe))|https:\/\/www\.youtube\.com/);
 assert.match(studentJs,/First Listening/);
 assert.match(studentJs,/Listen and Interpret/);
 assert.match(studentJs,/Listen, Complete and Reconstruct/);
 assert.match(studentJs,/submitButton/);
 assert.match(teacher,/id="topicTitle"/);
 assert.match(teacher,/id="mediaSources"/);
 assert.match(teacher,/id="studentUrl"/);
 assert.doesNotMatch(teacher,/<select id="topic"|markPass|resetPass|passCount|Průběh přehrávání/);
 assert.doesNotMatch(teacherJs,/passes\s*[<>=]|function count\(/);
 assert.match(teacherJs,/const topicId=params\.get\('topic'\)/);
 assert.match(teacherJs,/target='_blank'|target='_blank'/);
 assert.match(read('assets/hub.js'),/self-check\/listening\/teacher\.html/);
 assert.doesNotMatch(read('assets/hub.js'),/LSH_LISTENING_TEST_GRADED/);
});

test('R24 uses no student POST, login, database or official grading API',()=>{
 const code=read('self-check/listening/listening-student.js')+
   read('self-check/listening/listening-core.js');
 assert.doesNotMatch(code,/(?:method\s*:\s*['"]POST|navigator\.sendBeacon|indexedDB\.open|fetch\([^\n]+\/v1\/)/);
 assert.doesNotMatch(read('self-check/listening/student.html'),/type=["']password|name=["']studentName/);
 assert.equal(cards.entries.length,31);
 assert.equal(cards.entries.reduce((sum,x)=>sum+x.languages.length*x.levels.length,0),672);
});
