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
const D1_A11Y=process.env.CQ_D1_A11Y==='1';
const D1_AXE=D1_A11Y?require('axe-core'):null;
const d1Evidence=[];
const museumLabels={en:['City Museum','CITY MUSEUM'],es:['Museo de la Ciudad','MUSEO DE LA CIUDAD'],
 de:['Stadtmuseum','STADTMUSEUM'],fr:['Musée municipal','MUSÉE MUNICIPAL']};
async function auditSummary(page,c){
 const label=caption(c);
 for(const theme of ['dark','light']){
  const current=await page.evaluate(()=>document.documentElement.dataset.theme||'dark');
  if(current!==theme)await page.locator('#themeBtn').click();
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme||'dark'),theme);
  for(const width of [320,1280]){
   await page.setViewportSize({width,height:width===320?780:900});
   const evidence=await page.evaluate(async()=>{
    const root=document.querySelector('.cq-completion-summary');
    const result=await window.axe.run(root,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});
    const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number);
    const lum=s=>rgb(s).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
    const bg=getComputedStyle(root).backgroundColor,ratios=[...root.querySelectorAll('p,li,h3,h4')].map(el=>{
     const fg=getComputedStyle(el).color,l1=lum(bg),l2=lum(fg);
     return {text:el.textContent.slice(0,90),ratio:(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)};
    });
    return {overflow:document.documentElement.scrollWidth>innerWidth+1,
      violations:result.violations.map(v=>({id:v.id,nodes:v.nodes.map(x=>x.target)})),ratios};
   });
   d1Evidence.push({label,theme,width,...evidence});
   assert.deepEqual(evidence.violations,[],label+' '+theme+'/'+width);
   assert.equal(evidence.overflow,false,label+' overflow');
   assert.ok(evidence.ratios.every(r=>r.ratio>=4.5),label+' contrast '+JSON.stringify(evidence.ratios));
  }
 }
 await page.emulateMedia({forcedColors:'active'});
 assert.equal(await page.locator('.cq-completion-summary').isVisible(),true);
 assert.equal(await page.evaluate(()=>matchMedia('(forced-colors: active)').matches),true);
 await page.emulateMedia({forcedColors:'none'});
}

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
    const source=(Array.from(document.scripts).find(s=>s.textContent.includes('  const advancedPractice='))?.textContent||'');
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
   return fields.map(key=>key==='stop'?service.to:service[key]);
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
     const found=(Array.from(document.scripts).find(s=>s.textContent.includes('  const advancedPractice='))?.textContent||'').match(/^  const advancedPractice=(.*);$/m);
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
 if([1,3].includes(n)&&['B2','C1','C2'].includes(level)){
  const plans={B2:{values:['irrelevant','match','misread'],answer:'match'},
    C1:{values:['clarify','assume','irrelevant'],answer:'clarify'},
    C2:{values:['collapse','ignore','reconcile'],answer:'reconcile'}};
  const plan=plans[level];
  assert.equal(await page.locator('.cq-city-decision').count(),1);
  await choiceByIndex(page,await getCityChoiceIndex(page,language,level,n,'city-evidence',plan.values,plan.answer));
 }
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
  if(phase==='speech'&&['B2','C1','C2'].includes(level)&&!state.reviewPassed){
   const plans={B2:{values:['exact','extraStop','extraTransfer'],answer:'exact'},
    C1:{values:['ignore','adapt','assume'],answer:'adapt'},
    C2:{values:['guarantee','unsupported','verified'],answer:'verified'}};
   const plan=plans[level];
   assert.equal(await page.locator('.cq-route-review[data-cq-review-level]').count(),1);
   await choiceByIndex(page,await getCityChoiceIndex(page,language,level,n,'route-review',plan.values,plan.answer));
   continue;
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
    const page=await browser.newPage({viewport:{width:D1_A11Y?320:1280,height:D1_A11Y?780:900},bypassCSP:D1_A11Y});
    page.setDefaultTimeout(4500);
    let attemptedMission=0;
    console.log('BEGIN '+caption(c));
    const errors=[],requests=[],start=Date.now(),metroCounts={};
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push('console.error '+m.text());});
    page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/')&&!r.url().startsWith('data:'))requests.push(r.url());});
    try{
     await page.goto(BASE+'?lang='+c.language+'&level='+c.level,{waitUntil:'load'});
     await page.locator('#f1Stations button').first().waitFor();
     if(D1_A11Y)await page.addScriptTag({content:D1_AXE.source});
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
     assert.equal(await page.locator('.cq-completion-summary').count(),1,'Final summary '+caption(c));
     assert.equal(await page.locator('.cq-completed-missions li').count(),8);
     assert.ok(await page.locator('.cq-completion-vocabulary li').count()>=8);
     if(c.mode==='mixed'){
      const [hud,visible]=museumLabels[c.language],museum=page.locator('[data-landmark-label="CITY MUSEUM"]');
      assert.equal(await museum.locator('text').textContent(),visible,'Localized map building');
      assert.equal(await museum.getAttribute('aria-label'),visible,'Localized accessible building');
      assert.equal(await page.locator('#mapLocation').textContent(),hud,'Actual localized final HUD');
      await page.locator('#f1Panel .f2-help button').first().click();
      const prose=await page.locator('[data-cq-model-answer]').innerText(),record=await page.locator('[data-cq-journey-record]').innerText();
      assert.ok(prose.includes('Market Square')&&prose.includes('University')&&prose.includes('Museum Quarter')&&prose.toLocaleLowerCase(c.language).includes(hud.toLocaleLowerCase(c.language)));
      assert.doesNotMatch(prose,/→|undefined/);
      assert.match(record,/→/);
      if(c.language!=='en')assert.doesNotMatch(prose,/City Museum/);
     }
     if(D1_A11Y)await auditSummary(page,c);
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
   d1A11y:D1_A11Y,d1Evidence,
   cases
  },null,2)+'\n','utf8');
 }
 assert.equal(cases.length,SELECTED.length,'All selected journeys must run');
 assert.equal(cases.filter(x=>x.pass).length,SELECTED.length,'Every selected journey must pass');
});
