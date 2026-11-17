'use strict';
/* Exact-stage-B browser matrix, without Stage B2 touch Fullscreen rearming.
 * T2: trusted mouse and Chromium CDP touch.
 * T5: WebKit synthetic pointer holds/drag (cannot prove native touch activation).
 * T3: genuine unmodified requestFullscreen() through gesture completion.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const BASE=process.env.LSH_STAGEB_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const labs=[
 {name:'Reading',path:'self-check/reading/index.html',topic:'rl-asteroids',lang:'en'},
 {name:'Listening',path:'self-check/listening/student.html',topic:'ll-sad',lang:null}
];
const kinds=['corners4','tap_hold_tap','hold_double_tap','triangle3','draw_z'];
const codes=['n1','n2','n3','n4','n5'];
let counter=0;
const point=(w,h,x,y)=>({x:Math.round(w*x),y:Math.round(h*y)});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const attemptId=()=>('classmatrix'+Date.now().toString(36)+(counter++).toString(36));
function buildURL(lab,code){
 const url=new URL(lab.path,BASE);
 url.searchParams.set('topic',lab.topic);
 if(lab.lang)url.searchParams.set('lang',lab.lang);
 url.searchParams.set('level','B2');url.searchParams.set('timer','5');
 url.searchParams.set('p',code);url.searchParams.set('attempt',attemptId());
 return url.href;
}
async function tapMouse(page,p){await page.mouse.click(p.x,p.y,{delay:70});}
async function pressMouse(page,p,duration){
 await page.mouse.move(p.x,p.y);await page.mouse.down();
 await page.waitForTimeout(duration);await page.mouse.up();
}
async function pathMouse(page,w,h,duration){
 const pts=[[.3,.3],[.7,.3],[.3,.7],[.7,.7]].map(([x,y])=>point(w,h,x,y));
 await page.mouse.move(pts[0].x,pts[0].y);await page.mouse.down();
 await page.mouse.move(pts[1].x,pts[1].y,{steps:8});
 await page.mouse.move(pts[2].x,pts[2].y,{steps:8});
 await page.mouse.move(pts[3].x,pts[3].y,{steps:8});
 await page.waitForTimeout(duration-300);await page.mouse.up();
}
async function gestureMouse(page,id,w,h,duration=1500){
 const p=(x,y)=>point(w,h,x,y);
 if(id==='corners4'){
  for(const xy of [{x:38,y:38},{x:w-38,y:38},{x:38,y:h-38},{x:w-38,y:h-38}])
   await tapMouse(page,xy);
 }else if(id==='tap_hold_tap'){
  await tapMouse(page,p(.5,.7));await pressMouse(page,p(.5,.7),2200);
  await tapMouse(page,p(.5,.7));
 }else if(id==='hold_double_tap'){
  await pressMouse(page,p(.3,.6),2800);await tapMouse(page,p(.7,.6));
  await tapMouse(page,p(.7,.6));
 }else if(id==='triangle3'){
  await tapMouse(page,p(.5,.3));await tapMouse(page,p(.3,.7));
  await pressMouse(page,p(.7,.7),750);
 }else if(id==='draw_z')await pathMouse(page,w,h,duration);
}
async function wrongMouse(page,id,w,h){
 const p=(x,y)=>point(w,h,x,y);
 if(id==='corners4'){await tapMouse(page,{x:38,y:38});await tapMouse(page,{x:38,y:h-38});}
 if(id==='tap_hold_tap'){await tapMouse(page,p(.5,.7));await tapMouse(page,p(.1,.1));}
 if(id==='hold_double_tap'){await pressMouse(page,p(.3,.6),100);await tapMouse(page,p(.7,.6));}
 if(id==='triangle3'){await tapMouse(page,p(.5,.3));await tapMouse(page,p(.3,.7));await tapMouse(page,p(.7,.7));}
 if(id==='draw_z'){await page.mouse.move(...[p(.7,.7).x,p(.7,.7).y]);await page.mouse.down();
  await page.mouse.move(p(.3,.3).x,p(.3,.3).y,{steps:9});await page.waitForTimeout(480);await page.mouse.up();}
}
async function touchDriver(page,engine,w,h){
 const cdp=engine==='Chromium'?await page.context().newCDPSession(page):null;
 const webkitSynthetic=engine==='WebKit';
 const px=(x,y)=>point(w,h,x,y);
 async function send(kind,p){
  if(!webkitSynthetic){
   const points=kind==='touchEnd'||kind==='touchCancel'?[]:[{x:p.x,y:p.y,id:1}];
   await cdp.send('Input.dispatchTouchEvent',{type:kind,touchPoints:points});
  }else{
   await page.evaluate(({kind,p})=>{
    const target=document.querySelector('.lsh-unlock-surface');
    if(!target)throw new Error('Missing shared touch surface');
    const type={touchStart:'pointerdown',touchMove:'pointermove',touchEnd:'pointerup',touchCancel:'pointercancel'}[kind];
    target.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,
     pointerId:42,pointerType:'touch',isPrimary:true,button:0,buttons:kind==='touchEnd'?0:1,
     clientX:p.x,clientY:p.y}));
   },{kind,p});
  }
 }
 async function tap(x,y){
  const p=px(x,y);
  // Trusted tap steps in BOTH engines.
  await page.touchscreen.tap(p.x,p.y);
 }
 async function hold(x,y,ms){
  const p=px(x,y);await send('touchStart',p);await page.waitForTimeout(ms);await send('touchEnd',p);
 }
 async function draw(ms=1500){
  const pts=[[.3,.3],[.7,.3],[.3,.7],[.7,.7]].map(([x,y])=>px(x,y));
  await send('touchStart',pts[0]);
  for(let index=0;index<3;index++){
   const a=pts[index],b=pts[index+1];
   for(let i=1;i<=6;i++){
    const q={x:Math.round(a.x+(b.x-a.x)*i/6),y:Math.round(a.y+(b.y-a.y)*i/6)};
    await send('touchMove',q);
    await page.waitForTimeout(24);
   }
  }
  await page.waitForTimeout(Math.max(0,ms-500));await send('touchEnd',pts[3]);
 }
 const run=async id=>{
  if(id==='corners4'){
   const corners=[[38/w,38/h],[(w-38)/w,38/h],[38/w,(h-38)/h],[(w-38)/w,(h-38)/h]];
   for(const [x,y] of corners)await tap(x,y);
  }else if(id==='tap_hold_tap'){await tap(.5,.7);await hold(.5,.7,2200);await tap(.5,.7);}
  else if(id==='hold_double_tap'){await hold(.3,.6,2800);await tap(.7,.6);await tap(.7,.6);}
  else if(id==='triangle3'){await tap(.5,.3);await tap(.3,.7);await hold(.7,.7,750);}
  else if(id==='draw_z')await draw();
 };
 const wrong=async id=>{
  if(id==='corners4'){await tap(38/w,38/h);await tap(38/w,(h-38)/h);}
  if(id==='tap_hold_tap'){await tap(.5,.7);await tap(.1,.1);}
  if(id==='hold_double_tap'){await hold(.3,.6,100);await tap(.7,.6);}
  if(id==='triangle3'){await tap(.5,.3);await tap(.3,.7);await tap(.7,.7);}
  if(id==='draw_z'){await hold(.7,.7,450);}
 };
 return {run,wrong,kind:webkitSynthetic?'T2 taps + T5 synthetic holds/drag':'T2 CDP native touch'};
}
async function addFakeFullscreen(page){
 await page.addInitScript(()=>{
  window.__stageBFS=true;
  Object.defineProperty(Document.prototype,'fullscreenElement',{configurable:true,
   get(){return window.__stageBFS?document.documentElement:null}});
  Element.prototype.requestFullscreen=function(){window.__stageBFS=true;return Promise.resolve()};
  window.__stageBTrusted=0;
  document.addEventListener('pointerdown',e=>{if(e.isTrusted)window.__stageBTrusted++},true);
 });
}
async function openTimed(page,lab,code){
 const response=await page.goto(buildURL(lab,code),{waitUntil:'domcontentloaded'});
 assert.equal(response.status(),200,'URL should load');
 await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:25000});
 await page.locator('#sessionStart').click();
 await page.locator('#workspace:not([hidden])').waitFor({timeout:20000});
 if(!await page.locator('#sessionLock').isVisible())await page.mouse.click(120,170,{button:'right'});
 await page.locator('#sessionLock:not([hidden])').waitFor({timeout:10000});
}
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('T2/T5 matrix '+engineName+' both LABs x five gestures x mouse/touch x viewport', {timeout:1500000},async()=>{
  const browser=await engine.launch({headless:true});
  const sizes=engineName==='Chromium'?[[390,844],[820,1180],[1180,820],[1366,768],[1920,1080]]:
   [[820,1180],[1366,768]];
  const counts={mouse:0,touch:0,synthetic:0,wrongRejected:0};
  try{
   for(const [w,h] of sizes){
    for(const lab of labs)for(let i=0;i<kinds.length;i++){
     for(const input of ['mouse','touch']){
      const context=await browser.newContext({viewport:{width:w,height:h},hasTouch:input==='touch',reducedMotion:'reduce'});
      const page=await context.newPage();
      try{
       await addFakeFullscreen(page);await openTimed(page,lab,codes[i]);
       const driver=input==='touch'?await touchDriver(page,engineName,w,h):null;
       if(input==='mouse')await wrongMouse(page,kinds[i],w,h);
       else await driver.wrong(kinds[i]);
       assert.equal(await page.locator('#sessionLock').isVisible(),true,
        'Wrong input must stay locked: '+engineName+' '+lab.name+' '+kinds[i]+' '+input+' '+w+'x'+h);
       counts.wrongRejected++;
       const baseline=await page.evaluate(()=>window.__stageBTrusted);
       if(input==='mouse')await gestureMouse(page,kinds[i],w,h);
       else await driver.run(kinds[i]);
       await page.locator('#sessionLock').waitFor({state:'hidden',timeout:10000});
       if(input==='mouse'||engineName==='Chromium'||kinds[i]==='corners4'||kinds[i]==='triangle3'){
        const trusted=await page.evaluate(()=>window.__stageBTrusted);
        assert.ok(trusted>baseline,'Expected at least one trusted pointer event');
       }
       if(input==='touch'&&engineName==='WebKit'&&!['corners4'].includes(kinds[i]))counts.synthetic++;
       counts[input]++;
      }finally{await context.close();}
     }
    }
   }
   console.log('T2/T5 '+engineName+' '+JSON.stringify(counts)+' viewports='+JSON.stringify(sizes));
   assert.equal(counts.mouse,sizes.length*labs.length*kinds.length);
   assert.equal(counts.touch,sizes.length*labs.length*kinds.length);
  }finally{await browser.close()}
 });
 test('T3 native Fullscreen API '+engineName+' both LABs x gestures with Z 1.5s / 3.8s',
  {timeout:420000},async()=>{
  const browser=await engine.launch({headless:true});
  const results=[],errors=[];
  try{
   for(const lab of labs)for(let i=0;i<kinds.length;i++){
    const variants=kinds[i]==='draw_z'?[1500,3800]:[1500];
    for(const drawDuration of variants){
     const context=await browser.newContext({viewport:{width:820,height:1180},hasTouch:false});
     const page=await context.newPage();
     try{
      page.on('pageerror',e=>errors.push(lab.name+':'+kinds[i]+':'+e.message));
      const response=await page.goto(buildURL(lab,codes[i]),{waitUntil:'domcontentloaded'});
      assert.equal(response.status(),200);
      const support=await page.evaluate(()=>typeof document.documentElement.requestFullscreen==='function');
      if(!support){
       results.push({lab:lab.name,gesture:kinds[i],ms:drawDuration,classification:'SKIPPED',reason:'fullscreen API unavailable in this engine/mode'});
       continue;
      }
      await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:15000});
      await page.locator('#sessionStart').click();
      await page.waitForTimeout(200);
      if(await page.evaluate(()=>!!document.fullscreenElement)){
       await page.evaluate(()=>document.exitFullscreen());
       await page.locator('#sessionLock:not([hidden])').waitFor({timeout:8000});
      }else if(!await page.locator('#sessionLock').isVisible()){
       await page.mouse.click(120,170,{button:'right'});
       await page.locator('#sessionLock:not([hidden])').waitFor({timeout:8000});
      }
      const rect=await page.locator('#sessionLock').boundingBox();
      assert.ok(rect&&rect.width>0&&rect.height>0);
      await gestureMouse(page,kinds[i],rect.width,rect.height,drawDuration);
      try{
       await page.waitForFunction(()=>{
        const btn=document.getElementById('sessionUnlockContinue');
        return !!document.fullscreenElement||(btn&&!btn.hidden);
       },{timeout:4500});
      }catch(_){}
      const outcome=await page.evaluate(()=>({
       fullscreen:!!document.fullscreenElement,
       lock:!document.getElementById('sessionLock').hidden,
       fallback:!document.getElementById('sessionUnlockContinue').hidden,
       reason:document.getElementById('sessionLockReason').textContent.trim()
      }));
      let classification='UNCLASSIFIED';
      if(outcome.fullscreen&&!outcome.lock)classification='ENTERED';
      else if(!outcome.fullscreen&&outcome.lock&&outcome.fallback)classification='DENIED';
      else if(!outcome.fullscreen&&outcome.lock&&outcome.reason)classification='DENIED_OR_PENDING';
      results.push({lab:lab.name,gesture:kinds[i],ms:drawDuration,classification,outcome});
      assert.notEqual(classification,'UNCLASSIFIED','Unexpected T3 outcome: '+JSON.stringify(results.at(-1)));
     }finally{await context.close()}
    }
   }
   assert.deepEqual(errors,[],'Native Fullscreen path must not throw page errors');
   console.log('T3 REAL '+engineName+' '+JSON.stringify(results));
  }finally{await browser.close()}
 });
}
