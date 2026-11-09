#!/usr/bin/env node
/* R19 actual HTTP/browser behavior on desktop, 320px Android and WebKit mobile.
 * No external services or original student content modifications. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require('playwright');
const site=path.resolve(__dirname,'../../language-skills-hub');
let server=null,origin='';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
test.before(async()=>{
 server=http.createServer((req,res)=>{
  let p;
  try{p=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}
  catch(_){res.writeHead(400);res.end();return}
  if(p.endsWith('/'))p+='index.html';
  const full=path.resolve(site,'.'+p);
  if(!full.startsWith(site+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(full,(err,buf)=>{
   if(err){res.writeHead(404);res.end();return}
   res.writeHead(200,{'Content-Type':types[path.extname(full)]||'application/octet-stream','Cache-Control':'no-store'});
   res.end(buf);
  });
 });
 await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
 origin='http://127.0.0.1:'+server.address().port+'/';
});
test.after(async()=>{if(server)await new Promise(resolve=>server.close(resolve))});
async function start(engine,width,{reducedMotion=false}={}){
 const browser=await engine.launch({headless:true});
 const ctx=await browser.newContext({viewport:{width,height:width<=390?740:900},
  locale:'cs-CZ',serviceWorkers:'block'});
 await ctx.route(/^https?:/,route=>{
  if(new URL(route.request().url()).origin===new URL(origin).origin)return route.continue();
  return route.abort('internetdisconnected');
 });
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.setDefaultTimeout(15000);
 if(reducedMotion)await page.emulateMedia({reducedMotion:'reduce'});
 return {browser,ctx,page,errors};
}
async function noOverflow(page,label){
 const x=await page.evaluate(()=>({
  inner:innerWidth,document:document.documentElement.scrollWidth,
  body:document.body.scrollWidth,welcome:document.getElementById('welcome').scrollWidth
 }));
 assert.ok(x.document<=x.inner+8&&x.body<=x.inner+8&&x.welcome<=x.inner+8,
  'R19 horizontal overflow '+label+': '+JSON.stringify(x));
}
test('R19 Chromium: 3-second splash, 3 panels, optional filters, QR and history',{timeout:150000},async()=>{
 const {browser,ctx,page,errors}=await start(chromium,1366);
 try{
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(await page.locator('#welcome').isVisible(),true);
  assert.equal(await page.locator('#catalog').isVisible(),false);
  assert.equal(await page.locator('#skillChooser').isVisible(),false);
  assert.equal(await page.locator('header').evaluate(el=>el.inert),true);
  await page.waitForTimeout(1200);
  assert.equal(await page.locator('#skillChooser').isVisible(),false,'Chooser appeared before three seconds');
  await page.locator('#skillChooser').waitFor({state:'visible',timeout:5500});
  assert.equal(await page.locator('.chooser-choice').count(),3);
  assert.equal(await page.locator('[data-choose-skill="konverzace"]').count(),1);
  await page.locator('[data-choose-skill="konverzace"]').click();
  await page.locator('article.card').first().waitFor();
  assert.equal(await page.locator('#welcome').isVisible(),false);
  assert.equal(await page.locator('#catalog').isVisible(),true);
  assert.equal(await page.locator('header').evaluate(el=>el.inert),false);
  assert.equal(await page.locator('article.card').count(),21);
  assert.equal(await page.locator('#language').inputValue(),'all');
  assert.equal(await page.locator('#level').inputValue(),'all');
  assert.match(page.url(),/[?&]skill=konverzace/);
  const school=page.locator('article.card[data-topic-id="cl-skola"]');
  let link=await school.locator('a.action.primary').getAttribute('href');
  assert.match(link,/\?practice=1$/);
  assert.doesNotMatch(link,/zamek=1|lang=|level=/);
  await page.locator('#language').selectOption('es');
  assert.equal(await page.locator('article.card').count(),21);
  link=await school.locator('a.action.primary').getAttribute('href');
  assert.match(link,/practice=1&lang=es$/);
  assert.doesNotMatch(link,/zamek=1/);
  await page.locator('#level').selectOption('B2');
  link=await school.locator('a.action.primary').getAttribute('href');
  assert.match(link,/practice=1&lang=es&level=B2&zamek=1$/);
  await school.getByRole('button',{name:/QR kód/}).click();
  await page.locator('#qrMount svg').waitFor();
  assert.match(await page.locator('#qrUrl').innerText(),/lang=es&level=B2&zamek=1/);
  await page.locator('#qrClose').click();
  await page.locator('#changeLab').click();
  await page.locator('#skillChooser').waitFor({state:'visible'});
  await page.locator('[data-choose-skill="cteni"]').click();
  assert.equal(await page.locator('article.card').count(),5);
  assert.equal(await page.locator('#language').inputValue(),'all');
  assert.equal(await page.locator('#level').inputValue(),'all');
  assert.equal(await page.locator('#heading').innerText(),'Reading Lab');
  await page.locator('#language').selectOption('fr');
  await page.locator('#level').selectOption('C2');
  const reading=page.locator('article.card[data-topic-id="rl-email-friend"]');
  const url=await reading.locator('a.action.primary').getAttribute('href');
  assert.match(url,/r11\/variant-copies\/rl-email-friend\.html\?practice=1&lang=fr&level=C2&zamek=1$/);
  // Back navigates to the previously selected skill with its retained filters.
  await page.goBack({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#heading').textContent==='Conversation Lab');
  assert.equal(await page.locator('article.card').count(),21);
  assert.equal(await page.locator('#language').inputValue(),'es');
  assert.equal(await page.locator('#level').inputValue(),'B2');
  await page.goForward({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#heading').textContent==='Reading Lab');
  assert.equal(await page.locator('article.card').count(),5);
  await noOverflow(page,'desktop');
  assert.deepEqual(errors,[]);
  await ctx.close();
 }finally{await browser.close()}
 console.log('PASS R19 Chromium: timed chooser, 21/5 filters, all/free links, fixed R7, QR, history');
});
test('R19 Chromium 320px: skip, Escape and listening-only language options',{timeout:110000},async()=>{
 const {browser,ctx,page,errors}=await start(chromium,320,{reducedMotion:true});
 try{
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#skillChooser').waitFor({state:'visible'});
  await noOverflow(page,'320px chooser');
  assert.equal(await page.locator('.chooser-choice').count(),3);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#skillChooser').isVisible(),false);
  assert.equal(await page.locator('#welcome').isVisible(),true);
  await page.locator('#skipIntro').click();
  await page.locator('#skillChooser').waitFor({state:'visible'});
  await page.locator('[data-choose-skill="poslech"]').click();
  assert.equal(await page.locator('article.card').count(),3);
  assert.equal(await page.locator('#language').inputValue(),'all');
  assert.equal(await page.locator('#language option').count(),2);
  assert.equal(await page.locator('#language option[value="en"]').count(),1);
  assert.equal(await page.locator('#language option[value="es"]').count(),0);
  await page.locator('#language').selectOption('en');
  assert.equal(await page.locator('article.card').count(),3);
  await page.locator('#themeToggle').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
  assert.equal(await page.locator('#fullscreenToggle').count(),1);
  await noOverflow(page,'320px catalog');
  assert.deepEqual(errors,[]);
  await ctx.close();
 }finally{await browser.close()}
 console.log('PASS R19 Chromium 320px: keyboard, skip, 3 listening cards, available languages, R18 theme');
});
test('R19 WebKit mobile: accessible 3-panel popup, reading and deep-link bypass',{timeout:120000},async()=>{
 const {browser,ctx,page,errors}=await start(webkit,390,{reducedMotion:true});
 try{
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#skillChooser').waitFor({state:'visible',timeout:12000});
  await noOverflow(page,'390px popup');
  await page.locator('[data-choose-skill="cteni"]').click();
  assert.equal(await page.locator('article.card').count(),5);
  await page.locator('#search').fill('Asteroids');
  assert.equal(await page.locator('article.card').count(),1);
  await page.locator('#search').fill('');
  assert.equal(await page.locator('article.card').count(),5);
  await page.locator('#changeLab').click();
  await page.locator('[data-choose-skill="konverzace"]').click();
  assert.equal(await page.locator('article.card').count(),21);
  await noOverflow(page,'390px catalog');
  await page.goto(origin+'?skill=cteni&lang=de&level=C1',{waitUntil:'domcontentloaded'});
  await page.locator('article.card').first().waitFor();
  assert.equal(await page.locator('#welcome').isVisible(),false,'Deep link must bypass timed intro');
  assert.equal(await page.locator('#language').inputValue(),'de');
  assert.equal(await page.locator('#level').inputValue(),'C1');
  assert.equal(await page.locator('article.card').count(),5);
  await noOverflow(page,'390px deep link');
  assert.deepEqual(errors,[]);
  await ctx.close();
 }finally{await browser.close()}
 console.log('PASS R19 WebKit 390px: modal, optional search, navigation, deep link and overflow');
});
