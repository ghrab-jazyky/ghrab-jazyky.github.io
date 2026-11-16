#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const reading=require('../self-check/reading/reading-core.js');
const listening=require('../self-check/listening/listening-core.js');
const keys=require('../self-check/practice-answers/teacher-key.js');
const catalog=JSON.parse(read('data/cards.json'));
const rows=[],counts=new Map();
const normalized=x=>String(x||'').trim().replace(/\s+/g,' ').toLocaleLowerCase();
const identity=(question,answer)=>JSON.stringify([normalized(question),normalized(answer)]);
for(const e of catalog.entries.filter(e=>['cteni','poslech'].includes(e.skill))){
 const html=read(e.lockSource||e.relative);
 const data=e.skill==='cteni'?reading.parseReadingData(html):listening.extractJson(html,'DATA');
 for(const lang of e.languages)for(const level of e.levels){
  const v=e.skill==='cteni'?reading.variantFromData(data,lang,level):listening.variant(data,level);
  const practice=e.skill==='cteni'?keys.buildReading(v,e,lang,level):keys.buildListening(
   e.id==='ll-conlangs'?keys.conlangsPracticeVariant(data,level,v):
   e.id==='ll-how-to-choose-your-news'?keys.newsPracticeVariant(data,level,v):v,e,lang,level);
  keys.validate(practice);
  const practiceSet=new Set(practice.groups.flatMap(g=>g.items).map(q=>identity(q.question,q.answer)));
  const scored=e.skill==='cteni'?v.questions.map(q=>({question:q.q,answers:[q.choices[q.answer]]})):
   listening.assessAuto(v,{},e.id,level).reviewed.map(q=>({question:q.question,answers:q.correctAnswers}));
  let match=0;
  for(const q of scored)if(practiceSet.has(identity(q.question,q.answers.join(' / '))))match++;
  rows.push({topic:e.id,language:lang,level,scored:scored.length,exactMatches:match});
  const count=counts.get(e.id)||0;counts.set(e.id,count+match);
 }
}
test('Stage A: all 156 variants have a machine-readable overlap baseline and truthful topic flags',()=>{
 assert.equal(rows.length,156);
 assert.equal(rows.filter(r=>r.topic.startsWith('rl-')).length,120);
 assert.equal(rows.filter(r=>r.topic.startsWith('ll-')).length,36);
 for(const e of catalog.entries.filter(e=>['cteni','poslech'].includes(e.skill))){
  const overlap=(counts.get(e.id)||0)>0;
  assert.equal(e.testExactOverlap,overlap,e.id+' incorrect metadata; check actual source');
 }
 for(const e of catalog.entries.filter(e=>e.skill==='cteni')){
  for(const row of rows.filter(r=>r.topic===e.id))assert.equal(row.exactMatches,row.scored,e.id+' should match all original Reading questions');
 }
});
test('Stage A: duplicated Listening teacher flags remain in sync with canonical catalog',()=>{
 const source=read('self-check/listening/listening-teacher.js');
 for(const e of catalog.entries.filter(e=>e.skill==='poslech')){
  assert.ok(source.includes("'"+e.id+"':"+e.testExactOverlap),e.id+' metadata out of sync');
 }
});
test('Stage A: public key is practice-only even when URL requests TEST',()=>{
 const source=read('self-check/practice-answers/teacher-key.js');
 const html=read('self-check/practice-answers/teacher.html');
 assert.doesNotMatch(source,/buildReadingTest|buildListeningTest|mode==='test'/);
 assert.match(source,/searchParams.set\('mode','practice'\)/);
 assert.doesNotMatch(html,/value="test"|id="answerMode"/);
});
test('Stage A: report is available as JSON in test output or configured artifact',()=>{
 const report={kind:'LSH_STAGE_A_EXACT_OVERLAP_R76A',variants:rows.length,topics:[...counts.entries()].map(([topic,exactMatches])=>({topic,exactMatches})),rows};
 if(process.env.LSH_OVERLAP_REPORT)fs.writeFileSync(process.env.LSH_OVERLAP_REPORT,JSON.stringify(report,null,2)+'\n');
 else console.log('LSH_STAGE_A_OVERLAP_REPORT='+JSON.stringify(report));
 assert.ok(rows.every(r=>r.scored>0));
});
