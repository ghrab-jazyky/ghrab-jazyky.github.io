#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const levels=['A1','A2','B1','B2','C1','C2'];
const studio=read('assets/lsh/listening-studio.js');
const sandbox={window:{},document:{readyState:'loading',addEventListener(){}},setTimeout};
vm.runInNewContext(studio,sandbox,{filename:'listening-studio.js',timeout:2500});
const api=sandbox.window.LSHListeningSequence;
test('R75 one shared Harrison-style reconstruction bank for SAD and Conlangs, A1-C2',()=>{
 assert.ok(api&&typeof api.mount==='function');
 assert.deepEqual(Array.from(api.defaultOrder(7)),[1,0,3,2,5,4,6]);
 assert.equal(api.validOrder([1,0,3,2],4),true);
 for(const corrupted of [[0,0,2,3],[-1,0,1,2],[1,0,2],['1',0,2,3]])
  assert.equal(api.validOrder(corrupted,4),false);
 for(const topic of ['ll-sad','ll-conlangs']){
  assert.deepEqual(Object.keys(api.banks[topic]).sort(),levels.slice().sort());
  for(const level of levels){
   const steps=api.bankFor(topic,level);
   const count=level==='A1'?4:level==='A2'?5:level==='B1'?6:7;
   assert.equal(steps.length,count,topic+' '+level);
   assert.equal(new Set(steps).size,count,topic+' '+level+' must have unique sentences');
   assert.ok(steps.every(s=>typeof s==='string'&&s.length>=16),topic+' '+level);
   steps[0]='MUTATION';
   assert.notEqual(api.bankFor(topic,level)[0],'MUTATION','bank must be immutable to callers');
  }
 }
 assert.equal(api.bankFor('ll-matthew-oscars','B2'),null);
});
test('R75 Harrison, Matthew and Peaky already have the original tap/drag sequence task',()=>{
 for(const topic of ['harrison-ford','matthew-oscars','peaky-no-fighting']){
  const html=read('poslech/'+topic+'/index.html');
  for(const target of ['id="sequenceList"','class="seq-grip"','function renderSequence(focusId)',
    "addEventListener('pointerdown'","addEventListener('click'"])
   assert.ok(html.includes(target),topic+' missing '+target);
 }
});
test('R75 every Listening Studio practice uses the same component; teacher key shares source',()=>{
 for(const topic of ['sad','conlangs','how-to-choose-your-news']){
  const file=topic==='how-to-choose-your-news'?'news-practice.js':topic+'-practice.js';
  const js=read('poslech/'+topic+'/'+file);
  assert.match(js,/window\.LSHListeningSequence/);
  assert.match(js,/sequence\.mount\(\{/);
  assert.match(js,/reconstruction\?\.destroy\(\)/);
  assert.doesNotMatch(js,/news-sequence-move/);
 }
 const teacher=read('self-check/practice-answers/teacher.html');
 assert.match(teacher,/assets\/lsh\/listening-studio\.js/);
 assert.match(read('self-check/practice-answers/teacher-key.js'),
  /host\.LSHListeningSequence\?\.bankFor\(e\.id,level\)/);
 assert.match(read('assets/lsh/listening-studio.css'),/\.lsq \.seq-card/);
 const news=read('poslech/how-to-choose-your-news/news-practice.js');
 assert.match(news,/class='seq-list'|el\('ol','seq-list'\)/);
});
test('R75 student sequencing leaves original source HTML and 17-item banks unchanged',()=>{
 const version=JSON.parse(read('version.json'));
 for(const [topic,slug] of [
  ['ll-sad','sad'],['ll-conlangs','conlangs'],['ll-how-to-choose-your-news','how-to-choose-your-news']
 ]){
  const html=read('poslech/'+slug+'/index.html');
  assert.equal(crypto.createHash('sha256').update(html).digest('hex'),version.contentHashes[topic]);
 }
 const policy=JSON.parse(read('data/test-mode-policy.json'));
 assert.equal(policy.officialGradesEnabled,false);
 assert.equal(policy.gradedTestsEnabled,false);
 assert.equal(policy.futureSelfCheck.listeningTestOpenAnswersEnabled,false);
});
