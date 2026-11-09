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
const welcome=byId('welcome'),chooser=byId('skillChooser'),catalog=byId('catalog');
let qrUrl='', qrTitle='', toastTimeout=null;
const qrDialog=byId('qrDialog'),qrMount=byId('qrMount');
function toast(message){
 const el=byId('toast');el.textContent=message;el.classList.remove('hidden');
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
function card(e){
 const filter=byId('language').value;
 const language=filter==='all'?'cs':filter;
 const translation=localized(e,filter),czech=localized(e,'all');
 const article=one('article','card');
 article.dataset.topicId=e.id;
 article.dataset.catalogLanguage=language;
 const meta=one('div','skill',tags[e.skill]);article.appendChild(meta);
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
 open.setAttribute('aria-label','Otevřít '+translation.title);
 const share=one('button','action','QR a odkaz');share.type='button';
 share.setAttribute('aria-label','Zobrazit QR kód a odkaz pro '+translation.title);
 share.addEventListener('click',()=>showQr(e));
 actions.append(open,share);article.appendChild(actions);
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
  const cs=localized(e,'all'),target=localized(e,locale);
  return normalizeSearch([cs.title,cs.summary,target.title,target.summary,e.title,e.summary,titles[e.skill]].join(' '))
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
  'Bez filtrů se otevře volný výběr jazyka a úrovně.':
  locale!=='all'&&level!=='all'?
  'Nastavený jazyk a úroveň se otevřou jako pevná varianta.':
  'Je nastavena část parametrů. Ostatní volbu lze změnit v kartě.';
}
function setAppInert(blocked){
 for(const el of document.querySelectorAll('body > header, body > main, body > footer'))
  el.inert=blocked;
}
function closeChooser(){
 chooser.hidden=true;
 const content=welcome.querySelector('.welcome-content');
 content.inert=false;
 byId('skipIntro').focus();
}
function showChooser(){
 if(introTimer!==null){clearTimeout(introTimer);introTimer=null;}
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
function showQr(e){
 qrUrl=currentUrl(e);qrTitle=localized(e).title;
 byId('qrTitle').textContent=qrTitle;
 byId('qrUrl').textContent=qrUrl;
 qrMount.replaceChildren();
 try{
  if(!window.CLBQRCode||typeof window.CLBQRCode.svg!=='function')
   throw new Error('QR modul není dostupný');
  qrMount.appendChild(window.CLBQRCode.svg(qrUrl));
  byId('qrSave').disabled=false;
 }catch(err){
  qrMount.appendChild(one('p','note','QR nelze vytvořit. Odkaz lze zkopírovat: '+err.message));
  byId('qrSave').disabled=true;
 }
 if(typeof qrDialog.showModal==='function')qrDialog.showModal();else qrDialog.setAttribute('open','');
}
async function copyLink(){
 if(!qrUrl)return;
 try{
  await navigator.clipboard.writeText(qrUrl);toast('Odkaz zkopírován');
 }catch(_){
  const input=one('textarea');input.value=qrUrl;document.body.appendChild(input);
  input.select();
  const ok=document.execCommand&&document.execCommand('copy');
  input.remove();toast(ok?'Odkaz zkopírován':'Odkaz označ a zkopíruj ručně');
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
  const [cardsResponse,i18nResponse]=await Promise.all([
   fetch('data/cards.json',{cache:'no-store'}),
   fetch('data/catalog-i18n.json',{cache:'no-store'})
  ]);
  if(!cardsResponse.ok||!i18nResponse.ok)
   throw new Error('HTTP '+cardsResponse.status+' / '+i18nResponse.status);
  const [body,i18n]=await Promise.all([cardsResponse.json(),i18nResponse.json()]);
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
byId('qrClose').addEventListener('click',()=>qrDialog.close());
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