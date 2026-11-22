"use strict";
/* F4R remediation proof for F4-P1-01 and F4-P2-02.
 * The 200%-size accessibility issue is NOT a document overflow problem:
 * inspect actual layout, readable row count, scroll geometry, and labels.
 */
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),{chromium,webkit}=require("playwright");
const URL="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html";
const OUT=path.resolve("city-quest-f4r-artifacts");fs.mkdirSync(OUT,{recursive:true});
async function germanMetro07(page){
 await page.goto(URL,{waitUntil:"load"});
 await page.locator("#f2Language").selectOption("de");
 await page.locator("#f2Level").selectOption("C2");
 await page.locator("#metroPilotToggle").click();
 await page.locator("#f1Stations button").nth(6).click();
}
test("F4R text at 100% stays 2 columns, at 200% becomes accessible single column with intact DE/C2 titles",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,390]){
   const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
   await germanMetro07(page);
   const probe=()=>page.evaluate(()=>{
    const nav=document.getElementById("f1Stations"),
      phases=document.getElementById("f3dLearningSteps"),
      title=document.getElementById("f3dRailTitle"),
      target=nav.querySelectorAll("button")[6],
      stageNames=[...phases.querySelectorAll("li strong")];
    const tracks=el=>getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length;
    return{
      tracks:tracks(nav),stages:tracks(phases),
      globalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      stationOverflow:target.scrollWidth-target.clientWidth,
      titleOverflow:title.scrollWidth-title.clientWidth,
      phaseLines:stageNames.map(el=>{
       const h=el.getBoundingClientRect().height,lh=parseFloat(getComputedStyle(el).lineHeight);
       return h/lh;
      }),
      fullLabel:target.textContent.trim()
    };
   });
   let state=await probe();
   assert.equal(state.tracks,2,"100% text should preserve premium 2-column phone nav at "+width);
   assert.equal(state.stages,3,"100% text should preserve 3 adjacent learning stages");
   await page.evaluate('document.documentElement.style.fontSize="200%"');
   state=await probe();
   assert.equal(state.tracks,1,"200% text should use single-column mission navigation");
   assert.equal(state.stages,1,"200% text should use full-width learning-stage rows");
   assert.ok(state.globalOverflow<=2&&state.stationOverflow<=2&&state.titleOverflow<=2,
    "No content loss at "+width+": "+JSON.stringify(state));
   assert.ok(state.phaseLines.every(x=>x<=2),"Learning stages must remain legible");
   assert.match(state.fullLabel,/Störung im Metroverkehr/);
   await page.locator("#f3dLearningRail").scrollIntoViewIfNeeded();
   await page.screenshot({path:path.join(OUT,"de-c2-200pct-"+width+".png"),fullPage:false});
   await page.close();
  }
 }finally{await browser.close();}
});
test("F4R localized reference gallery and tooltips explicitly identify English-only preview across all 4 languages",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(URL);
  const expected={
   en:{jump:/EN visual preview/,tooltip:/Switching City\/Metro/},
   es:{jump:/visual en inglés/,tooltip:/Cambiar entre ciudad y metro/},
   de:{jump:/englisches Anschauungsbeispiel/,tooltip:/Beim Wechsel zwischen Stadt und U-Bahn/},
   fr:{jump:/visuel en anglais/,tooltip:/Passer de la ville au métro/}
  };
  for(const [lang,x] of Object.entries(expected)){
   await page.locator("#f2Language").selectOption(lang);
   assert.match(await page.locator("#metroJump").innerText(),x.jump);
   assert.match(await page.locator("#metroPilotToggle").getAttribute("title"),x.tooltip);
   assert.equal(await page.locator("#metroPilotToggle").getAttribute("aria-describedby"),"f3dSessionAdvice");
  }
 }finally{await browser.close();}
});
test("F4R standalone strict SHA-CSP offline has responsive zoom fix and localized preview labels",async()=>{
 const source=path.resolve(".review-city-quest-f2/CITY_QUEST_F2_OFFLINE_PREVIEW.html");
 assert.ok(fs.existsSync(source));const h=fs.readFileSync(source,"utf8");
 assert.match(h,/connect-src 'none'/);
 assert.match(h,/f3dLearningRail/);
 assert.match(h,/englisches Anschauungsbeispiel/);
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true});
  const errors=[],remote=[];page.on("pageerror",e=>errors.push(String(e)));
  page.on("request",r=>{if(!r.url().startsWith("file:"))remote.push(r.url());});
  await page.goto("file://"+source,{waitUntil:"load"});
  await page.locator("#f2Language").selectOption("de");
  await page.locator("#f2Level").selectOption("C2");
  await page.locator("#metroPilotToggle").click();
  await page.locator("#f1Stations button").nth(6).click();
  await page.evaluate('document.documentElement.style.fontSize="200%"');
  const nav=await page.locator("#f1Stations").evaluate(el=>getComputedStyle(el).gridTemplateColumns);
  assert.equal(nav.split(/\s+/).length,1);
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 }finally{await browser.close();}
});
