#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

const zlib=require('node:zlib');
function verifyPng(bytes,expectedSize){
 assert.deepEqual(bytes.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));
 assert.equal(bytes.readUInt32BE(16),expectedSize);
 assert.equal(bytes.readUInt32BE(20),expectedSize);
 assert.equal(bytes[24],8,'8-bit PNG required');
 assert.ok([2,3].includes(bytes[25]),'RGB or indexed-color PNG required');
 let position=8,ended=false;
 const data=[];
 while(position+12<=bytes.length){
  const length=bytes.readUInt32BE(position);
  const end=position+8+length;
  assert.ok(end+4<=bytes.length,'PNG chunk must not be truncated');
  const type=bytes.toString('ascii',position+4,position+8);
  let crc=0xffffffff;
  for(let i=position+4;i<end;i++){
   crc^=bytes[i];
   for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  assert.equal((crc^0xffffffff)>>>0,bytes.readUInt32BE(end),'PNG CRC invalid: '+type);
  if(type==='IDAT')data.push(bytes.subarray(position+8,end));
  position=end+4;
  if(type==='IEND'){ended=true;break;}
 }
 assert.ok(ended,'PNG must contain IEND');
 assert.equal(position,bytes.length,'PNG must not include trailing incomplete data');
 const pixels=zlib.inflateSync(Buffer.concat(data));
 assert.equal(pixels.length,expectedSize*(1+expectedSize*(bytes[25]===2?3:1)),'PNG raster must decompress fully');
}

