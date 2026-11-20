/* City Quest F2 difficulty engine. Pure, deterministic and independent of UI.
 * It reuses the F1 verified graph and answers without any network access.
 */
(function(root, factory){
  "use strict";
  let base=root&&root.CityQuestF1Engine;
  if(!base&&typeof module==="object"&&module.exports)base=require("../city-quest-f1/engine.js");
  const engine=factory(base);
  if(typeof module==="object"&&module.exports)module.exports=engine;
  if(root)root.CityQuestF2Engine=engine;
})(typeof globalThis!=="undefined"?globalThis:this,function(F){
  "use strict";
  if(!F)throw new Error("City Quest F2 requires F1 engine");
  const E=F.E;
  const levels=["A1","A2","B1","B2","C1","C2"];
  const dirs=["north","east","south","west"];
  const lvlIndex=l=>{const i=levels.indexOf(l);if(i<0)throw new RangeError("Invalid CEFR level");return i;};
  const copy=n=>({c:n.c,r:n.r});
  const goals={
    A1:{target:{c:2,r:2},via:[],blocked:null}, // Market Square
    A2:{target:copy(E.goal),via:[],blocked:null},
    B1:{target:copy(E.goal),via:[],blocked:null},
    B2:{target:copy(E.goal),via:[{c:2,r:2}],blocked:null}, // Market Square
    C1:{target:copy(E.goal),via:[{c:4,r:2}],blocked:null}, // Library
    C2:{target:copy(E.goal),via:[{c:4,r:2}],blocked:F.closure}
  };
  const guidedPaths={
    A1:["east","east","north"],
    A2:["east","east","east","north","north"],
    B1:["east","east","north","north","east"],
    B2:["north","east","east","east","north"],
    C1:["east","east","north","east","east","north","west"],
    C2:["north","east","east","east","east","north","west"]
  };
  function pathFromDirections(steps,origin){
    const start=origin||E.start,route=[copy(start)];
    for(const dir of steps){
      const n=F.nextFromDirection(route[route.length-1],dir);
      if(!E.isNode(n))throw new RangeError("Guided directions leave the map");
      route.push(n);
    }
    return route;
  }
  function config(level){lvlIndex(level);return goals[level];}
  function routeStart(){return {route:[copy(E.start)],done:false,attempts:0,message:"",visitedVia:false};}
  function visited(route,via){return via.every(n=>route.some(p=>E.same(p,n)));}
  function moveRoute(state,next,level,detour){
    const c=config(level),blocked=detour?F.closure:c.blocked;
    // Detour must genuinely require navigating around the closed road at A1,
    // not finish early at Market Square before the roadworks matter.
    const target=detour?E.goal:c.target;
    if(state.done)return {accepted:false,state,kind:"finished"};
    const r=F.routeResult(state.route,next,blocked);
    if(!r.valid)return {accepted:false,kind:r.kind,state:{...state,attempts:state.attempts+1}};
    const progress=r.route,arrived=E.same(progress[progress.length-1],target);
    const completeVia=visited(progress,c.via);
    const done=arrived&&completeVia;
    return {accepted:true,kind:done?"success":arrived&&!completeVia?"missing-via":r.kind,
      state:{...state,route:progress,done,visitedVia:completeVia,message:done?"done":""}};
  }
  function guidedStart(){return {route:[copy(E.start)],step:0,done:false,attempts:0};}
  function guidedMove(state,next,level){
    const plan=guidedPaths[level];if(!plan)throw new RangeError("Invalid level");
    if(state.done)return {accepted:false,kind:"finished",state};
    const r=F.routeResult(state.route,next,null);
    if(!r.valid||r.kind==="undo")return {accepted:false,kind:r.kind,state:{...state,attempts:state.attempts+1}};
    if(E.heading(state.route[state.route.length-1],next)!==plan[state.step])
      return {accepted:false,kind:"wrong-way",state:{...state,attempts:state.attempts+1}};
    const step=state.step+1;
    return {accepted:true,kind:step===plan.length?"success":"move",
      state:{...state,route:r.route,step,done:step===plan.length}};
  }
  function instruction(pack,level,index){
    const plan=guidedPaths[level];
    if(!plan||index<0||index>=plan.length)throw new RangeError("Invalid direction step");
    const dir=plan[index],d=pack.directions;
    if(index===0)return d.first(d[dir],1);
    const prev=plan[index-1],delta=(dirs.indexOf(dir)-dirs.indexOf(prev)+4)%4;
    if(delta===0)return d.continue(d[dir],1);
    if(delta===1)return d.turn(d.right,d[dir],1);
    if(delta===3)return d.turn(d.left,d[dir],1);
    return d.turn(d.back,d[dir],1);
  }
  function answerCount(level){return lvlIndex(level)===0?3:lvlIndex(level)===1?4:6;}
  function optionsCount(level){return lvlIndex(level)===0?2:3;}
  function requiredFields(level){
    if(level==="A1")return ["line"];
    if(level==="A2")return ["line","depart"];
    return ["line","depart","stop"];
  }
  function checkTransport(input,level){
    const fields=requiredFields(level);
    if(!input||fields.some(key=>!input[key]))return {correct:false,kind:"missing"};
    const answer=F.transport.answer;
    const wrong=fields.find(key=>input[key]!==answer[key]);
    return {correct:!wrong,kind:wrong||"correct"};
  }
  function routeModel(pack,route){
    if(route.length<2)return "";
    const moves=[];
    for(let i=1;i<route.length;i++)moves.push(E.heading(route[i-1],route[i]));
    const segments=[];
    for(const move of moves){
      const last=segments[segments.length-1];
      if(last&&last.dir===move)last.count++;
      else segments.push({dir:move,count:1});
    }
    return segments.map((seg,i)=>{
      const d=pack.directions,current=d[seg.dir];
      if(i===0)return d.first(current,seg.count);
      const prev=segments[i-1].dir,delta=(dirs.indexOf(seg.dir)-dirs.indexOf(prev)+4)%4;
      if(delta===0)return d.continue(current,seg.count);
      return d.turn(delta===1?d.right:delta===3?d.left:d.back,current,seg.count);
    }).join(" ");
  }
  function questCheckpoints(level){
    lvlIndex(level);
    if(level==="A1")return [F.checkpoints[0],F.checkpoints[2]];
    return F.checkpoints;
  }
  function questStart(){return {stage:0,route:[copy(E.start)],leg:[copy(E.start)],awaitingSpeech:false,done:false,attempts:0};}
  function questMove(state,next,level){
    if(state.done||state.awaitingSpeech)return {accepted:false,kind:state.done?"finished":"speak",state};
    const r=F.routeResult(state.leg,next,level==="C2"?F.closure:null);
    if(!r.valid)return {accepted:false,kind:r.kind,state:{...state,attempts:state.attempts+1}};
    const list=questCheckpoints(level),at=list[state.stage];
    const newRoute=r.kind==="undo"?state.route.slice(0,-1):state.route.concat([copy(next)]);
    const checkpoint=E.same(next,at.node);
    return {accepted:true,kind:checkpoint?"checkpoint":r.kind,
      state:{...state,route:newRoute,leg:r.route,awaitingSpeech:checkpoint}};
  }
  function questSpeak(state,level){
    if(!state.awaitingSpeech||state.done)return {accepted:false,state};
    const stage=state.stage+1,done=stage===questCheckpoints(level).length;
    return {accepted:true,state:{...state,stage,leg:[copy(state.route[state.route.length-1])],awaitingSpeech:false,done}};
  }
  const dialogueStates=["start","clarify","wrong","distance","complete"];
  function dialogueStart(){return {stage:"start",tries:0,done:false,correct:false};}
  function dialogueChoose(state,id){
    if(state.done)return {state,accepted:false,kind:"finished"};
    if(!dialogueStates.includes(state.stage))throw new RangeError("Invalid dialogue stage");
    const map={
      start:{help:"distance",vague:"clarify",wrong:"wrong"},
      clarify:{help:"distance",vague:"clarify"},
      wrong:{repair:"distance",insist:"wrong"},
      distance:{distance:"complete",nohelp:"distance"}
    };
    const next=map[state.stage]&&map[state.stage][id];
    if(!next)return {state,accepted:false,kind:"invalid"};
    const correct=(state.stage==="start"&&id==="help")||(state.stage==="clarify"&&id==="help")||
      (state.stage==="wrong"&&id==="repair")||(state.stage==="distance"&&id==="distance");
    return {accepted:true,kind:next==="complete"?"complete":correct?"good":"retry",
      state:{...state,stage:next,tries:state.tries+1,done:next==="complete",correct}};
  }
  return Object.freeze({F,E,levels,goals,guidedPaths,lvlIndex,config,pathFromDirections,routeStart,
    moveRoute,guidedStart,guidedMove,instruction,answerCount,optionsCount,requiredFields,checkTransport,
    routeModel,questCheckpoints,questStart,questMove,questSpeak,dialogueStart,dialogueChoose});
});
