/* R53: fixed-topic Listening TEST setup. Only the selected card's media URL and
 * CEFR/timer/share controls are shown; no playback counter or cross-topic switch.
 * Public, serverless teacher helper: never claims control over external playback. */
(()=>{
 'use strict';
 const core=window.LSHListeningCore,shareTools=window.LSHShareTools;
 const $=id=>document.getElementById(id);
 const params=new URLSearchParams(location.search);
 const attemptId='class'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);

 // Source URLs mirror the original public Listening cards. The R53 static CI
 // validates every URL and topic against data/cards.json and each card's SOURCES.
 // Keeping these links local makes the video reachable without a catalog fetch.
 const topics=Object.freeze({
  'll-matthew-oscars':{
   title:'Matthew McConaughey · Oscars 2014',
   source:'poslech/matthew-oscars/index.html',
   media:[
    {key:'speech',url:'https://www.youtube.com/watch?v=wD2cVhC-63I&t=70s',label:'Otevřít projev na YouTube (od 1:10)'},
    {key:'youtube',url:'https://www.youtube.com/watch?v=wD2cVhC-63I',label:'Celý původní záznam na YouTube'}
   ],
   caution:'YouTube může zobrazit reklamu nebo přehrávání omezit. Před hodinou zkontroluj dostupnost.'
  },
  'll-harrison-ford':{
   title:'Harrison Ford · Life Achievement Speech',
   source:'poslech/harrison-ford/index.html',
   media:[
    {key:'facebook',url:'https://www.facebook.com/netflixus/videos/harrison-ford-sag-life-achievement-award/796302026840392/',label:'Otevřít původní video na Facebooku'},
    {key:'netflix_post',url:'https://x.com/netflix/status/2028305176508170602',label:'Alternativní záznam na X'}
   ],
   caution:'Facebook či X může vyžadovat přihlášení nebo omezit přehrávání. Ověř zdroj na školním zařízení.'
  },
  'll-sad':{
   title:'Seasonal Affective Disorder · TED-Ed',
   source:'poslech/sad/index.html',
   levels:['A1','A2','B1','B2','C1','C2'],
   media:[
    {key:'youtube',url:'https://www.youtube.com/watch?v=0RiDPisQAzM',label:'Přehrát originál TED-Ed na YouTube'},
    {key:'teded',url:'https://ed.ted.com/lessons/how-to-tell-if-you-have-seasonal-affective-disorder-kelly-rohan',label:'Oficiální lekce TED-Ed (alternativa)'}
   ],
   caution:'Obsahové upozornění: video hovoří o depresi a zmiňuje sebevražedné myšlenky. Nevyžadujte osobní zdravotní zkušenosti žáků.'
  },
  'll-conlangs':{
   title:'Constructed Languages · TED-Ed',
   source:'poslech/conlangs/index.html',
   levels:['A1','A2','B1','B2','C1','C2'],
   media:[
    {key:'youtube',url:'https://www.youtube.com/watch?v=a5mZ0R3h8m0',label:'Play the original TED-Ed video'},
    {key:'teded',url:'https://ed.ted.com/lessons/are-elvish-klingon-dothraki-and-na-vi-real-languages-john-mcwhorter',label:'Official TED-Ed lesson'}
   ],
   caution:'Check external playback on your school network before class. No student logins are required.'
  },
  'll-peaky-no-fighting':{
   title:'Peaky Blinders · No Fighting',
   source:'poslech/peaky-no-fighting/index.html',
   media:[
    {key:'youtube',url:'https://www.youtube.com/watch?v=DRLSRX1nF0s',label:'Otevřít původní video na YouTube'},
    {key:'official_backup',url:'https://www.youtube.com/watch?v=_hzgUPl3YWU',label:'Záložní video na YouTube'}
   ],
   caution:'Upozornění: obsahuje vulgarismy, odkazy na drogy a agresivní komunikaci. Před hodinou ověř vhodnost i dostupnost videa.'
  }
 });
 const topicId=params.get('topic');
 const chosen=Object.hasOwn(topics,topicId)?topics[topicId]:null;
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
 function renderMedia(){
  const mount=$('mediaSources');mount.replaceChildren();
  if(!chosen)return;
  for(const [index,media] of chosen.media.entries()){
   const url=new URL(media.url);
   if(url.protocol!=='https:'||!['www.youtube.com','youtube.com',
    'www.facebook.com','facebook.com','x.com','ed.ted.com'].includes(url.hostname))
    throw new Error('Nepovolený původní zdroj videa.');
   const a=document.createElement('a');
   a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';
   a.className=index===0?'listening-video-primary':'listening-video-alternative';
   a.dataset.source=media.key;
   a.textContent=(index===0?'▶ ':'↗ ')+media.label;
   a.setAttribute('aria-label',media.label+' – otevře se v nové záložce');
   mount.appendChild(a);
  }
  $('mediaCaution').textContent=chosen.caution;
  $('loadStatus').textContent='Odkaz na zdrojové video je připraven.';
 }
 function studentUrl(){
  const u=new URL('student.html',location.href);
  u.search='';
  u.searchParams.set('topic',topicId);
  u.searchParams.set('level',$('level').value);
  u.searchParams.set('timer',$('timerMinutes').value);
  u.searchParams.set('attempt',attemptId);
  return u.href;
 }
 function invalidate(reason){
  $('studentUrl').value='';
  $('copyUrl').disabled=true;
  $('studentPreview').href='#';
  $('studentPreview').setAttribute('aria-disabled','true');
  shareTools.render('',$('qrMount'),$('downloadQr'));
  $('setupStatus').textContent=reason;
  $('copyStatus').textContent='Studentský odkaz není dostupný.';
 }
 function share(){
  if(!chosen){invalidate('Neplatný odkaz: zvolená poslechová karta neexistuje. Vrať se do katalogu.');return}
  const limit=Number($('timerMinutes').value),level=$('level').value;
  if(!Number.isInteger(limit)||limit<5||limit>120||!core.LEVELS.includes(level)||(chosen.levels&&!chosen.levels.includes(level))){
   invalidate('Nastav platnou úroveň A1–C2 a časový limit 5–120 minut.');
   return;
  }
  const link=studentUrl();
  $('copyUrl').disabled=false;
  $('studentPreview').setAttribute('aria-disabled','false');
  $('studentUrl').value=link;
  $('studentPreview').href=link;
  shareTools.render(link,$('qrMount'),$('downloadQr'));
  $('setupStatus').textContent='Připraveno: '+chosen.title+' · '+level+' · '+limit+' minut.';
  $('copyStatus').textContent='Odkaz a QR kód obsahují pevnou kartu, úroveň a časový limit.';
  const next=new URL(location.href);
  next.searchParams.set('topic',topicId);
  next.searchParams.set('level',level);
  next.searchParams.set('timer',String(limit));
  history.replaceState(null,'',next);
 }
 function start(){
  initTheme();
  $('copyUrl').addEventListener('click',()=>
   shareTools.copy($('studentUrl').value,$('studentUrl'),$('copyStatus')));
  $('downloadQr').addEventListener('click',()=>
   shareTools.download($('qrMount'),$('copyStatus'),'listening-test-navrh-znamky-qr.svg'));
  $('studentUrl').addEventListener('focus',event=>event.target.select());
  $('studentPreview').addEventListener('click',event=>{
   if(!$('studentUrl').value)event.preventDefault();
  });
  if(!chosen){
   $('topicTitle').textContent='Kartu nelze otevřít';
   $('mediaCaution').textContent='Vrať se do Listening Lab a klikni na TEST u konkrétní karty.';
   $('loadStatus').textContent='Chybí platné téma v odkazu.';
   invalidate('Neplatný odkaz: chybí konkrétní poslechová karta.');
   return;
  }
  $('topicTitle').textContent=chosen.title;
  $('topicTitle').dataset.topicId=topicId;
  document.title='Listening Lab · TEST · '+chosen.title;
  const allowed=chosen.levels||core.LEVELS;
  for(const option of $('level').options){
   option.disabled=!allowed.includes(option.value);
   option.hidden=!allowed.includes(option.value);
  }
  $('level').value=allowed.includes(params.get('level'))?params.get('level'):
   (allowed.includes('B2')?'B2':allowed[0]);
  const preset=Number(params.get('timer'));
  $('timerMinutes').value=Number.isInteger(preset)&&preset>=5&&preset<=120?String(preset):'30';
  $('level').addEventListener('change',share);
  $('timerMinutes').addEventListener('input',share);
  $('timerMinutes').addEventListener('change',share);
  renderMedia();
  share();
 }
 start();
})();
