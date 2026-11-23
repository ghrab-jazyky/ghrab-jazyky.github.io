#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
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
  assert.equal(image.subarray(1,4).toString('ascii'),'PNG');
  assert.equal(image.readUInt32BE(16),n);
  assert.equal(image.readUInt32BE(20),n);
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
 assert.match(html,/<link rel="apple-touch-icon"/);
 assert.match(html,/<script defer src="assets\/pwa-install\.js"/);
 assert.match(html,/<link rel="stylesheet" href="assets\/pwa-install\.css"/);
 assert.match(html,/id="skillChooser"/);
});
test('Consent, timing, and browser install event',()=>{
 const js=read('assets/pwa-install.js');
 for(const value of ['Připomenout za 7 dní','Příště nezobrazovat','beforeinstallprompt','appinstalled',
 'display-mode: standalone','MutationObserver','localStorage','chooser.append(panel)'])
  assert.ok(js.includes(value),value);
 assert.match(js,/panel\.hidden=!visible/);
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
