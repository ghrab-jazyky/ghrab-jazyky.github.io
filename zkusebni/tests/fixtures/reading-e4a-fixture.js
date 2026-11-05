/* Isolated E4A browser fixture. No real Reading Lab educational material. */
(function(){
 'use strict';
 const langs=['en','es','de','fr'],levels=['A1','A2','B1','B2','C1','C2'];
 const variants=Object.fromEntries(langs.flatMap(l=>levels.map(v=>[l+':'+v,['q1','q2']])));
 const api=window.LSH_READING_BRIDGE.createBridge({mode:'staging',
   topicId:'rl-e4a-synthetic',dataVersion:'fixture-e4a-1',variants});
 const $=id=>document.getElementById(id);
 const status=$('fixtureStatus');
 async function run(task){
  try{
   const response=await task();
   const stored=response.storedInIndexedDB;
   status.textContent=(stored===true?'Zapsáno do IndexedDB.':stored===false?
     'Pouze dočasně.':'Načteno.')+(response.warning?' '+response.warning:'');
  }catch(error){status.textContent='CHYBA: '+error.message;}
 }
 $('fixtureSaveAnswer').addEventListener('click',()=>run(()=>
  api.saveAnswers({language:'en',level:'B2',answers:{q1:{value:$('fixtureAnswer').value}}})));
 $('fixtureRestoreAnswer').addEventListener('click',()=>run(async()=>{
  const r=await api.restoreAnswers({language:'en',level:'B2'});
  $('fixtureAnswer').value=r.snapshot?.answers?.q1?.value||'';
  return {};
 }));
 $('fixtureSaveWord').addEventListener('click',()=>run(()=>
  api.saveWord({language:'en',level:'B2',senseId:'qa-horizon-001',
    term:'horizon',translationCs:'obzor',context:'Synthetic text only.'})));
 api.status().then(s=>{$('fixtureMode').textContent='Úložiště: '+s.mode;});
 window.addEventListener('pagehide',()=>api.close(),{once:true});
 window.E4A_FIXTURE=api;
})();
