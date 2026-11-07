#!/usr/bin/env node
/* Runs after CI has imported three disposable cards into runner workspace. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),cwd=path.resolve(root,'..'),dir=fs.mkdtempSync(path.join(process.env.RUNNER_TEMP||os.tmpdir(),'lsh-audit-coverage-'));
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const catalog=read('data/reference-pilots.json'),queue=read('data/claude-audit-queue.json');
const ids=['cl-smoke-conversation','rl-smoke-reading','ll-smoke-listening'];
const secret='PRIVATE_EVIDENCE_MUST_STAY_OUT_OF_PUBLIC_JSON';
const reports=ids.map((id,i)=>{
 const e=catalog.entries.find(v=>v.id===id),q=queue.topics.find(v=>v.id===id);
 assert.ok(e&&q,id+' fixture not imported');
 return {topicId:id,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,q.sourcePath))).digest('hex'),
  status:i?'REVIEWED_NO_FINDINGS':'REVIEWED_WITH_FINDINGS',requiresTeacherDecision:true,
  reviewedVariants:e.languages.flatMap(language=>e.levels.map(level=>({language,level,evidence:secret+' synthetic source observation '+id+' '+language+'/'+level}))),
  unverifiedChecks:['Native iPhone, school Wi-Fi, external video and offline storage untested in CI.'],
  findings:i?[]:[{severity:'P1',language:'es',level:'A1',location:'synthetic station 1',
   observed:'Artificial original sentence used only for regression',
   proposed:'Artificial suggested alternative used only for regression',
   evidence:'Synthetic negative fixture, not a pedagogical conclusion.'}]};
});
function run(data,apply=false){
 const file=path.join(dir,'reports.json');
 fs.writeFileSync(file,JSON.stringify({schemaVersion:1,reports:data}));
 return spawnSync(process.execPath,['zkusebni/tools/claude-audit-import.cjs','--report',file,...(apply?['--apply']:[])],{cwd,encoding:'utf8'});
}
const clone=()=>JSON.parse(JSON.stringify(reports));
let result=run(reports);assert.equal(result.status,0,'Valid coverage rejected: '+result.stderr);
for(const [name,modify] of [
 ['stale SHA',v=>v[0].sourceSha256='0'.repeat(64)],
 ['missing variant',v=>v[0].reviewedVariants.pop()],
 ['duplicate variant',v=>v[0].reviewedVariants[23]=v[0].reviewedVariants[0]],
 ['unexpected language',v=>v[0].reviewedVariants[0].language='jp'],
 ['shallow evidence',v=>v[0].reviewedVariants[0].evidence='ok'],
 ['no unverified list',v=>delete v[0].unverifiedChecks],
 ['invalid finding language',v=>v[0].findings[0].language='jp'],
 ['missing observed passage',v=>v[0].findings[0].observed=''],
 ['false clean status',v=>v[0].status='REVIEWED_NO_FINDINGS']
]){
 const copy=clone();modify(copy);result=run(copy);
 assert.notEqual(result.status,0,name+' incorrectly accepted');
}
result=run(reports,true);assert.equal(result.status,0,'Valid report import failed: '+result.stderr);
const q=read('data/claude-audit-queue.json'),tracker=read('data/unification-tracker.json');
for(const id of ids){
 const entry=catalog.entries.find(v=>v.id===id),audit=q.topics.find(v=>v.id===id),t=tracker.topics.find(v=>v.id===id);
 assert.equal(audit.reviewedVariantsCount,entry.languages.length*entry.levels.length);
 assert.equal(audit.unverifiedChecksCount,1);
 assert.equal(audit.teacherApproval,false);
 assert.equal(t.publicRelease,'BLOCKED_PENDING_REVIEW');
 assert.equal(t.externalReview.reviewedVariantsCount,audit.reviewedVariantsCount);
}
for(const file of ['data/claude-audit-queue.json','data/unification-tracker.json'])
 assert.ok(!fs.readFileSync(path.join(root,file),'utf8').includes(secret),file+' leaked private reviewer evidence');
console.log('PASS Claude review: 24/24 + 24/24 + 6/6 variants, nine negative cases, private evidence and teacher approval gate');
