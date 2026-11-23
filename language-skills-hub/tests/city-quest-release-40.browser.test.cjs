#!/usr/bin/env node
'use strict';
// Joint release acceptance: 40 full, eight-mission playthroughs in Chromium.
// This is a UI test: actions are performed on rendered controls, not by
// injecting application state, calling action handlers, or forcing completions.
// Engine/fixture read-only introspection identifies valid visible choices.
// Human CEFR, oral-language and physical-device approval are separate gates.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

const BASE='http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html';
const LANG=['en','es','de','fr'], LEVEL=['A1','A2','B1','B2','C1','C2'];
const TARGETS=[...LANG.flatMap(language=>LEVEL.flatMap(level=>
  (['A1','A2'].includes(level)?['city']:['city','mixed']).map(mode=>({language,level,mode}))))];
assert.equal(TARGETS.length,40);
const FILTER=process.env.CQ_40_ONLY||'';
const SELECTED=FILTER?TARGETS.filter(t=>FILTER.split(',').includes(t.language+'/'+t.level+'/'+t.mode)):TARGETS;
assert.ok(SELECTED.length>0,'No journeys selected by filter');
const REPORT=process.env.CQ_40_REPORT||path.resolve(process.cwd(),'city-quest-e2e-40.json');
const cases=[];

