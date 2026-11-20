"use strict";
/* F2.1A acceptance: one map-bound HUD in every city navigation mission.
 * Never certify the mobile UX by checking only JS event handlers.
 */
const test=require("node:test");
const assert=require("node:assert/strict");
const path=require("node:path");
const fs=require("node:fs");
const {chromium,webkit}=require("playwright");
const C=require("../authoring/city-quest-f2/content-a.js");
require("../authoring/city-quest-f2/content-b.js");
const URL="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html";
const SHOTS=path.join(process.cwd(),"city-quest-f2-1a-artifacts");
fs.mkdirSync(SHOTS,{recursive:true});
function monitor(page){
 const errors=[],requests=[];
 page.on("pageerror",e=>errors.push(String(e)));
 page.on("console",e=>{if(e.type()==="error")errors.push("Console: "+e.text());});
 page.on("request",e=>{if(!e.url().startsWith("http://127.0.0.1:8765")&&!e.url().startsWith("file:"))requests.push(e.url());});
 return {errors,requests};
}
async function station(page,id){
 await page.locator("#f1Stations button").nth(id-1).click();
 assert.equal(await page.locator("#f1Stations button").nth(id-1).getAttribute("aria-current"),"step");
}
async function variant(page,lang,level){
 await page.locator("#f2Language").selectOption(lang);
 await page.locator("#f2Level").selectOption(level);
 assert.equal(await page.locator("html").getAttribute("lang"),lang);
}
async function verifyHud(page,lang){
 const hud=page.locator('[data-testid="navigation-hud"]');
 assert.equal(await hud.count(),1);
 assert.equal(await hud.isVisible(),true);
 assert.equal(await page.locator("#f2MapStage > #f2Quick").count(),1);
 assert.equal(await page.locator("#f2MapStage > #mapViewport").count(),1);
 assert.equal(await page.locator(".f2-controls").count(),0,"there must be no second direction pad in the mission panel");
 assert.equal(await page.locator("#f2Quick .f2-quick-pad button").count(),4);
 assert.equal(await page.locator("#routeView .direction-tools").isVisible(),false);
 const north=await page.locator(".f2-quick-north").getAttribute("aria-label");
 assert.ok(north.startsWith(C.pack(lang).ui.north),"localized aria-label for "+lang+": "+north);
 const buttons=await page.locator("#f2Quick .f2-quick-pad button").evaluateAll(nodes=>nodes.map(n=>{
  const rect=n.getBoundingClientRect();
  return {width:rect.width,height:rect.height,display:getComputedStyle(n).display};
 }));
 for(const b of buttons){
  assert.ok(b.width>=44&&b.height>=44,"Touch controls must be 44x44 CSS px "+JSON.stringify(b));
  assert.notEqual(b.display,"none");
 }
}
function checkMapHudOverlay(page){
 return page.evaluate(()=>{
  const stage=document.querySelector("#f2MapStage").getBoundingClientRect();
  const map=document.querySelector("#mapViewport").getBoundingClientRect();
  const hud=document.querySelector("#f2Quick").getBoundingClientRect();
  return {
   stage:{x:stage.x,y:stage.y,w:stage.width,h:stage.height},
   map:{x:map.x,y:map.y,w:map.width,h:map.height},
   hud:{x:hud.x,y:hud.y,w:hud.width,h:hud.height},
   width:document.documentElement.scrollWidth,screen:window.innerWidth,height:window.innerHeight
  };
 });
}
test("F2.1A all 24 variants: one localized HUD for 4 navigation missions, absent elsewhere",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:850}});
  const failures=monitor(page);
  await page.goto(URL,{waitUntil:"load"});
  await page.locator("#f1Stations button").first().waitFor();
  for(const language of C.languages){
   for(const level of C.levels){
    await variant(page,language,level);
    for(const id of [2,4,7,8]){
     await station(page,id);
     await verifyHud(page,language);
    }
    for(const id of [1,3,5,6]){
     await station(page,id);
     assert.equal(await page.locator("#f2Quick").isVisible(),false,"HUD must be hidden on non-navigation station "+id);
     assert.equal(await page.locator(".f2-controls").count(),0);
    }
   }
  }
  assert.deepEqual(failures.errors,[]);
  assert.deepEqual(failures.requests,[]);
 }finally{await browser.close();}
});
test("F2.1A touch geometry: 320x568, 375x812, 390x844, iPad 768x1024",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const failures=monitor(page);
  await page.goto(URL,{waitUntil:"load"});
  await variant(page,"es","B1");
  await station(page,4);
  for(const [w,h] of [[320,568],[375,812],[390,844],[768,1024]]){
   await page.setViewportSize({width:w,height:h});
   await page.locator("#f2MapStage").scrollIntoViewIfNeeded();
   await verifyHud(page,"es");
   const g=await checkMapHudOverlay(page);
   assert.ok(g.width<=g.screen+2,"Horizontal overflow "+w+"x"+h+" "+JSON.stringify(g));
   assert.ok(g.hud.x>=g.map.x-1&&g.hud.x+g.hud.w<=g.map.x+g.map.w+1,
     "HUD must be inside the map horizontally "+JSON.stringify(g));
   assert.ok(g.hud.y>=g.map.y-1&&g.hud.y+g.hud.h<=g.map.y+g.map.h+1,
     "HUD must overlay map without forcing a vertical scroll "+JSON.stringify(g));
   assert.ok(g.map.h>=285,"Keep a meaningful playable city map visible "+JSON.stringify(g));
   assert.ok(g.hud.h<g.map.h*.70,"The HUD must not cover most of the map "+JSON.stringify(g));
   await page.screenshot({path:path.join(SHOTS,"F21A-es-B1-"+w+"x"+h+".png"),fullPage:false});
  }
  // The HUD's buttons must keep their DOM identities after each move; no focus loss.
  await page.setViewportSize({width:390,height:844});
  await page.locator("#f2Quick .f2-quick-east").focus();
  const first=await page.locator("#f2Quick .f2-quick-east").evaluate(el=>el);
  await page.keyboard.press("Enter");
  assert.match(await page.locator("#f1Panel").innerText(),/2\/5/);
  assert.equal(await page.locator("#f2Quick .f2-quick-east").evaluate(el=>el===document.activeElement),true,
    "Keyboard focus should remain on the same button after re-render.");
  assert.equal(await page.locator("#f2Quick .f2-quick-east").evaluate(el=>el===document.querySelector(".f2-quick-east")),true);
  await page.locator("#f2Quick .f2-quick-east").tap();
  assert.match(await page.locator("#f1Panel").innerText(),/3\/5/);
  assert.equal(await page.locator("#f2Quick").isVisible(),true);
  assert.deepEqual(failures.errors,[]);
  assert.deepEqual(failures.requests,[]);
 }finally{await browser.close();}
});
test("F2.1A route undo, blocked edge, map tap and dark/light themes",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const failures=monitor(page);
  await page.goto(URL,{waitUntil:"load"});
  await station(page,2);
  const path=page.locator("#f2MapRoute");
  await page.locator(".f2-quick-east").tap();
  const after=await path.getAttribute("points");
  assert.equal(after.split(/\s+/).length,2);
  await page.locator(".f2-hud-undo").tap();
  assert.equal((await path.getAttribute("points")).split(/\s+/).length,1);
  // A map crossing tap is a different input surface for the SAME route action.
  await page.locator('[data-node="1-3"]').tap();
  assert.equal((await path.getAttribute("points")).split(/\s+/).length,2);
  await station(page,7);
  await page.locator(".f2-quick-east").tap();
  await page.locator(".f2-quick-east").tap();
  await page.locator(".f2-quick-east").tap();
  assert.match(await page.locator("#f2Quick .f2-quick-caption").innerText(),/closed|closed road|Road|uzav|gesperrt|barrée/i);
  await page.locator("#themeBtn").tap();
  assert.equal(await page.locator("html").getAttribute("data-theme"),"light");
  assert.equal(await page.locator("#f2Quick").isVisible(),true);
  assert.deepEqual(failures.errors,[]);
  assert.deepEqual(failures.requests,[]);
 }finally{await browser.close();}
});
test("F2.1A mobile WebKit: full HUD, keyboard accessibility and French labels",async()=>{
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  const failures=monitor(page);
  await page.goto(URL,{waitUntil:"load"});
  await variant(page,"fr","C2");
  await station(page,4);
  await verifyHud(page,"fr");
  await page.locator(".f2-quick-north").focus();
  const label=await page.locator(".f2-quick-north").getAttribute("aria-label");
  assert.ok(label.startsWith(C.pack("fr").ui.north));
  await page.screenshot({path:path.join(SHOTS,"F21A-fr-C2-WebKit.png"),fullPage:true});
  // Screenshot tooling can inject inline style blocked by CSP, so app errors
  // are examined before screenshot to avoid mistaking tooling for app errors.
  assert.deepEqual(failures.errors,[]);
  assert.deepEqual(failures.requests,[]);
 }finally{await browser.close();}
});
test("F2.1A portable offline file://: map HUD and localization without fetch or API",async()=>{
 const file=path.join(process.cwd(),".review-city-quest-f2/CITY_QUEST_F2_OFFLINE_PREVIEW.html");
 assert.ok(fs.existsSync(file));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const failures=monitor(page);
  await page.goto("file://"+file,{waitUntil:"load"});
  await page.locator("#f1Stations button").first().waitFor();
  await variant(page,"de","B2");
  await station(page,4);
  await verifyHud(page,"de");
  await page.locator(".f2-quick-east").tap();
  assert.equal(await page.locator("#f2Quick").isVisible(),true);
  assert.deepEqual(failures.requests,[]);
  assert.deepEqual(failures.errors,[]);
  await page.screenshot({path:path.join(SHOTS,"F21A-offline-de-B2.png"),fullPage:true});
 }finally{await browser.close();}
});
