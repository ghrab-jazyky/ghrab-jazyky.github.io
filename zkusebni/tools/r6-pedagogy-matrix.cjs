#!/usr/bin/env node
/* R6 cross-level teaching-content matrix. Deterministic and offline, NOT linguistic approval.
 * Output is written only to the requested folder and never modifies a card.
 * Usage: node zkusebni/tools/r6-pedagogy-matrix.cjs "$RUNNER_TEMP/r6-matrix"
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const out=path.resolve(process.argv[2]||path.join(root,'_qa-matrix'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/conversation-r6-candidates.json'),'utf8'));
const langs=['en','es','de','fr'],levels=['A1','A2','B1','B2','C1','C2'];
const findings=[],matrix=[],groups=[],variantIndex=new Map();
const norm=x=>String(x||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const words=s=>String(s).trim().split(/\s+/).filter(Boolean).length;
const avg=a=>Math.round(a.reduce((s,v)=>s+v,0)/Math.max(1,a.length)*10)/10;
const sha=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
function finding(id,lang,level,code,place,actual,detail){
 findings.push({topicId:id,language:lang,level,code,place,observed:actual,explanation:detail,
  status:'OPEN_CONTENT_REVIEW',teacherApproval:false});
}
assert.equal(manifest.status,'CANDIDATES_ONLY');
assert.equal(manifest.published,false);
assert.equal(manifest.teacherApproval,false);
assert.equal(manifest.cards.length,21);
for(const card of manifest.cards){
 const html=fs.readFileSync(path.join(root,card.candidatePath),'utf8');
 assert.equal(sha(html),card.candidateSha256,'Changed source: '+card.id);
 const a=html.indexOf('const CONTENT = '),b=html.indexOf(';\nconst ORDER = ',a);
 assert.ok(a>=0&&b>a,card.id+' content not found');
 const data=JSON.parse(html.slice(a+'const CONTENT = '.length,b));
 for(const language of langs){
  assert.ok(data[language]&&data[language].levels,card.id+' '+language);
  const observations=[];
  for(const level of levels){
   const v=data[language].levels[level];
   assert.ok(v&&v.stations&&v.stations.length===8&&v.vocab.length===12&&v.toolkit.length===4);
   const prompts=v.stations.flatMap(s=>[s.main,...s.questions]);
   const main=v.stations.map(s=>s.main);
   const vocab=v.vocab.map(pair=>pair[0]);
   const support=v.stations.flatMap(s=>s.support);
   const duplicates=vocab.map(norm).filter((term,i,a)=>a.indexOf(term)!==i);
   if(duplicates.length)finding(card.id,language,level,'VOCAB_DUPLICATE','vocab',duplicates.join(' / '),'Same headword repeated within one 12-item vocabulary set');
   for(const [i,pair] of v.vocab.entries()){
    if(!Array.isArray(pair)||pair.length!==2||!pair.every(x=>typeof x==='string'&&x.trim().length>1))
     finding(card.id,language,level,'VOCAB_MISSING_GLOSS','vocab '+(i+1),JSON.stringify(pair),'Word or learner-facing gloss is missing or invalid');
   }
   const toolKeys=v.toolkit.map(pair=>norm(pair[0]));
   if(new Set(toolKeys).size<4)finding(card.id,language,level,'TOOLKIT_REPEATED_LABEL','toolkit',toolKeys.join(' / '),'Two language-support labels are identical; review whether distinct strategies are provided');
   const goals=data[language].ui||{};
   const key='goal'+level;
   if(typeof goals[key]!=='string'||goals[key].trim().length<12)
    finding(card.id,language,level,'CEFR_GOAL_MISSING','ui.'+key,String(goals[key]),'Learning objective absent or very short');
   const p=prompts.map(norm),uniq=new Set(p);
   if(uniq.size!==p.length)finding(card.id,language,level,'REPEATED_PROMPTS','all stations',String(p.length-uniq.size),'Main or follow-up prompts repeat within this level');
   const row={topicId:card.id,language,level,stations:8,mainQuestions:8,followUps:24,
    meanQuestionWords:avg(prompts.map(words)),meanMainWords:avg(main.map(words)),
    meanSupportWords:avg(support.map(words)),uniquePromptRatio:Math.round(100*uniq.size/p.length),
    vocabDistinctTerms:new Set(vocab.map(norm)).size,
    hasObjective:typeof goals[key]==='string'&&goals[key].trim().length>=12,
    hasExplain:v.stations.every(s=>typeof s.mainExplain==='string'&&Array.isArray(s.explanations)&&s.explanations.length===3)};
   matrix.push(row);
   observations.push({level,main:main.map(norm),all:p,vocab:vocab.map(norm),mean:row.meanQuestionWords});
   variantIndex.set(card.id+'/'+language+'/'+level,{cardId:card.id,language,level,all:p});
  }
  for(let i=1;i<observations.length;i++){
   const prev=observations[i-1],curr=observations[i];
   const sameMain=curr.main.filter((q,j)=>q===prev.main[j]).length;
   const sameAll=curr.all.filter((q,j)=>q===prev.all[j]).length;
   const sameVocab=curr.vocab.filter(t=>prev.vocab.includes(t)).length;
   groups.push({topicId:card.id,language,from:prev.level,to:curr.level,
    sameMainAtSameStation:sameMain,samePromptsAtSamePosition:sameAll,sharedVocabTerms:sameVocab,
    meanPromptWordsPrev:prev.mean,meanPromptWordsNext:curr.mean});
   // Repeated complete tasks are suspicious; isolated identical questions are legitimate scaffolding.
   if(sameAll>=16)
    finding(card.id,language,curr.level,'LEVELS_NEAR_IDENTICAL',prev.level+' to '+curr.level,
      String(sameAll)+'/32 matching prompts','Two adjacent CEFR levels reuse at least half of the prompts in identical positions');
   else if(sameMain>=6)
    finding(card.id,language,curr.level,'MAIN_TOPICS_NEAR_IDENTICAL',prev.level+' to '+curr.level,
      String(sameMain)+'/8 matching main questions','Six or more identical main questions between adjacent levels; confirm level differentiation');
  }
 }
}
// Detect accidental multi-card clones in the same language/CEFR, not legitimate shared phrases.
for(let i=0;i<manifest.cards.length;i++)for(let j=i+1;j<manifest.cards.length;j++){
 const a=manifest.cards[i].id,b=manifest.cards[j].id;
 for(const language of langs)for(const level of levels){
  const x=variantIndex.get(a+'/'+language+'/'+level),y=variantIndex.get(b+'/'+language+'/'+level);
  const sameness=x.all.filter((q,k)=>q===y.all[k]).length;
  if(sameness>=20)finding(b,language,level,'CROSS_TOPIC_CLONE',a+' vs '+b,
    String(sameness)+'/32 matching prompts','Two distinct topics use unusually similar question sets; check import or copy/paste');
 }
}
assert.equal(matrix.length,504);
assert.equal(groups.length,420);
const byCode={};for(const f of findings)byCode[f.code]=(byCode[f.code]||0)+1;
const totals=levels.map(level=>{
 const rows=matrix.filter(x=>x.level===level);
 return {level,variants:rows.length,meanQuestionWords:avg(rows.map(x=>x.meanQuestionWords)),
   meanMainWords:avg(rows.map(x=>x.meanMainWords)),meanSupportWords:avg(rows.map(x=>x.meanSupportWords))};
});
const report={schemaVersion:1,kind:'R6_CROSS_LEVEL_HEURISTIC_SCREEN',releaseApproved:false,teacherApproval:false,
 totalCards:21,variantCount:matrix.length,levelTransitions:groups.length,
 methodology:'Source-verified comparison of main questions, 24 follow-ups, 12 vocabulary terms and level objectives across 21 topics, four languages and six CEFR levels. Word counts are diagnostic only.',
 limitations:['Mean sentence length cannot establish CEFR suitability','Cross-level overlap may be legitimate scaffolding','No independent judgment of semantics, accuracy, appropriateness or idiomaticity','No device/browser, media, offline or teacher-key verification'],
 findingCounts:byCode,findings,perVariant:matrix,perLevelTransition:groups,levelAggregates:totals};
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'R6_PEDAGOGICAL_MATRIX.json'),JSON.stringify(report,null,2)+'\n');
const md=['# Language Skills Hub – R6 pedagogická matice (heuristická)','',
 'Přesně ověřeno 21 zdrojových SHA-256; 504 jazykových variant; 420 porovnání sousedních úrovní.',
 'Toto **není kompletní jazykový audit** ani potvrzení úrovní CEFR, ale reprodukovatelný podklad pro cílenou revizi.',
 '',
 '## Agregovaná délka otázek podle úrovní (pouze orientační)', '',
 '| CEFR | Variant | Průměr slov / otázka | Průměr slov / hlavní otázka |',
 '|---|---:|---:|---:|',
 ...totals.map(r=>'| '+r.level+' | '+r.variants+' | '+r.meanQuestionWords+' | '+r.meanMainWords+' |'),
 '',
 '## Zjištěné kandidáty na kontrolu','',
 'Celkem upozornění: **'+findings.length+'**. Nejde automaticky o chyby.',
 ...Object.entries(byCode).sort((a,b)=>b[1]-a[1]).map(([k,n])=>'- '+k+': '+n),
 '',
 ...findings.slice(0,100).map(f=>'- '+f.topicId+' / '+f.language+' '+f.level+' / '+f.code+' / '+f.place+': '+f.observed),
 '',
 '## Další ověření','',
 'Odborné čtení obsahu ve všech jazycích, úrovních, věkových a tematických souvislostech; technická UAT a soukromé klíče zůstávají otevřené.',
 'Původní studentské karty, manifest a učitelská data nejsou tímto nástrojem měněny.',
 'Stav: DRAFT, bez publikace a bez učitelského schválení.',''];
fs.writeFileSync(path.join(out,'R6_PEDAGOGICAL_MATRIX_SUMMARY.md'),md.join('\n'));
console.log('PASS R6 PEDAGOGY MATRIX:',report.totalCards,'cards,',report.variantCount,'variants,',report.levelTransitions,'adjacent-level comparisons');
console.log('AGGREGATE BY LEVEL:',JSON.stringify(totals));
console.log('REVIEW COUNTS:',JSON.stringify(byCode),'TOTAL',findings.length);
console.log('REVIEW EXAMPLES:',JSON.stringify(findings.slice(0,18)));
