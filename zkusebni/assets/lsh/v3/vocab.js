/* Language Skills Hub E3B – staged vocabulary UI. Local data only, no requests. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => { init().catch(showFatal); });
  const $ = id => document.getElementById(id);
  const M = window.LSH_MODEL;
  const S = window.LSH_STORE;
  const config = window.LSH_CONFIG;
  const LANG_NAMES = Object.freeze({en:'Angličtina',es:'Španělština',de:'Němčina',fr:'Francouzština'});
  let store=null, words=[], activeWord=null, queue=[], practice=null, practiceMode='flash',revealed=new Set();
  let unsubscribe=null;
  const el = (tag,className,text) => {
    const node=document.createElement(tag);
    if (className) node.className=className;
    if (text!==undefined) node.textContent=String(text);
    return node;
  };
  function showFatal(error) {
    console.error('LSH vocabulary:',error);
    const panel=$('vocabStatus');
    if (panel) {
      panel.textContent='Slovníček se nepodařilo načíst. Obnovte stránku nebo použijte export zálohy.';
      panel.classList.add('error');
    }
  }
  function status(text,error=false) {
    const node=$('vocabStatus');
    node.textContent=text;
    node.classList.toggle('error',error);
  }
  function storageWarning() {
    const current=store.status();
    $('storageAlert').hidden=current.mode==='ready';
    if (current.mode==='temporary') {
      $('storageAlert').textContent='POZOR: Úložiště zařízení není dostupné. Změny jsou pouze v paměti této stránky a po zavření se ztratí. Pro zálohu použijte Export JSON.';
    } else if (current.mode==='error') {
      $('storageAlert').textContent='POZOR: Úložiště hlásí chybu. Nespolehejte na uložení. Zkuste export a obnovu stránky.';
    }
  }
  function reportSaved(result,what) {
    storageWarning();
    if (result.storedInIndexedDB) status(what+' v tomto prohlížeči. Pro jistotu pravidelně exportujte zálohu.');
    else status('Změna je jen dočasně v paměti. Po zavření stránky se ztratí; použijte Export JSON.',true);
  }
  function theme() {
    let current='dark';
    try { current=localStorage.getItem('lsh-test-theme-v1')==='light'?'light':'dark'; } catch(_) {}
    const apply=value=>{
      document.documentElement.dataset.theme=value;
      const b=$('themeToggle');
      b.textContent=value==='dark'?'☀':'☾';
      b.setAttribute('aria-pressed',String(value==='light'));
      b.title=value==='dark'?'Přepnout na světlý motiv':'Přepnout na tmavý motiv';
    };
    apply(current);
    $('themeToggle').addEventListener('click',()=>{
      current=current==='light'?'dark':'light';
      apply(current);
      try { localStorage.setItem('lsh-test-theme-v1',current); } catch(_){}
    });
  }
  async function refresh() {
    words=(await store.listWords()).map(w=>M.normalizeWord(w));
    storageWarning();
    $('wordCount').textContent=String(words.length);
    $('learnedCount').textContent=String(words.filter(w=>w.box===5).length);
    const now=Date.now();
    $('dueCount').textContent=String(words.filter(w=>new Date(w.dueAt).getTime()<=now).length);
    updateTopicOptions();
    render();
  }
  function updateTopicOptions() {
    const select=$('topicFilter'), current=select.value;
    const ids=[...new Set(words.flatMap(w=>w.sources.map(s=>s.topicId)))].sort((a,b)=>a.localeCompare(b,'cs'));
    select.replaceChildren(new Option('Všechny karty',''));
    for (const id of ids) select.add(new Option(id,id));
    if(ids.includes(current))select.value=current;
  }
  function getFiltered() {
    const query=$('wordSearch').value.trim().toLocaleLowerCase('cs');
    const language=$('languageFilter').value;
    const skill=$('skillFilter').value;
    const level=$('levelFilter').value;
    const topic=$('topicFilter').value;
    const state=$('stateFilter').value;
    const now=Date.now();
    return words.filter(w=>{
      const fields=[w.term,w.translationCs,w.explanation,w.note,w.context].join(' ').toLocaleLowerCase('cs');
      if(query && !fields.includes(query))return false;
      if(language && w.language!==language)return false;
      if(level && w.level!==level)return false;
      if(skill==='manual' && w.sources.length)return false;
      if(skill && skill!=='manual' && !w.sources.some(s=>s.skill===skill))return false;
      if(topic && !w.sources.some(s=>s.topicId===topic))return false;
      if(state==='favorites' && !w.favorite)return false;
      if(state==='learned' && w.box!==5)return false;
      if(state==='due' && new Date(w.dueAt).getTime()>now)return false;
      return true;
    }).sort((a,b)=>new Date(a.dueAt)-new Date(b.dueAt)||a.term.localeCompare(b.term,'cs'));
  }
  function button(label,style,action) {
    const b=el('button',style,label);
    b.type='button';
    b.addEventListener('click',action);
    return b;
  }
  function field(labelText,value) {
    const p=el('p','vocab-data');
    const label=el('span','vocab-data-label',labelText);
    const content=el('span',null,value);
    p.append(label,content);
    return p;
  }
  function render() {
    const filtered=getFiltered();
    $('filteredCount').textContent=String(filtered.length);
    const list=$('wordList');list.replaceChildren();
    $('wordEmpty').hidden=filtered.length!==0;
    const fragment=document.createDocumentFragment();
    for (const w of filtered) fragment.appendChild(renderWord(w));
    list.appendChild(fragment);
  }
  function renderWord(w) {
    const card=el('article','vocab-card');
    const head=el('div','vocab-card-head');
    const info=el('div','vocab-card-info');
    const term=el('h3',null,w.term);
    const meta=el('p','vocab-meta',LANG_NAMES[w.language]+(w.level?' · '+w.level:'')+' · přihrádka '+w.box);
    info.append(term,meta);
    const fav=button(w.favorite?'★ Oblíbené':'☆ Oblíbené','button outline',async()=>{
      try { const result=await store.patchWord(w.id,{favorite:!w.favorite});
        reportSaved(result,'Oblíbené upraveno');await refresh(); }
      catch(e){status('Oblíbené nebylo možné změnit: '+e.message,true);}
    });
    fav.setAttribute('aria-pressed',String(w.favorite));
    head.append(info,fav);card.appendChild(head);
    if (w.explanation) card.appendChild(field('Výklad',w.explanation));
    if (w.translationCs) {
      if (w.translationHidden && !revealed.has(w.id)) {
        const wrap=el('div','vocab-reveal');
        wrap.append(el('span',null,'Český překlad je skrytý.'));
        const reveal=button('Odkrýt překlad','button subtle',()=>{
          revealed.add(w.id);
          render();
        });
        wrap.appendChild(reveal);card.appendChild(wrap);
      } else card.appendChild(field('Český překlad',w.translationCs));
    }
    if(w.context)card.appendChild(field('Věta',w.context));
    if(w.note)card.appendChild(field('Poznámka',w.note));
    const when=new Date(w.dueAt);
    const due=when.getTime()<=Date.now()?'K opakování nyní':'Další opakování: '+when.toLocaleDateString('cs-CZ');
    card.appendChild(el('p','vocab-meta',due));
    const tools=el('div','vocab-card-actions');
    tools.append(
      button('Upravit','button outline',()=>openEdit(w)),
      button('Smazat','button outline',()=>removeWord(w))
    );
    card.appendChild(tools);
    return card;
  }
  function openEdit(w) {
    activeWord=w;
    $('editHeading').textContent='Upravit: '+w.term;
    $('editTerm').value=w.term;
    $('editTranslation').value=w.translationCs;
    $('editExplanation').value=w.explanation;
    $('editContext').value=w.context;
    $('editNote').value=w.note;
    $('editLevel').value=w.level || '';
    $('editHidden').checked=w.translationHidden;
    $('editDialog').showModal();
    $('editTerm').focus();
  }
  async function removeWord(w) {
    if(!window.confirm('Opravdu smazat slovo „'+w.term+'“? Změnu nelze vrátit zpět.'))return;
    try {
      const result=await store.deleteWord(w.id);
      revealed.delete(w.id);
      reportSaved(result,'Slovo smazáno');
      await refresh();
    } catch(e) {status('Slovo nelze smazat: '+e.message,true);}
  }
  async function onAdd(ev) {
    ev.preventDefault();
    const button=$('addSubmit');button.disabled=true;
    try {
      const payload={language:$('addLanguage').value,term:$('addTerm').value,
        translationCs:$('addTranslation').value,explanation:$('addExplanation').value,
        note:$('addNote').value,level:$('addLevel').value||null};
      const result=await store.addManualWord(payload);
      reportSaved(result,'Slovo uloženo');
      $('addWordForm').reset();
      await refresh();
      $('addTerm').focus();
    } catch(e){status('Slovo se nepodařilo uložit: '+e.message,true);}
    finally {button.disabled=false;}
  }
  async function onEdit(ev) {
    ev.preventDefault(); if(!activeWord)return;
    const id=activeWord.id;
    const button=$('editSubmit');button.disabled=true;
    try {
      const result=await store.patchWord(id,{term:$('editTerm').value,
        translationCs:$('editTranslation').value,explanation:$('editExplanation').value,
        context:$('editContext').value,note:$('editNote').value,
        level:$('editLevel').value||null,translationHidden:$('editHidden').checked});
      reportSaved(result,'Slovo upraveno');
      $('editDialog').close();activeWord=null;
      await refresh();
    } catch(e){status('Úpravu nelze uložit: '+e.message,true);}
    finally{button.disabled=false;}
  }
  async function exportWords() {
    try {
      const data=await store.exportWords();
      const blob=new Blob([data],{type:'application/json;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const a=el('a');a.href=url;
      a.download='LSH_slovnicek_'+new Date().toISOString().slice(0,10)+'.json';
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),2500);
      status('Záloha JSON připravena ke stažení. Soubor si bezpečně uschovejte.');
    } catch(e) {status('Export se nepodařil: '+e.message,true);}
  }
  async function importWords() {
    const file=$('importFile').files[0];
    if(!file)return;
    try {
      if(file.size>M.MAX_IMPORT_BYTES)throw new Error('Soubor přesahuje limit 3 MB');
      const raw=await file.text();
      const incoming=M.validateImport(raw);
      const replace=$('importReplace').checked;
      if(replace && !window.confirm('Nahradit úplně celý stávající slovníček? Nevratně smažete slova, která v importu nejsou. Doporučujeme nejprve exportovat zálohu.'))return;
      const result=await store.importWords(raw,{replace});
      reportSaved(result,'Import '+result.imported+' slov dokončen');
      revealed.clear();
      await refresh();
    } catch(e) {status('Import se nezdařil. Stávající data nebyla záměrně smazána: '+e.message,true);}
    finally {$('importFile').value='';}
  }
  function normalAnswer(value) { return String(value).normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('cs'); }
  function startPractice() {
    const current=getFiltered();
    queue=current.sort((a,b)=>{
      const aDue=new Date(a.dueAt).getTime()<=Date.now(),bDue=new Date(b.dueAt).getTime()<=Date.now();
      return Number(bDue)-Number(aDue)||a.dueAt.localeCompare(b.dueAt);
    });
    practiceMode=$('practiceMode').value;
    if(practiceMode==='reverse'){
      queue=queue.filter(w=>!!w.explanation || (!!w.translationCs && !w.translationHidden));
    }
    if(!queue.length){status('Pro vybrané filtry nejsou žádná slovíčka k procvičování.',true);return;}
    practice=queue.shift();
    $('practicePanel').hidden=false;
    showPractice();
  }
  function showPractice() {
    const w=practice;if(!w) {
      $('practicePanel').hidden=true;
      status('Procvičování dokončeno. Slova, která budete znovu opakovat, najdete podle termínu.');
      return;
    }
    $('practicePrompt').replaceChildren();
    $('practiceAnswer').replaceChildren();
    $('practiceAnswer').hidden=true;
    $('reverseWrap').hidden=practiceMode!=='reverse';
    $('revealPractice').hidden=practiceMode==='reverse';
    $('practiceRating').hidden=true;
    $('reverseResult').textContent='';
    $('reverseInput').value='';
    $('practiceProgress').textContent='Zbývá '+(queue.length+1)+' slov. Přihrádka '+w.box+'.';
    if (practiceMode==='reverse') {
      $('practicePrompt').append(el('strong',null,w.explanation || w.translationCs));
      $('reverseInput').focus();
    } else {
      $('practicePrompt').append(el('strong',null,w.term));
      if (w.context) $('practicePrompt').append(el('p',null,w.context));
    }
  }
  function revealPractice() {
    if (!practice)return;
    const wrap=$('practiceAnswer');
    if(practice.explanation)wrap.append(field('Výklad',practice.explanation));
    if(practice.translationCs) {
      if (practice.translationHidden && !revealed.has(practice.id)) {
        const r=button('Odkrýt český překlad','button subtle',()=>{
          revealed.add(practice.id);
          r.replaceWith(field('Český překlad',practice.translationCs));
        });
        wrap.appendChild(r);
      } else wrap.append(field('Český překlad',practice.translationCs));
    }
    if(!practice.explanation&&!practice.translationCs)wrap.append(el('p',null,'K tomuto slovu zatím není vložen překlad ani výklad.'));
    wrap.hidden=false;
    $('practiceRating').hidden=false;
  }
  function checkReverse() {
    if(!practice)return;
    const typed=normalAnswer($('reverseInput').value),expected=normalAnswer(practice.term);
    if(!typed){$('reverseResult').textContent='Nejprve napište výraz.';return;}
    const correct=typed===expected;
    $('reverseResult').textContent=(correct?'Správně. ':'Zatím ne. ')+'Správný výraz: '+practice.term;
    $('practiceRating').hidden=false;
    $('practiceAnswer').hidden=false;
    $('practiceAnswer').replaceChildren();
    if(practice.context)$('practiceAnswer').appendChild(field('Věta',practice.context));
  }
  async function rate(rating) {
    if(!practice)return;
    const w=practice;
    $('practiceRating').hidden=true;
    try {
      const result=await store.rateWord(w.id,rating);
      reportSaved(result,'Hodnocení zapsáno');
      await refresh();
      practice=queue.shift()||null;
      showPractice();
    } catch(e){status('Hodnocení se nepodařilo uložit: '+e.message,true);
      $('practiceRating').hidden=false;
    }
  }
  function setupReturnLink() {
    const params=new URLSearchParams(location.search);
    if(params.getAll('zpet').length!==1)return;
    const raw=params.get('zpet');
    try {
      const target=new URL(raw,location.origin);
      const prefix=config.basePath+'konverzace/';
      const suffix=target.pathname.startsWith(prefix)?target.pathname.slice(prefix.length):'';
      if(target.origin!==location.origin||target.username||target.password||
         !/^[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(suffix)||
         target.search||target.hash)return;
      const back=$('backToCard');
      back.href=target.href;
      back.hidden=false;
    } catch (_) { /* Untrusted or invalid return URLs are ignored. */ }
  }
  async function init() {
    if(!M||!S||!config||!['staging','production'].includes(config.mode))
      throw new Error('Chybějící datový modul nebo režim');
    setupReturnLink();
    theme();
    store=S.createStore({mode:config.mode});
    await store.open();
    storageWarning();
    await refresh();
    unsubscribe=store.subscribe(()=>{refresh().catch(showFatal);});
    $('addWordForm').addEventListener('submit',onAdd);
    $('editForm').addEventListener('submit',onEdit);
    $('editCancel').addEventListener('click',()=>$('editDialog').close());
    $('editDialog').addEventListener('close',()=>{activeWord=null;});
    for(const id of ['wordSearch','languageFilter','skillFilter','levelFilter','topicFilter','stateFilter']) {
      $(id).addEventListener(id==='wordSearch'?'input':'change',render);
    }
    $('resetVocabFilters').addEventListener('click',()=>{
      for(const id of ['wordSearch','languageFilter','skillFilter','levelFilter','topicFilter','stateFilter'])
        $(id).value='';
      render();
    });
    $('exportBtn').addEventListener('click',exportWords);
    $('importBtn').addEventListener('click',()=>$('importFile').click());
    $('importFile').addEventListener('change',importWords);
    $('practiceStart').addEventListener('click',startPractice);
    $('practiceStop').addEventListener('click',()=>{practice=null;queue=[];$('practicePanel').hidden=true;});
    $('revealPractice').addEventListener('click',revealPractice);
    $('reverseCheck').addEventListener('click',checkReverse);
    $('reverseInput').addEventListener('keydown',e=>{
      if(e.key==='Enter'){e.preventDefault();checkReverse();}
    });
    for(const b of document.querySelectorAll('[data-rating]'))
      b.addEventListener('click',()=>rate(b.dataset.rating));
    window.addEventListener('pageshow',event=>{
      if (event.persisted) refresh().catch(showFatal);
    });
  }
})();
