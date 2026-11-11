/* Shared Reading/Listening -> My Vocabulary bridge.
 * The source cards keep their independent lesson engines. No API calls or accounts.
 * Uses the same canonical sense identity and production IndexedDB as Conversation Lab. */
(function(root){
'use strict';
const MODEL=root.LSH_MODEL,STORE=root.LSH_STORE;
if(!MODEL||!STORE||!root.document)return;
const match=root.location.pathname.match(/\/language-skills-hub\/(cteni|poslech)\/([a-z0-9-]+)(?:\/index\.html|\/)?$/);
if(!match)return;
const [,skill,slug]=match,topicId=(skill==='cteni'?'rl-':'ll-')+slug;
const language=()=>skill==='poslech'?'en':
 (MODEL.LANGUAGES.includes(document.getElementById('language')?.value)?
  document.getElementById('language').value:'en');
const level=()=>{
 const fromText=skill==='poslech'?
  document.getElementById('topLevelText')?.textContent:
  document.querySelector('#levels button.active,#levels button[aria-pressed="true"]')?.dataset.level;
 const value=String(fromText||new URLSearchParams(location.search).get('level')||'B1').trim().toUpperCase();
 return MODEL.LEVELS.includes(value)?value:'B1';
};
const store=STORE.createStore({mode:'production'});
const norm=s=>String(s||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase()
 .replace(/[’‘]/g,"'").replace(/[‐‑‒–—]/g,'-');
function senseId(lang,term,translation){
 const anchor=/[;,/|\r\n]/.test(translation)?
  'multi:'+norm(translation):'cz:'+norm(translation);
 const bytes=new TextEncoder().encode(lang+'|'+norm(term)+'|'+norm(anchor));
 let left=0x811c9dc5,right=0x9e3779b9;
 for(const b of bytes){left=Math.imul(left^b,0x01000193)>>>0;right=Math.imul(right^b,0x85ebca6b)>>>0}
 return 'cl-'+left.toString(16).padStart(8,'0')+right.toString(16).padStart(8,'0');
}
const make=(tag,text,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
function mount(){
 const head=document.querySelector(skill==='cteni'?'.topbar .controls':'.topbar .header-actions');
 if(!head)return;
 const a=make('a','My Vocabulary','lsh-vocab-nav');
 a.href='../../slovnicek/index.html?zpet='+encodeURIComponent(location.pathname);
 a.style.cssText='display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:8px 12px;background:#143f55;border:1px solid #7db3bc;border-radius:9px;color:#f7fbff;font:700 12px/1.3 system-ui;text-decoration:none;white-space:nowrap;cursor:pointer';
 a.setAttribute('aria-label','Otevřít My Vocabulary – společný uložený slovníček');
 head.append(a);
 const announce=make('p','','lsh-vocab-message');announce.setAttribute('role','status');announce.setAttribute('aria-live','polite');
 announce.style.cssText='font:600 12px/1.45 system-ui;color:inherit;flex-basis:100%;margin:3px 0';
 head.append(announce);
 function message(value){announce.textContent=value}
 async function count(){
  try{const all=await store.listWords();a.textContent='My Vocabulary ('+all.length+')'}
  catch(_){a.textContent='My Vocabulary';message('Slovníček se nepodařilo načíst.')}
 }
 async function save(term,translation,context,button,statusNode){
  term=String(term||'').trim();translation=String(translation||'').trim();
  function feedback(value){message(value);if(statusNode)statusNode.textContent=value}
  if(!term||term.length>160){feedback('Doplň slovíčko nebo výraz (max. 160 znaků).');return false}
  if(!translation||translation.length>700){feedback('Doplň český význam (max. 700 znaků).');return false}
  button.disabled=true;
  try{
   const lang=language();
   const result=await store.saveWord({
    language:lang,term,translationCs:translation,level:level(),
    senseId:senseId(lang,term,translation),
    context:String(context||'').trim().slice(0,1000),
    sources:[{skill,topicId,savedAt:new Date().toISOString()}]
   });
   const durable=result.storedInIndexedDB===true;
   feedback(durable?'Slovíčko uloženo do My Vocabulary.':
    'POZOR: Slovíčko je jen v dočasné paměti. Na tomto zařízení se nemusí zachovat.');
   await count();
   return durable;
  }catch(error){feedback('Uložení selhalo: '+(error?.message||'neznámá chyba'));return false}
  finally{button.disabled=false}
 }
 if(skill==='cteni'){
  const popup=document.getElementById('lookup');
  if(popup){
   const saveButton=make('button','＋ Přidat do My Vocabulary','lsh-vocab-save');
   saveButton.type='button';saveButton.style.cssText='margin-top:8px;min-height:38px;padding:7px 12px;border-radius:8px;background:#165c74;color:white;border:1px solid #70bfd4;font:700 12px system-ui;cursor:pointer';
   saveButton.addEventListener('click',()=>{
    if(popup.hidden){message('Nejprve vyber slovíčko v textu.');return}
    const term=document.getElementById('lookupWord')?.textContent||'';
    const raw=document.getElementById('lookupMeaning')?.textContent||'';
    // The inline dictionary may be missing an exact gloss. Ask the learner
    // rather than storing “not found” as a fake Czech translation.
    const looksMissing=/not found|no translation|nenalezen|neznám|unknown|nicht gefunden|introuvable/i.test(raw);
    const translation=looksMissing||!raw.trim()?
     root.prompt('Doplň český význam pro '+term+':',''):raw;
    if(translation===null)return;
    save(term,translation,document.getElementById('lookupContext')?.textContent,saveButton);
   });
   popup.append(saveButton);
  }
 }else{
  // The top-bar link opens the bank. This separate, visible action ADDS words.
  // Keep it usable for any expression, not only optional matching exercises.
  const css=document.createElement('link');
  css.rel='stylesheet';css.href='../../assets/lsh/v3/card-vocabulary.css';
  document.head.append(css);
  const addTop=make('button','＋ Přidat slovíčko','lsh-vocab-add-open');
  addTop.type='button';
  addTop.setAttribute('aria-haspopup','dialog');
  addTop.setAttribute('aria-controls','lsh-vocab-editor');
  head.insertBefore(addTop,a);
  const dialog=make('dialog',undefined,'lsh-vocab-editor');
  dialog.id='lsh-vocab-editor';
  dialog.setAttribute('aria-labelledby','lsh-vocab-editor-heading');
  const form=make('form',undefined,'lsh-vocab-editor-form');
  form.noValidate=true;
  const title=make('h2','Přidat do My Vocabulary');
  title.id='lsh-vocab-editor-heading';
  const hint=make('p','Vyplň slovo nebo frázi a její český význam. Všechna slovíčka najdeš ve společném My Vocabulary.','lsh-vocab-hint');
  const termLabel=make('label','Anglické slovo nebo fráze');
  const termInput=make('input',undefined,'lsh-vocab-editor-input');
  termInput.type='text';termInput.id='lsh-vocab-editor-term';
  termInput.maxLength=160;termInput.autocomplete='off';
  termLabel.htmlFor=termInput.id;
  const meaningLabel=make('label','Český význam');
  const meaningInput=make('input',undefined,'lsh-vocab-editor-input');
  meaningInput.type='text';meaningInput.id='lsh-vocab-editor-meaning';
  meaningInput.maxLength=700;meaningInput.autocomplete='off';
  meaningLabel.htmlFor=meaningInput.id;
  const status=make('p','','lsh-vocab-editor-status');
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const actions=make('div',undefined,'lsh-vocab-editor-actions');
  const cancel=make('button','Zrušit','lsh-vocab-editor-cancel');cancel.type='button';
  const submit=make('button','Uložit slovíčko','lsh-vocab-editor-submit');submit.type='submit';
  actions.append(cancel,submit);
  form.append(title,hint,termLabel,termInput,meaningLabel,meaningInput,status,actions);
  dialog.append(form);document.body.append(dialog);
  let activeButton=null,activeRowStatus=null;
  function openEditor(term,button,rowStatus){
   activeButton=button;activeRowStatus=rowStatus||null;
   const selection=typeof root.getSelection==='function'?root.getSelection().toString().trim():'';
   termInput.value=String(term||selection||'').slice(0,160);
   meaningInput.value='';status.textContent='';
   if(typeof dialog.showModal==='function')dialog.showModal();
   else dialog.setAttribute('open','');
   (termInput.value?meaningInput:termInput).focus();
  }
  function closeEditor(){
   if(typeof dialog.close==='function'&&dialog.open)dialog.close();
   else {dialog.removeAttribute('open');activeButton?.focus();}
  }
  dialog.addEventListener('close',()=>activeButton?.focus());
  cancel.addEventListener('click',closeEditor);
  addTop.addEventListener('click',()=>openEditor('',addTop,null));
  form.addEventListener('submit',async event=>{
   event.preventDefault();
   const term=termInput.value.trim(),translation=meaningInput.value.trim();
   if(!term){status.textContent='Napiš anglické slovo nebo frázi.';termInput.focus();return}
   if(!translation){status.textContent='Napiš český význam.';meaningInput.focus();return}
   const persisted=await save(term,translation,'',submit,status);
   if(persisted){
    if(activeRowStatus)activeRowStatus.textContent='✓ Uloženo do My Vocabulary';
    closeEditor();
   }
  });
  const grid=document.getElementById('vocabTasks');
  if(grid){
   const install=()=>{
    grid.querySelectorAll('.vocab-line').forEach(row=>{
     if(row.querySelector('.lsh-vocab-save'))return;
     const strong=row.querySelector('strong');if(!strong)return;
     const controls=make('div',undefined,'lsh-vocab-row-controls');
     const button=make('button','＋ Uložit do My Vocabulary','lsh-vocab-save');
     button.type='button';
     const rowStatus=make('span','','lsh-vocab-row-status');
     rowStatus.setAttribute('role','status');rowStatus.setAttribute('aria-live','polite');
     button.addEventListener('click',()=>openEditor(strong.textContent?.trim(),button,rowStatus));
     controls.append(button,rowStatus);row.append(controls);
    });
   };
   install();
   const observer=new MutationObserver(install);
   observer.observe(grid,{childList:true});
  }
 }
 store.open().then(()=>{
  if(store.status().mode!=='ready')message('POZOR: Trvalé ukládání není dostupné. Exportuj zálohu ze slovníčku.');
  return count();
 }).catch(()=>message('Lokální databázi nelze otevřít.'));
 store.subscribe(()=>count());
 root.addEventListener('pageshow',count);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
})(typeof window!=='undefined'?window:globalThis);
