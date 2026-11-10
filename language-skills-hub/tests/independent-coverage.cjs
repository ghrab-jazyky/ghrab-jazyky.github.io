#!/usr/bin/env node
'use strict';
/* Language Skills Hub trustworthy coverage inventory.
 * No placeholders: absent authored bank is MISSING.
 * Content exists != automated validation != teacher approval.
 */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const manifest=read('version.json'),cards=read('data/cards.json');
const SKILLS={cteni:'reading',poslech:'listening'},rows=[];
const entries=cards.entries.filter(c=>c.skill==='cteni'||c.skill==='poslech');
for(const card of entries){
 for(const lang of card.languages){
  for(const level of card.levels){
   const skill=SKILLS[card.skill];
   const relative='self-check/test-banks/'+skill+'/'+card.id+'/'+lang+'-'+level+'.json';
   let status='MISSING',questionCount=0,why='';
   if(fs.existsSync(path.join(root,relative))){
    try{
     const bank=read(relative);
     questionCount=Array.isArray(bank.questions)?bank.questions.length:0;
     if(bank.topic!==card.id||bank.language!==lang||bank.level!==level)
      throw Error('topic/language/level mismatch');
     if(bank.published===true)
      throw Error('independent teacher approval must be explicitly audited');
     if(bank.published!==false||bank.status!=='DRAFT_PENDING_TEACHER_CONTENT_APPROVAL')
      throw Error('unknown publication status');
     if(!questionCount)throw Error('empty question bank');
     if(skill==='reading'&&bank.sourcePracticeContentHash!==manifest.contentHashes[card.id])
      throw Error('source SHA-256 mismatch');
     status='DRAFT_CONTENT_PENDING_HUMAN_APPROVAL';
    }catch(err){status='INVALID_BANK';why=String(err.message||err);}
   }
   rows.push({skill,topic:card.id,lang,level,status,questionCount,relative,why});
  }
 }
}
const count=(skill,status)=>rows.filter(r=>r.skill===skill&&(!status||r.status===status)).length;
const summary={
 baselineVersion:manifest.version,
 topicCount:manifest.topicCount,
 expectedReadingVariants:count('reading'),
 expectedListeningVariants:count('listening'),
 readingDrafts:count('reading','DRAFT_CONTENT_PENDING_HUMAN_APPROVAL'),
 listeningDrafts:count('listening','DRAFT_CONTENT_PENDING_HUMAN_APPROVAL'),
 readingMissing:count('reading','MISSING'),
 listeningMissing:count('listening','MISSING'),
 invalidBanks:rows.filter(r=>r.status==='INVALID_BANK').length,
 approvedIndependentTestVariants:0,
 referenceHumanApproval:'PENDING',
 status:'NOT_COMPLETE'
};
if(count('reading')!==120||count('listening')!==18)
 throw Error('Unexpected catalog inventory: '+JSON.stringify(summary));
if(summary.invalidBanks)throw Error('Invalid bank files: '+JSON.stringify(rows.filter(r=>r.why)));
if(process.argv.includes('--write')){
 const output=path.join(root,'coverage-out');
 fs.mkdirSync(output,{recursive:true});
 fs.writeFileSync(path.join(output,'independent-tests.json'),JSON.stringify({summary,rows},null,2)+'\n');
 const lines=[
  '# Language Skills Hub - Stav nezavislych testu',
  '',
  'Source: current data/cards.json and physically existing draft banks.',
  '',
  '| Skill | Total | Drafts | Missing | Teacher approved |',
  '|---|---:|---:|---:|---:|',
  '| Reading | '+count('reading')+' | '+summary.readingDrafts+' | '+summary.readingMissing+' | 0 |',
  '| Listening | '+count('listening')+' | '+summary.listeningDrafts+' | '+summary.listeningMissing+' | 0 |',
  '',
  'Not complete: Draft content cannot be treated as reviewed or published.',
  '',
  '## Missing variants',
  ...rows.filter(r=>r.status==='MISSING').map(r=>'- '+r.skill+' / '+r.topic+' / '+r.lang.toUpperCase()+' / '+r.level),
  ''
 ];
 fs.writeFileSync(path.join(output,'independent-tests.md'),lines.join('\n'));
}
console.log(JSON.stringify(summary,null,2));
module.exports={summary,rows};
