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
  document.title='Reading Lab · '+model.title+' · '+(format==='all'?'worksheet':'text');
  $('materialTitle').textContent=model.title;
  const description=(mode==='test'?'TEST – zadání bez řešení':'PROCVIČOVÁNÍ')+
   ' · '+(names[lang]||lang)+' · '+level+
   ' · '+(format==='all'?'Text + všechna cvičení':'Pouze text');
  $('materialMeta').textContent=description;
  const paragraphs=$('readingParagraphs');
  paragraphs.replaceChildren();
  for(const part of model.paragraphs){
   const p=add('p',null,part);p.lang=lang;paragraphs.appendChild(p);
  }
  const all=format==='all';
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
