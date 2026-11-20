'use strict';
/* Regression: stale browser caches must never silently hide the real Asteroids
 * rehearsal after a GitHub Pages release. Other labs remain unchanged. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const release='rl-lock-rehearsal-20261120-2';
test('Asteroids teacher and standalone mobile trainer pin fresh JS and CSS',()=>{
 const reading=read('self-check/reading/teacher.html');
 const mobile=read('self-check/session/gesture-trainer.html');
 const index=read('index.html');
 for(const asset of ['../session/teacher-ux.js','../session/session.css'])
  assert.ok(reading.includes(asset+'?v='+release),'Reading teacher misses '+asset);
 for(const asset of ['teacher-ux.js','session.css','gesture-trainer-page.js'])
  assert.ok(mobile.includes(asset+'?v='+release),'Mobile trainer misses '+asset);
 assert.ok(index.includes('assets/hub.js?v='+release),'Catalog JS may be stale');
});
test('only Reading Asteroids TEST navigation pins the new teacher page',()=>{
 const hub=read('assets/hub.js');
 assert.match(hub,/if\(e\.id==='rl-asteroids'\)url\.searchParams\.set\('rehearsalVersion','rl-lock-rehearsal-20261120-2'\)/);
 const teacher=read('self-check/session/teacher-ux.js');
 assert.match(teacher,/new URLSearchParams\(location\.search\)\.get\('topic'\)/);
 assert.match(teacher,/if\(!\/\\\/reading\\\/teacher\\\.html\$\/\.test\(location\.pathname\)\)return false/);
});
