/* LSH E4A Reading Lab bridge — draft/staging only.
   Original reading-card engines must opt in explicitly; no automatic interception,
   no remote requests, keys, analytics or unapproved content migration. */
(function(root,factory){
  'use strict';
  const api=factory(
    typeof module!=='undefined'&&module.exports ? require('../v3/model.js') : root.LSH_MODEL,
    typeof module!=='undefined'&&module.exports ? require('../v3/store.js') : root.LSH_STORE
  );
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.LSH_READING_BRIDGE=api;
})(typeof window!=='undefined'?window:this,function(MODEL,STORE){
  'use strict';
  if(!MODEL||!STORE)throw new Error('Reading bridge requires local model/store modules');
  const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
  const ID=/^rl-[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const TASK=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
  const SENSE=/^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?$/;
  function assert(value,message){if(!value)throw new Error(message);}
  const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
  const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
  function validateContract(input){
    assert(object(input),'Reading contract must be an object');
    assert(input.mode==='staging','E4A can only run in staging');
    assert(typeof input.topicId==='string'&&ID.test(input.topicId),'Invalid Reading topic ID');
    assert(typeof input.dataVersion==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(input.dataVersion),'Invalid dataVersion');
    assert(!['teacherKey','teacherKeyUrl','correctAnswers','answerKey','solutionKey','teacherAnswers']
      .some(k=>own(input,k)),'Teacher solutions must never enter student bridge');
    assert(object(input.variants)&&Object.keys(input.variants).length===24,'All 24 Reading variants required');
    const variants=Object.create(null);
    for(const lang of LANGS)for(const level of LEVELS){
      const key=lang+':'+level;
      assert(own(input.variants,key)&&Array.isArray(input.variants[key]),'Missing variant '+key);
      const taskIds=input.variants[key];
      assert(taskIds.length>0&&taskIds.length<=250,'Invalid task count '+key);
      assert(taskIds.every(id=>typeof id==='string'&&TASK.test(id)),'Invalid task id '+key);
      assert(new Set(taskIds).size===taskIds.length,'Duplicate task id '+key);
      variants[key]=Object.freeze(taskIds.slice());
    }
    return Object.freeze({topicId:input.topicId,dataVersion:input.dataVersion,
      variants:Object.freeze(variants)});
  }
  function createBridge(options){
    const contract=validateContract(options);
    const ownsStore=!options.store;
    const store=options.store||STORE.createStore({mode:'staging'});
    assert(store&&typeof store.saveAnswers==='function'&&
      typeof store.getAnswers==='function'&&typeof store.saveWord==='function','Invalid store');
    const stamp=()=>new Date().toISOString();
    function variant(language,level){
      assert(LANGS.includes(language)&&LEVELS.includes(level),'Invalid Reading language or level');
      return contract.variants[language+':'+level];
    }
    function identity(language,level){variant(language,level);
      return {skill:'cteni',topicId:contract.topicId,language,level};}
    async function status(){
      if(typeof store.open==='function')await store.open();
      return typeof store.status==='function'?store.status():{mode:'unknown',storedInIndexedDB:false};
    }
    async function restoreAnswers({language,level}){
      const valid=variant(language,level);
      const previous=await store.getAnswers('cteni',contract.topicId,language,level);
      if(!previous)return {snapshot:null,requiresReview:false,removedTaskIds:[],changed:false};
      const reconciled=MODEL.reconcileAnswers(previous,valid,contract.dataVersion,stamp());
      return {snapshot:reconciled.snapshot,requiresReview:reconciled.changed,
        removedTaskIds:reconciled.removedTaskIds,changed:reconciled.changed};
    }
    async function acknowledgeVersionChange({language,level}){
      variant(language,level);
      const result=await restoreAnswers({language,level});
      if(!result.snapshot||!result.changed)return {changed:false,storedInIndexedDB:(await status()).storedInIndexedDB};
      const saved=await store.saveAnswers(result.snapshot,stamp());
      return {changed:true,removedTaskIds:result.removedTaskIds,
        storedInIndexedDB:saved.storedInIndexedDB};
    }
    async function saveAnswers({language,level,answers,activePart}){
      const allowed=new Set(variant(language,level));
      assert(object(answers),'Answer payload must be a task map');
      const patches=Object.entries(answers);
      assert(patches.length<=allowed.size,'Too many answers');
      for(const [key,value] of patches)assert(allowed.has(key)&&object(value),'Invalid or unknown Reading task');
      const previous=await store.getAnswers('cteni',contract.topicId,language,level);
      assert(!previous||previous.dataVersion===contract.dataVersion,
        'Reading content changed; explicitly acknowledge answer migration first');
      const merged=Object.assign(Object.create(null),previous?previous.answers:null);
      for(const [key,patch] of patches){
        const old=merged[key]||null;
        const next={...(old||{}),...patch};
        if(old&&old.firstAttempt!==null&&old.firstAttempt!==undefined)
          next.firstAttempt=old.firstAttempt;
        else if(patch.firstAttempt===undefined&&patch.value!==undefined&&patch.value!==null)
          next.firstAttempt=patch.value;
        merged[key]=next;
      }
      const nextPart=activePart===undefined?(previous?previous.activePart:null):activePart;
      const normalized=MODEL.normalizeAnswers({...identity(language,level),
        dataVersion:contract.dataVersion,answers:merged,activePart:nextPart},stamp());
      const saved=await store.saveAnswers(normalized,stamp());
      return {snapshot:normalized,storedInIndexedDB:saved.storedInIndexedDB,
        warning:saved.storedInIndexedDB?'':'Pouze dočasná paměť; odpovědi nemusí přežít zavření stránky.'};
    }
    async function clearAnswers({language,level}){
      variant(language,level);
      const result=await store.clearAnswers('cteni',contract.topicId,language,level);
      return {storedInIndexedDB:result.storedInIndexedDB};
    }
    async function saveWord({language,level,senseId,term,translationCs='',explanation='',context='',translationHidden=false}){
      variant(language,level);
      assert(typeof senseId==='string'&&senseId.length<=120&&SENSE.test(senseId),
        'Reading vocabulary needs a stable editorial senseId; cannot infer from translation');
      assert(typeof term==='string'&&!!term.trim(),'Vocabulary term is missing');
      assert((typeof translationCs==='string'&&translationCs.trim())||
        (typeof explanation==='string'&&explanation.trim()),'Word needs a real translation or explanation');
      assert(typeof translationHidden==='boolean','Invalid translationHidden flag');
      const entry=MODEL.normalizeWord({
        language,senseId,term,translationCs,explanation,context,level,translationHidden,
        sources:[{skill:'cteni',topicId:contract.topicId,savedAt:stamp()}]
      },stamp());
      const saved=await store.saveWord(entry,stamp());
      return {word:saved.record,storedInIndexedDB:saved.storedInIndexedDB,
        warning:saved.storedInIndexedDB?'':'Pouze dočasná paměť; slovo nemusí přežít zavření stránky.'};
    }
    function close(){if(ownsStore&&typeof store.close==='function')store.close();}
    return Object.freeze({contract,status,restoreAnswers,acknowledgeVersionChange,
      saveAnswers,clearAnswers,saveWord,close});
  }
  return Object.freeze({validateContract,createBridge,LANGS,LEVELS});
});
