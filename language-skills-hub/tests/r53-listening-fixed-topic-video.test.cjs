#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const core=require('../self-check/listening/listening-core.js');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const entries=JSON.parse(read('data/cards.json')).entries.filter(e=>e.skill==='poslech'&&core.TOPICS.includes(e.id));
const page=read('self-check/listening/teacher.html');
const js=read('self-check/listening/listening-teacher.js');
const css=read('self-check/listening/listening.css');
test('R53 Listening TEST: immutable topic, no selectable other cards or playback counters',()=>{
 assert.equal(entries.length,3);
 assert.deepEqual(entries.map(e=>e.id),core.TOPICS);
 assert.match(page,/id="topicTitle"/);
 assert.match(page,/id="level"/);
 assert.match(page,/id="timerMinutes"/);
 assert.match(page,/id="mediaHeading"/);
 assert.match(page,/id="mediaSources"/);
 assert.match(page,/id="studentUrl"/);
 assert.match(page,/id="qrMount"/);
 assert.match(page,/name="lsh-listening-teacher-release" content="R53"/);
 assert.doesNotMatch(page,/<select[^>]+id="topic"|id="passCount"|id="markPass"|id="resetPass"|id="playbackHeading"/);
 assert.doesNotMatch(page,/DVA POSLECHY|Průběh přehrávání|První poslech dokončen|Druhý poslech dokončen/i);
 assert.match(js,/const topicId=params\.get\('topic'\)/);
 assert.match(js,/const chosen=Object\.hasOwn\(topics,topicId\)\?topics\[topicId\]:null/);
 assert.match(js,/u\.searchParams\.set\('topic',topicId\)/);
 assert.doesNotMatch(js,/passes=0|passes\+\+|function count\(|\$\('topic'\)/);
 assert.match(css,/\.listening-video-primary/);
});
test('R53 original video URLs exactly mirror sources in all 3 canonical Listening cards',()=>{
 for(const entry of entries){
  assert.ok(js.includes("'"+entry.id+"':{"),entry.id+' not in immutable config');
  assert.ok(js.includes("source:'"+entry.relative+"'"),entry.id+' source changed');
  const html=read(entry.relative);
  const sources=core.sourceLinks(html).filter(s=>s.name!=='netflix');
  assert.equal(sources.length,2,entry.id+' requires the original + alternate video');
  for(const source of sources){
   assert.ok(js.includes("key:'"+source.name+"'"),entry.id+' missing media key '+source.name);
   assert.ok(js.includes("url:'"+source.url+"'"),
    entry.id+' missing canonical public URL '+source.url);
  }
 }
});
test('R53 Listening teacher never sends or receives scores; students still use existing test',()=>{
 const student=read('self-check/listening/student.html');
 assert.match(js,/new URL\('student\.html',location\.href\)/);
 for(const prop of ['topic','level','timer','attempt'])
  assert.match(js,new RegExp("u\\.searchParams\\.set\\('"+prop+"'"));
 assert.doesNotMatch(js,/method\s*:\s*['"]POST|fetch\(|navigator\.sendBeacon|resultScore/);
 assert.doesNotMatch(page,/<iframe|<video|<audio/);
 assert.doesNotMatch(student,/<iframe|<video|<audio/);
 assert.match(js,/invalidat(e|ion)/);
});
