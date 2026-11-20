/* City Quest F2: fully local client-side user interface for 4 languages x 6 CEFR levels.
 * Reuses verified F0 map artwork and F1 route/transit engines; no requests.
 */
(() => {
  "use strict";
  const C=window.CityQuestF2Content,G=window.CityQuestF2Engine,F=window.CityQuestF1Engine,E=window.CityQuestEngine;
  if(!C||!G||!F||!E)throw Error("City Quest F2 modules did not load in dependency order.");
  const $=id=>document.getElementById(id);
  const panel=$("f1Panel"),map=$("cityMap"),viewport=$("mapViewport");
  const NS="http://www.w3.org/2000/svg";
  const icons=["🗺️","🧭","💬","👣","🚌","↩️","🚧","🏆"];
  const flags={en:"🇬🇧",es:"🇪🇸",de:"🇩🇪",fr:"🇫🇷"};
  const stationKeys=["explore","route","dialogue","guided","transit","repair","detour","quest"];
  const chromeCopy={
    en:{theme:"Toggle light/dark theme",detail:"Map detail",whole:"Whole city",tip:"Select Map detail to zoom in on street names",tipZoom:"Swipe across the city map to explore",kicker:"EXPLORE · NAVIGATE · COMMUNICATE",caption:"CITY ADVENTURE · WALKING MAP"},
    es:{theme:"Cambiar tema claro u oscuro",detail:"Ampliar mapa",whole:"Toda la ciudad",tip:"Amplía el mapa para leer las calles",tipZoom:"Desliza el mapa para explorar la ciudad",kicker:"EXPLORA · ORIÉNTATE · COMUNICA",caption:"AVENTURA URBANA · MAPA A PIE"},
    de:{theme:"Hell- oder Dunkelmodus wechseln",detail:"Kartendetails",whole:"Gesamte Stadt",tip:"Vergrößere die Karte, um Straßennamen zu lesen",tipZoom:"Wische über die Karte, um die Stadt zu erkunden",kicker:"ERKUNDEN · ORIENTIEREN · SPRECHEN",caption:"STADTABENTEUER · FUSSGÄNGERKARTE"},
    fr:{theme:"Changer de thème clair ou sombre",detail:"Détail du plan",whole:"Vue générale",tip:"Agrandissez le plan pour lire les noms de rues",tipZoom:"Faites glisser le plan pour explorer la ville",kicker:"EXPLORER · S'ORIENTER · ÉCHANGER",caption:"AVENTURE URBAINE · PLAN PIÉTON"}
  };
  let state=makeSession("en","B1","solo");
  let flash=null;
  function makeSession(language,level,mode){
    return {language,level,mode:mode||"solo",station:1,done:new Set(),
      explore:{round:0,misses:0},route:G.routeStart(),dialogue:G.dialogueStart(),
      guided:G.guidedStart(),transit:{done:false,tries:0,selection:{}},
      repair:{phase:0,done:false,tries:0},detour:G.routeStart(),quest:G.questStart()};
  }
  const pack=()=>C.pack(state.language),profile=()=>C.profile(state.language,state.level),ui=()=>pack().ui;
  function el(tag,parent,cls,content){
    const n=document.createElement(tag);if(cls)n.className=cls;
    if(content!==undefined&&content!==null)n.textContent=String(content);
    if(parent)parent.appendChild(n);
    return n;
  }
  function svg(tag,attrs){
    const n=document.createElementNS(NS,tag);
    Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,String(v)));
    return n;
  }
  function btn(parent,title,onClick,cls){
    const b=el("button",parent,"btn"+(cls?" "+cls:""),title);
    b.type="button";b.addEventListener("click",onClick);return b;
  }
  function para(parent,content,cls){return el("p",parent,cls||"",content);}
  function note(parent,title,body){
    const div=el("div",parent,"f2-objective");
    el("strong",div,"",title);para(div,body);return div;
  }
  function status(parent,message,tone){
    const div=el("div",parent,"f2-status",message||ui().ready);
    div.setAttribute("role","status");div.setAttribute("aria-live","polite");
    if(tone)div.dataset.tone=tone;
    return div;
  }
  function actions(parent){return el("div",parent,"f2-actions");}
  function choices(parent,items,onChoose){
    const holder=el("div",parent,"f2-choice-list");
    items.forEach((choice,index)=>{
      btn(holder,choice.label,()=>onChoose(choice.value,index));
    });
  }
  function help(parent){
    const details=el("details",parent,"f2-help");
    el("summary",details,"",ui().help);
    para(details,profile().support);
    return details;
  }
  function objective(index){
    const title=pack().stations[index-1][0],desc=pack().stations[index-1][1],goal=profile()[stationKeys[index-1]];
    const head=el("div",panel,"f2-card-head");
    el("span",head,"f2-kicker",ui().station+" "+String(index).padStart(2,"0")+" / 08 · "+pack().native+" "+state.level);
    el("h2",head,"",icons[index-1]+" "+title);
    para(head,desc);
    note(panel,"🎯 "+ui().mission,goal);
    if(state.mode==="pair"){
      const div=el("div",panel,"f2-pair");
      el("strong",div,"","👥 "+ui().roleMode);
      para(div,pack().pair[stationKeys[index-1]]||pack().pair.general);
    }
  }
  function speaking(parent,model){
    const tip=el("div",parent,"f2-help");
    el("strong",tip,"", "🗣️ "+ui().speaking);
    para(tip,profile().speaking);
    para(tip,ui().selfcheck,"f2-small");
    const example=el("p",tip,"f2-small");example.hidden=true;
    btn(tip,ui().reveal,()=>{example.textContent=model||profile().model;example.hidden=false;});
    return tip;
  }
  function complete(number,extra,model){
    state.done.add(number);
    updateProgress();
    const div=el("div",panel,"f2-finish");
    el("strong",div,"","✓ "+ui().finish);
    para(div,extra||ui().feedbackGood);
    speaking(panel,model);
    const row=actions(panel);
    if(number<8)btn(row,ui().next+" →",()=>selectStation(number+1),"primary");
    btn(row,"↺ "+ui().restartStation,resetStation);
  }
  function screen(){
    panel.hidden=false;panel.replaceChildren();
    objective(state.station);
    switch(state.station){
      case 1:return renderExplore();
      case 2:return renderRoute();
      case 3:return renderDialogue();
      case 4:return renderGuided();
      case 5:return renderTransport();
      case 6:return renderRepair();
      case 7:return renderDetour();
      case 8:return renderQuest();
      default:throw Error("Unknown station");
    }
  }
  function renderExplore(){
    const game=state.explore,total=G.answerCount(state.level);
    el("h3",panel,"","🗺️ "+ui().vocabulary);
    const grid=el("div",panel,"f2-landmarks");
    F.places.forEach(place=>{
      const div=el("div",grid,"f2-landmark");
      el("span",div,"",place.icon);
      el("span",div,"",pack().places[place.id]);
    });
    if(game.round>=total)return complete(1,profile().explore,profile().model);
    el("div",panel,"f2-progress-dots");
    para(panel,ui().step+" "+(game.round+1)+" / "+total,"f2-small");
    const question=F.explore[game.round];
    para(panel,pack().clues[game.round],"f2-prompt");
    const ids=question.choices.slice();
    if(G.optionsCount(state.level)===2){
      const wrong=ids.find(x=>x!==question.correct);
      ids.splice(0,ids.length,question.correct,wrong);
    }
    choices(panel,ids.map(id=>({value:id,label:(F.findPlace(id)?.icon||"📍")+" "+pack().places[id]})),id=>{
      const verdict=F.answerExplore(game.round,id);
      if(verdict.correct){game.round++;flash={text:ui().correct,tone:"success"};screen();}
      else{game.misses++;flash={text:ui().notQuite,tone:"warning"};screen();}
    });
    status(panel,flash?.text||ui().choose,flash?.tone);
    help(panel);
  }
  function pointName(p){
    const names=[
      {node:E.start,name:ui().start},{node:E.goal,name:ui().museum},
      {node:{c:2,r:2},name:ui().square},{node:{c:4,r:2},name:ui().library}
    ];
    return names.find(x=>E.same(x.node,p))?.name||ui().city;
  }
  function controls(parent,move){
    const pad=el("div",parent,"f2-controls");
    pad.setAttribute("role","group");pad.setAttribute("aria-label",ui().compass);
    const labels=[["north","↑"],["west","←"],["south","↓"],["east","→"]];
    for(const [direction,arrow] of labels){
      const b=btn(pad,arrow+" "+ui()[direction],()=>move(direction),direction);
      const n=activePoint();
      b.disabled=!n||!E.isNode(F.nextFromDirection(n,direction))||isMovementLocked();
      b.setAttribute("aria-label",ui()[direction]+" · "+ui().compass);
    }
  }
  function renderRoute(){
    const game=state.route,c=G.config(state.level);
    if(game.done)return complete(2,ui().routeCompleted,G.routeModel(pack(),game.route));
    const target=ui()[state.level==="A1"?"square":"museum"];
    el("h3",panel,"",ui().from+" "+ui().start+" → "+target);
    para(panel,ui().goal+": "+target,"f2-prompt");
    if(c.via.length)note(panel,ui().via,c.via.map(pointName).join(", "));
    if(c.blocked)note(panel,"🚧 "+ui().closed,ui().wrongRoad);
    para(panel,ui().step+": "+(game.route.length-1)+" · "+ui().remaining+": "+E.distance(game.route.at(-1),c.target),"f2-small");
    status(panel,flash?.text||ui().guide,flash?.tone);
    controls(panel,dir=>onMove(F.nextFromDirection(activePoint(),dir)));
    const row=actions(panel);
    btn(row,"↶ "+ui().undo,()=>{
      const prev=game.route.at(-2);if(prev)onMove(prev);
    });
    btn(row,"↺ "+ui().restartStation,resetStation);
    help(panel);
  }
  function renderDialogue(){
    const game=state.dialogue,d=pack().dialogue,p=profile();
    if(game.done)return complete(3,d.final,p.dialogueAnswer+" "+d.distance+" "+d.goodbye);
    const scenes={start:d.opening,clarify:d.clarify,wrong:d.mistake,distance:d.followup};
    el("h3",panel,"","💬 "+ui().narrator);
    para(el("div",panel,"f2-dialogue-bubble"),scenes[game.stage]);
    const options={
      start:[{value:"help",label:p.dialogueAnswer},{value:"vague",label:d.vague},{value:"wrong",label:d.wrong}],
      clarify:[{value:"help",label:p.dialogueAnswer},{value:"vague",label:d.vague}],
      wrong:[{value:"repair",label:d.fix+" "+p.dialogueAnswer},{value:"insist",label:d.badFix}],
      distance:[{value:"distance",label:d.distance},{value:"nohelp",label:d.badDistance}]
    };
    choices(panel,options[game.stage],id=>{
      const r=G.dialogueChoose(game,id);
      if(!r.accepted)return;
      state.dialogue=r.state;
      flash={text:r.kind==="retry"?d.unclear:d.good,tone:r.kind==="retry"?"warning":"success"};
      screen();
    });
    status(panel,flash?.text||ui().yourTurn,flash?.tone);
    help(panel);
    const row=actions(panel);btn(row,"↺ "+ui().restartScene,resetStation);
  }
  function renderGuided(){
    const game=state.guided,plan=G.guidedPaths[state.level];
    if(game.done)return complete(4,ui().arrived,G.routeModel(pack(),game.route));
    const dots=el("div",panel,"f2-progress-dots");
    plan.forEach((dir,i)=>el("span",dots,"f2-dot"+(game.step>i?" done":game.step===i?" current":""),String(i+1)));
    el("h3",panel,"",ui().step+" "+(game.step+1)+"/"+plan.length);
    para(panel,G.instruction(pack(),state.level,game.step),"f2-prompt");
    status(panel,flash?.text||ui().guide,flash?.tone);
    controls(panel,dir=>onMove(F.nextFromDirection(activePoint(),dir)));
    const row=actions(panel);
    btn(row,ui().showHint,()=>{flash={text:profile().support,tone:"warning"};screen();});
    btn(row,"↺ "+ui().restartStation,resetStation);
  }
  function renderTransport(){
    const game=state.transit;
    if(game.done)return complete(5,pack().travel.why,pack().travel.why+" "+profile().transit);
    const travel=pack().travel;
    const ask=state.level==="A1"?travel.opening:state.level==="A2"?travel.before:
      ["B1","B2"].includes(state.level)?travel.before:state.level==="C1"?travel.access:travel.complex;
    note(panel,"🚌 "+ui().plan,ask);
    const table=el("table",panel,"f2-transit-table"),thead=el("thead",table),theadRow=el("tr",thead);
    [ui().line,ui().departure,ui().stop,ui().arrival,ui().accessible].forEach(label=>el("th",theadRow,"",label));
    const body=el("tbody",table);
    F.transport.lines.forEach(line=>{
      const row=el("tr",body);
      [line.line,line.depart,travel["line"+line.line],line.arrival,line.line==="24"?"✓":"—"].forEach(val=>el("td",row,"",val));
    });
    const required=G.requiredFields(state.level),wrap=el("div",panel,"f2-select-group");
    const selected={};
    const items=[
      {key:"line",choices:F.transport.options.lines.map(x=>({value:x,label:x})),label:ui().line},
      {key:"depart",choices:F.transport.options.departures.map(x=>({value:x,label:x})),label:ui().departure},
      {key:"stop",choices:F.transport.options.stops.map((x,i)=>({
        value:x,label:[travel.line7,travel.line12,travel.line24][i]
      })),label:ui().stop}
    ];
    items.filter(x=>required.includes(x.key)).forEach(item=>{
      const field=el("label",wrap,"",item.label);
      const select=el("select",field);select.setAttribute("aria-label",item.label);
      const placeholder=el("option",select,"",ui().select);placeholder.value="";
      item.choices.forEach(c=>{const option=el("option",select,"",c.label);option.value=c.value;});
      select.value=game.selection[item.key]||"";
      select.addEventListener("change",()=>{game.selection[item.key]=select.value;});
      selected[item.key]=select;
    });
    status(panel,flash?.text||ui().choose,flash?.tone);
    const row=actions(panel);
    btn(row,ui().check,()=>{
      const input=Object.fromEntries(Object.entries(selected).map(([key,select])=>[key,select.value]));
      const verdict=G.checkTransport(input,state.level);
      game.tries++;
      if(verdict.correct){game.done=true;flash={text:ui().correct,tone:"success"};}
      else{
        const map={missing:travel.missing,line:travel.lineWrong,depart:travel.timeWrong,stop:travel.stopWrong};
        flash={text:map[verdict.kind]||ui().feedbackRetry,tone:"warning"};
      }
      screen();
    },"primary");
    help(panel);
  }
  function renderRepair(){
    const game=state.repair,r=pack().repair;
    if(game.done)return complete(6,r.repairWhy,r.polite);
    note(panel,"⚠️ "+ui().directions,r.incorrect);
    el("h3",panel,"",ui().step+" "+(game.phase+1)+" / 2");
    para(panel,game.phase===0?profile().repair:ui().feedbackRetry,"f2-prompt");
    const list=game.phase===0?r.identify:r.fixes;
    choices(panel,list.map((label,i)=>({label,value:i})),index=>{
      game.tries++;
      const ok=index===(game.phase===0?1:0);
      if(ok){game.phase++;if(game.phase===2)game.done=true;}
      flash={text:ok?ui().correct:r.notYet,tone:ok?"success":"warning"};
      screen();
    });
    status(panel,flash?.text||ui().choose,flash?.tone);
    help(panel);
  }
  function renderDetour(){
    const game=state.detour,c=G.config(state.level);
    if(game.done)return complete(7,profile().detour,G.routeModel(pack(),game.route));
    note(panel,"🚧 "+ui().closed,ui().wrongRoad);
    if(c.via.length)note(panel,ui().via,c.via.map(pointName).join(", "));
    para(panel,ui().from+" "+ui().start+" → "+ui().museum,"f2-prompt");
    para(panel,ui().step+": "+(game.route.length-1),"f2-small");
    status(panel,flash?.text||ui().guide,flash?.tone);
    controls(panel,dir=>onMove(F.nextFromDirection(activePoint(),dir)));
    const row=actions(panel);
    btn(row,"↶ "+ui().undo,()=>{const prev=game.route.at(-2);if(prev)onMove(prev);});
    btn(row,"↺ "+ui().restartStation,resetStation);
    help(panel);
  }
  function renderQuest(){
    const game=state.quest,list=G.questCheckpoints(state.level);
    if(game.done)return complete(8,profile().quest,profile().model);
    const dots=el("div",panel,"f2-progress-dots");
    list.forEach((x,i)=>el("span",dots,"f2-dot"+(i<game.stage?" done":i===game.stage?" current":""),String(i+1)));
    const cp=list[game.stage],name=pack().places[cp.id];
    el("h3",panel,"",ui().checkpoint+" "+(game.stage+1)+"/"+list.length+" · "+name);
    if(game.awaitingSpeech){
      note(panel,"🗣️ "+ui().speaking,profile().quest+" "+profile().speaking);
      const example=G.routeModel(pack(),game.leg);
      speaking(panel,example);
      const row=actions(panel);
      btn(row,ui().selfdone+" →",()=>{
        const result=G.questSpeak(state.quest,state.level);
        if(result.accepted){state.quest=result.state;flash={text:ui().correct,tone:"success"};screen();renderMap();}
      },"primary");
      return;
    }
    para(panel,ui().from+" "+pointName(game.leg[0])+" → "+name,"f2-prompt");
    status(panel,flash?.text||ui().guide,flash?.tone);
    controls(panel,dir=>onMove(F.nextFromDirection(activePoint(),dir)));
    const row=actions(panel);
    btn(row,"↶ "+ui().undo,()=>{const prev=game.leg.at(-2);if(prev)onMove(prev);});
    btn(row,"↺ "+ui().restartStation,resetStation);
    help(panel);
  }
  function activePath(){
    switch(state.station){
      case 2:return state.route.route;
      case 4:return state.guided.route;
      case 7:return state.detour.route;
      case 8:return state.quest.route;
      default:return null;
    }
  }
  function activePoint(){
    const path=activePath();return path?.[path.length-1]||null;
  }
  function isMovementLocked(){
    if(state.station===2)return state.route.done;
    if(state.station===4)return state.guided.done;
    if(state.station===7)return state.detour.done;
    if(state.station===8)return state.quest.done||state.quest.awaitingSpeech;
    return true;
  }
  function onMove(next){
    let outcome;
    switch(state.station){
      case 2:outcome=G.moveRoute(state.route,next,state.level,false);state.route=outcome.state;break;
      case 4:outcome=G.guidedMove(state.guided,next,state.level);state.guided=outcome.state;break;
      case 7:outcome=G.moveRoute(state.detour,next,state.level,true);state.detour=outcome.state;break;
      case 8:outcome=G.questMove(state.quest,next,state.level);state.quest=outcome.state;break;
      default:return;
    }
    if(outcome.kind==="closed")flash={text:ui().wrongRoad,tone:"warning"};
    else if(outcome.kind==="speak")flash={text:ui().selfcheck,tone:"warning"};
    else if(outcome.kind==="missing-via")flash={text:ui().via+" · "+ui().feedbackRetry,tone:"warning"};
    else if(!outcome.accepted)flash={text:ui().feedbackRetry,tone:"warning"};
    else flash={text:ui().correct,tone:"success"};
    screen();renderMap();
  }
  const layer=svg("g",{id:"f2MapLayer","class":"f2-map-layer","pointer-events":"none"}),
    trail=svg("polyline",{id:"f2MapRoute","class":"f2-map-route",points:""}),
    marker=svg("circle",{id:"f2MapMarker","class":"f2-map-marker",r:16,cx:168,cy:580}),
    blocked=svg("g",{id:"f2ClosedRoad"});
  layer.append(trail,marker,blocked);map.appendChild(layer);
  const quick=el("div",null,"f2-quick");quick.id="f2Quick";quick.hidden=true;
  quick.setAttribute("aria-label","Quick map movement controls");
  const quickTitle=el("strong",quick),quickCaption=el("span",quick,"f2-quick-caption"),
    quickPad=el("div",quick,"f2-quick-pad");
  viewport.insertAdjacentElement("afterend",quick);
  function updateQuick(){
    const path=activePath(),current=activePoint(),isMobileAction=!!path;
    quick.hidden=!isMobileAction;
    if(!isMobileAction)return;
    const cp=state.station===8?G.questCheckpoints(state.level)[state.quest.stage]:null;
    quickTitle.textContent=state.station===4&&!state.guided.done?
      G.instruction(pack(),state.level,state.guided.step):cp?pack().places[cp.id]:
      state.station===2?profile().route:state.station===7?ui().wrongRoad:ui().arrived;
    quickCaption.textContent=flash?.text||ui().compass;
    quickPad.replaceChildren();
    for(const [dir,arrow] of [["north","↑"],["west","←"],["south","↓"],["east","→"]]){
      const button=el("button",quickPad,"f2-quick-"+dir,arrow);
      button.type="button";
      button.setAttribute("aria-label",ui()[dir]+" · "+ui().compass);
      button.disabled=isMovementLocked()||!current||!E.isNode(F.nextFromDirection(current,dir));
      button.addEventListener("click",()=>onMove(F.nextFromDirection(activePoint(),dir)));
    }
  }
  function showClosure(){
    blocked.replaceChildren();
    const need=state.station===7||state.level==="C2"&&[2,8].includes(state.station);
    if(!need)return;
    const p=E.position(F.closure.a),q=E.position(F.closure.b);
    blocked.appendChild(svg("line",{x1:p.x,y1:p.y,x2:q.x,y2:q.y,class:"f2-road-close"}));
    // The closure callout stays inside the road corridor, avoiding house labels.
    const mid=(p.x+q.x)/2,label=ui().closed;
    const width=Math.max(100,Math.min(142,label.length*7+18));
    blocked.appendChild(svg("rect",{x:mid-width/2,y:p.y-15,width,height:27,rx:9,
      fill:"#a82e3c",stroke:"#fff5ee","stroke-width":1.7}));
    const t=svg("text",{x:mid,y:p.y+3,"font-family":"system-ui,sans-serif","font-size":11.4,"font-weight":900,"text-anchor":"middle",fill:"#ffffff"});
    t.textContent=label;blocked.appendChild(t);
  }
  function followMap(){
    if(!viewport.classList.contains("detail"))return;
    const point=activePoint();if(!point)return;
    const p=E.position(point),scale=map.getBoundingClientRect().width/1196;
    const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    viewport.scrollTo({left:Math.max(0,p.x*scale-viewport.clientWidth*.4),
      top:Math.max(0,p.y*scale-viewport.clientHeight*.55),behavior:reduce?"auto":"smooth"});
  }
  function renderMap(){
    const path=activePath();
    layer.style.display=path?"":"none";
    if(path){
      trail.setAttribute("points",path.map(p=>{const q=E.position(p);return q.x+","+q.y;}).join(" "));
      const here=E.position(path.at(-1));marker.setAttribute("cx",here.x);marker.setAttribute("cy",here.y);
      $("mapLocation").textContent=pointName(path.at(-1));
      $("mapProgress").textContent=ui().step+": "+(path.length-1)+" · "+state.level;
      followMap();
    }else{
      $("mapLocation").textContent=ui().city;
      $("mapProgress").textContent=pack().stations[state.station-1][0]+" · "+state.level;
    }
    showClosure();updateQuick();
  }
  function translateCity(){
    const p=pack();
    map.querySelectorAll("[data-landmark-label]").forEach(group=>{
      const original=group.dataset.landmarkLabel;
      const translated=p.mapLabels[original]||original;
      const label=group.querySelector("text");
      if(!label)return;
      label.textContent=translated;
      label.setAttribute("font-size",translated.length>16?"9":translated.length>12?"10.7":"12.6");
      const cx=Number(label.getAttribute("x")),width=Math.min(140,Math.max(66,label.getComputedTextLength()+20));
      const rects=group.querySelectorAll("rect");
      rects.forEach((r,i)=>{r.setAttribute("width",width);
        r.setAttribute("x",cx-width/2+(i===0?2:0));});
      group.setAttribute("aria-label",translated);
    });
    const roads={
      en:{"STATION ROAD":"STATION ROAD","MARKET AVENUE":"MARKET AVENUE","RIVERSIDE":"RIVERSIDE"},
      es:{"STATION ROAD":"CALLE DE LA ESTACIÓN","MARKET AVENUE":"AVENIDA DEL MERCADO","RIVERSIDE":"RIBERA"},
      de:{"STATION ROAD":"BAHNHOFSTRASSE","MARKET AVENUE":"MARKTALLEE","RIVERSIDE":"FLUSSUFER"},
      fr:{"STATION ROAD":"RUE DE LA GARE","MARKET AVENUE":"AVENUE DU MARCHÉ","RIVERSIDE":"BERGES"}
    };
    map.querySelectorAll("text").forEach(t=>{
      const initial=t.dataset.f2Original||t.textContent;
      if(!t.dataset.f2Original)t.dataset.f2Original=initial;
      if(roads[state.language][initial])t.textContent=roads[state.language][initial];
      if(initial==="CITY ADVENTURE · WALKING MAP")t.textContent=chromeCopy[state.language].caption;
    });
  }
  function applyChromeLabels(){
    const l=chromeCopy[state.language],detail=viewport.classList.contains("detail");
    $("themeBtn").textContent=document.documentElement.dataset.theme==="dark"?"☀":"☾";
    $("themeBtn").setAttribute("aria-label",l.theme);
    $("mapZoom").textContent=detail?"− "+l.whole:"＋ "+l.detail;
    $("mapTouchTip").textContent=detail?l.tipZoom:l.tip;
    document.querySelector(".hero .kicker").textContent=l.kicker;
  }
  function applyLanguageUI(){
    const u=ui(),p=pack(),prof=profile();
    document.documentElement.lang=p.locale;
    document.title="City Quest F2 · "+p.native+" "+state.level+" · Language Skills Hub";
    $("f2LanguageLabel").textContent=u.language;
    $("f2LevelLabel").textContent=u.level+" CEFR";
    $("f2Profile").textContent=state.level+" · "+prof.focus;
    $("f2HeroLanguage").textContent=flags[state.language]+" "+p.native;
    $("f2HeroLevel").textContent=state.level;
    $("f2HeroText").textContent=p.stations[0][1]+" "+u.objective;
    document.querySelector(".hero h1").textContent=p.stations[7][0];
    document.querySelector(".f1-mode>span").textContent=u.mode;
    $("f1Solo").textContent="👤 "+u.solo;
    $("f1Pair").textContent="👥 "+u.pair;
    $("resetBtn").textContent="↺ "+u.restartStation;
    $("mapReset").textContent="↺ "+u.restart;
    applyChromeLabels();
    document.querySelector(".map-head .section-label").textContent=u.city.toUpperCase();
    document.querySelector(".map-head h2").textContent=u.map;
    const mapFooter=document.querySelector(".map-footer");
    if(mapFooter)mapFooter.textContent="🧭 "+u.route+" · 🚉 "+u.start+" · 🏛️ "+u.museum;
    document.querySelector(".f1-progress small").textContent=u.offline+" "+u.noSpeechGrade;
    $("f2GuideTitle").textContent=u.training+" · "+state.level;
    $("f2GuideText").textContent=prof.focus+". "+prof.stretch+" "+u.offline+" "+u.noSpeechGrade;
    translateCity();
  }
  function updateProgress(){
    const u=ui(),nav=$("f1Stations");nav.replaceChildren();
    $("f1ProgressText").textContent=state.done.size+" / 8 · "+u.completed;
    $("f1ProgressTrack").setAttribute("aria-valuenow",String(state.done.size));
    $("f1ProgressFill").style.width=state.done.size*12.5+"%";
    F.stations.forEach((st,i)=>{
      const button=el("button",nav,"f1-station");
      button.type="button";
      button.setAttribute("aria-label",u.station+" "+st.id+": "+pack().stations[i][0]);
      if(state.station===st.id)button.setAttribute("aria-current","step");
      const ic=el("span",button,"f1-station-icon",icons[i]);ic.setAttribute("aria-hidden","true");
      const cap=el("span",button,"f1-station-caption");
      el("small",cap,"",u.station+" "+String(st.id).padStart(2,"0"));
      el("strong",cap,"",pack().stations[i][0]);
      if(state.done.has(st.id))el("span",button,"f1-station-complete","✓");
      button.addEventListener("click",()=>selectStation(st.id));
    });
  }
  function selectStation(n){
    if(!Number.isInteger(n)||n<1||n>8)return;
    state.station=n;flash=null;
    updateProgress();screen();renderMap();
  }
  function resetStation(){
    const n=state.station;
    if(n===1)state.explore={round:0,misses:0};
    if(n===2)state.route=G.routeStart();
    if(n===3)state.dialogue=G.dialogueStart();
    if(n===4)state.guided=G.guidedStart();
    if(n===5)state.transit={done:false,tries:0,selection:{}};
    if(n===6)state.repair={phase:0,done:false,tries:0};
    if(n===7)state.detour=G.routeStart();
    if(n===8)state.quest=G.questStart();
    state.done.delete(n);flash=null;
    updateProgress();screen();renderMap();
  }
  function resetSession(lang,level){
    const mode=state.mode;
    state=makeSession(lang,level,mode);flash=null;
    applyLanguageUI();updateProgress();screen();renderMap();
  }
  function setMode(mode){
    if(!["solo","pair"].includes(mode))return;
    state.mode=mode;
    for(const kind of ["solo","pair"]){
      const b=$(kind==="solo"?"f1Solo":"f1Pair");
      b.setAttribute("aria-pressed",String(kind===mode));
      b.classList.toggle("active",kind===mode);
    }
    screen();renderMap();
  }
  // F0's map listeners stay active, but its legacy route mode is disabled.
  // F2 explicitly handles the same crossroads through a separate verified engine.
  $("dialogueTab").click();
  $("routeView").hidden=true;$("dialogueView").hidden=true;
  // Capture reset clicks so the F0 legacy handler cannot re-enable its route mode.
  for(const id of ["resetBtn","mapReset"]){
    $(id).addEventListener("click",e=>{e.stopImmediatePropagation();e.preventDefault();resetStation();},true);
  }
  $("f2Language").addEventListener("change",e=>resetSession(e.target.value,state.level));
  $("f2Level").addEventListener("change",e=>resetSession(state.language,e.target.value));
  $("f1Solo").addEventListener("click",()=>setMode("solo"));
  $("f1Pair").addEventListener("click",()=>setMode("pair"));
  $("themeBtn").addEventListener("click",applyChromeLabels);
  $("mapZoom").addEventListener("click",applyChromeLabels);
  map.querySelectorAll("[data-node]").forEach(node=>{
    const [c,r]=node.dataset.node.split("-").map(Number);
    node.addEventListener("click",()=>{if(activePath())onMove({c,r});});
    node.addEventListener("keydown",e=>{
      if((e.key==="Enter"||e.key===" ")&&activePath()){e.preventDefault();onMove({c,r});}
    });
  });
  viewport.addEventListener("keydown",e=>{
    if(e.target!==viewport||!activePath())return;
    const direction={ArrowUp:"north",ArrowDown:"south",ArrowLeft:"west",ArrowRight:"east"}[e.key];
    if(direction){e.preventDefault();onMove(F.nextFromDirection(activePoint(),direction));}
  });
  $("f2Language").value=state.language;
  $("f2Level").value=state.level;
  applyLanguageUI();updateProgress();screen();renderMap();
})();
