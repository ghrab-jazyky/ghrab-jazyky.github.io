#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const core=require('../self-check/session/attempt-core.js');
const fs=require('node:fs'),path=require('node:path');
function store(){
 const data=new Map();
 return {data,getItem:key=>data.has(key)?data.get(key):null,
  setItem:(key,val)=>data.set(key,val),removeItem:key=>data.delete(key)};
}
function config(storage,now,overrides={}){
 return {skill:'reading',topic:'rl-asteroids',lang:'en',
  level:'B2',attempt:'class20261109a',limitMinutes:15,storage,now,...overrides};
}
test('R30 timer accepts only explicit 5–120 minute whole-number values',()=>{
 for(const n of [5,15,30,90,120])assert.equal(core.minutes(String(n)),n);
 assert.equal(core.minutes(null),null);
 for(const x of ['0','4','121','15.5','-5','abc','015',' 15','500','1e2',15])
  assert.throws(()=>core.minutes(x));
});
test('R30 unique local attempt key scopes lesson, level, language, time and attempt ID',()=>{
 const a=config(null,Date.now);
 const first=core.key(a);
 for(const field of ['topic','lang','level','limitMinutes','attempt']){
  const b={...a,[field]:field==='limitMinutes'?30:'different1'};
  assert.notEqual(first,core.key(b));
 }
 assert.throws(()=>core.key({...a,attempt:'../../secret'}));
 assert.throws(()=>core.key({...a,skill:'conversation'}));
});
test('R30 start, autosave, reload and expiry keep elapsed clock time',()=>{
 const storage=store();let time=1000000;
 const input=config(storage,()=>time);
 const a=core.open(input);
 assert.equal(a.status().phase,'ready');
 assert.equal(a.status().remainingMs,900000);
 a.start();a.saveAnswers({questions:{q1:2,q2:0},reflection:'example'});
 time+=5*60000;
 const b=core.open(input);
 assert.equal(b.status().phase,'running');
 assert.equal(b.status().remainingMs,10*60000);
 assert.deepEqual(b.status().answers,{questions:{q1:2,q2:0},reflection:'example'});
 time+=10*60000;
 assert.equal(b.status().expired,true);
 assert.equal(b.status().remainingMs,0);
 assert.throws(()=>b.saveAnswers({questions:{q1:1}}));
 b.finish();assert.equal(b.status().phase,'submitted');
 assert.throws(()=>b.start());
 const c=core.open(input);
 assert.equal(c.status().phase,'submitted');
 assert.equal(c.status().persistent,true);
 assert.deepEqual(c.status().answers,{questions:{q1:2,q2:0},reflection:'example'});
});
test('R30 visibility incident persists while timer runs; resume does not reset deadline',()=>{
 const storage=store();let time=2000000;
 const input=config(storage,()=>time);
 const a=core.open(input);a.start();const deadline=a.status().deadlineAt;
 time+=10000;
 a.interrupt('hidden');
 assert.equal(a.status().phase,'interrupted');
 assert.equal(a.status().incidents.length,1);
 assert.throws(()=>a.saveAnswers({x:1}));
 time+=13000;
 const b=core.open(input);
 assert.equal(b.status().phase,'interrupted');
 b.resume();assert.equal(b.status().phase,'running');
 assert.equal(b.status().deadlineAt,deadline);
 assert.equal(b.status().remainingMs,deadline-time);
 assert.deepEqual(b.status().incidents.map(i=>i.kind),['hidden']);
});
test('R30 invalid storage fails closed; missing storage works without pretending persistence',()=>{
 const storage=store();let time=3000000;
 const input=config(storage,()=>time);
 storage.setItem(core.key(input),'{bad json');
 assert.throws(()=>core.open(input),/Corrupted saved attempt/);
 const offline=core.open(config(null,()=>time));
 assert.equal(offline.status().persistent,false);
 offline.start();offline.saveAnswers({q:'answer'});
 assert.deepEqual(offline.status().answers,{q:'answer'});
 const fresh=core.open(config(null,()=>time));
 assert.equal(fresh.status().phase,'ready');
});
test('R30 timed state does not send answers over a network and has no student identifiers',()=>{
 const src=fs.readFileSync(path.resolve(__dirname,'../self-check/session/attempt-core.js'),'utf8');
 assert.doesNotMatch(src,/fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|studentName|studentId|emailAddress/);
 assert.deepEqual(core.STATES,['ready','running','interrupted','submitted']);
});
