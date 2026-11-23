/* Network-only PWA worker. Never cache tests, answers, media, PDFs or catalog data. */
'use strict';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||event.request.mode!=='navigate')return;
 const url=new URL(event.request.url);
 const home=new URL(self.registration.scope);
 // Only the catalog landing route is passed through; all test routes bypass SW.
 if(url.origin===home.origin&&url.pathname===home.pathname){
  event.respondWith(fetch(event.request));
 }
});
