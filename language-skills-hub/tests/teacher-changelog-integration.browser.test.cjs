#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const published={kind:'LSH_TEACHER_CHANGELOG_V1',schemaVersion:1,latestAnnouncementSequence:1,contentRevision:1,releases:[{
 id:'lsh-2026-11-16-test',sequence:1,publishedAt:'2026-11-16',title:'Ukázkové vydání pro automatický test',
 changes:[{id:'listening-test',area:'listening',category:'functionality',title:'Přehlednější poslechové úlohy',
 description:'Tento záznam slouží pouze k ověření chování v předprodukčních testech.',
 teacherBenefit:'Ukázkový katalog umožní učiteli rychle najít změny.'}]
}]};
async function withPage(engine,fn) {
 const browser=await engine.launch({headless:true});
 try {
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await fn(page,context);
  assert.deepEqual(errors,[]);
 } finally {await browser.close();}
}
const stub=(page,obj)=>page.route('**/language-skills-hub/data/teacher-changelog.json',route=>
 route.fulfill({status:obj===null?503:200,contentType:'application/json',body:obj===null?'Unavailable':JSON.stringify(obj)}));
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]) {
 test('Stage D '+engineName+' first-time YES, stored sequence and manual history',{timeout:100000},async()=>{
  await withPage(engine,async(page)=>{
   await stub(page,published);
   await page.goto(base);await page.locator('#whatsNewPrompt[open]').waitFor();
   assert.match(await page.locator('#wnPromptLead').innerText(),/Připravil jsem krátký přehled/);
   assert.equal(await page.evaluate("localStorage.getItem('lsh:teacher-whats-new:last-offered-sequence:v1')"),null);
   await page.locator('#wnPromptYes').click();
   await page.locator('#whatsNewCatalog[open]').waitFor();
   assert.equal(await page.locator('.wn-release').count(),1);
   assert.equal(await page.evaluate("localStorage.getItem('lsh:teacher-whats-new:last-offered-sequence:v1')"),'1');
   await page.locator('#wnCatalogContinue').click();
   await page.locator('#skillChooser:not([hidden])').waitFor();
   await page.reload();await page.locator('#skillChooser:not([hidden])').waitFor();
   assert.equal(await page.locator('#whatsNewPrompt').evaluate(el=>el.open),false);
   await page.locator('[data-choose-skill="cteni"]').click();
   await page.locator('#catalog:not([hidden])').waitFor();
   await page.locator('#whatsNewOpen').click();await page.locator('#whatsNewCatalog[open]').waitFor();
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#whatsNewCatalog').evaluate(el=>el.open),false);
   assert.equal(await page.locator('#catalog').isVisible(),true);
  });
 });
 test('Stage D '+engineName+' NO, close and direct lab URL',{timeout:100000},async()=>{
  await withPage(engine,async(page)=>{
   await stub(page,published);
   await page.goto(base);await page.locator('#whatsNewPrompt[open]').waitFor();
   await page.locator('#wnPromptNo').click();await page.locator('#skillChooser:not([hidden])').waitFor();
   assert.equal(await page.locator('#whatsNewCatalog').evaluate(el=>el.open),false);
   assert.equal(await page.evaluate("localStorage.getItem('lsh:teacher-whats-new:last-offered-sequence:v1')"),'1');
   await page.evaluate("localStorage.removeItem('lsh:teacher-whats-new:last-offered-sequence:v1')");
   await page.goto(base+'?skill=poslech');
   await page.locator('#catalog:not([hidden])').waitFor();
   assert.equal(await page.locator('#whatsNewPrompt').evaluate(el=>el.open),false);
  });
 });
 test('Stage D '+engineName+' offline fail-open, manual fallback',{timeout:100000},async()=>{
  await withPage(engine,async(page)=>{
   await stub(page,null);
   await page.goto(base);await page.locator('#skillChooser:not([hidden])').waitFor();
   assert.equal(await page.locator('#whatsNewPrompt').evaluate(el=>el.open),false);
   await page.locator('[data-choose-skill="konverzace"]').click();
   await page.locator('#whatsNewOpen').click();await page.locator('#whatsNewCatalog[open]').waitFor();
   await page.getByText('Přehled se nyní nepodařilo načíst').waitFor();
   assert.match(await page.locator('.wn-empty').innerText(),/nepodařilo načíst/);
  });
 });
 test('Stage D '+engineName+' invalid/empty publication does not interrupt labs',{timeout:100000},async()=>{
  await withPage(engine,async(page)=>{
   await stub(page,{...published,latestAnnouncementSequence:0});
   await page.goto(base);await page.locator('#skillChooser:not([hidden])').waitFor();
   assert.equal(await page.locator('#whatsNewPrompt').evaluate(el=>el.open),false);
   await page.unroute('**/language-skills-hub/data/teacher-changelog.json');
   await stub(page,{kind:'LSH_TEACHER_CHANGELOG_V1',schemaVersion:1,latestAnnouncementSequence:0,contentRevision:0,releases:[]});
   await page.reload();await page.locator('#skillChooser:not([hidden])').waitFor();
   assert.equal(await page.locator('#whatsNewPrompt').evaluate(el=>el.open),false);
  });
 });
}
