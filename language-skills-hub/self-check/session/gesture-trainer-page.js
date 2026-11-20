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
  const realistic=params.get('source')==='rl-asteroids';
   const lang=['en','es','de','fr'].includes(params.get('lang'))?params.get('lang'):'en';
   if(realistic){
    // The lock panel is informational; the shared gesture engine measures the
    // ENTIRE lock viewport, so its targets may be outside the panel on desktop.
    guide.textContent=def.guide+' Dotýkejte se celé zamčené obrazovky, nikoli jen rámečku „Test locked“. Body mají na telefonu jinou polohu než na monitoru.';
    launch.textContent='Zobrazit zamčenou obrazovku bez nápovědy';
    const guided=document.getElementById('launchGuidedTrainer');
    guided.hidden=false;
    guided.addEventListener('click',()=>trainer.openTrainer(def.id,
     {realistic:true,guided:true,language:lang}));
   }
   launch.addEventListener('click',()=>{
    if(!realistic){trainer.openTrainer(def.id);return;}
    trainer.openTrainer(def.id,{realistic:true,guided:false,language:lang,onComplete:()=>{
     const message=document.getElementById('gestureSuccess');
     if(message)message.hidden=false;
     launch.textContent='Vyzkoušet znovu';
    }});
   });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
})();
