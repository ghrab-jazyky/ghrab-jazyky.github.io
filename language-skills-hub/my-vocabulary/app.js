/* Student-owned vocabulary games and tests. Offline only; never uploads scores. */
(function(window,document){
'use strict';
const db=window.LSHVocabStore,$=id=>document.getElementById(id);
if(!db)throw Error('Slovníček nelze načíst.');
const q=new URLSearchParams(location.search),topic=q.get('topic')||'',lang=q.get('lang')||'';
let words=[],chosen=new Set(),initialized=false,view='words',deck=[],pos=0,mode='flash',revealed=false,feedback='',matched=new Set(),selectedLeft=null,pairs=[],pairsOrder=[],choiceOptions=[],exam=null,importMode='merge';
const langs={en:'EN',es:'ES',de:'DE',fr:'FR'};
const node=(tag,value,cls)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=String(value);return x};
const button=(value,fn,cls)=>{const x=node('button',value,cls);x.type='button';x.addEventListener('click',fn);return x};
const notify=(message,error=false)=>{$('status').textContent=message;$('status').style.color=error?'var(--bad)':''};
function shuffle(items){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const selectedWords=()=>words.filter(w=>chosen.has(w.id));
const wordName=w=>w.term+' ('+langs[w.language]+')';
function visible(){
 const query=$('search').value.trim().toLowerCase(),language=$('filterLang').value,scope=$('filterTopic').value;
 return words.filter(w=>(!language||w.language===language)&&
  (scope!=='current'||(w.topicIds||[]).includes(topic))&&
  (!query||(w.term+' '+w.meaningCs).toLowerCase().includes(query)))
  .sort((a,b)=>a.language.localeCompare(b.language)||a.term.localeCompare(b.term));
}
function count(){
 $('count').textContent=words.length+' slovíček';
 $('selectionCount').textContent='Vybráno: '+selectedWords().length+' / '+words.length;
}
function renderList(){
 const list=$('wordList');list.replaceChildren();
 const shown=visible();
 if(!shown.length)list.append(node('li','Žádná slovíčka neodpovídají filtru.'));
 for(const w of shown){
  const li=node('li'),label=node('label'),check=node('input'),info=node('span',undefined,'word-info'),actions=node('div',undefined,'word-actions');
  check.type='checkbox';check.checked=chosen.has(w.id);check.setAttribute('aria-label','Vybrat '+wordName(w));
  check.addEventListener('change',()=>{if(check.checked)chosen.add(w.id);else chosen.delete(w.id);count()});
  info.append(node('strong',w.term),node('span',w.meaningCs));
  info.append(node('small',langs[w.language]+(w.level?' · '+w.level:'')+(w.context?' · '+w.context:'')));
  label.append(check,info);
  actions.append(button('Upravit',async()=>{
   const term=window.prompt('Výraz',w.term);if(term===null)return;
   const meaningCs=window.prompt('Český význam',w.meaningCs);if(meaningCs===null)return;
   if(!term.trim()||!meaningCs.trim()){notify('Výraz i význam jsou povinné.',true);return}
   try{const id=await db.update(w.id,{...w,term,meaningCs});chosen.delete(w.id);chosen.add(id);await reload();notify('Slovíčko upraveno.')}
   catch(e){notify(e.message,true)}
  }),button('Smazat',async()=>{
   if(!window.confirm('Smazat slovíčko '+w.term+'?'))return;
   try{await db.remove(w.id);chosen.delete(w.id);await reload();notify('Slovíčko smazáno.')}
   catch(e){notify(e.message,true)}
  }));
  li.append(label,actions);list.append(li);
 }
 count();
}
async function reload(reset=false){
 words=await db.all();
 if(!initialized||reset){chosen=new Set(words.map(x=>x.id));initialized=true}
 else{const found=new Set(words.map(x=>x.id));chosen=new Set([...chosen].filter(id=>found.has(id)))}
 renderList();
}
function switchView(next){
 view=next;
 for(const b of document.querySelectorAll('[data-view]')){
  const active=b.dataset.view===next;b.setAttribute('aria-pressed',String(active));
  $(b.dataset.view+'View').hidden=!active;
 }
 if(next==='training'&&!deck.length)startTraining('flash');
}
function prepare(min=1){
 const items=selectedWords();
 if(items.length<min){notify('Vyber alespoň '+min+' slovíčka v seznamu.',true);switchView('words');return null}
 return shuffle(items);
}
function renderTraining(){
 const board=$('trainingBoard');board.replaceChildren();
 if(!deck.length){board.append(node('p','Nejprve vyber slovíčka.'));return}
 if(mode==='flash'){
  const w=deck[pos];
  board.append(node('h3',(pos+1)+' / '+deck.length+' · Kartička'),node('p',wordName(w),'flash-word'));
  if(revealed)board.append(node('p',w.meaningCs,'feedback good'));
  board.append(button(revealed?'Skrýt odpověď':'Odhalit význam',()=>{revealed=!revealed;renderTraining()}));
  board.append(button('Další kartička',()=>{pos=(pos+1)%deck.length;revealed=false;renderTraining()},'primary'));return;
 }
 if(mode==='choice'){
  const w=deck[pos];
  if(!choiceOptions.length){
   const candidates=[w];
   for(const d of shuffle(deck)){
    if(candidates.length>=4)break;
    if(candidates.some(x=>db.normalizeAnswer(x.meaningCs)===db.normalizeAnswer(d.meaningCs)))continue;
    candidates.push(d);
   }
   choiceOptions=shuffle(candidates);
  }
  board.append(node('h3',(pos+1)+' / '+deck.length+' · Vyber význam'),node('p',wordName(w),'flash-word'));
  const grid=node('div',undefined,'answers');
  for(const opt of choiceOptions){
   const b=button(opt.meaningCs,()=>{feedback=opt.id===w.id?'Správně!':'Zatím ne. Správně: '+w.meaningCs;renderTraining()});
   b.disabled=!!feedback;grid.append(b);
  }
  board.append(grid);
  if(feedback){
   board.append(node('p',feedback,'feedback '+(feedback==='Správně!'?'good':'bad')));
   board.append(button('Další otázka',()=>{pos=(pos+1)%deck.length;feedback='';choiceOptions=[];renderTraining()},'primary'));
  }
  return;
 }
 if(!pairs.length){
  const usedTerms=new Set(),usedMeanings=new Set();
  for(const w of shuffle(deck)){
   const term=db.normalizeAnswer(w.term),meaning=db.normalizeAnswer(w.meaningCs);
   if(usedTerms.has(term)||usedMeanings.has(meaning))continue;
   usedTerms.add(term);usedMeanings.add(meaning);pairs.push(w);
   if(pairs.length===4)break;
  }
  pairsOrder=shuffle(pairs);
 }
 board.append(node('h3','Spoj dvojice'),node('p','Vyber výraz vlevo a jeho význam vpravo.'));
 const outer=node('div',undefined,'pairs'),left=node('div',undefined,'column'),right=node('div',undefined,'column');
 for(const w of pairs){
  const b=button(wordName(w),()=>{selectedLeft=w.id;feedback='';renderTraining()});
  if(matched.has(w.id)){b.disabled=true;b.classList.add('matched')}
  if(selectedLeft===w.id)b.classList.add('selected');
  left.append(b);
 }
 for(const w of pairsOrder){
  const b=button(w.meaningCs,()=>{
   if(selectedLeft===null)feedback='Nejprve vyber výraz vlevo.';
   else if(selectedLeft===w.id){matched.add(w.id);selectedLeft=null;feedback='Správná dvojice!'}
   else{selectedLeft=null;feedback='Zkus to znovu.'}
   renderTraining();
  });
  if(matched.has(w.id)){b.disabled=true;b.classList.add('matched')}
  right.append(b);
 }
 outer.append(left,right);board.append(outer);
 if(feedback)board.append(node('p',feedback,'feedback '+(feedback==='Správná dvojice!'?'good':'bad')));
 if(matched.size===pairs.length){
  board.append(node('p','Všechny dvojice správně.','feedback good'));
  board.append(button('Nové dvojice',()=>{pairs=[];pairsOrder=[];matched=new Set();selectedLeft=null;feedback='';renderTraining()},'primary'));
 }
}
function startTraining(next){
 const list=prepare(next==='flash'?1:2);if(!list)return;
 deck=list;mode=next;pos=0;revealed=false;feedback='';matched=new Set();selectedLeft=null;pairs=[];pairsOrder=[];choiceOptions=[];
 renderTraining();
}
function question(){
 const w=exam.questions[exam.pos];
 $('examPrompt').textContent=exam.direction==='meaning'?wordName(w):w.meaningCs+' ('+langs[w.language]+')';
 $('examProgress').textContent='Otázka '+(exam.pos+1)+' / '+exam.questions.length;
 $('examAnswer').value='';$('examAnswer').focus();
}
function startExam(){
 const list=prepare();if(!list)return;
 const n=$('examCount').value==='all'?list.length:Math.min(Number($('examCount').value),list.length);
 exam={questions:list.slice(0,n),direction:$('examDirection').value,pos:0,answers:[]};
 $('examResults').replaceChildren();$('examSetup').hidden=true;$('examQuestion').hidden=false;question();
}
function finishExam(){
 const area=$('examResults');area.replaceChildren();
 const correct=exam.answers.filter(x=>x.ok).length;
 area.append(node('h3','Výsledek: '+correct+' / '+exam.answers.length+' správně'));
 area.append(node('p','Hodnocení ignoruje velikost písmen, diakritiku a běžnou interpunkci. Význam však musí odpovídat uloženému klíči.'));
 for(const [i,a]of exam.answers.entries()){
  const box=node('div',undefined,'result '+(a.ok?'good':'bad'));
  box.append(node('strong',(i+1)+'. '+a.question+' — '+(a.ok?'✓ Správně':'✗ Chyba')));
  box.append(node('span','Tvoje odpověď: '+(a.typed||'[prázdné]')));
  if(!a.ok)box.append(node('span','Správně: '+a.expected));
  area.append(box);
 }
 area.append(button('Nové zkoušení',()=>{$('examResults').replaceChildren();startExam()},'primary'));
 $('examQuestion').hidden=true;$('examSetup').hidden=false;exam=null;
}
async function exportBackup(){
 try{
  const file=new Blob([await db.exportJSON()],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(file),a=node('a');
  a.href=url;a.download='LSH_My_vocabulary_'+new Date().toISOString().slice(0,10)+'.json';
  a.hidden=true;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  notify('Záloha stažena. Uchovej ji pro přenos na další zařízení.');
 }catch(e){notify('Export se nezdařil: '+e.message,true)}
}
async function importFile(file){
 if(!file)return;
 try{
  if(file.size>3*1024*1024)throw Error('Soubor je větší než 3 MB.');
  const n=await db.importJSON(await file.text(),importMode);
  await reload(true);notify('Importováno '+n+' slovíček. Režim: '+(importMode==='merge'?'sloučení':'nahrazení')+'.');
 }catch(e){notify('Import se nezdařil: '+e.message,true)}
}
function init(){
 if(['en','es','de','fr'].includes(lang))$('newLang').value=lang;
 if(!topic)$('filterTopic').querySelector('[value="current"]').disabled=true;
 for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>switchView(b.dataset.view));
 for(const id of ['search','filterLang','filterTopic'])$(id).addEventListener('input',renderList);
 $('selectVisible').addEventListener('click',()=>{for(const w of visible())chosen.add(w.id);renderList()});
 $('clearSelection').addEventListener('click',()=>{chosen.clear();renderList()});
 $('addForm').addEventListener('submit',async e=>{
  e.preventDefault();
  try{
   const stamp=new Date().toISOString();
   const item=db.verify({term:$('newTerm').value,meaningCs:$('newMeaning').value,
    language:$('newLang').value,topicIds:topic?[topic]:[],createdAt:stamp,updatedAt:stamp});
   await db.save(item);chosen.add(item.id);await reload();
   $('newTerm').value='';$('newMeaning').value='';$('newTerm').focus();
   notify('Uloženo. Slovíčko je dostupné napříč LSH.');
  }catch(err){notify(err.message,true)}
 });
 for(const b of document.querySelectorAll('[data-training]'))b.addEventListener('click',()=>startTraining(b.dataset.training));
 $('examSetup').addEventListener('submit',e=>{e.preventDefault();startExam()});
 $('examQuestion').addEventListener('submit',e=>{
  e.preventDefault();if(!exam)return;
  const w=exam.questions[exam.pos],expected=exam.direction==='meaning'?w.meaningCs:w.term;
  const prompt=exam.direction==='meaning'?wordName(w):w.meaningCs+' ('+langs[w.language]+')';
  const typed=$('examAnswer').value;
  exam.answers.push({question:prompt,typed,expected,ok:db.correct(typed,expected)});
  exam.pos++;
  if(exam.pos>=exam.questions.length)finishExam();else question();
 });
 $('exportBackup').addEventListener('click',exportBackup);
 $('importMerge').addEventListener('click',()=>{importMode='merge';$('backupFile').value='';$('backupFile').click()});
 $('importReplace').addEventListener('click',()=>{
  if(!window.confirm('Opravdu nahradit CELÝ slovníček obsahem zálohy? Doporučujeme nejprve stáhnout současnou zálohu.'))return;
  importMode='replace';$('backupFile').value='';$('backupFile').click();
 });
 $('backupFile').addEventListener('change',()=>{void importFile($('backupFile').files?.[0])});
 window.addEventListener('readinglab:vocabulary-change',()=>{void reload().catch(()=>{})});
 try{const b=new BroadcastChannel('readinglab-vocabulary-updates');b.onmessage=()=>{void reload().catch(()=>{})}}catch(_){}
}
init();
reload().then(async()=>notify('Načteno '+words.length+' slovíček. Úložiště: '+await db.storageBackend()+'.'))
 .catch(e=>notify(e.message,true));
})(window,document);
