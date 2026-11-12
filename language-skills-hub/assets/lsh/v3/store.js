/* Language Skills Hub E3A – IndexedDB v1 persistence adapter.
   Staging uses "lsh-test"; production uses "lsh". This module never transmits data. */
(function (root, factory) {
  'use strict';
  const api = factory(
    typeof module !== 'undefined' && module.exports ? require('./model.js') : root.LSH_MODEL
  );
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LSH_STORE = api;
})(typeof window !== 'undefined' ? window : this, function (MODEL) {
  'use strict';
  if (!MODEL) throw new Error('LSH_MODEL must load before LSH_STORE');
  const STORES = Object.freeze(['words','answers','meta']);
  const DB_VERSION = 1;
  function assert(t,m) { if (!t) throw new Error(m); }
  function createStore(options) {
    assert(options && (options.mode === 'staging' || options.mode === 'production'), 'Explicit environment required');
    const dbName = options.mode === 'staging' ? 'lsh-test' : 'lsh';
    const idb = options.indexedDB !== undefined ? options.indexedDB :
      (typeof indexedDB !== 'undefined' ? indexedDB : null);
    const storageApi = options.storage !== undefined ? options.storage :
      (typeof navigator !== 'undefined' && navigator.storage ? navigator.storage : null);
    const Channel = options.BroadcastChannel !== undefined ? options.BroadcastChannel :
      (typeof BroadcastChannel !== 'undefined' ? BroadcastChannel : null);
    let state = 'initializing', openPromise = null, persistenceRequested = false;
    const memory = {words:new Map(),answers:new Map(),meta:new Map()};
    const listeners = new Set();
    let channel = null;
    if (Channel) {
      try { channel = new Channel(dbName + '-changes-v1');
        channel.onmessage = event => {
          if (event && event.data && event.data.kind === 'changed')
            listeners.forEach(listener => { try { listener('remote'); } catch (_) {} });
        };
      } catch (_) { channel = null; }
    }
    function notify() {
      listeners.forEach(listener => { try { listener('local'); } catch (_) {} });
      if (channel) try { channel.postMessage({kind:'changed'}); } catch (_) {}
    }
    function subscribe(fn) {
      assert(typeof fn === 'function', 'Invalid subscriber');
      listeners.add(fn);
      return () => listeners.delete(fn);
    }
    function open() {
      if (!openPromise) {
        if (!idb || typeof idb.open !== 'function') {
          state = 'temporary';
          openPromise = Promise.resolve(null);
        } else {
          openPromise = new Promise(resolve => {
            let settled = false;
            function fallback() { if (!settled) { settled = true; state = 'temporary'; resolve(null); } }
            try {
              const req = idb.open(dbName, DB_VERSION);
              req.onupgradeneeded = () => {
                const db = req.result;
                for (const name of STORES)
                  if (!db.objectStoreNames.contains(name)) db.createObjectStore(name,{keyPath: name==='meta' ? 'key' : 'id'});
              };
              req.onerror = fallback;
              req.onblocked = fallback;
              req.onsuccess = () => {
                if (settled) { req.result.close(); return; }
                settled = true;
                state = 'ready';
                req.result.onversionchange = () => { req.result.close(); state = 'error'; };
                resolve(req.result);
              };
            } catch (_) { fallback(); }
          });
        }
      }
      return openPromise;
    }
    function askPersistence() {
      if (persistenceRequested) return;
      persistenceRequested = true;
      if (storageApi && typeof storageApi.persist === 'function') {
        try { Promise.resolve(storageApi.persist()).catch(() => {}); } catch (_) {}
      }
    }
    async function all(name) {
      assert(STORES.includes(name),'Unknown store');
      const db = await open();
      if (!db) return [...memory[name].values()];
      return new Promise((resolve,reject) => {
        try {
          const tx = db.transaction(name,'readonly');
          const req = tx.objectStore(name).getAll();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error || new Error('Cannot read '+name));
        } catch (e) { reject(e); }
      });
    }
    async function one(name,id) {
      assert(STORES.includes(name) && typeof id === 'string', 'Invalid lookup');
      const db = await open();
      if (!db) return memory[name].get(id) || null;
      return new Promise((resolve,reject) => {
        try {
          const tx = db.transaction(name,'readonly');
          const req = tx.objectStore(name).get(id);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error || new Error('Cannot read item'));
        } catch (e) { reject(e); }
      });
    }
    async function mutate(name,id,updater) {
      assert(STORES.includes(name) && typeof id === 'string', 'Invalid write');
      const db = await open();
      if (!db) {
        const prev = memory[name].get(id) || null;
        const result = updater(prev);
        if (result === null) memory[name].delete(id);
        else memory[name].set(id,result);
        notify();
        return {record:result,storedInIndexedDB:false};
      }
      return new Promise((resolve,reject) => {
        let result,failed=null;
        try {
          const tx=db.transaction(name,'readwrite');
          tx.oncomplete = () => { notify(); askPersistence(); resolve({record:result,storedInIndexedDB:true}); };
          tx.onabort = () => { state='error'; reject(failed || tx.error || new Error('Write did not complete')); };
          const os=tx.objectStore(name), req=os.get(id);
          req.onsuccess = () => {
            try {
              result=updater(req.result || null);
              if (result === null) os.delete(id);
              else os.put(result);
            } catch (e) { failed=e; tx.abort(); }
          };
        } catch (e) { state='error'; reject(e); }
      });
    }
    async function replaceMany(name,items) {
      const db = await open();
      if (!db) {
        memory[name] = new Map(items.map(item=>[name==='meta'?item.key:item.id,item]));
        notify();
        return {count:items.length,storedInIndexedDB:false};
      }
      return new Promise((resolve,reject) => {
        let failure=null;
        try {
          const tx=db.transaction(name,'readwrite');
          tx.oncomplete=()=>{notify();askPersistence();resolve({count:items.length,storedInIndexedDB:true});};
          tx.onabort=()=>{state='error';reject(failure || tx.error || new Error('Atomic write failed'));};
          const os=tx.objectStore(name);
          os.clear();
          for (const x of items) os.put(x);
        } catch (e) {failure=e;state='error';reject(e);}
      });
    }
    async function saveWord(input,now) {
      const normalized=MODEL.normalizeWord(input,now);
      return mutate('words',normalized.id,existing=>
        existing ? MODEL.mergeWords(existing,normalized,now) : normalized);
    }
    async function addManualWord({language,term,translationCs,explanation,level,note,context},now,cryptoApi) {
      const api = cryptoApi || (typeof crypto!=='undefined' ? crypto : null);
      const id = MODEL.createManualId(api);
      return saveWord({id,senseId:null,language,term,translationCs,explanation,level,note,context},now);
    }
    async function patchWord(id,patch,now) {
      return mutate('words',id,existing=>{
        if (!existing) throw new Error('Word does not exist');
        return MODEL.patchWord(existing,patch,now);
      });
    }
    async function deleteWord(id) {
      return mutate('words',id,existing=>{
        if (!existing) throw new Error('Word does not exist');
        return null;
      });
    }
    async function rateWord(id,rating,now) {
      return mutate('words',id,existing=>{
        if (!existing) throw new Error('Word does not exist');
        return MODEL.reviewWord(existing,rating,now);
      });
    }
    async function importWords(raw,{replace=false,now}={}) {
      const incoming=MODEL.validateImport(raw,now);
      assert(typeof replace === 'boolean','Invalid replace flag');
      const db=await open();
      if (!db) {
        const result=MODEL.combineImport([...memory.words.values()],incoming,replace,now);
        memory.words = new Map(result.map(x=>[x.id,x]));
        notify();
        return {count:result.length,imported:incoming.length,storedInIndexedDB:false};
      }
      return new Promise((resolve,reject) => {
        let failure=null,output=null;
        try {
          const tx=db.transaction('words','readwrite'),os=tx.objectStore('words');
          tx.oncomplete=()=>{notify();askPersistence();resolve({...output,storedInIndexedDB:true});};
          tx.onabort=()=>{state='error';reject(failure || tx.error || new Error('Import transaction aborted'));};
          const req=os.getAll();
          req.onsuccess=()=>{
            try {
              const combined=MODEL.combineImport(req.result,incoming,replace,now);
              if (replace) os.clear();
              for(const word of combined) os.put(word);
              output={count:combined.length,imported:incoming.length};
            } catch(e) {failure=e;tx.abort();}
          };
        } catch(e) {state='error';reject(e);}
      });
    }
    // R57: remove only the shared vocabulary bank. The tombstone is committed
    // in the SAME IndexedDB transaction, preventing old migration data from
    // silently reappearing on the next visit. Answers and backup files remain.
    const CLEAR_ALL_MARKER='vocabulary-cleared-by-user-r57';
    async function wasWordsCleared() {
      return Boolean(await one('meta',CLEAR_ALL_MARKER));
    }
    async function clearAllWords() {
      const marker={key:CLEAR_ALL_MARKER,clearedAt:new Date().toISOString()};
      const db=await open();
      if(!db){
        memory.words.clear();
        memory.meta.set(CLEAR_ALL_MARKER,marker);
        notify();
        return {count:0,storedInIndexedDB:false};
      }
      return new Promise((resolve,reject)=>{
        try{
          const tx=db.transaction(['words','meta'],'readwrite');
          tx.oncomplete=()=>{notify();resolve({count:0,storedInIndexedDB:true});};
          tx.onabort=()=>{state='error';reject(tx.error||new Error('Clearing vocabulary failed'));};
          tx.objectStore('words').clear();
          tx.objectStore('meta').put(marker);
        }catch(e){state='error';reject(e);}
      });
    }
    async function exportWords(now) { return MODEL.serializeExport(await all('words'),now); }
    async function saveAnswers(input,now) {
      const item=MODEL.normalizeAnswers(input,now);
      return mutate('answers',item.id,()=>item);
    }
    async function getAnswers(skill,topicId,language,level) {
      const id=MODEL.answerKey(skill,topicId,language,level);
      return one('answers',id);
    }
    async function clearAnswers(skill,topicId,language,level) {
      const id=MODEL.answerKey(skill,topicId,language,level);
      return mutate('answers',id,()=>null);
    }
    async function restoreAnswers(skill,topicId,language,level,validTaskIds,dataVersion,now) {
      const saved=await getAnswers(skill,topicId,language,level);
      if (!saved) return {snapshot:null,removedTaskIds:[],changed:false};
      const result=MODEL.reconcileAnswers(saved,validTaskIds,dataVersion,now);
      if (result.changed) await saveAnswers(result.snapshot,now);
      return result;
    }
    function status() { return {mode:state,database:dbName,version:DB_VERSION,storedInIndexedDB:state==='ready'}; }
    function close() {
      if (channel) try {channel.close();}catch(_){}
      listeners.clear();
      if (openPromise) openPromise.then(db=>{if(db)db.close();}).catch(()=>{});
    }
    return Object.freeze({
      database:dbName,open,status,subscribe,close,
      listWords:()=>all('words'),getWord:id=>one('words',id),saveWord,
      addManualWord,patchWord,deleteWord,clearAllWords,wasWordsCleared,rateWord,importWords,exportWords,
      saveAnswers,getAnswers,clearAnswers,restoreAnswers
    });
  }
  return Object.freeze({createStore,DB_VERSION,STORES});
});
