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
