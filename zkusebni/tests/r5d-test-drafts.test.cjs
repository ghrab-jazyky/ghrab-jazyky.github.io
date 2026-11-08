#!/usr/bin/env node
/* Node-only functional smoke of the 54 isolated R5D test-form prototypes.
 * All outputs created in OS temp dir and destroyed. Never modify public tree.
 */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const STAGE=path.resolve(__dirname,'..');
const GEN=path.join(STAGE,'tools/r5d-test-drafts.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(path.join(STAGE,p));
const protectedFiles=['data/reference-pilots.json','data/unification-tracker.json',
 'data/claude-audit-queue.json'];
const previous=Object.fromEntries(protectedFiles.map(f=>[f,sha(read(f))]));
const baseline=JSON.parse(read('data/reference-pilots.json'));
test('R5D 54 test drafts: no answers, grades, teacher keys, student identities, deployment',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r5d-'));
 try{
  const result=execFileSync(process.execPath,[GEN,dir+'/out'],
   {encoding:'utf8',timeout:120000});
  assert.match(result,/PASS R5D 54 review-only/);
  const out=path.join(dir,'out');
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'R5D_DRAFT_MANIFEST.json'),'utf8'));
  assert.equal(manifest.schemaVersion,1);
  assert.equal(manifest.stage,'R5D_TEST_DRAFTS');
  assert.equal(manifest.state,'DRAFT_NOT_READY');
  assert.equal(manifest.totalVariants,54);
  assert.equal(manifest.topics,3);
  assert.equal(manifest.teacherApproval,false);
  assert.equal(manifest.published,false);
  assert.equal(manifest.gradePolicyApproved,false);
  assert.equal(manifest.noKeys,true);
  assert.equal(manifest.noStudentIdentity,true);
  assert.equal(manifest.variants.length,54);
  const unique=new Set(manifest.variants.map(v=>v.file));
  assert.equal(unique.size,54);
  for(const skill of ['konverzace','cteni','poslech']){
   const count=manifest.variants.filter(v=>v.skill===skill).length;
   assert.equal(count,skill==='poslech'?6:24);
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
    const structureIndex=v.taskIds.findIndex(id=>String(id).includes('structure'));
    if(structureIndex>=0){
     assert.equal((passage.match(/\[ … \]/g)||[]).length,1,'Structure passage gap absent: '+v.file);
     const fields=[...content.matchAll(/<fieldset class="task">([\s\S]*?)<\/fieldset>/g)];
     const options=[...(fields[structureIndex]?.[1]||'').matchAll(/<span>([\s\S]*?)<\/span>/g)].map(m=>m[1]);
     assert.ok(options.length>=2,'Missing options for sentence gap: '+v.file);
     for(const opt of options.filter(t=>t.length>=25))
      assert.ok(!passage.includes(opt),'Sentence-gap answer leaked into passage: '+v.file);
    }else assert.doesNotMatch(passage,/\[ … \]/,'Unexpected gap: '+v.file);
   }else{
    assert.equal(v.taskCount,6);
    assert.equal((content.match(/<fieldset class="task">/g)||[]).length,4);
    assert.ok((content.match(/type="number"/g)||[]).length>=3);
    assert.match(content,/First Listening/);
    assert.match(content,/Second Listening/);
    assert.match(content,/Third Listening/);
    assert.match(content,/teacher plays the recording/i);
   }
   radioCount+=(content.match(/type="radio"/g)||[]).length;
   rendered++;
  }
  assert.equal(rendered,54);
  assert.ok(radioCount>200);
  const index=fs.readFileSync(path.join(out,'index.html'),'utf8');
  assert.equal((index.match(/<li><a href=/g)||[]).length,54,'Teacher index missing variants');
  assert.match(fs.readFileSync(path.join(out,'README_R5D.md'),'utf8'),/NEPOUŽÍVAT KE ZNÁMKOVÁNÍ/);
  assert.equal(JSON.parse(read('data/reference-pilots.json')).entries.length,29);
  assert.ok(JSON.parse(read('data/reference-pilots.json')).entries.every(e=>e.test==='not-ready'));
  for(const [name,checksum] of Object.entries(previous))
   assert.equal(sha(read(name)),checksum,'Protected staging index mutated: '+name);
  console.log('PASS all 54 R5D no-key/no-grade/no-identity preview variants; 29 original pilot items unchanged');
 }finally{fs.rmSync(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100})}
});
test('R5D generator blocks writing into public repository',()=>{
 const dangerous=path.join(STAGE,'r5d-should-never-exist');
 assert.equal(fs.existsSync(dangerous),false);
 assert.throws(()=>execFileSync(process.execPath,[GEN,dangerous],
  {encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000}));
 assert.equal(fs.existsSync(dangerous),false);
});
