#!/usr/bin/env node
'use strict';
// Regression: restaurant conversation prompts must invite meaningful exchanges.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const html=fs.readFileSync(path.join(__dirname,'../konverzace/jidlo-piti-restaurace/index.html'),'utf8');
const match=html.match(/^const CONTENT = (.+);$/m);
assert.ok(match,'CONTENT literal must be present');
const content=JSON.parse(match[1]);
const langs=['en','es','de','fr'],levels=['A1','A2','B1','B2','C1','C2'];
const expected={
 en:{a1:'How do you ask for a pizza and a glass of water?',a2:'What time would you like to go, and why?',b1:'How can you find out how an unfamiliar dish is prepared?'},
 es:{a1:'¿Cómo pides una pizza y un vaso de agua?',a2:'¿A qué hora quieres ir y por qué?',b1:'¿Cómo puedes averiguar cómo se prepara un plato que no conoces?'},
 de:{a1:'Wie bestellst du eine Pizza und ein Glas Wasser?',a2:'Um wie viel Uhr möchtest du hingehen und warum?',b1:'Wie kannst du herausfinden, wie ein unbekanntes Gericht zubereitet wird?'},
 fr:{a1:'Comment commandes-tu une pizza et un verre d’eau ?',a2:'À quelle heure veux-tu y aller et pourquoi ?',b1:'Comment peux-tu savoir comment on prépare un plat que tu ne connais pas ?'}
};
test('four language versions preserve six levels and eight well-formed stations',()=>{
 assert.deepEqual(Object.keys(content).sort(),langs.slice().sort());
 for(const lang of langs)for(const level of levels){
  const stations=content[lang].levels[level].stations;
  assert.equal(stations.length,8,lang+' '+level);
  stations.forEach((station,i)=>{
   assert.equal(station.questions.length,3,lang+' '+level+' '+i);
   assert.equal(station.support.length,3,lang+' '+level+' '+i);
   for(const item of [station.main,...station.questions,...station.support,station.challenge,station.stretch])
    assert.ok(typeof item==='string'&&item.trim(),lang+' '+level+' '+i+' empty content');
  });
 }
});
test('A1/A2/B1 restaurant tasks have distinct meaningful follow-up questions in every language',()=>{
 for(const lang of langs){
  const a1=content[lang].levels.A1.stations[5];
  const a2=content[lang].levels.A2.stations[4];
  const b1=content[lang].levels.B1.stations[4];
  assert.equal(a1.questions[0],expected[lang].a1,lang+' A1/6');
  assert.equal(a2.questions[0],expected[lang].a2,lang+' A2/5');
  assert.equal(b1.questions[0],expected[lang].b1,lang+' B1/5');
  assert.equal(a2.questions.length,3);
  assert.equal(a2.support.length,3);
  assert.ok(a2.challenge.trim()&&a2.stretch.trim());
  assert.equal(new Set(a2.questions).size,3,lang+' A2 questions overlap');
  assert.doesNotMatch(a2.questions[0],/how many|for how many|cuántas personas|wie viele personen|combien de personnes/i);
 }
});
test('single inline script has matching CSP SHA-256 hash',()=>{
 const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
 assert.equal(scripts.length,1,'exactly one inline script');
 const digest='sha256-'+crypto.createHash('sha256').update(scripts[0][1],'utf8').digest('base64');
 assert.ok(html.includes('&#x27;'+digest+'&#x27;'),'CSP hash mismatch');
});
