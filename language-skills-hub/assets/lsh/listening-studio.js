/* Listening Studio presentation only. Never reads or modifies test answers. */
(()=>{'use strict';
function init(){
 const header=document.querySelector('.topbar');
 const levels=document.querySelector('.studio-levelbar');
 if(!header||!levels)return;

 // WebKit safety: ResizeObserver callbacks must not synchronously write layout-affecting
 // CSS variables. Schedule measurements outside the observer notification cycle.
 const root=document.documentElement;
 let queued=false;
 let previousTop=-1;
 let previousLevels=-1;
 function measureBars(){
  queued=false;
  const top=Math.ceil(header.getBoundingClientRect().height);
  const level=Math.ceil(levels.getBoundingClientRect().height);
  if(top!==previousTop){
   previousTop=top;
   root.style.setProperty('--studio-topbar-height',top+'px');
  }
  if(level!==previousLevels){
   previousLevels=level;
   root.style.setProperty('--studio-levelbar-height',level+'px');
  }
 }
 function scheduleBars(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(measureBars);
 }
 scheduleBars();
 window.addEventListener('resize',scheduleBars,{passive:true});
 if('ResizeObserver' in window){
  const observer=new ResizeObserver(scheduleBars);
  observer.observe(header);
  observer.observe(levels);
 }

 // Separate visual mirror. The approved practice assessment and persistence stay untouched.
 const old=document.getElementById('progressStatus');
 const dest=document.getElementById('studioProgressText');
 const oldBar=document.getElementById('progressBar');
 const mirror=document.getElementById('studioProgressBar');
 if(old&&dest&&oldBar&&mirror){
  const sync=()=>{
   const text=old.textContent;
   const width=oldBar.style.width||'0%';
   if(dest.textContent!==text)dest.textContent=text;
   if(mirror.style.width!==width)mirror.style.width=width;
  };
  sync();
  const mo=new MutationObserver(sync);
  mo.observe(old,{childList:true,characterData:true,subtree:true});
  mo.observe(oldBar,{attributes:true,attributeFilter:['style']});
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();


/* R75: Harrison-style sequencing is optional PRACTICE and never alters scored TEST items. */
(()=>{
'use strict';
const banks=Object.freeze({
 'll-sad':{
  A1:['A doctor introduces a special light treatment.','Winter changes the behaviour of some animals.','Some people also suffer from winter depression.','The video ends with ways to treat SAD.'],
  A2:['The video opens with an unusual medical prescription.','Short winter days change animals and some people.','The narrator describes serious symptoms of seasonal depression.','She explains the link between daylight and the body clock.','She finishes with treatments including light therapy.'],
  B1:['The opening introduces a prescription for light therapy.','The narrator moves from seasonal animal changes to human SAD.','She describes recurring episodes of depression and their symptoms.','Light from the eyes reaches the brain’s biological clock.','Researchers discuss melatonin and shifts in circadian rhythms.','The final part explains treatments and the need for guidance.'],
  B2:['Light therapy is introduced as an unusual medical prescription.','The seasonal behaviour of animals introduces SAD in people.','The speaker explains how retinal light signals reach the circadian clock.','One hypothesis proposes an extended period of melatonin release.','Another proposes a shift in the timing of daily rhythms.','Psychological and genetic factors and summer depression complicate the explanation.','The conclusion discusses clinical treatments and cautious light therapy.'],
  C1:['An unusual prescription serves as an introduction to light therapy.','Seasonal adaptations in wildlife frame a discussion of clinical SAD.','The retina and suprachiasmatic nucleus provide a physiological explanation.','A first account concerns prolonged melatonin release in winter.','An alternative account emphasises circadian phase changes.','Rumination, genetic susceptibility and summertime depression are considered.','The talk concludes with therapeutic options and safety considerations.'],
  C2:['The opening presents an unconventional prescription before explaining its mechanism.','The narrative moves from winter adaptations to clinically significant human depression.','Retinal signalling and central circadian regulation establish the biological framework.','A prolonged-melatonin hypothesis is introduced with unresolved questions.','A competing explanation concerns advances and delays in circadian timing.','Cognitive, familial, cultural and summer-pattern factors challenge a single-cause model.','The conclusion evaluates therapeutic approaches and the need for supervised light exposure.']
 },
 'll-conlangs':{
  A1:['The speaker names languages from films and television.','He says that languages need grammar, not just words.','He explains changes in Tolkien’s Elvish.','He ends with modern invented languages people can speak.'],
  A2:['Dothraki, Na’vi, Klingon and Elvish are introduced.','The speaker distinguishes full languages from simple codes.','He explains why grammar is needed to make sentences.','He uses Tolkien’s Elvish to show change and irregular rules.','Finally, he describes modern conlangs that people can use.'],
  B1:['The introduction lists fictional languages from popular stories.','The speaker contrasts constructed languages with secret codes.','Grammar is introduced as the key to building sentences.','Tolkien’s Elvish illustrates imaginary histories and sound changes.','The speaker points out irregular forms and unfinished parts of Elvish.','He finishes with modern conlangs that are developed enough for speech.'],
  B2:['The talk opens with examples of popular fictional languages.','It distinguishes full constructed languages from substitution codes.','Grammar and productive sentence formation become the essential criteria.','Tolkien’s invented language histories demonstrate change over time.','Irregular patterns and exceptions make a language more realistic.','Elvish is described as incomplete and extended by later fans.','The conclusion turns to modern conlangs that speakers can actually use.'],
  C1:['Familiar fictional universes establish the idea of constructed languages.','The narrator separates autonomous language systems from lexical ciphers.','Grammatical productivity is treated as more important than vocabulary alone.','Tolkien’s invented histories illustrate the processes of linguistic change.','Morphological irregularity is presented as a feature of real languages.','Elvish is qualified as a partial design supplemented by enthusiasts.','Modern spoken conlangs provide the closing contrast.'],
  C2:['The opening uses fictional-language examples to introduce deliberate language construction.','The speaker rejects the equivalence between full languages and substitution codes.','Generative grammar becomes the defining criterion of an independent system.','Tolkien’s imagined diachronic divergence illustrates linguistic development.','Exceptions and irregular paradigms complicate the image of a fully logical language.','Fan reconstruction is needed because Tolkien’s Elvish remains under-specified.','The talk closes by contrasting functional modern conlangs with incomplete Elvish.']
 }
});
const bankFor=(topic,level)=>banks[topic]?.[level]?.slice()||null;
function defaultOrder(n){
 const a=Array.from({length:n},(_,i)=>i);
 for(let i=0;i+1<n;i+=2)[a[i],a[i+1]]=[a[i+1],a[i]];
 return a;
}
const validOrder=(a,n)=>Array.isArray(a)&&a.length===n&&
 a.every(i=>Number.isInteger(i)&&i>=0&&i<n)&&new Set(a).size===n;
function mount({list,status,review,steps,order,onChange}){
 if(!list||!status||!review||!Array.isArray(steps)||steps.length<3||
  steps.some(s=>typeof s!=='string'||!s.trim())||new Set(steps).size!==steps.length)
  throw Error('Invalid reconstruction configuration');
 let value=validOrder(order,steps.length)?order.slice():defaultOrder(steps.length);
 let selected=null,drag=null,ignoreClick=false,disposed=false;
 list.setAttribute('aria-label','Sequence of ideas in the recording');
 function render(focus){
  if(disposed)return;
  list.replaceChildren();
  for(let pos=0;pos<value.length;pos++){
   const index=value[pos],li=document.createElement('li'),button=document.createElement('button');
   li.className='seq-item';li.dataset.index=String(index);
   if(selected===index)li.classList.add('selected');
   button.type='button';button.className='seq-card';
   button.setAttribute('aria-label','Statement '+(pos+1)+': '+steps[index]+'; select to move it');
   const grip=document.createElement('span');grip.className='seq-grip';
   grip.setAttribute('aria-hidden','true');grip.textContent='⋮⋮';
   const no=document.createElement('span');no.className='seq-no';no.textContent=String(pos+1);
   const words=document.createElement('span');words.className='seq-text';words.textContent=steps[index];
   const action=document.createElement('span');action.className='seq-action';
   action.textContent=selected===index?'PLACE HERE':'MOVE';
   button.append(grip,no,words,action);li.append(button);list.append(li);
  }
  if(focus!==undefined){
   const li=Array.from(list.children).find(x=>Number(x.dataset.index)===focus);
   li?.querySelector('button')?.focus({preventScroll:true});
  }
 }
 function move(index,to){
  const from=value.indexOf(index);
  if(from<0||to<0||to>=value.length)return;
  if(from!==to){value.splice(from,1);value.splice(to,0,index)}
  selected=null;render(index);review.replaceChildren();
  for(const li of list.children)li.classList.remove('right','wrong');
  let warning='';
  if(from!==to){try{warning=onChange?.(value.slice())||''}catch(_){warning='Local saving unavailable.'}}
  status.textContent=warning||'Moved to position '+(to+1)+'. Tap another card to continue.';
 }
 function select(index){
  if(selected===null){selected=index;render(index);status.textContent='Statement selected. Tap its target position.'}
  else if(selected===index){selected=null;render(index);status.textContent='Selection cancelled.'}
  else move(selected,value.indexOf(index));
 }
 function onClick(e){
  const button=e.target.closest?.('.seq-card');
  if(!button||!list.contains(button))return;
  if(ignoreClick){ignoreClick=false;return}
  select(Number(button.closest('.seq-item').dataset.index));
 }
 function onDown(e){
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(e.pointerType!=='mouse'&&!e.target.closest?.('.seq-grip'))return;
  const b=e.target.closest?.('.seq-card');
  if(!b||!list.contains(b))return;
  drag={id:e.pointerId,index:Number(b.closest('.seq-item').dataset.index),
   x:e.clientX,y:e.clientY,active:false,target:null};
  try{b.setPointerCapture(e.pointerId)}catch(_){}
 }
 function clearDrag(){
  for(const x of list.children)x.classList.remove('drag-active','drop-target');
 }
 function onMove(e){
  if(!drag||drag.id!==e.pointerId)return;
  if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>9)drag.active=true;
  if(!drag.active)return;
  e.preventDefault();
  const li=document.elementFromPoint(e.clientX,e.clientY)?.closest?.('.seq-item');
  drag.target=li&&list.contains(li)?Number(li.dataset.index):null;
  for(const x of list.children){
   const i=Number(x.dataset.index);
   x.classList.toggle('drag-active',i===drag.index);
   x.classList.toggle('drop-target',drag.target!==null&&i===drag.target&&i!==drag.index);
  }
 }
 function onUp(e){
  if(!drag||drag.id!==e.pointerId)return;
  const d=drag;drag=null;clearDrag();
  if(!d.active)return;
  ignoreClick=true;setTimeout(()=>{ignoreClick=false},0);
  if(d.target!==null&&d.target!==d.index)move(d.index,value.indexOf(d.target));
  else status.textContent='Drop onto another card, or tap a card and then its target position.';
 }
 function onCancel(){drag=null;clearDrag()}
 function check(){
  review.replaceChildren();let score=0;
  for(let i=0;i<value.length;i++){
   const ok=value[i]===i;if(ok)score++;
   list.children[i].classList.toggle('right',ok);
   list.children[i].classList.toggle('wrong',!ok);
   if(!ok){
    const row=document.createElement('div');row.className='review wrong';
    const title=document.createElement('strong');title.textContent='Position '+(i+1)+' · Check the order';
    const chosen=document.createElement('p');chosen.textContent='Your statement: '+steps[value[i]];
    const correct=document.createElement('p');correct.textContent='Correct statement: '+steps[i];
    row.append(title,chosen,correct);review.append(row);
   }
  }
  status.textContent='Reconstruction: '+score+' / '+steps.length+
   ' in the correct position. Separate from the 17-question listening score.';
  return score;
 }
 list.addEventListener('click',onClick);
 list.addEventListener('pointerdown',onDown);
 list.addEventListener('pointermove',onMove);
 list.addEventListener('pointerup',onUp);
 list.addEventListener('pointercancel',onCancel);
 render();
 status.textContent='Select a card, then its target position. Or drag the dotted handle.';
 return Object.freeze({
  check,order:()=>value.slice(),
  destroy(){
   disposed=true;
   list.removeEventListener('click',onClick);list.removeEventListener('pointerdown',onDown);
   list.removeEventListener('pointermove',onMove);list.removeEventListener('pointerup',onUp);
   list.removeEventListener('pointercancel',onCancel);
  }
 });
}
window.LSHListeningSequence=Object.freeze({banks,bankFor,defaultOrder,validOrder,mount});
})();
