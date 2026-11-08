#!/usr/bin/env node
/* Independent R6 static content audit: no AI API, no student data, no source edits.
 * This is a HEURISTIC REVIEW, not a complete linguistic or pedagogical sign-off.
 * Usage: node zkusebni/tools/r6-content-audit.cjs [output-dir]
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const LEVELS=['A1','A2','B1','B2','C1','C2'];
const LANGS=['en','es','de','fr'];
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'data/conversation-r6-candidates.json'),'utf8'));
const R8_DIR=process.env.LSH_R8_CANDIDATES_DIR?path.resolve(process.env.LSH_R8_CANDIDATES_DIR):null;
const R8=R8_DIR?JSON.parse(fs.readFileSync(path.join(R8_DIR,'R8_RECOVERY_MANIFEST.json'),'utf8')):null;
const version=R8?'R8':'R6';
const output=path.resolve(process.argv[2]||path.join(ROOT,'_qa-out'));
const findings=[],metrics=[];
const squish=s=>String(s||'').normalize('NFKC').toLocaleLowerCase('und').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const countWords=s=>s.trim().split(/\s+/).filter(Boolean).length;
function note(id,lang,level,code,where,observed,explanation,severity='REVIEW'){
 findings.push({id,language:lang,level,code,location:where,observed,explanation,severity,
   status:'UNVERIFIED_HEURISTIC_NOT_TEACHER_APPROVED'});
}
assert.equal(manifest.status,'CANDIDATES_ONLY');
assert.equal(manifest.teacherApproval,false);
assert.equal(manifest.published,false);
assert.equal(manifest.cards.length,21);
if(R8){
 assert.equal(R8.cards.length,21);
 assert.equal(R8.teacherApproval,false);
 assert.equal(R8.published,false);
 assert.equal(R8.catalogUpdated,false);
 assert.equal(R8.approvedForRelease,false);
 assert.equal(R8.statistics.variantCount,504);
 assert.equal(R8.statistics.stationCount,4032);
}
for(const card of manifest.cards){
 const recovered=R8&&R8.cards.find(c=>c.id===card.id);
 if(R8)assert.ok(recovered,'Missing restored R8 card '+card.id);
 const src=fs.readFileSync(R8?path.join(R8_DIR,recovered.file):path.join(ROOT,card.candidatePath),'utf8');
 const sha=crypto.createHash('sha256').update(src,'utf8').digest('hex');
 assert.equal(sha,R8?recovered.repairedCandidateSha256:card.candidateSha256,
  version+' source SHA-256 mismatch for '+card.id);
 const a=src.indexOf('const CONTENT = '),b=src.indexOf(';\nconst ORDER = ',a);
 assert.ok(a>=0&&b>a,'Cannot parse CONTENT of '+card.id);
 const data=JSON.parse(src.slice(a+'const CONTENT = '.length,b));
 assert.deepEqual(Object.keys(data).sort(),LANGS.slice().sort());
 for(const lang of LANGS)for(const level of LEVELS){
  const v=data[lang].levels[level];
  assert.equal(v.stations.length,8,card.id+'/'+lang+'/'+level+' station count');
  assert.equal(v.vocab.length,12);
  assert.equal(v.toolkit.length,4);
  const seen=new Map(),questions=[];
  for(const [i,s] of v.stations.entries()){
   const strings=[{where:'station '+(i+1)+' main',text:s.main},...s.questions.map((q,j)=>({where:'station '+(i+1)+' follow-up '+(j+1),text:q}))];
   assert.equal(s.questions.length,3);
   for(const q of strings){
    const key=squish(q.text);
    if(seen.has(key))note(card.id,lang,level,'DUPLICATE_PROMPT',
       q.where,q.text,'Nearly exact prompt repeated at '+seen.get(key),'LIKELY_ERROR');
    else seen.set(key,q.where);
    questions.push(q.text);
    if(lang==='es'&&q.text.includes('?')&&!q.text.includes('¿'))
      note(card.id,lang,level,'ES_QUESTION_PUNCTUATION',q.where,q.text,
       'Check opening Spanish question mark (imperative or quote may be legitimate).');
    if(level==='A1'&&countWords(q.text)>19)
      note(card.id,lang,level,'A1_LONG_PROMPT',q.where,q.text,
       'Over 19 words: verify comprehensibility and reading load for A1.');
    if(lang==='es'&&level==='A1'&&/\bque\b.{0,75}\b(?:sea|parezca|pueda|tenga|quiera|haga|sepa|vaya|estén|puedan|tengan)\b/iu.test(q.text))
      note(card.id,lang,level,'ES_A1_COMPLEX_SUBJUNCTIVE',q.where,q.text,
       'Potential subjunctive subordinate clause: check A1 grammar demand and simplify if necessary.','PRIORITY_REVIEW');
    if(lang!=='en'&&/\b(?:what do you think|how would you|tell your partner|how important is it)\b/i.test(q.text))
      note(card.id,lang,level,'POSSIBLE_ENGLISH_LEAK',q.where,q.text,
       'English instruction may have leaked into the target-language prompt.','PRIORITY_REVIEW');
   }
   if(LEVELS.indexOf(level)>=3){
    const explainFields=[s.mainExplain,s.mainExplanation].filter(v=>typeof v==='string'&&!!v.trim());
    if(explainFields.length===0)
      note(card.id,lang,level,'MISSING_MAIN_EXPLAIN','station '+(i+1),s.main,
       'B2–C2 main question has no explanation in mainExplain nor mainExplanation.');
    if(explainFields.length===2&&explainFields[0]!==explainFields[1])
      note(card.id,lang,level,'CONFLICTING_MAIN_EXPLAIN','station '+(i+1),s.main,
       'Both explanation aliases exist with different text; verify which is rendered.','PRIORITY_REVIEW');
    if(!Array.isArray(s.explanations)||s.explanations.length!==3)
      note(card.id,lang,level,'MISSING_FOLLOWUP_EXPLAINS','station '+(i+1),s.title,
       'B2–C2 follow-up explanations absent or incomplete.');
   }
  }
  const words=questions.map(countWords);
  metrics.push({id:card.id,lang,level,stationCount:v.stations.length,
   questionCount:questions.length,meanWords:Math.round(words.reduce((a,b)=>a+b,0)/words.length*10)/10,
   maxWords:Math.max(...words)});
 }
}
const result={schemaVersion:1,source:R8?'R8_SOURCE_PRESERVING_CANDIDATES_ONLY':'R6_CANDIDATES_ONLY',kind:'HEURISTIC_CONTENT_QA',
 teacherApproval:false,releaseApproved:false,totalCards:manifest.cards.length,
 totalVariants:metrics.length,totalStations:metrics.length*8,totalPrompts:metrics.length*32,
 note:'Deterministic lint flags potential problems; no lexical/semantic accuracy, CEFR or teacher approval is established.',
 findings,metrics};
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,version+'_CONTENT_AUDIT.json'),JSON.stringify(result,null,2)+'\n','utf8');
const groups={};for(const f of findings)groups[f.code]=(groups[f.code]||0)+1;
const summary=['# '+version+' – nezávislý automatizovaný obsahový screening','',
 'Zdroj: 21 SHA-256 ověřených studentských kandidátů; žádné zveřejnění ani přepsání originálů.',
 'Rozsah: '+result.totalVariants+' variant, '+result.totalStations+' stanovišť, '+result.totalPrompts+' hlavních a doplňujících otázek.',
 'Nalezených upozornění (pouze kandidáti na lidskou kontrolu): '+findings.length+'.',
 '',...Object.keys(groups).sort().map(k=>'- '+k+': '+groups[k]),'',
 '## Příklady k ručnímu přezkoumání','',
 ...findings.filter(f=>f.severity!=='REVIEW').slice(0,80).map(f=>
 '- '+f.id+' / '+f.language+' '+f.level+' / '+f.location+' ['+f.code+']: '+f.observed),
 '',
 '## Limity','',
 'Žádný tento test nedokazuje idiomatičnost ve 4 jazycích, správnou úroveň CEFR,',
 'pedagogickou kvalitu ani reálné chování iOS, Android, offline slovníčku či QR.',
 'Zdrojová HTML zůstávají beze změn. Učitelské schválení neuděleno.',''];
fs.writeFileSync(path.join(output,version+'_CONTENT_AUDIT_SUMMARY.md'),summary.join('\n'),'utf8');
console.log('PASS '+version+' HEURISTIC CONTENT SCREEN:',result.totalCards,'cards,',
 result.totalVariants,'variants,',result.totalStations,'stations,',result.totalPrompts,'prompts');
console.log('REVIEW QUEUE:',JSON.stringify(groups),'total',findings.length);
console.log('REVIEW CANDIDATES:',JSON.stringify(findings.slice(0,20).map(f=>({id:f.id,language:f.language,level:f.level,code:f.code,location:f.location,observed:f.observed}))));
