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
  h.update(filename+'\\0'+bytes.length+'\\0');h.update(bytes);
 }
 return h.digest('hex');
}
function run(command,args){return execFileSync(command,args,{encoding:'utf8',maxBuffer:12*1024*1024})}
function normalized(s){
 return String(s).normalize('NFKC').replace(/\\u00ad/g,'')
  .replace(/([\\p{L}])[-‐]\\s*\\n(?=[\\p{L}])/gu,'$1')
  .toLocaleLowerCase('und').replace(/[^\\p{L}\\p{N}]/gu,'');
}
function wordChunks(s){
 const words=String(s).split(/\\s+/).filter(Boolean),pieces=[];
 for(let i=0;i<words.length;i+=6)pieces.push(words.slice(i,i+6).join(' '));
 return pieces;
}
function includedText(label,value,actual){
 const expected=normalized(value);
 if(expected.length<2)return;
 if(actual.includes(expected))return;
 // Printed paragraphs can cross a PDF page boundary and have a footer
 // inserted in extracted text. Require virtually every six-word chunk.
 const pieces=wordChunks(value).filter(s=>normalized(s).length>4);
 const misses=pieces.filter(piece=>!actual.includes(normalized(piece)));
 if(misses.length>Math.max(1,Math.floor(pieces.length*0.08)))
  throw Error('PDF text mismatch: '+label+' ('+misses.length+'/'+pieces.length+' parts missing)');
}
function inspect(filename){
 const bytes=fs.readFileSync(filename);
 if(!bytes.subarray(0,8).toString('latin1').startsWith('%PDF')||
    !bytes.subarray(-1024).toString('latin1').includes('%%EOF'))
  throw Error('Invalid PDF wrapper: '+filename);
 run('qpdf',['--check',filename]);
 const info=run('pdfinfo',[filename]);
 const pages=Number(info.match(/^Pages:\\s*(\\d+)/m)?.[1]);
 const size=info.match(/^Page size:\\s*([\\d.]+)\\s+x\\s+([\\d.]+)/m);
 if(!pages||pages>12||!size||Math.abs(Number(size[1])-595)>2||
    Math.abs(Number(size[2])-842)>2)throw Error('Invalid A4 page count/size: '+filename);
 const text=run('pdftotext',['-raw','-nopgbrk',filename,'-']);
 if(normalized(text).length<100)throw Error('Empty PDF text: '+filename);
 return {bytes,actual:normalized(text),pages,raw:text};
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
  if(record.bytes!==bytes.length||
     record.sha256!==crypto.createHash('sha256').update(bytes).digest('hex'))
   throw Error('PDF does not match manifest '+key);
  const model=project.printable(variant,mode,format);
  includedText(key+' title',model.title,actual);
  for(const [index,para] of model.paragraphs.entries()){
   // The gap marker is typographically represented in PDF, not ordinary text.
   const parts=para.split(' […] ');
   for(const part of parts)includedText(key+' paragraph '+(index+1),part,actual);
  }
  if(format==='all'){
   for(const section of model.sections){
    includedText(key+' section',section.title,actual);
    for(const q of section.questions){
     includedText(key+' question '+q.number,q.prompt,actual);
     for(const option of q.choices)includedText(key+' option '+q.number,option,actual);
    }
   }
   if(model.reflection)includedText(key+' reflection',model.reflection,actual);
   if(model.warmup)includedText(key+' warmup',model.warmup,actual);
  }
  if(variant.gap){
   gapCount++;
   const sentence=normalized(variant.gap.sentence),observed=actual.split(sentence).length-1;
   const expected=mode==='practice'&&format==='text'?1:format==='all'?1:0;
   if(observed!==expected)throw Error('Missing sentence leaked/missing: '+key+
    ' expected '+expected+' occurrences, saw '+observed);
   if((mode==='test'||format==='all')&&!actual.includes(normalized('[...]'))){
    // Unicode ellipsis survives normalized() only as punctuation; inspect raw text.
    const raw=run('pdftotext',['-raw','-nopgbrk',filename,'-']);
    if(!/\\[\\s*(?:\\u2026|\\.{3})\\s*\\]/u.test(raw))
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
const disk=fs.readdirSync(pdfRoot,{withFileTypes:true});
console.log('PASS: '+count+' PDF variants; '+pageTotal+' A4 pages; '+gapCount+
 ' gap variants; manifest SHA256, text, source provenance'+
 (compareRoot?' and regeneration parity':''));
