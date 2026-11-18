'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const c=JSON.parse(read('authoring/plural/content.json'));
const g=JSON.parse(read('authoring/plural/glossary.json'));
const html=read('konverzace/plural/index.html');
const manifest=JSON.parse(read('version.json'));
test('V6 critical grammatical rules correct overly broad claims',()=>{
 assert.match(c.de.levels.B1.rules[1],/Motore/);
 assert.match(c.de.levels.B2.rules[1],/Eigentume/);
 assert.match(c.de.levels.C1.rules[4],/Kontinente/);
 assert.doesNotMatch(c.de.levels.C1.rules[4],/immer \+ \(e\)n/);
});
test('V6 29 DE generic grammar challenges replaced',()=>{
 let count=0;
 for(const lv of ['B1','B2','C1','C2']){
  for(const st of c.de.levels[lv].stations){
   assert.ok(st.grammarTask.length>60);
   assert.doesNotMatch(st.grammarTask,/^Begründe die Pluralbildung bei/);
   count++;
  }
 }
 assert.equal(count,32);
});
test('V6 Epiphany semantics and glossary are aligned',()=>{
 const es=c.es.levels.C2.stations[4].cards[0];
 const fr=c.fr.levels.C2.stations[4].cards[0];
 assert.deepEqual(es.slice(0,2),['la celebración de la Epifanía','las celebraciones de la Epifanía']);
 assert.deepEqual(fr.slice(0,2),["la célébration de l'Épiphanie","les célébrations de l'Épiphanie"]);
 assert.equal(g.recommended.es['la celebración de la epifanía'],'oslava svátku Zjevení Páně');
 assert.equal(g.recommended.fr["la célébration de l'épiphanie"],'oslava svátku Zjevení Páně');
});
test('V6 remains structurally compatible, CSP valid and manifest current',()=>{
 let stations=0,entries=0;
 for(const lang of ['de','es','fr'])for(const lv of ['A1','A2','B1','B2','C1','C2'])for(const st of c[lang].levels[lv].stations){
  assert.equal(st.cards.length,10);
  assert.equal(st.extra.length,3);
  stations++;entries+=13;
 }
 assert.equal(stations,144);assert.equal(entries,1872);
 assert.equal(crypto.createHash('sha256').update(html).digest('hex'),manifest.contentHashes['cl-plural']);
 const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
 assert.equal(inline.length,1);
 const hash=crypto.createHash('sha256').update(inline[0][1]).digest('base64');
 assert.ok(html.includes("'sha256-"+hash+"'"));
});
