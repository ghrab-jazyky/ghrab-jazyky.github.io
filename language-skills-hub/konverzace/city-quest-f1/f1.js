(() => {
  "use strict";
  const F = window.CityQuestF1Engine;
  const E = window.CityQuestEngine;
  if(!F||!E)throw new Error("City Quest F1 game data or F0 route engine is missing.");
  const $ = id => document.getElementById(id);
  const panel=$("f1Panel"),map=$("cityMap"),viewport=$("mapViewport");
  const svgNS="http://www.w3.org/2000/svg";
  const session={
    station:1,mode:"solo",done:new Set(),
    explore:{round:0,misses:0,feedback:null},
    guided:F.createGuided(),transit:{done:false,attempts:0,feedback:null},
    repair:{phase:"identify",done:false,attempts:0,feedback:null},
    detour:F.createDetour(),quest:F.createQuest(),feedback:null
  };
  const modePrompts={
    1:"Student A reads the clue without saying the destination. Student B identifies the place and explains why; then switch roles.",
    2:"Student A sees the route and explains it aloud. Student B follows it on the same map without looking, then they compare.",
    3:"Student A acts as the tourist; Student B responds in full sentences. Swap roles and compare the choices with the sample.",
    4:"Student A reads the next direction while Student B looks away. Student B then follows it on the map. Swap halfway.",
    5:"Student A explains the departure board; Student B chooses the line, time and stop. Agree on a plan together.",
    6:"One student gives the incorrect directions; the other spots the problem and suggests a polite correction.",
    7:"Student A suggests an alternative route; Student B checks every street and asks for clarification.",
    8:"Share the roles of navigator, tourist and checker. At each checkpoint, agree on the route before continuing."
  };
  function node(tag,className,content){
    const n=document.createElement(tag);
    if(className)n.className=className;
    if(content!==undefined&&content!==null)n.textContent=String(content);
    return n;
  }
  function svgEl(tag,attributes){
    const e=document.createElementNS(svgNS,tag);
    Object.entries(attributes||{}).forEach(([key,val])=>e.setAttribute(key,String(val)));
    return e;
  }
  function append(parent,tag,className,content){
    const n=node(tag,className,content);parent.appendChild(n);return n;
  }
  function button(parent,caption,action,style){
    const n=append(parent,"button","btn"+(style?" "+style:""),caption);
    n.type="button";n.addEventListener("click",action);return n;
  }
  function text(parent,value,style){return append(parent,"p",style||"",value);}
  function note(parent,title,body){
    const section=append(parent,"div","f1-note");
    append(section,"strong","",title);text(section,body);
    return section;
  }
  function feedback(parent,message,tone){
    const box=append(parent,"div","f1-feedback",message||"Select an answer to continue.");
    box.setAttribute("role","status");box.setAttribute("aria-live","polite");
    box.dataset.tone=tone||"";
    return box;
  }
  function actions(parent){return append(parent,"div","f1-actions");}
  function heading(number,intro,summary){
    append(panel,"div","f1-kicker","MISSION "+String(number).padStart(2,"0")+" / 08 · ENGLISH B1");
    append(panel,"h2","",F.stations[number-1].icon+" "+F.stations[number-1].name);
    text(panel,intro,"f1-strong");
    note(panel,"🎯 Your challenge",summary);
    if(session.mode==="pair"){
      const tip=append(panel,"div","f1-pair-tip");
      append(tip,"strong","","👥 Partner challenge");text(tip,modePrompts[number]);
    }
  }
  function choices(parent,entries,action){
    const list=append(parent,"div","f1-choices");
    entries.forEach(item=>{
      button(list,item.label,()=>action(item.id));
    });
    return list;
  }
  function continueNav(parent,finished){
    const box=actions(parent);
    if(finished&&session.station<8)button(box,"Next mission →",()=>selectStation(session.station+1),"primary");
    button(box,"↺ Practice again",()=>resetStation(session.station));
  }
  function finish(parent,title,message){
    const card=append(parent,"div","f1-finish");
    append(card,"strong","",title);
    text(card,message);
    text(card,"Speaking is a self-check activity. Correct route and selection choices are checked locally; speech is not automatically graded.","");
    return card;
  }
  function movePad(parent,handle){
    const pad=append(parent,"div","f1-step-pad");
    pad.setAttribute("role","group");pad.setAttribute("aria-label","Move one city block");
    [
      {key:"north",label:"North",arrow:"↑"},
      {key:"west",label:"West",arrow:"←"},
      {key:"south",label:"South",arrow:"↓"},
      {key:"east",label:"East",arrow:"→"}
    ].forEach(item=>{
      const b=button(pad,item.arrow+" "+item.label,()=>handle(item.key));
      b.classList.add(item.key);
      const current=visiblePoint();
      const to=current?F.nextFromDirection(current,item.key):null;
      if(!current||!E.isNode(to))b.disabled=true;
      b.setAttribute("aria-label","Move "+item.label.toLowerCase()+" one block");
    });
    return pad;
  }
  function updateProgress(){
    const count=session.done.size;
    $("f1ProgressText").textContent=count+" of 8 missions completed";
    $("f1ProgressFill").style.width=(count*12.5)+"%";
    $("f1ProgressTrack").setAttribute("aria-valuenow",String(count));
    const nav=$("f1Stations");nav.replaceChildren();
    F.stations.forEach(st=>{
      const b=node("button","f1-station");b.type="button";
      b.setAttribute("aria-label","Station "+st.id+": "+st.name+(session.done.has(st.id)?", completed":""));
      if(session.station===st.id)b.setAttribute("aria-current","step");
      const icon=append(b,"span","f1-station-icon",st.icon);icon.setAttribute("aria-hidden","true");
      const caption=append(b,"span","f1-station-caption");
      append(caption,"small","","STATION "+String(st.id).padStart(2,"0"));
      append(caption,"strong","",st.short);
      if(session.done.has(st.id)){
        const tick=append(b,"span","f1-station-complete","✓");tick.setAttribute("aria-hidden","true");
      }
      b.addEventListener("click",()=>selectStation(st.id));
      nav.appendChild(b);
    });
  }
  function completed(station){
    if(session.done.has(station))return;
    session.done.add(station);updateProgress();
  }
  function legacyPairHints(){
    [["routeView",2],["dialogueView",3]].forEach(([id,n])=>{
      const host=$(id);
      let existing=host.querySelector(".f1-legacy-tip");
      if(existing)existing.remove();
      if(session.mode==="pair"){
        const tip=node("div","f1-legacy-tip");
        append(tip,"strong","","👥 Partner challenge");
        text(tip,modePrompts[n]);
        const objective=host.querySelector(".objective");
        if(objective)objective.insertAdjacentElement("afterend",tip);
        else host.appendChild(tip);
      }
    });
  }
  function setMode(mode){
    if(mode!=="solo"&&mode!=="pair")return;
    session.mode=mode;
    ["solo","pair"].forEach(item=>{
      const b=$(item==="solo"?"f1Solo":"f1Pair");
      const selected=item===mode;
      b.classList.toggle("active",selected);
      b.setAttribute("aria-pressed",String(selected));
    });
    legacyPairHints();renderPanel();
  }
  const layer=svgEl("g",{id:"f1GameLayer","aria-hidden":"true","pointer-events":"none"});
  const trail=svgEl("polyline",{id:"f1Path",fill:"none",stroke:"#06bdd7","stroke-width":10,"stroke-linecap":"round","stroke-linejoin":"round",opacity:.96});
  const marker=svgEl("circle",{id:"f1Marker",cx:E.position(E.start).x,cy:E.position(E.start).y,r:15,fill:"#ffc978",stroke:"#fff","stroke-width":5});
  const closureLayer=svgEl("g",{id:"f1Closure","pointer-events":"none"});
  layer.append(trail,marker,closureLayer);map.appendChild(layer);
  function markBlocked(){
    closureLayer.replaceChildren();
    if(session.station!==7)return;
    const a=E.position(F.closure.a),b=E.position(F.closure.b);
    closureLayer.appendChild(svgEl("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:"#bd333c","stroke-width":17,"stroke-dasharray":"12 6","stroke-linecap":"round",opacity:.94}));
    const cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;
    closureLayer.appendChild(svgEl("rect",{x:cx-53,y:cy-41,width:106,height:26,rx:8,fill:"#932b39",stroke:"#fff7e7","stroke-width":2}));
    const label=svgEl("text",{x:cx,y:cy-23,"text-anchor":"middle","font-family":"system-ui,sans-serif","font-size":12.5,"font-weight":900,fill:"#fff"});
    label.textContent="ROAD CLOSED";
    closureLayer.appendChild(label);
  }
  function visiblePoint(){
    if(session.station===4)return session.guided.route[session.guided.route.length-1];
    if(session.station===7)return session.detour.route[session.detour.route.length-1];
    if(session.station===8)return session.quest.route[session.quest.route.length-1];
    return null;
  }
  function externalRoute(){
    if(session.station===4)return session.guided.route;
    if(session.station===7)return session.detour.route;
    if(session.station===8)return session.quest.route;
    return [];
  }
  function cameraFollow(point){
    if(!point||!viewport.classList.contains("detail"))return;
    const p=E.position(point);
    const ratio=map.getBoundingClientRect().width/1196;
    const left=Math.max(0,p.x*ratio-viewport.clientWidth*.43);
    const top=Math.max(0,p.y*ratio-viewport.clientHeight*.52);
    window.requestAnimationFrame(()=>viewport.scrollTo({
      left,top,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"
    }));
  }
  function renderMap(){
    const active=session.station>=4&&session.station<=8&&[4,7,8].includes(session.station);
    const legacy=session.station===2;
    $("activePath").style.display=legacy?"":"none";
    $("activePathFront").style.display=legacy?"":"none";
    $("routeHalo").style.display=legacy?"":"none";
    layer.style.display=active?"":"none";
    trail.style.display=active?"":"none";
    marker.style.display=active?"":"none";
    markBlocked();
    if(active){
      const path=externalRoute();
      const points=path.map(n=>{const p=E.position(n);return p.x+","+p.y;}).join(" ");
      trail.setAttribute("points",points);
      const p=E.position(path[path.length-1]);
      marker.setAttribute("cx",p.x);marker.setAttribute("cy",p.y);
      $("mapLocation").textContent=session.station===8?"City Quest checkpoint":"Riverton crossroads";
      $("mapProgress").textContent=(path.length-1)+" blocks walked · station "+session.station+"/8";
      cameraFollow(path[path.length-1]);
    }else if(session.station!==2){
      $("mapLocation").textContent="Explore Riverton";
      $("mapProgress").textContent=F.stations[session.station-1].name+" · English B1";
    }else{
      const pointString=$("activePathFront").getAttribute("points").trim();
      const parts=pointString?pointString.split(/\s+/):[];
      $("mapLocation").textContent=parts.length>1?"Route in progress":"Central Station";
      $("mapProgress").textContent=Math.max(0,parts.length-1)+" blocks walked · City Museum";
    }
  }
  function selectStation(n){
    if(!Number.isInteger(n)||n<1||n>8)return;
    session.station=n;
    if(n===2){
      $("routeTab").click();
      $("routeView").hidden=false;$("dialogueView").hidden=true;
      $("f1Panel").hidden=true;
      $("routeView").querySelector(".step-label").textContent="MISSION 02 / ENGLISH B1";
    }else if(n===3){
      $("dialogueTab").click();
      $("routeView").hidden=true;$("dialogueView").hidden=false;
      $("f1Panel").hidden=true;
      $("dialogueView").querySelector(".step-label").textContent="MISSION 03 / ENGLISH B1";
    }else{
      $("dialogueTab").click(); // disables F0 route handling without affecting the F1 map layer
      $("routeView").hidden=true;$("dialogueView").hidden=true;
      $("f1Panel").hidden=false;
      renderPanel();
    }
    updateProgress();legacyPairHints();renderMap();
  }
  function renderExplore(){
    const state=session.explore;
    heading(1,"Learn Riverton's key places, then identify each destination from a real-life clue.","Match six practical descriptions to the correct landmark. Every answer has instant feedback.");
    append(panel,"h3","","🗺️ Riverton landmark guide");
    const grid=append(panel,"div","f1-place-grid");
    F.places.forEach(place=>{
      const item=append(grid,"div","f1-place");
      append(item,"span","f1-place-emoji",place.icon);
      append(item,"span","",place.label);
    });
    if(state.round>=F.explore.length){
      finish(panel,"City Explorer complete!","All six clues solved. Challenge: describe three landmarks to a classmate without using their names.");
      continueNav(panel,true);return;
    }
    append(panel,"h3","","Identify the destination");
    append(panel,"span","f1-counter","CLUE "+(state.round+1)+" / "+F.explore.length);
    const question=F.explore[state.round];
    text(panel,question.clue,"f1-strong");
    choices(panel,question.choices.map(id=>({id,label:(F.findPlace(id)?.icon||"📍")+" "+F.findPlace(id).label})),id=>{
      const result=F.answerExplore(state.round,id);
      if(result.correct){
        state.round++;
        state.feedback={message:result.message,tone:"good"};
        if(state.round===F.explore.length)completed(1);
        renderPanel();
      }else{
        state.misses++;state.feedback={message:result.message,tone:"warn"};
        feedbackBox.textContent=result.message;feedbackBox.dataset.tone="warn";
      }
    });
    const feedbackBox=feedback(panel,state.feedback?.message||"Choose the correct place on the map.",state.feedback?.tone);
    text(panel,"Speaking task: explain why the place matches the clue. Use a full sentence.");
  }
  function renderGuided(){
    const state=session.guided;
    heading(4,"Follow directions as if a local person were guiding you through the streets.","Listen to or read each direction. Move one block on the map. The route is checked after every step.");
    const chips=append(panel,"div","f1-steps");
    F.guided.forEach((step,index)=>{
      append(chips,"span","f1-step-chip"+(index<state.step?" done":index===state.step?" active":""),String(index+1));
    });
    if(state.done){
      finish(panel,"You reached the City Museum!","You followed five directions correctly. Now explain your route without looking at the instructions.");
      append(panel,"p","f1-strong","Model: "+E.instructions(state.route));
      continueNav(panel,true);return;
    }
    append(panel,"span","f1-counter","DIRECTION "+(state.step+1)+" / "+F.guided.length);
    note(panel,"📣 Follow the instruction",F.guided[state.step].instruction);
    const box=feedback(panel,state.last||"Choose the next direction.",state.last?.startsWith("Correct")?"good":"");
    movePad(panel,dir=>{
      const next=F.nextFromDirection(visiblePoint(),dir);
      onMove(next);
    });
    const tools=actions(panel);
    button(tools,"💡 Show a hint",()=>{box.textContent=F.guided[state.step].hint;box.dataset.tone="warn";});
    button(tools,"↺ Restart",()=>resetStation(4));
    text(panel,"Use the compass or tap the next crossroads directly on the map.");
  }
  function renderTransit(){
    const state=session.transit;
    heading(5,"Read the departure board and make a sensible public-transport decision.","Choose a line, a departure time and the stop where you should get off.");
    note(panel,"🕒 Passenger request",F.transport.task);
    const table=append(panel,"table","f1-card-table");
    const thead=append(table,"thead");
    const tr=append(thead,"tr");
    ["Line","Departs","Destination","Arrives"].forEach(label=>append(tr,"th","",label));
    const tbody=append(table,"tbody");
    F.transport.lines.forEach(line=>{
      const r=append(tbody,"tr");
      [line.line,line.depart,line.to,line.arrival].forEach(value=>append(r,"td","",value));
    });
    if(state.done){
      finish(panel,"Excellent transport planning!","You chose a service that reaches the hospital on time.");
      text(panel,"Speaking task: explain why the other two buses would not be suitable.");
      continueNav(panel,true);return;
    }
    const form=append(panel,"div","f1-form");
    const makeSelect=(id,label,items)=>{
      const field=append(form,"div","f1-field");
      const lbl=append(field,"label","",label);
      lbl.htmlFor="f1Transit-"+id;
      const select=append(field,"select");select.id=lbl.htmlFor;
      const placeholder=append(select,"option","","Choose...");placeholder.value="";
      items.forEach(value=>{const opt=append(select,"option","",value);opt.value=value;});
      return select;
    };
    const line=makeSelect("line","Which bus line?",F.transport.options.lines);
    const time=makeSelect("time","Which departure?",F.transport.options.departures);
    const stop=makeSelect("stop","Where do you get off?",F.transport.options.stops);
    const box=feedback(panel,state.feedback?.message||"Plan the journey. The schedule is fictional and fixed.",state.feedback?.tone);
    const act=actions(panel);
    button(act,"Check my journey",()=>{
      const r=F.checkTransport({line:line.value,depart:time.value,stop:stop.value});
      state.attempts++;state.feedback={message:r.message,tone:r.correct?"good":"warn"};
      if(r.correct){
        state.done=true;completed(5);renderPanel();
      }else{box.textContent=r.message;box.dataset.tone="warn";}
    },"primary");
    text(panel,"Speaking task: tell a friend which bus to take, when it leaves, and when it arrives.");
  }
  function renderRepair(){
    const state=session.repair;
    heading(6,"A tourist has received bad directions. Find and politely correct the mistake.","First identify the incorrect instruction. Then select the correction that really leads to the museum.");
    note(panel,"⚠️ Visitor's instructions",F.mistake.instruction);
    if(state.done){
      finish(panel,"Directions repaired!","You noticed that a right turn from east would lead south, not north.");
      text(panel,"Speaking task: apologise, repeat the correct directions, and check that the tourist understands.");
      continueNav(panel,true);return;
    }
    append(panel,"h3","",state.phase==="identify"?"Step 1 · Spot the mistake":"Step 2 · Correct the directions");
    const options=state.phase==="identify"?F.mistake.choices:F.mistake.correctedChoices;
    const box=feedback(panel,state.feedback?.message||"Look carefully at the compass directions.",state.feedback?.tone);
    choices(panel,options.map(item=>({id:item.id,label:item.text})),id=>{
      const r=state.phase==="identify"?F.checkErrorIdentification(id):F.checkCorrection(id);
      state.attempts++;state.feedback={message:r.message,tone:r.correct?"good":"warn"};
      if(r.correct){
        if(state.phase==="identify")state.phase="correct";
        else {state.done=true;completed(6);}
        renderPanel();
      }else{box.textContent=r.message;box.dataset.tone="warn";}
    });
  }
  function renderDetour(){
    const state=session.detour;
    heading(7,"Roadworks have blocked a street. You must find a safe alternative.","Reach the museum from Central Station. A marked section of Station Road is closed, so you cannot take the usual route.");
    note(panel,"🚧 Road closure",F.closure.reason+" The red dashed segment on the map is unavailable.");
    text(panel,"The fastest legal route is not necessarily the one you first expected. Explain how the closure changes your plan.");
    if(state.done){
      finish(panel,"Detour found!","You reached the museum in "+state.completedBlocks+" blocks without travelling through the closed street.");
      text(panel,"Speaking task: explain the revised route and mention the roadworks.");
      continueNav(panel,true);return;
    }
    append(panel,"div","f1-counter","BLOCKS WALKED: "+(state.route.length-1)+" · ATTEMPTS: "+state.attempts);
    feedback(panel,state.message||"Find an open alternative route.",state.message.includes("closed")?"warn":"");
    movePad(panel,dir=>onMove(F.nextFromDirection(visiblePoint(),dir)));
    const act=actions(panel);
    button(act,"↶ Undo",()=>onMove(state.route[state.route.length-2]||state.route[0]));
    button(act,"↺ Restart",()=>resetStation(7));
    append(panel,"div","f1-legend-red","🚧 Red dashed road = closed");
  }
  function renderQuest(){
    const state=session.quest;
    heading(8,"Combine everything you've learned in one mission across Riverton.","Visit Market Square, the Library and finally the City Museum. Give spoken directions at each stop.");
    const chips=append(panel,"div","f1-steps");
    F.checkpoints.forEach((item,index)=>append(chips,"span","f1-step-chip"+(index<state.stage?" done":index===state.stage?" active":""),(index+1)+" · "+item.name));
    if(state.done){
      finish(panel,"🏆 City Quest completed!","Three destinations visited and three speaking checkpoints acknowledged. The route is verified; speaking remains a self-check.");
      append(panel,"h3","","Reflect on your journey");
      text(panel,"Where did you need to turn? Which route was hardest to explain? Could you give a visitor simpler directions?");
      const act=actions(panel);button(act,"↺ Replay the final quest",()=>resetStation(8));
      return;
    }
    const checkpoint=F.checkpoints[state.stage];
    if(state.awaitingSpeech){
      append(panel,"h3","f1-destination","📍 Reached "+checkpoint.name);
      note(panel,"🗣️ Speaking checkpoint",checkpoint.prompt);
      const model=append(panel,"div","f1-mini-card");
      append(model,"strong","","Compare your response");
      const example=append(model,"p","muted","Try speaking before revealing the model sentence.");
      const reveal=button(model,"Reveal example",()=>{example.textContent=checkpoint.sample;reveal.disabled=true;});
      text(panel,"Your spoken answer is not recorded or automatically marked.");
      const act=actions(panel);
      button(act,"I spoke and checked my directions · Continue →",()=>{
        const result=F.completeQuestSpeech(session.quest);
        if(result.accepted){
          session.quest=result.state;
          if(result.state.done)completed(8);
          renderPanel();renderMap();
        }
      },"primary");
    }else{
      append(panel,"h3","f1-destination","Next destination: "+checkpoint.name);
      text(panel,"Follow the streets one block at a time. Use the map and compass to find the checkpoint.");
      append(panel,"div","f1-counter","BLOCKS WALKED: "+(state.route.length-1)+" · CHECKPOINT "+(state.stage+1)+"/3");
      feedback(panel,state.message||"Follow the city map.");
      movePad(panel,dir=>onMove(F.nextFromDirection(visiblePoint(),dir)));
      const act=actions(panel);
      button(act,"↶ Undo",()=>onMove(state.leg[state.leg.length-2]||state.leg[0]));
    }
    const act=actions(panel);
    button(act,"↺ Restart final quest",()=>resetStation(8));
  }
  function renderPanel(){
    if(session.station===2||session.station===3)return;
    panel.replaceChildren();
    switch(session.station){
      case 1:renderExplore();break;
      case 4:renderGuided();break;
      case 5:renderTransit();break;
      case 6:renderRepair();break;
      case 7:renderDetour();break;
      case 8:renderQuest();break;
    }
  }
  function onMove(next){
    const n=session.station;
    if(![4,7,8].includes(n))return;
    const old=n===4?session.guided:n===7?session.detour:session.quest;
    const outcome=n===4?F.guidedMove(old,next):n===7?F.detourMove(old,next):F.questMove(old,next);
    if(n===4)session.guided=outcome.state;
    if(n===7)session.detour=outcome.state;
    if(n===8)session.quest=outcome.state;
    if(outcome.state.done)completed(n);
    renderPanel();renderMap();
    const live=panel.querySelector(".f1-feedback");
    if(live&&outcome.kind==="incorrect"){live.textContent=outcome.message;live.dataset.tone="warn";}
    if(live&&["closed","distance","loop","bounds","speak"].includes(outcome.kind)){live.textContent=outcome.message;live.dataset.tone="warn";}
  }
  function handleMapNode(point){
    if([4,7,8].includes(session.station))onMove(point);
  }
  function resetStation(n){
    if(n===1)session.explore={round:0,misses:0,feedback:null};
    if(n===4)session.guided=F.createGuided();
    if(n===5)session.transit={done:false,attempts:0,feedback:null};
    if(n===6)session.repair={phase:"identify",done:false,attempts:0,feedback:null};
    if(n===7)session.detour=F.createDetour();
    if(n===8)session.quest=F.createQuest();
    if(n===2)$("mapReset").click();
    if(n===3)$("dialogueReset").click();
    session.done.delete(n);updateProgress();
    selectStation(n);
  }
  // The original F0 engine is reused unchanged. In non-route missions its
  // dialogue tab disables F0 movement; F1 adds its own inert SVG path overlay.
  map.querySelectorAll("[data-node]").forEach(item=>{
    const [c,r]=item.dataset.node.split("-").map(Number);
    item.addEventListener("click",()=>handleMapNode({c,r}));
    item.addEventListener("keydown",event=>{
      if((event.key==="Enter"||event.key===" ")&&[4,7,8].includes(session.station)){
        event.preventDefault();handleMapNode({c,r});
      }
    });
  });
  viewport.addEventListener("keydown",event=>{
    if(event.target!==viewport||![4,7,8].includes(session.station))return;
    const directions={ArrowUp:"north",ArrowDown:"south",ArrowLeft:"west",ArrowRight:"east"};
    if(directions[event.key]){
      event.preventDefault();
      const here=visiblePoint();onMove(F.nextFromDirection(here,directions[event.key]));
    }
  });
  $("f1Solo").addEventListener("click",()=>setMode("solo"));
  $("f1Pair").addEventListener("click",()=>setMode("pair"));
  $("mapReset").addEventListener("click",()=>{
    if([4,7,8].includes(session.station))resetStation(session.station);
  });
  $("resetBtn").textContent="↺ Reset this station";
  $("resetBtn").addEventListener("click",()=>resetStation(session.station));
  const routeObserver=new MutationObserver(()=>{
    if(!$("routeResult").hidden)completed(2);
  });
  routeObserver.observe($("routeResult"),{attributes:true,attributeFilter:["hidden"]});
  const dialogueObserver=new MutationObserver(()=>{
    if($("dialoguePrompt").textContent.includes("successfully helped a visitor"))completed(3);
  });
  dialogueObserver.observe($("dialoguePrompt"),{childList:true,subtree:true,characterData:true});
  selectStation(1);
})();
