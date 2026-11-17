/* R27 Reading teacher setup. Public no-auth page, no exam results collected. */
(()=>{
 'use strict';
 const core=window.LSHReadingCore,share=window.LSHShareTools;
 const $=id=>document.getElementById(id);
 const qs=new URLSearchParams(location.search);
 const newAttempt=()=>'class'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
 let attemptId=null,confirmed=false,everConfirmed=false,gestureControls=null;
 const langNames={en:'Angličtina',es:'Španělština',de:'Němčina',fr:'Francouzština'};
 let entries=[],valid=false,studentLink='',renderedSignature='',historyTimer=null;
 function queueTeacherUrl(entry,language,level,limit,gestureId){
  if(historyTimer!==null)window.clearTimeout(historyTimer);
  // Safari rate-limits history.replaceState. Keep the students' QR up-to-date
  // immediately, but coalesce teacher address changes until the form settles.
  historyTimer=window.setTimeout(()=>{
   historyTimer=null;
   if(formSignature()!==renderedSignature){refresh();return;}
   const page=new URL(location.href);
   for(const [key,value] of Object.entries({
    topic:entry.id,lang:language,level,timer:String(limit),p:window.LSHUnlockGestures.codeFor(gestureId)
   }))page.searchParams.set(key,value);
   if(page.href!==location.href){
    try{history.replaceState(null,'',page.href)}catch(error){
     console.warn('Reading teacher address not updated',error?.message||error);
    }
   }
  },450);
 }
 // R56: WebKit can defer/change-suppress a number-field input event when
 // switching tabs. Reconcile form state with the published QR as a safeguard.
 const formSignature=()=>['topic','language','level','timerMinutes']
  .map(id=>$(id).value).join('|')+'|'+(gestureControls?.getId()??'');
 const validConfig=(entry,language,level,limit,gestureId=gestureControls?.getId())=>!!entry&&
  !!window.LSHUnlockGestures.byId(gestureId)&&
  entry.languages.includes(language)&&entry.levels.includes(level)&&
  Number.isInteger(limit)&&limit>=5&&limit<=120;
 function appearance(light,save){
  document.documentElement.dataset.theme=light?'light':'dark';
  $('themeButton').textContent=light?'☾ Tmavý režim':'☀ Světlý režim';
  $('themeButton').setAttribute('aria-pressed',String(light));
  if(save){try{localStorage.setItem('lsh-selfcheck-theme',light?'light':'dark')}catch(_){}}
 }
 function themeInit(){
  let pref=null;
  try{pref=localStorage.getItem('lsh-selfcheck-theme')}catch(_){}
  appearance(pref?pref==='light':!!window.matchMedia?.('(prefers-color-scheme: light)').matches,false);
  $('themeButton').addEventListener('click',()=>appearance(document.documentElement.dataset.theme!=='light',true));
 }
 function option(value,label){
  const x=document.createElement('option');x.value=value;x.textContent=label;return x;
 }
 function selectedEntry(){
  const entry=entries.find(e=>e.id===$('topic').value);
  if(!entry)return null;
  try{core.readingEntry({entries},entry.id);return entry}catch(_){return null}
 }
 function updateLanguage(){
  const entry=selectedEntry();
  const old=$('language').value||qs.get('lang')||'en';
  $('language').replaceChildren();
  if(!entry)return;
  for(const lang of core.LANGUAGES.filter(l=>entry.languages.includes(l))){
   $('language').appendChild(option(lang,langNames[lang]));
  }
  if(entry.languages.includes(old))$('language').value=old;
 }
 function refresh(){
  if(historyTimer!==null){window.clearTimeout(historyTimer);historyTimer=null;}
  const entry=selectedEntry();
  const language=$('language').value,level=$('level').value;
  const limit=Number($('timerMinutes').value);
  const gestureId=gestureControls?.getId();
  valid=validConfig(entry,language,level,limit,gestureId);
  if(confirmed){confirmed=false;everConfirmed=true;}
  studentLink='';
  $('studentUrl').value='';
  $('studentPreview').href='#';
  $('studentPreview').setAttribute('aria-disabled','true');
  $('copyUrl').disabled=true;$('downloadQr').disabled=true;
  $('confirmTest').disabled=!valid;
  $('publishStatus').textContent='Nastavení není potvrzené.';
  $('previousLinkNotice').hidden=!everConfirmed;
  $('loadStatus').textContent=valid?
   'Připraveno: '+entry.title+' · '+langNames[language]+' · '+level+' · '+limit+' minut.':
   !gestureId?'Vyber platný způsob odemčení přerušeného testu.':
   'Zvolená varianta nebo časový limit nejsou platné. Vyber 5–120 minut.';
  $('copyStatus').textContent='Nejprve potvrď nastavení testu.';
  share.render('',$('qrMount'),$('downloadQr'));
  if(valid)queueTeacherUrl(entry,language,level,limit,gestureId);
  renderedSignature=formSignature();
 }
 function confirm(){
  // Never publish from a prior valid state when input/change was suppressed.
  if(formSignature()!==renderedSignature){refresh();return;}
  const entry=selectedEntry();
  const language=$('language').value,level=$('level').value;
  const limit=Number($('timerMinutes').value);
  const gestureId=gestureControls?.getId();
  if(!validConfig(entry,language,level,limit,gestureId)){refresh();return;}
  if(!valid||confirmed)return;
  attemptId=newAttempt();
  const url=new URL('index.html',document.baseURI);url.search='';
  url.searchParams.set('topic',entry.id);
  url.searchParams.set('lang',language);
  url.searchParams.set('level',level);
  url.searchParams.set('timer',String(limit));
  url.searchParams.set('p',window.LSHUnlockGestures.codeFor(gestureId));
  url.searchParams.set('attempt',attemptId);
  studentLink=url.href;confirmed=true;everConfirmed=true;
  $('studentUrl').value=studentLink;
  $('copyUrl').disabled=false;
  $('studentPreview').href=studentLink;
  $('studentPreview').setAttribute('aria-disabled','false');
  $('confirmTest').disabled=true;
  $('publishStatus').textContent='POTVRZENO: '+entry.title+' · '+langNames[language]+' · '+
   level+' · '+limit+' minut · '+window.LSHUnlockGestures.byId(gestureId).name+
   ' · kód pokusu '+attemptId+' · varianta '+window.LSHUnlockGestures.codeFor(gestureId)+
   '. Kód pokusu a variantu najdete i v protokolu studenta; slouží k ručnímu porovnání, nejsou důkazem pravosti.';
  $('copyStatus').textContent='Odkaz a QR odpovídají potvrzené konfiguraci.';
  share.render(studentLink,$('qrMount'),$('downloadQr'));
  renderedSignature=formSignature();
 }
 function currentPublication(){
  if(formSignature()!==renderedSignature){refresh();return false;}
  if(!confirmed||!studentLink)return false;
  if(!validConfig(selectedEntry(),$('language').value,$('level').value,Number($('timerMinutes').value))){
   refresh();return false;
  }
  return true;
 }
 async function init(){
  themeInit();
  gestureControls=window.LSHUnlockGestures.mountTeacher($('unlockTeacherControls'),
   window.LSHUnlockGestures.byCode(qs.get('p'))?.id||'corners4',refresh);
  $('confirmTest').addEventListener('click',confirm);
  $('copyUrl').addEventListener('click',()=>{if(currentPublication())share.copy(studentLink,$('studentUrl'),$('copyStatus'));});
  $('downloadQr').addEventListener('click',()=>{if(currentPublication())share.download($('qrMount'),$('copyStatus'),'reading-test-navrh-znamky-qr.svg');});
  $('studentUrl').addEventListener('focus',e=>e.target.select());
  $('studentUrl').addEventListener('click',e=>e.target.select());
  $('topic').addEventListener('change',()=>{updateLanguage();refresh()});
  $('language').addEventListener('change',refresh);
  $('level').addEventListener('change',refresh);
  $('timerMinutes').addEventListener('change',refresh);
  $('timerMinutes').addEventListener('input',refresh);
  $('studentPreview').addEventListener('click',e=>{if(!currentPublication())e.preventDefault()});
  $('copyUrl').disabled=true;
  $('downloadQr').disabled=true;
  try{
   const [cardsResult,namesResult]=await Promise.all([
    fetch('../../data/cards.json',{credentials:'omit',cache:'no-store'}),
    fetch('../../data/catalog-i18n.json',{credentials:'omit',cache:'no-store'})
   ]);
   if(!cardsResult.ok||!namesResult.ok)throw new Error('Katalog není dostupný');
   const cards=await cardsResult.json(),translated=await namesResult.json();
   entries=cards.entries.filter(e=>e.skill==='cteni');
   if(entries.length!==5)throw new Error('Neočekávaný počet čtecích témat');
   $('topic').replaceChildren();
   for(const entry of entries){
    core.readingEntry({entries},entry.id);
    const cs=translated.entries?.[entry.id]?.cs;
    $('topic').appendChild(option(entry.id,cs?.title||entry.title));
   }
   const pref=qs.get('topic');
   $('topic').value=entries.some(e=>e.id===pref)?pref:entries[0].id;
   updateLanguage();
   if(core.LANGUAGES.includes(qs.get('lang'))&&selectedEntry().languages.includes(qs.get('lang')))
    $('language').value=qs.get('lang');
   $('level').value=core.LEVELS.includes(qs.get('level'))?qs.get('level'):'B2';
   const preset=Number(qs.get('timer'));
   $('timerMinutes').value=Number.isInteger(preset)&&preset>=5&&preset<=120?String(preset):'30';
   refresh();
   // Watchdog only compares small form values; no network or storage.
   // Reconcile unreported form changes; publication still requires confirmation.
   window.setInterval(()=>{
    if(formSignature()!==renderedSignature)refresh();
   },250);
  }catch(error){
   $('loadStatus').textContent='Nelze připravit studentský odkaz: '+String(error.message||error);
   share.render('', $('qrMount'),$('downloadQr'));
  }
 }
 init();
})();
