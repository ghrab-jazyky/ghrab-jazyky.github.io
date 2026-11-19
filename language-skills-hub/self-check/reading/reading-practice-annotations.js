/* RL-02 Reading Lab practice bridge: keeps original Asteroids application intact.
 * This module never reads answer keys or changes practice scoring.
 */
(()=>{
 'use strict';
 const root=document,engine=window.LSHReadingAnnotations;
 const reader=root.getElementById('readingBody'),tasks=root.getElementById('questions');
 const prep=root.querySelector('.prep');
 if(!engine||!reader||!tasks||!prep)return;
 const host=root.createElement('section');
 host.id='readingAnnotationTools';
 host.className='lsh-annotation-toolbar lsh-practice-annotations';
 host.setAttribute('aria-label','Anotace textu a otázek');
 host.innerHTML=`
 <div class="lsh-annotation-head">
  <strong>Poznámky k textu a otázkám</strong>
  <button type="button" class="action" data-anno-toggle aria-pressed="false">Zapnout poznámky</button>
 </div>
 <div data-anno-controls hidden>
  <p class="lsh-annotation-help">Vyberte nástroj a prstem označte slovo či pasáž. Na počítači můžete nejprve označit text. Anotace se nehodnotí.</p>
  <div class="lsh-annotation-buttons">
   <button type="button" class="action lsh-anno-yellow-btn" data-anno-color="yellow" aria-pressed="true">Žlutě</button>
   <button type="button" class="action lsh-anno-green-btn" data-anno-color="green" aria-pressed="false">Zeleně</button>
   <button type="button" class="action lsh-anno-pink-btn" data-anno-color="pink" aria-pressed="false">Růžově</button>
   <button type="button" class="action" data-anno-underline>Podtrhnout</button>
   <button type="button" class="action" data-anno-start-note>Přidat poznámku</button>
  </div>
  <div data-anno-note-box hidden>
   <label for="practiceAnnotationNote">Text poznámky</label>
   <textarea id="practiceAnnotationNote" data-anno-note rows="2" maxlength="500" placeholder="Zapište vlastní poznámku…"></textarea>
   <button type="button" class="action" data-anno-save-note>Uložit poznámku</button>
  </div>
  <div class="lsh-annotation-list" data-anno-list aria-label="Seznam anotací"></div>
 </div>
 <p class="lsh-annotation-status" data-anno-status role="status" aria-live="polite"></p>`;
 prep.insertAdjacentElement('afterend',host);
 const storageKey=identity=>'lsh-reading-practice-annotations-v1:rl-asteroids:'+identity;
 const slug=value=>String(value).replace(/[^a-z0-9:_-]/gi,'_').slice(0,100);
 let currentIdentity=null;
 const language=()=>root.getElementById('language')?.value||'en';
 const level=()=>root.querySelector('#levels [data-level][aria-pressed="true"]')?.dataset.level||'B1';
 const identity=()=>language()+':'+level();
 function currentSaved(){
  try{return JSON.parse(localStorage.getItem(storageKey(identity()))||'[]')}
  catch(_){return []}
 }
 const api=engine.mount({
  host,containers:[reader,tasks],
  onChange:records=>{
   try{
    localStorage.setItem(storageKey(identity()),JSON.stringify(records));
    return true;
   }catch(_){return false}
  }
 });
 function decorate(){
  [...reader.querySelectorAll('p')].forEach((p,i)=>p.dataset.annotationAnchor='p:'+i);
  for(const card of tasks.querySelectorAll('.qcard[data-question]')){
   const id=slug(card.dataset.question);
   const question=card.querySelector('h3');
   if(question)question.dataset.annotationAnchor='q:'+id;
   [...card.querySelectorAll('.choices .choice span')].forEach((choice,i)=>{
    choice.dataset.annotationAnchor='c:'+id+':'+i;
   });
  }
 }
 function sync(){
  decorate();
  const next=identity();
  if(next!==currentIdentity){
   currentIdentity=next;
   api.restore(currentSaved());
  }else api.refresh();
 }
 // Practice cards deliberately re-render when changing language, CEFR, reading
 // strategy, question feedback or evidence. Re-anchor after each paint.
 const observer=new MutationObserver(sync);
 observer.observe(reader,{childList:true,subtree:true});
 observer.observe(tasks,{childList:true,subtree:true});
 sync();
 // Prevent dictionary quick-tap / double-click handling from interrupting text
 // selection while annotation tools are enabled. Answer widgets are unaffected.
 for(const surface of [reader,tasks]){
  surface.addEventListener('pointerup',event=>{
   if(host.classList.contains('lsh-anno-enabled'))event.stopPropagation();
  });
  surface.addEventListener('dblclick',event=>{
   if(host.classList.contains('lsh-anno-enabled'))event.stopPropagation();
  });
 }
})();
