'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('data/cards.json')),version=JSON.parse(read('version.json'));
const reading=require('../self-check/reading/reading-core.js');
const entries=catalog.entries.filter(x=>x.skill==='cteni');
test('R56: all 120 source variants exist and contain objective tasks',()=>{
 assert.equal(entries.length,5);
 const ids=new Set();let variants=0,questions=0;
 for(const entry of entries){
  assert.ok(!ids.has(entry.id));ids.add(entry.id);
  assert.equal(entry.languages.length,4);
  assert.equal(entry.levels.length,6);
  const html=read(entry.relative);
  assert.equal(crypto.createHash('sha256').update(html).digest('hex'),version.contentHashes[entry.id],entry.id+' source drift');
  const data=reading.parseReadingData(html);
  for(const lang of entry.languages)for(const level of entry.levels){
   const variant=reading.variantFromData(data,lang,level);
   assert.ok(variant.title);
   assert.equal(variant.questions.length,{A1:9,A2:9,B1:12,B2:18,C1:21,C2:21}[level]);
   questions+=variant.questions.length;variants++;
  }
 }
 assert.equal(variants,120);assert.equal(questions,1800);
});
test('R56: teacher/student same origin and only safe share parameters',()=>{
 const teacher=read('self-check/reading/reading-teacher.js');
 const html=read('self-check/reading/teacher.html');
 const student=read('self-check/reading/reading.js');
 const share=read('self-check/results/share-tools.js');
 const qr=read('assets/qr.js');
 assert.match(teacher,/new URL\('index.html',document.baseURI\)/);
 for(const param of ['topic','lang','level','timer','attempt'])
  assert.ok(teacher.includes("url.searchParams.set('"+param+"'"));
 assert.match(teacher,/share.render\(studentLink/);
 assert.match(share,/host.CLBQRCode.svg\(url\)/);
 assert.match(share,/XMLSerializer/);
 assert.match(qr,/function matrix\(text\)/);
 assert.match(html,/id="qrMount"/);
 assert.match(html,/id="studentUrl"/);
 assert.match(html,/id="downloadQr"/);
 assert.match(html,/id="studentPreview"/);
 assert.match(student,/core.readingEntry\(catalog,selected.topic\)/);
 assert.match(student,/core.variantFromData\(data,selected.lang,selected.level\)/);
});
