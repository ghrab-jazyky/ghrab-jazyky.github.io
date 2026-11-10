/* R39 isolated, read-only assessment QA index. Drafts are NOT approved exams. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
 const state={cards:[],manifest:null,link:'',serial:0};
 const skillValue=s=>s==='reading'?'cteni':'poslech';
 const safeId=s=>typeof s==='string'&&/^(rl|ll)-[a-z0-9-]{3,76}$/.test(s);
 function option(id,label){
  const el=document.createElement('option');el.value=id;el.textContent=label;return el;
 }
 function renderStats(){
  const box=$('stats');box.replaceChildren();
  for(const [number,title] of [['120','Reading: 5 témat × 4 jazyky × 6 úrovní'],
    ['18','Listening: 3 témata × 6 úrovní'],
    ['138','Autorsky připravených bank v pracovním repozitáři'],
    ['0','Pedagogicky schválených a publikovaných testů']]){
   const node=document.createElement('div');node.className='r39-stat';
   const strong=document.createElement('strong');strong.textContent=number;
   const text=document.createElement('span');text.textContent=title;
   node.append(strong,text);box.append(node);
  }
 }
 function entries(){
  return state.cards.filter(c=>c.skill===skillValue($('skill').value));
 }
 function topics(){
  const previous=$('topic').value;
  const relevant=entries();
  $('topic').replaceChildren(...relevant.map(e=>option(e.id,e.title)));
  if(relevant.some(e=>e.id===previous))$('topic').value=previous;
  const listening=$('skill').value==='listening';
  $('language').disabled=listening;
  if(listening)$('language').value='en';
  refresh();
 }
 async function get(url){
  const response=await fetch(url,{credentials:'omit',redirect:'error',cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  return response.json();
 }
 function invalidate(message){
  state.link='';
  $('previewLink').href='#';
  $('previewLink').setAttribute('aria-disabled','true');
  $('copyLink').disabled=true;
  $('variantStatus').textContent=message;
 }
 function checkedTimer(){
  const text=$('timer').value;
  if(!/^[1-9][0-9]{0,2}$/.test(text))return null;
  const n=Number(text);
  return Number.isInteger(n)&&n>=5&&n<=120?n:null;
 }
 async function refresh(){
  const number=++state.serial,skill=$('skill').value,topic=$('topic').value;
  const lang=skill==='listening'?'en':$('language').value,level=$('level').value;
  invalidate('Ověřuji neschválenou testovou banku a návaznost na původní text…');
  if(!state.manifest)return;
  const card=state.cards.find(c=>c.id===topic&&c.skill===skillValue(skill));
  if(!card||!safeId(topic)||!LANGS.includes(lang)||!LEVELS.includes(level)||
   !card.languages.includes(lang)||!card.levels.includes(level)){
   invalidate('Požadovaná varianta není dostupná v aktuálním katalogu.');return;
  }
  try{
   const relative=skill+'/'+topic+'/'+lang+'-'+level+'.json';
   const bank=await get(relative);
   if(number!==state.serial)return;
   if(bank.topic!==topic||bank.language!==lang||bank.level!==level||
    bank.status!=='DRAFT_PENDING_TEACHER_CONTENT_APPROVAL'||bank.published!==false||
    bank.sourcePracticeContentHash!==state.manifest.contentHashes[topic])
    throw Error('Banka má nesprávný zdrojový otisk nebo příznak publikování');
   const count=skill==='reading'?bank.questions?.length:
    (bank.objective?.length||0)+(bank.written?.length||0);
   if(count!==(skill==='reading'?10:8))throw Error('Neočekávaný počet položek');
   const timer=checkedTimer();
   if(timer===null){
    invalidate('Nastav celý počet minut 5–120.');return;
   }
   const url=new URL(skill+'/preview.html',document.baseURI);
   for(const [key,value]of Object.entries({topic,lang,level,timer:String(timer),
    attempt:'r37qa'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}))
    url.searchParams.set(key,value);
   state.link=url.href;
   $('previewLink').href=state.link;
   $('previewLink').setAttribute('aria-disabled','false');
   $('copyLink').disabled=false;
   $('variantStatus').textContent=card.title+' · '+lang.toUpperCase()+'/'+level+
    ' · '+count+' úloh · návrh čeká na pedagogické schválení.'+
    ' Testový čas '+timer+' minut · žádná ověřená školní známka.';
   $('copyStatus').textContent='Odkaz pouze pro interní QA; neposílat studentům.';
  }catch(e){
   if(number===state.serial)invalidate('Přejímka blokována: '+String(e.message||e));
  }
 }
 async function initialize(){
  $('setup').addEventListener('submit',e=>e.preventDefault());
  $('skill').addEventListener('change',topics);
  for(const id of ['topic','language','level'])$(id).addEventListener('change',refresh);
  $('timer').addEventListener('change',refresh);$('timer').addEventListener('input',refresh);
  $('previewLink').addEventListener('click',e=>{if(!state.link)e.preventDefault()});
  $('copyLink').addEventListener('click',async()=>{
   if(!state.link)return;
   try{await navigator.clipboard.writeText(state.link);
    $('copyStatus').textContent='QA odkaz zkopírován.';}
   catch(_){$('copyStatus').textContent='Kopírování není dostupné; otevři a zkopíruj URL ručně.';}
  });
  try{
   const [catalog,manifest]=await Promise.all([
    get('../../data/cards.json'),get('../../version.json')
   ]);
   if(manifest.version!=='R31'||manifest.gradedTestsEnabled||manifest.officialGradesEnabled)
    throw Error('Produkční manifest není očekávaná bezpečná R31');
   state.cards=catalog.entries.filter(e=>['cteni','poslech'].includes(e.skill));
   if(state.cards.filter(e=>e.skill==='cteni').length!==5||
    state.cards.filter(e=>e.skill==='poslech').length!==3||
    !state.cards.every(e=>safeId(e.id)))
    throw Error('Katalog neobsahuje očekávaných osm zdrojových témat');
   state.manifest=manifest;renderStats();topics();
  }catch(e){invalidate('Nelze otevřít QA přehled: '+String(e.message||e));}
 }
 initialize();
})();
