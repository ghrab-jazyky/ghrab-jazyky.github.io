#!/usr/bin/env node
/* R8: recover the source-authored educational content for all 21 R6 candidates.
 * R6 candidate UI / CSP / shared assets stay intact, but genericised or altered
 * R6 CONTENT is replaced by the exact canonical original plus 7 explicit fixes.
 * Output is an isolated directory (CI artifact) ONLY: never overwrite sources.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const crypto=require('node:crypto'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const OUT=path.resolve(process.argv[2]||path.join(os.tmpdir(),'lsh-conversation-r8-candidates'));
const mf=JSON.parse(fs.readFileSync(path.join(ROOT,'data/conversation-r6-candidates.json'),'utf8'));
const plan=JSON.parse(fs.readFileSync(path.join(ROOT,'data/conversation-r8-minimal-content-fixes.json'),'utf8'));
const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const blob=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
const norm=x=>String(x||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
function locate(html,id){
 const label='const CONTENT = ',start=html.indexOf(label),end=html.indexOf(';\nconst ORDER = ',start);
 assert.ok(start>=0&&end>start,'Missing CONTENT in '+id);
 return {start:start+label.length,end,data:JSON.parse(html.slice(start+label.length,end))};
}
function scriptHash(html,id){
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).filter(x=>x.trim());
 assert.equal(scripts.length,1,'Expected exactly one inline engine '+id);
 new vm.Script(scripts[0],{filename:id+'.html'});
 return crypto.createHash('sha256').update(scripts[0],'utf8').digest('base64');
}
function verifyCoverage(data,id){
 assert.deepEqual(Object.keys(data).sort(),LANGS.slice().sort(),'Languages '+id);
 for(const l of LANGS){
  assert.deepEqual(Object.keys(data[l].levels).sort(),LEVELS.slice().sort(),'CEFR '+id+'/'+l);
  for(const lev of LEVELS){
   const v=data[l].levels[lev];
   assert.equal(v.stations.length,8,id+'/'+l+'/'+lev+' stations');
   assert.equal(v.vocab.length,12);
   assert.equal(v.toolkit.length,4);
   for(const st of v.stations){
    assert.ok(st.title&&st.main&&Array.isArray(st.questions)&&st.questions.length===3);
    assert.ok(Array.isArray(st.support)&&st.support.length>0);
    assert.ok(st.challenge&&st.stretch);
   }
  }
 }
}
function countDiffs(original,r6){
 const count={variantCount:0,stationCount:0,changedSupportStations:0,changedSupportEntries:0,
  changedMainPrompts:0,changedFollowups:0,changedChallenges:0,changedStretches:0,
  changedExplanations:0,changedVocabularySets:0,changedToolkitSets:0,changedOtherFields:0};
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 for(const l of LANGS)for(const lev of LEVELS){
  const a=original[l].levels[lev],b=r6[l].levels[lev];count.variantCount++;
  if(!same(a.vocab,b.vocab))count.changedVocabularySets++;
  if(!same(a.toolkit,b.toolkit))count.changedToolkitSets++;
  for(const [k,v] of Object.entries(a)){
   if(!['stations','vocab','toolkit'].includes(k)&&!same(v,b[k]))count.changedOtherFields++;
  }
  for(let i=0;i<8;i++){
   const x=a.stations[i],y=b.stations[i];count.stationCount++;
   if(!same(x.support,y.support)){
    count.changedSupportStations++;
    for(let k=0;k<Math.max(x.support.length,y.support.length);k++)
     if(x.support[k]!==y.support[k])count.changedSupportEntries++;
   }
   if(x.main!==y.main)count.changedMainPrompts++;
   for(let k=0;k<3;k++)if(x.questions[k]!==y.questions[k])count.changedFollowups++;
   if(x.challenge!==y.challenge)count.changedChallenges++;
   if(x.stretch!==y.stretch)count.changedStretches++;
   if(!same([x.mainExplain,x.explanations],[y.mainExplain,y.explanations]))count.changedExplanations++;
   for(const [k,v] of Object.entries(x)){
    if(!['support','main','questions','challenge','stretch','mainExplain','explanations'].includes(k)&&!same(v,y[k]))
     count.changedOtherFields++;
   }
  }
 }
 return count;
}
assert.equal(mf.status,'CANDIDATES_ONLY');
assert.equal(mf.teacherApproval,false);
assert.equal(mf.published,false);
assert.equal(mf.catalogUpdated,false);
assert.equal(mf.cards.length,21);
assert.equal(plan.schemaVersion,1);
assert.equal(plan.state,'CANDIDATES_ONLY');
assert.equal(plan.teacherApproval,false);
assert.equal(plan.published,false);
assert.equal(plan.patches.length,7);
assert.equal(new Set(plan.patches.map(p=>p.topicId+'/'+p.language+'/'+p.level+'/'+p.stationIndex+'/'+p.field+'/'+(p.questionIndex??''))).size,7);
const cards=[],total={},questionReview=[];
fs.mkdirSync(OUT,{recursive:true});
for(const item of mf.cards){
 const orig=fs.readFileSync(path.join(ROOT,item.originalPath));
 const r6=fs.readFileSync(path.join(ROOT,item.candidatePath));
 assert.equal(blob(orig),item.originalGitBlob,'Canonical original drift '+item.id);
 assert.equal(blob(r6),item.candidateGitBlob,'R6 candidate blob mismatch '+item.id);
 assert.equal(sha256(r6),item.candidateSha256,'R6 candidate SHA mismatch '+item.id);
 const original=orig.toString('utf8'),candidate=r6.toString('utf8');
 const a=locate(original,item.id),b=locate(candidate,item.id);
 verifyCoverage(a.data,item.id);verifyCoverage(b.data,item.id);
 const changes=countDiffs(a.data,b.data);
 for(const [key,value] of Object.entries(changes))total[key]=(total[key]||0)+value;
 const repaired=structuredClone(a.data);
 const fixes=plan.patches.filter(p=>p.topicId===item.id);
 for(const p of fixes){
  assert.ok(LANGS.includes(p.language)&&LEVELS.includes(p.level));
  assert.ok(Number.isInteger(p.stationIndex)&&p.stationIndex>=0&&p.stationIndex<8);
  const station=repaired[p.language].levels[p.level].stations[p.stationIndex];
  assert.ok(station);
  if(p.field==='main'){
   assert.equal(station.main,p.original,'Original repair precondition failed '+item.id);
   station.main=p.replacement;
  }else if(p.field==='questions'){
   assert.ok(Number.isInteger(p.questionIndex)&&p.questionIndex>=0&&p.questionIndex<3);
   assert.equal(station.questions[p.questionIndex],p.original,'Question precondition failed '+item.id);
   station.questions[p.questionIndex]=p.replacement;
  }else throw Error('Unapproved patch target '+p.field);
 }
 verifyCoverage(repaired,item.id);
 // Preserve an exact review list of the 38 R6 question edits, even when R8 does
 // not adopt them. Only a human linguistic review can decide the remaining edits.
 for(const l of LANGS)for(const lev of LEVELS){
  const originalVariant=a.data[l].levels[lev],r6Variant=b.data[l].levels[lev],
   restoredVariant=repaired[l].levels[lev];
  for(let i=0;i<8;i++)for(let q=0;q<4;q++){
   const field=q===0?'main':'questions';
   const get=(v)=>q===0?v.stations[i].main:v.stations[i].questions[q-1];
   const before=get(originalVariant),afterR6=get(r6Variant),afterR8=get(restoredVariant);
   if(before===afterR6)continue;
   questionReview.push({topicId:item.id,language:l,level:lev,station:i+1,
    target:q===0?'main':'followup-'+q,original:before,r6Candidate:afterR6,
    r8Candidate:afterR8,r8UsedR6Proposal:afterR8===afterR6,
    changedByExplicitPatch:fixes.some(p=>p.language===l&&p.level===lev&&
     p.stationIndex===i&&p.field===field&&(q===0||p.questionIndex===q-1)),
    status:'CONTENT_CHANGE_NEEDS_TEACHER_REVIEW',teacherApproval:false});
  }
 }
 // Validate the complete recovered teaching content, not just HTML shape.
 for(const l of LANGS)for(const lev of LEVELS){
  const seen=new Map();
  const v=repaired[l].levels[lev];
  for(const [i,station] of v.stations.entries()){
   for(const [j,prompt] of [station.main,...station.questions].entries()){
    const key=norm(prompt);
    assert.ok(key,'Empty prompt '+item.id+'/'+l+'/'+lev);
    assert.ok(!seen.has(key),
     'Unresolved duplicate '+item.id+'/'+l+'/'+lev+'/'+(i+1)+' question '+j+
     ' repeats '+seen.get(key)+': '+prompt);
    seen.set(key,(i+1)+'/'+j);
   }
  }
 }
 // Source-specific non-repeated follow-ups: station 1 vs station 8 in School ES A1.
 if(item.id==='cl-skola'){
  const v=repaired.es.levels.A1.stations;
  assert.notEqual(norm(v[0].questions[0]),norm(v[7].questions[0]));
 }
 // The R6 script/UI is preserved verbatim except the CONTENT literal and its CSP hash.
 let html=candidate.slice(0,b.start)+JSON.stringify(repaired)+candidate.slice(b.end);
 const hashes=[...html.matchAll(/sha256-([A-Za-z0-9+/]{43}=)/g)];
 assert.equal(hashes.length,1,'Expected exactly one CSP script hash '+item.id);
 const nextHash=scriptHash(html,item.id);
 html=html.replace('sha256-'+hashes[0][1],'sha256-'+nextHash);
 assert.equal(scriptHash(html,item.id),nextHash);
 assert.ok(html.includes('sha256-'+nextHash),'New CSP is missing');
 assert.deepEqual(locate(html,item.id).data,repaired,'Unexpected CONTENT mutations '+item.id);
 // Explicitly verify original supports, vocabulary and all unpatched fields survive.
 for(const lang of LANGS)for(const lev of LEVELS){
  const x=a.data[lang].levels[lev],y=locate(html,item.id).data[lang].levels[lev];
  assert.deepEqual(x.vocab,y.vocab);assert.deepEqual(x.toolkit,y.toolkit);
  for(let i=0;i<8;i++){
   assert.deepEqual(x.stations[i].support,y.stations[i].support);
   assert.equal(x.stations[i].challenge,y.stations[i].challenge);
   assert.equal(x.stations[i].stretch,y.stations[i].stretch);
  }
 }
 for(const token of ['data-lsh-topic-id="'+item.id+'"','CATALOG_PRESET_V1',
  '../../assets/lsh/v2/lock.js','../../assets/lsh/v3/model.js',
  '../../assets/lsh/v3/store.js','../../assets/lsh/v3/card-bridge.js'])
  assert.ok(html.includes(token),'Shared runtime missing '+item.id+'/'+token);
 const outFile=item.id+'-r8.html',dest=path.join(OUT,outFile);
 fs.writeFileSync(dest,html,{flag:'w'});
 cards.push({id:item.id,file:outFile,original:item.originalPath,r6Candidate:item.candidatePath,
  sourceOriginalGitBlob:item.originalGitBlob,r6GitBlob:item.candidateGitBlob,
  originalSha256:sha256(orig),r6CandidateSha256:sha256(r6),
  repairedCandidateSha256:sha256(Buffer.from(html)),exactPatches:fixes.map(p=>({language:p.language,level:p.level,station:p.stationIndex+1,field:p.field,question:p.questionIndex===undefined?null:p.questionIndex+1})),
  contentDifferencesDiscarded:changes,teacherApproval:false,published:false});
}
const result={schemaVersion:1,kind:'R8_SOURCE_CONTENT_RECOVERY_CANDIDATES_ONLY',
 source:'21 SHA-verified canonical Conversation HTML plus 7 exact A1 grammar/duplicate fixes',
 originalSourcesUnchanged:true,r6CandidatesUnchanged:true,teacherApproval:false,
 published:false,catalogUpdated:false,approvedForRelease:false,testModeReady:false,
 statistics:total,cards};
assert.equal(cards.length,21);
assert.equal(questionReview.length,total.changedMainPrompts+total.changedFollowups,
 'Prompt diff queue must contain every original-versus-R6 question change');
assert.equal(questionReview.length,38);
assert.equal(total.variantCount,504);
assert.equal(total.stationCount,4032);
assert.equal(cards.reduce((n,c)=>n+c.exactPatches.length,0),7);
fs.writeFileSync(path.join(OUT,'R8_RECOVERY_MANIFEST.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(OUT,'R8_QUESTION_CHANGE_REVIEW.json'),
 JSON.stringify({schemaVersion:1,kind:'R8_QUESTION_CHANGE_REVIEW',
  total:questionReview.length,teacherApproval:false,approvedForRelease:false,
  note:'38 R6 question changes require separate linguistic judgment. R8 restores originals except 7 explicit A1 fixes; changedByExplicitPatch identifies overlap. Neither original nor R6 text is automatically approved.',
  entries:questionReview},null,2)+'\n');
// Human-readable, finite review queue. This is evidence for teacher review,
// never a publication approval and never a replacement for CEFR/semantic QA.
const md=val=>String(val??'').replace(/[\r\n]+/g,' ').trim();
const reviewMd=[
 '# Conversation Lab R8 – jazyková a pedagogická kontrola změn',
 '',
 '**Stav: NEOVĚŘENO / NEPUBLIKOVAT.** Kandidáti R8 obnovují původní otázky,',
 's výjimkou sedmi zdrojově potvrzených oprav A1. Žádná položka nemá automatický souhlas učitele.',
 '',
 '## A. Sedm cílených oprav A1', ''
];
for(const [i,p] of plan.patches.entries()){
 reviewMd.push('### A'+(i+1)+'. '+md(p.topicId)+' · '+md(p.language.toUpperCase())+
  ' '+md(p.level)+' · stanoviště '+(p.stationIndex+1),
  '- Umístění: '+md(p.field)+(p.questionIndex===undefined?'':' / doplňující otázka '+(p.questionIndex+1)),
  '- Původní: '+md(p.original),
  '- R8 návrh: '+md(p.replacement),
  '- Důvod návrhu: '+md(p.reason),
  '- Rozhodnutí učitele: **ČEKÁ**', '');
}
reviewMd.push('## B. Všech 38 rozdílů v otázkách mezi originálem a R6', '',
 'R8 nepřebírá automaticky úpravy R6. Následující řádky umožní posoudit',
 'původní a R6 verzi bez generických změn v ostatním obsahu.', '');
for(const [i,e] of questionReview.entries()){
 reviewMd.push('### B'+(i+1)+'. '+md(e.topicId)+' · '+md(e.language.toUpperCase())+' '+
   md(e.level)+' · stanoviště '+e.station+' · '+md(e.target),
  '- Původní: '+md(e.original),
  '- Odmítnutý/neposouzený návrh R6: '+md(e.r6Candidate),
  '- Aktuální izolovaný kandidát R8: '+md(e.r8Candidate),
  '- Cílená oprava v R8: '+(e.changedByExplicitPatch?'ANO (čeká na schválení)':'NE'),
  '- Rozhodnutí učitele: **ČEKÁ**', '');
}
reviewMd.push('---','','Dokument vzniká výhradně ve výstupním artefaktu CI. '+
 'Schválená produkční karta ani soukromý učitelský klíč se tímto nemění.','');
assert.equal(questionReview.length,38);
assert.equal(plan.patches.length,7);
fs.writeFileSync(path.join(OUT,'R8_QUESTION_CHANGE_REVIEW.md'),reviewMd.join('\n'));
const lines=['# Conversation Lab R8 – bezpečná obnova původního pedagogického obsahu','',
 'Důvod: R6 kandidáti obsahují masivní generické nahrazování tematicky specifických opor. To je pedagogická regrese, přestože strukturální kontroly R6 byly zelené.',
 '', '## Rozsah předběžného zjištění','',
 '- R6 změnil jazykové opory u **'+total.changedSupportStations+' / '+total.stationCount+'** stanovišť.',
 '- Změněných jednotlivých položek Support: **'+total.changedSupportEntries+'**.',
 '- Další rozdíly v původních vs R6 datech: hlavní otázky '+total.changedMainPrompts+
   ', doplňující otázky '+total.changedFollowups+', Challenge '+total.changedChallenges+
   ', Stretch '+total.changedStretches+', vysvětlení '+total.changedExplanations+
   ', sady slovní zásoby '+total.changedVocabularySets+'.',
 '- Seznam všech 38 změněných hlavních/doplňujících otázek a rozhodnutí R8 je v R8_QUESTION_CHANGE_REVIEW.json; nevybrané formulace z R6 stále čekají na obsahovou revizi.',
 '', '## Obnova','',
 '- Všech 21 R8 HTML kopíruje kompletní **původní CONTENT** (EN/ES/DE/FR × A1–C2), původní Support, Challenge, Stretch, Vocabulary a Toolkit.',
 '- Jediných sedm povolených odchýlení jsou přesné zdrojově ověřené opravy A1 definované v data/conversation-r8-minimal-content-fixes.json.',
 '- Kandidátní UI a technická integrace R6 zůstávají; JS syntaxe a CSP SHA-256 přepočteny a ověřeny.',
 '- 21 HTML vzniklo **jen v tomto CI výstupu**, žádný kanonický zdroj, R6 kandidát, teacher key ani katalog se nepřepisuje.',
 '', '## Důležité limity','',
 '- Obnova původního obsahu není úplná pedagogická validace původních karet ani externí audit CEFR.',
 '- R8 kandidáty nepovažovat za hotové testy; nepřesouvat do veřejných studentských cest bez samostatné přejímky.',
 '- Potřeba ověřit skutečné prohlížeče, mobilní ergonomii, časovač, slovníček a jejich chování na fyzickém zařízení.',
 '', 'Stav: DRAFT, bez učitelského schválení.',''];
fs.writeFileSync(path.join(OUT,'R8_RECOVERY_REPORT.md'),lines.join('\n')+'\n');
console.log('PASS R8 CONTENT RECOVERY: 21 source-verified cards, 504 variants, 4032 stations, 7 targeted A1 patches');
console.log('R6 DEGRADATION COUNTS:',JSON.stringify(total));
console.log('CANDIDATES ONLY:',OUT,'teacherApproval false, published false');
