'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const stage=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(stage,p),'utf8');
test('R4A QA notebook is linked from online previews, uses only school-org student TEST destinations',()=>{
 const hub=read('nahledy/index.html');
 const html=read('revize/index.html');
 assert.match(hub,/href="\.\.\/revize\/"/);
 assert.match(html,/href="\.\.\/reference\/konverzace\/umela-inteligence\/"/);
 assert.match(html,/konverzace:\{title:'Rodina \(starší kontrolní záznamy\)'/);
 assert.match(html,/nahledy\/cteni\/asteroids\//);
 assert.match(html,/nahledy\/poslech\/matthew-mcconaughey\//);
 assert.match(html,/Ochrana soukromí/);
 assert.match(html,/Kontrolní list referenčních karet/);
 assert.match(read('sw.js'),/'revize\/'/);
});
test('R4A notes are local-only: no server submission, no user-controlled HTML insertion',()=>{
 const html=read('revize/index.html');
 const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 assert.equal(scripts.length,1);
 assert.doesNotThrow(()=>new vm.Script(scripts[0],{filename:'qa-notebook-inline.js'}));
 assert.doesNotMatch(scripts[0],/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|navigator\.send|postMessage|\.innerHTML\s*=/);
 assert.match(scripts[0],/localStorage\.(getItem|setItem)/);
 assert.match(scripts[0],/new Blob\(/);
 assert.match(scripts[0],/confirm\(/);
 assert.match(scripts[0],/\.textContent=/);
 assert.doesNotMatch(html,/type="password"|name="student"/i);
 const choices=html.match(/<select id="level">([\s\S]*?)<\/select>/);
 assert.ok(choices);
 assert.deepEqual([...choices[1].matchAll(/<option(?: selected)?>([A-C][12])<\/option>/g)].map(x=>x[1]),
  ['A1','A2','B1','B2','C1','C2']);
});
