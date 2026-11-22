/* City Quest F2: fully local client-side user interface for 4 languages x 6 CEFR levels.
 * Reuses verified F0 map artwork and F1 route/transit engines; no requests.
 */
(() => {
  "use strict";
  const C=window.CityQuestF2Content,G=window.CityQuestF2Engine,F=window.CityQuestF1Engine,E=window.CityQuestEngine,MG=window.RivertonMetroGame,LC=window.RivertonMetroLanguage;
  if(!C||!G||!F||!E)throw Error("City Quest F2 modules did not load in dependency order.");
  const $=id=>document.getElementById(id);
  const panel=$("f1Panel"),map=$("cityMap"),viewport=$("mapViewport");
  const cityLayout=document.querySelector(".layout"),citySidebar=panel.parentElement;
  const metroLab=$("metroLab"),metroSidebar=metroLab.querySelector(".metro-side");
  const metroNetworkCard=metroLab.querySelector(".metro-network-card"),metroPhoneQuery=window.matchMedia("(max-width:740px)");
  const NS="http://www.w3.org/2000/svg";
  const icons=["🗺️","🧭","💬","👣","🚌","↩️","🚧","🏆"];
  const stationKeys=["explore","route","dialogue","guided","transit","repair","detour","quest"];
  const chromeCopy={
    en:{theme:"Toggle light/dark theme",detail:"Map detail",whole:"Whole city",tip:"Select Map detail to zoom in on street names",tipZoom:"Swipe across the city map to explore",kicker:"EXPLORE · NAVIGATE · COMMUNICATE",caption:"CITY ADVENTURE · WALKING MAP",compact:"Make direction pad smaller",expand:"Show full directions"},
    es:{theme:"Cambiar tema claro u oscuro",detail:"Ampliar mapa",whole:"Toda la ciudad",tip:"Amplía el mapa para leer las calles",tipZoom:"Desliza el mapa para explorar la ciudad",kicker:"EXPLORA · ORIÉNTATE · COMUNICA",caption:"AVENTURA URBANA · MAPA A PIE",compact:"Reducir controles",expand:"Mostrar indicaciones completas"},
    de:{theme:"Hell- oder Dunkelmodus wechseln",detail:"Kartendetails",whole:"Gesamte Stadt",tip:"Vergrößere die Karte, um Straßennamen zu lesen",tipZoom:"Wische über die Karte, um die Stadt zu erkunden",kicker:"ERKUNDEN · ORIENTIEREN · SPRECHEN",caption:"STADTABENTEUER · FUSSGÄNGERKARTE",compact:"Steuerfeld verkleinern",expand:"Alle Richtungen anzeigen"},
    fr:{theme:"Changer de thème clair ou sombre",detail:"Détail du plan",whole:"Vue générale",tip:"Agrandissez le plan pour lire les noms de rues",tipZoom:"Faites glisser le plan pour explorer la ville",kicker:"EXPLORER · S'ORIENTER · ÉCHANGER",caption:"AVENTURE URBAINE · PLAN PIÉTON",compact:"Réduire les commandes",expand:"Afficher toutes les directions"}
  };
  // F3D: identical, authored pedagogical headings for the city and metro
  // modes. These only describe the lesson flow; they never modify scoring.
  const lessonCopy={
    en:{city:"CITY · RIVERTON",metro:"METRO · RIVERTON",
      read:"Read",practise:"Practise",reflect:"Reflect",
      phases:"Three learning phases",mission:"Mission",mode:"Mode",
      note:"Explain your choices aloud. Speaking is self-checked, never automatically graded.",
      metroReset:"Switching City/Metro restarts missions 05–08; missions 01–04 stay."},
    es:{city:"CIUDAD · RIVERTON",metro:"METRO · RIVERTON",
      read:"Lee",practise:"Practica",reflect:"Reflexiona",
      phases:"Tres fases de aprendizaje",mission:"Misión",mode:"Modalidad",
      note:"Explica tus decisiones en voz alta. La expresión oral se autoevalúa, no recibe una nota automática.",
      metroReset:"Cambiar entre ciudad y metro reinicia las misiones 05–08; se conservan las misiones 01–04."},
    de:{city:"STADT · RIVERTON",metro:"U-BAHN · RIVERTON",
      read:"Lesen",practise:"Üben",reflect:"Reflektieren",
      phases:"Drei Lernphasen",mission:"Aufgabe",mode:"Modus",
      note:"Begründe deine Entscheidungen mündlich. Das Sprechen wird selbst eingeschätzt und nicht automatisch bewertet.",
      metroReset:"Beim Wechsel zwischen Stadt und U-Bahn starten die Aufgaben 05–08 neu; 01–04 bleiben erhalten."},
    fr:{city:"VILLE · RIVERTON",metro:"MÉTRO · RIVERTON",
      read:"Lire",practise:"S'entraîner",reflect:"Faire le bilan",
      phases:"Trois étapes d'apprentissage",mission:"Mission",mode:"Mode",
      note:"Expliquez vos choix à l'oral. Votre prise de parole fait l'objet d'une autoévaluation, jamais d'une note automatique.",
      metroReset:"Passer de la ville au métro réinitialise les missions 05–08 ; les missions 01–04 sont conservées."}
  };
  const lesson=()=>lessonCopy[state.language]||lessonCopy.en;
  let metroEnabled=false;
  let state=makeSession("en","B1","solo");
  let flash=null;
  function makeSession(language,level,mode){
    return {language,level,mode:mode||"solo",station:1,done:new Set(),
      explore:{round:0,misses:0},route:G.routeStart(),dialogue:G.dialogueStart(),
      guided:G.guidedStart(),metro:MG?Object.fromEntries([5,6,7,8].map(n=>[n,MG.start(n)])):null,
      transit:{done:false,tries:0,selection:{}},
      repair:{phase:0,done:false,tries:0},detour:G.routeStart(),quest:G.questStart()};
  }
  const pack=()=>C.pack(state.language),profile=()=>C.profile(state.language,state.level),ui=()=>pack().ui;
  const metroAvailable=()=>!!MG&&!!LC&&LC.languages.includes(state.language)&&LC.levels.includes(state.level);
  const metroPilot=()=>metroEnabled&&metroAvailable()&&state.station>=5&&state.station<=8;
  const metroCopy=()=>LC.pack(state.language,state.level,state.station);
  const metroState=()=>metroPilot()?state.metro[state.station]:null;
  const metroCityPhase=()=>metroPilot()&&state.station===8&&(
    ["walk-to-entrance","enter","walk-to-museum"].includes(metroState().phase)||
    metroState().phase==="checkpoint"&&metroState().resumePhase==="enter"||
    ["speech","complete"].includes(metroState().phase)&&MG.same(metroState().surface,MG.museum));
  const metroCityWalk=()=>metroPilot()&&state.station===8&&["walk-to-entrance","walk-to-museum"].includes(metroState().phase);
  const metroScene=()=>metroPilot()&&!metroCityPhase();
  // Public read-only bridge for the existing F2.1B metro illustration.
  window.CityQuestF2MetroBridge=Object.freeze({pilotActive:metroPilot,metroVisible:metroScene,current:metroState});
  function updateMetroPresentation(){
    const visible=metroScene();
    cityLayout.hidden=visible;
    metroLab.dataset.mode=visible?"game":"preview";
    if(visible){
      const target=metroPhoneQuery.matches?metroNetworkCard:metroSidebar;
      if(panel.parentElement!==target){
        if(target===metroNetworkCard)target.insertBefore(panel,$("metroNetworkViewport"));
        else target.insertBefore(panel,target.firstChild);
      }
      metroLab.hidden=false;
    }else{
      if(panel.parentElement!==citySidebar)citySidebar.appendChild(panel);
      metroLab.hidden=metroPilot()||["A1","A2"].includes(state.level);
    }
    if(window.RivertonMetroVisual)window.RivertonMetroVisual.sync(visible?metroState():null);
  }
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
    const alt=metroPilot()?metroCopy():null;
    const title=alt?alt.titleMission:pack().stations[index-1][0],
      desc=alt?alt.kicker+" · "+alt.native+" "+state.level:pack().stations[index-1][1],
      goal=alt?alt.goal:profile()[stationKeys[index-1]];
    const head=el("div",panel,"f2-card-head");
    el("span",head,"f2-kicker",ui().station+" "+String(index).padStart(2,"0")+" / 08 · "+pack().native+" "+state.level);
    el("h2",head,"",(alt&&index===5?"🚇":icons[index-1])+" "+title);
    para(head,desc);
    note(panel,"🎯 "+ui().mission,goal);
    if(state.mode==="pair"){
      const div=el("div",panel,"f2-pair");
      el("strong",div,"","👥 "+ui().roleMode);
      para(div,alt?alt.pair[index]:pack().pair[stationKeys[index-1]]||pack().pair.general);
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
    const taskHadFocus=panel.contains(document.activeElement),isMetro=metroPilot();
    panel.hidden=false;panel.replaceChildren();
    updateMetroPresentation();
    objective(state.station);
    if(isMetro)renderMetroMission();
    else switch(state.station){
      case 1:renderExplore();break;
      case 2:renderRoute();break;
      case 3:renderDialogue();break;
      case 4:renderGuided();break;
      case 5:renderTransport();break;
      case 6:renderRepair();break;
      case 7:renderDetour();break;
      case 8:renderQuest();break;
      default:throw Error("Unknown station");
    }
    // Persist feedback outside a dynamically replaced panel. No recording,
    // network, telemetry, artificial grades or automatic model validation.
    if(flash?.text)$("f3Status").textContent=flash.text;
    updateLessonRail();
    if(taskHadFocus&&!isMetro)window.requestAnimationFrame(()=>{
      if(panel.hidden)return;
      const next=panel.querySelector(
        ".f2-choice-list button:not(:disabled), .f2-actions button:not(:disabled), "+
        ".f2-select-group select:not(:disabled), .f2-help button:not(:disabled)"
      );
      if(next)next.focus({preventScroll:true});
      else{
        const title=panel.querySelector(".f2-card-head h2");
        if(title){title.tabIndex=-1;title.focus({preventScroll:true});}
      }
    });
  }
  // B1 pilot: all metro choices go through the pure deterministic game engine.
  // The live scene stays inside the F2.1B map card, not a second independent controller.
  function metroAction(action){
    const number=state.station,previousScene=metroScene(),previous=state.metro[number];
    const hadTaskFocus=panel.contains(document.activeElement);
    const result=MG.act(previous,action);
    state.metro[number]=result.state;
    // F3B: sound is optional and generated locally only AFTER a real,
    // deterministic engine decision. It never advances the journey.
    const cue=!result.accepted?"error":result.complete?"complete":
      action.type==="READ_NOTICE"?"warning":
      action.type==="BOARD"?"board":
      action.type==="CHANGE_LINE"?"transfer":
      action.type==="NEXT_STOP"&&["transfer","checkpoint"].includes(result.state.phase)?"transfer":
      action.type==="NEXT_STOP"&&result.state.phase==="exit"?"arrival":
      action.type==="NEXT_STOP"?"ride":
      action.type==="EXIT"?"arrival":"advance";
    window.CityQuestF3?.feedback(cue);
    flash={text:LC.feedback(state.language,result,action,
      window.RivertonMetro?.station(result.state.metroStation)?.labelEn),tone:result.accepted?"success":"warning"};
    // Persistent polite status survives rebuilding the mission panel and is
    // announced by assistive technology without an audio or network request.
    $("f3Status").textContent=flash.text;
    if(result.complete)state.done.add(number);
    screen();renderMap();
    // Mission action buttons are recreated with new phases. Return keyboard
    // focus to the NEW valid action; never steal focus from map inspection.
    if(hadTaskFocus)window.requestAnimationFrame(()=>{
      const next=panel.querySelector(".f2-choice-list button:not(:disabled), .f2-actions button:not(:disabled)");
      if(next)next.focus({preventScroll:true});
    });
    window.CityQuestF3?.sceneUpdated();
    if(previousScene!==metroScene()){
      const target=metroScene()?metroLab:cityLayout;
      window.requestAnimationFrame(()=>target.scrollIntoView({behavior:"auto",block:"start"}));
    }
  }
  function renderMetroMission(){
    const game=metroState(),stage=game.phase,n=state.station,c=metroCopy(),
      place=window.RivertonMetro?.station(game.metroStation)?.labelEn||game.metroStation;
    if(game.completed)return complete(n,c.labels.verified,LC.model(state.language,state.level,n));
    el("p",panel,"f2-small",c.native+" · "+state.level+" · "+c.offline+
      " · "+game.speakingDone+" "+c.labels.checkpoint);
    note(panel,"🚇 "+(["walk-to-entrance","walk-to-museum"].includes(stage)?c.enterTitle:c.metroTitle),
      LC.stage(state.language,state.level,n,stage,{station:place}));
    if(stage==="speech"||stage==="checkpoint"){
      note(panel,"🎯 "+c.labels.criteria,c.cefr.task);
      const checklist=el("ul",panel,"metro-selfcheck-criteria");
      c.cefr.criteria.forEach(criterion=>el("li",checklist,"",criterion));
      note(panel,"💡 "+c.labels.support,c.cefr.support);
      const ext=el("details",panel,"metro-language-details");
      el("summary",ext,"",c.labels.stretch);
      para(ext,c.cefr.stretch);
    }
    // The mixed City–Metro mission has two physical layers. While the player
    // walks, report their ACTUAL surface position rather than the underground
    // start/goal stored separately in the metro engine.
    const outdoors=n===8&&metroCityPhase()&&!!game.surface;
    const surfaceName=outdoors&&MG.same(game.surface,MG.portalEnd)?
      window.RivertonMetro.station("museum_quarter").labelEn:
      outdoors?pointName(game.surface):"";
    // Unnamed crossroads remain a numbered step in the player's own route;
    // avoid displaying the confusing duplicate label "Riverton: Riverton".
    const surfacePosition=surfaceName===ui().city?
      ui().city+" · "+ui().step+" "+Math.max(0,game.cityPath.length-1):
      ui().city+": "+surfaceName;
    const positionText=outdoors?surfacePosition:
      c.labels.position+": "+place+" · "+(game.lineId||c.labels.noLine);
    status(panel,outdoors?positionText:(flash?.text||positionText),outdoors?null:flash?.tone);
    if(outdoors&&flash?.text)para(panel,flash.text,"f2-small");
    if(stage==="walk-to-entrance"||stage==="walk-to-museum"){
      para(panel,c.hints.walk,"f2-small");
    }else if(["select-line","select-direction","select-platform"].includes(stage)){
      if(stage==="select-platform"){
        // CQ-F5-004: genuine readable station information BEFORE selecting a
        // platform. Entries come from validated graph fixtures, not from the
        // currently correct answer. One sign is not itself a forced solution.
        const metro=window.RivertonMetro,signs=metro.platformSigns(game.metroStation);
        const board=el("section",panel,"metro-platform-board");
        board.setAttribute("role","group");
        board.setAttribute("aria-label",c.labels.platformBoard+" · "+place);
        el("h3",board,"metro-platform-board-heading","🚉 "+c.labels.platformBoard);
        const signList=el("ol",board,"metro-platform-board-list");
        for(const number of ["1","2","3"]){
          const sign=signs.find(item=>item.platform===number);
          const item=el("li",signList,"metro-platform-board-item");
          el("strong",item,"metro-platform-board-number",c.labels.platform+" "+number);
          const description=sign?
            sign.line+" · "+c.labels.towards+" "+metro.station(sign.directionTerminus).labelEn:
            c.labels.noService;
          el("span",item,"metro-platform-board-sign"+(sign?"":" metro-platform-board-empty"),description);
          if(sign)item.style.setProperty("--platform-line-colour",metro.line(sign.line).color);
        }
      }
      const type=stage==="select-line"?"SELECT_LINE":stage==="select-direction"?"SELECT_DIRECTION":"SELECT_PLATFORM";
      const opts=MG.options(game).map(opt=>stage==="select-platform"?
        {value:opt.value,label:c.labels.platform+" "+opt.value}:opt);
      choices(panel,opts,value=>metroAction({type,value}));
    }else if(stage==="checkpoint"||stage==="speech"){
      const tip=el("div",panel,"f2-help");
      el("strong",tip,"","🗣️ "+c.labels.prompt);
      const example=el("p",tip,"f2-small");example.hidden=true;
      btn(tip,c.labels.model,()=>{example.textContent=LC.model(state.language,state.level,n);example.hidden=false;});
      const row=actions(panel);
      btn(row,c.actions.SELF_CHECK,()=>metroAction({type:"SELF_CHECK"}),"primary");
    }else{
      const actionMap={enter:"ENTER",notice:"READ_NOTICE",board:"BOARD",ride:"NEXT_STOP",transfer:"CHANGE_LINE",exit:"EXIT"};
      if(actionMap[stage]){
        const row=actions(panel),type=actionMap[stage];
        btn(row,c.actions[type],()=>metroAction({type}),"primary");
      }
    }
    const vocab=el("details",panel,"metro-language-details");
    el("summary",vocab,"","📖 "+c.labels.glossary);
    const dl=el("dl",vocab,"metro-glossary");
    c.glossary.forEach(([term,definition])=>{el("dt",dl,"",term);el("dd",dl,"",definition);});
    const controls=actions(panel);
    btn(controls,"↺ "+c.labels.restart,resetStation);
    if(metroScene())para(panel,c.hints.map,"f2-small");
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
    const ordered=G.orderChoices(ids,state.language,state.level,1,game.round);
    choices(panel,ordered.map(id=>({value:id,label:(F.findPlace(id)?.icon||"📍")+" "+pack().places[id]})),id=>{
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
    const row=actions(panel);
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
    choices(panel,G.orderChoices(options[game.stage],state.language,state.level,3,game.stage),id=>{
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
    // A labelled local scroll region keeps all five timetable columns readable
    // at 200% text size without overflowing the whole page on 320px phones.
    const timetable=el("div",panel,"f2-transit-scroll");
    timetable.setAttribute("role","region");
    timetable.setAttribute("tabindex","0");
    timetable.setAttribute("aria-label","🚌 "+ui().plan);
    const table=el("table",timetable,"f2-transit-table"),thead=el("thead",table),theadRow=el("tr",thead);
    const swipeText={en:"Swipe the timetable sideways to view all columns.",es:"Desliza la tabla hacia los lados para ver todas las columnas.",de:"Wische die Tabelle seitlich, um alle Spalten zu sehen.",fr:"Faites défiler le tableau horizontalement pour voir toutes les colonnes."};
    para(panel,swipeText[state.language]||swipeText.en,"f2-transit-scroll-hint");
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
    choices(panel,G.orderChoices(list.map((label,i)=>({label,value:i})),state.language,state.level,6,game.phase),index=>{
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
    const row=actions(panel);
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
    const row=actions(panel);
    btn(row,"↺ "+ui().restartStation,resetStation);
    help(panel);
  }
  function activePath(){
    // Keep the final walking leg and the player's museum location visible
    // through the self-check and the completed-state presentation.
    if(metroPilot())return state.station===8&&metroCityPhase()?metroState().cityPath:null;
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
    if(metroPilot())return !metroCityWalk();
    if(state.station===2)return state.route.done;
    if(state.station===4)return state.guided.done;
    if(state.station===7)return state.detour.done;
    if(state.station===8)return state.quest.done||state.quest.awaitingSpeech;
    return true;
  }
  function onMove(next){
    // Claude F5-016: a visible surface path during a metro checkpoint is NOT
    // permission to run the independent city quest engine behind the scene.
    if(isMovementLocked())return;
    if(metroCityWalk())return metroAction({type:"WALK",node:next});
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
  // One stable, accessible navigation component for ALL map missions.
  // The entire HUD belongs to the map viewport frame, not the lower task panel.
  const mapStage=el("div",null,"f2-map-stage");
  mapStage.id="f2MapStage";
  viewport.parentNode.insertBefore(mapStage,viewport);
  mapStage.appendChild(viewport);
  const quick=el("div",mapStage,"f2-quick");
  quick.id="f2Quick";quick.hidden=true;
  quick.dataset.testid="navigation-hud";
  quick.setAttribute("role","group");
  quick.setAttribute("aria-label",ui().compass);
  const hudTop=el("div",quick,"f2-hud-top");
  const hudLoc=el("span",hudTop,"f2-hud-location");
  const quickTitle=el("strong",hudTop,"f2-hud-instruction");
  const quickCaption=el("span",quick,"f2-quick-caption");
  quickCaption.setAttribute("role","status");
  quickCaption.setAttribute("aria-live","polite");
  quickCaption.setAttribute("aria-atomic","true");
  const quickPad=el("div",quick,"f2-quick-pad");
  quickPad.dataset.testid="hud-dpad";
  quickPad.setAttribute("role","group");
  const hudButtons=Object.create(null);
  for(const [dir,arrow] of [["north","↑"],["west","←"],["south","↓"],["east","→"]]){
    const button=el("button",quickPad,"f2-quick-"+dir,arrow);
    button.type="button";
    button.dataset.direction=dir;
    button.addEventListener("click",()=>dispatchDirection(dir));
    hudButtons[dir]=button;
  }
  const hudTools=el("div",quick,"f2-hud-tools");
  const hudUndo=btn(hudTools,"↶",()=>undoMapStep(),"f2-hud-undo");
  let hudCompact=false;
  const hudSize=btn(hudTools,"▣",()=>{
    hudCompact=!hudCompact;updateHudDensity();
  },"f3c-hud-toggle");
  hudSize.id="f3cHudSize";
  hudSize.dataset.testid="hud-size-toggle";
  // One HUD, two responsive placements. Desktop uses the right mission sidebar;
  // phones keep the overlay inside the map frame. Never clone the button nodes.
  const hudDock=panel.parentElement;
  // Match the actual layout breakpoint: the sidebar sits beside the map only above 1050px.
  const phoneQuery=window.matchMedia("(max-width:1050px)");
  function updateHudDensity(){
    const overlay=phoneQuery.matches,compact=overlay&&hudCompact;
    const t=chromeCopy[state.language]||chromeCopy.en;
    quick.dataset.compact=String(compact);
    hudSize.hidden=!overlay;
    hudSize.setAttribute("aria-pressed",String(compact));
    hudSize.setAttribute("aria-label",compact?t.expand:t.compact);
    hudSize.title=compact?t.expand:t.compact;
    hudSize.textContent=compact?"⤢":"▣";
    // Icon-only Undo retains its full translated accessible name and a real
    // 44px touch target beside the compact toggle on small screens.
    hudUndo.textContent=overlay?"↶":"↶ "+ui().undo;
  }
  function placeHud(){
    const overlay=phoneQuery.matches;
    const destination=overlay?mapStage:hudDock;
    if(quick.parentElement!==destination){
      const focused=quick.contains(document.activeElement)?document.activeElement:null;
      if(overlay)mapStage.appendChild(quick);
      else if(panel.parentElement===hudDock)hudDock.insertBefore(quick,panel);
      else hudDock.appendChild(quick);
      if(focused)focused.focus({preventScroll:true});
    }
    quick.dataset.placement=overlay?"map-overlay":"sidebar";
    updateHudDensity();
  }
  placeHud();
  if(phoneQuery.addEventListener)phoneQuery.addEventListener("change",placeHud);
  else phoneQuery.addListener(placeHud);
  // Reconcile HUD placement immediately on viewport resize (not only media-query changes).
  window.addEventListener("resize",placeHud,{passive:true});

  function dispatchDirection(direction){
    if(isMovementLocked())return;
    const current=activePoint();
    if(!current)return;
    const next=F.nextFromDirection(current,direction);
    if(!E.isNode(next))return;
    onMove(next);
  }
  function canUndo(){
    if(isMovementLocked())return false;
    if(metroCityWalk())return metroState().cityPath.length>1;
    if(state.station===8)return state.quest.leg.length>1;
    if(state.station===2)return state.route.route.length>1;
    if(state.station===7)return state.detour.route.length>1;
    return false;
  }
  function undoMapStep(){
    if(!canUndo())return;
    if(metroCityWalk())return metroAction({type:"UNDO_WALK"});
    const path=state.station===8?state.quest.leg:activePath();
    onMove(path[path.length-2]);
  }
  function updateQuick(){
    const path=activePath(),current=activePoint(),active=!!path;
    // Keep the travelled route visible during checkpoint/completion, but
    // remove inactive directional buttons so they do not obscure the map.
    quick.hidden=!active||(metroPilot()&&!metroCityWalk());
    if(quick.hidden)return;
    const p=pack(),u=ui();
    quick.setAttribute("aria-label",u.compass);
    quickPad.setAttribute("aria-label",u.compass);
    hudUndo.setAttribute("aria-label",u.undo);
    hudUndo.disabled=!canUndo();
    updateHudDensity();
    const cp=state.station===8&&!metroPilot()&&!state.quest.done?
      G.questCheckpoints(state.level)[state.quest.stage]:null;
    const done=isMovementLocked();
    hudLoc.textContent=u.station+" "+String(state.station).padStart(2,"0")+
      " · "+state.level+(state.station===4?" · "+(done?G.guidedPaths[state.level].length:state.guided.step+1)+"/"+G.guidedPaths[state.level].length:"");
    const metroWalkHud={
      en:{"walk-to-entrance":"Walk to Market Square metro entrance","walk-to-museum":"Walk north to City Museum"},
      es:{"walk-to-entrance":"Ve a la entrada del metro en Market Square","walk-to-museum":"Camina hacia el norte hasta City Museum"},
      de:{"walk-to-entrance":"Gehe zum U-Bahn-Eingang am Market Square","walk-to-museum":"Gehe nach Norden zum City Museum"},
      fr:{"walk-to-entrance":"Allez à l'entrée du métro de Market Square","walk-to-museum":"Marchez vers le nord jusqu'à City Museum"}
    };
    quickTitle.textContent=metroCityWalk()?metroWalkHud[state.language][metroState().phase]:
      state.station===4&&!state.guided.done?
      G.instruction(p,state.level,state.guided.step):
      cp?p.places[cp.id]:
      state.station===2?profile().route:
      state.station===7?u.wrongRoad:u.arrived;
    quickCaption.textContent=flash?.text||u.compass;
    quickCaption.dataset.tone=flash?.tone||"";
    for(const [dir,button] of Object.entries(hudButtons)){
      button.setAttribute("aria-label",u[dir]+" · "+u.compass);
      button.disabled=done||!current||!E.isNode(F.nextFromDirection(current,dir));
    }
  }
  function showClosure(){
    blocked.replaceChildren();
    const need=!metroPilot()&&(state.station===7||state.level==="C2"&&[2,8].includes(state.station));
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
      // Keep the marker ABOVE the floating HUD, rather than under the arrow pad.
      top:Math.max(0,p.y*scale-viewport.clientHeight*.30),behavior:reduce?"auto":"smooth"});
  }
  function renderMap(){
    const path=activePath();
    // Claude CQ-F5-017: F0 keeps its own legacy route state, whereas F2 owns
    // the visible game. Keep SVG accessibility state tied to the F2 route,
    // including when changing language, mission, or City/Metro mode.
    const accessibleNodes={
      en:["Crossroads","column","row","Current position","Visited"],
      es:["Cruce","columna","fila","Posición actual","Recorrido"],
      de:["Kreuzung","Spalte","Reihe","Aktueller Standort","Besucht"],
      fr:["Carrefour","colonne","rangée","Position actuelle","Parcouru"]
    };
    const words=accessibleNodes[state.language]||accessibleNodes.en;
    const current=path?.at(-1)||null;
    for(const node of map.querySelectorAll("[data-node]")){
      const [c,r]=node.dataset.node.split("-").map(Number),point={c,r};
      const isCurrent=!!current&&E.same(current,point);
      const visited=!!path&&path.some(p=>E.same(p,point));
      const location=pointName(point),named=location!==ui().city?location:"";
      const label=words[0]+" "+words[1]+" "+(c+1)+", "+words[2]+" "+(r+1)+
        (named?", "+named:"")+(isCurrent?", "+words[3]:visited?", "+words[4]:"");
      node.setAttribute("aria-label",label);
      node.setAttribute("aria-pressed",String(visited));
      if(isCurrent)node.setAttribute("aria-current","location");
      else node.removeAttribute("aria-current");
    }
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
    $("f2HeroLanguage").textContent=p.native;
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
    translateCity();updateMetroToggle();
    for(const id of ["f2Language","f2Level","metroPilotToggle"])
      $(id).setAttribute("aria-describedby","f3dSessionAdvice");
    updateLessonRail();
  }
  function lessonPhase(){
    if(state.done.has(state.station))return 2;
    if(metroPilot()){
      const game=metroState();
      if(["checkpoint","speech","complete"].includes(game.phase))return 2;
      return game.history.length>0||game.attempts>0||game.cityPath.length>1?1:0;
    }
    const m=state.station;
    if(m===8&&state.quest.awaitingSpeech)return 2;
    const worked=m===1?(state.explore.round>0||state.explore.misses>0):
      m===2?state.route.route.length>1:
      m===3?state.dialogue.stage!=="start":
      m===4?state.guided.step>0:
      m===5?(state.transit.tries>0||Object.keys(state.transit.selection).length>0):
      m===6?(state.repair.phase>0||state.repair.tries>0):
      m===7?state.detour.route.length>1:
      m===8?(state.quest.stage>0||state.quest.leg.length>1):false;
    return worked?1:0;
  }
  function updateLessonRail(){
    const x=lesson(),phase=lessonPhase(),metro=metroPilot(),
      title=metro?metroCopy().titleMission:pack().stations[state.station-1][0];
    $("f3dWorld").textContent=metro?x.metro:x.city;
    $("f3dRailTitle").textContent=x.mission+" "+String(state.station).padStart(2,"0")+" · "+title;
    $("f3dRailMode").textContent=(state.mode==="pair"?ui().pair:ui().solo)+
      " · "+pack().native+" "+state.level;
    $("f3dLearningSteps").setAttribute("aria-label",x.phases);
    for(const [i,id,label]of [[0,"f3dRead",x.read],[1,"f3dPractise",x.practise],[2,"f3dReflect",x.reflect]]){
      const node=$(id);
      node.querySelector("strong").textContent=label;
      node.dataset.state=i<phase?"done":i===phase?"current":"upcoming";
      if(i===phase)node.setAttribute("aria-current","step");
      else node.removeAttribute("aria-current");
    }
    $("f3dRailNote").textContent=x.note;
    $("f3dSessionAdvice").textContent=ui().changeSession+
      (metroAvailable()?" "+x.metroReset:"");
  }
  function updateProgress(){
    const u=ui(),nav=$("f1Stations");
    // Preserve the selected mission button on keyboard navigation: rebuilding
    // the nav must not dump focus to the document body.
    const focusIndex=nav.contains(document.activeElement)?
      Array.from(nav.children).indexOf(document.activeElement):-1;
    nav.replaceChildren();
    $("f1ProgressText").textContent=state.done.size+" / 8 · "+u.completed;
    $("f1ProgressTrack").setAttribute("aria-valuenow",String(state.done.size));
    $("f1ProgressFill").style.width=state.done.size*12.5+"%";
    F.stations.forEach((st,i)=>{
      const button=el("button",nav,"f1-station");
      button.type="button";
      const missionTitle=metroEnabled&&metroAvailable()&&st.id>=5?
        LC.pack(state.language,state.level,st.id).titleMission:pack().stations[i][0];
      button.setAttribute("aria-label",u.station+" "+st.id+": "+missionTitle);
      if(state.station===st.id)button.setAttribute("aria-current","step");
      const icon=metroEnabled&&metroAvailable()&&st.id===5?"🚇":icons[i];
      const ic=el("span",button,"f1-station-icon",icon);ic.setAttribute("aria-hidden","true");
      const cap=el("span",button,"f1-station-caption");
      el("small",cap,"",u.station+" "+String(st.id).padStart(2,"0"));
      el("strong",cap,"",missionTitle);
      if(state.done.has(st.id))el("span",button,"f1-station-complete","✓");
      button.addEventListener("click",()=>selectStation(st.id));
    });
    if(focusIndex>=0&&nav.children[focusIndex])
      nav.children[focusIndex].focus({preventScroll:true});
    updateLessonRail();
  }
  function selectStation(n){
    if(!Number.isInteger(n)||n<1||n>8)return;
    state.station=n;flash=null;
    updateProgress();screen();renderMap();
    window.CityQuestF3?.sceneUpdated();
  }
  function resetStation(){
    const n=state.station;
    if(n===1)state.explore={round:0,misses:0};
    if(n===2)state.route=G.routeStart();
    if(n===3)state.dialogue=G.dialogueStart();
    if(n===4)state.guided=G.guidedStart();
    if(n>=5&&state.metro)state.metro[n]=MG.start(n);
    if(n===5)state.transit={done:false,tries:0,selection:{}};
    if(n===6)state.repair={phase:0,done:false,tries:0};
    if(n===7)state.detour=G.routeStart();
    if(n===8)state.quest=G.questStart();
    state.done.delete(n);flash=null;
    updateProgress();screen();renderMap();
  }
  function resetSession(lang,level){
    metroEnabled=false;
    const mode=state.mode;
    state=makeSession(lang,level,mode);flash=null;
    applyLanguageUI();updateProgress();screen();renderMap();
  }
  function updateMetroToggle(){
    const b=$("metroPilotToggle");if(!b)return;
    const available=metroAvailable(),content=available?LC.pack(state.language,state.level,5):null;
    b.hidden=!available;
    b.title=lesson().metroReset;
    b.textContent=metroEnabled&&available?"↶ "+content.back:content?"🚇 "+content.pilot:"";
    b.setAttribute("aria-pressed",String(metroEnabled&&available));
    const pilot=metroEnabled&&available,hero=document.querySelector(".hero h1"),
      heroText=$("f2HeroText"),headerTag=document.querySelector(".topbar .header-actions .tag"),
      variantTag=document.querySelector(".hero .tags .tag:nth-child(3)");
    if(pilot){hero.textContent=content.title;heroText.textContent=content.header;}
    else{hero.textContent=pack().stations[7][0];heroText.textContent=pack().stations[0][1]+" "+ui().objective;}
    if(headerTag)headerTag.textContent=pilot?"F2.1D · "+state.level+" METRO":"CITY QUEST · PREMIUM";
    if(variantTag)variantTag.textContent=pilot?state.language.toUpperCase()+" · "+state.level+" METRO":"8 × 4 × 6";
    document.title=pilot?content.title+" · "+content.native+" "+state.level+" · LSH":
      "City Quest F2 · "+pack().native+" "+state.level+" · Language Skills Hub";
  }
  function toggleMetroPilot(){
    if(!metroAvailable())return;
    metroEnabled=!metroEnabled;
    // Switching gameplay modes resets only missions 05-08, preserving 01-04.
    state.done=new Set([...state.done].filter(n=>n<=4));
    state.metro=Object.fromEntries([5,6,7,8].map(n=>[n,MG.start(n)]));
    state.transit={done:false,tries:0,selection:{}};
    state.repair={phase:0,done:false,tries:0};
    state.detour=G.routeStart();state.quest=G.questStart();
    flash=null;
    updateMetroToggle();updateProgress();screen();renderMap();
    window.CityQuestF3?.sceneUpdated();
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
  if(metroPhoneQuery.addEventListener)metroPhoneQuery.addEventListener("change",()=>{if(metroScene())updateMetroPresentation();});
  else metroPhoneQuery.addListener(()=>{if(metroScene())updateMetroPresentation();});
  $("metroPilotToggle").addEventListener("click",toggleMetroPilot);
  $("f1Solo").addEventListener("click",()=>setMode("solo"));
  $("f1Pair").addEventListener("click",()=>setMode("pair"));
  $("themeBtn").addEventListener("click",applyChromeLabels);
  $("mapZoom").addEventListener("click",()=>{applyChromeLabels();window.requestAnimationFrame(followMap);});
  map.querySelectorAll("[data-node]").forEach(node=>{
    const [c,r]=node.dataset.node.split("-").map(Number);
    node.addEventListener("click",()=>{if(activePath()&&!isMovementLocked())onMove({c,r});});
    node.addEventListener("keydown",e=>{
      if((e.key==="Enter"||e.key===" ")&&activePath()&&!isMovementLocked()){e.preventDefault();onMove({c,r});}
    });
  });
  viewport.addEventListener("keydown",e=>{
    if(e.target!==viewport||!activePath()||isMovementLocked())return;
    const direction={ArrowUp:"north",ArrowDown:"south",ArrowLeft:"west",ArrowRight:"east"}[e.key];
    if(direction){e.preventDefault();onMove(F.nextFromDirection(activePoint(),direction));}
  });
  $("f2Language").value=state.language;
  $("f2Level").value=state.level;
  applyLanguageUI();updateProgress();screen();renderMap();
})();
