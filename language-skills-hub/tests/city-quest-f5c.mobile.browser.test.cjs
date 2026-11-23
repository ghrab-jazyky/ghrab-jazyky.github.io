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
      if(r.overflow>2){
       r.offenders=await page.evaluate(()=>{
        const viewport=document.documentElement.clientWidth;
        return [...document.querySelectorAll("body *")].filter(el=>{
         const box=el.getBoundingClientRect();
         return box.width>0&&box.right>viewport+2&&getComputedStyle(el).position!=="fixed";
        }).slice(0,20).map(el=>{
         const box=el.getBoundingClientRect();
         return {tag:el.tagName,id:el.id,className:typeof el.className==="string"?el.className:"",
          right:Math.round(box.right),width:Math.round(box.width),
          clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,
          text:(el.textContent||"").replace(/\\s+/g," ").slice(0,80)};
        });
       });
      }
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
  // Guided gallery is authoring/QA only after CQ-F5-006: it must not
  // appear when a student simply leaves the game. Test in explicit review.
  await page.goto(URL+"?cq-review=1");
  const tabs=await page.locator(".metro-scene-tab:visible").evaluateAll(nodes=>
   nodes.map(el=>{const r=el.getBoundingClientRect();return {w:r.width,h:r.height}}));
  assert.equal(tabs.length,2,"Reference gallery must expose two view tabs");
  for(const t of tabs)assert.ok(t.w>=44&&t.h>=44,"Scene tab under-sized "+JSON.stringify(t));
 }finally{await browser.close();}
});


test("F5C touch accessibility: visible header, map and learning disclosure controls are at least 44px",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,390]){
   const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
   await page.goto(URL);
   await page.locator("#f1Stations button").nth(1).click();
   const targets=await page.evaluate(()=>{
    const selectors=["#themeBtn","#resetBtn","#mapZoom","#f1Panel .f2-help summary"];
    return selectors.map(selector=>{
     const el=document.querySelector(selector);
     if(!el)return {selector,missing:true};
     const r=el.getBoundingClientRect();
     return {selector,w:r.width,h:r.height,visible:r.width>0&&r.height>0};
    });
   });
   for(const t of targets){
    assert.ok(!t.missing,"Missing touch target "+t.selector);
    if(t.visible)assert.ok(t.w>=44&&t.h>=44,JSON.stringify({width,...t}));
   }
   await page.close();
  }
 }finally{await browser.close();}
});

test("F5C N01 metro mission text remains readable in light theme across EN/ES/DE/FR",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const language of langs){
   const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   await page.goto(URL);
   await page.locator("#f2Language").selectOption(language);
   await page.locator("#f2Level").selectOption("B1");
   await page.locator("#metroPilotToggle").click();
   await page.locator("#f1Stations button").nth(5).click();
   await page.locator("#themeBtn").click();
   const result=await page.evaluate(()=>{
    const css=(selector,prop)=>getComputedStyle(document.querySelector(selector))[prop];
    const parse=(s)=>{
     const m=s.match(/rgba?\(([^)]+)\)/);if(!m)throw Error("Expected opaque RGB: "+s);
     return m[1].split(",").slice(0,3).map(Number);
    };
    const light=(rgb)=>rgb.map(v=>{
     const x=v/255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4);
    }).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
    const contrast=(foreground,background)=>{
     const a=light(parse(foreground)),b=light(parse(background));
     return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    };
    const panel=".metro-lab[data-mode=game] #f1Panel";
    const background=css(panel,"backgroundColor");
    const objective=css(panel+" .f2-objective","backgroundColor");
    return {
     panelBackground:background,
     heading:contrast(css(panel+" .f2-card-head h2","color"),background),
     description:contrast(css(panel+" .f2-card-head p","color"),background),
     objective:contrast(css(panel+" .f2-objective p","color"),objective)
    };
   });
   for(const field of ["heading","description","objective"]){
    assert.ok(result[field]>=4.5,language+": "+field+" contrast below WCAG AA: "+JSON.stringify(result));
   }
   await page.close();
  }
 }finally{await browser.close();}
});

test("F5C NEW-01: Experience panel and all controls stay on-screen at phone and tablet widths",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,390,525,768]){
   const page=await browser.newPage({viewport:{width,height:844},isMobile:width<=525,hasTouch:width<=525});
   await page.goto(URL);
   await page.locator("#f3ExperienceSummary").click();
   await page.waitForFunction(()=>{
    const r=document.querySelector(".f3-experience-panel").getBoundingClientRect();
    return r.width>0&&r.left>=-1&&r.right<=document.documentElement.clientWidth+1;
   });
   const bounds=await page.evaluate(()=>{
    const nodes=[document.querySelector(".f3-experience-panel"),
      ...document.querySelectorAll(".f3-experience-panel .f3-control")];
    return nodes.map(n=>{const r=n.getBoundingClientRect();
     return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:r.width,h:r.height,
       viewport:document.documentElement.clientWidth,inner:window.innerWidth};});
   });
   assert.equal(bounds.length,5);
   for(const [i,b] of bounds.entries()){
    assert.ok(b.w>=44&&b.h>=44&&b.left>=-1&&b.right<=b.viewport+1,
     JSON.stringify({width,i,b}));
   }
   await page.close();
  }
 }finally{await browser.close();}
});
test("F5C N03/NEW-03/NEW-06: game identity and catalog language survive metro toggles",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const labels={en:"Interactive language game",es:"Juego interactivo de idiomas",
    de:"Interaktives Sprachspiel",fr:"Jeu de langue interactif"};
  const skips={es:"Saltar",de:"springen",fr:"Aller"};
  for(const lang of ["en","es","de","fr"]){
   const page=await browser.newPage();
   await page.goto(URL+"?practice=1&lang="+lang+"&level=C1");
   assert.equal(await page.locator("#f2Language").inputValue(),lang);
   assert.equal(await page.locator("#f2Level").inputValue(),"C1");
   assert.ok((await page.locator("#cityQuestGameType").innerText()).includes(labels[lang]));
   assert.ok((await page.locator("#cityQuestHeaderType").innerText()).includes(labels[lang]));
   assert.doesNotMatch(await page.locator("#cityQuestHeaderType").innerText(),/Conversation Lab/);
   if(lang!=="en")assert.ok((await page.locator("#f3Skip").textContent()).includes(skips[lang]));
   await page.locator("#metroPilotToggle").click();
   await page.locator("#f1Stations button").nth(5).click();
   assert.ok((await page.locator("#cityQuestGameType").innerText()).includes(labels[lang]));
   assert.ok((await page.locator("#cityQuestVariant").innerText()).includes("C1"));
   await page.locator("#metroPilotToggle").click();
   assert.ok((await page.locator("#cityQuestGameType").innerText()).includes(labels[lang]));
   await page.close();
  }
  const invalid=await browser.newPage();
  await invalid.goto(URL+"?lang=zz&level=Z9");
  assert.equal(await invalid.locator("#f2Language").inputValue(),"en");
  assert.equal(await invalid.locator("#f2Level").inputValue(),"B1");
  await invalid.close();
 }finally{await browser.close();}
});
