/* Shared Reading/Listening -> My Vocabulary bridge.
 * The source cards keep their independent lesson engines. No API calls or accounts.
 * Uses the same canonical sense identity and production IndexedDB as Conversation Lab. */
(function(root){
'use strict';
const MODEL=root.LSH_MODEL,STORE=root.LSH_STORE;
if(!MODEL||!STORE||!root.document)return;
const match=root.location.pathname.match(/\/language-skills-hub\/(cteni|poslech)\/([a-z0-9-]+)\/index\.html$/);
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
 async function save(term,translation,context,button){
  if(typeof term!=='string'||!term.trim())return;
  term=term.trim();translation=String(translation||'').trim();
  if(!translation||translation.length>700){
   message('Doplň český význam (max. 700 znaků).');return;
  }
  button.disabled=true;
  try{
   const lang=language();
   const result=await store.saveWord({
    language:lang,term,translationCs:translation,level:level(),
    senseId:senseId(lang,term,translation),
    context:String(context||'').trim().slice(0,1000),
    sources:[{skill,topicId,savedAt:new Date().toISOString()}]
   });
   message(result.storedInIndexedDB?'Slovíčko uloženo do My Vocabulary.':
    'POZOR: Slovíčko je jen v dočasné paměti. Zálohuj ihned!');
   await count();
  }catch(error){message('Uložení selhalo: '+error.message)}
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
  const grid=document.getElementById('vocabTasks');
  if(grid){
   const install=()=>{
    grid.querySelectorAll('.vocab-line').forEach((row)=>{
     if(row.querySelector('.lsh-vocab-save'))return;
     const strong=row.querySelector('strong');if(!strong)return;
     const btn=make('button','＋ My Vocabulary','lsh-vocab-save');btn.type='button';
     btn.style.cssText='margin:6px 8px;min-height:35px;padding:6px 10px;border-radius:8px;background:#165c74;color:white;border:1px solid #70bfd4;font:700 12px system-ui;cursor:pointer';
     btn.addEventListener('click',()=>{
      const term=strong.textContent?.trim();
      const translation=root.prompt('Český význam slovíčka „'+term+'“ (uloží se pro pozdější hry a zkoušení):','');
      if(translation===null)return;
      save(term,translation,'',btn);
     });
     row.append(btn);
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
