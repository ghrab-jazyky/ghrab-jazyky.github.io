/* Language Skills Hub E3C – Conversation card → shared vocabulary bridge.
   Requires model.js/store.js. Original Conversation engine and its inline CSP hash remain untouched.
   This connector runs without network and NEVER claims durable storage when IndexedDB is unavailable. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else {
    root.LSH_CARD_BRIDGE = api;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', api.init, {once:true});
    else api.init();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  const LANGS=['en','es','de','fr'];
  const LEVELS=['A1','A2','B1','B2','C1','C2'];
  const LABELS={
    en:{save:'Save to My Vocabulary',saved:'Saved in this browser.',temporary:'Temporary only! Not saved after this page is closed.',fail:'Could not save the word.',link:'My Vocabulary',loading:'Preparing local vocabulary…',memory:'Local storage unavailable. Saved words will be lost when this page is closed.'},
    es:{save:'Guardar en Mi vocabulario',saved:'Guardado en este navegador.',temporary:'¡Solo temporal! Se perderá al cerrar esta página.',fail:'No se pudo guardar la palabra.',link:'Mi vocabulario',loading:'Preparando el vocabulario local…',memory:'El almacenamiento local no está disponible. Las palabras se perderán al cerrar la página.'},
    de:{save:'In meinem Wortschatz speichern',saved:'In diesem Browser gespeichert.',temporary:'Nur vorübergehend! Beim Schließen der Seite gehen die Wörter verloren.',fail:'Das Wort konnte nicht gespeichert werden.',link:'Mein Wortschatz',loading:'Lokalen Wortschatz vorbereiten…',memory:'Lokaler Speicher ist nicht verfügbar. Gespeicherte Wörter gehen beim Schließen verloren.'},
    fr:{save:'Enregistrer dans mon vocabulaire',saved:'Enregistré dans ce navigateur.',temporary:'Temporaire uniquement ! Les mots seront perdus à la fermeture.',fail:"Impossible d’enregistrer le mot.",link:'Mon vocabulaire',loading:'Préparation du vocabulaire local…',memory:'Le stockage local est indisponible. Les mots seront perdus à la fermeture de cette page.'}
  };
  function norm(s) {
    return String(s||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase()
      .replace(/[’‘]/g,"'").replace(/[‐‑‒–—]/g,'-');
  }
  function senseId(language,term,marker) {
    if(!LANGS.includes(language)||!norm(term)||!norm(marker))throw new Error('Invalid sense input');
    if(typeof TextEncoder==='undefined')throw new Error('TextEncoder unavailable');
    const bytes=new TextEncoder().encode(language+'|'+norm(term)+'|'+norm(marker));
    // Two independent deterministic 32-bit hashes; no BigInt syntax (older Safari).
    let left=0x811c9dc5, right=0x9e3779b9;
    for(const byte of bytes) {
      left=Math.imul(left^byte,0x01000193)>>>0;
      right=Math.imul(right^byte,0x85ebca6b)>>>0;
    }
    return 'cl-'+left.toString(16).padStart(8,'0')+right.toString(16).padStart(8,'0');
  }
  function isUnambiguousCzech(gloss) {
    return typeof gloss==='string'&&gloss.trim().length>0&&
      !/[;,\/|]/.test(gloss)&&!/[\r\n]/.test(gloss);
  }
  function glossaryExact(glossary,language,term) {
    if (!glossary||!LANGS.includes(language)) return '';
    const token=norm(term);
    const terms=[glossary.phrases&&glossary.phrases[language],
      glossary.words&&glossary.words[language]];
    for(const dict of terms){
      if(!dict||typeof dict!=='object')continue;
      const entry=Object.prototype.hasOwnProperty.call(dict,token)?dict[token]:null;
      if(typeof entry==='string'&&entry.trim())return entry.trim();
    }
    return '';
  }
  function makeEntry({language,term,translationCs='',explanation='',context='',level,topicId},glossary,kind) {
    if(!LANGS.includes(language)||!LEVELS.includes(level)||!/^cl-[a-z0-9-]+$/.test(topicId))
      throw new Error('Card identity or variant invalid');
    term=String(term||'').trim();
    if(!term||term.length>160)throw new Error('Word empty or too long');
    explanation=String(explanation||'').trim();
    translationCs=String(translationCs||'').trim();
    if(kind==='recommended'){
      const looked=glossaryExact(glossary,language,term);
      // Conservative: ambiguous dictionary glosses must not be mapped
      // onto one recommended sense without an editorial decision.
      if(isUnambiguousCzech(looked))translationCs=looked;
    }
    const anchor=isUnambiguousCzech(translationCs)?'cz:'+norm(translationCs):
      explanation?'definition:'+norm(explanation):
      translationCs?'multi:'+norm(translationCs):
      'unknown';
    return {language,term,translationCs,explanation,context,
      level,senseId:senseId(language,term,anchor),
      sources:[{skill:'konverzace',topicId,savedAt:new Date().toISOString()}],
      translationHidden:false};
  }
  async function init() {
    const MODEL=window.LSH_MODEL, STORE=window.LSH_STORE;
    const topicId=document.documentElement.dataset.lshTopicId;
    if(!MODEL||!STORE||!topicId||!/^cl-[a-z0-9-]+$/.test(topicId)){
      console.error('LSH E3C: Missing or invalid card identity/modules');
      return;
    }
    const languageSelect=document.getElementById('languageSelect');
    const levelGroup=document.getElementById('levelSwitch');
    const popup=document.getElementById('lookupPopover');
    const vocabGrid=document.getElementById('vocabGrid');
    const topbar=document.querySelector('.topbar .controls');
    if(!languageSelect||!levelGroup||!popup||!vocabGrid||!topbar){
      console.error('LSH E3C: card DOM is not compatible');
      return;
    }
    const store=STORE.createStore({mode:'production'});
    const textNode=(tag,cls,content)=>{
      const node=document.createElement(tag);
      if(cls)node.className=cls;
      if(content!==undefined)node.textContent=content;
      return node;
    };
    const currentLanguage=()=>LANGS.includes(languageSelect.value)?languageSelect.value:'en';
    const currentLevel=()=>{
      const selected=levelGroup.querySelector('button[data-level].active');
      return selected&&LEVELS.includes(selected.dataset.level)?selected.dataset.level:'B1';
    };
    const labels=()=>LABELS[currentLanguage()];
    const bar=textNode('div','lsh-bridge-status','');
    bar.id='lshBridgeStatus';bar.hidden=true;
    bar.setAttribute('role','status');bar.setAttribute('aria-live','polite');
    document.querySelector('.app').insertBefore(bar,document.querySelector('.topbar'));
    const popStatus=textNode('p','lsh-bridge-popstatus','');
    popStatus.setAttribute('role','status');popStatus.setAttribute('aria-live','polite');
    const savePopup=textNode('button','lsh-bridge-save','');
    savePopup.type='button';savePopup.id='lshBridgeSavePopup';
    popup.append(savePopup,popStatus);
    const navLink=textNode('a','btn lsh-bridge-link','');
    navLink.href='../../slovnicek/?zpet='+encodeURIComponent(location.pathname);
    navLink.id='lshBridgeVocabularyLink';
    topbar.append(navLink);
    let noticeTimer=null;
    function notice(message,error=false) {
      bar.hidden=false;bar.textContent=message;
      bar.classList.toggle('lsh-bridge-error',error);
      if(noticeTimer!==null)clearTimeout(noticeTimer);
      if(!error)noticeTimer=setTimeout(()=>{bar.hidden=true;},6500);
    }
    async function countWords() {
      try{
        const all=await store.listWords();
        navLink.textContent=labels().link+' ('+all.length+')';
      }catch(e){
        navLink.textContent=labels().link;
        notice(labels().fail,true);
      }
    }
    function refreshLabels() {
      savePopup.textContent=labels().save;
      countWords();
    }
    function glossary() {
      try {
        return (typeof CZ_GLOSSARY!=='undefined'&&CZ_GLOSSARY)?CZ_GLOSSARY:null;
      }catch(_){return null;}
    }
    function stateText(result) {
      if(result.storedInIndexedDB===true){notice(labels().saved);return labels().saved;}
      notice(labels().temporary,true);return labels().temporary;
    }
    async function persist(raw,button,statusNode) {
      button.disabled=true;
      const previous=button.textContent;
      try{
        const input=makeEntry(raw,glossary(),raw.kind);
        const result=await store.saveWord(input);
        statusNode.textContent=stateText(result);
        await countWords();
      }catch(e) {
        console.error('LSH E3C save:',e);
        statusNode.textContent=labels().fail;
        notice(labels().fail,true);
      }finally{
        button.disabled=false;
        button.textContent=previous;
      }
    }
    function recommendedButtons() {
      const lang=currentLanguage(),level=currentLevel();
      vocabGrid.querySelectorAll('.vocab-item').forEach(item=>{
        if(item.querySelector('.lsh-bridge-save'))return;
        const title=item.querySelector('b');
        const definition=item.querySelector('span');
        if(!title||!definition)return;
        const button=textNode('button','lsh-bridge-save',LABELS[lang].save);
        button.type='button';
        const status=textNode('span','lsh-bridge-itemstatus','');
        status.setAttribute('role','status');
        button.addEventListener('click',()=>{
          persist({language:currentLanguage(),level:currentLevel(),topicId,
            term:title.textContent,explanation:definition.textContent,kind:'recommended'},button,status);
        });
        item.append(button,status);
      });
    }
    const observer=new MutationObserver(recommendedButtons);
    observer.observe(vocabGrid,{childList:true});
    recommendedButtons();
    savePopup.addEventListener('click',()=>{
      if(popup.hidden)return;
      let translationCs=document.getElementById('lookupTranslation').textContent.trim();
      if(/Tento výraz zatím/i.test(translationCs)) translationCs='';
      const context=document.getElementById('lookupContext').textContent.replace(/^Ve větě:\s*/i,'').trim();
      persist({language:currentLanguage(),level:currentLevel(),topicId,
        term:document.getElementById('lookupExpression').textContent,
        translationCs,context,kind:'dictionary'},savePopup,popStatus);
    });
    languageSelect.addEventListener('change',()=>{
      savePopup.textContent=labels().save;
      popStatus.textContent='';
      countWords();
    });
    const popObserver=new MutationObserver(()=>{if(!popup.hidden)popStatus.textContent='';});
    popObserver.observe(popup,{attributes:true,attributeFilter:['hidden']});
    try{
      await store.open();
      if(store.status().mode!=='ready')notice(labels().memory,true);
      await countWords();
    }catch(e){notice(labels().memory,true);}
    store.subscribe(()=>countWords());
    window.addEventListener('pageshow',event=>{if(event.persisted)countWords();});
  }
  return Object.freeze({norm,senseId,isUnambiguousCzech,glossaryExact,makeEntry,init});
});
