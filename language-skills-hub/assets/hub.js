/* Language Skills Hub – public practice catalog. Local assets, no analytics. */
(()=>{'use strict';
const byId=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const titles={konverzace:'Conversation Lab',cteni:'Reading Lab',poslech:'Listening Lab'};
const tags={konverzace:'Mluvení',cteni:'Čtení',poslech:'Poslech'};
const labels={en:'English',es:'Español',de:'Deutsch',fr:'Français'};
const levels=['A1','A2','B1','B2','C1','C2'];
const allowed=new Set(['konverzace','cteni','poslech']);
let entries=[],translations=new Map(),skill=allowed.has(params.get('skill'))?params.get('skill'):null;
let introTimer=null;
let localSelfCheck=false;
const welcome=byId('welcome'),chooser=byId('skillChooser'),catalog=byId('catalog');
let qrUrl='', qrTitle='', shareEntry=null, toastTimeout=null;
const qrDialog=byId('qrDialog'),qrMount=byId('qrMount');
function toast(message){
 const el=byId('toast');
 // A modal <dialog> sits in the browser top layer; a toast outside it is hidden
 // underneath. While the share dialog is open, show the toast inside it.
 const host=qrDialog.open?qrDialog:document.body;
 if(el.parentElement!==host)host.appendChild(el);
 el.textContent=message;el.classList.remove('hidden');
 if(toastTimeout)clearTimeout(toastTimeout);
 toastTimeout=setTimeout(()=>el.classList.add('hidden'),2600);
}
function opt(select,items,previous){
 select.replaceChildren();
 for(const [value,label] of items){
  const o=document.createElement('option');o.value=value;o.textContent=label;select.appendChild(o);
 }
 if(items.some(([value])=>value===previous))select.value=previous;
}
function langChoices(){
 const active=entries.filter(e=>e.skill===skill);
 const langs=['en','es','de','fr'].filter(l=>active.some(e=>e.languages.includes(l)));
 opt(byId('language'),[['all','Všechny jazyky'],...langs.map(l=>[l,labels[l]])],
  byId('language').value||'all');
}
function currentUrl(e){
 const language=byId('language').value,level=byId('level').value;
 const source=e.lockSource||e.relative;
 const url=new URL(source,document.baseURI);
 url.searchParams.set('practice','1');
 if(language!=='all'&&e.languages.includes(language))url.searchParams.set('lang',language);
 if(level!=='all'&&e.levels.includes(level))url.searchParams.set('level',level);
 // R19: filters are optional. A fully specified pair keeps the original R17
 // fixed-variant behavior; unfiltered cards permit student selection.
 // R21 will add an explicit fixed/free sharing choice independent of filters.
 if(language!=='all'&&level!=='all'&&e.languages.includes(language)&&e.levels.includes(level))
  url.searchParams.set('zamek','1');
 return url.href;
}
function one(tag,cls,text){
 const x=document.createElement(tag);
 if(cls)x.className=cls;
 if(text!==undefined)x.textContent=text;
 return x;
}
/* R20: translations are display-only; original student HTML is never modified. */
function localized(e,filter=byId('language').value){
 const entry=translations.get(e.id);
 if(!entry)throw new Error('Chybí překlad karty: '+e.id);
 const language=filter==='all'?'cs':filter;
 if(!entry[language])throw new Error('Chybí jazyk '+language+' pro '+e.id);
 return entry[language];
}
function normalizeSearch(s){
 return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('cs').trim();
}
function testSetupUrl(e){
 if(!['cteni','poslech'].includes(e.skill))return '';
 const target=e.skill==='cteni'?
  'self-check/reading/teacher.html':'self-check/listening/teacher.html';
 const url=new URL(target,document.baseURI);
 url.searchParams.set('topic',e.id);
 const filter=byId('language').value,level=byId('level').value;
 if(e.languages.includes(filter))url.searchParams.set('lang',filter);
 if(e.levels.includes(level))url.searchParams.set('level',level);
 return url.href;
}
function practiceKeyUrl(e){
 if(!['cteni','poslech'].includes(e.skill))return '';
 const url=new URL('self-check/practice-answers/teacher.html',document.baseURI);
 url.searchParams.set('topic',e.id);
 url.searchParams.set('skill',e.skill); // R50: lab-bound practice results
 const language=byId('language').value,level=byId('level').value;
 if(e.languages.includes(language))url.searchParams.set('lang',language);
 if(e.levels.includes(level))url.searchParams.set('level',level);
 return url.href;
}
/* The catalog identifies a TOPIC, not a particular CEFR variant. A level change
 * updates this compact indicator while keeping the localized topic title stable. */
function catalogVariant(e,languageFilter,levelFilter){
 const chosenLang=e.languages.includes(languageFilter)?languageFilter:null;
 const chosenLevel=e.levels.includes(levelFilter)?levelFilter:null;
 const langLabel=chosenLang?chosenLang.toUpperCase():
  e.languages.length===1?e.languages[0].toUpperCase():e.languages.length+' jazyky';
 const levelLabel=chosenLevel||(
  e.levels.length===levels.length&&e.levels.every((level,i)=>level===levels[i])?
   'A1–C2':e.levels.join(' / '));
 return {label:langLabel+' · '+levelLabel,
  aria:'Jazyk: '+(chosenLang?labels[chosenLang]:
   e.languages.length===1?labels[e.languages[0]]:'všechny dostupné jazyky')+
   '; úroveň: '+(chosenLevel||'všechny dostupné úrovně')};
}
function card(e){
 const filter=byId('language').value,levelFilter=byId('level').value;
 const language=filter==='all'?'cs':filter;
 const translation=localized(e,filter),czech=localized(e,'all');
 const variant=catalogVariant(e,filter,levelFilter);
 const article=one('article','card');
 article.dataset.topicId=e.id;
 article.dataset.catalogLanguage=language;
 article.dataset.catalogLevel=e.levels.includes(levelFilter)?levelFilter:'all';
 const head=one('div','card-meta');
 const meta=one('div','skill',tags[e.skill]);
 const indicator=one('span','catalog-variant',variant.label);
 indicator.lang='cs';
 indicator.setAttribute('aria-label',variant.aria);
 head.append(meta,indicator);article.appendChild(head);
 const title=one('h3',null,translation.title);
 title.lang=language;article.appendChild(title);
 if(filter!=='all'&&translation.title!==czech.title){
  const subtitle=one('p','catalog-czech','Česky: '+czech.title);
  subtitle.lang='cs';article.appendChild(subtitle);
 }
 const summary=one('p','catalog-summary',translation.summary);
 summary.lang=language;article.appendChild(summary);
 article.appendChild(one('p','note',e.languages.length===1?
  'Dostupný jazyk: '+labels[e.languages[0]]:
  'Jazyky: '+e.languages.map(l=>l.toUpperCase()).join(' · ')));
 const actions=one('div','actions');
 const open=one('a','action primary','Otevřít aktivitu');
 open.href=currentUrl(e);open.target='_blank';open.rel='noopener';
 open.setAttribute('aria-label','Otevřít '+translation.title+' · '+variant.aria);
 const share=one('button','action','Sdílet se studenty');share.type='button';
 share.setAttribute('aria-label','Sdílet se studenty: '+translation.title);
 share.addEventListener('click',()=>openShare(e));
 actions.append(open,share);
 if(['cteni','poslech'].includes(e.skill)){
  const key=one('a','action','VÝSLEDKY');
  key.href=practiceKeyUrl(e);key.target='_blank';key.rel='noopener noreferrer';
  key.setAttribute('aria-label','VÝSLEDKY: učitelský klíč k procvičování – '+translation.title);
  key.title='Správná řešení procvičovacích úloh, nikoli výsledky žáků. Část úloh se opakuje i v místních testech. Veřejný podklad bez přihlášení.';
  actions.appendChild(key);
 }
 if(localSelfCheck&&['cteni','poslech'].includes(e.skill)){
  const check=one('a','action test','TEST');
  check.href=testSetupUrl(e);check.target='_blank';check.rel='noopener noreferrer';
  check.setAttribute('aria-label','TEST: '+translation.title);
  check.title='Otevřít test k tématu. Výsledek je místní a případnou školní známku musí ověřit učitel.';
  actions.appendChild(check);
 }
 article.appendChild(actions);
 return article;
}
function render(){
 if(!skill)return;
 const search=normalizeSearch(byId('search').value);
 const locale=byId('language').value,level=byId('level').value;
 const active=entries.filter(e=>e.skill===skill);
 const shown=active.filter(e=>{
  if(locale!=='all'&&!e.languages.includes(locale))return false;
  if(level!=='all'&&!e.levels.includes(level))return false;
  if(!search)return true;
  // Search Czech and every translated title/summary, so "family" or
  // "Weihnachten" also work without a language filter.
  const all=Object.values(translations.get(e.id)||{}).flatMap(t=>[t.title,t.summary]);
  return normalizeSearch([...all,e.title,e.summary,titles[e.skill]].join(' '))
    .includes(search);
 });
 shown.sort((a,b)=>localized(a,locale).title.localeCompare(
  localized(b,locale).title,locale==='all'?'cs':locale));
 const list=byId('cards');list.replaceChildren();
 for(const e of shown)list.appendChild(card(e));
 if(!shown.length)list.appendChild(one('p','empty','Nenalezena žádná aktivita. Zkus jiný jazyk, úroveň nebo hledaný výraz.'));
 byId('summary').textContent=shown.length+' z '+active.length+' témat';
 byId('heading').textContent=titles[skill];
 byId('variantNote').textContent=locale==='all'&&level==='all'?
  'Při otevření bez filtrů si student může vybrat jazyk a úroveň. Sdílení nastavíš samostatně.':
  locale!=='all'&&level!=='all'?
  'Otevření aktivity použije zvolenou variantu. Způsob sdílení studentům nastavíš zvlášť.':
  'Otevření aktivity použije dostupné filtry. Nastavení sdílení se vybírá samostatně.';
}
function setAppInert(blocked){
 for(const el of document.querySelectorAll('body > header, body > main, body > footer'))
  el.inert=blocked;
}
function catalogOpen(){return Boolean(skill)&&!catalog.hidden;}
function closeChooser(){
 if(catalogOpen()){
  // Opened via "Změnit laboratoř": go back to the same catalog, not the intro.
  chooser.hidden=true;welcome.hidden=true;
  welcome.querySelector('.welcome-content').inert=false;
  setAppInert(false);
  byId('changeLab').focus();
  return;
 }
 chooser.hidden=true;
 const content=welcome.querySelector('.welcome-content');
 content.inert=false;
 byId('skipIntro').focus();
}
function showChooser(){
 if(introTimer!==null){clearTimeout(introTimer);introTimer=null;}
 byId('closeChooser').textContent=catalogOpen()?'Zpět do katalogu':'Zpět na úvod';
 welcome.hidden=false;
 chooser.hidden=false;
 welcome.querySelector('.welcome-content').inert=true;
 setAppInert(true);
 chooser.querySelector('[data-choose-skill]').focus();
}
function showCatalog(next,{recordHistory=true,restoreFilters=false}={}){
 if(!allowed.has(next))return;
 if(introTimer!==null){clearTimeout(introTimer);introTimer=null;}
 skill=next;
 welcome.hidden=true;chooser.hidden=true;
 welcome.querySelector('.welcome-content').inert=false;
 setAppInert(false);
 catalog.hidden=false;
 byId('search').value='';
 if(!restoreFilters){byId('language').value='all';byId('level').value='all';}
 langChoices();
 if(restoreFilters){
  const query=new URLSearchParams(location.search);
  const language=query.get('lang'),level=query.get('level');
  if(language&&[...byId('language').options].some(o=>o.value===language))
   byId('language').value=language;
  if(level&&levels.includes(level))byId('level').value=level;
 }
 render();
 if(recordHistory){
  const url=new URL(location.href);
  url.searchParams.set('skill',skill);
  url.searchParams.delete('lang');url.searchParams.delete('level');
  history.pushState({skill},'',url);
 }
 byId('heading').focus({preventScroll:true});
 catalog.scrollIntoView({behavior:'auto',block:'start'});
}
function updateFilters(){
 if(!skill)return;
 render();
 const url=new URL(location.href);
 for(const [key,element] of [['lang',byId('language')],['level',byId('level')]]){
  if(element.value==='all')url.searchParams.delete(key);
  else url.searchParams.set(key,element.value);
 }
 history.replaceState({skill},'',url);
}
function restoreLocation(){
 const query=new URLSearchParams(location.search),chosen=query.get('skill');
 // In-page anchors (#howto, #main) also fire popstate. When the lab did not
 // change, keep the catalog as it is (search text, focus, scroll position).
 if(allowed.has(chosen)&&chosen===skill&&catalogOpen()&&chooser.hidden){
  const language=query.get('lang')||'all',level=query.get('level')||'all';
  const langOk=[...byId('language').options].some(o=>o.value===language);
  const levelOk=level==='all'||levels.includes(level);
  if(langOk&&levelOk&&(byId('language').value!==language||byId('level').value!==level)){
   byId('language').value=language;byId('level').value=level;render();
  }
  return;
 }
 if(allowed.has(chosen)){
  showCatalog(chosen,{recordHistory:false,restoreFilters:true});
 }else{
  skill=null;catalog.hidden=true;
  setAppInert(true);showChooser();
 }
}
function initEntry(){
 const query=new URLSearchParams(location.search),chosen=query.get('skill');
 if(allowed.has(chosen)){
  showCatalog(chosen,{recordHistory:false,restoreFilters:true});
 }else{
  catalog.hidden=true;
  setAppInert(true);
  const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  introTimer=setTimeout(showChooser,reduced?0:3000);
 }
}
/* R21: sharing settings are independent of optional catalog preview filters.
 * The "fixed" URL is a UI-only preset and NEVER a secure testing mechanism. */
function shareMode(){
 return byId('shareFixed').checked?'fixed':'free';
}
function makeShareUrl(e,mode,language,level){
 const url=new URL(e.lockSource||e.relative,document.baseURI);
 url.searchParams.set('practice','1');
 if(mode==='free')return url.href;
 if(mode!=='fixed'||!e.languages.includes(language)||!e.levels.includes(level))
  return '';
 url.searchParams.set('lang',language);
 url.searchParams.set('level',level);
 url.searchParams.set('zamek','1');
 return url.href;
}
function updateSharePreview(){
 if(!shareEntry)return;
 const fixed=shareMode()==='fixed';
 byId('shareFixedFields').hidden=!fixed;
 const locale=byId('shareLanguage').value,level=byId('shareLevel').value;
 const valid=!fixed||(shareEntry.languages.includes(locale)&&shareEntry.levels.includes(level));
 qrUrl=valid?makeShareUrl(shareEntry,fixed?'fixed':'free',locale,level):'';
 const box=byId('qrUrl');
 box.value=qrUrl;
 byId('qrCopy').disabled=!valid;
 byId('qrSave').disabled=true;
 const mount=qrMount;
 mount.replaceChildren();
 if(!valid){
  const missing=[];
  if(!shareEntry.languages.includes(locale))missing.push('jazyk');
  if(!shareEntry.levels.includes(level))missing.push('úroveň');
  byId('shareStatus').textContent='Pro sdílení s přednastavením vyber '+missing.join(' a ')+'.';
  mount.appendChild(one('p','share-qr-placeholder','Po výběru se zde zobrazí QR kód.'));
  return;
 }
 byId('shareStatus').textContent=fixed?
  'Učitel nastavil '+labels[locale]+' · '+level+'. Zámek je pouze v rozhraní karty.':
  shareEntry.languages.length===1?
  'Student si vybere úroveň A1–C2. Jazyk této karty je pouze '+labels[shareEntry.languages[0]]+'.':
  'Student si v kartě vybere jazyk i úroveň A1–C2.';
 try{
  if(!window.CLBQRCode||typeof window.CLBQRCode.svg!=='function')
   throw new Error('QR modul není dostupný');
  const svg=window.CLBQRCode.svg(qrUrl);
  if(!svg||svg.nodeName.toLowerCase()!=='svg')throw new Error('Neplatný QR kód');
  mount.appendChild(svg);
  byId('qrSave').disabled=false;
 }catch(_){
  mount.appendChild(one('p','share-qr-placeholder','QR kód momentálně není dostupný. Odkaz lze stále zkopírovat.'));
 }
}
function openShare(e){
 shareEntry=e;
 qrTitle=localized(e).title;
 byId('qrTitle').textContent=qrTitle;
 byId('shareFree').checked=true;
 byId('shareFixed').checked=false;
 const selected=byId('language').value,level=byId('level').value;
 const languages=[['','Vyber jazyk'],...e.languages.map(l=>[l,labels[l]])];
 const preferred=e.languages.includes(selected)?selected:(e.languages.length===1?e.languages[0]:'');
 opt(byId('shareLanguage'),languages,preferred);
 byId('shareLevel').value=e.levels.includes(level)?level:'';
 updateSharePreview();
 if(typeof qrDialog.showModal==='function')qrDialog.showModal();
 else qrDialog.setAttribute('open','');
 byId('shareFree').focus({preventScroll:true});
}
async function copyLink(){
 if(!qrUrl||!shareEntry)return;
 const field=byId('qrUrl');
 try{
  if(!navigator.clipboard||typeof navigator.clipboard.writeText!=='function')
   throw new Error('Clipboard API unavailable');
  await navigator.clipboard.writeText(qrUrl);
  toast('Odkaz pro studenty zkopírován');
 }catch(_){
  field.focus();
  field.select();
  field.setSelectionRange(0,field.value.length);
  let copied=false;
  try{copied=Boolean(document.execCommand&&document.execCommand('copy'));}
  catch(_){}
  toast(copied?'Odkaz pro studenty zkopírován':
   'Odkaz je označen. Použij Ctrl+C nebo nabídku Kopírovat.');
 }
}
function saveQr(){
 const svg=qrMount.querySelector('svg');if(!svg)return;
 const xml=new XMLSerializer().serializeToString(svg);
 const blob=new Blob([xml],{type:'image/svg+xml;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=one('a');
 a.href=url;a.download='LSH-'+qrTitle.toLocaleLowerCase('cs').normalize('NFKD')
  .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]+/g,'-').slice(0,44)+'-QR.svg';
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
async function load(){
 try{
  const [cardsResponse,i18nResponse,policyResponse]=await Promise.all([
   fetch('data/cards.json',{cache:'no-store'}),
   fetch('data/catalog-i18n.json',{cache:'no-store'}),
   fetch('data/test-mode-policy.json',{cache:'no-store'}).catch(()=>null)
  ]);
  if(!cardsResponse.ok||!i18nResponse.ok)
   throw new Error('HTTP '+cardsResponse.status+' / '+i18nResponse.status);
  const [body,i18n]=await Promise.all([cardsResponse.json(),i18nResponse.json()]);
  const policy=policyResponse?.ok?
   await policyResponse.json().catch(()=>null):null;
  // Fail closed: optional test links require an explicit safe public policy.
  localSelfCheck=policy?.status==='PUBLIC_LOCAL_GRADE_PROPOSALS'&&
   policy?.backendEnabled===false&&policy?.gradedTestsEnabled===false&&
   policy?.officialGradesEnabled===false&&policy?.selfCheckEnabled===true&&
   policy?.testUiEnabled===true&&
   policy?.localGradeProposalsEnabled===true;
  if(body.kind!=='LSH_PUBLIC_PRACTICE_R17'||!Array.isArray(body.entries)||body.entries.length!==29)
   throw new Error('Katalog nemá očekávanou strukturu');
  if(i18n.kind!=='LSH_CATALOG_I18N_R20'||i18n.schemaVersion!==1||
     i18n.defaultLanguage!=='cs'||!i18n.entries||
     typeof i18n.entries!=='object'||Object.keys(i18n.entries).length!==29)
   throw new Error('Překladový slovník nemá očekávanou strukturu');
  const seen=new Set();
  for(const e of body.entries){
   if(!allowed.has(e.skill)||!e.id||seen.has(e.id)||!e.title||!e.relative||
      !e.languages?.length||!e.languages.every(l=>l in labels))
    throw new Error('Neplatná metadata katalogu');
   seen.add(e.id);
   const translated=i18n.entries[e.id],expected=['cs',...e.languages].sort();
   if(!translated||JSON.stringify(Object.keys(translated).sort())!==JSON.stringify(expected))
    throw new Error('Chybějící překlad jazykové varianty: '+e.id);
   for(const lang of expected){
    if(typeof translated[lang]?.title!=='string'||translated[lang].title.trim().length<2||
       typeof translated[lang]?.summary!=='string'||translated[lang].summary.trim().length<10)
     throw new Error('Neplatný překlad '+lang+' pro '+e.id);
   }
  }
  translations=new Map(Object.entries(i18n.entries));
  entries=body.entries;
  if(skill){
   langChoices();
   const query=new URLSearchParams(location.search);
   if([...byId('language').options].some(o=>o.value===query.get('lang')))
    byId('language').value=query.get('lang');
   if(levels.includes(query.get('level')))byId('level').value=query.get('level');
   render();
  }
 }catch(err){
  const cards=byId('cards');cards.replaceChildren();
  cards.appendChild(one('p','empty','Katalog se nepodařilo načíst. Obnov stránku nebo informuj správce: '+err.message));
  byId('summary').textContent='Katalog není dostupný';
 }
}
for(const b of chooser.querySelectorAll('[data-choose-skill]'))
 b.addEventListener('click',()=>showCatalog(b.dataset.chooseSkill));
byId('skipIntro').addEventListener('click',showChooser);
byId('closeChooser').addEventListener('click',closeChooser);
byId('changeLab').addEventListener('click',showChooser);
chooser.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();closeChooser();return;}
 if(event.key!=='Tab')return;
 const items=[...chooser.querySelectorAll('button:not([disabled])')];
 const first=items[0],last=items.at(-1);
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
window.addEventListener('popstate',restoreLocation);
byId('language').addEventListener('change',updateFilters);
byId('level').addEventListener('change',updateFilters);
byId('search').addEventListener('input',render);
byId('qrClose').addEventListener('click',()=>{
 if(typeof qrDialog.close==='function')qrDialog.close();else qrDialog.removeAttribute('open');
});
byId('shareFree').addEventListener('change',updateSharePreview);
byId('shareFixed').addEventListener('change',updateSharePreview);
byId('shareLanguage').addEventListener('change',updateSharePreview);
byId('shareLevel').addEventListener('change',updateSharePreview);
byId('qrUrl').addEventListener('focus',event=>event.target.select());
byId('qrUrl').addEventListener('click',event=>event.target.select());
qrDialog.addEventListener('close',()=>{
 shareEntry=null;qrUrl='';
 const el=byId('toast');if(el.parentElement!==document.body)document.body.appendChild(el);
});
byId('qrCopy').addEventListener('click',copyLink);
byId('qrSave').addEventListener('click',saveQr);

/* R18: teacher catalog theme and fullscreen are deliberately independent
   from language/CEFR selection and from the underlying student cards. */
const THEME_KEY='lsh:catalog-theme:v1';
function syncTheme(){
 const light=document.documentElement.getAttribute('data-theme')==='light';
 const button=byId('themeToggle');
 const action=light?'Zapnout noční režim':'Zapnout denní režim';
 button.setAttribute('aria-pressed',String(light));
 button.setAttribute('aria-label',action);
 button.title=action;
 byId('themeIcon').textContent=light?'☾':'☀';
 byId('themeLabel').textContent=light?'Noční režim':'Denní režim';
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.setAttribute('content',light?'#f4f8fc':'#081526');
}
function toggleTheme(){
 const next=document.documentElement.getAttribute('data-theme')==='light'?'dark':'light';
 document.documentElement.setAttribute('data-theme',next);
 try{window.localStorage.setItem(THEME_KEY,next);}catch(_){}
 syncTheme();
}
function syncFullscreen(){
 const active=Boolean(document.fullscreenElement);
 const action=active?'Ukončit celou obrazovku':'Přejít na celou obrazovku';
 const button=byId('fullscreenToggle');
 button.setAttribute('aria-pressed',String(active));
 button.setAttribute('aria-label',action);
 button.title=action;
 byId('fullscreenIcon').textContent=active?'▣':'⛶';
 byId('fullscreenLabel').textContent=active?'Ukončit fullscreen':'Celá obrazovka';
}
async function toggleFullscreen(){
 try{
  if(document.fullscreenElement){
   if(typeof document.exitFullscreen!=='function')
    throw new Error('Fullscreen exit is unsupported');
   await document.exitFullscreen();
  }else{
   const target=document.documentElement;
   if(typeof target.requestFullscreen!=='function'){
    toast('Na tomto zařízení prohlížeč fullscreen nepodporuje.');
    return;
   }
   await target.requestFullscreen();
  }
 }catch(_){
  toast('Prohlížeč nepovolil režim celé obrazovky.');
 }finally{
  syncFullscreen();
 }
}
byId('themeToggle').addEventListener('click',toggleTheme);
byId('fullscreenToggle').addEventListener('click',toggleFullscreen);
document.addEventListener('fullscreenchange',syncFullscreen);
document.addEventListener('fullscreenerror',()=>toast('Prohlížeč nepovolil režim celé obrazovky.'));
syncTheme();
syncFullscreen();
initEntry();
load();
})();