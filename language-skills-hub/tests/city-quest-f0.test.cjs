"use strict";
const assert=require("node:assert/strict");
const test=require("node:test");
const E=require("../authoring/city-quest-f0/engine.js");
test("F0 route geometry and goal",()=>{
 assert.deepEqual(E.position(E.start),{x:168,y:580});
 assert.equal(E.distance(E.start,E.goal),5);
 const dirs=["east","east","east","north","north"];
 let route=[E.start], result;
 for(const direction of dirs){result=E.step(route,direction);route=result.route;}
 assert.equal(result.outcome,"success");
 assert.equal(route.length,6);
 assert.match(E.instructions(route),/City Museum!/);
});
test("F0 blocks teleporting, out-of-bounds, loops and invalid direction",()=>{
 const original=[E.start];
 assert.equal(E.move(original,{c:3,r:1}).outcome,"nonadjacent");
 assert.equal(E.move(original,{c:0,r:4}).outcome,"invalid");
 assert.equal(E.step(original,"unknown").outcome,"invalid");
 let step=E.step(original,"east");
 assert.equal(step.outcome,"moved");
 const reverse=E.step(step.route,"west");
 assert.equal(reverse.outcome,"undo");
 assert.equal(reverse.route.length,1);
 const second=E.step(step.route,"north");
 assert.equal(second.outcome,"moved");
 assert.equal(E.move(second.route,E.start).outcome,"nonadjacent");
});
test("F0 route instructions correctly describe turns",()=>{
 const path=[{c:0,r:3},{c:1,r:3},{c:1,r:2},{c:1,r:1},{c:2,r:1},{c:3,r:1}];
 assert.deepEqual(E.turns(path),[{direction:"east",blocks:1},{direction:"north",blocks:2},{direction:"east",blocks:2}]);
 const text=E.instructions(path);
 assert.match(text,/Turn right/); // initial orientation north -> east
 assert.match(text,/Turn left/);  // east -> north
 assert.match(text,/City Museum/);
});
test("F0 dialogue advances, repairs mistakes and terminates",()=>{
 assert.equal(E.choose("start","wrong").next,"wrongway");
 assert.equal(E.choose("wrongway","fix").next,"distance");
 assert.equal(E.choose("distance","distance-vague").next,"distance-repair");
 assert.equal(E.choose("distance-repair","repair-short").next,"complete");
 assert.equal(E.scenes.complete.options.length,0);
 assert.throws(()=>E.choose("start","bogus"),RangeError);
});
test("F0 all choices target existing scenes and use feedback",()=>{
 for(const [key,scene] of Object.entries(E.scenes)){
  assert.ok(scene.line && scene.prompt && scene.actor,key);
  for(const option of scene.options){
   assert.ok(E.scenes[option.next], key+" -> "+option.next);
   assert.ok(option.label && option.feedback && option.tone,key);
  }
 }
});
test("F0 all crossroads are valid and reachable",()=>{
 assert.equal(E.columns.length*E.rows.length,24);
 for(let c=0;c<E.columns.length;c++){
  for(let r=0;r<E.rows.length;r++)assert.equal(E.isNode({c,r}),true);
 }
});
