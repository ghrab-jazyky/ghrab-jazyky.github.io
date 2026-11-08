#!/usr/bin/env node
/* LSH: generate two source-verifiable, 3-listening UI candidates only.
 * Originals, catalog, media and private teacher keys are never modified.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const out=path.resolve(process.argv[2]||path.join(root,'_qa-listening-r7'));
const sources=[
 {id:'ll-harrison-ford',slug:'harrison-ford',original:'nahledy/poslech/harrison-ford/index.html',blob:'f816dbbbc2d9d2e7fc5b7a4c40d9e7dcfb331dbc'},
 {id:'ll-peaky-no-fighting',slug:'peaky-blinders',original:'nahledy/poslech/peaky-blinders/index.html',blob:'cfda1197882b8107ddce2f80665abd681526efc5'}
];
const sha256=x=>crypto.createHash('sha256').update(x).digest('hex');
const gitBlob=x=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+x.length+'\0'),x])).digest('hex');
function once(text,old,newText,label){assert.equal(text.split(old).length,2,'Non-unique '+label);return text.replace(old,newText);}
function getData(html){const a=html.indexOf('const DATA='),b=html.indexOf(';\n',a);assert.ok(a>=0&&b>a);return html.slice(a,b+1);}
function button(id,label,status){return '<div class="r7-review"><button class="pill primary" type="button" id="'+id+'">'+label+'</button><p id="'+status+'" role="status" aria-live="polite">Not checked yet.</p></div>';}
function instructions(n,text){return '<div class="r7-instruction"><p><strong>Listening '+n+':</strong> '+text+'</p><a href="#watch">▶ Play / replay source</a></div>';}

const CSS_PATCH="\n/* Listening R7 preview – three-pass progression */\n.listening-stage{border-left:4px solid var(--accent)}\n.r7-instruction,.r7-review{display:flex;align-items:center;gap:12px;flex-wrap:wrap;\n padding:12px 15px;margin:12px 0;border:1px solid var(--line);border-radius:14px;background:var(--mint)}\n.r7-instruction p,.r7-review p{margin:0;flex:1;min-width:220px}\n.r7-instruction a{font-weight:700;text-decoration:underline}\n.r7-warning{margin:12px 0;padding:12px 15px;border:2px dashed var(--accent);border-radius:14px}\n@media print{.r7-review,.r7-warning{display:none!important}}\n";
const SCORE_PATCH="\nfunction r7Summary(){\n const s=state(),reviews=s.r7Reviews||{},parts=['first','second','third'],checked=parts.filter(x=>reviews[x]);\n const n=checked.reduce((a,k)=>a+reviews[k].correct,0),done=checked.reduce((a,k)=>a+reviews[k].attempted,0);\n $('scoreNumber').textContent=checked.length?n+' / '+getMax():'— / '+getMax();\n $('scoreLabel').textContent='Listening 1–3 only; optional vocabulary excluded';\n $('scoreDescription').textContent=checked.length===3?\n  'All three listening stages reviewed. Written responses require teacher review.':\n  checked.length+'/3 listening stages reviewed; this is a partial result.';\n const names={first:'First Listening',second:'Second Listening',third:'Third Listening'};\n $('scoreBreakdown').innerHTML=parts.map(k=>'<li>'+names[k]+': '+\n  (reviews[k]?reviews[k].correct+'/'+reviews[k].total+' ('+reviews[k].attempted+' attempted)':'not checked')+'</li>').join('');\n const t=reviews.third;\n if(t)$('reviewSummary').innerHTML='<h3>Written Evidence · teacher review</h3><p>'+\n  t.factRight+'/'+DATA[current].facts.length+' recognised facts; '+t.factReview+\n  ' require checking; '+t.factMissing+' blank; '+t.writtenAnswered+\n  '/'+DATA[current].open.length+' open interpretations submitted. No unknown wording is automatically marked wrong.</p>';\n s.last={correct:n,total:getMax(),attempted:done,factGrades:t?t.factGrades:[],\n   factRight:t?t.factRight:0,factReview:t?t.factReview:0,\n   factMissing:t?t.factMissing:0,writtenAnswered:t?t.writtenAnswered:0};\n}\nfunction r7Check(phase,scroll){\n capture();\n const s=state(),d=DATA[current],U=ui();\n if(!s.r7Reviews)s.r7Reviews={};\n let correct=0,attempted=0,total=0,factRight=0,factReview=0,factMissing=0,writtenAnswered=0;\n const factGrades=[];\n if(phase==='first'||phase==='second'){\n  const prefix=phase==='first'?'g':'d',qs=phase==='first'?d.gist:d.detail;\n  total=qs.length;\n  qs.forEach((q,i)=>{\n   const got=getChoices(prefix,i),empty=Array.isArray(got)?got.length===0:got===null;\n   if(!empty)attempted++;\n   const wanted=Array.isArray(q.correct)?q.correct.slice().sort((a,b)=>a-b):q.correct;\n   const ok=!empty&&(Array.isArray(wanted)?\n    Array.isArray(got)&&got.length===wanted.length&&got.every((v,k)=>v===wanted[k]):got===wanted);\n   if(ok)correct++;\n   const right=(Array.isArray(q.correct)?q.correct:[q.correct]).map(k=>ABC[k]).join(' + ');\n   mark(answerKey(prefix,i),empty?'missing':ok?'ok':'bad',empty?'Not answered.':ok?'Correct. '+q.why:'Review: '+right+'. '+q.why);\n  });\n }else if(phase==='third'){\n  total=d.sequence.length;\n  $('sequenceList').querySelectorAll('.seq-item').forEach((li,i)=>{\n   const ok=s.seqTouched&&s.order[i]===i;if(ok)correct++;\n   li.classList.toggle('right',!!s.seqTouched&&ok);li.classList.toggle('wrong',!!s.seqTouched&&!ok);\n  });\n  if(s.seqTouched)attempted=total;\n  d.facts.forEach((f,i)=>{\n   const v=$('f-'+i).value.trim();let status;\n   if(!v){status='empty';factMissing++;mark('f-'+i,'missing','Not answered. Example: '+f.answer);}\n   else if(factOK(v,f)){status='recognised';factRight++;mark('f-'+i,'tentative',U.factOk+f.answer);}\n   else{status='review';factReview++;mark('f-'+i,'missing',U.factUnknown+f.answer);}\n   factGrades.push({answer:v,status});\n  });\n  d.open.forEach((q,i)=>{\n   const v=$('o-'+i).value.trim();if(v)writtenAnswered++;\n   mark('o-'+i,'missing','Teacher review. Example: '+q.answer+' Criteria: '+q.criteria);\n  });\n }else if(phase==='vocabulary'){\n  total=d.vocab.length;\n  d.vocab.forEach((v,i)=>{\n   const value=$('v-'+i).value,empty=value==='';if(!empty)attempted++;\n   const ok=!empty&&Number(value)===i;if(ok)correct++;\n   mark('v-'+i,empty?'missing':ok?'ok':'bad',\n    empty?'Not answered.':ok?'Correct.':'Correct meaning: '+v.meaning);\n  });\n }else throw Error('Unexpected phase');\n s.r7Reviews[phase]={correct,attempted,total,factGrades,factRight,factReview,factMissing,writtenAnswered};\n s.checked=false;r7Summary();persist();\n const status={first:'firstReview',second:'secondReview',third:'thirdReview',vocabulary:'vocabReview'}[phase];\n $(status).textContent=phase==='third'?\n  correct+'/'+total+' sequence steps correct. Written answers await teacher review.':\n  correct+'/'+total+' correct · '+attempted+' answered'+(phase==='vocabulary'?' (optional)':'');\n if(scroll)$(status).scrollIntoView({behavior:'smooth',block:'center'});\n}\nfunction checkAnswers(scroll){\n for(const p of ['first','second','third'])r7Check(p,false);\n if(DATA[current].vocab.some((_,i)=>$('v-'+i).value!==''))r7Check('vocabulary',false);\n state().checked=true;r7Summary();persist();\n if(scroll)$('finish').scrollIntoView({behavior:'smooth',block:'start'});\n}\n";
const INVALIDATE_PATCH="\nfunction invalidate(){\n const s=state();\n if(s.checked||(s.r7Reviews&&Object.keys(s.r7Reviews).length)){\n  s.checked=false;s.last=null;s.r7Reviews={};\n  $('scoreNumber').textContent='— / '+getMax();\n  $('scoreDescription').textContent='Answers changed; check the listening stage again.';\n  $('scoreBreakdown').innerHTML='';\n  document.querySelectorAll('.feedback').forEach(x=>{x.className='feedback';x.textContent='';});\n  document.querySelectorAll('.seq-item').forEach(x=>x.classList.remove('right','wrong'));\n  for(const id of ['firstReview','secondReview','thirdReview','vocabReview'])$(id).textContent='Not checked yet.';\n }\n updateProgress();\n}\n";

