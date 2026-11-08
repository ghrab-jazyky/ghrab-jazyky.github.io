/* R7 Reading: browser QA of isolated, unpublished two-card HTML candidates.
 * Checks actual corrected matching evidence, UI interactions, all 24 CEFR/language
 * combinations per card and engine, mobile width, and absence of external traffic.
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
const work=fs.mkdtempSync(path.join(process.env.RUNNER_TEMP||os.tmpdir(),'lsh-r7-reading-browser-'));
execFileSync(process.execPath,[path.join(root,'tools/reading-r7-candidates.cjs'),work],{timeout:120000});
const manifest=JSON.parse(fs.readFileSync(path.join(work,'R7_CANDIDATES_MANIFEST.json'),'utf8'));
assert.equal(manifest.cards.length,2);
assert.equal(manifest.teacherApproval,false);
assert.equal(manifest.approvedForRelease,false);
const cards=manifest.cards.map(c=>({id:c.topicId,file:c.candidateFile,patch:c.repairedQuestions[0]}));
assert.equal(cards.reduce((n,c)=>n+manifest.cards.find(x=>x.topicId===c.id).repairedQuestions.length,0),16);
const counts={A1:9,A2:9,B1:12,B2:18,C1:21,C2:21};
const langs=['en','es','de','fr'],levels=Object.keys(counts);
let server,origin;
test.before(async()=>{
 server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).replace(/^\/+/,'');
  if(!cards.some(c=>c.file===name)){res.writeHead(404);res.end();return}
  fs.readFile(path.join(work,name),(error,body)=>{
   if(error){res.writeHead(404);res.end();return}
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8',
    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   res.end(body);
  });
 });
 await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
 origin='http://127.0.0.1:'+server.address().port;
});
test.after(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 fs.rmSync(work,{recursive:true,force:true});
});
for(const [engine,engineName] of [[chromium,'Chromium'],[webkit,'WebKit']]){
 for(const viewport of [{width:1366,height:850},{width:390,height:844}]){
  for(const card of cards){
   test(engineName+' '+viewport.width+'px '+card.id+' R7 matching, 24 variants, privacy', {timeout:180000},async()=>{
    const browser=await engine.launch({headless:true});
    try{
     const context=await browser.newContext({viewport,serviceWorkers:'block'});
     const page=await context.newPage();
     page.setDefaultTimeout(25000);
     const errors=[],outside=[];
     page.on('pageerror',e=>errors.push(String(e)));
     page.on('request',r=>{if(!r.url().startsWith(origin+'/'))outside.push(r.url())});
     const patch=card.patch;
     assert.ok(patch&&langs.includes(patch.language)&&levels.includes(patch.level));
     const response=await page.goto(origin+'/'+card.file+'?lang='+patch.language+'&level='+patch.level,
      {waitUntil:'domcontentloaded',timeout:40000});
     assert.ok(response&&response.ok(),'Reading candidate must load by direct URL');
     await page.locator('#skillTabs button').first().waitFor();
     assert.equal(await page.locator('#language').inputValue(),patch.language);
     assert.equal(await page.locator('#levelMeta').innerText(),patch.level);
     assert.equal(await page.locator('#dictionaryToggle').getAttribute('aria-pressed'),'false');
     const amended=await page.evaluate(questionId=>{
      const d=DATA[state.language][state.level],q=d.questions.find(x=>x.id===questionId);
      return {question:q&&{id:q.id,tab:q.tab,answer:q.answer,evidence:q.evidence},
       matches:d.questions.filter(x=>x.kind==='match').map(x=>x.answer)};
     },patch.questionId);
     assert.ok(amended.question&&amended.question.evidence.length>0,'Missing repaired question/evidence');
     assert.equal(amended.question.answer,2,'Repaired question must point to paragraph 3');
     assert.equal(new Set(amended.matches).size,3,'Three matching prompts must target distinct paragraphs');
     await page.locator('#skillTabs button[data-skill="'+amended.question.tab+'"]').click();
     const selector='#questions .qcard[data-question="'+amended.question.id+'"]';
     await page.locator(selector+' input[type="radio"][value="2"]').check();
     await page.locator('#check').click();
     await page.locator(selector+' .verdict.good').waitFor({state:'visible'});
     await page.locator(selector+' button[data-evidence="'+amended.question.id+'"]').click();
     assert.ok(await page.locator('#readingBody .evidence-hit').count()>0,
      'Corrected evidence must be visibly highlighted in the text');
     await page.locator(selector+' input[type="radio"][value="1"]').check();
     assert.equal(await page.locator(selector+' .verdict:not([hidden])').count(),0,
      'Old grading must be cleared after editing an answer');
     assert.equal(await page.locator('#readingBody .evidence-hit').count(),0,
      'Previous evidence highlight must be invalidated');
     await page.locator('#dictionaryToggle').click();
     assert.equal(await page.locator('#dictionaryToggle').getAttribute('aria-pressed'),'true');
     await page.locator('#dictionaryToggle').click();
     assert.equal(await page.locator('#dictionaryToggle').getAttribute('aria-pressed'),'false');
     let visited=0;
     for(const lang of langs){
      await page.locator('#language').selectOption(lang);
      for(const level of levels){
       await page.locator('#levels button[data-level="'+level+'"]').click();
       const view=await page.evaluate(()=>({
        lang:state.language,level:state.level,questionCount:questions().length,
        uiCount:document.querySelectorAll('#skillTabs button').length,
        tabCount:tabs().length,paragraphs:document.querySelectorAll('#readingBody p').length,
        expectedParagraphs:curr().paragraphs.length,
        screen:innerWidth,scroll:document.documentElement.scrollWidth
       }));
       assert.equal(view.lang,lang,'Language did not switch');
       assert.equal(view.level,level,'CEFR level did not switch');
       assert.equal(view.questionCount,counts[level],lang+' '+level+' question count');
       assert.equal(view.uiCount,view.tabCount,'Visible strategy tabs mismatch');
       assert.equal(view.paragraphs,view.expectedParagraphs,'Reading paragraphs not rendered');
       assert.ok(view.scroll<=view.screen+8,'Horizontal overflow '+JSON.stringify(view));
       visited++;
      }
     }
     assert.equal(visited,24);
     assert.deepEqual(outside,[],'Unexpected external network requests');
     assert.deepEqual(errors,[],'JavaScript runtime errors');
     await context.close();
    }finally{await browser.close()}
   });
  }
 }
}
