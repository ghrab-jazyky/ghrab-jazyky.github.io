(function (root, build) {
  "use strict";
  var base = root && root.CityQuestEngine;
  if (!base && typeof module === "object" && module.exports) {
    base = require("../city-quest-f0/engine.js");
  }
  var game = build(base);
  if (typeof module === "object" && module.exports) module.exports = game;
  if (root) root.CityQuestF1Engine = game;
})(typeof globalThis !== "undefined" ? globalThis : this, function (E) {
  "use strict";
  if (!E) throw new Error("City Quest F1 requires the tested F0 route engine");
  var frozen = Object.freeze;
  var stations = frozen([
    {id:1,name:"Explore the City",short:"Explore",icon:"🗺️",type:"vocabulary"},
    {id:2,name:"Find the Route",short:"Route",icon:"🧭",type:"route"},
    {id:3,name:"Ask for Directions",short:"Dialogue",icon:"💬",type:"dialogue"},
    {id:4,name:"Follow My Directions",short:"Follow",icon:"👣",type:"guided"},
    {id:5,name:"Catch the Right Bus",short:"Transport",icon:"🚌",type:"transit"},
    {id:6,name:"Oops! Wrong Turn",short:"Wrong Turn",icon:"↩️",type:"repair"},
    {id:7,name:"The Unexpected Detour",short:"Detour",icon:"🚧",type:"detour"},
    {id:8,name:"The Ultimate City Quest",short:"Final Quest",icon:"🏆",type:"quest"}
  ]);
  var places = frozen([
    {id:"station",label:"Central Station",icon:"🚉",clue:"Passengers arrive here by train.",meaning:"A place where trains stop and passengers get on or off."},
    {id:"museum",label:"City Museum",icon:"🏛️",clue:"Learn about the town's history in this building.",meaning:"A building where historical objects are displayed."},
    {id:"hospital",label:"Hospital",icon:"🏥",clue:"You should go here if you are seriously injured.",meaning:"A place where doctors treat patients."},
    {id:"library",label:"Library",icon:"📚",clue:"You can borrow books or study quietly here.",meaning:"A place where you can borrow books."},
    {id:"square",label:"Market Square",icon:"⛲",clue:"Meet friends near the fountain in the town centre.",meaning:"An open public area surrounded by streets and buildings."},
    {id:"park",label:"Riverside Park",icon:"🌳",clue:"A green area next to the river where people can relax.",meaning:"A public green space with trees and paths."},
    {id:"cafe",label:"Sunrise Café",icon:"☕",clue:"Stop here for a hot drink and a small snack.",meaning:"A small place serving coffee, tea and light meals."},
    {id:"post",label:"Post Office",icon:"✉️",clue:"You can send a parcel or buy stamps here.",meaning:"A place where letters and parcels are sent."}
  ]);
  var explore = frozen([
    {clue:"Your train has just arrived. Where are you?",choices:["museum","station","hospital"],correct:"station",explanation:"Trains arrive at Central Station."},
    {clue:"A visitor wants to see historical exhibits. Where should they go?",choices:["library","museum","cafe"],correct:"museum",explanation:"A museum displays historical exhibits."},
    {clue:"You need urgent medical attention. Which building can help?",choices:["hospital","post","square"],correct:"hospital",explanation:"Doctors can help at the hospital."},
    {clue:"You want to borrow a novel. Which place do you need?",choices:["cafe","park","library"],correct:"library",explanation:"A library lends books to readers."},
    {clue:"Meet your friend beside the central fountain. Where?",choices:["square","station","post"],correct:"square",explanation:"The fountain is in Market Square."},
    {clue:"You want to walk among trees near the river. Where?",choices:["museum","park","hospital"],correct:"park",explanation:"Riverside Park is the green area by the river."}
  ]);
  var guided = frozen([
    {direction:"east",instruction:"From Central Station, head EAST for one block.",hint:"Go towards the centre of the city."},
    {direction:"east",instruction:"Continue EAST for another block.",hint:"Keep the same direction."},
    {direction:"north",instruction:"At the next crossroads, turn LEFT and walk NORTH.",hint:"You were moving east; left is north."},
    {direction:"north",instruction:"Keep going NORTH for one more block.",hint:"Don't turn yet."},
    {direction:"east",instruction:"Now turn RIGHT and walk EAST to the City Museum.",hint:"You were moving north; right is east."}
  ]);
  var transport = frozen({
    task:"It's 08:35. You must reach the Hospital before 09:10. Choose the correct service, departure time and destination stop.",
    lines:frozen([
      {line:"7",from:"Central Station",depart:"08:39",to:"Riverside Park",arrival:"08:55"},
      {line:"12",from:"Central Station",depart:"08:44",to:"City Museum",arrival:"08:59"},
      {line:"24",from:"Central Station",depart:"08:47",to:"Hospital",arrival:"09:05"}
    ]),
    answer:frozen({line:"24",depart:"08:47",stop:"Hospital"}),
    options:frozen({lines:["7","12","24"],departures:["08:39","08:44","08:47"],stops:["Riverside Park","City Museum","Hospital"]})
  });
  var mistake = frozen({
    instruction:"From Central Station, go EAST for three blocks. Then turn RIGHT and walk NORTH for two blocks to reach the City Museum.",
    choices:frozen([
      {id:"three",text:"Go east for three blocks"},
      {id:"turn",text:"Turn right"},
      {id:"north",text:"Walk north for two blocks"}
    ]),
    wrong:"turn",
    correction:"Turn LEFT and walk NORTH for two blocks.",
    correctedChoices:frozen([
      {id:"left",text:"Turn LEFT and walk NORTH for two blocks."},
      {id:"south",text:"Continue SOUTH for two blocks."},
      {id:"west",text:"Turn LEFT and walk WEST for two blocks."}
    ]),
    corrected:"left"
  });
  var closure = frozen({a:frozen({c:2,r:3}),b:frozen({c:3,r:3}),reason:"Station Road is closed for roadworks."});
  var checkpoints = frozen([
    {id:"square",name:"Market Square",node:frozen({c:2,r:2}),prompt:"Explain how to get to Market Square from Central Station. Mention the fountain.",sample:"Go east for two blocks, then turn left and go north for one block. The fountain is in Market Square."},
    {id:"library",name:"Library",node:frozen({c:4,r:2}),prompt:"Tell your partner where the library is in relation to Market Square.",sample:"From Market Square, walk east for two blocks. The library is close to the next crossroads."},
    {id:"museum",name:"City Museum",node:frozen({c:3,r:1}),prompt:"Give the tourist directions to the museum and politely end the conversation.",sample:"Turn left and walk one block west, then turn right and go one block north. The museum is nearby. Enjoy your visit!"}
  ]);
  function equal(a,b){return E.same(a,b);}
  function copyNode(n){return {c:n.c,r:n.r};}
  function copyPath(route){return route.map(copyNode);}
  function validHop(a,b){
    return E.isNode(a)&&E.isNode(b)&&E.distance(a,b)===1;
  }
  function sameEdge(a,b,c,d){
    return (equal(a,c)&&equal(b,d))||(equal(a,d)&&equal(b,c));
  }
  function direction(a,b){return E.heading(a,b);}
  function nextFromDirection(node,dir){
    var delta = {north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]}[dir];
    if(!delta)throw new RangeError("Unknown direction");
    return {c:node.c+delta[0],r:node.r+delta[1]};
  }
  function routeResult(route,next,blocked){
    var last=route[route.length-1];
    if(!E.isNode(next))return {valid:false,kind:"bounds",reason:"That street is outside the city."};
    if(!validHop(last,next))return {valid:false,kind:"distance",reason:"Travel one block at a time."};
    if(blocked&&sameEdge(last,next,blocked.a,blocked.b)){
      return {valid:false,kind:"closed",reason:"Roadworks! This street is closed. Find another route."};
    }
    if(route.length>1&&equal(route[route.length-2],next)){
      return {valid:true,kind:"undo",reason:"You stepped back one block.",route:copyPath(route.slice(0,-1))};
    }
    if(route.some(function(n){return equal(n,next);})){
      return {valid:false,kind:"loop",reason:"You've already visited this crossroads. Find another street or use Undo."};
    }
    return {valid:true,kind:"move",reason:"One block completed.",route:copyPath(route.concat([next]))};
  }
  function createGuided(){
    return {route:[copyNode(E.start)],step:0,done:false,attempts:0,last:"Listen to the first direction."};
  }
  function guidedMove(state,next){
    if(state.done)return {state:state,accepted:false,kind:"finished",message:"Mission already finished."};
    var legal=routeResult(state.route,next,null);
    if(!legal.valid||legal.kind==="undo"){
      return {state:Object.assign({},state,{attempts:state.attempts+1}),accepted:false,kind:legal.kind,message:legal.reason};
    }
    var expected=guided[state.step].direction;
    if(direction(state.route[state.route.length-1],next)!==expected){
      return {state:Object.assign({},state,{attempts:state.attempts+1}),accepted:false,kind:"incorrect",message:"Not quite. Listen again and check the direction."};
    }
    var step=state.step+1,done=step===guided.length;
    var result={route:legal.route,step:step,done:done,attempts:state.attempts,
      last:done?"Great! You reached the City Museum by following all five instructions.":"Correct! Read the next instruction."};
    return {state:result,accepted:true,kind:done?"success":"move",message:result.last};
  }
  function checkTransport(input){
    var answer=transport.answer;
    if(!input||!input.line||!input.depart||!input.stop)
      return {correct:false,message:"Choose a bus line, departure time and destination stop first."};
    if(input.line!==answer.line)return {correct:false,message:"That bus goes to another part of Riverton. Check the route's final stop."};
    if(input.depart!==answer.depart)return {correct:false,message:"Check the departure board for line 24."};
    if(input.stop!==answer.stop)return {correct:false,message:"You need the stop named Hospital."};
    return {correct:true,message:"Excellent! Line 24 leaves at 08:47 and reaches the Hospital at 09:05 — five minutes before the deadline."};
  }
  function createDetour(){
    return {route:[copyNode(E.start)],done:false,attempts:0,completedBlocks:0,message:closure.reason};
  }
  function detourMove(state,next){
    if(state.done)return {state:state,accepted:false,kind:"finished",message:"Detour completed."};
    var legal=routeResult(state.route,next,closure);
    if(!legal.valid){
      return {state:Object.assign({},state,{attempts:state.attempts+1}),accepted:false,kind:legal.kind,message:legal.reason};
    }
    var reached=equal(legal.route[legal.route.length-1],E.goal);
    var result={route:legal.route,done:reached,attempts:state.attempts,completedBlocks:legal.route.length-1,
      message:reached?"You found an open route to the museum! Explain how you avoided the roadworks.":legal.reason};
    return {state:result,accepted:true,kind:reached?"success":legal.kind,message:result.message};
  }
  function createQuest(){
    return {stage:0,route:[copyNode(E.start)],leg:[copyNode(E.start)],
      awaitingSpeech:false,done:false,attempts:0,message:"Find Market Square first."};
  }
  function questMove(state,next){
    if(state.done)return {state:state,accepted:false,kind:"finished",message:"Quest completed."};
    if(state.awaitingSpeech)return {state:state,accepted:false,kind:"speak",message:"Explain your route aloud before continuing."};
    var legal=routeResult(state.leg,next,null);
    if(!legal.valid){
      return {state:Object.assign({},state,{attempts:state.attempts+1}),accepted:false,kind:legal.kind,message:legal.reason};
    }
    var stageGoal=checkpoints[state.stage];
    var reached=equal(next,stageGoal.node);
    var route=legal.kind==="undo"?state.route.slice(0,-1):state.route.concat([copyNode(next)]);
    var result=Object.assign({},state,{route:copyPath(route),leg:legal.route,awaitingSpeech:reached,
      message:reached?"Checkpoint reached: "+stageGoal.name+". Now complete the speaking challenge.":legal.reason});
    return {state:result,accepted:true,kind:reached?"checkpoint":legal.kind,message:result.message};
  }
  function completeQuestSpeech(state){
    if(!state.awaitingSpeech||state.done)return {state:state,accepted:false};
    var isFinal=state.stage===checkpoints.length-1;
    var stage=state.stage+1;
    var last=copyNode(state.route[state.route.length-1]);
    return {accepted:true,state:Object.assign({},state,{
      stage:stage,leg:[last],awaitingSpeech:false,done:isFinal,
      message:isFinal?"City Quest complete. You visited all three destinations.":"Great. Continue to "+checkpoints[stage].name+"."
    })};
  }
  function checkErrorIdentification(id){
    return {correct:id===mistake.wrong,message:id===mistake.wrong
      ?"Exactly! After travelling EAST, turning RIGHT points SOUTH, not NORTH."
      :"Look at the relationship between the turn and the direction immediately after it."};
  }
  function checkCorrection(id){
    return {correct:id===mistake.corrected,message:id===mistake.corrected
      ?"Correct. Turning LEFT from EAST leads NORTH, towards the museum."
      :"The museum is north of the final eastbound crossroads. Try again."};
  }
  function findPlace(id){return places.find(function(p){return p.id===id;})||null;}
  function answerExplore(index,id){
    var round=explore[index];
    if(!round)throw new RangeError("Unknown vocabulary challenge");
    return {correct:round.correct===id,message:round.correct===id?round.explanation:
      "Look again at the clue. "+(findPlace(id)?findPlace(id).label+" isn't the best match.":"")};
  }
  return frozen({E:E,stations:stations,places:places,explore:explore,guided:guided,
    transport:transport,mistake:mistake,closure:closure,checkpoints:checkpoints,
    equal:equal,validHop:validHop,sameEdge:sameEdge,nextFromDirection:nextFromDirection,
    routeResult:routeResult,createGuided:createGuided,guidedMove:guidedMove,
    checkTransport:checkTransport,createDetour:createDetour,detourMove:detourMove,
    createQuest:createQuest,questMove:questMove,completeQuestSpeech:completeQuestSpeech,
    checkErrorIdentification:checkErrorIdentification,checkCorrection:checkCorrection,
    findPlace:findPlace,answerExplore:answerExplore});
});
