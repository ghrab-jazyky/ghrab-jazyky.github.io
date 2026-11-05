/* LSH E3C real Chromium smoke tests against a local HTTP server.
   GitHub Actions: npm install --no-save playwright@1.56.1
   python3 -m http.server 8765 --bind 127.0.0.1 &
   node --test zkusebni/tests/e3c.browser.test.cjs
   Does NOT emulate real Safari/iOS persistent-storage behavior. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const ORIGIN=process.env.LSH_TEST_ORIGIN||'http://127.0.0.1:8765';
const CARD=ORIGIN+'/zkusebni/konverzace/ceny-nemovitosti/';
function screenshotPath(name){
  const dir=path.join(process.cwd(),'qa');
  fs.mkdirSync(dir,{recursive:true});
  return path.join(dir,name);
}
test('E3C Chromium E2 catalog, 2 saving sources, IDB, filter, return link and temporary fallback',
  {timeout:180000},async()=>{
  const browser=await chromium.launch({headless:true});
  const errors=[];
  let context,limited;
  try{
    context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    const c=await page.goto(ORIGIN+'/zkusebni/konverzace/',{waitUntil:'domcontentloaded'});
    assert.ok(c&&c.ok(),'Catalog HTTP');
    await page.waitForFunction(()=>document.querySelectorAll('#topicList .topic-card').length===21);
    const first=page.locator('#topicList .topic-card').first();
    await first.locator('button').filter({hasText:'Sdílet studentům'}).click();
    await page.locator('#shareDialog[open]').waitFor({state:'visible'});
    const url=await page.locator('#shareUrl').inputValue();
    assert.ok(url.startsWith(ORIGIN+'/zkusebni/konverzace/'),url);
    await page.locator('#qrSlot svg').waitFor({state:'visible'});
    const code=await page.locator('#shareShortCode').textContent();
    assert.ok(/^[A-Z23456789]{4}-/.test(code),'Short code: '+code);
    await page.locator('#shareClose').click();
    const response=await page.goto(CARD,{waitUntil:'domcontentloaded'});
    assert.ok(response&&response.ok(),'Card HTTP');
    await page.locator('#lshBridgeVocabularyLink').waitFor({state:'visible',timeout:15000});
    await page.waitForFunction(()=>document.querySelectorAll('#vocabGrid .lsh-bridge-save').length===12);
    await page.screenshot({path:screenshotPath('e3c-conversation-390-dark.png'),fullPage:true});
    const firstTerm=(await page.locator('#vocabGrid .vocab-item b').first().textContent()).trim();
    await page.locator('#vocabGrid .vocab-item .lsh-bridge-save').first().click();
    await page.waitForFunction(()=>document.querySelector('#vocabGrid .vocab-item .lsh-bridge-itemstatus')?.textContent?.includes('Saved in this browser.'));
    await page.waitForFunction(()=>document.querySelector('#lshBridgeVocabularyLink')?.textContent?.includes('(1)'));
    // Saving another word while offline still works because it is local IndexedDB.
    await context.setOffline(true);
    await page.locator('#vocabGrid .vocab-item .lsh-bridge-save').nth(1).click();
    await page.waitForFunction(()=>document.querySelector('#lshBridgeVocabularyLink')?.textContent?.includes('(2)'));
    await context.setOffline(false);
    await page.locator('#lshBridgeVocabularyLink').click();
    await page.waitForURL('**/zkusebni/slovnicek/**');
    await page.waitForFunction(()=>document.querySelector('#wordCount')?.textContent==='2');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#wordCount')?.textContent==='2');
    await page.screenshot({path:screenshotPath('e3c-vocabulary-390-dark.png'),fullPage:true});
    const back=page.locator('#backToCard');
    await back.waitFor({state:'visible'});
    assert.ok((await back.getAttribute('href')).includes('/zkusebni/konverzace/ceny-nemovitosti/'));
    await back.click();
    await page.waitForURL(CARD);
    await page.locator('#lshBridgeVocabularyLink').waitFor({state:'visible'});
    await page.locator('#languageSelect').selectOption('es');
    await page.locator('#levelSwitch button[data-level="A2"]').click();
    await page.waitForFunction(()=>document.querySelectorAll('#vocabGrid .lsh-bridge-save').length===12);
    assert.equal(await page.locator('#languageSelect').inputValue(),'es');
    // Offline dictionary on desktop is triggered by double-click on a vocabulary term.
    await page.locator('#vocabGrid .vocab-item b').first().dblclick();
    await page.locator('#lookupPopover').waitFor({state:'visible',timeout:8000});
    await page.locator('#lshBridgeSavePopup').click();
    await page.waitForFunction(()=>document.querySelector('.lsh-bridge-popstatus')?.textContent?.length>0);
    const popupStatus=(await page.locator('.lsh-bridge-popstatus').textContent()).trim();
    assert.ok(!popupStatus.includes('Could not save')&&!popupStatus.includes('No se pudo'),popupStatus);
    await page.setViewportSize({width:320,height:640});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert.ok(overflow<=2,'Unexpected horizontal overflow '+overflow);
    await page.screenshot({path:screenshotPath('e3c-conversation-320.png'),fullPage:true});
    // Failed IndexedDB must be visible as a temporary-only state, never "saved".
    limited=await browser.newContext({viewport:{width:390,height:844}});
    const limitedPage=await limited.newPage();
    limitedPage.on('pageerror',e=>errors.push(e.message));
    await limitedPage.addInitScript(()=>{
      Object.defineProperty(window,'indexedDB',{configurable:true,value:null});
    });
    await limitedPage.goto(CARD,{waitUntil:'domcontentloaded'});
    await limitedPage.locator('#lshBridgeVocabularyLink').waitFor({state:'visible'});
    await limitedPage.waitForFunction(()=>!document.querySelector('#lshBridgeStatus').hidden);
    assert.match((await limitedPage.locator('#lshBridgeStatus').textContent()),/storage unavailable/i);
    await limitedPage.locator('#vocabGrid .vocab-item .lsh-bridge-save').first().click();
    await limitedPage.waitForFunction(()=>document.querySelector('.lsh-bridge-itemstatus')?.textContent?.includes('Temporary only!'));
    assert.deepEqual(errors,[],'Unexpected JS errors: '+errors.join('; '));
    assert.ok(firstTerm.length>0);
  }finally{
    if(context)await context.close();
    if(limited)await limited.close();
    await browser.close();
  }
});
