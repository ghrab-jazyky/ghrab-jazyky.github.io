"use strict";
/* CITY QUEST F3D — design and teaching acceptance across both worlds.
 * Automated checks do NOT signify human editorial or owner approval.
 */
const {test}=require("node:test"),assert=require("node:assert/strict");
const {chromium,webkit}=require("playwright");
const fs=require("node:fs"),path=require("node:path");
// This is an AUTHORING/QA visual-preview suite. Normal student URLs do
// not expose guided reference routes (CQ-F5-006).
const URL="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html?cq-review=1";
const OUT=path.join(process.cwd(),"city-quest-f3d-artifacts");fs.mkdirSync(OUT,{recursive:true});
const LANGS=["en","es","de","fr"],LEVELS=["A1","A2","B1","B2","C1","C2"];
function monitor(page){
 const errors=[],remote=[];
 page.on("pageerror",e=>errors.push(e.stack||String(e)));
 page.on("request",r=>{if(!r.url().startsWith("file:")&&!r.url().startsWith("http://127.0.0.1:8765/"))remote.push(r.url());});
 return {errors,remote};
}
async function station(page,n){await page.locator("#f1Stations button").nth(n-1).click();}
async function locale(page,lang,level){
 await page.locator("#f2Language").selectOption(lang);
 await page.locator("#f2Level").selectOption(level);
}
function phase(page){return page.locator("#f3dLearningSteps li[aria-current='step']");}
async function validRail(page){
 assert.equal(await page.locator("#f3dLearningRail").isVisible(),true);
 assert.equal(await page.locator("#f3dLearningSteps li").count(),3);
 assert.equal(await phase(page).count(),1);
 assert.equal(await page.locator("#f3dWorld").isVisible(),true);
 assert.ok((await page.locator("#f3dRailTitle").innerText()).length>9);
 assert.ok((await page.locator("#f3dRailNote").innerText()).length>20);
}
test("F3D 192 scene-language-level combinations: correct 3-phase rail, type, focus, no unintended metro at A1/A2",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:850}}),events=monitor(page);
  await page.goto(URL);
  let inspected=0,metroCount=0,cityCount=0;
  for(const language of LANGS)for(const level of LEVELS){
   await locale(page,language,level);
   const metro=["B1","B2","C1","C2"].includes(level);
   if(metro)await page.locator("#metroPilotToggle").click();
   for(let n=1;n<=8;n++){
    await station(page,n);
    await validRail(page);
    const expectMetro=metro&&n>=5;
    const world=await page.locator("#f3dWorld").innerText();
    assert.ok(world.includes("RIVERTON"));
    assert.ok(expectMetro?/METRO|MÉTRO|U-BAHN/.test(world):/CITY|CIUDAD|STADT|VILLE/.test(world),
     "Wrong world for "+language+"/"+level+"/"+n+": "+world);
    assert.equal(await phase(page).locator("strong").innerText(),
     {en:"Read",es:"Lee",de:"Lesen",fr:"Lire"}[language],
     "Every fresh mission starts at the authored reading phase");
    assert.ok((await page.locator("#f3dRailMode").innerText()).includes(level));
    assert.ok((await page.locator("#f3dSessionAdvice").innerText()).length>35);
    assert.equal(await page.locator("#f1Panel").count(),1,"Never create a second task owner");
    if(expectMetro){metroCount++;assert.equal(await page.locator("#metroLab").isVisible(),n!==8);}
    else cityCount++;
    inspected++;
   }
  }
  assert.equal(inspected,192);
  assert.equal(metroCount,64);
  assert.equal(cityCount,128);
  assert.deepEqual(events.remote,[]);assert.deepEqual(events.errors,[]);
 }finally{await browser.close();}
});
test("F3D mission nav preserves exact keyboard focus after selecting another station",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),events=monitor(page);
  await page.goto(URL);
  for(const n of [3,1,6,8,2]){
   const target=page.locator("#f1Stations button").nth(n-1);
   await target.focus();await page.keyboard.press("Enter");
   assert.equal(await page.locator("#f1Stations button").nth(n-1).getAttribute("aria-current"),"step");
   assert.equal(await page.locator("#f1Stations button").nth(n-1).evaluate(el=>el===document.activeElement),true,
    "Keyboard focus must stay on the same selected mission after nav DOM replacement");
  }
  assert.deepEqual(events.errors,[]);assert.deepEqual(events.remote,[]);
 }finally{await browser.close();}
});
test("F3D city feedback + action focus persist after re-render, all without changing answer keys",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),events=monitor(page);
  await page.goto(URL);
  await station(page,1);
  const choice=page.locator("#f1Panel .f2-choice-list button").first();
  await choice.focus();await page.keyboard.press("Enter");
  await page.waitForFunction(()=>document.activeElement?.closest("#f1Panel")!=null);
  assert.ok((await page.locator("#f3Status").innerText()).length>4,
   "A permanent screen-reader message must announce city feedback");
  assert.equal(await page.locator("#f3dLearningSteps li[aria-current='step']").getAttribute("id"),"f3dPractise");
  await station(page,3);
  await page.locator("#f1Panel .f2-choice-list button").first().focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(()=>document.activeElement?.closest("#f1Panel")!=null);
  assert.ok((await page.locator("#f3Status").innerText()).length>4);
  assert.equal(await page.locator("#f1Panel").count(),1);
  assert.deepEqual(events.errors,[]);assert.deepEqual(events.remote,[]);
 }finally{await browser.close();}
});
test("F3D metro 05: phases Read → Practise → Reflect, no self-check score or microphone",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:850}}),events=monitor(page);
  await page.goto(URL);await page.locator("#metroPilotToggle").click();await station(page,5);
  const c=page.locator("#f1Panel");
  const click=async label=>c.getByRole("button",{name:label,exact:false}).first().click();
  assert.equal(await phase(page).getAttribute("id"),"f3dRead");
  await click("M1 ·");
  assert.equal(await phase(page).getAttribute("id"),"f3dPractise");
  await click("East Gardens");await click("Platform 2");await click("Board the train");
  await click("Travel to next stop");await click("Travel to next stop");
  await click("Get off here");await click("Exit at destination");
  assert.equal(await phase(page).getAttribute("id"),"f3dReflect");
  await click("I have practised aloud");
  assert.equal(await phase(page).getAttribute("id"),"f3dReflect");
  assert.equal(await page.locator("#f1Stations .f1-station").nth(4).locator(".f1-station-complete").count(),1);
  assert.ok((await page.locator("#f3dRailNote").innerText()).includes("never automatically graded"));
  assert.deepEqual(events.remote,[]);assert.deepEqual(events.errors,[]);
 }finally{await browser.close();}
});
test("F3D mode and reset-scope advisory: A1/A2 city only; B1+ toggling resets 05–08, not 01–04",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),events=monitor(page);
  await page.goto(URL);
  for(const level of ["A1","A2"]){
   await page.locator("#f2Level").selectOption(level);
   assert.equal(await page.locator("#metroPilotToggle").isVisible(),false);
   await station(page,8);
   assert.match(await page.locator("#f3dWorld").innerText(),/CITY/);
  }
  await page.locator("#f2Level").selectOption("B1");
  assert.equal(await page.locator("#metroPilotToggle").isVisible(),true);
  assert.match(await page.locator("#f3dSessionAdvice").innerText(),/05–08/);
  assert.equal(await page.locator("#f2Level").getAttribute("aria-describedby"),"f3dSessionAdvice");
  await page.locator("#f1Pair").click();
  assert.match(await page.locator("#f3dRailMode").innerText(),/Pair/);
  await page.locator("#metroPilotToggle").click();
  await station(page,5);
  assert.match(await page.locator("#f3dWorld").innerText(),/METRO/);
  assert.match(await page.locator("#f3dRailMode").innerText(),/Pair/);
  assert.equal(await page.locator("#f2Language").getAttribute("aria-describedby"),"f3dSessionAdvice");
  assert.deepEqual(events.remote,[]);assert.deepEqual(events.errors,[]);
 }finally{await browser.close();}
});
test("F3D design geometry: readable unified cards on 320/390/768/1366, in city, metro and high contrast",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [width,height]of [[320,568],[390,844],[768,1024],[1366,900]]){
   const page=await browser.newPage({viewport:{width,height}}),events=monitor(page);
   await page.goto(URL);await station(page,3);
   await validRail(page);
   let box=await page.locator("#f3dLearningRail").boundingBox();
   assert.ok(box&&box.width>=width*.85&&box.x>=0&&box.x+box.width<=width+2,
    "Learning rail must never overflow or disappear on city view");
   await page.locator("#f3ExperienceSummary").click();
   await page.locator("#f3ContrastButton").click();
   assert.equal(await page.locator("html").getAttribute("data-contrast"),"high");
   await page.locator("#metroPilotToggle").click();await station(page,7);
   await validRail(page);
   const geometry=await page.evaluate(()=>({
    width:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,
    card:getComputedStyle(document.querySelector("#f1Panel .f2-objective")).borderTopLeftRadius
   }));
   assert.ok(geometry.width<=geometry.viewport+2,
    "No horizontal overflow in high-contrast metro: "+JSON.stringify({width,...geometry}));
   assert.ok(parseFloat(geometry.card)>=10,"Shared card corners should be consistent");
   if(width===320||width===390||width===1366)
    await page.screenshot({path:path.join(OUT,"f3d-review-"+width+".png"),fullPage:false});
   assert.deepEqual(events.remote,[]);assert.deepEqual(events.errors,[]);
   await page.close();
  }
 }finally{await browser.close();}
});
test("F3D WebKit language switching and reduced motion preserve rail and task accessibility",async()=>{
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:375,height:812},reducedMotion:"reduce"}),events=monitor(page);
  await page.goto(URL);
  for(const lang of LANGS){
   await page.locator("#f2Language").selectOption(lang);
   await station(page,2);await validRail(page);
   assert.equal(await page.locator("#f3dWorld").getAttribute("id"),"f3dWorld");
   assert.equal(await phase(page).count(),1);
   assert.match(await page.locator("#f3dSessionAdvice").innerText(),/.{30}/);
  }
  assert.equal(await page.locator("html").getAttribute("lang"),"fr");
  assert.deepEqual(events.remote,[]);assert.deepEqual(events.errors,[]);
 }finally{await browser.close();}
});
test("F3D strict-CSP portable HTML has unified learning rail and keeps all learning actions offline",async()=>{
 const file=path.join(process.cwd(),".review-city-quest-f2/CITY_QUEST_F2_OFFLINE_PREVIEW.html");
 assert.ok(fs.existsSync(file));
 const html=fs.readFileSync(file,"utf8");
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/style-src 'sha256-/);
 assert.match(html,/script-src 'sha256-/);
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),events=monitor(page);
  await page.goto("file://"+file+"?cq-review=1",{waitUntil:"load"});
  await station(page,4);await validRail(page);
  await page.locator("#f2Language").selectOption("es");
  await page.locator("#f2Level").selectOption("C1");
  assert.equal(await page.locator("#f3dRead strong").innerText(),"Lee");
  await page.locator("#metroPilotToggle").tap();
  await station(page,5);
  assert.match(await page.locator("#f3dWorld").innerText(),/METRO/);
  assert.deepEqual(events.errors,[]);assert.deepEqual(events.remote,[]);
 }finally{await browser.close();}
});
