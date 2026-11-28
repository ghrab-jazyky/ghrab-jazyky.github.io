#!/usr/bin/env node
'use strict';
// F4.2: preserve the ordinary PDF gate, then compare the old corpus.
// 84 unchanged canonical files; 12 explicitly changed full worksheets.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{pdfContentSha256}=require('./pdf-content-sha256.cjs'),a=require('./smart-feedback-f42-source-edits.cjs');
const root=path.resolve(__dirname,'..'),oldRoot=process.argv[2],currentRoot=path.join(root,'printouts/rl-asteroids');
assert.ok(oldRoot&&fs.statSync(oldRoot).isDirectory());
const card=fs.readFileSync(path.join(root,'cteni/asteroids/index.html'),'utf8');a.revertSource(a.stripBank(card));
execFileSync(process.execPath,[path.join(__dirname,'verify-reading-print-assets.cjs')],{stdio:'inherit'});
const manifest=JSON.parse(fs.readFileSync(path.join(currentRoot,'manifest-all.json'),'utf8'));
const run=(p,args)=>execFileSync(p,args,{encoding:'utf8',maxBuffer:12*1024*1024});
const clean=s=>s.split(/\r?\n/).filter(line=>!/^\s*(?:(?:Zdroj:|Téma inspirováno:)\s*British Council|PDF Reading Lab\s*·\s*Gymnázium Ostrava-Hrabůvka|Reading Lab\s*·\s*\d+\s*$)/u.test(line)).join('\n');
const normalized=s=>String(s).normalize('NFKC').replace(/\u00ad/g,'').replace(/([\p{L}])[-‐]\s*\n(?=[\p{L}])/gu,'$1').toLocaleLowerCase('und').replace(/[^\p{L}\p{N}]/gu,'');
const extract=(f,mode)=>normalized(clean(run('pdftotext',['-'+mode,'-nopgbrk',f,'-'])));
const pages=f=>Number(run('pdfinfo',[f]).match(/^Pages:\s*(\d+)/m)?.[1]);
let unchanged=0,changed=0;const rows=[];
for(const record of manifest.files){
 const rel=record.path.replace(/^printouts\/rl-asteroids\//,'');
 const [l,level,filename]=rel.split('/'),previous=path.join(oldRoot,rel),current=path.join(currentRoot,rel);
 const e=a.EDITS.find(x=>x.variant===l+'/'+level&&filename.endsWith('-all.pdf'));
 const oldHash=pdfContentSha256(fs.readFileSync(previous)),newHash=pdfContentSha256(fs.readFileSync(current));
 if(!e){assert.equal(newHash,oldHash,rel);unchanged++;rows.push({file:rel,status:'EXACT_CANONICAL_PARITY'});continue;}
 assert.notEqual(newHash,oldHash,rel+' expected source change');assert.equal(pages(current),pages(previous),rel+' page count');
 let match=false;
 for(const mode of ['raw','layout']){
  const old=extract(previous,mode),next=extract(current,mode),before=normalized(e.before),after=normalized(e.after);
  if(old.split(before).length===2&&next===old.replace(before,after)){match=true;break;}
 }
 assert.ok(match,rel+' contains a difference beyond the sole approved field or extraction order changed');
 changed++;rows.push({file:rel,status:'EXACT_AUTHORIZED_TEXT_DELTA',id:e.id,pages:pages(current)});
}
assert.equal(unchanged,84);assert.equal(changed,12);
if(process.env.F42_PDF_REPORT)fs.writeFileSync(process.env.F42_PDF_REPORT,JSON.stringify({unchanged,changed,rows},null,2)+'\n');
console.log('PASS F4.2 PDF corpus: 84/84 unchanged canonical PDFs; 12/12 exact approved text deltas and unchanged page counts; all 96 structurally and semantically verified.');
