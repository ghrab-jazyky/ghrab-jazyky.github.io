#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=require('../self-check/test-banks/listening/test-bank-core.js');
const sourceCore=require('../self-check/listening/listening-core.js');
const grade=require('../self-check/results/grade-core.js');
const html=read('poslech/harrison-ford/index.html');
const data=sourceCore.extractJson(html,'DATA');
const hash=createHash('sha256').update(fs.readFileSync(path.join(root,'poslech/harrison-ford/index.html'))).digest('hex');
const manifest=JSON.parse(read('version.json'));
test('R36 original Harrison Ford source is unmodified and ungraded',()=>{
 assert.equal(hash,manifest.contentHashes['ll-harrison-ford']);
 assert.equal(manifest.version,'R31');
 assert.equal(manifest.officialGradesEnabled,false);
});
for(const level of sourceCore.LEVELS){
 test('R36 EN/'+level+' independent Listening B2-compatible 6 objective + 2 written draft',()=>{
  const bank=JSON.parse(read('self-check/test-banks/listening/ll-harrison-ford/en-'+level+'.json'));
  const source=sourceCore.variant(data,level);
  assert.equal(core.validate(bank,source,hash),true);
  assert.equal(bank.published,false);
  assert.equal(bank.level,level);
  assert.equal(bank.objective.length,6);
  assert.equal(bank.written.length,2);
  assert.equal(bank.scoreRule.startsWith('6 objectively scored'),true);
  const correct=Object.fromEntries(bank.objective.map(q=>[q.id,q.answer]));
  const a=core.score(bank,correct);
  assert.equal(a.objectiveEarned,6);
  assert.equal(a.pending,2);
  assert.equal(a.totalEarned,null);
  const final=core.score(bank,correct,[1,0]);
  assert.equal(final.totalEarned,7);
  assert.equal(final.totalMax,8);
  assert.equal(grade.proposal(final.totalEarned,final.totalMax).grade,2);
  assert.equal(final.officialSchoolResult,false);
  assert.equal(core.score(bank,{},[0,0]).totalEarned,0);
  assert.throws(()=>core.validate({...bank,published:true},source,hash),/remain unapproved/);
  const differentLevel=sourceCore.LEVELS[(sourceCore.LEVELS.indexOf(level)+1)%6];
  const other=sourceCore.variant(data,differentLevel);
  // The original level-specific task goal is checked by the source integrity gate
  // in the preview. The same HTML hash is shared across all CEFR versions.
  assert.ok(other.goal!==source.goal);
  assert.throws(()=>core.validate(bank,source,'0'.repeat(64)),/integrity mismatch/);
 });
}
test('R36 preview remains an unpublished teacher-only artifact',()=>{
 const preview=read('self-check/test-banks/listening/preview.js');
 assert.match(preview,/const level=params.get\('level'\)\|\|'B2'/);
 assert.match(preview,/ll-harrison-ford\/en-'\+level\+'\.json/);
 assert.match(preview,/sourceCore\.variant\(sourceCore\.extractJson\(html,'DATA'\),level\)/);
 assert.doesNotMatch(read('assets/hub.js'),/r36-hf|test-banks\/listening/);
 assert.doesNotMatch(read('index.html'),/r36-hf|test-banks\/listening/);
});
