#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const key='lsh:pwa-install-choice:v1';
const ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const iphone='Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1';
const android='Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36';
async function open(engine,options={},before=()=>{}){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce',userAgent:ua,...options});
 const page=await context.newPage();
 await page.addInitScript(()=>localStorage.setItem('lsh:teacher-whats-new:last-offered-sequence:v1','2147483647'));
 await before(page);
 return {page,browser};
}
async function enter(page){
 await page.goto(base);
 await page.locator('#skillChooser:not([hidden])').waitFor();
 await page.locator('#pwaInstallOffer:visible').waitFor();
 await page.waitForFunction(()=>document.getElementById('pwaInstallOffer').getBoundingClientRect().width>0);
}
async function geometry(page,tag){
 const m=await page.evaluate(()=>{
  const $=id=>document.getElementById(id);
  const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
  const a=rect($('pwaInstallOffer')),b=rect(document.querySelector('#skillChooser .chooser-panel'));
  const intersection=Math.max(0,Math.min(a.right,b.right)-Math.max(a.x,b.x))*
   Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y));
  return {a,b,intersection,viewport:{w:document.documentElement.clientWidth,h:innerHeight},
   docked:$('skillChooser').classList.contains('pwa-install-docked'),
   scrollTop:$('skillChooser').scrollTop,
   bannerVisible:getComputedStyle($('pwaInstallOffer')).visibility!=='hidden',
   scroll:$('skillChooser').scrollWidth-document.documentElement.clientWidth,
   insideCard:document.querySelector('.chooser-panel').contains($('pwaInstallOffer')),
   back:rect($('closeChooser'))};
 });
 assert.equal(m.insideCard,false,tag+': popup must be OUTSIDE the "Co dnes potřebuješ" card');
 if(m.bannerVisible){
  assert.ok(m.a.x>=-1&&m.a.right<=m.viewport.w+1,tag+': popup outside viewport '+JSON.stringify(m));
  assert.ok(m.a.y>=-1&&m.a.bottom<=m.viewport.h+2,tag+': popup below viewport '+JSON.stringify(m));
  assert.ok(m.intersection<1,tag+': visible popup must not cover ANY portion of chooser card '+JSON.stringify(m));
 }else{
  assert.ok(m.docked&&m.scrollTop>4,tag+': only a scrolling compact popup may be invisible '+JSON.stringify(m));
 }
 assert.ok(m.scroll<=3,tag+': horizontal viewport overflow '+JSON.stringify(m));
 return m;
}

test('Real Chromium parses LSH PWA manifest and evaluates installability without simulated events',{timeout:90000},async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:'allow'});
 const page=await context.newPage();
 try{
  const cdp=await context.newCDPSession(page);
  await cdp.send('Page.enable');
  await page.goto(base);
  await page.evaluate(async()=>{
   await navigator.serviceWorker.register('./sw.js',{scope:'./'});
   await navigator.serviceWorker.ready;
  });
  await page.reload();
  const report=await cdp.send('Page.getAppManifest');
  assert.equal(report.errors?.length||0,0,JSON.stringify(report.errors));
  assert.ok(report.data,'Chromium did not discover a web app manifest');
  const manifest=JSON.parse(report.data);
  assert.equal(manifest.name,'Language Skills Hub');
  assert.equal(manifest.start_url,'/language-skills-hub/');
  assert.equal(manifest.display,'standalone');
  assert.ok(manifest.icons.some(x=>x.sizes==='192x192'));
  assert.ok(manifest.icons.some(x=>x.sizes==='512x512'));
  assert.ok(manifest.icons.some(x=>x.purpose==='maskable'&&x.sizes==='512x512'));
  const iconResults=await page.evaluate(async()=>{
   const manifestUrl=new URL('./manifest.webmanifest',location.href);
   const parsed=await (await fetch(manifestUrl)).json();
   const out=[];
   for(const icon of parsed.icons){
    const resp=await fetch(new URL(icon.src,manifestUrl),{cache:'no-store'});
    if(!resp.ok)throw new Error('Icon HTTP '+resp.status+': '+icon.src);
    if(!resp.headers.get('content-type')?.includes('image/png'))
     throw new Error('Unexpected content-type: '+icon.src);
    const bitmap=await createImageBitmap(await resp.blob());
    out.push({size:bitmap.width,height:bitmap.height,purpose:icon.purpose});
    bitmap.close();
   }
   return out;
  });
  assert.deepEqual(iconResults,[
   {size:192,height:192,purpose:'any'},
   {size:512,height:512,purpose:'any'},
   {size:512,height:512,purpose:'maskable'}
  ]);
  const eligibility=await cdp.send('Page.getInstallabilityErrors');
  assert.deepEqual(eligibility.installabilityErrors,[],
   'Real Chromium installability errors: '+JSON.stringify(eligibility.installabilityErrors));
 }finally{await browser.close()}
});

