/* Local-only backup safety indicators. This module never sends vocabulary anywhere. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSH_BACKUP_SAFETY=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const WEEK=7*24*60*60*1000;
 const valid=x=>x&&typeof x==='object'&&!Array.isArray(x);
 function canonical(words){
  if(!Array.isArray(words)||words.length>5000)throw Error('Neplatný seznam slovíček.');
  const items=words.map(w=>{
   if(!valid(w)||typeof w.id!=='string'||w.id.length>150)throw Error('Neplatné slovíčko.');
   return w;
  });
  return JSON.stringify(items.sort((a,b)=>a.id.localeCompare(b.id)));
 }
 async function fingerprint(words, cryptoApi=globalThis.crypto){
  if(!cryptoApi?.subtle?.digest)throw Error('Kontrola zálohy vyžaduje HTTPS.');
  const data=new TextEncoder().encode(canonical(words));
  const digest=new Uint8Array(await cryptoApi.subtle.digest('SHA-256',data));
  return [...digest].map(v=>v.toString(16).padStart(2,'0')).join('');
 }
 function assessment(wordCount,record,actualHash,now=Date.now()){
  if(!Number.isInteger(wordCount)||wordCount<0)throw Error('Neplatný počet slovíček.');
  if(!wordCount)return {state:'empty',message:'Slovníček je zatím prázdný. Po uložení slovíček si stáhni zálohu.'};
  if(!valid(record)||typeof record.hash!=='string'||!/^[a-f0-9]{64}$/.test(record.hash)||
     !Number.isFinite(record.at)||record.at>now||record.at<=0)
   return {state:'missing',message:'Zatím nemáš potvrzenou zálohu. Stáhni JSON a bezpečně ho ulož mimo prohlížeč.'};
  if(record.hash!==actualHash)
   return {state:'changed',message:'Od poslední zálohy se slovíčka změnila. Stáhni aktuální JSON soubor.'};
  if(now-record.at>=WEEK)
   return {state:'old',message:'Potvrzená záloha je starší než 7 dní. Doporučujeme vytvořit novou.'};
  return {state:'ok',message:'Poslední potvrzená záloha: '+new Date(record.at).toLocaleDateString('cs-CZ')+'. Soubor musí být uložen mimo prohlížeč.'};
 }
 function appleWarning(ua,maxTouchPoints=0){
  const ios=/iPhone|iPad|iPod/i.test(String(ua||''))||
    (/Macintosh/i.test(String(ua||''))&&Number(maxTouchPoints)>1);
  return ios?'Na iPhonu/iPadu může Safari po sedmi dnech používání bez interakce s webem odstranit IndexedDB. Případná aplikace přidaná na plochu může mít oddělená data. Vždy si uchovávej externí JSON zálohu.':
    'Místní úložiště může být vymazáno při čištění dat nebo změně zařízení. Uchovávej externí JSON zálohu.';
 }
 return Object.freeze({canonical,fingerprint,assessment,appleWarning,WEEK});
});
