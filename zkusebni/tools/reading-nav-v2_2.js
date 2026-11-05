/* Reading Lab universal question<->text navigation, v2.2.
   Embed into each standalone student HTML using patch_nav.py.
   No network, storage mutation, score mutation or external dependencies. */
(function(){
 'use strict';
 const version='2.2';
 const reader=document.getElementById('readingBody');
 const tasks=document.getElementById('tasks');
 const questionsHost=document.getElementById('questions');
 const tabsHost=document.getElementById('skillTabs');
 if(!reader||!tasks||!questionsHost||!tabsHost)return;
 const labels={
  en:'Back to question', es:'Volver a la pregunta',
  de:'Zurück zur Frage', fr:'Retour à la question'
 };
 const returnButton=document.createElement('button');
 returnButton.id='rlReturnToQuestion';
 returnButton.className='rl-return-question';
 returnButton.type='button';
 returnButton.hidden=true;
 returnButton.setAttribute('aria-controls','questions');
 document.body.append(returnButton);
 let origin=null,flashTimer=0;
 const lang=()=>document.documentElement.lang.slice(0,2).toLowerCase();
 const level=()=>document.querySelector('#levels button[data-level][aria-pressed="true"]')?.dataset.level||'';
 const tab=()=>tabsHost.querySelector('button[data-skill][aria-selected="true"]')?.dataset.skill||'';
 const dictOn=()=>document.getElementById('dictionaryToggle')?.getAttribute('aria-pressed')==='true';
 const reduce=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
 const rowFor=id=>[...questionsHost.querySelectorAll('.qcard[data-question]')].find(row=>row.dataset.question===id);
 const rows=()=>[...questionsHost.querySelectorAll('.qcard[data-question]')];
 const label=()=> '↩ '+(labels[lang()]||labels.en)+' '+origin.number+' / '+origin.total;
 function clear(){origin=null;returnButton.hidden=true;returnButton.textContent='';decorate();}
 function numberParagraphs(){
  const paras=reader.querySelectorAll(':scope > p[id^="paragraph-"]');
  paras.forEach((p,i)=>p.setAttribute('data-num',String(i+1)));
 }
 function canReturnThrough(mark){
  if(!origin||dictOn())return false;
  if(mark.classList.contains('evidence-hit'))return true;
  return (mark.getAttribute('data-target-for')||'').split(/\s+/).includes(origin.id);
 }
 function decorate(){
  for(const mark of reader.querySelectorAll('.evidence-hit,.reading-target')){
   const on=canReturnThrough(mark);
   mark.classList.toggle('rl-click-return',on);
   if(on){mark.setAttribute('tabindex','0');mark.setAttribute('role','button');mark.setAttribute('aria-label',label());}
   else if(mark.getAttribute('role')==='button'&&mark.hasAttribute('data-rl-nav-mark')){
    mark.removeAttribute('role');mark.removeAttribute('tabindex');mark.removeAttribute('aria-label');
   }
   if(on)mark.setAttribute('data-rl-nav-mark','');else mark.removeAttribute('data-rl-nav-mark');
  }
 }
 function showOrigin(id){
  const elements=rows();
  const index=elements.findIndex(row=>row.dataset.question===id);
  if(index<0)return;
  origin={id,tab:tab(),lang:lang(),level:level(),number:index+1,total:elements.length};
  returnButton.textContent=label();returnButton.setAttribute('aria-label',label());
  returnButton.hidden=false;
  decorate();
 }
 const observer=new MutationObserver(()=>{numberParagraphs();decorate();});
 observer.observe(reader,{childList:true});
 numberParagraphs();
 function scrollRow(row){
  const behavior=reduce()?'instant':'smooth';
  const narrow=window.matchMedia?.('(max-width: 850px)')?.matches||getComputedStyle(tasks).overflowY==='visible';
  if(narrow){row.scrollIntoView({behavior,block:'center'});return;}
  const y=row.getBoundingClientRect().top-tasks.getBoundingClientRect().top+tasks.scrollTop;
  tasks.scrollTo({top:Math.max(0,y-110),behavior});
 }
 function back(){
  if(!origin)return;
  if(lang()!==origin.lang||level()!==origin.level){clear();return;}
  if(tab()!==origin.tab){
   const switchTo=[...tabsHost.querySelectorAll('button[data-skill]')].find(x=>x.dataset.skill===origin.tab);
   if(!switchTo){clear();return;}
   switchTo.click();
  }
  const row=rowFor(origin.id);
  clear();
  if(!row)return;
  row.setAttribute('tabindex','-1');
  row.classList.add('rl-question-return-highlight');
  try{row.focus({preventScroll:true});}catch(_){row.focus();}
  scrollRow(row);
  if(flashTimer)window.clearTimeout(flashTimer);
  flashTimer=window.setTimeout(()=>row.classList.remove('rl-question-return-highlight'),1500);
 }
 returnButton.addEventListener('click',back);
 // Register after the original card's click handlers: evidence and target are already rendered.
 questionsHost.addEventListener('click',event=>{
  const target=event.target.closest('button[data-locate]');
  if(target){
   const qid=target.dataset.locate;
   if([...reader.querySelectorAll('[data-target-for]')].some(el=>(el.dataset.targetFor||'').split(/\s+/).includes(qid)))showOrigin(qid);
   return;
  }
  const evidence=event.target.closest('button[data-evidence]');
  if(evidence&&reader.querySelector('.evidence-hit'))showOrigin(evidence.dataset.evidence);
 });
 reader.addEventListener('click',event=>{
  const mark=event.target.closest('.evidence-hit,.reading-target');
  if(mark&&canReturnThrough(mark))back();
 });
 reader.addEventListener('keydown',event=>{
  if(event.key!=='Enter'&&event.key!==' ')return;
  const mark=event.target.closest('.evidence-hit,.reading-target');
  if(mark&&canReturnThrough(mark)){event.preventDefault();back();}
 });
 document.addEventListener('keydown',event=>{if(event.key==='Escape')clear();});
 document.getElementById('language')?.addEventListener('change',clear);
 document.getElementById('levels')?.addEventListener('click',event=>{
  if(event.target.closest('button[data-level]'))clear();
 });
 for(const id of ['reset','clear'])document.getElementById(id)?.addEventListener('click',clear);
 document.getElementById('dictionaryToggle')?.addEventListener('click',decorate);
 window.addEventListener('pagehide',clear);
 document.documentElement.dataset.rlNavigation=version;
})();
