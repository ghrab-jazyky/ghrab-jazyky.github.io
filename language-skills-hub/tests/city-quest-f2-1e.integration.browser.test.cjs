"use strict";
/* City Quest F2.1E independent integration acceptance. Uses real browser UI,
 * not mocked hooks or direct engine calls. Production remains untouched.
 * 24 classic × 8 stations = 192 views; 16 metro × 4 = 64 views.
 */
const {test}=require("node:test"),assert=require("node:assert/strict");
const path=require("node:path"),fs=require("node:fs");
const {chromium,webkit}=require("playwright");
const L=require("../authoring/city-quest-f2-1d/metro-language.js");
const URL="http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html";
const OUT=path.join(process.cwd(),"city-quest-f2-1e-artifacts");fs.mkdirSync(OUT,{recursive:true});
const languages=["en","es","de","fr"],levels=["A1","A2","B1","B2","C1","C2"];
const errorsOf=page=>{const errors=[];page.on("pageerror",e=>errors.push(e.stack||String(e)));return errors;};
const choose=(page,n)=>page.locator("#f1Stations .f1-station").nth(n-1).click();

test("F2.1E matrix: render and interact with all 192 classic F2 station/profile views",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=errorsOf(page);
  await page.goto(URL,{waitUntil:"load"});
  let count=0;
  for(const lang of languages){
   await page.locator("#f2Language").selectOption(lang);
   for(const level of levels){
    await page.locator("#f2Level").selectOption(level);
    const toggle=page.locator("#metroPilotToggle");
    assert.equal(await toggle.isVisible(),!["A1","A2"].includes(level),lang+"/"+level+" metro gating");
    assert.equal(await toggle.getAttribute("aria-pressed"),"false");
    for(let station=1;station<=8;station++){
     await choose(page,station);
     assert.equal(await page.locator("#f1Stations .f1-station").count(),8);
     assert.equal(await page.locator("#f1Panel .f2-card-head h2").count(),1,
      lang+"/"+level+" classic mission "+station);
     assert.equal(await page.locator("#f1Panel").isVisible(),true);
     count++;
    }
   }
  }
  assert.equal(count,192);
  assert.deepEqual(errors,[],"No script errors in any classic station");
 }finally{await browser.close();}
});

test("F2.1E matrix: 64 metro variants preserve 16 CEFR profiles, paired prompts, glossary and dual-layer UI",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=errorsOf(page);
  await page.goto(URL,{waitUntil:"load"});
  let count=0;
  for(const lang of languages){
   await page.locator("#f2Language").selectOption(lang);
   for(const level of ["B1","B2","C1","C2"]){
    await page.locator("#f2Level").selectOption(level);
    await page.locator("#metroPilotToggle").click();
    assert.equal(await page.locator("#metroPilotToggle").getAttribute("aria-pressed"),"true");
    for(const n of L.missions){
     await choose(page,n);
     const c=L.pack(lang,level,n),panel=page.locator("#f1Panel");
     assert.ok((await panel.innerText()).includes(c.titleMission),lang+"/"+level+"/"+n);
     assert.ok((await panel.innerText()).includes(c.cefr.task),lang+"/"+level+"/"+n+" CEFR");
     assert.equal(await panel.locator(".metro-glossary").count(),1);
     if(n===8){
      assert.equal(await page.locator(".layout").isVisible(),true,"Mixed route opens in the city");
      assert.equal(await page.locator("#f2Quick").isVisible(),true,"One city compass");
      assert.equal(await page.locator("#f2Quick").count(),1,"One HUD instance");
      const label=await panel.locator(".f2-status").innerText();
      assert.ok(!label.includes(c.labels.noLine),
       "City position must not display a nonexistent underground train");
     }else{
      assert.equal(await page.locator("#metroLab").isVisible(),true,"Metro scene active");
      assert.equal(await page.locator(".layout").isVisible(),false,"City map hidden underground");
     }
     count++;
    }
    await page.locator("#metroPilotToggle").click();
   }
  }
  assert.equal(count,64);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});

test("F2.1E mixed city/metro map reports the actual surface position at entrance and after walking",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=errorsOf(page);
  await page.goto(URL,{waitUntil:"load"});
  await page.locator("#metroPilotToggle").click();
  await choose(page,8);
  let status=await page.locator("#f1Panel .f2-status").innerText();
  assert.match(status,/Central Station/i);
  assert.doesNotMatch(status,/Current metro position/i);
  const east=page.locator('#f2Quick [data-direction="east"]');
  await east.click();
  status=await page.locator("#f1Panel .f2-status").innerText();
  assert.doesNotMatch(status,/Market Square|Current metro position/i,
   "Player has not yet reached Market Square, so don't show it as current position");
  await east.click();
  await page.locator('#f2Quick [data-direction="north"]').click();
  assert.match(await page.locator("#f1Panel .f2-status").innerText(),/Market Square/i);
  await page.screenshot({path:path.join(OUT,"f21e-city-position-390.png"),fullPage:true});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});

test("F2.1E integration: phone/tablet/desktop layouts keep controls reachable, one HUD and no page overflow",async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1050,800],[1051,800],[1366,900]]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=errorsOf(page);
   await page.goto(URL,{waitUntil:"load"});
   await page.locator("#metroPilotToggle").click();
   await choose(page,5);
   assert.equal(await page.locator("#f1Panel").isVisible(),true);
   assert.equal(await page.locator("#metroLab").isVisible(),true);
   assert.equal(await page.locator("#f1Panel").count(),1,"Exactly one live panel");
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
   assert.equal(overflow,false,width+" unexpected horizontal page scrolling");
   const buttons=page.locator("#f1Panel button:visible");
   for(let i=0;i<await buttons.count();i++){
    const box=await buttons.nth(i).boundingBox();
    assert.ok(box&&box.width>=40&&box.height>=40,width+" metro click target "+i);
   }
   await choose(page,8);
   assert.equal(await page.locator("#f2Quick").count(),1);
   assert.equal(await page.locator("#f2Quick").isVisible(),true);
   assert.deepEqual(errors,[]);
   if([320,390,1366].includes(width))
    await page.screenshot({path:path.join(OUT,"f21e-responsive-"+width+".png"),fullPage:true});
   await page.close();
  }
 }finally{await browser.close();}
});

test("F2.1E offline CSP: one standalone HTML performs no external requests across all four languages",async()=>{
 const preview=path.resolve(process.cwd(),".review-city-quest-f2/CITY_QUEST_F2_OFFLINE_PREVIEW.html");
 assert.ok(fs.existsSync(preview));
 const html=fs.readFileSync(preview,"utf8");
 assert.match(html,/connect-src 'none'/,"No network calls allowed");
 assert.match(html,/script-src 'sha256-/,"Inline scripts require exact hash");
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=errorsOf(page),requests=[];
  page.on("request",r=>{if(!r.url().startsWith("file:"))requests.push(r.url());});
  await page.goto("file://"+preview,{waitUntil:"load"});
  for(const lang of languages){
   await page.locator("#f2Language").selectOption(lang);
   await page.locator("#f2Level").selectOption("C1");
   await page.locator("#metroPilotToggle").click();
   await choose(page,7);
   const panel=page.locator("#f1Panel");
   assert.ok((await panel.innerText()).includes(L.pack(lang,"C1",7).titleMission));
  }
  assert.deepEqual(requests,[],"No fetch, network media or CDN requests");
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
