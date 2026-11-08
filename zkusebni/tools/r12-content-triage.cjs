#!/usr/bin/env node
/* R12 pedagogical triage: source-grounded signals, never automatic approval.
 * Runs only against the disposable R11 offline bundle.
 * Correct answers, original sources and private teacher keys remain untouched.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto');
const STAGE=path.resolve(__dirname,'..'),REPO=path.resolve(STAGE,'..');
const DEST=path.resolve(process.argv[2]||'');
assert.ok(process.argv[2],'Usage: node r12-content-triage.cjs <r11-bundle-directory>');
assert.ok(DEST!==REPO&&!DEST.startsWith(REPO+path.sep),
 'No R12 output may be written into the public repository');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const m=read(path.join(DEST,'R10_REVIEW_MANIFEST.json'));
const v11=read(path.join(DEST,'R11_REVIEW_MATRIX.json'));
const p8=read(path.join(STAGE,'data/conversation-r8-minimal-content-fixes.json'));
const p81=read(path.join(STAGE,'data/conversation-r8-targeted-language-proposals.json'));
const p7=read(path.join(STAGE,'data/reading-r7-matching-proposals.json'));
const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
assert.equal(m.catalogSize,29);
assert.equal(m.entries.length,29);
assert.equal(v11.variantCount,642);
assert.equal(v11.variants.length,642);
assert.equal(m.teacherApproval,false);
assert.equal(v11.teacherApproval,false);
assert.equal(p8.patches.length,7);
assert.equal(p81.patches.length,5);
assert.equal(p7.patches.length,16);
const catalogue=new Map(m.entries.map(e=>[e.id,e]));
assert.equal(catalogue.size,29);
const data=new Map();
const sourceHash={};
for(const e of m.entries){
 const filepath=path.resolve(DEST,e.relative);
 assert.ok(filepath.startsWith(DEST+path.sep));
 const content=fs.readFileSync(filepath,'utf8');
 const checksum=sha(Buffer.from(content,'utf8'));
 assert.equal(checksum,e.sha256,'Unexpected source bytes: '+e.id);
 const marker=e.skill==='konverzace'?'const CONTENT = ':'const DATA=';
 const pos=content.indexOf(marker);
 assert.ok(pos>=0,'Data marker missing: '+e.id);
 const dataPiece=content.slice(pos+marker.length);
 let parsed;
 // Extract JSON only: find exact closing token via lightweight brace-aware scanner.
 let depth=0,inString=false,escaped=false,end=-1;
 for(let i=0;i<dataPiece.length;i++){
  const ch=dataPiece[i];
  if(inString){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')inString=false;}
  else if(ch==='"')inString=true;
  else if(ch==='{'||ch==='[')depth++;
  else if(ch==='}'||ch===']'){depth--;if(depth===0){end=i+1;break}}
 }
 assert.ok(end>=2,'JSON end not found: '+e.id);
 parsed=JSON.parse(dataPiece.slice(0,end));
 data.set(e.id,parsed);
 sourceHash[e.id]=checksum;
}
const words=text=>(String(text).match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)||[]).length;
const urlFor=(id,lang,level)=>{
 const e=catalogue.get(id);assert.ok(e,'Unknown topic '+id);
 const link='r11/variant-copies/'+id+'.html';
 const adapter=v11.reviewOnlyAdapters.find(x=>x.id===id);
 const file=adapter?link:e.relative;
 if(adapter){assert.equal(adapter.reviewFile,file);assert.ok(fs.existsSync(path.join(DEST,file)));}
 return file+'?lang='+encodeURIComponent(lang)+'&level='+encodeURIComponent(level)+'&zamek=1&practice=1';
};
const cue=(id,lang,level)=>({topicId:id,language:lang,level,url:urlFor(id,lang,level)});
const changes=[];
for(const patch of p8.patches){
 const e=catalogue.get(patch.topicId);
 assert.ok(e&&e.skill==='konverzace');
 changes.push({...cue(patch.topicId,patch.language,patch.level),group:'R8_A1',
  field:patch.field,station:patch.stationIndex+1,question:patch.questionIndex==null?null:patch.questionIndex+1,
  before:patch.original,proposed:patch.replacement,reason:patch.reason,
  teacherDecision:'PENDING',reviewType:'pedagogical_candidate_not_approved'});
}
for(const patch of p81.patches){
 const e=catalogue.get(patch.topicId);
 assert.ok(e&&e.skill==='konverzace');
 changes.push({...cue(patch.topicId,patch.language,patch.level),group:'R8_LANGUAGE',
  field:patch.field,station:patch.stationIndex+1,question:patch.questionIndex==null?null:patch.questionIndex+1,
  before:patch.original,proposed:patch.replacement,reason:patch.reason,
  teacherDecision:'PENDING',reviewType:'linguistic_candidate_not_approved'});
}
for(const patch of p7.patches){
 assert.ok(catalogue.get(patch.topicId)?.skill==='cteni');
 const x=data.get(patch.topicId)[patch.language][patch.level];
 const item=x.questions.find(q=>q.id===patch.questionId);
 assert.ok(item&&item.kind==='match','Unresolved Reading correction '+patch.questionId);
 assert.equal(item.q,patch.newQuestion,'Reading question was not integrated as planned');
 changes.push({...cue(patch.topicId,patch.language,patch.level),group:'READING_R7',
  field:'matching',questionId:patch.questionId,
  proposed:patch.newQuestion,
  reason:'Source-anchored matching correction; confirm the private teacher key separately.',
  privateKeyRevalidationRequired:true,teacherDecision:'PENDING',
  reviewType:'private_key_and_content_review'});
}
// A seventeenth Reading change adjusts the German B2 explanation.
const explanation=data.get('rl-email-friend').de.B2.questions.find(q=>q.id==='de-b2-matching-2');
assert.ok(explanation&&explanation.explanation.includes('Auf meinem Sofa ist Platz'));
changes.push({...cue('rl-email-friend','de','B2'),group:'READING_R7',
 field:'explanation',questionId:'de-b2-matching-2',proposed:explanation.explanation,
 reason:'Exact German explanation in candidate; check source and private key for consistency.',
 privateKeyRevalidationRequired:true,teacherDecision:'PENDING',reviewType:'private_key_and_content_review'});
// One narrow Peaky answer correction is already isolated in the R7 candidate.
const peaky=data.get('ll-peaky-no-fighting').C1.gist[1];
assert.equal(peaky.correct,0,'Peaky R7 C1 fix changed');
assert.match(peaky.why,/interruptions undercut/i);
changes.push({...cue('ll-peaky-no-fighting','en','C1'),group:'LISTENING_R7',
 field:'gist',questionId:'C1-gist-2',
 reason:'The R7 candidate changes the first-listening C1 answer after comparison with the dialogue; confirm media context.',
 teacherDecision:'PENDING',reviewType:'media_grounded_semantic_change'});
assert.equal(changes.length,30,'12 Conversation + 17 Reading + 1 Listening expected');
const media=m.entries.filter(x=>x.skill==='poslech').map(e=>({
 ...cue(e.id,'en','B2'),reviewType:'external_media_review',
 teacherDecision:'PENDING',reason:e.id==='ll-peaky-no-fighting'
 ?'Check age suitability: strong language, threats and references to drugs.'
 :e.id==='ll-harrison-ford'?'Check external Facebook media availability on the school network.'
 :'Check external source playback in school browser and on mobile.'
}));
assert.equal(media.length,3);
// Static semantics: 80 missing-sentence tasks are actually hidden by the
// shared reading rendering condition (not an answer disclosure).
let readingVariants=0,hiddenGapCount=0,validatedQuestions=0;
const readingLengths=[],readingByKey=new Map();
for(const e of m.entries.filter(e=>e.skill==='cteni')){
 const d=data.get(e.id);
 const raw=fs.readFileSync(path.join(DEST,e.relative),'utf8');
 assert.ok(raw.includes('original.startsWith(c.gap.sentence)') &&
  raw.includes("const visible=missing?'[…] '"),
  'Reading runtime no longer hides missing sentence: '+e.id);
 for(const lang of LANGS)for(const level of LEVELS){
  readingVariants++;
  const x=d[lang]?.[level];
  assert.ok(x&&Array.isArray(x.questions)&&Array.isArray(x.paragraphs));
  const questionIds=new Set();
  for(const q of x.questions){
   validatedQuestions++;
   assert.ok(q.id&&!questionIds.has(q.id),'Duplicate question ID: '+e.id+'/'+lang+'/'+level);
   questionIds.add(q.id);
   assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length,
    'Unusable Reading answer index: '+q.id);
   for(const ev of q.evidence||[])
    assert.ok(x.paragraphs[ev.p]?.includes(ev.text),'Unsupported evidence: '+q.id);
  }
  const gapTask=x.questions.find(q=>q.kind==='gap');
  if(x.gap){
   hiddenGapCount++;
   assert.ok(gapTask,'Missing gap task: '+e.id+'/'+lang+'/'+level);
   assert.equal(gapTask.choices[gapTask.answer],x.gap.sentence,
    'Missing-sentence choice differs from source: '+e.id+'/'+lang+'/'+level);
   assert.ok(x.paragraphs[x.gap.p].startsWith(x.gap.sentence),
    'Gap may reveal answer in student reader: '+e.id+'/'+lang+'/'+level);
  }else assert.equal(gapTask,undefined,'Gap task without source gap');
  const count=words(x.paragraphs.join(' ')),questions=x.questions.length;
  const row={...cue(e.id,lang,level),words:count,questions,
   wordsPerQuestion:Math.round((count/questions)*10)/10,
   reviewType:'short_reading_editorial_signal'};
  readingLengths.push(row);
  readingByKey.set(e.id+'|'+lang+'|'+level,row);
 }
}
assert.equal(readingVariants,120);assert.equal(hiddenGapCount,80);
// These are triage signals only, not externally established CEFR thresholds.
const shortReadings=readingLengths.filter(x=>x.wordsPerQuestion<13).map(x=>({
 ...x,priority:x.wordsPerQuestion<10?'higher_editorial_attention':'normal_editorial_attention',
 reason:'Low text length relative to number of tasks; verify task feasibility and CEFR level, not an automatic error.'
}));
const repeatedMain=new Map();
for(const e of m.entries.filter(e=>e.skill==='konverzace')){
 const d=data.get(e.id);
 for(const lang of LANGS)for(const level of LEVELS){
  const v=d[lang].levels[level];
  assert.equal(v.stations.length,8);
  for(let n=0;n<v.stations.length;n++){
   const st=v.stations[n];
   for(const [field,arr] of Object.entries({main:[st.main],question:st.questions,
    challenge:[st.challenge],stretch:[st.stretch]})){
    for(const phrase of arr){
     const key=[lang,level,field,phrase.trim()].join('\0');
     if(!repeatedMain.has(key))repeatedMain.set(key,{language:lang,level,field,
      phrase:phrase.trim(),examples:[]});
     repeatedMain.get(key).examples.push({topicId:e.id,station:n+1,url:urlFor(e.id,lang,level)});
    }
   }
  }
 }
}
const repeatedPrompts=[...repeatedMain.values()].filter(row=>
 new Set(row.examples.map(x=>x.topicId)).size>1).map(row=>({
 ...row,reviewType:'possible_reused_topic_prompt',teacherDecision:'PENDING',
 reason:'Identical prompt appears in multiple subjects. Often legitimate at A1; check thematic specificity.'
}));
repeatedPrompts.sort((a,b)=>a.level.localeCompare(b.level)||a.language.localeCompare(b.language));
assert.equal(repeatedPrompts.length,30,'Source-specific cross-topic prompt baseline changed');
const pending={
 strongDecisions:changes.length,mediaReviews:media.length,
 shorterReadingSignals:shortReadings.length,reusedPromptSignals:repeatedPrompts.length
};
const file={
 schemaVersion:1,kind:'R12_CONTENT_TRIAGE_NOT_PEDAGOGICAL_APPROVAL',
 sourceBundleId:v11.bundleId,reviewManifestSha256:sha(fs.readFileSync(path.join(DEST,'R10_REVIEW_MANIFEST.json'))),
 teacherApproval:false,approvedForRelease:false,testModeReady:false,published:false,
 privateTeacherKeysIncluded:false,reviewerConclusionsNotAutomatic:true,
 validated:{topicCount:29,variantCount:642,readingVariants,
  readingQuestionsWithValidKeysAndEvidence:validatedQuestions,
  verifiedReadingGapMasks:hiddenGapCount},
 pending,
 decisions:changes,mediaReviews:media,
 editorialSignals:{shortReadings,repeatedPrompts},
 editorialThresholds:{shortTextWordsPerQuestion:13,higherAttentionWordsPerQuestion:10,
  status:'internal triage signals only; not CEFR validation criteria'},
 sources:sourceHash
};
const esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const row=(cells,header=false)=>'<tr>'+cells.map(c=>'<'+(header?'th':'td')+'>'+c+'</'+(header?'th':'td')+'>').join('')+'</tr>';
const link=r=>'<a href="'+esc(r.url)+'">Otevřít</a>';
const drows=changes.map(x=>row([esc(x.group),esc(x.topicId),
 esc(x.language.toUpperCase()+' '+x.level),esc(x.field),
 esc(x.before||'—'),esc(x.proposed||'—'),link(x)] )).join('\n');
const shortRows=shortReadings.map(x=>row([esc(x.topicId),
 esc(x.language.toUpperCase()+' '+x.level),String(x.words),String(x.questions),
 String(x.wordsPerQuestion),link(x)])).join('\n');
const repRows=repeatedPrompts.map(x=>row([
 esc(x.language.toUpperCase()+' '+x.level),esc(x.phrase),esc(
 [...new Set(x.examples.map(q=>q.topicId))].join(', ')),link(x.examples[0])])).join('\n');
const medRows=media.map(x=>row([esc(x.topicId),esc(x.reason),link(x)])).join('\n');
const html='<!doctype html><html lang="cs"><head><meta charset="utf-8">'+
 '<meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<meta name="robots" content="noindex,nofollow"><title>LSH R12 | Obsahová přejímka</title>'+
 '<style>:root{font:15px/1.5 system-ui;background:#0c1727;color:#eef6ff;color-scheme:dark}'+
 'body{max-width:1450px;margin:auto;padding:clamp(12px,3vw,32px)}'+
 'h1{font-size:clamp(1.6rem,3vw,2.5rem)}h2{margin-top:2.2rem}'+
 '.info{border:1px solid #b59854;background:#24251c;padding:15px;border-radius:12px}'+
 'table{width:100%;border-collapse:collapse;min-width:650px}td,th{padding:10px;'+
 'border-bottom:1px solid #40566c;text-align:left;vertical-align:top}'+
 'th{background:#20344a;position:sticky;top:0}section{overflow-x:auto}'+
 'a{color:#8fe9fb}a:focus{outline:3px solid #eac174}'+
 '.muted{color:#b5c9de}.metrics{display:flex;gap:12px;flex-wrap:wrap}'+
 '.metric{background:#172a40;border-radius:9px;padding:12px;min-width:150px}'+
 'strong.number{font-size:1.4rem;display:block}</style></head><body>'+
 '<header><p>LANGUAGE SKILLS HUB · R12 · PEDAGOGICAL TRIAGE</p>'+
 '<h1>Konkrétní fronta k obsahové přejímce</h1>'+
 '<div class="info"><strong>NEJDE O SCHVÁLENÍ.</strong> Automatické kontroly nepotvrzují jazykovou kvalitu. '+
 'Uvedená upozornění na délku a opakování jsou pouze redakční podněty. '+
 'Soukromé učitelské klíče nejsou přibaleny.</div>'+
 '<p><a href="review.html">Matice 642 variant</a> · <a href="index.html">Všech 29 karet</a></p></header>'+
 '<div class="metrics"><div class="metric"><strong class="number">642</strong>sledovaných variant</div>'+
 '<div class="metric"><strong class="number">'+hiddenGapCount+'</strong>ověřených skrytých vět</div>'+
 '<div class="metric"><strong class="number">'+changes.length+'</strong>obsahových rozhodnutí</div>'+
 '<div class="metric"><strong class="number">'+shortReadings.length+'</strong>kratších čtecích variant</div></div>'+
 '<section><h2>1. Přesné obsahové změny ke schválení ('+changes.length+')</h2>'+
 '<p class="muted">12 Conversation, 17 Reading, 1 Listening. Nález není automatické povolení vydání.</p>'+
 '<table><thead>'+row(['Původ','Téma','Jazyk / CEFR','Položka','Původní','Kandidát','Karta'],true)+'</thead><tbody>'+drows+'</tbody></table></section>'+
 '<section><h2>2. Dostupnost a vhodnost externích poslechů ('+media.length+')</h2>'+
 '<table><thead>'+row(['Karta','Kontrolní úkol','Odkaz'],true)+'</thead><tbody>'+medRows+'</tbody></table></section>'+
 '<section><h2>3. Kratší Reading varianty ('+shortReadings.length+')</h2>'+
 '<p class="muted">Interní filtr &lt; 13 slov textu na otázku. Není to externí normativ CEFR; '+ 
 'posoudit autenticky, včetně obtížnosti úloh.</p>'+
 '<table><thead>'+row(['Téma','Varianta','Slova','Úlohy','Slova/úloha','Karta'],true)+'</thead><tbody>'+shortRows+'</tbody></table></section>'+
 '<section><h2>4. Stejná otázka ve více tématech ('+repeatedPrompts.length+')</h2>'+
 '<p class="muted">Často jde o záměrně jednoduché otázky A1. Doporučuje se pouze kontrola '+ 
 'tematické relevance, nikoli plošné přepsání.</p>'+
 '<table><thead>'+row(['Varianta','Stejná formulace','Témata','Otevřít'],true)+'</thead><tbody>'+repRows+'</tbody></table></section>'+
 '<footer><p>80 z 80 úloh na chybějící větu má správně propojenou větu a '+ 
 'počáteční odstavec; v UI je věta skryta před kontrolou odpovědí. '+ 
 'Výukový obsah, soukromé klíče, původní studentské karty ani main se zde nemění.</p></footer>'+
 '</body></html>';
fs.writeFileSync(path.join(DEST,'R12_CONTENT_TRIAGE.json'),JSON.stringify(file,null,2)+'\n');
fs.writeFileSync(path.join(DEST,'triage.html'),html);
// Improve discoverability in the disposable R10 index (never alter student cards).
const indexPath=path.join(DEST,'index.html');
const beforeIndex=fs.readFileSync(indexPath,'utf8');
assert.ok(beforeIndex.includes('<main>')&&!beforeIndex.includes('triage.html'));
fs.writeFileSync(indexPath,beforeIndex.replace('<main>',
 '<p><a href="triage.html">Obsahová triáž: prioritní pedagogické nálezy a rozhodnutí R12</a></p><main>'));
console.log('PASS R12 content triage: 642 variants, 80 verified masks, '+
 changes.length+' specific decisions, '+media.length+' media checks, '+
 shortReadings.length+' short-readings signals, '+repeatedPrompts.length+' repeated prompt signals. NO APPROVAL');
