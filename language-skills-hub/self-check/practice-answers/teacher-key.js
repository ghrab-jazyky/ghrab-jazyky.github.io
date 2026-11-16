/* Public static answer keys for original Reading and Listening practice cards.
 * Practice-only view; no student attempt archive or test-answer endpoint. */
(function(host){
'use strict';
const L='language-skills-hub-practice-key-v1';
const $=id=>host.document&&host.document.getElementById(id);
const text=value=>String(value===undefined||value===null?'':value);
function need(condition,message){if(!condition)throw new Error(message)}
function item(question,answer,note=''){
 return {question:text(question).trim(),answer:text(answer).trim(),note:text(note).trim()};
}
function group(title,items,type='answers'){
 return {title,items:items.filter(x=>x.question&&x.answer),type};
}
function buildReading(variant,entry,lang,level){
 need(variant&&Array.isArray(variant.tabs)&&Array.isArray(variant.questions),'Chybná varianta Reading.');
 need(entry&&entry.skill==='cteni','Téma není Reading Lab.');
 const groups=[];
 if(typeof variant.pre==='string'&&variant.pre.trim())
  groups.push(group('Před čtením – diskuse',[item(variant.pre,
   'Otevřená aktivita – nemá jedinou správnou odpověď.','Posouzení vede učitel.')],'discussion'));
 for(const tab of variant.tabs){
  const questions=variant.questions.filter(q=>q.tab===tab.id).map(q=>{
   need(Array.isArray(q.choices)&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length,
    'Chybějící správná odpověď Reading: '+q.id);
   return item(q.q,q.choices[q.answer],q.explanation||'');
  });
  if(questions.length)groups.push(group(tab.title,questions));
 }
 if(typeof variant.open==='string'&&variant.open.trim())
  groups.push(group('Otevřená otázka',[item(variant.open,
   'Individuální odpověď – původní karta neposkytuje jediný správný výsledek.',
   'Posouzení učitelem podle věcné opory v textu; automaticky nehodnoceno.')],'discussion'));
 return {kind:L,skill:'reading',topicId:entry.id,topic:entry.title,
  language:lang,level,groups,mode:'practice'};
}
function buildListening(variant,entry,lang,level){
 need(variant&&Array.isArray(variant.gist)&&Array.isArray(variant.detail)&&
  Array.isArray(variant.sequence)&&Array.isArray(variant.facts)&&
  Array.isArray(variant.open),'Chybná varianta Listening.');
 need(entry&&entry.skill==='poslech'&&lang==='en','Téma není anglický Listening Lab.');
 // NEWS practice displays its own pre-/post-listening prompts, not test-only
 // reference writing questions. Keep older cards' teacher keys unchanged.
 const newsStudentPractice=entry.id==='ll-how-to-choose-your-news';
 const groups=[];
 if(Array.isArray(variant.before)&&variant.before.length){
  groups.push(group('Před poslechem – diskuse',variant.before.map((q,i)=>{
   const help=Array.isArray(variant.beforeHelp)?variant.beforeHelp[i]:null;
   const explanation=help&&typeof help.explain==='string'?help.explain:
    'Vlastní odpověď – bez jediného správného řešení.';
   return item(q,explanation,help&&help.starter?'Začátek odpovědi: '+help.starter:'');
  }),'discussion'));
 }
 if(typeof variant.prediction==='string'&&variant.prediction.trim())
  groups.push(group('Předpověď před poslechem',[item(variant.prediction,
   'Osobní předpověď – správnost nelze stanovit před poslechem.')],'discussion'));
 for(const [field,label] of [['gist','First Listening – hlavní sdělení'],
    ['detail','Listen and Interpret – detailní porozumění']]){
  groups.push(group(label,variant[field].map((q,i)=>{
   const answers=Array.isArray(q.correct)?q.correct:[q.correct];
   need(answers.every(n=>Number.isInteger(n)&&n>=0&&n<q.options.length),
    'Chybný odpovědní klíč Listening: '+field+' '+i);
   return item(q.title,answers.map(n=>q.options[n]).join(' / '),q.why||'');
  })));
 }
 groups.push(group('Reconstruction – správné pořadí',variant.sequence.map((sentence,i)=>
   item('Pozice '+(i+1),sentence))));
 if(variant.matching?.items.length)groups.push(group('Matching – explanations',
  variant.matching.items.map(q=>item(q.title,variant.matching.options[q.correct],q.why||''))));
 if(Array.isArray(variant.vocab)&&variant.vocab.length)
  groups.push(group('Vocabulary – významy',variant.vocab.map(v=>
   item(v.term,v.meaning))));
 groups.push(group('Factual questions – referenční řešení',variant.facts.map(v=>
  item(v.title,v.answer,v.criteria||''))));
 if(!newsStudentPractice)groups.push(group('Open questions – vzorové odpovědi',variant.open.map(v=>
  item(v.title,v.answer,v.criteria?
   'Orientační kritérium původní karty: '+v.criteria+
   ' Alternativní věcně doložená odpověď může být správná.':
   'Vzorová odpověď není jediným přípustným řešením.')),'discussion'));
 if(Array.isArray(variant.talk)&&variant.talk.length)
  groups.push(group('Speaking follow-up – diskuse',variant.talk.map((q,i)=>{
   const help=Array.isArray(variant.talkHelp)?variant.talkHelp[i]:null;
   return item(q,help&&help.explain?help.explain:
    'Otevřená diskuse – žádná jediná správná odpověď.',
    help&&help.starter?'Začátek odpovědi: '+help.starter:'');
  }),'discussion'));
 if(Array.isArray(variant.challenge)&&variant.challenge.length)
  groups.push(group('Challenge – otevřené úkoly',variant.challenge.map(q=>
   item(typeof q==='string'?q:q.title||q.prompt,
    'Otevřená výzva – učitelské posouzení, bez automatického klíče.')),'discussion'));
 return {kind:L,skill:'listening',topicId:entry.id,topic:entry.title,
  language:lang,level,groups:groups.filter(g=>g.items.length>0),mode:'practice'};
}

/* R51: Listening TEST uses the same closed cloze answer bank as
 * ListeningCore.assessAuto, not the separate open-ended practice facts. */
/* R69: PRACTICE and TEST are different authored listening banks.
 * The shared teacher key must display the questions students actually practise.
 * Never substitute the TEST variant in PRACTICE mode for ll-conlangs. */
function conlangsPracticeVariant(data,level,testVariant){
 need(data&&data.id==='ll-conlangs'&&data.practiceVariants,
  'R69 independent practice data missing.');
 const bank=data.practiceVariants[level];
 need(bank&&Array.isArray(bank.questionBank)&&bank.questionBank.length===17&&
  Array.isArray(bank.matchingBank)&&bank.matchingBank.length===7,
  'R69 incomplete practice bank.');
 const coded=['TRUE','FALSE','NOT STATED'];
 const mc=bank.questionBank.filter(q=>q.type==='mc');
 const tns=bank.questionBank.filter(q=>q.type==='tns');
 const mat=bank.questionBank.filter(q=>q.type==='match');
 need(mc.length===6&&tns.length===6&&mat.length===5,'R69 invalid practice task count.');
 const options=bank.matchingBank.map(x=>x[1]);
 const gist=mc.map(q=>({id:q.id,title:q.question,type:'single',options:q.options,
  correct:q.correct.charCodeAt(0)-65,why:q.explanation,evidence:q.evidence}));
 const detail=tns.map(q=>({id:q.id,title:q.question,type:'single',options:coded,
  correct:coded.indexOf(q.correct),why:q.explanation,evidence:q.evidence}));
 const matching={options,items:mat.map(q=>({id:q.id,title:q.question,
  correct:q.correct.charCodeAt(0)-65,why:q.explanation,evidence:q.evidence}))};
 return {...testVariant,gist,detail,matching};
}

function newsPracticeVariant(data,level,testVariant){
 need(data&&data.id==='ll-how-to-choose-your-news'&&data.practiceVariants,
  'E3 News independent practice data missing.');
 const bank=data.practiceVariants[level];
 need(bank&&Array.isArray(bank.questionBank)&&bank.questionBank.length===17&&
  Array.isArray(bank.matchingBank)&&bank.matchingBank.length===7,
  'E3 News incomplete practice bank.');
 const coded=['TRUE','FALSE','NOT STATED'];
 const mc=bank.questionBank.filter(q=>q.type==='mc');
 const tns=bank.questionBank.filter(q=>q.type==='tns');
 const mat=bank.questionBank.filter(q=>q.type==='match');
 need(mc.length===6&&tns.length===6&&mat.length===5,'E3 News invalid practice task count.');
 const scaffold=data.practice&&data.practice[level];
 need(scaffold&&Array.isArray(scaffold.pre)&&scaffold.pre.length>0&&
  Array.isArray(scaffold.after)&&scaffold.after.length>0&&
  Array.isArray(scaffold.vocabulary)&&scaffold.vocabulary.length>0&&
  Array.isArray(scaffold.sequence)&&scaffold.sequence.length>=4&&scaffold.sequence.length<=7&&
  Array.isArray(scaffold.challenge)&&scaffold.challenge.length===(level==='C1'||level==='C2'?2:0),
  'E9 News practice sequence/challenge scaffolding missing at '+level);
 const options=bank.matchingBank.map(x=>x[1]);
 const gist=mc.map(q=>({id:q.id,title:q.question,type:'single',options:q.options,
  correct:q.correct.charCodeAt(0)-65,why:q.explanation,evidence:q.evidence}));
 const detail=tns.map(q=>({id:q.id,title:q.question,type:'single',options:coded,
  correct:coded.indexOf(q.correct),why:q.explanation,evidence:q.evidence}));
 const matching={options,items:mat.map(q=>({id:q.id,title:q.question,
  correct:q.correct.charCodeAt(0)-65,why:q.explanation,evidence:q.evidence}))};
 // Use exactly the prompts shown in NEWS student practice. The TEST source's
 // separate prediction/open items must not leak into this practice key.
 return {...testVariant,gist,detail,matching,
  before:[...scaffold.pre],prediction:'',talk:[...scaffold.after],
  vocab:scaffold.vocabulary.map(v=>({...v})),
  sequence:[...scaffold.sequence],challenge:[...scaffold.challenge],
  beforeHelp:[],talkHelp:[]};
}

function validate(model){
 need(model&&model.kind===L&&['reading','listening'].includes(model.skill)&&
  model.mode==='practice'&&
  /^[a-z]{2}$/.test(model.language)&&/^(A1|A2|B1|B2|C1|C2)$/.test(model.level)&&
  Array.isArray(model.groups)&&model.groups.length>=1&&model.groups.length<40,
  'Neplatný učitelský klíč.');
 need(model.groups.every(g=>g.title&&Array.isArray(g.items)&&g.items.length>0&&
  g.items.every(x=>x.question&&x.answer)),'Neúplný učitelský klíč.');
 return model;
}
function renderPages(model,documentRef,logo){
 validate(model);
 need(documentRef&&logo&&logo.naturalWidth===384&&logo.naturalHeight===384,
  'Chybí původní školní logo.');
 const W=595,H=842,SCALE=2,M=43,R=W-M,BOTTOM=793;
 const canvas=documentRef.createElement('canvas');
 canvas.width=W*SCALE;canvas.height=H*SCALE;
 const ctx=canvas.getContext('2d');
 need(ctx&&typeof canvas.toDataURL==='function','Prohlížeč neumí vytvořit PDF.');
 ctx.scale(SCALE,SCALE);
 let y=0,page=0;
 const images=[];
 const font=(size=10,weight=400)=>{ctx.font=weight+' '+size+'px Arial, sans-serif'};
 const paint=(s,size=10,weight=400,color='#203246')=>{
  font(size,weight);ctx.fillStyle=color;ctx.fillText(s,M,y+size);
 };
 function wrap(value,size=10,weight=400){
  font(size,weight);
  const lines=[];
  for(const paragraph of text(value).split(/\r?\n/)){
   if(!paragraph.trim()){lines.push('');continue}
   let line='';
   for(const word of paragraph.trim().split(/\s+/)){
    const attempt=line?line+' '+word:word;
    if(ctx.measureText(attempt).width<=R-M){line=attempt;continue}
    if(line){lines.push(line);line=''}
    if(ctx.measureText(word).width<=R-M){line=word;continue}
    let part='';
    for(const c of word){
     if(part&&ctx.measureText(part+c).width>R-M){lines.push(part);part=''}
     part+=c;
    }
    line=part;
   }
   lines.push(line);
  }
  return lines;
 }
 function footer(){
  ctx.fillStyle='#dee6ef';ctx.fillRect(M,811,R-M,1);
  font(8);ctx.fillStyle='#5b6a7b';
  ctx.fillText('Klíč k procvičování · veřejný učitelský podklad',M,828);
  ctx.fillText(String(page),R-18,828);
 }
 function flush(){
  footer();
  const data=canvas.toDataURL('image/jpeg',.88);
  need(data.startsWith('data:image/jpeg;base64,'),'Chyba při kódování strany PDF.');
  const binary=atob(data.slice(data.indexOf(',')+1));
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  images.push(bytes);
 }
 function newPage(){
  if(page)flush();
  page++;y=83;ctx.fillStyle='white';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#193a56';ctx.fillRect(0,0,W,9);
  ctx.drawImage(logo,M-5,13,55,55);
  font(11,700);ctx.fillStyle='#244965';
  ctx.fillText('Gymnázium, Ostrava-Hrabůvka',M+63,34);
  font(9);ctx.fillText('LANGUAGE SKILLS HUB  |  KLÍČ PROCVIČOVÁNÍ',M+63,50);
 }
 function reserve(height){if(y+height>BOTTOM)newPage()}
 function paragraph(value,size=10,weight=400,color='#203246',leading=14,after=5){
  for(const line of wrap(value,size,weight)){
   reserve(leading);
   paint(line,size,weight,color);
   y+=leading;
  }
  y+=after;
 }
 newPage();
 paragraph('UČITELSKÝ KLÍČ · '+(model.skill==='reading'?'READING LAB':'LISTENING LAB')+
  ' · PROCVIČOVÁNÍ',
  15,700,'#183a56',22,7);
 paragraph(model.topic,13,700,'#203246',18,5);
 paragraph('Jazyk: '+model.language.toUpperCase()+'   Úroveň: '+model.level,10,700,'#4d6377',15,8);
 paragraph('Klíč k PROCVIČOVACÍ kartě; část úloh se může překrývat s místním testem. Neobsahuje výsledky studentů.',
  9,400,'#8e501f',13,14);
 for(const [gi,g] of model.groups.entries()){
  reserve(43);
  ctx.fillStyle='#e7eff6';ctx.fillRect(M,y,R-M,1);y+=12;
  paragraph((gi+1)+'. '+g.title,12,700,'#193c59',17,5);
  if(g.type==='discussion')paragraph('Otevřené úlohy: odpovědi jsou příklady nebo doporučení.',
   9,400,'#6b5b4c',13,8);
  for(const [i,x] of g.items.entries()){
   reserve(33);
   paragraph((i+1)+') '+x.question,10.3,700,'#203246',15,2);
   paragraph('Řešení: '+x.answer,10,400,'#205b49',14,3);
   if(x.note)paragraph(x.note,9,400,'#587084',13,4);
   y+=5;
  }
  y+=7;
 }
 flush();
 return images;
}
async function download(model,doc){
 validate(model);
 need(host.LSHPdfReport&&doc,'Modul PDF není načten.');
 const logo=await host.LSHPdfReport.loadSchoolLogo(doc);
 const pdf=host.LSHPdfReport.pdfBytes(renderPages(model,doc,logo));
 const url=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));
 const name='lsh-vysledky-procvicovani-'+
  model.topicId+'-'+model.language+'-'+model.level.toLowerCase()+'.pdf';
 const a=doc.createElement('a');a.href=url;a.download=name;a.hidden=true;
 doc.body.appendChild(a);
 try{a.click()}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
 return name;
}
/* R52: build-time snapshot of the ten public teacher-key cards. Keeping
 * it here means the page never needs to fetch the full catalog at startup.
 * CI verifies exact parity with data/cards.json on every change. */
