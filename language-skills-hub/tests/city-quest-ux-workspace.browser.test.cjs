#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const pw=require('playwright'),engine=process.env.CQ_UX_ENGINE||'chromium';
const BASE='http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html';
const desktop=[{width:1366,height:768},{width:1280,height:720},{width:1920,height:1080}];
const mobile=[{width:320,height:780},{width:390,height:844},{width:768,height:1024},{width:844,height:390}];
const evidence=process.env.CQ_UX_EVIDENCE;
// WebKit's Playwright screenshot implementation itself injects a stylesheet blocked by strict CSP.
// Functional and geometry assertions run unchanged on WebKit, WITHOUT screenshot instrumentation.
// Chromium/Firefox produce visual evidence; no browser context bypasses CSP in this suite.
if(engine==='webkit')console.log('Strict WebKit acceptance: screenshot instrumentation disabled (all functional tests still execute).');
async function launch(){return pw[engine].launch(engine==='chromium'?{headless:true,args:['--no-sandbox']}:{headless:true});}
async function open(browser,lang,level,viewport,hasTouch=false){
 const page=await browser.newPage({viewport,reducedMotion:'reduce',hasTouch}),errors=[],remote=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/')&&!r.url().startsWith('data:'))remote.push(r.url());});
 await page.goto(BASE+'?lang='+lang+'&level='+level,{waitUntil:'load'});
 await page.locator('#f1Stations button').first().waitFor();
 assert.deepEqual(errors,[],'Unexpected console errors before any screenshots');
 return {page,errors,remote};
}
async function frame(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function capture(page,name){if(!evidence||engine==='webkit')return;fs.mkdirSync(evidence,{recursive:true});await page.screenshot({path:evidence+'/'+engine+'-'+name+'.png',timeout:10000});}
async function box(page,selector){const r=await page.locator(selector).boundingBox();assert.ok(r,'Visible '+selector);return r;}
async function fits(page,selector){
 const r=await box(page,selector),v=page.viewportSize();
 assert.ok(r.x>=-2&&r.y>=-2&&r.x+r.width<=v.width+2&&r.y+r.height<=v.height+3,selector+' outside viewport '+JSON.stringify({r,v}));
 return r;
}
async function noOverflow(page){const g=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth}));assert.ok(g.sw<=g.w+1,'Document horizontal overflow '+JSON.stringify(g));}
async function labelMedian(page,selector){
 const result=await page.locator(selector).evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().height).filter(x=>x>0).sort((a,b)=>a-b));
 assert.ok(result.length>=8,'Map label sample '+selector);
 return result[Math.floor(result.length/2)];
}
async function networkReadability(page){
 await frame(page);
 const map=page.locator('#metroNetworkViewport');
 assert.equal(await map.evaluate(n=>n.classList.contains('overview')),false,'Readable detail must be the default');
 assert.ok(await labelMedian(page,'#metroNetworkSvg .metro-station-label')>=11,'Station labels are unreadably small');
 const zoom=page.locator('#metroMapZoom');
 await zoom.scrollIntoViewIfNeeded();
 assert.equal(await zoom.evaluate(b=>{const r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true,'Map zoom control is covered');
 const view=page.viewportSize();
 if(view.width>1050&&view.height>=680){
  const visible=await map.evaluate(n=>{const r=n.getBoundingClientRect(),c=n.closest('.metro-network-card').getBoundingClientRect(),header=n.previousElementSibling.getBoundingClientRect();return Math.max(0,Math.min(r.bottom,c.bottom,innerHeight)-Math.max(r.top,c.top,header.bottom,0));});
  assert.ok(visible>=180,'Too little actual visible network viewport: '+visible);
 }
}
async function primaryReach(page){
 const p=page.locator('#f1Panel .f2-choice-list button:not(:disabled), #f1Panel .f2-actions button.primary:not(:disabled)').first();
 if(!(await p.count()))return;
 await frame(page);
 const view=page.viewportSize();
 const result=await p.evaluate(b=>{const r=b.getBoundingClientRect(),p=document.querySelector('#f1Panel').getBoundingClientRect(),v=document.querySelector('#cqMetroVisual').getBoundingClientRect();return {top:r.top,bottom:r.bottom,pTop:p.top,pBottom:p.bottom,vBottom:v.bottom};});
 if(view.width>1050&&view.height>=680)
  assert.ok(result.top>=Math.max(0,result.pTop)-2&&result.bottom<=Math.min(view.height,result.pBottom)+3,'Primary metro action not reachable: '+JSON.stringify(result));
 else assert.ok(result.top-result.vBottom<=view.height,'Primary metro action too far from visual: '+JSON.stringify(result));
}
async function dock(page){
 const m=await box(page,'#mapViewport'),h=await box(page,'#f2Quick');
 assert.equal(await page.locator('#f2Quick').getAttribute('data-placement'),'map-dock');
 assert.equal(await page.locator('#f2Quick').evaluate(el=>getComputedStyle(el).position),'static');
 assert.ok(h.y>=m.y+m.height-1,'HUD overlaps map '+JSON.stringify({m,h}));
 assert.equal(await page.locator('#f2Quick .f2-quick-pad button').count(),4);
 for(const b of await page.locator('#f2Quick .f2-quick-pad button,#f2Quick .f2-hud-undo').all()){
  const r=await b.boundingBox();assert.ok(r&&r.width>=43.5&&r.height>=43.5,'44px minimum touch target');
 }
}
const current=page=>page.evaluate(()=>window.CityQuestF2MetroBridge.current());
async function choose(page,value){
 const data=await page.evaluate(value=>{
  const s=window.CityQuestF2MetroBridge.current(),opts=window.RivertonMetroGame.options(s);
  const ordered=s.phase==='select-platform'?opts:window.CityQuestF2Engine.orderChoices(opts,document.getElementById('f2Language').value,document.getElementById('f2Level').value,s.stationNumber,s.phase);
  return {index:ordered.findIndex(o=>o.value===value),count:opts.length};
 },value);
 assert.ok(data.index>=0,'Semantic choice '+value);
 const buttons=page.locator('#f1Panel .f2-choice-list button');
 assert.equal(await buttons.count(),data.count);
 await buttons.nth(data.index).click();
}
async function view(page,expected){
 await frame(page);
 assert.equal(await page.locator('#metroLab').getAttribute('data-cq-view'),expected);
 assert.equal(await page.locator('#cqMetroNetworkCard').isVisible(),expected==='network');
 assert.equal(await page.locator('#cqMetroSceneCard').isVisible(),expected!=='network');
 assert.equal(await page.locator('#cqMetroView-'+expected).getAttribute('aria-pressed'),'true');
}
test('UX desktop: map, all navigation and task fit one screen; task scroll leaves map unchanged',{timeout:180000},async()=>{
 const browser=await launch();
 try{
  for(const viewport of desktop){
   const {page,errors,remote}=await open(browser,'en','B2',viewport);
   try{
    await page.locator('#f1Stations button').nth(1).click();await frame(page);
    await fits(page,'.layout .map-card');await fits(page,'#f1Panel');await fits(page,'#f2Quick');
    await dock(page);await noOverflow(page);
    const map=await box(page,'#mapViewport');assert.ok(map.height>=260,'Usable city map '+JSON.stringify(map));
    assert.ok(await labelMedian(page,'#mapViewport [data-landmark-label] text')>=9,'City landmark labels unreadably small');
    const title=await box(page,'.layout .map-card');assert.ok(title.y<=260,'Header consumes too much height '+JSON.stringify(title));
    const panel=page.locator('#f1Panel');assert.equal(await panel.evaluate(el=>getComputedStyle(el).overflowY),'auto');
    const oral=page.locator('.cq-advanced-oracy');assert.equal(await oral.evaluate(el=>el.open),false);
    assert.equal(await oral.locator('.cq-advanced-oracy-task').isVisible(),false);
    await capture(page,'city-'+viewport.width+'x'+viewport.height);
    await oral.locator(':scope > summary').click();assert.equal(await oral.locator('.cq-advanced-oracy-task').isVisible(),true);
    await panel.evaluate(el=>el.scrollTop=el.scrollHeight);
    const after=await box(page,'#mapViewport');assert.ok(Math.abs(after.y-map.y)<2&&Math.abs(after.height-map.height)<2,'Task scroll moves map');
    assert.equal(await page.evaluate(()=>scrollY),0,'Root scroll changed');
    assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
   }finally{await page.close();}
  }
 }finally{await browser.close();}
});
test('UX mobile/tablet: map never overlaps controls; responsive resize preserves journey',{timeout:180000},async()=>{
 const browser=await launch();
 try{
  for(const viewport of mobile){
   const {page,errors,remote}=await open(browser,'de','B2',viewport);
   try{
    await page.locator('#f1Stations button').nth(1).click();await frame(page);
    await dock(page);await noOverflow(page);
    await page.locator('.f2-quick-east').click();
    const position=await page.locator('#mapProgress').textContent();
    await page.locator('#mapZoom').click();await frame(page);await dock(page);await noOverflow(page);
    await page.locator('#mapZoom').click();await frame(page);await dock(page);
    await page.setViewportSize({width:Math.max(320,viewport.height),height:Math.max(390,viewport.width)});await frame(page);
    await dock(page);await noOverflow(page);
    assert.equal(await page.locator('#mapProgress').textContent(),position,'Resize reset route');
    await page.setViewportSize(viewport);await frame(page);
    await page.locator('.layout .map-card').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('#f2Quick .f2-hud-top').isVisible(),false,'Duplicated map brief');
    await capture(page,'mobile-'+viewport.width+'x'+viewport.height);
    if(viewport.width<=390){await page.evaluate(()=>document.documentElement.style.fontSize='200%');await noOverflow(page);await dock(page);}
    assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
   }finally{await page.close();}
  }
 }finally{await browser.close();}
});
test('UX Metro: actual line, direction, platform and ride switch view without changing engine state',{timeout:240000},async()=>{
 const browser=await launch();
 try{
  for(const [lang,viewport] of [['en',desktop[0]],['de',desktop[1]],['fr',mobile[1]],['es',mobile[0]]]){
   const {page,errors,remote}=await open(browser,lang,'B2',viewport);
   try{
    await page.locator('#metroPilotToggle').click();await page.locator('#f1Stations button').nth(4).click();
    await view(page,'network');assert.equal((await current(page)).phase,'select-line');
    const contextText=await page.locator('#f1Panel .cq-ux-context p').textContent();
    const expectedContext=await page.evaluate(lang=>{
      const line=document.querySelector('script').textContent.match(/^\s*const metroNarrative=(\{.*\});$/m);
      return JSON.parse(line[1])[lang][5];
    },lang);
    assert.equal(contextText,expectedContext,'Full original native narrative retained');
    assert.equal(await page.locator('#cqMetroView-train').isDisabled(),true);
    if(viewport.width>1050){await fits(page,'#cqMetroVisual');await fits(page,'#f1Panel');}
    await networkReadability(page);await primaryReach(page);
    await capture(page,'network-'+lang+'-'+viewport.width);
    // Real pointer click, never force or keyboard-only activation. Explicit
    // overview remains selected across a real change of game phase.
    await page.locator('#metroMapZoom').click();await frame(page);
    assert.equal(await page.locator('#metroNetworkViewport').evaluate(n=>n.classList.contains('overview')),true);
    await choose(page,'M2');assert.equal((await current(page)).phase,'select-direction');
    assert.equal(await page.locator('#metroNetworkViewport').evaluate(n=>n.classList.contains('overview')),true,'Phase reset zoom');
    await page.locator('#metroMapZoom').click();await networkReadability(page);await primaryReach(page);
    await choose(page,'north_park');assert.equal((await current(page)).phase,'select-platform');
    await view(page,'platform');assert.equal(await page.locator('.metro-platform-board').isVisible(),true);
    assert.ok(await page.locator('#metroSceneSvg').isVisible());
    assert.equal(await page.locator('#f1Panel .cq-ux-context').count(),1,'Context retained after departure decision');
    assert.equal(await page.locator('#f1Panel .cq-ux-context').evaluate(el=>el.open),false);
    assert.equal(await page.locator('#f1Panel .cq-ux-context p').textContent(),expectedContext);
    if(viewport.width>1050){await fits(page,'#metroSceneSvg');await fits(page,'#f1Panel');}
    else{const s=await box(page,'#metroSceneSvg'),p=await box(page,'#f1Panel');assert.ok(s.y+s.height<=p.y+1,'Platform buried below task');}
    await capture(page,'platform-'+lang+'-'+viewport.width);
    const before=await current(page);
    await page.locator('#cqMetroView-network').click();await view(page,'network');await networkReadability(page);
    await page.locator('#cqMetroView-platform').click();await view(page,'platform');
    assert.deepEqual(await current(page),before,'View switching changes game state');
    await choose(page,'3');assert.equal((await current(page)).phase,'board');
    const label=await page.evaluate(()=>window.RivertonMetroLanguage.pack(document.getElementById('f2Language').value,'B2',5).actions.BOARD);
    await page.locator('#f1Panel .f2-actions').getByRole('button',{name:label,exact:true}).click();
    assert.equal((await current(page)).phase,'ride');await view(page,'train');
    assert.equal(await page.locator('#cqMetroView-platform').isDisabled(),true);
    if(viewport.width>1050)await fits(page,'#metroSceneSvg');
    await capture(page,'train-'+lang+'-'+viewport.width);
    await noOverflow(page);assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
   }finally{await page.close();}
  }
 }finally{await browser.close();}
});

test('UX CSP: normal-motion production interaction remains under strict policy',{timeout:60000},async()=>{
 const browser=await launch();
 try{
  const page=await browser.newPage({viewport:desktop[0],reducedMotion:'no-preference'});
  const errors=[],violations=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{window.__cqCspEvents=[];document.addEventListener('securitypolicyviolation',e=>window.__cqCspEvents.push({directive:e.effectiveDirective,uri:e.blockedURI,source:e.sourceFile,line:e.lineNumber}));});
  await page.goto(BASE+'?lang=en&level=B2',{waitUntil:'load'});
  await page.locator('#f1Stations button').nth(1).click();await frame(page);
  await page.locator('.f2-quick-east').click();await frame(page);
  assert.deepEqual(errors,[],'Production interaction before screenshot');
  assert.deepEqual(await page.evaluate(()=>window.__cqCspEvents),[]);
  await capture(page,'csp-motion-normal');await frame(page);
  assert.deepEqual(errors,[],'Unexpected CSP/console errors during strict production acceptance');
  assert.deepEqual(await page.evaluate(()=>window.__cqCspEvents),[]);
  await page.close();
 }finally{await browser.close();}
});

