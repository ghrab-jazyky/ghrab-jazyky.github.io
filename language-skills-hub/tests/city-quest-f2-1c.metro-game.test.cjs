"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const M=require("../authoring/city-quest-f2-1b/metro-network.js");
const G=require("../authoring/city-quest-f2-1c/metro-game.js");
const act=(s,type,value)=>G.act(s,type==="WALK"?{type,node:value}:{type,value});
function accepted(s,type,value){
 const o=act(s,type,value);
 assert.equal(o.accepted,true,type+": "+o.message);
 return o.state;
}
function rejected(s,type,value){
 const o=act(s,type,value);
 assert.equal(o.accepted,false,type+" should not be accepted");
 assert.equal(o.state.phase,s.phase,"Rejecting an action must not advance phase");
 assert.equal(o.state.metroStation,s.metroStation,"Rejecting an action must not move the player");
 assert.equal(o.state.attempts,s.attempts+1);
 return o.state;
}
function pilot(n){
 let s=G.start(n),sc=M.scenario(s.scenarioId);
 if(n===8){
  assert.equal(s.phase,"walk-to-entrance");
  s=rejected(s,"WALK",{c:2,r:2}); // no jumping over city blocks
  for(const p of [{c:1,r:3},{c:2,r:3},{c:2,r:2}])s=accepted(s,"WALK",p);
  assert.equal(s.phase,"checkpoint","Market Square requires explicit oral checkpoint");
  s=rejected(s,"ENTER");
  s=accepted(s,"SELF_CHECK");
  assert.equal(s.speakingDone,1);
  s=accepted(s,"ENTER");
 }
 if(n===7){
  assert.equal(s.phase,"notice");
  s=rejected(s,"SELECT_LINE","M2");
  s=accepted(s,"READ_NOTICE");
  assert.equal(s.noticeRead,true);
 }
 assert.equal(s.phase,"select-line");
 for(let legNo=0;legNo<sc.legs.length;legNo++){
  const leg=sc.legs[legNo],destination=G.desiredDirection(s),platform=G.platform(s);
  assert.equal(s.phase,"select-line");
  s=rejected(s,"NEXT_STOP");
  const other=M.joined(s.metroStation).find(id=>id!==leg.line);
  if(other)s=rejected(s,"SELECT_LINE",other);
  s=accepted(s,"SELECT_LINE",leg.line);
  const wrong=M.line(leg.line).stops.find(x=>x!==destination&&
   [M.line(leg.line).stops[0],M.line(leg.line).stops.at(-1)].includes(x));
  s=rejected(s,"SELECT_DIRECTION",wrong);
  s=accepted(s,"SELECT_DIRECTION",destination);
  s=rejected(s,"SELECT_PLATFORM",platform==="1"?"2":"1");
  s=accepted(s,"SELECT_PLATFORM",platform);
  s=accepted(s,"BOARD");
  for(let i=1;i<leg.stops.length;i++){
   s=accepted(s,"NEXT_STOP");
   assert.equal(s.metroStation,leg.stops[i]);
   assert.ok(G.routeIndex(s)>0,"Metro step progress must advance");
  }
  if(legNo<sc.legs.length-1){
   if(n===8){
    assert.equal(s.phase,"checkpoint");
    s=rejected(s,"CHANGE_LINE");
    s=accepted(s,"SELF_CHECK");
    assert.equal(s.speakingDone,2);
   }
   assert.equal(s.phase,"transfer");
   s=accepted(s,"CHANGE_LINE");
  }
 }
 assert.equal(s.phase,"exit");
 s=rejected(s,"NEXT_STOP");
 s=accepted(s,"EXIT");
 if(n===8){
  assert.equal(s.phase,"walk-to-museum");
  assert.deepEqual(s.surface,G.portalEnd);
  s=accepted(s,"WALK",{c:3,r:1});
 }
 assert.equal(s.phase,"speech");
 assert.equal(s.completed,false);
 s=rejected(s,"BOARD");
 s=accepted(s,"SELF_CHECK");
 assert.equal(s.phase,"complete");
 assert.equal(s.completed,true);
 assert.equal(s.metroStation,sc.goal);
 assert.equal(s.speakingDone,n===8?3:1);
 assert.equal(act(s,"NEXT_STOP").accepted,false);
 return s;
}
test("Metro mission fixtures and surface portals are internally valid",()=>{
 assert.equal(G.validate(),true);
 assert.equal(M.stations.length,14);
 assert.equal(M.source.interchanges.length,3);
 assert.deepEqual(G.portalStart,{c:2,r:2});
 assert.deepEqual(G.portalEnd,{c:3,r:2});
 assert.deepEqual(G.museum,{c:3,r:1});
 for(const n of [5,6,7,8]){
  const g=G.start(n);assert.equal(g.stationNumber,n);
  assert.equal(G.scenario(g).stationNumber,n);
  assert.deepEqual(G.options({...g,phase:"select-line"}).map(x=>x.value),
   M.joined(g.metroStation));
 }
});
test("Mission 05 EN/B1 validates line, terminus, platform, boarding and exit",()=>{pilot(5);});
test("Mission 06 EN/B1 requires transfer at University and all real intermediate stops",()=>{
 const end=pilot(6);
 assert.ok(end.history.includes("CHANGE_LINE"));
 assert.ok(end.history.filter(x=>x==="NEXT_STOP").length>=5);
});
test("Mission 07 EN/B1 enforces service notice and never rides a closed edge",()=>{
 const s=M.scenario("metro_07_b1");
 assert.equal(M.closed("old_town","museum_quarter","M1",s.closedEdges),true);
 const end=pilot(7);
 assert.equal(end.noticeRead,true);
 assert.ok(!end.history.some(x=>x==="SKIP_STOP"));
});
test("Mission 08 EN/B1 has city entrance, metro transfer, city exit and three speaking checks",()=>{
 const end=pilot(8);
 assert.equal(end.cityPath.length,2,"Last walking leg contains portal and museum");
 assert.equal(end.speakingDone,3);
 assert.ok(end.history.filter(x=>x==="WALK").length>=4);
});
test("City portion of mission 08 supports safe Undo without losing the current mission",()=>{
 let state=G.start(8);
 assert.equal(act(state,"UNDO_WALK").accepted,false,"Cannot undo before first step");
 state=accepted(state,"WALK",{c:1,r:3});
 state=accepted(state,"WALK",{c:2,r:3});
 assert.equal(state.cityPath.length,3);
 state=accepted(state,"UNDO_WALK");
 assert.deepEqual(state.surface,{c:1,r:3});
 assert.equal(state.cityPath.length,2);
 assert.equal(state.phase,"walk-to-entrance");
 state=accepted(state,"WALK",{c:2,r:3});
 state=accepted(state,"WALK",{c:2,r:2});
 assert.equal(state.phase,"checkpoint");
 assert.equal(act(state,"UNDO_WALK").accepted,false,"Checkpoint cannot be bypassed with undo");
});
test("Mission start rejects nonexistent station and unconnected actions",()=>{
 assert.throws(()=>G.start(9),RangeError);
 assert.throws(()=>G.act(null,{type:"ENTER"}),TypeError);
 assert.equal(act(G.start(5),"SELECT_LINE","M3").accepted,false);
 assert.equal(act(G.start(5),"SELF_CHECK").accepted,false);
 assert.equal(act(G.start(8),"WALK",{c:-1,r:3}).accepted,false);
});
