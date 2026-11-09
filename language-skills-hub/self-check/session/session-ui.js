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
  en:{intro:'Ready to start?',description:'Your timer begins when you press Start. Answers are saved only in this browser. Leaving the tab may pause editing until your teacher resumes the test. This does not prevent cheating or verify your identity.',
   start:'Start test',remaining:'Time remaining',interrupted:'Test interrupted',
   lock:'The page became hidden. Ask your teacher to resume your attempt. The timer continues.',
   gesture:'Teacher: tap the four marked corners in this order: top left, top right, bottom left, bottom right. This is not a password.',
   resumed:'Teacher gesture completed. You can continue.',pending:'Waiting for the next corner…',
   invalid:'Incorrect order. Start again at the top-left corner.',submitted:'Submitted',
   saveWarning:'Local storage unavailable: reloading may lose this attempt.'},
  es:{intro:'¿Listo para empezar?',description:'El tiempo comienza al pulsar Iniciar. Las respuestas solo se guardan en este navegador. Si sales de la pestaña, el profesor tendrá que reanudar el ejercicio. No es un examen seguro.',
   start:'Iniciar prueba',remaining:'Tiempo restante',interrupted:'Prueba interrumpida',
   lock:'La página ha dejado de estar visible. Pide al docente que reanude la prueba. El tiempo sigue corriendo.',
   gesture:'Docente: pulsa las cuatro esquinas señaladas: arriba izquierda, arriba derecha, abajo izquierda y abajo derecha. No es una contraseña.',
   resumed:'La prueba continúa.',pending:'Siguiente esquina…',invalid:'Orden incorrecto. Empieza de nuevo.',
   submitted:'Entregado',saveWarning:'El almacenamiento local no está disponible: podrías perder las respuestas al recargar.'},
  de:{intro:'Bereit für den Test?',description:'Die Zeit beginnt mit Start. Antworten werden nur in diesem Browser gespeichert. Nach einem Tabwechsel muss die Lehrkraft die Bearbeitung fortsetzen lassen. Dies ist keine sichere Prüfung.',
   start:'Test beginnen',remaining:'Verbleibende Zeit',interrupted:'Test unterbrochen',
   lock:'Die Seite war nicht sichtbar. Bitte die Lehrkraft um Freigabe. Die Zeit läuft weiter.',
   gesture:'Lehrkraft: Markierungen anklicken – oben links, oben rechts, unten links, unten rechts. Dies ist kein Passwort.',
   resumed:'Der Test wird fortgesetzt.',pending:'Nächste Ecke…',invalid:'Falsche Reihenfolge. Bitte erneut beginnen.',
   submitted:'Abgegeben',saveWarning:'Lokales Speichern nicht verfügbar: Beim Neuladen können Antworten verloren gehen.'},
  fr:{intro:'Prêt à commencer ?',description:'Le chronomètre démarre avec le bouton Commencer. Les réponses restent dans ce navigateur. Après avoir quitté l’onglet, l’enseignant doit autoriser la reprise. Ce dispositif ne sécurise pas un examen.',
   start:'Commencer le test',remaining:'Temps restant',interrupted:'Test interrompu',
   lock:'La page a été masquée. Demande à l’enseignant de reprendre le test. Le temps continue.',
   gesture:'Enseignant : touchez les coins indiqués dans cet ordre : haut gauche, haut droit, bas gauche, bas droit. Ce n’est pas un mot de passe.',
   resumed:'Vous pouvez continuer.',pending:'Coin suivant…',invalid:'Ordre incorrect. Recommencez.',
   submitted:'Remis',saveWarning:'Le stockage local est indisponible : le rechargement peut effacer les réponses.'}
 };
 function mount(cfg){
  const params=new URLSearchParams(location.search);
  if(!params.has('timer'))return null; // Legacy links stay fully compatible.
  const core=root.LSHAttemptCore;
  if(!core)throw new Error('Missing local attempt engine');
  const n=core.minutes(params.get('timer'));
  const attempt=params.get('attempt')||'legacytest';
  if(!/^[a-z0-9_-]{6,40}$/i.test(attempt))throw new Error('Invalid attempt URL');
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
  panel.append(elt('h2',null,ui.interrupted),elt('p',null,ui.lock),
   elt('p','lsh-session-hint',ui.gesture));
  const status=elt('p','lsh-session-status','');status.id='sessionLockStatus';
  status.setAttribute('aria-live','polite');panel.appendChild(status);
  const corners=elt('div','lsh-session-corners');
  const order=['tl','tr','bl','br'];
  const markers=['↖','↗','↙','↘'];
  let next=0;
  for(let i=0;i<order.length;i++){
   const button=elt('button','lsh-corner lsh-corner-'+order[i],markers[i]);
   button.type='button';button.setAttribute('aria-label',order[i]);
   button.addEventListener('click',()=>{
    if(engine.status().phase!=='interrupted')return;
    if(order[next]!==order[i]){
     next=order[i]==='tl'?1:0;status.textContent=ui.invalid;
     return;
    }
    next++;
    if(next===4){
     next=0;
     try{engine.resume();status.textContent=ui.resumed;render()}
     catch(_){status.textContent=ui.lock}
    }else status.textContent=ui.pending;
   });
   corners.appendChild(button);
  }
  overlay.append(panel,corners);
  workspace.before(intro,bar);
  workspace.parentElement.appendChild(overlay);
  let initialized=false,autoSubmitting=false,lastPhase=null;
  function displayTime(ms){
   const seconds=Math.max(0,Math.ceil(ms/1000));
   return String(Math.floor(seconds/60)).padStart(2,'0')+':'+
    String(seconds%60).padStart(2,'0');
  }
  function render(){
   const state=engine.status();
   intro.hidden=state.phase!=='ready';
   workspace.hidden=state.phase==='ready';
   bar.hidden=state.phase==='ready';
   overlay.hidden=state.phase!=='interrupted';
   if(state.phase==='interrupted'&&lastPhase!=='interrupted'){
    next=0;
    const first=corners.querySelector('button');if(first)first.focus({preventScroll:true});
   }
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
  start.addEventListener('click',()=>{
   if(engine.status().phase==='ready'){engine.start();render()}
  });
  let seenFullscreen=!!document.fullscreenElement;
  document.addEventListener('fullscreenchange',()=>{
   if(seenFullscreen&&!document.fullscreenElement&&engine.status().phase==='running'){
    engine.interrupt('fullscreen-exit');render();
   }
   seenFullscreen=!!document.fullscreenElement;
  });
  document.addEventListener('visibilitychange',()=>{
   if(document.hidden&&engine.status().phase==='running'){
    engine.interrupt('hidden');render();
   }else if(!document.hidden)tick();
  });
  const interval=setInterval(tick,1000);
  function initialize(){
   const s=engine.status();
   if(s.phase!=='ready')cfg.restoreAnswers(s.answers);
   initialized=true;render();
   if(s.phase==='submitted')cfg.onSubmit({automatic:true,restored:true});
   else autoSubmit();
   return engine.status();
  }
  function save(){
   const s=engine.status();
   if(s.phase==='running'&&!s.expired)engine.saveAnswers(cfg.getAnswers());
  }
  function finish(){
   const s=engine.status();
   if(s.phase==='submitted')return s;
   if(s.phase==='running'&&!s.expired)save();
   const out=engine.finish();render();return out;
  }
  return Object.freeze({initialize,save,finish,status:engine.status,stop:()=>clearInterval(interval)});
 }
 const api=Object.freeze({mount});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHSessionUI=api;
})(typeof window!=='undefined'?window:this);
