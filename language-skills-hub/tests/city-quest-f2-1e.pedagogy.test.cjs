"use strict";
/* F2.1E: preserve genuine wayfinding decisions. The problem statement must
 * not contain the answer to a task called "Find the Right Line".
 */
const {test}=require("node:test"),assert=require("node:assert/strict");
const L=require("../authoring/city-quest-f2-1d/metro-language.js");
const G=require("../authoring/city-quest-f2-1c/metro-game.js");
const M=require("../authoring/city-quest-f2-1b/metro-network.js");
test("The correct line and interchange are not given away in the problem statement",()=>{
 for(const lang of L.languages)for(const level of L.levels){
  const fifth=L.pack(lang,level,5),sixth=L.pack(lang,level,6),seventh=L.pack(lang,level,7);
  assert.doesNotMatch(fifth.goals[5],/\bM1\b/,"Station 05 should demand a map decision");
  assert.doesNotMatch(sixth.goals[6],/\bM2\b|\bM3\b|\bUniversity\b/,
   "Station 06 should demand choosing the connection");
  assert.doesNotMatch(sixth.pair[6],/\bM2\b|\bM3\b|\bUniversity\b/,
   "Pair partner should not have the interchange spoiled");
  assert.doesNotMatch(seventh.goals[7],/\bUniversity\b|\bM2\b|\bM3\b/,
   "Station 07 may reveal the closed M1 segment, not the alternative");
  assert.ok(seventh.goals[7].includes("Old Town")&&seventh.goals[7].includes("Museum Quarter"));
  for(const n of [5,6,7,8])assert.ok(L.model(lang,level,n).length>=40,
   "After solving, a target-language example is available in the self-check");
 }
 for(const [n,pattern] of [[5,/\bM1\b/],[6,/\bM2\b|\bM3\b|\bUniversity\b/],[7,/\bUniversity\b|\bM2\b|\bM3\b/]])
  assert.doesNotMatch(G.definitions[n].goal,pattern,"Canonical mission "+n+" should be spoiler-free");
});
test("Canonical routing remains strict after copy changes; notices reveal closure, not detour",()=>{
 assert.equal(G.validate(),true);
 const disruption=M.scenario("metro_07_b1");
 assert.ok(disruption.closedEdges.length>0);
 assert.equal(M.closed("old_town","museum_quarter","M1",disruption.closedEdges),true);
 for(const lang of L.languages){
  const c=L.pack(lang,"B1",7);
  assert.ok(c.phases.notice.includes("Old Town"));
  assert.ok(c.phases.notice.includes("Museum Quarter"));
  assert.ok(!c.phases.notice.includes("University"),
   "Service notice should not reveal the successful detour");
 }
});

// CQ-F5-009: the obligatory information-desk visit must not be justified
// only by the University appointment (M2 is already available at Central).
test("Metro 08 explicitly requires the Market Square ticket pickup before University",()=>{
 const required={en:/ticket/i,es:/entradas/i,de:/Eintrittskarten/i,fr:/billets/i};
 for(const lang of L.languages)for(const level of L.levels){
  const content=L.pack(lang,level,8),goal=content.goal;
  assert.match(goal,required[lang],lang+"/"+level+" omits the mandatory first errand");
  assert.match(goal,/Market Square/);
  assert.match(goal,/University/);
  const spoken=L.stage(lang,level,8,"checkpoint",{station:"Market Square"});
  assert.match(spoken,required[lang],lang+"/"+level+" omits ticket pickup at first checkpoint");
 }
 const s=G.start(8),scenario=M.scenario(s.scenarioId);
 assert.equal(scenario.start,"market_square","Metro begins only after the Market Square errand");
 assert.equal(s.ticketsCollected,false);
});

test("Metro 08 constrained shortest journey: ticket pickup and University meeting are nonoptional",()=>{
 // Independent breadth-first graph search. Every legal ride or transfer costs
 // one action; a valid arrival MUST pass the University meeting checkpoint.
 const s=M.scenario("metro_08_b1"),from=s.start,to=s.goal,meeting=s.requiredMeeting;
 assert.equal(from,"market_square");
 assert.equal(meeting,"university");
 const queue=M.joined(from).map(line=>({stop:from,line,met:false,steps:0}));
 const seen=new Set(queue.map(x=>[x.stop,x.line,x.met].join("|")));
 let optimum=Infinity;
 for(let i=0;i<queue.length;i++){
  const state=queue[i];
  if(state.stop===to&&state.met){optimum=state.steps;break;}
  const transitions=[
   ...M.nextStopOptions(state.stop,state.line,s.closedEdges).map(stop=>({
    stop,line:state.line,met:state.met||stop===meeting
   })),
   ...M.joined(state.stop).filter(line=>line!==state.line).map(line=>({
    stop:state.stop,line,met:state.met||state.stop===meeting
   }))
  ];
  for(const t of transitions){
   const key=[t.stop,t.line,t.met].join("|");
   if(seen.has(key))continue;
   seen.add(key);queue.push({...t,steps:state.steps+1});
  }
 }
 const route=s.legs.reduce((count,leg)=>count+leg.stops.length-1,0)+(s.legs.length-1);
 assert.equal(route,5,"Actual mission itinerary: four rides and one line change");
 assert.equal(optimum,route,"No shorter metro journey may satisfy the University meeting");
 const walk=(a,b)=>Math.abs(a.c-b.c)+Math.abs(a.r-b.r);
 const approach=walk(G.surfaceStart,G.portalStart),finish=walk(G.portalEnd,G.museum);
 assert.equal(approach,3);
 assert.equal(finish,1);
 assert.equal(route+approach+finish,optimum+3+1);
 // The information-desk pickup is a real mandatory gate, not just story copy.
 let state=G.start(8);
 for(const node of [{c:1,r:3},{c:2,r:3},{c:2,r:2}]){
  const next=G.act(state,{type:"WALK",node});
  assert.equal(next.accepted,true);state=next.state;
 }
 assert.equal(state.phase,"checkpoint");
 assert.equal(state.ticketsCollected,false);
 assert.equal(G.act(state,{type:"ENTER"}).accepted,false);
 const confirmed=G.act(state,{type:"SELF_CHECK"});
 assert.equal(confirmed.accepted,true);
 assert.equal(confirmed.state.phase,"enter");
 assert.equal(confirmed.state.ticketsCollected,true);
 assert.equal(G.act(confirmed.state,{type:"ENTER"}).accepted,true);
});
