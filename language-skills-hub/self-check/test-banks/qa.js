/* R34 private working-branch QA dashboard, not an approved publication system. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const levels=['A1','A2','B1','B2','C1','C2'],langs=['en','es','de','fr'];
 const entries=[],collections=new Map(),styles={manual:'Autorská reference – audit čeká',
  candidate:'Automatický kandidát – přepsat',
  subset:'Listening autorský návrh – čeká audit nahrávky'};
 let manifest=null,link=null,active=null;
 const el=(tag,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n};
 async function fetchJson(url){const r=await fetch(url,{credentials:'omit',redirect:'error',cache:'no-store'});
  if(!r.ok)throw new Error(url+' HTTP '+r.status);return r.json()}
 async function sha256(contents){
  if(!window.crypto?.subtle||!window.TextEncoder)
   throw new Error('Secure source integrity checks unavailable');
  const bytes=new TextEncoder().encode(contents);
  const hash=await window.crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
 }
 function extract(html,name){
  const re=new RegExp('\\bconst\\s+'+name+'\\s*=\\s*\\{','g'),m=re.exec(html);
  if(!m)throw new Error('Source '+name+' not found');
  let quoted=false,escaped=false,depth=0,end=-1;
  const start=m.index+m[0].length-1;
  for(let i=start;i<html.length;i++){const c=html[i];
   if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false}
   else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){end=i+1;break}
  }
  if(end<0)throw new Error('Incomplete original '+name+' data');
  return JSON.parse(html.slice(start,end));
 }
 function options(id,arr,value,label){const select=$(id);select.replaceChildren();
  for(const item of arr){const o=el('option',label?label(item):String(item));o.value=item;select.appendChild(o)}
  if(value&&arr.includes(value))select.value=value;
 }
 function topics(){return entries.filter(e=>e.skill===$('skill').value)}
 function getCollection(entry){return collections.get(entry.id)}
 function onSkill(){
  const current=$('topic').value;
  options('topic',topics().map(e=>e.id),current,id=>topics().find(e=>e.id===id).title);
  onTopic();
 }
 function onTopic(){
  const e=topics().find(x=>x.id===$('topic').value);
  options('language',e?.skill==='poslech'?['en']:e?.languages||[],null,x=>({en:'English',es:'Español',de:'Deutsch',fr:'Français'})[x]||x);
  options('level',e?.levels||levels);
  onVariant();
 }
 function onVariant(){
  const e=topics().find(x=>x.id===$('topic').value),lang=$('language').value,level=$('level').value;
  if(!e||!manifest){$('selectedStatus').textContent='Výběr není připraven';return}
  const manual=e.id==='rl-can-mistakes'&&lang==='en'&&['B1','B2'].includes(level);
  const c=getCollection(e),bank=manual?null:e.skill==='cteni'?c?.variants?.[lang]?.[level]:c?.variants?.[level];
  const style=manual?'manual':e.skill==='cteni'?'candidate':'subset';
  if(!manual&&(!bank||bank.published!==false)){active=null;link=null;$('selectedStatus').textContent='Bank chybí nebo má neplatný stav – neposkytovat náhled';$('previewLink').setAttribute('aria-disabled','true');return}
  if(c?.published!==false||c?.sourcePracticeContentHash!==manifest.contentHashes[e.id]){
   active=null;link=null;$('selectedStatus').textContent='Kontrolní součet nebo publikační stav banky není platný';$('previewLink').setAttribute('aria-disabled','true');return;
  }
  active={entry:e,lang,level,manual,style,bank};
  const file=e.skill==='cteni'?'reading/preview.html':'listening/preview.html';
  const url=new URL(file,location.href);
  url.searchParams.set('topic',e.id);
  if(e.skill==='cteni')url.searchParams.set('lang',lang);
  url.searchParams.set('level',level);url.searchParams.set('timer','20');
  url.searchParams.set('attempt','audit'+Date.now().toString(36)+Math.random().toString(36).slice(2,7));
  link=url.href;
  $('previewLink').href=link;$('previewLink').setAttribute('aria-disabled','false');
  $('selectedStatus').textContent=e.title+' · '+lang.toUpperCase()+'/'+level+' · '+styles[style]+
   ' · '+(manual?10:e.skill==='cteni'?bank.questions.length:
    bank.gist.length+bank.detail.length+bank.sequence.length+bank.facts.length+bank.open.length)+' otázek/položek';
  $('shareStatus').textContent='QA odkaz je určen pouze pro přezkoumání v pracovní větvi. Není bezpečný klasifikovaný test.';
 }
 function coverage(){
  let reading=0,listening=0,manual=0,errors=0;
  $('coverageRows').replaceChildren();
  for(const e of entries){
   const collection=getCollection(e),row=el('tr');
   const labels=[];
   if(e.skill==='cteni'){for(const lang of e.languages)for(const level of e.levels){
    const m=e.id==='rl-can-mistakes'&&lang==='en'&&['B1','B2'].includes(level);
    if(m){manual++;labels.push('manual')}else if(collection?.variants?.[lang]?.[level]?.published===false){reading++;labels.push('candidate')}else errors++;
   }}else for(const level of levels){if(collection?.variants?.[level]?.published===false){listening++;labels.push('subset')}else errors++}
   row.append(el('td',e.title),el('td',String(labels.length)),el('td',labels.every(x=>x==='subset')?styles.subset:labels.every(x=>x==='candidate')?styles.candidate:labels.every(x=>x==='manual')?styles.manual:'Smíšené pracovní varianty'));
   $('coverageRows').appendChild(row);
  }
  $('stats').textContent='Reading: '+(reading+manual)+'/120 variant (2 autorské návrhy, '+reading+' kandidátů) · Listening: '+listening+'/18 · Chybějící: '+errors;
 }
 function downloadJSON(name,payload){
  const blob=new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=name;a.hidden=true;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
 }
 async function exportPacket(){
  if(!active)return;
  const btn=$('downloadPacket');btn.disabled=true;
  try{
   const {entry,lang,level,manual,bank}=active;
   const response=await fetch('../../'+entry.relative,{credentials:'omit',redirect:'error',cache:'no-store'});
   if(!response.ok)throw new Error('Original source HTTP '+response.status);
   const sourceHtml=await response.text();
   const actualHash=await sha256(sourceHtml);
   if(actualHash!==manifest.contentHashes[entry.id])
    throw new Error('Original text/audio task checksum mismatch – export blocked');
   const original=extract(sourceHtml,'DATA');
   let body=manual?await fetchJson('reading/rl-can-mistakes/en-'+level+'.json'):bank;
   if(!body||body.published!==false)
    throw new Error('Draft bank missing or marked as published – export blocked');
   const practice=entry.skill==='cteni'?original[lang][level]:original[level];
   downloadJSON('lsh-claude-review-'+entry.id+'-'+lang+'-'+level+'.json',{
    kind:'LSH_R34_CLAUDE_REVIEW_PACKET_V1',stage:'NEVER_PUBLISH_UNREVIEWED',
    catalogId:entry.id,skill:entry.skill,language:lang,level,
    currentProductionVersion:manifest.version,
    sourceContentHash:manifest.contentHashes[entry.id],
    sourceVerified:true,
    approvedForStudents:false,
    provenance:manual?'human authored draft':entry.skill==='cteni'?'machine source-anchor seed':'assistant-authored new Listening draft; original audio and CEFR not independently audited',
    practice,proposedTest:body,
    requiredReview:['Grammar, CEFR and unambiguous answers','Genuine independence from practice','Plausible distractors and source evidence','Appropriate scope and duration','No leakage or privacy risk']
   });
   $('shareStatus').textContent='Připraven anonymní obsahový balíček pro následnou kontrolu v Claude.';
  }catch(err){$('shareStatus').textContent='Export blokován: '+String(err.message||err)}
  finally{btn.disabled=false}
 }
 async function exportTopicPacket(){
  if(!active)return;
  const button=$('downloadTopicPacket');
  button.disabled=true;
  $('shareStatus').textContent='Ověřuji původní zdroj a připravuji všechny úrovně tématu…';
  try{
   const {entry}=active;
   const response=await fetch('../../'+entry.relative,{
    credentials:'omit',redirect:'error',cache:'no-store'
   });
   if(!response.ok)throw new Error('Original source HTTP '+response.status);
   const sourceHtml=await response.text(),digest=await sha256(sourceHtml);
   if(digest!==manifest.contentHashes[entry.id])
    throw new Error('Original source checksum mismatch – topic export blocked');
   const data=extract(sourceHtml,'DATA');
   const collection=getCollection(entry);
   if(!collection||collection.published!==false||
    collection.sourcePracticeContentHash!==digest)
    throw new Error('Topic content bank is unavailable or not an unapproved draft');
   const result=[];
   const requestedLanguages=entry.skill==='cteni'?entry.languages:['en'];
   for(const language of requestedLanguages)for(const level of entry.levels){
    const isManual=entry.id==='rl-can-mistakes'&&language==='en'&&
     ['B1','B2'].includes(level);
    const test=isManual?await fetchJson('reading/rl-can-mistakes/en-'+level+'.json'):
     entry.skill==='cteni'?collection.variants?.[language]?.[level]:
     collection.variants?.[level];
    if(!test||test.published!==false)throw new Error('Missing/approved unexpectedly: '+language+'/'+level);
    const practice=entry.skill==='cteni'?data[language]?.[level]:data[level];
    if(!practice)throw new Error('Missing practice content: '+language+'/'+level);
    result.push({language,level,practice,proposedTest:test,
     status:test.stage||test.status||'UNKNOWN',teacherApproved:false,
     sourceAudioVerified:entry.skill==='poslech'?false:null});
   }
   if(result.length!==(entry.skill==='cteni'?24:6))
    throw new Error('Incomplete set of level variants for topic');
   downloadJSON('lsh-claude-topic-'+entry.id+'.json',{
    kind:'LSH_R34_CLAUDE_TOPIC_AUDIT_PACKET_V1',topic:entry.id,
    skill:entry.skill,publicSource:entry.relative,sourceHash:digest,
    sourceVerified:true,studentPublicationApproved:false,
    purpose:'Content rewrite and independent audit before teacher authorization',
    productionBaseline:manifest.version,variants:result,
    requiredChecks:[
     'Language grammar and CEFR levels A1-C2 across all offered languages',
     'Independent questions, not a rewording or copy of practice',
     'Exactly one defensible MC answer plus plausible non-trivial distractors',
     'Specific source evidence and correction of ambiguous keys',
     'Appropriate question variety and difficulty progression',
     'For Listening: check every claim against the actual recording and two-playback feasibility',
     'Teacher review for open Listening tasks, no unverified final school grade',
     'Privacy and safe static-hosting disclosure'
    ]
   });
   $('shareStatus').textContent='Všechny varianty tématu byly připraveny v jednom anonymním JSON souboru.';
  }catch(error){
   $('shareStatus').textContent='Export celého tématu zablokován: '+String(error.message||error);
  }finally{button.disabled=false}
 }
 async function init(){
  try{
   const [catalog,version]=await Promise.all([fetchJson('../../data/cards.json'),fetchJson('../../version.json')]);
   manifest=version;
   if(manifest.version!=='R31'||manifest.backendEnabled!==false)throw new Error('Unexpected published baseline');
   entries.push(...catalog.entries.filter(e=>['cteni','poslech'].includes(e.skill)));
   await Promise.all(entries.map(async e=>{
    const dir=e.skill==='cteni'?'reading':'listening';
    const b=await fetchJson(dir+'/collections/'+e.id+'.json');
    if(b.published!==false||b.sourcePracticeContentHash!==manifest.contentHashes[e.id])throw new Error('Unsafe bank '+e.id);
    collections.set(e.id,b);
   }));
   $('skill').addEventListener('change',onSkill);
   $('topic').addEventListener('change',onTopic);
   $('language').addEventListener('change',onVariant);
   $('level').addEventListener('change',onVariant);
   $('copyLink').addEventListener('click',async()=>{
    if(!link)return;try{await navigator.clipboard.writeText(link);$('shareStatus').textContent='QA odkaz zkopírován.'}
    catch(_){$('shareStatus').textContent='Kopírování nepovoleno. Otevři QA náhled a použij adresu prohlížeče.'}
   });
   $('downloadPacket').addEventListener('click',exportPacket);
   $('downloadTopicPacket').addEventListener('click',exportTopicPacket);
   onSkill();coverage();
  }catch(err){$('selectedStatus').textContent='QA katalog je zablokovaný: '+String(err.message||err)}
 }
 init();
})();
