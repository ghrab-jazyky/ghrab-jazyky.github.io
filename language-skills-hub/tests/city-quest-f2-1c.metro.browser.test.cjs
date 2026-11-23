"use strict";
/* F2.1C opt-in metro pilot acceptance: no server or API and no default F2 regressions. */
const {test}=require("node:test"),assert=require("node:assert/strict");
const path=require("node:path"),fs=require("node:fs"),{chromium,webkit}=require("playwright");
// This is an AUTHORING/QA visual-preview suite. Normal student URLs do
// not expose guided reference routes (CQ-F5-006).
const URL="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html?cq-review=1";
const SHOTS=path.join(process.cwd(),"city-quest-f2-1c-artifacts");fs.mkdirSync(SHOTS,{recursive:true});
async function launch(browser,page,station){
 await page.goto(URL,{waitUntil:"load"});
 assert.equal(await page.locator("#metroPilotToggle").isVisible(),true);
 assert.equal(await page.locator("#metroPilotToggle").getAttribute("aria-pressed"),"false");
 await page.locator("#metroPilotToggle").click();
 assert.equal(await page.locator("#metroPilotToggle").getAttribute("aria-pressed"),"true");
 await page.locator("#f1Stations .f1-station").nth(station-1).click();
}
const panel=p=>p.locator("#f1Panel");
async function click(p,label){
 await panel(p).getByRole("button",{name:label,exact:false}).first().click();
}
async function travel(p,line,direction,platform,stops){
 if(await panel(p).getByRole("button",{name:line+" ·",exact:false}).count())await click(p,line+" ·");
 await click(p,direction);
 await click(p,"Platform "+platform);
 await click(p,"Board the train");
 for(let i=0;i<stops;i++)await click(p,"Travel to next stop");
}
async function completed(p,number){
 assert.match(await p.locator("#f1ProgressText").innerText(),/\b[1-8]\s*\/\s*8/);
 assert.equal(await p.locator("#f1Stations .f1-station").nth(number-1).locator(".f1-station-complete").count(),1);
 assert.match(await panel(p).innerText(),/Route verified locally/);
}
test("F2.1C desktop: mission 05 rejects wrong line, requires directions/platform and keeps one metro control owner",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:900}});
  const errors=[];page.on("pageerror",e=>errors.push(e.stack||String(e)));
  await launch(browser,page,5);
  assert.equal(await page.locator(".hero h1").innerText(),"Riverton City + Metro Quest");
  assert.match(await page.locator(".topbar .header-actions .tag").innerText(),/CITY QUEST/);
  assert.equal(await page.locator("#metroLab").getAttribute("data-mode"),"game");
  assert.equal(await page.locator("#metroLab").isVisible(),true);
  assert.equal(await page.locator(".layout").isVisible(),false);
  assert.equal(await page.locator("#f1Panel").evaluate(el=>el.parentElement.classList.contains("metro-side")),true);
  assert.equal(await page.locator(".metro-scenario-toolbar").isVisible(),false);
  assert.equal(await page.locator(".metro-action-card").isVisible(),false);
  assert.equal(await page.locator("#metroViewTrain").isVisible(),false,"Game must control train view, not a decorative switch");
  assert.match(await page.locator("#metroSceneLine").innerText(),/Station concourse/);
  assert.match(await page.locator("#metroSceneSvg").getAttribute("aria-label"),/on —$/);
  assert.equal(await page.locator("#metroPreferredRoute polyline").count(),0,"Future route must not be pre-highlighted");
  await click(page,"M2 ·");
  assert.match(await panel(page).innerText(),/does not take you/);
  await travel(page,"M1","East Gardens","2",2);
  await click(page,"Get off here");
  await click(page,"Exit at destination");
  assert.match(await panel(page).innerText(),/speaking/i);
  await click(page,"I have practised aloud");
  await completed(page,5);
  assert.match(await page.locator("#metroSceneSvg").textContent(),/DESTINATION REACHED/);
  await page.locator("#metroLab").screenshot({path:path.join(SHOTS,"f21c-desktop-mission05.png")});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F2.1C mission 06: real transfer, two line choices, seven route decisions",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:850}});
  await launch(browser,page,6);
  await travel(page,"M2","North Park","1",2);
  assert.match(await panel(page).innerText(),/University/i);
  assert.match(await page.locator("#metroSceneHeading").innerText(),/On-board experience/);
  assert.equal(await page.evaluate(()=>window.CityQuestF2MetroBridge.current().phase),"ride");
  await click(page,"Change lines here");
  await click(page,"Follow transfer signs");
  await travel(page,"M3","Harbour","3",3);
  await click(page,"Get off here");
  await click(page,"Exit at destination");
  await click(page,"I have practised aloud");
  await completed(page,6);
 }finally{await browser.close();}
});
test("F2.1C mission 07: closure notice and alternative via University",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:850}});
  await launch(browser,page,7);
  assert.match(await panel(page).innerText(),/Old Town/);
  await click(page,"Read service notice");
  assert.match(await page.locator("#metroNetworkAlert").innerText(),/closed/i);
  await travel(page,"M2","North Park","3",1);
  await click(page,"Change lines here");
  await click(page,"Follow transfer signs");
  await travel(page,"M3","Harbour","3",2);
  await click(page,"Get off here");
  await click(page,"Exit at destination");
  await click(page,"I have practised aloud");
  await completed(page,7);
 }finally{await browser.close();}
});
test("F2.1C mission 08: real city→metro→city portal and three oral checkpoints",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on("pageerror",e=>errors.push(e.stack||String(e)));
  await launch(browser,page,8);
  assert.equal(await page.locator(".layout").isVisible(),true);
  assert.equal(await page.locator("#metroLab").isVisible(),false);
  const north=page.locator('#f2Quick [data-direction="north"]'),east=page.locator('#f2Quick [data-direction="east"]');
  await east.click();
  assert.equal(await page.locator("#f2Quick .f2-hud-undo").isDisabled(),false);
  await page.locator("#f2Quick .f2-hud-undo").click();
  assert.equal(await page.locator("#f2Quick .f2-hud-undo").isDisabled(),true);
  assert.equal((await page.locator("#f2MapRoute").getAttribute("points")).trim().split(/\s+/).length,1);
  await east.click();await east.click();await north.click();
  await click(page,"I have practised aloud");
  await click(page,"Enter the metro");
  assert.equal(await page.locator(".layout").isVisible(),false);
  assert.equal(await page.locator("#metroLab").isVisible(),true);
  await travel(page,"M2","North Park","1",2);
  assert.equal(await page.evaluate(()=>window.CityQuestF2MetroBridge.current().phase),"ride");
  await click(page,"Change lines here");
  await click(page,"I have practised aloud");
  await click(page,"Follow transfer signs");
  await travel(page,"M3","Harbour","3",2);
  await click(page,"Get off here");
  await click(page,"Exit at destination");
  assert.equal(await page.locator(".layout").isVisible(),true);
  assert.equal(await page.locator("#metroLab").isVisible(),false);
  await north.click();
  await click(page,"I have practised aloud");
  await completed(page,8);
  assert.equal(await page.locator("#mapLocation").innerText(),"City Museum");
  // The location strip alone is insufficient: after camera-follow settles,
  // the actual SVG player marker must be inside the visible city viewport.
  await page.waitForFunction(()=>{
   const marker=document.querySelector("#f2MapMarker"),viewport=document.querySelector("#mapViewport");
   if(!marker||!viewport)return false;
   const m=marker.getBoundingClientRect(),v=viewport.getBoundingClientRect();
   return m.width>0&&m.height>0&&m.left>=v.left-8&&m.right<=v.right+8&&
     m.top>=v.top-8&&m.bottom<=v.bottom+8;
  },null,{timeout:5000});
  assert.equal(await page.locator("#f2Quick").isVisible(),false,"Completed city leg keeps its route but hides inactive movement controls");
  assert.ok((await page.locator("#f2MapRoute").getAttribute("points")).trim().split(/\s+/).length>=2,
    "Final surface route should remain visible after the oral self-check");
  await page.screenshot({path:path.join(SHOTS,"f21c-mobile-mission08.png"),fullPage:true});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F2.1D preserves classic F2 by default, enables EN/ES/DE/FR B1 and excludes A1/A2",async()=>{
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  await page.goto(URL,{waitUntil:"load"});
  await page.locator("#f1Stations .f1-station").nth(4).click();
  assert.match(await panel(page).innerText(),/bus|departure|transport/i);
  assert.equal(await page.locator("#metroLab").getAttribute("data-mode"),"preview");
  await page.locator("#metroPilotToggle").click();
  assert.match(await panel(page).innerText(),/Metro/i);
  await page.locator("#metroPilotToggle").click();
  assert.match(await panel(page).innerText(),/bus|departure|transport/i);
  assert.doesNotMatch(await page.locator(".topbar .header-actions .tag").innerText(),/F2\.1[CD]/);
  for(const lang of ["es","de","fr"]){
   await page.locator("#f2Language").selectOption(lang);
   assert.equal(await page.locator("#metroPilotToggle").isVisible(),true);
  }
  await page.locator("#f2Language").selectOption("en");
  for(const level of ["A1","A2"]){
   await page.locator("#f2Level").selectOption(level);
   assert.equal(await page.locator("#metroPilotToggle").isVisible(),false);
   assert.equal(await page.locator("#metroLab").isVisible(),false);
  }
 }finally{await browser.close();}
});
test("F2.1C Pair mode adds metro-specific speaking roles rather than legacy bus exercises",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  await page.goto(URL,{waitUntil:"load"});
  await page.locator("#f1Pair").click();
  await page.locator("#metroPilotToggle").click();
  await page.locator("#f1Stations .f1-station").nth(4).click();
  const text=await panel(page).innerText();
  assert.match(text,/Navigator: explain the line, terminus and platform/);
  assert.doesNotMatch(text,/bus timetable/i);
 }finally{await browser.close();}
});
test("F2.1C responsive live mission controls dock next to mobile map and back in desktop sidebar",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true});
  const errors=[];page.on("pageerror",e=>errors.push(e.stack||String(e)));
  await launch(browser,page,5);
  assert.equal(await panel(page).evaluate(el=>el.parentElement.classList.contains("metro-network-card")),true);
  assert.equal(await page.locator("#f1Panel").count(),1);
  const map=page.locator("#metroNetworkViewport"),control=page.locator("#f1Panel");
  const bounds=await Promise.all([map.boundingBox(),control.boundingBox()]);
  assert.ok(bounds[0]&&bounds[1]);
  assert.ok(bounds[1].y<bounds[0].y,"Action panel must dock immediately above the network on phone");
  await page.setViewportSize({width:1400,height:900});
  await page.waitForTimeout(70);
  assert.equal(await panel(page).evaluate(el=>el.parentElement.classList.contains("metro-side")),true);
  await page.setViewportSize({width:320,height:568});
  await page.waitForTimeout(70);
  assert.equal(await panel(page).evaluate(el=>el.parentElement.classList.contains("metro-network-card")),true);
  await click(page,"M1 ·");
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F2.1C strict-CSP one-file offline preview works with full metro mission",async()=>{
 const file=path.resolve(process.cwd(),".review-city-quest-f2/CITY_QUEST_F2_OFFLINE_PREVIEW.html");
 assert.ok(fs.existsSync(file),"Build offline one-file preview first");
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const external=[],errors=[];
  page.on("request",r=>{if(!r.url().startsWith("file:"))external.push(r.url());});
  page.on("pageerror",e=>errors.push(e.stack||String(e)));
  await page.goto("file://"+file+"?cq-review=1",{waitUntil:"load"});
  await page.locator("#metroPilotToggle").click();
  await page.locator("#f1Stations .f1-station").nth(4).click();
  await travel(page,"M1","East Gardens","2",2);
  await click(page,"Get off here");
  await click(page,"Exit at destination");
  await click(page,"I have practised aloud");
  await completed(page,5);
  assert.deepEqual(external,[]);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
