"use strict";
/* F3C mobile/a11y acceptance: zero engine changes and no second movement HUD.
 * Browser tests deliberately exercise real buttons, keyboard navigation,
 * responsive reparenting, strict-CSP file:// and 4-language metro map tools.
 */
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {chromium,webkit}=require("playwright");
const URL="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html";
const OUT=path.join(process.cwd(),"city-quest-f3c-artifacts");fs.mkdirSync(OUT,{recursive:true});
const monitor=page=>{const errors=[],external=[];
 page.on("pageerror",e=>errors.push(String(e)));
 page.on("request",r=>{if(!r.url().startsWith("file:")&&!r.url().startsWith("http://127.0.0.1:8765/"))external.push(r.url());});
 return {errors,external};
};
async function openCity(page,n,lang="en",level="B1"){
 await page.locator("#f2Language").selectOption(lang);
 await page.locator("#f2Level").selectOption(level);
 await page.locator("#f1Stations button").nth(n-1).click();
}
async function openMetro(page,n,lang="en",level="B1"){
 await openCity(page,n,lang,level);
 await page.locator("#metroPilotToggle").click();
}
async function overflow(page){
 return page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
}
test("F3C 320–1024px: one HUD, compact option exposes more city map while all four arrows remain usable",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),events=monitor(page);
  await page.goto(URL);await openCity(page,4,"es","B1");
  for(const [width,height] of [[320,568],[375,812],[390,844],[568,320],[768,1024],[1024,768]]){
   await page.setViewportSize({width,height});
   await page.waitForFunction(()=>document.getElementById("f2Quick")?.dataset.placement==="map-overlay");
   assert.equal(await page.locator("#f2Quick").count(),1);
   assert.equal(await page.locator(".f2-quick-pad button").count(),4);
   const expanded=await page.locator("#f2Quick").boundingBox();
   const toggle=page.locator("#f3cHudSize");
   assert.equal(await toggle.isVisible(),true);
   await toggle.click();
   assert.equal(await page.locator("#f2Quick").getAttribute("data-compact"),"true");
   assert.equal(await toggle.getAttribute("aria-pressed"),"true");
   assert.ok((await toggle.getAttribute("aria-label")).includes("Mostrar"),"Localized accessible toggle should expand the HUD");
   const compact=await page.locator("#f2Quick").boundingBox();
   assert.ok(compact&&expanded&&compact.width<expanded.width*.75,
    "Compact pad should occupy substantially less map width at "+width);
   const coords=await page.locator("#f2Quick .f2-quick-pad button").evaluateAll(nodes=>nodes.map(el=>{
    const b=el.getBoundingClientRect();return {w:b.width,h:b.height};
   }));
   for(const b of coords)assert.ok(b.w>=44&&b.h>=44,"Touch target too small "+width+": "+JSON.stringify(b));
   assert.ok(await overflow(page)<=2,"Unexpected horizontal overflow at "+width);
   if(width===320||width===390||width===568)
    await page.screenshot({path:path.join(OUT,"city-compact-"+width+"x"+height+".png"),fullPage:false});
   await toggle.click();
   assert.equal(await page.locator("#f2Quick").getAttribute("data-compact"),"false");
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator("#f3cHudSize").click();
  const prior=await page.locator("#f2MapRoute").getAttribute("points");
  await page.locator(".f2-quick-east").tap();
  const next=await page.locator("#f2MapRoute").getAttribute("points");
  assert.equal(next.trim().split(/\s+/).length,prior.trim().split(/\s+/).length+1);
  await page.locator(".f2-hud-undo").tap();
  assert.equal((await page.locator("#f2MapRoute").getAttribute("points")).trim(),prior.trim());
  assert.deepEqual(events.errors,[]);assert.deepEqual(events.external,[]);
 }finally{await browser.close();}
});
test("F3C desktop 1366: HUD remains in sidebar; resize retains a single DOM object and compact preference",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),events=monitor(page);
  await page.goto(URL);await openCity(page,2,"fr","C1");
  await page.locator("#f3cHudSize").click();
  assert.equal(await page.locator("#f2Quick").getAttribute("data-compact"),"true");
  const stable=await page.locator(".f2-quick-west").evaluate(el=>{window.__f3cWest=el;return true;});
  assert.equal(stable,true);
  await page.setViewportSize({width:1366,height:900});
  await page.waitForFunction(()=>document.querySelector("#f2Quick")?.dataset.placement==="sidebar");
  assert.equal(await page.locator("#f3cHudSize").isVisible(),false);
  assert.equal(await page.locator("#f2Quick").getAttribute("data-compact"),"false");
  assert.equal(await page.locator(".sidebar>#f2Quick").count(),1);
  assert.equal(await page.locator(".f2-quick-west").evaluate(el=>el===window.__f3cWest),true);
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>document.querySelector("#f2Quick")?.dataset.placement==="map-overlay");
  assert.equal(await page.locator("#f2Quick").getAttribute("data-compact"),"true");
  assert.equal(await page.locator(".f2-quick-west").evaluate(el=>el===window.__f3cWest),true);
  assert.deepEqual(events.errors,[]);assert.deepEqual(events.external,[]);
 }finally{await browser.close();}
});
test("F3C metro preview picker: exactly 14 native options, station inspection does not move train",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),events=monitor(page);
  await page.goto(URL);
  const picker=page.locator("#f3cMetroPicker");
  assert.equal(await picker.locator("option").count(),14);
  assert.equal(await page.locator("#f3cToTask").isVisible(),false,"No mission jump in ungraded gallery");
  const player=await page.locator("#metroSceneStation").innerText();
  assert.equal(player,"Central Station");
  await page.locator("#metroMapZoom").tap();
  assert.equal(await page.locator("#metroNetworkViewport").evaluate(el=>el.classList.contains("overview")),true);
  await picker.selectOption("east_gardens");
  assert.equal(await page.locator("#metroNetworkViewport").evaluate(el=>el.classList.contains("overview")),false);
  assert.equal(await page.locator("#metroInspectorName").innerText(),"East Gardens");
  assert.equal(await picker.inputValue(),"east_gardens");
  assert.equal(await page.locator("#metroSceneStation").innerText(),player);
  assert.equal(await page.locator("[data-metro-station='east_gardens']").getAttribute("aria-pressed"),"true");
  const afterSelect=await page.locator("#metroNetworkViewport").evaluate(el=>el.scrollLeft);
  assert.ok(afterSelect>0,"Station finder pans a detailed network to East Gardens");
  await page.locator("#f3cLocate").tap();
  assert.equal(await picker.inputValue(),"central_station");
  assert.equal(await page.locator("#metroSceneStation").innerText(),player);
  assert.ok((await page.locator("#f3cMapLive").innerText()).includes("Central Station"));
  assert.deepEqual(events.errors,[]);assert.deepEqual(events.external,[]);
 }finally{await browser.close();}
});
test("F3C metro 05–08: user can inspect any stop and refocus real task without leaking engine progress",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true}),events=monitor(page);
  await page.goto(URL);await openMetro(page,5,"en","B1");
  for(const n of [5,6,7,8]){
   await page.locator("#f1Stations button").nth(n-1).click();
   if(n===8)continue; // Mission 08 legitimately begins above-ground.
   assert.equal(await page.locator("#f3cToTask").isVisible(),true);
   const before=await page.locator("#metroJourneyProgress").getAttribute("aria-valuenow");
   await page.locator("#f3cMetroPicker").selectOption("harbour");
   assert.equal(await page.locator("#metroJourneyProgress").getAttribute("aria-valuenow"),before);
   await page.locator("#f3cToTask").tap();
   assert.equal(await page.locator("#f1Panel h2").evaluate(el=>document.activeElement===el),true);
   assert.equal(await page.locator("#f1Panel").count(),1);
  }
  assert.deepEqual(events.errors,[]);assert.deepEqual(events.external,[]);
 }finally{await browser.close();}
});
test("F3C action keyboard focus and live feedback survive mission-step DOM replacement",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),events=monitor(page);
  await page.goto(URL);await openMetro(page,5);
  await page.locator("#f1Panel .f2-choice-list button").filter({hasText:"M1"}).first().focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(()=>document.activeElement?.closest("#f1Panel")&&
   document.activeElement.matches(".f2-choice-list button"));
  assert.match(await page.locator("#f3Status").innerText(),/Correct line/i);
  assert.match(await page.locator("#metroPublicAddress").getAttribute("data-kind"),/direction/);
  assert.ok((await page.locator("#f1Panel .f2-choice-list button").count())>=2);
  await page.locator("#f1Panel .f2-choice-list button").filter({hasText:"East Gardens"}).first().focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(()=>document.activeElement?.matches("#f1Panel .f2-choice-list button"));
  assert.match(await page.locator("#f3Status").innerText(),/terminus/i);
  assert.deepEqual(events.errors,[]);assert.deepEqual(events.external,[]);
 }finally{await browser.close();}
});
test("F3C localized metro tools are useful in EN, ES, DE, FR for every available metro level",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),events=monitor(page);
  await page.goto(URL);
  const labels={en:"Inspect any station",es:"Explorar estaciones",de:"Station ansehen",fr:"Explorer les stations"};
  for(const lang of ["en","es","de","fr"])for(const level of ["B1","B2","C1","C2"]){
   await page.locator("#f2Language").selectOption(lang);
   await page.locator("#f2Level").selectOption(level);
   assert.equal(await page.locator("#f3cPickerLabel").innerText(),labels[lang]);
   assert.equal(await page.locator("#f3cMetroPicker option").count(),14);
   await page.locator("#f3cMetroPicker").selectOption("university");
   assert.equal(await page.locator("#metroInspectorName").innerText(),"University");
   assert.equal(await page.locator("#metroSceneStation").innerText(),"Central Station");
   assert.ok((await page.locator("#f3cMapHint").innerText()).length>48);
   assert.ok((await page.locator("#f3cLocate").innerText()).length>4);
  }
  assert.deepEqual(events.errors,[]);assert.deepEqual(events.external,[]);
 }finally{await browser.close();}
});
test("F3C WebKit iPad split-view and keyboard metro-region panning do not change player route",async()=>{
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:525,height:768},isMobile:true,hasTouch:true}),events=monitor(page);
  await page.goto(URL);await openMetro(page,6,"de","C2");
  const el=page.locator("#metroNetworkViewport");
  assert.ok((await el.evaluate(x=>x.scrollWidth))>(await el.evaluate(x=>x.clientWidth)));
  await page.locator("#f3cMetroPicker").selectOption("hilltop");
  assert.equal(await page.locator("#metroInspectorName").innerText(),"Hilltop");
  const player=await page.locator("#metroSceneStation").innerText();
  await el.evaluate(x=>x.scrollLeft=0);
  await el.focus();
  await page.keyboard.press("ArrowRight");
  assert.ok((await el.evaluate(x=>x.scrollLeft))>0,"ArrowRight should pan the focused map region");
  assert.equal(await page.locator("#metroSceneStation").innerText(),player);
  assert.ok(await overflow(page)<=2,"Split view must not overflow the page horizontally");
  await page.screenshot({path:path.join(OUT,"f3c-ipad-split-525.png"),fullPage:true});
  assert.deepEqual(events.errors,[]);assert.deepEqual(events.external,[]);
 }finally{await browser.close();}
});
test("F3C 320px mobile and 1024px tablet: PA, metro map, native controls remain visible and separate",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1024,768],[1366,900]]){
   const page=await browser.newPage({viewport:{width,height}}),events=monitor(page);
   await page.goto(URL);await openMetro(page,7,"fr","C1");
   assert.equal(await page.locator("#f1Panel").count(),1);
   assert.equal(await page.locator("#f3cMetroPicker").isVisible(),true);
   assert.equal(await page.locator("#f3cLocate").isVisible(),true);
   assert.equal(await page.locator("#metroPublicAddress").isVisible(),true);
   assert.ok(await overflow(page)<=2,"Page overflow in metro F3C at "+width);
   const bbox=await page.locator("#f3cMetroPicker").boundingBox();
   assert.ok(bbox&&bbox.width>=160&&bbox.x>=0&&bbox.x+bbox.width<=width+2,
    "Station picker must remain visible and usable at "+width);
   const tools=await page.locator("#f3cMetroTools button:visible").evaluateAll(nodes=>nodes.map(n=>{
    const b=n.getBoundingClientRect();return [b.width,b.height];
   }));
   for(const [w,h] of tools)assert.ok(w>=44&&h>=44,"Touch target below 44px "+width);
   if(width===320||width===390)await page.screenshot({path:path.join(OUT,"metro-tools-"+width+".png"),fullPage:true});
   assert.deepEqual(events.errors,[]);assert.deepEqual(events.external,[]);
   await page.close();
  }
 }finally{await browser.close();}
});
test("F3C offline SHA256-CSP one-file: city compact control and metro picker need zero external requests",async()=>{
 const file=path.resolve(process.cwd(),".review-city-quest-f2/CITY_QUEST_F2_OFFLINE_PREVIEW.html");
 assert.ok(fs.existsSync(file));
 const html=fs.readFileSync(file,"utf8");
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/style-src 'sha256-/);
 assert.match(html,/script-src 'sha256-/);
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true}),events=monitor(page);
  await page.goto("file://"+file,{waitUntil:"load"});
  await openCity(page,4,"fr","B2");
  await page.locator("#f3cHudSize").tap();
  assert.equal(await page.locator("#f2Quick").getAttribute("data-compact"),"true");
  await page.locator("#f2Language").selectOption("de");
  await page.locator("#f2Level").selectOption("C1");
  assert.equal(await page.locator("#f3cMetroPicker option").count(),14);
  await page.locator("#f3cMetroPicker").selectOption("museum_quarter");
  assert.equal(await page.locator("#metroInspectorName").innerText(),"Museum Quarter");
  assert.deepEqual(events.external,[]);assert.deepEqual(events.errors,[]);
 }finally{await browser.close();}
});
