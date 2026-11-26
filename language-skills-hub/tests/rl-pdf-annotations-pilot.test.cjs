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
test('RL-PDF: a practice worksheet with the gap exercise conceals the sentence',()=>{
 const v={...sample,pre:'What do you already know?'};
 const reading=projection.printable(v,'practice','text');
 const worksheet=projection.printable(v,'practice','all');
 const testText=projection.printable(v,'test','text');
 assert.equal(reading.paragraphs[0],sample.paragraphs[0]);
 assert.equal(reading.sections.length,0);
 assert.equal(worksheet.paragraphs[0],'First sentence. […] Last sentence.');
 assert.equal(worksheet.sections.length,2);
 assert.equal(worksheet.warmup,v.pre);
 assert.equal(worksheet.hasGap,true);
 assert.equal(testText.paragraphs[0],'First sentence. […] Last sentence.');
 assert.equal(testText.sections.length,0);
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

test('RL-02: desktop auto-apply, explicit toggle-off and scoped clear-all confirmation are wired',()=>{
 const engine=fs.readFileSync(path.join(root,'self-check/reading/reading-annotations.js'),'utf8');
 const testUI=fs.readFileSync(path.join(root,'self-check/reading/index.html'),'utf8');
 const practice=fs.readFileSync(path.join(root,'self-check/reading/reading-practice-annotations.js'),'utf8');
 assert.match(engine,/let armed=null/);
 assert.match(engine,/event\.pointerType==='mouse'&&event\.button===0/);
 assert.match(engine,/clearSelection\(\);capture\(\);applyArmedSelection\(\)/);
 assert.match(engine,/const same=armed===kind/);
 assert.match(engine,/armed=same&&!selected\?null:kind/);
 assert.match(engine,/data-anno-clear-confirm-action/);
 assert.match(engine,/if\(!save\(\)\)/);
 for(const markup of [testUI,practice]){
  assert.match(markup,/data-anno-clear-all disabled/);
  assert.match(markup,/data-anno-clear-confirm hidden/);
  assert.match(markup,/data-anno-clear-cancel/);
  assert.match(markup,/data-anno-color="yellow" aria-pressed="false"/);
 }
});


test('F1: canonical and legacy ranges resolve only exact unambiguous source quotes',()=>{
 const source='Hidden sentence. Visible tail.',hidden='[…] Visible tail.',shift=source.length-hidden.length;
 const full={source,shift:0,min:0,gapShift:shift,gapPrefix:4};
 const partial={...full,shift,min:4};
 const legacy={start:4,end:11,text:'Visible'};
 const canonical={start:4+shift,end:11+shift,text:'Visible',basis:'source-v1'};
 assert.deepEqual(annotations.sourceRange(legacy,full),{start:4+shift,end:11+shift});
 assert.deepEqual(annotations.sourceRange(canonical,partial),{start:4,end:11});
 assert.deepEqual(annotations.sourceRange(canonical,full),{start:4+shift,end:11+shift});
 assert.equal(annotations.sourceRange({...legacy,text:'Wrong!!'},full),null);
 assert.equal(annotations.sourceRange({start:4,end:5,text:'x'},{source:'abcdx123x',shift:0,min:0,gapShift:4,gapPrefix:4}),null);
 const record={anchor:'p:0',start:canonical.start,end:canonical.end,text:'Visible',kind:'note',color:'yellow',note:'N',id:'a-123',basis:'source-v1'};
 assert.deepEqual(annotations.normalized([record]),[record]);
});
