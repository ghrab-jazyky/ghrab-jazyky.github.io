/* Claude review batch export: read-only, no upload, no sensitive answer keys. */
(function(){
'use strict';
const $=id=>document.getElementById(id),LIMIT=5,types=['konverzace','cteni','poslech'];
let queue=[],catalog=new Map(),active=[];
const ui=(t,c)=>{const e=document.createElement(t);if(c)e.className=c;return e};
const filename=s=>String(s).replace(/[^a-z0-9_-]/gi,'_').slice(0,80);
const encoder=new TextEncoder();
function crc32(bytes){let c=-1;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^(-1))>>>0}
function zip(rows){
 const local=[],cent=[];let offset=0,centralSize=0;
 for(const row of rows){
  const name=encoder.encode(row.name),body=row.bytes,checksum=crc32(body);
  const h=new Uint8Array(30+name.length),d=new DataView(h.buffer);
  d.setUint32(0,0x04034b50,true);d.setUint16(4,20,true);d.setUint16(6,2048,true);
  d.setUint32(14,checksum,true);d.setUint32(18,body.length,true);
  d.setUint32(22,body.length,true);d.setUint16(26,name.length,true);h.set(name,30);
  const c=new Uint8Array(46+name.length),v=new DataView(c.buffer);
  v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);
  v.setUint16(8,2048,true);v.setUint32(16,checksum,true);
  v.setUint32(20,body.length,true);v.setUint32(24,body.length,true);
  v.setUint16(28,name.length,true);v.setUint32(42,offset,true);c.set(name,46);
  local.push(h,body);cent.push(c);offset+=h.length+body.length;centralSize+=c.length;
 }
 const footer=new Uint8Array(22),f=new DataView(footer.buffer);
 f.setUint32(0,0x06054b50,true);f.setUint16(8,rows.length,true);f.setUint16(10,rows.length,true);
 f.setUint32(12,centralSize,true);f.setUint32(16,offset,true);
 return new Blob([...local,...cent,footer],{type:'application/zip'});
}
function prompt(item,e,sha){
 const ref=e.skill==='konverzace'?
  'Umělá inteligence: 8 stanovišť, tři doplňující otázky, Support / Challenge / Stretch, Explain tam, kde je relevantní, 12 slov a 4 jazykové opory.':
  e.skill==='cteni'?
  'Asteroids v2.3: reading for evidence, offline slovník, práce s textem, 9/9/12/18/21/21 úloh dle A1–C2; ověřit klíč mimo public repo.':
  'Matthew McConaughey v3: Before Listening → First Listening → Second Listening → Third Listening (Written Evidence + Reconstruct the Speech) → Optional Language → After Listening; neopisovat mechanicky.';
 return [
 '# CLAUDE — nezávislý hloubkový audit: '+e.title,'',
 'Karta ID: '+e.id+' · dovednost '+e.skill,
 'Dostupné jazyky: '+e.languages.join(', ')+' · úrovně: '+e.levels.join(', '),
 'Zdrojový soubor v tomto ZIP: source/'+item.id+'.html',
 'Přesný SHA-256 zdrojového souboru: '+sha,
 'Závazný referenční vzor: '+ref,
 '',
 'Posuzujte přesný HTML zdroj a jeho skutečné texty a úlohy, ne pouze stručný katalogový popis.',
 'Kontrolujte všechny deklarované kombinace jazyka a CEFR, výslovnostní či jazykové formulace, gramatiku, idiomatičnost, level progression, věkovou vhodnost, pravdivost obsahu, pedagogickou užitečnost, zadání, UX, mobilní a offline omezení.',
 'U čtení doložte odpovědi konkrétními pasážemi. Bez samostatně předaného soukromého učitelského klíče netvrďte, že je klíč nezávisle ověřen.',
 'U poslechu upozorněte, pokud externí video není skutečně dostupné či jej nelze ověřit; neimprovizujte přepis.',
 'U každé chyby uveďte přesný jazyk, CEFR, konkrétní stanoviště/úlohu, původní text, opravený návrh, důkaz a prioritu P0/P1/P2.',
 'P0 = chyba ohrožující správnost/bezpečnost/test, P1 = pedagogicky významná chyba, P2 = menší jazyková/UX chyba.',
 'Výstup neznamená schválení. Žádné učitelské klíče nebo identifikovatelná žákovská data nepatří do veřejného repozitáře.',
 '',
 'Povinné reviewedVariants musí mít přesně všechny skutečně zkontrolované kombinace jazyka/CEFR: 24 pro Conversation/Reading, šest pro Listening. Každá kombinace má své source-specific evidence (20+ znaků); nevymýšlejte chybějící kontroly.',
 'Povinné unverifiedChecks: popište všechny dosud neověřené oblasti, nativní zařízení, externí média, školní Wi-Fi, offline slovník a soukromý učitelský klíč. [] jen po skutečném prověření.',
 'VRAŤTE STRIKTNĚ JSON, reviewedVariants rozepište na všechny kombinace:',
 '{"topicId":"'+e.id+'","sourceSha256":"'+sha+'","status":"REVIEWED_WITH_FINDINGS|REVIEWED_NO_FINDINGS","requiresTeacherDecision":true,"reviewedVariants":[{"language":"en","level":"A1","evidence":"Konkrétní obsahové pozorování k EN A1"}],"unverifiedChecks":["Nativní iOS nebyl fyzicky otestován"],"findings":[{"severity":"P1","language":"es","level":"A1","location":"station 8 question 1","observed":"Původní formulace","proposed":"Navržené znění","evidence":"Konkrétní zdrojový důkaz"}]}',
 '',
 'Zároveň připojte stručný lidsky čitelný souhrn. Pokud nebylo možné reálně otestovat iOS/Android/video, výslovně to napište.',
 ''
 ].join('\n');
}
function render(){
 const skill=$('audSkill').value,topics=queue.filter(x=>x.skill===skill);
 const max=Math.max(1,Math.ceil(topics.length/LIMIT)),sel=$('audBatch'),old=Number(sel.value)||1;
 sel.replaceChildren();
 for(let i=1;i<=max;i++){const a=new Option('Dávka '+i+' / '+max,i);sel.add(a)}
 sel.value=String(Math.min(max,old));
 const page=Number(sel.value),items=topics.slice((page-1)*LIMIT,page*LIMIT);
 active=items;
 const root=$('audCards');root.replaceChildren();
 for(const t of items){
  const entry=catalog.get(t.id);if(!entry)continue;
  const line=ui('article','aud-row'),title=ui('h3'),meta=ui('p','aud-meta'),link=ui('a','button outline');
  title.textContent=entry.title;
  meta.textContent=entry.languages.join(' · ').toUpperCase()+'  |  A1–C2  |  Claude: '+t.status+(t.teacherApproval?' / učitel schválil':' / učitel zatím neschválil');
  link.href='../'+t.sourcePath;link.textContent='Otevřít původní studentské HTML';link.target='_blank';link.rel='noopener';
  const note=ui('p','aud-note');note.textContent=entry.contentNote||'Nezávislý audit nezaručují automatické strukturální testy.';
  line.append(title,meta,note,link);root.append(line);
 }
 $('audCount').textContent=topics.length+' karet · nyní '+items.length+' v dávce';
 $('audBuild').disabled=!items.length;
}
async function makePackage(){
 if(!active.length)return;const button=$('audBuild'),status=$('audStatus');button.disabled=true;
 try{
  const files=[],prompts=[],errors=[];
  for(const q of active){
   const e=catalog.get(q.id);if(!e){errors.push(q.id+' chybí katalogový záznam');continue}
   const url=new URL('../'+q.sourcePath,location.href);
   if(url.origin!==location.origin||!url.pathname.startsWith('/zkusebni/'))throw Error('Nepovolený zdroj '+q.id);
   const response=await fetch(url,{cache:'no-store'});
   if(!response.ok)throw Error('HTML '+q.id+': HTTP '+response.status);
   const buffer=await response.arrayBuffer();
   if(buffer.byteLength>6*1024*1024)throw Error('Příliš velký HTML soubor '+q.id);
   if(!window.crypto||!crypto.subtle)throw Error('Pro audit se SHA-256 je vyžadováno bezpečné HTTPS připojení.');
   const digest=await crypto.subtle.digest('SHA-256',buffer);
   const sha=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
   const p=prompt(q,e,sha);
   files.push({name:'source/'+filename(q.id)+'.html',bytes:new Uint8Array(buffer)});
   files.push({name:'prompts/'+filename(q.id)+'.md',bytes:encoder.encode(p)});
   prompts.push({id:q.id,sourceSha256:sha,reportFormat:'Report in reports.json, schemaVersion 1, all findings private until sanitized'});
  }
  if(errors.length)throw Error(errors.join(', '));
  const readme=[
   '# CLAUDE — Language Skills Hub: hromadný audit','',
   'V tomto balíčku je '+active.length+' studentských HTML originálů, z nichž každý má vlastní auditní prompt se SHA-256.',
   'Zpracovávejte všechny karty, ne pouze jednu; doložte reviewedVariants a unverifiedChecks; výsledky v souboru reports.json jako {"schemaVersion":1,"reports":[...]}',
   'Učitel provede konečné schválení; bezpečně sdílejte jen anonymizovaná zjištění a žádné učitelské klíče.',
   'Testování dosud není samostatně schválené. Předložené karty jsou technické piloty.', ''
  ].join('\n');
  files.push({name:'README_CLAUDE.md',bytes:encoder.encode(readme)});
  files.push({name:'audit-index.json',bytes:encoder.encode(JSON.stringify(prompts,null,2)+'\n')});
  const blob=zip(files),object=URL.createObjectURL(blob),a=ui('a');
  a.href=object;a.download='LSH_Claude_'+$('audSkill').value+'_davka_'+$('audBatch').value+'.zip';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(object),60000);
  status.textContent='Auditní ZIP vytvořen: '+active.length+' originálních HTML a zadání. Nyní jej lze nahrát do Clauda. Žádná data se z této stránky neodeslala.';
 }catch(error){console.error(error);status.textContent='Balíček se nepodařilo připravit: '+error.message}
 finally{button.disabled=false}
}
async function init(){
 try{
  const [a,b]=await Promise.all([fetch('../data/reference-pilots.json',{cache:'no-store'}),fetch('../data/claude-audit-queue.json',{cache:'no-store'})]);
  if(!a.ok||!b.ok)throw Error('Přístup k souborům');
  const ca=await a.json(),q=await b.json();
  if(ca.approvedForTeaching!==false||!Array.isArray(q.topics)||new Set(q.topics.map(x=>x.id)).size!==q.topics.length)throw Error('Neplatný inventář');
  catalog=new Map(ca.entries.map(x=>[x.id,x]));queue=q.topics;
  if(queue.some(x=>!catalog.has(x.id)||!types.includes(x.skill)||!/^([a-z0-9-]+\/)+index\.html$/.test(x.sourcePath)))throw Error('Neplatná cesta auditní fronty');
  $('audSkill').addEventListener('change',()=>{$('audBatch').value='1';render()});
  $('audBatch').addEventListener('change',render);
  $('audBuild').addEventListener('click',()=>{void makePackage()});
  render();
 }catch(e){$('audStatus').textContent='Auditní fronta není dostupná: '+e.message;console.error(e)}
}
void init();
})();