"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const C=require("../authoring/city-quest-f2/content-a.js");
require("../authoring/city-quest-f2/content-b.js");
const G=require("../authoring/city-quest-f2/engine.js");
const F=G.F,E=G.E;
const fields=["focus","explore","route","dialogue","guided","transit","repair","detour","quest","model","dialogueAnswer","speaking","stretch","support"];
test("F2 supports exactly 4 languages and 6 levels",()=>{
 assert.deepEqual(C.languages,["en","es","de","fr"]);
 assert.deepEqual(C.levels,["A1","A2","B1","B2","C1","C2"]);
 assert.equal(C.languages.length*C.levels.length,24);
});
test("F2 complete localized UI and CEFR pedagogical profiles in 24 variants",()=>{
 const reference=Object.keys(C.pack("en").ui).sort();
 for(const language of C.languages){
  const p=C.pack(language);
  assert.equal(p.stations.length,8,language);
  assert.equal(p.clues.length,6,language);
  assert.deepEqual(Object.keys(p.ui).sort(),reference,language+" missing UI labels");
  assert.deepEqual(Object.keys(p.places).sort(),Object.keys(C.pack("en").places).sort(),language+" places");
  assert.deepEqual(Object.keys(p.mapLabels).sort(),Object.keys(C.pack("en").mapLabels).sort(),language+" map labels");
  for(const level of C.levels){
   const profile=C.profile(language,level);
   for(const key of fields)assert.ok(typeof profile[key]==="string"&&profile[key].length>25,
     language+"/"+level+": missing substantial "+key);
   assert.equal(p.stations.every(s=>s[0]&&s[1]),true,language+" station titles");
   assert.ok(profile.dialogueAnswer.length>=25,language+"/"+level+" must have original dialogue response");
  }
 }
});
test("F2 level profiles are materially differentiated within each language",()=>{
 for(const language of C.languages){
  const p=C.pack(language);
  for(const key of ["model","route","speaking","dialogueAnswer"]){
   const unique=new Set(C.levels.map(l=>p.profiles[l][key]));
   assert.equal(unique.size,6,language+" / "+key+" must differ across A1-C2");
  }
 }
});
test("F2 route difficulty includes distinct destinations, via points and roadworks",()=>{
 assert.deepEqual(G.config("A1").target,{c:2,r:2});
 assert.equal(G.config("B1").via.length,0);
 assert.equal(G.config("B2").via.length,1);
 assert.deepEqual(G.config("C1").via[0],{c:4,r:2});
 assert.ok(G.config("C2").blocked);
 assert.throws(()=>G.config("X1"),RangeError);
});
test("F2 guided routes are traversable and end at level-appropriate targets",()=>{
 for(const level of C.levels){
  const route=G.pathFromDirections(G.guidedPaths[level]);
  const target=G.config(level).target;
  assert.ok(E.same(route.at(-1),target),level+" wrong destination");
  let state=G.guidedStart();
  for(let i=0;i<G.guidedPaths[level].length;i++){
   const r=G.guidedMove(state,route[i+1],level);
   assert.equal(r.accepted,true,level+" step "+i);
   state=r.state;
   for(const language of C.languages){
    const sentence=G.instruction(C.pack(language),level,i);
    assert.ok(sentence.length>=15,!sentence);
    assert.ok(!/undefined|null|NaN/.test(sentence),language+"/"+level+"/"+i);
   }
  }
  assert.equal(state.done,true,level);
  assert.equal(G.guidedMove(G.guidedStart(),E.goal,level).accepted,false);
 }
});
test("F2 shorter A1 vocabulary and multi-field transit increase difficulty",()=>{
 assert.equal(G.answerCount("A1"),3);
 assert.equal(G.answerCount("A2"),4);
 assert.equal(G.answerCount("B1"),6);
 assert.equal(G.optionsCount("A1"),2);
 assert.equal(G.optionsCount("B2"),3);
 assert.deepEqual(G.requiredFields("A1"),["line"]);
 assert.deepEqual(G.requiredFields("A2"),["line","depart"]);
 assert.deepEqual(G.requiredFields("B1"),["line","depart","stop"]);
 assert.equal(G.checkTransport({line:"24"},"A1").correct,true);
 assert.equal(G.checkTransport({line:"24"},"B1").correct,false);
 assert.equal(G.checkTransport({line:"24",depart:"08:47",stop:"Hospital"},"C2").correct,true);
 assert.equal(G.checkTransport({line:"12",depart:"08:47",stop:"Hospital"},"C2").kind,"line");
});
test("B2 route requires Market Square; C1 requires Library; C2 blocks road",()=>{
 let state=G.routeStart();
 for(const dir of ["east","east","east","north","north"]){
  const n=F.nextFromDirection(state.route.at(-1),dir);
  state=G.moveRoute(state,n,"B2",false).state;
 }
 assert.equal(state.done,false,"B2 must not skip Market Square");
 state=G.routeStart();
 for(const dir of ["east","east","north","east","east","north","west"]){
  const n=F.nextFromDirection(state.route.at(-1),dir);
  state=G.moveRoute(state,n,"C1",false).state;
 }
 assert.equal(state.done,true,"C1 must pass the Library");
 state=G.routeStart();
 for(const dir of ["east","east"]){
  const n=F.nextFromDirection(state.route.at(-1),dir);
  state=G.moveRoute(state,n,"C2",false).state;
 }
 const blocked=G.moveRoute(state,{c:3,r:3},"C2",false);
 assert.equal(blocked.accepted,false);
 assert.equal(blocked.kind,"closed");
});
test("A1 detour still reaches museum instead of ending before the roadworks",()=>{
 let state=G.routeStart();
 for(const dir of ["east","east","north"]){
  const n=F.nextFromDirection(state.route.at(-1),dir);
  state=G.moveRoute(state,n,"A1",true).state;
 }
 assert.equal(state.done,false,"A1 detour must not finish at the Square");
 for(const dir of ["east","south","east","north","north","west"]){
  const n=F.nextFromDirection(state.route.at(-1),dir);
  state=G.moveRoute(state,n,"A1",true).state;
 }
 assert.equal(state.done,true);
});
test("all languages generate complete, localized route models",()=>{
 const route=G.pathFromDirections(G.guidedPaths.B1);
 const models=C.languages.map(lang=>G.routeModel(C.pack(lang),route));
 assert.equal(new Set(models).size,4);
 models.forEach((model,i)=>{assert.ok(model.length>45,C.languages[i]);assert.ok(!model.includes("undefined"));});
});
test("quest A1 has two checkpoints; higher levels have three and require speaking acknowledgement",()=>{
 for(const level of C.levels){
  let state=G.questStart();
  const stops=G.questCheckpoints(level);
  assert.equal(stops.length,level==="A1"?2:3);
  const legs=level==="A1"?[["east","east","north"],["north","east"]]:
    [["east","east","north"],["east","east"],["west","north"]];
  for(let k=0;k<legs.length;k++){
   for(const dir of legs[k]){
    const n=F.nextFromDirection(state.leg.at(-1),dir);
    const r=G.questMove(state,n,level);
    assert.equal(r.accepted,true,level+" leg "+k+" dir "+dir+" kind "+r.kind);
    state=r.state;
   }
   assert.equal(state.awaitingSpeech,true);
   assert.equal(G.questMove(state,E.goal,level).accepted,false);
   const acknowledge=G.questSpeak(state,level);
   assert.equal(acknowledge.accepted,true);
   state=acknowledge.state;
  }
  assert.equal(state.done,true);
 }
});
test("F2 branching dialogue allows clarification and repair in each level",()=>{
 for(const level of C.levels){
  let state=G.dialogueStart();
  state=G.dialogueChoose(state,"wrong").state;assert.equal(state.stage,"wrong");
  state=G.dialogueChoose(state,"repair").state;assert.equal(state.stage,"distance");
  state=G.dialogueChoose(state,"distance").state;assert.equal(state.stage,"complete");
  assert.equal(state.done,true);
  const vague=G.dialogueChoose(G.dialogueStart(),"vague");
  assert.equal(vague.state.stage,"clarify");
 }
});


