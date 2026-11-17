/* Shared, client-side gesture geometry and recognizer for timed LSH self-checks.
 * Convenience for a supervising teacher, NOT authentication or anti-cheat.
 */
(function(host){
 'use strict';
 const DEFINITIONS=Object.freeze([
  {id:'corners4',code:'n1',name:'Čtyři rohy',
   short:'Postupně čtyři okraje obrazovky.',
   guide:'Klepněte postupně do čtyř rohů zamčené obrazovky: levý horní, pravý horní, levý dolní, pravý dolní. Mezi klepnutími nečekejte déle než 8 sekund.'},
  {id:'tap_hold_tap',code:'n2',name:'Klepnutí – podržení – klepnutí',
   short:'Tři kroky na jednom místě.',
   guide:'Uprostřed dolní poloviny zamčené obrazovky (asi ve dvou třetinách výšky) jednou krátce klepněte, na stejném místě podržte prst asi 2–3 sekundy a hned poté ještě jednou krátce klepněte. Mezi kroky nečekejte déle než sekundu.',
   points:[[.5,.7],[.5,.7],[.5,.7]],kinds:['tap','hold','tap'],
   durations:[[0,350],[1800,3500],[0,350]],gaps:[1500,1500],total:8000},
  {id:'hold_double_tap',code:'n3',name:'Dlouhý stisk a dvojklep',
   short:'Podržení vlevo a dvojklep vpravo.',
   guide:'Vlevo pod středem obrazovky podržte prst asi 3 sekundy, pusťte a do 3 sekund dvakrát rychle za sebou klepněte na stejné výšce vpravo.',
   points:[[.3,.6],[.7,.6],[.7,.6]],kinds:['hold','tap','tap'],
   durations:[[2300,4000],[0,350],[0,350]],gaps:[3000,400],total:9000},
  {id:'triangle3',code:'n4',name:'Skrytý trojúhelník',
   short:'Dvě klepnutí a krátké podržení.',
   guide:'Klepněte krátce na horní prostřední bod, potom na levý dolní bod. Třetí bod vpravo dole podržte po dobu 600–1 000 ms a teprve potom prst uvolněte. Celé gesto dokončete do 4,5 sekundy.',
   points:[[.5,.3],[.3,.7],[.7,.7]],kinds:['tap','tap','hold'],
   durations:[[0,350],[0,350],[600,1000]],gaps:[1500,1500],total:4500},
  {id:'draw_z',code:'n5',name:'Nakreslení Z',
   short:'Jediný tah přes čtyři body.',
   guide:'Jedním tahem bez zvednutí prstu nakreslete přes střed obrazovky velké písmeno Z: nahoře zleva doprava, šikmo dolů doleva a dole zleva doprava. Kreslete svižně, tah má trvat asi 1–2 sekundy.',
   points:[[.3,.3],[.7,.3],[.3,.7],[.7,.7]],kinds:['drag'],durations:[[400,4000]],total:4000}
 ]);
 const IDS=Object.freeze(DEFINITIONS.map(d=>d.id));
 const byId=id=>DEFINITIONS.find(d=>d.id===id)||null;
 const byCode=code=>DEFINITIONS.find(d=>d.code===code)||null;
 const codeFor=id=>byId(id)?.code||null;
 function parseUrl(params,timed){
  if(!timed)return {id:null,code:null,legacyLink:false};
  const values=params.getAll('p');
  if(!values.length)return {id:'corners4',code:null,legacyLink:true};
  if(values.length!==1||!byCode(values[0])){
   const error=new Error('Invalid lock variant');error.code='invalid-link';throw error;
  }
  return {id:byCode(values[0]).id,code:values[0],legacyLink:false};
 }
 function geometry(id,width,height){
  if(!byId(id)||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)
   throw new Error('Invalid gesture geometry');
  const r=Math.max(44,Math.min(width,height)*.09);
  if(id==='corners4'){
   const rects=[
    {x:9,y:9,width:58,height:58},
    {x:width-67,y:9,width:58,height:58},
    {x:9,y:height-67,width:58,height:58},
    {x:width-67,y:height-67,width:58,height:58}
   ];
   return {width,height,r,points:rects.map(q=>({x:q.x+29,y:q.y+29})),rects};
  }
  return {width,height,r,points:byId(id).points.map(([x,y])=>({x:x*width,y:y*height})),rects:[]};
 }
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 function distSegment(p,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
  const t=den?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/den)):0;
  return {distance:dist(p,{x:a.x+t*dx,y:a.y+t*dy}),t};
 }
 function pointPathDistance(p,points){
  return Math.min(...points.slice(1).map((q,i)=>distSegment(p,points[i],q).distance));
 }
 // Deterministic, DOM-independent state machine. feed() receives CSS px and monotonic ms.
 function createRecognizer(id,options){
  const def=byId(id);if(!def)throw new Error('Unknown gesture');
  options=options||{};
  let steps=0,firstAt=null,releasedAt=null,active=null,geometryAt=null,baseSize=null,previous=null;
  const signalSuccess=()=>{if(options.onSuccess)options.onSuccess()};
  const fail=()=>{if(steps>=2&&options.onFailure)options.onFailure()};
  function reset(count){
   if(count)fail();
   steps=0;firstAt=null;releasedAt=null;active=null;geometryAt=null;baseSize=null;previous=null;
  }
  function state(){return {steps,active:!!active,firstAt,releasedAt};}
  function nextDeadline(){
   if(!steps&&!active)return null;
   let deadline=Infinity;
   if(firstAt!==null&&def.total)deadline=Math.min(deadline,firstAt+def.total+1);
   if(active){
    const max=id==='draw_z'?4000:(def.durations?.[steps]?.[1]);
    if(max!==undefined)deadline=Math.min(deadline,active.at+max+1);
   }else if(id==='corners4'&&releasedAt!==null)deadline=releasedAt+8001;
   else if(releasedAt!==null&&def.gaps?.[steps-1]!==undefined)
    deadline=Math.min(deadline,releasedAt+def.gaps[steps-1]+1);
   return Number.isFinite(deadline)?deadline:null;
  }
  function validShape(e){
   return e&&Number.isFinite(e.time)&&Number.isFinite(e.width)&&Number.isFinite(e.height)&&e.width>0&&e.height>0;
  }
  function consumeDown(e,restart){
   const g=geometry(id,e.width,e.height);
   if(id==='draw_z'){
    if(!Number.isFinite(e.x)||!Number.isFinite(e.y)||dist({x:e.x,y:e.y},g.points[0])>g.r)return;
    firstAt=e.time;steps=1;geometryAt=g;baseSize={width:e.width,height:e.height};
    active={pointerId:e.pointerId,at:e.time,x:e.x,y:e.y};previous={x:e.x,y:e.y};
    return;
   }
   const target=g.points[steps];
   const hit=Number.isFinite(e.x)&&Number.isFinite(e.y)&&dist({x:e.x,y:e.y},target)<=g.r;
   if(!hit){
    const counted=steps>=2;
    reset(true);
    if(!restart&&counted){} // Failure was counted once.
    if(!restart)consumeDown(e,true); // Offending press may begin a new sequence.
    return;
   }
   if(firstAt===null)firstAt=e.time;
   if(!baseSize)baseSize={width:e.width,height:e.height};
   geometryAt=g;active={pointerId:e.pointerId,at:e.time,x:e.x,y:e.y};
  }
  function sampleZ(p){
   const g=geometryAt;
   const a=previous,b=p;
   const seglen=dist(a,b),samples=Math.max(1,Math.ceil(seglen/Math.max(5,g.r/3)));
   for(let i=0;i<=samples;i++){
    const t=i/samples,q={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
    if(pointPathDistance(q,g.points)>1.5*g.r)return false;
   }
   const reached=[];
   for(let index=1;index<4;index++){
    const hit=distSegment(g.points[index],a,b);
    if(hit.distance<=g.r)reached.push({index,t:hit.t});
   }
   reached.sort((x,y)=>x.t-y.t||x.index-y.index);
   for(const hit of reached){
    if(hit.index<steps)continue;
    if(hit.index!==steps)return false;
    steps++;
   }
   previous=b;
   return true;
  }
  function feed(e){
   if(e?.type==='reset'){reset(false);return state();}
   if(!validShape(e))return state();
   if(baseSize&&(Math.abs(e.width-baseSize.width)>baseSize.width*.05||
      Math.abs(e.height-baseSize.height)>baseSize.height*.05)){reset(true);}
   if(e.type==='timeout'){
    const deadline=nextDeadline();
    if(deadline!==null&&e.time>=deadline)reset(true);
    return state();
   }
   if(e.type==='cancel'||e.type==='lostcapture'||e.type==='blur'||e.type==='hidden'||e.type==='orientation'){
    if(e.type==='lostcapture'&&(!active||active.pointerId!==e.pointerId))return state();
    if(e.type==='cancel'&&active&&active.pointerId!==e.pointerId)return state();
    reset(true);return state();
   }
   if(id==='corners4'){
    if(e.type!=='down'||!e.corner||(e.pointerType==='mouse'&&e.button!==0))return state();
    if(releasedAt!==null&&e.time-releasedAt>8000)reset(true);
    const order=['tl','tr','bl','br'];
    if(order[steps]!==e.corner){
     reset(true);
     if(e.corner==='tl'){steps=1;firstAt=e.time;releasedAt=e.time;}
     return state();
    }
    steps++;releasedAt=e.time;
    if(steps===4){reset(false);signalSuccess();}
    return state();
   }
   if(e.type==='down'){
    if(active){reset(true);return state();} // Multitouch / second mouse button.
    if(e.pointerType==='mouse'&&e.button!==0)return state();
    if(firstAt!==null&&def.total&&e.time-firstAt>def.total)reset(true);
    if(steps>0&&releasedAt!==null&&e.time-releasedAt>def.gaps[steps-1])reset(true);
    consumeDown(e,false);return state();
   }
   if(!active||active.pointerId!==e.pointerId)return state();
   const point={x:e.x,y:e.y};
   if(!Number.isFinite(point.x)||!Number.isFinite(point.y)){reset(true);return state();}
   if(id==='draw_z'){
    if(e.type==='move'||e.type==='up'){
     if(!sampleZ(point)){reset(true);return state();}
     if(e.time-active.at>4000){reset(true);return state();}
     if(e.type==='up'){
      const duration=e.time-active.at;
      const done=steps===4&&duration>=400&&duration<=4000&&dist(point,geometryAt.points[3])<=geometryAt.r;
      if(!done)reset(true);
      else{reset(false);signalSuccess();}
     }
    }
    return state();
   }
   if(dist(point,{x:active.x,y:active.y})>geometryAt.r/2){reset(true);return state();}
   if(e.time-active.at>def.durations[steps][1]){reset(true);return state();}
   if(e.type==='up'){
    const duration=e.time-active.at,[min,max]=def.durations[steps];
    if(duration<min||duration>max){reset(true);return state();}
    if(def.total&&e.time-firstAt>def.total){reset(true);return state();}
    steps++;releasedAt=e.time;active=null;geometryAt=null;
    if(steps===def.kinds.length){reset(false);signalSuccess();}
   }
   return state();
  }
  return Object.freeze({feed,reset:()=>reset(false),state,nextDeadline});
 }
 function bindDOM(overlay,id,callbacks){
  callbacks=callbacks||{};
  const recognizer=createRecognizer(id,{onSuccess:callbacks.onSuccess,onFailure:callbacks.onFailure});
  const isCorners=id==='corners4',surface=document.createElement('div'),scope=isCorners?null:surface;
  let timer=null,disposed=false;
  surface.className=isCorners?'lsh-session-corners':'lsh-unlock-surface';
  surface.setAttribute('aria-hidden','true');
  const listeners=[];
  const monotonic=()=>typeof performance==='object'&&typeof performance.now==='function'?performance.now():Date.now();
  function on(target,type,fn,opts){target.addEventListener(type,fn,opts);listeners.push([target,type,fn,opts]);}
  const rect=()=>overlay.getBoundingClientRect();
  function pack(type,e,corner){
   const q=rect();
   return {type,time:monotonic(),width:q.width,height:q.height,
    x:e?.clientX-q.left,y:e?.clientY-q.top,pointerId:e?.pointerId,
    button:e?.button,pointerType:e?.pointerType,corner};
  }
  function arm(){
   if(timer!==null)clearTimeout(timer);
   const deadline=recognizer.nextDeadline();
   if(deadline!==null&&!disposed)timer=setTimeout(()=>{timer=null;
    const q=rect();recognizer.feed({type:'timeout',time:monotonic(),width:q.width,height:q.height});arm();
   },Math.max(0,deadline-monotonic()));
  }
  function emit(type,e,corner){
   if(disposed)return;
   recognizer.feed(pack(type,e,corner));arm();
  }
  function first(e){if(callbacks.onPointerStart)callbacks.onPointerStart(e);}
  if(isCorners){
   for(const corner of ['tl','tr','bl','br']){
    const div=document.createElement('div');div.className='lsh-corner lsh-corner-'+corner;
    on(div,'pointerdown',e=>{first(e);emit('down',e,corner);});
    surface.appendChild(div);
   }
  }else{
   on(scope,'pointerdown',e=>{
    first(e);
    if(e.pointerType==='mouse'&&e.button!==0){
     if(recognizer.state().active)emit('cancel',e);
     return;
    }
    try{scope.setPointerCapture(e.pointerId);}catch(_){}
    emit('down',e);
   });
   on(scope,'pointermove',e=>{
    let events=[];try{if(typeof e.getCoalescedEvents==='function')events=e.getCoalescedEvents();}catch(_){}
    if(!events.length)events=[e];
    for(const sample of events)emit('move',sample);
   });
   on(scope,'pointerup',e=>{emit('up',e);try{if(scope.hasPointerCapture(e.pointerId))scope.releasePointerCapture(e.pointerId);}catch(_){}});
   on(scope,'pointercancel',e=>emit('cancel',e));
   on(scope,'lostpointercapture',e=>emit('lostcapture',e));
   on(scope,'contextmenu',e=>e.preventDefault());
   on(window,'blur',()=>emit('blur'));
   on(document,'visibilitychange',()=>{if(document.hidden)emit('hidden');});
   on(window,'resize',()=>{const q=rect();
    recognizer.feed({type:'timeout',time:monotonic(),width:q.width,height:q.height});arm();
   });
   on(window,'orientationchange',()=>emit('orientation'));
  }
  overlay.appendChild(surface);
  return Object.freeze({surface,recognizer,reset:()=>{recognizer.reset();arm();},
   destroy:()=>{disposed=true;if(timer!==null)clearTimeout(timer);for(const [t,k,f,o] of listeners)t.removeEventListener(k,f,o);surface.remove();}});
 }
 const xml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
 function svg(id,width,height){
  const def=byId(id),g=geometry(id,width,height);
  const dots=g.points.map((p,i)=>({x:p.x,y:p.y,i}));
  let details='';
  if(id==='corners4'){
   details='<polyline points="'+dots.map(d=>d.x+','+d.y).join(' ')+'" fill="none" stroke="currentColor" stroke-opacity=".6" stroke-dasharray="9 11" stroke-width="3" marker-end="url(#tip)"/>';
   details+=g.rects.map((q,i)=>'<rect x="'+q.x+'" y="'+q.y+'" width="58" height="58" fill="none" stroke="currentColor" stroke-width="2" data-corner="'+i+'"/>'+
    '<text x="'+(q.x+29)+'" y="'+(q.y+38)+'" text-anchor="middle" fill="currentColor" font-size="28">'+(i+1)+'</text>').join('');
  }else{
   const unique=dots.filter((d,i)=>dots.findIndex(x=>x.x===d.x&&x.y===d.y)===i);
   const path=dots.map(d=>d.x+','+d.y).join(' ');
   if(id==='draw_z')details+='<polyline points="'+path+'" fill="none" stroke="currentColor" stroke-width="4" marker-end="url(#tip)"/>';
   else if(unique.length>1)details+='<polyline points="'+path+'" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="7 8" marker-end="url(#tip)"/>';
   details+=unique.map(d=>{
    const indexes=dots.filter(x=>x.x===d.x&&x.y===d.y).map(x=>x.i+1);
    return '<circle data-point="'+d.i+'" cx="'+d.x+'" cy="'+d.y+'" r="'+g.r+'" fill="currentColor" fill-opacity=".1" stroke="currentColor" stroke-width="2"/>'+
     '<text x="'+d.x+'" y="'+(d.y+7)+'" text-anchor="middle" fill="currentColor" font-size="23">'+indexes.join(' / ')+'</text>';
   }).join('');
  }
  if(id==='triangle3')details+='<text x="'+(width*.5)+'" y="'+(height*.84)+'" text-anchor="middle" fill="currentColor" font-size="24">3: podržet 600–1 000 ms</text>';
  if(id==='tap_hold_tap')details+='<text x="'+(width*.5)+'" y="'+(height*.82)+'" text-anchor="middle" fill="currentColor" font-size="24">2: podržet 2–3 s</text>';
  if(id==='hold_double_tap')details+='<text x="'+(width*.5)+'" y="'+(height*.75)+'" text-anchor="middle" fill="currentColor" font-size="24">1: podržet asi 3 s · vpravo 2×</text>';
  return '<svg class="lsh-unlock-diagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+xml(def.name)+'">'+
   '<title>'+xml(def.name)+' ('+(width>height?'na šířku':'na výšku')+')</title><desc>'+xml(def.guide)+'</desc>'+
   '<defs><marker id="tip" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="currentColor"/></marker></defs>'+
   '<rect x="2" y="2" width="'+(width-4)+'" height="'+(height-4)+'" fill="none" stroke="currentColor" stroke-opacity=".6" stroke-width="4"/>'+
   '<rect x="'+(width*.22)+'" y="'+(height*.43)+'" width="'+(width*.56)+'" height="'+(height*.14)+'" rx="15" fill="currentColor" fill-opacity=".04" stroke="currentColor" stroke-opacity=".35"/>'+
   details+'</svg>';
 }
 // Teacher-only illustration and try-out; does not instantiate an attempt.
 function mountTeacher(hostNode,initial,onChange){
  const root=hostNode;
  if(!root)throw new Error('Missing teacher gesture control');
  let value=byId(initial)?initial:'corners4',binding=null;
  root.replaceChildren();
  const chooser=document.createElement('div');chooser.className='lsh-unlock-options';chooser.setAttribute('role','radiogroup');
  chooser.setAttribute('aria-label','Způsob odemčení přerušeného testu');
  const details=document.createElement('details');details.className='lsh-unlock-details';
  const summary=document.createElement('summary');summary.textContent='Zobrazit obrázkový návod';
  const guide=document.createElement('p');guide.className='lsh-unlock-guide';
  const figures=document.createElement('div');figures.className='lsh-unlock-figures';
  const hint=document.createElement('p');hint.className='small-note';
  hint.textContent='Body leží na stejném místě vzhledem k velikosti obrazovky v obou polohách zařízení.';
  details.append(summary,guide,figures,hint);
  for(const def of DEFINITIONS){
   const label=document.createElement('label');label.className='lsh-unlock-option';
   const input=document.createElement('input');input.type='radio';input.name='unlockMethod';input.value=def.id;
   input.checked=def.id===value;
   const text=document.createElement('span');text.className='lsh-unlock-option-copy';
   const title=document.createElement('strong');title.textContent=def.name;
   const short=document.createElement('small');short.textContent=def.short;
   text.append(title,short);
   const thumb=document.createElement('span');thumb.className='lsh-unlock-thumb';thumb.innerHTML=svg(def.id,1024,768);
   label.append(input,thumb,text);chooser.appendChild(label);
   input.addEventListener('change',()=>{if(input.checked){value=def.id;update();if(onChange)onChange(value);}});
  }
  function update(){
   const def=byId(value);
   guide.textContent=def.guide;figures.replaceChildren();
   for(const [w,h,caption] of [[1024,768,'Na šířku'],[768,1024,'Na výšku']]){
    const figure=document.createElement('figure');const title=document.createElement('figcaption');title.textContent=caption;
    const drawing=document.createElement('div');drawing.innerHTML=svg(def.id,w,h);
    figure.append(title,drawing);figures.appendChild(figure);
   }
  }
  const tryButton=document.createElement('button');tryButton.type='button';tryButton.className='action ghost';tryButton.textContent='VYZKOUŠET GESTO';
  const note=document.createElement('p');note.className='small-note';
  note.textContent='Gesto proveďte plynule a svižně, bez dlouhých pauz. Na počítači se po gestu může objevit tlačítko Pokračovat – klikněte na ně, test se vrátí do celé obrazovky.';
  root.append(chooser,details,note,tryButton);
  update();
  function close(){
   if(binding){binding.destroy();binding=null;}
   document.getElementById('lshTeacherDemo')?.remove();
   document.removeEventListener('keydown',esc);
   tryButton.focus();
  }
  function esc(e){if(e.key==='Escape'){e.preventDefault();close();}}
  tryButton.addEventListener('click',()=>{
   close();
   const demo=document.createElement('section');demo.id='lshTeacherDemo';
   demo.className='lsh-session-overlay lsh-unlock-teacher-demo';demo.setAttribute('role','dialog');
   demo.setAttribute('aria-modal','true');demo.setAttribute('aria-label','Ukázka gesta');
   const panel=document.createElement('div');panel.className='lsh-session-lock-panel';
   const heading=document.createElement('h2');heading.textContent='Test locked';
   const body=document.createElement('p');body.textContent='The test was locked. Please contact your teacher. The timer continues.';
   panel.append(heading,body);
   const banner=document.createElement('p');banner.className='lsh-unlock-demo-banner';banner.textContent='UKÁZKA – nejde o skutečný test';
   const closeButton=document.createElement('button');closeButton.type='button';closeButton.className='action ghost lsh-unlock-demo-close';closeButton.textContent='Ukončit ukázku';
   const feedback=document.createElement('p');feedback.className='lsh-unlock-demo-feedback';feedback.setAttribute('role','status');
   closeButton.addEventListener('click',close);
   demo.append(panel,banner,closeButton,feedback);document.body.appendChild(demo);
   binding=bindDOM(demo,value,{
    onSuccess:()=>{feedback.textContent='Gesto bylo úspěšně rozpoznáno.';binding?.reset();},
    onFailure:()=>{feedback.textContent='Sekvence nebyla dokončena. Zkuste to znovu.';}
   });
   document.addEventListener('keydown',esc);closeButton.focus();
  });
  return Object.freeze({getId:()=>value,setId:id=>{if(!byId(id))return;value=id;
   for(const x of chooser.querySelectorAll('input'))x.checked=x.value===id;update();},
   closeDemo:close});
 }
 const api=Object.freeze({DEFINITIONS,IDS,byId,byCode,codeFor,parseUrl,geometry,createRecognizer,bindDOM,svg,mountTeacher});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else host.LSHUnlockGestures=api;
})(typeof window!=='undefined'?window:this);
