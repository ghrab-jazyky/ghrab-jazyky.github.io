#!/usr/bin/env node
'use strict';
/* Simulated production origin over local Playwright route: no external network. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const ORIGIN='https://ghrab-jazyky.github.io';
const url=x=>ORIGIN+'/language-skills-hub/'+x;
function fakeGithubPages(page){
 return page.route(ORIGIN+'/**',route=>{
  const u=new URL(route.request().url()),relative=decodeURIComponent(u.pathname).replace(/^\/+/,'');
  let filename=path.resolve(root,relative);
  if(!filename.startsWith(root+path.sep))return route.fulfill({status:403,body:'Forbidden'});
  if(fs.existsSync(filename)&&fs.statSync(filename).isDirectory())filename=path.join(filename,'index.html');
  if(!fs.existsSync(filename))return route.fulfill({status:404,body:'Not found'});
  const type=filename.endsWith('.html')?'text/html; charset=utf-8':
   filename.endsWith('.js')?'text/javascript; charset=utf-8':
   filename.endsWith('.css')?'text/css; charset=utf-8':
   filename.endsWith('.json')?'application/json; charset=utf-8':
   filename.endsWith('.svg')?'image/svg+xml':
   filename.endsWith('.png')?'image/png':'application/octet-stream';
  return route.fulfill({status:200,contentType:type,body:fs.readFileSync(filename)});
 });
}
for(const [name,engine]of[['Chromium',chromium],['WebKit',webkit]]){
 test(name+' simulated GitHub Pages: catalog TEST shows modal while practice remains available',{timeout:60000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext();
   const page=await context.newPage();await fakeGithubPages(page);
   await page.goto(url('index.html?skill=cteni'),{waitUntil:'load'});
   await page.locator('#cards .card').first().waitFor();
   const testButton=page.locator('.card .action.test').first();
   assert.equal(await testButton.count(),1);
   await testButton.click();
   const dialog=page.locator('#lshTemporaryTestNotice');
   await dialog.waitFor({state:'visible'});
   assert.match(await dialog.innerText(),/Daniel/);
   await dialog.getByRole('button',{name:'Rozumím'}).click();
   assert.equal(await page.locator('#lshTemporaryTestNotice').count(),0);
   assert.ok(await page.locator('.card .action.primary').count()>0);
   await context.close();
  }finally{await browser.close()}
 });
 test(name+' simulated GitHub Pages: both direct teacher pages locked, local flag permits entry',{timeout:80000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const lab of ['reading','listening']){
    const path=lab==='reading'?
     'self-check/reading/teacher.html?topic=rl-asteroids&level=B2':
     'self-check/listening/teacher.html?topic=ll-sad&level=B2';
    const context=await browser.newContext();
    const page=await context.newPage();await fakeGithubPages(page);
    await page.goto(url(path),{waitUntil:'load'});
    const dialog=page.locator('#lshTemporaryTestNotice');
    await dialog.waitFor({state:'visible'});
    assert.equal(await page.locator('html').getAttribute('data-lsh-temporary-test-access'),'locked');
    await dialog.getByRole('button',{name:/Rozumím/}).click();
    await page.waitForURL('**/index.html?skill=*');
    await context.close();
    const dev=await browser.newContext();
    await dev.addInitScript(()=>localStorage.setItem('lsh:temporary-test-lock:developer:v1','enabled'));
    const developer=await dev.newPage();await fakeGithubPages(developer);
    await developer.goto(url(path),{waitUntil:'load'});
    await developer.locator('#confirmTest:enabled').waitFor();
    assert.equal(await developer.locator('#lshTemporaryTestNotice').count(),0);
    assert.equal(await developer.locator('html').getAttribute('data-lsh-temporary-test-access'),'developer');
    await dev.close();
   }
  }finally{await browser.close()}
 });
 test(name+' simulated GitHub Pages: practice keys available, test keys blocked, student pages unaffected',{timeout:80000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext(),page=await context.newPage();
   await fakeGithubPages(page);
   await page.goto(url('self-check/practice-answers/teacher.html?topic=rl-asteroids&skill=cteni&lang=en&level=B2&mode=test'),{waitUntil:'load'});
   await page.locator('#lshTemporaryTestNotice').waitFor({state:'visible'});
   assert.equal(await page.locator('#answerMode').inputValue(),'practice');
   assert.equal(await page.locator('#answerMode option[value="test"]').isDisabled(),true);
   await page.goto(url('self-check/reading/index.html?topic=rl-asteroids&lang=en&level=B2'),{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#lshTemporaryTestNotice').count(),0);
   await page.goto(url('self-check/listening/student.html?topic=ll-sad&level=B2'),{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#lshTemporaryTestNotice').count(),0);
   await context.close();
  }finally{await browser.close()}
 });
}
