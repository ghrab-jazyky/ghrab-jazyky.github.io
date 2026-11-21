/* City Quest F2.1C: deterministic EN/B1 metro mission engine.
 * Pure local state transitions. No network, storage, personal data, audio capture
 * or automatic spoken-language grading. F2.1C is a review-only opt-in pilot.
 */
(function(root,factory){
 "use strict";
 const metro=root.RivertonMetro||(typeof require==="function"?require("../city-quest-f2-1b/metro-network.js"):null);
 const api=factory(metro);
 if(root)root.RivertonMetroGame=api;
 if(typeof module==="object"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(M){
 "use strict";
 if(!M)throw Error("Riverton Metro graph is required");
 const definitions={
  5:{id:"metro_05_b1",title:"Find the Right Line",goal:"Travel from Central Station to Museum Quarter. Choose M1, the correct direction and platform."},
  6:{id:"metro_06_b1",title:"Change Lines",goal:"Travel from Market Square to Stadium. Change from M2 to M3 at University."},
  7:{id:"metro_07_b1",title:"Metro Disruption",goal:"The M1 Old Town–Museum Quarter segment is closed. Find a safe alternative via University."},
  8:{id:"metro_08_b1",title:"City + Metro Quest",goal:"Walk to Market Square, take the metro with a transfer, then walk to City Museum."}
 };
 const portalStart={c:2,r:2},surfaceStart={c:0,r:3},portalEnd={c:3,r:2},museum={c:3,r:1};
 const clone=p=>({c:p.c,r:p.r});
 function isNode(p){return p&&Number.isInteger(p.c)&&Number.isInteger(p.r)&&p.c>=0&&p.c<6&&p.r>=0&&p.r<4;}
 function same(a,b){return !!a&&!!b&&a.c===b.c&&a.r===b.r;}
 function adjacent(a,b){return isNode(a)&&isNode(b)&&Math.abs(a.c-b.c)+Math.abs(a.r-b.r)===1;}
 function config(n){const d=definitions[n];if(!d)throw RangeError("Unsupported B1 metro mission");return d;}
 function scenario(state){return M.scenario(state.scenarioId);}
 function leg(state){return scenario(state).legs[state.legIndex];}
 function desiredDirection(state){
  const selected=leg(state),line=M.line(selected.line);
  const first=line.stops.indexOf(selected.stops[0]),second=line.stops.indexOf(selected.stops[1]);
  if(first<0||second<0||Math.abs(second-first)!==1)throw Error("Invalid metro direction data");
  return second>first?line.stops.at(-1):line.stops[0];
 }
 function platform(state){
  const direction=desiredDirection(state);
  const fixture=M.source.platformFixtures.find(p=>p.station===state.metroStation&&p.line===leg(state).line&&p.directionTerminus===direction);
  if(!fixture)throw Error("Missing approved platform fixture for "+state.scenarioId);
  return fixture.platform;
 }
 function start(number){
  const d=config(number),s=M.scenario(d.id);
  if(!s)throw Error("Missing metro scenario "+d.id);
  return Object.freeze({
   stationNumber:number,scenarioId:d.id,phase:number===8?"walk-to-entrance":number===7?"notice":"select-line",
   metroStation:s.start,legIndex:0,stopIndex:0,lineId:null,direction:null,platform:null,
   surface:number===8?clone(surfaceStart):null,cityPath:number===8?[clone(surfaceStart)]:[],
   noticeRead:false,attempts:0,completed:false,history:[]
  });
 }
 function fail(state,message){
  return {accepted:false,state:Object.freeze({...state,attempts:state.attempts+1}),message,complete:false};
 }
 function success(state,next,message,event){
  const out={...state,...next,history:state.history.concat(event||"")};
  out.completed=out.phase==="complete";
  return {accepted:true,state:Object.freeze(out),message,complete:out.completed};
 }
 function routeIndex(state){
  const legs=scenario(state).legs;let count=0;
  for(let i=0;i<state.legIndex;i++)count+=legs[i].stops.length;
  return count+state.stopIndex;
 }
 function act(state,action){
  if(!state||!config(state.stationNumber)||!action||typeof action.type!=="string")throw TypeError("Invalid metro action");
  if(state.phase==="complete")return fail(state,"This mission has already been completed.");
  const s=scenario(state),l=leg(state),type=action.type;
  if(type==="WALK"){
   if(!["walk-to-entrance","walk-to-museum"].includes(state.phase))return fail(state,"Walking is unavailable at this stage.");
   if(!adjacent(state.surface,action.node))return fail(state,"Move one adjacent city block at a time.");
   if(state.cityPath.length>35)return fail(state,"Route too long. Restart this mission and choose a shorter route.");
   const path=state.cityPath.concat(clone(action.node));
   const destination=state.phase==="walk-to-entrance"?portalStart:museum;
   const arrived=same(action.node,destination);
   return success(state,{
    surface:clone(action.node),cityPath:path,
    phase:arrived?(state.phase==="walk-to-entrance"?"enter":"speech"):state.phase
   },arrived?(state.phase==="walk-to-entrance"?"You have reached Market Square station. Enter the metro.":"You have reached City Museum. Explain your complete journey aloud."):"One city block completed.","WALK");
  }
  if(type==="ENTER"){
   if(state.phase!=="enter"||!same(state.surface,portalStart))return fail(state,"Find the Market Square metro entrance first.");
   return success(state,{phase:"select-line"},"You have entered Market Square station. Read the network and choose a line.","ENTER");
  }
  if(type==="READ_NOTICE"){
   if(state.phase!=="notice")return fail(state,"There is no service notice to acknowledge here.");
   return success(state,{noticeRead:true,phase:"select-line"},"M1 is closed between Old Town and Museum Quarter. Choose another connection.","READ_NOTICE");
  }
  if(type==="SELECT_LINE"){
   if(state.phase!=="select-line")return fail(state,"Choose a line when you are on the station concourse.");
   if(!M.joined(state.metroStation).includes(action.value)||action.value!==l.line)
    return fail(state,"That line does not take you along the required route. Read the network connections.");
   return success(state,{lineId:action.value,direction:null,platform:null,phase:"select-direction"},
     "Correct line. Now choose the train direction.",type);
  }
  if(type==="SELECT_DIRECTION"){
   if(state.phase!=="select-direction")return fail(state,"Choose the metro line first.");
   if(action.value!==desiredDirection(state))
    return fail(state,"That train travels in the opposite direction. Check the terminus.");
   return success(state,{direction:action.value,phase:"select-platform"},
     "Correct destination on the train sign. Find the platform.",type);
  }
  if(type==="SELECT_PLATFORM"){
   if(state.phase!=="select-platform")return fail(state,"Choose the line and direction before the platform.");
   if(String(action.value)!==String(platform(state)))return fail(state,"Incorrect platform. Read the line and terminus on the station signs.");
   return success(state,{platform:String(action.value),phase:"board"},"Correct platform. You can board.",type);
  }
  if(type==="BOARD"){
   if(state.phase!=="board"||!state.lineId||!state.direction||!state.platform)return fail(state,"Confirm your line, direction and platform first.");
   if(state.lineId!==l.line||state.direction!==desiredDirection(state)||state.platform!==String(platform(state)))
    return fail(state,"The departure details no longer match the approved route.");
   return success(state,{phase:"ride"},"Boarded "+state.lineId+". Advance one stop at a time.",type);
  }
  if(type==="NEXT_STOP"){
   if(state.phase!=="ride")return fail(state,"Board the correct train before travelling.");
   const from=l.stops[state.stopIndex],to=l.stops[state.stopIndex+1];
   if(!to||state.metroStation!==from||!M.adjacent(from,to,l.line)||M.closed(from,to,l.line,s.closedEdges))
    return fail(state,"Movement is blocked or the next station is not connected.");
   const nextStop=state.stopIndex+1,last=nextStop===l.stops.length-1;
   const nextPhase=last?(state.legIndex<s.legs.length-1?"transfer":"exit"):"ride";
   return success(state,{metroStation:to,stopIndex:nextStop,phase:nextPhase},
    last?(nextPhase==="transfer"?"Transfer at "+M.station(to).labelEn+".":"Arrived at "+M.station(to).labelEn+". Exit the train."):
     "Next stop: "+M.station(to).labelEn+".",type);
  }
  if(type==="CHANGE_LINE"){
   if(state.phase!=="transfer"||state.legIndex>=s.legs.length-1)return fail(state,"You can change lines only at a valid interchange.");
   const next=s.legs[state.legIndex+1];
   if(next.stops[0]!==state.metroStation||!M.joined(state.metroStation).includes(next.line))
    return fail(state,"This station has no valid connection to the next line.");
   return success(state,{legIndex:state.legIndex+1,stopIndex:0,lineId:null,direction:null,platform:null,phase:"select-line"},
     "Follow the transfer signs and choose the connecting line.",type);
  }
  if(type==="EXIT"){
   if(state.phase!=="exit"||state.metroStation!==s.goal)return fail(state,"Exit only after arriving at your destination.");
   if(state.stationNumber===8)
    return success(state,{phase:"walk-to-museum",surface:clone(portalEnd),cityPath:[clone(portalEnd)]},
     "You are at the Museum Quarter exit. Walk north one city block to City Museum.",type);
   return success(state,{phase:"speech"},"You have arrived. Say your directions aloud, then confirm self-check.",type);
  }
  if(type==="SELF_CHECK"){
   if(state.phase!=="speech")return fail(state,"Finish the route before the speaking checkpoint.");
   return success(state,{phase:"complete"},"Mission completed. Speaking was self-assessed, not automatically graded.",type);
  }
  return fail(state,"Unknown action.");
 }
 function options(state){
  switch(state.phase){
   case "select-line":return M.joined(state.metroStation).map(id=>({label:id+" · "+M.line(id).name,value:id}));
   case "select-direction":{
    const line=M.line(state.lineId);return [line.stops[0],line.stops.at(-1)].map(id=>({label:M.station(id).labelEn,value:id}));
   }
   case "select-platform":return ["1","2","3"].map(value=>({label:"Platform "+value,value}));
   default:return [];
  }
 }
 function validate(){
  for(const n of [5,6,7,8]){
   const d=config(n),s=M.scenario(d.id);
   for(const legDef of s.legs){
    if(legDef.stops.length<2)throw Error("Incomplete mission leg "+n);
    if(!M.joined(legDef.stops[0]).includes(legDef.line))throw Error("Invalid metro boarding station "+n);
    const temp={scenarioId:s.id,legIndex:s.legs.indexOf(legDef),metroStation:legDef.stops[0]};
    platform(temp);
   }
   if(!M.shortestPath(s.start,s.goal,s.closedEdges))throw Error("Unreachable metro mission "+n);
  }
  return true;
 }
 validate();
 return Object.freeze({definitions,config,scenario,start,act,options,routeIndex,
  desiredDirection,platform,isNode,same,adjacent,validate,portalStart,surfaceStart,portalEnd,museum});
});
