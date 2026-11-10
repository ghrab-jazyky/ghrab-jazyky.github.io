#!/usr/bin/env node
'use strict';
/* Deterministic, fail-closed inventory of independent bank files.
 * --check: compare checked-in coverage.json with the actual repository.
 * --write: intentionally rebuild inventory in a local authoring checkout.
 * Never marks content approved merely because a file exists.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const file=p=>path.join(root,p);
const read=p=>fs.readFileSync(file(p),'utf8');
const cards=JSON.parse(read('data/cards.json'));
const version=JSON.parse(read('version.json'));
const reading=require('../self-check/reading/reading-core.js');
const legacy=require('../self-check/test-banks/reading/test-bank-core.js');
const generic=require('../self-check/test-banks/reading/generic-bank-core.js');
const levels=['A1','A2','B1','B2','C1','C2'];
const language=['en','es','de','fr'];
const approvedTopicIds=new Set(cards.entries.map(x=>x.id));
if(cards.entries.length!==29||version.topicCount!==29||version.variantCount!==642)
 throw Error('Approved practice catalog changed: manual baseline review is required.');
const slots=[],counts={total:0,reading:0,listening:0,drafted:0,missing:0,teacherApproved:0};
const sourceCache=new Map();
function source(entry){
 if(sourceCache.has(entry.id))return sourceCache.get(entry.id);
 const html=read(entry.relative);
 const sha=crypto.createHash('sha256').update(fs.readFileSync(file(entry.relative))).digest('hex');
 if(sha!==version.contentHashes[entry.id])
  throw Error('Approved practice source checksum changed: '+entry.id);
 const data=reading.parseReadingData(html);
 sourceCache.set(entry.id,{sha,data});
 return {sha,data};
}
for(const entry of cards.entries.filter(x=>['cteni','poslech'].includes(x.skill))){
 const skill=entry.skill==='cteni'?'reading':'listening';
 if(!approvedTopicIds.has(entry.id)||!entry.languages.every(l=>language.includes(l))||
  !entry.levels.every(l=>levels.includes(l)))throw Error('Invalid practice catalog entry');
 for(const lang of entry.languages)for(const level of entry.levels){
  const pathInRepo='self-check/test-banks/'+skill+'/'+entry.id+'/'+lang+'-'+level+'.json';
  const exists=fs.existsSync(file(pathInRepo));
  if(exists){
   const bank=JSON.parse(read(pathInRepo));
   if(bank.published!==false||bank.status!=='DRAFT_PENDING_TEACHER_CONTENT_APPROVAL')
    throw Error('Test bank lacks independent content approval gate: '+pathInRepo);
   if(bank.topic!==entry.id||bank.language!==lang||bank.level!==level||
    bank.sourcePracticeContentHash!==version.contentHashes[entry.id])
    throw Error('Bank does not match its catalog slot: '+pathInRepo);
   if(skill==='reading'){
    const {sha,data}=source(entry);
    const practice=reading.variantFromData(data,lang,level);
    if(bank.kind===legacy.KIND)legacy.validate(bank,practice,sha);
    else if(bank.kind===generic.KIND)
     generic.validate(bank,practice,entry,sha,{language:lang,level});
    else throw Error('Unregistered independent Reading content kind: '+pathInRepo);
   }else{
    throw Error('Listening banks require a separately approved independent validation schema: '+pathInRepo);
   }
  }
  slots.push({topic:entry.id,skill,language:lang,level,
   sourceHash:version.contentHashes[entry.id],
   status:exists?'DRAFT_UNAPPROVED':'MISSING',
   testBank:exists?pathInRepo:null});
  counts.total++;counts[skill]++;
  if(exists)counts.drafted++;else counts.missing++;
 }
}
if(counts.total!==138||counts.reading!==120||counts.listening!==18)
 throw Error('Unexpected Reading/Listening coverage baseline');
const result={
 kind:'LSH_INDEPENDENT_TEST_CONTENT_INVENTORY_R35_V1',
 productionBaseline:'R31',
 originPracticeManifestHash:'sourceSha:'+version.sourceSha,
 generatedFrom:'language-skills-hub/data/cards.json and version.json',
 publicationPolicy:'FAIL_CLOSED_UNLESS_TEACHER_APPROVED',
 statusLegend:{
  DRAFT_UNAPPROVED:'Original draft exists but is not approved',
  MISSING:'No independent test bank exists'
 },
 counts,
 conversationPolicy:'No auto-graded oral test; requires separately approved teacher rubric and pedagogy',
 slots
};
const rendered=JSON.stringify(result,null,2)+'\n';
const output='self-check/test-banks/coverage.json';
const mode=process.argv[2]||'--check';
if(mode==='--write'){
 fs.writeFileSync(file(output),rendered,'utf8');
 process.stdout.write('Updated '+output+': '+counts.drafted+'/'+counts.total+' draft slots\n');
}else if(mode==='--check'){
 if(read(output)!==rendered)throw Error('coverage.json is stale: regenerate with node scripts/rebuild-test-bank-coverage.cjs --write');
 process.stdout.write('Coverage verified: '+counts.drafted+'/'+counts.total+' drafts, '+counts.missing+' missing, 0 approved\n');
}else throw Error('Supported options: --check or --write');
