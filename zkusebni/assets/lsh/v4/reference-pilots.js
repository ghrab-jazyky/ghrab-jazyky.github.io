/* R5 reference preview directory. Does not claim fixed variants or approved tests. */
(function(){
'use strict';
const ROOT='/zkusebni/';
const SKILLS=Object.freeze({konverzace:'Conversation Lab',cteni:'Reading Lab',poslech:'Listening Lab'});
const LANGS=Object.freeze({en:'EN',es:'ES',de:'DE',fr:'FR'});
const LEVELS=['A1','A2','B1','B2','C1','C2'];
const $=id=>document.getElementById(id);
let entries=[];
let selected=null;
const list=$('refList'),dialog=$('refDialog'),status=$('refDialogStatus');
function el(tag,klass,txt){const x=document.createElement(tag);if(klass)x.className=klass;if(txt!==undefined)x.textContent=String(txt);return x;}
function isValid(v){
 return v&&/^(cl|rl|ll)-[a-z0-9-]+$/.test(v.id)&&SKILLS[v.skill]&&typeof v.title==='string'&&v.title.length<160&&typeof v.summary==='string'&&
 typeof v.studentPath==='string'&&/^(?:integrace\/(?:konverzace|cteni|poslech)|konverzace)\/[a-z0-9-]+\/$/.test(v.studentPath)&&v.studentPath.split('/').includes(v.skill)&&v.fixedVariantSupported===true&&typeof v.selfContainedHtml==='boolean'&&typeof v.isReference==='boolean'&&v.defaultLanguage==='en'&&LEVELS.includes(v.defaultLevel)&&
 Array.isArray(v.languages)&&v.languages.length>0&&v.languages.every(x=>LANGS[x])&&
 Array.isArray(v.levels)&&v.levels.length===6&&LEVELS.every(x=>v.levels.includes(x))&&v.practice==='preview'&&v.test==='not-ready';
}
function urlOf(entry,mode,lang,level){
 const url=new URL(entry.studentPath,new URL(ROOT,location.origin));
 if(mode==='fixed'){
  if(!entry.languages.includes(lang)||!entry.levels.includes(level))throw new Error('Unavailable variant');
  url.searchParams.set('lang',lang);
  url.searchParams.set('level',level);
  url.searchParams.set('zamek','1');
 }
 url.searchParams.set('practice','1');
 return url.href;
}
function filtered(){
 const q=$('refSearch').value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('cs');
 return entries.filter(v=>{
  const text=(v.title+' '+v.summary+' '+v.focus).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('cs');
  return (!$('refSkill').value||v.skill===$('refSkill').value)&&
   (!$('refLanguage').value||v.languages.includes($('refLanguage').value))&&
   (!$('refLevel').value||v.levels.includes($('refLevel').value))&&(!q||text.includes(q));
 });
}
function render(){
 const items=filtered();list.replaceChildren();
 $('refCount').textContent='Zobrazeno '+items.length+' z '+entries.length+' pilotních karet.';
 $('refEmpty').hidden=items.length!==0;
 for(const e of items){
  const card=el('article',e.isReference?'ref-card ref-card-reference':'ref-card ref-card-migration');
  const top=el('div','ref-card-top');
  const badges=el('div','ref-tags');
  badges.append(el('span','ref-chip',SKILLS[e.skill]),el('span','ref-chip',e.isReference?'REFERENČNÍ VZOR':'MIGRACE · ČEKÁ NA SCHVÁLENÍ'),el('span','ref-chip ref-pilot','PILOT · NESCHVÁLENO'));
  top.append(badges,el('h3',null,e.title),el('p',null,e.summary));
  const info=el('p','ref-info',e.languages.map(l=>LANGS[l]).join(' · ')+'   |   A1–C2   |   '+e.sourceVersion);
  const focus=el('p','ref-focus',e.focus);
  const actions=el('div','ref-card-actions');
  const preview=el('button','button primary','Procvičování · náhled');preview.type='button';preview.addEventListener('click',()=>open(e));
  const test=el('button','button outline','Testování · připravujeme');test.type='button';test.disabled=true;test.setAttribute('aria-label','Testovací verze karty '+e.title+' zatím není hotová');
  actions.append(preview,test);
  card.append(top,info,focus,actions);list.append(card);
 }
}
function refreshShare(){
 if(!selected)return;
 const fixed=$('refMode').value==='fixed';
 $('refFixedFields').hidden=!fixed;
 $('refModeHint').textContent=fixed?
  'Zvolené nastavení bude ve studentské kartě uzamčeno v rozhraní. GitHub Pages však nezaručuje bezpečné zkoušení.' :
  'Student může v kartě přepínat všechny skutečně dostupné jazyky a úrovně. Odkaz a QR obsahují procvičovací režim.';
 try{
  const url=urlOf(selected,fixed?'fixed':'free',$('refShareLang').value,$('refShareLevel').value);
  $('refUrl').value=url;$('refOpen').href=url;$('refOpen').removeAttribute('aria-disabled');
  const qr=$('refQr');qr.replaceChildren();
  if(!window.CLBQRCode||typeof window.CLBQRCode.svg!=='function')throw new Error('QR unavailable');
  qr.append(window.CLBQRCode.svg(url));$('refSaveQr').disabled=false;$('refSaveHtml').disabled=!selected.selfContainedHtml;status.textContent='';
 }catch(error){
  $('refUrl').value='';$('refOpen').removeAttribute('href');$('refOpen').setAttribute('aria-disabled','true');
  $('refQr').replaceChildren();$('refSaveQr').disabled=true;$('refSaveHtml').disabled=true;
  status.textContent='Odkaz nebo QR se nepodařilo připravit. Zkontrolujte nastavení.';
  console.error('Reference share:',error);
 }
}
function open(e){
 selected=e;
 $('refDialogTitle').textContent=e.title;
 $('refOfflineNote').textContent=!e.selfContainedHtml?
  'Tato karta používá další společné skripty. Samostatné offline HTML zatím není dostupné; odkaz a QR fungují online.' : e.mediaExternal?
  'Offline HTML obsahuje úlohy a uložené nastavení, ale video se nepřibaluje a pro přehrání vyžaduje internet. Osobní slovníček se může lišit podle prohlížeče.' :
  'Offline HTML uchová volnou či pevnou variantu. Při otevření jako místní soubor mohou některé prohlížeče omezit uložený osobní slovníček.';
 $('refDialogDetail').textContent=SKILLS[e.skill]+' · '+e.languages.map(l=>LANGS[l]).join(', ')+' · A1–C2 · '+e.sourceVersion;
 $('refMode').value='free';
 const langs=$('refShareLang');langs.replaceChildren();
 for(const l of e.languages)langs.add(new Option(LANGS[l],l));
 langs.value=e.languages.includes($('refLanguage').value)?$('refLanguage').value:e.defaultLanguage;
 langs.disabled=e.languages.length===1;
 const levels=$('refShareLevel');levels.replaceChildren();
 for(const l of e.levels)levels.add(new Option(l,l));
 levels.value=e.levels.includes($('refLevel').value)?$('refLevel').value:e.defaultLevel;
 refreshShare();
 dialog.showModal();$('refMode').focus();
}
async function copyLink(){
 const val=$('refUrl').value;let copied=false;
 try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(val);copied=true;}}catch(_){}
 if(!copied){$('refUrl').focus();$('refUrl').select();try{copied=document.execCommand('copy');}catch(_){}}
 status.textContent=copied?'Odkaz zkopírován.':'Kopírování nebylo povoleno. Odkaz lze vybrat ručně.';
}
function saveQr(){
 if(!selected)return;
 const svg=$('refQr').querySelector('svg');if(!svg)return;
 const xml=new XMLSerializer().serializeToString(svg);
 const blob=new Blob([xml],{type:'image/svg+xml;charset=utf-8'});
 const blobURL=URL.createObjectURL(blob);
 const a=el('a');a.href=blobURL;a.download='LSH_'+selected.id+'_QR.svg';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(blobURL),1500);
 status.textContent='QR kód připraven ke stažení.';
}
async function saveHtml(){
 if(!selected||!selected.selfContainedHtml||!$('refUrl').value)return;
 const btn=$('refSaveHtml');btn.disabled=true;
 try{
  const chosen=new URL($('refUrl').value);
  const source=new URL(selected.studentPath,new URL(ROOT,location.origin));
  if(chosen.origin!==location.origin||chosen.pathname!==source.pathname)throw new Error('Unexpected download URL');
  const response=await fetch(source.href,{cache:'no-store'});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const html=await response.text();
  const marker='<script>\n/* LSH-R5 variant bridge:';
  if(html.split(marker).length!==2)throw new Error('Integrated standalone HTML marker missing');
  const prefix='<script>window.LSH_OFFLINE_QS='+JSON.stringify(chosen.search).replace(/</g,'\\u003c')+';</script>\n';
  const offline=html.replace(marker,prefix+marker);
  const blob=new Blob([offline],{type:'text/html;charset=utf-8'});
  const blobURL=URL.createObjectURL(blob);
  const fixed=$('refMode').value==='fixed';
  const suffix=fixed?$('refShareLang').value+'-'+$('refShareLevel').value+'-fixed':'free';
  const a=el('a');a.href=blobURL;a.download='LSH_'+selected.id+'_'+suffix+'_practice.html';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(blobURL),60000);
  status.textContent=selected.mediaExternal?
    'Stažení HTML zahájeno. Video není v souboru přibaleno a vyžaduje internet.':
    'Stažení procvičovacího HTML se zvoleným nastavením zahájeno.';
 }catch(error){console.error('Reference offline download:',error);status.textContent='HTML nelze stáhnout. Zkontrolujte připojení a opakujte akci.';}
 finally{btn.disabled=false;}
}
function bind(){
 for(const id of ['refSkill','refLanguage','refLevel'])$(id).addEventListener('change',render);
 $('refSearch').addEventListener('input',render);
 $('refReset').addEventListener('click',()=>{for(const id of ['refSkill','refLanguage','refLevel','refSearch'])$(id).value='';render();});
 $('refMode').addEventListener('change',refreshShare);
 $('refShareLang').addEventListener('change',refreshShare);
 $('refShareLevel').addEventListener('change',refreshShare);
 $('refClose').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',ev=>{if(ev.target===dialog)dialog.close();});
 $('refCopy').addEventListener('click',copyLink);
 $('refSaveQr').addEventListener('click',saveQr);
 $('refSaveHtml').addEventListener('click',saveHtml);
}
async function init(){
 bind();
 try{
  const response=await fetch(new URL('data/reference-pilots.json',new URL(ROOT,location.origin)),{cache:'no-store'});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const data=await response.json();
  if(data.schemaVersion!==1||data.approvedForTeaching!==false||!Array.isArray(data.entries)||data.entries.length<3||data.entries.length>29||!data.entries.every(isValid)||new Set(data.entries.map(x=>x.id)).size!==data.entries.length||new Set(data.entries.filter(x=>x.isReference).map(x=>x.skill)).size!==3||data.entries.filter(x=>x.isReference).length!==3)throw new Error('Invalid pilot inventory');
  entries=data.entries;
  render();
 }catch(err){console.error('Reference catalog:',err);$('refCount').textContent='Referenční katalog momentálně není dostupný.';list.replaceChildren(el('p','ref-empty','Zkontrolujte připojení nebo načtěte stránku znovu.'));}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
