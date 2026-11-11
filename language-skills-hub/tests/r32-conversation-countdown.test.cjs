#!/usr/bin/env node
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8'));
const cards=catalog.entries.filter(e=>e.skill==='konverzace');
const css=fs.readFileSync(path.join(root,'assets/lsh/v3/card-bridge.css'),'utf8');

test('All 21 conversation cards use the same CSS bridge, mobile timer and UI lock',()=>{
 assert.equal(cards.length,21);
 for(const card of cards){
  const html=fs.readFileSync(path.join(root,card.relative),'utf8');
  assert.match(html,/href="\.\.\/\.\.\/assets\/lsh\/v3\/card-bridge\.css"/,card.relative);
  assert.match(html,/src="\.\.\/\.\.\/assets\/lsh\/v2\/lock\.js"/,card.relative);
  for(const id of ['timerDock','timerPanel','timerFloatToggle','timerStart','timerReset','timerEditor']){
   assert.match(html,new RegExp('id="'+id+'"'),card.relative+' missing '+id);
  }
  assert.match(html,/mobile-expanded/,card.relative);
  assert.deepEqual(card.levels,['A1','A2','B1','B2','C1','C2']);
 }
});

test('Mobile countdown override is scoped, anchored and print-safe',()=>{
 assert.match(css,/@media screen and \(max-width:650px\), screen and \(max-height:550px\) and \(pointer:coarse\)/);
 assert.match(css,/\.station-head \.timer-panel\s*\{\s*position:fixed/);
 assert.match(css,/\.station-head \.timer-panel\.mobile-expanded\s*\{\s*position:fixed/);
 assert.match(css,/safe-area-inset-right/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(css,/max-height:calc\(100dvh/);
 assert.doesNotMatch(css,/\.station-head \.timer-panel\s*\{[^}]*!important/s);
});

test('Sharing routes remain independent of catalog filters and fixed mode remains UI-only',()=>{
 const hub=fs.readFileSync(path.join(root,'assets/hub.js'),'utf8');
 const lock=fs.readFileSync(path.join(root,'assets/lsh/v2/lock.js'),'utf8');
 assert.match(hub,/if\(mode==='free'\)return url\.href/);
 for(const fragment of ["url.searchParams.set('practice','1')","url.searchParams.set('lang',language)","url.searchParams.set('level',level)","url.searchParams.set('zamek','1')"]){
  assert.ok(hub.includes(fragment),fragment);
 }
 assert.match(lock,/langSelect\.disabled = true/);
 assert.match(lock,/buttons\.forEach\(b => \{ b\.disabled = true/);
});
