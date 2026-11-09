#!/usr/bin/env node
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('R29 Reading renders review only for incorrect items; success uses a dedicated message',()=>{
 const src=read('self-check/reading/reading.js');
 assert.match(src,/const mistakes=report\.details\.filter\(item=>!item\.correct\)/);
 assert.match(src,/for\(const item of mistakes\)/);
 assert.match(src,/if\(!mistakes\.length\)details\.appendChild/);
 for(const lang of ['en','es','de','fr'])assert.match(src,new RegExp(lang+':.*correct|'+lang+':.*richtig|'+lang+':.*correctes'));
});

test('R29 Listening only shows incorrect objective answers and keeps all written answers for teacher review',()=>{
 const src=read('self-check/listening/listening-student.js');
 assert.match(src,/const mistakes=report\.reviewed\.filter\(task=>!task\.correct\)/);
 assert.match(src,/for\(const task of mistakes\)/);
 assert.match(src,/for\(const task of report\.writing\)/);
 assert.match(src,/teacherReview\(normalized\)/);
 assert.match(src,/gradeCore\.listening\(normalized,marks\)/);
});

test('R29 labels reflect grade proposal without claiming a certified school result',()=>{
 const files=['index.html','assets/hub.js','self-check/reading/teacher.html','self-check/listening/teacher.html'];
 const text=files.map(read).join('\n');
 assert.doesNotMatch(text,/Test bez známky/);
 assert.match(text,/Test – známka 1–5/);
 assert.match(text,/návrh známky 1–5/i);
 assert.match(text,/Bez backendu/);
 const manifest=JSON.parse(read('version.json'));
 assert.equal(manifest.officialGradesEnabled,false);
 assert.equal(manifest.gradedTestsEnabled,false);
 assert.equal(manifest.localGradeProposalsEnabled,true);
});
