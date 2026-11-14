#!/usr/bin/env node
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

for(const topic of ['sad','conlangs']){
 test('R71 '+topic+': sections contain one instruction, radio groups use visually hidden question legend',()=>{
  const source=read('poslech/'+topic+'/'+topic+'-practice.js');
  const html=read('poslech/'+topic+'/index.html');
  assert.doesNotMatch(source,/Choose one correct answer\.|Choose True, False or Not Stated\./);
  assert.match(source,/el\('fieldset','task-field'\)/);
  assert.match(source,/el\('legend','sr-only-task-legend',q\.id\+': '\+q\.question\)/);
  assert.match(html,/id="first"[\s\S]*?choose the best answer\./);
  assert.match(html,/id="second"[\s\S]*?True, False or Not Stated\?/);
 });
}
test('R71 shared Listening Studio hides the semantic legend and removes the redundant fieldset border',()=>{
 const css=read('assets/lsh/listening-studio.css');
 assert.match(css,/\.task \.task-field\{[^}]*border:0/);
 assert.match(css,/\.task \.task-field>\.sr-only-task-legend\{[^}]*clip-path:inset\(50%\)/);
 assert.doesNotMatch(css,/display:none[^}]*sr-only-task-legend/);
});
