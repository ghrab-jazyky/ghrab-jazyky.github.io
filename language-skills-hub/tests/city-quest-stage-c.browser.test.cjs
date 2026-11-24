#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const BASE='http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html';
const LANG=['en','es','de','fr'],LEVEL=['B2','C1','C2'];
const alternative={
 5:[{line:'M2',direction:'north_park',platform:'3',stops:['central_station','university'],names:'Central Station → University'},
    {line:'M3',direction:'harbour',platform:'3',stops:['university','science_centre','museum_quarter'],names:'University → Science Centre → Museum Quarter'}],
 6:[{line:'M2',direction:'north_park',platform:'1',stops:['market_square','central_station'],names:'Market Square → Central Station'},
    {line:'M1',direction:'east_gardens',platform:'2',stops:['central_station','old_town','museum_quarter'],names:'Central Station → Old Town → Museum Quarter'},
    {line:'M3',direction:'harbour',platform:'3',stops:['museum_quarter','stadium'],names:'Museum Quarter → Stadium'}]
};
const review={B2:{values:['exact','extraStop','extraTransfer'],answer:'exact'},C1:{values:['ignore','adapt','assume'],answer:'adapt'},C2:{values:['guarantee','unsupported','verified'],answer:'verified'}};
const city={B2:{values:['irrelevant','match','misread'],answer:'match'},C1:{values:['clarify','assume','irrelevant'],answer:'clarify'},C2:{values:['collapse','ignore','reconcile'],answer:'reconcile'}};
async function open(browser,lang,level,width=1280,height=900){
 const page=await browser.newPage({viewport:{width,height}}),errors=[],remote=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/')&&!r.url().startsWith('data:'))remote.push(r.url());});
 await page.goto(BASE+'?lang='+lang+'&level='+level,{waitUntil:'load'});
 await page.locator('#f1Stations button').first().waitFor();
 return {page,errors,remote};
}
async function choose(page,lang,level,n,stage,values,expected,selector='#f1Panel .f2-choice-list button'){
 const index=await page.evaluate(({lang,level,n,stage,values,expected})=>{
  const G=window.CityQuestF2Engine;
  return G.orderChoices(values.map(value=>({value,label:value})),lang,level,n,stage).findIndex(x=>x.value===expected);
 },{lang,level,n,stage,values,expected});
 assert.ok(index>=0,'Expected semantic choice '+expected);
 assert.equal(await page.locator(selector).count(),values.length);
 await page.locator(selector).nth(index).click();
}
const bridge=page=>page.evaluate(()=>window.CityQuestF2MetroBridge.current());
async function action(page,lang,level,n,type){
 const label=await page.evaluate(({lang,level,n,type})=>window.RivertonMetroLanguage.pack(lang,level,n).actions[type],{lang,level,n,type});
 await page.locator('#f1Panel .f2-actions').getByRole('button',{name:label,exact:true}).click();
}
async function metroChoice(page,lang,level,n,phase,value){
 const values=await page.evaluate(()=>{
  const state=window.CityQuestF2MetroBridge.current();
  return window.RivertonMetroGame.options(state).map(x=>x.value);
 });
 if(phase==='select-platform'){
  const index=values.indexOf(value);
  assert.ok(index>=0);
  await page.locator('#f1Panel .f2-choice-list button').nth(index).click();
 }else await choose(page,lang,level,n,phase,values,value);
}
test('C1 route alternatives: all 24 language/level/mission journeys use independent fixed station and platform fixtures',{timeout:300000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const lang of LANG)for(const level of LEVEL)for(const n of [5,6]){
   const {page,errors,remote}=await open(browser,lang,level);
   const key=lang+'/'+level+'/'+n;
   try{
    await page.locator('#metroPilotToggle').click();
    await page.locator('#f1Stations button').nth(n-1).click();
    const legs=alternative[n];
    for(let i=0;i<legs.length;i++){
     const leg=legs[i];
     if(i===0)await metroChoice(page,lang,level,n,'select-line',leg.line);
     else{
      await action(page,lang,level,n,'TRANSFER_HERE');
      assert.equal((await bridge(page)).phase,'transfer',key+' transfer');
      const joined=await page.evaluate(()=>{
       const s=window.CityQuestF2MetroBridge.current();
       return window.RivertonMetro.joined(s.metroStation);
      });
      await choose(page,lang,level,n,'transfer',joined,leg.line);
     }
     assert.equal((await bridge(page)).phase,'select-direction',key);
     await metroChoice(page,lang,level,n,'select-direction',leg.direction);
     const board=page.locator('.metro-platform-board');
     assert.equal(await board.isVisible(),true,key+' independent departure board');
     assert.ok((await board.innerText()).includes(leg.line),key);
     await metroChoice(page,lang,level,n,'select-platform',leg.platform);
     await action(page,lang,level,n,'BOARD');
     for(const station of leg.stops.slice(1)){
      await action(page,lang,level,n,'NEXT_STOP');
      assert.equal((await bridge(page)).metroStation,station,key+' physical stop');
     }
    }
    await action(page,lang,level,n,'EXIT_HERE');
    await choose(page,lang,level,n,'exit',['exit','continue'],'exit');
    assert.equal((await bridge(page)).phase,'speech',key);
    assert.equal((await bridge(page)).routeVariant,1,key);
    const section=page.locator('.cq-route-review[data-cq-review-level]');
    assert.equal(await section.getAttribute('data-cq-review-level'),level,key);
    const plan=review[level],wrong=plan.values.find(v=>v!==plan.answer);
    await choose(page,lang,level,n,'route-review',plan.values,wrong);
    assert.equal((await bridge(page)).reviewPassed,false,key);
    assert.equal((await bridge(page)).completed,false,key);
    await choose(page,lang,level,n,'route-review',plan.values,plan.answer);
    assert.equal((await bridge(page)).reviewPassed,true,key);
    await action(page,lang,level,n,'SELF_CHECK');
    assert.equal((await bridge(page)).completed,true,key);
    await page.locator('#f1Panel .f2-help button').first().click();
    const sample=await page.locator('#f1Panel [data-cq-model-answer]').innerText();
    assert.ok(sample.length>250,key+' continuous language sample');
    assert.doesNotMatch(sample,/→|undefined/);
    assert.ok(sample.includes(legs[0].line)&&sample.includes(legs[0].direction==='north_park'?'North Park':legs[0].direction),key+' sample first service');
    assert.ok(await page.locator('#f1Panel [data-cq-journey-record]').isVisible(),key+' separate ledger');
    const model=await page.locator('#f1Panel [data-cq-journey-record]').innerText();
    for(const leg of legs)assert.ok(model.includes(leg.names),key+' model missing actual leg '+leg.names);
    if(n===6)assert.ok(!model.includes('Central Station → University'),key+' canonical route leaked into actual model');
    assert.deepEqual(errors,[],key+' JS errors');assert.deepEqual(remote,[],key+' network');
   }finally{await page.close();}
  }
 }finally{await browser.close();}
});
test('C2 city decision: objective gates differ by CEFR, reject an incorrect response and reset correctly',{timeout:180000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const lang of LANG)for(const level of LEVEL){
   const {page,errors}=await open(browser,lang,level,390,844);
   const key=lang+'/'+level;
   try{
    await page.locator('#f1Stations button').nth(2).click();
    await choose(page,lang,level,3,'start',['help','vague','wrong'],'help');
    await choose(page,lang,level,3,'distance',['distance','nohelp'],'distance');
    assert.equal(await page.locator('.cq-city-decision').getAttribute('data-cq-city-decision'),level,key);
    assert.match(await page.locator('#f1ProgressText').innerText(),/0\s*\/\s*8/);
    const plan=city[level];
    await choose(page,lang,level,3,'city-evidence',plan.values,plan.values.find(x=>x!==plan.answer));
    assert.match(await page.locator('#f1ProgressText').innerText(),/0\s*\/\s*8/);
    await choose(page,lang,level,3,'city-evidence',plan.values,plan.answer);
    assert.match(await page.locator('#f1ProgressText').innerText(),/1\s*\/\s*8/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,key);
    await page.locator('#resetBtn').click();
    assert.match(await page.locator('#f1ProgressText').innerText(),/0\s*\/\s*8/);
    assert.equal(await page.locator('.cq-city-decision').count(),0,key);
    assert.deepEqual(errors,[],key);
   }finally{await page.close();}
  }
 }finally{await browser.close();}
});
test('C3 guided route: A2-C2 relative instructions no longer disclose compass answer after first step',{timeout:90000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const compass={en:/\b(north|south|east|west)\b/i,es:/\b(norte|sur|este|oeste)\b/i,de:/\b(Norden|Süden|Osten|Westen)\b/i,fr:/\b(nord|sud|est|ouest)\b/i};
 try{
  const {page,errors}=await open(browser,'en','B2');
  try{
   const instructions=await page.evaluate(()=>{
    const C=window.CityQuestF2Content,G=window.CityQuestF2Engine,result=[];
    for(const lang of ['en','es','de','fr'])for(const level of ['A2','B1','B2','C1','C2']){
     const plan=G.guidedPaths[level];
     result.push({lang,level,first:G.instruction(C.pack(lang),level,0),rest:plan.slice(1).map((_,i)=>G.instruction(C.pack(lang),level,i+1))});
    }
    return result;
   });
   assert.equal(instructions.length,20);
   for(const item of instructions){
    assert.ok(compass[item.lang].test(item.first),item.lang+'/'+item.level+' first heading');
    for(const phrase of item.rest)assert.doesNotMatch(phrase,compass[item.lang],item.lang+'/'+item.level+' compass leak');
   }
   assert.deepEqual(errors,[]);
  }finally{await page.close();}
 }finally{await browser.close();}
});
