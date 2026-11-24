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
 const line=html.split('\n').find(x=>x.trimStart().startsWith('const '+name+'='));
 assert.ok(line,'Missing authored matrix '+name);
 return JSON.parse(line.slice(line.indexOf('const '+name+'=')+('const '+name+'=').length,-1));
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
 assert.match(html,/🧭 "\+ui\(\)\.route\+" · 🚉 Central Station · 🏛️ "\+ui\(\)\.museum/);
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

test('French narrow no-break punctuation in authored CEFR and contextual feedback',()=>{
 const refs=['advancedExploreClues','advancedDialogueScenes','advancedPractice','disruptionNotices','cqAdvancedOracy'];
 for(const name of refs){
  const d=lineData(name);
  const serialized=JSON.stringify(d.fr);
  assert.doesNotMatch(serialized,/ [!?;:]/,'French string punctuation '+name);
 }
 const authored=JSON.parse(fs.readFileSync(path.join(authoring,'stage3-oracy-fr.json'),'utf8'));
 assert.deepEqual(lineData('cqAdvancedOracy').fr,authored);
 const segment=html.slice(html.indexOf('    fr:{\n      name:"French"'),
   html.indexOf('\n  };\n  for(const [lang,data]',html.indexOf('    fr:{\n      name:"French"')));
 assert.doesNotMatch(segment.match(/"(?:\\.|[^"\\])*"/g).join('\n'),/ [!?;:]/,
  'French city labels must not have breakable spaces before punctuation');
 assert.match(segment,/Avancez jusqu'au prochain carrefour/);
 assert.match(segment,/troisième carrefour/);
});
test('German task language does not confuse missions with real metro stations',()=>{
 assert.match(html,/station:"Aufgabe",completed:"Aufgaben abgeschlossen"/);
 assert.match(html,/next:"Nächste Aufgabe"/);
 assert.match(html,/finish:"Aufgabe abgeschlossen"/);
 assert.match(html,/platformAt:"Illustrierter Bahnsteig an der Station "/);
 assert.match(html,/trainAt:"Illustrierter U-Bahn-Zug an der Station "/);
 assert.match(html,/st\.id===6\?"🔀"/);
});
test('Map M is the City Museum goal, not the Museum Quarter metro portal',()=>{
 assert.match(html,/text\(map,684,291,"M"/);
 assert.match(html,/portalEnd=\{c:3,r:2\},museum=\{c:3,r:1\}/);
 // Do not move the original City Museum marker to the south metro exit (Claude N-05).
});


test('A+ F-17: metro surface place names localized but fictional metro station names retained',()=>{
 assert.ok(html.includes('"🧭 "+ui().route+" · 🚉 Central Station · 🏛️ "+ui().museum:'));
 for(const t of ['una manzana al sur del Museo de la Ciudad','einen Häuserblock südlich des Stadtmuseums','au carrefour juste au sud du musée municipal'])assert.ok(html.includes(t),'Missing localized surface: '+t);
 assert.doesNotMatch(html,/museum_quarter:"[^"]*City Museum"/);
});

test('A+ F-25/F-26: French dynamic navigation, narrow spaces and feedback',()=>{
 const mode=lineData('cqModeText').fr,feedback=lineData('cqGuidedFeedback').fr;
 assert.doesNotMatch(JSON.stringify(mode),/ [!?;:]/);
 assert.doesNotMatch(JSON.stringify(feedback),/ [!?;:]/);
 assert.ok(mode[3].includes('\u202f?'));
 assert.ok(feedback.C1.includes('bibliothèque\u202f:'));
 assert.match(html,/blocks:"carrefours",remaining:"carrefours jusqu'à l'arrivée"/);
 for(const token of ['first:(dir,blocks)=>"Avancez vers "','turn:(side,dir,blocks)=>"Tournez à "+side+" et avancez vers ','continue:(dir,blocks)=>"Continuez vers ','uturn:(dir,blocks)=>"Faites demi-tour et avancez vers '])assert.ok(html.includes(token),'Missing FR direction rewrite '+token);
 for(const token of ['Prochaine station\u202f: {next}','Station sélectionnée\u202f: ','Arrêt actuel\u202f: '])assert.ok(html.includes(token),'Missing punctuation '+token);
});
