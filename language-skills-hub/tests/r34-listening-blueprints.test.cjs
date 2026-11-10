#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const reading=require('../self-check/reading/reading-core.js');
const listening=require('../self-check/listening/listening-core.js');
const blueprints=require('../self-check/test-banks/listening/listening-test-core.js');
const manifest=JSON.parse(read('version.json')),catalog=JSON.parse(read('data/cards.json'));
const sources=catalog.entries.filter(e=>e.skill==='poslech');
const levels=['A1','A2','B1','B2','C1','C2'];
test('R34 all 18 EN Listening assessment blueprints cover exactly the catalog and source SHA',()=>{
 assert.equal(sources.length,3);
 let counted=0;
 for(const entry of sources){
  const html=read(entry.relative),hash=createHash('sha256').update(html).digest('hex');
  assert.equal(hash,manifest.contentHashes[entry.id]);
  const data=listening.extractJson(html,'DATA');
  for(const level of levels){
   const bp=JSON.parse(read('self-check/test-banks/listening/'+entry.id+'/'+level+'.json'));
   const practice=listening.variant(data,level);
   assert.equal(blueprints.validate(bp,practice,hash,{topic:entry.id,level}),true);
   const qa=blueprints.makeQaVariant(bp,practice,hash,{topic:entry.id,level});
   listening.validate(qa);
   assert.equal(qa.gist.length,2);assert.equal(qa.detail.length,3);
   assert.equal(qa.sequence.length,3);assert.equal(qa.facts.length,1);assert.equal(qa.open.length,1);
   assert.deepEqual(Object.keys(bp.selections).sort(),['detail','facts','gist','open','sequence']);
   assert.equal(bp.published,false);
   assert.equal(bp.reviewStatus,'STRUCTURAL_SELECTION_NOT_INDEPENDENT_CONTENT');
   assert.equal(bp.editorialStatus,'REQUIRES_NEW_LISTENING_ITEMS_AND_AUDIO_VALIDATION');
   assert.equal(typeof bp.note,'string');
   assert.ok(bp.note.includes('NOT an independently written'));
   counted++;
  }
 }
 assert.equal(counted,18);
});
test('R34 blueprints cannot silently become approved independent Listening content',()=>{
 const entry=sources[0],html=read(entry.relative);
 const hash=manifest.contentHashes[entry.id],data=listening.extractJson(html,'DATA'),p=listening.variant(data,'B2');
 const bp=JSON.parse(read('self-check/test-banks/listening/'+entry.id+'/B2.json'));
 assert.throws(()=>blueprints.validate({...bp,published:true},p,hash),/cannot be published/);
 assert.throws(()=>blueprints.validate({...bp,editorialStatus:'APPROVED'},p,hash),/masquerade/);
 assert.throws(()=>blueprints.validate(bp,p,'0'.repeat(64)),/checksum changed/);
 assert.throws(()=>blueprints.validate(bp,p,hash,{topic:entry.id,level:'A1'}),/Wrong Listening/);
 const bad={...bp,selections:{...bp.selections,gist:[0,0]}};
 assert.throws(()=>blueprints.validate(bad,p,hash),/Invalid selected/);
});
test('R34 original teacher-controlled media and R31 student test remain unchanged',()=>{
 const student=read('self-check/listening/listening-student.js');
 const teacher=read('self-check/listening/listening-teacher.js');
 const readingStudent=read('self-check/reading/reading.js');
 assert.doesNotMatch(student,/listening-test-core|test-banks\/listening/);
 assert.doesNotMatch(teacher,/listening-test-core|test-banks\/listening/);
 assert.doesNotMatch(readingStudent,/r34-|test-banks\/reading/);
 assert.doesNotMatch(read('index.html'),/test-banks\/listening/);
 assert.equal(manifest.version,'R31');
 assert.equal(manifest.backendEnabled,false);
 assert.equal(manifest.officialGradesEnabled,false);
});
