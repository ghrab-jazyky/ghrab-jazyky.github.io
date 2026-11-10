#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(get('data/cards.json'));
const Model=require('../assets/lsh/v3/model.js');
const Store=require('../assets/lsh/v3/store.js');

test('Production vocabulary page loads local assets and contains no staging/PWA links',()=>{
 const html=get('slovnicek/index.html');
 for(const asset of [...html.matchAll(/(?:href|src)="(\.\.\/assets\/[^"]+)"/g)].map(m=>m[1])){
  const absolute=path.resolve(root,'slovnicek',asset);
  assert.ok(fs.existsSync(absolute),'Missing vocabulary asset: '+asset);
 }
 assert.match(html,/<h1>Můj slovníček<\/h1>/);
 assert.match(html,/<link rel="stylesheet" href="\.\.\/assets\/lsh\/v3\/vocab\.css">/);
 assert.match(html,/<script defer src="\.\.\/assets\/lsh\/v3\/vocab\.js"><\/script>/);
 assert.doesNotMatch(html,/zkusebni|TECHNICKÝ PILOT|zkušební E3C|manifest\.webmanifest|pwa\.js|href="\.\.\/vyber\/"/i);
 assert.match(get('index.html'),/href="slovnicek\/">Můj slovníček/);
});

test('Production conversation bridge writes to the real production store',()=>{
 const bridge=get('assets/lsh/v3/card-bridge.js');
 const ui=get('assets/lsh/v3/vocab.js');
 const cfg=get('assets/lsh/v3/config.js');
 assert.match(bridge,/STORE\.createStore\(\{mode:'production'\}\)/);
 assert.doesNotMatch(bridge,/STORE\.createStore\(\{mode:'staging'\}\)/);
 assert.match(bridge,/slovnicek\/\?zpet=/);
 assert.match(ui,/S\.createStore\(\{mode:config\.mode\}\)/);
 assert.match(ui,/index\\\.html/);
 assert.match(cfg,/mode: 'production'/);
 assert.match(cfg,/basePath: '\/language-skills-hub\/'/);
 assert.doesNotMatch(cfg,/zkusebni|lsh-test/i);
});

test('Production and staging stores never mix local words',async()=>{
 const options={indexedDB:null,storage:null,BroadcastChannel:null};
 const prod=Store.createStore({...options,mode:'production'});
 const stage=Store.createStore({...options,mode:'staging'});
 try{
  assert.equal(prod.database,'lsh');
  assert.equal(stage.database,'lsh-test');
  await Promise.all([prod.open(),stage.open()]);
  await stage.saveWord({language:'en',term:'staging-only',translationCs:'jen test',level:'A1'});
  assert.equal((await stage.listWords()).length,1);
  assert.equal((await prod.listWords()).length,0);
  await prod.saveWord({language:'en',term:'production-only',translationCs:'jen produkce',level:'A1'});
  assert.equal((await prod.listWords()).length,1);
  assert.equal((await stage.listWords()).length,1);
  const backup=await prod.exportWords();
  const restored=Model.validateImport(backup);
  assert.equal(restored.length,1);
  assert.equal(restored[0].term,'production-only');
 }finally{prod.close();stage.close();}
});

test('All 21 original conversation cards remain unmodified and use local bridge assets',()=>{
 const items=catalog.entries.filter(x=>x.skill==='konverzace');
 assert.equal(items.length,21);
 for(const entry of items){
  const html=get(entry.relative);
  assert.match(html,/assets\/lsh\/v3\/model\.js/,'Missing model: '+entry.id);
  assert.match(html,/assets\/lsh\/v3\/store\.js/,'Missing store: '+entry.id);
  assert.match(html,/assets\/lsh\/v3\/card-bridge\.js/,'Missing bridge: '+entry.id);
 }
});
