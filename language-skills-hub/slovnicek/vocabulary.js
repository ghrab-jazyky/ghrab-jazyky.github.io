/* Language Skills Hub R40 unified My Vocabulary — strictly client-side.
 * No server writes, login, analytics, test grades or student identity. */
(function(root){
 'use strict';
 if(!root.document)return;
 const MODEL=root.LSH_MODEL,STORE=root.LSH_STORE,MIG=root.LSH_VOCAB_MIGRATION,
  ENGINE=root.LSH_VOCAB_PRACTICE;
 const doc=root.document,$=id=>doc.getElementById(id);
 const LABS={en:'Angličtina',es:'Španělština',de:'Němčina',fr:'Francouzština'};
 const state={words:[],selected:new Set(),initialized:false,mode:null,flash:[],flashIndex:0,
  flashRevealed:false,repeat:new Set(),matchPool:[],matchCursor:0,matchRound:[],matchOrder:[],
  matchSolved:new Set(),matchTerm:null,matchMeaning:null,matchWrong:0,
  examDeck:[],examAnswers:[],examIndex:0,editId:null};
 const store=STORE&&STORE.createStore({mode:'production'});
 let storageApi=null;
 try{storageApi=root.localStorage}catch(_){}
 let idb=null;
 try{idb=root.indexedDB}catch(_){}
 const make=(tag,cls,text)=>{
  const el=doc.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;
 };
 const button=(text,cls,fn)=>{
  const b=make('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;
 };
 const fmtDate=d=>{try{return new Date(d).toLocaleDateString('cs-CZ')}catch(_){return ''}};
 const showStatus=s=>{$('globalStatus').textContent=s};
 function ready(){
  if(!MODEL||!STORE||!MIG||!ENGINE||!store)
   throw Error('Chybí některý modul společného slovníčku.');
 }
 function fromCard(){
  const raw=new URLSearchParams(root.location.search).get('zpet');
  if(!raw)return;
  try{
   const u=new URL(raw,root.location.origin);
   if(u.origin===root.location.origin&&
     u.pathname.startsWith('/language-skills-hub/')&&
     !u.pathname.includes('/slovnicek/')){
    $('backLink').href=u.href;
    $('backLink').textContent='← Zpět do aktivity';
   }
  }catch(_){}
 }
 function refreshCounts(){
  const now=Date.now(),selectedWords=state.words.filter(w=>state.selected.has(w.id));
  $('wordCount').textContent=String(state.words.length);
  $('selectedCount').textContent=String(selectedWords.length);
  $('dueCount').textContent=String(state.words.filter(w=>Date.parse(w.dueAt)<=now).length);
  $('readyCount').textContent=String(state.words.filter(w=>!!w.translationCs.trim()).length);
 }
 function filtered(){
  const phrase=ENGINE.fold($('filterSearch').value),lang=$('filterLanguage').value,
   scope=$('filterScope').value,now=Date.now();
  return state.words.filter(w=>
   (lang==='all'||w.language===lang)&&
   (scope==='all'||scope==='due'&&Date.parse(w.dueAt)<=now||
    scope==='favorite'&&w.favorite||
    scope==='missing'&&!w.translationCs.trim())&&
   (!phrase||ENGINE.fold(w.term+' '+w.translationCs+' '+w.explanation+' '+w.note).includes(phrase))
  ).sort((a,b)=>a.language.localeCompare(b.language)||a.term.localeCompare(b.term,'cs'));
 }
 function clearMode(){
  state.mode=null;
  $('practiceArea').replaceChildren();
  $('practiceArea').hidden=true;
 }
 async function refresh(){
  state.words=await store.listWords();
  const ids=new Set(state.words.map(w=>w.id));
  if(!state.initialized){
   state.selected=new Set(ids);state.initialized=true;
  }else state.selected=new Set([...state.selected].filter(id=>ids.has(id)));
  refreshCounts();renderWords();
 }
 function renderWords(){
  const list=$('wordList'),arr=filtered();
  list.replaceChildren();
  $('listInfo').textContent=arr.length+' z '+state.words.length+
   ' slovíček · '+state.selected.size+' vybráno k procvičování'+
   (arr.length>160?' · zobrazuji prvních 160, použij hledání nebo filtr':'');
  if(!arr.length){
   list.append(make('p','empty',state.words.length?
    'Tomuto filtru neodpovídá žádné slovíčko.':
    'Slovníček je zatím prázdný. V některé kartě ulož výraz nebo jej přidej ručně.'));return;
  }
  for(const w of arr.slice(0,160)){
   const row=make('article','word-entry');row.dataset.selected=String(state.selected.has(w.id));
   const checkbox=make('input');checkbox.type='checkbox';checkbox.checked=state.selected.has(w.id);
   checkbox.setAttribute('aria-label','Vybrat '+w.term+' ('+LABS[w.language]+')');
   checkbox.addEventListener('change',()=>{
    if(checkbox.checked)state.selected.add(w.id);else state.selected.delete(w.id);
    row.dataset.selected=String(checkbox.checked);refreshCounts();renderWordsInfo();
   });
   const body=make('div');
   body.append(make('div','word-title',w.term),
    make('div','word-translation',w.translationCs||'Doplň český význam před zkoušením'));
   const srcs=(w.sources||[]).map(s=>s.skill).filter((v,i,a)=>a.indexOf(v)===i).join(' + ');
   body.append(make('div','word-extra',
    LABS[w.language]+(w.level?' · '+w.level:'')+
    (srcs?' · '+srcs:'')+(w.context?' · '+w.context.slice(0,140):'')+
    ' · opakování: box '+w.box+'/5 · '+fmtDate(w.dueAt)));
   const actions=make('div','word-actions');
   const fav=button(w.favorite?'★':'☆','secondary favorite',async()=>{
    try{await store.patchWord(w.id,{favorite:!w.favorite});showStatus('Oblíbená slovíčka aktualizována.')}
    catch(e){showStatus('Změna se nezdařila: '+e.message)}
   });
   fav.setAttribute('aria-pressed',String(w.favorite));
   fav.setAttribute('aria-label',(w.favorite?'Odebrat z oblíbených: ':'Přidat k oblíbeným: ')+w.term);
   actions.append(fav,button('Upravit','secondary',()=>edit(w)),
    button('Smazat','warning',async()=>{
     if(!root.confirm('Smazat slovíčko „'+w.term+'“?'))return;
     try{await store.deleteWord(w.id);state.selected.delete(w.id);clearMode();showStatus('Slovíčko bylo odstraněno.')}
     catch(e){showStatus('Mazání selhalo: '+e.message)}
    }));
   row.append(checkbox,body,actions);list.append(row);
  }
 }
 function renderWordsInfo(){
  const count=filtered().length;
  $('listInfo').textContent=count+' z '+state.words.length+
   ' slovíček · '+state.selected.size+' vybráno k procvičování'+
   (count>160?' · zobrazuji prvních 160, použij hledání nebo filtr':'');
 }
 function edit(word){
  state.editId=word.id;
  $('editTermLabel').textContent=word.term+' · '+LABS[word.language];
  $('editMeaning').value=word.translationCs;
  $('editContext').value=word.context;
  $('editNote').value=word.note;
  const dialog=$('editDialog');
  if(typeof dialog.showModal==='function')dialog.showModal();
  else{dialog.setAttribute('open','');}
  $('editMeaning').focus();
 }
 function closeEdit(){
  const dialog=$('editDialog');
  if(typeof dialog.close==='function'&&dialog.open)dialog.close();
  else dialog.removeAttribute('open');
  state.editId=null;
 }
 function choice(){
  return state.words.filter(w=>state.selected.has(w.id));
 }
 function testable(){
  return choice().filter(w=>w.translationCs&&ENGINE.fold(w.translationCs));
 }
 function view(title,subtitle){
  const area=$('practiceArea');area.replaceChildren();area.hidden=false;
  const head=make('div','practice-top'),text=make('div');
  text.append(make('h3',null,title),make('p',null,subtitle));
  head.append(text,button('Ukončit','secondary',clearMode));
  area.append(head);
  return area;
 }
 function noSelection(needsMeaning){
  const picked=choice(),ok=needsMeaning?testable():picked.filter(w=>w.translationCs||w.explanation);
  if(!picked.length){showStatus('Vyber alespoň jedno slovíčko zaškrtnutím v seznamu.');return true}
  if(!ok.length){showStatus('Vybraná slovíčka zatím nemají český význam. Doplň jej tlačítkem „Upravit“.');return true}
  return false;
 }
 function startFlash(){
  if(noSelection(false))return;
  state.mode='flash';state.flash=ENGINE.shuffle(choice().filter(w=>w.translationCs||w.explanation));
  state.flashIndex=0;state.repeat.clear();state.flashRevealed=false;
  renderFlash();
 }
 function renderFlash(){
  const w=state.flash[state.flashIndex];
  const area=view('Kartičky','Zkus si vybavit význam. Nejdřív odhal překlad, potom označ, zda slovo umíš.');
  if(!w){area.append(make('p','empty','Procvičování dokončeno.'));return}
  const card=make('div','practice-card');
  card.append(make('strong','practice-term',w.term),
   make('div','practice-language',LABS[w.language]+' · '+(state.flashIndex+1)+' / '+state.flash.length));
  if(state.flashRevealed)card.append(make('div','practice-solution',w.translationCs||
   'Vysvětlení: '+w.explanation));
  const buttons=make('div','practice-controls');
  if(!state.flashRevealed)buttons.append(button('Ukázat význam',null,()=>{
   state.flashRevealed=true;renderFlash();
  }));
  else {
   const next=async rating=>{
    if(rating==='neumim'&&!state.repeat.has(w.id)){
     state.repeat.add(w.id);state.flash.push(w);
    }
    try{await store.rateWord(w.id,rating)}
    catch(e){showStatus('Nepodařilo se uložit opakování: '+e.message)}
    state.flashIndex++;state.flashRevealed=false;renderFlash();
   };
   buttons.append(
    button('Znovu procvičit','negative',()=>next('neumim')),
    button('Umím','positive',()=>next('umim')));
  }
  area.append(card,buttons);
 }
 function startMatch(){
  if(noSelection(true))return;
  const pool=ENGINE.matchingDeck(testable(),testable().length);
  if(pool.length<2){
   showStatus('Pro hru Propoj dvojice vyber alespoň dvě slovíčka s různým českým významem.');return;
  }
  state.mode='match';state.matchPool=pool;state.matchCursor=0;state.matchWrong=0;
  nextMatchRound();
 }
 function nextMatchRound(){
  const chosen=ENGINE.matchingDeck(state.matchPool.slice(state.matchCursor),4);
  state.matchCursor+=chosen.length;
  if(chosen.length<2){
   // A single leftover card cannot form a meaningful matching pair.
   state.matchCursor=state.matchPool.length;
   view('Propoj dvojice','Hotovo.');
   $('practiceArea').append(make('p','empty','Procvičování dvojic dokončeno. Chybné pokusy: '+state.matchWrong+'.'));
   return;
  }
  state.matchRound=chosen;state.matchOrder=ENGINE.shuffle(chosen);state.matchSolved=new Set();
  state.matchTerm=null;state.matchMeaning=null;
  renderMatch();
 }
 function renderMatch(){
  const a=view('Propoj dvojice','Vyber výraz vlevo a jeho správný český význam vpravo.');
  a.append(make('p','small-note','Hotové dvojice: '+state.matchSolved.size+' / '+state.matchRound.length+
   ' · chybné pokusy: '+state.matchWrong));
  const grid=make('div','match-grid');
  const left=make('div','match-column'),right=make('div','match-column');
  function tile(w,type,label){
   const b=button(label,'match-pair',()=>{
    if(state.matchSolved.has(w.id))return;
    if(type==='term')state.matchTerm=w.id;else state.matchMeaning=w.id;
    if(state.matchTerm&&state.matchMeaning){
     if(state.matchTerm===state.matchMeaning)state.matchSolved.add(w.id);
     else state.matchWrong++;
     state.matchTerm=null;state.matchMeaning=null;
    }
    renderMatch();
   });
   const solved=state.matchSolved.has(w.id);b.disabled=solved;
   if(solved)b.classList.add('solved');
   if((type==='term'?state.matchTerm:state.matchMeaning)===w.id)
    b.setAttribute('aria-pressed','true');
   return b;
  }
  for(const w of state.matchRound)left.append(tile(w,'term',w.term+' · '+w.language.toUpperCase()));
  for(const w of state.matchOrder)right.append(tile(w,'meaning',w.translationCs));
  grid.append(left,right);a.append(grid);
  if(state.matchSolved.size===state.matchRound.length)
   a.append(make('p','exam-good','Všechny dvojice správně!'),
    button('Další sada','positive',nextMatchRound));
 }
 function startExam(){
  if(noSelection(true))return;
  state.mode='exam';state.examDeck=ENGINE.selectForTest(testable(),30);
  state.examAnswers=[];state.examIndex=0;renderExam();
 }
 function renderExam(){
  const w=state.examDeck[state.examIndex];
  if(!w){void finishExam();return}
  const a=view('Zkoušení','Žádné nápovědy ani okamžité opravy. Výsledky uvidíš až po dokončení.');
  a.append(make('p','small-note',(state.examIndex+1)+' / '+state.examDeck.length+
   (testable().length>30?' · z náhodně vybraných 30 slovíček':'') ));
  const card=make('div','practice-card');
  card.append(make('strong','practice-term',w.term),make('div','practice-language',LABS[w.language]));
  a.append(card);
  const form=make('form','question-wrap');
  const label=make('label',null,'Napiš český význam');
  const input=make('input');input.type='text';input.autocomplete='off';input.maxLength=700;
  label.append(input);
  const btn=make('button',null,state.examIndex===state.examDeck.length-1?'Odevzdat test':'Další otázka');
  btn.type='submit';
  form.append(label,btn);
  form.addEventListener('submit',ev=>{
   ev.preventDefault();state.examAnswers.push(input.value);
   state.examIndex++;renderExam();
  });
  a.append(form);input.focus({preventScroll:true});
 }
 async function finishExam(){
  const result=ENGINE.grade(state.examDeck,state.examAnswers);
  const a=view('Výsledek zkoušení','Místní, neoficiální výsledek. Učitel ho nemůže považovat za zabezpečený test.');
  const pct=result.total?Math.round(result.correct*100/result.total):0;
  a.append(make('h3','exam-score',result.correct+' / '+result.total+' správně ('+pct+' %)'));
  const summary=make('section','exam-results');
  for(const row of result.rows){
   const entry=make('article','result-row'+(row.correct?'':' wrong'));
   entry.append(make('strong',null,row.term+' · '+row.language.toUpperCase()),
    make('p',row.correct?'exam-good':'exam-bad',row.correct?'✓ Správně':'✗ Nesprávně'));
   entry.append(make('p',null,'Tvoje odpověď: '+(row.answer||'—')));
   if(!row.correct)entry.append(make('p',null,'Uznaný význam: '+row.correctAnswer));
   summary.append(entry);
  }
  a.append(summary,button('Nové zkoušení','secondary',startExam));
  let failed=0;
  // Feedback updates a local learning schedule; it never creates an official grade.
  for(const row of result.rows){
   try{await store.rateWord(row.id,row.correct?'umim':'neumim')}catch(_){failed++}
  }
  showStatus(failed?'Výsledek zobrazen, ale část opakování se neuložila.':
   'Zkoušení dokončeno. Skóre se nikam neposílá.');
 }
 function saveBlob(payload,name){
  const blob=new Blob([payload],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=make('a');
  a.href=url;a.download=name;a.hidden=true;
  doc.body.append(a);
  try{a.click()}finally{a.remove();root.setTimeout(()=>URL.revokeObjectURL(url),3000)}
 }
 async function exportBackup(){
  try{
   const backup=await store.exportWords();
   const date=new Date().toISOString().slice(0,10);
   saveBlob(backup,'LSH_My_Vocabulary_'+date+'.json');
   showStatus('Záloha stažena. Soubor bezpečně ulož a na jiném zařízení použij Obnovit ze zálohy.');
  }catch(e){showStatus('Zálohování selhalo: '+e.message)}
 }
 let importMode='merge';
 async function importBackupFile(){
  const input=$('backupFile'),file=input.files&&input.files[0];
  if(!file)return;
  input.value='';
  try{
   if(file.size>MODEL.MAX_IMPORT_BYTES)throw Error('Soubor je příliš velký (max. 3 MB).');
   const raw=await file.text();
   let canonical=raw,parsed;
   try{parsed=JSON.parse(raw)}catch(_){throw Error('Neplatný formát JSON.')}
   if(parsed?.kind==='reading-lab-vocabulary-backup')
    canonical=MIG.convertReadingBackup(raw);
   MODEL.validateImport(canonical);
   const count=JSON.parse(canonical).words.length;
   if(importMode==='replace'&&!root.confirm(
    'Nahradit celý lokální slovníček '+count+' položkami ze zálohy?\n'+
    'Všechna současná slovíčka a výsledky opakování budou odstraněny. '+
    'Doporučujeme předtím stáhnout aktuální zálohu.'))return;
   const result=await store.importWords(canonical,{replace:importMode==='replace'});
   if(!result.storedInIndexedDB)throw Error('Prohlížeč neumožňuje trvalé ukládání. Import je pouze dočasný!');
   state.selected=new Set((await store.listWords()).map(w=>w.id));
   clearMode();await refresh();
   showStatus('Obnoveno '+result.imported+' položek ze zálohy. Celkem '+result.count+' slovíček.');
  }catch(e){showStatus('Obnova se nezdařila: '+e.message)}
 }
 function initHandlers(){
  for(const id of ['filterSearch','filterLanguage','filterScope'])
   $(id).addEventListener(id==='filterSearch'?'input':'change',renderWords);
  $('selectAll').addEventListener('click',()=>{
   for(const w of filtered())state.selected.add(w.id);
   refreshCounts();renderWords();
  });
  $('selectNone').addEventListener('click',()=>{
   state.selected.clear();refreshCounts();renderWords();
  });
  $('addForm').addEventListener('submit',async ev=>{
   ev.preventDefault();
   const term=$('addTerm').value.trim(),translationCs=$('addMeaning').value.trim();
   if(!term||!translationCs)return;
   $('addSave').disabled=true;
   try{
    const result=await store.addManualWord({
     language:$('addLanguage').value,term,translationCs,level:$('addLevel').value||null
    },undefined,root.crypto);
    if(!result.storedInIndexedDB)showStatus('Pozor: přidané slovo je jen dočasné. Stáhni zálohu.');
    else showStatus('Slovíčko bylo uloženo.');
    state.selected.add(result.record.id);
    $('addForm').reset();$('addLanguage').value='en';
    clearMode();await refresh();
   }catch(e){showStatus('Uložení selhalo: '+e.message)}
   finally{$('addSave').disabled=false}
  });
  $('editForm').addEventListener('submit',async ev=>{
   ev.preventDefault();if(!state.editId)return;
   try{
    await store.patchWord(state.editId,{
     translationCs:$('editMeaning').value.trim(),
     context:$('editContext').value.trim(),note:$('editNote').value.trim()
    });
    closeEdit();clearMode();showStatus('Význam a poznámka byly uloženy.');
   }catch(e){showStatus('Úprava selhala: '+e.message)}
  });
  $('cancelEdit').addEventListener('click',closeEdit);
  $('startFlash').addEventListener('click',startFlash);
  $('startMatch').addEventListener('click',startMatch);
  $('startExam').addEventListener('click',startExam);
  $('exportBackup').addEventListener('click',exportBackup);
  $('importBackup').addEventListener('click',()=>{
   importMode='merge';$('backupFile').value='';$('backupFile').click();
  });
  $('replaceBackup').addEventListener('click',()=>{
   importMode='replace';$('backupFile').value='';$('backupFile').click();
  });
  $('backupFile').addEventListener('change',importBackupFile);
 }
 async function init(){
  try{
   ready();fromCard();initHandlers();
   await store.open();
   const temporary=store.status().mode!=='ready';
   if(temporary){
    $('storageNotice').classList.add('error');
    $('storageNotice').textContent='UPOZORNĚNÍ: IndexedDB není dostupná. '+
     'Slovíčka se ukládají jen dočasně a po zavření stránky se mohou ztratit. '+
     'Použij běžné okno prohlížeče a stáhni zálohu.';
   }else{
    const imported=await MIG.migrate({
     store,createStore:STORE.createStore,indexedDB:idb,localStorage:storageApi
    });
    $('storageNotice').classList.add('ready');
    $('storageNotice').textContent='Místní slovníček je připravený. '+
     'Převedeno '+imported.reading+' slovíček z Reading Labu a '+
     imported.conversation+' z původních konverzačních karet.'+
     (imported.skipped?' Některé poškozené záznamy se nepodařilo převést.':'')+
     (!imported.markerSaved?' Pozor: prohlížeč nezapsal evidenci migrace.':'');
   }
   await refresh();
   store.subscribe(()=>refresh().catch(e=>showStatus('Aktualizace slovníčku selhala: '+e.message)));
   root.addEventListener('pageshow',ev=>{if(ev.persisted)void refresh()});
  }catch(e){
   $('storageNotice').classList.add('error');
   $('storageNotice').textContent='Slovníček se nepodařilo spustit: '+e.message;
  }
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})(typeof window!=='undefined'?window:globalThis);
