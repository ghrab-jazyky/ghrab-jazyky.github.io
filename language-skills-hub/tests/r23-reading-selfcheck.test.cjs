#!/usr/bin/env node
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const core=require('../self-check/reading/reading-core.js');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const cards=JSON.parse(read('data/cards.json'));
const version=JSON.parse(read('version.json'));
const reading=cards.entries.filter(x=>x.skill==='cteni');

test('R23 public practice remains immutable: 29 cards, 642 variants, no graded tests',()=>{
 assert.equal(cards.gradedTestsEnabled,false);
 assert.equal(version.gradedTestsEnabled,false);
 assert.equal(cards.entries.length,29);
 assert.equal(reading.length,5);
 const count=cards.entries.reduce((s,x)=>s+x.languages.length*x.levels.length,0);
 assert.equal(count,642);
 for(const x of cards.entries){
  const bytes=fs.readFileSync(path.join(root,x.relative));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),
   version.contentHashes[x.id],x.id+' mutated');
 }
});

test('R23 parses all five real Reading cards and preserves all 120 variants/1800 source questions',()=>{
 let variants=0,questions=0,reflections=0,gap=0,match=0,mc=0;
 for(const entry of reading){
  assert.equal(core.readingEntry(cards,entry.id),entry);
  const html=read(entry.relative);
  const dataset=core.parseReadingData(html);
  assert.deepEqual(Object.keys(dataset).sort(),entry.languages.slice().sort(),entry.id);
  for(const lang of entry.languages)for(const level of entry.levels){
   const v=core.variantFromData(dataset,lang,level);
   variants++;questions+=v.questions.length;
   if(v.open)reflections++;
   const kinds=v.questions.map(q=>q.kind);
   gap+=kinds.filter(x=>x==='gap').length;
   match+=kinds.filter(x=>x==='match').length;
   mc+=kinds.filter(x=>x==='mc').length;
   assert.equal(v.questions.length,new Set(v.questions.map(q=>q.id)).size);
   assert.equal(v.tabs.every(tab=>v.questions.some(q=>q.tab===tab.id)),true);
   for(let p=0;p<v.paragraphs.length;p++){
    const parts=core.readingParagraphParts(v,p);
    assert.ok(parts.length>=1);
    if(v.gap&&p===v.gap.p){
     assert.deepEqual(parts.map(q=>q.kind),['text','gap','text']);
     assert.equal(parts[0].text+v.gap.sentence+parts[2].text,v.paragraphs[p]);
    }else assert.equal(parts[0].text,v.paragraphs[p]);
   }
  }
 }
 assert.equal(variants,120);
 assert.equal(questions,1800);
 assert.equal(reflections,120);
 assert.equal(mc,1540);
 assert.equal(gap,80);
 assert.equal(match,180);
});

test('R23 objective self-check: full, wrong, missing and partial submissions; never grades',()=>{
 const example=core.variantFromData(core.parseReadingData(read(reading[0].relative)),'en','B2');
 const full=Object.create(null),wrong=Object.create(null);
 for(const q of example.questions){
  full[q.id]=q.answer;
  wrong[q.id]=(q.answer+1)%q.choices.length;
 }
 const perfect=core.score(example,full);
 assert.equal(perfect.answered,example.questions.length);
 assert.equal(perfect.correct,example.questions.length);
 assert.equal(perfect.percentage,100);
 assert.equal(perfect.schoolGrade,null);
 assert.equal(perfect.officialGrade,false);
 assert.equal(perfect.localOnly,true);
 assert.equal(perfect.details.every(x=>x.correct),true);
 const incorrect=core.score(example,wrong);
 assert.equal(incorrect.correct,0);
 assert.equal(incorrect.percentage,0);
 assert.equal(incorrect.details.every(x=>!x.correct&&x.correctAnswer),true);
 const partial=Object.create(null);partial[example.questions[0].id]=example.questions[0].answer;
 const scored=core.score(example,partial);
 assert.equal(scored.correct,1);
 assert.equal(scored.answered,1);
 assert.equal(scored.unanswered,example.questions.length-1);
 assert.equal(scored.schoolGrade,null);
 assert.equal(scored.details[1].selectedAnswer,null);
});

test('R23 rejects invalid variants, unknown topics, malformed definitions and dangerous answers',()=>{
 const entry=reading[0],data=core.parseReadingData(read(entry.relative));
 for(const bad of ['../../secrets','cl-rodina','ll-matthew-oscars','rl-not-listed'])
  assert.throws(()=>core.readingEntry(cards,bad),Error);
 assert.throws(()=>core.variantFromData(data,'xx','B2'),Error);
 assert.throws(()=>core.variantFromData(data,'en','B4'),Error);
 const variant=core.variantFromData(data,'en','B2');
 assert.throws(()=>core.score(variant,{[variant.questions[0].id]:999}),Error);
 assert.throws(()=>core.score(variant,null),Error);
 assert.throws(()=>core.parseReadingData('const DATA={not-json};'),Error);
 assert.throws(()=>core.parseReadingData(''),Error);
});

test('R23 publicly linked Reading self-check discloses non-graded limitations',()=>{
 const html=read('self-check/reading/index.html');
 const js=read('self-check/reading/reading.js');
 const policy=JSON.parse(read('data/test-mode-policy.json'));
 assert.equal(policy.testUiEnabled,true);
 assert.equal(policy.selfCheckEnabled,true);
 assert.equal(policy.gradedTestsEnabled,false);
 assert.equal(policy.officialGradesEnabled,false);
 assert.match(html,/Reading Lab · Local self-check pilot/);
 assert.match(html,/not a secure or graded exam/);
 assert.match(js,/teacher|server/i);
 assert.match(read('assets/hub.js'),/self-check\/reading\/teacher\.html/);
 assert.doesNotMatch(read('assets/hub.js'),/LSH_TEST_GRADED_ENABLED/);
 assert.doesNotMatch(js,/fetch\([^\n]*method\s*:\s*['"]POST|eval\(|new Function/);
 assert.doesNotMatch(html,/https:\/\/[^'"]+\.js/);
});
