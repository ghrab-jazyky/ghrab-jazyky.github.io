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
  // F5C-010: city detour closures block BOTH normal shortest approaches to
  // City Museum. C1/C2 add a third approach. F1/classic routes remain untouched.
  const detourWest=Object.freeze({a:{c:2,r:1},b:{c:3,r:1}}),
    detourSouth=Object.freeze({a:{c:3,r:2},b:{c:3,r:1}}),
    detourEast=Object.freeze({a:{c:4,r:1},b:{c:3,r:1}});
  function detourClosures(level){
    const advanced=lvlIndex(level)>=4;
    return advanced?[detourWest,detourSouth,detourEast]:
      [detourWest,detourSouth];
  }
  function isClosedEdge(a,b,edge){
    return (E.same(a,edge.a)&&E.same(b,edge.b))||
      (E.same(a,edge.b)&&E.same(b,edge.a));
  }
  function routeStart(){return {route:[copy(E.start)],done:false,attempts:0,message:"",visitedVia:false};}
  function visited(route,via){return via.every(n=>route.some(p=>E.same(p,n)));}
  function moveRoute(state,next,level,detour){
    const c=config(level),blocked=detour?null:c.blocked;
    const target=detour?E.goal:c.target;
    if(state.done)return {accepted:false,state,kind:"finished"};
    if(detour&&detourClosures(level).some(edge=>isClosedEdge(state.route.at(-1),next,edge)))
      return {accepted:false,kind:"closed",state:{...state,attempts:state.attempts+1}};
    const r=F.routeResult(state.route,next,blocked);
    if(!r.valid)return {accepted:false,kind:r.kind,state:{...state,attempts:state.attempts+1}};
    const progress=r.route,arrived=E.same(progress[progress.length-1],target);
    // Students avoid closed streets; they never have to visit the roadworks.
    // B2+ retain their real level-specific landmarks.
    const requiredVia=c.via;
    const completeVia=visited(progress,requiredVia);
    if(detour&&arrived&&!completeVia)
      return {accepted:false,kind:"missing-via",
        state:{...state,attempts:state.attempts+1}};
    const done=arrived&&completeVia;
    return {accepted:true,kind:done?"success":arrived&&!completeVia?"missing-via":r.kind,
      state:{...state,route:progress,done,visitedVia:completeVia,message:done?"done":""}};
  }
  function guidedStart(){return {route:[copy(E.start)],step:0,done:false,attempts:0,reviewed:false,reviewAttempts:0};}
  // CQ-F5-008: an advanced learner must interpret a map-based reason for
  // their route, not merely follow more compass taps. Language is independent
  // of correctness: localized options use the same stable semantic IDs.
  const guidedReviewAnswers=Object.freeze({B2:"left",C1:"library",C2:"closure"});
  function guidedReview(state,level,choice){
    const answer=guidedReviewAnswers[level];
    if(!answer||!state.done||state.reviewed)return {accepted:false,kind:"unavailable",state};
    if(choice!==answer)return {accepted:false,kind:"incorrect",state:{
      ...state,reviewAttempts:state.reviewAttempts+1}};
    return {accepted:true,kind:"reason",state:{...state,reviewed:true}};
  }

  function guidedMove(state,next,level){
    const plan=guidedPaths[level];if(!plan)throw new RangeError("Invalid level");
    if(state.done)return {accepted:false,kind:"finished",state};
    const r=F.routeResult(state.route,next,level==="C2"?F.closure:null);
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
    return typeof d.uturn==="function"?d.uturn(d[dir],1):d.turn(d.back,d[dir],1);
  }
  // F5C CQ-F5-003: deterministically rotate presentation choices, keeping
  // semantic values intact. No random API is used: repeated renders of the
  // same question keep the same order, while language/CEFR/stage variations
  // move the correct answer away from a fixed visual button position.
  function orderChoices(items,language,level,mission,stage){
    if(!Array.isArray(items))throw new TypeError("Expected choice array");
    const languages=["en","es","de","fr"],li=languages.indexOf(language);
    if(li<0)throw new RangeError("Unknown choice language");
    const difficulty=lvlIndex(level),n=items.length;
    if(n<2)return items.slice();
    const step=typeof stage==="number"?stage:Array.from(String(stage||"")).reduce(
      (sum,ch)=>sum+ch.codePointAt(0),0);
    const rotation=((li*7+difficulty*5+mission*11+step*13)%n+n)%n;
    return items.slice(rotation).concat(items.slice(0,rotation));
  }
  // F5C N04: each wrong answer is a fully formed, plausible instruction of
  // approximately the same length as the correct route. Semantic direction
  // mutations are local and deterministic. No AI/API or student information.
  function dialogueDistractors(answer,lang){
    if(typeof answer!=="string"||answer.length<25)throw TypeError("Missing dialogue model");
    let vague,wrong;
    const change=(pattern,replacement)=>answer.replace(pattern,replacement);
    if(lang==="en"){
      if(/turn left/i.test(answer)){
        vague=change(/turn left/i,"turn at some point");
        wrong=change(/\bleft\b/i,"right");
      }else{
        vague=change(/the northbound street/i,"a street somewhere nearby");
        wrong=change(/northbound/i,"southbound");
      }
    }else if(lang==="es"){
      if(/a la izquierda/i.test(answer)){
        vague=change(/a la izquierda/i,"en algún cruce cercano");
        wrong=change(/izquierda/i,"derecha");
      }else{
        vague=change(/por la calle que va hacia el norte/i,"por alguna calle de la zona");
        wrong=change(/hacia el norte/i,"hacia el sur");
      }
    }else if(lang==="de"){
      if(/links/i.test(answer)){
        vague=change(/links/i,"irgendwo");
        wrong=change(/links/i,"rechts");
      }else{
        vague=change(/nach Norden/i,"in irgendeine Richtung");
        wrong=change(/nach Norden/i,"nach Süden");
      }
    }else if(lang==="fr"){
      if(/à gauche/i.test(answer)){
        vague=change(/à gauche/i,"sans préciser où");
        wrong=change(/à gauche/i,"à droite");
      }else{
        vague=change(/vers le nord/i,"sans direction précise");
        wrong=change(/vers le nord/i,"vers le sud");
      }
    }else throw RangeError("Invalid dialogue language");
    if(!vague||!wrong||vague===answer||wrong===answer)
      throw Error("Incomplete authored dialogue distractor for "+lang);
    const insist={
      en:"No, those instructions are correct: ",
      es:"No, esas indicaciones son correctas: ",
      de:"Nein, diese Wegbeschreibung stimmt: ",
      fr:"Non, ces indications sont exactes : "
    }[lang]+wrong;
    return Object.freeze({vague,wrong,insist});
  }
  function answerCount(level){return lvlIndex(level)===0?3:lvlIndex(level)===1?4:6;}
  function optionsCount(level){return lvlIndex(level)===0?2:3;}
  function requiredFields(level){
    if(level==="A1")return ["line"];
    if(level==="A2")return ["line","depart"];
    return ["line","depart","stop"];
  }
  // CQ-F5-011: genuine multi-constraint timetable. Early CEFR levels keep
  // the original three services; advanced learners compare an on-destination
  // but late service, plus a faster but not step-free option at C1/C2.
  // Student input is checked against the visible record, not a hard-coded
  // selection index or an unrelated fixed answer string.
  const extraServices=Object.freeze([
    Object.freeze({line:"18",from:"Central Station",depart:"08:41",to:"Hospital",arrival:"09:18",accessible:true}),
    Object.freeze({line:"31",from:"Central Station",depart:"08:38",to:"Hospital",arrival:"08:57",accessible:false})
  ]);
  function servicesForLevel(level){
    const index=lvlIndex(level);
    const ordinary=F.transport.lines.map(line=>({
      ...line,accessible:line.line==="24"
    }));
    if(index>=3)ordinary.push(extraServices[0]);
    if(index>=4)ordinary.push(extraServices[1]);
    return ordinary;
  }
  function transportOptions(level){
    const rows=servicesForLevel(level);
    return Object.freeze({
      lines:rows.map(x=>x.line),
      departures:rows.map(x=>x.depart),
      stops:[...new Set(rows.map(x=>x.to))]
    });
  }
  const minutes=time=>{
    if(typeof time!=="string"||!/^[0-9]{2}:[0-9]{2}$/.test(time))return NaN;
    const [hour,minute]=time.split(":").map(Number);
    return hour*60+minute;
  };
  function checkTransport(input,level){
    const fields=requiredFields(level);
    if(!input||fields.some(key=>!input[key]))return {correct:false,kind:"missing"};
    const selected=servicesForLevel(level).find(x=>x.line===input.line);
    if(!selected||selected.to!=="Hospital")return {correct:false,kind:"line"};
    if(fields.includes("depart")&&input.depart!==selected.depart)return {correct:false,kind:"depart"};
    if(fields.includes("stop")&&input.stop!==selected.to)return {correct:false,kind:"stop"};
    if(minutes(selected.depart)<minutes("08:35")||minutes(selected.arrival)>minutes("09:10"))
      return {correct:false,kind:"late"};
    if(lvlIndex(level)>=4&&!selected.accessible)return {correct:false,kind:"access"};
    return {correct:true,kind:"correct",service:selected};
  }
  function detourCheckpoints(level){
    return config(level).via.map(copy);
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
      const d=pack.touristDirections||pack.directions,current=d[seg.dir];
      if(i===0)return d.first(current,seg.count);
      const prev=segments[i-1].dir,delta=(dirs.indexOf(seg.dir)-dirs.indexOf(prev)+4)%4;
      if(delta===0)return d.continue(current,seg.count);
      if(delta===2&&typeof d.uturn==="function")return d.uturn(current,seg.count);
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
  // CQ-F5-008: clear finite-state misconception repair. A1–B1 retain the
  // familiar two decisions; B2 requires spatial reasoning and C1/C2 also
  // assess a tactful, unambiguous corrective response.
  function repairStart(){return {phase:0,done:false,tries:0};}
  function repairStages(level){return lvlIndex(level)>=4?4:lvlIndex(level)>=3?3:2;}
  function repairChoice(state,level,choice){
    const stages=repairStages(level),expected=["turn","left","south","apology"];
    if(state.done||state.phase>=stages)return {accepted:false,kind:"finished",state};
    const correct=choice===expected[state.phase],tries=state.tries+1;
    const phase=state.phase+(correct?1:0);
    return {accepted:correct,kind:correct?(phase>=stages?"success":"correct"):"incorrect",
      state:{phase,done:phase===stages,tries}};
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
    moveRoute,guidedStart,guidedMove,guidedReview,instruction,answerCount,optionsCount,orderChoices,dialogueDistractors,requiredFields,servicesForLevel,transportOptions,checkTransport,
    repairStart,repairStages,repairChoice,
    routeModel,detourCheckpoints,detourClosures,questCheckpoints,questStart,questMove,questSpeak,dialogueStart,dialogueChoose});
});
