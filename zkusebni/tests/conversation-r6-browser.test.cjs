/* R6 Conversation candidates – full real-DOM browser regression.
 * Isolated draft-only QA: no deployment, no teacher keys, no student tracking.
 * 21 candidates x 24 variants x 8 stations per browser engine.
 */
'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const STAGE=path.join(ROOT,'zkusebni');
const MANIFEST=JSON.parse(fs.readFileSync(path.join(STAGE,'data/conversation-r6-candidates.json'),'utf8'));
assert.equal(MANIFEST.status,'CANDIDATES_ONLY');
assert.equal(MANIFEST.teacherApproval,false);
assert.equal(MANIFEST.published,false);
assert.equal(MANIFEST.catalogUpdated,false);
assert.equal(MANIFEST.cards.length,21);
const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
const ENGINE=process.env.LSH_R6_ENGINE||'chromium';
assert.ok(['chromium','webkit'].includes(ENGINE));
const engine=ENGINE==='webkit'?webkit:chromium;
const VIEWPORT=ENGINE==='webkit'?{width:390,height:844}:{width:412,height:915};
let server,origin;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
before(async()=>{
 server=http.createServer((req,res)=>{
  let p;
  try{p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}
  catch{res.writeHead(400);res.end();return}
  const file=path.resolve(ROOT,'.'+p);
  if(!file.startsWith(ROOT+path.sep)||!file.startsWith(STAGE+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(file,(err,body)=>{
   if(err){res.writeHead(404);res.end();return}
   res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream',
    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body);
  });
 });
 await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
 origin='http://127.0.0.1:'+server.address().port;
});
after(async()=>{if(server)await new Promise(resolve=>server.close(resolve))});
for(const card of MANIFEST.cards){
 test(ENGINE+' full 24-variant/8-station UI: '+card.id,{timeout:180000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:VIEWPORT,serviceWorkers:'block'});
   const page=await context.newPage();
   page.setDefaultTimeout(16000);
   const errors=[],outside=[],badResponses=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('request',r=>{if(!r.url().startsWith(origin+'/'))outside.push(r.url())});
   page.on('response',r=>{if(r.url().startsWith(origin+'/')&&r.status()>=400)badResponses.push(r.url()+' '+r.status())});
   const url=origin+'/zkusebni/'+card.candidatePath;
   const locked=await page.goto(url+'?lang=es&level=A1&zamek=1',{waitUntil:'domcontentloaded',timeout:45000});
   assert.ok(locked&&locked.ok(),'R6 candidate must open by teacher-fixed URL');
   await page.locator('#languageSelect:disabled').waitFor();
   assert.equal(await page.locator('#languageSelect').inputValue(),'es','Teacher language lock not honoured');
   assert.equal(await page.locator('#levelSwitch button.active').getAttribute('data-level'),'A1');
   assert.equal(await page.locator('#levelSwitch button:not([disabled])').count(),0,'CEFR buttons unlocked');
   assert.ok(await page.locator('#mainQuestion').innerText(),'Locked candidate rendered no main question');
   assert.equal(await page.locator('#sectionNav button').count(),8);
   const unlocked=await page.goto(url+'?lang=en&level=B1',{waitUntil:'domcontentloaded',timeout:45000});
   assert.ok(unlocked&&unlocked.ok(),'Free-mode candidate must load');
   await page.locator('#languageSelect:not([disabled])').waitFor();
   assert.equal(await page.locator('#levelSwitch button:not([disabled])').count(),6);
   await page.locator('#lshBridgeVocabularyLink').waitFor();
   const stats=await page.evaluate(({langs,levels,topic})=>{
    const problems=[],squish=x=>String(x||'').replace(/\s+/g,' ').trim();
    let variants=0,stationRenders=0;
    const fail=(place,message)=>problems.push(place+': '+message);
    if(document.documentElement.dataset.lshTopicId!==topic)fail('root','Wrong embedded topic ID');
    for(const l of langs)for(const lev of levels){
     try{switchVariant(l,lev)}
     catch(e){fail(l+'/'+lev,'switchVariant failed '+String(e));continue}
     const currentData=CONTENT[l].levels[lev];
     if(document.getElementById('languageSelect').value!==l)fail(l+'/'+lev,'Language selector mismatch');
     const active=document.querySelector('#levelSwitch button.active');
     if(!active||active.dataset.level!==lev)fail(l+'/'+lev,'Active CEFR mismatch');
     if(document.querySelectorAll('#vocabGrid .vocab-item').length!==12)fail(l+'/'+lev,'Expected 12 vocabulary entries');
     if(document.querySelectorAll('#toolkitGrid .vocab-item').length!==4)fail(l+'/'+lev,'Expected 4 language supports');
     if(document.querySelectorAll('#sectionNav button').length!==8)fail(l+'/'+lev,'Expected 8 station navigation buttons');
     for(let i=0;i<8;i++){
      const where=l+'/'+lev+'/station'+(i+1),v=currentData.stations[i];
      try{goTo(i,{scroll:false})}
      catch(e){fail(where,'goTo failed '+String(e));continue}
      if(document.getElementById('stationTitle').textContent!==v.title)fail(where,'Station heading not rendered');
      const target=squish(document.getElementById('mainQuestion').textContent);
      if(target!==squish(v.main))fail(where,'Main prompt differs from source data');
      const questions=[...document.querySelectorAll('#questions .question-text')].map(x=>squish(x.textContent));
      if(questions.length!==3||questions.some((x,j)=>x!==squish(v.questions[j])))
       fail(where,'One of three follow-up prompts differs from source data');
      if(document.querySelectorAll('#supportList li').length!==v.support.length)
       fail(where,'Support list not rendered');
      if(Number(document.getElementById('stationNum').textContent)!==i+1)fail(where,'Current station indicator invalid');
      if(document.getElementById('previousBtn').disabled!==(i===0))fail(where,'Previous navigation state invalid');
      if(document.getElementById('nextBtn').disabled!==(i===7))fail(where,'Next navigation state invalid');
      stationRenders++;
     }
     variants++;
    }
    const viewport={innerWidth,scrollWidth:document.documentElement.scrollWidth};
    return {variants,stationRenders,problems,viewport};
   },{langs:LANGS,levels:LEVELS,topic:card.id});
   assert.equal(stats.variants,24,card.id+' variants');
   assert.equal(stats.stationRenders,192,card.id+' station render count');
   assert.deepEqual(stats.problems,[],card.id+' per-station source-to-DOM mismatches');
   assert.ok(stats.viewport.scrollWidth<=stats.viewport.innerWidth+8,
     card.id+' horizontal viewport overflow: '+JSON.stringify(stats.viewport));
   await page.locator('#languageSelect').selectOption('es');
   await page.locator('#levelSwitch button[data-level="B2"]').click();
   assert.equal(await page.locator('#languageSelect').inputValue(),'es');
   assert.equal(await page.locator('#levelSwitch button.active').getAttribute('data-level'),'B2');
   await page.locator('#sectionNav button').first().click();
   await page.locator('#nextBtn').click();
   assert.equal((await page.locator('#stationNum').innerText()).trim(),'2');
   await page.locator('#previousBtn').click();
   assert.equal((await page.locator('#stationNum').innerText()).trim(),'1');
   await page.locator('#supportBtn').click();
   assert.equal(await page.locator('#supportReveal').isVisible(),true,'Support click failed');
   await page.locator('#supportBtn').click();
   assert.equal(await page.locator('#supportReveal').isVisible(),false,'Support hide failed');
   await page.locator('#challengeBtn').click();
   assert.equal(await page.locator('#challengeReveal').isVisible(),true,'Challenge click failed');
   await page.locator('#stretchBtn').click();
   assert.equal(await page.locator('#stretchReveal').isVisible(),true,'Stretch click failed');
   const explain=page.locator('#mainExplainBtn');
   if(await explain.isVisible()){
    await explain.click();assert.equal(await page.locator('#mainExplainPanel').isVisible(),true);
   }
   const beforeTheme=await page.locator('html').getAttribute('data-theme');
   await page.locator('#themeBtn').click();
   assert.notEqual(await page.locator('html').getAttribute('data-theme'),beforeTheme);
   await page.locator('#resetBtn').click();
   assert.equal((await page.locator('#stationNum').innerText()).trim(),'1');
   const width=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
   assert.ok(width.scrollWidth<=width.innerWidth+8,card.id+' mobile overflow after interaction '+JSON.stringify(width));
   assert.deepEqual(errors,[],'Client JavaScript exceptions');
   assert.deepEqual(outside,[],'Unexpected external requests');
   assert.deepEqual(badResponses,[],'Missing local CSS/JS dependency');
   await context.close();
  }finally{await browser.close()}
 });
}
