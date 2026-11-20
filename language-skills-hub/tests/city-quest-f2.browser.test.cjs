"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {chromium,webkit}=require("playwright");
const C=require("../authoring/city-quest-f2/content-a.js");
require("../authoring/city-quest-f2/content-b.js");
const G=require("../authoring/city-quest-f2/engine.js");
const URL="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html";
const OUTPUT=path.join(process.cwd(),"city-quest-f2-artifacts");
fs.mkdirSync(OUTPUT,{recursive:true});
function listen(page){
 const errors=[],requests=[];
 page.on("pageerror",e=>errors.push(String(e)));
 page.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
 page.on("request",r=>{if(!r.url().startsWith("http://127.0.0.1:8765")&&!r.url().startsWith("file:"))requests.push(r.url());});
 return {errors,requests};
}
async function setVariant(page,lang,level){
 await page.locator("#f2Language").selectOption(lang);
 await page.locator("#f2Level").selectOption(level);
 assert.equal(await page.locator("html").getAttribute("lang"),lang);
 assert.match(await page.locator("#f2Profile").innerText(),new RegExp(level));
}
async function station(page,n){
 await page.locator("#f1Stations button").nth(n-1).click();
 assert.equal(await page.locator("#f1Stations button").nth(n-1).getAttribute("aria-current"),"step");
}
async function directions(page,steps){
 for(const dir of steps)await page.locator("#f1Panel .f2-controls ."+dir).click();
}
async function progress(page){return Number(await page.locator("#f1ProgressTrack").getAttribute("aria-valuenow"));}
test("all 24 language-CEFR variants render eight localized stations and visible profile",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const v=listen(page);
  const resp=await page.goto(URL,{waitUntil:"load"});
  assert.equal(resp.status(),200);
  await page.locator("#f1Stations button").first().waitFor();
  for(const lang of C.languages){
   for(const level of C.levels){
    await setVariant(page,lang,level);
    assert.equal(await page.locator("#f1Stations button").count(),8);
    assert.equal(await progress(page),0);
    assert.equal(await page.locator('[data-landmark-label="CITY MUSEUM"] text').textContent(),C.pack(lang).mapLabels["CITY MUSEUM"]);
    for(let i=1;i<=8;i++){
      await station(page,i);
      const text=await page.locator("#f1Panel h2").first().innerText();
      assert.ok(text.includes(C.pack(lang).stations[i-1][0]),lang+"/"+level+"/station"+i+": "+text);
    }
    if((lang==="en"&&level==="A1")||(lang==="es"&&level==="B1")||
       (lang==="de"&&level==="C1")||(lang==="fr"&&level==="C2")){
      await page.screenshot({path:path.join(OUTPUT,"f2-"+lang+"-"+level+"-station08.png"),fullPage:true});
    }
   }
  }
  assert.deepEqual(v.errors,[]);
  assert.deepEqual(v.requests,[]);
 }finally{await browser.close();}
});
test("English B1: all eight stations playable and locally completed",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900}});
  const v=listen(page);
  await page.goto(URL,{waitUntil:"load"});
  await page.locator("#f1Stations button").first().waitFor();
  // Station 1: six correct landmarks.
  for(const round of G.F.explore){
    await page.locator("#f1Panel .f2-choice-list button").nth(round.choices.indexOf(round.correct)).click();
  }
  assert.equal(await progress(page),1);
  await station(page,2);
  await directions(page,["east","east","east","north","north"]);
  assert.equal(await progress(page),2);
  await station(page,3);
  await page.locator("#f1Panel .f2-choice-list button").first().click();
  await page.locator("#f1Panel .f2-choice-list button").first().click();
  assert.equal(await progress(page),3);
  await station(page,4);
  await directions(page,["east","east","north","north","east"]);
  assert.equal(await progress(page),4);
  await station(page,5);
  await page.locator("#f1Panel select").nth(0).selectOption("24");
  await page.locator("#f1Panel select").nth(1).selectOption("08:47");
  await page.locator("#f1Panel select").nth(2).selectOption("Hospital");
  await page.locator("#f1Panel .f2-actions .btn").first().click();
  assert.equal(await progress(page),5);
  await station(page,6);
  await page.locator("#f1Panel .f2-choice-list button").nth(1).click();
  await page.locator("#f1Panel .f2-choice-list button").first().click();
  assert.equal(await progress(page),6);
  await station(page,7);
  await directions(page,["north","east","east","east","north"]);
  assert.equal(await progress(page),7);
  await station(page,8);
  for(const steps of [["east","east","north"],["east","east"],["west","north"]]){
    await directions(page,steps);
    await page.locator("#f1Panel .f2-actions .btn").first().click();
  }
  assert.equal(await progress(page),8);
  assert.match(await page.locator("#f1Panel").innerText(),/Mission completed/);
  await page.screenshot({path:path.join(OUTPUT,"f2-en-B1-8-of-8.png"),fullPage:true});
  assert.deepEqual(v.errors,[]);
  assert.deepEqual(v.requests,[]);
 }finally{await browser.close();}
});
test("CEFR differences: A1 fewer tasks, German C1 via Library, French C2 blocked edge",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const v=listen(page);
  await page.goto(URL,{waitUntil:"load"});
  await setVariant(page,"es","A1");
  assert.equal(await page.locator("#f1Panel .f2-choice-list button").count(),2);
  await station(page,2);
  assert.match(await page.locator("#f1Panel").innerText(),/Plaza del Mercado/);
  await directions(page,["east","east","north"]);
  assert.equal(await progress(page),1);
  await setVariant(page,"de","C1");
  await station(page,2);
  assert.match(await page.locator("#f1Panel").innerText(),/Bibliothek/);
  await directions(page,["east","east","north","east","east","north","west"]);
  assert.equal(await progress(page),1);
  await setVariant(page,"fr","C2");
  await station(page,2);
  await directions(page,["east","east"]);
  await page.locator("#f1Panel .f2-controls .east").click();
  assert.match(await page.locator("#f1Panel .f2-status").innerText(),/rue est barrée/i);
  assert.equal(await progress(page),0);
  assert.deepEqual(v.errors,[]);
 }finally{await browser.close();}
});
test("mobile Chromium: directions beside map and no horizontal overflow at 390 and 320 px",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const v=listen(page);
  await page.goto(URL,{waitUntil:"load"});
  await setVariant(page,"es","A2");
  await station(page,4);
  assert.equal(await page.locator("#f2Quick").isVisible(),true);
  assert.equal(await page.locator("#f2Quick button").count(),4);
  await page.locator("#f2Quick .f2-quick-east").tap();
  assert.match(await page.locator("#f2Quick strong").innerText(),/este|izquierda|derecha|Sigue/i);
  await page.screenshot({path:path.join(OUTPUT,"f2-es-A2-mobile.png"),fullPage:true});
  const full=await page.evaluate(()=>[document.documentElement.scrollWidth,window.innerWidth]);
  assert.ok(full[0]<=full[1]+2,"390px overflow "+full.join("/"));
  await page.setViewportSize({width:320,height:640});
  const narrow=await page.evaluate(()=>[document.documentElement.scrollWidth,window.innerWidth]);
  assert.ok(narrow[0]<=narrow[1]+2,"320px overflow "+narrow.join("/"));
  await page.screenshot({path:path.join(OUTPUT,"f2-es-A2-mobile-320.png"),fullPage:true});
  assert.deepEqual(v.errors,[]);
  assert.deepEqual(v.requests,[]);
 }finally{await browser.close();}
});
test("mobile WebKit: German and French variants, no remote requests",async()=>{
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  const v=listen(page);
  await page.goto(URL,{waitUntil:"load"});
  await setVariant(page,"de","B2");
  await station(page,3);
  assert.match(await page.locator("#f1Panel").innerText(),/Entschuldigung/);
  await setVariant(page,"fr","C2");
  await station(page,5);
  assert.match(await page.locator("#f1Panel").innerText(),/mobilité réduite|accessible/i);
  await page.screenshot({path:path.join(OUTPUT,"f2-fr-C2-webkit.png"),fullPage:true});
  assert.deepEqual(v.errors,[]);
  assert.deepEqual(v.requests,[]);
 }finally{await browser.close();}
});
test("portable offline HTML works via file:// in all four languages with strict CSP",async()=>{
 const file=path.join(process.cwd(),".review-city-quest-f2/CITY_QUEST_F2_OFFLINE_PREVIEW.html");
 assert.ok(fs.existsSync(file),"build-preview.cjs must run before browser QA");
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const v=listen(page);
  await page.goto("file://"+file,{waitUntil:"load"});
  await page.locator("#f1Stations button").first().waitFor();
  for(const lang of C.languages){
    await setVariant(page,lang,"B1");
    await station(page,3);
    assert.match(await page.locator("#f1Panel .f2-dialogue-bubble").innerText(),new RegExp(C.pack(lang).dialogue.opening.slice(0,10).replace(/[.?*+^$[\]\\(){}|-]/g,"\\$&")));
  }
  await page.screenshot({path:path.join(OUTPUT,"f2-offline-fr-B1.png"),fullPage:true});
  assert.deepEqual(v.errors,[]);
  assert.deepEqual(v.requests,[]);
 }finally{await browser.close();}
});
