#!/usr/bin/env node
/* R17 online-style static HTTP browser smoke: both desktop and mobile.
 * Stages a production export locally with zero students and no deployment.
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process'),{chromium,webkit}=require('playwright');
const STAGE=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r17-browser-'));
const raw=path.join(temp,'raw'),out=path.join(temp,'site');
for(const [script,args] of [
 ['r10-unified-review-bundle.cjs',[raw]],
 ['r11-review-matrix.cjs',[raw]],
 ['r17-production-export.cjs',[raw,out]]
])execFileSync(process.execPath,[path.join(STAGE,'tools',script),...args],{timeout:180000,stdio:'pipe'});
let server=null,origin='';
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml'};
test.before(async()=>{
 server=http.createServer((req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}
  catch{res.writeHead(400);res.end();return}
  if(pathname.endsWith('/'))pathname+='index.html';
  const file=path.resolve(out,'.'+pathname);
  if(!file.startsWith(out+path.sep)){res.writeHead(403);res.end();return}
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
test.after(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 fs.rmSync(temp,{recursive:true,force:true,maxRetries:3,retryDelay:100});
});
async function inspect(engine,label,width){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',x=>errors.push(String(x)));
  page.setDefaultTimeout(15000);
  const res=await page.goto(origin,{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(res.status(),200);
  await page.locator('article.card').first().waitFor();
  assert.equal(await page.locator('article.card').count(),29);
  assert.match(await page.locator('#summary').innerText(),/29 z 29/);
  const modes=[['konverzace',21],['cteni',5],['poslech',3]];
  for(const [name,count] of modes){
   await page.locator('.tab[data-skill="'+name+'"]').click();
   assert.equal(await page.locator('article.card').count(),count);
  }
  await page.locator('.tab[data-skill="konverzace"]').click();
  await page.locator('#language').selectOption('es');
  await page.locator('#level').selectOption('B1');
  const target=page.locator('article.card[data-topic-id="cl-skola"]');
  const link=await target.locator('a.action.primary').getAttribute('href');
  assert.match(link,/konverzace\/skola\/index.html\?lang=es&level=B1&zamek=1&practice=1$/);
  await target.getByRole('button',{name:/QR kód/}).click();
  assert.equal(await page.locator('#qrDialog').evaluate(el=>el.open),true);
  const qr=page.locator('#qrMount svg');
  await qr.waitFor();
  assert.match(await page.locator('#qrUrl').innerText(),/lang=es&level=B1/);
  assert.ok((await qr.locator('path').getAttribute('d')).length>800);
  await page.locator('#qrClose').click();
  await page.locator('.tab[data-skill="cteni"]').click();
  await page.locator('#language').selectOption('fr');
  await page.locator('#level').selectOption('C2');
  const email=page.locator('article.card[data-topic-id="rl-email-friend"]');
  const href=await email.locator('a.action.primary').getAttribute('href');
  assert.match(href,/r11\/variant-copies\/rl-email-friend\.html\?lang=fr&level=C2&zamek=1&practice=1$/);
  const readingResponse=await page.goto(href,{waitUntil:'domcontentloaded',timeout:45000});
  assert.equal(readingResponse.status(),200);
  await page.locator('#readingBody p').first().waitFor();
  assert.equal(await page.locator('#language').inputValue(),'fr');
  assert.equal(await page.locator('#levels button[aria-pressed="true"]').getAttribute('data-level'),'C2');
  assert.equal(errors.length,0,'JS page errors: '+errors.join(' | '));
  const dims=await page.evaluate(()=>({viewport:innerWidth,
   width:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)}));
  assert.ok(dims.width<=dims.viewport+8,'Horizontal scroll '+JSON.stringify(dims));
  await context.close();
 }finally{await browser.close()}
 console.log('PASS R17 '+label+' – 29 live-style cards, skill filters, fixed links, QR, R7 French C2, no page errors');
}
test('R17 Chromium desktop production catalog',{timeout:180000},()=>inspect(chromium,'Chromium',1366));
test('R17 WebKit mobile production catalog',{timeout:180000},()=>inspect(webkit,'WebKit',390));
