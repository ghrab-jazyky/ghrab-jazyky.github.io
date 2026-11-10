/* R34 editorial-only assessment dashboard. No publishing or pupil identifiers. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),state={rows:[],url:'',key:''};
 const levels=['A1','A2','B1','B2','C1','C2'];
 const names={en:'Angličtina',es:'Španělština',de:'Němčina',fr:'Francouzština'};
 const labels={AUTHOR_DRAFT:'Autorské otázky – čeká na pedagogický audit',
  STRUCTURAL_SCAFFOLD:'Automatický pracovní návrh – není hotový jazykový test',
  SELECTION_BLUEPRINT:'Pouze výběr cvičných úloh – chybí nezávislý poslechový test'};
 const topicNames={
  'rl-asteroids':'Asteroids','rl-can-mistakes':'Can Mistakes Help Us Learn?',
  'rl-plastic-ocean':'Plastic in Our World',
  'rl-email-friend':'An Email from a Friend','rl-instant-messages':'Instant Messages',
  'll-matthew-oscars':'Matthew McConaughey – Oscars 2014',
  'll-harrison-ford':'Harrison Ford – Life Achievement Speech',
  'll-peaky-no-fighting':'Peaky Blinders – No Fighting'
 };
 function option(value,label){
  const el=document.createElement('option');el.value=value;el.textContent=label;return el;
 }
 function distinct(key,skill){
  return [...new Set(state.rows.filter(r=>r.skill===skill).map(r=>r[key]))];
 }
 function resetTopics(){
  const skill=$('skill').value,old=$('topic').value;
  $('topic').replaceChildren(...distinct('topic',skill).map(t=>option(t,topicNames[t]||t)));
  if(distinct('topic',skill).includes(old))$('topic').value=old;
  const listening=skill==='listening';
  $('language').disabled=listening;
  if(listening)$('language').value='en';
  refresh();
 }
 function formatSummary(){
  const box=$('stats');box.replaceChildren();
  const facts=[
   ['138','variant má záznam v matici'],['120','Reading (5 × 4 × 6)'],
   ['18','Listening (3 × 6)'],['2','autorské návrhy EN/B1 a B2'],
   ['118','mechanické návrhy Reading'],['18','neověřené výběry Listening'],
   ['0','pedagogicky schválených testů']
  ];
  for(const [count,description]of facts){
   const div=document.createElement('div');div.className='r34-stat';
   const strong=document.createElement('strong');strong.textContent=count;
   const small=document.createElement('span');small.textContent=description;
   div.append(strong,small);box.appendChild(div);
  }
 }
 function refresh(){
  if(!state.rows.length)return;
  const skill=$('skill').value,topic=$('topic').value,
   lang=skill==='listening'?'en':$('language').value,level=$('level').value;
  const raw=$('timer').value,n=Number(raw);
  const row=state.rows.find(r=>r.skill===skill&&r.topic===topic&&
   r.language===lang&&r.level===level);
  const valid=!!row&&/^[1-9][0-9]{0,2}$/.test(raw)&&Number.isInteger(n)&&
   n>=5&&n<=120&&levels.includes(level);
  state.url='';
  const link=$('previewLink');
  if(valid){
   const u=new URL(row.draftPreviewPath,document.baseURI);
   u.searchParams.set('topic',topic);
   u.searchParams.set('lang',lang);
   u.searchParams.set('level',level);
   u.searchParams.set('timer',String(n));
   // Different teacher preview sessions should not collide.
   u.searchParams.set('attempt','r34editor'+Date.now().toString(36));
   state.url=u.href;
  }
  link.href=state.url||'#';link.setAttribute('aria-disabled',String(!valid));
  $('copyLink').disabled=!valid;
  $('variantStatus').textContent=row?
   (labels[row.contentStage]||row.contentStage)+
   ' · '+names[lang]+' · '+level+
   ' · schváleno: NE · '+row.questionCount+' úloh · nelze použít pro školní známku':
   'Požadovaná varianta neexistuje.';
  $('copyStatus').textContent=valid?
   'Odkaz je určen pouze k internímu technickému ověření pracovní varianty.':
   'Pro náhled zvol platný čas 5–120 minut a dostupnou variantu.';
 }
 async function init(){
  $('skill').addEventListener('change',resetTopics);
  for(const id of ['topic','language','level','timer'])$(''+id).addEventListener('change',refresh);
  $('timer').addEventListener('input',refresh);
  $('setup').addEventListener('submit',e=>e.preventDefault());
  $('previewLink').addEventListener('click',e=>{if(!state.url)e.preventDefault()});
  $('copyLink').addEventListener('click',async()=>{
   if(!state.url)return;
   try{await navigator.clipboard.writeText(state.url);$('copyStatus').textContent='QA odkaz zkopírován.';}
   catch(_){$('copyStatus').textContent='Kopírování není dostupné. Otevři náhled a zkopíruj jeho adresu.';}
  });
  try{
   const response=await fetch('assessment-matrix.json',{credentials:'omit',redirect:'error',cache:'no-store'});
   if(!response.ok)throw Error('Matrix HTTP '+response.status);
   const m=await response.json();
   if(m.kind!=='LSH_ASSESSMENT_MATRIX_DRAFT_R34_V1'||
    m.entries?.length!==138||m.totals?.reading!==120||
    m.totals?.listening!==18||m.totals?.pedagogicallyApproved!==0||
    m.entries.some(e=>e.studentPublic||e.pedagogicallyApproved))
    throw Error('Assessment coverage matrix does not match the draft publication policy');
   state.rows=m.entries;
   formatSummary();resetTopics();
  }catch(e){
   $('variantStatus').textContent='Náhled nelze spustit: '+String(e.message||e);
   $('previewLink').setAttribute('aria-disabled','true');
  }
 }
 init();
})();
