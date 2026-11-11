/* R36: Teacher practice answer keys for original Reading and Listening cards.
 * Public static material; neither teacher authentication nor student attempt archive.
 * Keys are generated from the SAME practice DATA variant as the student's shared card. */
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
  language:lang,level,groups};
}
function buildListening(variant,entry,lang,level){
 need(variant&&Array.isArray(variant.gist)&&Array.isArray(variant.detail)&&
  Array.isArray(variant.sequence)&&Array.isArray(variant.facts)&&
  Array.isArray(variant.open),'Chybná varianta Listening.');
 need(entry&&entry.skill==='poslech'&&lang==='en','Téma není anglický Listening Lab.');
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
 if(Array.isArray(variant.vocab)&&variant.vocab.length)
  groups.push(group('Vocabulary – významy',variant.vocab.map(v=>
   item(v.term,v.meaning))));
 groups.push(group('Factual questions – referenční řešení',variant.facts.map(v=>
  item(v.title,v.answer,v.criteria||''))));
 groups.push(group('Open questions – vzorové odpovědi',variant.open.map(v=>
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
  language:lang,level,groups};
}
function validate(model){
 need(model&&model.kind===L&&['reading','listening'].includes(model.skill)&&
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
  ctx.fillText('Klíč k procvičování · učitelský podklad (veřejný statický obsah)',M,828);
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
  font(9);ctx.fillText('LANGUAGE SKILLS HUB  |  VÝSLEDKY PROCVIČOVÁNÍ',M+63,50);
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
 paragraph('UČITELSKÝ KLÍČ · '+(model.skill==='reading'?'READING LAB':'LISTENING LAB'),
  15,700,'#183a56',22,7);
 paragraph(model.topic,13,700,'#203246',18,5);
 paragraph('Jazyk: '+model.language.toUpperCase()+'   Úroveň: '+model.level,10,700,'#4d6377',15,8);
 paragraph('Klíč k PROCVIČOVACÍ kartě; část úloh se může překrývat s místní testovou verzí. Neobsahuje výsledky studentů.',
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
 const name='lsh-vysledky-procvicovani-'+model.topicId+'-'+model.language+'-'+model.level.toLowerCase()+'.pdf';
 const a=doc.createElement('a');a.href=url;a.download=name;a.hidden=true;
 doc.body.appendChild(a);
 try{a.click()}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
 return name;
}
const api=Object.freeze({buildReading,buildListening,validate,renderPages,download});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
host.LSHPracticeAnswers=api;
if(!host.document||!$('practiceKeyApp'))return;
const read=host.LSHReadingCore,listen=host.LSHListeningCore,qs=new URLSearchParams(host.location.search);
let entries=[],serial=0,current=null;
const el=(tag,textValue)=>{const node=host.document.createElement(tag);node.textContent=textValue;return node};
function option(value,label){const node=el('option',label);node.value=value;return node}
function fill(id,opts,preferred){
 const select=$(id);select.replaceChildren(...opts.map(x=>option(x[0],x[1])));
 if(opts.some(x=>x[0]===preferred))select.value=preferred;
}
function entry(){return entries.find(x=>x.id===$('topic').value)}
function optionsForTopic(){
 const e=entry();if(!e)return;
 const prevLang=$('language').value||qs.get('lang');
 const prevLevel=$('level').value||qs.get('level');
 fill('language',e.languages.map(l=>[l,
  ({en:'English',es:'Español',de:'Deutsch',fr:'Français'})[l]||l]),prevLang);
 fill('level',e.levels.map(x=>[x,x]),prevLevel);
}
function line(label,value,cls){
 const p=el('p',value);if(cls)p.className=cls;
 if(label){const strong=el('strong',label+': ');p.prepend(strong)}
 return p;
}
function renderPreview(model){
 const mount=$('answerPreview');mount.replaceChildren();
 const h=el('h2',model.topic+' · '+model.language.toUpperCase()+' '+model.level);
 mount.appendChild(h);
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
async function refresh(){
 const id=++serial;current=null;
 $('downloadPdf').disabled=true;$('status').textContent='Načítám správná řešení pro vybranou variantu…';
 $('answerPreview').replaceChildren();
 const e=entry();if(!e)return;
 try{
  const source=e.lockSource||e.relative;
  need(/^(cteni|poslech|r11\/variant-copies)\/[a-z0-9-]+(?:\/index)?\.html$/.test(source),
   'Nepovolená zdrojová cesta.');
  const resp=await fetch('../../'+source,{credentials:'omit',redirect:'error'});
  need(resp.ok,'Nedostupná původní procvičovací karta: HTTP '+resp.status);
  const html=await resp.text();
  const lang=$('language').value,level=$('level').value;
  let model;
  if(e.skill==='cteni'){
   const v=read.variantFromData(read.parseReadingData(html),lang,level);
   model=buildReading(v,e,lang,level);
  }else{
   const v=listen.variant(listen.extractJson(html,'DATA'),level);
   model=buildListening(v,e,lang,level);
  }
  validate(model);
  if(id!==serial)return;
  current=model;renderPreview(model);
  $('downloadPdf').disabled=false;
  $('status').textContent='Klíč je připraven. Obsahuje pouze procvičování, ne osobní výsledky žáků.';
  const u=new URL(host.location.href);
  u.searchParams.set('topic',e.id);u.searchParams.set('lang',lang);u.searchParams.set('level',level);
  host.history.replaceState(null,'',u.href);
 }catch(error){
  if(id!==serial)return;
  $('status').textContent='Nepodařilo se vytvořit klíč: '+String(error.message||error);
 }
}
async function init(){
 try{
  const response=await fetch('../../data/cards.json',{credentials:'omit',redirect:'error'});
  need(response.ok,'Katalog není dostupný.');
  const data=await response.json();
  entries=data.entries.filter(e=>['cteni','poslech'].includes(e.skill));
  need(entries.length===8,'Neúplný katalog Reading/Listening.');
  fill('topic',entries.map(e=>[e.id,(e.skill==='cteni'?'Reading: ':'Listening: ')+e.title]),
   qs.get('topic'));
  optionsForTopic();
  $('topic').addEventListener('change',()=>{optionsForTopic();refresh()});
  $('language').addEventListener('change',refresh);
  $('level').addEventListener('change',refresh);
  $('downloadPdf').addEventListener('click',async()=>{
   if(!current)return;
   $('downloadPdf').disabled=true;
   try{const filename=await download(current,host.document);
    $('status').textContent='Staženo: '+filename}
   catch(error){$('status').textContent='Stažení PDF se nezdařilo: '+String(error.message||error)}
   finally{$('downloadPdf').disabled=!current}
  });
  await refresh();
 }catch(error){$('status').textContent='Načtení selhalo: '+String(error.message||error)}
}
init();
})(typeof window!=='undefined'?window:globalThis);
