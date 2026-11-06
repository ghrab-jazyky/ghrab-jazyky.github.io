'use strict';
// Public editorial titles only; this suite must never require a private lesson file.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const stage=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(stage,p),'utf8');
const inventory=JSON.parse(read('data/editorial-inventory.json'));
const manifest=JSON.parse(read('data/manifest.json'));
const core=require('../assets/lsh/v2/core.js');

test('R3B: three categories have explicit pending reference candidates without fake approval',()=>{
 assert.equal(inventory.schemaVersion,1);
 assert.match(inventory.inventoryVersion,/^r(?:3b|4a|4b)-/);
 assert.equal(inventory.referenceCandidates.konverzace.approved,false);
 assert.equal(inventory.referenceCandidates.cteni.approved,false);
 assert.equal(inventory.referenceCandidates.poslech.approved,false);
 assert.equal(inventory.referenceCandidates.konverzace.id,'cl-rodina');
 assert.ok(manifest.topics.some(t=>t.id==='cl-rodina'&&t.skill==='konverzace'));
 for(const skill of ['cteni','poslech']) {
  const id=inventory.referenceCandidates[skill].id;
  assert.ok(inventory.topics.some(t=>t.id===id&&t.skill===skill));
 }
 assert.equal(inventory.topics.filter(t=>t.skill==='cteni').length,5);
 assert.equal(inventory.topics.filter(t=>t.skill==='poslech').length,3);
 assert.ok(inventory.topics.some(t=>t.id==='cl-human-rights'));
 assert.equal(inventory.referenceCandidates.cteni.id,'rl-asteroids');
 assert.equal(inventory.referenceCandidates.cteni.referenceVersion,'v2.3');
});

test('R3B: read-only inventory carries no source, keys, student URLs or release credentials',()=>{
 const approvedKeys=new Set(['id','skill','title','version','sourceState','state','scope','note']);
 const ids=new Set();
 for(const t of inventory.topics){
  assert.deepEqual(Object.keys(t).sort(),[...approvedKeys].sort());
  assert.ok(!ids.has(t.id));ids.add(t.id);
  assert.ok(['konverzace','cteni','poslech'].includes(t.skill));
  assert.ok(['private-source-verified','previously-audited-needs-restoration','public-test-preview','planned-only'].includes(t.sourceState));
  assert.ok(['PLANOVANO','CEKA_NA_PODKLADY','CEKA_NA_REFERENCI','CEKA_NA_NEZAVISLOU_REVIZI','CEKA_NA_INTEGRACNI_AUDIT'].includes(t.state));
 }
 const serialized=JSON.stringify(inventory);
 assert.doesNotMatch(serialized,/https?:\/\//i,'Editorial inventory must not host URLs');
 assert.doesNotMatch(serialized,/(?:teacherKeyUrl|correctAnswers|answerIndex|password|apiKey|privateRepo|secretToken|assessorAlias)/i);
 assert.equal(JSON.stringify(manifest).includes('rl-can-mistakes'),false,
    'Pending Reading reference cannot be enrolled as public student content');
 assert.equal(JSON.stringify(manifest).includes('ll-matthew-oscars'),false,
    'Pending Listening reference cannot be enrolled as public student content');
});

test('R3B: three skill pages have separate public editorial sections but no shareable links there',()=>{
 for(const skill of ['konverzace','cteni','poslech']){
  const html=read(skill+'/index.html');
  assert.match(html,/id="editorialInventoryList"/);
  assert.match(html,/id="editorialReferenceCandidate"/);
  assert.match(html,/id="editorialInventorySummary"/);
  assert.match(html,/assets\/lsh\/v3\/inventory.js/);
  assert.match(html,/assets\/lsh\/v3\/inventory.css/);
  assert.match(html,/REDAKČNÍ EVIDENCE/);
  const section=html.split('<section class="container editorial-inventory"')[1].split('</section>')[0];
  assert.doesNotMatch(section,/\bhref=|studentUrl|shortCode|shareDialog/);
 }
 const app=read('assets/lsh/v3/inventory.js');
 assert.doesNotMatch(app,/\.innerHTML\s*=/);
 assert.match(app,/textContent/);
 assert.match(app,/node\('article'/);
 assert.match(app,/replaceChildren/);
 assert.match(app,/new URL\('data\/editorial-inventory.json'/);
 assert.doesNotMatch(app,/location\.assign|window\.open|window\.postMessage/);
});
