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


test("F5C CQ-F5-004: station signs are readable, not an answer key, in four languages",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(URL);
  for(const lang of ["en","es","de","fr"]){
   await page.locator("#f2Language").selectOption(lang);
   await page.locator("#f2Level").selectOption("B1");
   await page.locator("#metroPilotToggle").click();
   await page.locator("#f1Stations button").nth(4).click();
   await page.locator("#f1Panel .f2-choice-list button").filter({hasText:"M1 ·"}).click();
   await page.locator("#f1Panel .f2-choice-list button").filter({hasText:"East Gardens"}).click();
   const copy=LC.pack(lang,"B1",5);
   const board=page.locator("#f1Panel .metro-platform-board");
   assert.equal(await board.count(),1);
   assert.ok((await board.getAttribute("aria-label")).includes(copy.labels.platformBoard));
   assert.equal(await board.locator("li").count(),3);
   await page.evaluate('document.documentElement.style.fontSize="200%"');
   const docOverflow=await page.evaluate(()=>
    document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert.ok(docOverflow<=2,lang+": station board clips horizontally at 200% text: "+docOverflow);
   const signs=await board.locator("li").allInnerTexts();
   assert.ok(signs.some(s=>s.includes(copy.labels.platform+" 2")&&s.includes("M1")&&s.includes("East Gardens")),
    lang+": missing correct station signage "+JSON.stringify(signs));
   assert.ok(signs.some(s=>s.includes(copy.labels.platform+" 1")&&s.includes("West End")),
    lang+": missing plausible alternative direction");
   await page.locator("#f1Panel .f2-choice-list button").filter({hasText:copy.labels.platform+" 1"}).click();
   assert.equal(await board.count(),1,"Wrong platform must not advance");
   await page.locator("#f1Panel .f2-choice-list button").filter({hasText:copy.labels.platform+" 2"}).click();
   assert.equal(await board.count(),0,"Correct platform must allow boarding");
   assert.ok((await page.locator("#f1Panel").innerText()).includes(copy.actions.BOARD));
   await page.locator("#metroPilotToggle").click();
  }
 }finally{await browser.close();}
});
test("F5C CQ-F5-005: learner chooses transfer and exit; wrong choice never advances",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(URL);
  await page.locator("#f2Language").selectOption("es");
  await page.locator("#f2Level").selectOption("B1");
  await page.locator("#metroPilotToggle").click();
  await page.locator("#f1Stations button").nth(5).click();
  const c=LC.pack("es","B1",6),choose=async(label)=>{
   await page.locator("#f1Panel .f2-choice-list button").filter({hasText:label}).click();
  };
  await choose("M2 ·");
  await choose("North Park");
  await choose(c.labels.platform+" 1");
  await page.locator("#f1Panel .f2-actions button").filter({hasText:c.actions.BOARD}).click();
  for(let i=0;i<2;i++)await page.locator("#f1Panel .f2-actions button").filter({hasText:c.actions.NEXT_STOP}).click();
  assert.equal(await page.evaluate(()=>window.CityQuestF2MetroBridge.current().phase),"transfer");
  await choose(c.actions.STAY_ON_LINE+" · M2");
  assert.equal(await page.evaluate(()=>window.CityQuestF2MetroBridge.current().phase),"transfer");
  assert.ok((await page.locator("#f3Status").innerText()).includes(c.errors.stayOnLine));
  await choose(c.actions.CHANGE_LINE+" · M3");
  assert.equal(await page.evaluate(()=>window.CityQuestF2MetroBridge.current().phase),"select-line");
  await choose("M3 ·");
  await choose("Harbour");
  await choose(c.labels.platform+" 3");
  await page.locator("#f1Panel .f2-actions button").filter({hasText:c.actions.BOARD}).click();
  for(let i=0;i<3;i++)await page.locator("#f1Panel .f2-actions button").filter({hasText:c.actions.NEXT_STOP}).click();
  assert.equal(await page.evaluate(()=>window.CityQuestF2MetroBridge.current().phase),"exit");
  await choose(c.actions.CONTINUE_PAST_EXIT);
  assert.equal(await page.evaluate(()=>window.CityQuestF2MetroBridge.current().phase),"exit");
  assert.ok((await page.locator("#f3Status").innerText()).includes(c.errors.continuePastExit));
  await choose(c.actions.EXIT);
  assert.equal(await page.evaluate(()=>window.CityQuestF2MetroBridge.current().phase),"speech");
 }finally{await browser.close();}
});


