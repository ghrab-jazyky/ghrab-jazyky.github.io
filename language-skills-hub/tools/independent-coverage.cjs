#!/usr/bin/env node
/* R34 single source of truth for independent test readiness.
 * Never treats an existing practice self-check as an independent test bank.
 * CLI: node language-skills-hub/tools/independent-coverage.cjs [--json]
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('data/cards.json'));
const version=JSON.parse(read('version.json'));
const reading=require('../self-check/reading/reading-core.js');
const listening=require('../self-check/listening/listening-core.js');
const bankDir=path.join(root,'self-check/test-banks');
const SHA=s=>crypto.createHash('sha256').update(s).digest('hex');
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const levels=['A1','A2','B1','B2','C1','C2'];
const required=Object.freeze({cteni:'reading',poslech:'listening'});
const statuses=Object.freeze(['MISSING','DRAFT_UNREVIEWED','REVIEWED_WAITING_APPROVAL','APPROVED_QA_ONLY','BLOCKED']);
const records=[],problems=[];
function check(ok,error){if(!ok)throw new Error(error)}
function key(entry,lang,level){return [entry.id,lang,level].join('/')}
function readBank(filepath){
 if(!fs.existsSync(filepath))return null;
 const data=JSON.parse(fs.readFileSync(filepath,'utf8'));
 check(data&&typeof data==='object'&&!Array.isArray(data),'Invalid JSON bank object');
 return data;
}
function inspectBank(entry,lang,level,original,practice,hash){
 const relative=required[entry.skill]+'/'+entry.id+'/'+lang+'-'+level+'.json';
 const filepath=path.join(bankDir,relative);
 const baseline={id:entry.id,skill:entry.skill,language:lang,level,
  source:entry.relative,sourceHash:hash,bankPath:relative,available:false,
  status:'MISSING',independent:false,approved:false,published:false,
  issues:[]};
 if(!fs.existsSync(filepath))return baseline;
 const b=readBank(filepath);
 baseline.available=true;
 const fail=msg=>baseline.issues.push(msg);
 if(b.topic!==entry.id||b.language!==lang||b.level!==level)fail('WRONG_TOPIC_OR_VARIANT');
 if(b.sourcePracticeContentHash!==hash)fail('SOURCE_HASH_MISMATCH');
 if(b.published===true)fail('PUBLISHED_WITHOUT_RELEASE_GATE');
 if(b.kind!=='LSH_INDEPENDENT_READING_TEST_DRAFT_R32_V1'&&
    b.kind!=='LSH_INDEPENDENT_LISTENING_TEST_DRAFT_R34_V1')fail('INVALID_BANK_KIND');
 if(!Array.isArray(b.questions)||b.questions.length<5||b.questions.length>45)fail('INVALID_QUESTION_COUNT');
 const stems=new Set((practice.questions||[]).map(q=>norm(q.q||'')));
 const ids=new Set((practice.questions||[]).map(q=>q.id));
 const qIds=new Set();
 if(Array.isArray(b.questions))for(const q of b.questions){
  if(typeof q.id!=='string'||ids.has(q.id)||qIds.has(q.id))fail('REUSED_OR_DUPLICATED_ID');
  qIds.add(q.id);
  if(typeof q.q!=='string'||q.q.trim().length<12||stems.has(norm(q.q)))fail('IDENTICAL_OR_MISSING_QUESTION_STEM');
  if(Array.isArray(q.choices)){
   if(q.choices.length<2||q.choices.some(c=>typeof c!=='string'||!c.trim()))fail('INVALID_OPTIONS');
   if(new Set(q.choices.map(norm)).size!==q.choices.length)fail('DUPLICATED_OPTIONS');
   if(!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.choices.length)fail('INVALID_ANSWER_INDEX');
  }
  if(typeof q.explanation!=='string'||q.explanation.trim().length<24)fail('MISSING_RATIONALE');
 }
 baseline.independent=baseline.issues.length===0;
 const signoff=b.review&&typeof b.review==='object'?b.review:null;
 const validSignoff=signoff&&signoff.contentApproved===true&&
   typeof signoff.reviewer==='string'&&signoff.reviewer.trim().length>=3&&
   /^\d{4}-\d{2}-\d{2}$/.test(signoff.approvedOn||'')&&
   signoff.sourceHash===hash&&signoff.approvedRevision===b.auditRevision;
 baseline.approved=!!(validSignoff&&baseline.independent&&b.published===false);
 baseline.published=b.published===true;
 baseline.status=baseline.issues.length?'BLOCKED':baseline.approved?
  'APPROVED_QA_ONLY':b.status==='DRAFT_PENDING_TEACHER_CONTENT_APPROVAL'?
   'DRAFT_UNREVIEWED':'REVIEWED_WAITING_APPROVAL';
 return baseline;
}
function norm(s){return s.normalize('NFKC').toLocaleLowerCase('en').replace(/\s+/g,' ').trim()}
for(const entry of catalog.entries){
 if(!own(required,entry.skill))continue;
 const langs=entry.languages,cefr=entry.levels;
 check(Array.isArray(langs)&&Array.isArray(cefr),'Missing language/level matrix');
 const html=read(entry.relative);
 const hash=SHA(html);
 if(version.contentHashes[entry.id]!==hash){
  problems.push('SOURCE_HASH_MISMATCH '+entry.id);
 }
 let data;
 try{data=entry.skill==='cteni'?reading.parseReadingData(html):
   listening.extractJson(html,'DATA');}
 catch(error){problems.push('UNREADABLE_ORIGINAL '+entry.id+' '+error.message);continue}
 for(const lang of langs)for(const level of cefr){
  let practice;
  try{
   practice=entry.skill==='cteni'?reading.variantFromData(data,lang,level):
    listening.variant(data,level);
  }catch(error){problems.push('INVALID_PRACTICE '+key(entry,lang,level)+' '+error.message);continue}
  // Listening assessment content has domain-specific parts, so the current
  // practice adapter reports zero questions: it must be individually designed.
  const record=inspectBank(entry,lang,level,html,practice,hash);
  records.push(record);
  for(const err of record.issues)problems.push(err+' '+key(entry,lang,level));
 }
}
const group=skill=>{
 const subset=records.filter(r=>r.skill===skill);
 const counts=Object.fromEntries(statuses.map(s=>[s,subset.filter(r=>r.status===s).length]));
 return {total:subset.length,authored:subset.filter(r=>r.available).length,
  approved:subset.filter(r=>r.approved).length,counts};
};
const summary={
 schema:'LSH_INDEPENDENT_TEST_COVERAGE_R34_V1',
 productionVersion:version.version,generatedAt:null,
 reading:group('cteni'),listening:group('poslech'),
 total:records.length,authored:records.filter(r=>r.available).length,
 approved:records.filter(r=>r.approved).length,missing:records.filter(r=>!r.available).length,
 problems,records
};
const args=process.argv.slice(2);
if(args.includes('--json'))process.stdout.write(JSON.stringify(summary,null,2)+'\n');
else{
 console.log('Independent test coverage — production '+version.version);
 console.log('Reading:',JSON.stringify(summary.reading),'Listening:',JSON.stringify(summary.listening));
 console.log('TOTAL '+summary.total+' AUTHOR-REVIEW DRAFTS '+summary.authored+
  ' APPROVED '+summary.approved+' MISSING '+summary.missing);
 if(problems.length)console.log('BLOCKERS '+problems.join('; '));
}
if(args.includes('--strict')&&(problems.length||summary.approved!==summary.total))process.exitCode=1;
if(args.includes('--integrity')&&problems.length)process.exitCode=1;
module.exports={records,summary};
