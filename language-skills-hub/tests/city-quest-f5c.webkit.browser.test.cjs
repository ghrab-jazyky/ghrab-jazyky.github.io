"use strict";
/* F5C: real WebKit-engine mobile smoke in headless Linux, not a physical
 * iPhone/iPad or assistive-technology signoff. Purely read-only browser QA. */
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {webkit}=require("playwright");
const URL="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html";
const languages=["en","es","de","fr"],levels=["A1","B1","C2"];
const widths=[{width:320,height:568},{width:390,height:844},{width:568,height:320}];
test("F5C WebKit touch layouts: 4 languages, CEFR, City/Metro and 200% text",async()=>{
 const browser=await webkit.launch({headless:true});
 try{
  for(const viewport of widths){
   const page=await browser.newPage({viewport,isMobile:true,hasTouch:true});
   const errors=[],remote=[];
   page.on("pageerror",e=>errors.push(e.message));
   page.on("request",r=>{
    if(!r.url().startsWith("http://127.0.0.1:8765/")&&!r.url().startsWith("data:"))
     remote.push(r.url());
   });
   await page.goto(URL,{waitUntil:"load"});
   await page.evaluate(()=>{document.documentElement.style.fontSize="200%";});
   for(const lang of languages){
    await page.locator("#f2Language").selectOption(lang);
    for(const level of levels){
     await page.locator("#f2Level").selectOption(level);
     for(const mission of [1,6,8]){
      await page.locator("#f1Stations button").nth(mission-1).click();
      assert.equal(await page.locator("#f1Panel").isVisible(),true,lang+"/"+level+"/"+mission);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      if(overflow>2){
       fs.mkdirSync("city-quest-f5c-webkit-artifacts",{recursive:true});
       await page.screenshot({path:path.join("city-quest-f5c-webkit-artifacts",
        lang+"-"+level+"-city"+mission+"-"+viewport.width+".png"),fullPage:true});
      }
      assert.ok(overflow<=2,JSON.stringify({engine:"webkit",viewport,lang,level,mode:"CITY",mission,overflow}));
     }
     if(level==="A1")continue;
     await page.locator("#metroPilotToggle").click();
     for(const mission of [5,6,8]){
      await page.locator("#f1Stations button").nth(mission-1).click();
      // Metro 08 deliberately opens on the city map: the learner first
      // collects tickets and reaches the metro entrance on foot.
      assert.equal(await page.locator("#metroLab").isVisible(),mission!==8);
      assert.equal(await page.locator(".layout").isVisible(),mission===8);
      assert.equal(await page.locator("#f1Panel").isVisible(),true);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      if(overflow>2){
       fs.mkdirSync("city-quest-f5c-webkit-artifacts",{recursive:true});
       await page.screenshot({path:path.join("city-quest-f5c-webkit-artifacts",
        lang+"-"+level+"-metro"+mission+"-"+viewport.width+".png"),fullPage:true});
      }
      assert.ok(overflow<=2,JSON.stringify({engine:"webkit",viewport,lang,level,mode:"METRO",mission,overflow}));
     }
     await page.locator("#metroPilotToggle").click();
    }
   }
   assert.deepEqual(errors,[],"WebKit JavaScript errors "+JSON.stringify(viewport));
   assert.deepEqual(remote,[],"WebKit made non-local requests "+JSON.stringify(viewport));
   await page.close();
  }
 }finally{await browser.close();}
});
