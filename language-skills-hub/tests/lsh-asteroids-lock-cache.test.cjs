'use strict';
/* Regression: stale browser caches must never silently hide the real Asteroids
 * rehearsal after a GitHub Pages release. Other labs remain unchanged. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const release='rl-lock-rehearsal-20261120-8';
const catalogRelease='rl-lock-rehearsal-20261120-8';
test('Asteroids teacher and standalone mobile trainer pin fresh JS and CSS',()=>{
 const reading=read('self-check/reading/teacher.html');
 const mobile=read('self-check/session/gesture-trainer.html');
 const index=read('index.html');
 for(const asset of ['../session/teacher-ux.js','../session/session.css'])
  assert.ok(reading.includes(asset+'?v='+release),'Reading teacher misses '+asset);
 for(const asset of ['teacher-ux.js','session.css','gesture-trainer-page.js'])
  assert.ok(mobile.includes(asset+'?v='+release),'Mobile trainer misses '+asset);
 assert.ok(index.includes('assets/hub.js?v='+catalogRelease),'Catalog JS may be stale');
 const student=read('self-check/reading/index.html');
 const listeningStudent=read('self-check/listening/student.html');
 const listeningTeacher=read('self-check/listening/teacher.html');
 for(const [label,html,asset] of [
  ['Reading teacher',reading,'../session/unlock-gestures.js'],
  ['Reading student',student,'../session/unlock-gestures.js'],
  ['Listening student',listeningStudent,'../session/unlock-gestures.js'],
  ['Listening teacher',listeningTeacher,'../session/unlock-gestures.js'],
  ['QR mobile',mobile,'unlock-gestures.js']
 ])assert.ok(html.includes(asset+'?v='+release),label+' must load the new common recognizer');
 assert.ok(listeningTeacher.includes('../session/teacher-ux.js?v='+release),'Listening teacher must see the new instructions');
 const teacherUX=read('self-check/session/teacher-ux.js');
 assert.ok(teacherUX.includes("target.searchParams.set('rehearsalVersion','"+release+"')"),'Teacher QR must use current rehearsal version');
});
test('only Reading Asteroids TEST navigation pins the new teacher page',()=>{
 const hub=read('assets/hub.js');
 assert.match(hub,/if\(e\.id==='rl-asteroids'\)url\.searchParams\.set\('rehearsalVersion','rl-lock-rehearsal-20261120-8'\)/);
 const teacher=read('self-check/session/teacher-ux.js');
 assert.match(teacher,/new URLSearchParams\(location\.search\)\.get\('topic'\)/);
 assert.match(teacher,/return topic==='rl-asteroids'/);
});
