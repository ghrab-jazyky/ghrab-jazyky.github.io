"use strict";
/* F3B pedagogical, graph and no-spoiler certification.
 * 4 languages × B1–C2 × 4 missions = 64 full simulated journeys.
 */
const {test}=require("node:test"),assert=require("node:assert/strict");
const M=require("../authoring/city-quest-f2-1b/metro-network.js");
const G=require("../authoring/city-quest-f2-1c/metro-game.js");
const L=require("../authoring/city-quest-f2-1d/metro-language.js");
const PA=require("../authoring/city-quest-f3b/metro-public-address.js");
const stage=state=>state.phase;
function go(state,type,extra={}){
 const action={type,...extra},r=G.act(state,action);
 assert.equal(r.accepted,true,JSON.stringify({n:state.stationNumber,phase:stage(state),action,message:r.message}));
 return r.state;
}
const cityWalk=[
 {c:1,r:3},{c:2,r:3},{c:2,r:2}
];
function stepsForMission(n){
 let g=G.start(n),history=[g],limit=70;
 while(g.phase!=="complete"&&--limit>0){
  switch(g.phase){
   case "walk-to-entrance":{
    const p=cityWalk[g.cityPath.length-1];
    g=go(g,"WALK",{node:p});break;
   }
   case "walk-to-museum":g=go(g,"WALK",{node:{c:3,r:1}});break;
   case "notice":g=go(g,"READ_NOTICE");break;
   case "checkpoint":case "speech":g=go(g,"SELF_CHECK");break;
   case "enter":g=go(g,"ENTER");break;
   case "select-line":{
    const line=M.scenario(g.scenarioId).legs[g.legIndex].line;
    g=go(g,"SELECT_LINE",{value:line});break;
   }
   case "select-direction":g=go(g,"SELECT_DIRECTION",{value:G.desiredDirection(g)});break;
   case "select-platform":g=go(g,"SELECT_PLATFORM",{value:String(G.platform(g))});break;
   case "board":g=go(g,"BOARD");break;
   case "ride":{
    const sc=M.scenario(g.scenarioId),active=sc.legs[g.legIndex];
    if(g.stopIndex<active.stops.length-1)g=go(g,"NEXT_STOP");
    else if(g.legIndex<sc.legs.length-1)g=go(g,"TRANSFER_HERE");
    else g=go(g,"EXIT_HERE");
    break;
   }
   case "transfer":{
    const next=M.scenario(g.scenarioId).legs[g.legIndex+1].line;
    g=go(g,"CHANGE_LINE",{value:next});break;
   }
   case "exit":g=go(g,"EXIT");break;
   default:throw Error("Unrecognized stage "+g.phase);
  }
  history.push(g);
 }
 assert.ok(limit>0&&g.completed,"Mission "+n+" should complete without engine shortcut.");
 return history;
}
test("F3B every authored language and level renders every stage in 64 complete routes",()=>{
 assert.equal(PA.validate(),true);
 const profiles=new Set(),visited=new Set();
 for(const lang of PA.languages)for(const level of PA.levels)for(const n of [5,6,7,8]){
  profiles.add(lang+"/"+level+"/"+n);
  for(const state of stepsForMission(n)){
   const p=PA.pack(lang,level,state);
   visited.add(p.kind);
   assert.equal(p.locale,lang);
   assert.equal(p.level,level);
   assert.equal(p.mission,n);
   assert.ok(p.marker.length>10);
   assert.ok(p.body.length>25,lang+"/"+level+"/"+n+" "+state.phase);
   assert.ok(p.focus.length>25);
   assert.equal(p.station,M.station(state.metroStation).labelEn);
   assert.ok(!/[{}]/.test(p.body),"Variable placeholders must be resolved.");
   assert.ok(!/fetch\(|XMLHttpRequest|https?:\/\//.test(p.body),"Messages cannot reference remote services.");
  }
 }
 assert.equal(profiles.size,64);
 for(const name of ["wayfinding","direction","platform","boarding","onboard","transfer","arrival",
  "notice","speaking","city","complete"])
  assert.ok(visited.has(name),"Missing simulated scene "+name);
});
test("F3B no spoilers before a choice: line, terminus, platform and diversion hidden",()=>{
 for(const lang of PA.languages)for(const level of PA.levels){
  let g=G.start(5);
  assert.equal(PA.pack(lang,level,g).kind,"wayfinding");
  assert.doesNotMatch(PA.pack(lang,level,g).body,/\bM1\b|\bEast Gardens\b|\b2\b/);
  g=go(g,"SELECT_LINE",{value:"M1"});
  assert.equal(PA.pack(lang,level,g).kind,"direction");
  assert.doesNotMatch(PA.pack(lang,level,g).body,/\bEast Gardens\b|\bWest End\b/);
  g=go(g,"SELECT_DIRECTION",{value:"east_gardens"});
  assert.equal(PA.pack(lang,level,g).kind,"platform");
  assert.doesNotMatch(PA.pack(lang,level,g).body,/\bplatform 2\b|\bandén 2\b|\bBahnsteig 2\b|\bquai 2\b/i);
  g=go(g,"SELECT_PLATFORM",{value:"2"});
  assert.equal(PA.pack(lang,level,g).kind,"boarding");
  assert.ok(PA.pack(lang,level,g).body.includes("East Gardens")&&PA.pack(lang,level,g).body.includes("M1"));
  let closed=G.start(7);
  const notice=PA.pack(lang,level,closed);
  assert.equal(notice.kind,"notice");
  assert.match(notice.body,/Old Town/);
  assert.match(notice.body,/Museum Quarter/);
  assert.match(notice.body,/\bM1\b/);
  assert.doesNotMatch(notice.body,/University|\bM2\b|\bM3\b/);
  closed=go(closed,"READ_NOTICE");
  assert.doesNotMatch(PA.pack(lang,level,closed).body,/University|\bM2\b|\bM3\b/);
 }
});
test("F3B next-station display is based on actual route and only available on board",()=>{
 for(const lang of PA.languages){
  const start=G.start(5);
  assert.equal(PA.pack(lang,"B1",start).next,null);
  let g=go(start,"SELECT_LINE",{value:"M1"});
  g=go(g,"SELECT_DIRECTION",{value:"east_gardens"});
  g=go(g,"SELECT_PLATFORM",{value:"2"});
  g=go(g,"BOARD");
  let p=PA.pack(lang,"B1",g);
  assert.equal(p.kind,"onboard");assert.equal(p.next,"Old Town");
  assert.ok(p.body.includes("Old Town"),lang+" next stop");
  g=go(g,"NEXT_STOP");p=PA.pack(lang,"B1",g);
  assert.equal(p.next,"Museum Quarter");
  g=go(g,"NEXT_STOP");
  p=PA.pack(lang,"B1",g);
  assert.equal(p.kind,"onboard","Arrival alone must not announce the right exit.");
  assert.equal(p.next,"Riverside","M1 physically continues after Museum Quarter.");
  assert.equal(p.station,"Museum Quarter","PA must report the current station separately.");
  assert.ok(p.body.includes("Riverside"),"The next physical station is Riverside.");
  g=go(g,"EXIT_HERE");
  p=PA.pack(lang,"B1",g);
  assert.equal(p.kind,"arrival");
  assert.equal(p.cue,"arrival");
 }
});
test("F3B CEFR differentiation is meaningful across announcement prompts",()=>{
 for(const lang of PA.languages){
  const state=G.start(5);
  const values=PA.levels.map(level=>PA.pack(lang,level,state).focus);
  assert.equal(new Set(values).size,4);
  assert.notEqual(values[0],values[3]);
 }
});
test("F3B state safety rejects unsupported levels, missions and fake metro stations",()=>{
 assert.throws(()=>PA.pack("xx","B1",G.start(5)),RangeError);
 assert.throws(()=>PA.pack("en","A1",G.start(5)),RangeError);
 assert.throws(()=>PA.pack("en","B1",{}),TypeError);
 assert.throws(()=>PA.pack("en","B1",{...G.start(5),metroStation:"secret_station"}),Error);
});
