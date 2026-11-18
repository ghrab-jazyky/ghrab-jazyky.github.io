'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const content=JSON.parse(fs.readFileSync(path.join(root,'authoring/plural/content.json'),'utf8'));
const glossary=JSON.parse(fs.readFileSync(path.join(root,'authoring/plural/glossary.json'),'utf8'));
const approval=JSON.parse(fs.readFileSync(path.join(root,'authoring/plural/editorial_approval.json'),'utf8'));
const levels=['A1','A2','B1','B2','C1','C2'];
test('V6 has 144 coherent stations and 1,872 complete items; no within-station duplicated headword',()=>{
 let stations=0,items=0;
 for(const lang of ['de','es','fr'])for(const lev of levels){
  assert.equal(content[lang].levels[lev].stations.length,8);
  for(const st of content[lang].levels[lev].stations){
   assert.equal(st.cards.length,10);
   assert.equal(st.extra.length,3);
   assert.equal(new Set(st.cards.map(c=>c[0].toLocaleLowerCase())).size,10);
   for(const card of st.cards){assert.equal(card.length,4);assert.ok(card.every(x=>String(x).trim().length>0));}
   for(const card of st.extra){assert.equal(card.length,5);assert.ok(card[4].length>20);}
   items+=13;stations++;
  }
 }
 assert.equal(stations,144);assert.equal(items,1872);
});
test('V6 higher-level ES/FR has 64 individualized station instructions',()=>{
 let count=0;
 for(const lang of ['es','fr'])for(const lev of ['B1','B2','C1','C2']){
  const prompts=new Set();
  for(const st of content[lang].levels[lev].stations){
   assert.ok(st.main.length>75);
   assert.ok(st.main.includes('«')&&st.main.includes('»'));
   assert.ok(!prompts.has(st.main));
   prompts.add(st.main);count++;
  }
 }
 assert.equal(count,64);
});
test('V6 German EXTRA categories are explicit, and CEFR critical source repairs remain',()=>{
 let count=0;
 for(const lev of levels)for(const st of content.de.levels[lev].stations)for(const extra of st.extra){assert.ok(extra[3].trim());count++;}
 assert.equal(count,144);
 assert.match(content.de.levels.C1.rules[4],/Kontinente/);
 assert.match(content.de.levels.B1.rules[1],/Motore/);
 assert.match(content.de.levels.B2.rules[1],/Eigentume/);
 assert.match(content.fr.levels.C2.stations[7].cards[1][1],/grandes orgues/);
 assert.equal(content.fr.levels.A1.stations[2].extra[2][0],'le pois');
 assert.equal(content.es.levels.A2.stations[7].extra[2][0],'la afición');
 assert.equal(glossary.recommended.fr['le beau-fils'],'zeť; nevlastní syn');
});
test('Editorial gate remains locked until independent QA and owner release authorization',()=>{
 assert.equal(approval.status,'NO_GO');
 assert.equal(approval.release_authorized,false);
 assert.deepEqual(Object.values(approval.gates),[false,false,false,false]);
});
