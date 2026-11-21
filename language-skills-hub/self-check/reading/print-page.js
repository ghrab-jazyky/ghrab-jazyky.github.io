/* RL-PDF-01 – teacher print preview. Static, local and answer-free. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const core=window.LSHReadingCore,printCore=window.LSHReadingPrintCore;
 const params=new URLSearchParams(location.search);
 const topic=params.get('topic')||'rl-asteroids';
 const lang=params.get('lang')||'en',level=params.get('level')||'B2';
 const mode=params.get('mode')||'practice',format=params.get('format')||'text';
 const add=(tag,cls,value)=>{
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(value!==undefined)el.textContent=String(value);
  return el;
 };
 const names={en:'English',es:'Español',de:'Deutsch',fr:'Français'};
 const copy={
  en:{practice:'PRACTICE',test:'TEST · without answers',text:'Text only',all:'Text + exercises',reading:'Reading text',exercises:'Exercises',reflection:'Further reflection · not graded',warmup:'Before reading',name:'Name',studentClass:'Class',date:'Date',instructions:'For each question, circle the correct answer or write its letter on the line.',gap:'One sentence is missing. Complete it in the accompanying test.'},
  es:{practice:'PRÁCTICA',test:'PRUEBA · sin soluciones',text:'Solo texto',all:'Texto + ejercicios',reading:'Texto de lectura',exercises:'Ejercicios',reflection:'Reflexión adicional · sin calificación',warmup:'Antes de leer',name:'Nombre',studentClass:'Clase',date:'Fecha',instructions:'En cada pregunta, rodea la respuesta correcta o escribe su letra en la línea.',gap:'Falta una frase. Complétala en la prueba correspondiente.'},
  de:{practice:'ÜBUNG',test:'TEST · ohne Lösungen',text:'Nur Text',all:'Text + Aufgaben',reading:'Lesetext',exercises:'Aufgaben',reflection:'Zusätzliche Reflexion · unbewertet',warmup:'Vor dem Lesen',name:'Name',studentClass:'Klasse',date:'Datum',instructions:'Kreise bei jeder Aufgabe die richtige Antwort ein oder schreibe ihren Buchstaben auf die Linie.',gap:'Ein Satz fehlt. Ergänze ihn im zugehörigen Test.'},
  fr:{practice:'ENTRAÎNEMENT',test:'TEST · sans corrigé',text:'Texte seul',all:'Texte + exercices',reading:'Texte à lire',exercises:'Exercices',reflection:'Réflexion complémentaire · non notée',warmup:'Avant de lire',name:'Nom',studentClass:'Classe',date:'Date',instructions:'Pour chaque question, entoure la bonne réponse ou écris sa lettre sur la ligne.',gap:'Une phrase manque. Complète-la dans le test associé.'}
 };

 async function fetchText(url){
  const response=await fetch(url,{credentials:'omit',redirect:'error',cache:'no-store'});
  if(!response.ok)throw new Error('HTTP '+response.status);
  return response.text();
 }
 function imageLoaded(image){
  if(image.complete&&image.naturalWidth>0)return Promise.resolve();
  return new Promise((resolve,reject)=>{
   image.addEventListener('load',()=>{
    image.naturalWidth>0?resolve():reject(new Error('Invalid school logo'));
   },{once:true});
   image.addEventListener('error',()=>reject(new Error('School logo unavailable')),{once:true});
   if(image.complete&&image.naturalWidth===0)reject(new Error('School logo unavailable'));
  });
 }
 function render(model){
  document.documentElement.lang=lang;
  const t=copy[lang],all=format==='all';
  document.title='Reading Lab · '+lang.toUpperCase()+' '+level+' · '+t[mode]+
   ' · '+t[format]+' · '+model.title;
  document.querySelector('.print-controls').lang='cs';
  document.querySelector('.school').lang='cs';
  $('paper').dataset.format=format;
  $('materialTitle').textContent=model.title;
  $('materialMeta').textContent=t[mode]+' · '+(names[lang]||lang)+' · '+level+
   ' · '+t[format];
  $('readingTitle').textContent=t.reading;
  $('exercisesTitle').textContent=t.exercises;
  $('reflectionTitle').textContent=t.reflection;
  $('warmupTitle').textContent=t.warmup;
  $('warmupSection').hidden=!model.warmup;
  $('warmupPrompt').textContent=model.warmup;
  $('studentIdentification').hidden=!all;
  $('studentIdentification').textContent=t.name+': ____________________   '+
   t.studentClass+': ________   '+t.date+': ____________';
  $('worksheetInstructions').hidden=!all;
  $('worksheetInstructions').textContent=t.instructions;
  $('gapNote').hidden=!(model.hasGap&&mode==='test'&&format==='text');
  $('gapNote').textContent=t.gap;
  const paragraphs=$('readingParagraphs');
  paragraphs.replaceChildren();
  for(const [index,part] of model.paragraphs.entries()){
   const p=add('p',null,part);p.lang=lang;p.dataset.num=String(index+1);
   paragraphs.appendChild(p);
  }
  $('exercisesSection').hidden=!all;
  const groups=$('exercises');groups.replaceChildren();
  if(all){
   for(const section of model.sections){
    const group=add('section','exercise-group');
    group.appendChild(add('h3',null,section.title));
    for(const question of section.questions){
     const wrapper=add('div','exercise-question');
     wrapper.appendChild(add('p','prompt',question.number+'. '+question.prompt));
     const options=add('ol','exercise-options');options.type='A';
     for(const choice of question.choices)options.appendChild(add('li',null,choice));
     wrapper.appendChild(options);
     wrapper.appendChild(add('div','answer-line'));
     group.appendChild(wrapper);
    }
    groups.appendChild(group);
   }
  }
  $('reflectionSection').hidden=!all||!model.reflection.trim();
  $('reflectionPrompt').textContent=model.reflection;
 }
 async function start(){
  try{
   if(topic!=='rl-asteroids')throw new Error('Pilot tisku je zatím dostupný pouze pro Asteroids.');
   if(!core.LANGUAGES.includes(lang)||!core.LEVELS.includes(level)||
      !printCore.MODES.includes(mode)||!printCore.FORMATS.includes(format))
    throw new Error('Neplatné parametry tiskového materiálu.');
   const catalog=JSON.parse(await fetchText('../../data/cards.json'));
   const entry=core.readingEntry(catalog,topic);
   if(!entry.languages.includes(lang)||!entry.levels.includes(level))
    throw new Error('Tato jazyková varianta neexistuje.');
   const source=await fetchText('../../'+entry.relative);
   const v=core.variantFromData(core.parseReadingData(source),lang,level);
   const model=printCore.printable(v,mode,format);
   render(model);
   await imageLoaded($('schoolLogo'));
   $('paper').hidden=false;
   $('printButton').disabled=false;
   $('status').textContent='Materiál připraven. Zvolte „Tisk / Uložit jako PDF“.';
  }catch(error){
   $('paper').hidden=true;
   $('printButton').disabled=true;
   $('status').textContent='Materiál nelze připravit: '+String(error?.message||error);
  }
 }
 $('printButton').addEventListener('click',()=>{if(!$('printButton').disabled)window.print()});
 start();
})();
