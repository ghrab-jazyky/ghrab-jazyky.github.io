#!/usr/bin/env node
'use strict';
// D1: independent rail fixtures and natural responses from the actual accepted ledger.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'konverzace/city-quest-f2/index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
// Compile ALL inline JavaScript, not only the pure engine section.
new vm.Script(script,{filename:'city-quest-inline.js'});
const start=script.indexOf('/* Riverton Metro — F2.1B experimental network and route engine.');
const end=script.indexOf('/* CITY QUEST F3B — public-address simulation and scene semantics.',start);
assert.ok(start>=0&&end>start,'Isolated engine boundary');
const context=vm.createContext({});
vm.runInContext(script.slice(start,end),context,{timeout:5000});
const M=context.RivertonMetro,MG=context.RivertonMetroGame;
const local=x=>JSON.parse(JSON.stringify(x));
const levels=['B2','C1','C2'];
const fixtures={
 5:[
  [{line:'M1',direction:'east_gardens',platform:'2',stops:['central_station','old_town','museum_quarter']}],
  [{line:'M2',direction:'north_park',platform:'3',stops:['central_station','university']},{line:'M3',direction:'harbour',platform:'3',stops:['university','science_centre','museum_quarter']}]
 ],
 6:[
  [{line:'M2',direction:'north_park',platform:'1',stops:['market_square','central_station','university']},{line:'M3',direction:'harbour',platform:'3',stops:['university','science_centre','museum_quarter','stadium']}],
  [{line:'M2',direction:'north_park',platform:'1',stops:['market_square','central_station']},{line:'M1',direction:'east_gardens',platform:'2',stops:['central_station','old_town','museum_quarter']},{line:'M3',direction:'harbour',platform:'3',stops:['museum_quarter','stadium']}]
 ]
};
const expectedAnswer={B2:'exact',C1:'adapt',C2:'verified'};
function act(state,type,value,extra){
 const r=MG.act(state,{type,value,...extra});
 assert.equal(r.accepted,true,type+' rejected: '+r.message+' ('+state.phase+'/'+state.metroStation+')');
 return r.state;
}
function rejects(state,type,value,extra){
 const r=MG.act(state,{type,value,...extra});
 assert.equal(r.accepted,false,type+' incorrectly accepted');
 assert.equal(r.state.phase,state.phase);
 assert.equal(r.state.metroStation,state.metroStation);
 assert.equal(r.state.completed,state.completed);
 return r.state;
}
function take(state,legs){
 for(let i=0;i<legs.length;i++){
  const leg=legs[i];
  if(i===0)state=act(state,'SELECT_LINE',leg.line);
  else{
   state=act(state,'TRANSFER_HERE');
   if(state.phase==='checkpoint')state=act(state,'SELF_CHECK');
   state=act(state,'CHANGE_LINE',leg.line);
  }
  state=act(state,'SELECT_DIRECTION',leg.direction);
  state=act(state,'SELECT_PLATFORM',leg.platform);
  state=act(state,'BOARD');
  for(const stop of leg.stops.slice(1)){
   state=act(state,'NEXT_STOP');
   assert.equal(state.metroStation,stop,'Actual physical stop');
  }
 }
 state=act(state,'EXIT_HERE');
 state=act(state,'EXIT');
 return state;
}
function finish(state){
 if(state.level!=='B1'){
  state=rejects(state,'SELF_CHECK');
  state=rejects(state,'REVIEW_ROUTE','not-valid');
  assert.equal(state.reviewAttempts,1);
  state=act(state,'REVIEW_ROUTE',expectedAnswer[state.level]);
  assert.equal(state.reviewPassed,true);
 }
 state=act(state,'SELF_CHECK');
 assert.equal(state.completed,true);
 return state;
}

const LC=context.RivertonMetroLanguage;
const langs=['en','es','de','fr'];
const allLevels=['B1','B2','C1','C2'];
const firstWords={en:'At ',es:'En ',de:'An der Station ',fr:'À la station '};
const transferWords={en:'I changed to',es:'cambié a',de:'umgestiegen',fr:"j'ai changé pour"};
const reverseWords={en:'opposite direction',es:'sentido contrario',de:'Gegenrichtung',fr:'sens inverse'};
const museumNames={en:'City Museum',es:'Museo de la Ciudad',de:'Stadtmuseum',fr:'musée municipal'};
const exitWords={en:'I got off at',es:'Bajé en',de:'bin ich ausgestiegen',fr:'Je suis descendu à'};
const via7=fixtures[5][1],mixed8=[fixtures[6][0][0],
 {line:'M3',direction:'harbour',platform:'3',stops:['university','science_centre','museum_quarter']}];
