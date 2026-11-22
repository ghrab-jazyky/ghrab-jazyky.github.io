"use strict";
/* Browser acceptance for the F2.1B illustrated Riverton Metro review world.
 * Important: this checks visual prototype behavior, NOT scored metro missions.
 */
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {chromium,webkit}=require("playwright");
// This is an AUTHORING/QA visual-preview suite. Normal student URLs do
// not expose guided reference routes (CQ-F5-006).
const URL="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html?cq-review=1";
const SHOTS=path.join(process.cwd(),"city-quest-f2-1b-artifacts");
fs.mkdirSync(SHOTS,{recursive:true});
function errorsFrom(page){
 const errors=[],external=[];
 page.on("pageerror",e=>errors.push("PAGE "+e.message));
 page.on("console",m=>{if(m.type()==="error")errors.push("CONSOLE "+m.text());});
 page.on("request",r=>{
  if(!r.url().startsWith("file:")&&!r.url().startsWith("http://127.0.0.1:8765/"))
   external.push(r.url());
 });
 return {errors,external};
}
async function select(page,lang,level){
 await page.locator("#f2Language").selectOption(lang);
 await page.locator("#f2Level").selectOption(level);
}
async function scenario(page,id){
 await page.locator('[data-scenario="'+id+'"]').click();
 assert.equal(await page.locator('[data-scenario="'+id+'"]').getAttribute("aria-pressed"),"true");
}
async function advance(page,n){
 for(let i=0;i<n;i++)await page.locator("#metroAdvance").click();
}
test("F2.1B desktop Chromium: premium network, interactive stations and accurate journeys",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const events=errorsFrom(page);
  const response=await page.goto(URL,{waitUntil:"load"});
  assert.equal(response.status(),200);
  await page.locator("#metroLab:not([hidden])").waitFor();
  assert.equal(await page.locator("#metroNetworkSvg [data-metro-station]").count(),14);
  assert.equal(await page.locator("#metroRails > polyline").count(),12,
   "Each of three metro lines needs a four-layer original vector track");
  assert.equal(await page.locator("#metroLegend .metro-legend-item").count(),3);
  assert.equal(await page.locator("#metroScenarios button").count(),4);
  assert.ok(await page.locator("#metroSceneSvg rect").count()>20,"Platform must have layered illustrated architecture");
  assert.equal(await page.locator("#metroNetworkSvg").getAttribute("role"),"group");
  await page.locator("#metroJump").click();
  await page.locator(".metro-workspace").screenshot({path:path.join(SHOTS,"metro-desktop-station-map.png")});
  // Network map is real interactive SVG; inspecting a station is not a move.
  await page.locator('[data-metro-station="east_gardens"]').focus();
  await page.keyboard.press("Enter");
  assert.match(await page.locator("#metroInspectorName").innerText(),/East Gardens/);
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute("data-metro-station")),"east_gardens",
    "Keyboard inspector must preserve its SVG node focus after selection");
  assert.equal(await page.locator('[data-metro-station="east_gardens"]').getAttribute("aria-pressed"),"true");
  assert.equal(await page.locator("#metroSceneStation").innerText(),"Central Station",
    "Inspecting a station must not teleport the active train");
  assert.match(await page.locator("#metroFeedback").innerText(),/network inspection/i);
  await scenario(page,"metro_05_b1");
  assert.equal(await page.locator("#metroJourneyBadge").innerText(),"05");
  await advance(page,2);
  assert.equal(await page.locator("#metroAdvance").isDisabled(),true);
  assert.match(await page.locator("#metroFeedback").innerText(),/Journey completed/);
  assert.equal(await page.locator("#metroSceneStation").innerText(),"Museum Quarter");
  await scenario(page,"metro_06_b1");
  await advance(page,2); // Market Square -> Central Station -> University
  assert.match(await page.locator("#metroNextInfo").innerText(),/TRANSFER/);
  await advance(page,1); // explicit M2 -> M3 change
  assert.equal(await page.locator("#metroSceneLine").innerText(),"M3 · Coral Line");
  assert.match(await page.locator("#metroFeedback").innerText(),/Changed from M2 to M3/);
  await page.locator("#metroViewTrain").click();
  assert.equal(await page.locator("#metroViewTrain").getAttribute("aria-pressed"),"true");
  assert.ok(await page.locator("#metroSceneSvg rect").count()>15);
  await page.locator(".metro-workspace").screenshot({path:path.join(SHOTS,"metro-desktop-train-interior.png")});
  assert.deepEqual(events.external,[],"No remote requests or image tiles");
  assert.deepEqual(events.errors,[],"No JavaScript or CSP violations");
 }finally{await browser.close();}
});
test("F2.1B metro disruption: real closed M1 edge, routed M2→M3 detour",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const events=errorsFrom(page);
  await page.goto(URL,{waitUntil:"load"});
  await scenario(page,"metro_07_b1");
  assert.equal(await page.locator("#metroNetworkAlert").isVisible(),true);
  assert.equal(await page.locator('#metroRails line[stroke="#ff807d"]').count(),1);
  assert.equal(await page.locator("#metroSceneLine").innerText(),"M2 · Emerald Line");
  await advance(page,1);
  assert.equal(await page.locator("#metroSceneStation").innerText(),"University");
  await advance(page,1);
  assert.equal(await page.locator("#metroSceneLine").innerText(),"M3 · Coral Line");
  await advance(page,2);
  assert.equal(await page.locator("#metroSceneStation").innerText(),"Museum Quarter");
  assert.match(await page.locator("#metroFeedback").innerText(),/Journey completed/);
  await page.locator(".metro-workspace").screenshot({path:path.join(SHOTS,"metro-disruption-desktop.png")});
  await scenario(page,"metro_08_b1");
  assert.equal(await page.locator("#metroJourneyBadge").innerText(),"08");
  assert.match(await page.locator("#metroDestination").innerText(),/Museum Quarter/);
  assert.equal(await page.locator("#metroNetworkAlert").isVisible(),false);
  assert.deepEqual(events.external,[]);
  assert.deepEqual(events.errors,[]);
 }finally{await browser.close();}
});
test("F2.1B phones: original metro SVG is pannable, gameplay controls accessible 320/390px",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const events=errorsFrom(page);
  await page.goto(URL,{waitUntil:"load"});
  await select(page,"es","B2");
  assert.equal(await page.locator("#metroLab").isVisible(),true);
  assert.equal(await page.locator("#metroJump").isVisible(),true);
  for(const [w,h] of [[390,844],[320,568]]){
   await page.setViewportSize({width:w,height:h});
   const geometry=await page.evaluate(()=>{
    const v=document.querySelector("#metroNetworkViewport");
    return {body:document.documentElement.scrollWidth,screen:innerWidth,
      sw:v.scrollWidth,cw:v.clientWidth,sh:v.scrollHeight,ch:v.clientHeight};
   });
   assert.ok(geometry.body<=geometry.screen+2,"Page horizontal overflow "+w+": "+JSON.stringify(geometry));
   assert.ok(geometry.sw>geometry.cw*1.6,"Schematic must stay legible and swipe horizontally on phone");
   assert.equal(await page.locator("#metroScenarios button").count(),4);
   await page.locator("#metroLab").scrollIntoViewIfNeeded();
   await page.locator(".metro-workspace").screenshot({
    path:path.join(SHOTS,"metro-phone-"+w+"x"+h+".png")
   });
  }
  // Overview is a compact schematic, detail is independently pannable.
  await page.locator("#metroMapZoom").tap();
  assert.equal(await page.locator("#metroMapZoom").getAttribute("aria-pressed"),"true");
  assert.equal(await page.locator("#metroNetworkViewport").evaluate(el=>el.classList.contains("overview")),true);
  const wide=await page.locator("#metroNetworkViewport").evaluate(el=>({sw:el.scrollWidth,cw:el.clientWidth}));
  assert.ok(wide.sw<=wide.cw+3,"Whole network should fit inside phone viewport "+JSON.stringify(wide));
  await page.locator(".metro-network-card").screenshot({path:path.join(SHOTS,"metro-phone-overview.png")});
  await page.locator("#metroMapZoom").tap();
  assert.equal(await page.locator("#metroNetworkViewport").evaluate(el=>el.classList.contains("overview")),false);
  await scenario(page,"metro_05_b1");
  await page.locator("#metroAdvance").tap();
  assert.match(await page.locator("#metroSceneStation").innerText(),/Old Town/);
  await page.locator("#metroViewPlatform").tap();
  assert.equal(await page.locator("#metroViewPlatform").getAttribute("aria-pressed"),"true");
  await page.locator("#metroReplay").tap();
  assert.equal(await page.locator("#metroSceneStation").innerText(),"Central Station");
  assert.deepEqual(events.external,[]);
  assert.deepEqual(events.errors,[]);
 }finally{await browser.close();}
});
test("F2.1B mobile WebKit: platform and train original scenes render without API",async()=>{
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  const events=errorsFrom(page);
  await page.goto(URL,{waitUntil:"load"});
  await select(page,"fr","C2");
  assert.equal(await page.locator("#metroLab").isVisible(),true);
  assert.equal(await page.locator("#metroNetworkSvg [data-metro-station]").count(),14);
  await scenario(page,"metro_06_b1");
  await page.locator("#metroViewTrain").tap();
  assert.equal(await page.locator("#metroViewTrain").getAttribute("aria-pressed"),"true");
  await advance(page,1);
  assert.equal(await page.locator("#metroSceneStation").innerText(),"Central Station");
  assert.deepEqual(events.external,[]);
  assert.deepEqual(events.errors,[]);
  await page.locator(".metro-workspace").screenshot({path:path.join(SHOTS,"metro-mobile-webkit.png")});
 }finally{await browser.close();}
});
test("F2.1B visibility gating: A1/A2 city-only and B1–C2 metro preview for four languages",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const events=errorsFrom(page);
  await page.goto(URL,{waitUntil:"load"});
  for(const lang of ["en","es","de","fr"]){
   for(const level of ["A1","A2"]){
    await select(page,lang,level);
    assert.equal(await page.locator("#metroLab").isVisible(),false,lang+level);
    assert.equal(await page.locator("#metroJump").isVisible(),false,lang+level);
   }
   for(const level of ["B1","B2","C1","C2"]){
    await select(page,lang,level);
    assert.equal(await page.locator("#metroLab").isVisible(),true,lang+level);
    assert.equal(await page.locator("#metroJump").isVisible(),true,lang+level);
    // The gallery remains a genuine EN reference, but its explanations are
    // translated into the selected UI language. Do not require English text
    // to leak into the ES/DE/FR interface.
    const galleryLanguage={
     en:/EN\/B1 route reference/,
     es:/Referencia visual en inglés/,
     de:/Unbenotetes englisches Anschauungsbeispiel/,
     fr:/Exemple visuel en anglais/
    };
    assert.match(await page.locator("#metroLab .metro-disclaimer").innerText(),galleryLanguage[lang]);
   }
  }
  assert.deepEqual(events.external,[]);
  assert.deepEqual(events.errors,[]);
 }finally{await browser.close();}
});
test("F2.1B one-file offline HTML: all 14 metro stops, scene and route with no external requests",async()=>{
 const file=path.resolve(process.cwd(),".review-city-quest-f2/CITY_QUEST_F2_OFFLINE_PREVIEW.html");
 assert.ok(fs.existsSync(file),"Build offline HTML before this test.");
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:850}});
  const events=errorsFrom(page);
  await page.goto("file://"+file+"?cq-review=1",{waitUntil:"load"});
  await page.locator("#metroLab:not([hidden])").waitFor();
  assert.equal(await page.locator("#metroNetworkSvg [data-metro-station]").count(),14);
  await scenario(page,"metro_07_b1");
  await advance(page,4);
  assert.equal(await page.locator("#metroAdvance").isDisabled(),true);
  assert.equal(await page.locator("#metroSceneStation").innerText(),"Museum Quarter");
  assert.deepEqual(events.external,[]);
  assert.deepEqual(events.errors,[]);
  await page.locator(".metro-workspace").screenshot({path:path.join(SHOTS,"metro-offline-full.png")});
 }finally{await browser.close();}
});
