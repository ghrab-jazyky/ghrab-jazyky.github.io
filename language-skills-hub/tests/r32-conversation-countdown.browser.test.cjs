#!/usr/bin/env node
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const root='http://127.0.0.1:8765/language-skills-hub/';
const cards=['konverzace/ceny-nemovitosti/index.html','konverzace/human-rights/index.html'];

function url(route,params={}){
 const u=new URL(route,root);
 for(const [k,v] of Object.entries(params))u.searchParams.set(k,v);
 return u.href;
}
async function openCard(page,href){
 const response=await page.goto(href,{waitUntil:'domcontentloaded'});
 assert.equal(response.status(),200,href);
 await page.locator('#stationTitle').waitFor({state:'visible',timeout:30000});
 if(await page.locator('#timerPanel').isHidden()){
  await page.locator('#startLessonBtn').click();
 }
 await page.locator('#timerPanel').waitFor({state:'visible',timeout:30000});
}
async function timerPosition(page){
 return page.locator('#timerPanel').evaluate(node=>{
  const s=getComputedStyle(node),r=node.getBoundingClientRect();
  return {position:s.position,right:r.right,bottom:r.bottom,width:r.width,
   viewportWidth:innerWidth,viewportHeight:innerHeight,visible:!!r.width&&!!r.height};
 });
}
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('Share free/fixed links, QR and UI lock in '+engineName,async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url('index.html',{skill:'konverzace'}),{waitUntil:'domcontentloaded'});
   await page.locator('#cards .card').first().waitFor();
   await page.locator('#cards .card').first().getByRole('button',{name:/Sdílet se studenty/}).click();
   await page.locator('#qrMount svg').waitFor();
   assert.equal(await page.locator('#shareFree').isChecked(),true);
   const free=await page.locator('#qrUrl').inputValue();
   assert.equal(new URL(free).searchParams.get('practice'),'1');
   assert.equal(new URL(free).searchParams.has('zamek'),false);
   assert.equal(new URL(free).searchParams.has('lang'),false);
   assert.equal(new URL(free).searchParams.has('level'),false);
   assert.equal(await page.locator('#qrCopy').isEnabled(),true);
   assert.equal(await page.locator('#qrSave').isEnabled(),true);
   await page.locator('#shareFixed').check();
   await page.locator('#shareLanguage').selectOption('es');
   await page.locator('#shareLevel').selectOption('B2');
   const fixed=await page.locator('#qrUrl').inputValue();
   assert.equal(new URL(fixed).searchParams.get('practice'),'1');
   assert.equal(new URL(fixed).searchParams.get('lang'),'es');
   assert.equal(new URL(fixed).searchParams.get('level'),'B2');
   assert.equal(new URL(fixed).searchParams.get('zamek'),'1');
   await page.locator('#qrMount svg').waitFor();
   assert.equal(await page.locator('#qrSave').isEnabled(),true);
   await openCard(page,fixed);
   assert.equal(await page.locator('#languageSelect').inputValue(),'es');
   assert.equal(await page.locator('#languageSelect').isDisabled(),true);
   assert.equal(await page.locator('#levelSwitch button[data-level="B2"]').isDisabled(),true);
   assert.equal(await page.locator('#levelSwitch button.active').getAttribute('data-level'),'B2');
   await openCard(page,free);
   assert.equal(await page.locator('#languageSelect').isEnabled(),true);
   assert.equal(await page.locator('#levelSwitch button[data-level="B2"]').isEnabled(),true);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });

 for(const [width,height] of [[390,844],[844,390]]){
  test('Floating countdown stays at bottom-right on '+engineName+' '+width+'x'+height,async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true});
    await openCard(page,url(cards[0],{practice:'1'}));
    const before=await timerPosition(page);
    assert.equal(before.position,'fixed',JSON.stringify(before));
    assert.ok(before.right<=width+2&&before.right>=width-80,JSON.stringify(before));
    assert.ok(before.bottom<=height+2&&before.bottom>=height-80,JSON.stringify(before));
    await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
    await page.waitForTimeout(120);
    const scrolled=await timerPosition(page);
    assert.ok(Math.abs(scrolled.right-before.right)<3,JSON.stringify({before,scrolled}));
    assert.ok(Math.abs(scrolled.bottom-before.bottom)<3,JSON.stringify({before,scrolled}));
    await page.locator('#timerFloatToggle').click();
    assert.equal(await page.locator('#timerPanel').evaluate(n=>n.classList.contains('mobile-expanded')),true);
    const expanded=await timerPosition(page);
    assert.equal(expanded.position,'fixed');
    assert.ok(expanded.width<=width-16,JSON.stringify(expanded));
    assert.ok(expanded.bottom<=height+2&&expanded.bottom>=height-80,JSON.stringify(expanded));
    assert.equal(await page.locator('#timerStart').isVisible(),true);
    await page.locator('#timerFloatToggle').click();
    assert.equal(await page.locator('#timerPanel').evaluate(n=>n.classList.contains('mobile-expanded')),false);
   }finally{await browser.close()}
  });
 }

 test('Countdown stays in station header on desktop in '+engineName,async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1365,height:900}});
   await openCard(page,url(cards[0],{practice:'1'}));
   const position=await timerPosition(page);
   assert.notEqual(position.position,'fixed');
   assert.equal(await page.locator('#timerDock #timerPanel').count(),1);
  }finally{await browser.close()}
 });
}
