#!/usr/bin/env node
'use strict';
// Simulated production HTTPS origin with REAL browser localStorage, routed bytes.
// This is not a live Pages or real HTTP persistence test.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),origin='https://ghrab-jazyky.github.io';
const url=p=>origin+'/language-skills-hub/'+p;
const catalog=url('index.html?skill=konverzace');
const game=url('konverzace/christmas-quest/index.html');
const key='lsh:temporary-test-lock:developer:v1';
const progress='lsh.cq.progress.v2';
async function routeContext(context){
 await context.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.origin!==origin)return route.abort();
  let filename=path.resolve(root,decodeURIComponent(u.pathname).replace(/^\/+/,''));
  if(!filename.startsWith(root+path.sep))return route.fulfill({status:403,body:'Forbidden'});
  if(fs.existsSync(filename)&&fs.statSync(filename).isDirectory())filename=path.join(filename,'index.html');
  if(!fs.existsSync(filename))return route.fulfill({status:404,body:'Not found'});
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
  return route.fulfill({status:200,contentType:types[path.extname(filename)]||'application/octet-stream',body:fs.readFileSync(filename)});
 });
}
const card=p=>p.locator('[data-topic-id="cl-christmas-quest"]');
const city=p=>p.locator('[data-topic-id="cl-city-quest-f2"]');
async function guest(p){
 await p.locator('#cqDeveloperNotice').waitFor({state:'visible'});
 await p.waitForFunction(()=>typeof window.CQ==='undefined'&&Boolean(document.getElementById('cqGatedRuntime')));
 assert.equal(await p.locator('html').getAttribute('data-cq-access'),'locked');
 assert.equal(await p.locator('#main').isVisible(),false);
 assert.equal(await p.locator('#cqGatedRuntime').count(),1);
 assert.equal(await p.evaluate(()=>typeof window.CQ),'undefined');
}
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test(name+' Christmas Quest: guest catalog, direct link, opt-in and opt-out, independent profile, other labs',{timeout:120000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce'});await routeContext(context);
   const p=await context.newPage();await p.goto(catalog);await card(p).waitFor();
   assert.equal(await card(p).locator('.catalog-game-label').innerText(),'Interaktivní hra');
   assert.equal(await city(p).locator('.catalog-game-label').innerText(),'Interaktivní hra');
   assert.equal(await card(p).getByRole('button',{name:/Sdílet se studenty/}).isDisabled(),true);
   assert.equal(await city(p).getByRole('button',{name:/Sdílet se studenty/}).isEnabled(),true);
   // Existing City Quest sharing must remain functional, not just enabled.
   await city(p).getByRole('button',{name:/Sdílet se studenty/}).click();
   assert.match(await p.locator('#qrUrl').inputValue(),/city-quest-f2/);
   await p.locator('#qrMount svg').waitFor({state:'visible'});
   await p.locator('#qrClose').click();
   assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),null);
   const open=card(p).locator('.action.primary');
   await open.click();const modal=p.locator('#lshTemporaryTestNotice');await modal.waitFor();
   assert.match(await modal.innerText(),/Christmas Quest je zatím ve vývoji/);
   assert.equal(context.pages().length,1);await modal.getByRole('button',{name:'Rozumím'}).click();
   const direct=await context.newPage();await direct.goto(game+'?lang=de&level=B2&zamek=1');await guest(direct);
   assert.equal(await direct.evaluate(k=>localStorage.getItem(k),progress),null);
   await direct.locator('#cqDeveloperNotice a').click();await card(direct).waitFor();await direct.close();
   // Existing test activation link is sufficient; catalog button must not be stale.
   await p.evaluate(()=>{location.hash='lsh-test-preview=on'});
   await p.locator('#lshTemporaryTestPreviewStatus').waitFor();
   assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),'enabled');
   assert.equal(await card(p).getByRole('button',{name:/Sdílet se studenty/}).isDisabled(),true);
   // Exercise the real filtered catalog URL and variant contract.
   await p.locator('#language').selectOption('de');
   await p.locator('#level').selectOption('B2');
   const fixed=new URL(await open.getAttribute('href'));
   assert.equal(fixed.pathname,new URL(game).pathname);
   for(const [k,v] of Object.entries({lang:'de',level:'B2',zamek:'1',practice:'1'}))assert.equal(fixed.searchParams.get(k),v,k);
   const errs=[];
   context.on('page',pg=>pg.on('pageerror',e=>errs.push(e.message)));
   const [dev]=await Promise.all([context.waitForEvent('page'),open.click()]);
   await dev.waitForFunction(()=>typeof window.CQ==='object'&&document.documentElement.dataset.cqAccess==='developer');
   assert.equal(await dev.locator('#main').isVisible(),true);assert.equal(await dev.locator('#cqDeveloperNotice').isVisible(),false);
   assert.equal(await dev.locator('#variant').textContent(),'DE · B2');
   assert.equal(await card(p).getByRole('button',{name:/Sdílet se studenty/}).isDisabled(),true);
   const oldProgress=await dev.evaluate(k=>localStorage.getItem(k),progress);assert.ok(oldProgress);
   const other=await browser.newContext({serviceWorkers:'block'});await routeContext(other);const otherPage=await other.newPage();await otherPage.goto(game);await guest(otherPage);await other.close();
   await p.evaluate(()=>{location.hash='lsh-test-preview=off'});
   await p.waitForFunction(k=>localStorage.getItem(k)===null,key);await guest(dev);
   assert.equal(await dev.evaluate(k=>localStorage.getItem(k),progress),oldProgress,'Opt-out must not reset progress');
   await open.click();await modal.waitFor();assert.match(await modal.innerText(),/Christmas Quest/);
   assert.deepEqual(errs,[]);
   await context.close();
  }finally{await browser.close()}
 });
 test(name+' Christmas Quest: no JavaScript and storage denial default locked',{timeout:60000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const nojs=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});await routeContext(nojs);
   const a=await nojs.newPage();await a.goto(game);await a.locator('#cqDeveloperNotice').waitFor();assert.equal(await a.locator('#main').isVisible(),false);await nojs.close();
   const denied=await browser.newContext({serviceWorkers:'block'});await routeContext(denied);
   await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new Error('test storage denied')}}));
   const b=await denied.newPage();await b.goto(game);await guest(b);await denied.close();
   const invalid=await browser.newContext({serviceWorkers:'block'});await routeContext(invalid);
   const c=await invalid.newPage();await c.goto(catalog);await card(c).waitFor();
   await c.evaluate(k=>localStorage.setItem(k,'true'),key);await c.goto(game);await guest(c);
   assert.equal(await c.evaluate(k=>localStorage.getItem(k),progress),null);await invalid.close();
  }finally{await browser.close()}
 });
}
