'use strict';
// Isolated accessibility and mobile-emulation gate. This is not a physical-device certificate.
const test=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const root='http://127.0.0.1:8765/language-skills-hub/konverzace/plural/index.html';
const tags=['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'];
async function inspect(engine,profile,language,level){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({...profile,bypassCSP:true});
  const page=await context.newPage();
  await page.goto(root+'?lang='+language+'&level='+level,{waitUntil:'domcontentloaded'});
  await page.locator('#cardsGrid .flip').first().waitFor({state:'visible'});
  assert.equal(await page.locator('html').getAttribute('lang'),language,'document language must follow selection');
  // The card's visible answer side and the EXTRA section must also be accessible.
  await page.locator('#cardsGrid .flip').first().click();
  await page.locator('#extraBtn').click();
  const result=await new AxeBuilder({page}).withTags(tags).analyze();
  const problems=result.violations.map(v=>({
   id:v.id,impact:v.impact,description:v.description,
   targets:v.nodes.slice(0,4).map(n=>n.target.join(' '))
  }));
  assert.deepEqual(problems,[],'axe WCAG 2.2 AA violations: '+JSON.stringify(problems,null,2));
  assert.equal(await page.locator('#cardsGrid .flip').count(),10);
  await context.close();
 }finally{await browser.close();}
}
test('V6 Chromium desktop German B1: axe WCAG 2.2 AA',()=>inspect(chromium,{viewport:{width:1280,height:800}},'de','B1'));
test('V6 Chromium Android-sized Spanish C2: axe WCAG 2.2 AA',()=>inspect(chromium,{...devices['Pixel 5']},'es','C2'));
test('V6 WebKit iPhone-sized French B2: axe WCAG 2.2 AA',()=>inspect(webkit,{...devices['iPhone 13']},'fr','B2'));
