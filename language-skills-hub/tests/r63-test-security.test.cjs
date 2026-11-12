#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const tabs=require('../self-check/session/tab-guard.js');
const core=require('../self-check/session/attempt-core.js');
const pdf=require('../self-check/results/pdf-report.js');
const root=path.resolve(__dirname,'../self-check');
class Bus {
 static channels=new Set();
 constructor(){this.onmessage=null;Bus.channels.add(this)}
 postMessage(data){
  for(const peer of Bus.channels){
   if(peer!==this&&peer.onmessage)peer.onmessage({data});
  }
 }
 close(){Bus.channels.delete(this)}
}
test('Two active local tests detect each other, without any student identifiers',()=>{
 let aConflicts=0,bConflicts=0;
 const a=tabs.mount({channelFactory:()=>new Bus(),onConflict:()=>aConflicts++});
 const b=tabs.mount({channelFactory:()=>new Bus(),onConflict:()=>bConflicts++});
 try{
  assert.equal(a.available,true);assert.equal(b.available,true);
  a.activate();assert.equal(aConflicts,0);assert.equal(bConflicts,0);
  b.activate();
  assert.ok(aConflicts>=1);
  assert.ok(bConflicts>=1);
  a.deactivate();b.deactivate();
  const before=[aConflicts,bConflicts];
  a.activate(); // b is not active anymore
  assert.equal(aConflicts,before[0]);assert.equal(bConflicts,before[1]);
 }finally{a.dispose();b.dispose()}
 assert.equal(Bus.channels.size,0);
 const src=fs.readFileSync(path.join(root,'session/tab-guard.js'),'utf8');
 assert.doesNotMatch(src,/XMLHttpRequest|sendBeacon|fetch\s*\(|studentName|studentId|topicId|location\.href|localStorage/);
});
test('Incident clock stores lock and teacher resume while keeping old snapshots compatible',()=>{
 const data=new Map(),storage={
  getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),
  removeItem:key=>data.delete(key)
 };
 let time=1763000000000;
 const config={skill:'listening',topic:'ll-harrison-ford',lang:'en',level:'B2',
  attempt:'r63-unit-abc',limitMinutes:15,now:()=>time,storage};
 const a=core.open(config);
 a.start();time+=42000;a.interrupt('concurrent-tab');
 time+=34000;a.resume();
 time+=10000;a.interrupt('print-attempt');
 time+=30000;a.resume();a.finish();
 const b=core.open(config),state=b.status();
 assert.equal(state.phase,'submitted');
 assert.deepEqual(state.incidents.map(x=>x.kind),['concurrent-tab','print-attempt']);
 assert.deepEqual(state.resumptions,[1763000076000,1763000116000]);
 const timeline=pdf.securityFromAttempt({...state,tabMonitoringAvailable:true});
 assert.equal(timeline.monitored,true);
 assert.equal(timeline.events.length,4);
 assert.deepEqual(timeline.events.map(e=>e.kind),
  ['concurrent-tab','teacher-resume','print-attempt','teacher-resume']);
 assert.match(pdf.securityDetails({security:timeline}).join('\n'),/00:42/);
 const oldKey=core.key({...config,attempt:'r63-old-abc'});
 const oldState={kind:core.KIND,phase:'interrupted',limitMinutes:15,
  startedAt:1763000000000,deadlineAt:1763000900000,submittedAt:null,
  answers:{},reviewMarks:null,incidents:[{kind:'hidden',at:1763000010000}]};
 storage.setItem(oldKey,JSON.stringify(oldState));
 assert.deepEqual(core.open({...config,attempt:'r63-old-abc'}).status().resumptions,[]);
});
test('Reading and Listening complete local PDF text contains incident timeline and warning',()=>{
 const summary={earned:1,max:2,percent:50,roundedPercent:50,grade:4};
 const questions=[{question:'What happened?',studentAnswer:'X',correctAnswer:'Y',
  correct:false,awarded:0},{question:'Second',studentAnswer:'A',
  correctAnswer:'A',correct:true,awarded:1}];
 const security={monitored:true,tabMonitoringAvailable:true,startedAt:1763000000000,
  events:[{kind:'concurrent-tab',at:1763000005000},
    {kind:'teacher-resume',at:1763000010000},
    {kind:'print-attempt',at:1763000020000}]};
 for(const skill of ['reading','listening']){
  const text=pdf.fullText({skill,topic:skill,language:'en',level:'B2',
   summary,questions,security});
  assert.match(text,/BEZPECNOSTNI PROTOKOL/);
  assert.match(text,/Souběžný aktivní test v jiné záložce/);
  assert.match(text,/Pokus o tisk nebo náhled tisku/);
  assert.match(text,/Test znovu zpřístupněn učitelem/);
  assert.match(text,/00:05/);
  assert.match(text,/lokalni pamet prohlizece/);
  assert.match(text,/Spravna odpoved/);
 }
 const without=pdf.fullText({skill:'reading',topic:'Legacy',language:'en',level:'B2',
  summary,questions});
 assert.match(without,/neni dostupny casovany zaznam/);
 assert.throws(()=>pdf.normalize({skill:'reading',topic:'Invalid',language:'en',
  level:'B2',summary,questions,security:{...security,
   events:[{kind:'private-secret',at:1763000001000}]}}),/Invalid local security/);
});
test('Student test pages load tab guard and block print rendering, never practice cards',()=>{
 const reading=fs.readFileSync(path.join(root,'reading/index.html'),'utf8');
 const listening=fs.readFileSync(path.join(root,'listening/student.html'),'utf8');
 for(const html of [reading,listening]){
  assert.match(html, /session\/tab-guard\.js/);
  assert.ok(html.indexOf('tab-guard.js')<html.indexOf('session-ui.js'));
 }
 const styles=fs.readFileSync(path.join(root,'session/session.css'),'utf8');
 assert.match(styles,/@media print/);
 assert.match(styles,/visibility:hidden!important/);
 const ui=fs.readFileSync(path.join(root,'session/session-ui.js'),'utf8');
 assert.match(ui,/addEventListener\('beforeprint'/);
 assert.match(ui,/lock\('concurrent-tab'\)/);
});
