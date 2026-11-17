'use strict';
// Reproducible T1 QA simulation (spec v1.2.4 section 12.3).
// It is NOT a guarantee of security or proof of correct browser user activation.
const test=require('node:test');
const assert=require('node:assert/strict');
const g=require('../self-check/session/unlock-gestures.js');
const W=1000,H=800;
const raw=(type,x,y,time,pointerId=1)=>({type,x,y,time,width:W,height:H,pointerId,pointerType:'mouse',button:0});
function generator(seed){
 let value=seed>>>0;
 return ()=>{value^=value<<13;value^=value>>>17;value^=value<<5;return (value>>>0)/4294967296;};
}
function gaussian(rand){
 return Math.sqrt(-2*Math.log(Math.max(rand(),1e-8)))*Math.cos(2*Math.PI*rand());
}
function feed(rec,e,id){
 if(id==='corners4'&&e.type==='down'){
  const rects=g.geometry('corners4',e.width,e.height).rects;
  const index=rects.findIndex(q=>e.x>=q.x&&e.x<q.x+q.width&&e.y>=q.y&&e.y<q.y+q.height);
  if(index<0)return;
  rec.feed({...e,corner:['tl','tr','bl','br'][index]});return;
 }
 rec.feed(e);
}
test('T1 coordinate adapter completes real corner targets and rejects points outside them',()=>{
 const rects=g.geometry('corners4',W,H).rects;
 const sequence=rects.map((q,i)=>raw('down',q.x+q.width/2,q.y+q.height/2,i*600));
 function completions(events){
  let count=0;
  const rec=g.createRecognizer('corners4',{onSuccess:()=>count++});
  for(const e of events)feed(rec,e,'corners4');
  return count;
 }
 assert.equal(completions(sequence),1,'same adapter used by both simulations must reach the recognizer');
 const outside=sequence.map((e,i)=>({...e,y:rects[i].y-1}));
 assert.equal(completions(outside),0,'the former broad 80 px edge area is not a corner target');
 const missing=sequence.map((e,i)=>i===2?{...e,x:rects[i].x+rects[i].width}:e);
 assert.equal(completions(missing),0,'a press beyond one actual 58 px target must not complete');
});
const distributions=['A_uniform','B_center_gaussian','C_rapid_taps','D_random_draws','E_random_holds'];
const randomSeed=0x5a17b124;
test('T1 gate: 10,000 random sequences x five distributions x five gestures',()=>{
 const rand=generator(randomSeed),nonzero=[],summary=[];
 for(const gesture of g.DEFINITIONS){
  for(const distribution of distributions){
   let successes=0;
   for(let k=0;k<10000;k++){
    const rec=g.createRecognizer(gesture.id,{onSuccess:()=>successes++});
    let t=0;const events=[],count=1+Math.floor(rand()*9);
    const point=()=>{
     if(distribution==='B_center_gaussian')return {
      x:Math.max(0,Math.min(W,W*.5+gaussian(rand)*W*.15)),
      y:Math.max(0,Math.min(H,H*.5+gaussian(rand)*H*.15))
     };
     return {x:rand()*W,y:rand()*H};
    };
    for(let j=0;j<count;j++){
     const p=point();
     if(distribution==='D_random_draws'){
      events.push(raw('down',p.x,p.y,t));
      const p1=point(),p2=point(),p3=point();
      events.push(raw('move',p1.x,p1.y,t+200),raw('move',p2.x,p2.y,t+500),raw('up',p3.x,p3.y,t+800));
      t+=900+Math.floor(rand()*900);
     }else{
      const duration=distribution==='E_random_holds'?Math.floor(rand()*4500):
       distribution==='C_rapid_taps'?Math.floor(rand()*70):Math.floor(rand()*350);
      events.push(raw('down',p.x,p.y,t),raw('up',p.x,p.y,t+duration));
      t+=duration+(distribution==='C_rapid_taps'?20+Math.floor(rand()*85):50+Math.floor(rand()*2000));
     }
    }
    for(const e of events)feed(rec,e,gesture.id);
   }
   const entry={gesture:gesture.id,distribution,unintendedUnlocks:successes};
   summary.push(entry);
   if(successes)nonzero.push(entry);
  }
 }
 console.log('T1 RANDOM seed=0x'+randomSeed.toString(16)+' total=250000');
 console.log('T1 DISTRIBUTIONS '+JSON.stringify(summary));
 console.log('T1 NONZERO '+JSON.stringify(nonzero));
 // Legacy corners are measured and reported; section 12.3 does not permit
 // changing their production parameters because of this simulation.
 assert.deepEqual(nonzero.filter(entry=>entry.gesture!=='corners4'),[],
  'Stop: an unintended completion of gestures 2–5 requires owner review before changing parameters.');
});
const positiveSeed=0x2a14c057;
test('T1 positive: 1,000 legitimate jittered gestures x five',()=>{
 const rand=generator(positiveSeed);
 const r=g.geometry('draw_z',W,H).r;
 function jitter(x,y,radius=r*.8){
  const theta=rand()*Math.PI*2,d=Math.sqrt(rand())*radius;
  return [x+Math.cos(theta)*d,y+Math.sin(theta)*d];
 }
 const event=(type,p,time)=>raw(type,p[0],p[1],time);
 function attempt(id){
  if(id==='corners4'){
   // Corners keep their actual 58×58 target. Use radial jitter up to 80% of
   // its half-width (23.2 px), never the larger r-based tolerance of gestures 2–5.
   return g.geometry('corners4',W,H).rects.map((q,i)=>
    event('down',jitter(q.x+q.width/2,q.y+q.height/2,Math.min(q.width,q.height)*.4),i*600));
  }
  const points={
   tap_hold_tap:[[500,560],[500,560],[500,560]],
   hold_double_tap:[[300,480],[700,480],[700,480]],
   triangle3:[[500,240],[300,560],[700,560]],
   draw_z:[[300,240],[700,240],[300,560],[700,560]]
  }[id].map(([x,y])=>jitter(x,y));
  if(id==='draw_z'){
   const duration=800+rand()*2200;
   return [event('down',points[0],0),event('move',points[1],duration/3),
    event('move',points[2],duration*2/3),event('up',points[3],duration)];
  }
  const durations=id==='tap_hold_tap'?[80+rand()*200,2100+rand()*900,80+rand()*200]:
   id==='hold_double_tap'?[2700+rand()*800,80+rand()*150,80+rand()*150]:
    [80+rand()*220,80+rand()*220,650+rand()*250];
  let t=0;const events=[];
  for(let i=0;i<3;i++){
   events.push(event('down',points[i],t),event('up',points[i],t+durations[i]));
   t+=durations[i]+(id==='hold_double_tap'&&i===1?80+rand()*200:200+rand()*500);
  }
  return events;
 }
 const failures=[];
 for(const id of g.IDS){
  let correct=0;
  for(let k=0;k<1000;k++){
   const r=g.createRecognizer(id,{onSuccess:()=>correct++});
   for(const e of attempt(id))feed(r,e,id);
  }
  if(correct!==1000)failures.push({id,passed:correct});
 }
 console.log('T1 POSITIVE seed=0x'+positiveSeed.toString(16)+' total=5000 failures='+JSON.stringify(failures));
 assert.deepEqual(failures,[]);
});
