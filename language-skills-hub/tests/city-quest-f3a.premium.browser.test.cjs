"use strict";
/* F3A: premium presentation must not change engine/geography or offline policy. */
const {test}=require("node:test"),assert=require("node:assert/strict");
const path=require("node:path"),fs=require("node:fs"),{chromium,webkit}=require("playwright");
const URL="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html";
const ART=path.join(process.cwd(),"city-quest-f3a-artifacts");fs.mkdirSync(ART,{recursive:true});
const errorsOf=page=>{const e=[];page.on("pageerror",x=>e.push(x.stack||String(x)));return e;};
async function experience(page){
 await page.locator("#f3ExperienceSummary").click();
 assert.equal(await page.locator("#f3Experience").getAttribute("open"),"");
}
async function setPilot(page){
 await page.locator("#metroPilotToggle").click();
 await page.locator("#f1Stations .f1-station").nth(4).click();
}
test("F3A initial experience: silent, no presentation, motion respects browser, no game-state change",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=errorsOf(page);
  await page.goto(URL,{waitUntil:"load"});
  assert.equal(await page.locator("#f3ExperienceSummary").count(),1);
  assert.equal(await page.locator("#f3Skip").getAttribute("href"),"#f1Stations");
  assert.equal(await page.locator("#f3Skip").evaluate(el=>getComputedStyle(el).opacity),"0");
  await page.keyboard.press("Tab");
  assert.equal(await page.locator("#f3Skip").evaluate(el=>document.activeElement===el),true,
    "Skip-to-missions must be the first keyboard focus target");
  assert.equal(await page.locator("#f3Skip").evaluate(el=>getComputedStyle(el).opacity),"1");
  await page.keyboard.press("Tab");
  assert.equal(await page.locator("#f3Skip").evaluate(el=>getComputedStyle(el).opacity),"0");
  assert.equal(await page.locator("#f3PresentationExit").isVisible(),false);
  assert.equal(await page.locator("body").getAttribute("data-presentation"),"off");
  await experience(page);
  for(const id of ["f3PresentationButton","f3SoundButton","f3MotionButton","f3ContrastButton"]){
   assert.equal(await page.locator("#"+id).isVisible(),true);
   assert.equal(await page.locator("#"+id).getAttribute("type"),"button");
  }
  assert.equal(await page.locator("#f3SoundButton").getAttribute("aria-pressed"),"false");
  assert.equal(await page.locator("#f3MotionButton").getAttribute("aria-pressed"),"true");
  assert.equal(await page.locator("#f3ContrastButton").getAttribute("aria-pressed"),"false");
  assert.equal(await page.locator("#f1ProgressTrack").getAttribute("aria-valuenow"),"0");
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F3A presentation: reversibly maximizes city and metro, Escape exits and progress stays unchanged",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=errorsOf(page);
  await page.goto(URL,{waitUntil:"load"});await experience(page);
  await page.locator("#f3PresentationButton").click();
  assert.equal(await page.locator("body").getAttribute("data-presentation"),"on");
  assert.equal(await page.locator(".hero").isVisible(),false);
  assert.equal(await page.locator(".guide-card").isVisible(),false);
  assert.equal(await page.locator("#f3PresentationExit").isVisible(),true);
  assert.equal(await page.locator("#f3Experience").getAttribute("open"),null);
  await page.locator("#f1Stations .f1-station").nth(1).click();
  assert.equal(await page.locator(".map-card").isVisible(),true);
  await setPilot(page);
  assert.equal(await page.locator("#metroLab").isVisible(),true);
  assert.equal(await page.locator("#f1Panel").count(),1);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("body").getAttribute("data-presentation"),"off");
  assert.equal(await page.locator(".hero").isVisible(),true);
  assert.equal(await page.locator("#f3PresentationExit").isVisible(),false);
  assert.equal(await page.locator("#metroLab").isVisible(),true);
  assert.equal(await page.locator("#f1ProgressTrack").getAttribute("aria-valuenow"),"0");
  await experience(page);
  await page.locator("#f3PresentationButton").click();
  await page.locator("#f3PresentationExit").click();
  assert.equal(await page.locator("body").getAttribute("data-presentation"),"off");
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F3A language change translates controls without affecting four-language CEFR metro gating",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1250,height:800}}),errors=errorsOf(page);
  await page.goto(URL,{waitUntil:"load"});
  const texts={en:"Experience",es:"Experiencia",de:"Darstellung",fr:"Affichage"};
  for(const [lang,label] of Object.entries(texts)){
   await page.locator("#f2Language").selectOption(lang);
   assert.ok((await page.locator("#f3ExperienceSummary").innerText()).includes(label));
   await experience(page);
   assert.ok((await page.locator("#f3ExperienceNote").innerText()).length>20);
   await page.keyboard.press("Escape");
   for(const level of ["A1","B1","C2"]){
    await page.locator("#f2Level").selectOption(level);
    assert.equal(await page.locator("#metroPilotToggle").isVisible(),level!=="A1");
   }
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F3A high contrast and reduced motion: accessibility override suppresses decorative transitions",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=errorsOf(page);
  await page.goto(URL);await experience(page);
  await page.locator("#f3ContrastButton").click();
  assert.equal(await page.locator("html").getAttribute("data-contrast"),"high");
  assert.equal(await page.locator("#f3ContrastButton").getAttribute("aria-pressed"),"true");
  await page.locator("#f3MotionButton").click();
  assert.equal(await page.locator("html").getAttribute("data-motion"),"off");
  assert.equal(await page.locator("#f3MotionButton").getAttribute("aria-pressed"),"false");
  await page.locator("#f1Stations .f1-station").nth(2).click();
  assert.equal(await page.locator("#f1Panel").evaluate(el=>getComputedStyle(el).animationName),"none");
  // The Experience popover closes on outside clicks; reopen it before toggling contrast.
  await experience(page);
  await page.locator("#f3ContrastButton").click();
  assert.equal(await page.locator("html").getAttribute("data-contrast"),"normal");
  await page.emulateMedia({reducedMotion:"reduce"});
  // matchMedia('change') is asynchronous: wait for the actual browser event
  // before asserting the control state. CSS already enforces reduced motion.
  await page.waitForFunction(()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches&&
   document.getElementById("f3MotionButton")?.disabled===true,null,{timeout:5000});
  assert.equal(await page.locator("html").getAttribute("data-motion"),"off");
  assert.equal(await page.locator("#f3MotionButton").isDisabled(),true);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F3A sound cues: strictly opt-in, synthesised on device, no requests or microphone",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=errorsOf(page),requests=[];
  page.on("request",req=>{if(!req.url().startsWith("http://127.0.0.1:8765/"))requests.push(req.url());});
  await page.goto(URL,{waitUntil:"load"});await experience(page);
  assert.equal(await page.locator("#f3SoundButton").getAttribute("aria-pressed"),"false");
  await page.locator("#f3SoundButton").click();
  assert.equal(await page.locator("#f3SoundButton").getAttribute("aria-pressed"),"true");
  await page.locator("#f3ExperienceSummary").click();
  await setPilot(page);
  const buttons=page.locator("#f1Panel .f2-choice-list button");
  assert.ok(await buttons.count()>1);
  await page.locator("#f1Panel .f2-choice-list button").filter({hasText:"M2"}).first().click();
  assert.match(await page.locator("#f1Panel .f2-status").innerText(),/does not take you/i);
  await experience(page);await page.locator("#f3SoundButton").click();
  assert.equal(await page.locator("#f3SoundButton").getAttribute("aria-pressed"),"false");
  assert.deepEqual(requests,[]);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F3A layout: phone 320/390 and desktop 1366 presentation, no horizontal overflow",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1366,900]]){
   const page=await browser.newPage({viewport:{width,height}}),errors=errorsOf(page);
   await page.goto(URL,{waitUntil:"load"});
   await experience(page);
   await page.locator("#f3PresentationButton").click();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert.ok(overflow<=1,"Horizontal overflow in presentation at "+width+": "+overflow);
   assert.equal(await page.locator("#f3PresentationExit").isVisible(),true);
   const rect=await page.locator("#f3PresentationExit").boundingBox();
   assert.ok(rect&&rect.x>=0&&rect.x+rect.width<=width+2,"Visible exit button at "+width);
   await setPilot(page);
   assert.equal(await page.locator("#f1Panel").isVisible(),true);
   const gameOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert.ok(gameOverflow<=1,"Metro game overflow at "+width+": "+gameOverflow);
   await page.screenshot({path:path.join(ART,"f3a-present-"+width+".png"),fullPage:true});
   assert.deepEqual(errors,[]);
   await page.close();
  }
 }finally{await browser.close();}
});
test("F3A OS reduced motion is respected by default in offline WebKit",async()=>{
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:375,height:812},reducedMotion:"reduce"}),errors=errorsOf(page);
  await page.goto(URL,{waitUntil:"load"});
  assert.equal(await page.locator("html").getAttribute("data-motion"),"off");
  await experience(page);
  assert.equal(await page.locator("#f3MotionButton").isDisabled(),true);
  await page.locator("#f3PresentationButton").click();
  assert.equal(await page.locator("body").getAttribute("data-presentation"),"on");
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("F3A SHA256-CSP portable file: premium presentation works offline with zero external requests",async()=>{
 const preview=path.resolve(process.cwd(),".review-city-quest-f2/CITY_QUEST_F2_OFFLINE_PREVIEW.html");
 assert.ok(fs.existsSync(preview));
 const html=fs.readFileSync(preview,"utf8");
 assert.match(html,/connect-src 'none'/);assert.match(html,/style-src 'sha256-/);assert.match(html,/script-src 'sha256-/);
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=errorsOf(page),external=[];
  page.on("request",r=>{if(!r.url().startsWith("file:"))external.push(r.url());});
  await page.goto("file://"+preview,{waitUntil:"load"});
  await experience(page);await page.locator("#f3PresentationButton").click();
  assert.equal(await page.locator("body").getAttribute("data-presentation"),"on");
  await page.locator("#f3PresentationExit").click();
  await setPilot(page);
  assert.equal(await page.locator("#f1Panel").isVisible(),true);
  assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
