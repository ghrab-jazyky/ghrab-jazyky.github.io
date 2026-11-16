/* LSH teacher-facing changelog controller – Stage D.
 * Non-blocking teacher notes. No student identity, logging, analytics or backend.
 */
(function(global){
 'use strict';
 const STORAGE_KEY='lsh:teacher-whats-new:last-offered-sequence:v1';
 const DATA_URL='data/teacher-changelog.json';
 const ENTRY_WAIT_MS=650,HTTP_TIMEOUT_MS=3500;
 const byId=id=>document.getElementById(id);
 const prompt=byId('whatsNewPrompt'),catalog=byId('whatsNewCatalog'),navButton=byId('whatsNewOpen');
 const dataApi=global.LSHWhatsNewData,view=global.LSHWhatsNewView;
 if(!prompt||!catalog||!navButton||!dataApi||!view)return;
 let pending=null,data=null,loadFailed=false,initialized=false,introFlow=false,introDone=null,manualFocus=null,transitioning=false;
 function readLastSequence(){
  try{
   const raw=global.localStorage.getItem(STORAGE_KEY);
   if(raw===null||!/^\d{1,10}$/.test(raw))return 0;
   const value=Number(raw);
   return Number.isSafeInteger(value)&&value>=0&&value<=2147483647?value:0;
  }catch(_){return 0;}
 }
 function acknowledge(){
  if(!data||!dataApi.valid(data))return;
  const next=data.latestAnnouncementSequence;
  if(!next||next<=readLastSequence())return;
  try{global.localStorage.setItem(STORAGE_KEY,String(next));}catch(_){}
 }
 function latestUnseen(){
  return data!==null&&dataApi.valid(data)&&data.releases.length>0&&
         data.latestAnnouncementSequence>readLastSequence();
 }
 async function fetchData(){
  const abort=typeof AbortController==='function'?new AbortController():null;
  const timeout=abort&&global.setTimeout(()=>abort.abort(),HTTP_TIMEOUT_MS);
  try{
   const response=await global.fetch(DATA_URL,{cache:'no-store',...(abort?{signal:abort.signal}:{})});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const next=await response.json();
   if(!dataApi.valid(next))throw new Error('Invalid change log');
   data=next;loadFailed=false;return next;
  }catch(_){data=null;loadFailed=true;return null;}
  finally{if(timeout)global.clearTimeout(timeout);}
 }
 function refresh(){
  if(pending)return pending;
  pending=fetchData().finally(()=>{pending=null;});
  return pending;
 }
 function render(){
  const list=catalog.querySelector('[data-wn-release-list]');
  if(data&&dataApi.valid(data))return view.renderCatalog(catalog,data);
  list.replaceChildren();
  const box=document.createElement('div');box.className='wn-empty';
  const title=document.createElement('strong');title.className='wn-empty-title';
  title.textContent=loadFailed?'Přehled se nyní nepodařilo načíst':'Načítám novinky…';
  const desc=document.createElement('p');desc.className='wn-empty-text';
  desc.textContent=loadFailed?'Můžeš pokračovat do laboratoří a zkusit katalog otevřít později.':
        'Důležité změny ti za chvíli zobrazím.';
  box.append(title,desc);list.append(box);
  const counter=catalog.querySelector('[data-wn-count]');
  if(counter)counter.textContent=loadFailed?'Katalog není dostupný':'Načítání…';
  return {releases:0,changes:0};
 }
 function continueFromIntro(){
  if(!introFlow)return;
  introFlow=false;
  const action=introDone;introDone=null;
  if(typeof action==='function')action();
 }
 function finishPrompt(showHistory){
  if(transitioning||!prompt.open)return;
  transitioning=true;acknowledge();prompt.close();transitioning=false;
  if(showHistory)showCatalog(true);else continueFromIntro();
 }
 function showCatalog(fromIntro){
  if(catalog.open)return;
  if(!fromIntro)manualFocus=document.activeElement;
  byId('wnCatalogContinue').textContent=fromIntro?'Pokračovat do laboratoří':'Zavřít katalog';
  render();
  try{catalog.showModal();}
  catch(_){if(fromIntro)continueFromIntro();return;}
  byId('wnCatalogClose').focus({preventScroll:true});
 }
 function finishCatalog(){
  if(transitioning||!catalog.open)return;
  transitioning=true;catalog.close();transitioning=false;
  if(introFlow)continueFromIntro();
  else if(manualFocus&&manualFocus.isConnected&&!manualFocus.closest('[inert]'))manualFocus.focus({preventScroll:true});
  manualFocus=null;
 }
 async function openManual(){
  if(prompt.open||catalog.open)return;
  introFlow=false;manualFocus=document.activeElement;
  // Clear previously loaded data until fresh publication has been verified.
  data=null;loadFailed=false;showCatalog(false);
  try{await refresh();}catch(_){loadFailed=true;}
  if(catalog.open){render();if(data&&dataApi.valid(data))acknowledge();}
 }
 function inDirectLab(){
  return ['konverzace','cteni','poslech'].includes(new URLSearchParams(global.location.search).get('skill'));
 }
 async function offerInitial(continueFn){
  if(introFlow)return;
  init();introFlow=true;introDone=continueFn;
  if(inDirectLab()){introFlow=false;introDone=null;return;}
  if(pending)await Promise.race([pending,new Promise(resolve=>global.setTimeout(resolve,ENTRY_WAIT_MS))]);
  if(!introFlow)return;
  if(inDirectLab()||!latestUnseen()){continueFromIntro();return;}
  try{prompt.showModal();byId('wnPromptYes').focus({preventScroll:true});}
  catch(_){continueFromIntro();}
 }
 function init(){
  if(initialized)return;
  initialized=true;
  byId('wnPromptYes').addEventListener('click',()=>finishPrompt(true));
  byId('wnPromptNo').addEventListener('click',()=>finishPrompt(false));
  byId('wnPromptClose').addEventListener('click',()=>finishPrompt(false));
  byId('wnCatalogClose').addEventListener('click',finishCatalog);
  byId('wnCatalogContinue').addEventListener('click',finishCatalog);
  prompt.addEventListener('cancel',event=>{event.preventDefault();finishPrompt(false);});
  catalog.addEventListener('cancel',event=>{event.preventDefault();finishCatalog();});
  navButton.addEventListener('click',openManual);
  global.addEventListener('popstate',()=>{
   if(prompt.open){prompt.close();introFlow=false;introDone=null;}
   if(catalog.open){catalog.close();introFlow=false;introDone=null;manualFocus=null;}
  });
  refresh();
 }
 global.LSHWhatsNew=Object.freeze({init,offerInitial});
})(window);
