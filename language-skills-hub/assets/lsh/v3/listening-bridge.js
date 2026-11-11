/* R40: attach My Vocabulary to original Listening practice cards.
 * Each optional vocabulary expression can be saved without changing grading.
 * The shared IndexedDB database is 'lsh', never 'lsh-test'. */
(function(root){
 'use strict';
 if(!root.document)return;
 const script=document.currentScript;
 const topicId=script&&script.dataset&&script.dataset.topicId||'';
 const valid=/^ll-[a-z0-9-]+$/.test(topicId);
 const LABELS={save:'＋ Save to My Vocabulary',saved:'✓ Saved to My Vocabulary'};
 function init(){
  const MODEL=root.LSH_MODEL,STORE=root.LSH_STORE,MIG=root.LSH_VOCAB_MIGRATION;
  const bar=document.querySelector('.topbar .header-actions'),vocab=document.getElementById('vocabTasks');
  if(!valid||!MODEL||!STORE||!MIG||!bar||!vocab){
   console.warn('LSH Listening vocabulary connector not available');return;
  }
  const store=STORE.createStore({mode:'production'});
  const a=document.createElement('a');a.className='tiny-btn';a.id='lshSharedVocabulary';
  const url=new URL('../../slovnicek/index.html',document.baseURI);
  url.searchParams.set('zpet',location.pathname+location.search);
  a.href=url.href;a.textContent='My Vocabulary';
  a.title='Personal vocabulary shared across Listening, Reading and Conversation labs';
  a.style.cssText='text-decoration:none;white-space:normal;text-align:center';
  bar.append(a);
  const feedback=document.createElement('output');feedback.id='lshListeningVocabStatus';
  feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
  feedback.style.cssText='display:block;font:600 13px/1.4 system-ui;min-height:20px;margin-top:8px';
  vocab.after(feedback);
  function currentLevel(){
   const pill=document.querySelector('#levelPills .level-pill[aria-pressed="true"]');
   return pill&&MODEL.LEVELS.includes(pill.dataset.level)?pill.dataset.level:'B2';
  }
  function data(){
   try{return typeof DATA!=='undefined'?DATA:null}catch(_){return null}
  }
  async function count(){
   try{const words=await store.listWords();a.textContent='My Vocabulary ('+words.length+')'}
   catch(_){a.textContent='My Vocabulary'}
  }
  async function saveRow(index,button){
   const level=currentLevel(),v=data()?.[level]?.vocab?.[index];
   if(!v||!v.term)return;
   button.disabled=true;
   try{
    const time=new Date().toISOString();
    const senseId='ll-'+MIG.hash('en|'+v.term.toLowerCase().trim()+'|'+String(v.meaning||'').toLowerCase().trim());
    const result=await store.saveWord({
     language:'en',senseId,term:v.term,explanation:v.meaning||'',level,
     sources:[{skill:'poslech',topicId,savedAt:time}]
    },time);
    if(!result.storedInIndexedDB){
     feedback.textContent='Local storage unavailable — this word is temporary. Download a backup.';
     button.disabled=false;return;
    }
    button.textContent=LABELS.saved;feedback.textContent='Saved locally. Add a Czech meaning in My Vocabulary to use it in the test.';
    await count();
   }catch(e){
    feedback.textContent='Word could not be saved: '+e.message;
    button.disabled=false;
   }
  }
  function attach(){
   const d=data()?.[currentLevel()]?.vocab;
   if(!Array.isArray(d))return;
   const rows=vocab.querySelectorAll('.vocab-line');
   for(let i=0;i<rows.length;i++){
    const row=rows[i],entry=d[i],term=row.querySelector('strong');
    if(row.querySelector('.lsh-vocab-save')||!entry||!term||term.textContent.trim()!==entry.term.trim())continue;
    const b=document.createElement('button');b.type='button';
    b.className='tiny-btn lsh-vocab-save';b.textContent=LABELS.save;
    b.style.cssText='font-size:12px;white-space:normal;text-align:center;grid-column:2/-1;margin-top:4px';
    b.addEventListener('click',()=>saveRow(i,b));
    row.append(b);
   }
  }
  const observer=new MutationObserver(attach);
  observer.observe(vocab,{childList:true});
  attach();
  store.open().then(()=>{
   if(store.status().mode!=='ready')feedback.textContent='Local storage unavailable — saved words are temporary.';
   return count();
  }).catch(()=>{feedback.textContent='Local storage is not available';});
  store.subscribe(()=>{void count()});
  root.addEventListener('pageshow',()=>{void count()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})(typeof window!=='undefined'?window:globalThis);