function caption(c){return c.language.toUpperCase()+'/'+c.level+'/'+c.mode;}
async function choiceByIndex(page,index,where='#f1Panel .f2-choice-list button'){
 assert.ok(Number.isInteger(index)&&index>=0,'Correct choice must be rendered');
 const choices=page.locator(where);
 assert.ok((await choices.count())>index,'Expected choice '+index+' is not rendered');
 await choices.nth(index).click();
}
async function getCityChoiceIndex(page,language,level,n,stage,values,correct){
 return page.evaluate(({language,level,n,stage,values,correct})=>{
   const ordered=window.CityQuestF2Engine.orderChoices(
     values.map(value=>({value,label:String(value)})),language,level,n,stage);
   return ordered.findIndex(item=>item.value===correct);
 },{language,level,n,stage,values,correct});
}
// Independent geometry validation: find a simple walking path through each
// required waypoint, respecting the map boundaries and actual closed edges.
// For reproducibility, plans use one named node per grid intersection, and
// no teleportation, skipping, looping or closure crossing is allowed.
async function planCity(page,n,level){
 return page.evaluate(({n,level})=>{
  const G=window.CityQuestF2Engine,E=window.CityQuestEngine,F=window.CityQuestF1Engine;
  let start=E.start,waypoints=[],closed=[];
  if(n===2){const c=G.config(level);waypoints=[...c.via,c.target];if(c.blocked)closed=[c.blocked];}
  if(n===7){const c=G.config(level);waypoints=[...c.via,E.goal];closed=G.detourClosures(level);}
  if(n===8){waypoints=G.questCheckpoints(level).map(x=>x.node);if(level==='C2')closed=[F.closure];}
  if(!waypoints.length)throw Error('Unexpected city mission path plan '+n);
  const dirs=[['north',0,-1],['east',1,0],['south',0,1],['west',-1,0]];
  const same=(a,b)=>a.c===b.c&&a.r===b.r;
  const key=p=>p.c+':'+p.r;
  const blocked=(a,b)=>closed.some(e=>(same(a,e.a)&&same(b,e.b))||(same(a,e.b)&&same(b,e.a)));
  const searches=[{position:start,goalIndex:0,used:[start],directions:[],hits:[]}];
  const seen=new Set();
  while(searches.length){
   const s=searches.shift(),signature=key(s.position)+'#'+s.goalIndex+'#'+s.used.map(key).sort().join(',');
   if(seen.has(signature))continue;seen.add(signature);
   for(const [dir,dc,dr] of dirs){
    const next={c:s.position.c+dc,r:s.position.r+dr};
    if(!E.isNode(next)||s.used.some(p=>same(p,next))||blocked(s.position,next))continue;
    const atTarget=same(next,waypoints[s.goalIndex]);
    const nextIndex=s.goalIndex+(atTarget?1:0);
    const dirsNext=s.directions.concat(dir),hits=s.hits.concat(atTarget?[dirsNext.length]:[]);
    if(nextIndex===waypoints.length)return {directions:dirsNext,checkpoints:hits,points:s.used.concat(next),closed:closed.length};
    // Avoid stepping onto a future required waypoint in the wrong order.
    if(waypoints.slice(nextIndex+1).some(p=>same(p,next)))continue;
    searches.push({position:next,goalIndex:nextIndex,used:s.used.concat(next),directions:dirsNext,hits});
   }
  }
  throw Error('No simple route to all required waypoints: '+n+'/'+level);
 },{n,level});
}
async function walking(page,directions){
 for(const dir of directions){
  const b=page.locator('.f2-quick-'+dir);
  assert.equal(await b.isDisabled(),false,'Expected navigable direction '+dir);
  await b.click();
 }
}
async function progress(page,num,context){
 const text=await page.locator('#f1ProgressText').innerText();
 assert.match(text,new RegExp('^'+num+'\\s*/\\s*8'),context+' progress '+text);
}
async function cityMission(page,language,level,n){
 const G=()=>null;
 await page.locator('#f1Stations button').nth(n-1).click();
 const header=await page.locator('#f1Panel .f2-card-head h2').innerText();
 assert.ok(header.length>4,'Missing header for '+n);
 if(['B2','C1','C2'].includes(level)){
  assert.equal(await page.locator('.cq-advanced-oracy-task').count(),1,'Advanced task absent');
  assert.equal(await page.locator('.cq-advanced-oracy-criteria li').count(),3);
 }else assert.equal(await page.locator('.cq-advanced-oracy').count(),0);
 if(n===1){
  const total=await page.evaluate(l=>window.CityQuestF2Engine.answerCount(l),level);
  for(let round=0;round<total;round++){
   const index=await page.evaluate(({language,level,round})=>{
    const F=window.CityQuestF1Engine,G=window.CityQuestF2Engine,q=F.explore[round];
    return G.orderChoices(G.exploreChoices(q,level,round),language,level,1,round).indexOf(q.correct);
   },{language,level,round});
   await choiceByIndex(page,index);
  }
 }else if([2,7].includes(n)){
  const plan=await planCity(page,n,level);
  assert.ok(plan.directions.length>=3);
  await walking(page,plan.directions);
 }else if(n===3){
  const stages=[['start','wrong',['help','vague','wrong']],
    ['wrong','repair',['repair','insist']],
    ['distance','distance',['distance','nohelp']]];
  for(const [stage,answer,ids]of stages){
   const index=await getCityChoiceIndex(page,language,level,3,stage,ids,answer);
   await choiceByIndex(page,index);
  }
 }else if(n===4){
  const dirs=await page.evaluate(l=>window.CityQuestF2Engine.guidedPaths[l],level);
  await walking(page,dirs);
  if(['B2','C1','C2'].includes(level)){
   const index=await page.evaluate(({language,level})=>{
    const source=document.querySelector('script').textContent;
    const found=source.match(/^  const advancedPractice=(.*);$/m);
    if(!found)throw Error('Missing advanced authored choices');
    const opts=JSON.parse(found[1])[language].guided[level].options;
    const ordered=window.CityQuestF2Engine.orderChoices(
      opts.map(([value,label])=>({value,label})),language,level,4,'explain');
    const correct={B2:'left',C1:'library',C2:'closure'}[level];
    return ordered.findIndex(x=>x.value===correct);
   },{language,level});
   await choiceByIndex(page,index);
  }
 }else if(n===5){
  const input=await page.evaluate(level=>{
   const G=window.CityQuestF2Engine;
   const fields=G.requiredFields(level);
   const service=G.servicesForLevel(level).find(s=>
     G.checkTransport({line:s.line,depart:s.depart,stop:s.to},level).correct);
   if(!service)throw Error('Missing valid bus journey '+level);
   return fields.map(key=>service[key]);
  },level);
  const selects=page.locator('#f1Panel .f2-select-group select');
  assert.equal(await selects.count(),input.length,'Actual bus fields must match CEFR');
  for(let i=0;i<input.length;i++)await selects.nth(i).selectOption(input[i]);
  await page.locator('#f1Panel .f2-actions button.primary').click();
 }else if(n===6){
  const steps=await page.evaluate(l=>window.CityQuestF2Engine.repairStages(l),level);
  const expected=['turn','left','south','apology'];
  for(let phase=0;phase<steps;phase++){
   const index=await page.evaluate(({language,level,phase,correct})=>{
    const G=window.CityQuestF2Engine;
    let values;
    if(phase===0)values=['straight','turn','distance'];
    if(phase===1)values=['left','keep-south','west'];
    if(phase>=2){
     const found=document.querySelector('script').textContent.match(/^  const advancedPractice=(.*);$/m);
     const practice=JSON.parse(found[1])[language].repair;
     values=(phase===2?practice.reason:practice.apology[level]).options.map(x=>x[0]);
    }
    return G.orderChoices(values.map(value=>({value,label:value})),
      language,level,6,phase).findIndex(x=>x.value===correct);
   },{language,level,phase,correct:expected[phase]});
   await choiceByIndex(page,index);
  }
 }else if(n===8){
  const plan=await planCity(page,8,level);
  let start=0;
  for(const end of plan.checkpoints){
   await walking(page,plan.directions.slice(start,end));
   start=end;
   const confirm=page.locator('#f1Panel .f2-actions button.primary');
   assert.equal(await confirm.count(),1,'Checkpoint must require oral self-check');
   await confirm.click();
  }
 }else throw Error('Unknown city mission '+n);
 assert.equal(await page.locator('#f1Panel .f2-finish').count(),1,
  'Expected visible completion for city '+n+'/'+language+'/'+level);
 await progress(page,n,'CITY '+n);
}
async function metroMission(page,language,level,n){
 await page.locator('#f1Stations button').nth(n-1).click();
 const bridge=()=>page.evaluate(()=>window.CityQuestF2MetroBridge.current());
 const maxActions=75,counts={};
 for(let i=0;i<maxActions;i++){
  const state=await bridge();
  assert.equal(state.stationNumber,n,'Metro scenario mismatch');
  const phase=state.phase;
  counts[phase]=(counts[phase]||0)+1;
  if(phase==='complete')break;
  if(['walk-to-entrance','walk-to-museum'].includes(phase)){
   const dest=await page.evaluate(p=>p==='walk-to-entrance'?window.RivertonMetroGame.portalStart:window.RivertonMetroGame.museum,phase);
   const route=[];
   let x=state.surface.c,y=state.surface.r;
   while(x<dest.c){route.push('east');x++;}
   while(x>dest.c){route.push('west');x--;}
   while(y<dest.r){route.push('south');y++;}
   while(y>dest.r){route.push('north');y--;}
   assert.ok(route.length>0,'Unexpected empty walk '+n);
   await walking(page,route);continue;
  }
  if(['enter','notice','board','checkpoint','speech'].includes(phase)){
   await page.locator('#f1Panel .f2-actions button.primary').click();continue;
  }
  if(['select-line','select-direction','select-platform'].includes(phase)){
   const index=await page.evaluate(({language,level,n,phase})=>{
    const MG=window.RivertonMetroGame,G=window.CityQuestF2Engine,
      s=window.CityQuestF2MetroBridge.current(),leg=MG.scenario(s).legs[s.legIndex];
    const expected=phase==='select-line'?leg.line:
      phase==='select-direction'?MG.desiredDirection(s):String(MG.platform(s));
    const opts=MG.options(s);
    const ordered=phase==='select-platform'?opts:G.orderChoices(opts,language,level,n,phase);
    return ordered.findIndex(x=>String(x.value)===String(expected));
   },{language,level,n,phase});
   await choiceByIndex(page,index);continue;
  }
  if(phase==='ride'){
   const type=await page.evaluate(()=>{
    const MG=window.RivertonMetroGame,s=window.CityQuestF2MetroBridge.current(),
      route=MG.scenario(s),leg=route.legs[s.legIndex];
    if(s.metroStation===leg.stops.at(-1))
     return s.legIndex<route.legs.length-1?'TRANSFER_HERE':'EXIT_HERE';
    return 'NEXT_STOP';
   });
   const label=await page.evaluate(({language,level,n,type})=>
     window.RivertonMetroLanguage.pack(language,level,n).actions[type],{language,level,n,type});
   const b=page.locator('#f1Panel .f2-actions button').filter({hasText:label});
   assert.ok(await b.count()>=1,'Missing metro control '+type);
   await b.first().click();continue;
  }
  if(phase==='transfer'){
   const index=await page.evaluate(({language,level,n})=>{
    const MG=window.RivertonMetroGame,G=window.CityQuestF2Engine,M=window.RivertonMetro,
      s=window.CityQuestF2MetroBridge.current(),lines=M.joined(s.metroStation),
      next=MG.scenario(s).legs[s.legIndex+1].line;
    return G.orderChoices(lines.map(value=>({value,label:value})),
      language,level,n,'transfer').findIndex(x=>x.value===next);
   },{language,level,n});
   await choiceByIndex(page,index);continue;
  }
  if(phase==='exit'){
   const index=await getCityChoiceIndex(page,language,level,n,'exit',
     ['exit','continue'],'exit');
   await choiceByIndex(page,index);continue;
  }
  throw Error('Unhandled Metro phase '+n+'/'+phase);
 }
 const last=await bridge();
 assert.equal(last.phase,'complete','Metro not complete within action cap; phases '+JSON.stringify(counts));
 assert.equal(last.completed,true,'Metro complete must be true');
 assert.equal(await page.locator('#f1Panel .f2-finish').count(),1,'Metro finish missing');
 await progress(page,n,'METRO '+n);
 return counts;
}
test('40 complete City Quest language/CEFR/mode routes; 8 missions per journey', {timeout:900000}, async t=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const c of SELECTED){
   await t.test('E2E '+caption(c),{timeout:180000},async()=>{
    const page=await browser.newPage({viewport:{width:1280,height:900}});
    page.setDefaultTimeout(4500);
    let attemptedMission=0;
    console.log('BEGIN '+caption(c));
    const errors=[],requests=[],start=Date.now(),metroCounts={};
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/')&&!r.url().startsWith('data:'))requests.push(r.url());});
    try{
     await page.goto(BASE+'?lang='+c.language+'&level='+c.level,{waitUntil:'load'});
     await page.locator('#f1Stations button').first().waitFor();
     assert.equal(await page.locator('#f2Language').inputValue(),c.language);
     assert.equal(await page.locator('#f2Level').inputValue(),c.level);
     if(c.mode==='mixed'){
      await page.locator('#metroPilotToggle').click();
      assert.equal(await page.locator('#metroPilotToggle').getAttribute('aria-pressed'),'true');
     }else assert.equal(await page.locator('#cityOnlyToggle').getAttribute('aria-pressed'),'true');
     for(let n=1;n<=8;n++){
      attemptedMission=n;
      if(c.mode==='mixed'&&n>=5)
       metroCounts[n]=await metroMission(page,c.language,c.level,n);
      else await cityMission(page,c.language,c.level,n);
     }
     await progress(page,8,'Final '+caption(c));
     assert.deepEqual(errors,[],'Browser errors '+caption(c));
     assert.deepEqual(requests,[],'Remote requests '+caption(c));
     cases.push({...c,pass:true,missions:8,elapsedMs:Date.now()-start,metroPhases:metroCounts});
     console.log('PASS '+caption(c)+' / 8 missions');
    }catch(error){
     cases.push({...c,pass:false,failedAtMission:attemptedMission,missionsCompleted:(await page.locator('#f1ProgressTrack').getAttribute('aria-valuenow').catch(()=>'?')),
       elapsedMs:Date.now()-start,error:String(error),browserErrors:errors,externalRequests:requests});
     console.error('FAIL '+caption(c)+' '+String(error));
     throw error;
    }finally{await page.close();}
   });
  }
 }finally{
  await browser.close();
  fs.writeFileSync(REPORT,JSON.stringify({
   schema:'city-quest-40-journey-e2e-v1',
   variantCount:TARGETS.length,
   runCount:SELECTED.length,
   filter:FILTER||null,
   passed:cases.filter(x=>x.pass).length,
   failed:cases.filter(x=>!x.pass).length,
   totalCompletedMissions:cases.filter(x=>x.pass).reduce((n,x)=>n+x.missions,0),
   sha:process.env.GITHUB_SHA||null,
   cases
  },null,2)+'\n','utf8');
 }
 assert.equal(cases.length,SELECTED.length,'All selected journeys must run');
 assert.equal(cases.filter(x=>x.pass).length,SELECTED.length,'Every selected journey must pass');
});
