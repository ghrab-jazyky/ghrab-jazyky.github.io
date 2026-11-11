/* Shared access point in every Conversation / Reading / Listening practice card. */
(function(window,document){
'use strict';
const source=document.currentScript;
if(!source)return;
const topic=source.dataset.topic||'',skill=source.dataset.skill||'';
if(!/^(cl|rl|ll)-[a-z0-9-]+$/.test(topic)||!['konverzace','cteni','poslech'].includes(skill))return;
function url(){
 const result=new URL('../my-vocabulary/index.html',source.src);
 result.searchParams.set('topic',topic);result.searchParams.set('skill',skill);
 const p=new URLSearchParams(window.location.search);
 let language=p.get('lang')||'';
 const x=document.getElementById('language');
 if(!language&&x&&['en','es','de','fr'].includes(x.value))language=x.value;
 if(!language&&skill==='poslech')language='en';
 if(['en','es','de','fr'].includes(language))result.searchParams.set('lang',language);
 return result.href;
}
function openVocabulary(){
 // Never infer a blocked popup from window.open's null return with "noopener":
 // Chromium may return null even after a successful new-tab open.
 const a=document.createElement('a');
 a.href=url();a.target='_blank';a.rel='noopener noreferrer';
 a.hidden=true;document.body.append(a);a.click();a.remove();
}
const old=document.getElementById('rl-vocab-button');
if(old){
 // Reading's existing dictionary-save flow is preserved, but opening My vocabulary
 // now leads to the same shared games/test/backup screen used by the other two labs.
 old.addEventListener('click',event=>{
  event.preventDefault();event.stopImmediatePropagation();openVocabulary();
 },true);
 old.title='Společný slovníček, hry, zkoušení a záloha pro všechny karty LSH';
 return;
}
const css=document.createElement('style');
css.textContent='.lshv-launch{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;padding:9px 12px;border:1px solid #76b2d2;border-radius:10px;background:#134969;color:#fff;font:700 13px/1.3 system-ui,sans-serif;cursor:pointer;white-space:normal}.lshv-launch:hover{background:#1c6287}.lshv-launch:focus-visible{outline:3px solid #edc27e;outline-offset:3px}@media print{.lshv-launch{display:none!important}}';
document.head.append(css);
const action=document.createElement('button');
action.type='button';action.className='lshv-launch';action.textContent='📚 My vocabulary';
action.setAttribute('aria-label','My vocabulary – společný osobní slovníček, hry a zkoušení');
action.addEventListener('click',openVocabulary);
const host=document.querySelector('.topbar .header-actions,.controls,.topbar,header');
if(host)host.append(action);else document.body.prepend(action);
})(window,document);
