#!/usr/bin/env node
'use strict';
/* Release gate for pre-generated Asteroids PDF assets.
 * Requires pdftotext/pdfinfo (poppler-utils) and qpdf for structural validation.
 * --compare <directory> additionally checks that rebuilding the corpus produces
 * the same semantic text and page counts as the committed PDF corpus.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const pdfRoot=path.join(root,'printouts','rl-asteroids');
const manifest=JSON.parse(fs.readFileSync(path.join(pdfRoot,'manifest-all.json'),'utf8'));
const reading=require('../self-check/reading/reading-core.js');
const project=require('../self-check/reading/print-core.js');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8'));
const entry=reading.readingEntry(catalog,'rl-asteroids');
const data=reading.parseReadingData(fs.readFileSync(path.join(root,entry.relative),'utf8'));
const INPUTS=[
 'data/cards.json','cteni/asteroids/index.html','assets/school-logo.png',
 'self-check/reading/reading-core.js','self-check/reading/print-core.js',
 'self-check/reading/print-page.html','self-check/reading/print-page.js',
 'self-check/reading/print-page.css','scripts/build-reading-print-pdfs.cjs'
];
function digest(){
 const h=crypto.createHash('sha256');
 for(const filename of INPUTS){
  const bytes=fs.readFileSync(path.join(root,filename));
  h.update(filename+'\0'+bytes.length+'\0');h.update(bytes);
 }
 return h.digest('hex');
}
function run(command,args){return execFileSync(command,args,{encoding:'utf8',maxBuffer:12*1024*1024})}
function normalized(s){
 return String(s).normalize('NFKC').replace(/\u00ad/g,'')
  .replace(/([\p{L}])[-‐]\s*\n(?=[\p{L}])/gu,'$1')
  .toLocaleLowerCase('und').replace(/[^\p{L}\p{N}]/gu,'');
}
function includedText(label,value,actual,after=0){
 const expected=normalized(value);
 if(expected.length<2)return after;
 const direct=actual.indexOf(expected,after);
 if(direct>=0)return direct+expected.length;
 // A page break can interrupt a text element with margin text. In that case
 // require EVERY word in source order; tolerate no missing chunks.
 const words=String(value).split(/\s+/).filter(Boolean).map(normalized).filter(Boolean);
 let cursor=after;
 for(const word of words){
  const found=actual.indexOf(word,cursor);
  if(found<0)throw Error('PDF ordered text mismatch: '+label+' missing '+word+
   ' after offset '+cursor);
  cursor=found+word.length;
 }
 return cursor;
}
function cleanPageFurniture(raw){
 return raw.split(/\r?\n/).filter(line=>
  !/^\s*(?:Zdroj:\s*British Council LearnEnglish|Reading Lab\s*·\s*\d+\s*$)/u.test(line)
 ).join('\n');
}
function inspect(filename){
 const bytes=fs.readFileSync(filename);
 if(!bytes.subarray(0,8).toString('latin1').startsWith('%PDF')||
    !bytes.subarray(-1024).toString('latin1').includes('%%EOF'))
  throw Error('Invalid PDF wrapper: '+filename);
 run('qpdf',['--check',filename]);
 const info=run('pdfinfo',[filename]);
 const pages=Number(info.match(/^Pages:\s*(\d+)/m)?.[1]);
 const size=info.match(/^Page size:\s*([\d.]+)\s+x\s+([\d.]+)/m);
 if(!pages||pages>12||!size||Math.abs(Number(size[1])-595)>2||
    Math.abs(Number(size[2])-842)>2)throw Error('Invalid A4 page count/size: '+filename);
 const text=run('pdftotext',['-raw','-nopgbrk',filename,'-']);
 const actual=normalized(cleanPageFurniture(text));
 if(actual.length<100)throw Error('Empty PDF text: '+filename);
 return {bytes,actual,pages,raw:text};
}
if(manifest.schema!=='RL_PDF_PRINT_ASSET_V1'||manifest.topic!=='rl-asteroids')
 throw Error('Invalid manifest schema');
if(!/^[a-f0-9]{64}$/.test(manifest.sourceSha256||'')||
    manifest.sourceSha256!==digest())throw Error('Stale sourceSha256 in PDF manifest');
if(!manifest.generator||!String(manifest.generator).includes('playwright'))
 throw Error('Missing generator provenance');
if(!Array.isArray(manifest.files)||manifest.files.length!==96)
 throw Error('Expected exactly 96 PDF records');
const byPath=new Map(manifest.files.map(x=>[x.path,x]));
if(byPath.size!==96)throw Error('Duplicate PDF records');
const compareAt=process.argv.indexOf('--compare');
const compareRoot=compareAt>=0?process.argv[compareAt+1]:null;
if(compareAt>=0&&!compareRoot)throw Error('Missing --compare directory');
let count=0,pageTotal=0,gapCount=0;
for(const lang of ['en','es','de','fr'])for(const level of ['A1','A2','B1','B2','C1','C2']){
 const variant=reading.variantFromData(data,lang,level);
 for(const mode of ['practice','test'])for(const format of ['text','all']){
  const key='printouts/rl-asteroids/'+lang+'/'+level+'/'+mode+'-'+format+'.pdf';
  const record=byPath.get(key);
  if(!record)throw Error('Missing manifest entry '+key);
  const filename=path.join(root,key);
  const {bytes,actual,pages}=inspect(filename);
  if(['A1','A2','B1','B2'].includes(level)&&format==='text'&&pages!==1)
   throw Error('Unexpected extra page in lower-level text-only PDF: '+key);
  if(record.bytes!==bytes.length||
     record.sha256!==crypto.createHash('sha256').update(bytes).digest('hex'))
   throw Error('PDF does not match manifest '+key);
  const model=project.printable(variant,mode,format);
  let cursor=includedText(key+' title',model.title,actual);
  if(model.warmup)cursor=includedText(key+' warmup',model.warmup,actual,cursor);
  for(const [index,para] of model.paragraphs.entries()){
   const parts=para.split(' […] ');
   for(const part of parts)
    cursor=includedText(key+' paragraph '+(index+1),part,actual,cursor);
  }
  if(format==='all'){
   for(const section of model.sections){
    cursor=includedText(key+' section',section.title,actual,cursor);
    for(const q of section.questions){
     cursor=includedText(key+' question '+q.number,q.number+'. '+q.prompt,actual,cursor);
     for(const option of q.choices)
      cursor=includedText(key+' option '+q.number,option,actual,cursor);
    }
   }
   if(model.reflection)cursor=includedText(key+' reflection',model.reflection,actual,cursor);
  }else{
   for(const q of variant.questions){
    if(normalized(q.q).length>12&&actual.includes(normalized(q.q)))
     throw Error('Exercise question appears in text-only PDF: '+key+' / '+q.id);
   }
   if(/_{10,}/.test(run('pdftotext',['-raw','-nopgbrk',filename,'-'])))
    throw Error('Student identification line in text-only PDF: '+key);
  }
  if(variant.pre&&!(mode==='practice'&&format==='all')&&
     actual.includes(normalized(variant.pre)))
   throw Error('Warm-up question leaked into wrong PDF variant: '+key);
  if(variant.gap){
   gapCount++;
   const sentence=normalized(variant.gap.sentence),observed=actual.split(sentence).length-1;
   const expected=mode==='practice'&&format==='text'?1:format==='all'?1:0;
   if(observed!==expected)throw Error('Missing sentence leaked/missing: '+key+
    ' expected '+expected+' occurrences, saw '+observed);
   if(mode==='test'||format==='all'){
    if(!/\[\s*(?:\u2026|\.{3})\s*\]/u.test(run('pdftotext',
     ['-raw','-nopgbrk',filename,'-'])))
     throw Error('Gap marker missing: '+key);
   }
  }
  if(compareRoot){
   const old=inspect(path.join(compareRoot,lang,level,mode+'-'+format+'.pdf'));
   if(old.actual!==actual||old.pages!==pages)
    throw Error('Regenerated content/page count differs from committed PDF '+key);
  }
  count++;pageTotal+=pages;
 }
}
const diskFiles=[];
function walkPDFs(dir,rel=''){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const name=path.posix.join(rel,entry.name);
  if(entry.isDirectory())walkPDFs(path.join(dir,entry.name),name);
  else if(entry.isFile()&&entry.name.endsWith('.pdf'))
   diskFiles.push('printouts/rl-asteroids/'+name);
 }
}
walkPDFs(pdfRoot);
const expectedFiles=[...byPath.keys()].sort();
if(JSON.stringify(diskFiles.sort())!==JSON.stringify(expectedFiles))
 throw Error('Unexpected or missing PDF on disk (must match manifest exactly)');
console.log('PASS: '+count+' PDF variants; '+pageTotal+' A4 pages; '+gapCount+
 ' gap variants; manifest SHA256, text, source provenance'+
 (compareRoot?' and regeneration parity':''));