test('UX mixed final mission: required Market Square tickets and University meeting remain explicit in all four languages',{timeout:90000},async()=>{
 const browser=await launch();
 try{
  for(const lang of ['en','es','de','fr']){
   for(const viewport of [desktop[0],mobile[1]]){
    const {page,errors,remote}=await open(browser,lang,'B2',viewport);
    try{
     await page.locator('#metroPilotToggle').click();await page.locator('#f1Stations button').nth(7).click();await frame(page);
     const goal=page.locator(viewport.width>1050?'#f1Panel .cq-ux-primary-goal':'#cqCityBrief');
     assert.equal(await goal.isVisible(),true,'Mandatory mission goal visible '+lang);
     const expected=await page.evaluate(lang=>window.RivertonMetroLanguage.pack(lang,'B2',8).goal,lang);
     const text=await goal.textContent();
     assert.ok(text.includes(expected),'Full authored goal '+lang);
     assert.ok(text.includes('Market Square')&&text.includes('University'),'Both mandatory waypoints');
     assert.equal((await current(page)).phase,'walk-to-entrance');
     await dock(page);await noOverflow(page);
     assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
    }finally{await page.close();}
   }
  }
 }finally{await browser.close();}
});

async function expectSession(page,lang,level,progress){
 await page.waitForFunction(({lang,level,progress})=>document.getElementById('f2Language').value===lang&&
   document.getElementById('f2Level').value===level&&document.documentElement.lang.toLowerCase().startsWith(lang)&&
   Number(document.getElementById('f1ProgressTrack').getAttribute('aria-valuenow'))===progress,{lang,level,progress});
}
async function exploreChoice(page,lang,level,round){
 const index=await page.evaluate(({lang,level,round})=>{
   const F=window.CityQuestF1Engine,G=window.CityQuestF2Engine,q=F.explore[round];
   return G.orderChoices(G.exploreChoices(q,level,round),lang,level,1,round).indexOf(q.correct);
 },{lang,level,round});
 assert.ok(index>=0);
 return page.locator('#f1Panel .f2-choice-list button').nth(index);
}
test('GA-003: language/CEFR confirmation protects partial work, completed progress and Esc; fresh settings remain direct',{timeout:180000},async()=>{
 const browser=await launch();
 try{
  for(const lang of ['en','es','de','fr']){
   const {page,errors,remote}=await open(browser,lang,'B2',desktop[0]);
   try{
    // No attempted work: allow settings immediately, without a modal.
    await page.locator('#f2Level').selectOption('B1');
    await expectSession(page,lang,'B1',0);
    assert.equal(await page.locator('#cqModeConfirm').isVisible(),false);
    await page.locator('#f2Level').selectOption('B2');
    await expectSession(page,lang,'B2',0);
    await page.locator('#f1Stations button').nth(1).click();
    await page.locator('.f2-quick-east').click();
    const path=await page.locator('#f2MapRoute').getAttribute('points'),statusBefore=await page.locator('#mapProgress').textContent();
    assert.ok(path&&path.trim().split(/\s+/).length>1);
    await page.locator('#f2Level').selectOption('C1');
    assert.equal(await page.locator('#cqModeConfirm').isVisible(),true);
    await expectSession(page,lang,'B2',0);
    await page.locator('#cqModeCancel').click();
    await page.locator('#cqModeConfirm').waitFor({state:'hidden'});
    await expectSession(page,lang,'B2',0);
    assert.equal(await page.locator('#f2MapRoute').getAttribute('points'),path);
    assert.equal(await page.locator('#mapProgress').textContent(),statusBefore);
    const other=lang==='en'?'es':'en';
    await page.locator('#f2Language').selectOption(other);
    assert.equal(await page.locator('#cqModeConfirm').isVisible(),true);
    await page.keyboard.press('Escape');
    await page.locator('#cqModeConfirm').waitFor({state:'hidden'});
    await expectSession(page,lang,'B2',0);
    assert.equal(await page.locator('#f2MapRoute').getAttribute('points'),path);
    await page.locator('#f2Language').selectOption(other);
    await page.locator('#cqModeApply').click();
    await expectSession(page,other,'B2',0);
    assert.ok((await page.locator('#f1Panel .f2-card-head h2').textContent()).length>4);
    assert.equal(await page.locator('#f1Panel .f2-choice-list').count(),1);
    assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
   }finally{await page.close();}
  }
  const {page,errors,remote}=await open(browser,'en','A1',desktop[0]);
  try{
   const count=await page.evaluate(()=>window.CityQuestF2Engine.answerCount('A1'));
   for(let i=0;i<count;i++)await (await exploreChoice(page,'en','A1',i)).click();
   await expectSession(page,'en','A1',1);
   await page.locator('#f2Level').selectOption('A2');
   assert.equal(await page.locator('#cqModeConfirm').isVisible(),true);
   await page.locator('#cqModeCancel').click();
   await expectSession(page,'en','A1',1);
   await page.locator('#f2Level').selectOption('A2');
   await page.locator('#cqModeApply').click();
   await expectSession(page,'en','A2',0);
   assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  }finally{await page.close();}
 }finally{await browser.close();}
});
test('GA-004: native mouse double-click cannot answer two phases; distinct deliberate clicks remain valid',{timeout:120000},async()=>{
 const browser=await launch();
 try{
  for(const level of ['B1','C2']){
   const {page,errors,remote}=await open(browser,'en',level,desktop[0]);
   try{
    await page.locator('#metroPilotToggle').click();await page.locator('#f1Stations button').nth(4).click();
    await frame(page);
    const index=await page.evaluate(()=>{
     const s=window.CityQuestF2MetroBridge.current(),M=window.RivertonMetroGame,G=window.CityQuestF2Engine;
     const expected=M.scenario(s).legs[s.legIndex].line;
     return G.orderChoices(M.options(s),'en',document.getElementById('f2Level').value,5,s.phase).findIndex(o=>o.value===expected);
    });
    assert.ok(index>=0);
    const first=page.locator('#f1Panel .f2-choice-list button').nth(index);
    const attempts=(await current(page)).attempts;
    await first.dblclick();await frame(page);
    const after=await current(page);
    assert.equal(after.phase,'select-direction','Double click advanced two phases');
    assert.equal(after.attempts,attempts,'Double click created accidental attempt');
    const direction=await page.evaluate(()=>window.RivertonMetroGame.desiredDirection(window.CityQuestF2MetroBridge.current()));
    await choose(page,direction);assert.equal((await current(page)).phase,'select-platform');
    assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
   }finally{await page.close();}
  }
  const {page,errors,remote}=await open(browser,'en','B1',desktop[0]);
  try{
   const first=await exploreChoice(page,'en','B1',0);
   await first.dblclick();await frame(page);
   assert.match(await page.locator('#f1Panel .f2-small').first().textContent(),/2\s*\//,'Exactly one city question answered');
   const next=await exploreChoice(page,'en','B1',1);
   await next.focus();await page.keyboard.down('Enter');await frame(page);
   await page.keyboard.down('Enter');await page.keyboard.up('Enter');await frame(page);
   assert.match(await page.locator('#f1Panel .f2-small').first().textContent(),/3\s*\//,'Held Enter answered more than one question');
   assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  }finally{await page.close();}
 }finally{await browser.close();}
});
test('GA-004: same-point rapid touch taps cannot answer the replacement choice',{timeout:90000},async()=>{
 const browser=await launch();
 try{
  const {page,errors,remote}=await open(browser,'en','B1',mobile[1],true);
  try{
   await page.locator('#metroPilotToggle').click();await page.locator('#f1Stations button').nth(4).click();await frame(page);
   const index=await page.evaluate(()=>{
    const s=window.CityQuestF2MetroBridge.current(),M=window.RivertonMetroGame,G=window.CityQuestF2Engine;
    return G.orderChoices(M.options(s),'en','B1',5,s.phase).findIndex(o=>o.value===M.scenario(s).legs[s.legIndex].line);
   });
   assert.ok(index>=0);
   const b=page.locator('#f1Panel .f2-choice-list button').nth(index);
   await b.scrollIntoViewIfNeeded();
   const r=await b.boundingBox(),attempts=(await current(page)).attempts;
   assert.ok(r);
   await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);
   await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);await frame(page);
   assert.equal((await current(page)).phase,'select-direction');
   assert.equal((await current(page)).attempts,attempts);
   assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  }finally{await page.close();}
 }finally{await browser.close();}
});
test('GA-016: open-route and undo feedback is truthful in all four languages',{timeout:90000},async()=>{
 const browser=await launch();
 try{
  const expected={
   en:['Use the map and choose an open street','Previous walking step undone.'],
   es:['Usa el plano y elige una calle abierta','Has deshecho el último paso.'],
   de:['Wähle auf dem Stadtplan eine offene Straße','Der letzte Schritt wurde rückgängig gemacht.'],
   fr:['Utilisez le plan et choisissez une rue ouverte','Dernière étape à pied annulée.']
  };
  for(const lang of Object.keys(expected)){
   const {page,errors,remote}=await open(browser,lang,'B2',desktop[0]);
   try{
    await page.locator('#f1Stations button').nth(1).click();
    const status=page.locator('#f1Panel .f2-status');
    assert.ok((await status.textContent()).includes(expected[lang][0]));
    const before=await page.locator('#mapProgress').textContent();
    await page.locator('.f2-quick-east').click();
    await page.locator('.f2-hud-undo').click();
    assert.equal(await status.textContent(),expected[lang][1]);
    assert.notEqual(await status.getAttribute('data-tone'),'success');
    assert.equal(await page.locator('#mapProgress').textContent(),before);
    assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
   }finally{await page.close();}
  }
 }finally{await browser.close();}
});
