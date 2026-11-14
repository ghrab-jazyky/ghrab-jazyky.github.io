#!/usr/bin/env node
'use strict';
// R64: leaving the test window and a blocked forbidden action are reported separately.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const pdf=require(path.join(root,'self-check/results/pdf-report.js'));
test('R64 blocked shortcut is its own incident kind in the guard and the attempt core',()=>{
 const ui=fs.readFileSync(path.join(root,'self-check/session/session-ui.js'),'utf8');
 const core=fs.readFileSync(path.join(root,'self-check/session/attempt-core.js'),'utf8');
 assert.match(core,/'blocked-shortcut'\]\);/);
 assert.match(ui,/'print-attempt':'blocked-shortcut'\)/);
 assert.equal((ui.match(/'blocked-shortcut':'/g)||[]).length,4,'reason text in four languages');
});
test('R64 PDF protocol separates leaving the test from blocked actions',()=>{
 const state={startedAt:1000,submittedAt:9000,incidents:[
  {kind:'hidden',at:2000},{kind:'blocked-shortcut',at:3000},{kind:'blocked-shortcut',at:4000},{kind:'context-menu',at:5000}],
  resumptions:[2500,3500,4500,5500],tabMonitoringAvailable:true};
 const security=pdf.securityFromAttempt(state);
 assert.equal(security.events.filter(e=>e.kind==='blocked-shortcut').length,2);
 const text=pdf.securityDetails({security}).join('\n');
 assert.match(text,/Zaznamenané zámky: 4 \(opuštění nebo změna okna testu: 1; zablokované zakázané akce: 3\); zaznamenaná odemčení: 4/);
 assert.match(text,/Zablokovaná klávesová zkratka \(Ctrl\+S, Ctrl\+U nebo F12\)/);
});
