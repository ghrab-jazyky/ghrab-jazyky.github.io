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
 function appleWarning(ua,maxTouchPoints=0,standalone=false){
  const agent=String(ua||'');
  const ios=/iPhone|iPad|iPod/i.test(agent)||
    (/Macintosh/i.test(agent)&&Number(maxTouchPoints)>1);
  const safariMac=/Macintosh/i.test(agent)&&/Safari\//.test(agent)&&
    !/Chrome\/|Chromium\/|Edg\/|OPR\/|Firefox\//.test(agent);
  if(ios){
   if(standalone)return 'Tato stránka běží v samostatné webové aplikaci na ploše. Podle WebKit se na ni běžné sedmidenní pravidlo Safari nevztahuje. Data se ale mohou ztratit při odstranění aplikace nebo jejích dat. Zálohuj JSON. Pozor: slovíčka uložená v Safari jsou od aplikace oddělená.';
   return 'POZOR (Apple): Při otevření karty přímo z QR v Safari může po sedmi dnech používání Safari bez interakce s webem dojít k odstranění IndexedDB. Žádné nastavení této stránky tomu spolehlivě nezabrání. Samostatná webová aplikace na ploše riziko ITP omezuje, ale neotevírá automaticky učitelské QR a má od Safari oddělená slovíčka. Ulož JSON mimo prohlížeč.';
  }
  if(safariMac)return 'POZOR (Safari na Macu): Po sedmi dnech používání Safari bez interakce s tímto webem může být IndexedDB automaticky vymazána. Zálohuj JSON mimo prohlížeč.';
  return 'Místní úložiště může být vymazáno při čištění dat nebo změně zařízení. Uchovávej externí JSON zálohu.';
 }
 return Object.freeze({canonical,fingerprint,assessment,appleWarning,WEEK});
});
