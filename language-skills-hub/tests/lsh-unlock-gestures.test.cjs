/* Client-side teacher gesture convenience, NOT authentication.
 * Keep this test deterministic and independent of browser layout.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const gestures=require('../self-check/session/unlock-gestures.js');
const core=require('../self-check/session/attempt-core.js');
const pdf=require('../self-check/results/pdf-report.js');

const dims={width:1000,height:800,pointerId:1,pointerType:'mouse',button:0};
const down=(x,y,t)=>({type:'down',x,y,time:t});
const move=(x,y,t)=>({type:'move',x,y,time:t});
const up=(x,y,t)=>({type:'up',x,y,time:t});
function run(id,events){
 let successes=0,failures=0;
 const recog=gestures.createRecognizer(id,{onSuccess:()=>successes++,onFailure:()=>failures++});
 for(const event of events)recog.feed({...dims,...event});
 return {successes,failures,state:recog.state()};
}
const valid={
 corners4:['tl','tr','bl','br'].map((corner,i)=>({type:'down',corner,time:i*2000})),
 tap_hold_tap:[down(500,560,0),up(500,560,100),down(500,560,200),up(500,560,2300),down(500,560,2400),up(500,560,2500)],
 hold_double_tap:[down(300,480,0),up(300,480,2800),down(700,480,2900),up(700,480,3000),down(700,480,3200),up(700,480,3300)],
 triangle3:[down(500,240,0),up(500,240,90),down(300,560,300),up(300,560,390),down(700,560,500),up(700,560,1250)],
 draw_z:[down(300,240,0),move(700,240,400),move(300,560,900),move(700,560,1300),up(700,560,1400)]
};
test('same stable gesture IDs and URL codes',()=>{
 assert.deepEqual(gestures.IDS,['corners4','tap_hold_tap','hold_double_tap','triangle3','draw_z']);
 for(const item of gestures.DEFINITIONS){
  assert.equal(gestures.byCode(item.code).id,item.id);
  assert.equal(gestures.parseUrl(new URLSearchParams('timer=30&p='+item.code),true).id,item.id);
 }
 assert.equal(gestures.parseUrl(new URLSearchParams('timer=30'),true).legacyLink,true);
 assert.equal(gestures.parseUrl(new URLSearchParams('p=n6'),false).id,null);
 for(const q of ['p=','p=n6','p=n1&p=n2','p=N1']){
  assert.throws(()=>gestures.parseUrl(new URLSearchParams('timer=30&'+q),true),{code:'invalid-link'});
 }
});
test('geometry and SVG share exactly the same coordinates',()=>{
 for(const d of gestures.DEFINITIONS)for(const [w,h] of [[390,844],[820,1180],[1180,820],[1366,768],[1920,1080],[1024,768],[768,1024]]){
  const g=gestures.geometry(d.id,w,h),svg=gestures.svg(d.id,w,h);
  assert.ok(g.r>=44);
  assert.match(svg,/<svg /);
  assert.match(svg,/<title>/);
  assert.match(svg,/<desc>/);
  assert.equal(g.points.length,d.id==='corners4'?4:d.points.length);
 }
});
for(const [id,events] of Object.entries(valid)){
 test('successful gesture '+id,()=>assert.equal(run(id,events).successes,1));
 test('incomplete gesture '+id,()=>assert.equal(run(id,events.slice(0,-1)).successes,0));
}
test('approved triangle3 uses two taps plus a 600–1000 ms final hold',()=>{
 const prefix=[down(500,240,0),up(500,240,90),down(300,560,300),up(300,560,390)];
 const last=duration=>[...prefix,down(700,560,500),up(700,560,500+duration)];
 assert.equal(gestures.byId('triangle3').kinds[2],'hold');
 assert.deepEqual(gestures.byId('triangle3').durations[2],[600,1000]);
 for(const time of [600,750,1000])assert.equal(run('triangle3',last(time)).successes,1,time);
 for(const time of [0,250,350,599,1001,1250])assert.equal(run('triangle3',last(time)).successes,0,time);
 const wrongOrder=[down(500,240,0),up(500,240,90),down(300,560,300),up(300,560,390),down(700,560,500),up(700,560,750)];
 assert.equal(run('triangle3',wrongOrder).successes,0);
});
test('mixed wrong order fails without unlocking',()=>{
 assert.equal(run('corners4',['tl','bl','tr','br'].map((corner,i)=>({type:'down',corner,time:i*1000}))).successes,0);
 assert.equal(run('triangle3',[down(500,240,0),up(500,240,90),down(700,560,300),up(700,560,390)]).successes,0);
 assert.equal(run('draw_z',[down(700,560,0),move(300,560,600),up(300,240,1300)]).successes,0);
});
test('gesture hold and total-time bounds',()=>{
 assert.equal(run('tap_hold_tap',[down(500,560,0),up(500,560,100),down(500,560,200),up(500,560,1999),down(500,560,2050),up(500,560,2150)]).successes,0);
 assert.equal(run('hold_double_tap',[down(300,480,0),up(300,480,4001),down(700,480,4300),up(700,480,4380),down(700,480,4450),up(700,480,4560)]).successes,0);
 assert.equal(run('draw_z',[down(300,240,0),move(700,240,80),move(300,560,150),move(700,560,200),up(700,560,250)]).successes,0);
});
test('cancel, lostpointercapture and dimension changes reset',()=>{
 for(const kind of ['cancel','blur','hidden','orientation']){
  const sequence=[down(500,240,0),up(500,240,80),down(300,560,200),up(300,560,280),{type:kind,time:300,pointerId:1},down(700,560,420),up(700,560,510)];
  assert.equal(run('triangle3',sequence).successes,0,kind);
 }
 // A normal lostpointercapture after pointerup must not cancel the sequence.
 const released=[down(500,240,0),up(500,240,80),
  {type:'lostcapture',time:81,pointerId:1},
  down(300,560,200),up(300,560,280),
  down(700,560,400),up(700,560,1150)];
 assert.equal(run('triangle3',released).successes,1);
 const resized=[...valid.tap_hold_tap.slice(0,2),
  {...down(500,560,200),width:1100},up(500,560,2300),down(500,560,2400),up(500,560,2500)];
 assert.equal(run('tap_hold_tap',resized).successes,0);
});
test('R30 optional counter and historical snapshots remain readable',()=>{
 const kv=new Map(),storage={getItem:key=>kv.get(key)||null,setItem:(key,value)=>kv.set(key,value)};
 const input={skill:'reading',topic:'rl-asteroids',lang:'en',level:'B2',attempt:'class123456',limitMinutes:30,now:()=>1700000000000,storage};
 let e=core.open(input);assert.equal(e.status().unlockFailures,0);
 e.noteUnlockFailure();assert.equal(e.status().unlockFailures,0);
 e.start();e.interrupt('hidden');e.noteUnlockFailure();assert.equal(e.status().unlockFailures,1);
 assert.equal(e.status().incidents.length,1);assert.equal(e.status().resumptions.length,0);
 e=core.open(input);assert.equal(e.status().unlockFailures,1);
 const key=[...kv.keys()][0],old=JSON.parse(kv.get(key));delete old.unlockFailures;
 kv.set(key,JSON.stringify(old));e=core.open(input);assert.equal(e.status().unlockFailures,null);
 e.noteUnlockFailure();assert.equal(e.status().unlockFailures,1);
 let broken=JSON.parse(kv.get(key));broken.unlockFailures='corrupted';
 kv.set(key,JSON.stringify(broken));e=core.open(input);
 assert.equal(e.status().unlockFailures,'unreadable');e.noteUnlockFailure();
 assert.equal(e.status().unlockFailures,'unreadable');
 broken=JSON.parse(kv.get(key));broken.unlockFailures=9998;
 kv.set(key,JSON.stringify(broken));e=core.open(input);
 e.noteUnlockFailure();assert.equal(e.status().unlockFailures,9999);
 e.noteUnlockFailure();assert.equal(e.status().unlockFailures,9999);
});
test('PDF and plain-text security diagnostics: failed persistence wins over false',()=>{
 const state={startedAt:1700000000000,submittedAt:1700000010000,incidents:[],resumptions:[],tabMonitoringAvailable:true,
  attemptCode:'class12345',limitMinutes:30,requestedMinutes:30,pinnedUnlockCode:'n1',legacyLink:true,
  configurationMismatchSeen:false,mismatchAtLastOpen:true,mismatchPersistFailed:true,unlockFailures:9999};
 const sec=pdf.securityFromAttempt(state);
 const lines=pdf.securityDetails({security:sec}).join('\n');
 assert.match(lines,/Varianta zámku: n1/);
 assert.match(lines,/odkaz bez varianty/);
 assert.match(lines,/trvalý záznam se nepodařilo uložit/);
 assert.doesNotMatch(lines,/nebyl zjištěn nesoulad/);
 assert.match(lines,/9 999 nebo více/);
 state.configurationMismatchSeen=true;
 const sticky=pdf.securityDetails({security:pdf.securityFromAttempt(state)}).join('\n');
 assert.match(sticky,/některém otevření/);
});
