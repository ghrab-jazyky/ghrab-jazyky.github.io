/* LSH PWA install UX: independent viewport-corner offer, never inside chooser panel. */
(()=>{'use strict';
 const chooser=document.getElementById('skillChooser');
 const chooserPanel=chooser?.querySelector('.chooser-panel');
 const welcome=document.getElementById('welcome');
 if(!chooser||!chooserPanel||!welcome)return;
 const STORAGE_KEY='lsh:pwa-install-choice:v1';
 const WEEK_MS=7*24*60*60*1000;
 const ua=navigator.userAgent||'';
 const ios=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const android=/Android/.test(ua);
 const chromium=/(Chrome|Chromium|Edg|OPR|SamsungBrowser)/.test(ua);
 const safariMac=/Macintosh|Mac OS X/.test(ua)&&/Safari/.test(ua)&&!chromium;
 const manualOnly=ios||safariMac||(android&&!chromium);
 const compatible=ios||android||chromium||safariMac;
 let deferredPrompt=null,installedThisSession=false,dismissedThisSession=false,helpOpen=false;
 let installBusy=false,layoutFrame=0;
 const make=(tag,cls,copy)=>{
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(copy!==undefined)el.textContent=copy;
  return el;
 };
 const panel=make('aside','pwa-offer');
 panel.id='pwaInstallOffer';panel.hidden=true;
 panel.setAttribute('role','region');
 panel.setAttribute('aria-labelledby','pwaOfferTitle');
 const head=make('div','pwa-offer-head');
 const mark=make('span','pwa-offer-mark','↓');mark.setAttribute('aria-hidden','true');
 const heading=make('div','pwa-offer-heading');
 heading.append(make('p','pwa-offer-eyebrow','LANGUAGE SKILLS HUB'));
 const title=make('h3','pwa-offer-title','LSH jako aplikace');
 title.id='pwaOfferTitle';heading.append(title);
 const close=make('button','pwa-offer-close','×');close.type='button';
 close.id='pwaOfferClose';close.setAttribute('aria-label','Připomenout instalaci za 7 dní');
 head.append(mark,heading,close);
 const lead=make('p','pwa-offer-copy','Otevři všechny tři laboratoře z plochy počítače nebo telefonu.');
 const actions=make('div','pwa-offer-actions');
 const install=make('button','pwa-offer-primary','Nainstalovat LSH');
 install.id='pwaOfferInstall';install.type='button';
 const later=make('button','pwa-offer-secondary','Připomenout za 7 dní');
 later.id='pwaOfferLater';later.type='button';
 const never=make('button','pwa-offer-quiet','Příště nezobrazovat');
 never.id='pwaOfferNever';never.type='button';
 const help=make('p','pwa-offer-help');help.id='pwaOfferHelp';help.hidden=true;
 help.setAttribute('role','status');
 const foot=make('p','pwa-offer-foot','Provoz vyžaduje internet; testy se neukládají offline.');
 actions.append(install,later,never);
 panel.append(head,lead,actions,help,foot);
 // Direct child of the full-screen chooser, outside the "Co dnes potřebuješ?" card.
 chooser.append(panel);
 const hasWebInstall=()=>typeof navigator.install==='function';
 const canPrompt=()=>hasWebInstall()||Boolean(deferredPrompt);
 function readPreference(){
  try{
   const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
   if(!data||typeof data!=='object')return null;
   if(data.choice==='never'||data.choice==='installed')return data.choice;
   if(data.choice==='later'&&Number.isFinite(data.until)&&data.until>Date.now())return 'later';
  }catch(_){}
  return null;
 }
 function positionOffer(){
  if(panel.hidden){
   chooser.classList.remove('pwa-install-docked');
   panel.classList.remove('pwa-offer--docked');
   chooser.style.removeProperty('--pwa-offer-space');
   panel.style.removeProperty('width');
   panel.style.removeProperty('--pwa-overlay-scroll');
   return;
  }
  // Backdrop-filter on the scrolling chooser changes fixed-position containing blocks.
  // Compensate for the chooser's scroll offset to keep the banner in the viewport corner.
  panel.style.setProperty('--pwa-overlay-scroll',chooser.scrollTop+'px');
  const bounds=chooserPanel.getBoundingClientRect();
  const available=Math.max(0,document.documentElement.clientWidth-bounds.right-24);
  const dock=available<192;
  chooser.classList.toggle('pwa-install-docked',dock);
  panel.classList.toggle('pwa-offer--docked',dock);
  if(dock){
   panel.style.removeProperty('width');
   chooser.style.setProperty('--pwa-offer-space',Math.ceil(panel.getBoundingClientRect().height+24)+'px');
  }else{
   chooser.style.removeProperty('--pwa-offer-space');
   panel.style.width=Math.min(330,available)+'px';
  }
 }
 function scheduleLayout(){
  if(layoutFrame)return;
  layoutFrame=requestAnimationFrame(()=>{layoutFrame=0;positionOffer()});
 }
 function savePreference(choice){
  dismissedThisSession=true;
  const until=choice==='later'?Date.now()+WEEK_MS:0;
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify({choice,until}));}catch(_){}
  panel.hidden=true;
  scheduleLayout();
 }
 function isInstalled(){
  return installedThisSession||navigator.standalone===true||
   (typeof matchMedia==='function'&&matchMedia('(display-mode: standalone)').matches);
 }
 function manualInstructions(){
  if(ios)return 'V prohlížeči otevři Sdílet → Přidat na plochu. Povol Otevřít jako webovou aplikaci a potvrď Přidat.';
  if(safariMac)return 'V Safari otevři Soubor → Přidat do Docku a potvrď.';
  if(android)return 'Otevři nabídku prohlížeče a zvol Nainstalovat aplikaci nebo Přidat na plochu.';
  return 'Instalace je dostupná pouze přes nabídku prohlížeče.';
 }
 function update(){
  const visible=!chooser.hidden&&!welcome.hidden;
  const eligible=compatible||canPrompt();
  panel.hidden=!visible||!eligible||isInstalled()||dismissedThisSession||Boolean(readPreference());
  const direct=canPrompt();
  install.textContent=direct?'Nainstalovat LSH':
   manualOnly?(ios?'Přidat na plochu':safariMac?'Přidat do Docku':'Přidat na plochu'):
   'Přímá instalace nedostupná';
  install.disabled=panel.hidden||installBusy||(!direct&&!manualOnly);
  for(const button of [later,never,close])button.disabled=panel.hidden||installBusy;
  if(helpOpen&&manualOnly){
   help.hidden=false;help.textContent=manualInstructions();
  }else if(!direct&&!manualOnly){
   help.hidden=panel.hidden;
   help.textContent='Prohlížeč zatím nenabídl přímou instalaci. Jakmile ji umožní, tlačítko se aktivuje.';
  }else help.hidden=true;
  scheduleLayout();
 }
 close.addEventListener('click',()=>savePreference('later'));
 later.addEventListener('click',()=>savePreference('later'));
 never.addEventListener('click',()=>savePreference('never'));
 install.addEventListener('click',async()=>{
  if(installBusy)return;
  if(!canPrompt()){
   if(manualOnly){helpOpen=!helpOpen;update();}
   return;
  }
  installBusy=true;
  install.disabled=true;
  try{
   if(hasWebInstall()){
    // Browser-controlled consent dialog, invoked directly from the click gesture.
    await navigator.install();
    installedThisSession=true;
    savePreference('installed');
   }else{
    const event=deferredPrompt;deferredPrompt=null;
    // No intermediate in-page instructions: open native browser install prompt now.
    const outcome=await event.prompt();
    const selection=outcome?.outcome?outcome:await event.userChoice;
    if(selection?.outcome==='accepted'){
     installedThisSession=true;
     savePreference('installed');
    }else savePreference('later');
   }
  }catch(_){
   // Unsupported/denied install: do not pretend it succeeded.
   helpOpen=false;
   help.hidden=false;
   help.textContent='Prohlížeč instalaci neumožnil. Lze ji případně spustit z jeho nabídky.';
  }finally{
   installBusy=false;
   update();
  }
 });
 window.addEventListener('beforeinstallprompt',event=>{
  if(typeof event.prompt!=='function')return;
  event.preventDefault();deferredPrompt=event;
  update();
 });
 window.addEventListener('appinstalled',()=>{
  installedThisSession=true;savePreference('installed');
 });
 new MutationObserver(update).observe(chooser,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('resize',scheduleLayout,{passive:true});
 chooser.addEventListener('scroll',scheduleLayout,{passive:true});
 if(typeof ResizeObserver==='function'){
  const observer=new ResizeObserver(scheduleLayout);
  observer.observe(chooserPanel);observer.observe(panel);
 }
 if(typeof matchMedia==='function'){
  const mode=matchMedia('(display-mode: standalone)');
  if(typeof mode.addEventListener==='function')mode.addEventListener('change',update);
 }
 update();
 // Preserve the existing network-only worker; never intercept students' test routes.
 if('serviceWorker' in navigator&&location.protocol==='https:'){
  window.addEventListener('load',()=>{
   navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});
  },{once:true});
 }
})();
