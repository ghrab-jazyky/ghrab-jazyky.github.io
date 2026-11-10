#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const schema=require('../self-check/test-banks/reading/independent-schema.js');
const reading=require('../self-check/reading/reading-core.js');
const practice=reading.parseReadingData(read('cteni/can-mistakes/index.html'));
const manifest=JSON.parse(read('version.json'));
const hash=manifest.contentHashes['rl-can-mistakes'];
test('R34 universal assessment validator independently checks each six-level draft',()=>{
 for(const level of ['A1','A2','B1','B2','C1','C2']){
  const bank=JSON.parse(read('self-check/test-banks/reading/rl-can-mistakes/en-'+level+'.json'));
  const orig=reading.variantFromData(practice,'en',level);
  const sel={topic:bank.topic,lang:'en',level};
  const audit=schema.validate(bank,sel,orig,hash);
  assert.equal(audit.questions,10);
  assert.equal(audit.draft,true);
  assert.equal(audit.approved,false);
  const v=schema.qaVariant(bank,sel,orig,hash);
  reading.validateVariant(v);
  assert.deepEqual(v.paragraphs,orig.paragraphs);
  assert.throws(()=>schema.validate(bank,{...sel,lang:'es'},orig,hash),/selection mismatch/);
  assert.throws(()=>schema.validate({...bank,published:true},sel,orig,hash),/unpublished/);
  assert.throws(()=>schema.validate(bank,sel,orig,'0'.repeat(64)),/checksum mismatch/);
 }
});
test('R34 coverage reporter inventories every Reading and Listening CEFR combination',()=>{
 const text=execFileSync(process.execPath,[path.join(root,'tools/independent-assessment-worklist.cjs'),'--json'],{encoding:'utf8'});
 const result=JSON.parse(text);
 assert.equal(result.overview.reading,120);
 assert.equal(result.overview.listening,18);
 assert.equal(result.overview.total,138);
 assert.equal(result.overview.states.draft,6);
 assert.equal(result.overview.states.missing,132);
 assert.equal(result.rows.some(r=>r.topic==='rl-can-mistakes'&&r.level==='A1'&&r.language==='en'&&r.state==='draft'),true);
 assert.equal(result.rows.some(r=>r.skill==='listening'&&r.state==='draft'),false);
 assert.equal(result.rows.some(r=>r.skill==='reading'&&r.topic==='rl-asteroids'&&r.state==='draft'),false);
});
test('R34 absence is not replaced by an unapproved practice question bank',()=>{
 const script=read('tools/independent-assessment-worklist.cjs');
 const validator=read('self-check/test-banks/reading/independent-schema.js');
 assert.doesNotMatch(script,/copyPractice|generateQuestionsFromPractice|autoApprove/);
 assert.doesNotMatch(validator,/window\.fetch|XMLHttpRequest|sendBeacon|WebSocket/);
 assert.doesNotMatch(read('assets/hub.js'),/independent-schema|R34-AUTHOR-DRAFT/);
 assert.doesNotMatch(read('self-check/reading/reading.js'),/independent-schema|R34-AUTHOR-DRAFT/);
});

test('R34 138 complete source-grounded local authoring packets export without production changes',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-authoring-r34-'));
 try{
  const output=execFileSync(process.execPath,[
   path.join(root,'tools/build-assessment-authoring-packets.cjs'),'--out',dir
  ],{encoding:'utf8'});
  assert.match(output,/Prepared 138 local authoring packets/);
  const files=fs.readdirSync(dir);
  assert.equal(files.filter(x=>x.endsWith('.json')).length,139);
  const summary=JSON.parse(fs.readFileSync(path.join(dir,'SUMMARY.json'),'utf8'));
  assert.equal(summary.total,138);
  assert.equal(summary.reading,120);
  assert.equal(summary.listening,18);
  const sample=JSON.parse(fs.readFileSync(path.join(dir,'rl-can-mistakes--en-B2.json'),'utf8'));
  assert.equal(sample.source.title,'Can Mistakes Help Us Learn?');
  assert.equal(sample.sourceContent.paragraphs.length,4);
  assert.equal(sample.independentBankPresent,true);
  assert.equal(sample.outputRequirement.published,false);
  const missing=JSON.parse(fs.readFileSync(path.join(dir,'rl-asteroids--es-A2.json'),'utf8'));
  assert.equal(missing.independentBankPresent,false);
  assert.equal(missing.source.lang,'es');
  const audio=JSON.parse(fs.readFileSync(path.join(dir,'ll-harrison-ford--en-C1.json'),'utf8'));
  assert.equal(audio.source.skill,'listening');
  assert.equal(audio.source.level,'C1');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
