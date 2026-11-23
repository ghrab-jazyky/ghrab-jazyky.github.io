/* LSH install invitation: chooser only, no tracking, test interception or data transfer. */
(()=>{'use strict';
 const chooser=document.getElementById('skillChooser');
 if(!chooser)return;
 const STORAGE_KEY='lsh:pwa-install-choice:v1';
 const WEEK_MS=7*24*60*60*1000;
 const ua=navigator.userAgent||'';
 const ios=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const android=/Android/.test(ua);
 const chromium=/(Chrome|Chromium|Edg|OPR|SamsungBrowser)/.test(ua);
 const safariMac=/Macintosh|Mac OS X/.test(ua)&&/Safari/.test(ua)&&!chromium;
 const compatible=ios||android||chromium||safariMac;
 let deferredPrompt=null,installedThisSession=false,dismissedThisSession=false,helpOpen=false;
 const element=(tag,cls,text)=>{
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(text!==undefined)el.textContent=text;
  return el;
 };
 const panel=element('aside','pwa-offer');
 panel.id='pwaInstallOffer';panel.hidden=true;
 panel.setAttribute('role','region');
 panel.setAttribute('aria-labelledby','pwaOfferTitle');
 const head=element('div','pwa-offer-head');
 const mark=element('span','pwa-offer-mark','↓');mark.setAttribute('aria-hidden','true');
 const heading=element('div','pwa-offer-heading');
 heading.append(element('p','pwa-offer-eyebrow','LANGUAGE SKILLS HUB'));
 const title=element('h3','pwa-offer-title','Měj laboratoře jako aplikaci');
 title.id='pwaOfferTitle';heading.append(title);
 const close=element('button','pwa-offer-close','×');close.type='button';
 close.id='pwaOfferClose';close.setAttribute('aria-label','Připomenout instalaci za 7 dní');
 head.append(mark,heading,close);
 const lead=element('p','pwa-offer-copy','Nainstaluj LSH na počítač nebo telefon a otevři všechny tři laboratoře přímo z plochy.');
 const actions=element('div','pwa-offer-actions');
 const install=element('button','pwa-offer-primary','Nainstalovat aplikaci');
 install.id='pwaOfferInstall';install.type='button';
 const later=element('button','pwa-offer-secondary','Připomenout za 7 dní');
 later.id='pwaOfferLater';later.type='button';
 const never=element('button','pwa-offer-quiet','Příště nezobrazovat');
 never.id='pwaOfferNever';never.type='button';
 const help=element('p','pwa-offer-help');help.id='pwaOfferHelp';help.hidden=true;
 help.setAttribute('role','status');
 const foot=element('p','pwa-offer-foot','Aplikace vyžaduje internet. Testy ani odpovědi neukládáme do offline cache.');
 actions.append(install,later,never);
 panel.append(head,lead,actions,help,foot);
 chooser.append(panel);
 function readPreference(){
  try{
   const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
   if(!data||typeof data!=='object')return null;
   if(data.choice==='never'||data.choice==='installed')return data.choice;
   if(data.choice==='later'&&Number.isFinite(data.until)&&data.until>Date.now())return 'later';
  }catch(_){}
  return null;
 }
 function savePreference(choice){
  const until=choice==='later'?Date.now()+WEEK_MS:0;
  dismissedThisSession=true;
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify({choice,until}));}catch(_){}
  panel.hidden=true;
 }
 function isInstalled(){
  return installedThisSession||navigator.standalone===true||
   (typeof matchMedia==='function'&&matchMedia('(display-mode: standalone)').matches);
 }
 function instructions(){
  if(ios)return 'Na iPhonu nebo iPadu otevři Sdílet a zvol Přidat na plochu. Potvrď Přidat.';
  if(android)return 'Otevři nabídku prohlížeče (⋮) a vyber Nainstalovat aplikaci nebo Přidat na plochu.';
  if(safariMac)return 'V Safari otevři Soubor → Přidat do Docku a potvrď název aplikace.';
  return 'V Chrome nebo Edge otevři nabídku (⋮) a vyber Nainstalovat stránku jako aplikaci. Pokud tuto volbu nevidíš, může být instalace v prohlížeči nedostupná.';
 }
 function update(){
  const visible=!chooser.hidden&&!document.getElementById('welcome').hidden;
  const eligible=compatible||Boolean(deferredPrompt);
  panel.hidden=!visible||!eligible||isInstalled()||dismissedThisSession||Boolean(readPreference());
  install.textContent=deferredPrompt?'Nainstalovat aplikaci':helpOpen?'Skrýt postup':'Jak nainstalovat';
  help.hidden=!helpOpen;
  if(helpOpen)help.textContent=instructions();
 }
 close.addEventListener('click',()=>savePreference('later'));
 later.addEventListener('click',()=>savePreference('later'));
 never.addEventListener('click',()=>savePreference('never'));
 install.addEventListener('click',async()=>{
  if(deferredPrompt){
   const offer=deferredPrompt;deferredPrompt=null;
   try{
    await offer.prompt();
    const selection=await offer.userChoice;
    if(selection?.outcome==='accepted'){
     installedThisSession=true;
     savePreference('installed');
    }else savePreference('later');
   }catch(_){
    helpOpen=true;
    help.textContent=instructions();
    help.hidden=false;
    install.textContent='Skrýt postup';
   }
  }else{
   helpOpen=!helpOpen;
   update();
  }
 });
 window.addEventListener('beforeinstallprompt',event=>{
  if(typeof event.prompt!=='function')return;
  event.preventDefault();
  deferredPrompt=event;
  update();
 });
 window.addEventListener('appinstalled',()=>{
  installedThisSession=true;
  savePreference('installed');
 });
 new MutationObserver(update).observe(chooser,{attributes:true,attributeFilter:['hidden']});
 if(typeof matchMedia==='function'){
  const mode=matchMedia('(display-mode: standalone)');
  if(typeof mode.addEventListener==='function')mode.addEventListener('change',update);
 }
 update();
 // Install the worker only on HTTPS deployments; local HTTP QA stays network-transparent.
 if('serviceWorker' in navigator&&location.protocol==='https:'){
  window.addEventListener('load',()=>{
   navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});
  },{once:true});
 }
})();
