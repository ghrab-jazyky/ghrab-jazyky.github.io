/* Shared teacher-only UX for Reading and Listening. No student attempt state. */
(function(){
 'use strict';
 const api=window.LSHUnlockGestures;
 if(!api)return;
 const steps={
  corners4:['Levý horní roh','Pravý horní roh','Levý dolní roh','Pravý dolní roh'],
  tap_hold_tap:['Krátce klepněte','Podržte 2 až 3 sekundy','Znovu krátce klepněte'],
  hold_double_tap:['Vlevo podržte přibližně 3 sekundy','Vpravo krátce klepněte','Vpravo ihned klepněte znovu'],
  triangle3:['Klepněte nahoře','Klepněte vlevo dole','Vpravo dole podržte přibližně 1–2 sekundy; pak uvolněte'],
  draw_z:['Začněte nahoře vlevo','Táhněte doprava','Pokračujte šikmo dolů doleva','Dokončete tahem doprava']
 };
 const make=(tag,cls,text)=>{
  const el=document.createElement(tag);if(cls)el.className=cls;
  if(text!==undefined)el.textContent=text;return el;
 };
 let active=null;
 // Only the Reading Asteroids pilot receives the realistic lock rehearsal.
 const isAsteroidsTeacher=()=>{
  if(!/\/reading\/teacher\.html$/.test(location.pathname))return false;
  const select=document.getElementById('topic');
  // The teacher controls mount before asynchronous catalog data finishes.
  // Do not fall back to the old trainer while the topic select is still empty.
  const topic=select?.value||(!select?.options.length?
   new URLSearchParams(location.search).get('topic'):null);
  return topic==='rl-asteroids';
 };
 const currentLanguage=()=>{
  const lang=document.getElementById('language')?.value;
  const preset=new URLSearchParams(location.search).get('lang');
  return ['en','es','de','fr'].includes(lang)?lang:
   ['en','es','de','fr'].includes(preset)?preset:'en';
 };
 // Mirror the live session-ui lock text; browser tests assert copy and layout parity.
 const lockExamples=Object.freeze({
  en:['Test locked','The test was locked. Please contact your teacher. The timer continues.','Full-screen mode was exited.'],
  es:['Prueba bloqueada','La prueba se ha bloqueado. Avisa al profesor. El tiempo sigue corriendo.','Se salió de la pantalla completa.'],
  de:['Test gesperrt','Der Test wurde gesperrt. Bitte informiere die Lehrkraft. Die Zeit läuft weiter.','Der Vollbildmodus wurde verlassen.'],
  fr:['Test verrouillé','Le test a été verrouillé. Contacte ton enseignant. Le temps continue.','Le mode plein écran a été quitté.']
 });
 function openTrainer(id,options){
  const def=api.byId(id);if(!def)return;
  const realistic=options?.realistic===true;
  const guided=options?.guided!==false;
  const language=['en','es','de','fr'].includes(options?.language)?options.language:'en';
  // Desktop rehearsal emulates the PORTRAIT STUDENT SCREEN; a wide desktop
  // browser must never define the geometry of the student's phone gesture.
  const phonePreview=realistic&&guided&&
   window.matchMedia('(pointer: fine)').matches&&innerWidth>=700;
  active?.close();
  const oldFocus=document.activeElement;
  const demo=make('section','lsh-session-overlay lsh-unlock-teacher-demo');
  demo.id='lshTeacherDemo';demo.setAttribute('role','dialog');demo.setAttribute('aria-modal','true');
  demo.setAttribute('aria-label','Nácvik gesta: '+def.name);
  if(phonePreview)demo.classList.add('lsh-rehearsal-phone-mode');
  const stage=phonePreview?make('div','lsh-rehearsal-phone-screen'):demo;
  if(phonePreview){
   stage.setAttribute('role','group');
   stage.setAttribute('aria-label','Simulovaný displej telefonu – zamčený test');
  }
  if(realistic){
   demo.classList.add('lsh-lock-rehearsal');
   if(!guided)demo.classList.add('lsh-rehearsal-exact');
   const copy=lockExamples[language];
   const panel=make('div','lsh-session-lock-panel');
   panel.append(make('h2',null,copy[0]),make('p',null,copy[1]),
    make('p','lsh-session-reason',copy[2]));
   stage.appendChild(panel);
  }
  const heading=make('div','lsh-trainer-heading');
  const title=make('h2',null,'Nácvik: '+def.name);
  const intro=make('p',null,realistic?
   phonePreview?
    'Zadávejte gesto výhradně UVNITŘ simulovaného displeje vlevo. Všechny body mají stejné poměrné polohy jako na studentském telefonu; nápověda je mimo displej.':
    'Body označují místa na celé zamčené obrazovce, nikoli uvnitř rámečku „Test locked“. Na telefonu se jejich poloha přizpůsobí rozměrům displeje.':
   'Na počítači použijte myš nebo touchpad. Na telefonu či iPadu použijte prst.');
  const progress=make('p','lsh-trainer-progress','');
  progress.setAttribute('role','status');progress.setAttribute('aria-live','polite');
  heading.append(title,intro,progress);
  const markers=make('div','lsh-trainer-markers');
  markers.setAttribute('aria-hidden','true');
  const feedback=make('p','lsh-trainer-feedback','');
  feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
  const closeButton=make('button','action lsh-trainer-close','Ukončit nácvik');closeButton.type='button';
  const retry=make('button','action lsh-trainer-retry','Zkusit znovu');retry.type='button';
  if(phonePreview){
   const aside=make('aside','lsh-rehearsal-phone-controls');
   aside.append(make('p','lsh-rehearsal-device-label',
    'Simulovaný telefon · poměr 390 × 844 (zmenšený náhled)'),closeButton,heading,feedback,retry);
   stage.appendChild(markers);
   demo.append(stage,aside);
  }else demo.append(heading,markers,feedback,closeButton,retry);
  document.body.appendChild(demo);
  const inertBefore=[...document.body.children].filter(el=>el!==demo).map(el=>[el,el.inert]);
  inertBefore.forEach(([el])=>{el.inert=true});
  const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  let binding=null,closed=false,completed=false,step=0,dots=[],monitor=null;
  let completionTimer=null;
  let lastState={steps:0,active:false,awaitingRelease:false};
  // Local, volatile teacher-trainer diagnostics only: never persist gesture traces
  // or expose these details inside student exam sessions.
  let press=null,lastReleaseAt=null;
  function paint(){
   if(closed)return;
   if(realistic&&!guided){markers.replaceChildren();dots=[];return;}
   const box=stage.getBoundingClientRect(),g=api.geometry(id,box.width,box.height),groups=[];
   // iPhone/iPad safe-area insets can move the real corner hit targets.
   // Match the ACTUAL CSS hit boxes, not an imaginary 38px viewport corner.
   const cornerIds=['tl','tr','bl','br'];
   const targets=id==='corners4'?g.points.map((p,index)=>{
    const el=stage.querySelector('.lsh-corner-'+cornerIds[index]);
    if(!el)return p; // First paint runs before bindDOM creates targets.
    const r=el.getBoundingClientRect();
    return {x:r.left+r.width/2-box.left,y:r.top+r.height/2-box.top};
   }):g.points;
   targets.forEach((p,index)=>{
    const found=groups.find(x=>Math.abs(x.x-p.x)<1&&Math.abs(x.y-p.y)<1);
    if(found)found.indexes.push(index);else groups.push({x:p.x,y:p.y,indexes:[index]});
   });
   markers.replaceChildren();
   if(id==='draw_z'||id==='triangle3'){
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('class','lsh-trainer-route');
    svg.setAttribute('viewBox','0 0 '+box.width+' '+box.height);
    svg.setAttribute('aria-hidden','true');
    const route=document.createElementNS(ns,'polyline');
    route.setAttribute('points',g.points.map(p=>p.x+','+p.y).join(' '));
    route.setAttribute('fill','none');
    route.setAttribute('stroke',id==='draw_z'?'#006e9d':'#92a7b8');
    route.setAttribute('stroke-width','4');
    route.setAttribute('stroke-dasharray',id==='draw_z'?'10 8':'5 9');
    svg.appendChild(route);markers.appendChild(svg);
   }
   dots=groups.map(p=>{
    const el=make('span','lsh-trainer-dot',p.indexes.map(i=>i+1).join(' / '));
    el.style.left=p.x+'px';el.style.top=p.y+'px';
    markers.appendChild(el);return {el,indexes:p.indexes};
   });
   showDots();
  }
  function showDots(){
   for(const dot of dots){
    dot.el.classList.toggle('is-next',!completed&&dot.indexes.includes(step));
    dot.el.classList.toggle('is-done',completed||dot.indexes.every(i=>i<step));
   }
  }
  function state(s){
   if(completed||closed)return;
   step=Math.min(steps[id].length-1,Math.max(0,s.steps));
   if(s.awaitingRelease)progress.textContent='Uvolněte prst pro dokončení.';
   else if(id==='triangle3'&&s.active&&press?.step===2){
    const elapsed=Math.max(0,(performance.now()-press.at)/1000);
    progress.textContent=elapsed<.4?
     'Bod 3 ze 3: stále držte levé tlačítko myši nebo prst.':
     'Bod 3 ze 3: držíte '+elapsed.toFixed(1)+' s. Nyní uvolněte (nejpozději do 3,5 s).';
   }else if(id==='triangle3'&&s.active){
    progress.textContent='Bod '+(s.steps+1)+' ze 3: krátce klepněte a uvolněte.';
   }else if(id==='draw_z'&&s.steps>=4)progress.textContent='Uvolněte prst nebo tlačítko myši.';
   else progress.textContent='Krok '+(step+1)+' ze '+steps[id].length+': '+steps[id][step];
   showDots();
  }
  // The student recognizer is integrity-pinned. Observe its PUBLIC state only,
  // after pointer events bubble, without modifying recognition or incident logs.
  function triangleError(event){
   // An advisory explanation from the same public state and pointer events;
   // the shared student recognizer remains the sole authority for success.
   const def=api.byId('triangle3'),b=stage.getBoundingClientRect();
   const g=api.geometry('triangle3',b.width,b.height);
   const n=Math.min(2,Math.max(0,press?.step??lastState.steps));
   if(!event){
    return lastState.active?'Bod '+(n+1)+': podržení překročilo povolený čas. Zkuste znovu.':
     'Vypršel čas mezi body (max. 5 s) nebo celkový limit 14 s. Začněte znovu.';
   }
   if(event.type==='pointerdown'){
    const target=g.points[n],dx=event.clientX-b.left-target.x,dy=event.clientY-b.top-target.y;
    if(Math.hypot(dx,dy)>g.r)return 'Bod '+(n+1)+': kliknutí bylo mimo označený bod. Začněte znovu.';
    if(lastReleaseAt!==null&&performance.now()-lastReleaseAt>5000)
     return 'Mezi body uplynulo více než 5 s. Začněte znovu.';
    return 'Nový stisk přerušil předchozí krok. Před dalším bodem vždy uvolněte tlačítko.';
   }
   if(event.type==='pointerup'&&press){
    const duration=performance.now()-press.at,[min,max]=def.durations[n];
    if(duration<min)return 'Bod '+(n+1)+': stisk byl příliš krátký ('+
     (duration/1000).toFixed(1)+' s; minimum '+(min/1000).toFixed(1)+' s). Zkuste znovu.';
    if(duration>max)return 'Bod '+(n+1)+': stisk byl příliš dlouhý ('+
     (duration/1000).toFixed(1)+' s; maximum '+(max/1000).toFixed(1)+' s). Zkuste znovu.';
    return 'Gesto nebylo dokončeno ve správném pořadí nebo celkovém limitu. Zkuste znovu.';
   }
   if(event.type==='pointermove'&&press){
    const x=event.clientX-b.left,y=event.clientY-b.top;
    if(Math.hypot(x-press.x,y-press.y)>g.r/2)
     return 'Bod '+(n+1)+': při držení se kurzor posunul mimo toleranci. Při stisku nehýbejte myší.';
   }
   if(event.type==='pointercancel'||event.type==='lostpointercapture')
    return 'Prohlížeč přerušil stisk. Zkuste kliknout znovu a nepřepínejte okno.';
   return 'Gesto se přerušilo v kroku '+(n+1)+'. Zkuste označené body postupně.';
  }
  function observe(event){
   if(closed||completed||!binding)return;
   if(event?.target?.closest?.('button'))return;
   const next=binding.recognizer.state();
   const reset=(lastState.steps>0&&next.steps===0)||
    (lastState.active&&!next.active&&next.steps<=lastState.steps)||
    (lastState.awaitingRelease&&!next.awaitingRelease);
   if(reset)feedback.textContent=id==='triangle3'?
    triangleError(event):'Sekvence se nezdařila nebo vypršel čas. Začněte znovu od prvního kroku.';
   else if(event?.type==='pointerdown'&&!next.steps&&!next.active)
    feedback.textContent=id==='triangle3'?
     'Začněte přímo na bodu 1 nahoře uprostřed.':'Začněte na zvýrazněném bodu.';
   else if(next.steps>lastState.steps)feedback.textContent='';
   if(id==='triangle3'&&event?.type==='pointerup'){
    if(!reset&&next.steps>lastState.steps)lastReleaseAt=performance.now();
    press=null;
   }
   if(id==='triangle3'&&reset)lastReleaseAt=null;
   state(next);
   lastState={...next};
  }
  function restart(){
   completed=false;step=0;feedback.textContent='';
   demo.classList.remove('lsh-rehearsal-succeeded');
   binding?.reset();lastState={steps:0,active:false,awaitingRelease:false};
   press=null;lastReleaseAt=null;
   state(lastState);
  }
  function close(){
   if(closed)return;closed=true;
   if(completionTimer!==null){clearTimeout(completionTimer);completionTimer=null;}
   binding?.destroy();binding=null;
   if(monitor!==null){clearInterval(monitor);monitor=null;}
   window.removeEventListener('resize',paint);
   document.removeEventListener('keydown',keys,true);
   demo.remove();inertBefore.forEach(([el,was])=>{el.inert=was});
   document.body.style.overflow=oldOverflow;
   if(active?.close===close)active=null;
   if(oldFocus?.isConnected)oldFocus.focus({preventScroll:true});
  }
  function keys(e){
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}
   else if(e.key==='Tab'){
    const order=realistic&&!guided?[closeButton]:[closeButton,retry];
    const at=order.indexOf(document.activeElement);
    e.preventDefault();order[(at+(e.shiftKey?-1:1)+order.length)%order.length].focus();
   }
  }
  closeButton.addEventListener('click',close);
  retry.addEventListener('click',restart);
  document.addEventListener('keydown',keys,true);
  window.addEventListener('resize',paint);
  paint();
  binding=api.bindDOM(stage,id,{
   onPointerStart:event=>{
    if(id!=='triangle3')return;
    const b=stage.getBoundingClientRect();
    press={at:performance.now(),step:binding?.recognizer.state().steps??lastState.steps,
     x:event.clientX-b.left,y:event.clientY-b.top};
   },
   onFailure:()=>{if(!completed)feedback.textContent='Sekvence nebyla rozpoznána. Začněte od kroku 1.';},
   onSuccess:()=>{
    completed=true;step=steps[id].length;
    if(realistic&&!guided){
     // Pointerup is followed by a synthetic click (and sometimes dblclick).
     // Closing synchronously exposes the launch button underneath; an n3
     // double-tap can immediately REOPEN the lock. Keep the overlay in place
     // until the entire click sequence has been consumed.
     completionTimer=setTimeout(()=>{
      completionTimer=null;
      if(closed)return;
      close();
      options?.onComplete?.();
     },320);
     return;
    }
    if(realistic)demo.classList.add('lsh-rehearsal-succeeded');
    progress.textContent='Gesto bylo úspěšně rozpoznáno.';
    feedback.textContent='Úspěch! Stejný rozpoznávač je použit ve studentském testu.';
    showDots();
   }
  });
  for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])
   demo.addEventListener(type,observe);
  monitor=setInterval(()=>observe(null),180);
  paint(); // Reposition corner hints to the real hit targets after binding.
  state({steps:0});closeButton.focus({preventScroll:true});
  active={close};return active;
 }
 function attach(root){
  if(root.dataset.teacherUx==='ready')return;
  if(!root.querySelector('input[name="unlockMethod"]'))return;
  root.dataset.teacherUx='ready';
  root.classList.add('lsh-unlock-teacher-v2');
  const lead=make('p','lsh-unlock-teacher-intro',
   'Vyberte gesto, které provedete prstem na zamčeném telefonu nebo tabletu studenta. Na PC si ho můžete nacvičit myší či touchpadem.');
  root.prepend(lead);
  const option=root.querySelector('input[name="unlockMethod"][value="corners4"]')?.closest('label');
  if(option)option.querySelector('.lsh-unlock-option-copy')?.append(make('em','lsh-unlock-recommended','Doporučeno'));
  const detail=root.querySelector('.lsh-unlock-details');
  const sequence=make('ol','lsh-unlock-step-list');
  const figures=root.querySelector('.lsh-unlock-figures');
  if(detail&&figures)detail.insertBefore(sequence,figures);
  function updateSteps(){
   const id=root.querySelector('input[name="unlockMethod"]:checked')?.value;
   sequence.replaceChildren();
   for(const line of (steps[id]||[]))sequence.append(make('li',null,line));
  }
  root.addEventListener('change',updateSteps);
  updateSteps();
  const button=[...root.querySelectorAll('button')].find(x=>/VYZKOUŠET GESTO/i.test(x.textContent));
  if(button){
   // Capture the click so the old modal is never created. Selection remains
   // controlled by the original teacher panel and its URL/QR invalidation.
   button.addEventListener('click',e=>{
    e.stopImmediatePropagation();e.preventDefault();
    const selected=root.querySelector('input[name="unlockMethod"]:checked')?.value;
    openTrainer(selected,isAsteroidsTeacher()?
     {realistic:true,guided:true,language:currentLanguage()}:undefined);
   },true);
   button.textContent='VYZKOUŠET GESTO';
  }
  const mobile=make('details','lsh-unlock-mobile');
  const summary=make('summary',null,'Vyzkoušet prstem na telefonu nebo iPadu');
  const note=make('p','small-note','Naskenujte QR kód vlastním zařízením. Otevřete pouze trenažér, nikoli studentský test.');
  const qr=make('div','lsh-unlock-mobile-qr');
  const link=make('a',null,'Otevřít trenažér v nové záložce');
  link.target='_blank';link.rel='noopener noreferrer';
  mobile.append(summary,note,qr,link);
  // Keep the historical #unlockTeacherControls single-details contract (E4/R35).
  // The QR rehearsal is a sibling, not another details nested inside controls.
  root.after(mobile);
  function refresh(){
   const selected=root.querySelector('input[name="unlockMethod"]:checked')?.value;
   const def=api.byId(selected);qr.replaceChildren();link.removeAttribute('href');
   if(!def)return;
   const target=new URL('../session/gesture-trainer.html',document.baseURI);
   target.searchParams.set('p',def.code);
   if(isAsteroidsTeacher()){
    target.searchParams.set('source','rl-asteroids');
    target.searchParams.set('lang',currentLanguage());
    target.searchParams.set('rehearsalVersion','rl-lock-rehearsal-20261120-7');
    note.textContent='Mobilní nácvik používá stejné poměrné body jako simulovaný telefon na PC. Můžete cvičit s viditelnými body nebo zkusit reálnou zamčenou obrazovku bez nápovědy. Zavírací tlačítko slouží pouze k nácviku.';
   }else note.textContent='Naskenujte QR kód vlastním zařízením. Otevřete pouze trenažér, nikoli studentský test.';
   link.href=target.href;
   try{
    if(!window.CLBQRCode?.svg)throw Error('QR generator unavailable');
    const image=window.CLBQRCode.svg(target.href);
    image.setAttribute('aria-label','QR kód pro nácvik gesta '+def.name);
    qr.appendChild(image);
   }catch(_){qr.append(make('p',null,'QR není dostupný. Použijte přímý odkaz.'));}
  }
  root.addEventListener('change',refresh);
  for(const id of ['topic','language'])
   document.getElementById(id)?.addEventListener('change',refresh);
  summary.addEventListener('click',refresh);
  mobile.addEventListener('toggle',()=>{if(mobile.open)refresh()});
  refresh();
 }
 function init(){
  const root=document.getElementById('unlockTeacherControls');if(!root)return;
  // The teacher panels mount shared controls asynchronously after DOMContentLoaded.
  const observer=new MutationObserver(()=>attach(root));
  observer.observe(root,{childList:true,subtree:true});
  attach(root);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
 window.LSHTeacherTrainer=Object.freeze({openTrainer});
})();
