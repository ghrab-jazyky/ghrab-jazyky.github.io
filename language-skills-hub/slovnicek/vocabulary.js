/* Unified My Vocabulary UI. Only local IndexedDB; no server, no account, no network. */
(function(){
'use strict';
const model=window.LSH_MODEL,ST=window.LSH_STORE,gameRules=window.LSH_VOCAB_PRACTICE;
if(!model||!ST||!gameRules){document.getElementById('storageStatus').textContent='Nelze načíst moduly slovníčku.';return}
const store=ST.createStore({mode:'production'});
const $=id=>document.getElementById(id);
const element=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
const labels={en:'EN',es:'ES',de:'DE',fr:'FR'};
let words=[],chosen=new Set(),mode=null,session=null,revision=0;
const filtered=()=>words.filter(w=>($('languageFilter').value==='all'||w.language===$('languageFilter').value)&&
 (!$('favoritesOnly').checked||w.favorite)&&
 (w.term+' '+w.translationCs+' '+w.explanation).toLocaleLowerCase().includes($('search').value.toLocaleLowerCase().trim()));
const selection=()=>words.filter(w=>chosen.has(w.id));
const validSelection=()=>selection().filter(gameRules.scorable);
function notify(message,type=''){
 $('storageStatus').textContent=message;$('storageStatus').className='notice'+(type?' '+type:'');
}
function status(){
 const s=store.status();
 if(s.mode==='ready')notify('Slovíčka jsou uložena v IndexedDB tohoto prohlížeče. Nejde o trvalou zálohu; stáhni si JSON.');
 else notify('POZOR: Trvalé úložiště není dostupné. Slovíčka jsou pouze dočasná – nepřecházej pryč bez exportu zálohy!','warn');
}
function row(word){
 const wrap=element('div','word-row');
 const cb=element('input');cb.type='checkbox';cb.checked=chosen.has(word.id);
 cb.setAttribute('aria-label','Vybrat '+word.term);cb.addEventListener('change',()=>{
  if(cb.checked)chosen.add(word.id);else chosen.delete(word.id);
  updateCount();
 });wrap.appendChild(cb);
 const term=element('div','word',word.term);
 term.appendChild(element('small',labels[word.language]+(word.level?' · '+word.level:'')));
 const value=element('div','meaning',word.translationCs||word.explanation||'Doplň český překlad před zkoušením.');
 const actions=element('div','word-actions');
 const star=element('button','favorite',word.favorite?'★ Oblíbené':'☆ Oblíbené');
 star.type='button';star.setAttribute('aria-label',(word.favorite?'Odebrat z oblíbených: ':'Přidat mezi oblíbené: ')+word.term);
 star.addEventListener('click',()=>changeWord(word.id,'favorite',!word.favorite));
 const edit=element('button',null,'✎ Upravit');
 edit.type='button';edit.addEventListener('click',()=>{
  const value=window.prompt('Český význam slovíčka '+word.term+':',word.translationCs);
  if(value===null)return;
  if(!value.trim()){notify('Překlad nesmí být prázdný.','error');return}
  changeWord(word.id,'translationCs',value.trim());
 });
 const del=element('button','delete','Smazat');del.type='button';del.addEventListener('click',async()=>{
  if(!confirm('Opravdu smazat slovíčko '+word.term+'?'))return;
  try{await store.deleteWord(word.id);chosen.delete(word.id);await load();notify('Slovíčko smazáno.')}catch(e){notify('Smazání selhalo: '+e.message,'error')}
 });
 actions.append(star,edit,del);wrap.append(term,value,actions);return wrap;
}
async function changeWord(id,field,value){
 try{await store.patchWord(id,{[field]:value});await load()}catch(e){notify('Úprava se nezdařila: '+e.message,'error')}
}
function updateCount(){
 $('wordCount').textContent=words.length+' uložených · '+filtered().length+' zobrazených';
 $('selectedCount').textContent='Vybráno: '+selection().length+' (pro procvičování '+validSelection().length+')';
 $('exportBtn').disabled=words.length===0;
 $('deleteAllWords').disabled=words.length===0;
}
function renderWords(){
 const box=$('wordList');box.replaceChildren();
 const shown=filtered();
 if(!shown.length)box.appendChild(element('p','empty',words.length?'Zvolenému filtru neodpovídají žádná slovíčka.':'Zatím nemáš žádná slovíčka. Přidej první slovo nebo nahraj zálohu.'));
 for(const w of shown)box.appendChild(row(w));
 updateCount();
}
async function load(){
 const current=++revision;
 try{
  const list=await store.listWords();
  if(current!==revision)return;
  words=list.sort((a,b)=>a.language.localeCompare(b.language)||a.term.localeCompare(b.term,'cs'));
  chosen=new Set([...chosen].filter(x=>words.some(w=>w.id===x)));
  renderWords();
  status();
  window.LSH_BACKUP_UI?.refresh();
 }catch(e){notify('Nepodařilo se načíst slovíčka: '+e.message,'error')}
}
async function saveManual(event){
 event.preventDefault();
 const term=$('addTerm').value.trim(),translationCs=$('addTranslation').value.trim();
 if(!term||!translationCs)return;
 try{
  const existing=words.find(w=>w.language===$('addLanguage').value&&
    gameRules.compare(w.term)===gameRules.compare(term)&&
    gameRules.compare(w.translationCs)===gameRules.compare(translationCs));
  if(existing){notify('Stejné slovíčko už máš ve slovníčku.','warn');return}
  const response=await store.addManualWord({language:$('addLanguage').value,term,translationCs});
  $('addForm').reset();chosen.add(response.record.id);
  await load();
  if(!response.storedInIndexedDB)notify('Slovo uloženo pouze dočasně. Stáhni zálohu.','warn');
 }catch(e){notify('Nelze přidat slovíčko: '+e.message,'error')}
}
function download(){
 store.exportWords().then(json=>{
  const blob=new Blob([json],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=element('a');
  const date=new Date().toISOString().slice(0,10);
  a.href=url;a.download='LSH-My-Vocabulary-'+date+'.json';
  document.body.append(a);
  try{a.click()}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
  window.LSH_BACKUP_UI?.recordPrepared(json).catch(()=>{});
  notify('Záloha je připravená. Ulož ji mimo prohlížeč a poté potvrď její uložení.');
 }).catch(e=>notify('Záloha se nezdařila: '+e.message,'error'));
}
async function importFile(){
 const input=$('importFile'),file=input.files?.[0];
 if(!file)return;
 try{
  if(file.size>model.MAX_IMPORT_BYTES)throw new Error('Soubor přesahuje limit 3 MB.');
  const raw=await file.text();
  let kind=null;
  try{kind=JSON.parse(raw)?.kind}catch(_){}
  const oldReading=kind==='reading-lab-vocabulary-backup';
  const source=oldReading?window.LSH_READING_MIGRATION.convertBackup(raw):raw;
  const preview=model.validateImport(source);
  const replace=$('replaceImport').checked;
  if(replace&&!confirm('NAHRADIT celý slovníček '+words.length+' slovíček daty ze zálohy ('+preview.length+')? Nejdřív si stáhni současnou zálohu.'))return;
  if(!replace&&!confirm('Sloučit '+preview.length+' slovíček ze zálohy s aktuálním slovníčkem?'))return;
  const result=await store.importWords(source,{replace});
  chosen.clear();await load();
  notify((oldReading?'Starší záloha Reading Labu převedena. ':'')+
   'Import hotov: '+result.imported+' ze zálohy, nyní '+result.count+' uložených.'+
    (result.storedInIndexedDB?'':' POZOR: pouze dočasná paměť.'),result.storedInIndexedDB?'':'warn');
 }catch(e){notify('Import odmítnut – nic nebylo změněno: '+e.message,'error')}
 finally{input.value=''}
}
// R57: one explicit destructive action for the complete shared vocabulary bank.
const clearDialog=$('clearVocabularyDialog');
function openClearDialog(){
 if(!words.length||clearDialog.open)return;
 $('clearWordsCount').textContent=words.length+' uložených slovíček';
 $('clearWordsStatus').textContent='';
 clearDialog.showModal(); // Escape cancels via native dialog semantics.
}
async function deleteAllWords(){
 $('confirmClearWords').disabled=true;
 $('cancelClearWords').disabled=true;
 try{
  const current=await store.listWords();
  // New words could have been saved by another LSH tab in the meantime.
  if(current.length!==words.length){
   await load();
   $('clearWordsCount').textContent=words.length+' uložených slovíček';
   $('clearWordsStatus').textContent='Počet slovíček se změnil. Zkontroluj nový počet a znovu potvrď smazání.';
   return;
  }
  if(!current.length){
   clearDialog.close();await load();return;
  }
  const outcome=await store.clearAllWords();
  if((await store.listWords()).length!==0)throw new Error('Úložiště hlásí zbývající slovíčka.');
  chosen.clear();mode=null;
  document.querySelectorAll('[data-mode]').forEach(b=>b.classList.remove('active'));
  clearGame();
  $('practiceStatus').textContent='Slovníček je prázdný. Přidej slovíčka nebo obnov zálohu.';
  clearDialog.close();
  await load();
  notify('Smazáno všech '+current.length+' slovíček ze společného My Vocabulary.'+
   (outcome.storedInIndexedDB?'':' Pozor: úložiště je pouze dočasné.'),
   outcome.storedInIndexedDB?'':'warn');
 }catch(e){
  $('clearWordsStatus').textContent='Smazání se nezdařilo: '+String(e.message||e);
  notify('Mazání nebylo dokončeno. '+String(e.message||e),'error');
 }finally{
  $('confirmClearWords').disabled=false;
  $('cancelClearWords').disabled=false;
 }
}
function ready(){
 const items=validSelection();
 if(!items.length){$('practiceStatus').textContent='Vyber alespoň jedno slovíčko s českým překladem.';return []}
 // A single exercise run contains an immutable snapshot, so editing a bank during
 // play cannot corrupt the current question/answer ordering.
 return items.map(w=>({...w}));
}
function clearGame(){session=null;$('game').replaceChildren()}
function modeLabel(label){$('practiceStatus').textContent=label}
function button(text,click,css=''){
 const b=element('button',css,text);b.type='button';b.addEventListener('click',click);return b;
}
function startMode(next){
 mode=next;for(const b of document.querySelectorAll('[data-mode]'))
  b.classList.toggle('active',b.dataset.mode===next);
 clearGame();
 const items=ready();if(!items.length)return;
 if(next==='flash')startFlash(items);
 else if(next==='choice')startChoice(items);
 else if(next==='match')startMatch(items);
 else if(next==='test')startTest(items);
}
function startFlash(items){
 const shuffled=gameRules.shuffle(items);
 session={items:shuffled,index:0,shown:false};
 function draw(){
  const s=session;const w=s.items[s.index];const mount=$('game');mount.replaceChildren();
  modeLabel('Kartička '+(s.index+1)+' / '+s.items.length+'. Nejprve si zkus vybavit překlad.');
  mount.appendChild(element('div','flash-card',s.shown?gameRules.meanings(w).join(' / '):w.term));
  const controls=element('div','controls');
  if(!s.shown)controls.appendChild(button('Ukázat překlad',()=>{s.shown=true;draw()}));
  else{
   for(const [rating,label]of[['neumim','Ještě neumím'],['s-obtizemi','S obtížemi'],['umim','Umím']]){
    controls.appendChild(button(label,async()=>{
     try{await store.rateWord(w.id,rating)}catch(e){notify('Hodnocení slovíčka se neuložilo: '+e.message,'error')}
     if(s.index+1<s.items.length){s.index++;s.shown=false;draw()}
     else{mount.replaceChildren(element('h3',null,'Hotovo! Všechny kartičky prošly.'));modeLabel('Procvičování dokončeno.');await load()}
    }));
   }
  }
  mount.appendChild(controls);
 }
 draw();
}
function startChoice(items){
 const pool=gameRules.shuffle(items.filter(w=>items.some(o=>o.id!==w.id&&o.language===w.language&&gameRules.scorable(o)&&gameRules.compare(gameRules.meanings(o)[0])!==gameRules.compare(gameRules.meanings(w)[0]))));
 if(!pool.length){modeLabel('Pro hru vyber alespoň dvě slovíčka stejného jazyka s různými českými významy.');return}
 const s=session={items:pool,index:0,correct:0};
 function next(){
  const mount=$('game');mount.replaceChildren();
  if(s.index>=s.items.length){mount.appendChild(element('h3',null,'Hra dokončena: '+s.correct+' / '+s.items.length));modeLabel('Procvičování skončilo.');return}
  const w=s.items[s.index],choices=gameRules.selectChoices(w,items);
  modeLabel('Hra: '+(s.index+1)+' / '+s.items.length);
  mount.appendChild(element('h3',null,'Co znamená '+w.term+'?'));
  const box=element('div','options');
  for(const option of choices)box.appendChild(button(option.label,()=>{
   if(option.correct)s.correct++;
   box.querySelectorAll('button').forEach(b=>b.disabled=true);
   mount.appendChild(element('p',option.correct?'answer good':'answer bad',
    option.correct?'Správně!':'Nesprávně. Správný význam: '+gameRules.meanings(w)[0]));
   mount.appendChild(button('Další',()=>{s.index++;next()}));
  }));
  mount.appendChild(box);
 }
 next();
}
function startMatch(items){
 const languages=[...new Set(items.map(w=>w.language))];
 const groups=languages.map(lang=>items.filter(w=>w.language===lang));
 const suitable=groups.find(g=>new Set(g.map(w=>gameRules.compare(gameRules.meanings(w)[0]))).size>=2);
 if(!suitable){modeLabel('Pro spojování vyber alespoň dvě slovíčka stejného jazyka s různými významy.');return}
 const model=gameRules.buildMatch(suitable),s=session={model,left:null,right:null,matched:new Set(),attempts:0};
 const mount=$('game');mount.replaceChildren();
 modeLabel('Hra: spoj výraz s českým významem. Správné dvojice se označí.');
 const grid=element('div','match-grid'),column=(items,side)=>{
  const box=element('div');
  for(const entry of items){
   const b=button(entry.label,()=>select(side,entry.id));
   b.dataset.id=entry.id;b.dataset.side=side;box.appendChild(b);
  }
  return box;
 };
 grid.append(column(model.left,'left'),column(model.right,'right'));
 const feedback=element('p','', 'Vyber jednu kartu vlevo a jednu vpravo.');
 mount.append(grid,feedback);
 function repaint(){
  grid.querySelectorAll('button').forEach(b=>{
   const id=b.dataset.id,side=b.dataset.side;
   b.classList.toggle('selected',s[side]===id);
   b.classList.toggle('matched',s.matched.has(id));
   b.disabled=s.matched.has(id);
  });
 }
 function select(side,id){
  s[side]=id;repaint();
  if(!s.left||!s.right)return;
  s.attempts++;
  if(s.left===s.right){
   s.matched.add(id);
   feedback.textContent='Správná dvojice! '+s.matched.size+' / '+model.pairs.length;
   if(s.matched.size===model.pairs.length){
    feedback.textContent='Výborně! '+model.pairs.length+' dvojic, '+s.attempts+' pokusů.';
    mount.appendChild(button('Hrát znovu',()=>startMatch(items)));
   }
  }else feedback.textContent='To není správná dvojice. Zkus to znovu.';
  s.left=null;s.right=null;repaint();
 }
}
function startTest(items){
 const shuffled=gameRules.shuffle(items),s=session={items:shuffled,answers:new Map(),index:0,complete:false};
 function showQuestion(){
  const mount=$('game');mount.replaceChildren();
  modeLabel('ZKOUŠENÍ: '+(s.index+1)+' / '+s.items.length+'. Automatické vyhodnocení až po odevzdání.');
  const w=s.items[s.index];
  mount.appendChild(element('h3',null,'Napiš česky význam výrazu: '+w.term));
  const field=element('input');field.type='text';field.maxLength=700;
  field.autocomplete='off';field.spellcheck=false;field.setAttribute('aria-label','Český význam výrazu '+w.term);
  field.value=s.answers.get(w.id)||'';
  const next=button(s.index+1===s.items.length?'Odevzdat a vyhodnotit':'Další otázka',()=>{
   s.answers.set(w.id,field.value.trim());
   if(s.index+1===s.items.length)finish();else{s.index++;showQuestion()}
  });
  const prev=button('Předchozí',()=>{
   s.answers.set(w.id,field.value.trim());s.index=Math.max(0,s.index-1);showQuestion()
  });
  prev.disabled=s.index===0;
  const controls=element('div','controls');controls.append(prev,next);mount.append(field,controls);field.focus();
  field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();next.click()}});
 }
 function finish(){
  const results=s.items.map(w=>({word:w,answer:s.answers.get(w.id)||'',
   ...gameRules.gradeWritten(w,s.answers.get(w.id)||'')}));
  const count=gameRules.summarize(results);
  const mount=$('game');mount.replaceChildren();
  const title=element('h3',null,'Výsledek: '+count.correct+' / '+count.count+' ('+count.percent+' %)');mount.appendChild(title);
  mount.appendChild(element('p',null,'Toto je místní orientační výsledek, nikoli školní známka. Porovnává se pouze přesný význam bez ohledu na velikost písmen a diakritiku.'));
  for(const r of results){
   const part=element('div','result-row');
   part.appendChild(element('strong',r.correct?'✓ '+r.word.term:'✗ '+r.word.term));
   part.appendChild(element('div',r.correct?'good':'bad',
    'Tvoje odpověď: '+(r.answer||'—')));
   if(!r.correct)part.appendChild(element('div','answer','Uznávané řešení: '+gameRules.meanings(r.word).join(' / ')));
   mount.appendChild(part);
  }
  mount.appendChild(button('Opakovat zkoušení',()=>startTest(items)));
  modeLabel('Vyhodnoceno. Chybné odpovědi jsou vypsané níže.');
 }
 showQuestion();
}
async function migrateLegacyConversation(){
 // Do not resurrect deleted legacy words after the explicit clear-all action.
 if(await store.wasWordsCleared())return;
 // Older Conversation cards wrote to the staging IDB "lsh-test".
 // Copy, never delete, those learner words into the shared production bank.
 // A successful one-time migration is idempotently tracked per browser.
 try{
  if(localStorage.getItem('lsh-vocab-migrated-v1')==='1')return;
  const legacy=ST.createStore({mode:'staging'});
  await legacy.open();
  if(legacy.status().mode==='ready'){
   const words=await legacy.listWords();
   if(words.length){
    const backup=await legacy.exportWords();
    const migrated=await store.importWords(backup,{replace:false});
    if(!migrated.storedInIndexedDB)
     throw new Error('Trvalé úložiště není dostupné.');
    notify('Převedeno '+words.length+' dřívějších slovíček z Conversation Labu do společného slovníčku.');
   }
  }
  localStorage.setItem('lsh-vocab-migrated-v1','1');
  legacy.close();
 }catch(error){
  notify('Starší slovíčka se nepodařilo automaticky převést: '+error.message+
   '. Původní data nebyla odstraněna.','warn');
 }
}
async function migrateLegacyReading(){
 const migration=window.LSH_READING_MIGRATION;
 if(!migration)return;
 const banner=$('legacyReadingStatus');
 try{
  const result=await migration.migrate(store);
  if(result.imported>0){
   banner.hidden=false;banner.textContent='Bezpečně převedeno '+result.imported+
    ' slovíček ze starého Reading Labu do společného My Vocabulary. Původní záznamy nebyly smazány. Stáhni si aktuální JSON zálohu.';
  }
 }catch(e){
  banner.hidden=false;banner.textContent='Starší slovíčka nebylo možné bezpečně převést: '+
   String(e.message||e)+'. Původní data zůstávají beze změny. Zkus znovu otevřít slovníček v běžném okně prohlížeče.';
 }
}
async function init(){
 const back=new URLSearchParams(location.search).get('zpet');
 if(back&&/^\/language-skills-hub\/(?:konverzace|cteni|poslech)\/[a-z0-9-]+\/index\.html$/.test(back))
  $('backLink').href=back;
 $('search').addEventListener('input',renderWords);
 $('languageFilter').addEventListener('change',renderWords);
 $('favoritesOnly').addEventListener('change',renderWords);
 $('selectAll').addEventListener('click',()=>{for(const w of filtered())chosen.add(w.id);renderWords()});
 $('clearSelection').addEventListener('click',()=>{chosen.clear();renderWords()});
 $('addForm').addEventListener('submit',saveManual);
 $('exportBtn').addEventListener('click',download);
 $('importFile').addEventListener('change',importFile);
 $('deleteAllWords').addEventListener('click',openClearDialog);
 $('cancelClearWords').addEventListener('click',()=>clearDialog.close());
 $('confirmClearWords').addEventListener('click',deleteAllWords);
 clearDialog.addEventListener('close',()=>{
  if(!$('deleteAllWords').disabled)$('deleteAllWords').focus();
  else $('bankTitle').focus();
 });
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>startMode(b.dataset.mode)));
 try{
  await store.open();
  await migrateLegacyConversation();
  await migrateLegacyReading();
  await load();
  store.subscribe(()=>load());
 }catch(e){notify('Úložiště nelze otevřít: '+e.message,'error')}
}
init();
})();
