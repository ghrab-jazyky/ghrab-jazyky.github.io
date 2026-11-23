"use strict";
/* F2.1D browser acceptance: EN/ES/DE/FR × B1–C2 and all four metro missions. */
const {test}=require("node:test"),assert=require("node:assert/strict");
const path=require("node:path"),fs=require("node:fs"),{chromium,webkit}=require("playwright");
const L=require("../authoring/city-quest-f2-1d/metro-language.js");
const CityContent=require("../authoring/city-quest-f2/content-a.js");
require("../authoring/city-quest-f2/content-b.js");
const URL="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html";
const SHOTS=path.join(process.cwd(),"city-quest-f2-1d-artifacts");
fs.mkdirSync(SHOTS,{recursive:true});
const panel=p=>p.locator("#f1Panel");
async function click(p,label){await panel(p).getByRole("button",{name:label,exact:false}).first().click();}
async function enable(p,lang,level){
 await p.locator("#f2Language").selectOption(lang);
 await p.locator("#f2Level").selectOption(level);
 const toggle=p.locator("#metroPilotToggle");
 assert.equal(await toggle.isVisible(),true,lang+"/"+level);
 assert.equal(await toggle.getAttribute("aria-pressed"),"false");
 await toggle.click();assert.equal(await toggle.getAttribute("aria-pressed"),"true");
}
async function mission(p,n){await p.locator("#f1Stations .f1-station").nth(n-1).click();}
async function leg(p,c,line,direction,platform,stops){
 if(await panel(p).getByRole("button",{name:line+" ·",exact:false}).count())await click(p,line+" ·");
 await click(p,direction);
 await click(p,c.labels.platform+" "+platform);await click(p,c.actions.BOARD);
 for(let i=0;i<stops;i++)await click(p,c.actions.NEXT_STOP);
}
async function pass(p,c,n){
 await click(p,c.actions.SELF_CHECK);
 assert.equal(await p.locator("#f1Stations .f1-station").nth(n-1).locator(".f1-station-complete").count(),1);
 assert.ok((await panel(p).innerText()).includes(c.labels.verified.slice(0,20)));
}
test("16 multilingual B1–C2 profiles display all four missions and localized wrong-line feedback",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1240,height:820}});
  const errors=[];page.on("pageerror",e=>errors.push(e.stack||String(e)));
  await page.goto(URL,{waitUntil:"load"});
  for(const lang of L.languages)for(const level of L.levels){
   await enable(page,lang,level);
   for(const n of L.missions){
    const c=L.pack(lang,level,n);await mission(page,n);
    const text=await panel(page).innerText();
    assert.ok(text.includes(c.titleMission),lang+"/"+level+" mission "+n+" title");
    assert.ok(text.includes(c.cefr.task),lang+"/"+level+" mission "+n+" task");
    if(n===5){
     assert.equal(await page.locator("#metroLab").getAttribute("data-mode"),"game");
     await click(page,"M2 ·");
     assert.ok((await panel(page).innerText()).includes(c.errors.wrongLine));
     await click(page,"M1 ·");await click(page,"East Gardens");
     assert.ok((await panel(page).innerText()).includes(c.labels.platform+" 2"));
     await panel(page).locator("details").last().locator("summary").click();
     assert.ok((await panel(page).innerText()).includes(c.glossary[0][0]));
    }
    if(n===7){
     // The authored service notice is CEFR-specific from B2 onwards. Assert
     // the actual localized notice for this exact language and level.
     const notice=L.stage(lang,level,7,"notice",{station:"Central Station"});
     assert.ok(text.includes(notice.slice(0,17)),lang+"/"+level+": wrong metro service notice");
    }
   }
   await page.locator("#metroPilotToggle").click();
   assert.equal(await page.locator("#metroPilotToggle").getAttribute("aria-pressed"),"false");
   await mission(page,5);
   assert.ok(!(await panel(page).innerText()).includes(L.pack(lang,level,5).titleMission));
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("ES/B1 complete mission 05 using localized controls, oral criteria and sample",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:850}});
  await page.goto(URL);await enable(page,"es","B1");await mission(page,5);
  const c=L.pack("es","B1",5);
  await leg(page,c,"M1","East Gardens","2",2);
  await click(page,c.actions.EXIT_HERE);await click(page,c.actions.EXIT);
  assert.deepEqual(await panel(page).locator(".metro-selfcheck-criteria li").allInnerTexts(),c.cefr.criteria);
  await click(page,c.labels.model);
  assert.ok((await panel(page).innerText()).includes(c.models[5]));
  await pass(page,c,5);
  await page.locator("#metroLab").screenshot({path:path.join(SHOTS,"spanish-b1-metro05.png")});
 }finally{await browser.close();}
});
test("DE/B2 complete mission 06 with University transfer and level-based justification",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:850}});
  await page.goto(URL);await enable(page,"de","B2");await mission(page,6);
  const c=L.pack("de","B2",6);
  assert.ok((await panel(page).innerText()).includes(c.cefr.task));
  await leg(page,c,"M2","North Park","1",2);
  await click(page,c.actions.TRANSFER_HERE);await click(page,c.actions.CHANGE_LINE);
  await leg(page,c,"M3","Harbour","3",3);
  await click(page,c.actions.EXIT_HERE);await click(page,c.actions.EXIT);
  assert.ok((await panel(page).innerText()).includes(c.cefr.criteria[1]));
  await pass(page,c,6);
 }finally{await browser.close();}
});
test("FR/C1 complete metro disruption mission 07 without traversing closed M1 edge",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:850}});
  await page.goto(URL);await enable(page,"fr","C1");await mission(page,7);
  const c=L.pack("fr","C1",7);
  await click(page,c.actions.READ_NOTICE);
  await leg(page,c,"M2","North Park","3",1);
  await click(page,c.actions.TRANSFER_HERE);await click(page,c.actions.CHANGE_LINE);
  await leg(page,c,"M3","Harbour","3",2);
  await click(page,c.actions.EXIT_HERE);await click(page,c.actions.EXIT);
  assert.ok((await panel(page).innerText()).includes(c.cefr.criteria[0]));
  await pass(page,c,7);
 }finally{await browser.close();}
});
test("FR/C2 mobile WebKit: City–Metro–City with 3 oral checkpoints and final city marker",async()=>{
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on("pageerror",e=>errors.push(e.stack||String(e)));
  await page.goto(URL);await enable(page,"fr","C2");await mission(page,8);
  const c=L.pack("fr","C2",8);
  const east=page.locator('#f2Quick [data-direction="east"]'),north=page.locator('#f2Quick [data-direction="north"]');
  await east.click();await east.click();await north.click();
  await click(page,c.actions.SELF_CHECK);await click(page,c.actions.ENTER);
  assert.equal(await page.locator(".layout").isVisible(),false);
  await leg(page,c,"M2","North Park","1",2);
  await click(page,c.actions.TRANSFER_HERE);await click(page,c.actions.SELF_CHECK);await click(page,c.actions.CHANGE_LINE);
  await leg(page,c,"M3","Harbour","3",2);
  await click(page,c.actions.EXIT_HERE);await click(page,c.actions.EXIT);
  assert.equal(await page.locator(".layout").isVisible(),true);
  await north.click();
  assert.equal(await panel(page).locator(".metro-selfcheck-criteria li").count(),3);
  await pass(page,c,8);
  assert.equal(await page.locator("#mapLocation").innerText(),CityContent.pack("fr").ui.museum);
  await page.screenshot({path:path.join(SHOTS,"french-c2-mobile-metro08.png"),fullPage:true});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("strict-CSP file preview works offline for all four metro languages without network",async()=>{
 const file=path.resolve(process.cwd(),".review-city-quest-f2/CITY_QUEST_F2_OFFLINE_PREVIEW.html");
 assert.ok(fs.existsSync(file));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:780}});
  const requests=[],errors=[];
  page.on("request",r=>{if(!r.url().startsWith("file:"))requests.push(r.url());});
  page.on("pageerror",e=>errors.push(String(e)));
  await page.goto("file://"+file,{waitUntil:"load"});
  for(const lang of L.languages){
   await enable(page,lang,"B1");await mission(page,5);
   assert.ok((await panel(page).innerText()).includes(L.pack(lang,"B1",5).titleMission));
  }
  assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test("A1/A2 remain classic City Quest in all languages and never expose metro pilot",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:375,height:812}});await page.goto(URL);
  for(const lang of L.languages)for(const level of ["A1","A2"]){
   await page.locator("#f2Language").selectOption(lang);
   await page.locator("#f2Level").selectOption(level);
   assert.equal(await page.locator("#metroPilotToggle").isVisible(),false);
   await mission(page,5);
   assert.ok(!(await panel(page).innerText()).includes(L.pack(lang,"B1",5).titleMission));
  }
 }finally{await browser.close();}
});
