#!/usr/bin/env node
/* R20 browser localization: all 136 source-supported language/topic combinations.
 * Served over local HTTP in Chromium & mobile WebKit. No production writes.
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require('playwright');
const site=path.resolve(__dirname,'../../language-skills-hub');
const translations=JSON.parse(fs.readFileSync(path.join(site,'data/catalog-i18n.json'),'utf8')).entries;
let server,origin;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
test.before(async()=>{
 server=http.createServer((req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}
  catch(_){res.writeHead(400);res.end();return}
  if(pathname.endsWith('/'))pathname+='index.html';
  const file=path.resolve(site,'.'+pathname);
  if(!file.startsWith(site+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(file,(err,bytes)=>{
   if(err){res.writeHead(404);res.end();return}
   res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream',
    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   res.end(bytes);
  });
 });
 await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
 origin='http://127.0.0.1:'+server.address().port+'/';
});
test.after(async()=>{if(server)await new Promise(resolve=>server.close(resolve))});
async function setup(browserType,width,height=850){
 const browser=await browserType.launch({headless:true});
 const context=await browser.newContext({viewport:{width,height},locale:'cs-CZ',serviceWorkers:'block'});
 await context.route(/^https?:/,r=>new URL(r.request().url()).origin===new URL(origin).origin?r.continue():r.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.setDefaultTimeout(19000);
 return {browser,context,page,errors};
}
async function openSkill(page,skill,lang){
 const url=origin+'?skill='+skill+(lang&&lang!=='all'?'&lang='+lang:'');
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
 assert.equal(response.status(),200);
 await page.locator('article.card').first().waitFor();
 assert.equal(await page.locator('#welcome').isVisible(),false);
}
async function verifyCards(page,skill,locale){
 if(await page.locator('#language').inputValue()!==locale)
  await page.locator('#language').selectOption(locale);
 const found=await page.locator('article.card').evaluateAll(nodes=>nodes.map(node=>{
  const h=node.querySelector('h3'),summary=node.querySelector('.catalog-summary'),
   subtitle=node.querySelector('.catalog-czech');
  return {id:node.dataset.topicId,actualLanguage:node.dataset.catalogLanguage,
   title:h?.textContent,titleLanguage:h?.getAttribute('lang'),
   summary:summary?.textContent,summaryLanguage:summary?.getAttribute('lang'),
   subtitle:subtitle?.textContent||null,subtitleLanguage:subtitle?.getAttribute('lang')||null};
 }));
 const expectedCount=skill==='konverzace'?21:skill==='cteni'?5:3;
 assert.equal(found.length,expectedCount,skill+' '+locale);
 const lang=locale==='all'?'cs':locale;
 for(const card of found){
  const row=translations[card.id];
  assert.ok(row&&row[lang],'Missing '+card.id+'/'+lang);
  assert.equal(card.title,row[lang].title,card.id+' '+lang+' title');
  assert.equal(card.summary,row[lang].summary,card.id+' '+lang+' summary');
  assert.equal(card.titleLanguage,lang);
  assert.equal(card.summaryLanguage,lang);
  assert.equal(card.actualLanguage,lang);
  if(locale!=='all'&&row.cs.title!==row[lang].title){
   assert.equal(card.subtitle,'Česky: '+row.cs.title);
   assert.equal(card.subtitleLanguage,'cs');
  }else{
   assert.equal(card.subtitle,null);
  }
 }
 return found.length;
}
async function noOverflow(page,where){
 const d=await page.evaluate(()=>({screen:innerWidth,body:document.body.scrollWidth,
  root:document.documentElement.scrollWidth}));
 assert.ok(d.body<=d.screen+8&&d.root<=d.screen+8,'Horizontal overflow '+where+': '+JSON.stringify(d));
}
test('R20 Chromium: verify all 136 localized cards, Czech search and QR',{timeout:200000},async()=>{
 const {browser,context,page,errors}=await setup(chromium,1366,900);
 try{
  let checked=0;
  for(const skill of ['konverzace','cteni','poslech']){
   await openSkill(page,skill);
   const locales=skill==='poslech'?['all','en']:['all','en','es','de','fr'];
   for(const locale of locales){
    checked+=await verifyCards(page,skill,locale);
   }
  }
  assert.equal(checked,136);
  await openSkill(page,'cteni','fr');
  assert.equal(await page.locator('#language').inputValue(),'fr');
  await page.locator('#search').fill('asteroidy');
  assert.equal(await page.locator('article.card').count(),1);
  assert.equal(await page.locator('article.card h3').innerText(),'Astéroïdes');
  await page.locator('#search').fill('asteroides');
  assert.equal(await page.locator('article.card').count(),1);
  await page.locator('#search').fill('');
  await page.locator('#level').selectOption('C1');
  const asteroid=page.locator('article.card[data-topic-id="rl-asteroids"]');
  const fixed=await asteroid.locator('a.action.primary').getAttribute('href');
  assert.match(fixed,/practice=1&lang=fr&level=C1&zamek=1$/);
  await asteroid.getByRole('button',{name:/Sdílet se studenty/}).click();
  await page.locator('#shareFixed').check();
  await page.locator('#qrMount svg').waitFor();
  assert.equal(await page.locator('#qrTitle').innerText(),'Astéroïdes');
  assert.match(await page.locator('#qrUrl').inputValue(),/lang=fr&level=C1&zamek=1/);
  await page.locator('#qrClose').click();
  await page.locator('#language').selectOption('all');
  assert.equal(await page.locator('article.card[data-topic-id="rl-asteroids"] h3').innerText(),'Asteroidy');
  await page.locator('#themeToggle').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
  await page.locator('#changeLab').click();
  await page.locator('#skillChooser').waitFor({state:'visible'});
  await page.locator('[data-choose-skill="poslech"]').click();
  assert.equal(await page.locator('article.card').count(),3);
  assert.equal(await page.locator('#language option').count(),2);
  assert.equal(await page.locator('#language option[value="de"]').count(),0);
  await noOverflow(page,'desktop');
  assert.deepEqual(errors,[],'JS errors: '+errors.join('; '));
  await context.close();
 }finally{await browser.close()}
 console.log('PASS R20 Chromium desktop: all 136 localized variants + CZ search + QR + R18/R19 navigation');
});
test('R20 Chromium 320px: German long titles, language filters and responsive layout',{timeout:100000},async()=>{
 const {browser,context,page,errors}=await setup(chromium,320,740);
 try{
  await openSkill(page,'konverzace','de');
  assert.equal(await verifyCards(page,'konverzace','de'),21);
  await noOverflow(page,'320px German');
  await page.locator('#search').fill('nemovitosti');
  assert.equal(await page.locator('article.card').count(),1);
  assert.equal(await page.locator('article.card h3').innerText(),'Immobilienpreise im In- und Ausland');
  await page.locator('#search').fill('');
  await page.locator('#language').selectOption('fr');
  await noOverflow(page,'320px French');
  await page.locator('#language').selectOption('all');
  assert.equal(await page.locator('article.card[data-topic-id="cl-skola"] h3').innerText(),'Škola');
  assert.equal(await page.locator('article.card').count(),21);
  assert.deepEqual(errors,[]);
  await context.close();
 }finally{await browser.close()}
 console.log('PASS R20 Chromium narrow phone: 21 German/French cards, localized search, no overflow');
});
test('R20 WebKit 390px: Spanish/French and deep links, Czech default restored',{timeout:115000},async()=>{
 const {browser,context,page,errors}=await setup(webkit,390,844);
 try{
  await openSkill(page,'cteni','es');
  assert.equal(await verifyCards(page,'cteni','es'),5);
  assert.equal(await page.locator('article.card[data-topic-id="rl-asteroids"] h3').innerText(),'Asteroides');
  await page.locator('#language').selectOption('fr');
  assert.equal(await page.locator('article.card[data-topic-id="rl-can-mistakes"] h3').innerText(),
   'Les erreurs peuvent-elles nous aider à apprendre ?');
  await noOverflow(page,'390px French');
  await page.goto(origin+'?skill=cteni&lang=de&level=B2',{waitUntil:'domcontentloaded'});
  await page.locator('article.card').first().waitFor();
  assert.equal(await page.locator('#welcome').isVisible(),false);
  assert.equal(await page.locator('#language').inputValue(),'de');
  assert.equal(await page.locator('#level').inputValue(),'B2');
  assert.equal(await page.locator('article.card[data-topic-id="rl-email-friend"] h3').innerText(),
   'Eine E-Mail von einem Freund');
  await noOverflow(page,'390px German B2 deep link');
  await page.locator('#language').selectOption('all');
  assert.equal(await page.locator('article.card[data-topic-id="rl-email-friend"] h3').innerText(),'E-mail od přítele');
  assert.deepEqual(errors,[]);
  await context.close();
 }finally{await browser.close()}
 console.log('PASS R20 WebKit phone: Spanish/French/German/Czech labels, deep link and no overflow');
});
