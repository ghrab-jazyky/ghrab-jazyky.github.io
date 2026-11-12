#!/usr/bin/env node
/* Node-only functional verification of all 642 isolated R5D ALL29 test-form drafts.
 * All outputs created in OS temp dir and destroyed. Never modify public tree.
 */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const STAGE=path.resolve(__dirname,'..');
const GEN=path.join(STAGE,'tools/r5d-all29-test-drafts.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(path.join(STAGE,p));
const protectedFiles=['data/reference-pilots.json','data/unification-tracker.json',
 'data/claude-audit-queue.json'];
const previous=Object.fromEntries(protectedFiles.map(f=>[f,sha(read(f))]));
const baseline=JSON.parse(read('data/reference-pilots.json'));
test('R5D ALL29 642 test drafts: no answers, grades, teacher keys, student identities, deployment',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r5d-'));
 try{
  const result=execFileSync(process.execPath,[GEN,dir+'/out'],
   {encoding:'utf8',timeout:120000});
  assert.match(result,/PASS R5D ALL29 642 review-only/);
  const out=path.join(dir,'out');
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'R5D_ALL29_DRAFT_MANIFEST.json'),'utf8'));
  assert.equal(manifest.schemaVersion,1);
  assert.equal(manifest.stage,'R5D_ALL29_TEST_DRAFTS');
  assert.equal(manifest.state,'DRAFT_NOT_READY');
  assert.equal(manifest.totalVariants,642);
  assert.equal(manifest.topics,29);
  assert.equal(manifest.teacherApproval,false);
  assert.equal(manifest.published,false);
  assert.equal(manifest.gradePolicyApproved,false);
  assert.equal(manifest.noKeys,true);
  assert.equal(manifest.noStudentIdentity,true);
  assert.equal(manifest.variants.length,642);
  const unique=new Set(manifest.variants.map(v=>v.file));
  assert.equal(unique.size,642);
  const sources=JSON.parse(read('data/r5d-all29-source-pins.json'));
  assert.deepEqual(new Set(manifest.variants.map(v=>v.topicId)),
   new Set(sources.entries.map(v=>v.topicId)));
  for(const source of sources.entries){
   const samples=manifest.variants.filter(v=>v.topicId===source.topicId);
   assert.equal(samples.length,source.languages.length*source.levels.length,
    'Incomplete CEFR/language matrix for '+source.topicId);
   assert.deepEqual(new Set(samples.map(v=>v.sourceGitBlob)),new Set([source.gitBlob]));
   assert.deepEqual(new Set(samples.map(v=>v.language)),new Set(source.languages));
   assert.deepEqual(new Set(samples.map(v=>v.level)),new Set(source.levels));
  }
  for(const skill of ['konverzace','cteni','poslech']){
   const count=manifest.variants.filter(v=>v.skill===skill).length;
   assert.equal(count,skill==='konverzace'?504:skill==='cteni'?120:18);
  }
  let rendered=0,radioCount=0;
  for(const v of manifest.variants){
   const file=path.join(out,v.file);
   const content=fs.readFileSync(file,'utf8');
   assert.equal(sha(content),v.sha256,'Checksum wrong '+v.file);
   assert.match(content,/<html lang="[a-z]{2}"/);
   assert.match(content,/name="robots" content="noindex,nofollow"/);
   assert.match(content,/role="note"/);
   assert.match(content,/<meta name="viewport"/);
   assert.match(content,/<main>/);
   assert.match(content,new RegExp(v.level));
   assert.ok(!/<script\b|<iframe\b|<form\b|<video\b|<audio\b/i.test(content),
    'No JS/external media/form allowed: '+v.file);
   assert.ok(!/\b(?:localStorage|sessionStorage|indexedDB|fetch\(|studentName|analytics)\b/i.test(content));
   assert.ok(!/["'](?:correct|answer|explanation|evidence|tokens|criteria)["']\s*:/.test(content),
    'Student preview appears to embed an answer-key object: '+v.file);
   assert.ok(!/\b(?:school email|student ID|grade assigned)\b/i.test(content));
   assert.equal(v.teacherApproval,false);
   assert.equal(v.automaticScoring,false);
   assert.equal(v.notesForTeacher.targetLevel,v.level);
   for(const prop of ['targetGroup','estimatedDuration','objective','weaker','stronger'])
    assert.ok(v.notesForTeacher[prop].length>10,'Missing teacher metadata '+prop+' '+v.file);
   if(v.skill==='konverzace'){
    assert.equal(v.taskCount,3);
    assert.equal(v.taskIds.length,3);
    assert.equal((content.match(/<article>/g)||[]).length,3);
    assert.equal((content.match(/type="radio"/g)||[]).length,0);
   }else if(v.skill==='cteni'){
    assert.equal(v.taskCount,['A1','A2'].includes(v.level)?5:6);
    assert.equal(v.taskIds.length,v.taskCount);
    assert.equal((content.match(/<fieldset class="task">/g)||[]).length,v.taskCount);
    assert.ok((content.match(/<section class="reading">/g)||[]).length===1);
    const passage=(content.match(/<section class="reading">([\s\S]*?)<\/section>/)||[])[1]||'';
    const structureIndex=v.structureIndex??-1;
    if(structureIndex>=0){
     assert.equal((passage.match(/\[ … \]/g)||[]).length,1,'Structure passage gap absent: '+v.file);
     const fields=[...content.matchAll(/<fieldset class="task">([\s\S]*?)<\/fieldset>/g)];
     const options=[...(fields[structureIndex]?.[1]||'').matchAll(/<span>([\s\S]*?)<\/span>/g)].map(m=>m[1]);
     assert.ok(options.length>=2,'Missing options for sentence gap: '+v.file);
     for(const opt of options.filter(t=>t.length>=25))
      assert.ok(!passage.includes(opt),'Sentence-gap answer leaked into passage: '+v.file);
    } // Some source texts include native gaps even without a selected structure task.
   }else{
    assert.equal(v.taskCount,6);
    assert.equal((content.match(/<fieldset class="task">/g)||[]).length,4);
    assert.ok((content.match(/type="number"/g)||[]).length>=3);
    const orderFields=[...content.matchAll(/<p><label><span>([\s\S]*?)<\/span> <input class="number" type="number" inputmode="numeric" name="sequence-(\d+)" min="1" max="(\d+)" aria-label="[^"]+"><\/label><\/p>/g)];
    assert.ok(orderFields.length>=3,'Chronological order requires named and labelled fields: '+v.file);
    assert.deepEqual(orderFields.map(m=>Number(m[2])),Array.from({length:orderFields.length},(_,i)=>i+1));
    assert.ok(orderFields.every(m=>Number(m[3])===orderFields.length));
    const plan=JSON.parse(read('data/r5d-all29-source-pins.json'));
    const refs=JSON.parse(read('data/r5d-test-draft-plan.json'));
    const source=[...plan.entries,...refs.sources].find(s=>s.topicId===v.topicId&&s.gitBlob===v.sourceGitBlob);
    assert.ok(source,'Missing original Listening source: '+v.topicId);
    const sourceHtml=read(source.path).toString('utf8');
    const start=sourceHtml.indexOf('const DATA='),stop=sourceHtml.indexOf(';\nconst SOURCES=',start);
    assert.ok(start>=0&&stop>start,'Missing original Listening data');
    const original=JSON.parse(sourceHtml.slice(start+'const DATA='.length,stop))[v.level].sequence;
    const escaped=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const scrambled=orderFields.map(m=>m[1]);
    assert.deepEqual(scrambled.slice().sort(),original.map(escaped).sort(),'Some original speech moments were lost');
    assert.ok(!Array.from({length:original.length},(_,shift)=>
     scrambled.every((line,i)=>line===escaped(original[(i+shift)%original.length]))).some(Boolean),
     'Reconstruction still uses an easily predictable cyclic rotation');
    assert.match(content,/First Listening/);
    assert.match(content,/Second Listening/);
    assert.match(content,/Third Listening/);
    assert.match(content,/teacher plays the recording/i);
   }
   radioCount+=(content.match(/type="radio"/g)||[]).length;
   rendered++;
  }
  assert.equal(rendered,642);
  assert.ok(radioCount>200);
  const index=fs.readFileSync(path.join(out,'index.html'),'utf8');
  assert.equal((index.match(/<li><a href=/g)||[]).length,642,'Teacher index missing variants');
  assert.equal((index.match(/<details>/g)||[]).length,29,
   'All 29 topics need a separate offline review expander');
  assert.equal((index.match(/<section><h2>/g)||[]).length,3,
   'Separate the three language skills in the offline review index');
  assert.equal((index.match(/<script\b/gi)||[]).length,0,
   'Teacher review index must not need JavaScript or the network');
  assert.match(fs.readFileSync(path.join(out,'README_R5D.md'),'utf8'),/NEPOUŽÍVAT KE ZNÁMKOVÁNÍ/);
  assert.equal(JSON.parse(read('data/reference-pilots.json')).entries.length,29);
  assert.equal(JSON.parse(read('data/r5d-all29-source-pins.json')).entries.length,29);
  assert.ok(JSON.parse(read('data/reference-pilots.json')).entries.every(e=>e.test==='not-ready'));
  for(const [name,checksum] of Object.entries(previous))
   assert.equal(sha(read(name)),checksum,'Protected staging index mutated: '+name);
  console.log('PASS all 642 R5D no-key/no-grade/no-identity preview variants; 29 original pilot items unchanged');
 }finally{fs.rmSync(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100})}
});
test('R5D generator blocks writing into public repository',()=>{
 const dangerous=path.join(STAGE,'r5d-all29-should-never-exist');
 assert.equal(fs.existsSync(dangerous),false);
 assert.throws(()=>execFileSync(process.execPath,[GEN,dangerous],
  {encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000}));
 assert.equal(fs.existsSync(dangerous),false);
});