test("F5C CQ-F5-003: stable semantic answers but varied positions in CITY 01, 03 and 06",()=>{
 const cases=[
  {mission:1,stage:0,options:[F.explore[0].correct,F.explore[0].choices.find(x=>x!==F.explore[0].correct)],correct:F.explore[0].correct},
  {mission:3,stage:"start",options:["help","vague","wrong"],correct:"help"},
  {mission:3,stage:"distance",options:["distance","nohelp"],correct:"distance"},
  {mission:6,stage:0,options:[0,1,2],correct:1},
  {mission:6,stage:1,options:[0,1,2],correct:0}
 ];
 for(const c of cases){
  const positions=new Set();
  for(const lang of C.languages)for(const level of C.levels){
   const original=c.options;
   const ordered=G.orderChoices(original,lang,level,c.mission,c.stage);
   assert.deepEqual([...ordered].sort(),[...original].sort(),lang+"/"+level+" altered answer values");
   assert.deepEqual(ordered,G.orderChoices(original,lang,level,c.mission,c.stage),
    lang+"/"+level+" options changed during a re-render");
   assert.deepEqual(c.options,original);
   positions.add(ordered.indexOf(c.correct));
  }
  assert.ok(positions.size>=2,"Fixed correct button across all 24 variants in mission "+c.mission+" "+c.stage);
 }
});


