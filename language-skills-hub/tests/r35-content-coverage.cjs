#!/usr/bin/env node
'use strict';
/*
 * R35 content completion gate: report truthful independently authored coverage.
 * Nothing is considered complete merely because original practice exists.
 * Draft banks are not pedagogically approved or suitable for classified exams.
 */
const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(base,p),'utf8'));
const catalog=read('data/cards.json').entries;
const LANGUAGES=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
const reading=catalog.filter(x=>x.skill==='cteni');
const listening=catalog.filter(x=>x.skill==='poslech');
const expectedReading=[];
for(const c of reading)for(const lang of LANGUAGES)for(const level of LEVELS)
 expectedReading.push({topic:c.id,language:lang,level});
const expectedListening=[];
for(const c of listening)for(const level of LEVELS)
 expectedListening.push({topic:c.id,language:'en',level});
function inspect(item,skill){
 const file=skill==='cteni'?
  'self-check/test-banks/reading/'+item.topic+'/'+item.language+'-'+item.level+'.json':
  'self-check/test-banks/listening/'+item.topic+'/'+item.language+'-'+item.level+'.json';
 const full=path.join(base,file);
 if(!fs.existsSync(full))return {...item,skill,file,status:'MISSING',questions:0};
 try{
  const bank=read(file);
  const questions=Array.isArray(bank.questions)?bank.questions.length:0;
  if(bank.topic!==item.topic||bank.language!==item.language||bank.level!==item.level)
   return {...item,skill,file,status:'INVALID_METADATA',questions};
  if(bank.published||bank.status!=='DRAFT_PENDING_TEACHER_CONTENT_APPROVAL')
   return {...item,skill,file,status:'UNEXPECTED_PUBLICATION',questions};
  return {...item,skill,file,status:'DRAFT_UNAPPROVED',questions};
 }catch(e){return {...item,skill,file,status:'INVALID_JSON',questions:0,error:String(e.message)}}
}
const rows=[
 ...expectedReading.map(x=>inspect(x,'cteni')),
 ...expectedListening.map(x=>inspect(x,'poslech'))
];
const summary={
 version:'R35_CONTENT_INVENTORY_V1',
 baseline:'R31',
 expected:{
  readingTopics:reading.length,readingLanguages:LANGUAGES.length,
  readingLevels:LEVELS.length,readingVariants:expectedReading.length,
  listeningTopics:listening.length,listeningLanguages:1,listeningLevels:LEVELS.length,
  listeningVariants:expectedListening.length,total:rows.length
 },
 actual:{
  draft:rows.filter(x=>x.status==='DRAFT_UNAPPROVED').length,
  missing:rows.filter(x=>x.status==='MISSING').length,
  invalid:rows.filter(x=>x.status.startsWith('INVALID')||x.status==='UNEXPECTED_PUBLICATION').length,
  approvedForStudents:0,
  draftReading:rows.filter(x=>x.skill==='cteni'&&x.status==='DRAFT_UNAPPROVED').length,
  draftListening:rows.filter(x=>x.skill==='poslech'&&x.status==='DRAFT_UNAPPROVED').length,
  authoredQuestions:rows.filter(x=>x.status==='DRAFT_UNAPPROVED').reduce((n,x)=>n+x.questions,0)
 },
 rows
};
if(require.main===module){
 console.log(JSON.stringify(summary,null,2));
 if(summary.actual.invalid)process.exitCode=1;
}
module.exports=summary;
