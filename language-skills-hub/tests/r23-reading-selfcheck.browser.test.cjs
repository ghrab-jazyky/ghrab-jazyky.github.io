#!/usr/bin/env node
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');

const root='http://127.0.0.1:8765/language-skills-hub/self-check/reading/index.html';
const cases=[
 {name:'Reading EN/B2 Asteroids, desktop',topic:'rl-asteroids',lang:'en',level:'B2',width:1280,height:900,count:18},
 {name:'Reading ES/B1 Mistakes, mobile',topic:'rl-can-mistakes',lang:'es',level:'B1',width:390,height:844,count:12}
];

for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 for(const item of cases){
  test(engineName+': '+item.name,async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:item.width,height:item.height}});
    const page=await context.newPage();
    const errors=[],posts=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',r=>{if(r.method()!=='GET')posts.push(r.method()+' '+r.url());});
    page.on('dialog',async dialog=>dialog.accept());
    const u=new URL(root);
    u.searchParams.set('topic',item.topic);
    u.searchParams.set('lang',item.lang);
    u.searchParams.set('level',item.level);
    const res=await page.goto(String(u),{waitUntil:'domcontentloaded',timeout:30000});
    assert.equal(res.status(),200);
    await page.waitForSelector('#workspace:not([hidden])',{timeout:30000});
    assert.equal(await page.locator('fieldset.question').count(),item.count);
    assert.equal(await page.locator('#resultDetails .review').count(),0);
    assert.equal(await page.locator('#results').isHidden(),true);
    assert.equal(await page.locator('#readingParagraphs .gap-marker').count(),1);
    const meta=await page.evaluate(()=>({
     overflow:document.documentElement.scrollWidth-window.innerWidth,
     language:document.documentElement.lang,
     version:document.getElementById('readingVariant').textContent,
     theme:document.documentElement.dataset.theme,
     notice:document.getElementById('securityNotice')
    }));
    assert.ok(meta.overflow<=2,'Horizontal overflow: '+meta.overflow);
    assert.equal(meta.language,item.lang);
    assert.ok(meta.version.includes(item.level));
    assert.equal(meta.notice,null,'No confusing public-answer notice for students');
    const first=page.locator('fieldset.question').first();
    await first.locator('input[type=radio]').first().check();
    assert.match(await page.locator('#counter').textContent(),new RegExp('1\\s*/\\s*'+item.count));
    await page.locator('#themeButton').click();
    assert.notEqual(await page.evaluate(()=>document.documentElement.dataset.theme),meta.theme);
    await page.locator('#submitButton').click();
    await page.waitForSelector('#results:not([hidden])');
    assert.equal(await page.locator('#resultDetails .review').count(),item.count);
    assert.equal(await page.locator('#submitButton').isDisabled(),true);
    assert.equal(await page.locator('fieldset.question input:not([disabled])').count(),0);
    assert.equal(posts.length,0,'Unexpected attempt upload/network write: '+posts);
    assert.deepEqual(errors,[],'Browser runtime errors: '+errors.join('; '));
    await context.close();
   }finally{await browser.close();}
  });
 }
}