const KEY_ENTRIES=Object.freeze([
 {
  "id": "rl-asteroids",
  "skill": "cteni",
  "title": "Asteroids",
  "languages": [
   "en",
   "es",
   "de",
   "fr"
  ],
  "levels": [
   "A1",
   "A2",
   "B1",
   "B2",
   "C1",
   "C2"
  ],
  "relative": "cteni/asteroids/index.html",
  "lockSource": null
 },
 {
  "id": "ll-matthew-oscars",
  "skill": "poslech",
  "title": "Matthew McConaughey — Oscars 2014",
  "languages": [
   "en"
  ],
  "levels": [
   "A1",
   "A2",
   "B1",
   "B2",
   "C1",
   "C2"
  ],
  "relative": "poslech/matthew-oscars/index.html",
  "lockSource": null
 },
 {
  "id": "ll-harrison-ford",
  "skill": "poslech",
  "title": "Harrison Ford — Life Achievement Speech",
  "languages": [
   "en"
  ],
  "levels": [
   "A1",
   "A2",
   "B1",
   "B2",
   "C1",
   "C2"
  ],
  "relative": "poslech/harrison-ford/index.html",
  "lockSource": "r11/variant-copies/ll-harrison-ford.html"
 },
 {
  "id": "ll-peaky-no-fighting",
  "skill": "poslech",
  "title": "Peaky Blinders — No Fighting",
  "languages": [
   "en"
  ],
  "levels": [
   "A1",
   "A2",
   "B1",
   "B2",
   "C1",
   "C2"
  ],
  "relative": "poslech/peaky-no-fighting/index.html",
  "lockSource": "r11/variant-copies/ll-peaky-no-fighting.html"
 },
 {
  "id": "rl-can-mistakes",
  "skill": "cteni",
  "title": "Can Mistakes Help Us Learn?",
  "languages": [
   "en",
   "es",
   "de",
   "fr"
  ],
  "levels": [
   "A1",
   "A2",
   "B1",
   "B2",
   "C1",
   "C2"
  ],
  "relative": "cteni/can-mistakes/index.html",
  "lockSource": null
 },
 {
  "id": "rl-plastic-ocean",
  "skill": "cteni",
  "title": "Plastic in Our World (Plastic Ocean)",
  "languages": [
   "en",
   "es",
   "de",
   "fr"
  ],
  "levels": [
   "A1",
   "A2",
   "B1",
   "B2",
   "C1",
   "C2"
  ],
  "relative": "cteni/plastic-ocean/index.html",
  "lockSource": null
 },
 {
  "id": "rl-email-friend",
  "skill": "cteni",
  "title": "An Email from a Friend",
  "languages": [
   "en",
   "es",
   "de",
   "fr"
  ],
  "levels": [
   "A1",
   "A2",
   "B1",
   "B2",
   "C1",
   "C2"
  ],
  "relative": "cteni/email-friend/index.html",
  "lockSource": "r11/variant-copies/rl-email-friend.html"
 },
 {
  "id": "rl-instant-messages",
  "skill": "cteni",
  "title": "Instant Messages",
  "languages": [
   "en",
   "es",
   "de",
   "fr"
  ],
  "levels": [
   "A1",
   "A2",
   "B1",
   "B2",
   "C1",
   "C2"
  ],
  "relative": "cteni/instant-messages/index.html",
  "lockSource": "r11/variant-copies/rl-instant-messages.html"
 },
 {
  "id": "ll-sad",
  "skill": "poslech",
  "title": "Seasonal Affective Disorder – Winter got you feeling down?",
  "languages": [
    "en"
  ],
  "levels": [
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2"
  ],
  "relative": "poslech/sad/index.html",
  "lockSource": null
},
 {
   "id": "ll-conlangs",
   "skill": "poslech",
   "title": "Are Elvish, Klingon, Dothraki and Na’vi real languages?",
   "languages": [
     "en"
   ],
   "levels": [
     "A1",
     "A2",
     "B1",
     "B2",
     "C1",
     "C2"
   ],
   "relative": "poslech/conlangs/index.html",
   "lockSource": null
 },
 {
   "id": "ll-how-to-choose-your-news",
   "skill": "poslech",
   "title": "How to Choose Your News",
   "languages": [
     "en"
   ],
   "levels": [
     "A1",
     "A2",
     "B1",
     "B2",
     "C1",
     "C2"
   ],
   "relative": "poslech/how-to-choose-your-news/index.html",
   "lockSource": null
 }

].map(e=>Object.freeze({...e,
 languages:Object.freeze(e.languages),levels:Object.freeze(e.levels)})));
