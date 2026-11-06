/* LSH E3D native local QR scanner. Never opens untrusted QR destinations. */
(function(root,factory){
  'use strict';
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',api.init,{once:true});
  else api.init();
})(typeof window!=='undefined'?window:this,function(root){
  'use strict';
  const CODE=/^([A-HJKMNP-Z2-9]{4})(?:-(EN|ES|DE|FR)(A1|A2|B1|B2|C1|C2)(Z)?)?$/;
  const CORE=typeof module!=='undefined'&&module.exports ? require('../v2/core.js') : root.LSH_CORE;
  function scanTarget(raw,origin,basePath,manifest){
    if(typeof raw!=='string'||raw.length>1300||!Array.isArray(manifest&&manifest.topics))return null;
    const value=raw.trim(),code=CODE.exec(value.toUpperCase());
    if(code){
      const entry=manifest.topics.find(t=>t.shortCode===code[1]);
      if(!entry||!CORE||!CORE.isEntryShareable(entry,manifest))return null;
      const lang=code[2]?code[2].toLowerCase():null,level=code[3]||null;
      if(lang&&!entry.variants.some(v=>v.lang===lang&&v.level===level))return null;
      return {kind:'code',value:value.toUpperCase()};
    }
    let url;
    try{url=new URL(value);}catch(_){return null;}
    if(url.origin!==origin||url.username||url.password||url.hash)return null;
    if(!/^\/(?:[a-z0-9-]+\/)*$/.test(basePath)||!url.pathname.startsWith(basePath))return null;
    const relative=url.pathname.slice(basePath.length);
    if(!/^(?:konverzace|cteni|poslech)\/[a-z0-9-]+\/$/.test(relative))return null;
    const entry=manifest.topics.find(t=>t.cardPath===relative);
    if(!entry||!CORE||!CORE.isEntryShareable(entry,manifest))return null;
    const params=url.searchParams;
    const allowed=new Set(['lang','level','zamek']);
    for(const key of params.keys())if(!allowed.has(key)||params.getAll(key).length!==1)return null;
    if(params.has('zamek')&&params.get('zamek')!=='1')return null;
    if(params.has('lang')!==params.has('level'))return null;
    if(params.has('lang')&&!entry.variants.some(v=>v.lang===params.get('lang')&&v.level===params.get('level')))return null;
    return {kind:'url',value:url.href};
  }
  function init(){
    const open=document.getElementById('openScanner');
    const dialog=document.getElementById('scanDialog');
    const video=document.getElementById('scanVideo');
    const close=document.getElementById('closeScanner');
    const status=document.getElementById('scanStatus');
    if(!open||!dialog||!video||!close||!status)return;
    const config=window.LSH_CONFIG;
    const supported=!!(window.isSecureContext&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.BarcodeDetector&&config&&config.basePath==='/zkusebni/');
    if(!supported){
      open.disabled=true;
      status.textContent='Čtení QR kamerou není v tomto prohlížeči dostupné. Použijte běžný fotoaparát telefonu nebo zadejte krátký kód ručně.';
      const hint=document.getElementById('scannerHelp');
      if(hint)hint.textContent=status.textContent;
      return;
    }
    let stream=null,active=false,timer=null,detector=null,manifestPromise=null;
    const setStatus=text=>{status.textContent=text;};
    function stop(){
      active=false;
      if(timer!==null){clearTimeout(timer);timer=null;}
      if(stream){for(const track of stream.getTracks())track.stop();stream=null;}
      video.srcObject=null;
    }
    async function readManifest(){
      if(!manifestPromise)manifestPromise=fetch(config.basePath+'data/manifest.json',{cache:'no-store'})
        .then(r=>{if(!r.ok)throw new Error('Manifest unavailable');return r.json();});
      return manifestPromise;
    }
    async function tick(){
      if(!active)return;
      try{
        if(video.readyState>=2){
          const results=await detector.detect(video);
          for(const hit of results){
            const m=await readManifest();
            const target=scanTarget(hit.rawValue,location.origin,config.basePath,m);
            if(!target){setStatus('QR kód není platnou kartou tohoto testovacího rozcestníku.');continue;}
            stop();dialog.close();
            if(target.kind==='code'){
              const input=document.getElementById('codeInput'),form=document.getElementById('codeForm');
              if(input&&form){input.value=target.value;if(form.requestSubmit)form.requestSubmit();else form.querySelector('[type="submit"]').click();}
            }else location.assign(target.value);
            return;
          }
        }
      }catch(error){console.warn('LSH E3D QR scan:',error);setStatus('QR se nepodařilo přečíst. Můžete zadat krátký kód ručně.');}
      if(active)timer=setTimeout(tick,250);
    }
    async function start(){
      if(active)return;
      dialog.showModal();
      setStatus('Žádáme o povolení kamery. Obraz zůstává pouze v tomto zařízení.');
      try{
        stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
        video.srcObject=stream;
        await video.play();
        if(typeof BarcodeDetector.getSupportedFormats==='function'){
          const formats=await BarcodeDetector.getSupportedFormats();
          if(!formats.includes('qr_code'))throw new Error('QR format not supported');
        }
        detector=new BarcodeDetector({formats:['qr_code']});
        active=true;setStatus('Namiřte kameru na QR kód vytvořený Language Skills Hub.');tick();
      }catch(error){
        console.warn('LSH E3D camera unavailable:',error);
        stop();setStatus('Kamera nebo rozpoznávání QR nejsou dostupné. Použijte běžný fotoaparát či krátký kód.');
      }
    }
    open.addEventListener('click',start);
    close.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',stop);
    window.addEventListener('pagehide',stop);
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)dialog.close();});
  }
  return Object.freeze({scanTarget,init});
});
