#!/usr/bin/env node
'use strict';
// Stage B: human-declared speaking reflection, no microphone or automatic grade.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const BASE='http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html';
const languages=['en','es','de','fr'],levels=['B2','C1','C2'];
async function open(browser,lang,level,width=390,height=844){
 const page=await browser.newPage({viewport:{width,height}});
 const errors=[],remote=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console.error '+m.text());});
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/')&&!r.url().startsWith('data:'))remote.push(r.url());});
 await page.goto(BASE+'?lang='+lang+'&level='+level,{waitUntil:'load'});
 await page.locator('#f1Stations button').first().waitFor();
 return {page,errors,remote};
}
async function inspect(page){
 const oral=page.locator('.cq-advanced-oracy');
 if(!await oral.evaluate(e=>e.open))await oral.locator(':scope > summary').click();
 const details=page.locator('.cq-advanced-oracy-criteria');
 await details.locator('summary').click();
 const inputs=page.locator('.cq-oracy-review-list input[type=checkbox]');
 assert.equal(await inputs.count(),3);
 return {inputs,progress:page.locator('[data-cq-review-progress]')};
}
test('Stage B: 4 languages x B2/C1/C2 have native, ungraded, optional checks',{timeout:180000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const lang of languages)for(const level of levels){
   const {page,errors,remote}=await open(browser,lang,level);
   try{
    const {inputs,progress}=await inspect(page);
    assert.match(await progress.innerText(),/0\/3/);
    await inputs.nth(0).check();
    await inputs.nth(2).check();
    assert.match(await progress.innerText(),/2\/3/);
    assert.equal(await page.locator('[data-cq-partner-confirm]').count(),0);
    await page.locator('#f1Stations button').nth(1).click();
    await page.locator('#f1Stations button').first().click();
    const again=await inspect(page);
    assert.equal(await again.inputs.nth(0).isChecked(),true);
    assert.equal(await again.inputs.nth(1).isChecked(),false);
    assert.equal(await again.inputs.nth(2).isChecked(),true);
    await page.locator('#resetBtn').click();
    const reset=await inspect(page);
    assert.equal(await reset.inputs.nth(0).isChecked(),false);
    assert.match(await reset.progress.innerText(),/0\/3/);
    assert.deepEqual(errors,[],lang+'/'+level+' browser error');
    assert.deepEqual(remote,[],lang+'/'+level+' network request');
   }finally{await page.close();}
  }
 }finally{await browser.close();}
});
test('Stage B: partner confirmation is separate and cleared by practice-mode switch',{timeout:90000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const {page,errors,remote}=await open(browser,'en','B2');
  try{
   await page.locator('#f1Pair').click();
   await inspect(page);
   const peer=page.locator('[data-cq-partner-confirm]');
   assert.equal(await peer.count(),1);
   await peer.check();
   assert.equal(await peer.isChecked(),true);
   await page.locator('#f1Solo').click();
   assert.equal(await page.locator('[data-cq-partner-confirm]').count(),0);
   await page.locator('#f1Pair').click();
   await inspect(page);
   assert.equal(await page.locator('[data-cq-partner-confirm]').isChecked(),false);
   assert.deepEqual(errors,[]);
   assert.deepEqual(remote,[]);
  }finally{await page.close();}
 }finally{await browser.close();}
});
test('Stage B: late spoken self-report prompts world reset; metro records do not leak to city',{timeout:90000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const {page,errors,remote}=await open(browser,'en','B2');
  try{
   await page.locator('#f1Stations button').nth(4).click();
   const city=await inspect(page);
   await city.inputs.first().check();
   await page.locator('#metroPilotToggle').click();
   assert.equal(await page.locator('#cqModeConfirm').isVisible(),true);
   await page.locator('#cqModeApply').click();
   await page.waitForFunction(()=>document.getElementById('metroPilotToggle')?.getAttribute('aria-pressed')==='true');
   assert.equal(await page.locator('#metroPilotToggle').getAttribute('aria-pressed'),'true');
   const metro=await inspect(page);
   assert.match(await metro.progress.innerText(),/0\/3/);
   await metro.inputs.first().check();
   await page.locator('#cityOnlyToggle').click();
   assert.equal(await page.locator('#cqModeConfirm').isVisible(),true);
   await page.locator('#cqModeApply').click();
   await page.waitForFunction(()=>document.getElementById('cityOnlyToggle')?.getAttribute('aria-pressed')==='true');
   const cityAgain=await inspect(page);
   assert.match(await cityAgain.progress.innerText(),/0\/3/);
   assert.deepEqual(errors,[]);
   assert.deepEqual(remote,[]);
  }finally{await page.close();}
 }finally{await browser.close();}
});
test('Stage B: 320px and 200% text still allow keyboard-accessible reflection',{timeout:90000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const lang of ['de','fr']){
   const {page,errors}=await open(browser,lang,'C2',320,780);
   try{
    const {inputs}=await inspect(page);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.evaluate(()=>document.documentElement.style.fontSize='200%');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await inputs.first().focus();
    await page.keyboard.press('Space');
    assert.equal(await inputs.first().isChecked(),true);
    assert.deepEqual(errors,[]);
   }finally{await page.close();}
  }
 }finally{await browser.close();}
});
test('Stage B: negative city-route feedback and B2 wrong turn are localized in four languages',{timeout:240000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const expectedVia={
  en:'Before reaching the destination, you still need to pass through Market Square.',
  es:'Antes de llegar al destino, todavía tienes que pasar por la Plaza del Mercado.',
  de:'Bevor du das Ziel erreichst, musst du noch über den Marktplatz gehen.',
  fr:"Avant d'arriver, vous devez encore passer par la place du Marché."
 };
 try{
  for(const lang of languages){
   const {page,errors,remote}=await open(browser,lang,'B2',1280,900);
   try{
    await page.locator('#f1Stations button').nth(1).click();
    const bypass=await page.evaluate(()=>{
     const G=window.CityQuestF2Engine,E=window.CityQuestEngine,F=window.CityQuestF1Engine;
     const cfg=G.config('B2'),same=(a,b)=>a.c===b.c&&a.r===b.r;
     const queue=[[E.start,[]]],seen=new Set();
     while(queue.length){
      const [at,steps]=queue.shift(),key=at.c+','+at.r;
      if(seen.has(key))continue;seen.add(key);
      if(same(at,cfg.target))return steps;
      for(const d of ['north','east','south','west']){
       const next=F.nextFromDirection(at,d);
       if(!E.isNode(next)||cfg.via.some(v=>same(v,next)))continue;
       queue.push([next,steps.concat(d)]);
      }
     }
     throw Error('No route around a mandatory via point');
    });
    assert.ok(bypass.length>=3);
    for(const d of bypass)await page.locator('.f2-quick-'+d).click();
    const via=await page.locator('#f1Panel .f2-status').innerText();
    assert.equal(via,expectedVia[lang],lang+' exact required-waypoint message');
    await page.locator('#f1Stations button').nth(3).click();
    const route=await page.evaluate(()=>window.CityQuestF2Engine.guidedPaths.B2);
    for(const d of route)await page.locator('.f2-quick-'+d).click();
    const wrong=await page.evaluate(lang=>{
     const source=document.querySelector('script').textContent;
     const m=source.match(/^\s*const advancedPractice=(\{.*\});$/m);
     const questions=JSON.parse(m[1])[lang].guided.B2;
     const G=window.CityQuestF2Engine;
     const ordered=G.orderChoices(questions.options.map(([value,label])=>({value,label})),lang,'B2',4,'explain');
     return ordered.findIndex(x=>x.value==='right');
    },lang);
    assert.ok(wrong>=0);
    await page.locator('#f1Panel .f2-choice-list button').nth(wrong).click();
    const expected=await page.evaluate(lang=>{
     const source=document.querySelector('script').textContent;
     const m=source.match(/^\s*const cqGuidedFeedback=(\{.*\});$/m);
     return JSON.parse(m[1])[lang].B2;
    },lang);
    assert.equal(await page.locator('#f1Panel .f2-status').innerText(),expected,lang+' incorrect turn feedback');
    assert.deepEqual(errors,[],lang);
    assert.deepEqual(remote,[],lang);
   }finally{await page.close();}
  }
 }finally{await browser.close();}
});


