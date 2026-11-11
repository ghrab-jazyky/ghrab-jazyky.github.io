/* Shared student vocabulary storage, Reading Lab v1.2 compatible. Offline only. */
(function(global){
'use strict';
const NAME='reading-lab-vocabulary',STORE='words',FALLBACK='reading-lab-vocabulary-fallback-v1';
const LIMIT=5000,FILE_LIMIT=3*1024*1024,LANGS=['en','es','de','fr'];
const tidy=(v,max)=>String(v==null?'':v).normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const fold=s=>tidy(s,200).toLowerCase();
let dbPromise,backend='unknown';
function checked(item){
 if(!item||typeof item!=='object'||Array.isArray(item))throw Error('Neplatný záznam slovíčka.');
 for(const f of ['term','meaningCs','language','context','level','createdAt','updatedAt'])
  if(item[f]!=null&&typeof item[f]!=='string')throw Error('Neplatný typ pole: '+f);
 const term=tidy(item.term,180),meaningCs=tidy(item.meaningCs,500);
 const language=tidy(item.language,3).toLowerCase();
 if(!term||!meaningCs||!LANGS.includes(language))throw Error('Každé slovíčko potřebuje výraz, význam a jazyk.');
 const now=new Date().toISOString();
 const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(x)&&!Number.isNaN(Date.parse(x))?x:now;
 const level=['A1','A2','B1','B2','C1','C2'].includes(item.level)?item.level:'';
 const topics=Array.isArray(item.topicIds)?item.topicIds.slice(0,60):item.topicId?[item.topicId]:[];
 return {id:language+'|'+fold(term)+'|'+fold(meaningCs),
  term,meaningCs,language,level,context:tidy(item.context,600),
  topicIds:[...new Set(topics.map(x=>tidy(x,80)).filter(Boolean))],
  createdAt:date(item.createdAt),updatedAt:date(item.updatedAt)};
}
function merged(a,b){
 if(!a)return b;
 return {...a,...b,topicIds:[...new Set([...(a.topicIds||[]),...(b.topicIds||[])])],
  context:b.context||a.context,
  createdAt:a.createdAt<b.createdAt?a.createdAt:b.createdAt,
  updatedAt:a.updatedAt>b.updatedAt?a.updatedAt:b.updatedAt};
}
function signal(){
 try{global.dispatchEvent(new CustomEvent('readinglab:vocabulary-change'))}catch(_){}
 try{const b=new BroadcastChannel('readinglab-vocabulary-updates');b.postMessage('updated');b.close()}catch(_){}
}
function open(){
 if(!global.indexedDB){backend='local-fallback';return Promise.resolve(null)}
 if(dbPromise)return dbPromise;
 dbPromise=new Promise(resolve=>{
  try{
   const r=global.indexedDB.open(NAME,1);
   r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'})};
   r.onsuccess=()=>{backend='indexeddb';r.result.onversionchange=()=>r.result.close();resolve(r.result)};
   r.onerror=r.onblocked=()=>{backend='local-fallback';resolve(null)};
  }catch(_){backend='local-fallback';resolve(null)}
 });
 return dbPromise;
}
function fallbackRead(){
 try{const data=JSON.parse(global.localStorage.getItem(FALLBACK)||'[]');return Array.isArray(data)?data:[]}
 catch(_){return []}
}
function fallbackWrite(items){
 try{global.localStorage.setItem(FALLBACK,JSON.stringify(items))}
 catch(_){throw Error('Místní ukládání není povoleno. Použij běžné okno prohlížeče.')}
}
async function all(){
 const db=await open();
 if(!db)return fallbackRead();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).getAll();
  r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(Error('Nepodařilo se načíst slovníček.'));
 });
}
async function putMany(items,mode){
 if(!['merge','replace'].includes(mode))throw Error('Neplatný režim importu.');
 if(!Array.isArray(items)||items.length>LIMIT)throw Error('Příliš mnoho slovíček.');
 const incoming=new Map();
 for(const x of items){const v=checked(x);incoming.set(v.id,merged(incoming.get(v.id),v))}
 const db=await open();
 if(!db){
  const old=mode==='replace'?[]:fallbackRead(),map=new Map(old.map(x=>[x.id,x]));
  for(const v of incoming.values())map.set(v.id,merged(map.get(v.id),v));
  if(map.size>LIMIT)throw Error('Limit 5000 slovíček.');
  fallbackWrite([...map.values()]);signal();return incoming.size;
 }
 if(mode==='merge'){
  const old=await all(),ids=new Set(old.map(x=>x.id));
  for(const id of incoming.keys())ids.add(id);
  if(ids.size>LIMIT)throw Error('Limit 5000 slovíček.');
 }
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite'),st=tx.objectStore(STORE);
  if(mode==='replace')st.clear();
  for(const v of incoming.values()){
   if(mode==='replace')st.put(v);
   else{const g=st.get(v.id);g.onsuccess=()=>st.put(merged(g.result,v))}
  }
  tx.oncomplete=()=>{signal();resolve(incoming.size)};
  tx.onerror=()=>reject(Error('Ukládání slovníčku se nezdařilo.'));
  tx.onabort=()=>reject(Error('Ukládání slovníčku bylo přerušeno.'));
 });
}
async function save(item){
 const result=await putMany([{...item,updatedAt:new Date().toISOString()}],'merge');
 try{global.navigator?.storage?.persist?.().catch(()=>{})}catch(_){}
 return result;
}
async function update(id,item){
 if(typeof id!=='string'||id.length>800)throw Error('Neplatný identifikátor.');
 const next=checked({...item,updatedAt:new Date().toISOString()}),db=await open();
 if(!db){
  const prev=fallbackRead(),others=prev.filter(x=>x.id!==id&&x.id!==next.id);
  others.push(merged(prev.find(x=>x.id===next.id&&x.id!==id),next));
  fallbackWrite(others);signal();return next.id;
 }
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite'),st=tx.objectStore(STORE);
  if(id!==next.id)st.delete(id);
  const g=st.get(next.id);
  g.onsuccess=()=>st.put(g.result&&id!==next.id?merged(g.result,next):next);
  tx.oncomplete=()=>{signal();resolve(next.id)};
  tx.onerror=()=>reject(Error('Úprava slovíčka se nezdařila.'));
 });
}
async function remove(id){
 if(typeof id!=='string'||id.length>800)throw Error('Neplatný identifikátor.');
 const db=await open();
 if(!db){fallbackWrite(fallbackRead().filter(x=>x.id!==id));signal();return}
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);
  tx.oncomplete=()=>{signal();resolve()};
  tx.onerror=()=>reject(Error('Smazání slovíčka se nezdařilo.'));
 });
}
const exportJSON=async()=>JSON.stringify({kind:'reading-lab-vocabulary-backup',
 schemaVersion:1,exportedAt:new Date().toISOString(),vocabulary:await all()},null,2);
