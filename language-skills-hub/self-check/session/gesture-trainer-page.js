/* Standalone rehearsal opened via QR from either lab teacher panel. */
(function(){
 'use strict';
 function mount(){
  const api=window.LSHUnlockGestures,trainer=window.LSHTeacherTrainer;
  const params=new URLSearchParams(location.search);
  const codes=params.getAll('p');
  const def=codes.length===1?api?.byCode(codes[0]):null;
  const title=document.getElementById('gestureTitle');
  const guide=document.getElementById('gestureGuide');
  const launch=document.getElementById('launchTrainer');
  const error=document.getElementById('error');
  if(!def||!trainer){
   title.textContent='Neplatný odkaz pro nácvik';
   error.textContent='Vraťte se do učitelského panelu a vytvořte nový QR kód pro požadované gesto.';
   return;
  }
  title.textContent=def.name;
  guide.textContent=def.guide;
  launch.disabled=false;
  launch.addEventListener('click',()=>trainer.openTrainer(def.id));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
})();
