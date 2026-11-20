(() => {
  "use strict";
  const E = window.CityQuestEngine;
  if (!E) return;
  const SVG = "http://www.w3.org/2000/svg";
  const map = document.getElementById("cityMap");
  const $ = id => document.getElementById(id);
  let route = [E.start];
  let scene = "start";
  let history = [];
  let active = "route";
  let showingModel = false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (type, attributes = {}, text = null) => {
    const node = document.createElementNS(SVG, type);
    Object.entries(attributes).forEach(([key, val]) => node.setAttribute(key, String(val)));
    if (text !== null) node.textContent = String(text);
    return node;
  };
  const add = (root, node) => { root.appendChild(node); return node; };
  function drawCity(){
    if(!window.CityQuestArt)throw new Error("City Quest artwork is missing");
    window.CityQuestArt.render(map,E);
    // Path and all interactive nodes are above decorative, pointer-inert artwork.
    add(map,el("polyline",{id:"activePath",points:"",fill:"none",stroke:"#086c88","stroke-width":17,"stroke-linecap":"round","stroke-linejoin":"round",opacity:.30,"pointer-events":"none"}));
    add(map,el("polyline",{id:"activePathFront",points:"",fill:"none",stroke:"#07bfda","stroke-width":9,"stroke-linecap":"round","stroke-linejoin":"round","pointer-events":"none",class:"route-path"}));
    const nodeLayer=add(map,el("g",{id:"nodeLayer"}));
    E.rows.forEach((_,r)=>E.columns.forEach((__,c)=>{
      const point={c,r},pos=E.position(point);
      const group=add(nodeLayer,el("g",{
        "data-node":c+"-"+r,role:"button",tabindex:"0",
        "aria-label":"Crossroads column "+(c+1)+", row "+(r+1),
        "aria-pressed":"false",class:"map-node"
      }));
      add(group,el("circle",{cx:pos.x,cy:pos.y,r:23,fill:"#ffffff","fill-opacity":.01,stroke:"none"}));
      add(group,el("circle",{cx:pos.x,cy:pos.y,r:8.5,fill:"#ffffff",stroke:"#588791","stroke-width":3}));
      if(E.same(point,E.start)||E.same(point,E.goal)){
        add(group,el("text",{x:pos.x,y:pos.y+4.5,
          "text-anchor":"middle","font-size":12,"font-weight":900,fill:"#123c4c",
          "font-family":"system-ui,sans-serif","pointer-events":"none"},
          E.same(point,E.start)?"S":"M"));
      }
      const activate=()=>{
        if(active==="route")applyMove(E.move(route,point));
        else $("dialogueStatus").textContent="Map tip: look for the City Museum in the northern part of Riverton.";
      };
      group.addEventListener("click",activate);
      group.addEventListener("keydown",event=>{
        if(event.key==="Enter"||event.key===" "){event.preventDefault();activate();}
      });
    }));
    add(map,el("circle",{id:"routeHalo",r:23,cx:E.position(E.start).x,cy:E.position(E.start).y,
      fill:"none",stroke:"#0e8592","stroke-width":3,class:"route-halo",
      "pointer-events":"none","aria-hidden":"true"}));
    renderRoute();
  }
  function renderRoute(){
    const points=route.map(n=>{const p=E.position(n);return p.x+","+p.y;}).join(" ");
    $("activePath").setAttribute("points",points);
    const front=$("activePathFront");
    front.setAttribute("points",points);
    const length=front.getTotalLength();
    if(length>0 && !reduceMotion && front.dataset.length!==String(length)){
      front.style.transition="none";
      front.style.strokeDasharray=String(length);
      front.style.strokeDashoffset=String(length);
      window.requestAnimationFrame(()=>{
        front.style.transition="stroke-dashoffset .56s cubic-bezier(.12,.75,.20,1)";
        front.style.strokeDashoffset="0";
      });
    }else if(reduceMotion){
      front.style.strokeDasharray="none";
      front.style.strokeDashoffset="0";
    }
    front.dataset.length=String(length);
    const last=route[route.length-1];
    map.querySelectorAll("[data-node]").forEach(node=>{
      const [c,r]=node.getAttribute("data-node").split("-").map(Number);
      const isHere=c===last.c&&r===last.r;
      const isGoal=c===E.goal.c&&r===E.goal.r;
      const selected=route.some(p=>p.c===c&&p.r===r);
      const circle=node.querySelectorAll("circle")[1];
      circle.setAttribute("r",isHere?15:isGoal?13:selected?10:8);
      circle.setAttribute("fill",isHere?"#ffbd62":isGoal?"#7cf1b5":selected?"#1cc5d7":"#fefefe");
      circle.setAttribute("stroke",isHere?"#fff":isGoal?"#0a7164":"#61939d");
      node.setAttribute("aria-pressed",selected?"true":"false");
      node.setAttribute("aria-current",isHere?"location":"false");
    });
    const arrived=E.same(last,E.goal);
    const current=E.position(last);
    $("routeHalo").setAttribute("cx",current.x);
    $("routeHalo").setAttribute("cy",current.y);
    $("mapViewport").classList.toggle("reached",arrived);
    $("mapLocationBar").classList.toggle("reached",arrived);
    $("mapLocation").textContent=arrived?"City Museum":route.length===1?"Central Station":
      "Crossroads "+(route.length-1)+" · "+(last.c+1)+"/"+(last.r+1);
    $("mapProgress").textContent=(route.length-1)+" blocks walked · "+E.distance(last,E.goal)+" blocks remaining";
    $("routeResult").hidden=!arrived;
    $("undoBtn").disabled=route.length<2;
    ["north","east","south","west"].forEach(id=>{
      const offsets={north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]};
      const d=offsets[id];
      $(""+id).disabled=arrived||!E.isNode({c:last.c+d[0],r:last.r+d[1]});
    });
    $("modelText").textContent=E.instructions(route);
    $("modelText").hidden=!arrived||!showingModel;
    $("modelBtn").setAttribute("aria-expanded",String(showingModel));
    const status=$("routeStatus");
    if(arrived){status.textContent="Destination reached! "+(route.length-1)+" blocks travelled. Explain your route aloud before revealing the model.";status.dataset.tone="good";}
  }
  function keepWaypointVisible(){
    const viewport=$("mapViewport");
    if(!viewport.classList.contains("detail"))return;
    const last=E.position(route[route.length-1]);
    const zoom=map.getBoundingClientRect().width/1196;
    const left=Math.max(0,last.x*zoom-viewport.clientWidth*.38);
    const top=Math.max(0,last.y*zoom-viewport.clientHeight*.56);
    viewport.scrollTo({left:left,top:top,behavior:reduceMotion?"auto":"smooth"});
  }
  function setMapDetail(detail){
    const viewport=$("mapViewport");
    viewport.classList.toggle("detail",detail);
    $("mapZoom").setAttribute("aria-pressed",String(detail));
    $("mapZoom").textContent=detail?"− Whole city":"＋ Map detail";
    $("mapTouchTip").textContent=detail?"↔ Swipe sideways to explore · Tap a crossroads":"Select Map detail to zoom in on street names";
    if(detail)window.requestAnimationFrame(keepWaypointVisible);
    else viewport.scrollTo({left:0,top:0,behavior:"auto"});
  }
  function applyMove(result){
    route=result.route;
    const status=$("routeStatus");
    status.textContent=result.message;
    status.dataset.tone=["success","moved","undo"].includes(result.outcome)?"good":"warn";
    showingModel=false;
    renderRoute();
    window.requestAnimationFrame(keepWaypointVisible);
  }
  function setTab(tab){
    active=tab;
    const isRoute=tab==="route";
    $("routeView").hidden=!isRoute;
    $("dialogueView").hidden=isRoute;
    $("routeTab").setAttribute("aria-selected",String(isRoute));
    $("dialogueTab").setAttribute("aria-selected",String(!isRoute));
    document.getElementById("routeTab").classList.toggle("active",isRoute);
    document.getElementById("dialogueTab").classList.toggle("active",!isRoute);
  }
  function showScene(){
    const data=E.scenes[scene];
    $("actorName").textContent=data.actor;
    $("actorLine").textContent=data.line;
    $("dialoguePrompt").textContent=data.prompt;
    const options=$("dialogueOptions");
    options.replaceChildren();
    data.options.forEach(choice=>{
      const button=document.createElement("button");
      button.type="button";
      button.className="btn";
      button.textContent=choice.label;
      button.addEventListener("click",()=>{
        const result=E.choose(scene,choice.id);
        history.push(scene);
        scene=result.next;
        showScene();
        $("dialogueStatus").textContent=result.feedback;
        $("dialogueStatus").dataset.tone=result.tone;
      });
      options.appendChild(button);
    });
    if(scene==="complete"){
      const btn=document.createElement("button");
      btn.type="button";btn.className="btn primary";btn.textContent="✓ Restart the mission";
      btn.addEventListener("click",resetDialogue);
      options.appendChild(btn);
    }
    $("dialogueBack").disabled=history.length===0;
  }
  function resetDialogue(){
    scene="start";history=[];
    showScene();
    $("dialogueStatus").textContent="Choose a response. Your words shape the conversation.";
    $("dialogueStatus").dataset.tone="";
  }
  function resetRoute(){
    route=[E.start];showingModel=false;
    $("routeStatus").textContent="You are at Central Station. Choose the next crossroads.";
    $("routeStatus").dataset.tone="";
    renderRoute();
  }
  $("routeTab").addEventListener("click",()=>setTab("route"));
  $("dialogueTab").addEventListener("click",()=>setTab("dialogue"));
  $("north").addEventListener("click",()=>applyMove(E.step(route,"north")));
  $("south").addEventListener("click",()=>applyMove(E.step(route,"south")));
  $("west").addEventListener("click",()=>applyMove(E.step(route,"west")));
  $("east").addEventListener("click",()=>applyMove(E.step(route,"east")));
  $("undoBtn").addEventListener("click",()=>{
    if(route.length>1)applyMove(E.move(route,route[route.length-2]));
  });
  $("mapReset").addEventListener("click",resetRoute);
  $("resetBtn").addEventListener("click",()=>{resetRoute();resetDialogue();setTab("route");});
  $("routeGuideBtn").addEventListener("click",()=>{
    const open=$("routeGuide").hidden;
    $("routeGuide").hidden=!open;
    $("routeGuideBtn").setAttribute("aria-expanded",String(open));
  });
  $("modelBtn").addEventListener("click",()=>{
    showingModel=!showingModel;renderRoute();
  });
  $("dialogueBack").addEventListener("click",()=>{
    if(history.length){scene=history.pop();showScene();$("dialogueStatus").textContent="Previous dialogue turn restored.";$("dialogueStatus").dataset.tone="";}
  });
  $("dialogueReset").addEventListener("click",resetDialogue);
  $("themeBtn").addEventListener("click",()=>{
    const root=document.documentElement;
    const next=root.dataset.theme==="dark"?"light":"dark";
    root.dataset.theme=next;$("themeBtn").textContent=next==="dark"?"☀ Light mode":"☾ Dark mode";
  });
  $("mapZoom").addEventListener("click",()=>{
    setMapDetail(!$("mapViewport").classList.contains("detail"));
  });
  $("mapViewport").addEventListener("keydown",event=>{
    if(event.target!==$("mapViewport")||active!=="route")return;
    const keyMap={ArrowUp:"north",ArrowDown:"south",ArrowLeft:"west",ArrowRight:"east"};
    if(keyMap[event.key]){event.preventDefault();applyMove(E.step(route,keyMap[event.key]));}
  });
  setTab("route");
  drawCity();
  setMapDetail(window.matchMedia("(max-width: 700px)").matches);
  showScene();
})();