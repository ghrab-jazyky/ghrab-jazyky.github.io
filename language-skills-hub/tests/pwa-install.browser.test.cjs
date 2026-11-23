#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const iphone='Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1';
async function open(engine,options={},init=()=>{}){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce',userAgent:ua,...options});
 const page=await context.newPage();
 await page.addInitScript(()=>{
  localStorage.setItem('lsh:teacher-whats-new:last-offered-sequence:v1','2147483647');
 });
 await init(page);
 return {page,browser};
}
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('PWA '+name+' shows in lab chooser and snoozes for a week',{timeout:90000},async()=>{
  const {page,browser}=await open(engine);
  try{
   await page.goto(base);
   await page.locator('#skillChooser:not([hidden])').waitFor();
   await page.locator('#pwaInstallOffer:visible').waitFor();
   assert.equal(await page.locator('[data-choose-skill]').count(),3);
   await page.locator('#pwaOfferInstall').click();
   assert.equal(await page.locator('#pwaOfferHelp').isVisible(),true);
   await page.locator('#pwaOfferLater').click();
   assert.equal(await page.locator('#pwaInstallOffer').isHidden(),true);
   const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('lsh:pwa-install-choice:v1')));
   assert.equal(result.choice,'later');
   assert.ok(result.until>Date.now()+6*86400000);
   await page.reload();
   await page.locator('#skillChooser:not([hidden])').waitFor();
   assert.equal(await page.locator('#pwaInstallOffer').isHidden(),true);
   await page.goto(base+'?skill=cteni');
   await page.locator('#catalog:not([hidden])').waitFor();
   assert.equal(await page.locator('#pwaInstallOffer').isHidden(),true);
  }finally{await browser.close()}
 });
 test('PWA '+name+' can be hidden permanently and responds to browser install event',{timeout:90000},async()=>{
  const {page,browser}=await open(engine);
  try{
   await page.goto(base);
   await page.locator('#pwaInstallOffer:visible').waitFor();
   await page.locator('#pwaOfferNever').click();
   await page.reload();
   await page.locator('#skillChooser:not([hidden])').waitFor();
   assert.equal(await page.locator('#pwaInstallOffer').isHidden(),true);
   await page.evaluate(()=>localStorage.removeItem('lsh:pwa-install-choice:v1'));
   await page.reload();
   await page.locator('#pwaInstallOffer:visible').waitFor();
   const prevented=await page.evaluate(()=>{
    window.__prompts=0;
    const e=new Event('beforeinstallprompt',{cancelable:true});
    e.prompt=()=>{window.__prompts++;return Promise.resolve()};
    e.userChoice=Promise.resolve({outcome:'accepted'});
    window.dispatchEvent(e);return e.defaultPrevented;
   });
   assert.equal(prevented,true);
   await page.locator('#pwaOfferInstall').click();
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lsh:pwa-install-choice:v1')||'null')?.choice==='installed');
   assert.equal(await page.evaluate(()=>window.__prompts),1);
  }finally{await browser.close()}
 });
 test('PWA '+name+' iPhone help is visible without viewport overflow',{timeout:90000},async()=>{
  const {page,browser}=await open(engine,{viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:iphone});
  try{
   await page.goto(base);
   await page.locator('#pwaInstallOffer:visible').waitFor();
   const r=await page.locator('#pwaInstallOffer').boundingBox();
   assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=391&&r.y+r.height<=845,JSON.stringify(r));
   await page.locator('#pwaOfferInstall').click();
   assert.match(await page.locator('#pwaOfferHelp').innerText(),/Přidat na plochu/);
  }finally{await browser.close()}
 });
 test('PWA '+name+' chooser navigation stays clickable while install offer is visible',{timeout:90000},async()=>{
  const {page,browser}=await open(engine);
  try{
   await page.goto(base);
   await page.locator('#skillChooser:not([hidden])').waitFor();
   await page.locator('#pwaInstallOffer:visible').waitFor();
   const overlap=await page.evaluate(()=>{
    const offer=document.getElementById('pwaInstallOffer').getBoundingClientRect();
    const back=document.getElementById('closeChooser').getBoundingClientRect();
    return Math.max(0,Math.min(offer.right,back.right)-Math.max(offer.left,back.left))*
     Math.max(0,Math.min(offer.bottom,back.bottom)-Math.max(offer.top,back.top));
   });
   assert.equal(overlap,0,'Install panel must not overlap Back');
   await page.locator('#closeChooser').click({timeout:5000});
   await page.locator('#skipIntro').click({timeout:5000});
   await page.locator('#skillChooser:not([hidden])').waitFor();
   await page.locator('[data-choose-skill="cteni"]').click({timeout:5000});
   await page.locator('#catalog:not([hidden])').waitFor();
   await page.locator('#changeLab').click({timeout:5000});
   await page.locator('#closeChooser').click({timeout:5000});
   await page.locator('#catalog:not([hidden])').waitFor();
  }finally{await browser.close()}
 });
 test('PWA '+name+' skips offer in already-installed context',{timeout:90000},async()=>{
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
