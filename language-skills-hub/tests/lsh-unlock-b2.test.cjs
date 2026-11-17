'use strict';
/* B2 F-17: the fourth corner on touch/pen is unfinished until matching pointerup.
 * These deterministic tests exercise the pure recognizer, not browser user activation.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const {createRecognizer}=require('../self-check/session/unlock-gestures.js');
const corners=['tl','tr','bl','br'];
const setup=(kind='touch')=>{
 let success=0,failure=0;
 const rec=createRecognizer('corners4',{onSuccess:()=>success++,onFailure:()=>failure++});
 const e=(type,time,opts={})=>({type,time,width:820,height:1180,pointerId:7,pointerType:kind,
  button:0,...opts});
 const start=(at=0,pointerId=7)=>corners.forEach((corner,i)=>rec.feed(e('down',at+i*100,{corner,pointerId})));
 return {rec,e,start,stats:()=>({success,failure})};
};
test('B2 fourth touch pointerdown waits; matching pointerup outside the corner completes exactly once',()=>{
 const x=setup();x.start();
 assert.deepEqual(x.stats(),{success:0,failure:0});
 assert.equal(x.rec.state().awaitingRelease,true);
 assert.equal(x.rec.state().releasePointerId,7);
 x.rec.feed(x.e('up',440,{x:-100,y:2000}));
 assert.deepEqual(x.stats(),{success:1,failure:0});
 assert.equal(x.rec.state().awaitingRelease,false);
 x.rec.feed(x.e('up',441));assert.equal(x.stats().success,1);
});
test('B2 pen waits for pointerup; legacy mouse still completes on fourth pointerdown',()=>{
 for(const kind of ['pen','touch']){
  const x=setup(kind);x.start();assert.equal(x.stats().success,0);
  x.rec.feed(x.e('up',330));assert.equal(x.stats().success,1);
 }
 const mouse=setup('mouse');mouse.start();
 assert.deepEqual(mouse.stats(),{success:1,failure:0});
 assert.equal(mouse.rec.state().awaitingRelease,false);
});
test('B2 release deadline is inclusive at 1500 ms; 1501 ms counts as cancellation',()=>{
 const good=setup();good.start();good.rec.feed(good.e('up',1800));assert.equal(good.stats().success,1);
 const late=setup();late.start();late.rec.feed(late.e('up',1801));
 assert.deepEqual(late.stats(),{success:0,failure:1});
 const timeout=setup();timeout.start();timeout.rec.feed(timeout.e('timeout',1801));
 assert.deepEqual(timeout.stats(),{success:0,failure:1});
 timeout.rec.feed(timeout.e('up',1900));assert.equal(timeout.stats().success,0);
});
test('B2 pending release cancels on pointercancel, lostcapture or wrong pointer identity',()=>{
 for(const type of ['cancel','lostcapture','up']){
  const x=setup();x.start();
  x.rec.feed(x.e(type,325,{pointerId:type==='up'?999:7}));
  assert.deepEqual(x.stats(),{success:0,failure:1},type);
  x.rec.feed(x.e('up',333));assert.equal(x.stats().success,0,type);
 }
});
test('B2 pending release cancels on hidden, blur, orientation or any extra press',()=>{
 for(const type of ['hidden','blur','orientation','cancel-wait']){
  const x=setup();x.start();x.rec.feed(x.e(type,325));
  assert.deepEqual(x.stats(),{success:0,failure:1},type);
 }
 const other=setup();other.start();other.rec.feed(other.e('down',325,{pointerId:99,corner:'tr'}));
 assert.deepEqual(other.stats(),{success:0,failure:1});
 assert.equal(other.rec.state().steps,0);
 const restart=setup();restart.start();
 restart.rec.feed(restart.e('down',325,{pointerId:99,corner:'tl'}));
 assert.deepEqual(restart.stats(),{success:0,failure:1});
 assert.equal(restart.rec.state().steps,1);
 for(const [corner,time] of [['tr',400],['bl',500],['br',600]])
  restart.rec.feed(restart.e('down',time,{pointerId:99,corner}));
 restart.rec.feed(restart.e('up',700,{pointerId:99}));
 assert.deepEqual(restart.stats(),{success:1,failure:1});
});
test('B2 after cancellation another full touch sequence can complete',()=>{
 const x=setup();x.start();x.rec.feed(x.e('cancel',350));
 assert.equal(x.stats().failure,1);
 x.start(400);x.rec.feed(x.e('up',820));
 assert.deepEqual(x.stats(),{success:1,failure:1});
});
test('B2 a missing final pointer ID cannot complete a touch gesture',()=>{
 const x=setup();
 for(const [i,corner] of corners.entries())
  x.rec.feed(x.e('down',100*i,{corner,pointerId:i===3?undefined:7}));
 assert.equal(x.stats().success,0);
 assert.equal(x.rec.state().awaitingRelease,false);
 assert.equal(x.stats().failure,1);
});