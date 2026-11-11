#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('R45: catalog shows an unambiguous TEST action in Reading/Listening only',()=>{
 const js=read('assets/hub.js'),html=read('index.html');
 assert.match(js,/one\('a','action test','TEST'\)/);
 assert.match(js,/if\(localSelfCheck&&\['cteni','poslech'\]/);
 assert.match(js,/self-check\/reading\/teacher\.html/);
 assert.match(js,/self-check\/listening\/teacher\.html/);
 assert.doesNotMatch(js,/Test – známka 1–5/);
 assert.match(html,/<em>TEST<\/em>/);
 assert.doesNotMatch(html,/<em>Test – známka 1–5<\/em>/);
});

test('R45: student QR destinations omit confusing answer-key notices, keeping unobtrusive safety footers',()=>{
 const reading=read('self-check/reading/index.html');
 const listening=read('self-check/listening/student.html');
 const logic=read('self-check/reading/reading.js');
 for(const html of [reading,listening]){
  assert.doesNotMatch(html,/<div class="notice"/);
  assert.match(html,/<footer class="footer"/);
  assert.match(html,/teacher|učitel/i);
  assert.match(html,/<section[^>]+id="workspace"/);
 }
 assert.doesNotMatch(reading,/id="securityNotice"/);
 assert.doesNotMatch(listening,/id="notice"/);
 assert.doesNotMatch(logic,/securityNotice|answer keys are public|las soluciones son públicas|Lösungen sind öffentlich|corrigés sont publics/i);
 assert.match(logic,/gradeCore\.proposal/);
 assert.match(read('self-check/listening/listening-student.js'),/gradeCore\.proposal/);
});

test('R45: Reading and Listening preserve accessible native fieldsets with contained titles',()=>{
 const common=read('self-check/reading/reading.css');
 const listening=read('self-check/listening/listening.css');
 const readingLogic=read('self-check/reading/reading.js');
 const listeningLogic=read('self-check/listening/listening-student.js');
 assert.match(readingLogic,/add\('fieldset','question'\)/);
 assert.match(readingLogic,/add\('legend'/);
 assert.match(listeningLogic,/element\('fieldset','question'\)/);
 assert.match(listeningLogic,/element\('legend'/);
 assert.match(common,/fieldset\.question\{[^}]*width:100%;[^}]*max-inline-size:100%/);
 assert.match(common,/fieldset\.question>legend\{[^}]*float:left;[^}]*width:100%;[^}]*overflow-wrap:anywhere/);
 assert.match(common,/fieldset\.question>\.question-kind\{clear:both\}/);
 assert.match(common,/fieldset\.question \.choice>span\{[^}]*overflow-wrap:anywhere/);
 assert.match(listening,/\.sequence-bank\{grid-template-columns:repeat\(auto-fit,minmax\(min\(100%,260px\),1fr\)\)/);
});