test("F5C CQ-F5-010: level-specific closures make the natural shortest city route unavailable",()=>{
 const search=(level,closures)=>{
  const required=G.detourCheckpoints(level),goal=E.goal,
   queue=[{p:E.start,mask:0,d:0}],seen=new Set();
  for(let i=0;i<queue.length;i++){
   const {p,mask,d}=queue[i],visited=required.reduce((bits,v,j)=>
      bits|(E.same(p,v)?1<<j:0),mask);
   const key=p.c+","+p.r+","+visited;if(seen.has(key))continue;seen.add(key);
   if(E.same(p,goal)&&visited===(1<<required.length)-1)return d;
   for(const direction of ["north","east","south","west"]){
    const next=F.nextFromDirection(p,direction);
    if(!E.isNode(next))continue;
    if(closures.some(e=>(E.same(p,e.a)&&E.same(next,e.b))||
      (E.same(p,e.b)&&E.same(next,e.a))))continue;
    queue.push({p:next,mask:visited,d:d+1});
   }
  }
  throw Error("Unreachable detour for "+level);
 };
 for(const level of G.levels){
  const before=search(level,[]),after=search(level,G.detourClosures(level));
  assert.ok(after>before,level+": roadworks must lengthen a genuinely natural route");
  assert.equal(G.detourClosures(level).length,["C1","C2"].includes(level)?3:2);
 }
 let state=G.routeStart(),out;
 for(const node of [{c:0,r:2},{c:1,r:2},{c:2,r:2},{c:3,r:2}]){
  out=G.moveRoute(state,node,"B1",true);assert.equal(out.accepted,true);state=out.state;
 }
 out=G.moveRoute(state,E.goal,"B1",true);
 assert.equal(out.accepted,false);assert.equal(out.kind,"closed");
 assert.deepEqual(out.state.route,state.route,"Roadworks must not move the player");
 assert.deepEqual(G.detourCheckpoints("B1"),[]);
 assert.deepEqual(G.detourCheckpoints("C2"),[{c:4,r:2}]);
 const walk=(level,points)=>{
  let s=G.routeStart(),r;for(const p of points){r=G.moveRoute(s,p,level,true);
   assert.equal(r.accepted,true,level+" rejected valid detour at "+JSON.stringify(p));s=r.state;}
  assert.equal(s.done,true);return s;
 };
 const open=[{c:1,r:3},{c:2,r:3},{c:2,r:2},{c:3,r:2},{c:3,r:3},
  {c:4,r:3},{c:4,r:2},{c:4,r:1},E.goal];
 walk("B1",open);
 const advanced=[{c:1,r:3},{c:2,r:3},{c:2,r:2},{c:3,r:2},{c:3,r:3},
  {c:4,r:3},{c:4,r:2},{c:4,r:1},{c:4,r:0},{c:3,r:0},E.goal];
 walk("C2",advanced);
});
test("F5C CQ-F5-011: real timetable progressively adds late and inaccessible hospital-bound alternatives",()=>{
 assert.deepEqual(["A1","B1","B2","C1","C2"].map(l=>G.servicesForLevel(l).length),[3,3,4,5,5]);
 for(const level of G.levels){
  const rows=G.servicesForLevel(level);
  const options=G.transportOptions(level);
  assert.equal(options.lines.length,rows.length);
  assert.ok(options.lines.includes("24"));
  const valid=G.checkTransport({line:"24",depart:"08:47",stop:"Hospital"},level);
  assert.equal(valid.correct,true,level);
  assert.equal(valid.service.arrival,"09:05");
  assert.equal(G.checkTransport({line:"7",depart:"08:39",stop:"Riverside Park"},level).kind,"line");
 }
 assert.equal(G.checkTransport({line:"18",depart:"08:41",stop:"Hospital"},"B2").kind,"late");
 assert.equal(G.checkTransport({line:"18",depart:"08:41",stop:"Hospital"},"C1").kind,"late");
 assert.equal(G.checkTransport({line:"31",depart:"08:38",stop:"Hospital"},"C1").kind,"access");
 assert.equal(G.checkTransport({line:"31",depart:"08:38",stop:"Hospital"},"C2").kind,"access");
 assert.equal(G.checkTransport({line:"24",depart:"08:41",stop:"Hospital"},"C2").kind,"depart");
 assert.ok(!G.transportOptions("B1").lines.includes("18"));
 assert.ok(!G.transportOptions("B2").lines.includes("31"));
});


