#!/usr/bin/env node
'use strict';
/* Builds a deterministic content-completion map from the actual catalog and
 * checked-in independent assessment banks. No unapproved bank is published.
 * Usage: node tools/independent-assessment-worklist.cjs [--json]
 */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const cards=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8')).entries;
const all=cards.flatMap(entry=>{
 if(entry.skill==='konverzace')return [];
 const skill=entry.skill==='cteni'?'reading':'listening';
 return entry.languages.flatMap(lang=>entry.levels.map(level=>({
  topic:entry.id,skill,language:lang,level,
  practiceRelative:entry.relative,
  bankRelative:skill==='reading'?
   'self-check/test-banks/reading/'+entry.id+'/'+lang+'-'+level+'.json':
   'self-check/test-banks/listening/'+entry.id+'/'+lang+'-'+level+'.json'
 })));
});
const report=all.map(row=>{
 const file=path.join(root,row.bankRelative);
 if(!fs.existsSync(file))return {...row,state:'missing'};
 try{
  const bank=JSON.parse(fs.readFileSync(file,'utf8'));
  const count=row.skill==='reading'?
   (Array.isArray(bank.questions)?bank.questions.length:0):
   (bank.kind==='LSH_INDEPENDENT_LISTENING_DRAFT_R37_V1'&&
    bank.variant&&['gist','detail','sequence','facts','open'].every(
     part=>Array.isArray(bank.variant[part])&&bank.variant[part].length>0)?
    ['gist','detail','sequence','facts','open'].reduce(
     (n,part)=>n+bank.variant[part].length,0):0);
  if(bank.topic!==row.topic||bank.language!==row.language||
   bank.level!==row.level||count===0)return {...row,state:'invalid'};
  if(bank.published===true){
   // No human approval evidence present in this workflow.
   return {...row,state:'unexpected-published'};
  }
  if(bank.status==='DRAFT_PENDING_TEACHER_CONTENT_APPROVAL'&&bank.published===false)
   return {...row,state:'draft',questions:count};
  return {...row,state:'invalid'};
 }catch(_){return {...row,state:'invalid'}}
});
const states={};
for(const r of report)states[r.state]=(states[r.state]||0)+1;
const data={
 kind:'LSH_ASSESSMENT_COMPLETENESS_REPORT_V1',
 source:'data/cards.json',
 overview:{total:report.length,reading:report.filter(x=>x.skill==='reading').length,
 listening:report.filter(x=>x.skill==='listening').length,
 conversation:'practice-only under R22; oral assessment rubric requires separate decision',
 states},
 rows:report
};
if(process.argv.includes('--json'))process.stdout.write(JSON.stringify(data,null,2)+'\n');
else{
 process.stdout.write('Language Skills Hub independent assessment content map\n');
 process.stdout.write(JSON.stringify(data.overview,null,2)+'\n');
 const missing=report.filter(x=>x.state!=='draft');
 process.stdout.write('Still missing or invalid: '+missing.length+'\n');
 for(const topic of [...new Set(missing.map(x=>x.topic))]){
  const arr=missing.filter(x=>x.topic===topic);
  process.stdout.write(' - '+topic+': '+arr.length+' missing/invalid variants\n');
 }
}
if(report.some(x=>x.state==='unexpected-published'||x.state==='invalid')){
 process.stderr.write('INVALID OR PREMATURELY PUBLISHED CONTENT BANK(S)\n');
 process.exitCode=1;
}
