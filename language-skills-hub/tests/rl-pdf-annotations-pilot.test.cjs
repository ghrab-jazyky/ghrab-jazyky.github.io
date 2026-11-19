#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const projection=require('../self-check/reading/print-core.js');
const annotations=require('../self-check/reading/reading-annotations.js');
const sample={
 title:'Asteroids',paragraphs:['First sentence. Missing secret sentence. Last sentence.','Second paragraph.'],
 gap:{p:0,sentence:'Missing secret sentence.'},
 tabs:[{id:'detail',title:'Detail'},{id:'understand',title:'Understanding'}],
 questions:[
  {id:'q-one',tab:'detail',kind:'mc',q:'What is it?',choices:['Stone','Ship'],answer:0,explanation:'Secret key!'},
  {id:'q-two',tab:'understand',kind:'gap',q:'Which sentence is missing?',choices:['Missing secret sentence.','Elsewhere'],answer:0}
 ],
 open:'What did you learn?'
};
test('RL-PDF: practice text remains complete and excludes questions',()=>{
 const doc=projection.printable(sample,'practice','text');
 assert.deepEqual(doc.paragraphs,sample.paragraphs);
 assert.equal(doc.sections.length,0);
 assert.equal(doc.reflection,'');
});
test('RL-PDF: test print hides the deliberately removed passage',()=>{
 const doc=projection.printable(sample,'test','all');
 assert.equal(doc.paragraphs[0],'First sentence. […] Last sentence.');
 assert.equal(doc.sections.length,2);
 assert.equal(doc.sections[0].questions[0].number,1);
 assert.equal(doc.sections[1].questions[0].number,2);
 assert.ok(doc.reflection);
 assert.ok(!JSON.stringify(doc).includes('Secret key!'));
 assert.ok(!JSON.stringify(doc.sections).includes('"answer":'));
 assert.ok(!JSON.stringify(doc.sections).includes('"explanation":'));
});
test('RL-PDF: mismatched source gap fails closed',()=>{
 assert.throws(()=>projection.printable({...sample,gap:{p:0,sentence:'Absent'}},'test','text'),/Missing sentence/);
 assert.throws(()=>projection.printable(sample,'test','answers'),/Invalid reading print format/);
});
test('RL-02: accepts bounded, non-graded annotations only',()=>{
 const records=[{anchor:'p:0',start:0,end:5,text:'First',kind:'highlight',color:'yellow',note:''},
  {anchor:'q:q-one',start:0,end:4,text:'What',kind:'note',color:'green',note:'Remember this'}];
 const clean=annotations.normalized(records);
 assert.deepEqual(clean,records);
 const invalid={...records[0],start:100,end:12};
 assert.deepEqual(annotations.normalized([invalid]),[]);
 assert.deepEqual(annotations.normalized([{...records[0],kind:'grade',points:100}]),[]);
 assert.deepEqual(annotations.normalized([{...records[0],note:'x'.repeat(701)}]),[]);
});
test('RL-02: does not change reading score implementation',()=>{
 const reading=fs.readFileSync(path.join(root,'self-check/reading/reading.js'),'utf8');
 assert.match(reading,/annotations:annotationAPI\?\.snapshot\(\)\|\|\[\]/);
 assert.match(reading,/annotationAPI\?\.restore\(saved\.annotations\)/);
 assert.match(reading,/core\.score\(variant,answers\)/);
 const core=fs.readFileSync(path.join(root,'self-check/reading/reading-core.js'),'utf8');
 assert.doesNotMatch(core,/annotationAPI|annotation(s)?\s*:/);
});
test('RL-PDF: teacher buttons are absent from student test UI',()=>{
 const teacher=fs.readFileSync(path.join(root,'self-check/reading/teacher.html'),'utf8');
 const student=fs.readFileSync(path.join(root,'self-check/reading/index.html'),'utf8');
 const catalog=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(catalog,/id="materialsPracticeText"/);
 assert.match(catalog,/id="materialsTestAll"/);
 assert.doesNotMatch(teacher,/id="readingPrintSection"/);
 assert.deepEqual(annotations.COLORS,['yellow','green','pink','blue']);
 assert.doesNotMatch(student,/id="printPracticeText"|id="printTestAll"/);
});

test('RL-02: saved note popovers are read-only and stay outside scoring logic',()=>{
 const engine=fs.readFileSync(path.join(root,'self-check/reading/reading-annotations.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'self-check/reading/reading-annotations.css'),'utf8');
 const practice=fs.readFileSync(path.join(root,'self-check/reading/reading-practice-annotations.js'),'utf8');
 assert.match(engine,/function noteAtPoint\(/);
 assert.match(engine,/pointermove/);
 assert.match(engine,/lsh-annotation-view-note/);
 assert.match(engine,/popupText\.textContent=item\.note/);
 assert.match(engine,/addEventListener\('click',event=>/);
 assert.match(css,/\.lsh-annotation-popover-pinned/);
 assert.match(practice,/toggle:modeButton/);
 assert.match(practice,/data-anno-color="blue"/);
 assert.doesNotMatch(practice,/data-anno-toggle/);
});
