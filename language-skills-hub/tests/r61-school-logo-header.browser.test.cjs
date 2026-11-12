#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/school-logo.png'));
const gitBlob=crypto.createHash('sha1')
 .update(Buffer.from('blob '+source.length+'\0')).update(source).digest('hex');
const base=process.env.LSH_R61_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const engines=process.env.LSH_R61_LIVE==='1'?[['Chromium',chromium]]:
 [['Chromium',chromium],['WebKit',webkit]];
test('R61 original official school logo is reused unchanged; semantics and brand names persist',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(root,'assets/hub.css'),'utf8');
 assert.equal(gitBlob,'0b23733540b01fe70f35feda45037b0cd2c995cb');
 assert.match(html,/<a class="brand" href="\.\/" aria-label="Language Skills Hub – úvod"><img class="brand-logo" src="assets\/school-logo\.png"/);
 assert.match(html,/<p class="welcome-brand"><img class="welcome-brand-logo" src="assets\/school-logo\.png"/);
 assert.match(html,/<span class="brand-name">LANGUAGE <em>SKILLS<\/em> HUB<\/span>/);
 assert.match(html,/<span class="welcome-brand-name">LANGUAGE <em>SKILLS<\/em> HUB<\/span>/);
 assert.match(css,/\.brand-logo,.welcome-brand-logo/);
 assert.match(css,/@media\(max-width:420px\)/);
 assert.equal((html.match(/src="assets\/school-logo\.png"/g)||[]).length,2);
});
function sanity(page){
 return page.evaluate(()=>{
  const brand=document.querySelector('.topbar .brand');
  const logo=document.querySelector('.topbar .brand-logo');
  const name=document.querySelector('.brand-name');
  const actions=document.querySelector('.header-actions');
  const menu=document.querySelector('.topbar .menu');
  const r=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom}};
  return {w:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,
    brand:r(brand),logo:r(logo),name:r(name),actions:r(actions),menu:r(menu),
    imgLoaded:logo.complete&&logo.naturalWidth===384&&logo.naturalHeight===384,
    brandTitle:brand.textContent.trim().replace(/\s+/g,' '),
    logoStyle:getComputedStyle(logo).objectFit,
    theme:document.documentElement.dataset.theme};
 });
}
for(const [name,engine] of engines){
 test('R61 '+name+' intro: left-hand school logo remains balanced on narrow/mobile/desktop',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const width of [320,390,1024]){
    const context=await browser.newContext({viewport:{width,height:800},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const res=await page.goto(base,{waitUntil:'domcontentloaded'});
    assert.equal(res.status(),200);
    await page.locator('#welcome:not([hidden])').waitFor();
    const img=page.locator('.welcome-brand-logo');
    await img.evaluate(el=>el.decode());
    const info=await page.evaluate(()=>{
     const image=document.querySelector('.welcome-brand-logo').getBoundingClientRect();
     const name=document.querySelector('.welcome-brand-name').getBoundingClientRect();
     const parent=document.querySelector('.welcome-brand').getBoundingClientRect();
     const el=document.querySelector('.welcome-brand-logo');
     return {loaded:el.naturalWidth===384&&el.naturalHeight===384,
       left:image.left,right:image.right,titleLeft:name.left,
       imageHeight:image.height,totalWidth:parent.width,overflow:document.documentElement.scrollWidth-innerWidth,
       text:document.querySelector('.welcome-brand-name').textContent.trim()};
    });
    assert.ok(info.loaded,width+' intro original school logo');
    assert.ok(info.right<=info.titleLeft+1,width+' intro logo is left of title');
    assert.ok(info.imageHeight>=33&&info.imageHeight<=46,width+' intro logo modest size');
    assert.equal(info.text,'LANGUAGE SKILLS HUB',width+' intro name');
    assert.ok(info.overflow<=2,width+' intro overflow: '+info.overflow);
    assert.deepEqual(errors,[]);
    await context.close();
   }
  }finally{await browser.close();}
 });
 test('R61 '+name+' catalog: logo, title, help, dark/light modes and mobile layout',{timeout:130000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const width of [320,360,390,680,1024,1440]){
    const context=await browser.newContext({viewport:{width,height:850},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const res=await page.goto(base+'?skill=cteni',{waitUntil:'domcontentloaded'});
    assert.equal(res.status(),200);
    await page.locator('#catalog:not([hidden])').waitFor();
    await page.locator('.topbar .brand-logo').evaluate(el=>el.decode());
    for(const theme of ['dark','light']){
     if(theme==='light')await page.locator('#themeToggle').click();
     const d=await sanity(page);
     assert.equal(d.theme,theme);
     assert.ok(d.imgLoaded,width+' original logo '+theme);
     assert.equal(d.logoStyle,'cover');
     assert.equal(d.brandTitle,'LANGUAGE SKILLS HUB');
     assert.ok(d.logo.right<d.name.x,width+' logo left of name '+theme);
     assert.ok(d.logo.height<=40,width+' no giant logo '+theme);
     assert.ok(d.overflow<=2,width+' horizontal overflow '+d.overflow+' '+theme);
     assert.ok(d.brand.right<=d.actions.x+1||d.actions.y>=d.brand.bottom-1,
       width+' header actions overlap logo/title '+theme+' '+JSON.stringify(d));
     assert.ok(d.menu.width>0,width+' help navigation retained');
     assert.ok(await page.locator('#howtoOpen').isVisible());
     assert.ok(await page.locator('#fullscreenToggle').isVisible());
    }
    await page.locator('#howtoOpen').click();
    await page.locator('#howto[open]').waitFor();
    await page.locator('#howtoClose').click();
    assert.equal(await page.locator('#howto').evaluate(el=>el.open),false);
    assert.deepEqual(errors,[]);
    await context.close();
   }
  }finally{await browser.close();}
 });
}
