/* Real browser UI smoke tests with a LOCAL simulated Access context.
   These tests do NOT claim actual Cloudflare Access login or physical mobile UAT. */
import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {chromium,webkit} from 'playwright';
import worker from '../src/worker.mjs';
let server,origin;
const env={AUTHORIZED_TEACHERS:'teacher@school.example',
  STUDENT_BASE_URL:'https://ghrab-jazyky.github.io/zkusebni/'};
const ctx={access:{getIdentity:async()=>({email:'teacher@school.example'})}};
before(async()=>{
 server=http.createServer(async(req,res)=>{
  try{
   const path='https://teacher.school.example'+req.url;
   const response=await worker.fetch(new Request(path,{method:req.method}),env,ctx);
   res.writeHead(response.status,Object.fromEntries(response.headers.entries()));
   res.end(Buffer.from(await response.arrayBuffer()));
  }catch(error){res.writeHead(500,{'Content-Type':'text/plain'});res.end('Test server error: '+error.message);}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 origin='http://127.0.0.1:'+server.address().port;
});
after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));});
async function exercise(engine,label,size){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:size,acceptDownloads:true});
  const page=await context.newPage();
  const errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!r.url().startsWith(origin+'/'))external.push(r.url());});
  const response=await page.goto(origin+'/teacher/',{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);
  await page.waitForFunction(()=>document.querySelectorAll('#topics .topic').length===22);
  assert.match(await page.locator('#count').textContent(),/22 témat z 22/);
  await page.locator('#skill').selectOption('poslech');
  assert.equal(await page.locator('#topics .topic').count(),0);
  await page.locator('#skill').selectOption('cteni');
  assert.equal(await page.locator('#topics .topic').count(),1);
  assert.match(await page.locator('#topics').textContent(),/Fiktivní demo/);
  await page.locator('#skill').selectOption('konverzace');
  assert.equal(await page.locator('#topics .topic').count(),21);
  await page.locator('#search').fill('nemovitosti');
  assert.equal(await page.locator('#topics .topic').count(),1);
  await page.locator('#topics .topic button').click();
  assert.equal(await page.locator('#share').evaluate(el=>el.open),true);
  let url=new URL(await page.locator('#url').inputValue());
  assert.equal(url.origin,'https://ghrab-jazyky.github.io');
  assert.equal(url.pathname,'/zkusebni/konverzace/ceny-nemovitosti/');
  assert.equal(url.searchParams.get('lang'),'en');
  assert.equal(await page.locator('#qr svg').count(),1,'QR must render with zero external services');
  assert.match(await page.locator('#code').textContent(),/^[A-HJ-KM-NP-Z2-9]{4}-EN(?:A1|A2|B1|B2|C1|C2)$/);
  await page.locator('#shareLang').selectOption('es');
  await page.locator('#shareLevel').selectOption('C1');
  await page.locator('#lock').check();
  url=new URL(await page.locator('#url').inputValue());
  assert.equal(url.searchParams.get('lang'),'es');
  assert.equal(url.searchParams.get('level'),'C1');
  assert.equal(url.searchParams.get('zamek'),'1');
  assert.match(await page.locator('#code').textContent(),/^[A-HJ-KM-NP-Z2-9]{4}-ESC1Z$/);
  assert.equal(await page.locator('#qr svg').count(),1);
  assert.equal(await page.locator('#key').isHidden(),true,'No teacher key in pilot');
  assert.equal(await page.locator('#saveQR').isEnabled(),true);
  const box=await page.locator('#share').boundingBox();
  assert.ok(box&&box.x>=0&&box.x+box.width<=size.width+1,'Dialog fits viewport');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2),false,'No horizontal overflow');
  await page.locator('#close').click();
  assert.equal(await page.locator('#share').evaluate(el=>el.open),false);
  assert.deepEqual(errors,[],label+' JS errors');
  assert.deepEqual(external,[],label+' should use no external CDN or analytics');
  await context.close();
 }finally{await browser.close();}
}
test('teacher catalog: Chromium desktop full share, QR, filtering and content statuses',
 {timeout:120000},()=>exercise(chromium,'Chromium',{width:1440,height:900}));
test('teacher catalog: Chromium narrow Android-like viewport',
 {timeout:120000},()=>exercise(chromium,'Chromium narrow',{width:390,height:844}));
test('teacher catalog: WebKit iPhone-like viewport (engine simulation only)',
 {timeout:120000},()=>exercise(webkit,'WebKit narrow',{width:375,height:812}));