async function importJSON(content,mode='merge'){
 if(typeof content!=='string'||content.length>FILE_LIMIT)throw Error('Záloha přesahuje 3 MB nebo není platná.');
 let data;try{data=JSON.parse(content)}catch(_){throw Error('Soubor není platný JSON.')}
 if(!data||data.kind!=='reading-lab-vocabulary-backup'||data.schemaVersion!==1||
  !Array.isArray(data.vocabulary)||data.vocabulary.length>LIMIT)
  throw Error('Záloha není kompatibilní s My vocabulary / Reading Lab.');
 return putMany(data.vocabulary,mode);
}
const normalizeAnswer=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[.,!?;:()[\]{}"']/g,' ').replace(/\s+/g,' ').trim();
const acceptedAnswers=s=>String(s||'').split(/\s*;\s*/).map(normalizeAnswer).filter(Boolean);
function correct(typed,answer){const t=normalizeAnswer(typed);return !!t&&acceptedAnswers(answer).includes(t)}
const api=Object.freeze({all,save,update,remove,exportJSON,importJSON,
 storageBackend:async()=>{await open();return backend},
 normalizeAnswer,acceptedAnswers,correct,verify:checked,maxWords:LIMIT,
 backupKind:'reading-lab-vocabulary-backup',schemaVersion:1});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
global.LSHVocabStore=api;
})(typeof window!=='undefined'?window:globalThis);
