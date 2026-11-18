/* Shared teacher-only UX for Reading and Listening. No student attempt state. */
(function(){
 'use strict';
 const api=window.LSHUnlockGestures;
 if(!api)return;
 const steps={
  corners4:['Levý horní roh','Pravý horní roh','Levý dolní roh','Pravý dolní roh'],
  tap_hold_tap:['Krátce klepněte','Podržte 2 až 3 sekundy','Znovu krátce klepněte'],
  hold_double_tap:['Vlevo podržte přibližně 3 sekundy','Vpravo krátce klepněte','Vpravo ihned klepněte znovu'],
  triangle3:['Klepněte nahoře','Klepněte vlevo dole','Vpravo dole podržte 0,6 až 1 sekundu'],
  draw_z:['Začněte nahoře vlevo','Táhněte doprava','Pokračujte šikmo dolů doleva','Dokončete tahem doprava']
 };
 const make=(tag,cls,text)=>{
  const el=document.createElement(tag);if(cls)el.className=cls;
  if(text!==undefined)el.textContent=text;return el;
 };
 let active=null;
 function openTrainer(id){
  const def=api.byId(id);if(!def)return;
  active?.close();
  const oldFocus=document.activeElement;
  const demo=make('section','lsh-session-overlay lsh-unlock-teacher-demo');
  demo.id='lshTeacherTrainer';demo.setAttribute('role','dialog');demo.setAttribute('aria-modal','true');
  demo.setAttribute('aria-label','Nácvik gesta: '+def.name);
  const heading=make('div','lsh-trainer-heading');
  const title=make('h2',null,'Nácvik: '+def.name);
  const intro=make('p',null,'Na počítači použijte myš nebo touchpad. Na telefonu či iPadu použijte prst.');
  const progress=make('p','lsh-trainer-progress','');
  progress.setAttribute('role','status');progress.setAttribute('aria-live','polite');
  heading.append(title,intro,progress);
  const markers=make('div','lsh-trainer-markers');
  markers.setAttribute('aria-hidden','true');
  const feedback=make('p','lsh-trainer-feedback','');
  feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
  const closeButton=make('button','action lsh-trainer-close','Ukončit nácvik');closeButton.type='button';
  const retry=make('button','action lsh-trainer-retry','Zkusit znovu');retry.type='button';
  demo.append(heading,markers,feedback,closeButton,retry);document.body.appendChild(demo);
  const inertBefore=[...document.body.children].filter(el=>el!==demo).map(el=>[el,el.inert]);
  inertBefore.forEach(([el])=>{el.inert=true});
  const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  let binding=null,closed=false,completed=false,step=0,dots=[];
  function paint(){
   if(closed)return;
   const box=demo.getBoundingClientRect(),g=api.geometry(id,box.width,box.height),groups=[];
   g.points.forEach((p,index)=>{
    const found=groups.find(x=>Math.abs(x.x-p.x)<1&&Math.abs(x.y-p.y)<1);
    if(found)found.indexes.push(index);else groups.push({x:p.x,y:p.y,indexes:[index]});
   });
   markers.replaceChildren();
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
   else if(id==='draw_z'&&s.steps>=4)progress.textContent='Uvolněte prst nebo tlačítko myši.';
   else progress.textContent='Krok '+(step+1)+' z '+steps[id].length+': '+steps[id][step];
   showDots();
  }
  function restart(){
   completed=false;step=0;feedback.textContent='';
   binding?.reset();state({steps:0});
  }
  function close(){
   if(closed)return;closed=true;
   binding?.destroy();binding=null;
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
    const order=[closeButton,retry],at=order.indexOf(document.activeElement);
    e.preventDefault();order[(at+(e.shiftKey?-1:1)+order.length)%order.length].focus();
   }
  }
  closeButton.addEventListener('click',close);
  retry.addEventListener('click',restart);
  document.addEventListener('keydown',keys,true);
  window.addEventListener('resize',paint);
  paint();
  binding=api.bindDOM(demo,id,{
   onState:state,
   onFeedback:()=>{if(!completed)feedback.textContent='Pokus se nezdařil. Začněte znovu od kroku 1.';},
   onSuccess:()=>{
    completed=true;step=steps[id].length;
    progress.textContent='Gesto bylo úspěšně rozpoznáno.';
    feedback.textContent='Úspěch! Stejný rozpoznávač je použit ve studentském testu.';
    showDots();
   }
  });
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
  const button=[...root.querySelectorAll('button')].find(x=>/VYZKOUŠET GESTO/i.test(x.textContent));
  if(button){
   // Capture the click so the old modal is never created. Selection remains
   // controlled by the original teacher panel and its URL/QR invalidation.
   button.addEventListener('click',e=>{
    e.stopImmediatePropagation();e.preventDefault();
    const selected=root.querySelector('input[name="unlockMethod"]:checked')?.value;
    openTrainer(selected);
   },true);
   button.textContent='VYZKOUŠET GESTO';
  }
  const mobile=make('details','lsh-unlock-mobile');
  const summary=make('summary',null,'Vyzkoušet prstem na telefonu nebo iPadu');
  const note=make('p','small-note','Naskenujte QR kód vlastním zařízením. Otevřete pouze trenažér, nikoli studentský test.');
  const qr=make('div','lsh-unlock-mobile-qr');
  const link=make('a',null,'Otevřít trenažér v nové záložce');
  link.target='_blank';link.rel='noopener noreferrer';
  mobile.append(summary,note,qr,link);root.appendChild(mobile);
  function refresh(){
   const selected=root.querySelector('input[name="unlockMethod"]:checked')?.value;
   const def=api.byId(selected);qr.replaceChildren();link.removeAttribute('href');
   if(!def)return;
   const target=new URL('../session/gesture-trainer.html',document.baseURI);
   target.searchParams.set('p',def.code);link.href=target.href;
   try{
    if(!window.CLBQRCode?.svg)throw Error('QR generator unavailable');
    const image=window.CLBQRCode.svg(target.href);
    image.setAttribute('aria-label','QR kód pro nácvik gesta '+def.name);
    qr.appendChild(image);
   }catch(_){qr.append(make('p',null,'QR není dostupný. Použijte přímý odkaz.'));}
  }
  root.addEventListener('change',refresh);
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
