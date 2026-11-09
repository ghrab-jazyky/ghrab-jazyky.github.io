/* Language Skills Hub – public practice catalog. Local assets, no analytics. */
(()=>{'use strict';
const byId=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const titles={konverzace:'Conversation Lab',cteni:'Reading Lab',poslech:'Listening Lab'};
const tags={konverzace:'Speaking',cteni:'Reading',poslech:'Listening'};
const labels={en:'English',es:'Español',de:'Deutsch',fr:'Français'};
const levels=['A1','A2','B1','B2','C1','C2'];
const allowed=new Set(['konverzace','cteni','poslech']);
let entries=[],skill=allowed.has(params.get('skill'))?params.get('skill'):'all';
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
 const active=entries.filter(e=>skill==='all'||e.skill===skill);
 const langs=['en','es','de','fr'].filter(l=>active.some(e=>e.languages.includes(l)));
 opt(byId('language'),langs.map(l=>[l,labels[l]]),byId('language').value||'en');
}
function currentUrl(e){
 const language=e.languages.includes(byId('language').value)?
  byId('language').value:e.languages[0];
 const level=byId('level').value;
 const source=e.lockSource||e.relative;
 return new URL(source+'?lang='+language+'&level='+level+'&zamek=1&practice=1',document.baseURI).href;
}
function one(tag,cls,text){
 const x=document.createElement(tag);
 if(cls)x.className=cls;
 if(text!==undefined)x.textContent=text;
 return x;
}
function card(e){
 const article=one('article','card');
 article.dataset.topicId=e.id;
 const meta=one('div','skill',tags[e.skill]);article.appendChild(meta);
 const title=one('h3',null,e.title);article.appendChild(title);
 if(e.summary)article.appendChild(one('p',null,e.summary));
 const locale=byId('language').value;
 article.appendChild(one('p','note',e.languages.length===1?
  'Dostupný jazyk: '+labels[e.languages[0]]:
  'Jazyky: '+e.languages.map(l=>l.toUpperCase()).join(' · ')+
  (e.languages.includes(locale)?'':' · Otevře se '+labels[e.languages[0]])));
 const actions=one('div','actions');
 const open=one('a','action primary','Otevřít aktivitu');
 open.href=currentUrl(e);open.target='_blank';open.rel='noopener';
 open.setAttribute('aria-label','Otevřít '+e.title);
 const share=one('button','action','QR a odkaz');share.type='button';
 share.setAttribute('aria-label','Zobrazit QR kód a odkaz pro '+e.title);
 share.addEventListener('click',()=>showQr(e));
 actions.append(open,share);article.appendChild(actions);
 return article;
}
function render(){
 for(const b of document.querySelectorAll('.tab'))
  b.setAttribute('aria-pressed',String(b.dataset.skill===skill));
 const search=byId('search').value.toLocaleLowerCase('cs').trim();
 const shown=entries.filter(e=>(skill==='all'||e.skill===skill)&&
  (!search||(e.title+' '+(e.summary||'')+' '+titles[e.skill]).toLocaleLowerCase('cs').includes(search)));
 const list=byId('cards');list.replaceChildren();
 for(const e of shown)list.appendChild(card(e));
 if(!shown.length)list.appendChild(one('p','empty','Nenalezena žádná aktivita. Zkus jiný filtr nebo vymazat hledání.'));
 byId('summary').textContent=shown.length+' z '+entries.length+' témat · A1–C2';
 byId('heading').textContent=skill==='all'?'Všechny jazykové aktivity':titles[skill];
}
function setSkill(next){
 skill=next;
 langChoices();render();
 const u=new URL(location.href);
 if(skill==='all')u.searchParams.delete('skill');else u.searchParams.set('skill',skill);
 history.replaceState(null,'',u);
}
function showQr(e){
 qrUrl=currentUrl(e);qrTitle=e.title;
 byId('qrTitle').textContent=e.title;
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
  const response=await fetch('data/cards.json',{cache:'no-store'});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const body=await response.json();
  if(body.kind!=='LSH_PUBLIC_PRACTICE_R17'||!Array.isArray(body.entries)||body.entries.length!==29)
   throw new Error('Katalog nemá očekávanou strukturu');
  entries=body.entries;
  if(entries.some(e=>!allowed.has(e.skill)||!e.id||!e.title||!e.relative||
   !e.languages?.length||!e.languages.every(l=>l in labels)))
   throw new Error('Neplatná metadata katalogu');
  entries.sort((a,b)=>a.title.localeCompare(b.title,'cs'));
  langChoices();
  render();
 }catch(err){
  const cards=byId('cards');cards.replaceChildren();
  cards.appendChild(one('p','empty','Katalog se nepodařilo načíst. Obnov stránku nebo informuj správce: '+err.message));
  byId('summary').textContent='Katalog není dostupný';
 }
}
for(const b of document.querySelectorAll('.tab'))
 b.addEventListener('click',()=>setSkill(b.dataset.skill));
byId('language').addEventListener('change',render);
byId('level').addEventListener('change',render);
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
load();
})();