#!/usr/bin/env node
/* Listening Lab R7: structural and UX comparison with Matthew v3, no media downloads.
 * This is not transcription verification or a teacher-approved test.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||path.join(root,'_qa-listening'));
const files=[
 {id:'ll-matthew-oscars',file:'reference/poslech/matthew-mcconaughey/index.html',blob:'78e17abe60d29fe41c3775ecf78d966ae1549225',reference:true},
 {id:'ll-harrison-ford',file:'nahledy/poslech/harrison-ford/index.html',blob:'f816dbbbc2d9d2e7fc5b7a4c40d9e7dcfb331dbc',reference:false},
 {id:'ll-peaky-no-fighting',file:'nahledy/poslech/peaky-blinders/index.html',blob:'cfda1197882b8107ddce2f80665abd681526efc5',reference:false}
];
const levels=['A1','A2','B1','B2','C1','C2'],findings=[],variants=[];
const sha1Blob=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
const flag=(id,level,code,detail)=>findings.push({topicId:id,level,code,detail,status:'UNVERIFIED_REVIEW',teacherApproval:false});
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/reference-pilots.json'),'utf8'));
assert.equal(catalog.approvedForTeaching,false);
const audited=catalog.entries.filter(x=>x.skill==='poslech');
assert.equal(audited.length,3);
for(const f of files){
 assert.ok(audited.some(x=>x.id===f.id&&x.test==='not-ready'));
 const bytes=fs.readFileSync(path.join(root,f.file)),html=bytes.toString('utf8');
 assert.equal(sha1Blob(bytes),f.blob,'Historical source changed: '+f.id);
 const a=html.indexOf('const DATA='),b=html.indexOf(';\n',a);
 assert.ok(a>=0&&b>a,'Missing data block for '+f.id);
 const data=JSON.parse(html.slice(a+'const DATA='.length,b));
 assert.deepEqual(Object.keys(data).sort(),levels.slice().sort());
 const hasThreePhaseUI=['First Listening','Second Listening','Third Listening'].every(label=>html.includes(label));
 const hasWritten=html.includes('Written Evidence'),hasReconstruction=html.includes('Reconstruct the Speech');
 if(!hasThreePhaseUI)flag(f.id,'all','THREE_PHASE_UI_NOT_ALIGNED','Student HTML lacks explicit First/Second/Third Listening headings of reference Matthew v3.');
 if(!hasWritten||!hasReconstruction)flag(f.id,'all','THIRD_LISTENING_LABELS_NOT_ALIGNED','Reference uses Written Evidence and Reconstruct the Speech; verify these are separate activities in actual UI.');
 if(f.id==='ll-peaky-no-fighting')flag(f.id,'all','AGE_AND_MEDIA_REVIEW','Check age suitability and content warning for vulgarity, violence, drug references, and classroom licensing before use.');
 for(const level of levels){
  const v=data[level],problems=[];
  for(const key of ['goal','duration','scaffold','prediction','tip'])if(typeof v[key]!=='string'||!v[key].trim())problems.push('empty '+key);
  for(const key of ['before','gist','detail','facts','open','sequence','vocab','talk','challenge'])if(!Array.isArray(v[key]))problems.push('missing array '+key);
  if(problems.length)flag(f.id,level,'DATA_SHAPE',problems.join(', '));
  for(const key of ['gist','detail'])for(const [i,q] of v[key].entries()){
   const optionsValid=Array.isArray(q.options)&&q.options.length>=2&&q.options.every(x=>typeof x==='string'&&!!x.trim());
   const answerValid=optionsValid&&(q.type==='multi'?
      Array.isArray(q.correct)&&q.correct.length>=2&&new Set(q.correct).size===q.correct.length&&q.correct.every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length):
      Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);
   if(typeof q.title!=='string'||!q.title.trim()||!answerValid)
    flag(f.id,level,'OBJECTIVE_QUESTION_INVALID',key+' #'+(i+1)+' missing prompt/choices or invalid single/multiple answer index');
   if(typeof q.why!=='string'||q.why.trim().length<6)
    flag(f.id,level,'OBJECTIVE_EXPLANATION_TOO_SHORT',key+' #'+(i+1)+' has insufficient justification');
  }
  for(const [i,q] of v.facts.entries())if(!q.title||!q.answer||!Array.isArray(q.tokens)||!q.tokens.length)
   flag(f.id,level,'FACT_ANSWER_CONTRACT','fact #'+(i+1)+' lacks a verifiable answer template');
  for(const [i,q] of v.open.entries())if(!q.title||!q.criteria||!q.kind)
   flag(f.id,level,'WRITTEN_EVIDENCE_CONTRACT','written task #'+(i+1)+' has incomplete teacher-facing criteria');
  if(v.sequence.length<3)flag(f.id,level,'RECONSTRUCTION_TOO_SHORT','Fewer than three reconstruction items');
  if(v.beforeHelp===undefined||v.talkHelp===undefined)
   flag(f.id,level,'REFERENCE_HELP_SUPPORT_MISSING','Unlike Matthew v3, this level lacks contextual before/talk help arrays; confirm whether optional UI is needed.');
  variants.push({topicId:f.id,level,gist:v.gist.length,detail:v.detail.length,
   writtenFacts:v.facts.length,writtenOpen:v.open.length,reconstructionSteps:v.sequence.length,
   optionalVocab:v.vocab.length,before:v.before.length,after:v.talk.length,
   explicitThreeListeningSections:hasThreePhaseUI,explicitWrittenEvidence:hasWritten,
   explicitReconstruction:hasReconstruction,goal:v.goal,duration:v.duration});
 }
}
assert.equal(variants.length,18);
const groups={};for(const f of findings)groups[f.code]=(groups[f.code]||0)+1;
const report={schemaVersion:1,kind:'LISTENING_MATTHEW_V3_PARITY_SCREEN',teacherApproval:false,releaseApproved:false,
 sourceCards:3,sourceVariants:18,reference:'Matthew McConaughey Listening v3',
 futureBacklog:[{id:'ll-ted-conlangs',catalogIntegrated:false},{id:'ll-how-to-choose-news',catalogIntegrated:false,originalLevels:['B2','C1']}],
 methodology:'Exactly source-bound structural, data-contract and section-heading comparison; no actual YouTube media played.',
 limitations:['Actual speech content, timing, answer accuracy and video playback are NOT_TESTED','No physical iOS/Android/School Wi-Fi QA','The two newly delivered listening sources are outside current catalog and are not audited by this source-only script','Pedagogical and age suitability require teacher approval'],
 findings,findingsByCode:groups,variants};
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'LISTENING_MATTHEW_PARITY.json'),JSON.stringify(report,null,2)+'\n');
const md=['# Listening Lab – shoda tří současných poslechů s Matthew v3','',
 'Technicky ověřeny 3 zdrojové HTML (Git blob), EN A1–C2 = 18 datových variant.',
 'Nevytváří se žádný nový test a neověřuje se skutečné přehrání videa.','',
 '## Zjištění podle typu',
 ...Object.entries(groups).map(([k,n])=>'- '+k+': '+n),'',
 '## Přehled obsahové struktury','',
 '| Karta | Úrovně | First/Second/Third Listening v UI | Written Evidence | Reconstruction |',
 '|---|---:|---|---|---|',
 ...files.map(f=>{const r=variants.find(v=>v.topicId===f.id);return '| '+f.id+' | 6 | '+(r.explicitThreeListeningSections?'ANO':'NE')+' | '+(r.explicitWrittenEvidence?'ANO':'NE')+' | '+(r.explicitReconstruction?'ANO':'NE')+' |'}),
 '',
 '## Otevřené brány','',
 'Harrison Ford a Peaky Blinders potřebují přestavbu studentského UX do tří poslechových fází, obsahovou revizi a fyzické ověření externího média.',
 'Peaky Blinders zvlášť vyžaduje věkovou přejímku. TED Conlangs a How to Choose Your News nejsou ještě integrovány.',
 'Učitelské klíče, osobní data žáků a skutečné výsledky přehrávání nejsou v tomto reportu.',
 'Kanonické originály se nemění. DRAFT, bez pedagogického schválení a bez publikace.',''];
fs.writeFileSync(path.join(out,'LISTENING_MATTHEW_PARITY_SUMMARY.md'),md.join('\n'));
console.log('PASS LISTENING PARITY:',report.sourceCards,'sources,',report.sourceVariants,'EN CEFR variants; data-source Git blobs verified');
console.log('LISTENING REVIEW COUNTS:',JSON.stringify(groups));
console.log('LISTENING SECTION INVENTORY:',JSON.stringify(files.map(f=>({id:f.id,...Object.fromEntries(['explicitThreeListeningSections','explicitWrittenEvidence','explicitReconstruction'].map(k=>[k,variants.find(v=>v.topicId===f.id)[k]]))}))));
