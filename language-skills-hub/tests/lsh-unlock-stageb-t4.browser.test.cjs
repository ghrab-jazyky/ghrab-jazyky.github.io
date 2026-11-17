'use strict';
/* T4 = forced requestFullscreen() behavior, not native browser permission testing.
 * T3 is separately covered by lsh-unlock-stageb-matrix.browser.test.cjs.
 * No Stage B2 device rearming is tested here.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const BASE=process.env.LSH_STAGEB_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const labs=[
 {name:'Reading',path:'self-check/reading/index.html',topic:'rl-asteroids',lang:'en'},
 {name:'Listening',path:'self-check/listening/student.html',topic:'ll-sad'}
];
const variants=[
 ['corners4','n1'],['tap_hold_tap','n2'],['hold_double_tap','n3'],
 ['triangle3','n4'],['draw_z','n5']
];
let serial=0;
const code=()=>('classforced'+Date.now().toString(36)+(serial++).toString(36));
const point=(w,h,x,y)=>({x:Math.round(w*x),y:Math.round(h*y)});
async function gesture(page,id){
 const {width:w,height:h}=page.viewportSize();
 const p=(x,y)=>point(w,h,x,y);
 const tap=async p=>page.mouse.click(p.x,p.y,{delay:65});
 const hold=async(p,ms)=>{await page.mouse.move(p.x,p.y);await page.mouse.down();await page.waitForTimeout(ms);await page.mouse.up()};
 if(id==='corners4'){
  for(const p of [{x:38,y:38},{x:w-38,y:38},{x:38,y:h-38},{x:w-38,y:h-38}])await tap(p);
 }else if(id==='tap_hold_tap'){await tap(p(.5,.7));await hold(p(.5,.7),2200);await tap(p(.5,.7));}
 else if(id==='hold_double_tap'){await hold(p(.3,.6),2800);await tap(p(.7,.6));await tap(p(.7,.6));}
 else if(id==='triangle3'){await tap(p(.5,.3));await tap(p(.3,.7));await hold(p(.7,.7),750);}
 else if(id==='draw_z'){
  await page.mouse.move(p(.3,.3).x,p(.3,.3).y);await page.mouse.down();
  for(const [x,y] of [[.7,.3],[.3,.7],[.7,.7]])
   await page.mouse.move(p(x,y).x,p(x,y).y,{steps:8});
  await page.waitForTimeout(650);await page.mouse.up();
 }
}
async function setup(browser,lab,variant='n4',opts={}){
 const context=await browser.newContext({viewport:{width:820,height:1180},hasTouch:!!opts.hasTouch});
 const page=await context.newPage();
 if(opts.clock)await page.clock.install();
 await page.addInitScript(()=>{
  window.__full=true;window.__calls=0;window.__callDetails=[];window.__mode='success';
  window.__pendingResolve=null;window.__forcedHidden=false;
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__forcedHidden});
  Object.defineProperty(Document.prototype,'fullscreenElement',{configurable:true,
   get:()=>window.__full?document.documentElement:null});
  Element.prototype.requestFullscreen=function(){
   window.__calls++;
   window.__callDetails.push({n:window.__calls,mode:window.__mode,stack:(new Error()).stack.split('\n').slice(1,5)});
   if(window.__mode==='reject')return Promise.reject(new Error('T4 injected rejection'));
   if(window.__mode==='pending')return new Promise(resolve=>{window.__pendingResolve=()=>{
    window.__full=true;resolve();
   }});
   window.__full=true;return Promise.resolve();
  };
 });
 const url=new URL(lab.path,BASE);
 url.searchParams.set('topic',lab.topic);
 if(lab.lang)url.searchParams.set('lang',lab.lang);
 url.searchParams.set('level','B2');
 url.searchParams.set('timer','5');url.searchParams.set('p',variant);
 url.searchParams.set('attempt',code());
 const response=await page.goto(url.href,{waitUntil:'domcontentloaded'});
 assert.equal(response.status(),200);
 await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:20000});
 await page.locator('#sessionStart').click();
 await page.locator('#workspace:not([hidden])').waitFor({timeout:15000});
 if(!await page.locator('#sessionLock').isVisible())await page.mouse.click(110,180,{button:'right'});
 await page.locator('#sessionLock:not([hidden])').waitFor({timeout:10000});
 return {context,page,lab};
}
async function deny(page,mode='reject'){
 await page.evaluate(value=>{window.__mode=value;window.__full=false},mode);
}
const visible=page=>page.locator('#sessionUnlockContinue:not([hidden])');
const locked=page=>page.locator('#sessionLock').isVisible();
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('T4 '+engineName+' five gestures x two LABs: denial, focus, single-use retry', {timeout:330000},async()=>{
  const browser=await engine.launch({headless:true});
  let cases=0;
  try{
   for(const lab of labs)for(let i=0;i<variants.length;i++){
    const [id,variant]=variants[i];
    const s=await setup(browser,lab,variant);
    const {page}=s;
    try{
     assert.equal(await visible(page).count(),0,'Continue hidden by default');
     assert.equal(await page.locator('#sessionUnlockContinue').isVisible(),false);
     await page.evaluate(()=>document.getElementById('sessionUnlockContinue').click());
     assert.equal(await locked(page),true,'No gesture token: click must do nothing');
     await deny(page);
     await gesture(page,id);
     await visible(page).waitFor({timeout:6000});
     await page.waitForFunction(()=>document.activeElement?.id==='sessionUnlockContinue',null,{timeout:2500});
     assert.equal(await locked(page),true,'Reject must not resume');
     const type=i%3;
     if(type===0)await page.locator('#sessionUnlockContinue').click();
     else await page.keyboard.press(type===1?'Enter':'Space');
     await page.locator('#sessionUnlockContinue').waitFor({state:'hidden'});
     assert.equal(await locked(page),true,'Second forced rejection still locked');
     assert.equal(await visible(page).count(),0,'One-shot token cannot reappear automatically');
     const calls=await page.evaluate(()=>window.__calls);
     assert.equal(calls,2,'Unexpected fullscreen calls: '+JSON.stringify(await page.evaluate(()=>window.__callDetails)));
     cases++;
    }finally{await s.context.close()}
   }
   console.log('T4 REJECT '+engineName+' '+cases+' scenarios; forced failures, never native browser denials');
   assert.equal(cases,10);
  }finally{await browser.close()}
 });
 test('T4 '+engineName+' pending timeout, late resolution, and 10 second fallback expiry in both LABs',
 {timeout:95000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const lab of labs){
    const s=await setup(browser,lab,'n4',{clock:false});
    const {page}=s;
    try{
     await deny(page,'pending');
     await gesture(page,'triangle3');
     await visible(page).waitFor({timeout:6000}); // real 3,000ms pending timeout
     assert.equal(await locked(page),true);
     await page.evaluate(()=>window.__pendingResolve&&window.__pendingResolve());
     await page.waitForTimeout(150);
     assert.equal(await locked(page),true,'Late resolution cannot call resume');
     assert.equal(await visible(page).count(),1,'Token is not fabricated after late completion');
     await page.evaluate(()=>{window.__forcedHidden=true;document.dispatchEvent(new Event('visibilitychange'));});
     await page.locator('#sessionUnlockContinue').waitFor({state:'hidden'});
     assert.equal(await locked(page),true);
    }finally{await s.context.close()}
    const t=await setup(browser,lab,'n1',{clock:true});
    try{
     await deny(t.page,'reject');
     await gesture(t.page,'corners4');
     await visible(t.page).waitFor({timeout:4500});
     await t.page.clock.fastForward(10001);
     await t.page.locator('#sessionUnlockContinue').waitFor({state:'hidden'});
     assert.equal(await locked(t.page),true,'10s expiry must not resume');
     await t.page.evaluate(()=>document.getElementById('sessionUnlockContinue').click());
     assert.equal(await locked(t.page),true);
    }finally{await t.context.close()}
   }
   console.log('T4 TIMING '+engineName+' 3-second request and 10-second token expiry = PASS');
  }finally{await browser.close()}
 });
 test('T4 '+engineName+' decision table B: touch/hybrid, already fullscreen, no API, restricted', {timeout:100000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const lab of labs){
    // Case d: already fullscreen, no extra request.
    const a=await setup(browser,lab);
    try{
     const before=await a.page.evaluate(()=>window.__calls);
     await gesture(a.page,'triangle3');
     await a.page.locator('#sessionLock').waitFor({state:'hidden'});
     assert.equal(await a.page.evaluate(()=>window.__calls),before);
     assert.equal(await visible(a.page).count(),0);
    }finally{await a.context.close()}
    // Cases b/e in B2: touch/hybrid requests fullscreen; rejection is tolerated.
    const h=await setup(browser,lab,'n4',{hasTouch:true});
    try{
     await deny(h.page,'reject');
     const before=await h.page.evaluate(()=>window.__calls);
     await gesture(h.page,'triangle3');
     await h.page.locator('#sessionLock').waitFor({state:'hidden'});
     assert.equal(await h.page.evaluate(()=>window.__calls),before+1,
      'Unexpected hybrid calls: '+JSON.stringify(await h.page.evaluate(()=>window.__callDetails)));
     assert.equal(await visible(h.page).count(),0);
     await h.page.evaluate(()=>document.dispatchEvent(new Event('fullscreenchange')));
     assert.equal(await h.page.locator('#sessionLock').isVisible(),false,
      'Tolerated denial must leave fullscreen monitoring disarmed');
    }finally{await h.context.close()}
    // Case f: desktop with no API resumes without showing Continue.
    const n=await setup(browser,lab);
    try{
     await n.page.evaluate(()=>{window.__full=false;document.documentElement.requestFullscreen=undefined});
     await gesture(n.page,'triangle3');
     await n.page.locator('#sessionLock').waitFor({state:'hidden'});
     assert.equal(await visible(n.page).count(),0);
    }finally{await n.context.close()}
    // Restricted viewport forbids resume, then normal viewport allows it.
    const q=await setup(browser,lab);
    try{
     await q.page.evaluate(()=>{
      Object.defineProperty(window.screen,'width',{configurable:true,get:()=>2000});
     });
     await gesture(q.page,'triangle3');
     assert.equal(await locked(q.page),true);
     assert.match(await q.page.locator('#sessionLockReason').textContent(),/restricted or divided window/);
     await q.page.evaluate(()=>{delete window.screen.width;});
     await gesture(q.page,'triangle3');
     await q.page.locator('#sessionLock').waitFor({state:'hidden'});
    }finally{await q.context.close()}
   }
   console.log('T4 DECISIONS '+engineName+' 8 cases (both LABs) = PASS');
  }finally{await browser.close()}
 });
}

for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('T4 '+engineName+' fallback succeeds via keyboard but never without a preceding gesture',
 {timeout:60000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const lab of labs){
    const s=await setup(browser,lab,'n4');
    try{
     await deny(s.page,'reject');
     await gesture(s.page,'triangle3');
     await visible(s.page).waitFor({timeout:5000});
     await s.page.evaluate(()=>{window.__mode='success';});
     await s.page.waitForFunction(()=>document.activeElement?.id==='sessionUnlockContinue',null,{timeout:2500});
     await s.page.keyboard.press('Space');
     await s.page.locator('#sessionLock').waitFor({state:'hidden',timeout:5000});
     assert.equal(await visible(s.page).count(),0);
    }finally{await s.context.close()}
   }
  }finally{await browser.close()}
 });
 test('T4 '+engineName+' pointer activity invalidates the one-use retry token',
 {timeout:65000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const [variant,id] of [['n4','triangle3'],['n1','corners4']]){
    const s=await setup(browser,labs[0],variant);
    try{
     await deny(s.page,'reject');await gesture(s.page,id);
     await visible(s.page).waitFor({timeout:5000});
     if(id==='corners4')await s.page.mouse.click(38,38,{delay:65});
     else await s.page.mouse.click(410,590,{delay:65});
     await s.page.locator('#sessionUnlockContinue').waitFor({state:'hidden'});
     assert.equal(await locked(s.page),true);
     await s.page.evaluate(()=>document.getElementById('sessionUnlockContinue').click());
     assert.equal(await locked(s.page),true);
    }finally{await s.context.close()}
   }
  }finally{await browser.close()}
 });
 test('T4 '+engineName+' pending request expires with test, no late resume or false denial reason',
 {timeout:45000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const s=await setup(browser,labs[0],'n1',{clock:true});
   try{
    await deny(s.page,'pending');await gesture(s.page,'corners4');
    assert.equal(await locked(s.page),true);
    await s.page.clock.fastForward(301000);
    await s.page.locator('#results:not([hidden])').waitFor({timeout:7000});
    assert.equal(await visible(s.page).count(),0);
    await s.page.evaluate(()=>window.__pendingResolve&&window.__pendingResolve());
    await s.page.waitForTimeout(100);
    assert.equal(await s.page.locator('#sessionLock').isVisible(),false);
    assert.equal(await visible(s.page).count(),0);
    assert.doesNotMatch((await s.page.locator('#sessionLockReason').textContent())||'',/could not be activated/);
   }finally{await s.context.close()}
  }finally{await browser.close()}
 });
 test('T4 '+engineName+' re-checks restricted viewport after pending request resolves',
 {timeout:45000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const s=await setup(browser,labs[0],'n4');
   try{
    await deny(s.page,'pending');await gesture(s.page,'triangle3');
    await s.page.evaluate(()=>{
     Object.defineProperty(window.screen,'width',{configurable:true,get:()=>2000});
     window.__pendingResolve();
    });
    await s.page.waitForFunction(()=>document.getElementById('sessionLockReason').textContent.includes('restricted or divided window'),null,{timeout:2000});
    assert.equal(await locked(s.page),true);
    assert.equal(await visible(s.page).count(),0);
   }finally{await s.context.close()}
  }finally{await browser.close()}
 });
}
