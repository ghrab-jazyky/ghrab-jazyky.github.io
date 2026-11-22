"use strict";
/* Claude F5 independent remediation CQ-F5-001/002: real DOM behaviour,
 * not proof of a physical iPhone/Android or assistive technology acceptance.
 */
const {test}=require("node:test"),assert=require("node:assert/strict");
const {chromium}=require("playwright");
const URL="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html";
const langs=["en","es","de","fr"];
const zoomStates=["A1","B1","C2"];
test("F5C phone 200%: all 8 city tasks, 4 metro tasks B1+, 4 languages, no document horizontal overflow",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,390]){
   const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
   await page.goto(URL,{waitUntil:"load"});
   const errors=[];page.on("pageerror",e=>errors.push(String(e)));
   await page.evaluate('document.documentElement.style.fontSize="200%"');
   for(const lang of langs)for(const level of zoomStates){
    await page.locator("#f2Language").selectOption(lang);
    await page.locator("#f2Level").selectOption(level);
    for(const mode of ["CITY","METRO"]){
     if(mode==="METRO"&&level==="A1")continue;
     const pilot=await page.locator("#metroPilotToggle").getAttribute("aria-pressed")==="true";
     if(pilot!==(mode==="METRO"))await page.locator("#metroPilotToggle").click();
     for(let mission=1;mission<=(mode==="CITY"?8:8);mission++){
      if(mode==="METRO"&&mission<5)continue;
      await page.locator("#f1Stations button").nth(mission-1).click();
      const r=await page.evaluate(()=>{
       const viewport=document.documentElement.clientWidth;
       const panel=document.getElementById("f1Panel");
       const scroller=panel.querySelector(".f2-transit-scroll");
       const landmarks=[...panel.querySelectorAll(".f2-landmark")].map(el=>el.getBoundingClientRect());
       const jump=document.getElementById("metroJump");
       return {
        overflow:document.documentElement.scrollWidth-viewport,
        viewport,
        scroller:scroller?{
         clipped:scroller.scrollWidth>scroller.clientWidth,
         keyboard:scroller.getAttribute("tabindex"),
         aria:scroller.getAttribute("aria-label"),
         width:scroller.getBoundingClientRect().width
        }:null,
        landmarksOffscreen:landmarks.some(r=>r.right>viewport+2||r.left< -2),
        jumpOverflow:jump&&!jump.hidden?jump.getBoundingClientRect().right-viewport:0
       };
      });
      assert.ok(r.overflow<=2,
       JSON.stringify({width,lang,level,mode,mission,...r}));
      assert.equal(r.landmarksOffscreen,false,
       "Landmarks clip "+JSON.stringify({width,lang,level,mission,...r}));
      assert.ok(r.jumpOverflow<=2,"Metro preview jump clips at "+width+" "+lang+" "+level);
      if(mode==="CITY"&&mission===5){
       assert.ok(r.scroller,"Bus timetable lacks horizontal scroll container");
       assert.equal(r.scroller.keyboard,"0");
       assert.ok(r.scroller.aria.length>4);
       assert.ok(r.scroller.width<=r.viewport);
      }
     }
    }
   }
   assert.deepEqual(errors,[],"Client-side JS errors on zoomed phone");
   await page.close();
  }
 }finally{await browser.close();}
});
test("F5C light-mode metro neutral text has non-pale contrast and scene tabs meet 44px",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:320,height:568},hasTouch:true,isMobile:true});
  await page.goto(URL);
  await page.locator("#metroPilotToggle").click();
  await page.locator("#f1Stations button").nth(5).click();
  await page.evaluate('document.documentElement.setAttribute("data-theme","light")');
  const result=await page.evaluate(()=>{
   const status=document.querySelector("#f1Panel .f2-status");
   // In active gameplay the gallery scene toggle is intentionally hidden:
   // it must NOT enable a second way of changing the player's state.
   const color=window.getComputedStyle(status);
   function luminance(value){
    const arr=value.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{
     const c=v/255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);
    });
    return arr[0]*.2126+arr[1]*.7152+arr[2]*.0722;
   }
   const a=luminance(color.color),b=luminance(color.backgroundColor),contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
   return {contrast,statusText:status.textContent};
  });
  assert.ok(result.contrast>=4.5,"Light-mode neutral text contrast <4.5: "+JSON.stringify(result));
  // The two view tabs are only student-accessible in the EN-only reference
  // gallery; test their actual touch boxes in that visible state.
  await page.locator("#metroPilotToggle").click();
  const tabs=await page.locator(".metro-scene-tab:visible").evaluateAll(nodes=>
   nodes.map(el=>{const r=el.getBoundingClientRect();return {w:r.width,h:r.height}}));
  assert.equal(tabs.length,2,"Reference gallery must expose two view tabs");
  for(const t of tabs)assert.ok(t.w>=44&&t.h>=44,"Scene tab under-sized "+JSON.stringify(t));
 }finally{await browser.close();}
});