function migrate(html){
 let s=once(html,'</style>',CSS_PATCH+'</style>','style');
 s=once(s,'<main class="content">','<main class="content"><div role="note" class="r7-warning">R7 PREVIEW – not approved for classroom release. Original sources unchanged.</div>','preview marker');
 s=once(s,'<section class="section" id="gist">','<section class="section listening-stage" id="gist">','gist section');
 s=once(s,'<div id="gistTasks"></div></section>',
  instructions(1,'Listen once for the main idea, situation and mood.')+
  '<div id="gistTasks"></div>'+button('checkFirstBtn','✓ Check First Listening','firstReview')+'</section>','gist body');
 const start=s.indexOf('<section class="section" id="detail">'),stop=s.indexOf('<section class="section" id="language">',start);
 assert.ok(start>=0&&stop>start);
 const orig=s.slice(start,stop),match=orig.match(/<h3 class="small-heading">Part B (?:&middot;|·) Written evidence<\/h3>/i);
 assert.ok(match,'Missing written-evidence split');
 const pivot=orig.indexOf(match[0]);let second=orig.slice(0,pivot),third=orig.slice(pivot).replace(/<\/section>\s*$/,'');
 assert.ok(second.includes('id="detailTasks"')&&!second.includes('id="factsTasks"'));
 assert.ok(third.includes('id="factsTasks"')&&third.includes('id="openTasks"')&&third.includes('id="sequenceList"'));
 second=once(second,'<section class="section" id="detail">','<section class="section listening-stage" id="detail">','second section');
 second=second.replace(/03 (?:&middot;|·) SECOND LISTEN\b/,'03 · SECOND LISTENING');
 second=second.replace(/<h2>Listen (?:closer|and interpret)<\/h2>/i,'<h2>Listen and Interpret</h2>');
 second=second.replace(/<h3 class="small-heading">Part A (?:&middot;|·) Detailed comprehension<\/h3>/i,'');
 second=once(second,'<div id="detailTasks"></div>',instructions(2,'Replay and focus on details and the intended meaning.')+
  '<div id="detailTasks"></div>','detail task');
 second+=button('checkSecondBtn','✓ Check Second Listening','secondReview')+'</section>\n';
 third='<section class="section listening-stage" id="evidence"><div class="section-number">04 · THIRD LISTENING</div>'+
  '<h2>Listen, Write and Reconstruct</h2><p class="section-lead">Find evidence and reconstruct the order of ideas.</p>'+
  instructions(3,'Listen for facts, evidence and the structure of the source.')+
  third.replace(/<h3 class="small-heading">Part B (?:&middot;|·) Written evidence<\/h3>/i,'<h3 class="small-heading">Part A · Written Evidence</h3>')
  .replace(/<h3 class="small-heading">Part C (?:&middot;|·) Reconstruct the (speech|scene)<\/h3>/i,
   (_,kind)=>'<h3 class="small-heading">Part B · Reconstruct the '+(kind==='speech'?'Speech':'Scene')+'</h3>')+
  button('checkThirdBtn','✓ Check Third Listening','thirdReview')+'</section>\n';
 s=s.slice(0,start)+second+third+s.slice(stop);
 const a=s.indexOf('<section class="section" id="language">'),b=s.indexOf('<section class="section" id="thinking">',a);
 assert.ok(a>=0&&b>a);
 let section=s.slice(a,b);
 section=section.replace(/04 (?:&middot;|·) LANGUAGE FOCUS/,'05 · OPTIONAL · VOCABULARY');
 section=once(section,'<div id="vocabTasks"></div>',
  '<p class="section-lead">Optional practice; not included in Listening 1–3 score.</p><div id="vocabTasks"></div>','vocab body');
 section=section.replace(/<\/section>\s*$/,button('checkVocabBtn','✓ Check Optional Vocabulary','vocabReview')+'</section>\n');
 s=s.slice(0,a)+section+s.slice(b);
 s=s.replace(/05 (?:&middot;|·) AFTER LISTENING/,'06 · AFTER LISTENING');
 s=s.replace(/06 (?:&middot;|·) REVIEW/,'07 · OVERALL REVIEW');
 s=s.replace('CLOSED-QUESTION SCORE (AUTOMATIC)','LISTENING 1–3 · AUTOMATICALLY MARKED CORE TASKS');
 s=s.replace('Gist + detail + sequence + vocabulary','First Listening + Second Listening + sequence');
 s=s.replace(/(?:&#10003;|✓) Check answers/,'✓ Check All Listening Tasks');
 s=once(s,
  "function getMax(){const d=DATA[current];return d.gist.length+d.detail.length+d.sequence.length+d.vocab.length;}",
  "function getMax(){const d=DATA[current];return d.gist.length+d.detail.length+d.sequence.length;}",'getMax');
 const nA=s.indexOf('function numCompleted(){'),nB=s.indexOf('function updateProgress(){',nA);
 assert.ok(nA>=0&&nB>nA);
 const oldNum=s.slice(nA,nB),newNum=oldNum.replace(/d\.vocab\.forEach\(\(_,i\)=>\{if\(\$\('v-'\+i\)\.value\)n\+\+;\}\);/,'');
 assert.notEqual(oldNum,newNum,'Vocab progress not removed');
 s=s.slice(0,nA)+newNum+s.slice(nB);
 const iA=s.indexOf('function invalidate(){'),iB=s.indexOf('function isScored(t){',iA);
 assert.ok(iA>=0&&iB>iA);
 s=s.slice(0,iA)+INVALIDATE_PATCH+'\n'+s.slice(iB);
 const cA=s.indexOf('function checkAnswers(scroll){'),cB=s.indexOf('function createLevelPills(){',cA);
 assert.ok(cA>=0&&cB>cA);
 s=s.slice(0,cA)+SCORE_PATCH+'\n'+s.slice(cB);
 const event="$('checkBtn').addEventListener('click',()=>checkAnswers(true));";
 s=once(s,event,
  "$('checkFirstBtn').addEventListener('click',()=>r7Check('first',true));\n"+
  "$('checkSecondBtn').addEventListener('click',()=>r7Check('second',true));\n"+
  "$('checkThirdBtn').addEventListener('click',()=>r7Check('third',true));\n"+
  "$('checkVocabBtn').addEventListener('click',()=>r7Check('vocabulary',true));\n"+event,'review events');
 s=s.replace('Closed items: first listening, detail, order, vocabulary',
  'Core: First Listening + Second Listening + sequence. Vocabulary optional.');
 s=s.replace('SCORE - CLOSED TASKS','SCORE - LISTENING 1–3 CORE');
 return s;
}
const manifest={schemaVersion:1,kind:'LISTENING_R7_THREE_PASS_CANDIDATES',reference:'Matthew McConaughey v3',
 teacherApproval:false,releaseApproved:false,mediaVerified:false,originalSourcesUnchanged:true,cards:[]};
fs.mkdirSync(out,{recursive:true});
for(const f of sources){
 const original=fs.readFileSync(path.join(root,f.original));
 assert.equal(gitBlob(original),f.blob,'Original changed '+f.id);
 const text=original.toString('utf8'),candidate=migrate(text);
 assert.equal(getData(text),getData(candidate),'Lesson data modified '+f.id);
 const scripts=[...candidate.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 assert.equal(scripts.length,1,'Expected one JS program');
 new vm.Script(scripts[0][1],{filename:f.slug+'.html'});
 for(const id of ['gist','detail','evidence','language','before','finish','gistTasks','detailTasks',
  'factsTasks','openTasks','sequenceList','vocabTasks','checkFirstBtn','checkSecondBtn','checkThirdBtn',
  'checkVocabBtn','firstReview','secondReview','thirdReview','vocabReview']){
  assert.equal([...candidate.matchAll(new RegExp('id="'+id+'"','g'))].length,1,'DOM id '+id);
 }
 let last=-1;for(const id of ['gist','detail','evidence','language','thinking','finish']){
  const at=candidate.indexOf('id="'+id+'"');assert.ok(at>last,'Stage order '+id);last=at;
 }
 const name=f.slug+'_R7_THREE_LISTENINGS_CANDIDATE.html';
 fs.writeFileSync(path.join(out,name),candidate);
 manifest.cards.push({id:f.id,original:f.original,originalGitBlob:f.blob,
   candidate:name,sourceSHA256:sha256(original),candidateSHA256:sha256(Buffer.from(candidate)),
   levels:6,teacherApproval:false,mediaVerified:false});
}
assert.equal(manifest.cards.length,2);
fs.writeFileSync(path.join(out,'LISTENING_R7_UI_MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(out,'README.md'),[
 '# Listening Lab R7 – kandidáti rozděleného třífázového UI','',
 'Opravené kopie nejsou publikovány. Původní HTML obou karet zůstává beze změn.',
 'First = gist; Second = detail; Third = Written Evidence + Reconstruction.',
 'Každá fáze a nepovinná slovní zásoba mají samostatnou kontrolu. Vocabulary se do hlavního skóre nepočítá.',
 'Ověřeno šest nezměněných datových úrovní a syntaktická správnost JS.',
 'Není ověřeno reálné přehrávání videa, pedagogická správnost, Peaky věková vhodnost, ani fyzická mobilní UAT.',''
].join('\n'));
console.log('PASS LISTENING R7 3-PASS UI: 2 protected HTML sources, 12 unmodified CEFR data variants, three stages and separate review controls; NO DEPLOY');
console.log('R7 UI CANDIDATES:',JSON.stringify(manifest.cards.map(x=>({id:x.id,sha256:x.candidateSHA256}))));
