/* R30 opt-in timed classroom UI. Local continuity, NOT verified proctoring. */
(function(root){
 'use strict';
 function elt(tag,cls,txt){
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(txt!==undefined)el.textContent=txt;
  return el;
 }
 const MESSAGES={
  en:{intro:'Ready to start?',description:'The test is monitored for leaving the page or changing its display. Your answers stay on this device. The timer continues during interruptions.',
   start:'Start test',remaining:'Time remaining',interrupted:'Test locked',
   lock:'The test was locked. Please contact your teacher. The timer continues.',
   reasons:{hidden:'The test page was hidden or another application was opened.',
    'fullscreen-exit':'Full-screen mode was exited.',
    'fullscreen-denied':'Full-screen mode could not be activated.',
    'focus-loss':'The test window lost focus.',
    'viewport-change':'The test window size changed significantly.',
    'restricted-viewport':'The test was opened in a restricted or divided window.',
    clipboard:'Clipboard interaction was detected.',
    'context-menu':'An external context menu was requested.',
    'page-leave':'The test page was left.',
    reload:'The test page was refreshed while in progress.'},
   resumed:'The test has been resumed.',submitted:'Submitted',
   forget:'Erase local answers',eraseConfirm:'Erase all locally saved answers for this attempt? This cannot be undone. Keep a verified grade record first.',erased:'Local answers erased. Close this page.',
   saveWarning:'Local storage unavailable: reloading may lose this attempt.',
   fullscreenUnavailable:'Full-screen mode is not available on this device. Ask your teacher to check the screen before proceeding.'},
  es:{intro:'¿Listo para empezar?',description:'Durante la prueba se supervisan los cambios de pantalla. Las respuestas se guardan en este dispositivo y el tiempo sigue corriendo durante las interrupciones.',
   start:'Iniciar prueba',remaining:'Tiempo restante',interrupted:'Prueba bloqueada',
   lock:'La prueba se ha bloqueado. Avisa al profesor. El tiempo sigue corriendo.',
   reasons:{hidden:'La página dejó de estar visible o se abrió otra aplicación.',
    'fullscreen-exit':'Se salió de la pantalla completa.',
    'fullscreen-denied':'No se pudo activar la pantalla completa.',
    'focus-loss':'La ventana de la prueba perdió el foco.',
    'viewport-change':'El tamaño de la ventana cambió considerablemente.',
    'restricted-viewport':'La prueba se abrió en una ventana reducida o dividida.',
    clipboard:'Se detectó una acción con el portapapeles.',
    'context-menu':'Se intentó abrir el menú contextual.',
    'page-leave':'Se abandonó la página de la prueba.',
    reload:'Se actualizó la página durante la prueba.'},
   resumed:'La prueba continúa.',submitted:'Entregado',forget:'Borrar respuestas locales',
   eraseConfirm:'¿Borrar las respuestas locales? Esta acción es irreversible.',erased:'Respuestas borradas. Cierra la página.',
   saveWarning:'No se pueden guardar las respuestas de forma local.',
   fullscreenUnavailable:'La pantalla completa no está disponible. Pide al docente que compruebe la pantalla.'},
  de:{intro:'Bereit für den Test?',description:'Das Verlassen der Seite und Änderungen der Bildschirmdarstellung werden überwacht. Antworten bleiben auf diesem Gerät, die Zeit läuft bei Unterbrechungen weiter.',
   start:'Test beginnen',remaining:'Verbleibende Zeit',interrupted:'Test gesperrt',
   lock:'Der Test wurde gesperrt. Bitte informiere die Lehrkraft. Die Zeit läuft weiter.',
   reasons:{hidden:'Die Seite wurde ausgeblendet oder eine andere App geöffnet.',
    'fullscreen-exit':'Der Vollbildmodus wurde verlassen.',
    'fullscreen-denied':'Der Vollbildmodus konnte nicht aktiviert werden.',
    'focus-loss':'Das Testfenster hat den Fokus verloren.',
    'viewport-change':'Die Fenstergröße hat sich deutlich verändert.',
    'restricted-viewport':'Der Test wurde in einem geteilten oder kleinen Fenster geöffnet.',
    clipboard:'Zwischenablage-Aktion erkannt.',
    'context-menu':'Ein Kontextmenü wurde angefordert.',
    'page-leave':'Die Testseite wurde verlassen.',
    reload:'Die Testseite wurde während des Tests neu geladen.'},
   resumed:'Der Test wurde fortgesetzt.',submitted:'Abgegeben',forget:'Lokale Antworten löschen',
   eraseConfirm:'Alle lokal gespeicherten Antworten löschen? Dies kann nicht rückgängig gemacht werden.',erased:'Antworten gelöscht. Bitte die Seite schließen.',
   saveWarning:'Lokale Speicherung nicht verfügbar.',
   fullscreenUnavailable:'Vollbildmodus ist nicht verfügbar. Bitte die Lehrkraft um Bildschirmkontrolle.'},
  fr:{intro:'Prêt à commencer ?',description:'Les changements de fenêtre et la sortie de la page sont surveillés. Les réponses restent sur cet appareil et le temps continue pendant les interruptions.',
   start:'Commencer le test',remaining:'Temps restant',interrupted:'Test verrouillé',
   lock:'Le test a été verrouillé. Contacte ton enseignant. Le temps continue.',
   reasons:{hidden:'La page a été masquée ou une autre application a été ouverte.',
    'fullscreen-exit':'Le mode plein écran a été quitté.',
    'fullscreen-denied':'Le plein écran n’a pas pu être activé.',
    'focus-loss':'La fenêtre du test a perdu le focus.',
    'viewport-change':'La taille de la fenêtre a changé considérablement.',
    'restricted-viewport':'Le test a été ouvert dans une fenêtre réduite ou partagée.',
    clipboard:'Une opération du presse-papiers a été détectée.',
    'context-menu':'Un menu contextuel a été demandé.',
    'page-leave':'La page du test a été quittée.',
    reload:'La page a été actualisée pendant le test.'},
   resumed:'Le test a repris.',submitted:'Remis',forget:'Effacer les réponses locales',
   eraseConfirm:'Supprimer définitivement les réponses locales ?',erased:'Réponses supprimées. Ferme la page.',
   saveWarning:'Enregistrement local indisponible.',
   fullscreenUnavailable:'Le plein écran n’est pas disponible. Demande à l’enseignant de vérifier l’écran.'}
 };
 function mount(cfg){
  const params=new URLSearchParams(location.search);
  if(!params.has('timer'))return null; // Legacy links stay fully compatible.
  const core=root.LSHAttemptCore;
  if(!core)throw new Error('Missing local attempt engine');
  const n=core.minutes(params.get('timer'));
  const classAttempt=params.get('attempt')||'legacytest';
  if(!/^[a-z0-9_-]{6,40}$/i.test(classAttempt))throw new Error('Invalid attempt URL');
  // A shared class QR is not a per-student identity. Give each freshly opened
  // student URL an isolated local store key; preserve it on reload via the hash.
  const ownUrl=new URL(location.href);
  const hash=new URLSearchParams(ownUrl.hash.replace(/^#/,'')); 
  let localSession=hash.get('lsh_session');
  if(!/^[a-f0-9]{24}$/.test(localSession||'')){
   const bytes=new Uint8Array(12);
   if(!root.crypto?.getRandomValues)throw new Error('Secure local session IDs unavailable');
   root.crypto.getRandomValues(bytes);
   localSession=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
   ownUrl.hash='lsh_session='+localSession;
   history.replaceState(history.state,'',ownUrl.href);
  }
  const attempt=classAttempt+'-'+localSession;
  const ui=MESSAGES[cfg.lang]||MESSAGES.en;
  let store=null;try{store=localStorage}catch(_){}
  const engine=core.open({
   skill:cfg.skill,topic:cfg.topic,lang:cfg.lang,level:cfg.level,
   attempt,limitMinutes:n,storage:store,now:Date.now
  });
  const workspace=cfg.workspace;
  if(!workspace||!workspace.parentElement)throw new Error('Missing student workspace');
  const intro=elt('section','lsh-session-intro');
  intro.id='sessionIntro';
  intro.append(elt('h2',null,ui.intro),elt('p',null,ui.description));
  const start=elt('button','action primary',ui.start);start.id='sessionStart';start.type='button';
  intro.appendChild(start);
  const bar=elt('div','lsh-session-bar');bar.id='sessionBar';
  const remaining=elt('strong',null,'');remaining.id='timeRemaining';
  const warning=elt('span','lsh-session-warning','');
  bar.append(remaining,warning);
  const overlay=elt('section','lsh-session-overlay');overlay.id='sessionLock';
  overlay.setAttribute('aria-label',ui.interrupted);
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
  const panel=elt('div','lsh-session-lock-panel');
  panel.append(elt('h2',null,ui.interrupted),elt('p',null,ui.lock));
  const reason=elt('p','lsh-session-reason','');reason.id='sessionLockReason';
  panel.appendChild(reason);
  const corners=elt('div','lsh-session-corners');
  corners.setAttribute('aria-hidden','true');
  const order=['tl','tr','bl','br'];
  let next=0,gestureAt=0;
  // These invisible areas are a convenience for a supervising teacher, not
  // authentication. No labels, instructions, marker glyphs or hints in the DOM.
  for(let i=0;i<order.length;i++){
   const button=elt('div','lsh-corner lsh-corner-'+order[i]);
   button.addEventListener('pointerdown',event=>{
    if(event.button!==0&&event.pointerType==='mouse')return;
    if(engine.status().phase!=='interrupted')return;
    const now=Date.now();
    if(gestureAt&&now-gestureAt>8000)next=0;
    gestureAt=now;
    if(order[next]!==order[i]){next=order[i]==='tl'?1:0;return;}
    next++;
    if(next===4){
     next=0;gestureAt=0;
     try{
      if(!document.fullscreenElement&&document.documentElement.requestFullscreen&&!isTouchDevice()){
       // Request while the teacher's pointer gesture still carries user activation.
       Promise.resolve(document.documentElement.requestFullscreen()).then(()=>{
        fullscreenArmed=!!document.fullscreenElement;
        engine.resume();resetBaseline();render();
       }).catch(()=>{lockReason('fullscreen-denied');});
      }else{engine.resume();resetBaseline();render();}
     }catch(_){lockReason('fullscreen-denied');}
    }
   });
   corners.appendChild(button);
  }
  overlay.append(panel,corners);
  workspace.before(intro,bar);
  workspace.parentElement.appendChild(overlay);
  const results=document.getElementById('results');
  const erase=elt('button','action ghost',ui.forget);
  erase.id='sessionErase';erase.type='button';erase.hidden=true;
  if(results)results.appendChild(erase);
  let initialized=false,autoSubmitting=false,lastPhase=null,purged=false;
  let baselineWidth=0,baselineHeight=0,fullscreenArmed=false;
  let focusDelay=null,resizeDelay=null,fullscreenPending=false;
  const isTouchDevice=()=>('ontouchstart' in root)||navigator.maxTouchPoints>0;
  const dims=()=>({w:root.innerWidth||document.documentElement.clientWidth,
    h:root.innerHeight||document.documentElement.clientHeight});
  function resetBaseline(){const d=dims();baselineWidth=d.w;baselineHeight=d.h;}
  function active(){return engine.status().phase==='running'&&!engine.status().expired;}
  function lock(kind){
   if(!active())return;
   engine.interrupt(kind);
   render();
  }
  function lockReason(kind){
   reason.textContent=ui.reasons[kind]||ui.lock;
  }
  function restricted(){
   // Heuristic only: viewport dimensions cannot reliably prove iPad Split View.
   // Use a conservative threshold to avoid false positives on normal phones.
   const d=dims();
   return d.h>=430&&root.screen&&
    root.screen.width>=900&&d.w<root.screen.width*0.70;
  }
  function displayTime(ms){
   const seconds=Math.max(0,Math.ceil(ms/1000));
   return String(Math.floor(seconds/60)).padStart(2,'0')+':'+
    String(seconds%60).padStart(2,'0');
  }
  function render(){
   if(purged)return;
   const state=engine.status();
   erase.hidden=state.phase!=='submitted';
   intro.hidden=state.phase!=='ready';
   workspace.hidden=state.phase==='ready';
   bar.hidden=state.phase==='ready';
   overlay.hidden=state.phase!=='interrupted';
   if(state.phase==='interrupted'&&lastPhase!=='interrupted'){next=0;gestureAt=0;}
   reason.textContent=state.phase==='interrupted'?
    (ui.reasons[state.incidents[state.incidents.length-1]?.kind]||ui.lock):'';
   if(state.phase==='interrupted')workspace.setAttribute('inert','');
   else workspace.removeAttribute('inert');
   lastPhase=state.phase;
   remaining.textContent=state.phase==='submitted'?ui.submitted:
    ui.remaining+': '+displayTime(state.remainingMs);
   warning.textContent=state.persistent?'':ui.saveWarning;
  }
  function autoSubmit(){
   if(!initialized||autoSubmitting)return;
   const s=engine.status();
   if(s.expired&&s.phase!=='submitted'&&s.phase!=='ready'){
    autoSubmitting=true;
    try{cfg.onSubmit({automatic:true,restored:false})}
    finally{autoSubmitting=false;}
   }
  }
  function tick(){render();autoSubmit();}
  start.addEventListener('click',async()=>{
   if(engine.status().phase!=='ready'||fullscreenPending)return;
   fullscreenPending=true;
   try{
    // Fullscreen API is unavailable on some iPads and iPhones.
    // A failure never silently skips the test on supported desktop devices.
    if(document.documentElement.requestFullscreen&&!document.fullscreenElement){
     try{await document.documentElement.requestFullscreen()}
     catch(_){fullscreenArmed=false;}
    }
    fullscreenArmed=!!document.fullscreenElement;
    engine.start();resetBaseline();render();
    if(restricted())lock('restricted-viewport');
    else if(document.documentElement.requestFullscreen&&!fullscreenArmed&&!isTouchDevice())
     lock('fullscreen-denied');
    else if(!document.documentElement.requestFullscreen)
     warning.textContent=ui.fullscreenUnavailable;
   }finally{fullscreenPending=false;}
  });
  document.addEventListener('fullscreenchange',()=>{
   if(fullscreenPending)return;
   if(document.fullscreenElement){fullscreenArmed=true;resetBaseline();}
   else if(fullscreenArmed){fullscreenArmed=false;lock('fullscreen-exit');}
  });
  document.addEventListener('visibilitychange',()=>{
   if(document.hidden)lock('hidden');
   else tick();
  });
  root.addEventListener('blur',()=>{
   if(!active())return;
   if(focusDelay!==null)root.clearTimeout(focusDelay);
   focusDelay=root.setTimeout(()=>{
    focusDelay=null;
    if(!document.hidden&&!document.hasFocus())lock('focus-loss');
   },350);
  });
  root.addEventListener('focus',()=>{
   if(focusDelay!==null){root.clearTimeout(focusDelay);focusDelay=null;}
   tick();
  });
  root.addEventListener('resize',()=>{
   if(!active()||fullscreenPending)return;
   if(resizeDelay!==null)root.clearTimeout(resizeDelay);
   resizeDelay=root.setTimeout(()=>{
    resizeDelay=null;
    if(!active()||document.hidden)return;
    const d=dims();
    if(restricted())lock('restricted-viewport');
    else if(baselineWidth&&baselineHeight&&
      Math.abs(d.w-baselineWidth)>Math.max(160,baselineWidth*0.24)&&
      Math.abs(d.h-baselineHeight)<Math.max(200,baselineHeight*0.35))
     lock('viewport-change');
   },450);
  });
  for(const type of ['paste','copy','cut']){
   document.addEventListener(type,event=>{
    if(active()){event.preventDefault();lock('clipboard');}
   },true);
  }
  document.addEventListener('keydown',event=>{
   if(!active())return;
   const blocked=(event.ctrlKey||event.metaKey)&&
    ['p','s','u'].includes(event.key.toLowerCase());
   if(blocked||event.key==='F12'){
    event.preventDefault();lock('context-menu');
   }
  },true);
  document.addEventListener('contextmenu',event=>{
   if(active()){event.preventDefault();lock('context-menu');}
  },true);
  root.addEventListener('pagehide',()=>{
   if(active())engine.interrupt('page-leave');
  });
  // Restored pages (including a refresh) must remain locked until the teacher
  // performs the gesture. Timing and saved answers are preserved.
  const interval=setInterval(tick,1000);
  erase.addEventListener('click',()=>{
   if(engine.status().phase!=='submitted'||!root.confirm(ui.eraseConfirm))return;
   engine.clear();purged=true;clearInterval(interval);
   if(results)results.hidden=true;
   intro.hidden=true;workspace.hidden=true;overlay.hidden=true;bar.hidden=false;
   remaining.textContent=ui.erased;warning.textContent='';erase.disabled=true;
  });
  function initialize(){
   const s=engine.status();
   if(s.phase!=='ready')cfg.restoreAnswers(s.answers);
   if(s.phase==='running'&&!s.expired)engine.interrupt('reload');
   resetBaseline();
   initialized=true;render();
   if(s.phase==='submitted')cfg.onSubmit({automatic:true,restored:true});
   else autoSubmit();
   return engine.status();
  }
  function save(){
   const s=engine.status();
   if(s.phase==='running'&&!s.expired)engine.saveAnswers(cfg.getAnswers());
  }
  function saveReviewMarks(marks){
   if(purged)throw new Error('Attempt erased');
   return engine.saveReviewMarks(marks);
  }
  function finish(){
   const s=engine.status();
   if(s.phase==='submitted')return s;
   if(s.phase==='running'&&!s.expired)save();
   const out=engine.finish();render();return out;
  }
  return Object.freeze({initialize,save,saveReviewMarks,finish,status:engine.status,stop:()=>clearInterval(interval)});
 }
 const api=Object.freeze({mount});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHSessionUI=api;
})(typeof window!=='undefined'?window:this);
