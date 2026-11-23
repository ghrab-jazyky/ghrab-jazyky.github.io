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
test("F5C CQ-F5-009: Metro08 requires ticket pickup at Market Square before University",()=>{
 const L=require("../authoring/city-quest-f2-1d/metro-language.js");
 const ticketWords={en:/tickets/,es:/entradas/,de:/Eintrittskarten/,fr:/billets/};
 for(const lang of L.languages)for(const level of L.levels){
  const c=L.pack(lang,level,8),model=L.model(lang,level,8),
   meeting=L.stage(lang,level,8,"checkpoint",{station:"University"}),
   pickup=L.stage(lang,level,8,"checkpoint",{station:"Market Square"});
  assert.match(c.goal,/University/);
  assert.match(c.goal,/Market Square/);
  assert.match(c.goal,ticketWords[lang],lang+"/"+level+" must explain why walking comes first");
  assert.match(model,ticketWords[lang],lang+"/"+level+" must explain ticket pickup");
  assert.match(model,/Market Square.*M2.*University.*M3/s);
  assert.match(meeting,/University/);
  assert.match(pickup,ticketWords[lang]);
  assert.notEqual(meeting,pickup);
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

test("Independent editorial review: all B2 City03 dialogue models include the eastward square-to-museum turn",()=>{
 const pattern={
  en:/two blocks east[\s\S]*one block north to Market Square[\s\S]*one block east[\s\S]*northbound street/i,
  es:/dos manzanas hacia el este[\s\S]*una manzana hacia el norte hasta la Plaza del Mercado[\s\S]*una manzana hacia el este[\s\S]*calle que va hacia el norte/i,
  de:/zwei Häuserblöcke nach Osten[\s\S]*einen Block nach Norden zum Marktplatz[\s\S]*einen Block nach Osten[\s\S]*Straße nach Norden/i,
  fr:/de deux pâtés de maisons vers l'est[\s\S]*un pâté de maisons vers le nord jusqu'à la place du Marché[\s\S]*d'un pâté de maisons vers l'est[\s\S]*rue vers le nord/i
 };
 const target=G.pathFromDirections(["east","east","north","east","north"]);
 assert.ok(E.same(target.at(-1),E.goal));
 for(const lang of C.languages){
  const sample=C.profile(lang,"B2").dialogueAnswer;
  assert.match(sample,pattern[lang],lang+": the authored model must describe all five map steps");
  assert.ok(sample.includes(C.pack(lang).places.museum),
   lang+": final destination name must match the city map");
 }
});
test("Independent editorial review: City-only models do not use Metro-only English place names",()=>{
 for(const lang of ["es","de","fr"]){
  const p=C.pack(lang);
  for(const level of ["A2","B2","C1","C2"]){
   const answer=C.profile(lang,level).dialogueAnswer;
   assert.doesNotMatch(answer,/Central Station|Market Square|City Museum/);
   assert.match(answer,new RegExp(p.places.station,"i"));
   assert.match(answer,new RegExp(p.places.museum,"i"));
  }
 }
});
test("Independent editorial review: local dialogue distractors are grammatical and informative",()=>{
 for(const lang of C.languages)for(const level of C.levels){
  const answer=C.profile(lang,level).dialogueAnswer,d=G.dialogueDistractors(answer,lang);
  assert.ok(d.vague!==answer&&d.wrong!==answer);
  assert.doesNotMatch(d.vague,/[.!?]\s+[a-z]/);
  assert.doesNotMatch(d.vague,/cercano cerca|tournez sans préciser où/i);
 }
 assert.match(C.pack("fr").dialogue.vague,/Vous le trouverez/);
 assert.match(C.pack("fr").stations[1][1],/comment y arriver/);
});
test("Independent didactic review: CITY08 model is based on the actual visited checkpoints",()=>{
 const fs=require("node:fs"),path=require("node:path");
 const client=fs.readFileSync(path.join(__dirname,"../konverzace/city-quest-f2/f2.js"),"utf8");
 assert.match(client,/const realized=G\.routeModel\(pack\(\),game\.route\)/,
  "The final quest must not use a generic, unrelated route model.");
 const sample=G.pathFromDirections(["east","east","north","east","east","north","west"]);
 assert.ok(E.same(sample.at(-1),E.goal));
 for(const lang of C.languages){
  const route=G.routeModel(C.pack(lang),sample);
  assert.ok(route.length>100&&route.split(".").length>=4);
 }
});

test("Independent editorial review: Metro08 B2-C2 models are coherent, concise and waypoint-correct",()=>{
 const L=require("../authoring/city-quest-f2-1d/metro-language.js");
 const ticket={en:/tickets/,es:/entradas/,de:/Eintrittskarten/,fr:/billets/};
 for(const lang of L.languages)for(const level of ["B2","C1","C2"]){
  const model=L.model(lang,level,8);
  assert.match(model,ticket[lang]);
  assert.match(model,/Market Square[\s\S]*M2[\s\S]*University[\s\S]*M3[\s\S]*Museum Quarter[\s\S]*City Museum/);
  assert.ok(model.length>270&&model.length<1000,lang+"/"+level+" model must be practical and not padded with repetitions");
  assert.doesNotMatch(model,/Museumskarten|widerstandsfähige Alternative/i);
 }
});