test('GA-FIX 4: independent negative city paths, undo, switching, restart, closure and ordered checkpoints',{timeout:180000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const undo={en:'Previous walking step undone.',de:'Der letzte Schritt wurde rückgängig gemacht.'};
 const closed={en:'That street is closed. Find an open route.',de:'Die Straße ist gesperrt. Finde einen offenen Weg.'};
 const wrong={en:'Your move does not match the current instruction. Check it again.',de:'Dieser Schritt passt nicht zur aktuellen Anweisung. Lies sie noch einmal.'};
 const station=async(page,n)=>page.locator('#f1Stations button').nth(n-1).click();
 const move=async(page,dirs)=>{for(const d of dirs)await page.locator('.f2-quick-'+d).click();};
 const status=page=>page.locator('#f1Panel .f2-status').innerText();
 const points=page=>page.locator('#f2MapRoute').getAttribute('points');
 const progress=page=>NumberFromProgress(page);
 async function NumberFromProgress(page){return Number(await page.locator('#f1ProgressTrack').getAttribute('aria-valuenow'));}
 try{
  for(const lang of ['en','de']){
   const {page,errors,remote}=await open(browser,lang,'B2',1366,768);
   try{
    await station(page,2);
    const start=await points(page);
    await move(page,['north','north','east','east','east']);
    assert.equal(await progress(page),0,'CN-M02-noVia');
    assert.match(await status(page),lang==='en'?/Market Square/:/den Marktplatz gehen/);
    const beforeUndo=await points(page);
    await page.locator('#f2Quick .f2-hud-undo').click();
    const afterUndo=await points(page);
    assert.notEqual(afterUndo,beforeUndo,'CN-M02-undo');
    assert.equal(afterUndo.trim().split(/\s+/).length,beforeUndo.trim().split(/\s+/).length-1);
    assert.equal(await status(page),undo[lang]);
    await station(page,3);await station(page,2);
    assert.equal(await points(page),afterUndo,'CN-M02-switchback');
    await page.locator('#resetBtn').click();
    assert.equal(await points(page),start,'CN-M02-restart');
    await page.goto(BASE+'?lang='+lang+'&level=C2',{waitUntil:'load'});
    await station(page,2);
    await move(page,['east','east']);
    const atClosure=await points(page);
    await move(page,['east']);
    assert.equal(await points(page),atClosure,'CN-M02-closure');
    assert.equal(await status(page),closed[lang]);
    await station(page,4);
    const guidedStart=await points(page);
    await move(page,['east']);
    assert.equal(await points(page),guidedStart,'CN-M04-wrong');
    assert.equal(await status(page),wrong[lang]);
    await station(page,8);
    await move(page,['north']);
    assert.equal(await status(page),lang==='en'?'Walking step recorded.':'Wegschritt ausgeführt.','Neutral walking feedback');
    await move(page,['north','east','east','east','east','south']);
    assert.equal(await status(page),lang==='en'?'Visit Market Square first.':'Besuche zuerst Marktplatz.','Required order feedback');
    assert.equal(await page.locator('#f1Panel .f2-actions button.primary').count(),0,'CN-M08-order');
    assert.equal(await progress(page),0);
    // A2 has no advanced follow-up review; finish and replay through real UI.
    await page.goto(BASE+'?lang='+lang+'&level=A2',{waitUntil:'load'});
    async function explore(){
     for(let round=0;round<4;round++){
      const index=await page.evaluate(({lang,round})=>{
       const G=window.CityQuestF2Engine,F=window.CityQuestF1Engine,q=F.explore[round];
       return G.orderChoices(G.exploreChoices(q,'A2',round),lang,'A2',1,round).indexOf(q.correct);
      },{lang,round});
      assert.ok(index>=0);await page.locator('#f1Panel .f2-choice-list button').nth(index).click();
     }
    }
    await explore();assert.equal(await progress(page),1);
    await page.locator('#resetBtn').click();
    assert.equal(await progress(page),0,'CN-M01-restartAfterDone');
    await explore();assert.equal(await progress(page),1,'ST-replay does not double-count');
    assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
   }finally{await page.close();}
  }
 }finally{await browser.close();}
});
