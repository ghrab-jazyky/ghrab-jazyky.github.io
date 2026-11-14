#!/usr/bin/env node
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const hub=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.resolve(hub,p),'utf8');
test('Entry counts on intro/chooser derive from one catalog source',()=>{
 const html=read('index.html'),src=read('assets/hub.js');
 const entries=JSON.parse(read('data/cards.json')).entries;
 for(const skill of ['konverzace','cteni','poslech']){
  const count=entries.filter(e=>e.skill===skill).length;
  assert.ok(count>0);
  assert.equal((html.match(new RegExp('data-count-skill="'+skill+'"','g'))||[]).length,2);
  assert.match(html,new RegExp('data-count-word="'+skill+'"'));
 }
 assert.match(src,/entries\.filter\(e=>e\.skill===name\)\.length/);
 assert.match(src,/entries=body\.entries;\s*syncCatalogCounts\(\)/);
});
for(const topic of ['sad','conlangs']){
 test(topic+' presents the common Listening Studio layout without changing assessment element IDs',()=>{
  const html=read('poslech/'+topic+'/index.html');
  assert.match(html,/href="\.\.\/\.\.\/assets\/lsh\/listening-studio\.css"/);
  assert.match(html,/src="\.\.\/\.\.\/assets\/lsh\/listening-studio\.js"/);
  assert.match(html,/<nav class="studio-levelbar" aria-label="Choose a listening level">/);
  for(const id of ['levelPills','topLevelText','videoFrame','videoCover','loadVideo',
   'questionsA','questionsB','questionsC','checkA','checkB','checkC',
   'progressBar','progressStatus','studioProgressBar','studioProgressText'])
   assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,topic+' #'+id);
  assert.doesNotMatch(html.slice(html.indexOf('<section class="hero">'),html.indexOf('</section>')), /id="levelPills"/);
  const script=read('poslech/'+topic+'/'+topic+'-practice.js');
  assert.match(script,/savedTheme==='light'\|\|savedTheme==='dark'/);
 });
}
test('Shared visual layer retains accessible light/dark modes and original question UI',()=>{
 const css=read('assets/lsh/listening-studio.css');
 const src=read('assets/lsh/listening-studio.js');
 assert.match(css,/:root\[data-theme="dark"\]/);
 assert.match(css,/\.studio-levelbar/);
 assert.match(css,/\.task>\.match-answer\{grid-column:2\}/);
 assert.match(src,/MutationObserver/);
 assert.doesNotMatch(src,/gradeAnswers|localStorage|fetch\(/);
});
