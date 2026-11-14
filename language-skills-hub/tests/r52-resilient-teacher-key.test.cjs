#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const file=p=>fs.readFileSync(path.join(root,p),'utf8');
const model=require('../self-check/practice-answers/teacher-key.js');
test('R52: static teacher-key snapshot matches precisely the canonical Reading/Listening catalog',()=>{
 const expected=JSON.parse(file('data/cards.json')).entries.filter(e=>['cteni','poslech'].includes(e.skill))
  .map(e=>({id:e.id,skill:e.skill,title:e.title,languages:e.languages,levels:e.levels,
   relative:e.relative,lockSource:e.lockSource}));
 assert.deepEqual(model.keyEntries,expected);
 assert.equal(model.keyEntries.length,10);
 assert.equal(new Set(model.keyEntries.map(x=>x.id)).size,10);
 assert.equal(model.keyEntries.filter(x=>x.skill==='cteni').length,5);
 assert.equal(model.keyEntries.filter(x=>x.skill==='poslech').length,5);
 for(const e of model.keyEntries){
  const source=e.lockSource||e.relative;
  assert.match(source,/^(cteni|poslech|r11\/variant-copies)\/[a-z0-9-]+(?:\/index)?\.html$/);
  assert.ok(fs.existsSync(path.join(root,source)),e.id+' missing source '+source);
  assert.deepEqual(e.levels,['A1','A2','B1','B2','C1','C2']);
 }
});
test('R52: result UI initializes without catalog fetch, preserves topic isolation and allows manual retry',()=>{
 const js=file('self-check/practice-answers/teacher-key.js');
 const html=file('self-check/practice-answers/teacher.html');
 assert.doesNotMatch(js,/fetch\(['"]\.\.\/\.\.\/data\/cards\.json/);
 assert.match(js,/const entries=KEY_ENTRIES;/);
 assert.match(js,/sourceCache=null/);
 assert.match(js,/async function loadSourceWithRetry\(source\)/);
 assert.match(js,/cache:'no-store'/);
 assert.match(js,/credentials:'omit'/);
 assert.match(js,/resp\.url/);
 assert.match(js,/resp\.ok/);
 assert.match(js,/requestedSkill===null\|\|requestedSkill===e\.skill/);
 assert.match(js,/retryLoad.*addEventListener\('click',refresh\)/);
 assert.match(html,/id="retryLoad" hidden/);
 assert.match(html,/name="lsh-teacher-keys-version" content="R52"/);
 assert.match(html,/id="answerMode"/);
 assert.match(html,/id="topicTitle"/);
 assert.match(html,/id="language"/);
 assert.match(html,/id="level"/);
});
