"use strict";
/* F2.1D certification: 4 languages × B1..C2 × 4 metro missions = 64 profiles.
 * No dynamic translation service, API or hidden English fallbacks. */
const {test}=require("node:test"),assert=require("node:assert/strict");
const L=require("../authoring/city-quest-f2-1d/metro-language.js");
const G=require("../authoring/city-quest-f2-1c/metro-game.js");
const M=require("../authoring/city-quest-f2-1b/metro-network.js");

test("4 languages × 4 levels × 4 missions: all 64 profiles are authored",()=>{
 assert.equal(L.validate(),true);
 assert.deepEqual(L.languages,["en","es","de","fr"]);
 assert.deepEqual(L.levels,["B1","B2","C1","C2"]);
 const seen=new Set();
 for(const lang of L.languages)for(const level of L.levels)for(const mission of L.missions){
  const p=L.pack(lang,level,mission);
  assert.equal(p.mission,mission);
  assert.equal(p.level,level);
  assert.equal(p.cefr.criteria.length,3);
  assert.ok(p.goal.includes(p.cefr.task),"level-specific task appended to mission");
  assert.ok(p.pair[mission].length>30);
  assert.ok(L.model(lang,level,mission).length>=40);
  seen.add(lang+"-"+level+"-"+mission);
 }
 assert.equal(seen.size,64);
});
test("B1–C2 oral tasks, examples and stretch instructions are not duplicates",()=>{
 for(const lang of L.languages)for(const mission of L.missions){
  const models=L.levels.map(level=>L.model(lang,level,mission));
  assert.equal(new Set(models).size,4,lang+" mission "+mission+" differentiated models");
  const task=L.levels.map(level=>L.pack(lang,level,mission).cefr.task);
  assert.equal(new Set(task).size,4,lang+" mission "+mission+" differentiated tasks");
 }
});
test("All UI action labels and phases exist in each language; no response-shaped HTML or requests",()=>{
 const phases=["walk-to-entrance","enter","notice","select-line","select-direction",
  "select-platform","board","ride","transfer","exit","walk-to-museum","checkpoint","speech"];
 const actions=["ENTER","READ_NOTICE","BOARD","NEXT_STOP","CHANGE_LINE","EXIT","SELF_CHECK"];
 for(const lang of L.languages){
  const p=L.pack(lang,"B1",5);
  for(const phase of phases){
   assert.ok(p.phases[phase].length>25,lang+" "+phase);
   assert.ok(L.stage(lang,"C2",8,phase,{station:"Central Station"}).length>12);
  }
  for(const type of actions)assert.ok(p.actions[type]?.length>8,lang+" "+type);
  for(const [name,meaning] of p.glossary){
   assert.ok(name.length>2&&meaning.length>8);
  }
 }
});
test("All 64 gameplay variants use validated real metro geography, safe closure and 3 speech checkpoints",()=>{
 for(const lang of L.languages)for(const level of L.levels)for(const n of L.missions){
  const c=L.pack(lang,level,n),g=G.start(n),s=M.scenario(g.scenarioId);
  assert.ok(c.titleMission&&c.goal);
  assert.equal(s.stationNumber,n);
  for(const leg of s.legs)for(let i=1;i<leg.stops.length;i++){
   assert.equal(M.adjacent(leg.stops[i-1],leg.stops[i],leg.line),true);
   assert.equal(M.closed(leg.stops[i-1],leg.stops[i],leg.line,s.closedEdges),false);
  }
  assert.ok(G.platform({scenarioId:s.id,legIndex:0,metroStation:s.start}));
 }
});
test("Incorrect choice feedback is localized in all 4 languages, including wrong line/direction/platform",()=>{
 for(const lang of L.languages){
  let g=G.start(5);
  let r=G.act(g,{type:"SELECT_LINE",value:"M2"});
  assert.equal(r.accepted,false);
  assert.equal(L.feedback(lang,r,{type:"SELECT_LINE"}),L.pack(lang,"B1",5).errors.wrongLine);
  r=G.act(g,{type:"SELECT_LINE",value:"M1"});g=r.state;
  r=G.act(g,{type:"SELECT_DIRECTION",value:"West End"});
  assert.equal(r.accepted,false);
  assert.equal(L.feedback(lang,r,{type:"SELECT_DIRECTION"}),L.pack(lang,"B1",5).errors.wrongDirection);
  r=G.act(g,{type:"SELECT_DIRECTION",value:"east_gardens"});g=r.state;
  r=G.act(g,{type:"SELECT_PLATFORM",value:"1"});
  assert.equal(r.accepted,false);
  assert.equal(L.feedback(lang,r,{type:"SELECT_PLATFORM"}),L.pack(lang,"B1",5).errors.wrongPlatform);
  const good=G.act(g,{type:"SELECT_PLATFORM",value:"2"});
  assert.equal(good.accepted,true);
  assert.ok(L.feedback(lang,good,{type:"SELECT_PLATFORM"}).length>12);
 }
});
test("Never activate multilingual metro at A1/A2; invalid content throws, all proper station names stable",()=>{
 for(const lang of L.languages){
  for(const level of ["A1","A2"])assert.throws(()=>L.pack(lang,level,5),RangeError);
  assert.throws(()=>L.pack(lang,"B1",4),RangeError);
  assert.ok(L.pack(lang,"B1",5).models[5].includes("Central Station"));
 }
});
