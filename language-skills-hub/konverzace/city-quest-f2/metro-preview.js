/* CITY QUEST F2.1B — RIVERTON METRO VISUAL LAB.
 * Original interactive SVG network / platform / train scene.
 * This is a design review linked to the current multilingual card, NOT a
 * gradeable metro station implementation. No HTTP, fetch, login or media API.
 */
(() => {
 "use strict";
 const M=window.RivertonMetro,LC=window.RivertonMetroLanguage;
 if(!M)throw Error("Riverton Metro network module is missing.");
 const $=id=>document.getElementById(id);
 const lab=$("metroLab"),jump=$("metroJump"),network=$("metroNetworkSvg"),scene=$("metroSceneSvg");
 if(!lab||!jump||!network||!scene)throw Error("F2.1B metro markup missing");
 const svgNS="http://www.w3.org/2000/svg";
 const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 const review=[
  {id:"metro_05_b1",number:"05",title:"Find your line",subtitle:"Central Station → Museum Quarter"},
  {id:"metro_06_b1",number:"06",title:"Change trains",subtitle:"Market Square → Stadium"},
  {id:"metro_07_b1",number:"07",title:"Service disruption",subtitle:"Find an alternative route"},
  {id:"metro_08_b1",number:"08",title:"City + Metro",subtitle:"Experience a cross-city journey"}
 ];
 const labels={
  west_end:[105,371],central_station:[350,375],old_town:[500,367],
  museum_quarter:[678,375],riverside:[868,370],east_gardens:[1035,375],
  north_park:[320,51],university:[402,145],market_square:[425,506],
  south_gate:[395,686],hilltop:[100,108],science_centre:[502,169],
  stadium:[947,496],harbour:[1031,670]
 };
 let current=M.startPreview(review[0].id),inspected="central_station",view="platform",overview=false,gameMode=null;
 const svg=(tag,attrs,content)=>{
  const n=document.createElementNS(svgNS,tag);
  for(const [k,v] of Object.entries(attrs||{}))n.setAttribute(k,String(v));
  if(content!==undefined)n.textContent=String(content);
  return n;
 };
 const append=(parent,tag,attrs,content)=>{
  const n=svg(tag,attrs,content);parent.appendChild(n);return n;
 };
 const html=(parent,tag,className,content)=>{
  const n=document.createElement(tag);
  if(className)n.className=className;
  if(content!==undefined)n.textContent=String(content);
  parent.appendChild(n);return n;
 };
 const scenario=()=>M.scenario(current.scenarioId);
 const route=()=>M.itinerary(current.scenarioId);
 const step=()=>route()[current.index];
 const stationName=id=>M.station(id)?.labelEn||id;
 const gameCopy=()=>gameMode&&LC?LC.pack($("f2Language").value,$("f2Level").value,gameMode.stationNumber):null;
 const lineColour=id=>M.line(id)?.color||"#63e5c8";
 const displayLineId=()=>gameMode?(gameMode.lineId||"—"):step().line;
 const currentLine=()=>M.line(displayLineId())||{id:"—",name:gameCopy()?.labels.concourse||"Station concourse",color:"#6597ae"};
 const atStation=()=>step().station;
 function drawnText(parent,x,y,txt,props){
  const attrs=Object.assign({x:x,y:y,fill:"#e9ffff","font-family":"system-ui,sans-serif"},props||{});
  return append(parent,"text",attrs,txt);
 }
 function defs(parent){
  const d=append(parent,"defs");
  function gradient(id,stops){
   const g=append(d,"linearGradient",{id:id,x1:"0%",y1:"0%",x2:"100%",y2:"100%"});
   stops.forEach(([at,color,opacity])=>append(g,"stop",{offset:at,"stop-color":color,"stop-opacity":opacity||1}));
  }
  gradient("rmBackground",[["0%","#06182a"],["56%","#102e43"],["100%","#0b1e33"]]);
  gradient("rmRiver",[["0%","#1d6174"],["100%","#12394c"]]);
  gradient("platformWall",[["0%","#123f55"],["100%","#0b223a"]]);
  gradient("platformFloor",[["0%","#375366"],["100%","#182e42"]]);
  gradient("metroCarBody",[["0%","#dbeefa"],["50%","#a4d1e0"],["100%","#487b91"]]);
  gradient("metroWindow",[["0%","#18506a"],["100%","#071f34"]]);
  gradient("metroOnboard",[["0%","#284f67"],["100%","#0b263c"]]);
  const filter=append(d,"filter",{id:"rmLightGlow",x:"-70%",y:"-70%",width:"240%",height:"240%"});
  append(filter,"feGaussianBlur",{stdDeviation:"6",result:"blur"});
  const merge=append(filter,"feMerge");
  append(merge,"feMergeNode",{in:"blur"});append(merge,"feMergeNode",{in:"SourceGraphic"});
  const sceneGlow=append(d,"filter",{id:"sceneGlow",x:"-60%",y:"-60%",width:"220%",height:"220%"});
  append(sceneGlow,"feGaussianBlur",{stdDeviation:"4",result:"sceneBlur"});
  const merge2=append(sceneGlow,"feMerge");
  append(merge2,"feMergeNode",{in:"sceneBlur"});append(merge2,"feMergeNode",{in:"SourceGraphic"});
  const pattern=append(d,"pattern",{id:"rmDots",width:"32",height:"32",patternUnits:"userSpaceOnUse"});
  append(pattern,"circle",{cx:2,cy:2,r:1.15,fill:"#6bbed1",opacity:.17});
 }
 function rounded(parent,x,y,w,h,fill,r,other){
  return append(parent,"rect",Object.assign({x,y,width:w,height:h,rx:r||0,fill},other||{}));
 }
 function mapDecor(){
  rounded(network,0,0,1196,756,"url(#rmBackground)");
  rounded(network,0,0,1196,756,"url(#rmDots)",0,{opacity:.8});
  // Original schematic city motifs: river, surface grids, architectural silhouettes.
  append(network,"path",{d:"M1076 -15 C1112 125 1120 230 1095 350 C1064 485 1110 576 1147 756 L1220 756 L1220 0Z",
    fill:"url(#rmRiver)",opacity:.35});
  append(network,"path",{d:"M1118 -25 C1144 125 1146 230 1127 350 C1098 490 1143 600 1172 760",
    fill:"none",stroke:"#6edfe0","stroke-width":3,opacity:.13});
  for(let i=0;i<13;i++){
   const x=48+(i*91);
   append(network,"path",{d:"M"+x+" 0 V756",stroke:"#8dc9d7","stroke-width":1,opacity:.04});
  }
  for(let i=0;i<9;i++)append(network,"path",{d:"M0 "+(48+i*83)+" H1196",stroke:"#8dc9d7","stroke-width":1,opacity:.05});
  const ornaments=[
   [63,415,90,80],[175,545,88,92],[537,480,80,126],[909,88,155,80],
   [740,570,99,89],[465,74,62,62],[67,220,95,60],[872,545,75,59]
  ];
  for(const [x,y,w,h] of ornaments){
   rounded(network,x,y,w,h,"#6ec9c0",8,{opacity:.045});
   rounded(network,x+8,y+8,w-16,h-16,"none",5,{stroke:"#9bdfe1",opacity:.09});
  }
  drawnText(network,50,55,"RIVERTON",{"font-size":28,"font-weight":950,"letter-spacing":5.5,fill:"#eafdfa"});
  drawnText(network,51,79,"UNDERGROUND NETWORK  /  3 LINES",{"font-size":12,"font-weight":750,"letter-spacing":2.6,fill:"#88c7d2"});
  drawnText(network,1051,55,"NOT TO SCALE",{"font-size":11,"font-weight":800,"letter-spacing":1.4,
    "text-anchor":"end",fill:"#9bced8"});
  drawnText(network,51,727,gameMode?"F2.1C EN/B1 MISSION  •  OFFLINE TRAINING":"F2.1B VISUAL PREVIEW  •  RIDE THE NETWORK",{"font-size":12,"font-weight":800,
    "letter-spacing":1.4,fill:"#77acb8"});
  append(network,"path",{d:"M49 703H1145",fill:"none",stroke:"#8adcd3","stroke-width":1,opacity:.2});
 }
 function connectionPoints(line){
  return line.stops.map(id=>M.station(id).x+","+M.station(id).y).join(" ");
 }
 function routeSegments(){
  if(!gameMode)return scenario().legs.map(leg=>leg.stops.map(id=>M.station(id).x+","+M.station(id).y).join(" "));
  // Never expose future steps of the correct route during a mission.
  const traveled=route().slice(0,current.index+1),segments=[];
  let active=null;
  for(let i=1;i<traveled.length;i++){
   const now=traveled[i],previous=traveled[i-1];
   if(now.kind!=="ride"){active=null;continue;}
   if(!active||active.line!==now.line){
    active={line:now.line,ids:[previous.station,now.station]};segments.push(active);
   }else active.ids.push(now.station);
  }
  return segments.map(part=>part.ids.map(id=>M.station(id).x+","+M.station(id).y).join(" "));
 }
 function renderNetwork(){
  network.replaceChildren();defs(network);mapDecor();
  const geometry=append(network,"g",{id:"metroRails"});
  // Semi-transparent line casing provides subway-map depth, not browser canvas.
  for(const line of M.lines){
   const points=connectionPoints(line);
   append(geometry,"polyline",{points,fill:"none",stroke:line.color,"stroke-width":45,opacity:.13,
     "stroke-linejoin":"round","stroke-linecap":"round",class:"metro-track-glow"});
   append(geometry,"polyline",{points,fill:"none",stroke:"#041625","stroke-width":29,
     "stroke-linejoin":"round","stroke-linecap":"round"});
   append(geometry,"polyline",{points,fill:"none",stroke:line.color,"stroke-width":17,
     "stroke-linejoin":"round","stroke-linecap":"round"});
   append(geometry,"polyline",{points,fill:"none",stroke:"#e9f7fe","stroke-width":2.2,opacity:.37,
     "stroke-linejoin":"round","stroke-linecap":"round"});
  }
  // Closed line is explicitly visually disabled, rather than covered by a fake live notice.
  for(const edge of scenario().closedEdges||[]){
   const a=M.station(edge.from),b=M.station(edge.to);
   append(geometry,"line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:"#071b27","stroke-width":27});
   append(geometry,"line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:"#ff807d","stroke-width":15,
     "stroke-dasharray":"15 11","stroke-linecap":"round"});
   const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
   rounded(geometry,mx-70,my-49,140,30,"#922f42",9,{stroke:"#ffc8b6","stroke-width":2});
   drawnText(geometry,mx,my-29,"SERVICE CLOSED",{"font-size":12.5,"font-weight":900,
     "text-anchor":"middle",fill:"#fff8ed"});
  }
  const preferred=append(network,"g",{id:"metroPreferredRoute","aria-hidden":"true"});
  for(const pts of routeSegments())append(preferred,"polyline",{points:pts,fill:"none",
    stroke:"#f8fdf4","stroke-width":7,"stroke-linejoin":"round","stroke-linecap":"round",
    opacity:.85,class:"metro-active-route"});
  // Stop labels are individually positioned to avoid collision with interchange rings.
  const nodes=append(network,"g",{id:"metroStops"});
  const interchangeIds=new Set(M.source.interchanges.map(x=>x.station));
  for(const st of M.stations){
   const group=append(nodes,"g",{"data-metro-station":st.id,role:"button",tabindex:0,
    "aria-pressed":String(inspected===st.id),
    "aria-label":st.labelEn+"; "+M.joined(st.id).join(" and ")});
   append(group,"circle",{class:"metro-node-halo",cx:st.x,cy:st.y,r:31,fill:"#8afcf7",
    opacity:inspected===st.id?.24:0,stroke:"none"});
   append(group,"circle",{class:"metro-node-hit",cx:st.x,cy:st.y,r:28,fill:"transparent",
    stroke:"none"});
   if(interchangeIds.has(st.id)){
    append(group,"circle",{cx:st.x,cy:st.y,r:18,fill:"#071f2f",stroke:"#fcfff4","stroke-width":5});
    append(group,"circle",{cx:st.x,cy:st.y,r:10,fill:"#ffffff",stroke:"#0a3141","stroke-width":2});
   }else{
    append(group,"circle",{cx:st.x,cy:st.y,r:12,fill:"#ecfefb",stroke:"#0a2239","stroke-width":4});
    append(group,"circle",{cx:st.x,cy:st.y,r:4,fill:lineColour(M.joined(st.id)[0])});
   }
   const [x,y]=labels[st.id]||[st.x+18,st.y-22];
   drawnText(group,x,y,st.labelEn,{class:"metro-station-label",
    "font-size":interchangeIds.has(st.id)?19:17,"text-anchor":st.id==="north_park"||st.id==="hilltop"?"middle":"middle"});
   group.addEventListener("click",()=>selectStation(st.id));
   group.addEventListener("keydown",event=>{
    if(event.key==="Enter"||event.key===" "){event.preventDefault();selectStation(st.id);}
   });
  }
  const active=M.station(atStation());
  if(active){
   append(network,"circle",{class:"metro-map-player",cx:active.x,cy:active.y,r:25,
    fill:"none",stroke:"#ffe99a","stroke-width":5,"pointer-events":"none"});
   append(network,"circle",{cx:active.x,cy:active.y,r:6.5,fill:"#fff7c0",stroke:"#0b2c40",
    "stroke-width":2,"pointer-events":"none"});
   // Keep the route location in a fixed map HUD, never over station labels.
   const badge="● AT "+active.labelEn.toUpperCase();
   const w=Math.min(286,Math.max(178,badge.length*9.5));
   const x=1151-w;
   rounded(network,x,91,w,32,"#e6fef3",13,{stroke:"#66eac6","stroke-width":2,
     "pointer-events":"none"});
   drawnText(network,x+w/2,112,badge,{"text-anchor":"middle","font-size":14,
     "font-weight":900,fill:"#104256","pointer-events":"none"});
  }
  window.requestAnimationFrame(centerOnCurrent);
 }
 function centerOnCurrent(){
  const viewport=$("metroNetworkViewport");
  if(!viewport||overview||viewport.scrollWidth<=viewport.clientWidth+10)return;
  const currentStation=M.station(atStation());if(!currentStation)return;
  const ratio=network.getBoundingClientRect().width/1196;
  const left=Math.max(0,currentStation.x*ratio-viewport.clientWidth*.46);
  const top=Math.max(0,currentStation.y*ratio-viewport.clientHeight*.40);
  viewport.scrollTo({left,top,behavior:reduced?"auto":"smooth"});
 }
 function syncNetworkZoom(){
  const viewport=$("metroNetworkViewport"),control=$("metroMapZoom");
  viewport.classList.toggle("overview",overview);
  control.setAttribute("aria-pressed",String(overview));
  control.textContent=overview?"⊕ Readable detail":"⊞ Whole network";
  if(overview)viewport.scrollTo({left:0,top:0,behavior:"auto"});
  else window.requestAnimationFrame(centerOnCurrent);
 }
 function selectStation(id){
  // Do not rebuild the SVG on inspection: preserve Tab focus, viewport pan and
  // the user's current route. The selection is informational, not movement.
  inspected=id;
  network.querySelectorAll("[data-metro-station]").forEach(group=>{
   const match=group.dataset.metroStation===id;
   group.setAttribute("aria-pressed",String(match));
   const halo=group.querySelector(".metro-node-halo");
   if(halo)halo.setAttribute("opacity",match?".24":"0");
  });
  renderInspector();
  $("metroFeedback").textContent="Station selected: "+stationName(id)+". This is a network inspection, not a game move.";
  $("metroFeedback").dataset.state="info";
 }
 function renderInspector(){
  const station=M.station(inspected),lines=M.joined(inspected);
  if(!station)return;
  $("metroInspectorName").textContent=station.labelEn;
  $("metroInspectorLine").textContent=lines.join(" · ");
  const transfers=lines.length>1?"Interchange between "+lines.join(" and ")+". ":
    "Served by "+lines[0]+". ";
  const portals=M.source.surfacePortals.filter(p=>p.metroStation===inspected);
  $("metroInspectorDetail").textContent=transfers+
    (portals.length?"Surface connection: "+portals[0].description+". ":"")+
    "Select a mission and follow the route to practise navigating.";
 }
 function lineFixture(){
  const currentStep=step();
  const next=route()[Math.min(current.index+1,route().length-1)];
  if(gameMode&&!gameMode.platform)return null;
  const candidates=M.source.platformFixtures.filter(p=>p.station===currentStep.station&&p.line===currentStep.line);
  if(!candidates.length)return null;
  if(next?.kind==="ride"){
   const l=M.line(currentStep.line),i=l.stops.indexOf(currentStep.station),
     j=l.stops.indexOf(next.station);
   const towards=j>=i?l.stops.at(-1):l.stops[0];
   return candidates.find(p=>p.directionTerminus===towards)||null;
  }
  return candidates[0];
 }
 function sceneDefs(){
  defs(scene);
 }
 function platformScene(){
  scene.replaceChildren();sceneDefs();
  const color=currentLine().color,name=stationName(atStation()),fixture=lineFixture();
  rounded(scene,0,0,900,460,"url(#platformWall)");
  // Architectural ribs and luminescent advertising; 2.5D station geometry.
  for(let i=0;i<10;i++){
   const x=i*104;
   append(scene,"path",{d:"M"+x+" 0V320",stroke:"#6ce4db","stroke-width":7,opacity:.07});
  }
  append(scene,"path",{d:"M0 309 L900 333 L900 460 L0 460Z",fill:"url(#platformFloor)"});
  append(scene,"path",{d:"M0 324 L900 347",stroke:"#e2ecf2","stroke-width":5,opacity:.47});
  append(scene,"path",{d:"M0 344 L900 370",stroke:"#ffc674","stroke-width":10,opacity:.8});
  for(let i=0;i<15;i++){
   const x=i*72;
   append(scene,"path",{d:"M"+x+" 352 L"+(x+80)+" 460",stroke:"#a2c9cc",
     "stroke-width":1.5,opacity:.17});
  }
  // Overhead beams.
  rounded(scene,0,0,900,28,"#051525");
  rounded(scene,0,27,900,9,"#77c8d1",0,{opacity:.25});
  for(let i=0;i<6;i++){
   const x=78+i*150;
   rounded(scene,x,42,92,7,"#b7fff6",3,{opacity:.58,class:"metro-scene-neon"});
  }
  // Central hanging direction board.
  rounded(scene,145,57,610,102,"#082437",14,{stroke:"#69cbd0","stroke-width":2});
  rounded(scene,157,70,115,75,color,12);
  drawnText(scene,214,119,displayLineId(),{"text-anchor":"middle","font-weight":950,"font-size":44,fill:"#092738"});
  drawnText(scene,295,98,name.toUpperCase(),{"font-size":28,"font-weight":900,
    "letter-spacing":1,fill:"#eafffa"});
  const arrived=!!gameMode&&["exit","walk-to-museum","speech","complete"].includes(gameMode.phase);
  const platform=arrived?"DESTINATION REACHED":
    fixture?"PLATFORM "+fixture.platform:gameMode?"CHECK PLATFORM":"WAYFINDING PREVIEW";
  const next=route()[Math.min(current.index+1,route().length-1)];
  const dest=fixture?stationName(fixture.directionTerminus):
    (gameMode&&gameMode.direction?stationName(gameMode.direction):gameMode?"CHECK TERMINUS":
      next?.line?stationName(M.line(next.line).stops.at(-1)):"CHECK LINE");
  const sign=arrived?"DESTINATION REACHED  •  FOLLOW EXIT SIGNS":
    platform+"   •   TOWARDS "+dest.toUpperCase();
  drawnText(scene,296,133,sign,{
    "font-size":14,"font-weight":780,"letter-spacing":1.2,fill:"#a8d5dc"});
  append(scene,"path",{d:"M195 159V177 M705 159V177",stroke:"#7dbfcb","stroke-width":5});
  // Platform edge / tunnel with perspective train; all vector artwork.
  rounded(scene,34,182,830,140,"#092238",22,{stroke:"#40738b","stroke-width":4});
  const train=append(scene,"g",{class:"metro-animated-train"});
  rounded(train,58,189,770,126,"url(#metroCarBody)",20,
    {stroke:"#d8f9f6","stroke-width":4});
  rounded(train,58,266,770,17,color,3,{opacity:.94});
  for(let i=0;i<6;i++){
   const x=90+i*119;
   rounded(train,x,207,84,51,"url(#metroWindow)",11,{stroke:"#6ebfd1","stroke-width":3});
   rounded(train,x+8,216,28,3,"#8ce5df",2,{opacity:.3});
  }
  for(const x of [305,567]){
   rounded(train,x,202,12,90,"#28596e",3,{opacity:.9});
   rounded(train,x+16,202,12,90,"#28596e",3,{opacity:.9});
  }
  rounded(train,72,272,190,26,"#0a3550",9,{opacity:.92});
  drawnText(train,167,290,"RIVERTON METRO",{"text-anchor":"middle","font-size":15,
    "font-weight":950,"letter-spacing":1.2});
  rounded(train,746,211,60,24,"#0a2c43",8,{fill:"#103c4d"});
  drawnText(train,776,228,displayLineId(),{"text-anchor":"middle","font-size":18,"font-weight":900,
    fill:"#abfff0"});
  // Track perspective.
  append(scene,"path",{d:"M0 348 L900 388 L900 424 L0 381Z",fill:"#071b29"});
  for(let i=0;i<21;i++){
   const x=i*47;
   append(scene,"path",{d:"M"+x+" 366 L"+(x+9)+" 411",
    stroke:"#718e96","stroke-width":5,opacity:.45});
  }
  rounded(scene,35,389,200,54,"#102e41",12,{stroke:"#66d1d08b","stroke-width":2});
  drawnText(scene,50,409,"NEXT SERVICE",{"font-size":13,"letter-spacing":1.5,
    "font-weight":900,fill:"#a2e2de"});
  drawnText(scene,50,428,gameMode&&gameMode.phase!=="ride"?"Follow the signs":next?.kind==="ride"?stationName(next.station):"Awaiting departure",{
    "font-size":17,"font-weight":780,fill:"#fff7df"});
  $("metroSceneSvg").setAttribute("aria-label","Illustrated platform at "+name+" on "+displayLineId());
 }
 function trainScene(){
  scene.replaceChildren();sceneDefs();
  const color=currentLine().color,name=stationName(atStation()),steps=route();
  rounded(scene,0,0,900,460,"url(#metroOnboard)");
  // Dark glazed windows, city silhouettes moving symbolically behind glass.
  rounded(scene,42,55,816,244,"#d5e8ed",25,{stroke:"#84adb8","stroke-width":6});
  rounded(scene,57,69,786,215,"#0c3552",19);
  for(let i=0;i<14;i++){
   const x=74+i*58;
   rounded(scene,x,195-(i%4)*12,39,76+(i%4)*12,"#174966",3,{opacity:.9});
   for(let j=0;j<3;j++)rounded(scene,x+6+j*10,214-(i%4)*12,5,7,"#5ed7cb",1,{opacity:.18});
  }
  append(scene,"path",{d:"M58 237 C240 217 370 254 520 230 S748 250 844 224",
    fill:"none",stroke:"#5bd7d3","stroke-width":3,opacity:.22});
  // Route tracker over the metro window.
  rounded(scene,110,14,680,70,"#09273d",14,{stroke:"#8edee1","stroke-width":2});
  rounded(scene,126,26,105,44,color,10);
  drawnText(scene,178,56,displayLineId(),{"text-anchor":"middle","font-size":30,"font-weight":950,
    fill:"#082b3f"});
  drawnText(scene,251,39,"NEXT STOP / CURRENT LOCATION",{"font-size":12,"letter-spacing":1.5,
    "font-weight":900,fill:"#a8d8d9"});
  drawnText(scene,252,63,name.toUpperCase(),{"font-size":23,"font-weight":920,fill:"#f3fffb"});
  for(const x of [272,625])append(scene,"path",{d:"M"+x+" 83V350",
    stroke:"#c7e7ea","stroke-width":9,opacity:.66});
  // Ceiling-mounted passenger lights and seating.
  rounded(scene,0,314,900,146,"#16364c");
  append(scene,"path",{d:"M0 315 L900 315",stroke:"#68d1d8","stroke-width":7,opacity:.5});
  for(const x of [63,335,606]){
   rounded(scene,x,344,220,101,"#22536c",17,{stroke:"#4e94a3","stroke-width":4});
   rounded(scene,x+9,357,202,17,color,9,{opacity:.75});
  }
  rounded(scene,364,404,170,30,"#0a2b42",10,{opacity:.8});
  drawnText(scene,449,425,"RIVERTON METRO",{"text-anchor":"middle","font-size":16,"font-weight":950,
    "letter-spacing":1.5,fill:"#d8f9ef"});
  $("metroSceneSvg").setAttribute("aria-label","Illustrated interior of a "+displayLineId()+" metro train at "+name);
 }
 function drawScene(){
  if(view==="platform")platformScene();else trainScene();
  const localized=gameCopy()?.labels;
  $("metroSceneHeading").textContent=view==="platform"?(localized?.scenePlatform||"Platform view"):(localized?.sceneTrain||"On-board experience");
  $("metroViewPlatform").setAttribute("aria-pressed",String(view==="platform"));
  $("metroViewTrain").setAttribute("aria-pressed",String(view==="train"));
  $("metroViewPlatform").classList.toggle("active",view==="platform");
  $("metroViewTrain").classList.toggle("active",view==="train");
  $("metroSceneStation").textContent=stationName(atStation());
  $("metroSceneLine").textContent=displayLineId()+" · "+currentLine().name;
  $("metroStopIndicator").style.color=lineColour(displayLineId());
 }
 function drawLegend(){
  const dest=$("metroLegend");dest.replaceChildren();
  for(const line of M.lines){
   const e=html(dest,"span","metro-legend-item");
   const sw=html(e,"span","metro-legend-swatch");
   sw.style.setProperty("--metro-colour",line.color);
   html(e,"span","",line.id+" "+line.name);
  }
 }
 function drawScenarios(){
  const host=$("metroScenarios");host.replaceChildren();
  for(const x of review){
   const button=html(host,"button","metro-scenario-button");
   button.type="button";button.dataset.scenario=x.id;
   button.setAttribute("aria-pressed",String(x.id===current.scenarioId));
   html(button,"span","metro-scenario-number",x.number);
   const copy=html(button,"span","metro-scenario-content");
   html(copy,"strong","",x.title);
   html(copy,"small","",x.subtitle);
   button.addEventListener("click",()=>chooseScenario(x.id));
  }
 }
 function drawJourney(){
  const s=scenario(),steps=route(),now=step(),next=steps[current.index+1];
  const total=Math.max(1,steps.length-1);
  $("metroJourneyBadge").textContent=String(s.stationNumber).padStart(2,"0");
  $("metroOrigin").textContent=stationName(s.start);
  $("metroDestination").textContent=stationName(s.goal);
  $("metroJourneyProgress").setAttribute("aria-valuemax",String(total));
  $("metroJourneyProgress").setAttribute("aria-valuenow",String(current.index));
  $("metroJourneyProgress").querySelector("span").style.width=
    Math.round(current.index/total*100)+"%";
  const alert=$("metroNetworkAlert");
  alert.hidden=!(s.closedEdges?.length);
  if(!alert.hidden)alert.textContent=gameMode?"⚠ "+gameCopy().phases.notice:
    "⚠ M1 Old Town – Museum Quarter CLOSED · follow the alternative via University";
  if(gameMode){
    const lang=$("f2Language").value,level=$("f2Level").value,copy=gameCopy();
    $("metroInstruction").textContent=LC.stage(lang,level,gameMode.stationNumber,gameMode.phase,
      {station:stationName(gameMode.metroStation)});
    $("metroNextInfo").textContent=copy.labels.step+" "+(current.index+1)+"/"+steps.length+
      " · "+stationName(gameMode.metroStation)+" · "+(gameMode.lineId||copy.labels.noLine);
    $("metroAdvance").disabled=true;
    $("metroFeedback").textContent=copy.labels.choice;
    $("metroFeedback").dataset.state="info";
    return;
  }
  $("metroInstruction").textContent=current.finished?
    "You have reached "+stationName(s.goal)+". Explain your route to your partner.":
    next.kind==="transfer"?
      "Change at "+stationName(now.station)+" from "+now.line+" to "+next.line+".":
    next.kind==="ride"?
      "Take "+next.line+" from "+stationName(now.station)+" to "+stationName(next.station)+".":"Explore the network.";
  const nextText=next?next.kind==="transfer"?"TRANSFER → "+next.line+" · "+stationName(next.station):
    "NEXT STOP → "+stationName(next.station):
    "DESTINATION REACHED";
  $("metroNextInfo").textContent=nextText+"  •  STEP "+(current.index+1)+"/"+steps.length;
  const button=$("metroAdvance");
  button.disabled=current.finished;
  const buttonLabel=current.finished?"Mission preview complete":
    next.kind==="transfer"?"Change to "+next.line+" →":
    current.index===0?"Board "+next.line+" · next stop →":"Next station →";
  button.replaceChildren(document.createTextNode(buttonLabel));
  $("metroFeedback").textContent=current.finished?
    "✓ Destination reached. The network engine verified every segment and transfer.":
    current.index===0?"Begin with the guided route, or inspect any station on the network.":
    now.kind==="transfer"?"Transfer confirmed at "+stationName(now.station)+". Continue your journey.":
    "Arrived at "+stationName(now.station)+" on "+now.line+".";
  $("metroFeedback").dataset.state=current.finished?"complete":"progress";
 }
 function renderAll(){
  drawScenarios();renderNetwork();drawScene();drawJourney();renderInspector();
 }
 function chooseScenario(id){
  if(gameMode)return;
  current=M.startPreview(id);inspected=scenario().start;view="platform";renderAll();
 }
 function advance(){
  if(gameMode||current.finished)return;
  const from=step();
  current=M.advancePreview(current);
  inspected=atStation();
  const now=step();
  view=now.kind==="transfer"?"platform":now.kind==="ride"?"train":"platform";
  renderAll();
  // Mark exactly one step per explicit click; no timers or auto-advancement.
  $("metroFeedback").textContent=now.kind==="transfer"?
    "⇄ Changed from "+from.line+" to "+now.line+" at "+stationName(now.station)+".":
    "● Next stop: "+stationName(now.station)+".";
  if(current.finished){
    view="platform";drawScene();
    $("metroFeedback").textContent="✓ Journey completed at "+stationName(now.station)+
      ". Explain line choices and transfer directions aloud.";
    $("metroFeedback").dataset.state="complete";
  }
 }
 function updateVisibility(){
  const level=$("f2Level").value,bridge=window.CityQuestF2MetroBridge;
  const pilot=!!bridge?.pilotActive(),sceneVisible=!!bridge?.metroVisible();
  const shown=pilot?sceneVisible:!["A1","A2"].includes(level),copy=pilot?gameCopy():null;
  lab.hidden=!shown;jump.hidden=pilot||!shown;
  lab.querySelector(".metro-scenario-toolbar").hidden=pilot;
  lab.querySelector(".metro-action-card").hidden=pilot;
  lab.querySelector(".metro-scene-toggle").hidden=pilot;
  lab.querySelector(".metro-banner .metro-overline").textContent=pilot?
    copy.kicker+" / F2.1D "+level:"RIVERTON TRANSIT SYSTEM / F2.1B VISUAL PROTOTYPE";
  $("metroHeading").textContent=pilot?copy.title:"The city has another layer.";
  lab.querySelector(".metro-banner-copy > p").textContent=pilot?copy.overview:
    "Discover the metro network, explore an illustrated platform and follow a train through Riverton. Fictional network and timetables. This preview does not grade speaking.";
  lab.querySelector(".metro-disclaimer").textContent=pilot?
    "F2.1D · "+copy.native+" "+level+" · "+copy.offline+" · No server, speech recording or requests.":
    "F2.1B visual review · English signage uses fictional official place names. Metro teaching content now supports four languages B1–C2.";
  jump.textContent="🚇 Riverton Metro · EN visual preview (B1+)";
  if(shown)renderAll();
 }
 window.RivertonMetroVisual=Object.freeze({
  sync(state){
    gameMode=state||null;
    if(state){
      current={scenarioId:state.scenarioId,index:window.RivertonMetroGame.routeIndex(state),
        finished:state.completed};
      inspected=state.metroStation;
      view=state.phase==="ride"?"train":"platform";
    }else{
      current=M.startPreview(review[0].id);
      inspected=M.scenario(current.scenarioId).start;
      view="platform";
    }
    updateVisibility();
  }
 });
 $("metroMapZoom").addEventListener("click",()=>{overview=!overview;syncNetworkZoom();});
 $("metroAdvance").addEventListener("click",advance);
 $("metroReplay").addEventListener("click",()=>chooseScenario(current.scenarioId));
 $("metroViewPlatform").addEventListener("click",()=>{view="platform";drawScene();});
 $("metroViewTrain").addEventListener("click",()=>{view="train";drawScene();});
 jump.addEventListener("click",()=>{
  lab.scrollIntoView({behavior:reduced?"auto":"smooth",block:"start"});
  $("metroHeading").setAttribute("tabindex","-1");
  $("metroHeading").focus({preventScroll:true});
 });
 $("f2Level").addEventListener("change",updateVisibility);
 $("f2Language").addEventListener("change",updateVisibility);
 drawLegend();updateVisibility();syncNetworkZoom();
})();
