"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const M=require("../authoring/city-quest-f2-1b/metro-network.js");
test("Riverton Metro 14 stations / 3 lines / 3 genuine transfers",()=>{
 assert.equal(M.validate(),true);
 assert.equal(M.stations.length,14);
 assert.equal(new Set(M.stations.map(x=>x.id)).size,14);
 assert.equal(M.lines.length,3);
 assert.equal(M.source.interchanges.length,3);
 assert.deepEqual(M.joined("central_station"),["M1","M2"]);
 assert.deepEqual(M.joined("university"),["M2","M3"]);
 assert.deepEqual(M.joined("museum_quarter"),["M1","M3"]);
 assert.deepEqual(M.joined("south_gate"),["M2"]);
});
test("Every metro route leg is adjacent, line-matched and not closed",()=>{
 for(const s of M.scenarios){
  const walk=M.itinerary(s.id);
  assert.equal(walk[0].station,s.start,s.id);
  assert.equal(walk.at(-1).station,s.goal,s.id);
  assert.equal(walk[0].kind,"start");
  for(let i=1;i<walk.length;i++){
   const a=walk[i-1],b=walk[i];
   assert.equal(b.kind==="transfer"?"transfer":"ride",b.kind);
   if(b.kind==="transfer"){
    assert.equal(a.station,b.station);
    assert.notEqual(a.line,b.line);
    assert.ok(M.joined(a.station).includes(a.line));
    assert.ok(M.joined(a.station).includes(b.line));
   }else{
    assert.equal(a.line,b.line);
    assert.equal(M.adjacent(a.station,b.station,b.line),true);
    assert.equal(M.closed(a.station,b.station,b.line,s.closedEdges),false);
   }
  }
 }
});
test("Scenario 05: Central Station to Museum Quarter via M1",()=>{
 const s=M.scenario("metro_05_b1");
 const list=M.itinerary(s.id);
 assert.deepEqual(list.map(x=>x.station),["central_station","old_town","museum_quarter"]);
 assert.deepEqual(list.map(x=>x.line),["M1","M1","M1"]);
 const path=M.shortestPath(s.start,s.goal,s.closedEdges);
 assert.equal(path.cost,6);
 assert.equal(path.transfers,0);
});
test("Scenario 06: Market Square → University transfer → Stadium",()=>{
 const s=M.scenario("metro_06_b1");
 const list=M.itinerary(s.id);
 const trans=list.filter(x=>x.kind==="transfer");
 assert.equal(trans.length,1);
 assert.equal(trans[0].station,"university");
 assert.equal(trans[0].fromLine,"M2");
 assert.equal(trans[0].line,"M3");
 assert.equal(list.at(-1).station,"stadium");
 const p=M.shortestPath(s.start,s.goal,[]);
 assert.equal(p.cost,19);
 assert.equal(p.transfers,1);
});
test("Scenario 07 closure blocks an actual M1 segment; detour uses M2/M3",()=>{
 const s=M.scenario("metro_07_b1");
 assert.equal(s.closedEdges.length,1);
 assert.equal(M.closed("old_town","museum_quarter","M1",s.closedEdges),true);
 assert.deepEqual(M.nextStopOptions("old_town","M1",s.closedEdges),["central_station"]);
 assert.equal(M.shortestPath(s.start,s.goal,[]).cost,6);
 const best=M.shortestPath(s.start,s.goal,s.closedEdges);
 assert.equal(best.cost,13);
 assert.equal(best.transfers,1);
 assert.deepEqual(best.steps.filter(x=>x.kind==="ride").map(x=>x.station),
  ["university","science_centre","museum_quarter"]);
});
test("Scenario 08 combines three known surface portals and a real metro transfer",()=>{
 const s=M.scenario("metro_08_b1");
 assert.equal(s.start,"market_square");
 assert.equal(s.goal,"museum_quarter");
 assert.equal(s.speakingCheckpoints,3);
 assert.ok(M.source.surfacePortals.some(x=>x.metroStation==="market_square"));
 assert.ok(M.source.surfacePortals.some(x=>x.metroStation==="museum_quarter"));
 assert.equal(M.itinerary(s.id).filter(x=>x.kind==="transfer").length,1);
});
test("Preview state advances exactly one stop or transfer per user command",()=>{
 for(const scenario of M.scenarios){
  let state=M.startPreview(scenario.id);
  const itinerary=M.itinerary(scenario.id);
  assert.equal(state.index,0);
  for(let i=1;i<itinerary.length;i++){
   const next=M.advancePreview(state);
   assert.equal(next.index,i,scenario.id);
   assert.notStrictEqual(next,state,"immutable state");
   state=next;
  }
  assert.equal(state.finished,true);
  assert.equal(state.index,itinerary.length-1);
  assert.deepEqual(M.advancePreview(state),state);
 }
 assert.throws(()=>M.startPreview("unknown"),RangeError);
});
test("No impossible teleport or ungrounded interchange; invalid stations fail",()=>{
 assert.equal(M.adjacent("west_end","east_gardens","M1"),false);
 assert.equal(M.adjacent("central_station","university","M1"),false);
 assert.equal(M.adjacent("central_station","university","M2"),true);
 assert.equal(M.shortestPath("central_station","central_station").cost,0);
 assert.throws(()=>M.shortestPath("fictional_id","museum_quarter"),RangeError);
 assert.equal(M.line("X99"),null);
 assert.equal(M.station("x"),null);
});
test("Network content is explicitly fictional, with offline original art inputs",()=>{
 assert.equal(M.meta.fictional,true);
 assert.equal(M.source.fictional,true);
 assert.equal(M.source.defaults.liveData,false);
 assert.ok(M.source.platformFixtures.length>=4);
 assert.equal(M.lines.every(x=>/^#[0-9A-F]{6}$/i.test(x.color)),true);
 assert.equal(M.source.surfacePortals.every(x=>Number.isInteger(x.cityNode.c)&&Number.isInteger(x.cityNode.r)),true);
});
