'use strict';
/* Audit regressions: pointer-button state, native radio state and legacy corners.
 * Pure/adapter tests only; trusted browser inputs are covered by browser E2E.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const gestures=require('../self-check/session/unlock-gestures.js');
const dimensions={width:1000,height:800,pointerId:1,pointerType:'mouse',button:0};
const event=(type,x,y,time)=>({...dimensions,type,x,y,time,buttons:type==='up'?0:1});
const sequences={
 tap_hold_tap:[event('down',500,560,0),event('up',500,560,100),event('down',500,560,200),event('up',500,560,2300),event('down',500,560,2400),event('up',500,560,2500)],
 hold_double_tap:[event('down',300,480,0),event('up',300,480,2800),event('down',700,480,2900),event('up',700,480,3000),event('down',700,480,3200),event('up',700,480,3300)],
 triangle3:[event('down',500,240,0),event('up',500,240,90),event('down',300,560,300),event('up',300,560,390),event('down',700,560,500),event('up',700,560,1250)],
 draw_z:[event('down',300,240,0),event('move',700,240,400),event('move',300,560,900),event('move',700,560,1300),event('up',700,560,1400)]
};
function run(id,events){
 let success=0,failure=0;
 const rec=gestures.createRecognizer(id,{onSuccess:()=>success++,onFailure:()=>failure++});
 for(const e of events)rec.feed(e);
 return {get success(){return success;},get failure(){return failure;},rec};
}

test('A-02 mouse chords and missing pressed-button state cancel gestures 2–5',()=>{
 for(const [id,sequence] of Object.entries(sequences)){
  const insert=id==='draw_z'?2:sequence.length-1,previous=sequence[insert-1];
  for(const buttons of [3,5,0]){
   const bad={...previous,type:'move',button:buttons===0?0:2,buttons,time:previous.time+1};
   const result=run(id,[...sequence.slice(0,insert),bad,...sequence.slice(insert)]);
   assert.equal(result.success,0,id+' buttons='+buttons);
   assert.equal(result.failure,1,id+' records exactly one abandoned sequence');
   for(const e of sequence)result.rec.feed({...e,time:e.time+10000});
   assert.equal(result.success,1,id+' fresh sequence completes');
  }
 }
});

test('A-02 ordinary left-button release with buttons=0 remains successful',()=>{
 for(const [id,sequence] of Object.entries(sequences))assert.equal(run(id,sequence).success,1,id);
});

// A small DOM event fixture executes the actual adapter/control module without
// pretending to prove browser trust, pointer capture or native layout behaviour.
class Node{
 constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.listeners=new Map();this.attributes={};this.checked=false;this.disabled=false;}
 append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n);}}
 appendChild(n){this.append(n);return n;}
 replaceChildren(...nodes){for(const child of this.children)child.parent=null;this.children=[];this.append(...nodes);}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}
 setAttribute(k,v){this.attributes[k]=String(v);}
 addEventListener(k,fn){if(!this.listeners.has(k))this.listeners.set(k,[]);this.listeners.get(k).push(fn);}
 removeEventListener(k,fn){this.listeners.set(k,(this.listeners.get(k)||[]).filter(x=>x!==fn));}
 emit(k,e={}){for(const fn of this.listeners.get(k)||[])fn(e);}
 descendants(){return this.children.flatMap(n=>[n,...n.descendants()]);}
 querySelectorAll(selector){
  assert.ok(selector==='input'||selector==='input[type="radio"]','fixture selector '+selector);
  return this.descendants().filter(n=>n.tagName==='INPUT'&&(selector==='input'||n.type==='radio'));
 }
 getBoundingClientRect(){return {left:0,top:0,width:1000,height:800};}
 setPointerCapture(id){this.capture=id;}
 hasPointerCapture(id){return this.capture===id;}
 releasePointerCapture(){this.capture=null;}
 focus(){}
}
function fixture(){
 const document=new Node('#document'),window=new Node('window');
 document.createElement=tag=>new Node(tag);document.body=new Node('body');document.append(document.body);
 document.getElementById=id=>document.descendants().find(n=>n.id===id)||null;
 let now=0,timer=0;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../self-check/session/unlock-gestures.js'),'utf8'),{
  window,document,performance:{now:()=>now},setTimeout:()=>++timer,clearTimeout:()=>{}
 },{filename:'unlock-gestures.js'});
 return {api:window.LSHUnlockGestures,document,window,setTime:t=>{now=t;}};
}

test('A-02 DOM adapter checks coalesced wrapper buttons before coordinate samples',()=>{
 for(const buttons of [3,0]){
  const f=fixture(),overlay=new Node('section');let success=0,failure=0;
  const binding=f.api.bindDOM(overlay,'tap_hold_tap',{onSuccess:()=>success++,onFailure:()=>failure++});
  const send=e=>{
   f.setTime(e.time);
   binding.surface.emit('pointer'+e.type,{...e,clientX:e.x,clientY:e.y});
  };
  const sequence=sequences.tap_hold_tap;
  for(const e of sequence.slice(0,-1))send(e);
  f.setTime(2410);
  binding.surface.emit('pointermove',{
   clientX:500,clientY:560,pointerId:1,pointerType:'mouse',button:2,buttons,
   getCoalescedEvents:()=>[{clientX:500,clientY:560,pointerId:1,pointerType:'mouse',button:-1,buttons:1}]
  });
  send(sequence.at(-1));
  assert.equal(success,0,'wrapper buttons='+buttons);
  assert.equal(failure,1,'wrapper cancels once before its safe-looking sample');
  for(const e of sequence)send({...e,time:e.time+10000});
  assert.equal(success,1,'a fresh gesture remains usable after cancellation');
  binding.destroy();
 }
});

test('A-04 teacher getter reconciles silent native radio selection and diagrams',()=>{
 const f=fixture(),root=new Node('section'),changes=[];
 const control=f.api.mountTeacher(root,'corners4',value=>changes.push(value));
 const inputs=root.querySelectorAll('input'),select=id=>inputs.forEach(n=>{n.checked=n.value===id;});
 const guide=root.descendants().find(n=>n.className==='lsh-unlock-guide');
 const figures=root.descendants().find(n=>n.className==='lsh-unlock-figures');
 assert.equal(control.getId(),'corners4');
 select('draw_z'); // Intentionally no change event.
 assert.equal(control.getId(),'draw_z');
 assert.equal(guide.textContent,f.api.byId('draw_z').guide);
 assert.equal(figures.children.length,2);
 for(const figure of figures.children)assert.match(figure.children[1].innerHTML,/Nakreslení Z/);
 assert.deepEqual(changes,[],'reading the form does not publish or emit a synthetic user action');
 select('hold_double_tap');inputs.find(n=>n.checked).emit('change');
 assert.equal(control.getId(),'hold_double_tap');
 assert.deepEqual(changes,['hold_double_tap'],'normal radio change still notifies its teacher panel');
});

test('A-04 missing, unknown or ambiguous radio selection fails closed without throwing',()=>{
 const f=fixture(),root=new Node('section');
 const control=f.api.mountTeacher(root,'corners4',()=>{});
 const inputs=root.querySelectorAll('input');
 const figures=root.descendants().find(n=>n.className==='lsh-unlock-figures');
 const tryButton=root.children.find(n=>n.tagName==='BUTTON');
 for(const input of inputs)input.checked=false;
 assert.equal(control.getId(),null);
 assert.equal(figures.children.length,0);assert.equal(tryButton.disabled,true);
 inputs[0].value='unknown-gesture';inputs[0].checked=true;
 assert.doesNotThrow(()=>tryButton.emit('click'));
 assert.equal(control.getId(),null);
 inputs[0].value='corners4';inputs[1].checked=true;
 assert.equal(control.getId(),null,'multiple checked entries do not choose a default');
 control.setId('triangle3');
 assert.equal(control.getId(),'triangle3');
 assert.equal(figures.children.length,2);assert.equal(tryButton.disabled,false);
});

test('A-05 legacy mouse corner steps survive blur, hidden and orientation before completion',()=>{
 const corners=['tl','tr','bl','br'];
 for(const type of ['blur','hidden','orientation'])for(const count of [1,2,3]){
  const sequence=corners.map((corner,i)=>({...dimensions,type:'down',corner,time:i*100}));
  sequence.splice(count,0,{...dimensions,type,time:(count-1)*100+50});
  const result=run('corners4',sequence);
  assert.equal(result.success,1,type+' after '+count+' corners');
  assert.equal(result.failure,0,'legacy partial sequence is not counted as abandoned');
 }
});

test('A-05 B2 fourth touch/pen release still cancels on environment changes',()=>{
 for(const pointerType of ['touch','pen'])for(const type of ['blur','hidden','orientation']){
  const sequence=['tl','tr','bl','br'].map((corner,i)=>({...dimensions,pointerType,type:'down',corner,time:i*100}));
  sequence.push({...dimensions,pointerType,type,time:350});
  sequence.push({...dimensions,pointerType,type:'up',time:400});
  const result=run('corners4',sequence);
  assert.equal(result.success,0,pointerType+' '+type);
  assert.equal(result.failure,1);
  assert.equal(result.rec.state().awaitingRelease,false);
 }
});
