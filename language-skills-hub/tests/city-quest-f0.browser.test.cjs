/**
 * City Quest F0 browser acceptance.
 * Run with the local server at http://127.0.0.1:8765 and Playwright 1.56.1.
 * Screenshots are uploaded as review artifacts, never committed.
 */
"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {chromium,webkit}=require("playwright");
const ROOT="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f0/index.html";
const SHOTS=path.resolve(process.cwd(),"city-quest-f0-artifacts");
fs.mkdirSync(SHOTS,{recursive:true});
function errorsFrom(page){
 const errors=[];
 page.on("pageerror",e=>errors.push(String(e)));
 page.on("console",m=>{if(m.type()==="error")errors.push("console: "+m.text());});
 return errors;
}
test("desktop Chromium: render, route validation, model directions and dialogue",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=errorsFrom(page);
  const response=await page.goto(ROOT,{waitUntil:"load"});
  assert.equal(response.status(),200);
  await page.locator("#cityMap [data-node]").first().waitFor();
  assert.equal(await page.locator("#cityMap [data-node]").count(),24);
  assert.ok(await page.locator("#cityMap").evaluate(el=>el.children.length>100),"illustrated SVG should be populated");
  assert.equal(await page.locator("#routeView").isVisible(),true);
  assert.equal(await page.locator("#dialogueView").isVisible(),false);
  assert.match(await page.locator("#routeStatus").innerText(),/Central Station/);
  await page.screenshot({path:path.join(SHOTS,"desktop-initial.png"),fullPage:true});
  // A long-distance map tap must not teleport.
  await page.locator('[data-node="3-1"]').click();
  assert.match(await page.locator("#routeStatus").innerText(),/next intersection/);
  assert.equal(await page.locator('#activePathFront').getAttribute("points"),"168,580");
  for(const name of ["east","east","east","north","north"])await page.locator("#"+name).click();
  assert.match(await page.locator("#routeStatus").innerText(),/Destination reached/);
  assert.equal(await page.locator("#routeResult").isVisible(),true);
  await page.locator("#modelBtn").click();
  const model=await page.locator("#modelText").innerText();
  assert.match(model,/City Museum/);
  assert.match(model,/3 blocks east/);
  await page.screenshot({path:path.join(SHOTS,"desktop-success.png"),fullPage:true});
  await page.locator("#undoBtn").click();
  assert.equal(await page.locator("#routeResult").isVisible(),false);
  await page.locator("#mapReset").click();
  assert.equal(await page.locator('#activePathFront').getAttribute("points"),"168,580");
  await page.locator("#themeBtn").click();
  assert.equal(await page.locator("html").getAttribute("data-theme"),"light");
  await page.locator("#mapZoom").click();
  assert.equal(await page.locator("#mapViewport").evaluate(el=>el.classList.contains("zoomed")),true);
  await page.locator("#dialogueTab").click();
  assert.equal(await page.locator("#dialogueView").isVisible(),true);
  await page.locator("#dialogueOptions button").last().click();
  assert.match(await page.locator("#actorLine").innerText(),/river/);
  await page.locator("#dialogueOptions button").first().click();
  assert.match(await page.locator("#actorLine").innerText(),/suitcase/);
  await page.locator("#dialogueOptions button").first().click();
  assert.match(await page.locator("#actorLine").innerText(),/Thanks for your help/);
  await page.screenshot({path:path.join(SHOTS,"desktop-dialogue.png"),fullPage:true});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("mobile Chromium: touch control, narrow viewport, dialogue reset",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const errors=errorsFrom(page);
  await page.goto(ROOT,{waitUntil:"load"});
  await page.locator("#cityMap [data-node]").first().waitFor();
  const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth,map:document.querySelector("#mapViewport").clientWidth}));
  assert.ok(overflow.scroll<=overflow.inner+2,"page horizontal overflow: "+JSON.stringify(overflow));
  await page.locator("#east").tap();
  await page.locator("#east").tap();
  await page.locator("#east").tap();
  await page.locator("#north").tap();
  await page.locator("#north").tap();
  assert.equal(await page.locator("#routeResult").isVisible(),true);
  await page.screenshot({path:path.join(SHOTS,"mobile-success.png"),fullPage:true});
  await page.locator("#dialogueTab").tap();
  assert.equal(await page.locator("#dialogueView").isVisible(),true);
  await page.locator("#dialogueOptions button").first().tap();
  await page.locator("#dialogueBack").tap();
  assert.match(await page.locator("#actorLine").innerText(),/trying to find/);
  await page.screenshot({path:path.join(SHOTS,"mobile-dialogue.png"),fullPage:true});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("mobile WebKit: responsive render and map interactions",async()=>{
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const errors=errorsFrom(page);
  await page.goto(ROOT,{waitUntil:"load"});
  await page.locator("#cityMap [data-node]").first().waitFor();
  assert.equal(await page.locator("#cityMap [data-node]").count(),24);
  await page.locator("#east").tap();
  assert.match(await page.locator("#routeStatus").innerText(),/Continue/);
  await page.screenshot({path:path.join(SHOTS,"webkit-mobile.png"),fullPage:true});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
