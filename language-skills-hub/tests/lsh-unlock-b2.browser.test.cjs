'use strict';
/* Stage B2 browser certification. Chromium native CDP touch is T2, WebKit
 * synthetic long press/drag is T5, and forced Fullscreen responses are T4.
 * Genuine requestFullscreen() paths are reported separately as T3 observations.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const BASE=process.env.LSH_STAGEB_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const LABS=[
 {name:'Reading',path:'self-check/reading/index.html',topic:'rl-asteroids',lang:'en'},
 {name:'Listening',path:'self-check/listening/student.html',topic:'ll-sad'}
];
const GESTURES=[['corners4','n1'],['tap_hold_tap','n2'],['hold_double_tap','n3'],
 ['triangle3','n4'],['draw_z','n5']];
let serial=0;
const id=()=>('classb2'+Date.now().toString(36)+(serial++).toString(36));
const point=(w,h,x,y)=>({x:Math.round(x*w),y:Math.round(y*h)});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function url(lab,code){
 const u=new URL(lab.path,BASE);
 u.searchParams.set('topic',lab.topic);
 if(lab.lang)u.searchParams.set('lang',lab.lang);
 u.searchParams.set('level','B2');u.searchParams.set('timer','5');
 u.searchParams.set('p',code);u.searchParams.set('attempt',id());
 return u.href;
}
const isLocked=page=>page.locator('#sessionLock').isVisible();
const noFallback=async page=>assert.equal(await page.locator('#sessionUnlockContinue').isVisible(),false);
async function snapshot(page){
 return page.evaluate(()=>{
  const key=Object.keys(localStorage).find(k=>k.startsWith('lsh:local-attempt:r30:'));
  if(!key)throw Error('Missing local R30 attempt');
  const d=JSON.parse(localStorage.getItem(key));
  return {phase:d.phase,unlockFailures:d.unlockFailures,incidents:d.incidents.length,
   resumptions:(d.resumptions||[]).length};
 });
}
async function openMock(browser,lab,variant='n1',options={}){
 const context=await browser.newContext({viewport:{width:820,height:1180},
  hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.addInitScript(()=>{
  window.__B2={fullscreen:true,calls:0,mode:'success'};
  Object.defineProperty(Document.prototype,'fullscreenElement',{configurable:true,
   get(){return window.__B2.fullscreen?document.documentElement:null}});
  Element.prototype.requestFullscreen=function(){
   window.__B2.calls++;
   if(window.__B2.mode==='reject')return Promise.reject(new Error('T4 injected refusal'));
   if(window.__B2.mode==='pending')return new Promise(()=>{});
   window.__B2.fullscreen=true;
   document.dispatchEvent(new Event('fullscreenchange'));
   return Promise.resolve();
  };
 });
 const response=await page.goto(url(lab,variant),{waitUntil:'domcontentloaded'});
 assert.equal(response.status(),200);
 await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:20000});
 await page.locator('#sessionStart').click();
 await page.locator('#workspace:not([hidden])').waitFor({timeout:10000});
 await page.evaluate(()=>{
  window.__B2.fullscreen=false;
  document.dispatchEvent(new Event('fullscreenchange'));
 });
 await page.locator('#sessionLock:not([hidden])').waitFor({timeout:5000});
 return {context,page};
}
async function touchDriver(page,engineName){
 const {width:w,height:h}=page.viewportSize();
 const cdp=engineName==='Chromium'?await page.context().newCDPSession(page):null;
 const pos=(x,y)=>point(w,h,x,y);
 const cornerCoords=[{x:38,y:38},{x:w-38,y:38},{x:38,y:h-38},{x:w-38,y:h-38}];
 const synthetic=engineName==='WebKit';
 async function send(kind,p,opts={}){
  if(cdp){
   const touchPoints=kind==='touchEnd'||kind==='touchCancel'?[]:
    [{x:p.x,y:p.y,id:opts.id||1}];
   await cdp.send('Input.dispatchTouchEvent',{type:kind,touchPoints});
  }else{
   await page.evaluate(({kind,p,selector,pointerId})=>{
    const surface=selector==='document'?document:document.querySelector(selector||'.lsh-unlock-surface');
    if(!surface)throw new Error('Missing B2 gesture surface');
    const type={touchStart:'pointerdown',touchMove:'pointermove',
     touchEnd:'pointerup',touchCancel:'pointercancel'}[kind];
    surface.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,
     pointerId,pointerType:'touch',isPrimary:true,button:0,
     buttons:kind==='touchEnd'||kind==='touchCancel'?0:1,
     clientX:p.x,clientY:p.y}));
   },{kind,p,selector:opts.selector,pointerId:opts.id||42});
  }
 }
 const tap=async p=>page.touchscreen.tap(p.x,p.y);
 const hold=async(p,ms)=>{
  await send('touchStart',p);await page.waitForTimeout(ms);await send('touchEnd',p);
 };
 const draw=async()=>{
  const pts=[[.3,.3],[.7,.3],[.3,.7],[.7,.7]].map(([x,y])=>pos(x,y));
  await send('touchStart',pts[0]);
  for(let j=0;j<3;j++){
   for(let i=1;i<=6;i++){
    const p={x:Math.round(pts[j].x+(pts[j+1].x-pts[j].x)*i/6),
     y:Math.round(pts[j].y+(pts[j+1].y-pts[j].y)*i/6)};
    await send('touchMove',p);await page.waitForTimeout(24);
   }
  }
  await page.waitForTimeout(600);await send('touchEnd',pts[3]);
 };
 const run=async name=>{
  if(name==='corners4'){for(const p of cornerCoords)await tap(p);}
  if(name==='tap_hold_tap'){await tap(pos(.5,.7));await hold(pos(.5,.7),2200);await tap(pos(.5,.7));}
  if(name==='hold_double_tap'){await hold(pos(.3,.6),2800);await tap(pos(.7,.6));await tap(pos(.7,.6));}
  if(name==='triangle3'){await tap(pos(.5,.3));await tap(pos(.3,.7));await hold(pos(.7,.7),750);}
  if(name==='draw_z')await draw();
 };
 // F17: first three corners are ordinary trusted taps, fourth is a controllable press.
 const beginFinalCorner=async()=>{
  for(const p of cornerCoords.slice(0,3))await tap(p);
  const p=cornerCoords[3];
  if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]});
  else await send('touchStart',p,{selector:'.lsh-corner-br',id:42});
 };
 const finishFinalCorner=async(type='touchEnd',outside=false)=>{
  const p=outside?pos(.5,.5):cornerCoords[3];
  if(cdp){
   if(outside&&type==='touchEnd'){
    // Browser T5-style injected release: the matching pointer is genuinely tracked
    // by the recognizer, but this document event itself is NOT a trusted activation.
    await page.evaluate(({x,y})=>{
     const pointerId=window.__B2LastPointerId;
     document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,
      pointerId,pointerType:'touch',button:0,clientX:x,clientY:y}));
    },p);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
   }else await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:[]});
  }else await send(type,p,{selector:'document',id:42});
 };
 return {run,beginFinalCorner,finishFinalCorner,
  finishKind:synthetic?'T5 synthetic pointerup':'T2 native touch',
  cornerCoords,send,cdp};
}
async function waitUnblocked(page){
 await page.locator('#sessionLock').waitFor({state:'hidden',timeout:6000});
}
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('B2 T2/T5 '+engineName+' both LABs x five touch gestures: request fullscreen and re-lock on exit',
  {timeout:250000},async()=>{
   const browser=await engine.launch({headless:true});
   let cases=0;
   try{
    for(const lab of LABS)for(const [gesture,variant] of GESTURES){
     const {context,page}=await openMock(browser,lab,variant);
     try{
      const driver=await touchDriver(page,engineName);
      assert.equal(await page.evaluate(()=>window.__B2.calls),0);
      await driver.run(gesture);
      await waitUnblocked(page);
      assert.equal(await page.evaluate(()=>window.__B2.calls),1,
       'Touch completion must request Fullscreen exactly once');
      const result=await snapshot(page);
      assert.equal(result.resumptions,1);
      assert.equal(result.phase,'running');
      await noFallback(page);
      await page.evaluate(()=>{
       window.__B2.fullscreen=false;
       document.dispatchEvent(new Event('fullscreenchange'));
      });
      await page.locator('#sessionLock:not([hidden])').waitFor({timeout:6000});
      assert.match(await page.locator('#sessionLockReason').textContent(),/Full-screen mode was exited/);
      cases++;
     }finally{await context.close();}
    }
    console.log('B2 T2/T5 '+engineName+': '+cases+' touch completions + fullscreen re-lock PASS');
    assert.equal(cases,10);
   }finally{await browser.close();}
 });
 test('B2 T4 '+engineName+' genuine touch denial is tolerated without fallback or rearm',
  {timeout:70000},async()=>{
   const browser=await engine.launch({headless:true});
   try{
    for(const lab of LABS){
     const {context,page}=await openMock(browser,lab,'n4');
     try{
      await page.evaluate(()=>window.__B2.mode='reject');
      const driver=await touchDriver(page,engineName);
      const incidentBefore=(await snapshot(page)).incidents;
      await driver.run('triangle3');
      await waitUnblocked(page);
      assert.equal(await page.evaluate(()=>window.__B2.calls),1);
      assert.equal((await snapshot(page)).resumptions,1);
      assert.equal((await snapshot(page)).incidents,incidentBefore,
       'A tolerated B2 fullscreen refusal must not create a new incident');
      await noFallback(page);
      await page.evaluate(()=>document.dispatchEvent(new Event('fullscreenchange')));
      assert.equal(await isLocked(page),false,'Refused fullscreen must remain disarmed');
     }finally{await context.close();}
    }
   }finally{await browser.close();}
 });
 test('B2 F-17 '+engineName+' cancellation, timeout, extra pointer and clean retry',
  {timeout:180000},async()=>{
   const browser=await engine.launch({headless:true});
   let cases=0;
   try{
    for(const lab of LABS){
     for(const variant of ['cancel','lostcapture','timeout','extra','blur','hidden','wrong-up']){
      const {context,page}=await openMock(browser,lab,'n1');
      try{
       const driver=await touchDriver(page,engineName);
       const reason=(await page.locator('#sessionLockReason').textContent()).trim();
       if(engineName==='Chromium'){
        await page.evaluate(()=>document.addEventListener('pointerdown',e=>{
         if(e.target?.classList?.contains('lsh-corner-br'))window.__B2LastPointerId=e.pointerId;
        },true));
       }
       await driver.beginFinalCorner();
       assert.equal(await isLocked(page),true);
       assert.equal(await page.evaluate(()=>window.__B2.calls),0,
        'F-17: fourth pointerdown alone must not call Fullscreen');
       if(variant==='cancel')await driver.finishFinalCorner('touchCancel');
       if(variant==='lostcapture'){
        await page.evaluate((synthetic)=>{
         document.dispatchEvent(new PointerEvent('lostpointercapture',{bubbles:true,
          pointerId:synthetic?42:window.__B2LastPointerId,pointerType:'touch'}));
        },engineName==='WebKit');
        await driver.finishFinalCorner('touchCancel');
       }
       if(variant==='timeout'){await page.waitForTimeout(1700);await driver.finishFinalCorner('touchEnd');}
       if(variant==='extra'){
        if(driver.cdp)await driver.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',
         touchPoints:[{...driver.cornerCoords[3],id:1},{x:120,y:300,id:2}]});
        else await page.evaluate(()=>document.dispatchEvent(new PointerEvent('pointerdown',{
         bubbles:true,pointerType:'touch',pointerId:999,clientX:120,clientY:300,button:0})));
        await driver.finishFinalCorner('touchCancel');
       }
       if(variant==='blur'){await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
        await driver.finishFinalCorner('touchEnd');}
       if(variant==='hidden'){
        await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
         document.dispatchEvent(new Event('visibilitychange'));});
        await driver.finishFinalCorner('touchEnd');
        await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
       }
       if(variant==='wrong-up'){
        await page.evaluate(()=>document.dispatchEvent(new PointerEvent('pointerup',{
         bubbles:true,pointerType:'touch',pointerId:999,button:0,clientX:410,clientY:580})));
        await driver.finishFinalCorner('touchEnd');
       }
       await page.waitForTimeout(80);
       assert.equal(await isLocked(page),true,'F-17 '+variant+' must not unlock');
       assert.equal(await page.evaluate(()=>window.__B2.calls),0,'No fullscreen request on cancelled gesture');
       await noFallback(page);
       assert.equal((await page.locator('#sessionLockReason').textContent()).trim(),reason,
        'Cancellation must not overwrite the lock reason');
       assert.ok((await snapshot(page)).unlockFailures>=1,'Cancelled fourth step must count one failure');
       // Even after an interrupted gesture, a completely new sequence must work.
       await driver.run('corners4');
       await waitUnblocked(page);
       assert.equal(await page.evaluate(()=>window.__B2.calls),1);
       cases++;
      }finally{await context.close();}
     }
    }
    console.log('B2 F17 '+engineName+' '+cases+' cancelled sequences followed by clean retry PASS');
    assert.equal(cases,14);
   }finally{await browser.close();}
 });
 test('B2 F-17 '+engineName+' matching fourth pointerup outside corner completes once (T5 release)',
  {timeout:55000},async()=>{
   const browser=await engine.launch({headless:true});
   try{
    for(const lab of LABS){
     const {context,page}=await openMock(browser,lab,'n1');
     try{
      const driver=await touchDriver(page,engineName);
      if(engineName==='Chromium')await page.evaluate(()=>document.addEventListener('pointerdown',e=>{
       if(e.target?.classList?.contains('lsh-corner-br'))window.__B2LastPointerId=e.pointerId;
      },true));
      await driver.beginFinalCorner();
      assert.equal(await page.evaluate(()=>window.__B2.calls),0);
      await driver.finishFinalCorner('touchEnd',true);
      await waitUnblocked(page);
      assert.equal(await page.evaluate(()=>window.__B2.calls),1);
      assert.equal((await snapshot(page)).resumptions,1);
      await noFallback(page);
     }finally{await context.close();}
    }
   }finally{await browser.close();}
  });
 test('B2 T3 '+engineName+' real (unmocked) touch fourth release: report observed engine behavior',
  {timeout:110000},async()=>{
   const browser=await engine.launch({headless:true}),results=[];
   try{
    for(const lab of LABS){
     const context=await browser.newContext({viewport:{width:820,height:1180},hasTouch:true});
     const page=await context.newPage();
     try{
      await page.goto(url(lab,'n1'),{waitUntil:'domcontentloaded'});
      const supported=await page.evaluate(()=>typeof document.documentElement.requestFullscreen==='function');
      if(!supported){results.push({lab:lab.name,result:'SKIPPED',reason:'native API unavailable'});continue;}
      await page.locator('#sessionIntro:not([hidden])').waitFor();
      await page.locator('#sessionStart').click();
      await page.locator('#workspace:not([hidden])').waitFor();
      if(await page.evaluate(()=>!!document.fullscreenElement)){
       await page.evaluate(()=>document.exitFullscreen());
       await page.locator('#sessionLock:not([hidden])').waitFor({timeout:6000});
      }else if(!await isLocked(page)){
       await page.mouse.click(110,180,{button:'right'});
       await page.locator('#sessionLock:not([hidden])').waitFor({timeout:6000});
      }
      const driver=await touchDriver(page,engineName);
      await driver.run('corners4');
      await page.locator('#sessionLock').waitFor({state:'hidden',timeout:7000});
      const native=await page.evaluate(()=>!!document.fullscreenElement);
      results.push({lab:lab.name,result:native?'ENTERED':'DENIED_AND_TOLERATED',
       source:'T3 real API; mouse input and synthetic fallback are excluded'});
      await noFallback(page);
     }finally{await context.close();}
    }
    console.log('B2 T3 '+engineName+' '+JSON.stringify(results));
    assert.equal(results.length,2);
   }finally{await browser.close();}
 });
}