const api=Object.freeze({buildReading,buildListening,conlangsPracticeVariant,newsPracticeVariant,
 validate,renderPages,download,keyEntries:KEY_ENTRIES});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
host.LSHPracticeAnswers=api;
if(!host.document||!$('practiceKeyApp'))return;
const read=host.LSHReadingCore,listen=host.LSHListeningCore,qs=new URLSearchParams(host.location.search);
let selected=null,serial=0,current=null,sourceCache=null;
const el=(tag,textValue)=>{const node=host.document.createElement(tag);node.textContent=textValue;return node};
function option(value,label){const node=el('option',label);node.value=value;return node}
function fill(id,opts,preferred){
 const select=$(id);select.replaceChildren(...opts.map(x=>option(x[0],x[1])));
 if(opts.some(x=>x[0]===preferred))select.value=preferred;
}
function entry(){return selected}
function configure(e){
 const lab=e.skill==='cteni'?'Reading Lab':'Listening Lab';
 $('labName').textContent=lab;
 $('topicTitle').textContent=e.title;
 $('topicTitle').dataset.topicId=e.id;
 host.document.title='VÝSLEDKY · '+e.title+' | '+lab;
 const names={en:'English (EN)',es:'Español (ES)',de:'Deutsch (DE)',fr:'Français (FR)'};
 const langs=e.languages.map(l=>[l,names[l]||l]);
 fill('language',e.languages.length===1?langs:[['','Vyber jazyk'],...langs],qs.get('lang'));
 fill('level',[['','Vyber úroveň A1–C2'],...e.levels.map(x=>[x,x])],qs.get('level'));
 const single=e.languages.length===1;
 $('languageSelectWrap').hidden=single;
 $('languageFixedWrap').hidden=!single;
 if(single)$('languageFixed').textContent=names[e.languages[0]]||e.languages[0];
 const back=new URL('../../index.html',host.location.href);
 back.searchParams.set('skill',e.skill);
 $('backToCatalog').href=back.href;
}
function setModeUI(){
 $('modeHelp').textContent='PROCVIČOVÁNÍ: klíč do hodiny včetně diskusí, slovní zásoby a vzorových odpovědí.';
 $('keyIntro').textContent='Správná řešení procvičovací varianty vybrané karty včetně vysvětlení a dostupných vzorových odpovědí.';
 $('downloadPdf').textContent='Stáhnout klíč k procvičování (PDF)';
}
function line(label,value,cls){
 const p=el('p',value);if(cls)p.className=cls;
 if(label){const strong=el('strong',label+': ');p.prepend(strong)}
 return p;
}
function renderPreview(model){
 const mount=$('answerPreview');mount.replaceChildren();
 const modeTitle=el('p','PROCVIČOVACÍ VERZE · SPRÁVNÁ ŘEŠENÍ');modeTitle.className='preview-mode';
 const h=el('h2',model.topic+' · '+model.language.toUpperCase()+' '+model.level);
 mount.append(modeTitle,h);
 for(const g of model.groups){
  const box=el('section','');box.className='key-group';
  box.appendChild(el('h3',g.title));
  if(g.type==='discussion')box.appendChild(line('', 'Otevřená aktivita – odpovědi mohou být individuální.','key-note'));
  for(const [i,x] of g.items.entries()){
   const row=el('article','');row.className='key-item';
   row.appendChild(line('',(i+1)+'. '+x.question,'key-question'));
   row.appendChild(line('Řešení',x.answer,'key-answer'));
   if(x.note)row.appendChild(line('',x.note,'key-note'));
   box.appendChild(row);
  }
  mount.appendChild(box);
 }
}
/* R52: network failures must never masquerade as an invalid topic or leave
 * blank controls. Retry transient fetch failures, but reject unexpected URLs. */
