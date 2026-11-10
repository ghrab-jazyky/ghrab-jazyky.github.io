#!/usr/bin/env node
'use strict';
/* Generate a local-only content-authoring work package for each Reading or
 * Listening variant. This creates NO test questions or automatic approvals.
 * Teacher/auditor may use each complete source packet to author independent
 * tasks rather than reword practice questions. Never commit generated packets
 * containing future private materials or student data.
 *
 * node tools/build-assessment-authoring-packets.cjs --out /tmp/lsh-authoring
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8')).entries;
const manifest=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const reading=require('../self-check/reading/reading-core.js');
const listening=require('../self-check/listening/listening-core.js');
const args=process.argv;
const pos=args.indexOf('--out');
if(pos===-1||typeof args[pos+1]!=='string'||!args[pos+1].trim()){
 process.stderr.write('Usage: node tools/build-assessment-authoring-packets.cjs --out <directory>\n');
 process.exit(2);
}
const out=path.resolve(args[pos+1]);
if(out.startsWith(root+path.sep))throw new Error('Do not write unpublished authoring packs into the public repository');
fs.mkdirSync(out,{recursive:true});
let count=0,readingCount=0,listeningCount=0;
for(const entry of catalog.filter(e=>['cteni','poslech'].includes(e.skill))){
 const html=fs.readFileSync(path.join(root,entry.relative),'utf8');
 const hash=crypto.createHash('sha256').update(html).digest('hex');
 if(manifest.contentHashes&&manifest.contentHashes[entry.id]&&hash!==manifest.contentHashes[entry.id])
  throw new Error('Changed original source '+entry.id);
 const skill=entry.skill==='cteni'?'reading':'listening';
 const originalData=skill==='reading'?reading.parseReadingData(html):
  listening.extractJson(html,'DATA');
 for(const lang of entry.languages)for(const level of entry.levels){
  const variant=skill==='reading'?reading.variantFromData(originalData,lang,level):
   listening.variant(originalData,level);
  const existing=path.join(root,'self-check','test-banks',skill,entry.id,lang+'-'+level+'.json');
  const packet={
   kind:'LSH_LOCAL_AUTHORING_PACKET_V1',publicationStatus:'NOT_APPROVED',
   source:{topic:entry.id,title:entry.title,skill,lang,level,relative:entry.relative,
    sourceSha256:hash,description:entry.summary},
   pedagogicalTask:'Author a genuinely different assessment, not a random subset or paraphrase of practice questions. Keep the source passage/audio and verify every correct answer with evidence. Teacher approves separately.',
   sourceContent:skill==='reading'?{title:variant.title,paragraphs:variant.paragraphs,
    practiceTasks:variant.questions}:{goal:variant.goal,practiceTasks:variant},
   independentBankPresent:fs.existsSync(existing),
   outputRequirement:{
    status:'DRAFT_PENDING_TEACHER_CONTENT_APPROVAL',published:false,
    evidenceRequired:true,independentReviewRequired:true,
    noSecretAnswerKeyOnPublicGitHub:true,noStudentData:true
   }
  };
  fs.writeFileSync(path.join(out,entry.id+'--'+lang+'-'+level+'.json'),
   JSON.stringify(packet,null,2)+'\n');
  count++;
  if(skill==='reading')readingCount++;else listeningCount++;
 }
}
fs.writeFileSync(path.join(out,'SUMMARY.json'),
 JSON.stringify({kind:'LSH_AUTHORING_PACK_SUMMARY_V1',total:count,reading:readingCount,
  listening:listeningCount,createdOffline:true,noAutomaticApprovals:true},null,2)+'\n');
process.stdout.write('Prepared '+count+' local authoring packets ('+
 readingCount+' Reading, '+listeningCount+' Listening) in '+out+'\n');
