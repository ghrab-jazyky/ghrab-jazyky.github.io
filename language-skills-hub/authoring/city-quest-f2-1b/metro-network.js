/* Riverton Metro — F2.1B experimental network and route engine.
 * Everything is fictional, static and local. No fetch, third-party APIs,
 * student records, geolocation or live transport data.
 */
(function(root,factory){
  "use strict";
  const source={
 "$comment": "DESIGN REFERENCE ONLY – not a production/importable F2 metro engine or approved localization. All stops, times, lines and platform data are fictional.",
 "schemaVersion": "city-quest-f2.1-design.1",
 "status": "F2.1B visual prototype",
 "fictional": true,
 "coordinateSystem": {
  "width": 1196,
  "height": 756,
  "unit": "svg-viewBox",
  "designOnly": false
 },
 "defaults": {
  "minutesPerStop": 3,
  "transferMinutes": 4,
  "metric": "simulated",
  "liveData": false
 },
 "lines": [
  {
   "id": "M1",
   "name": "Azure Line",
   "color": "#22B7D6",
   "marker": "solid-circle",
   "stops": [
    "west_end",
    "central_station",
    "old_town",
    "museum_quarter",
    "riverside",
    "east_gardens"
   ]
  },
  {
   "id": "M2",
   "name": "Emerald Line",
   "color": "#31BA8C",
   "marker": "square",
   "stops": [
    "north_park",
    "university",
    "central_station",
    "market_square",
    "south_gate"
   ]
  },
  {
   "id": "M3",
   "name": "Coral Line",
   "color": "#F28B72",
   "marker": "diamond",
   "stops": [
    "hilltop",
    "university",
    "science_centre",
    "museum_quarter",
    "stadium",
    "harbour"
   ]
  }
 ],
 "stations": [
  {
   "id": "west_end",
   "labelKey": "metro.station.west_end",
   "labelEn": "West End",
   "x": 140,
   "y": 320
  },
  {
   "id": "central_station",
   "labelKey": "metro.station.central_station",
   "labelEn": "Central Station",
   "x": 320,
   "y": 320
  },
  {
   "id": "old_town",
   "labelKey": "metro.station.old_town",
   "labelEn": "Old Town",
   "x": 510,
   "y": 320
  },
  {
   "id": "museum_quarter",
   "labelKey": "metro.station.museum_quarter",
   "labelEn": "Museum Quarter",
   "x": 700,
   "y": 320
  },
  {
   "id": "riverside",
   "labelKey": "metro.station.riverside",
   "labelEn": "Riverside",
   "x": 875,
   "y": 320
  },
  {
   "id": "east_gardens",
   "labelKey": "metro.station.east_gardens",
   "labelEn": "East Gardens",
   "x": 1050,
   "y": 320
  },
  {
   "id": "north_park",
   "labelKey": "metro.station.north_park",
   "labelEn": "North Park",
   "x": 320,
   "y": 80
  },
  {
   "id": "university",
   "labelKey": "metro.station.university",
   "labelEn": "University",
   "x": 320,
   "y": 180
  },
  {
   "id": "market_square",
   "labelKey": "metro.station.market_square",
   "labelEn": "Market Square",
   "x": 320,
   "y": 500
  },
  {
   "id": "south_gate",
   "labelKey": "metro.station.south_gate",
   "labelEn": "South Gate",
   "x": 320,
   "y": 650
  },
  {
   "id": "hilltop",
   "labelKey": "metro.station.hilltop",
   "labelEn": "Hilltop",
   "x": 100,
   "y": 140
  },
  {
   "id": "science_centre",
   "labelKey": "metro.station.science_centre",
   "labelEn": "Science Centre",
   "x": 500,
   "y": 205
  },
  {
   "id": "stadium",
   "labelKey": "metro.station.stadium",
   "labelEn": "Stadium",
   "x": 860,
   "y": 490
  },
  {
   "id": "harbour",
   "labelKey": "metro.station.harbour",
   "labelEn": "Harbour",
   "x": 1040,
   "y": 625
  }
 ],
 "interchanges": [
  {
   "station": "central_station",
   "lines": [
    "M1",
    "M2"
   ]
  },
  {
   "station": "university",
   "lines": [
    "M2",
    "M3"
   ]
  },
  {
   "station": "museum_quarter",
   "lines": [
    "M1",
    "M3"
   ]
  }
 ],
 "surfacePortals": [
  {
   "metroStation": "central_station",
   "cityNode": {
    "c": 0,
    "r": 3
   },
   "description": "Central railway station"
  },
  {
   "metroStation": "market_square",
   "cityNode": {
    "c": 2,
    "r": 2
   },
   "description": "Market Square"
  },
  {
   "metroStation": "museum_quarter",
   "cityNode": {
    "c": 3,
    "r": 2
   },
   "description": "Museum station entrance: one city block south of museum"
  },
  {
   "metroStation": "riverside",
   "cityNode": {
    "c": 4,
    "r": 2
   },
   "description": "Riverside Park vicinity"
  }
 ],
 "platformFixtures": [
  {
   "station": "central_station",
   "line": "M1",
   "directionTerminus": "east_gardens",
   "platform": "2"
  },
  {
   "station": "central_station",
   "line": "M2",
   "directionTerminus": "north_park",
   "platform": "3"
  },
  {
   "station": "market_square",
   "line": "M2",
   "directionTerminus": "north_park",
   "platform": "1"
  },
  {
   "station": "university",
   "line": "M3",
   "directionTerminus": "harbour",
   "platform": "3"
  }
 ],
 "scenarios": [
  {
   "id": "metro_05_b1",
   "stationNumber": 5,
   "minLevel": "B1",
   "start": "central_station",
   "goal": "museum_quarter",
   "requiredPlatforms": [
    "central_station:M1:east_gardens:2"
   ],
   "legs": [
    {
     "line": "M1",
     "stops": [
      "central_station",
      "old_town",
      "museum_quarter"
     ]
    }
   ],
   "closedEdges": []
  },
  {
   "id": "metro_06_b1",
   "stationNumber": 6,
   "minLevel": "B1",
   "start": "market_square",
   "goal": "stadium",
   "requiredInterchanges": [
    "university"
   ],
   "legs": [
    {
     "line": "M2",
     "stops": [
      "market_square",
      "central_station",
      "university"
     ]
    },
    {
     "line": "M3",
     "stops": [
      "university",
      "science_centre",
      "museum_quarter",
      "stadium"
     ]
    }
   ],
   "closedEdges": []
  },
  {
   "id": "metro_07_b1",
   "stationNumber": 7,
   "minLevel": "B1",
   "start": "central_station",
   "goal": "museum_quarter",
   "requiredInterchanges": [
    "university"
   ],
   "legs": [
    {
     "line": "M2",
     "stops": [
      "central_station",
      "university"
     ]
    },
    {
     "line": "M3",
     "stops": [
      "university",
      "science_centre",
      "museum_quarter"
     ]
    }
   ],
   "closedEdges": [
    {
     "line": "M1",
     "from": "old_town",
     "to": "museum_quarter"
    }
   ]
  },
  {
   "id": "metro_08_b1",
   "stationNumber": 8,
   "minLevel": "B1",
   "start": "market_square",
   "goal": "museum_quarter",
   "surfaceStart": {
    "c": 0,
    "r": 3
   },
   "surfacePortalStart": {
    "c": 2,
    "r": 2
   },
   "surfacePortalEnd": {
    "c": 3,
    "r": 2
   },
   "surfaceFinish": {
    "c": 3,
    "r": 1
   },
   "legs": [
    {
     "line": "M2",
     "stops": [
      "market_square",
      "central_station",
      "university"
     ]
    },
    {
     "line": "M3",
     "stops": [
      "university",
      "science_centre",
      "museum_quarter"
     ]
    }
   ],
   "closedEdges": [],
   "speakingCheckpoints": 3
  }
 ]
};
  const model=factory(source);
  if(root)root.RivertonMetro=model;
  if(typeof module==="object"&&module.exports)module.exports=model;
})(typeof globalThis!=="undefined"?globalThis:this,function(source){
  "use strict";
  const lines=source.lines, stations=source.stations, scenarios=source.scenarios;
  const index=new Map(stations.map(s=>[s.id,s]));
  const memberships=new Map(stations.map(s=>[s.id,lines.filter(l=>l.stops.includes(s.id)).map(l=>l.id)]));
  function line(id){return lines.find(l=>l.id===id)||null;}
  function station(id){return index.get(id)||null;}
  function scenario(id){return scenarios.find(s=>s.id===id)||null;}
  function joined(stationId){return (memberships.get(stationId)||[]).slice();}
  function sameEdge(a,b,x,y){return a===x&&b===y||a===y&&b===x;}
  function closed(a,b,lineId,blocked){
    return (blocked||[]).some(e=>e.line===lineId&&sameEdge(a,b,e.from,e.to));
  }
  function adjacent(a,b,lineId){
    const l=line(lineId);if(!l)return false;
    const x=l.stops.indexOf(a),y=l.stops.indexOf(b);
    return x>=0&&y>=0&&Math.abs(x-y)===1;
  }
  function validate(){
    if(stations.length!==14||lines.length!==3||source.interchanges.length!==3)throw Error("Metro 14/3/3 invariant");
    if(index.size!==14)throw Error("Duplicate metro station IDs");
    if(lines.some(l=>l.stops.length<2||new Set(l.stops).size!==l.stops.length||
      l.stops.some(s=>!station(s))))throw Error("Invalid metro line stops");
    const expected=Array.from(memberships).filter(([_,list])=>list.length>1);
    if(expected.length!==3)throw Error("Unexpected metro interchange count");
    for(const x of source.interchanges){
      if(!x.lines.every(l=>joined(x.station).includes(l))||
        joined(x.station).length!==x.lines.length)throw Error("Invalid interchange "+x.station);
    }
    for(const s of scenarios){
      if(!station(s.start)||!station(s.goal)||!s.legs.length)throw Error("Invalid scenario endpoints");
      let last=null;
      for(const leg of s.legs){
        if(!line(leg.line)||!leg.stops.length||leg.stops.some(x=>!station(x)))
          throw Error("Invalid metro scenario leg "+s.id);
        if(last&&last!==leg.stops[0])throw Error("Broken transfer "+s.id);
        for(let j=1;j<leg.stops.length;j++){
          if(!adjacent(leg.stops[j-1],leg.stops[j],leg.line))throw Error("Non-adjacent stops "+s.id);
          if(closed(leg.stops[j-1],leg.stops[j],leg.line,s.closedEdges))
            throw Error("Scenario traverses closed edge "+s.id);
        }
        last=leg.stops.at(-1);
      }
      if(s.legs[0].stops[0]!==s.start||last!==s.goal)
        throw Error("Broken scenario destination "+s.id);
    }
    return true;
  }
  function itinerary(scenarioId){
    const s=scenario(scenarioId);
    if(!s)throw RangeError("Unknown metro scenario");
    const result=[];
    for(const leg of s.legs){
      if(!result.length)result.push({kind:"start",station:leg.stops[0],line:leg.line});
      else result.push({kind:"transfer",station:leg.stops[0],line:leg.line,fromLine:result.at(-1).line});
      for(let i=1;i<leg.stops.length;i++)
        result.push({kind:"ride",station:leg.stops[i],line:leg.line,from:leg.stops[i-1]});
    }
    return result.map(x=>Object.freeze(x));
  }
  function nextStopOptions(stationId,lineId,blocked){
    const l=line(lineId),i=l?l.stops.indexOf(stationId):-1;
    if(i<0)return [];
    return [l.stops[i-1],l.stops[i+1]].filter(Boolean)
      .filter(next=>!closed(stationId,next,lineId,blocked||[]));
  }
  /* Line-aware shortest path. Ride=3 min, change=4 min; all times fictional.
     States (station,line) prevent illegal transfers or teleportation. */
  function shortestPath(from,to,blocked){
    if(!station(from)||!station(to))throw RangeError("Invalid station");
    if(from===to)return {cost:0,steps:[{station:from,line:null,kind:"start"}],transfers:0};
    const candidates=joined(from).map(lineId=>({key:from+"|"+lineId,cost:0,prev:null,
      action:{kind:"start",station:from,line:lineId}}));
    const distances=new Map(candidates.map(c=>[c.key,c])),done=new Set();
    while(true){
      let current=null;
      for(const value of distances.values())
        if(!done.has(value.key)&&(!current||value.cost<current.cost))current=value;
      if(!current)break;
      if(current.key.split("|")[0]===to){
        const steps=[];let walk=current;
        while(walk){steps.push(walk.action);walk=walk.prev?distances.get(walk.prev):null;}
        steps.reverse();
        return {cost:current.cost,steps,transfers:steps.filter(x=>x.kind==="transfer").length};
      }
      done.add(current.key);
      const [here,currentLine]=current.key.split("|");
      const edges=[];
      for(const neighbor of nextStopOptions(here,currentLine,blocked))
        edges.push({to:neighbor+"|"+currentLine,cost:source.defaults.minutesPerStop,
          action:{kind:"ride",station:neighbor,line:currentLine,from:here}});
      for(const newLine of joined(here).filter(x=>x!==currentLine))
        edges.push({to:here+"|"+newLine,cost:source.defaults.transferMinutes,
          action:{kind:"transfer",station:here,line:newLine,fromLine:currentLine}});
      for(const edge of edges){
        const nextCost=current.cost+edge.cost;
        const existing=distances.get(edge.to);
        if(!existing||nextCost<existing.cost)
          distances.set(edge.to,{key:edge.to,cost:nextCost,prev:current.key,action:edge.action});
      }
    }
    return null;
  }
  function startPreview(scenarioId){
    const s=scenario(scenarioId);if(!s)throw RangeError("Unknown scenario");
    return Object.freeze({scenarioId,index:0,finished:false});
  }
  function advancePreview(state){
    const steps=itinerary(state.scenarioId);
    const nextIndex=Math.min(state.index+1,steps.length-1);
    return Object.freeze({scenarioId:state.scenarioId,index:nextIndex,finished:nextIndex===steps.length-1});
  }
  validate();
  return Object.freeze({
    meta:Object.freeze({name:"Riverton Metro",fictional:true,phase:"F2.1B VISUAL REVIEW",
      languages:"EN visual reference only",level:"B1 route fixtures"}),
    source,lines,stations,scenarios,station,line,scenario,joined,adjacent,closed,
    validate,itinerary,shortestPath,nextStopOptions,startPreview,advancePreview,
    byId:Object.freeze(Object.fromEntries(stations.map(s=>[s.id,s])))
  });
});
