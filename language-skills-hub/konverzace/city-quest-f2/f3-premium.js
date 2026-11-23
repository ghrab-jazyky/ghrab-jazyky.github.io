/* CITY QUEST F3A — Offline premium interaction layer.
 * No storage, analytics, API calls, microphone, recordings or media downloads.
 * Sounds are minimal local Web Audio tones and always OFF by default.
 */
(() => {
 "use strict";
 const $=id=>document.getElementById(id);
 const root=document.documentElement,body=document.body;
 const group=$("f3Experience"),summary=$("f3ExperienceSummary"),
  presentation=$("f3PresentationButton"),exit=$("f3PresentationExit"),
  sound=$("f3SoundButton"),motion=$("f3MotionButton"),contrast=$("f3ContrastButton"),
  note=$("f3ExperienceNote"),status=$("f3Status"),skip=$("f3Skip"),skipTask=$("f3SkipTask");
 if(!group||!presentation||!exit||!sound||!motion||!contrast||!note||!status||!skip||!skipTask)
  throw Error("F3 experience controls are missing.");
 const labels={
  en:{experience:"Experience",presentation:"Presentation mode",exit:"Exit presentation",
   soundOn:"Sound cues on",soundOff:"Sound cues off",motionOn:"Motion on",motionOff:"Motion off",
   contrastOn:"High contrast on",contrastOff:"High contrast off",skip:"Skip to missions",skipTask:"Skip to active task",
   note:"Private to this tab. Optional sounds are synthesised locally; no microphone or network.",
   on:"Presentation mode active. Press Escape to exit.",
   off:"Presentation mode closed.",audible:"Sound cues enabled.",silent:"Sound cues disabled.",
   noAudio:"Audio cues are unavailable in this browser.",reduced:"Reduced motion is required by your system.",
   contrastYes:"High contrast enabled.",contrastNo:"High contrast disabled.",
   motionYes:"Motion enabled.",motionNo:"Motion disabled."},
  es:{experience:"Experiencia",presentation:"Modo presentación",exit:"Salir de presentación",
   soundOn:"Sonidos activados",soundOff:"Sonidos desactivados",motionOn:"Animaciones activadas",motionOff:"Animaciones desactivadas",
   contrastOn:"Alto contraste activado",contrastOff:"Alto contraste desactivado",skip:"Ir a las misiones",skipTask:"Ir a la actividad actual",
   note:"Solo en esta pestaña. Los sonidos se generan sin conexión, sin micrófono ni servicios externos.",
   on:"Modo presentación activado. Pulsa Escape para salir.",
   off:"Modo presentación cerrado.",audible:"Sonidos activados.",silent:"Sonidos desactivados.",
   noAudio:"Los sonidos no están disponibles en este navegador.",reduced:"Tu sistema exige reducir las animaciones.",
   contrastYes:"Alto contraste activado.",contrastNo:"Alto contraste desactivado.",
   motionYes:"Animaciones activadas.",motionNo:"Animaciones desactivadas."},
  de:{experience:"Darstellung",presentation:"Präsentationsmodus",exit:"Präsentation verlassen",
   soundOn:"Töne an",soundOff:"Töne aus",motionOn:"Animationen an",motionOff:"Animationen aus",
   contrastOn:"Hoher Kontrast an",contrastOff:"Hoher Kontrast aus",skip:"Zu den Missionen springen",skipTask:"Zur aktuellen Aufgabe springen",
   note:"Nur in diesem Tab. Töne entstehen lokal, ohne Mikrofon oder Netzwerk.",
   on:"Präsentationsmodus aktiv. Mit Escape beenden.",
   off:"Präsentationsmodus beendet.",audible:"Töne eingeschaltet.",silent:"Töne ausgeschaltet.",
   noAudio:"Töne sind in diesem Browser nicht verfügbar.",reduced:"Das System verlangt reduzierte Animationen.",
   contrastYes:"Hoher Kontrast aktiviert.",contrastNo:"Hoher Kontrast deaktiviert.",
   motionYes:"Animationen aktiviert.",motionNo:"Animationen deaktiviert."},
  fr:{experience:"Affichage",presentation:"Mode présentation",exit:"Quitter la présentation",
   soundOn:"Sons activés",soundOff:"Sons désactivés",motionOn:"Animations activées",motionOff:"Animations désactivées",
   contrastOn:"Contraste élevé activé",contrastOff:"Contraste élevé désactivé",skip:"Aller aux missions",skipTask:"Aller à l'activité en cours",
   note:"Uniquement dans cet onglet. Sons créés localement, sans micro ni connexion.",
   on:"Mode présentation actif. Appuyez sur Échap pour quitter.",
   off:"Mode présentation fermé.",audible:"Sons activés.",silent:"Sons désactivés.",
   noAudio:"Les sons ne sont pas disponibles dans ce navigateur.",reduced:"Votre système demande moins d'animations.",
   contrastYes:"Contraste élevé activé.",contrastNo:"Contraste élevé désactivé.",
   motionYes:"Animations activées.",motionNo:"Animations désactivées."}
 };
 const copy=()=>labels[$("f2Language")?.value]||labels.en;
 const systemReduced=window.matchMedia("(prefers-reduced-motion: reduce)");
 let showPresentation=false,allowSound=false,allowMotion=!systemReduced.matches,highContrast=false,audio=null,lastCue=0;
 const setPressed=(element,on)=>element.setAttribute("aria-pressed",String(on));
 function report(message){status.textContent=message;}
 function refresh(){
  const c=copy();
  summary.textContent="⚙ "+c.experience;
  presentation.textContent="◩ "+(showPresentation?c.exit:c.presentation);
  exit.textContent="✕ "+c.exit;
  sound.textContent="♪ "+(allowSound?c.soundOn:c.soundOff);
  motion.textContent="◌ "+(allowMotion&&!systemReduced.matches?c.motionOn:c.motionOff);
  contrast.textContent="◈ "+(highContrast?c.contrastOn:c.contrastOff);
  note.textContent=c.note;
  skip.textContent=c.skip;
  skipTask.textContent=c.skipTask;
  setPressed(presentation,showPresentation);
  setPressed(sound,allowSound);
  setPressed(motion,allowMotion&&!systemReduced.matches);
  setPressed(contrast,highContrast);
  motion.disabled=systemReduced.matches;
  motion.title=systemReduced.matches?c.reduced:"";
  root.dataset.motion=allowMotion&&!systemReduced.matches?"on":"off";
  root.dataset.contrast=highContrast?"high":"normal";
  body.dataset.presentation=showPresentation?"on":"off";
  exit.hidden=!showPresentation;
 }
 function setPresentation(enabled){
  showPresentation=!!enabled;
  group.open=false;
  refresh();
  report(showPresentation?copy().on:copy().off);
  if(!showPresentation)summary.focus({preventScroll:true});
 }
 function toggleAudio(){
  if(allowSound){
   allowSound=false;refresh();report(copy().silent);return;
  }
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context){report(copy().noAudio);return;}
  try{
   if(!audio)audio=new Context();
   if(audio.state==="suspended")audio.resume().catch(()=>{});
   allowSound=true;refresh();report(copy().audible);
  }catch(_){allowSound=false;refresh();report(copy().noAudio);}
 }
 function feedback(kind){
  if(!allowSound||!audio)return;
  const now=window.performance.now();
  if(now-lastCue<65)return;
  lastCue=now;
  try{
   if(audio.state==="suspended")audio.resume().catch(()=>{});
   const start=audio.currentTime+.008;
   // Original minimalist two-note sound signature, deliberately very quiet.
   // Original local transit chime palette. These are NOT spoken or streamed.
   // Each event is a short, quiet signature; gameplay never waits for sound.
   const signatures={
    advance:[[392,0,.075]],
    error:[[220,0,.15]],
    warning:[[329.63,0,.11],[261.63,.13,.16]],
    board:[[440,0,.095],[659.25,.11,.16]],
    ride:[[523.25,0,.10]],
    transfer:[[392,0,.095],[493.88,.11,.095],[587.33,.24,.17]],
    arrival:[[523.25,0,.12],[783.99,.14,.18]],
    complete:[[523.25,0,.13],[659.25,.15,.13],[783.99,.3,.23]]
   };
   const pattern=signatures[kind]||signatures.advance;
   for(const [frequency,offset,duration] of pattern){
    const oscillator=audio.createOscillator(),volume=audio.createGain();
    oscillator.type=kind==="error"?"sine":"triangle";
    oscillator.frequency.setValueAtTime(frequency,start+offset);
    const begin=start+offset,end=begin+duration;
    volume.gain.setValueAtTime(.0001,begin);
    volume.gain.exponentialRampToValueAtTime(kind==="error"?.018:.011,begin+.025);
    volume.gain.exponentialRampToValueAtTime(.0001,end);
    oscillator.connect(volume);volume.connect(audio.destination);
    oscillator.start(begin);oscillator.stop(end+.01);
   }
  }catch(_){/* Sound is decorative; a failure must never interrupt gameplay. */}
 }
 function sceneUpdated(){
  const panel=$("f1Panel");
  if(!panel||allowMotion===false||systemReduced.matches)return;
  panel.classList.remove("f3-reveal");
  // Restart a brief, optional panel transition after meaningful user actions.
  void panel.offsetWidth;
  panel.classList.add("f3-reveal");
 }
 presentation.addEventListener("click",()=>setPresentation(!showPresentation));
 exit.addEventListener("click",()=>setPresentation(false));
 sound.addEventListener("click",toggleAudio);
 motion.addEventListener("click",()=>{
  if(systemReduced.matches){report(copy().reduced);return;}
  allowMotion=!allowMotion;refresh();report(allowMotion?copy().motionYes:copy().motionNo);
 });
 contrast.addEventListener("click",()=>{
  highContrast=!highContrast;refresh();report(highContrast?copy().contrastYes:copy().contrastNo);
 });
 document.addEventListener("keydown",event=>{
  if(event.key!=="Escape")return;
  if(showPresentation){event.preventDefault();setPresentation(false);}
  else if(group.open){group.open=false;summary.focus({preventScroll:true});}
 });
 document.addEventListener("pointerdown",event=>{
  if(group.open&&!group.contains(event.target))group.open=false;
 });
 $("f2Language").addEventListener("change",refresh);
 if(systemReduced.addEventListener)systemReduced.addEventListener("change",refresh);
 else systemReduced.addListener(refresh);
 // Do not hijack original mission controls, routes, or keyboard navigation.
 window.CityQuestF3=Object.freeze({feedback,sceneUpdated,
  getState:()=>Object.freeze({presentation:showPresentation,sound:allowSound,
   motion:allowMotion&&!systemReduced.matches,contrast:highContrast})});
 refresh();
})();
