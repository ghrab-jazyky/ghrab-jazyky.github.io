#!/usr/bin/env node
/* Claude report importer: persist PUBLIC STATUS ONLY, not the report or answer keys.
   Usage: node zkusebni/tools/claude-audit-import.cjs --report /private/path/reports.json [--apply]
*/
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const args=process.argv.slice(2),idx=args.indexOf('--report'),apply=args.includes('--apply');
const fail=s=>{throw Error('Claude audit import: '+s)};
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
try{
 if(idx<0||!args[idx+1]){console.log('Usage: --report absolute-or-relative.json [--apply]');process.exit(0)}
 const file=path.resolve(args[idx+1]),raw=JSON.parse(fs.readFileSync(file,'utf8'));
 if(raw.schemaVersion!==1||!Array.isArray(raw.reports)||!raw.reports.length||raw.reports.length>12)fail('Expected schemaVersion:1 with reports[1..12]');
 const queue=read('data/claude-audit-queue.json'),tracker=read('data/unification-tracker.json'),catalog=read('data/reference-pilots.json');
 const validStatuses=['REVIEWED_WITH_FINDINGS','REVIEWED_NO_FINDINGS'],validSeverities=['P0','P1','P2'],seen=new Set(),result=[];
 for(const r of raw.reports){
  if(!r||typeof r.topicId!=='string'||seen.has(r.topicId))fail('Missing or duplicate topicId');
  seen.add(r.topicId);
  const q=queue.topics.find(x=>x.id===r.topicId),c=catalog.entries.find(x=>x.id===r.topicId);
  if(!q||!c)fail('Unknown topic '+r.topicId);
  if(!validStatuses.includes(r.status)||r.requiresTeacherDecision!==true)fail('Report must be review-only and require teacher decision');
  if(!Array.isArray(r.findings)||r.findings.length>250)fail('Findings must be array up to 250');
  if(!r.findings.every(f=>f&&validSeverities.includes(f.severity)&&typeof f.location==='string'&&f.location.trim().length>0&&
   typeof f.evidence==='string'&&f.evidence.trim().length>0))fail('Findings missing severity/location/evidence');
  if(r.status==='REVIEWED_NO_FINDINGS'&&r.findings.length)fail('No-findings status conflicts with findings');
  if(r.status==='REVIEWED_WITH_FINDINGS'&&!r.findings.length)fail('Findings status requires findings');
  const filePath=path.resolve(ROOT,q.sourcePath);
  if(!filePath.startsWith(ROOT+path.sep)||!fs.existsSync(filePath))fail('Source missing or outside repo');
  const actual=sha(fs.readFileSync(filePath));
  if(actual!==r.sourceSha256)fail('Stale source hash, must repeat Claude review for '+r.topicId);
  const counts=Object.fromEntries(validSeverities.map(s=>[s,r.findings.filter(f=>f.severity===s).length]));
  result.push({id:r.topicId,status:r.status,sourceSha256:actual,counts});
 }
 if(!apply){console.log(JSON.stringify({mode:'dry-run',validReports:result.length,summary:result},null,2));process.exit(0)}
 for(const x of result){
  const q=queue.topics.find(y=>y.id===x.id);q.status=x.status;q.reviewedSourceSha256=x.sourceSha256;
  q.findingsSummary=x.counts;q.teacherApproval=false;q.reviewer='Claude';
  const t=tracker.topics.find(y=>y.id===x.id);
  if(t){t.externalReview={sourceSha256:x.sourceSha256,reviewer:'Claude',status:x.status,counts:x.counts,teacherApproval:false};
    t.publicRelease='BLOCKED_PENDING_REVIEW';}
 }
 fs.writeFileSync(path.join(ROOT,'data/claude-audit-queue.json'),JSON.stringify(queue,null,2)+'\n');
 fs.writeFileSync(path.join(ROOT,'data/unification-tracker.json'),JSON.stringify(tracker,null,2)+'\n');
 console.log(JSON.stringify({mode:'applied',publicMetadataOnly:true,reviewed:result.length,summary:result},null,2));
}catch(err){console.error(err.stack||String(err));process.exitCode=1}
