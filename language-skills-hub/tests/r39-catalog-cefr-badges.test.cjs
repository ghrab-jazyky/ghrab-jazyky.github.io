#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('data/cards.json')).entries;
test('R39: all 30 topic cards use one localized title and a separate visible CEFR indicator',()=>{
 const src=read('assets/hub.js'),css=read('assets/hub.css'),html=read('index.html');
 assert.equal(catalog.length,31);
 assert.deepEqual(Object.fromEntries(['konverzace','cteni','poslech'].map(skill=>[
  skill,catalog.filter(e=>e.skill===skill).length
 ])),{konverzace:22,cteni:5,poslech:4});
 assert.match(src,/function catalogVariant\(e,languageFilter,levelFilter\)/);
 assert.match(src,/return \{label:langLabel\+' · '\+levelLabel/);
 assert.match(src,/e\.levels\.includes\(levelFilter\)\?levelFilter:null/);
 assert.match(src,/const translation=localized\(e,filter\),czech=localized\(e,'all'\)/);
 assert.match(src,/const title=one\('h3',null,translation\.title\)/);
 assert.match(src,/const indicator=one\('span','catalog-variant',variant\.label\)/);
 assert.match(src,/head\.append\(meta,indicator\);article\.appendChild\(head\)/);
 assert.match(src,/article\.dataset\.catalogLevel=e\.levels\.includes\(levelFilter\)\?levelFilter:'all'/);
 assert.match(css,/\.card \.catalog-variant\{/);
 assert.match(css,/:root\[data-theme="light"\] \.card \.catalog-variant/);
 assert.match(html,/úroveň A1–C2 název tématu nemění/);
});
test('R39: preview, test, keys, and share URLs retain the explicit selected level and language',()=>{
 const src=read('assets/hub.js'),teacher=read('self-check/practice-answers/teacher-key.js');
 assert.match(src,/function currentUrl\(e\)/);
 assert.match(src,/url\.searchParams\.set\('lang',language\)/);
 assert.match(src,/url\.searchParams\.set\('level',level\)/);
 assert.match(src,/url\.searchParams\.set\('zamek','1'\)/);
 assert.match(src,/function testSetupUrl\(e\)/);
 assert.match(src,/function practiceKeyUrl\(e\)/);
 assert.match(src,/function makeShareUrl\(e,mode,language,level\)/);
 assert.match(teacher,/fill\('level',\[\['','Vyber úroveň A1–C2'\]/);
 assert.match(teacher,/if\(!e\.languages\.includes\(lang\)\|\|!e\.levels\.includes\(level\)\)/);
 assert.match(teacher,/if\(!e\.levels\.includes\(level\)\)missing\.push\('úroveň A1–C2'\)/);
 assert.match(teacher,/\$\('downloadPdf'\)\.disabled=true/);
 assert.match(teacher,/const v=listen\.variant\(listen\.extractJson\(html,'DATA'\),level\)/);
 assert.match(teacher,/const v=read\.variantFromData\(read\.parseReadingData\(html\),lang,level\)/);
});