test("F5C CQ-F5-008: advanced guided mission requires route and contextual reasoning, not only map taps",()=>{
 const semantic={B2:"left",C1:"library",C2:"closure"};
 for(const level of C.levels){
  let state=G.guidedStart(),out;
  assert.equal(G.guidedReview(state,level,"left").accepted,false,"review cannot precede route");
  for(const dir of G.guidedPaths[level]){
   const next=F.nextFromDirection(state.route.at(-1),dir);
   out=G.guidedMove(state,next,level);
   assert.equal(out.accepted,true,level+" must remain navigable");
   state=out.state;
  }
  assert.equal(state.done,true,level);
  if(["A1","A2","B1"].includes(level)){
   assert.equal(G.guidedReview(state,level,"left").kind,"unavailable");
   continue;
  }
  assert.equal(state.reviewed,false,"Navigation alone must not complete advanced reasoning");
  const incorrect=G.guidedReview(state,level,"wrong");
  assert.equal(incorrect.accepted,false);assert.equal(incorrect.kind,"incorrect");
  assert.equal(incorrect.state.reviewed,false);
  assert.equal(incorrect.state.reviewAttempts,1);
  const correct=G.guidedReview(incorrect.state,level,semantic[level]);
  assert.equal(correct.accepted,true);assert.equal(correct.state.reviewed,true);
  assert.equal(G.guidedReview(correct.state,level,semantic[level]).accepted,false);
 }
});
test("F5C CQ-F5-008: staged correction is 2 decisions A1-B1, 3 at B2 and 4 at C1/C2",()=>{
 const answers=["turn","left","south","apology"],expected={A1:2,A2:2,B1:2,B2:3,C1:4,C2:4};
 for(const level of C.levels){
  let state=G.repairStart();const stages=G.repairStages(level);
  assert.equal(stages,expected[level]);
  for(let i=0;i<stages;i++){
   assert.equal(state.phase,i);
   const wrong=G.repairChoice(state,level,"incorrect-value");
   assert.equal(wrong.accepted,false,level+" wrong response must not advance");
   assert.equal(wrong.state.phase,i);
   assert.equal(wrong.state.tries,state.tries+1);
   const correct=G.repairChoice(wrong.state,level,answers[i]);
   assert.equal(correct.accepted,true,level+" stage "+i);
   assert.equal(correct.state.phase,i+1);
   state=correct.state;
  }
  assert.equal(state.done,true,level);
  assert.equal(G.repairChoice(state,level,"apology").kind,"finished");
 }
 assert.throws(()=>G.repairStages("ZZ"),RangeError);
});

test("F5C N04: CEFR dialogue distractors cannot be identified by length alone",()=>{
 for(const lang of C.languages)for(const level of C.levels){
  const answer=C.profile(lang,level).dialogueAnswer,
   d=G.dialogueDistractors(answer,lang),
   choices=[answer,d.vague,d.wrong];
  assert.equal(new Set(choices).size,3,lang+"/"+level);
  assert.ok(d.vague.length>=answer.length*0.75&&d.wrong.length>=answer.length*0.75,
   lang+"/"+level+" distractors too short");
  assert.ok(Math.max(...choices.map(s=>s.length))<=Math.min(...choices.map(s=>s.length))*1.3,
   lang+"/"+level+" length leaks the answer");
  assert.ok(d.vague!==answer&&d.wrong!==answer);
  assert.ok(d.insist.length>answer.length*0.8);
 }
});

test("F5C-008: advanced city exploration increases decision space without answer leakage",()=>{
 const sizes={A1:2,A2:3,B1:3,B2:3,C1:4,C2:5};
 for(const level of G.levels){
  assert.equal(G.optionsCount(level),sizes[level]);
  for(let round=0;round<F.explore.length;round++){
   const question=F.explore[round],ids=G.exploreChoices(question,level,round);
   assert.equal(ids.length,sizes[level],level+" round "+round);
   assert.equal(new Set(ids).size,ids.length,"Duplicate candidates");
   assert.ok(ids.includes(question.correct));
   assert.ok(ids.every(id=>F.findPlace(id)),"Unknown landmark");
   for(const language of C.languages){
    const ordered=G.orderChoices(ids,language,level,1,round);
    assert.deepEqual(new Set(ordered),new Set(ids));
   }
  }
 }
});
