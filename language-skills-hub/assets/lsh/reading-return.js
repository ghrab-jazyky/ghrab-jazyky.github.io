/* LSH R44: bidirectional Reading Lab navigation for direct student practice cards.
 * Offline-only, no changes to source questions, answer state or dictionary.
 * Asteroids retains its existing v2.2 return implementation; other cards use this module. */
(function(){
'use strict';
const reader=document.getElementById('readingBody');
const questions=document.getElementById('questions');
const tasks=document.getElementById('tasks');
if(!reader||!questions||!tasks||document.getElementById('backToQuestion'))return;
const lexicon=Object.freeze({
 en:'Back to question',es:'Volver a la pregunta',
 de:'Zurück zur Frage',fr:'Retour à la question'
});
const btn=document.createElement('button');
btn.type='button';btn.id='backToQuestion';btn.className='lsh-back-to-question';
btn.hidden=true;
document.body.appendChild(btn);
let selected=null,marked=null;
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile=()=>window.matchMedia('(max-width: 850px)').matches;
const language=()=>document.getElementById('language')?.value||'en';
const level=()=>document.querySelector('#levels button[data-level][aria-pressed="true"]')?.dataset.level||'';
const identity=()=>language()+'|'+level();
const card=id=>[...questions.querySelectorAll('.qcard[data-question]')].find(el=>el.dataset.question===id);
const matchFor=(mark,id)=>mark.dataset.targetFor?.split(/\s+/).includes(id);
function passage(id,kind){
 if(kind==='locate')
  return [...reader.querySelectorAll('[data-target-for]')].find(el=>matchFor(el,id))||null;
 if(kind==='evidence')
  return reader.querySelector('.evidence-hit')||null;
 return null;
}
function clear(){
 if(marked)marked.classList.remove('lsh-return-target');
 marked=null;selected=null;btn.hidden=true;
}
function arm(id,kind,variant){
 if(identity()!==variant)return clear();
 const current=card(id),target=passage(id,kind);
 if(!current||!target||!reader.contains(target))return clear();
 clear();
 const cards=[...questions.querySelectorAll('.qcard[data-question]')];
 const num=cards.indexOf(current)+1;
 if(num<1)return;
 marked=target;marked.classList.add('lsh-return-target');
 selected={id,variant};
 const label=(lexicon[language()]||lexicon.en)+' '+num+' / '+cards.length;
 btn.textContent='↩ '+label;
 btn.setAttribute('aria-label',label);
 btn.hidden=false;
}
function returnToQuestion(){
 const original=selected;
 if(!original)return;
 const target=original.variant===identity()?card(original.id):null;
 clear();
 if(!target)return;
 const behavior=reduced()?'auto':'smooth';
 if(mobile()||getComputedStyle(tasks).overflowY==='visible'){
  target.scrollIntoView({behavior,block:'center'});
 }else{
  const y=target.getBoundingClientRect().top-tasks.getBoundingClientRect().top+tasks.scrollTop;
  tasks.scrollTo({top:Math.max(0,y-16),behavior});
 }
 target.classList.remove('lsh-return-flash');
 void target.offsetWidth;
 target.classList.add('lsh-return-flash');
 const focus=target.querySelector('button[data-locate],button[data-evidence],input,button');
 if(focus)focus.focus({preventScroll:true});
}
btn.addEventListener('click',returnToQuestion);
questions.addEventListener('click',event=>{
 const trigger=event.target instanceof Element?
  event.target.closest('button[data-locate],button[data-evidence]'):null;
 if(!trigger)return;
 const id=trigger.dataset.locate||trigger.dataset.evidence;
 const kind=trigger.hasAttribute('data-locate')?'locate':'evidence';
 const variant=identity();
 // The original card updates evidence markup and scrolls synchronously in its click handler.
 requestAnimationFrame(()=>arm(id,kind,variant));
},{capture:true});
questions.addEventListener('change',clear,{capture:true});
document.addEventListener('click',event=>{
 const target=event.target instanceof Element?event.target:null;
 if(!target)return;
 if(target.closest('#skillTabs [data-skill],#levels [data-level],#clear,#reset,#check,#checkAll'))clear();
},{capture:true});
document.getElementById('language')?.addEventListener('change',clear,{capture:true});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!btn.hidden&&document.getElementById('lookup')?.hidden!==false)clear();
});
window.addEventListener('pageshow',()=>{if(selected?.variant!==identity())clear()});
})();