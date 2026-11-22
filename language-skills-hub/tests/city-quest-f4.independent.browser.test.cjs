"use strict";
/* F4 independent preproduction smoke matrix.
 * Deliberately uses the DOM contract, not pre-existing test helpers or app
 * route selection algorithms. Human language/device reviews are NOT simulated.
 */
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),{chromium,webkit}=require("playwright");
const URL="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html";
const OUT=path.resolve("city-quest-f4-artifacts");fs.mkdirSync(OUT,{recursive:true});
const html=path.resolve(".review-city-quest-f2/CITY_QUEST_F2_OFFLINE_PREVIEW.html");
const langs=["en","es","de","fr"],levels=["A1","A2","B1","B2","C1","C2"];
function monitor(page){
 const errors=[],remote=[],security=[];
 page.on("pageerror",e=>errors.push(String(e)));
 page.on("request",r=>{
  const url=r.url();
  if(!url.startsWith("file:")&&!url.startsWith("http://127.0.0.1:8765/"))remote.push(url);
 });
 page.on("console",m=>{if(m.type()==="error"&&!m.text().includes("favicon"))security.push(m.text());});
 return {errors,remote,security};
}
async function start(page,url=URL){
 await page.goto(url,{waitUntil:"load"});
 assert.equal(await page.locator("#f1Stations button").count(),8);
}
async function configure(page,lang,level){
 // Use the controls and their real events; do not call the game's pure engine.
 await page.locator("#f2Language").selectOption(lang);
 await page.locator("#f2Level").selectOption(level);
}
async function inspect(page,mission,mode,lang,level){
 const snapshot=await page.evaluate(({mission,mode})=>{
  const nav=document.getElementById("f1Stations"),toggle=document.getElementById("metroPilotToggle");
  const wantMetro=mode==="METRO";
  if(wantMetro!== (toggle.getAttribute("aria-pressed")==="true"))toggle.click();
  nav.querySelectorAll("button")[mission-1].click();
  return{
   world:document.getElementById("f3dWorld").textContent,
   tasks:document.querySelectorAll("#f1Panel").length,
   active:document.querySelectorAll("#f3dLearningSteps li[aria-current=step]").length,
   title:document.getElementById("f3dRailTitle").textContent,
   mode:document.getElementById("f3dRailMode").textContent,
   metroVisible:!document.getElementById("metroLab").hidden,
   metroEnabled:toggle.getAttribute("aria-pressed")==="true"
  };
 },{mission,mode});
 assert.equal(snapshot.tasks,1);
 assert.equal(snapshot.active,1);
 assert.ok(snapshot.title.includes(String(mission).padStart(2,"0")));
 assert.ok(snapshot.mode.includes(level));
 const cityNames=["CITY","CIUDAD","STADT","VILLE"];
 if(mode==="CITY")assert.ok(cityNames.some(s=>snapshot.world.includes(s)),
  "City world mismatch "+lang+level+mission+snapshot.world);
 else assert.match(snapshot.world,/METRO|MÉTRO|U-BAHN/);
 if(mode==="METRO")assert.equal(snapshot.metroEnabled,true);
 return snapshot;
}
test("F4 independent, 256 full DOM combinations: 192 classic plus 64 B1-C2 metro",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),rec=monitor(page);
  await start(page);
  let city=0,metro=0;
  const startAt=Date.now();
  for(const lang of langs)for(const level of levels){
   await configure(page,lang,level);
   const isMetro=!["A1","A2"].includes(level);
   assert.equal(await page.locator("#metroPilotToggle").isVisible(),isMetro);
   for(let n=1;n<=8;n++){await inspect(page,n,"CITY",lang,level);city++;}
   if(isMetro)for(let n=5;n<=8;n++){
    await inspect(page,n,"METRO",lang,level);
    assert.equal(await page.locator("#f3cMetroPicker option").count(),14);
    metro++;
   }
  }
  assert.deepEqual({city,metro,total:city+metro},{city:192,metro:64,total:256});
  assert.deepEqual(rec.errors,[]);assert.deepEqual(rec.remote,[]);
  console.log("F4 256 DOM matrix duration (ms)",Date.now()-startAt);
  console.log("F4 browser console errors",rec.security.length);
 }finally{await browser.close();}
});
test("F4 independent responsive: 7 viewport sizes x City/Metro, 44px touch targets, zero horizontal document overflow",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true}),rec=monitor(page);
  await start(page);await configure(page,"en","B1");
  for(const [w,h]of [[320,568],[375,812],[390,844],[568,320],[768,1024],[1024,768],[1366,900]])
   for(const mode of ["CITY","METRO"]){
    await page.setViewportSize({width:w,height:h});
    await inspect(page,mode==="METRO"?5:2,mode,"en","B1");
    const state=await page.evaluate(()=>({
     over:document.documentElement.scrollWidth-document.documentElement.clientWidth,
     targets:[...document.querySelectorAll("#f1Panel button, #f3cMetroTools button")].map(el=>{
      const r=el.getBoundingClientRect();return{w:r.width,h:r.height,name:el.textContent.trim().slice(0,20)};
     }).filter(r=>r.w>0&&r.h>0)
    }));
    assert.ok(state.over<=2,"Global overflow at "+w+"x"+h+" "+mode+": "+state.over);
    const small=state.targets.filter(t=>t.w<44||t.h<44);
    assert.deepEqual(small,[],"Undersized visible touch targets at "+w+" "+mode);
   }
  assert.deepEqual(rec.errors,[]);assert.deepEqual(rec.remote,[]);
 }finally{await browser.close();}
});
test("F4 independent keyboard and non-cheating station finder: map inspection never advances journey",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),rec=monitor(page);
  await start(page);
  const item=page.locator("#f1Stations button").nth(2);
  await item.focus();await page.keyboard.press("Enter");
  assert.equal(await page.locator("#f1Stations button").nth(2).evaluate(el=>el===document.activeElement),true);
  await page.locator("#metroPilotToggle").click();
  await page.locator("#f1Stations button").nth(4).click();
  const before=await page.locator("#metroSceneStation").innerText();
  const progress=await page.locator("#metroJourneyProgress").getAttribute("aria-valuenow");
  for(const stop of ["university","harbour","east_gardens","museum_quarter"]){
   await page.locator("#f3cMetroPicker").selectOption(stop);
   assert.equal(await page.locator("#metroSceneStation").innerText(),before);
   assert.equal(await page.locator("#metroJourneyProgress").getAttribute("aria-valuenow"),progress);
  }
  const incorrect=page.locator("#f1Panel .f2-choice-list button").filter({hasText:"M2"}).first();
  await incorrect.click();
  assert.equal(await page.locator("#metroJourneyProgress").getAttribute("aria-valuenow"),progress);
  await page.locator("#f1Panel .f2-choice-list button").filter({hasText:"M1"}).first().focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(()=>document.activeElement?.closest("#f1Panel")!=null);
  assert.ok((await page.locator("#f3Status").innerText()).length>8);
  assert.deepEqual(rec.errors,[]);assert.deepEqual(rec.remote,[]);
 }finally{await browser.close();}
});
test("F4 200% text zoom in four languages: no clipped document at 320px (content legibility is separate human gate)",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true}),rec=monitor(page);
  await start(page);
  for(const lang of langs)for(const level of ["A1","B1","C2"]){
   await configure(page,lang,level);
   for(const mode of ["CITY","METRO"]){
    if(mode==="METRO"&&level==="A1")continue;
    await inspect(page,mode==="CITY"?3:7,mode,lang,level);
    await page.evaluate('document.documentElement.style.fontSize="200%"');
    const state=await page.evaluate(()=>({
      over:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      rail:document.getElementById("f3dLearningRail").getBoundingClientRect().width
    }));
    assert.ok(state.over<=2,"Global horizontal overflow when text zoomed "+lang+level+mode);
    assert.ok(state.rail>200);
    await page.evaluate('document.documentElement.style.fontSize=""');
   }
  }
  assert.deepEqual(rec.errors,[]);assert.deepEqual(rec.remote,[]);
  // Known visual issue F4-UX-01: stage-label word wrapping at 200% on 320px.
  // Requires manual visual acceptance despite no document overflow.
 }finally{await browser.close();}
});
test("F4 exact offline file:// CSP: no requests on mission navigation and metro transition",async()=>{
 assert.ok(fs.existsSync(html));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),
    rec=monitor(page);
  await start(page,"file://"+html);
  await configure(page,"fr","C2");
  await inspect(page,3,"CITY","fr","C2");
  await inspect(page,6,"METRO","fr","C2");
  assert.equal(await page.locator("#f3dLearningSteps li").count(),3);
  assert.deepEqual(rec.errors,[]);assert.deepEqual(rec.remote,[]);
 }finally{await browser.close();}
});
test("F4 WebKit smoke: 320px and 525px iPad split width preserve independent map/game controls",async()=>{
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:525,height:768},isMobile:true,hasTouch:true}),rec=monitor(page);
  await start(page);await configure(page,"es","C2");await inspect(page,6,"METRO","es","C2");
  assert.equal(await page.locator("#f3cMetroPicker option").count(),14);
  await page.locator("#f3cMetroPicker").selectOption("hilltop");
  assert.equal(await page.locator("#metroInspectorName").innerText(),"Hilltop");
  await page.setViewportSize({width:320,height:568});
  assert.ok((await page.locator("#f3dLearningRail").boundingBox()).width>=285);
  assert.deepEqual(rec.errors,[]);assert.deepEqual(rec.remote,[]);
 }finally{await browser.close();}
});
