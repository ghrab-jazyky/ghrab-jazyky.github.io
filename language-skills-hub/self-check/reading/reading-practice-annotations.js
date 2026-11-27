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
 host.setAttribute('aria-label','Anotace textu a otázek');host.lang='cs';
 host.innerHTML=`
 <div class="lsh-annotation-head">
  <strong>Poznámky k textu a otázkám</strong>
 </div>
 <div data-anno-controls hidden>
  <p class="lsh-annotation-help">Vyberte nástroj. Na PC označujte text myší opakovaně. Prstem či stylusem dokončete výběr a stiskněte Použít nástroj. Klávesnicí přejděte na text pomocí Tab, označte úsek pomocí Shift a šipek nebo Shift+Home/End a potvrďte Enter. Esc zruší výběr nebo editor. Anotace se nehodnotí. Slovník a anotační mód se přepínají navzájem.</p>
  <div class="lsh-annotation-buttons">
   <button type="button" class="action lsh-anno-yellow-btn" data-anno-color="yellow" aria-pressed="false">Žlutě</button>
   <button type="button" class="action lsh-anno-green-btn" data-anno-color="green" aria-pressed="false">Zeleně</button>
   <button type="button" class="action lsh-anno-pink-btn" data-anno-color="pink" aria-pressed="false">Růžově</button>
   <button type="button" class="action lsh-anno-blue-btn" data-anno-color="blue" aria-pressed="false">Modře</button>
   <button type="button" class="action" data-anno-underline aria-pressed="false">Podtrhnout</button>
   <button type="button" class="action" data-anno-start-note aria-pressed="false">Přidat poznámku</button>
   <button type="button" class="action lsh-annotation-clear-all" data-anno-clear-all disabled
    aria-label="Smazat všechna zvýraznění, podtržení a poznámky v této variantě">Smazat všechny poznámky</button>
  </div>
  <div class="lsh-annotation-clear-confirm" data-anno-clear-confirm hidden role="group" aria-label="Potvrzení smazání anotací">
   <span>Opravdu smazat všechna zvýraznění, podtržení a poznámky v aktuální jazykové a úrovňové variantě? Smazání lze vrátit tlačítkem Zpět před změnou varianty nebo obnovením stránky.</span>
   <button type="button" class="action" data-anno-clear-confirm-action>Ano, smazat vše</button>
   <button type="button" class="action" data-anno-clear-cancel>Zrušit</button>
  </div>
  <div data-anno-note-box hidden>
   <label for="practiceAnnotationNote">Text poznámky</label>
   <textarea id="practiceAnnotationNote" data-anno-note rows="2" maxlength="500" placeholder="Zapište vlastní poznámku…"></textarea>
   <button type="button" class="action" data-anno-save-note>Uložit poznámku</button>
  </div>
  <div class="lsh-annotation-list" data-anno-list aria-label="Seznam anotací"></div>
 </div>
 <p class="lsh-annotation-status" data-anno-status role="status" aria-live="polite"></p>`;
 // Stable DOM anchor; translated labels must never determine placement.
 const modeButton=root.createElement('button');
 modeButton.type='button';modeButton.className='lsh-anno-header-toggle';
 modeButton.textContent='Zapnout poznámky';modeButton.setAttribute('aria-pressed','false');
 modeButton.setAttribute('aria-controls','readingAnnotationTools');
 const target=root.querySelector('.topbar .controls')||root.querySelector('.topbar')||prep;
 modeButton.lang='cs';target.appendChild(modeButton);
 const storageKey=identity=>'lsh-reading-practice-annotations-v1:rl-asteroids:'+identity;
 const slug=value=>String(value).replace(/[^a-z0-9:_-]/gi,'_').slice(0,100);
 let currentIdentity=null,expectedRaw=null,readable=true,readError='';
 const language=()=>root.getElementById('language')?.value||'en';
 const level=()=>root.querySelector('#levels [data-level][aria-pressed="true"]')?.dataset.level||'B1';
 const identity=()=>language()+':'+level();
 function currentSaved(){
  try{
   expectedRaw=localStorage.getItem(storageKey(identity()));
   const records=engine.decodeLocalSnapshot(expectedRaw);
   readable=records!==null;
   readError=readable?'':'Uložené anotace nelze bezpečně načíst. Původní data nebyla přepsána.';
   return records||[];
   }catch(_){readable=false;readError='Prohlížeč neumožňuje přístup k úložišti anotací. Povolte místní úložiště nebo použijte jiný prohlížeč.';return []}
 }
 // Asteroids DATA is the unchanged classic-script source bank.
 function anchorMapping(target){
  const match=/^p:(\d+)$/.exec(target.dataset.annotationAnchor||'');
  if(!match||typeof DATA==='undefined')return null;
  const variant=DATA[language()]?.[level()],index=Number(match[1]),source=variant?.paragraphs[index];
  if(typeof source!=='string')return null;
  const gap=variant.gap?.p===index&&source.startsWith(variant.gap.sentence)?variant.gap.sentence:null;
  const hidden=gap?'[…] '+source.slice(gap.length).replace(/^\s+/,''):null;
  const gapShift=hidden?source.length-hidden.length:0;
  if(target.textContent===source)return {source,shift:0,min:0,gapShift,gapPrefix:4};
  if(hidden&&target.textContent===hidden)return {source,shift:gapShift,min:4,gapShift,gapPrefix:4};
  return null;
 }
 if(!window.CSS?.highlights||typeof window.Highlight!=='function'){
  modeButton.disabled=true;modeButton.textContent='Anotace nedostupné';
  modeButton.title='Tento prohlížeč nepodporuje zvýrazňování textu.';modeButton.removeAttribute('aria-controls');return;
 }
 prep.insertAdjacentElement('afterend',host);
 const dictionary=root.getElementById('dictionaryToggle');
 let changingMode=false;
 const api=engine.mount({
  host,toggle:modeButton,containers:[reader,tasks],anchorMapping,
  onToggle:enabled=>{
   if(enabled&&dictionary?.getAttribute('aria-pressed')==='true'){
    changingMode=true;try{dictionary.click()}finally{changingMode=false;}
   }
  },
  onChange:records=>{
   try{
    if(!readable)return readError||'Úložiště anotací není dostupné.';
    if(currentIdentity!==identity())return 'Varianta se změnila. Obnovte stránku.';
    const key=storageKey(currentIdentity);
    if(localStorage.getItem(key)!==expectedRaw)
     return 'Anotace byly změněny v jiné záložce. Obnovte stránku; původní data nebyla přepsána.';
    const next=JSON.stringify(records);localStorage.setItem(key,next);expectedRaw=next;api.reportStorageIssue('');return true;
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
   api.reportStorageIssue(readError);
  }else api.refresh();
 }
 // Practice cards deliberately re-render when changing language, CEFR, reading
 // strategy, question feedback or evidence. Re-anchor after each paint.
 const observer=new MutationObserver(sync);
 observer.observe(reader,{childList:true,subtree:true});
 observer.observe(tasks,{childList:true,subtree:true});
 sync();
 // Mutually exclusive modes; a dictionary click cannot discard a draft.
 dictionary?.addEventListener('click',event=>{
  if(changingMode||!api.isEnabled())return;
  if(api.hasDraft()){
   event.preventDefault();event.stopImmediatePropagation();
   host.querySelector('[data-anno-status]').textContent='Nejprve uložte nebo zrušte rozpracovanou poznámku.';
   return;
  }
  modeButton.click();
 },true);
 // A variant/skill change must not silently discard an unfinished note.
 function blockWhileEditing(event){
  if(!api.hasDraft())return;
  event.preventDefault();event.stopImmediatePropagation();
  if(event.target===root.getElementById('language'))event.target.value=currentIdentity.split(':')[0];
  host.querySelector('[data-anno-status]').textContent='Nejprve uložte nebo zrušte rozpracovanou poznámku.';
 }
 root.getElementById('language')?.addEventListener('change',blockWhileEditing,true);
 for(const id of ['levels','skillTabs','reset','check','checkAll','clear'])root.getElementById(id)?.addEventListener('click',blockWhileEditing,true);
 root.getElementById('skillTabs')?.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key))blockWhileEditing(event)},true);
 // Do not overwrite a newer snapshot from a second tab.
 window.addEventListener('storage',event=>{
  if((event.key===storageKey(currentIdentity)&&event.newValue!==expectedRaw)||(event.key===null&&expectedRaw!==null))
   api.reportStorageIssue('Anotace byly změněny v jiné záložce. Vaše poslední změna nemusela zůstat uložena. Před úpravami obnovte stránku.');
 });
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
