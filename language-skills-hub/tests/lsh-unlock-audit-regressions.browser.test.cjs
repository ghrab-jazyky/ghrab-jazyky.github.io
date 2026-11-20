'use strict';
// T4 injects Fullscreen outcomes; mouse input and QR decoding use real browsers.
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright'),jsQR=require('jsqr'),{PNG}=require('pngjs');
const BASE=process.env.LSH_STAGEB_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const labs=[
 {name:'Reading',skill:'reading',student:'self-check/reading/index.html',topic:'rl-asteroids'},
 {name:'Listening',skill:'listening',student:'self-check/listening/student.html',topic:'ll-sad'}
];
let serial=0;
const fresh=()=>'classaudit'+Date.now().toString(36)+(serial++).toString(36);
function urlFor(lab,teacher=false,attempt=fresh(),variant='n1'){
 const url=new URL(teacher?'self-check/'+lab.skill+'/teacher.html':lab.student,BASE);
 for(const [key,value] of Object.entries({topic:lab.topic,level:'B2',timer:'5',p:variant}))url.searchParams.set(key,value);
 if(lab.skill==='reading')url.searchParams.set('lang','en');
 if(!teacher)url.searchParams.set('attempt',attempt);
 return url.href;
}
function studentInstrumentation(){
 let sessionApi;
 Object.defineProperty(window,'LSHSessionUI',{configurable:true,
  get:()=>sessionApi,set:api=>{
   sessionApi={...api,mount(...args){
    const session=api.mount(...args);window.__auditSession=session;return session;
   }};
  }});
 window.__auditHidden=false;window.__auditFull=true;
 window.__auditFsMode='success';window.__auditRequests=[];
 Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__auditHidden});
 Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__auditHidden?'hidden':'visible'});
 Object.defineProperty(Document.prototype,'fullscreenElement',{configurable:true,
  get:()=>window.__auditFull?document.documentElement:null});
 Element.prototype.requestFullscreen=function(){
  if(window.__auditFsMode==='success'){window.__auditFull=true;return Promise.resolve();}
  return new Promise((resolve,reject)=>window.__auditRequests.push({
   resolve:()=>{window.__auditFull=true;resolve();},
   reject:()=>reject(new Error('T4 injected rejection'))
  }));
 };
}
async function student(browser,lab,{hasTouch=false,variant='n1',rawRegistry}={}){
 const attempt=fresh();
 const key='lsh:device-attempt:r64:'+lab.skill+':'+attempt+':'+[lab.topic,'en','B2'].join('|');
 const options={viewport:{width:820,height:1180},hasTouch};
 if(rawRegistry!==undefined)options.storageState={cookies:[],origins:[{
  origin:new URL(BASE).origin,localStorage:[{name:key,value:rawRegistry}]
 }]};
 const context=await browser.newContext(options),page=await context.newPage();
 await page.addInitScript(studentInstrumentation);
 const response=await page.goto(urlFor(lab,false,attempt,variant),{waitUntil:'domcontentloaded'});
 assert.equal(response.status(),200,lab.name+' student HTTP');
 await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:20000});
 return {context,page,key};
}
const state=page=>page.evaluate(()=>window.__auditSession.status());
async function lock(page,start=false){
 if(start){
  await page.locator('#sessionStart').click();
  await page.locator('#workspace:not([hidden])').waitFor({timeout:12000});
 }
 if(!await page.locator('#sessionLock').isVisible())await page.mouse.click(110,180,{button:'right'});
 await page.locator('#sessionLock:not([hidden])').waitFor({timeout:6000});
 assert.equal((await state(page)).phase,'interrupted');
}
async function corners(page,start=0,end=4){
 const {width:w,height:h}=page.viewportSize();
 const points=[[38,38],[w-38,38],[38,h-38],[w-38,h-38]];
 for(const [x,y] of points.slice(start,end))await page.mouse.click(x,y);
}
async function triangle(page,chord=false){
 const {width:w,height:h}=page.viewportSize();
 for(const [x,y] of [[.5,.3],[.3,.7]])await page.mouse.click(w*x,h*y,{delay:25});
 await page.mouse.move(w*.7,h*.7);await page.mouse.down();
 if(chord){await page.mouse.down({button:'right'});await page.mouse.up({button:'right'});}
 await page.waitForTimeout(1800);await page.mouse.up(); // realistic teacher hold in both student labs
}
async function setHidden(page,hidden){
 await page.evaluate(value=>{
  window.__auditHidden=value;document.dispatchEvent(new Event('visibilitychange'));
 },hidden);
}
async function pending(page){
 const index=await page.evaluate(()=>{
  window.__auditFull=false;window.__auditFsMode='pending';return window.__auditRequests.length;
 });
 await corners(page);
 await page.waitForFunction(n=>window.__auditRequests.length===n+1,index,{timeout:2000});
 return index;
}
async function assertLocked(page,resumptions,label){
 const current=await state(page);
 assert.equal(current.phase,'interrupted',label+': interrupted phase');
 assert.equal(current.resumptions.length,resumptions,label+': no extra resume');
 assert.equal(await page.locator('#sessionLock').isVisible(),true,label+': overlay remains visible');
 assert.equal(await page.locator('#sessionUnlockContinue').isVisible(),false,label+': no stale fallback');
}
async function resumeFresh(page,resumptions){
 await page.evaluate(()=>{window.__auditFull=false;window.__auditFsMode='success';});
 await corners(page);
 await page.locator('#sessionLock').waitFor({state:'hidden',timeout:4000});
 const current=await state(page);
 assert.equal(current.phase,'running');assert.equal(current.resumptions.length,resumptions+1);
}
async function draft(page,label){
 assert.equal(await page.locator('#studentUrl').inputValue(),'',label+': no published URL');
 assert.equal(await page.locator('#qrMount svg').count(),0,label+': no QR');
 assert.equal(await page.locator('#copyUrl').isDisabled(),true,label+': copy disabled');
 assert.equal(await page.locator('#downloadQr').isDisabled(),true,label+': download disabled');
 assert.equal(await page.locator('#studentPreview').getAttribute('aria-disabled'),'true',label+': preview disabled');
 assert.doesNotMatch(await page.locator('#publishStatus').textContent(),/POTVRZENO/,label);
}
async function publish(page,code){
 await page.locator('#confirmTest:enabled').click();
 await page.locator('#qrMount svg').waitFor({timeout:8000});
 const link=await page.locator('#studentUrl').inputValue(),url=new URL(link);
 assert.equal(url.searchParams.get('p'),code,'URL must follow the selected radio');
 const png=PNG.sync.read(await page.locator('#qrMount svg').screenshot({scale:'device'}));
 const decoded=jsQR(new Uint8ClampedArray(png.data.buffer,png.data.byteOffset,png.data.byteLength),png.width,png.height);
 assert.equal(decoded?.data,link,'Independently decoded QR must match the confirmed URL');
 return url.searchParams.get('attempt');
}
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('Audit A1 '+engineName+': background invalidates pending Fullscreen generations in both LABs',
 {timeout:125000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const lab of labs)for(const hasTouch of [false,true]){
    const s=await student(browser,lab,{hasTouch});
    try{
     await lock(s.page,true);
     for(const outcome of ['reject','resolve','timeout']){
      const before=(await state(s.page)).resumptions.length,index=await pending(s.page);
      await setHidden(s.page,true);
      if(outcome==='timeout')await s.page.waitForTimeout(3150);
      else await s.page.evaluate(({index,outcome})=>window.__auditRequests[index][outcome](),{index,outcome});
      await s.page.waitForTimeout(30);
      const label=lab.name+' '+(hasTouch?'hybrid':'desktop')+' '+outcome;
      await assertLocked(s.page,before,label+' while hidden');
      await setHidden(s.page,false);
      if(outcome==='timeout'){
       await s.page.evaluate(index=>window.__auditRequests[index].resolve(),index);
       await s.page.waitForTimeout(30);
      }
      await assertLocked(s.page,before,label+' after return');
      await resumeFresh(s.page,before);
      await lock(s.page);
     }
     // A response from the previous generation cannot settle a newer request.
     const before=(await state(s.page)).resumptions.length,oldIndex=await pending(s.page);
     await setHidden(s.page,true);await setHidden(s.page,false);
     const newIndex=await pending(s.page);
     await s.page.evaluate(index=>window.__auditRequests[index].resolve(),oldIndex);
     await s.page.waitForTimeout(30);
     await assertLocked(s.page,before,lab.name+' obsolete promise during fresh request');
     await s.page.evaluate(index=>window.__auditRequests[index].resolve(),newIndex);
     await s.page.locator('#sessionLock').waitFor({state:'hidden',timeout:4000});
     assert.equal((await state(s.page)).resumptions.length,before+1);
     await lock(s.page);
     const count=(await state(s.page)).resumptions.length,hiddenIndex=await pending(s.page);
     await s.page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
     await s.page.evaluate(index=>window.__auditRequests[index].reject(),hiddenIndex);
     await s.page.waitForTimeout(30);
     await assertLocked(s.page,count,lab.name+' pagehide invalidation');
     await s.page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
     await resumeFresh(s.page,count);
    }finally{await s.context.close();}
   }
  }finally{await browser.close();}
 });
 test('Audit A2/A5 '+engineName+': trusted mouse chord cancels; ordinary legacy blur preserves progress',
 {timeout:60000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const lab of labs){
    const s=await student(browser,lab,{variant:'n4'});
    try{
     await lock(s.page,true);
     await s.page.evaluate(()=>{
      window.__auditMoves=[];
      document.querySelector('.lsh-unlock-surface').addEventListener('pointermove',e=>
       window.__auditMoves.push({trusted:e.isTrusted,buttons:e.buttons}));
     });
     const before=(await state(s.page)).resumptions.length;
     await triangle(s.page,true);
     assert.ok(await s.page.evaluate(()=>window.__auditMoves.some(e=>e.trusted&&e.buttons===3)),
      'The browser must deliver a real two-button chord');
     await assertLocked(s.page,before,lab.name+' mouse chord');
     await triangle(s.page);
     await s.page.locator('#sessionLock').waitFor({state:'hidden',timeout:4000});
     assert.equal((await state(s.page)).resumptions.length,before+1);
    }finally{await s.context.close();}
    const legacy=await student(browser,lab,{variant:'n1'});
    try{
     await lock(legacy.page,true);
     await corners(legacy.page,0,2);
     await legacy.page.evaluate(()=>window.dispatchEvent(new Event('blur')));
     await corners(legacy.page,2,4);
     await legacy.page.locator('#sessionLock').waitFor({state:'hidden',timeout:4000});
     assert.equal((await state(legacy.page)).resumptions.length,1,lab.name+' legacy progress survives blur');
    }finally{await legacy.context.close();}
   }
  }finally{await browser.close();}
 });
 test('Audit A3 '+engineName+': unreadable registry history stays unknown across recovery and reload',
 {timeout:65000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const lab of labs){
    for(const rawRegistry of ['{not-json','null','{"session":"broken","variant":"legacy","consumed":false}']){
     const s=await student(browser,lab,{variant:'n4',rawRegistry});
     try{
      let current=await state(s.page);
      assert.equal(current.configurationMismatchSeen,null,lab.name+' unreadable history is not clean');
      assert.equal(current.mismatchAtLastOpen,null,lab.name+' unavailable previous configuration');
      assert.equal(current.pinnedUnlockCode,'n4');
      await s.page.reload({waitUntil:'domcontentloaded'});
      await s.page.locator('#sessionIntro:not([hidden])').waitFor({timeout:15000});
      current=await state(s.page);
      assert.equal(current.configurationMismatchSeen,null,lab.name+' unknown history survives reload');
     }finally{await s.context.close();}
    }
    const clean=await student(browser,lab,{variant:'n4'});
    try{assert.equal((await state(clean.page)).configurationMismatchSeen,false,
     lab.name+' genuinely new registry starts known-clean');}
    finally{await clean.context.close();}
   }
  }finally{await browser.close();}
 });
 test('Audit A4 '+engineName+': silent radio changes require fresh confirmation and accurate QR',
 {timeout:65000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const lab of labs){
    const context=await browser.newContext({viewport:{width:1024,height:768},deviceScaleFactor:2});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    try{
     assert.equal((await page.goto(urlFor(lab,true),{waitUntil:'domcontentloaded'})).status(),200);
     await page.locator('#confirmTest:enabled').waitFor({timeout:20000});
     await page.evaluate(()=>{
      document.querySelector('input[name="unlockMethod"][value="triangle3"]').checked=true;
      document.getElementById('confirmTest').click();
     });
     await draft(page,lab.name+' silent draft change');
     const first=await publish(page,'n4');
     await page.evaluate(()=>{
      document.querySelector('input[name="unlockMethod"][value="draw_z"]').checked=true;
      document.getElementById('copyUrl').click();
     });
     await draft(page,lab.name+' synchronous copy detects radio change');
     const second=await publish(page,'n5');
     assert.notEqual(second,first,'Changed radio creates a new attempt');
     const allowed=await page.evaluate(()=>{
      document.querySelector('input[name="unlockMethod"][value="tap_hold_tap"]').checked=true;
      return document.getElementById('studentPreview').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
     });
     assert.equal(allowed,false,'Stale student preview is cancelled');
     await draft(page,lab.name+' preview invalidation');
     const third=await publish(page,'n2');assert.notEqual(third,second);
     await page.evaluate(()=>{document.querySelector('input[name="unlockMethod"][value="hold_double_tap"]').checked=true;});
     await page.waitForFunction(()=>document.getElementById('studentUrl').value==='',null,{timeout:2500});
     await draft(page,lab.name+' watchdog detects silent radio');
     const fourth=await publish(page,'n3');assert.notEqual(fourth,third);
     await page.evaluate(()=>{
      for(const radio of document.querySelectorAll('input[name="unlockMethod"]'))radio.checked=false;
      document.getElementById('copyUrl').click();
     });
     await draft(page,lab.name+' absent selection');
     assert.equal(await page.locator('#confirmTest').isDisabled(),true,'No selected gesture is invalid');
     await page.locator('input[name="unlockMethod"][value="corners4"]').check();
     await publish(page,'n1');
     await page.evaluate(()=>{
      document.querySelector('input[name="unlockMethod"]:checked').value='unsupported-method';
      document.getElementById('copyUrl').click();
     });
     await draft(page,lab.name+' unknown radio value');
     assert.equal(await page.locator('#confirmTest').isDisabled(),true,'Unknown gesture is invalid');
     if(lab.skill==='reading'){
      const before=page.url();
      await page.evaluate(()=>{
       const invalid=document.querySelector('input[name="unlockMethod"]:checked');
       invalid.value='corners4';invalid.checked=false;
       const valid=document.querySelector('input[name="unlockMethod"][value="draw_z"]');
       valid.checked=true;valid.dispatchEvent(new Event('change',{bubbles:true}));
       valid.checked=false;
      });
      await page.waitForTimeout(650);
      assert.equal(page.url(),before,'Invalidated selection cancels the queued teacher URL write');
      await draft(page,'Reading invalidates scheduled address update');
      assert.equal(await page.locator('#confirmTest').isDisabled(),true);
     }
     assert.deepEqual(errors,[],'Malformed selection must not throw in the teacher panel');
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 });
}
