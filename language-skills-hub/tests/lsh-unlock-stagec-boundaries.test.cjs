'use strict';
// Stage C deterministic recognizer boundaries, spec v1.2.4 section 12.2.
const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../self-check/session/unlock-gestures.js');
const W=1000,H=800;
function event(id,step,type,time,options={}){
 const width=options.width||W,height=options.height||H,pt=api.geometry(id,width,height).points[step];
 return {type,x:pt.x+(options.shift||0),y:pt.y,time,width,height,
  pointerType:'mouse',button:0,pointerId:1};
}
function sequence(id,durations,gaps,options={}){
 let success=0,failures=0,t=0;
 const rec=api.createRecognizer(id,{onSuccess:()=>success++,onFailure:()=>failures++});
 for(let i=0;i<durations.length;i++){
  const size=options.resizeAfterFirst&&i>0?options.resizeAfterFirst:{};
  rec.feed(event(id,i,'down',t,{...size,shift:options.shift||0}));
  t+=durations[i];rec.feed(event(id,i,'up',t,{...size,shift:options.shift||0}));
  if(i<gaps.length)t+=gaps[i];
 }
 return {success,failures,rec};
}
test('T1 every hold/tap duration lower and upper boundary (and +1/-1 ms)',()=>{
 for(const id of ['tap_hold_tap','hold_double_tap','triangle3']){
  const d=api.byId(id),mid=d.durations.map(([lo,hi])=>Math.floor((lo+hi)/2)),
    gaps=d.gaps.map(()=>100);
  assert.equal(sequence(id,mid,gaps).success,1,id+' midpoint');
  for(const [idx,bounds] of d.durations.entries()){
   for(const exact of bounds){
    const durations=[...mid];durations[idx]=exact;
    assert.equal(sequence(id,durations,gaps).success,1,id+' step '+idx+' inclusive '+exact);
   }
   const tooLong=[...mid];tooLong[idx]=bounds[1]+1;
   assert.equal(sequence(id,tooLong,gaps).success,0,id+' step '+idx+' upper+1');
   if(bounds[0]>0){
    const tooShort=[...mid];tooShort[idx]=bounds[0]-1;
    assert.equal(sequence(id,tooShort,gaps).success,0,id+' step '+idx+' lower-1');
   }
  }
 }
});
test('T1 every gap inclusive and +1ms; total duration limit is independent',()=>{
 for(const id of ['tap_hold_tap','hold_double_tap','triangle3']){
  const d=api.byId(id),mid=d.durations.map(([lo,hi])=>Math.floor((lo+hi)/2));
  for(let idx=0;idx<d.gaps.length;idx++){
   const valid=d.gaps.map(()=>100);valid[idx]=d.gaps[idx];
   assert.equal(sequence(id,mid,valid).success,1,id+' gap '+idx+' inclusive');
   valid[idx]++;
   assert.equal(sequence(id,mid,valid).success,0,id+' gap '+idx+' upper+1');
  }
 }
 assert.equal(sequence('triangle3',[500,500,2500],[2000,2000]).success,0,
  'Within per-step bounds but beyond overall 7-second limit must fail');
});
test('T1 point tolerance radius r inclusive / just outside and motion r/2',()=>{
 for(const id of ['tap_hold_tap','hold_double_tap','triangle3']){
  const d=api.byId(id),mid=d.durations.map(([lo,hi])=>Math.floor((lo+hi)/2)),gaps=d.gaps.map(()=>100);
  const r=api.geometry(id,W,H).r;
  assert.equal(sequence(id,mid,gaps,{shift:r-.5}).success,1,id+' inside r');
  assert.equal(sequence(id,mid,gaps,{shift:r+.5}).success,0,id+' outside r');
 }
 const id='tap_hold_tap',r=api.geometry(id,W,H).r;
 function withMotion(shift){
  let successes=0,t=0;const rec=api.createRecognizer(id,{onSuccess:()=>successes++});
  const d=[100,2200,100];
  for(let i=0;i<3;i++){
   rec.feed(event(id,i,'down',t));
   if(i===1)rec.feed(event(id,i,'move',t+20,{shift}));
   t+=d[i];rec.feed(event(id,i,'up',t));t+=100;
  }
  return successes;
 }
 assert.equal(withMotion(r/2-.5),1,'Movement just inside r/2 allowed');
 assert.equal(withMotion(r/2+.5),0,'Movement beyond r/2 cancels');
});
test('T1 <5% resize keeps gesture, >5% resize cancels',()=>{
 const id='triangle3',durations=[100,100,750],gaps=[100,100];
 assert.equal(sequence(id,durations,gaps,{resizeAfterFirst:{width:1049,height:800}}).success,1);
 assert.equal(sequence(id,durations,gaps,{resizeAfterFirst:{width:1051,height:800}}).success,0);
});
test('T1 lostpointercapture during a press resets; after pointerup must not reset',()=>{
 const id='triangle3';let success=0;const rec=api.createRecognizer(id,{onSuccess:()=>success++});
 rec.feed(event(id,0,'down',0));rec.feed(event(id,0,'up',100));
 rec.feed(event(id,0,'lostcapture',101));
 rec.feed(event(id,1,'down',200));rec.feed(event(id,1,'up',300));
 rec.feed(event(id,2,'down',400));rec.feed(event(id,2,'up',1150));
 assert.equal(success,1,'Benign capture release after pointerup');
 const other=api.createRecognizer(id,{onSuccess:()=>success++});
 other.feed(event(id,0,'down',0));other.feed(event(id,0,'lostcapture',50));
 other.feed(event(id,1,'down',100));other.feed(event(id,1,'up',200));
 other.feed(event(id,2,'down',300));other.feed(event(id,2,'up',1050));
 assert.equal(success,1,'Lost capture during press must cancel');
});
test('T1 draw_z minimum/maximum durations, sparse samples, reversed or skipped corner',()=>{
 const id='draw_z',points=api.geometry(id,W,H).points;
 function draw(duration,order=[0,1,2,3]){
  let success=0;const rec=api.createRecognizer(id,{onSuccess:()=>success++});
  for(let i=0;i<4;i++){
   const p=points[order[i]],type=i===0?'down':i===3?'up':'move';
   rec.feed({type,x:p.x,y:p.y,time:Math.round(duration*i/3),width:W,height:H,pointerType:'mouse',pointerId:1,button:0});
  }
  return success;
 }
 for(const duration of [400,1500,3800,4000])assert.equal(draw(duration),1,'duration '+duration);
 for(const duration of [399,4001])assert.equal(draw(duration),0,'invalid duration '+duration);
 assert.equal(draw(1500,[3,2,1,0]),0,'reversed direction');
 assert.equal(draw(1500,[0,2,2,3]),0,'skipping P2');
 let success=0;const rec=api.createRecognizer(id,{onSuccess:()=>success++});
 const add=(type,x,y,time)=>rec.feed({type,x,y,time,width:W,height:H,pointerType:'mouse',pointerId:1,button:0});
 add('down',points[0].x,points[0].y,0);
 add('move',points[1].x,points[1].y,350);
 add('move',W*.95,H*.9,500);
 add('move',points[2].x,points[2].y,900);
 add('up',points[3].x,points[3].y,1300);
 assert.equal(success,0,'Large departure from stroke path must cancel');
});
test('T1 legacy corners4 mouse exact 8-second gap boundary',()=>{
 function corners(gap){let success=0;const rec=api.createRecognizer('corners4',{onSuccess:()=>success++});
  for(const [i,corner] of ['tl','tr','bl','br'].entries())
   rec.feed({type:'down',corner,time:i*gap,width:W,height:H,pointerType:'mouse',pointerId:1,button:0});
  return success;
 }
 assert.equal(corners(8000),1);
 assert.equal(corners(8001),0);
});
