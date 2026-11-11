/* R43: local-only backup guidance and optional native file sharing.
 * This code does not send data to a server, and never uses a student account. */
(function(root){
 'use strict';
 const helper=root.LSH_BACKUP_SAFETY,MODEL=root.LSH_MODEL,STORE=root.LSH_STORE;
 if(!helper||!MODEL||!STORE)return;
 const $=id=>document.getElementById(id),KEY='lsh-vocabulary-confirmed-backup-v1';
 const store=STORE.createStore({mode:'production'});
 let snapshot=[],pending=null,refreshId=0;
 const getRecord=()=>{try{return JSON.parse(localStorage.getItem(KEY))}catch(_){return null}};
 const alert=(message)=>{const x=$('backupSafety');if(x){x.textContent=message;x.dataset.backup='missing'}};
 function supportedShare(){
  if(typeof File!=='function'||typeof navigator.share!=='function')return false;
  try{
   const file=new File(['{}'],'lsh.json',{type:'application/json'});
   return !navigator.canShare||navigator.canShare({files:[file]});
  }catch(_){return false}
 }
 async function refresh(){
  const id=++refreshId;
  try{
   await store.open();
   const current=await store.listWords();
   const hash=await helper.fingerprint(current);
   if(id!==refreshId)return;
   snapshot=current;
   const result=helper.assessment(current.length,getRecord(),hash);
   const el=$('backupSafety');
   if(el){el.textContent=result.message;el.dataset.backup=result.state}
   $('shareBackupBtn').disabled=!current.length;
  }catch(_){if(id===refreshId)alert('Stav zálohy nelze ověřit. Stáhni si nový JSON soubor.')}
 }
 async function recordPrepared(json){
  const data=JSON.parse(json);
  const hash=await helper.fingerprint(data.words);
  pending={hash,at:Date.now()};
  $('confirmBackupBtn').hidden=false;
  // This only records that a file was prepared, never that it was safely saved.
 }
 async function confirmSaved(){
  if(!pending)return;
  try{
   localStorage.setItem(KEY,JSON.stringify(pending));
   pending=null;$('confirmBackupBtn').hidden=true;
   await refresh();
  }catch(_){alert('Potvrzení nelze uložit. Záložní soubor uchovávej mimo prohlížeč.')}
 }
 async function share(){
  if(!supportedShare())return alert('Sdílení souboru není podporováno. Použij Stáhnout zálohu.');
  if(!snapshot.length)return;
  let json,file;
  try{
   json=MODEL.serializeExport(snapshot);
   file=new File([json],'LSH-My-Vocabulary-'+new Date().toISOString().slice(0,10)+'.json',{type:'application/json'});
   if(navigator.canShare&&!navigator.canShare({files:[file]}))throw Error('Soubor nelze sdílet.');
  }catch(_){return alert('Zálohu nelze připravit. Použij Stáhnout zálohu.')}
  try{
   // Must be called directly from a user gesture, before any await.
   await navigator.share({files:[file],title:'My Vocabulary – záloha'});
   await recordPrepared(json);
   alert('Záloha byla předána k sdílení. Zkontroluj uložení souboru mimo prohlížeč a potvrď jej.');
  }catch(e){
   if(e?.name==='AbortError')alert('Sdílení bylo zrušeno. Původní slovíčka zůstala místně.');
   else alert('Sdílení se nezdařilo. Použij Stáhnout zálohu.');
  }
 }
 async function inspect(){
  const detail=$('storageDetails'),button=$('requestPersistenceBtn');
  let persisted=false;
  try{persisted=!!(await navigator.storage?.persisted?.())}catch(_){}
  const ready=store.status().mode==='ready';
  const description=ready?
   (persisted?'Prohlížeč povolil persistentní režim. Ani ten ale nezaručuje uchování dat.':
    'IndexedDB funguje, ale samotné uložení v prohlížeči není trvalou zálohou.'):
   'Pozor: IndexedDB není dostupná. Slovíčka se mohou ztratit po zavření stránky.';
  const standalone=navigator.standalone===true||root.matchMedia?.('(display-mode: standalone)')?.matches===true;
  detail.textContent=description+' '+helper.appleWarning(navigator.userAgent,navigator.maxTouchPoints,standalone);
  if(ready&&!persisted&&typeof navigator.storage?.persist==='function'){
   button.hidden=false;
   button.addEventListener('click',async()=>{
    let granted=false;
    try{granted=await navigator.storage.persist()}catch(_){}
    button.hidden=granted;
    detail.textContent=(granted?'Prohlížeč povolil persistentní režim.':'Prohlížeč persistentní režim nepovolil.')+
     ' Ani jedno nenahrazuje externí zálohu. '+helper.appleWarning(navigator.userAgent,navigator.maxTouchPoints,standalone);
   });
  }
 }
 async function init(){
  if(!$('backupSafety'))return;
  $('shareBackupBtn').hidden=!supportedShare();
  $('shareBackupBtn').addEventListener('click',share);
  $('confirmBackupBtn').addEventListener('click',confirmSaved);
  await store.open();
  await refresh();
  await inspect();
  store.subscribe(()=>refresh());
  root.addEventListener('pageshow',refresh);
 }
 root.LSH_BACKUP_UI=Object.freeze({refresh,recordPrepared});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init().catch(()=>alert('Kontrola zálohy není dostupná.')),{once:true});
 else init().catch(()=>alert('Kontrola zálohy není dostupná.'));
})(typeof window!=='undefined'?window:globalThis);