test("F5C CQ-F5-006: normal learner cannot see guided answers before attempting metro; separate authoring route is explicit",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(URL);
  await page.locator("#f2Level").selectOption("B1");
  assert.equal(await page.locator("#metroLab").isVisible(),false,"Student must not see unguided solution gallery");
  assert.equal(await page.locator("#metroJump").isVisible(),false,"Gallery jump hidden for learners");
  assert.equal(await page.locator("#metroScenarios button:visible").count(),0);
  assert.equal(await page.locator("#metroAdvance:visible").count(),0);
  await page.locator("#metroPilotToggle").click();
  await page.locator("#f1Stations button").nth(4).click();
  assert.equal(await page.locator("#metroLab").getAttribute("data-mode"),"game");
  assert.equal(await page.locator("#metroLab").isVisible(),true);
  assert.equal(await page.locator("#metroScenarios button:visible").count(),0);
  assert.equal(await page.locator("#metroAdvance:visible").count(),0);
  assert.equal(await page.locator("#metroPreferredRoute polyline").count(),0,
   "Do not overlay future correct route before student moves");
  await page.goto(URL+"?cq-review=1");
  assert.equal(await page.locator("#metroLab").isVisible(),true,"Authoring review should retain visual regression reference");
  assert.equal(await page.locator("#metroScenarios button:visible").count(),4);
  assert.equal(await page.locator("#metroJump").isVisible(),true);
  assert.equal(await page.locator("#metroAdvance").isVisible(),true);
 }finally{await browser.close();}
});


test("F5C CQ-F5-008: all 72 B2-C2 landmark prompts are authored and playable in four languages",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await page.goto(URL);
  let count=0;
  for(const lang of ["en","es","de","fr"])for(const level of ["B2","C1","C2"]){
   await page.locator("#f2Language").selectOption(lang);
   await page.locator("#f2Level").selectOption(level);
   await page.locator("#f1Stations button").first().click();
   const content=windowContent(lang);
   for(const round of content.rounds){
    const prompt=(await page.locator("#f1Panel .f2-prompt").innerText()).trim();
    assert.ok(prompt.length>75,lang+"/"+level+"/"+round.index+" advanced clue too short");
    assert.notEqual(prompt,round.b1,lang+"/"+level+"/"+round.index+" must have new text");
    await page.locator("#f1Panel .f2-choice-list button")
      .filter({hasText:round.answer}).click();
    count++;
   }
   assert.match(await page.locator("#f1Panel").innerText(),/✓|Mission|misión|Mission|Aufgabe|Terminé/i);
  }
  assert.equal(count,72);
 }finally{await browser.close();}
 function windowContent(lang){
  // Read only authored question/answer data from the same checked-in source.
  const C=require("../authoring/city-quest-f2/content-a.js");
  require("../authoring/city-quest-f2/content-b.js");
  const F=require("../authoring/city-quest-f1/engine.js");
  const p=C.pack(lang);
  return {rounds:F.explore.map((r,index)=>({
   index,answer:p.places[r.correct],b1:p.clues[index]
  }))};
 }
});


test("F5C CQ-F5-008: advanced B2-C2 visitor dialogue requires real clarification in four languages",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(URL);
  const C=require("../authoring/city-quest-f2/content-a.js");
  require("../authoring/city-quest-f2/content-b.js");
  let checked=0;
  for(const lang of C.languages)for(const level of ["B2","C1","C2"]){
   await page.locator("#f2Language").selectOption(lang);
   await page.locator("#f2Level").selectOption(level);
   await page.locator("#f1Stations button").nth(2).click();
   const opening=await page.locator("#f1Panel .f2-dialogue-bubble").innerText();
   assert.ok(opening.length>120,lang+"/"+level+" opening is too elementary");
   assert.notEqual(opening,C.pack(lang).dialogue.opening);
   await page.locator("#f1Panel .f2-choice-list button")
    .filter({hasText:C.pack(lang).dialogue.vague}).click();
   const clarify=await page.locator("#f1Panel .f2-dialogue-bubble").innerText();
   assert.notEqual(clarify,C.pack(lang).dialogue.clarify);
   assert.notEqual(clarify,opening);
   assert.ok(clarify.length>105,lang+"/"+level+" lacks a meaningful request for precision");
   checked+=2;
  }
  assert.equal(checked,24);
 }finally{await browser.close();}
});