test('Scoped installable PWA manifest and image files',()=>{
 const manifest=JSON.parse(read('manifest.webmanifest'));
 assert.equal(manifest.id,'/language-skills-hub/');
 assert.equal(manifest.scope,'/language-skills-hub/');
 assert.equal(manifest.start_url,'/language-skills-hub/');
 assert.equal(manifest.display,'standalone');
 for(const n of [192,512]){
  const icon=manifest.icons.find(icon=>icon.sizes===n+'x'+n);
  assert.ok(icon,'missing icon '+n);
  assert.equal(icon.type,'image/png');
  const image=fs.readFileSync(path.join(root,icon.src));
  verifyPng(image,n);
 }
 assert.deepEqual(manifest.shortcuts.map(x=>x.url),[
  '/language-skills-hub/?skill=konverzace',
  '/language-skills-hub/?skill=cteni',
  '/language-skills-hub/?skill=poslech'
 ]);
});
test('Installation code linked only into the catalog',()=>{
 const html=read('index.html');
 assert.match(html,/<link rel="manifest" href="\.\/manifest\.webmanifest">/);
 const csp=html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
 assert.ok(csp,'CSP declaration missing');
 assert.match(csp[1],/default-src 'none'/,'strict default policy must remain intact');
 assert.match(csp[1],/manifest-src 'self'/,'same-origin PWA manifest must be allowed');
 assert.ok(html.indexOf('<meta http-equiv="Content-Security-Policy"')<
  html.indexOf('<link rel="manifest"'),
  'CSP must be active before any manifest fetch');

 assert.match(html,/<link rel="apple-touch-icon"/);
 assert.match(html,/<script defer src="assets\/pwa-install\.js\?v=pwa-installability-20261123"/);
 assert.match(html,/pwa-install\.js\?v=pwa-installability-20261123/);
 assert.match(html,/pwa-install\.css\?v=pwa-recovery-20261123/);
 assert.match(html,/<link rel="stylesheet" href="assets\/pwa-install\.css\?v=pwa-recovery-20261123"/);
 assert.match(html,/id="skillChooser"/);
});
test('Consent, timing, and browser install event',()=>{
 const js=read('assets/pwa-install.js');
 const css=read('assets/pwa-install.css');
 for(const value of ['Připomenout za 7 dní','Příště nezobrazovat','beforeinstallprompt','appinstalled',
 'display-mode: standalone','MutationObserver','localStorage',"chooser.append(panel)"])
  assert.ok(js.includes(value),value);
 assert.match(js,/panel\.hidden=!visible/);
 assert.match(js,/install\.disabled=panel\.hidden/);
 assert.match(js,/const dock=available<192/);
 assert.match(js,/chooser\.addEventListener\('scroll',scheduleLayout/);
 assert.match(js,/--pwa-overlay-scroll/);
 assert.match(css,/--pwa-overlay-scroll/);
 assert.doesNotMatch(js,/Přímá instalace nedostupná/);
 assert.match(js,/Instalovat přes nabídku prohlížeče/);
 assert.match(js,/helpOpen=!helpOpen/);
 assert.match(js,/navigator\.install\(\)/);
 assert.match(js,/const outcome=await event\.prompt\(\)/);
 assert.match(css,/position:fixed/);
 assert.match(css,/\.skill-chooser\.pwa-install-docked/);
 assert.match(css,/\.pwa-offer--docked/);
 assert.doesNotMatch(css,/grid-template-areas/);
 assert.match(js,/chooser\.append\(panel\)/);
 assert.match(js,/url\.searchParams\.get\('pwa'\)!=='reset'/);
 assert.match(js,/localStorage\.removeItem\(STORAGE_KEY\)/);
 assert.match(js,/history\.replaceState\(history\.state/);
 assert.match(js,/chooser\.scrollTop=0/);
 assert.match(js,/panel\.hidden=!visible\|\|isInstalled\(\)/);
 assert.match(js,/location\.protocol==='https:'/,'Worker must remain disabled on local HTTP browser-QA origin');
 assert.match(js,/savePreference\('never'\)/);
 assert.match(js,/savePreference\('later'\)/);
 assert.doesNotMatch(js,/XMLHttpRequest|sendBeacon|postMessage\(/);
});
test('No offline caches and no test traffic interception',()=>{
 const js=read('sw.js');
 assert.doesNotMatch(js,/\bcaches\s*\.|\bcache\.put\s*\(|\bcache\.add/);
 assert.match(js,/event\.request\.mode!=='navigate'/);
 assert.match(js,/url\.pathname===home\.pathname/);
 assert.match(js,/event\.respondWith\(fetch\(event\.request\)\)/);
 assert.doesNotMatch(js,/\.\/self-check\/|\.\/cteni\/|\.\/poslech\/|\.\/konverzace\//);
});

test('Teacher announcement describes the PWA and the already-listed City Quest without deleting history',()=>{
 const api=require('../assets/whats-new-data.js');
 const news=JSON.parse(read('data/teacher-changelog.json'));
 const cards=JSON.parse(read('data/cards.json'));
 assert.equal(api.valid(news),true,'changelog must satisfy the reader-side contract');
 assert.equal(news.latestAnnouncementSequence,10);
 assert.deepEqual(news.releases.slice(0,4).map(r=>r.id),[
  'lsh-2026-11-28-asteroids-smart-feedback','lsh-2026-11-27-christmas-quest-preview','lsh-2026-11-23-pwa-installation','lsh-2026-11-23-city-quest'
 ]);
 assert.deepEqual(news.releases.slice(4).map(r=>r.sequence),[6,5,4,3,2,1]);
 const pwa=news.releases[2].changes[0];
 assert.match(pwa.description,/sedm dní/);
 assert.match(pwa.description,/iPhonu/);
 const city=news.releases[3].changes[0];
 assert.match(city.title,/City Quest/);
 const entry=cards.entries.find(x=>x.id==='cl-city-quest-f2');
 assert.ok(entry,'City Quest must exist in the public catalog');
 assert.equal(entry.skill,'konverzace');
 assert.deepEqual(entry.languages,['en','es','de','fr']);
 assert.deepEqual(entry.levels,['A1','A2','B1','B2','C1','C2']);
 assert.ok(fs.existsSync(path.join(root,entry.relative)));
});


test('Premium LSH PWA icons are freshly versioned, sharp, platform-safe and editable',()=>{
 const manifest=JSON.parse(read('manifest.webmanifest'));
 assert.deepEqual(manifest.icons,[
  {src:'assets/icons/icon-192-v2.png',sizes:'192x192',type:'image/png',purpose:'any'},
  {src:'assets/icons/icon-512-v2.png',sizes:'512x512',type:'image/png',purpose:'any'},
  {src:'assets/icons/icon-maskable-512-v2.png',sizes:'512x512',type:'image/png',purpose:'maskable'}
 ]);
 verifyPng(fs.readFileSync(path.join(root,'assets/icons/icon-maskable-512-v2.png')),512);
 verifyPng(fs.readFileSync(path.join(root,'assets/icons/apple-touch-icon-180-v2.png')),180);
 const source=read('assets/icons/lsh-logo.svg');
 const maskSource=read('assets/icons/lsh-logo-maskable.svg');
 assert.match(source,/<svg[^>]+viewBox="0 0 1000 1000"/);
 assert.match(source,/<path d="/,'letterforms must be vector paths, not browser-rendered fonts');
 assert.doesNotMatch(source,/<text|<image|<script/);
 assert.match(maskSource,/scale\(\.75\)/,'maskable artwork must stay inside safe area');
 const html=read('index.html');
 assert.match(html,/apple-touch-icon-180-v2\.png/);
 assert.match(html,/icon-192-v2\.png/);
 assert.doesNotMatch(html,/href="assets\/icons\/icon-192\.png"/);
});
