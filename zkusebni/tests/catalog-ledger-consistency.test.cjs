#!/usr/bin/env node
/* R6: staging catalog consistency, independent of the legacy production manifest.
 * Validates only inventory links and release gates; NEVER marks a card approved.
 */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const legacy=load('data/manifest.json');
const catalog=load('data/reference-pilots.json');
const audit=load('data/claude-audit-queue.json');
const tracker=load('data/unification-tracker.json');
const ids=a=>a.map(x=>x.id).sort();
test('29-card technical catalog, tracker, and Claude queue contain exactly the same IDs',()=>{
 const ci=ids(catalog.entries),ai=ids(audit.topics),ti=ids(tracker.topics);
 assert.equal(catalog.approvedForTeaching,false);
 assert.equal(tracker.approvedForRelease,false);
 assert.equal(ci.length,29);
 assert.deepEqual(ai,ci);
 assert.deepEqual(ti,ci);
 const counts=catalog.entries.reduce((o,x)=>(o[x.skill]=(o[x.skill]||0)+1,o),{});
 assert.deepEqual(counts,{konverzace:21,cteni:5,poslech:3});
});
test('No technical pilot silently becomes teacher-approved or test-ready',()=>{
 const byId=new Map(tracker.topics.map(x=>[x.id,x]));
 for(const c of catalog.entries){
  assert.equal(c.practice,'preview',c.id);
  assert.equal(c.test,'not-ready',c.id);
  assert.equal(c.fixedVariantSupported,true,c.id);
  assert.equal(byId.get(c.id).publicRelease,'BLOCKED_PENDING_REVIEW',c.id);
 }
 for(const a of audit.topics)assert.equal(a.teacherApproval,false,a.id);
});
test('Legacy manifest stays isolated until versioned migration',()=>{
 assert.equal(legacy.environment,'staging');
 assert.equal(legacy.topics.length,22);
 const previous=legacy.topics.filter(x=>x.skill==='konverzace');
 assert.equal(previous.length,21);
 const indexed=new Set(catalog.entries.filter(x=>x.skill==='konverzace').map(x=>x.id));
 for(const x of previous)assert.ok(indexed.has(x.id),'Legacy conversation not indexed: '+x.id);
 const demo=legacy.topics.filter(x=>x.demo===true);
 assert.equal(demo.length,1,'Historical demo must remain identified');
 assert.equal(demo[0].id,'demo-muzeum-niva');
 assert.ok(!indexed.has(demo[0].id),'Demo cannot be treated as real Conversation topic');
 assert.equal(catalog.entries.some(x=>x.id===demo[0].id),false,'Demo cannot enter the 29 real-card pilot');
 for(const x of legacy.topics)assert.notEqual(x.status,'PUBLIKOVANO','Legacy pilot cannot be upgraded silently: '+x.id);
});
