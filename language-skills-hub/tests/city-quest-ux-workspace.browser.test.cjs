#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const pw=require('playwright'),engine=process.env.CQ_UX_ENGINE||'chromium';
const BASE='http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html';
const desktop=[{width:1366,height:768},{width:1280,height:720},{width:1920,height:1080}];
const mobile=[{width:320,height:780},{width:390,height:844},{width:768,height:1024},{width:844,height:390}];
const evidence=process.env.CQ_UX_EVIDENCE;
async function launch(){return pw[engine].launch(engine==='chromium'?{headless:true,args:['--no-sandbox']}:{headless:true});}
async function open(browser,lang,level,viewport){
 const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[],remote=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/')&&!r.url().startsWith('data:'))remote.push(r.url());});
 await page.goto(BASE+'?lang='+lang+'&level='+level,{waitUntil:'load'});
 await page.locator('#f1Stations button').first().waitFor();
 assert.deepEqual(errors,[],'Unexpected console errors before any screenshots');
 return {page,errors,remote};
}
async function frame(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function capture(page,name){if(!evidence)return;fs.mkdirSync(evidence,{recursive:true});await page.screenshot({path:evidence+'/'+engine+'-'+name+'.png',timeout:10000});}
async function box(page,selector){const r=await page.locator(selector).boundingBox();assert.ok(r,'Visible '+selector);return r;}
async function fits(page,selector){
 const r=await box(page,selector),v=page.viewportSize();
 assert.ok(r.x>=-2&&r.y>=-2&&r.x+r.width<=v.width+2&&r.y+r.height<=v.height+3,selector+' outside viewport '+JSON.stringify({r,v}));
 return r;
}
async function noOverflow(page){const g=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth}));assert.ok(g.sw<=g.w+1,'Document horizontal overflow '+JSON.stringify(g));}
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
    assert.equal(await page.locator('#cqMetroView-train').isDisabled(),true);
    if(viewport.width>1050){await fits(page,'#cqMetroVisual');await fits(page,'#f1Panel');}
    await capture(page,'network-'+lang+'-'+viewport.width);
    await choose(page,'M2');assert.equal((await current(page)).phase,'select-direction');
    await choose(page,'north_park');assert.equal((await current(page)).phase,'select-platform');
    await view(page,'platform');assert.equal(await page.locator('.metro-platform-board').isVisible(),true);
    assert.ok(await page.locator('#metroSceneSvg').isVisible());
    assert.equal(await page.locator('#f1Panel .cq-ux-context').count(),1,'Context retained after departure decision');
    assert.equal(await page.locator('#f1Panel .cq-ux-context').evaluate(el=>el.open),false);
    if(viewport.width>1050){await fits(page,'#metroSceneSvg');await fits(page,'#f1Panel');}
    else{const s=await box(page,'#metroSceneSvg'),p=await box(page,'#f1Panel');assert.ok(s.y+s.height<=p.y+1,'Platform buried below task');}
    await capture(page,'platform-'+lang+'-'+viewport.width);
    const before=await current(page);
    await page.locator('#cqMetroView-network').click();await view(page,'network');
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

test('UX CSP: production motion preferences and screenshot capture do not create CSP errors',{timeout:60000},async()=>{
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
  assert.deepEqual(errors,[],'Screenshot must not inject prohibited styles');
  assert.deepEqual(await page.evaluate(()=>window.__cqCspEvents),[]);
  await page.close();
 }finally{await browser.close();}
});