async function loadSourceWithRetry(source){
 const expected=new URL('../../'+source,host.location.href);
 need(expected.origin===host.location.origin,'Nesprávný původ zdroje.');
 let lastError=null;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const resp=await fetch(expected.href,{credentials:'omit',cache:'no-store',redirect:'follow'});
   need(resp.ok,'Zdroj karty není dostupný (HTTP '+resp.status+').');
   const finalURL=new URL(resp.url);
   need(finalURL.origin===expected.origin&&finalURL.pathname===expected.pathname,
    'Zdroj karty byl přesměrován mimo povolenou cestu.');
   return await resp.text();
  }catch(error){
   lastError=error;
   if(error.message&&(/HTTP [0-9]{3}/.test(error.message)||
     error.message.includes('přesměrován')))break;
   if(attempt<2)await new Promise(resolve=>host.setTimeout(resolve,250*(attempt+1)));
  }
 }
 throw new Error('Zdroj karty se nepodařilo načíst. Zkontroluj připojení a zkus to znovu. '+
  (lastError&&lastError.message||'Chyba sítě.'));
}
async function refresh(){
 const id=++serial;current=null;
 $('retryLoad').hidden=true;
 $('downloadPdf').disabled=true;$('status').textContent='Načítám správná řešení pro vybranou variantu…';
 $('answerPreview').replaceChildren();
 const e=entry();if(!e)return;
 const lang=$('language').value,level=$('level').value;
 if(!e.languages.includes(lang)||!e.levels.includes(level)){
  const missing=[];
  if(!e.languages.includes(lang))missing.push('jazyk');
  if(!e.levels.includes(level))missing.push('úroveň A1–C2');
  $('status').textContent='Pro stažení správných řešení vyber '+missing.join(' a ')+'.';
  return;
 }
 try{
  const source=e.lockSource||e.relative;
  need(/^(cteni|poslech|r11\/variant-copies)\/[a-z0-9-]+(?:\/index)?\.html$/.test(source),
   'Nepovolená zdrojová cesta.');
  let html=sourceCache;
  if(html===null){
   html=await loadSourceWithRetry(source);
   sourceCache=html; // Topic cannot change, so the source is reusable.
  }
  let model;
  if(e.skill==='cteni'){
   const v=read.variantFromData(read.parseReadingData(html),lang,level);
   model=buildReading(v,e,lang,level);
  }else{
   const data=listen.extractJson(html,'DATA');
   const v=listen.variant(data,level);
   // R75: the optional sequencing bank is shared with the actual practice UI.
   // No sequence is added to the separately scored 17-item TEST.
   const practiceVariant=['ll-sad','ll-conlangs'].includes(e.id)?
    {...v,sequence:host.LSHListeningSequence?.bankFor(e.id,level)||v.sequence}:v;
   model=buildListening(
     e.id==='ll-how-to-choose-your-news'?newsPracticeVariant(data,level,v):
     e.id==='ll-conlangs'?conlangsPracticeVariant(data,level,practiceVariant):practiceVariant,
     e,lang,level);
  }
  validate(model);
  if(id!==serial)return;
  current=model;renderPreview(model);
  $('downloadPdf').disabled=false;
  $('status').textContent='Klíč je připraven (procvičování). Neobsahuje výsledky jednotlivých žáků.';
  const u=new URL(host.location.href);
  u.searchParams.set('topic',e.id);u.searchParams.set('lang',lang);
  u.searchParams.set('level',level);u.searchParams.set('mode','practice');
  host.history.replaceState(null,'',u.href);
 }catch(error){
  if(id!==serial)return;
  sourceCache=null; // A malformed or incomplete response must never become sticky.
  $('retryLoad').hidden=false;
  $('status').textContent=String(error.message||error)+' Klikni na Opakovat načtení.';
 }
}
async function init(){
 try{
  const entries=KEY_ENTRIES;
  need(entries.length===11,'Neúplná metadata Reading/Listening.');
  const topicId=qs.get('topic'),requestedSkill=qs.get('skill');
  need(topicId,'Chybí identifikátor karty v odkazu.');
  const e=entries.find(x=>x.id===topicId);
  need(e,'Téma neexistuje. Otevři výsledky z konkrétní karty v katalogu.');
  need(requestedSkill===null||requestedSkill===e.skill,
   'Nesprávná laboratoř v odkazu. Reading a Listening nelze zaměnit.');
  selected=e;configure(e);
  setModeUI();
  $('language').addEventListener('change',refresh);
  $('level').addEventListener('change',refresh);
  $('retryLoad').addEventListener('click',refresh);
  $('downloadPdf').addEventListener('click',async()=>{
   if(!current)return;
   $('downloadPdf').disabled=true;
   try{const filename=await download(current,host.document);
    $('status').textContent='Staženo: '+filename}
   catch(error){$('status').textContent='Stažení PDF se nezdařilo: '+String(error.message||error)}
   finally{$('downloadPdf').disabled=!current}
  });
  await refresh();
 }catch(error){
  $('topicTitle').textContent='Kartu nelze otevřít';
  $('status').textContent='Neplatný odkaz: '+String(error.message||error);
 }
}
init();
})(typeof window!=='undefined'?window:globalThis);
