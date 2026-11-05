/* LSH E3D – staging-only PWA registration, no data synchronization. */
(function(){
  'use strict';
  const config=window.LSH_CONFIG;
  if(!config||config.mode!=='staging'||config.basePath!=='/zkusebni/')return;
  if(!location.pathname.startsWith(config.basePath))return;
  const status=document.getElementById('pwaStatus');
  const install=document.getElementById('pwaInstallBtn');
  function say(message){if(status)status.textContent=message;}
  let deferred=null;
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    deferred=event;
    if(install)install.hidden=false;
  });
  if(install)install.addEventListener('click',async()=>{
    if(!deferred)return;
    const prompt=deferred;
    deferred=null;install.hidden=true;
    try{
      await prompt.prompt();
      const choice=await prompt.userChoice;
      if(choice&&choice.outcome!=='accepted')say('Instalaci lze spustit později v nabídce prohlížeče.');
    }catch(_){say('Instalaci se nepodařilo spustit. Použijte nabídku prohlížeče.');}
  });
  window.addEventListener('appinstalled',()=>{
    deferred=null;
    if(install)install.hidden=true;
    say('Aplikace byla nainstalována. Slovníček mezi profily prohlížeče nesynchronizujeme.');
  });
  if(!('serviceWorker' in navigator)||!window.isSecureContext){
    say('Offline režim vyžaduje HTTPS a podporovaný prohlížeč.');
    return;
  }
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register(config.basePath+'sw.js',{
      scope:config.basePath,updateViaCache:'none'
    }).then(()=>navigator.serviceWorker.ready).then(()=>{
      say('Offline základ je připraven. Karty je nutné nejprve otevřít online; dostupnost ověřte v režimu letadlo.');
    }).catch(error=>{
      console.warn('LSH E3D service worker unavailable:',error);
      say('Offline režim se nepodařilo aktivovat. Otevření karet online funguje dále.');
    });
  },{once:true});
})();