test("F5C CQ-F5-027: City01 final speaking model describes places, not a route, in all four languages",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(URL);
  const C=require("../authoring/city-quest-f2/content-a.js");
  require("../authoring/city-quest-f2/content-b.js");
  const F=require("../authoring/city-quest-f1/engine.js");
  for(const lang of C.languages){
   await page.locator("#f2Language").selectOption(lang);
   await page.locator("#f2Level").selectOption("C2");
   await page.locator("#f1Stations button").first().click();
   const p=C.pack(lang);
   for(const question of F.explore)
    await page.locator("#f1Panel .f2-choice-list button")
     .filter({hasText:p.places[question.correct]}).click();
   assert.equal(await page.locator("#f1Panel .f2-finish").count(),1);
   await page.locator("#f1Panel .f2-help button").click();
   const model=await page.locator("#f1Panel .f2-help p.f2-small").last().innerText();
   assert.ok(model.length>200,lang+": place-reflection is too short");
   assert.notEqual(model,C.profile(lang,"C2").model,"Must not recycle generic route model");
   assert.doesNotMatch(model,/Walk east along Station Road|tournez à gauche puis marchez|Gehe die Bahnhofstraße entlang/);
  }
 }finally{await browser.close();}
});


test("F5C CQ-F5-008: City04 B2-C2 route completion requires map reasoning in all four languages",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const G=require("../authoring/city-quest-f2/engine.js");
  const answerIds={B2:["right","left","straight"],C1:["south","library","straight"],C2:["ignore","shortcut","closure"]};
  const correctIds={B2:"left",C1:"library",C2:"closure"};
  await page.goto(URL);
  for(const lang of ["en","es","de","fr"])for(const level of ["B2","C1","C2"]){
   await page.locator("#f2Language").selectOption(lang);
   await page.locator("#f2Level").selectOption(level);
   await page.locator("#f1Stations button").nth(3).click();
   if(level==="C2")assert.equal(await page.locator("#f2ClosedRoad line").count(),1,
     "C2 guided route should display the roadworks it avoids");
   for(const dir of G.guidedPaths[level])
    await page.locator("#f2Quick .f2-quick-"+dir).click();
   assert.equal(await page.locator("#f1Panel .f2-finish").count(),0,
    lang+"/"+level+" route may not bypass its reasoning phase");
   const ids=G.orderChoices(answerIds[level],lang,level,4,"explain");
   const correct=ids.indexOf(correctIds[level]);
   assert.equal(await page.locator("#f1Panel .f2-choice-list button").count(),3);
   await page.locator("#f1Panel .f2-choice-list button").nth((correct+1)%3).click();
   assert.equal(await page.locator("#f1Panel .f2-finish").count(),0,
    "An incorrect explanation cannot complete this station");
   await page.locator("#f1Panel .f2-choice-list button").nth(correct).click();
   assert.equal(await page.locator("#f1Panel .f2-finish").count(),1,
    lang+"/"+level+" successful route and reasoning");
  }
 }finally{await browser.close();}
});
test("F5C CQ-F5-008: City06 correction grows from two to four meaningful decisions",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const G=require("../authoring/city-quest-f2/engine.js");
  const ids=[
    ["straight","turn","distance"],["left","keep-south","west"],
    ["distance","south","north"]];
  await page.goto(URL);
  for(const lang of ["en","es","de","fr"])for(const level of G.levels){
   await page.locator("#f2Language").selectOption(lang);
   await page.locator("#f2Level").selectOption(level);
   await page.locator("#f1Stations button").nth(5).click();
   const stages=G.repairStages(level);
   for(let phase=0;phase<stages;phase++){
    const selected=phase===3?
      level==="C2"?["dismiss","blame","apology"]:["blame","apology","dismiss"]:ids[phase];
    const right=["turn","left","south","apology"][phase];
    const order=G.orderChoices(selected,lang,level,6,phase);
    const correct=order.indexOf(right),choices=page.locator("#f1Panel .f2-choice-list button");
    assert.equal(await choices.count(),3,lang+"/"+level+"/stage "+phase);
    if(phase>=2){
     await choices.nth((correct+1)%3).click();
     assert.equal(await page.locator("#f1Panel .f2-finish").count(),0,
      lang+"/"+level+" wrong reasoning cannot give credit");
    }
    await choices.nth(correct).click();
   }
   assert.equal(await page.locator("#f1Panel .f2-finish").count(),1,
    lang+"/"+level+" must finish after "+stages+" decisions");
  }
 }finally{await browser.close();}
});
