#!/usr/bin/env node
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'konverzace/city-quest-f2/index.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const authoring=path.resolve(root,'../docs/city-quest');
const lineData=name=>{
 const line=html.split('\n').find(x=>x.startsWith('  const '+name+'='));
 assert.ok(line,'Missing authored matrix '+name);
 return JSON.parse(line.slice(('  const '+name+'=').length,-1));
};
const sha=body=>crypto.createHash('sha256').update(body,'utf8').digest('hex');
test('Claude stage A: offline source CSP and manifest integrity remain intact',()=>{
 assert.equal(sha(html),manifest.contentHashes['cl-city-quest-f2']);
 assert.equal((html.match(/<script>/g)||[]).length,1);
 assert.equal((html.match(/<style>/g)||[]).length,1);
 const script=html.match(/<script>([\s\S]*?)<\/script>/);
 const css=html.match(/<style>([\s\S]*?)<\/style>/);
 for(const [kind,piece]of [['script',script],['style',css]]){
  assert.ok(piece);
  const digest=crypto.createHash('sha256').update(piece[1],'utf8').digest('base64');
  assert.ok(html.includes(kind+"-src 'sha256-"+digest+"'"));
 }
 assert.match(html,/connect-src 'none'/);
});
test('Claude F-35/N-01/N-02: schoolmate identity and canonical metro names are consistent',()=>{
 for(const outdated of ['colleague','Kollegin','collègue'])
  assert.ok(!html.includes(outdated),'Outdated adult traveller role: '+outdated);
 const narratives=lineData('metroNarrative');
 for(const lang of ['en','es','de','fr']){
  assert.ok(narratives[lang]['5'].includes('Central Station'),lang+' metro entrance');
  assert.ok(narratives[lang]['6'].includes('Stadium'),lang+' metro stadium station');
  assert.ok(!/match at Stadium|partido en Stadium|Spiel im Stadium|match à Stadium/.test(narratives[lang]['6']),lang);
 }
 assert.match(html,/🧭 "\+ui\(\)\.route\+" · 🚉 Central Station · 🏛️ City Museum"/);
});
test('Claude F-11: repair mission answers do not leak turn by all-capitalized words',()=>{
 const lines=html.split('\n').filter(x=>/^\s*(incorrect:|identify:|fixes:)/.test(x));
 assert.equal(lines.length,12);
 for(const line of lines)assert.doesNotMatch(line,
  /\b(RIGHT|LEFT|RECHTS|LINKS|DROITE|GAUCHE|DERECHA|IZQUIERDA|SOUTH|WEST|SUR|OESTE)\b/);
 assert.doesNotMatch(html,/Wähle LINKS oder RECHTS/);
});
test('Claude F-14/F-28/F-30: mobile controls, honest hero and matching station labels',()=>{
 assert.match(html,/\.f1-mode\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(html,/\.f3d-learning-steps\{grid-template-columns:minmax\(0,1fr\)\}/);
 assert.match(html,/button\.setAttribute\("aria-label",u\.station\+" "\+String\(st\.id\)\.padStart\(2,"0"\)/);
 assert.equal((html.match(/hero\.textContent="City Quest · Riverton"/g)||[]).length,1);
 assert.doesNotMatch(html,/hero\.textContent=pack\(\)\.stations\[7\]\[0\]/);
});
test('Claude F-08/F-18/F-34 and N-03: specific mistakes and language errors are addressed',()=>{
 assert.match(html,/cqGuidedFeedback\[state.language\]/);
 assert.match(html,/cqMissingViaLead\[state.language\]/);
 assert.doesNotMatch(html,/ui\(\)\.via\+" · "\+ui\(\)\.feedbackRetry/);
 const p=lineData('advancedPractice'),d=lineData('advancedDialogueScenes'),feedback=lineData('cqFeedback');
 assert.doesNotMatch(p.de.guided.B2.explanation,/Linkskurve/);
 assert.match(p.de.guided.B2.options.find(x=>x[0]==='straight')[1],/^Geh /);
 for(const lang of ['en','es','de','fr']){
  assert.ok(!/how (will|do)|cómo sabré|woran erkenne|comment saurai/.test(d[lang].C1.distance));
 }
 assert.match(feedback.fr.repairTurn,/indication de direction/);
 assert.match(feedback.es.distance,/de cruce en cruce/);
 assert.match(feedback.de.repairTurn,/falsche Abbiegung/);
});
test('Claude N-04/N-07: offline speech authoring equals current standalone references',()=>{
 const inline=lineData('cqAdvancedOracy');
 for(const lang of ['en','es','de','fr']){
  const file=JSON.parse(fs.readFileSync(path.join(authoring,'stage3-oracy-'+lang+'.json'),'utf8'));
  assert.deepEqual(inline[lang],file);
  assert.match(file.ui.doFirst,/end of the mission|al final de la misión|Ende der Aufgabe|à la fin de la mission/);
 }
 assert.match(inline.es.city['1'].C2,/la Estación Central/);
 assert.match(inline.es.city['2'].B2,/la Plaza del Mercado/);
 assert.match(inline.fr.city['1'].C2,/la gare centrale/);
 assert.match(inline.fr.city['2'].B2,/la place du Marché/);
 assert.match(inline.de.rubric.C1[0],/^Kläre /);
});
test('Manual release gates reference the most recent prior certified full E2E report',()=>{
 const manual=fs.readFileSync(path.join(authoring,'CITY_QUEST_MANUAL_ACCEPTANCE_CZ.md'),'utf8');
 assert.match(manual,/45249477816/);
 assert.match(manual,/NO-GO/);
 assert.match(manual,/PENDING/);
});
