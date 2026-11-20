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
  const el = (type, attributes = {}, text = null) => {
    const node = document.createElementNS(SVG, type);
    Object.entries(attributes).forEach(([key, val]) => node.setAttribute(key, String(val)));
    if (text !== null) node.textContent = String(text);
    return node;
  };
  const add = (root, node) => { root.appendChild(node); return node; };
  function block(x, y, w, h, fill, opacity = 1, radius = 12) {
    return el("rect", { x, y, width: w, height: h, rx: radius, fill, opacity });
  }
  function pointString(points) { return points.map(pair => pair.join(",")).join(" "); }
  function building(x, y, w, h, side, roof, tall, name) {
    const g = add(map, el("g", { "aria-hidden": "true" }));
    add(g, el("ellipse", { cx: x + w / 2 + 6, cy: y + h / 2 + 12, rx: w * .62, ry: h * .46, fill: "#1b4551", opacity: .17 }));
    add(g, el("polygon", { points: pointString([[x + 7,y + 9],[x + w + 7,y + 9],[x + w + 15,y - tall + 9],[x + 15,y - tall + 9]]), fill: side }));
    add(g, el("polygon", { points: pointString([[x + w,y],[x + w + 12,y - tall],[x + w + 12,y + h - tall],[x + w,y + h]]), fill: side }));
    add(g, el("rect", { x, y: y - tall, width: w, height: h, rx: Math.min(11,h/6), fill: "#b7d5d3" }));
    add(g, el("rect", { x: x+4, y: y-tall+5, width:w-8, height:h-10, rx:Math.min(7,h/6), fill:roof }));
    add(g, el("polygon", { points:pointString([[x+4,y-tall+5],[x+w-4,y-tall+5],[x+w+6,y-tall-9],[x+13,y-tall-9]]), fill:"#ffffff", opacity:.28 }));
    const cols = Math.max(2,Math.floor(w/30));
    for(let c=0;c<cols;c++){
      let px=x+12+c*(w-25)/Math.max(1,cols-1);
      add(g, el("rect",{x:px,y:y-tall+17,width:12,height:10,rx:2,fill:"#d4f5ff",opacity:.75}));
    }
    if(name){
      const label = add(g, el("g",{transform:"translate("+ (x+w/2) +","+(y+h+16)+")"}));
      const textWidth = Math.max(54,name.length*7.3+16);
      add(label, el("rect",{x:-textWidth/2,y:-14,width:textWidth,height:26,rx:9,fill:"#fff",stroke:"#d1e7e8","stroke-width":1}));
      add(label, el("text",{x:0,y:3,"text-anchor":"middle","font-family":"system-ui,sans-serif","font-size":12.5,"font-weight":750,fill:"#214a55"},name));
    }
  }
  function tree(x,y,s=1){
    const g=add(map,el("g",{"aria-hidden":"true"}));
    add(g,el("ellipse",{cx:x+5*s,cy:y+14*s,rx:19*s,ry:9*s,fill:"#4b8f75",opacity:.16}));
    add(g,el("rect",{x:x-2*s,y:y+2*s,width:5*s,height:18*s,rx:2,fill:"#8d7155"}));
    add(g,el("circle",{cx:x,cy:y,r:15*s,fill:"#3f9c72"}));
    add(g,el("circle",{cx:x-8*s,cy:y+2*s,r:10*s,fill:"#60c18b"}));
    add(g,el("circle",{cx:x+5*s,cy:y-6*s,r:11*s,fill:"#77d29a"}));
  }
  function roadText(x,y,t,rotate=0){
    const g=add(map,el("g",{transform:"translate("+x+","+y+") rotate("+rotate+")"}));
    add(g,el("text",{"text-anchor":"middle","font-family":"system-ui,sans-serif","font-weight":850,"font-size":15,"letter-spacing":2.6,fill:"#547b87",opacity:.82},t));
  }
  function label(x,y,emoji,title,subtitle,primary=false){
    const g=add(map,el("g",{"aria-hidden":"true"}));
    const width=Math.max(112,title.length*8+23);
    add(g,el("rect",{x:x-width/2,y:y-24,width,height:47,rx:13,fill:primary?"#133b51":"#ffffff",stroke:primary?"#86edf2":"#d0eff1","stroke-width":2}));
    add(g,el("text",{x,y:y-5,"text-anchor":"middle","font-family":"system-ui,sans-serif","font-size":14.5,"font-weight":900,fill:primary?"#eaffff":"#17495b"},emoji+" "+title));
    if(subtitle)add(g,el("text",{x,y:y+11,"text-anchor":"middle","font-family":"system-ui,sans-serif","font-size":10.5,fill:primary?"#b9edf6":"#507c85"},subtitle));
  }
  function drawCity(){
    map.replaceChildren();
    const defs=add(map,el("defs"));
    const sky=add(defs,el("linearGradient",{id:"cityGround",x1:"0",y1:"0",x2:"0",y2:"1"}));
    add(sky,el("stop",{offset:"0%", "stop-color":"#a8e4dd"}));
    add(sky,el("stop",{offset:"100%","stop-color":"#ccead0"}));
    const water=add(defs,el("linearGradient",{id:"cityWater",x1:"0",y1:"0",x2:"1",y2:"0"}));
    add(water,el("stop",{offset:"0%", "stop-color":"#6cc7d5"}));
    add(water,el("stop",{offset:"100%","stop-color":"#b5e8ef"}));
    add(map,block(0,0,1196,756,"url(#cityGround)",1,0));
    add(map,el("path",{d:"M1080 0 Q1114 100 1085 200 Q1042 296 1104 395 Q1172 500 1100 620 Q1070 690 1106 756 L1196 756 L1196 0Z",fill:"url(#cityWater)"}));
    for(let i=0;i<10;i++)add(map,el("path",{d:"M"+(1100+i*7)+" "+(40+i*71)+" q15 -10 27 0",stroke:"#e7ffff","stroke-width":3,opacity:.6,fill:"none"}));
    const district=add(map,el("g",{"aria-hidden":"true"}));
    const plots=[
      [188,158,134,104,"#bedba9"],[360,158,134,104,"#f0d7bd"],[532,158,134,104,"#f6e0ca"],[704,158,134,104,"#f9deba"],[876,158,134,104,"#bde8ba"],
      [188,306,134,104,"#d9e8c4"],[360,306,134,104,"#c9e5d2"],[532,306,134,104,"#fbefd4"],[704,306,134,104,"#cfe5d0"],[876,306,134,104,"#a9d9af"],
      [188,454,134,104,"#f2e4cb"],[360,454,134,104,"#d5e6d4"],[532,454,134,104,"#f4dbc1"],[704,454,134,104,"#cde8c8"],[876,454,134,104,"#c2e8d3"],
      [188,602,134,104,"#f5e1c2"],[360,602,134,104,"#d6e8d8"],[532,602,134,104,"#e6e1c5"],[704,602,134,104,"#f3e0ce"],[876,602,134,104,"#d5e5c5"]];
    plots.forEach(([x,y,w,h,c])=>add(district,block(x,y,w,h,c,.96,8)));
    E.rows.forEach(y=>{
      add(map,block(114,y-19,960,38,"#fff5df",1,5));
      add(map,el("path",{d:"M114 "+y+" H1074",stroke:"#b7d5d5","stroke-width":2,"stroke-dasharray":"10 14"}));
    });
    E.columns.forEach(x=>{
      add(map,block(x-20,75,40,640,"#fff5df",1,5));
      add(map,el("path",{d:"M"+x+" 75 V715",stroke:"#b7d5d5","stroke-width":2,"stroke-dasharray":"10 14"}));
    });
    // Miniature landmarks and tree clusters sit BETWEEN the navigation streets.
    building(202,168,100,58,"#a9abc4","#d4a3a1",20,"MARKET");
    building(375,166,98,55,"#9a9db4","#dab7aa",25,"SCHOOL");
    building(549,163,100,68,"#acadc2","#e8d9ae",19,"MUSEUM");
    building(719,171,101,57,"#889fb9","#d0a8c6",21,"HOTEL");
    building(889,166,98,57,"#a6b1ba","#c3dbe4",21,"HOSPITAL");
    building(198,471,113,58,"#b5a9ba","#d6b2ab",22,"BAKERY");
    building(370,467,107,55,"#a2b5bb","#a7d8db",19,"CAFÉ");
    building(543,469,112,58,"#a0b6b7","#e4b7a1",23,"THEATRE");
    building(714,463,110,57,"#a3b9ba","#c8bddd",18,"LIBRARY");
    building(202,609,98,58,"#a6b2bc","#b6c8df",22,"STATION");
    building(373,610,102,50,"#b2b6ad","#f2d4b7",20,"POST");
    building(546,606,112,55,"#b6aaba","#cab6dc",18,"CINEMA");
    building(714,611,101,55,"#c1b0ab","#e6bfc0",17,"SHOPS");
    // Central market square, public fountain.
    add(map,block(541,318,118,79,"#fce3b6",.98,20));
    add(map,el("ellipse",{cx:600,cy:349,rx:29,ry:19,fill:"#75d6e3",stroke:"#ffffff","stroke-width":7}));
    add(map,el("path",{d:"M600 354 Q590 329 598 318 Q609 332 600 354",stroke:"#f9ffff","stroke-width":4,fill:"none"}));
    tree(904,347,1.1);tree(961,348,.97);tree(944,400,1);tree(893,399,.9);tree(1036,474,.9);tree(1046,538,.8);tree(219,346,.86);tree(292,349,.8);tree(222,393,.84);tree(393,358,.86);tree(449,379,.86);tree(776,346,.9);tree(784,398,.7);tree(231,538,.7);tree(633,541,.69);tree(930,634,.88);tree(1004,634,.78);
    // Road markings and road labels, and mini pedestrian crossings.
    E.rows.forEach(y=>E.columns.forEach(x=>{
      for(let i=0;i<4;i++)add(map,el("rect",{x:x-26+i*13,y:y-28,width:8,height:7,rx:1,fill:"#ffffff",opacity:.68}));
    }));
    roadText(264,122,"STATION ROAD");roadText(682,419,"MARKET AVENUE");roadText(970,566,"RIVERSIDE");
    // City badges and decorative details
    label(685,263,"🏛️","CITY MUSEUM","DESTINATION",true);
    label(170,724,"🚉","CENTRAL STATION","START",true);
    label(600,409,"⛲","MARKET SQUARE","MEET HERE");
    add(map,el("text",{x:1116,y:360,transform:"rotate(89 1116 360)","font-family":"system-ui,sans-serif","font-weight":900,"font-size":20,"letter-spacing":6,fill:"#317d91",opacity:.65},"RIVERTON RIVER"));
    add(map,el("text",{x:65,y:57,"font-family":"system-ui,sans-serif","font-weight":900,"font-size":30,"letter-spacing":2,fill:"#276579"},"RIVERTON"));
    add(map,el("text",{x:67,y:80,"font-family":"system-ui,sans-serif","font-weight":700,"font-size":12,"letter-spacing":3,fill:"#4c8f8e"},"EXPLORE THE CITY"));
    // Compass rose.
    const compass=add(map,el("g",{transform:"translate(1131 83)"}));
    add(compass,el("circle",{r:36,fill:"#ffffff",opacity:.8}));
    add(compass,el("path",{d:"M0 -24 L8 0 L0 24 L-8 0 Z",fill:"#2d8d9b"}));
    add(compass,el("path",{d:"M0 -24 L8 0 L0 0Z",fill:"#17384b"}));
    add(compass,el("text",{x:0,y:-31,"text-anchor":"middle","font-family":"system-ui,sans-serif","font-size":12,"font-weight":900,fill:"#1c5362"},"N"));
    // Interactive route is drawn on top and populated below.
    add(map,el("polyline",{id:"activePath",points:"",fill:"none",stroke:"#0d7089","stroke-width":14,"stroke-linecap":"round","stroke-linejoin":"round",opacity:.22}));
    add(map,el("polyline",{id:"activePathFront",points:"",fill:"none",stroke:"#00bfe0","stroke-width":8,"stroke-linecap":"round","stroke-linejoin":"round"}));
    const nodeLayer=add(map,el("g",{id:"nodeLayer"}));
    E.rows.forEach((_,r)=>E.columns.forEach((__,c)=>{
      const point={c,r}, pos=E.position(point);
      const group=add(nodeLayer,el("g",{"data-node":c+"-"+r,role:"button",tabindex:"0","aria-label":"Crossroads column "+(c+1)+", row "+(r+1),"aria-pressed":"false"}));
      const hit=add(group,el("circle",{cx:pos.x,cy:pos.y,r:22,fill:"#ffffff","fill-opacity":.01,stroke:"none"}));
      add(group,el("circle",{cx:pos.x,cy:pos.y,r:8,fill:"#fefefe",stroke:"#61939d","stroke-width":2.4,opacity:.95}));
      const activate=()=>{
        if(active==="route")applyMove(E.move(route,point));
        else $('dialogueStatus').textContent="Map tip: in the dialogue, compare your words with Riverton's streets.";
      };
      group.addEventListener("click",activate);
      group.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();activate();}});
    }));
    renderRoute();
  }
  function renderRoute(){
    const points=route.map(n=>{const p=E.position(n);return p.x+","+p.y;}).join(" ");
    $("activePath").setAttribute("points",points);
    $("activePathFront").setAttribute("points",points);
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
  function applyMove(result){
    route=result.route;
    const status=$("routeStatus");
    status.textContent=result.message;
    status.dataset.tone=["success","moved","undo"].includes(result.outcome)?"good":"warn";
    showingModel=false;
    renderRoute();
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
    const zoomed=$("mapViewport").classList.toggle("zoomed");
    $("mapZoom").setAttribute("aria-pressed",String(zoomed));
    $("mapZoom").textContent=zoomed?"− Normal size":"⌕ Zoom";
  });
  setTab("route");
  drawCity();showScene();
})();