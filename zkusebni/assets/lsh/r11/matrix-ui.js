/* Local-only R11 audit worksheet. It never uploads anything or approves release. */
(function(){
'use strict';
const byId=id=>document.getElementById(id);
const manifest=JSON.parse(byId('r11-matrix-data').textContent);
if(manifest.schemaVersion!==1||manifest.kind!=='LSH_R11_PRELIMINARY_REVIEW_NOT_APPROVAL'||
 manifest.teacherApproval!==false||manifest.approvedForRelease!==false||
 manifest.published!==false||manifest.privateTeacherKeysBundled!==false||
 manifest.variantCount!==642||manifest.variants.length!==642)throw Error('R11 review metadata invalid');
const VALID=new Map(manifest.variants.map(x=>[x.id,x]));
if(VALID.size!==642)throw Error('Duplicate review variant');
const STATUS={todo:'Ke kontrole',reviewed:'Posouzeno bez n\u00e1lezu',issue:'Vy\u017eaduje opravu'};
const SKILLS={konverzace:'Conversation Lab',cteni:'Reading Lab',poslech:'Listening Lab'};
const KEY='LSH_R11_REVIEW_'+manifest.bundleId;
const records=new Map();
const ui={skill:byId('skillFilter'),lang:byId('langFilter'),level:byId('levelFilter'),
 status:byId('statusFilter'),search:byId('searchFilter'),list:byId('reviewList'),
 count:byId('resultsCount'),summary:byId('reviewSummary'),next:byId('loadMore'),
 detailTitle:byId('detailTitle'),detailInfo:byId('detailInfo'),
 detailAlerts:byId('detailAlerts'),open:byId('openStudent'),
 reviewStatus:byId('reviewStatus'),note:byId('reviewNote'),
 saveNotice:byId('saveNotice')};
let selected=null,limit=45,canStore=true;
function message(s){ui.saveNotice.textContent=s;}
function normalize(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('cs')}
function state(id){return records.get(id)||{status:'todo',note:''}}
function validateRecord(rec){
 return !!rec&&typeof rec==='object'&&typeof rec.id==='string'&&VALID.has(rec.id)&&
  ['todo','reviewed','issue'].includes(rec.status)&&typeof rec.note==='string'&&
  rec.note.length<=1000&&Object.keys(rec).every(k=>['id','status','note'].includes(k));
}
function readExport(payload){
 if(!payload||typeof payload!=='object'||payload.schemaVersion!==1||
  payload.kind!=='LSH_R11_LOCAL_REVIEW_NOT_APPROVAL'||payload.bundleId!==manifest.bundleId||
  payload.variantCount!==642||!Array.isArray(payload.records)||payload.records.length>642||
  payload.teacherApproval!==false||payload.approvedForRelease!==false||
  payload.records.some(x=>!validateRecord(x)))throw Error('Invalid or mismatched review export');
 const unique=new Set(payload.records.map(x=>x.id));
 if(unique.size!==payload.records.length)throw Error('Duplicate review record');
 return payload.records;
}
function writeStorage(){
 if(!canStore)return;
 try{localStorage.setItem(KEY,JSON.stringify(exportPayload()))}
 catch(_){canStore=false;message('M\u00edstn\u00ed ukl\u00e1d\u00e1n\u00ed je omezen\u00e9; pou\u017eijte export JSON.');}
}
function exportPayload(){
 return {schemaVersion:1,kind:'LSH_R11_LOCAL_REVIEW_NOT_APPROVAL',
  bundleId:manifest.bundleId,variantCount:642,teacherApproval:false,
  approvedForRelease:false,exportedAt:new Date().toISOString(),
  records:[...records].map(([id,val])=>({id,status:val.status,note:val.note}))
   .sort((a,b)=>a.id.localeCompare(b.id))};
}
function summary(){
 let reviewed=0,issue=0;
 for(const v of manifest.variants){
  const s=state(v.id).status;
  if(s==='reviewed')reviewed++;
  if(s==='issue')issue++;
 }
 const nums=[[manifest.variants.length,'Celkem'],[reviewed,'Posouzeno bez n\u00e1lezu'],
  [issue,'Vy\u017eaduje opravu'],[manifest.variants.length-reviewed-issue,'Ke kontrole']];
 ui.summary.replaceChildren();
 for(const [n,label] of nums){
  const box=document.createElement('div');box.className='stat';
  const b=document.createElement('b');b.textContent=String(n);
  const small=document.createElement('small');small.textContent=label;
  box.append(b,small);ui.summary.append(box);
 }
}
function filtered(){
 const q=normalize(ui.search.value.trim());
 return manifest.variants.filter(v=>(!ui.skill.value||v.skill===ui.skill.value)&&
  (!ui.lang.value||v.lang===ui.lang.value)&&(!ui.level.value||v.level===ui.level.value)&&
  (!ui.status.value||state(v.id).status===ui.status.value)&&
  (!q||normalize(v.title+' '+v.topicId).includes(q)));
}
function showList(){
 const visible=filtered();
 ui.count.textContent='Zobrazeno '+Math.min(limit,visible.length)+' z '+visible.length;
 ui.next.hidden=visible.length<=limit;
 ui.list.replaceChildren();
 for(const v of visible.slice(0,limit)){
  const b=document.createElement('button');b.type='button';b.className='review-row';
  b.setAttribute('aria-current',v.id===selected?'true':'false');
  const left=document.createElement('span');left.className='row-text';
  const name=document.createElement('b');name.textContent=v.title;
  const info=document.createElement('small');
  info.textContent=SKILLS[v.skill]+' \u00b7 '+v.lang.toUpperCase()+' '+v.level;
  left.append(name,info);
  const mark=document.createElement('span'),st=state(v.id).status;
  mark.className='row-status '+st;mark.textContent=STATUS[st];
  b.append(left,mark);b.addEventListener('click',()=>select(v.id));
  ui.list.append(b);
 }
}
function select(id){
 if(!VALID.has(id))return;
 selected=id;const v=VALID.get(id),s=state(id);
 ui.detailTitle.textContent=v.title+' \u00b7 '+v.lang.toUpperCase()+' '+v.level;
 ui.detailInfo.textContent=SKILLS[v.skill]+' \u00b7 '+v.tier+
  ' \u00b7 kontrola konkr\u00e9tn\u00ed jazykov\u00e9 a \u00farov\u0148ov\u00e9 varianty';
 const cautions=[];
 if(v.teacherKeySync)cautions.push('Reading: soukrom\u00fd u\u010ditelsk\u00fd kl\u00ed\u010d vy\u017eaduje synchronizaci.');
 if(v.mediaCheck)cautions.push('Listening: ov\u011b\u0159te zdrojov\u00e9 video a v\u011bkovou vhodnost.');
 ui.detailAlerts.textContent=cautions.join(' ');
 ui.open.href=v.href;ui.open.removeAttribute('aria-disabled');ui.open.classList.remove('disabled');
 ui.reviewStatus.disabled=false;ui.note.disabled=false;
 ui.reviewStatus.value=s.status;ui.note.value=s.note;
 showList();
}
function save(){
 if(selected===null)return;
 const v={status:ui.reviewStatus.value,note:ui.note.value};
 if(!['todo','reviewed','issue'].includes(v.status)||v.note.length>1000)return;
 if(v.status==='todo'&&!v.note.trim())records.delete(selected);
 else records.set(selected,v);
 writeStorage();summary();showList();
}
function resetFilters(){limit=45;showList()}
for(const f of [ui.skill,ui.lang,ui.level,ui.status])f.addEventListener('change',resetFilters);
ui.search.addEventListener('input',resetFilters);
ui.next.addEventListener('click',()=>{limit+=45;showList()});
ui.reviewStatus.addEventListener('change',save);
ui.note.addEventListener('input',save);
byId('exportReview').addEventListener('click',()=>{
 const data=JSON.stringify(exportPayload(),null,2)+'\n';
 const blob=new Blob([data],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='LSH_R11_revizni_stav_'+manifest.bundleId.slice(0,10)+'.json';
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),20000);
 message('Soubor JSON p\u0159ipraven k ulo\u017een\u00ed. Nesm\u00ed obsahovat osobn\u00ed \u00fadaje \u017e\u00e1k\u016f.');
});
byId('importReview').addEventListener('change',async e=>{
 const file=e.target.files&&e.target.files[0];if(!file)return;
 try{
  if(file.size>1000000)throw Error('Review export too large');
  const list=readExport(JSON.parse(await file.text()));
  records.clear();for(const r of list)records.set(r.id,{status:r.status,note:r.note});
  writeStorage();summary();showList();if(selected)select(selected);
  message('Stav '+list.length+' polo\u017eek byl na\u010dten pro stejnou verzi bal\u00ed\u010dku.');
 }catch(err){
  message('Soubor nebyl p\u0159ijat. Mus\u00ed j\u00edt o spr\u00e1vn\u00fd R11 export pro toto\u017en\u00e9 karty.');
  console.warn('R11 import rejected:',err);
 }finally{e.target.value=''}
});
byId('clearReview').addEventListener('click',()=>{
 if(!confirm('Smazat v\u0161echny m\u00edstn\u00ed pozn\u00e1mky a stavy?'))return;
 records.clear();writeStorage();summary();showList();if(selected)select(selected);
 message('M\u00edstn\u00ed evidence byla vymaz\u00e1na.');
});
try{
 const raw=localStorage.getItem(KEY);
 if(raw){for(const r of readExport(JSON.parse(raw)))records.set(r.id,{status:r.status,note:r.note})}
}catch(_){canStore=false;message('Stav se v tomto prohl\u00ed\u017ee\u010di nemus\u00ed ukl\u00e1dat. Pro uchov\u00e1n\u00ed pou\u017eijte export JSON.');}
summary();showList();
})();
