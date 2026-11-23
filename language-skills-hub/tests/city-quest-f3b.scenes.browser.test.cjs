"use strict";
/* City Quest F3B browser acceptance: authored metro PA text, SVG state and
 * exact-CSP no-request offline runtime, without answer leaks.
 */
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {chromium,webkit}=require("playwright");
const L=require("../authoring/city-quest-f2-1d/metro-language.js");
// This is an AUTHORING/QA visual-preview suite. Normal student URLs do
// not expose guided reference routes (CQ-F5-006).
const URL="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html?cq-review=1";
const OUT=path.join(process.cwd(),"city-quest-f3b-artifacts");
fs.mkdirSync(OUT,{recursive:true});
const p=page=>page.locator("#f1Panel"),pa=page=>page.locator("#metroPublicAddress");
const errorsOf=page=>{const errors=[];page.on("pageerror",e=>errors.push(e.stack||String(e)));return errors;};
async function mission(page,n,language="en",level="B1"){
 await page.locator("#f2Language").selectOption(language);
 await page.locator("#f2Level").selectOption(level);
 await page.locator("#metroPilotToggle").click();
 await page.locator("#f1Stations .f1-station").nth(n-1).click();
}
async function choose(page,text){
 await p(page).getByRole("button",{name:text,exact:false}).first().click();
}
test("F3B inactive preview retains F2.1B gallery, while active 05 gets accessible written PA",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=errorsOf(page);
  await page.goto(URL,{waitUntil:"load"});
  assert.equal(await pa(page).isVisible(),false);
  await mission(page,5);
  assert.equal(await pa(page).isVisible(),true);
  assert.equal(await pa(page).getAttribute("aria-live"),"polite");
  assert.equal(await pa(page).getAttribute("data-kind"),"wayfinding");
  assert.match(await page.locator("#metroPALabel").innerText(),/TEXT SIMULATION/);
  assert.doesNotMatch(await page.locator("#metroPAMessage").innerText(),/\bM1\b|\bEast Gardens\b/);
  assert.equal(await page.locator("#metroSceneSvg").getAttribute("data-phase"),"select-line");
  assert.match(await page.locator("#metroSceneSvg").textContent(),/STATION CONCOURSE/);
  assert.doesNotMatch(await page.locator("#metroSceneSvg").textContent(),/PLATFORM 2/);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F3B station 05: line, terminus and platform remain unknown until chosen; doors open only when ready",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=errorsOf(page);
  await page.goto(URL);await mission(page,5);
  assert.equal(await page.locator(".metro-train-door-left").count(),2);
  await choose(page,"M1 ·");
  assert.equal(await pa(page).getAttribute("data-kind"),"direction");
  assert.match(await page.locator("#metroSceneSvg").textContent(),/CHECK THE TRAIN TERMINUS/);
  assert.doesNotMatch(await page.locator("#metroPAMessage").innerText(),/East Gardens/i);
  await choose(page,"East Gardens");
  assert.equal(await pa(page).getAttribute("data-kind"),"platform");
  assert.match(await page.locator("#metroSceneSvg").textContent(),/PLATFORM CHECK/);
  assert.doesNotMatch(await page.locator("#metroPAMessage").innerText(),/Platform 2/i);
  await choose(page,"Platform 2");
  assert.equal(await page.locator("#metroSceneSvg").getAttribute("data-phase"),"board");
  assert.match(await page.locator(".metro-train-door-left").first().evaluate(
   el=>getComputedStyle(el).animationName),/f3b-door-slide-left/);
  assert.ok((await page.locator("#metroPAMessage").innerText()).includes("East Gardens"));
  assert.equal(await pa(page).getAttribute("data-kind"),"boarding");
  await page.waitForTimeout(720);
  await page.locator("#metroSceneSvg").screenshot({path:path.join(OUT,"boarding-open-doors-1366.png")});
  await choose(page,"Board the train");
  assert.equal(await page.locator("#metroSceneSvg").getAttribute("data-phase"),"ride");
  assert.equal(await pa(page).getAttribute("data-kind"),"onboard");
  assert.ok((await page.locator("#metroPAMessage").innerText()).includes("Old Town"));
  assert.equal(await page.locator(".metro-window-world").count(),1);
  await choose(page,"Travel to next stop");
  assert.ok((await page.locator("#metroPAMessage").innerText()).includes("Museum Quarter"));
  await choose(page,"Travel to next stop");
  assert.equal(await page.locator("#metroSceneSvg").getAttribute("data-phase"),"ride");
  await choose(page,"Get off here");
  assert.equal(await pa(page).getAttribute("data-kind"),"arrival");
  assert.equal(await page.locator("#metroSceneSvg").getAttribute("data-phase"),"exit");
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F3B all 16 language/level profiles: active PA and stage-specific CEFR prompts without giving away route",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=errorsOf(page);
  await page.goto(URL);
  for(const lang of ["en","es","de","fr"])for(const level of ["B1","B2","C1","C2"]){
   await mission(page,6,lang,level);
   assert.equal(await pa(page).getAttribute("data-kind"),"wayfinding");
   assert.ok((await page.locator("#metroPAPrompt").innerText()).length>28);
   const text=await page.locator("#metroPAMessage").innerText();
   assert.doesNotMatch(text,/\bM2\b|\bM3\b|\bUniversity\b/);
   const c=L.pack(lang,level,6);
   assert.ok((await p(page).innerText()).includes(c.titleMission));
   await page.locator("#metroPilotToggle").click();
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F3B disruption notice uses authored local language and never gives the University diversion away",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=errorsOf(page);
  await page.goto(URL);await mission(page,7,"fr","C1");
  assert.equal(await pa(page).getAttribute("data-kind"),"notice");
  const msg=await page.locator("#metroPAMessage").innerText();
  assert.match(msg,/Old Town/);assert.match(msg,/Museum Quarter/);
  assert.match(msg,/\bM1\b/);assert.doesNotMatch(msg,/University|\bM2\b|\bM3\b/);
  assert.equal(await page.locator("#metroSceneSvg").getAttribute("data-phase"),"notice");
  assert.equal(await page.locator(".metro-alert-sign").count(),1);
  // This C1 mission is French: verify the localized board, never English fallback.
  assert.match(await page.locator("#metroSceneSvg").textContent(),/SERVICE PERTURBÉ/);
  assert.doesNotMatch(await page.locator("#metroSceneSvg").textContent(),/SERVICE DISRUPTION/);
  assert.doesNotMatch(await page.locator("#metroSceneSvg").textContent(),/CHECK PLATFORM/);
  await page.locator("#metroSceneSvg").screenshot({path:path.join(OUT,"french-c1-disruption-390.png")});
  await choose(page,L.pack("fr","C1",7).actions.READ_NOTICE);
  assert.equal(await pa(page).getAttribute("data-kind"),"wayfinding");
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F3B station 06 transfer scene is visually distinct but does not reveal the next line prematurely",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=errorsOf(page);
  await page.goto(URL);await mission(page,6);
  const c=L.pack("en","B1",6);
  await choose(page,"M2 ·");await choose(page,"North Park");await choose(page,"Platform 1");
  await choose(page,c.actions.BOARD);
  await choose(page,c.actions.NEXT_STOP);await choose(page,c.actions.NEXT_STOP);
  assert.equal(await pa(page).getAttribute("data-kind"),"onboard");
  await choose(page,c.actions.TRANSFER_HERE);
  assert.equal(await pa(page).getAttribute("data-kind"),"transfer");
  assert.equal(await page.locator(".metro-transfer-arrow").count(),1);
  assert.match(await page.locator("#metroSceneSvg").textContent(),/CHANGE TRAINS/);
  assert.doesNotMatch(await page.locator("#metroSceneSvg").textContent(),/TOWARDS NORTH PARK|PLATFORM 1/);
  assert.ok((await page.locator("#metroPAMessage").innerText()).includes("University"));
  assert.doesNotMatch(await page.locator("#metroPAMessage").innerText(),/\bM3\b/);
  await page.locator("#metroSceneSvg").screenshot({path:path.join(OUT,"transfer-university-1366.png")});
  await choose(page,c.actions.CHANGE_LINE);
  assert.equal(await pa(page).getAttribute("data-kind"),"wayfinding");
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F3B mobile 320/390, tablet and desktop have no horizontal overflow and present the PA board",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1366,900]]){
   const page=await browser.newPage({viewport:{width,height}}),errors=errorsOf(page);
   await page.goto(URL);await mission(page,5,"es","B2");
   assert.equal(await pa(page).isVisible(),true);
   assert.equal(await page.locator("#f1Panel").isVisible(),true);
   const dx=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert.ok(dx<=1,"Unexpected horizontal overflow at "+width+"px: "+dx);
   const box=await pa(page).boundingBox();
   assert.ok(box&&box.width>220,"PA board clipped at "+width);
   if(width===320||width===390)
    await page.screenshot({path:path.join(OUT,"f3b-premium-"+width+".png"),fullPage:true});
   assert.deepEqual(errors,[]);
   await page.close();
  }
 }finally{await browser.close();}
});
test("F3B OS reduced-motion disables window scenery and transfer motion even in WebKit",async()=>{
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}),errors=errorsOf(page);
  await page.goto(URL);await mission(page,5);
  await choose(page,"M1 ·");await choose(page,"East Gardens");await choose(page,"Platform 2");
  assert.equal(await page.locator("html").getAttribute("data-motion"),"off");
  assert.equal(await page.locator(".metro-train-door-left").first().evaluate(
   el=>getComputedStyle(el).animationName),"none");
  assert.equal(await page.locator(".metro-train-door-left").first().getAttribute("x"),"275",
   "Reduced-motion mode must still show the doors OPEN after valid platform selection.");
  await choose(page,"Board the train");
  assert.equal(await page.locator("#metroSceneSvg").getAttribute("data-phase"),"ride");
  assert.equal(await page.locator(".metro-window-world").evaluate(el=>getComputedStyle(el).animationName),"none");
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F3B standalone strict SHA-CSP HTML supports text announcements offline without network or external voices",async()=>{
 const file=path.resolve(process.cwd(),".review-city-quest-f2/CITY_QUEST_F2_OFFLINE_PREVIEW.html");
 const html=fs.readFileSync(file,"utf8");
 assert.match(html,/script-src 'sha256-/);assert.match(html,/style-src 'sha256-/);assert.match(html,/connect-src 'none'/);
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=errorsOf(page),requests=[];
  page.on("request",r=>{if(!r.url().startsWith("file:"))requests.push(r.url());});
  await page.goto("file://"+file+"?cq-review=1",{waitUntil:"load"});
  await mission(page,7,"de","B2");
  assert.equal(await pa(page).getAttribute("data-kind"),"notice");
  assert.ok((await page.locator("#metroPAMessage").innerText()).length>35);
  assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
