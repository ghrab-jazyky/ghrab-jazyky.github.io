'use strict';
/* Temporary diagnostics while certifying B2; do not treat as a release gate. */
const test=require('node:test'),{chromium,webkit}=require('playwright');
const BASE=process.env.LSH_STAGEB_BASE||'http://127.0.0.1:8765/language-skills-hub/';
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('B2 DIAG '+name+' legacy mouse unlock in small and large viewports',{timeout:80000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const [w,h] of [[390,844],[820,1180]]){
    const context=await browser.newContext({viewport:{width:w,height:h},hasTouch:false});
    const page=await context.newPage(),events=[];
    page.on('pageerror',e=>events.push('PAGEERROR '+e.message));
    page.on('console',e=>{if(e.type()==='error')events.push('CONSOLE '+e.text())});
    await page.addInitScript(()=>{
     window.__b2diag={events:[],fs:[],at:[]};
     document.addEventListener('pointerdown',e=>{
      if(e.target?.classList?.contains('lsh-corner'))
       window.__b2diag.events.push({corner:e.target.className,type:e.pointerType,id:e.pointerId,trust:e.isTrusted});
     },true);
     document.addEventListener('fullscreenchange',()=>{
      window.__b2diag.fs.push({full:!!document.fullscreenElement,time:performance.now()});
     });
    });
    const url=new URL('self-check/reading/index.html',BASE);
    url.searchParams.set('topic','rl-asteroids');url.searchParams.set('lang','en');
    url.searchParams.set('level','B2');url.searchParams.set('timer','20');
    url.searchParams.set('attempt','classb2diag'+name.toLowerCase()+w+Date.now());
    await page.goto(url.href,{waitUntil:'domcontentloaded'});
    await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:18000});
    const initial=await page.evaluate(()=>({touch:'ontouchstart' in window,maxTouch:navigator.maxTouchPoints,
     screen:screen.width,viewport:innerWidth,api:!!document.documentElement.requestFullscreen}));
    await page.locator('#sessionStart').click();
    await page.locator('#workspace:not([hidden])').waitFor({timeout:15000});
    await page.reload();
    await page.locator('#sessionLock:not([hidden])').waitFor({timeout:15000});
    for(const corner of ['tl','tr','bl','br']){
     await page.locator('.lsh-corner-'+corner).click();
     const v=await page.evaluate(()=>({locked:!document.getElementById('sessionLock').hidden,
      reason:document.getElementById('sessionLockReason').textContent.trim(),
      fallback:!document.getElementById('sessionUnlockContinue').hidden,full:!!document.fullscreenElement,
      attempts:Object.keys(localStorage).filter(x=>x.startsWith('lsh:local-attempt:r30:')).length}));
     events.push(corner+':'+JSON.stringify(v));
    }
    await page.waitForTimeout(150);
    const diag=await page.evaluate(()=>window.__b2diag);
    console.log('B2LEGACY '+name+' '+w+'x'+h+' '+JSON.stringify({initial,events,diag}));
    await context.close();
   }
  }finally{await browser.close();}
 });
}