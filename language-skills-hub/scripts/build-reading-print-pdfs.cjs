#!/usr/bin/env node
'use strict';
/* RL-PDF-01: pre-generate selectable, branded A4 PDFs at build time.
 * No external server at runtime, no student data and no answer keys.
 * Use: node language-skills-hub/scripts/build-reading-print-pdfs.cjs --sample
 *      node language-skills-hub/scripts/build-reading-print-pdfs.cjs --all
 * Requires a local HTTP server serving the repository root at port 8765
 * and Playwright Chromium. Do not run against production or user data.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8'));
const entry=catalog.entries.find(x=>x.id==='rl-asteroids'&&x.skill==='cteni');
if(!entry)throw new Error('Asteroids reference entry missing from catalog');
const langs=process.argv.includes('--sample')?['en']:entry.languages;
const levels=process.argv.includes('--sample')?['B2']:entry.levels;
if(!process.argv.includes('--sample')&&!process.argv.includes('--all'))throw Error('Choose --sample or --all');
const base=process.env.LSH_PRINT_BASE_URL||'http://127.0.0.1:8765/language-skills-hub/';
const filePath=path.join(root,'printouts','rl-asteroids');
(async()=>{
 // Chromium on Linux may not have system hyphenation dictionaries.
 // Apply explicit language patterns to the print DOM before creating each PDF.
 const languages={en:'en-gb',es:'es',de:'de-1996',fr:'fr'};
 const hyphenators={};
 for(const [lang,language] of Object.entries(languages)){
  const module=await import('hyphen/'+language+'/index.js');
  if(typeof module.hyphenateSync!=='function')throw Error('Hyphenator missing: '+language);
  hyphenators[lang]=module.hyphenateSync;
 }
 const browser=await chromium.launch({headless:true});
 const manifest={schema:'RL_PDF_PRINT_ASSET_V1',topic:'rl-asteroids',files:[]};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('pageerror',error=>{console.error('Print-page error:',error.message)});
  for(const lang of langs)for(const level of levels){
   for(const mode of ['practice','test'])for(const format of ['text','all']){
    const url=new URL('self-check/reading/print-page.html',base);
    for(const [key,value] of Object.entries({topic:'rl-asteroids',lang,level,mode,format}))
     url.searchParams.set(key,value);
    const response=await page.goto(url.href,{waitUntil:'load',timeout:30000});
    if(response?.status()!==200)throw Error('HTTP failure: '+url);
    await page.locator('#printButton:not([disabled])').waitFor({timeout:30000});
    await page.evaluate(()=>document.fonts.ready);
    const selectors=['#readingParagraphs p','.exercise-question .prompt',
     '.exercise-options li','#reflectionPrompt'];
    const selector=selectors.join(',');
    const originals=await page.locator(selector).allTextContents();
    const hyphenate=hyphenators[lang];
    const withSoftHyphens=originals.map(text=>hyphenate(text,{
     html:false,minWordLength:8
    }));
    await page.evaluate(({selector,values})=>{
     [...document.querySelectorAll(selector)].forEach((el,index)=>{
      el.textContent=values[index];
     });
    },{selector,values:withSoftHyphens});
    if(level==='B2'&&format==='text'&&!withSoftHyphens.some(t=>t.includes('\u00ad')))
     throw Error('No language-aware soft hyphens created for '+lang);

    const state=await page.evaluate(()=>({
     logo:document.getElementById('schoolLogo')?.naturalWidth,
     visible:!document.getElementById('paper')?.hidden,
     textCount:document.querySelectorAll('#readingParagraphs p').length,
     questionCount:document.querySelectorAll('#exercises .exercise-question').length,
     alignment:getComputedStyle(document.querySelector('#readingParagraphs')).textAlign
    }));
    if(!state.logo||!state.visible||state.textCount<1||
       state.alignment!=='justify'||(format==='all'&&state.questionCount<1)||
       (format==='text'&&state.questionCount!==0))
     throw Error('Invalid PDF source '+url+': '+JSON.stringify(state));
    const bytes=await page.pdf({preferCSSPageSize:true,printBackground:true,tagged:true});
    if(bytes.length<15000||bytes.subarray(0,8).toString('latin1').indexOf('%PDF')!==0)
     throw Error('Invalid PDF bytes '+url);
    const dir=path.join(filePath,lang,level);
    fs.mkdirSync(dir,{recursive:true});
    const name=mode+'-'+format+'.pdf';
    fs.writeFileSync(path.join(dir,name),bytes);
    const relative=path.posix.join('printouts','rl-asteroids',lang,level,name);
    manifest.files.push({path:relative,bytes:bytes.length,
     sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
    console.log('BUILD '+relative+' '+bytes.length+' bytes');
   }
  }
  const count=langs.length*levels.length*4;
  if(manifest.files.length!==count)throw Error('Incomplete PDF build');
  fs.writeFileSync(path.join(filePath,'manifest-'+(process.argv.includes('--sample')?'sample':'all')+'.json'),
   JSON.stringify(manifest,null,2)+'\n');
  console.log('PASS: '+count+' branded downloadable PDFs generated');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
