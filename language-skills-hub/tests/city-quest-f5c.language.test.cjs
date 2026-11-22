"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const C=require("../authoring/city-quest-f2/content-a.js");
require("../authoring/city-quest-f2/content-b.js");
const G=require("../authoring/city-quest-f2/engine.js");
const F=G.F,E=G.E;
test("F5C CQ-F5-012: the City03 model's map route actually reaches City Museum",()=>{
 const direct=G.pathFromDirections(["east","east","east","north","north"]);
 const viaMarket=G.pathFromDirections(["east","east","north","east","north"]);
 assert.ok(E.same(direct.at(-1),E.goal));
 assert.ok(E.same(viaMarket.at(-1),E.goal));
 assert.ok(viaMarket.some(p=>E.same(p,{c:2,r:2})),"Market Square waypoint");
 for(const lang of C.languages){
  const a2=C.profile(lang,"A2").dialogueAnswer;
  const c1=C.profile(lang,"C1").dialogueAnswer;
  const c2=C.profile(lang,"C2").dialogueAnswer;
  assert.ok(a2.length>70&&c1.length>150&&c2.length>160,lang+" dialogue examples should provide complete instructions");
  assert.ok(!/next crossing|prochain carrefour|nächsten Kreuzung|siguiente cruce/i.test(a2),
   lang+" A2 must not imply the museum is after just one northbound block");
  assert.ok(!/follow the signs|den Schildern|siga las señales|suivez les indications/i.test(c1),
   lang+" C1 should be factual enough to follow without inventing signs");
  assert.ok(!/approach the museum from the south|acceda al museo desde el sur|nähern sich dem Museum von Süden|abordez le musée par le sud/i.test(c2),
   lang+" C2 should not describe a wrong approach or misleading route");
 }
});
test("F5C CQ-F5-009: University meeting is the explicit constraint in every Metro08 CEFR goal",()=>{
 const L=require("../authoring/city-quest-f2-1d/metro-language.js");
 for(const lang of L.languages)for(const level of L.levels){
  const c=L.pack(lang,level,8),model=L.model(lang,level,8),checkpoint=L.stage(lang,level,8,"checkpoint",{station:"University"});
  assert.match(c.goal,/University/);
  assert.match(model,/M1/);assert.match(model,/M2/);assert.match(model,/M3/);
  assert.match(checkpoint,/University/);
  assert.notEqual(checkpoint,L.stage(lang,level,8,"checkpoint",{station:"Market Square"}));
 }
});


test("F5C CQ-F5-013: Spanish/German model routes address tourists formally while learner guidance stays informal",()=>{
 const route=G.pathFromDirections(G.guidedPaths.B1);
 for(const [lang,formal,informal] of [["es",/^Camine/,/^Camina/],["de",/^Gehen Sie/,/^Gehe /]]){
  const p=C.pack(lang),model=G.routeModel(p,route),instruction=G.instruction(p,"B1",0);
  assert.match(model,formal,lang+" tourist register");
  assert.match(instruction,informal,lang+" student-facing register");
  assert.doesNotMatch(model,lang==="es"?/\b(?:Camina|Gira|Sigue)\b/:/\b(?:Gehe|Biege)\b/);
  for(const level of ["A1","A2","B1"]){
   assert.doesNotMatch(C.profile(lang,level).model,
    lang==="es"?/\b(?:Camina|Gira|Sigue)\b/:/\b(?:Gehe|Biege)\b/,
    lang+" "+level+" tourist model must not slip into informal imperative");
  }
 }
});
test("F5C CQ-F5-018/019: translated landmark labels and rose garden names are consistent with place names",()=>{
 assert.equal(C.pack("es").mapLabels["ROSE GARDEN"],"ROSALEDA");
 assert.equal(C.pack("fr").mapLabels["ROSE GARDEN"],"ROSERAIE");
 const targets={station:"CENTRAL STATION",museum:"CITY MUSEUM",hospital:"HOSPITAL",
  library:"LIBRARY",square:"MARKET SQUARE",park:"RIVERSIDE PARK",
  cafe:"SUNRISE CAFÉ",post:"POST OFFICE"};
 for(const lang of ["es","fr"]){
  const p=C.pack(lang);
  for(const [place,label] of Object.entries(targets))
   assert.equal(p.mapLabels[label],p.places[place].toLocaleUpperCase(lang),
    lang+" map and option should use the same landmark name: "+place);
 }
});
test("F5C CQ-F5-023/025: grammatical U-turns and non-gendered French success/correction",()=>{
 const route=[{c:0,r:3},{c:1,r:3},{c:0,r:3}];
 const expected={es:/Dé la vuelta y camine/,de:/Drehen Sie sich um und gehen Sie/,
  fr:/Faites demi-tour et avancez/};
 for(const lang of Object.keys(expected)){
  const p=C.pack(lang),model=G.routeModel(p,route);
  assert.match(model,expected[lang]);
  assert.ok(typeof p.directions.uturn==="function");
  assert.ok(!/Gira a la vuelve atrás|Biege um ab|Tournez à demi-tour/.test(model));
 }
 const fr=C.pack("fr");
 assert.equal(fr.ui.arrived,"Vous êtes à destination !");
 assert.doesNotMatch(fr.repair.polite,/je me suis trompé\b/i);
});


test("F5C CQ-F5-024/030/032: localised checkpoint headings, German U-Bahn terms and metro map warning",()=>{
 const Metro=require("../authoring/city-quest-f2-1d/metro-language.js");
 const Network=require("../authoring/city-quest-f2-1b/metro-network.js");
 assert.equal(Network.scenario("metro_08_b1").speakingCheckpoints,3);
 const words={en:/schematic/i,es:/esquemático/i,de:/schematisch/i,fr:/schématique/i};
 for(const lang of Metro.languages){
  const p=Metro.pack(lang,"C2",8);
  assert.ok(p.labels.checkpointProgress.length>5);
  assert.match(p.hints.map,words[lang],lang+" needs a true metro schematic warning");
 }
 const german=Metro.pack("de","B1",8);
 for(const key of ["pilot","title","header","kicker","pilotTag","metroTitle"])
  assert.doesNotMatch(german[key],/Metro/i,"German should call the system U-Bahn: "+key);
});
