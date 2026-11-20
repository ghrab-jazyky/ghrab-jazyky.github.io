"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {chromium,webkit}=require("playwright");
const F=require("../authoring/city-quest-f1/engine.js");
const HOME="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f1/index.html";
const OUTPUT=path.join(process.cwd(),"city-quest-f1-artifacts");
fs.mkdirSync(OUTPUT,{recursive:true});
function watchErrors(page){
 const errors=[];
 page.on("pageerror",error=>errors.push("PAGE "+String(error)));
 page.on("console",message=>{
  if(message.type()==="error"&&!/Refused to apply a stylesheet/.test(message.text()))
    errors.push("CONSOLE "+message.text());
 });
 return errors;
}
async function station(page,n){
 await page.locator("#f1Stations button").nth(n-1).click();
 assert.equal(await page.locator("#f1Stations button").nth(n-1).getAttribute("aria-current"),"step");
}
async function control(page,dir){
 await page.locator("#f1Panel .f1-step-pad ."+dir).click();
}
async function directRoute(page,dirs){
 for(const dir of dirs)await control(page,dir);
}
async function completedCount(page){
 const value=await page.locator("#f1ProgressTrack").getAttribute("aria-valuenow");
 return Number(value);
}
test("F1 desktop Chromium: all eight stations, independent gameplay, and progression",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=watchErrors(page);
  const resp=await page.goto(HOME,{waitUntil:"load"});
  assert.equal(resp.status(),200);
  await page.locator("#f1Stations button").first().waitFor();
  assert.equal(await page.locator("#f1Stations button").count(),8);
  assert.equal(await page.locator("#cityMap [data-node]").count(),24);
  assert.ok(await page.locator("#cityMap [data-landmark-label]").count()>=18);
  assert.equal(await completedCount(page),0);
  await page.screenshot({path:path.join(OUTPUT,"f1-desktop-station01.png"),fullPage:true});
  // 1: six correct landmark challenges.
  for(const round of F.explore){
    const idx=round.choices.indexOf(round.correct);
    await page.locator("#f1Panel .f1-choices button").nth(idx).click();
  }
  assert.match(await page.locator("#f1Panel").innerText(),/City Explorer complete/);
  assert.equal(await completedCount(page),1);
  // 2: tested F0 route reused without rewriting.
  await station(page,2);
  for(const dir of ["east","east","east","north","north"])await page.locator("#"+dir).click();
  assert.equal(await page.locator("#routeResult").isVisible(),true);
  await page.waitForFunction(()=>document.getElementById("f1ProgressTrack").getAttribute("aria-valuenow")==="2");
  // 3: existing branching tourist dialogue reused.
  await station(page,3);
  await page.locator("#dialogueOptions button").first().click();
  await page.locator("#dialogueOptions button").first().click();
  assert.match(await page.locator("#dialoguePrompt").innerText(),/successfully helped/);
  await page.waitForFunction(()=>document.getElementById("f1ProgressTrack").getAttribute("aria-valuenow")==="3");
  // 4: guided movement with correction and map path.
  await station(page,4);
  await control(page,"north"); // wrong, must not advance
  assert.match(await page.locator("#f1Panel").innerText(),/DIRECTION 1/);
  await directRoute(page,["east","east","north","north","east"]);
  assert.match(await page.locator("#f1Panel").innerText(),/You reached the City Museum/);
  assert.equal(await completedCount(page),4);
  // 5: transit table and multi-field validation.
  await station(page,5);
  const selects=page.locator("#f1Panel select");
  await selects.nth(0).selectOption("24");
  await selects.nth(1).selectOption("08:47");
  await selects.nth(2).selectOption("Hospital");
  await page.getByRole("button",{name:"Check my journey"}).click();
  assert.match(await page.locator("#f1Panel").innerText(),/Excellent transport planning/);
  assert.equal(await completedCount(page),5);
  // 6: identify and fix bad directions.
  await station(page,6);
  await page.locator("#f1Panel .f1-choices button").nth(1).click();
  await page.locator("#f1Panel .f1-choices button").first().click();
  assert.match(await page.locator("#f1Panel").innerText(),/Directions repaired/);
  assert.equal(await completedCount(page),6);
  // 7: avoid blocked segment, then complete using the alternative street.
  await station(page,7);
  await control(page,"east");await control(page,"east");
  await control(page,"east");
  assert.match(await page.locator("#f1Panel .f1-feedback").innerText(),/closed/i);
  assert.match(await page.locator("#f1Closure").textContent(),/ROAD CLOSED/);
  await page.locator("#f1Panel .f1-actions").last().getByRole("button",{name:/Restart/}).click();
  await directRoute(page,["north","east","east","east","north"]);
  assert.match(await page.locator("#f1Panel").innerText(),/Detour found/);
  assert.equal(await completedCount(page),7);
  // 8: three legs, three speaking checkpoints; no false speech grading.
  await station(page,8);
  await directRoute(page,["east","east","north"]);
  assert.match(await page.locator("#f1Panel").innerText(),/Speaking checkpoint/);
  await page.getByRole("button",{name:/I spoke and checked/}).click();
  await directRoute(page,["east","east"]);
  await page.getByRole("button",{name:/I spoke and checked/}).click();
  await directRoute(page,["west","north"]);
  await page.getByRole("button",{name:/I spoke and checked/}).click();
  assert.match(await page.locator("#f1Panel").innerText(),/City Quest completed/);
  assert.equal(await completedCount(page),8);
  await page.screenshot({path:path.join(OUTPUT,"f1-desktop-all-complete.png"),fullPage:true});
  assert.deepEqual(errors,[],"the F1 browser app must not generate errors");
 }finally{await browser.close();}
});
test("F1 mobile Chromium: pair mode, map taps, compass and responsive layout",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const errors=watchErrors(page);
  await page.goto(HOME,{waitUntil:"load"});
  await page.locator("#f1Stations button").first().waitFor();
  const overflow=await page.evaluate(()=>({body:document.documentElement.scrollWidth,screen:window.innerWidth}));
  assert.ok(overflow.body<=overflow.screen+2,"390px horizontal overflow "+JSON.stringify(overflow));
  await page.locator("#f1Pair").tap();
  assert.equal(await page.locator("#f1Pair").getAttribute("aria-pressed"),"true");
  assert.equal(await page.locator("#f1Panel .f1-pair-tip").count(),1);
  await station(page,4);
  assert.equal(await page.locator("#mapViewport").evaluate(el=>el.classList.contains("detail")),true);
  assert.equal(await page.locator("#f1MapQuick").isVisible(),true,"mobile route controls must sit beside the map");
  assert.match(await page.locator("#f1MapQuick").innerText(),/Step 1\/5/);
  const map=page.locator("#mapViewport");
  assert.ok(await map.evaluate(el=>el.scrollWidth>el.clientWidth*1.5));
  // The actual map node, not only the compass, must advance the instructions.
  await page.locator('[data-node="1-3"]').tap();
  assert.match(await page.locator("#f1Panel").innerText(),/DIRECTION 2/);
  assert.match(await page.locator("#f1MapQuick").innerText(),/Step 2\/5/);
  await page.locator("#f1MapQuick .f1-quick-east").tap();
  assert.match(await page.locator("#f1Panel").innerText(),/DIRECTION 3/);
  await page.screenshot({path:path.join(OUTPUT,"f1-mobile-map-guided.png"),fullPage:true});
  await page.setViewportSize({width:320,height:640});
  const tiny=await page.evaluate(()=>({body:document.documentElement.scrollWidth,screen:window.innerWidth}));
  assert.ok(tiny.body<=tiny.screen+2,"320px horizontal overflow "+JSON.stringify(tiny));
  await page.screenshot({path:path.join(OUTPUT,"f1-mobile-320px.png"),fullPage:true});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F1 mobile WebKit: navigation and all station tabs render",async()=>{
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  const errors=watchErrors(page);
  await page.goto(HOME,{waitUntil:"load"});
  await page.locator("#f1Stations button").first().waitFor();
  assert.equal(await page.locator("#f1Stations button").count(),8);
  await station(page,5);
  assert.equal(await page.locator("#f1Panel select").count(),3);
  await station(page,7);
  assert.match(await page.locator("#f1Closure").textContent(),/ROAD CLOSED/);
  await station(page,3);
  assert.equal(await page.locator("#dialogueView").isVisible(),true);
  await page.screenshot({path:path.join(OUTPUT,"f1-webkit-mobile.png"),fullPage:true});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F1 portable preview: offline file:// app, CSP and navigation without requests",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const file=path.join(process.cwd(),".review-city-quest-f1/CITY_QUEST_F1_OFFLINE_PREVIEW.html");
  assert.equal(fs.existsSync(file),true,"CI must build single-file preview before browser tests");
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=watchErrors(page),network=[];
  page.on("request",r=>{if(!r.url().startsWith("file:"))network.push(r.url());});
  await page.goto("file://"+file,{waitUntil:"load"});
  await page.locator("#f1Stations button").first().waitFor();
  assert.equal(await page.locator("#f1Stations button").count(),8);
  await station(page,4);
  await control(page,"east");
  assert.match(await page.locator("#f1Panel").innerText(),/DIRECTION 2/);
  await page.screenshot({path:path.join(OUTPUT,"f1-portable-desktop.png"),fullPage:true});
  assert.deepEqual(network,[],"no external network requests allowed");
  assert.deepEqual(errors,[],"no CSP or JavaScript errors allowed");
 }finally{await browser.close();}
});
