"use strict";
/* Claude F5 findings 014/015/016: no wrong-engine movement, true station
 * labels and localized guidance. This does not certify physical screen readers.
 */
const {test}=require("node:test"),assert=require("node:assert/strict");
const {chromium}=require("playwright");
const LC=require("../authoring/city-quest-f2-1d/metro-language.js");
const URL="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html";
test("F5C Metro08 walk HUD uses learner language, never English fallback",async()=>{
 const b=await chromium.launch({headless:true});
 try{
  const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await p.goto(URL);
  const expected={
   en:"Walk to Market Square",es:"Ve a la entrada",de:"Gehe zum U-Bahn-Eingang",fr:"Allez à l'entrée"
  };
  for(const [lang,sentence] of Object.entries(expected)){
   await p.locator("#f2Language").selectOption(lang);
   await p.locator("#f2Level").selectOption("B1");
   await p.locator("#metroPilotToggle").click();
   await p.locator("#f1Stations button").nth(7).click();
   const hud=await p.locator("#f2Quick .f2-hud-instruction").innerText();
   assert.ok(hud.includes(sentence),lang+": wrong HUD locale: "+hud);
   if(lang!=="en")assert.ok(!hud.includes("Walk"),lang+": English HUD leaked");
   await p.locator("#metroPilotToggle").click();
  }
 }finally{await b.close();}
});
test("F5C Metro08 map clicks and keyboard cannot mutate hidden city quest at checkpoint or enter",async()=>{
 const b=await chromium.launch({headless:true});
 try{
  const p=await b.newPage({viewport:{width:1366,height:900}});
  await p.goto(URL);
  await p.locator("#metroPilotToggle").click();
  await p.locator("#f1Stations button").nth(7).click();
  for(const d of ["east","east","north"])
   await p.locator("#f2Quick .f2-quick-"+d).click();
  for(const phase of ["checkpoint","enter"]){
   const current=await p.evaluate(()=>window.CityQuestF2MetroBridge.current().phase);
   assert.equal(current,phase);
   const before=await p.locator("#f1Panel").innerText();
   const statusBefore=await p.locator("#f3Status").innerText();
   await p.locator('[data-node="1-3"]').dispatchEvent("click");
   await p.locator("#mapViewport").focus();
   await p.keyboard.press("ArrowDown");
   assert.equal(await p.locator("#f1Panel").innerText(),before,
    phase+": surface map interaction changed a locked metro mission");
   assert.equal(await p.locator("#f3Status").innerText(),statusBefore,
    phase+": irrelevant movement generated spoken-status feedback");
   assert.equal(await p.evaluate(()=>window.CityQuestF2MetroBridge.current().phase),phase);
   if(phase==="checkpoint")await p.locator("#f1Panel .f2-actions button.primary").click();
  }
 }finally{await b.close();}
});
test("F5C localized metro NEXT_STOP feedback includes the actual title-cased station",()=>{
 const result={accepted:true,message:"Next stop: Old Town.",state:{phase:"ride",metroStation:"old_town"}};
 for(const lang of ["es","de","fr"]){
  const str=LC.feedback(lang,result,{type:"NEXT_STOP"},"Old Town");
  assert.match(str,/Old Town/,lang+" incorrect station label: "+str);
  assert.doesNotMatch(str,/old town|old_town/);
 }
});

test("F5C accessibility: map location and labels reflect actual F2 route in French and Spanish",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await page.goto(URL);
  await page.locator("#f2Language").selectOption("fr");
  await page.locator("#f1Stations button").nth(1).click(); // City route mission 02
  let current=page.locator('[data-node][aria-current="location"]');
  assert.equal(await current.count(),1);
  const before=await current.getAttribute("data-node");
  assert.match(await current.getAttribute("aria-label"),/Carrefour.*Position actuelle/);
  assert.doesNotMatch(await current.getAttribute("aria-label"),/Crossroads/);
  await page.locator("#f2Quick .f2-quick-east").click();
  current=page.locator('[data-node][aria-current="location"]');
  assert.equal(await current.count(),1);
  assert.notEqual(await current.getAttribute("data-node"),before);
  const label=await current.getAttribute("aria-label");
  assert.match(label,/Position actuelle/);
  assert.match(await page.locator('[data-node="'+before+'"]').getAttribute("aria-pressed"),/true/);
  // Changing the language resets the mission and recalculates ARIA in that locale.
  await page.locator("#f2Language").selectOption("es");
  await page.locator("#f1Stations button").nth(1).click();
  assert.equal(await page.locator('[data-node][aria-current="location"]').count(),1);
  assert.match(await page.locator('[data-node][aria-current="location"]').getAttribute("aria-label"),/Cruce.*Posición actual/);
  // Selecting a mission without walking must not leave a false current location.
  await page.locator("#f1Stations button").first().click();
  assert.equal(await page.locator('[data-node][aria-current="location"]').count(),0);
 }finally{await browser.close();}
});
