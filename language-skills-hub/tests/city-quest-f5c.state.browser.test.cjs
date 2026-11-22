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
