/* LSH R49 - one-time, lossless import from the retired ReadingLabVocab database.
 * Old stores are READ-ONLY and NEVER deleted. No network, identifiers or accounts.
 * Both the Reading cards and the canonical My Vocabulary page use this adapter. */
(function(root,factory){
 'use strict';
 const model=typeof module!=='undefined'&&module.exports?require('./model.js'):root.LSH_MODEL;
 const api=factory(model);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSH_READING_MIGRATION=api;
})(typeof window!=='undefined'?window:this,function(MODEL){
 'use strict';
 if(!MODEL)throw Error('LSH model must load before legacy migration');
 const DB_NAME='reading-lab-vocabulary',STORE_NAME='words';
 const FALLBACK_KEY='reading-lab-vocabulary-fallback-v1';
 const CHECKPOINT='lsh-reading-legacy-migrated-ids-r49';
 const LEGACY_TOPICS=Object.freeze({
  'asteroids-planetary-defence':'rl-asteroids',
  'can-mistakes-help-us-learn':'rl-can-mistakes',
  'plastic-ocean-and-our-choices':'rl-plastic-ocean',
  'an-email-from-a-friend':'rl-email-friend',
  'instant-messages':'rl-instant-messages'
 });
 const isObj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const norm=s=>String(s||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase()
  .replace(/[’‘]/g,"'").replace(/[‐‑‒–—]/g,'-');
 const stamp=(s,now)=>{
  const t=typeof s==='string'&&/^\d{4}-\d\d-\d\dT/.test(s)?Date.parse(s):NaN;
  return Number.isFinite(t)?new Date(t).toISOString():now;
 };
 function senseId(language,term,translation){
  const anchor=/[;,/|\r\n]/.test(translation)?'multi:'+norm(translation):
   'cz:'+norm(translation);
  const bytes=new TextEncoder().encode(language+'|'+norm(term)+'|'+norm(anchor));
  let left=0x811c9dc5,right=0x9e3779b9;
  for(const b of bytes){
   left=Math.imul(left^b,0x01000193)>>>0;
   right=Math.imul(right^b,0x85ebca6b)>>>0;
  }
  return 'cl-'+left.toString(16).padStart(8,'0')+right.toString(16).padStart(8,'0');
 }
 function convertWord(row,when){
  if(!isObj(row))throw Error('Neplatný záznam starého slovníčku.');
  const term=typeof row.term==='string'?row.term.trim():'',
   translationCs=typeof row.meaningCs==='string'?row.meaningCs.trim():'',
   language=row.language;
  if(!term||term.length>160||!translationCs||translationCs.length>700||
    !MODEL.LANGUAGES.includes(language))
   throw Error('Staré slovíčko neodpovídá formátu společného slovníčku.');
  const now=when||new Date().toISOString();
  const topicIds=Array.isArray(row.topicIds)?row.topicIds:[row.topicId];
  const mapped=[...new Set(topicIds.map(id=>LEGACY_TOPICS[id]).filter(Boolean))];
  if(!mapped.length)mapped.push('rl-legacy-reading');
  const createdAt=stamp(row.createdAt,now),updatedAt=stamp(row.updatedAt,now);
  return MODEL.normalizeWord({
   language,term,translationCs,
   context:typeof row.context==='string'?row.context.slice(0,1000):'',
   level:MODEL.LEVELS.includes(row.level)?row.level:null,
   senseId:senseId(language,term,translationCs),
   sources:mapped.map(topicId=>({skill:'cteni',topicId,savedAt:createdAt})),
   createdAt,updatedAt
  },now);
 }
 function convertList(rows,when){
  if(!Array.isArray(rows)||rows.length>MODEL.MAX_WORDS)throw Error('Příliš mnoho starších slovíček.');
  const output=new Map();
  for(const row of rows){
   const word=convertWord(row,when);
   if(output.has(word.id))output.set(word.id,MODEL.mergeWords(output.get(word.id),word,when));
   else output.set(word.id,word);
  }
  return [...output.values()];
 }
 function convertBackup(raw,when){
  if(typeof raw!=='string'||MODEL.utf8Size(raw)>MODEL.MAX_IMPORT_BYTES)
   throw Error('Záloha Reading Labu je příliš velká.');
  let data;try{data=JSON.parse(raw)}catch(_){throw Error('Záloha neobsahuje platný JSON.')}
  if(!isObj(data)||data.kind!=='reading-lab-vocabulary-backup'||
   data.schemaVersion!==1||!Array.isArray(data.vocabulary))
   throw Error('Neplatný formát starší zálohy Reading Labu.');
  return MODEL.serializeExport(convertList(data.vocabulary,when),when);
 }
 async function readLegacyDb(idb){
  if(!idb||typeof idb.open!=='function')return [];
  if(typeof idb.databases==='function'){
   try{
    const all=await idb.databases();
    if(Array.isArray(all)&&!all.some(x=>x.name===DB_NAME))return [];
   }catch(_){/* Some Safari versions cannot enumerate databases. */}
  }
  return new Promise((resolve,reject)=>{
   let created=false,settled=false;
   const done=(value,error)=>{
    if(settled)return;settled=true;
    if(error)reject(error);else resolve(value);
   };
   try{
    const request=idb.open(DB_NAME);
    request.onupgradeneeded=event=>{
     // Avoid creating a new old-style vocabulary database for new students.
     if(event.oldVersion===0){created=true;request.transaction.abort();}
    };
    request.onerror=()=>created?done([]):done(null,Error('Nelze číst původní databázi Reading Labu.'));
    request.onblocked=()=>done(null,Error('Starší slovníček je blokován jinou záložkou.'));
    request.onsuccess=()=>{
     const db=request.result;
     if(!db.objectStoreNames.contains(STORE_NAME)){db.close();done([]);return}
     let tx;
     try{tx=db.transaction(STORE_NAME,'readonly')}catch(e){db.close();done(null,e);return}
     const req=tx.objectStore(STORE_NAME).getAll();
     req.onsuccess=()=>{const words=req.result||[];db.close();done(words)};
     req.onerror=()=>{db.close();done(null,Error('Nepodařilo se přečíst stará slovíčka.'))};
     tx.onabort=()=>{db.close();done(null,Error('Čtení starého slovníčku bylo přerušeno.'))};
    };
   }catch(e){done(null,e)}
  });
 }
 function readFallback(storage){
  if(!storage||typeof storage.getItem!=='function')return [];
  const raw=storage.getItem(FALLBACK_KEY);
  if(!raw)return [];
  if(MODEL.utf8Size(raw)>MODEL.MAX_IMPORT_BYTES)
   throw Error('Starší záložní úložiště přesahuje 3 MB.');
  let parsed;try{parsed=JSON.parse(raw)}catch(_){throw Error('Neplatný starší záznam v localStorage.')}
  if(!Array.isArray(parsed)||parsed.length>MODEL.MAX_WORDS)
   throw Error('Neplatný starší seznam slovíček.');
  return parsed;
 }
 const signature=w=>w.language+'|'+norm(w.term)+'|'+norm(w.translationCs);
 async function migrate(store,options={}){
  if(!store||typeof store.open!=='function'||typeof store.listWords!=='function')
   throw Error('Společný slovníček není dostupný.');
  const idb=options.indexedDB!==undefined?options.indexedDB:
   (typeof indexedDB!=='undefined'?indexedDB:null);
  const local=options.localStorage!==undefined?options.localStorage:
   (typeof localStorage!=='undefined'?localStorage:null);
  await store.open();
  const legacy=[...await readLegacyDb(idb),...readFallback(local)];
  if(legacy.length>MODEL.MAX_WORDS*2)throw Error('Starší slovníček je příliš velký.');
  const ids=new Map();
  for(const row of legacy){
   if(!isObj(row)||typeof row.id!=='string'||row.id.length>500)
    throw Error('Neplatné ID staršího slovíčka.');
   ids.set(row.id,row);
  }
  if(!ids.size)return {found:0,imported:0,skipped:0,storedInIndexedDB:store.status().mode==='ready'};
  if(store.status().mode!=='ready')
   throw Error('Převod není bezpečný bez trvalého úložiště. Původní data zůstávají zachována.');
  let completed=[];
  try{
   const checkpoint=JSON.parse(local?.getItem(CHECKPOINT)||'[]');
   if(Array.isArray(checkpoint))completed=checkpoint.filter(id=>typeof id==='string');
  }catch(_){}
  const seen=new Set(completed),remaining=[...ids].filter(([id])=>!seen.has(id));
  if(!remaining.length)return {found:ids.size,imported:0,skipped:ids.size,storedInIndexedDB:true};
  const incoming=convertList(remaining.map(([_,value])=>value));
  const current=await store.listWords(),existing=new Set(current.map(signature));
  const missing=incoming.filter(w=>!existing.has(signature(w)));
  if(current.length+missing.length>MODEL.MAX_WORDS)
   throw Error('Společný slovníček překročil limit 5000 slov. Nejprve si stáhni zálohu.');
  let storedInIndexedDB=true;
  if(missing.length){
   const report=await store.importWords(MODEL.serializeExport(missing),{replace:false});
   storedInIndexedDB=report.storedInIndexedDB===true;
   if(!storedInIndexedDB)throw Error('Slovíčka by se převedla pouze do dočasné paměti.');
   const after=new Set((await store.listWords()).map(signature));
   if(!missing.every(w=>after.has(signature(w))))throw Error('Ověření převodu selhalo.');
  }
  // Checkpoint records only successful, durable imports. Never delete the old DB.
  if(local&&typeof local.setItem==='function'){
   try{local.setItem(CHECKPOINT,JSON.stringify([...new Set([...completed,...remaining.map(x=>x[0])])]))}
   catch(_){/* Deduplication still prevents duplicates on next opening. */}
  }
  return {found:ids.size,imported:missing.length,skipped:ids.size-missing.length,storedInIndexedDB};
 }
 return Object.freeze({DB_NAME,FALLBACK_KEY,CHECKPOINT,LEGACY_TOPICS,senseId,
  convertWord,convertList,convertBackup,readLegacyDb,readFallback,migrate});
});