for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('PWA '+name+' Ctrl+R keeps the install panel visible when user has not dismissed it',{timeout:90000},async()=>{
  const {page,browser}=await open(engine,{viewport:{width:1366,height:768}});
  try{
   await enter(page);
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null);
   await page.reload();
   await page.locator('#skillChooser:not([hidden])').waitFor();
   await page.locator('#pwaInstallOffer:visible').waitFor();
   await geometry(page,name+' refresh without preference');
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null);
  }finally{await browser.close()}
 });
 test('PWA '+name+' closing X is temporary and Ctrl+R reopens the offer',{timeout:90000},async()=>{
  const {page,browser}=await open(engine,{viewport:{width:1366,height:768}});
  try{
   await enter(page);
   await page.locator('#pwaOfferClose').click();
   assert.equal(await page.locator('#pwaInstallOffer').isHidden(),true);
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null,
    'Close X must not persist a seven-day snooze');
   await page.reload();
   await page.locator('#skillChooser:not([hidden])').waitFor();
   await page.locator('#pwaInstallOffer:visible').waitFor();
   await geometry(page,name+' after closing X and Ctrl+R');
  }finally{await browser.close()}
 });
 test('PWA '+name+' reload from scrolled 320px chooser returns banner to top',{timeout:90000},async()=>{
  const {page,browser}=await open(engine,{viewport:{width:320,height:568}});
  try{
   await enter(page);
   await page.locator('#skillChooser').evaluate(el=>{el.scrollTop=el.scrollHeight;});
   await page.waitForTimeout(150);
   const offset=await page.locator('#skillChooser').evaluate(el=>el.scrollTop);
   assert.ok(offset>4,'Narrow chooser must be scrollable for this regression');
   await page.reload();
   await page.locator('#skillChooser:not([hidden])').waitFor();
   await page.locator('#pwaInstallOffer:visible').waitFor();
   const atTop=await page.locator('#skillChooser').evaluate(el=>el.scrollTop);
   assert.ok(atTop<=4,'Reload must not restore popup in a scrolled-hidden state: '+atTop);
   await geometry(page,name+' narrow refresh after scroll');
  }finally{await browser.close()}
 });
 test('PWA '+name+' explicit recovery restores snoozed, never and stale installed preferences',{timeout:90000},async()=>{
  const {page,browser}=await open(engine);
  try{
   await enter(page);
   await page.evaluate(()=>localStorage.setItem('lsh:test-unrelated-key','keep'));
   for(const option of ['later','never','installed']){
    await page.evaluate(([k,choice])=>
     localStorage.setItem(k,JSON.stringify({choice,until:Date.now()+7*86400000})),[key,option]);
    await page.reload();
    await page.locator('#skillChooser:not([hidden])').waitFor();
    assert.equal(await page.locator('#pwaInstallOffer').isHidden(),true,
     'Normal refresh must respect an explicit installation preference: '+option);
    await page.goto(base+'?pwa=reset');
    await page.locator('#skillChooser:not([hidden])').waitFor();
    await page.locator('#pwaInstallOffer:visible').waitFor();
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null);
    assert.equal(await page.evaluate(()=>localStorage.getItem('lsh:test-unrelated-key')),'keep');
    assert.equal(new URL(page.url()).searchParams.has('pwa'),false,'Recovery URL parameter must not persist');
   }
  }finally{await browser.close()}
 });
 test('PWA '+name+' direct lab reload hides popup but change-lab shows it again',{timeout:90000},async()=>{
  const {page,browser}=await open(engine);
  try{
   await page.goto(base+'?skill=cteni');
   await page.locator('#catalog:not([hidden])').waitFor();
   assert.equal(await page.locator('#pwaInstallOffer').isHidden(),true);
   await page.locator('#changeLab').click({timeout:5000});
   await page.locator('#pwaInstallOffer:visible').waitFor();
   await geometry(page,name+' after lab change');
  }finally{await browser.close()}
 });
 test('PWA '+name+' unsupported browser does not silently lose the offer',{timeout:90000},async()=>{
  const firefox='Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0';
  const {page,browser}=await open(engine,{userAgent:firefox});
  try{
   await enter(page);
   assert.equal(await page.locator('#pwaOfferInstall').isEnabled(),true);
   await page.locator('#pwaOfferInstall').click();
   assert.match(await page.locator('#pwaOfferHelp').innerText(),/Chrome nebo Edge/);
  }finally{await browser.close()}
 });
 test('PWA '+name+' desktop: independent right-corner notification, three labs unaffected',{timeout:90000},async()=>{
  const {page,browser}=await open(engine,{viewport:{width:1920,height:1080}});
  try{
   await enter(page);
   const m=await geometry(page,name+' large desktop');
   assert.equal(m.docked,false,'Large desktop must have independent right rail');
   assert.ok(m.a.x>m.b.right,'Popup should be completely to the RIGHT of chooser card');
   assert.equal(await page.locator('[data-choose-skill]').count(),3);
   assert.equal(await page.locator('#pwaOfferInstall').isEnabled(),true,
    'Fallback action must remain clickable before the install event arrives');
   assert.match(await page.locator('#pwaOfferInstall').innerText(),/Instalovat přes nabídku prohlížeče/);
   await page.locator('#pwaOfferInstall').click();
   assert.match(await page.locator('#pwaOfferHelp').innerText(),/Nainstalovat stránku jako aplikaci/);
   await page.locator('#pwaOfferLater').click();
   assert.equal(await page.locator('#pwaInstallOffer').isHidden(),true);
   const preference=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
   assert.equal(preference.choice,'later');
   assert.ok(preference.until>Date.now()+6*86400000);
   await page.reload();
   await page.locator('#skillChooser:not([hidden])').waitFor();
   assert.equal(await page.locator('#pwaInstallOffer').isHidden(),true);
  }finally{await browser.close()}
 });
 test('PWA '+name+' one click opens native installer without instructional intermediate',{timeout:90000},async()=>{
  const {page,browser}=await open(engine);
  try{
   await enter(page);
   const prevented=await page.evaluate(()=>{
    window.__nativePrompts=0;
    const e=new Event('beforeinstallprompt',{cancelable:true});
    e.prompt=()=>{window.__nativePrompts++;return Promise.resolve({outcome:'accepted'});};
    e.userChoice=Promise.resolve({outcome:'accepted'});
    window.dispatchEvent(e);return e.defaultPrevented;
   });
   assert.equal(prevented,true);
   assert.equal(await page.locator('#pwaOfferInstall').isEnabled(),true);
   assert.match(await page.locator('#pwaOfferInstall').innerText(),/Nainstalovat LSH/);
   await page.locator('#pwaOfferInstall').click();
   await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'null')?.choice==='installed',key);
   assert.equal(await page.evaluate(()=>window.__nativePrompts),1);
   assert.equal(await page.locator('#pwaInstallOffer').isHidden(),true);
   await page.goto(base+'?skill=cteni');
   await page.locator('#catalog:not([hidden])').waitFor();
   assert.equal(await page.locator('#pwaInstallOffer').isHidden(),true);
  }finally{await browser.close()}
 });
 test('PWA '+name+' modern navigator.install method used directly if browser supports it',{timeout:90000},async()=>{
  const {page,browser}=await open(engine,{},async page=>{
   await page.addInitScript(()=>{
    window.__webInstallCalls=0;
    Object.defineProperty(navigator,'install',{configurable:true,value:()=>{
     window.__webInstallCalls++;return Promise.resolve({});}});
   });
  });
  try{
   await enter(page);
   assert.equal(await page.locator('#pwaOfferInstall').isEnabled(),true);
   await page.locator('#pwaOfferInstall').click();
   await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'null')?.choice==='installed',key);
   assert.equal(await page.evaluate(()=>window.__webInstallCalls),1);
  }finally{await browser.close()}
 });
 test('PWA '+name+' permanent dismissal, Back and chooser navigation',{timeout:90000},async()=>{
  const {page,browser}=await open(engine);
  try{
   await enter(page);
   await page.locator('#closeChooser').click({timeout:5000});
   await page.locator('#skipIntro').click({timeout:5000});
   await page.locator('#pwaInstallOffer:visible').waitFor();
   await page.locator('[data-choose-skill="cteni"]').click({timeout:5000});
   await page.locator('#catalog:not([hidden])').waitFor();
   await page.locator('#changeLab').click({timeout:5000});
   await page.locator('#pwaInstallOffer:visible').waitFor();
   await page.locator('#closeChooser').click({timeout:5000});
   await page.locator('#catalog:not([hidden])').waitFor();
   await page.locator('#changeLab').click({timeout:5000});
   await page.locator('#pwaOfferNever').click();
   await page.reload();
   await page.locator('#catalog:not([hidden])').waitFor();
   await page.locator('#changeLab').click();
   assert.equal(await page.locator('#pwaInstallOffer').isHidden(),true);
  }finally{await browser.close()}
 });
 test('PWA '+name+' narrow & mobile viewport matrix has no chooser overlap',{timeout:90000},async()=>{
  const {page,browser}=await open(engine,{viewport:{width:320,height:568}});
  try{
   await enter(page);
   const matrix=[[320,568],[375,667],[390,844],[430,932],[768,1024],
    [844,390],[932,430],[1024,768],[1280,800],[1366,768],[1440,900],[1920,1080]];
   for(const [w,h] of matrix){
    await page.setViewportSize({width:w,height:h});
    await page.waitForTimeout(100);
    const m=await geometry(page,name+' '+w+'x'+h);
    if(w<=430||h<=430){
     await page.locator('#skillChooser').evaluate(el=>{el.scrollTop=el.scrollHeight;});
     await page.waitForTimeout(100);
     const scrolled=await geometry(page,name+' scrolled '+w+'x'+h);
     if(scrolled.docked&&scrolled.scrollTop>4)
      assert.equal(scrolled.bannerVisible,false,'Scrolling mobile chooser must hide corner notification');
    }
    assert.ok(m.a.width>=150, 'Notification must remain readable');
    const button=page.locator('#closeChooser');
    await button.click({timeout:5000});
    await page.locator('#skipIntro').click({timeout:5000});
    await page.locator('#skillChooser:not([hidden])').waitFor();
   }
  }finally{await browser.close()}
 });
 test('PWA '+name+' iPhone: unobtrusive top banner with honest manual install fallback',{timeout:90000},async()=>{
  const {page,browser}=await open(engine,{viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:iphone});
  try{
   await enter(page);
   const m=await geometry(page,name+' iPhone');
   assert.equal(m.docked,true);
   assert.equal(await page.locator('#pwaOfferInstall').isEnabled(),true);
   assert.match(await page.locator('#pwaOfferInstall').innerText(),/Přidat na plochu/);
   await page.locator('#pwaOfferInstall').tap();
   assert.match(await page.locator('#pwaOfferHelp').innerText(),/Sdílet.*Přidat na plochu/);
   await page.waitForTimeout(100);
   await geometry(page,name+' iPhone expanded');
   await page.locator('#pwaOfferClose').tap();
   assert.equal(await page.locator('#pwaInstallOffer').isHidden(),true);
  }finally{await browser.close()}
 });
 test('PWA '+name+' Android phone native-install prompt and landscape layout',{timeout:90000},async()=>{
  const {page,browser}=await open(engine,{viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:android});
  try{
   await enter(page);
   await geometry(page,name+' Android portrait');
   await page.evaluate(()=>{
    const e=new Event('beforeinstallprompt',{cancelable:true});
    e.prompt=()=>Promise.resolve({outcome:'dismissed'});
    window.dispatchEvent(e);
   });
   assert.equal(await page.locator('#pwaOfferInstall').isEnabled(),true);
   await page.setViewportSize({width:844,height:390});
   await page.waitForTimeout(100);
   await geometry(page,name+' Android landscape');
   await page.locator('#pwaOfferInstall').tap();
   await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'null')?.choice==='later',key);
  }finally{await browser.close()}
 });
 test('PWA '+name+' standalone mode never shows invitation',{timeout:90000},async()=>{
  const {page,browser}=await open(engine,{},async page=>{
   await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{configurable:true,value:true}));
  });
  try{
   await page.goto(base);
   await page.locator('#skillChooser:not([hidden])').waitFor();
   assert.equal(await page.locator('#pwaInstallOffer').isHidden(),true);
  }finally{await browser.close()}
 });
}
