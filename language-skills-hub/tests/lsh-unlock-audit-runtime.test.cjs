'use strict';
/* Deterministic integration tests of the real session UI and attempt engine.
 * Only the DOM, platform lifecycle, clock and fullscreen Promise are controlled.
 * Browser tests separately exercise trusted input and actual page integration.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const core=require('../self-check/session/attempt-core.js');
const gestures=require('../self-check/session/unlock-gestures.js');
const source=fs.readFileSync(path.join(__dirname,'../self-check/session/session-ui.js'),'utf8');

class Element {
 constructor(tag=''){this.tagName=tag;this.events=new Map();this.children=[];this.hidden=false;this.attrs={};this.textContent='';}
 addEventListener(type,fn){if(!this.events.has(type))this.events.set(type,[]);this.events.get(type).push(fn);}
 removeEventListener(type,fn){this.events.set(type,(this.events.get(type)||[]).filter(x=>x!==fn));}
 async fire(type,event={}){for(const fn of this.events.get(type)||[])await fn({type,preventDefault(){},...event});}
 append(...elements){for(const e of elements){this.children.push(e);e.parentElement=this;}}
 appendChild(e){this.append(e);return e;}
 before(...elements){this.parentElement.append(...elements);}
 insertBefore(e){this.append(e);}
 setAttribute(k,v){this.attrs[k]=v;}
 removeAttribute(k){delete this.attrs[k];}
 focus(){}
}
function harness(options={}){
 const skill=options.skill||'reading',topic=skill==='reading'?'rl-asteroids':'ll-sad';
 const registryKey='lsh:device-attempt:r64:'+skill+':audit123:'+topic+'|en|B2';
 const data=options.data||new Map();
 if(Object.hasOwn(options,'rawRegistry'))data.set(registryKey,options.rawRegistry);
 const stats={reads:0,writes:0,hashWrites:0,opens:0,tabMounts:0,submits:0,fullscreen:0};
 const store={getItem(key){stats.reads++;if(options.registryReadThrows&&key===registryKey)throw new Error('read denied');return data.get(key)??null;},
  setItem(key,value){stats.writes++;if(options.writeThrows)throw new Error('write denied');data.set(key,value);},
  removeItem:key=>data.delete(key)};
 let time=1700000000000,serial=0;
 const timers=new Map(),intervals=new Map();
 const setTimeout=(fn,delay)=>{const id=++serial;timers.set(id,{fn,at:time+delay,delay});return id;};
 const setInterval=(fn,delay)=>{const id=++serial;intervals.set(id,{fn,delay});return id;};
 const advance=ms=>{
  const end=time+ms;
  for(;;){const next=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
   if(!next)break;timers.delete(next[0]);time=next[1].at;next[1].fn();}
  time=end;
 };
 const document=new Element(),elements=[];
 document.hidden=false;document.documentElement=new Element('html');document.fullscreenElement=document.documentElement;
 document.hasFocus=()=>true;
 document.createElement=tag=>{const e=new Element(tag);elements.push(e);return e;};
 document.getElementById=id=>elements.find(e=>e.id===id)||null;
 const parent=new Element('body'),workspace=document.createElement('div'),results=document.createElement('div');
 workspace.id='workspace';results.id='results';parent.append(workspace,results);
 const window=new Element();let callbacks,session;
 const requests=[];
 document.documentElement.requestFullscreen=()=>{
  stats.fullscreen++;
  return new Promise((resolve,reject)=>requests.push({resolve,reject}));
 };
 Object.assign(window,{performance:{now:()=>time-1700000000000},innerWidth:820,innerHeight:1180,screen:{width:820},
  crypto:{getRandomValues:bytes=>bytes.fill(42)},setTimeout,clearTimeout:id=>timers.delete(id),
  LSHAttemptCore:{...core,open(input){stats.opens++;return core.open(input);}},
  LSHTabGuard:{mount(){stats.tabMounts++;return {available:true,probe(){},activate(){},deactivate(){},dispose(){}};}},
  LSHUnlockGestures:{...gestures,bindDOM(_overlay,_id,c){callbacks=c;return {reset(){},destroy(){}};}}
 });
 const search=options.search||'?timer=5&attempt=audit123&p=n1';
 const location={search,href:'https://test.invalid/'+search};
 const sandbox={window,document,location,navigator:{maxTouchPoints:options.touch===false?0:1},localStorage:store,
  history:{state:{},replaceState(_state,_title,href){stats.hashWrites++;location.href=href;}},
  setTimeout,clearTimeout:id=>timers.delete(id),setInterval,clearInterval:id=>intervals.delete(id),
  Date:{now:()=>time},URL,URLSearchParams,Uint8Array};
 if(options.storageUnavailable)Object.defineProperty(sandbox,'localStorage',{get(){throw new Error('storage unavailable');}});
 vm.runInNewContext(source,sandbox,{filename:'session-ui.js'});
 const cfg={skill,topic,lang:'en',level:'B2',workspace,results,
  restoreAnswers(){},getAnswers:()=>({sample:'preserved answer'}),
  onSubmit(){stats.submits++;session.finish();}};
 return {window,document,elements,data,registryKey,stats,requests,timers,advance,
  mount(){session=window.LSHSessionUI.mount(cfg);session.initialize();return session;},
  get session(){return session;},get state(){return session.status();},
  get continueVisible(){return !document.getElementById('sessionUnlockContinue').hidden;},
  get lockVisible(){return !document.getElementById('sessionLock').hidden;},
  gesture(){callbacks.onSuccess();},
  async lock(){await document.getElementById('sessionStart').fire('click');session.save();await document.fire('contextmenu');document.fullscreenElement=null;},
  async hide(kind='hidden'){if(kind==='hidden'){document.hidden=true;await document.fire('visibilitychange');}else await window.fire('pagehide');},
  async show(kind='hidden'){if(kind==='hidden'){document.hidden=false;await document.fire('visibilitychange');}else await window.fire('pageshow');},
  async settle(index,outcome){
   if(outcome==='timeout')advance(3001);
   else if(outcome==='success'){document.fullscreenElement=document.documentElement;await document.fire('fullscreenchange');requests[index].resolve();}
   else requests[index].reject(new Error('forced fullscreen refusal'));
   await Promise.resolve();await Promise.resolve();
  },
  jump:ms=>{time+=ms;},tick:()=>{for(const {fn} of intervals.values())fn();}
 };
}
const plain=value=>JSON.parse(JSON.stringify(value));
function savedRegistry(overrides={}){
 return {session:'1234567890abcdef12345678',variant:'rl-asteroids|en|B2',consumed:false,limitMinutes:5,createdAt:1600000000000,
  unlock:'corners4',unlockCode:'n1',configurationMismatchSeen:false,extra:{keep:'unchanged'},...overrides};
}

for(const skill of ['reading','listening'])for(const touch of [true,false]){
 for(const lifecycle of ['hidden','pagehide'])for(const outcome of ['reject','success','timeout']){
  test(`A01 ${skill} touch=${touch}: ${lifecycle} cancels pending ${outcome}`,async()=>{
   const h=harness({skill,touch});h.mount();await h.lock();h.gesture();
   assert.equal(h.requests.length,1);
   const previous=plain(h.state);
   await h.hide(lifecycle);
   assert.equal([...h.timers.values()].filter(x=>x.delay===3000).length,0,'cancel request timer');
   await h.settle(0,outcome);
   assert.equal(h.state.phase,'interrupted');assert.equal(h.state.resumptions.length,0);
   assert.equal(h.continueVisible,false);assert.equal(h.lockVisible,true);
   assert.deepEqual(plain(h.state.incidents),previous.incidents);
   assert.deepEqual(plain(h.state.answers),previous.answers);
   await h.show(lifecycle);
   assert.equal(h.state.phase,'interrupted');assert.equal(h.continueVisible,false);
   documentFullscreen(h,true);h.gesture();
   assert.equal(h.state.phase,'running','a fresh completed gesture is accepted after return');
   assert.equal(h.state.resumptions.length,1);
  });
 }
 test(`A01 ${skill} touch=${touch}: old completion and queued timeout cannot affect a newer request`,async()=>{
  const h=harness({skill,touch});h.mount();await h.lock();h.gesture();
  const oldTimer=[...h.timers.values()].find(x=>x.delay===3000).fn;
  await h.hide();await h.show();h.gesture();
  assert.equal(h.requests.length,2,'new request is not stuck behind a cancelled request');
  await h.settle(0,'success');oldTimer();
  assert.equal(h.state.phase,'interrupted');assert.equal(h.continueVisible,false);
  assert.equal(h.state.resumptions.length,0);
  assert.equal([...h.timers.values()].filter(x=>x.delay===3000).length,1,'new request timer remains live');
  await h.settle(1,'success');
  assert.equal(h.state.phase,'running');assert.equal(h.state.resumptions.length,1);
 });
 test(`A01 ${skill} touch=${touch}: settling first preserves subsequent visibility protection`,async()=>{
  const h=harness({skill,touch});h.mount();await h.lock();h.gesture();await h.settle(0,'reject');
  assert.equal(h.state.phase,touch?'running':'interrupted');
  assert.equal(h.continueVisible,!touch);
  await h.hide();await h.show();
  assert.equal(h.state.phase,'interrupted');assert.equal(h.continueVisible,false);
  assert.equal(h.state.incidents.length,touch?2:1);
  if(touch)assert.equal(h.state.incidents.at(-1).kind,'hidden');
 });
 test(`A01 ${skill} touch=${touch}: expiry, manual submission and stop reject stale completions`,async()=>{
  for(const end of ['expiry','submit','stop']){
   const h=harness({skill,touch});h.mount();await h.lock();h.gesture();
   if(end==='expiry'){h.jump(300001);h.tick();}
   else if(end==='submit')h.session.finish();
   else h.session.stop();
   await h.settle(0,'success');
   assert.equal(h.state.phase,end==='stop'?'interrupted':'submitted',end);
   assert.equal(h.state.resumptions.length,0,end);assert.equal(h.continueVisible,false,end);
   assert.equal(h.stats.submits,end==='expiry'?1:0,end);
  }
 });
}
function documentFullscreen(h,value){h.document.fullscreenElement=value?h.document.documentElement:null;}
test('A01 hidden state is checked even when visibilitychange was not delivered',async()=>{
 for(const touch of [true,false]){
  const h=harness({touch});h.mount();await h.lock();h.gesture();h.document.hidden=true;
  await h.settle(0,'reject');
  assert.equal(h.state.phase,'interrupted');assert.equal(h.continueVisible,false);
  h.gesture();assert.equal(h.requests.length,1,'hidden completion cannot start another request');
 }
});
test('A01 pagehide remains inactive until pageshow; ordinary fullscreen focus transition survives',async()=>{
 const h=harness();h.mount();await h.lock();h.gesture();await h.hide('pagehide');
 h.gesture();assert.equal(h.requests.length,1);
 await h.show('pagehide');h.gesture();await h.window.fire('blur');await h.settle(1,'success');
 assert.equal(h.state.phase,'running');assert.equal(h.state.resumptions.length,1);
 await h.window.fire('focus');assert.equal(h.state.incidents.length,1);
});

test('A03 truly missing registry begins complete history; failed write does not',()=>{
 const h=harness();h.mount();
 assert.equal(h.state.configurationMismatchSeen,false);assert.equal(h.state.mismatchAtLastOpen,null);
 assert.equal(JSON.parse(h.data.get(h.registryKey)).configurationMismatchSeen,false);
 const failed=harness({writeThrows:true});failed.mount();
 assert.equal(failed.state.configurationMismatchSeen,null);assert.equal(failed.state.persistent,false);
 assert.equal(failed.data.has(failed.registryKey),false);
});
test('A03 unreadable existing records recover with unknown history, including after reload',()=>{
 for(const raw of ['{bad json','null','{}','[]','',JSON.stringify(savedRegistry({session:'broken'}))]){
  const h=harness({rawRegistry:raw});h.mount();
  assert.equal(h.state.configurationMismatchSeen,null,raw);assert.equal(h.state.mismatchAtLastOpen,null,raw);
  assert.equal(JSON.parse(h.data.get(h.registryKey)).configurationMismatchSeen,null,raw);
  const reload=harness({data:h.data});reload.mount();
  assert.equal(reload.state.configurationMismatchSeen,null,'recovery must not turn into false on reload');
  assert.equal(reload.stats.writes,0,'readable unknown history is not rewritten');
 }
});
test('A03 failed registry read with writable storage cannot establish complete history',()=>{
 const h=harness({rawRegistry:JSON.stringify(savedRegistry()),registryReadThrows:true});h.mount();
 assert.equal(h.stats.writes,1,'accepted recovery write is retained');
 assert.equal(JSON.parse(h.data.get(h.registryKey)).configurationMismatchSeen,null);
 assert.equal(h.state.configurationMismatchSeen,null);assert.equal(h.state.mismatchAtLastOpen,null);
 assert.equal(h.state.persistent,false,'successful write cannot conceal a failed read');
 assert.ok(h.elements.some(e=>e.textContent.includes('Local storage unavailable')));
 const unavailable=harness({storageUnavailable:true});unavailable.mount();
 assert.equal(unavailable.state.configurationMismatchSeen,null);assert.equal(unavailable.state.persistent,false);
 assert.equal(unavailable.stats.writes,0);
});
test('A03 readable legacy/invalid flag remains unknown and preserves the original record',()=>{
 for(const flag of ['legacy','invalid']){
  const registry=savedRegistry();
  if(flag==='legacy'){delete registry.unlock;delete registry.unlockCode;delete registry.configurationMismatchSeen;}
  else registry.configurationMismatchSeen='invalid';
  const raw=JSON.stringify(registry);
  const h=harness({rawRegistry:raw,search:'?timer=5&attempt=audit123'+(flag==='legacy'?'':'&p=n1')});h.mount();
  assert.equal(h.state.configurationMismatchSeen,null);assert.equal(h.stats.writes,0);
  assert.equal(h.data.get(h.registryKey),raw);
 }
});
test('A03 a new observed mismatch becomes sticky true while preserving valid registry fields',()=>{
 const initial=savedRegistry({configurationMismatchSeen:null});
 const h=harness({rawRegistry:JSON.stringify(initial),search:'?timer=5&attempt=audit123&p=n2'});h.mount();
 assert.equal(h.state.pinnedUnlockCode,'n1');assert.equal(h.state.configurationMismatchSeen,true);
 assert.deepEqual(JSON.parse(h.data.get(h.registryKey)),{...initial,configurationMismatchSeen:true});
 const again=harness({data:h.data});again.mount();
 assert.equal(again.state.configurationMismatchSeen,true);assert.equal(again.state.mismatchAtLastOpen,false);
 assert.equal(again.stats.writes,0);
 const failed=harness({rawRegistry:JSON.stringify(initial),search:'?timer=5&attempt=audit123&p=n2',writeThrows:true});failed.mount();
 assert.equal(failed.state.configurationMismatchSeen,null);assert.equal(failed.state.mismatchPersistFailed,true);
 assert.deepEqual(JSON.parse(failed.data.get(failed.registryKey)),initial);
});
test('A03 invalid gesture links and corrupted gesture metadata never enter recovery or mutate attempts',()=>{
 for(const p of ['', 'unknown', 'N1', 'n1&p=n2']){
  const h=harness({rawRegistry:'{bad json',search:'?timer=5&attempt=audit123&p='+p});
  const before=[...h.data];
  assert.throws(()=>h.mount(),{code:'invalid-link'});
  assert.deepEqual([...h.data],before);assert.equal(h.stats.reads,0);assert.equal(h.stats.writes,0);
  assert.equal(h.stats.hashWrites,0);assert.equal(h.stats.opens,0);assert.equal(h.stats.tabMounts,0);
 }
 const raw=JSON.stringify(savedRegistry({unlock:'unknown'}));
 const h=harness({rawRegistry:raw});assert.throws(()=>h.mount(),{code:'corrupted-registry'});
 assert.equal(h.data.get(h.registryKey),raw);assert.equal(h.stats.writes,0);assert.equal(h.stats.opens,0);
});
