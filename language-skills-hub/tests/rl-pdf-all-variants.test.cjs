#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const core=require('../self-check/reading/reading-core.js');
const print=require('../self-check/reading/print-core.js');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8'));
const entry=core.readingEntry(catalog,'rl-asteroids');
const data=core.parseReadingData(fs.readFileSync(path.join(root,entry.relative),'utf8'));
let count=0,gaps=0;
for(const lang of ['en','es','de','fr']){
 for(const level of ['A1','A2','B1','B2','C1','C2']){
  test('RL-PDF: four export projections '+lang+'/'+level,()=>{
   const v=core.variantFromData(data,lang,level);
   const output=new Map();
   for(const mode of ['practice','test'])for(const format of ['text','all']){
    const p=print.printable(v,mode,format);
    output.set(mode+'-'+format,p);count++;
    assert.equal(p.paragraphs.length,v.paragraphs.length);
    const questions=p.sections.reduce((n,s)=>n+s.questions.length,0);
    assert.equal(questions,format==='all'?v.questions.length:0);
    assert.equal(p.reflection,format==='all'?v.open||'':'');
    assert.equal(p.warmup,mode==='practice'&&format==='all'?v.pre||'':'');
    const encoded=JSON.stringify(p);
    for(const q of v.questions){
     if(q.explanation)assert.equal(encoded.includes('"explanation":'),false);
    }
   }
   assert.deepEqual(output.get('practice-text').paragraphs,v.paragraphs);
   if(v.gap){
    gaps++;
    assert.equal(v.questions.filter(q=>q.kind==='gap').length,1);
    for(const key of ['practice-all','test-text','test-all']){
     const p=output.get(key);
     assert.ok(p.paragraphs[v.gap.p].includes('[…]'),key);
     assert.ok(!p.paragraphs[v.gap.p].includes(v.gap.sentence),key);
    }
    assert.ok(output.get('practice-text').paragraphs[v.gap.p].includes(v.gap.sentence));
    for(const key of ['practice-all','test-all']){
     const q=output.get(key).sections.flatMap(s=>s.questions);
     assert.ok(q.some(item=>item.kind==='gap'&&item.choices.includes(v.gap.sentence)));
    }
   }
  });
 }
}
test('RL-PDF: invariant corpus is 24 variants × 4 and 16 gap variants',()=>{
 assert.equal(count,96);assert.equal(gaps,16);
});
