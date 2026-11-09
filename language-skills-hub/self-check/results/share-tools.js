/* Local same-origin QR and sharing. No external request, accounts, or tracking. */
(function(host){
 'use strict';
 function render(url,mount,downloadButton){
  mount.replaceChildren();
  downloadButton.disabled=true;
  if(!url)return false;
  try{
   if(!host.CLBQRCode||typeof host.CLBQRCode.svg!=='function)
    throw new Error('QR module not available');
   const svg=host.CLBQRCode.svg(url);
   if(!svg||svg.nodeName.toLowerCase()!=='svg')throw new Error('Invalid SVG');
   svg.setAttribute('aria-label','QR kód pro studentskou aktivitu');
   mount.appendChild(svg);
   downloadButton.disabled=false;
   return true;
  }catch(_){
   const p=document.createElement('p');
   p.textContent='QR kód se nepodařilo vytvořit. Úplný studentský odkaz je stále možné zkopírovat.';
   mount.appendChild(p);return false;
  }
 }
 async function copy(url,field,status){
  if(!url)return false;
  try{
   if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
   await navigator.clipboard.writeText(url);
   status.textContent='Studentský odkaz byl zkopírován.';
   return true;
  }catch(_){
   field.focus();field.select();
   status.textContent='Kopírování se nepodařilo. Označený odkaz zkopíruj ručně přes Ctrl+C nebo nabídku telefonu.';
   return false;
  }
 }
 function download(mount,status,filename){
  const svg=mount.querySelector('svg');
  if(!svg)return false;
  try{
   const xml=new XMLSerializer().serializeToString(svg);
   const blob=new Blob([xml],{type:'image/svg+xml;charset=utf-8'});
   const url=URL.createObjectURL(blob);
   const link=document.createElement('a');
   link.href=url;
   link.download=filename||'language-skills-hub-test-qr.svg';
   document.body.appendChild(link);
   link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   status.textContent='QR kód byl nabídnut ke stažení.';
   return true;
  }catch(_){
   status.textContent='QR se nepodařilo stáhnout. Zkopíruj studentský odkaz.';
   return false;
  }
 }
 const api=Object.freeze({render,copy,download});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else host.LSHShareTools=api;
})(typeof window!=='undefined'?window:this);
