/* Language Skills Hub: local-only admission packaging. Never sends uploaded HTML to a server. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const files=[],maxCards=12,maxBytes=6*1024*1024;
const skills={konverzace:'cl',cteni:'rl',poslech:'ll'};
const status=$('intakeStatus'),list=$('intakeList'),btn=$('intakeBuild');
let existing=new Set();
const el=(tag,cls)=>{const x=document.createElement(tag);if(cls)x.className=cls;return x};
const setStatus=message=>{status.textContent=message};
function slugify(s){return s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65)}
function field(labelText,kind,value,change,choices){
 const wrap=el('label','intake-field'),cap=el('span');cap.textContent=labelText;wrap.append(cap);
 const control=choices?el('select'):el(kind||'input');
 if(choices)for(const [val,title] of choices){const opt=new Option(title,val);control.add(opt)}
 else if(kind==='textarea'){control.rows=2;control.maxLength=400}
 else{control.type='text';control.maxLength=160}
 control.value=value||'';
 control.addEventListener('input',()=>change(control.value));
 control.addEventListener('change',()=>change(control.value));
 wrap.append(control);return wrap;
}
function labelFor(skill){return skill==='cteni'?'Reading Lab':skill==='poslech'?'Listening Lab':'Conversation Lab'}
function draw(){
 list.replaceChildren();
 for(const item of files){
  const box=el('section','intake-row');
  const head=el('div','intake-row-header'),heading=el('h3');
  heading.textContent=item.originalName;head.append(heading);
  const drop=el('button','button outline');drop.type='button';drop.textContent='Odebrat';
  drop.addEventListener('click',()=>{files.splice(files.indexOf(item),1);draw()});head.append(drop);box.append(head);
  const fields=el('div','intake-grid');
  fields.append(
   field('Laboratoř','select',item.skill,v=>{item.skill=v;item.id=skills[v]+'-'+item.slug;draw()},Object.keys(skills).map(x=>[x,labelFor(x)])),
   field('ID tématu — bez diakritiky','input',item.id,v=>{item.id=v.trim().toLowerCase();showWarnings()},null),
   field('Název tématu','input',item.title,v=>{item.title=v;showWarnings()}),
   field('Verze originálu','input',item.version,v=>{item.version=v;showWarnings()}),
   field('Konkrétní anotace (min. 25 znaků)','textarea',item.summary,v=>{item.summary=v;showWarnings()}),
   field('Výukové zaměření','input',item.focus,v=>{item.focus=v;showWarnings()})
  );
  box.append(fields);
  const note=el('p','intake-note');note.textContent='Zdroj bude přidán pouze jako neschválený technický pilot. Jazyková a pedagogická kontrola následuje zvlášť.';
  box.append(note);list.append(box);
 }
 $('intakeCount').textContent=files.length+' / '+maxCards+' souborů';
 showWarnings();
}
function errors(){
 const messages=[],ids=new Set();
 for(const item of files){
  if(!/^(cl|rl|ll)-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)||!item.id.startsWith(skills[item.skill]+'-'))messages.push(item.originalName+': neplatné ID.');
  if(ids.has(item.id)||existing.has(item.id))messages.push(item.id+': ID již existuje nebo je v balíčku dvakrát.');
  ids.add(item.id);
  if(item.title.trim().length<3||item.title.length>125)messages.push(item.id+': zadejte název (3–125 znaků).');
  if(item.summary.trim().length<25||item.summary.length>400)messages.push(item.id+': konkrétní anotace (25–400 znaků).');
  if(!item.version.trim()||item.version.length>45)messages.push(item.id+': zadejte verzi originálu.');
  if(item.size>maxBytes)messages.push(item.id+': soubor přesahuje 6 MB.');
 }
 return messages;
}
function showWarnings(){
 const issues=errors();
 btn.disabled=files.length===0||issues.length>0;
 $('intakeWarnings').textContent=issues.join(' ')|| (files.length?'Balíček připraven. Před přidáním do repozitáře proběhne ještě úplná validace.':'');
}
async function add(selected){
 const items=[...selected];
 if(files.length+items.length>maxCards){setStatus('Nejvýše 12 karet v jedné dávce.');return}
 for(const file of items){
  if(!/\.html?$/i.test(file.name)){setStatus('Vybírejte pouze studentské .html soubory.');continue}
  if(file.size>maxBytes){setStatus('Soubor '+file.name+' přesahuje limit 6 MB.');continue}
  const t=await file.text();
  if(!/<html[\s>]/i.test(t)||!/<\/html>/i.test(t)){setStatus(file.name+' není platné studentské HTML.');continue}
  if(/-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----|(?:OPENAI|ANTHROPIC)_API_KEY|ghp_[A-Za-z0-9]{25,}/i.test(t)){setStatus('Soubor '+file.name+' obsahuje podezření na soukromý klíč a nebyl zařazen.');continue}
  const inferred=t.includes('const CONTENT = ')?'konverzace':t.includes('const LEVEL_IDS')?'poslech':t.includes('const DATA=')?'cteni':'konverzace';
  const embedded=t.match(/data-lsh-topic-id="(cl-[a-z0-9-]+)"/);
  const slug=embedded?embedded[1].slice(3):slugify(file.name.replace(/\.html?$/i,''));
  const titleRaw=t.match(/<title[^>]*>([^<]{1,180})<\/title>/i)?.[1]||file.name.replace(/\.html?$/i,'');
  const title=titleRaw.replace(/\s*[|·]\s*(?:Conversation Lab|Reading Lab|Listening.*)$/i,'').slice(0,125);
  files.push({file,size:file.size,originalName:file.name,skill:inferred,slug,id:skills[inferred]+'-'+slug,title,version:'v1',summary:'',focus:''});
 }
 draw();setStatus(files.length+' studentských HTML připraveno k popisu a zabalení. Soubor nikam neodesíláme.');
 $('intakeFiles').value='';
}
function word16(v){return v&65535}
function write16(dv,pos,x){dv.setUint16(pos,word16(x),true)}
function write32(dv,pos,x){dv.setUint32(pos,x>>>0,true)}
function crc32(bytes){
 let c=-1;
 for(const b of bytes){c^=b;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0)}
 return (c^(-1))>>>0;
}
function makeZip(list){
 const encoder=new TextEncoder(),local=[],central=[];let offset=0,centralLength=0;
 for(const item of list){
  const name=encoder.encode(item.name),data=item.bytes,crc=crc32(data);
  if(name.length>65535||data.length>0xffffffff)throw Error('File too large');
  const l=new Uint8Array(30+name.length),dv=new DataView(l.buffer);
  write32(dv,0,0x04034b50);write16(dv,4,20);write16(dv,6,0x0800);
  write16(dv,8,0);write32(dv,14,crc);write32(dv,18,data.length);
  write32(dv,22,data.length);write16(dv,26,name.length);l.set(name,30);
  const c=new Uint8Array(46+name.length),cv=new DataView(c.buffer);
  write32(cv,0,0x02014b50);write16(cv,4,20);write16(cv,6,20);write16(cv,8,0x0800);
  write16(cv,10,0);write32(cv,16,crc);write32(cv,20,data.length);
  write32(cv,24,data.length);write16(cv,28,name.length);write32(cv,42,offset);c.set(name,46);
  local.push(l,data);central.push(c);offset+=l.length+data.length;centralLength+=c.length;
 }
 const end=new Uint8Array(22),ev=new DataView(end.buffer);
 write32(ev,0,0x06054b50);write16(ev,8,list.length);write16(ev,10,list.length);
 write32(ev,12,centralLength);write32(ev,16,offset);
 return new Blob([...local,...central,end],{type:'application/zip'});
}
async function build(){
 const issues=errors();if(issues.length||files.length===0){setStatus('Opravte popisy a ID před vytvořením balíčku.');return}
 btn.disabled=true;
 try{
  const archive=[],spec={schemaVersion:1,cards:[]};
  for(const item of files){
   const name=item.id+'.html';
   archive.push({name,bytes:new Uint8Array(await item.file.arrayBuffer())});
   spec.cards.push({id:item.id,skill:item.skill,title:item.title.trim(),
    summary:item.summary.trim(),focus:item.focus.trim(),version:item.version.trim(),
    sourceFile:name,defaultLevel:'B1'});
  }
  archive.push({name:'cards.json',bytes:new TextEncoder().encode(JSON.stringify(spec,null,2)+'\n')});
  archive.push({name:'README.txt',bytes:new TextEncoder().encode(
    'LANGUAGE SKILLS HUB — INTAKE_V1\n'+
    'Tento balíček nebyl zveřejněn. Odešlete jej oprávněnému správci / jako přílohu v ChatGPT,\n'+
    'nebo jej rozbalte a spusťte node zkusebni/tools/card-intake.cjs --batch cards.json --apply\n'+
    'v bezpečné pracovní větvi školního repozitáře. Originály obsahují pouze STUDENTSKÉ HTML.\n'+
    'Test a schválené zveřejnění následují až po nezávislém auditu.\n')});
  const zip=makeZip(archive),url=URL.createObjectURL(zip),a=el('a');
  a.href=url;a.download='LSH_nove-karty_'+files.length+'_INTAKE.zip';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  setStatus('ZIP připraven. Zatím se nic nepublikovalo; nyní jej předejte k validovanému importu do školního GitHubu.');
 }catch(e){setStatus('Nepodařilo se sestavit ZIP: '+e.message);console.error(e)}
 finally{btn.disabled=false}
}
async function loadExisting(){
 try{
  const r=await fetch('../data/reference-pilots.json',{cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const j=await r.json();existing=new Set(j.entries.map(x=>x.id));showWarnings();
 }catch(_){setStatus('Seznam existujících ID není dostupný; duplicity ověří bezpečně až importer.')}
}
$('intakeFiles').addEventListener('change',e=>{void add(e.target.files)});
$('intakeBuild').addEventListener('click',()=>{void build()});
const zone=$('intakeDrop');
zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag-over')});
zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag-over');void add(e.dataTransfer.files)});
void loadExisting();
})();