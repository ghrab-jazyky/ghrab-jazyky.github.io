/* LSH E3D: restricted /zkusebni/ shell cache. No user data or remote URLs. */
'use strict';
const CACHE_PREFIX='lsh-e3d-shell-';
const CACHE_NAME=CACHE_PREFIX+'2026-11-06-v4';
const BASE=new URL(self.registration.scope);
const SHELL=[
  '', 'index.html', 'offline.html', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png',
  'konverzace/', 'cteni/', 'poslech/', 'vyber/', 'slovnicek/', 'k/', 'nahledy/',
  'data/manifest.json','data/editorial-inventory.json',
  'assets/lsh/v2/config.js','assets/lsh/v2/core.js',
  'assets/lsh/v2/qr.js','assets/lsh/v2/app.js','assets/lsh/v2/styles.css',
  'assets/lsh/v3/model.js','assets/lsh/v3/store.js',
  'assets/lsh/v3/vocab.js','assets/lsh/v3/vocab.css',
  'assets/lsh/v3/pwa.js','assets/lsh/v3/qr-scanner.js',
  'assets/lsh/v3/qr-scanner.css',
  'assets/lsh/v3/inventory.js','assets/lsh/v3/inventory.css'
];
function scopedURL(relative){return new URL(relative,BASE).href;}
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL.map(scopedURL))));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const name of await caches.keys()){
      if(name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
  if(url.pathname.includes('/api/')||url.pathname.includes('/private/'))return;
  event.respondWith((async()=>{
    try {
      const response=await fetch(request);
      if(response&&response.ok&&response.type==='basic'){
        const cache=await caches.open(CACHE_NAME);
        try{await cache.put(request,response.clone());}catch(_){/* quota: network response still works */}
      }
      return response;
    } catch(_) {
      const cached=await caches.match(request,{ignoreSearch:request.mode==='navigate'});
      if(cached)return cached;
      if(request.mode==='navigate'){
        const fallback=await caches.match(scopedURL('offline.html'));
        if(fallback)return fallback;
      }
      return Response.error();
    }
  })());
});
