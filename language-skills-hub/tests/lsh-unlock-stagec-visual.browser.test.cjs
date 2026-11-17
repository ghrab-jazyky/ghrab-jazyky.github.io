#!/usr/bin/env node
'use strict';
/*
 * Stage C visual/geometry QA (v1.2.4 sections 8, 9, 12.4).
 * PNG screenshots stay in a runner-local folder; never uploaded as CI artifacts.
 * Locally: LSH_STAGEC_SCREENSHOTS_DIR=/absolute/folder node --test this-file
 */
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const base=process.env.LSH_STAGEB_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const output=process.env.LSH_STAGEC_SCREENSHOTS_DIR||path.join(os.tmpdir(),'lsh-stagec-screenshots');
const labs=[
 {name:'reading',url:'self-check/reading/teacher.html?topic=rl-asteroids&lang=en&level=B2&timer=30'},
 {name:'listening',url:'self-check/listening/teacher.html?topic=ll-sad&level=B2&timer=30'}
];
const ids=['corners4','tap_hold_tap','hold_double_tap','triangle3','draw_z'];
const orientations=[{name:'landscape',width:1024,height:768},{name:'portrait',width:768,height:1024}];
const near=(x,y,label)=>assert.ok(Math.abs(x-y)<=.5,label+': '+x+' != '+y);
async function openTeacher(browser,lab,viewport){
 const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
 const page=await context.newPage();
 const response=await page.goto(new URL(lab.url,base).href,{waitUntil:'domcontentloaded'});
 assert.equal(response.status(),200);
 await page.locator('#confirmTest:enabled').waitFor({timeout:30000});
 await page.locator('#unlockTeacherControls input[name="unlockMethod"]').first().waitFor();
 return {context,page};
}
async function inspectGeometry(page,id){
 return page.evaluate(id=>{
  const api=window.LSHUnlockGestures;
  const figures=[...document.querySelectorAll('#unlockTeacherControls .lsh-unlock-figures figure')];
  if(figures.length!==2)throw Error('Missing both orientations');
  for(const [i,fig] of figures.entries()){
   const w=i===0?1024:768,h=i===0?768:1024,svg=fig.querySelector('svg[role="img"]');
   if(!svg)throw Error('Accessible SVG missing');
   if(svg.getAttribute('viewBox')!=='0 0 '+w+' '+h)throw Error('Wrong SVG viewport');
   if(!svg.querySelector('title')?.textContent.includes(i===0?'na šířku':'na výšku'))
    throw Error('Accessible orientation title missing');
   if(!svg.querySelector('desc')?.textContent.trim())throw Error('Missing description');
   if(fig.querySelector('figcaption')?.textContent!==(i===0?'Na šířku':'Na výšku'))
    throw Error('Missing figure caption');
   const g=api.geometry(id,w,h);
   const near=(a,b,label)=>{if(Math.abs(a-b)>.5)throw Error(label+': '+a+' != '+b)};
   if(id==='corners4'){
    const rects=[...svg.querySelectorAll('rect[data-corner]')];
    if(rects.length!==4)throw Error('Four corners absent');
    for(let j=0;j<4;j++){
     const q=g.rects[j],el=rects[j];
     for(const [a,b] of [['x',q.x],['y',q.y],['width',q.width],['height',q.height]])
      near(Number(el.getAttribute(a)),b,'corner '+j+' '+a);
    }
   }else{
    const unique=g.points.filter((p,j)=>g.points.findIndex(q=>q.x===p.x&&q.y===p.y)===j);
    const circles=[...svg.querySelectorAll('circle[data-point]')];
    if(circles.length!==unique.length)throw Error('Point count mismatch for '+id);
    for(let j=0;j<circles.length;j++){
     const el=circles[j],p=unique[j];
     near(Number(el.getAttribute('cx')),p.x,'center x');
     near(Number(el.getAttribute('cy')),p.y,'center y');
     near(Number(el.getAttribute('r')),g.r,'radius');
    }
   }
   const a=svg.getBoundingClientRect(),b=fig.getBoundingClientRect();
   if(a.width>b.width+3)throw Error('SVG clipped horizontally');
  }
  return true;
 },id);
}
async function baseline(page){
 const radios=page.locator('#unlockTeacherControls input[name="unlockMethod"]');
 assert.equal(await radios.count(),5);
 assert.deepEqual(await radios.evaluateAll(els=>els.map(e=>e.value)),ids);
 assert.equal(await radios.first().isChecked(),true);
 assert.equal(await page.locator('#unlockTeacherControls details').evaluate(e=>e.open),false);
 assert.equal(await page.locator('#studentUrl').inputValue(),'');
 assert.equal(await page.locator('#qrMount svg').count(),0);
 assert.equal(await page.locator('#copyUrl').isDisabled(),true);
 assert.equal(await page.locator('#downloadQr').isDisabled(),true);
 assert.equal(await page.locator('#studentPreview').getAttribute('aria-disabled'),'true');
}
function storeShot(page,lab,orientation,theme){
 return page.screenshot({fullPage:true,animations:'disabled'}).then(buf=>{
  const name=lab.name+'-'+theme+'-'+orientation.name+'.png';
  const location=path.join(output,name);
  fs.writeFileSync(location,buf);
  assert.ok(buf.byteLength>9000,'Screenshot too small');
  assert.deepEqual([...buf.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.ok(buf.readUInt32BE(16)>=orientation.width);
  assert.ok(buf.readUInt32BE(20)>=orientation.height);
  return {name,bytes:buf.byteLength,width:buf.readUInt32BE(16),height:buf.readUInt32BE(20),
   sha:crypto.createHash('sha256').update(buf).digest('hex').slice(0,20)};
 });
}
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('C '+engineName+': Reading and Listening radio keyboard and 20 geometries', {timeout:210000},async()=>{
  const browser=await engine.launch({headless:true});let inspected=0;
  try{
   for(const lab of labs){
    const {page,context}=await openTeacher(browser,lab,orientations[0]);
    try{
     await baseline(page);
     const first=page.locator('input[name="unlockMethod"][value="corners4"]');
     await first.focus();await first.press('ArrowDown');
     assert.equal(await page.locator('input[name="unlockMethod"][value="tap_hold_tap"]').isChecked(),true);
     assert.equal(await page.getByRole('button',{name:'VYZKOUŠET GESTO'}).count(),1);
     for(const id of ids){
      await page.locator('input[name="unlockMethod"][value="'+id+'"]').check();
      await page.locator('#unlockTeacherControls summary').click();
      assert.ok(await inspectGeometry(page,id));
      inspected++;
      await page.locator('#unlockTeacherControls summary').click();
     }
     assert.equal(await page.locator('#studentUrl').inputValue(),'');
    }finally{await context.close()}
   }
   assert.equal(inspected,10);
   console.log('STAGE C SVG/KEYBOARD '+engineName+': 10 selected gestures, 20 orientation figures PASS');
  }finally{await browser.close()}
 });
 test('C '+engineName+': both LABs, light/dark modes, 1024x768/768x1024, local PNG', {timeout:220000},async()=>{
  const browser=await engine.launch({headless:true});
  fs.mkdirSync(output,{recursive:true});const shots=[];
  try{
   for(const lab of labs)for(const orientation of orientations){
    const {page,context}=await openTeacher(browser,lab,orientation);
    try{
     await baseline(page);
     await page.locator('input[name="unlockMethod"][value="triangle3"]').check();
     await page.locator('#unlockTeacherControls summary').click();
     for(const theme of ['dark','light']){
      if(await page.locator('html').getAttribute('data-theme')!==theme)
       await page.locator('#themeButton').click();
      assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
      const state=await page.evaluate(()=>({
       overflow:document.documentElement.scrollWidth>innerWidth+3,
       diagramCount:document.querySelectorAll('#unlockTeacherControls .lsh-unlock-figures svg').length
      }));
      assert.equal(state.overflow,false,lab.name+' '+theme+' '+orientation.name+' horizontal overflow');
      assert.equal(state.diagramCount,2);
      assert.ok(await inspectGeometry(page,'triangle3'));
      if(engineName==='Chromium')shots.push(await storeShot(page,lab,orientation,theme));
     }
    }finally{await context.close()}
   }
   if(engineName==='Chromium'){
    assert.equal(shots.length,8);
    assert.equal(new Set(shots.map(s=>s.sha)).size,8);
    console.log('STAGE C SCREENSHOTS (runner-local, NO CI artifact): '+JSON.stringify(shots));
   }
  }finally{await browser.close()}
 });
}
