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
  assert.ok(await page.locator("#cityMap").evaluate(el=>el.children.length>60),"illustrated SVG should be populated");
  assert.ok(await page.locator("#cityMap polygon").count()>=45,"miniature buildings should have visible 2.5D façades");
  assert.ok(await page.locator("[data-landmark-label]").count()>=18,"all city districts need original legible labels");
  assert.equal(await page.locator('[data-landmark-label="CITY MUSEUM"]').count(),1);
  const collisions=await page.locator("[data-landmark-label]").evaluateAll(elements=>{
    const boxes=elements.map(el=>({name:el.dataset.landmarkLabel,b:el.getBBox()}));
    const out=[];
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
      const a=boxes[i].b,b=boxes[j].b;
      if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>4 &&
         Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>4)
        out.push(boxes[i].name+" overlaps "+boxes[j].name);
    }
    return out;
  });
  assert.deepEqual(collisions,[],"map labels must not overlap other landmark labels");
  assert.equal(await page.getByRole("button",{name:"Crossroads column 2, row 4"}).count(),1,"a map crossroads must be exposed as an accessible button");
  assert.equal(await page.locator("#routeView").isVisible(),true);
  assert.equal(await page.locator("#dialogueView").isVisible(),false);
  assert.match(await page.locator("#routeStatus").innerText(),/Central Station/);
  await page.screenshot({path:path.join(SHOTS,"desktop-initial.png"),fullPage:true});
  // Map crossroads must respond to pointer selection, not only to direction buttons.
  await page.locator('[data-node="1-3"]').click();
  assert.equal(await page.locator("#activePathFront").getAttribute("points"),"168,580 340,580");
  await page.locator("#mapReset").click();
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
  assert.equal(await page.locator("#mapViewport").evaluate(el=>el.classList.contains("detail")),true);
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
  assert.ok(await page.locator("#mapViewport").evaluate(el=>el.classList.contains("detail")));
  assert.ok(await page.locator("#mapViewport").evaluate(el=>el.scrollWidth>el.clientWidth*1.8));
  const buttons=await page.locator(".direction-tools .btn").evaluateAll(nodes=>
    nodes.map(n=>({id:n.id,r:n.getBoundingClientRect().toJSON()})));
  assert.equal(buttons.length,4);
  await page.locator("#east").tap();
  await page.locator("#east").tap();
  await page.locator("#east").tap();
  await page.locator("#north").tap();
  await page.locator("#north").tap();
  assert.equal(await page.locator("#routeResult").isVisible(),true);
  await page.screenshot({path:path.join(SHOTS,"mobile-success.png"),fullPage:true});
  await page.setViewportSize({width:320,height:640});
  const tiny=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
  assert.ok(tiny.scroll<=tiny.inner+2,"320px viewport overflow: "+JSON.stringify(tiny));
  await page.screenshot({path:path.join(SHOTS,"mobile-320px.png"),fullPage:true});
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
  assert.equal(await page.locator("#mapViewport").evaluate(el=>el.classList.contains("detail")),true,
    "mobile map should open in readable detail mode");
  assert.ok(await page.locator("#mapViewport").evaluate(el=>el.scrollWidth>el.clientWidth*1.8),
    "mobile map should be pannable at legible scale");
  await page.locator("#east").tap();
  assert.match(await page.locator("#routeStatus").innerText(),/Continue/);
  assert.equal(await page.locator("body").evaluate(e=>getComputedStyle(e).backgroundColor==="rgba(0, 0, 0, 0)"),false,"external stylesheet should be applied in WebKit");
  // Playwright may inject inline screenshot styles, which strict CSP correctly blocks.
  // Check application errors before the screenshot, not screenshot-tool internals.
  assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(SHOTS,"webkit-mobile.png"),fullPage:true});
 }finally{await browser.close();}
});


test("portable offline HTML: scripts and interactive map work without a web server",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const file=path.resolve(process.cwd(),".review-city-quest-f01/CITY_QUEST_F01_OFFLINE_PREVIEW.html");
  assert.ok(fs.existsSync(file),"CI should build the portable HTML before browser tests");
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=errorsFrom(page),requests=[];
  page.on("request",req=>{if(!req.url().startsWith("file:"))requests.push(req.url());});
  const response=await page.goto("file://"+file,{waitUntil:"load"});
  await page.locator("#cityMap [data-node]").first().waitFor();
  assert.equal(await page.locator("#cityMap [data-node]").count(),24);
  await page.locator("#east").click();
  assert.match(await page.locator("#routeStatus").innerText(),/Continue/);
  assert.deepEqual(requests,[],"offline preview must not request external resources");
  assert.deepEqual(errors,[],"strict CSP should allow only hashed local inline assets");
  await page.screenshot({path:path.join(SHOTS,"portable-offline-desktop.png"),fullPage:true});
 }finally{await browser.close();}
});
