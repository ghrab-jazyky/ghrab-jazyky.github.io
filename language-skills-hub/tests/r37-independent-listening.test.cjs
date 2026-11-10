#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),
 {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=require('../self-check/listening/listening-core.js');
const schema=require('../self-check/test-banks/listening/independent-schema.js');
const grade=require('../self-check/results/grade-core.js');
const bank=JSON.parse(read('self-check/test-banks/listening/ll-harrison-ford/en-B2.json'));
const manifest=JSON.parse(read('version.json'));
const html=read('poslech/harrison-ford/index.html'),original=core.variant(core.extractJson(html,'DATA'),'B2');
const hash=crypto.createHash('sha256').update(html).digest('hex');
const selection={topic:'ll-harrison-ford',lang:'en',level:'B2'};
test('R37 Harrison Ford independent B2 Listening source matches R31 and has shorter distinct tasks',()=>{
 assert.equal(manifest.version,'R31');
 assert.equal(hash,manifest.contentHashes['ll-harrison-ford']);
 const result=schema.validate(bank,selection,original,hash);
 assert.deepEqual(result,{draft:true,approved:false,objective:8,written:2,total:10});
 assert.equal(bank.published,false);
 assert.equal(bank.listeningPasses,2);
 assert.ok(original.gist.length+original.detail.length+original.sequence.length+
  original.facts.length+original.open.length>10);
 for(const q of [...bank.variant.gist,...bank.variant.detail]){
  assert.ok(![...original.gist,...original.detail].some(p=>p.title===q.title));
 }
 assert.equal(bank.variant.facts.length,1);
 assert.equal(bank.variant.open.length,1);
});
test('R37 independent Listening grader requires both written tasks to be teacher-reviewed',()=>{
 const v=bank.variant;
 const answers={
  gist:v.gist.map(q=>q.correct),detail:v.detail.map(q=>q.correct),
  sequence:v.sequence.map((_,i)=>i),
  facts:['A screenwriter'],open:['His direction depended on others, and he thanks colleagues.']
 };
 const report=core.assess(v,answers);
 assert.equal(report.objectiveCorrect,8);
 assert.equal(report.objectiveMax,8);
 assert.equal(report.writing.length,2);
 const resultCore=require('../self-check/results/result-core.js');
 const normalized=resultCore.reviewListening(report);
 const incomplete=grade.listening(normalized,[1,null]);
 assert.equal(incomplete.suggested,null);
 assert.equal(incomplete.pending,1);
 const complete=grade.listening(normalized,[1,1]);
 assert.equal(complete.earned,10);
 assert.equal(complete.max,10);
 assert.equal(complete.suggested.grade,1);
});
test('R37 wrong sources, premature publication and mixed levels fail closed',()=>{
 assert.throws(()=>schema.validate({...bank,published:true},selection,original,hash),/without teacher approval/);
 assert.throws(()=>schema.validate(bank,{...selection,level:'C1'},original,hash),/Unsupported independent/);
 assert.throws(()=>schema.validate(bank,selection,original,'0'.repeat(64)),/checksum mismatch/);
 const invalid={...bank,variant:{...bank.variant,gist:[{...bank.variant.gist[0],title:original.gist[0].title},bank.variant.gist[1]]}};
 assert.throws(()=>schema.validate(invalid,selection,original,hash),/copied from practice/);
});
test('R37 new Listening bank is unadvertised in production teacher/student UIs',()=>{
 const student=read('self-check/listening/listening-student.js');
 const teacher=read('self-check/listening/listening-teacher.js');
 const main=read('index.html');
 assert.doesNotMatch(student,/test-banks\/listening|LSHIndependentListeningSchema/);
 assert.doesNotMatch(teacher,/test-banks\/listening|LSHIndependentListeningSchema/);
 assert.doesNotMatch(main,/test-banks\/listening|LSHIndependentListeningSchema/);
 const current=JSON.parse(execFileSync(process.execPath,[
  path.join(root,'tools/independent-assessment-worklist.cjs'),'--json'],{encoding:'utf8'}));
 assert.equal(current.overview.states.draft,13);
 assert.equal(current.overview.states.missing,125);
});