function sample(s,lang){
 const alt=MG.routeVariants(s.stationNumber,s.level).find((_,i)=>i!==s.routeVariant);
 const name=id=>M.station(id).labelEn,summary=MG.journeySummary(s);
 const walk={en:'Walk north to the next junction.',es:'Avanza hacia el norte hasta el siguiente cruce.',de:'Geh nach Norden bis zur nächsten Kreuzung.',fr:"Avancez vers le nord jusqu'au prochain carrefour."}[lang];
 return LC.actualResponse(lang,s.level,s,{name,summary,entryText:summary.entryWalk.length>1?walk:'',
  exitText:summary.exitWalk.length>1?walk:'',alternative:alt?{lines:alt.map(l=>l.line),
  via:alt.slice(1).map(l=>name(l.stops[0])),minutes:MG.routeCost(alt),stops:alt.reduce((n,l)=>n+l.stops.length-1,0),transfers:alt.length-1}:null});
}
test('D03: 56 canonical and alternative responses for metro 05/06 are fluent sentence sequences with actual first departure and destination',()=>{
 let total=0;
 for(const n of [5,6])for(const level of allLevels)for(const legs of fixtures[n].slice(0,level==='B1'?1:2)){
  const s=take(MG.start(n,level),legs);
  for(const lang of langs){
   const model=sample(s,lang),first=legs[0],last=legs.at(-1),end=M.station(last.stops.at(-1)).labelEn;
   assert.ok(model.startsWith(firstWords[lang]+M.station(first.stops[0]).labelEn),lang+'/'+level+'/'+n);
   assert.ok(model.slice(0,200).includes(first.line));
   assert.ok(model.slice(0,200).includes(M.station(first.direction).labelEn));
   assert.ok(model.includes(exitWords[lang])&&model.includes(end));
   assert.doesNotMatch(model,/→|\{[a-z]+\}|undefined/);
   assert.ok(model.split('.').length>=4);
   if(legs.length>1)assert.ok(model.includes(transferWords[lang]),lang);
   if(level!=='B1')assert.ok(model.length>250,lang+'/'+level);
   total++;
  }
 }
 assert.equal(total,56);
});
test('D03: completed disruption and mixed routes have 32 language/level models with actual obligations and localized destination',()=>{
 let count=0;
 for(const level of allLevels){
  const a=take(act(MG.start(7,level),'READ_NOTICE'),via7);
  let s=MG.start(8,level);
  for(const node of [{c:1,r:3},{c:2,r:3},{c:2,r:2}])s=act(s,'WALK',undefined,{node});
  s=act(s,'SELF_CHECK');s=act(s,'ENTER');s=take(s,mixed8);
  s=act(s,'WALK',undefined,{node:{c:3,r:1}});
  for(const lang of langs){
   const disruption=sample(a,lang),mixed=sample(s,lang);
   assert.ok(disruption.includes('M2')&&disruption.includes('M3')&&disruption.includes('Museum Quarter'));
   assert.ok(mixed.includes('Market Square')&&mixed.includes('University')&&mixed.includes('Museum Quarter'));
   assert.ok(mixed.includes(museumNames[lang]),lang);
   assert.ok(mixed.indexOf('Market Square')<mixed.indexOf('University'));
   if(lang!=='en')assert.doesNotMatch(mixed,/City Museum/);
   assert.doesNotMatch(disruption+mixed,/→|\{[a-z]+\}|undefined/);
   count+=2;
  }
 }
 assert.equal(count,32);
});
test('D03: partial checkpoint samples never invent a later boarding or completion',()=>{
 for(const level of allLevels){
  let s=MG.start(8,level);
  for(const node of [{c:1,r:3},{c:2,r:3},{c:2,r:2}])s=act(s,'WALK',undefined,{node});
  assert.equal(s.phase,'checkpoint');
  for(const lang of langs){
   const m=sample(s,lang);
   assert.ok(m.includes('Market Square'));
   assert.doesNotMatch(m,/M[123]\b|University|Museum Quarter|undefined/);
  }
  s=act(s,'SELF_CHECK');s=act(s,'ENTER');
  for(const [type,value] of [['SELECT_LINE','M2'],['SELECT_DIRECTION','north_park'],['SELECT_PLATFORM','1'],['BOARD'],['NEXT_STOP'],['NEXT_STOP'],['TRANSFER_HERE']])s=act(s,type,value);
  assert.equal(s.phase,'checkpoint');
  for(const lang of langs){
   const m=sample(s,lang);assert.ok(m.includes('University')&&m.includes('M2'));
   assert.doesNotMatch(m,/M3\b|Museum Quarter|undefined/);
  }
 }
});
test('D03: overrun and actual reversal are reflected, without inventing a reversal platform',()=>{
 for(const level of allLevels){
  let s=MG.start(5,level);
  for(const [type,value] of [['SELECT_LINE','M1'],['SELECT_DIRECTION','east_gardens'],['SELECT_PLATFORM','2'],['BOARD'],['NEXT_STOP'],['NEXT_STOP'],['NEXT_STOP'],['TURN_BACK'],['NEXT_STOP'],['EXIT_HERE'],['EXIT']])s=act(s,type,value);
  for(const lang of langs){
   const m=sample(s,lang);
   assert.ok(m.includes('Riverside')&&m.includes(reverseWords[lang]));
   assert.ok(m.indexOf('Riverside')<m.lastIndexOf('Museum Quarter'));
   assert.doesNotMatch(m,/undefined|→/);
   assert.equal(s.railLog.filter(e=>e.kind==='board').length,1);
  }
 }
});
test('D02/D08: no English surface building alias and explicit theme/forced-colour contrast',()=>{
 assert.match(html,/\["CENTRAL STATION","MARKET SQUARE"\]\.includes\(original\)/);
 assert.doesNotMatch(html,/\{node:E\.goal,name:"City Museum"\}/);
 assert.match(html,/\.cq-completion-summary\{background:#14253d;color:#f3f8ff\}/);
 assert.match(html,/\.cq-completion-summary\{background:#edf4fb;color:#17293b\}/);
 assert.match(html,/@media\(forced-colors:active\)/);
 assert.match(html,/connect-src 'none'/);
});
