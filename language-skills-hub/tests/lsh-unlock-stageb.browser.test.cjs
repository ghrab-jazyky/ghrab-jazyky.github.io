'use strict';
/* Browser tests for LSH Stage B.
 * T2 = trusted Playwright mouse events; T4 = forced fullscreen results.
 * T4 IS NOT T3 (genuine Fullscreen API). Physical iPad / Android not assessed.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.env.LSH_STAGEB_BASE||'http://127.0.0.1:8765/language-skills-hub/';
let sequence=0;
const token=()=>`classstageb${Date.now().toString(36)}${(sequence++).toString(36)}`;
const scenarios=[
 {lab:'Reading',url:'self-check/reading/index.html',topic:'rl-asteroids',lang:'en'},
 {lab:'Listening',url:'self-check/listening/student.html',topic:'ll-sad',lang:null}
];
const codes=['n1','n2','n3','n4','n5'];
const ids=['corners4','tap_hold_tap','hold_double_tap','triangle3','draw_z'];
const at=(w,h,x,y)=>[Math.round(w*x),Math.round(h*y)];
async function clickAt(page,point){await page.mouse.click(...point,{delay:85});}
async function holdAt(page,point,milliseconds){
 await page.mouse.move(...point);
 await page.mouse.down();
 await page.waitForTimeout(milliseconds);
 await page.mouse.up();
}
async function perform(page,gesture){
 const {width:w,height:h}=page.viewportSize();
 const point=(x,y)=>at(w,h,x,y);
 switch(gesture){
  case 'corners4':
   for(const xy of [[38,38],[w-38,38],[38,h-38],[w-38,h-38]])await clickAt(page,xy);
   break;
  case 'tap_hold_tap':
   await clickAt(page,point(.5,.7));await holdAt(page,point(.5,.7),2200);
   await clickAt(page,point(.5,.7));break;
  case 'hold_double_tap':
   await holdAt(page,point(.3,.6),2800);
   await clickAt(page,point(.7,.6));
   await clickAt(page,point(.7,.6));break;
  case 'triangle3':
   await clickAt(page,point(.5,.3));await clickAt(page,point(.3,.7));
   await holdAt(page,point(.7,.7),750);break;
  case 'draw_z':
   await page.mouse.move(...point(.3,.3));await page.mouse.down();
   await page.mouse.move(...point(.7,.3),{steps:6});
   await page.mouse.move(...point(.3,.7),{steps:6});
   await page.mouse.move(...point(.7,.7),{steps:6});
   await page.waitForTimeout(560);await page.mouse.up();break;
  default:throw Error('Unknown gesture '+gesture);
 }
}
async function installMockFullscreen(page){
 await page.addInitScript(()=>{
  window.__stageBMode='success';window.__stageBFullscreen=false;window.__stageBTrusted=0;
  Object.defineProperty(Document.prototype,'fullscreenElement',{configurable:true,
   get(){return window.__stageBFullscreen?document.documentElement:null}});
  Element.prototype.requestFullscreen=function(){
   if(window.__stageBMode==='reject')return Promise.reject(new Error('T4 forced denial'));
   if(window.__stageBMode==='pending')return new Promise(()=>{});
   window.__stageBFullscreen=true;
   document.dispatchEvent(new Event('fullscreenchange'));
   return Promise.resolve();
  };
  document.addEventListener('pointerdown',e=>{if(e.isTrusted)window.__stageBTrusted++;},true);
 });
}
async function openStudent(browser,config,code){
 const context=await browser.newContext({viewport:{width:820,height:1180},reducedMotion:'reduce'});
 const page=await context.newPage();
 await installMockFullscreen(page);
 const url=new URL(config.url,base);
 url.searchParams.set('topic',config.topic);
 if(config.lang)url.searchParams.set('lang',config.lang);
 url.searchParams.set('level','B2');
 url.searchParams.set('timer','5');
 url.searchParams.set('p',code);
 url.searchParams.set('attempt',token());
 const response=await page.goto(url.href,{waitUntil:'domcontentloaded'});
 assert.equal(response.status(),200,config.lab+' GET');
 await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:25000});
 await page.locator('#sessionStart').click();
 await page.locator('#workspace:not([hidden])').waitFor({timeout:15000});
 await page.mouse.click(120,170,{button:'right'});
 await page.locator('#sessionLock:not([hidden])').waitFor({timeout:10000});
 return {context,page,url:url.href};
}
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('T2/T4 '+engineName+' Reading/Listening: five gestures, trusted pointer input', {timeout:360000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const config of scenarios){
    for(let i=0;i<ids.length;i++){
     const session=await openStudent(browser,config,codes[i]);
     try{
      const page=session.page;
      assert.equal(await page.locator('#sessionUnlockContinue').isVisible(),false);
      if(ids[i]==='triangle3'){
       // A normal third tap without the owner-approved 600-1000ms hold must fail.
       const {width:w,height:h}=page.viewportSize();
       await clickAt(page,at(w,h,.5,.3));await clickAt(page,at(w,h,.3,.7));
       await clickAt(page,at(w,h,.7,.7));
       assert.equal(await page.locator('#sessionLock').isVisible(),true,'Old triangle must stay locked');
      }
      await perform(page,ids[i]);
      await page.locator('#sessionLock[hidden]').waitFor({timeout:10000,state:'attached'});
      assert.ok(await page.evaluate(()=>window.__stageBTrusted>0),'Expected trusted pointer events');
      assert.equal(await page.locator('#sessionUnlockContinue').isVisible(),false);
     }finally{await session.context.close();}
    }
   }
  }finally{await browser.close()}
 });
 test('T4 '+engineName+': denied fullscreen offers one-shot Continue, cannot bypass rejection',
  {timeout:90000},async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const session=await openStudent(browser,scenarios[0],'n4');
    try{
     const {page}=session;
     await page.evaluate(()=>{
      window.__stageBMode='reject';window.__stageBFullscreen=false;
      document.dispatchEvent(new Event('fullscreenchange'));
     });
     await page.locator('#sessionLock:not([hidden])').waitFor();
     await perform(page,'triangle3');
     await page.locator('#sessionUnlockContinue:not([hidden])').waitFor({timeout:7000});
     await page.locator('#sessionUnlockContinue').click();
     await page.locator('#sessionUnlockContinue[hidden]').waitFor({state:'attached'});
     assert.equal(await page.locator('#sessionLock').isVisible(),true,'Denial must not resume');
     await page.waitForTimeout(200);
     assert.equal(await page.locator('#sessionUnlockContinue').isVisible(),false,'No second offer');
     // Re-arm a fresh teacher gesture, then verify timeout and focus cleanup separately.
    }finally{await session.context.close();}
   }finally{await browser.close();}
  });
 test('teacher '+engineName+': explicit confirmation and new attempt per change', {timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const part of [
    {url:'self-check/reading/teacher.html?topic=rl-asteroids&lang=en&level=B2&timer=30'},
    {url:'self-check/listening/teacher.html?topic=ll-sad&level=B2&timer=30'}]){
    const page=await browser.newPage({viewport:{width:820,height:1180}});
    try{
     const resp=await page.goto(new URL(part.url,base).href,{waitUntil:'domcontentloaded'});
     assert.equal(resp.status(),200);
     await page.locator('#confirmTest:enabled').waitFor({timeout:25000});
     assert.equal(await page.locator('#qrMount svg').count(),0);
     assert.equal(await page.locator('#copyUrl').isDisabled(),true);
     await page.locator('input[name="unlockMethod"][value="triangle3"]').check();
     await page.locator('#confirmTest').click();
     await page.locator('#qrMount svg').waitFor();
     const first=new URL(await page.locator('#studentUrl').inputValue());
     assert.equal(first.searchParams.get('p'),'n4');
     const attempt=first.searchParams.get('attempt');assert.match(attempt,/^class[a-z0-9]{12,30}$/);
     await page.locator('#timerMinutes').fill('31');
     assert.equal(await page.locator('#studentUrl').inputValue(),'');
     assert.equal(await page.locator('#qrMount svg').count(),0);
     assert.equal(await page.locator('#previousLinkNotice').isVisible(),true);
     await page.locator('#confirmTest').click();
     const second=new URL(await page.locator('#studentUrl').inputValue());
     assert.equal(second.searchParams.get('p'),'n4');
     assert.notEqual(second.searchParams.get('attempt'),attempt);
     assert.equal(second.searchParams.get('timer'),'31');
     const before=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('lsh:device-attempt:')||k.startsWith('lsh:local-attempt:')).length);
     await page.getByRole('button',{name:'VYZKOUŠET GESTO'}).click();
     await page.locator('#lshTeacherDemo').waitFor();
     await page.keyboard.press('Escape');
     assert.equal(await page.locator('#lshTeacherDemo').count(),0);
     const after=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('lsh:device-attempt:')||k.startsWith('lsh:local-attempt:')).length);
     assert.equal(after,before,'Demo must not touch attempt state');
    }finally{await page.close()}
   }
  }finally{await browser.close()}
 });
}
