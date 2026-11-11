#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const pdf=require('../self-check/results/pdf-report.js');
const root=path.resolve(__dirname,'..');
const sample={
 skill:'reading',topicId:'rl-asteroids',topic:'Asteroids and Earth',language:'es',level:'B2',
 generatedAt:1762848000000,
 summary:{earned:1,max:3,percent:33.33,grade:5},
 questions:[
  {question:'¿Dónde está el objeto? A1?',studentAnswer:'En el espacio',correctAnswer:'En la Tierra',
   correct:false,awarded:0,explanation:'El texto indica la respuesta correcta.'},
  {question:'Frage über Sterne?',studentAnswer:'Draußen',correctAnswer:'Draußen',
   correct:true,awarded:1},
  {question:'Question sans réponse',studentAnswer:'Bez odpovědi',correctAnswer:'Une phrase.',
   correct:false,awarded:0}
 ],
 reflection:'Učitelé: příklad otevřené úvahy. Nehodnoceno.'
};
test('PDF report contains complete questions, student responses, corrections and teacher warning',()=>{
 const text=pdf.fullText(sample);
 for(const required of ['¿Dónde','En el espacio','En la Tierra','Frage über Sterne?',
  'Question sans réponse','33.33','Navrh znamky: 5','Učitelé']){
  assert.ok(text.includes(required),'Missing '+required);
 }
 assert.doesNotMatch(text,/student_name|student_email|anonymous_code|Cod:/);
 const justWrong={...sample,questions:[{...sample.questions[0],correct:false,awarded:2}]};
 assert.throws(()=>pdf.normalize(justWrong),/Invalid detailed/);
});
test('PDF binary writer emits contiguous objects, valid xref and page count',()=>{
 // 1x1 JPEG; the production writer receives browser JPEG pages.
 const jpeg=Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////2wBDAf//////////////////////////////////////////////wAARCAABAAEDAREAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAYIB//EABsQAAIDAQEBAAAAAAAAAAAAAAABAgMEBQYH/9oACAEBAAA/ALwQDO2qblXxzU1R4iQETgUsJ7di9bQoeFvVaoLFf//Z','base64');
 const bytes=pdf.pdfBytes([jpeg,jpeg]);
 assert.match(Buffer.from(bytes.slice(0,10)).toString('ascii'),/%PDF-1\.4/);
 const txt=Buffer.from(bytes).toString('latin1');
 assert.match(txt,/\/Type \/Pages \/Kids \[3 0 R 6 0 R\] \/Count 2/);
 assert.match(txt,/\/Filter \/DCTDecode/);
 assert.match(txt,/xref\n0 9\n/);
 const offsets=[...txt.matchAll(/^(\d{10}) 00000 n $/gm)].map(x=>Number(x[1]));
 assert.equal(offsets.length,8);
 for(let i=0;i<offsets.length;i++)assert.ok(txt.slice(offsets[i]).startsWith((i+1)+' 0 obj'));
 const startXref=Number(txt.match(/startxref\n(\d+)/)[1]);
 assert.ok(txt.slice(startXref).startsWith('xref\n'));
});
test('No PDF report network upload or hidden student identifier',()=>{
 const script=fs.readFileSync(path.join(root,'self-check/results/pdf-report.js'),'utf8');
 assert.doesNotMatch(script,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|document\.cookie/);
 const reading=fs.readFileSync(path.join(root,'self-check/reading/index.html'),'utf8');
 const listening=fs.readFileSync(path.join(root,'self-check/listening/student.html'),'utf8');
 for(const s of [reading,listening]){
  assert.match(s,/id="exportPdf"/);
  assert.match(s,/id="exportCopy"/);
  assert.match(s,/id="exportResult"/);
  assert.match(s,/pdf-report\.js/);
  assert.doesNotMatch(s,/id="archiveCode"|id="studentName"|id="studentEmail"/);
 }
});
