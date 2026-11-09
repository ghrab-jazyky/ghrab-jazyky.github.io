/* R27 Reading teacher setup. Public no-auth page, no exam results collected. */
(()=>{
 'use strict';
 const core=window.LSHReadingCore,share=window.LSHShareTools;
 const $=id=>document.getElementById(id);
 const qs=new URLSearchParams(location.search);
 const langNames={en:'Angličtina',es:'Španělština',de:'Němčina',fr:'Francouzština'};
 let entries=[],valid=false,studentLink='';
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
  const entry=selectedEntry();
  const language=$('language').value,level=$('level').value;
  valid=!!entry&&entry.languages.includes(language)&&entry.levels.includes(level);
  studentLink='';
  if(valid){
   const url=new URL('index.html',document.baseURI);url.search='';
   url.searchParams.set('topic',entry.id);
   url.searchParams.set('lang',language);
   url.searchParams.set('level',level);
   studentLink=url.href;
   const page=new URL(location.href);
   page.searchParams.set('topic',entry.id);
   page.searchParams.set('lang',language);
   page.searchParams.set('level',level);
   history.replaceState(null,'',page);
  }
  $('studentUrl').value=studentLink;
  $('copyUrl').disabled=!valid;
  $('studentPreview').setAttribute('aria-disabled',String(!valid));
  $('studentPreview').href=valid?studentLink:'#';
  $('loadStatus').textContent=valid?
   'Připraveno: '+entry.title+' · '+langNames[language]+' · '+level+
   '. Student na stránce nemá přepínač jazyka ani úrovně.':
   'Zvolená varianta není dostupná. Zkontroluj téma, jazyk a úroveň.';
  $('copyStatus').textContent=valid?'Odkaz a QR odpovídají zvolené variantě.':'Nejprve vyber dostupnou variantu.';
  share.render(studentLink,$('qrMount'),$('downloadQr'));
 }
 async function init(){
  themeInit();
  $('copyUrl').addEventListener('click',()=>share.copy(studentLink,$('studentUrl'),$('copyStatus')));
  $('downloadQr').addEventListener('click',()=>share.download($('qrMount'),$('copyStatus'),'reading-test-bez-znamky-qr.svg'));
  $('studentUrl').addEventListener('focus',e=>e.target.select());
  $('studentUrl').addEventListener('click',e=>e.target.select());
  $('topic').addEventListener('change',()=>{updateLanguage();refresh()});
  $('language').addEventListener('change',refresh);
  $('level').addEventListener('change',refresh);
  $('studentPreview').addEventListener('click',e=>{if(!valid)e.preventDefault()});
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
   refresh();
  }catch(error){
   $('loadStatus').textContent='Nelze připravit studentský odkaz: '+String(error.message||error);
   share.render('', $('qrMount'),$('downloadQr'));
  }
 }
 init();
})();
