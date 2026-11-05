/* E4D: synthetic Chromium/WebKit proof of shared offline nav module.
   No real Reading card source, student data, or teacher keys in repository. */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),SCRIPT=path.join(ROOT,'tools','patch_nav.py');
const SOURCE=path.join(ROOT,'tests','fixtures','e4d-nav-synthetic.html');
const original=fs.readFileSync(SOURCE,'utf8');
function patch(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-nav-e4d-'));
 const file=path.join(dir,'student.html');
 const run=cp.spawnSync('python3',[SCRIPT,SOURCE,file],{encoding:'utf8'});
 assert.equal(run.status,0,run.stderr);
 return {dir,file,text:fs.readFileSync(file,'utf8')};
}
test('E4D patcher preserves original HTML and disallows overwrites or duplicate injection',()=>{
 const p=patch();
 try{
  assert.equal(fs.readFileSync(SOURCE,'utf8'),original,'Patch must not change source');
  assert.equal(p.text.match(/const DATA=/g).length,1,'Data literal must not change');
  assert.equal(p.text.match(/reading-lab-vocabulary/g),null,'No storage bridge added');
  assert.match(p.text,/rlReturnToQuestion/);
  assert.match(p.text,/#readingBody > p\[data-num\]/);
  let r=cp.spawnSync('python3',[SCRIPT,p.file,path.join(p.dir,'again.html')],{encoding:'utf8'});
  assert.notEqual(r.status,0,'Repeated installation must fail');
  r=cp.spawnSync('python3',[SCRIPT,SOURCE,SOURCE],{encoding:'utf8'});
  assert.notEqual(r.status,0,'Overwriting source must fail');
 }finally{fs.rmSync(p.dir,{recursive:true,force:true});}
});
async function exercise(engine,name,viewport){
 const p=patch();
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const requests=[];page.on('request',r=>requests.push(r.url()));
  await page.setContent(p.text,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.rlNavigation==='2.2');
  assert.deepEqual(await page.locator('#readingBody > p[data-num]').evaluateAll(els=>els.map(el=>el.dataset.num)),['1','2','3']);
  assert.equal(await page.locator('#readingBody p').first().evaluate(el=>el.textContent.includes('Opening paragraph')),true);
  assert.match(await page.locator('#readingBody p').first().evaluate(el=>getComputedStyle(el,'::before').content),/1/);
  assert.equal(await page.locator('#rlReturnToQuestion').isHidden(),true);

  // Show target first, then switch tabs, return to exact question and restore focus.
  await page.locator('button[data-locate="q1"]').click();
  assert.equal(await page.locator('#rlReturnToQuestion').isVisible(),true);
  assert.match(await page.locator('#rlReturnToQuestion').textContent(),/Back to question 1 \/ 3/);
  await page.locator('#skillTabs button[data-skill="detail"]').click();
  assert.equal(await page.locator('#rlReturnToQuestion').isVisible(),true);
  await page.locator('#rlReturnToQuestion').click();
  assert.equal(await page.locator('#skillTabs button[data-skill="gist"]').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('#rlReturnToQuestion').isHidden(),true);
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.question),'q1');

  // Evidence click, keyboard target and dictionary precedence.
  await page.locator('button[data-evidence="q2"]').click();
  assert.equal(await page.locator('#rlReturnToQuestion').isVisible(),true);
  await page.locator('.evidence-hit').first().click();
  assert.equal(await page.locator('#rlReturnToQuestion').isHidden(),true);
  await page.locator('button[data-locate="q1"]').click();
  await page.locator('.reading-target').first().focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#rlReturnToQuestion').isHidden(),true);
  await page.locator('button[data-evidence="q1"]').click();
  await page.locator('#dictionaryToggle').click();
  assert.equal(await page.locator('#dictionaryToggle').getAttribute('aria-pressed'),'true');
  await page.locator('.evidence-hit').first().click();
  assert.equal(await page.locator('#rlReturnToQuestion').isVisible(),true,'Dictionary ON must prevent return via passage');
  await page.locator('#dictionaryToggle').click();
  await page.locator('.evidence-hit').first().click();
  assert.equal(await page.locator('#rlReturnToQuestion').isHidden(),true);
  await page.locator('button[data-evidence="q1"]').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#rlReturnToQuestion').isHidden(),true);

  // Language/level changes clear navigation and keep paragraph numbers valid.
  await page.locator('button[data-evidence="q1"]').click();
  await page.locator('#language').selectOption('de');
  assert.equal(await page.locator('#rlReturnToQuestion').isHidden(),true);
  await page.locator('button[data-locate="q1"]').click();
  assert.match(await page.locator('#rlReturnToQuestion').textContent(),/Zurück zur Frage/);
  await page.locator('#levels button[data-level="A1"]').click();
  assert.equal(await page.locator('#rlReturnToQuestion').isHidden(),true);
  assert.deepEqual(await page.locator('#readingBody > p[data-num]').evaluateAll(els=>els.map(x=>x.dataset.num)),['1','2','3']);
  await page.locator('button[data-evidence="q1"]').click();
  const geometry=await page.locator('#rlReturnToQuestion').boundingBox();
  assert.ok(geometry&&geometry.x>=0&&geometry.x+geometry.width<=viewport.width+1,'Floating button must fit viewport');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[],name+' page errors');
  assert.deepEqual(requests,[],name+' unexpected external requests');
  await context.close();
 }finally{await browser.close();fs.rmSync(p.dir,{recursive:true,force:true});}
}
test('E4D Chromium desktop: numbering, target/evidence, multi-tab, focus, keyboard', {timeout:120000},
 ()=>exercise(chromium,'Chromium',{width:1440,height:900}));
test('E4D Chromium mobile: same module, single column, no overflow', {timeout:120000},
 ()=>exercise(chromium,'Chromium mobile',{width:375,height:812}));
test('E4D WebKit mobile: keyboard/dictionary/translation and cross-tab return', {timeout:120000},
 ()=>exercise(webkit,'WebKit',{width:390,height:844}));
