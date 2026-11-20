"use strict";
const assert=require("node:assert/strict");
const test=require("node:test");
const F=require("../authoring/city-quest-f1/engine.js");
const E=F.E;
test("F1 declares eight distinct stations with a dedicated mechanic",()=>{
 assert.deepEqual(F.stations.map(x=>x.id),[1,2,3,4,5,6,7,8]);
 assert.equal(new Set(F.stations.map(x=>x.type)).size,8);
 assert.equal(F.places.length,8);
});
test("all six vocabulary challenges have known, distinct options and correct feedback",()=>{
 assert.equal(F.explore.length,6);
 F.explore.forEach((round,index)=>{
  assert.equal(round.choices.length,3);
  assert.equal(new Set(round.choices).size,3);
  assert.ok(round.choices.includes(round.correct));
  round.choices.forEach(id=>assert.ok(F.findPlace(id),"Unknown landmark "+id));
  assert.equal(F.answerExplore(index,round.correct).correct,true);
  const wrong=round.choices.find(id=>id!==round.correct);
  assert.equal(F.answerExplore(index,wrong).correct,false);
 });
 assert.throws(()=>F.answerExplore(100,"station"),RangeError);
});
test("guided route follows the five directions to the museum",()=>{
 let state=F.createGuided();
 assert.equal(state.step,0);
 for(const instruction of F.guided){
  const last=state.route[state.route.length-1];
  const next=F.nextFromDirection(last,instruction.direction);
  const result=F.guidedMove(state,next);
  assert.equal(result.accepted,true);
  state=result.state;
 }
 assert.equal(state.done,true);
 assert.equal(state.step,5);
 assert.equal(E.same(state.route[state.route.length-1],E.goal),true);
 assert.equal(state.route.length,6);
});
test("guided instructions do not allow incorrect movement, teleporting or overflow",()=>{
 const before=F.createGuided();
 const wrong=F.guidedMove(before,{c:0,r:2});
 assert.equal(wrong.accepted,false);
 assert.equal(wrong.state.step,0);
 assert.equal(wrong.state.route.length,1);
 const teleport=F.guidedMove(before,E.goal);
 assert.equal(teleport.accepted,false);
 assert.equal(teleport.state.route.length,1);
 assert.equal(F.guidedMove(before,{c:0,r:4}).accepted,false);
});
test("transit timetable checks all three fields and arrival deadline",()=>{
 const answer=F.transport.answer;
 assert.equal(F.checkTransport(answer).correct,true);
 assert.match(F.checkTransport(answer).message,/09:05/);
 for(const wrong of [
  {line:"7",depart:answer.depart,stop:answer.stop},
  {line:answer.line,depart:"08:44",stop:answer.stop},
  {line:answer.line,depart:answer.depart,stop:"Library"},
  {}
 ])assert.equal(F.checkTransport(wrong).correct,false);
 assert.equal(F.transport.lines.find(x=>x.line==="24").arrival<"09:10",true);
});
test("turn-error identification and correction must both be accurate",()=>{
 assert.equal(F.checkErrorIdentification("turn").correct,true);
 assert.equal(F.checkErrorIdentification("three").correct,false);
 assert.equal(F.checkCorrection("left").correct,true);
 assert.equal(F.checkCorrection("south").correct,false);
});
test("detour rejects the genuinely closed road and accepts an alternate route",()=>{
 let state=F.createDetour();
 let r=F.detourMove(state,{c:1,r:3});state=r.state;
 r=F.detourMove(state,{c:2,r:3});state=r.state;
 const blocked=F.detourMove(state,{c:3,r:3});
 assert.equal(blocked.accepted,false);
 assert.equal(blocked.kind,"closed");
 assert.equal(blocked.state.route.length,3);
 assert.equal(blocked.state.attempts,1);
 const alternate=["north","east","east","east","north"];
 state=F.createDetour();
 for(const dir of alternate){
  const next=F.nextFromDirection(state.route.at(-1),dir);
  r=F.detourMove(state,next);assert.equal(r.accepted,true);state=r.state;
 }
 assert.equal(state.done,true);
 assert.equal(E.same(state.route.at(-1),E.goal),true);
 assert.equal(state.completedBlocks,5);
});
test("detour path validation rejects teleport and city bounds",()=>{
 const initial=F.createDetour();
 assert.equal(F.detourMove(initial,E.goal).accepted,false);
 assert.equal(F.detourMove(initial,{c:-1,r:3}).accepted,false);
});
test("final quest requires all three checkpoints and speaking acknowledgements",()=>{
 let state=F.createQuest();
 const legs=[
  ["east","east","north"],
  ["east","east"],
  ["west","north"]
 ];
 for(let i=0;i<legs.length;i++){
  for(const dir of legs[i]){
   const next=F.nextFromDirection(state.leg.at(-1),dir);
   const r=F.questMove(state,next);
   assert.equal(r.accepted,true);
   state=r.state;
  }
  assert.equal(state.awaitingSpeech,true);
  assert.equal(F.questMove(state,{c:0,r:0}).accepted,false);
  const complete=F.completeQuestSpeech(state);
  assert.equal(complete.accepted,true);
  state=complete.state;
  assert.equal(state.stage,i+1);
 }
 assert.equal(state.done,true);
 assert.equal(state.awaitingSpeech,false);
 assert.equal(E.same(state.route.at(-1),E.goal),true);
 assert.equal(F.completeQuestSpeech(state).accepted,false);
});
test("quest only accepts neighbouring crossroads and real checkpoints",()=>{
 const start=F.createQuest();
 assert.equal(F.questMove(start,E.goal).accepted,false);
 const before=F.questMove(start,{c:1,r:3});
 assert.equal(before.accepted,true);
 assert.equal(before.state.stage,0);
 assert.equal(before.state.awaitingSpeech,false);
});
test("direction mapping and edge equality are deterministic",()=>{
 assert.deepEqual(F.nextFromDirection({c:1,r:1},"west"),{c:0,r:1});
 assert.throws(()=>F.nextFromDirection({c:0,r:0},"diagonal"),RangeError);
 assert.equal(F.sameEdge(F.closure.a,F.closure.b,F.closure.b,F.closure.a),true);
 assert.equal(F.sameEdge(F.closure.a,F.closure.b,E.start,E.goal),false);
});
