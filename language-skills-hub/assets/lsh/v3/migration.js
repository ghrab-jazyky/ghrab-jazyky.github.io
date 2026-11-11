/* R40: non-destructive migration of legacy Reading and Conversation vocabulary.
 * Production vocabulary is IndexedDB('lsh') / words. Never delete the old stores.
 * Pure conversion and backup helpers are exported for Node regression tests. */
(function(root,factory){
 'use strict';
 const api=factory(typeof module!=='undefined'&&module.exports?require('./model.js'):root.LSH_MODEL);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSH_VOCAB_MIGRATION=api;
})(typeof window!=='undefined'?window:globalThis,function(MODEL){
 'use strict';
 if(!MODEL)throw Error('Vocabulary model not loaded');
 const DB='reading-lab-vocabulary',FALLBACK='reading-lab-vocabulary-fallback-v1';
 const BACKUP='reading-lab-vocabulary-backup';
 const validLanguage=s=>MODEL.LANGUAGES.includes(s);
 const clean=s=>String(s==null?'':s).normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
 function hash(value){
  const bytes=typeof TextEncoder!=='undefined'?new TextEncoder().encode(value):
   [...unescape(encodeURIComponent(value))].map(c=>c.charCodeAt(0));
  let a=0x811c9dc5,b=0x9e3779b9;
  for(const c of bytes){a=Math.imul(a^c,0x01000193)>>>0;b=Math.imul(b^c,0x85ebca6b)>>>0}
  return a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0');
 }
 function date(value,now){
  if(typeof value==='string'&&!Number.isNaN(Date.parse(value)))return new Date(value).toISOString();
  return now||new Date().toISOString();
 }
 function convertReading(raw,now){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Neplatné slovíčko ve starší záloze.');
  const language=clean(raw.language).toLowerCase();
  const term=clean(raw.term),meaning=clean(raw.meaningCs);
  if(!validLanguage(language)||!term||!meaning||term.length>160||meaning.length>700)
   throw Error('Neplatné slovo, jazyk nebo český význam.');
  const level=MODEL.LEVELS.includes(raw.level)?raw.level:null;
  const topicIds=Array.isArray(raw.topicIds)?raw.topicIds.slice(0,70):
   raw.topicId?[raw.topicId]:[];
  const ids=[...new Set(topicIds.filter(v=>typeof v==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)))].slice(0,60);
  const createdAt=date(raw.createdAt,now),updatedAt=date(raw.updatedAt,now);
  const senseId='rl-'+hash(language+'|'+term.toLocaleLowerCase()+'|'+meaning.toLocaleLowerCase());
  return MODEL.normalizeWord({
   language,term,translationCs:meaning,level,
   senseId,context:clean(raw.context).slice(0,1000),
   sources:ids.map(topicId=>({skill:'cteni',topicId,savedAt:createdAt})),
   createdAt,updatedAt
  },now);
 }
 function convertReadingBackup(raw,now){
  if(typeof raw!=='string'||MODEL.utf8Size(raw)>MODEL.MAX_IMPORT_BYTES)
   throw Error('Záloha přesahuje povolenou velikost 3 MB.');
  let obj;
  try{obj=JSON.parse(raw)}catch(_){throw Error('Soubor neobsahuje platný JSON.')}
  if(!obj||obj.kind!==BACKUP||obj.schemaVersion!==1||
     !Array.isArray(obj.vocabulary)||obj.vocabulary.length>MODEL.MAX_WORDS)
   throw Error('Neznámý formát zálohy Reading Lab.');
  const words=obj.vocabulary.map(w=>convertReading(w,now));
  const ids=new Set();
  for(const w of words){if(ids.has(w.id))throw Error('Duplicitní položka v záloze.');ids.add(w.id)}
  return MODEL.serializeExport(words,now);
 }
 function safeFallback(storage){
  try{
   const raw=storage&&storage.getItem(FALLBACK);
   if(!raw||MODEL.utf8Size(raw)>MODEL.MAX_IMPORT_BYTES)return [];
   const parsed=JSON.parse(raw);
   return Array.isArray(parsed)?parsed:[];
  }catch(_){return []}
 }
 function legacyDbWords(idb){
  if(!idb||typeof idb.open!=='function')return Promise.resolve([]);
  return new Promise(resolve=>{
   let finished=false,unavailable=false;
   const done=value=>{if(!finished){finished=true;resolve(value)}};
   try{
    const req=idb.open(DB,1);
    req.onupgradeneeded=()=>{unavailable=true;try{req.transaction.abort()}catch(_){}};
    req.onblocked=()=>done([]);
    req.onerror=()=>done([]);
    req.onsuccess=()=>{
     if(unavailable){try{req.result.close()}catch(_){};done([]);return}
     const db=req.result;
     if(!db.objectStoreNames.contains('words')){db.close();done([]);return}
     try{
      const tx=db.transaction('words','readonly'),r=tx.objectStore('words').getAll();
      r.onsuccess=()=>{db.close();done(Array.isArray(r.result)?r.result:[])};
      r.onerror=()=>{db.close();done([])};
     }catch(_){db.close();done([])}
    };
   }catch(_){done([])}
  });
 }
 async function migrate({store,createStore,indexedDB,localStorage,now}){
  if(!store||typeof store.getWord!=='function'||typeof store.saveWord!=='function')
   throw Error('Chybí společný slovníček.');
  await store.open();
  if(store.status().mode!=='ready')return {persistent:false,reading:0,conversation:0,skipped:0};
  let reading=0,conversation=0,skipped=0;
  const nowIso=now||new Date().toISOString();
  // Legacy Conversation cards used staging DB; never erase them.
  if(typeof createStore==='function'){
   const staging=createStore({mode:'staging',indexedDB,BroadcastChannel:null});
   try{
    await staging.open();
    if(staging.status().mode==='ready'){
     const old=await staging.listWords();
     for(const word of old){
      try{
       const normalized=MODEL.normalizeWord(word,nowIso);
       if(!(await store.getWord(normalized.id))){
        await store.saveWord(normalized,nowIso);conversation++;
       }
      }catch(_){skipped++}
     }
    }
   }finally{staging.close()}
  }
  // Import both durable Reading IDB and its localStorage fallback, if present.
  const former=[...(await legacyDbWords(indexedDB)),...safeFallback(localStorage)];
  const seen=new Set();
  for(const raw of former){
   try{
    const word=convertReading(raw,nowIso);
    if(seen.has(word.id))continue;seen.add(word.id);
    if(!(await store.getWord(word.id))){
     await store.saveWord(word,nowIso);reading++;
    }
   }catch(_){skipped++}
  }
  return {persistent:true,reading,conversation,skipped};
 }
 return Object.freeze({convertReading,convertReadingBackup,legacyDbWords,migrate,hash});
});
