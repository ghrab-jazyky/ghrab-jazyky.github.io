/* R24 teacher-facing helper. Public page, NOT authenticated and NOT a remote media controller. */
(()=>{
 'use strict';
 const core=window.LSHListeningCore,shareTools=window.LSHShareTools;
 const $=id=>document.getElementById(id);
 const params=new URLSearchParams(location.search);
 const attemptId='class'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
 let passes=0,sequence=0;
 const names={
  'll-matthew-oscars':'Matthew McConaughey · Oscars 2014',
  'll-harrison-ford':'Harrison Ford · Life Achievement Speech',
  'll-peaky-no-fighting':'Peaky Blinders · No Fighting'
 };
 function appearance(light,save){
  document.documentElement.dataset.theme=light?'light':'dark';
  $('themeButton').textContent=light?'☾ Tmavý režim':'☀ Světlý režim';
  $('themeButton').setAttribute('aria-pressed',String(light));
  if(save){try{localStorage.setItem('lsh-listening-theme',light?'light':'dark')}catch(_){}}
 }
 function initTheme(){
  let pref=null;try{pref=localStorage.getItem('lsh-listening-theme')}catch(_){}
  appearance(pref?pref==='light':!!window.matchMedia?.('(prefers-color-scheme: light)').matches,false);
  $('themeButton').addEventListener('click',()=>{
   appearance(document.documentElement.dataset.theme!=='light',true);
  });
 }
 function count(){
  $('passCount').textContent=passes+' / 2';
  $('markPass').disabled=passes>=2;
  $('markPass').textContent=passes===0?'První poslech dokončen':
   passes===1?'Druhý poslech dokončen':'Dva poslechy dokončeny';
  $('passNote').textContent=passes===0?
   'Otevři zdroj a přehraj jej poprvé. Tento panel video sám neovládá.':
   passes===1?
   'První poslech je označen. Po druhém přehrání potvrď druhý poslech.':
   'Dva poslechy dokončeny. Žáci mohou dokončit řazení a přiřazování a získat automatický návrh známky.';
 }
 function urlForStudent(){
  const url=new URL('student.html',location.href);
  url.search='';
  url.searchParams.set('topic',$('topic').value);
  url.searchParams.set('level',$('level').value);
  url.searchParams.set('timer',$('timerMinutes').value);
  url.searchParams.set('attempt',attemptId);
  return url.href;
 }
 function share(){
  const limit=Number($('timerMinutes').value);
  if(!Number.isInteger(limit)||limit<5||limit>120){
   $('studentUrl').value='';$('studentPreview').href='#';
   shareTools.render('',$('qrMount'),$('downloadQr'));
   $('copyStatus').textContent='Vyber platný časový limit 5–120 minut.';
   return;
  }
  const link=urlForStudent();
  $('studentUrl').value=link;
  $('studentPreview').href=link;
  shareTools.render(link,$('qrMount'),$('downloadQr'));
  const locationUrl=new URL(location.href);
  locationUrl.searchParams.set('topic',$('topic').value);
  locationUrl.searchParams.set('level',$('level').value);
  locationUrl.searchParams.set('timer',String(limit));
  history.replaceState(null,'',locationUrl);
 }
 async function loadSources(){
  const serial=++sequence;
  passes=0;count();
  $('mediaSources').replaceChildren();
  $('loadStatus').textContent='Načítám originální médium…';
  $('copyStatus').textContent='Zkopíruj odkaz a pošli jej studentům. Nepředstavuje zabezpečený test.';
  share();
  try{
   const response=await fetch('../../data/cards.json',{credentials:'omit',redirect:'error'});
   if(!response.ok)throw new Error('Katalog HTTP '+response.status);
   const entry=core.catalogEntry(await response.json(),$('topic').value);
   const source=await fetch('../../'+entry.relative,{credentials:'omit',redirect:'error'});
   if(!source.ok)throw new Error('Zdroj HTTP '+source.status);
   const html=await source.text();
   const data=core.extractJson(html,'DATA');
   core.variant(data,$('level').value);
   const links=core.sourceLinks(html);
   if(serial!==sequence)return;
   $('loadStatus').textContent='Původní zdroj pro '+names[entry.id]+' ('+$('level').value+')';
   const namesForSources={youtube:'Původní YouTube',speech:'Projev na YouTube',
    facebook:'Původní Facebook',netflix_post:'Odkaz na příspěvek X',
    official_backup:'Záložní YouTube'};
   for(const link of links){
    // Netflix landing pages are not guaranteed playable speech sources.
    if(link.name==='netflix')continue;
    const a=document.createElement('a');
    a.href=link.url;
    a.target='_blank';
    a.rel='noopener noreferrer';
    a.textContent=namesForSources[link.name]||'Externí původní zdroj';
    a.setAttribute('aria-label','Otevřít '+a.textContent+' v novém panelu');
    $('mediaSources').appendChild(a);
   }
   $('mediaCaution').textContent=entry.id==='ll-peaky-no-fighting'?
    'Upozornění: Peaky Blinders obsahuje vulgarismy, odkazy na drogy a agresivní komunikaci. Posuď vhodnost pro třídu. Dostupnost YouTube je nutné ověřit ve školní síti.':
    entry.id==='ll-harrison-ford'?
    'Zdroj na Facebooku či X může vyžadovat přihlášení nebo nemusí přehrávání umožnit. Před hodinou ověř dostupnost na svém zařízení.':
    'YouTube může zobrazit reklamu nebo omezit přehrávání. Před hodinou ověř zdroj. Nepřenášíme video ani úplný přepis do aplikace.';
  }catch(err){
   if(serial!==sequence)return;
   $('loadStatus').textContent='Nelze načíst původní zdroj: '+String(err.message||err);
   $('mediaCaution').textContent='Nezahajuj poslech, dokud nebude dostupný původní mediální zdroj.';
  }
 }
 async function copy(){
  await shareTools.copy($('studentUrl').value,$('studentUrl'),$('copyStatus'));
 }
 function start(){
  initTheme();
  $('topic').value=core.TOPICS.includes(params.get('topic'))?params.get('topic'):'ll-matthew-oscars';
  $('level').value=core.LEVELS.includes(params.get('level'))?params.get('level'):'B2';
  const preset=Number(params.get('timer'));
  $('timerMinutes').value=Number.isInteger(preset)&&preset>=5&&preset<=120?String(preset):'30';
  $('topic').addEventListener('change',loadSources);
  $('level').addEventListener('change',loadSources);
  $('timerMinutes').addEventListener('input',share);
  $('timerMinutes').addEventListener('change',share);
  $('markPass').addEventListener('click',()=>{if(passes<2){passes++;count()}});
  $('resetPass').addEventListener('click',()=>{passes=0;count()});
  $('copyUrl').addEventListener('click',copy);
  $('downloadQr').addEventListener('click',()=>shareTools.download($('qrMount'),$('copyStatus'),'listening-test-navrh-znamky-qr.svg'));
  $('studentUrl').addEventListener('focus',e=>e.target.select());
  loadSources();
 }
 start();
})();
