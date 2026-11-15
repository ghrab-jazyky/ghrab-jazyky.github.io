/* LSH SAD interactive listening practice – A1–C2, no login and no transmitted results. */
(()=>{
 'use strict';
 const api=window.LSHSAD;
 if(!api)throw Error('SAD practice core is unavailable');
 const $=id=>document.getElementById(id);
 const el=(name,cls,txt)=>{const n=document.createElement(name);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
 const url=new URL(location.href);
 const selected=(url.searchParams.get('level')||'B2').toUpperCase();
 const locked=url.searchParams.get('zamek')==='1';
 const data=api.validate(DATA);
 if(locked&&!data.levels.includes(selected))throw Error('This CEFR variant is not available.');
 let level=data.levels.includes(selected)?selected:'B2';
 let responses={};
 let reconstruction=null;
 const sequenceKey=lv=>'lsh:reconstruction:practice:r75:'+data.id+':'+lv;
 const key=lv=>'lsh:sad:practice:r68:'+lv;
 const saved=lv=>{
  let values={};
  try{values=api.normalizeResponses(JSON.parse(localStorage.getItem(key(lv))||'{}'))}
  catch(_){values=api.normalizeResponses({})}
  const used=new Set();for(const id of api.REQUIRED.filter(id=>id[0]==='C')){
   const value=values[id];if(value&&used.has(value))values[id]='';else if(value)used.add(value);
  }
  return values;
 };
 function store(){try{localStorage.setItem(key(level),JSON.stringify(responses))}catch(_){$('progressStatus').textContent='Local saving unavailable. The lesson still works until this page is closed.'}}
 function refreshProgress(){
  const count=api.REQUIRED.filter(id=>!!responses[id]).length;
  $('progressBar').style.width=(count*100/17)+'%';
  $('progressStatus').textContent=count+' of 17 questions answered.';
 }
 function choiceRow(q,value,label){
  const l=el('label','option'),r=el('input');
  r.type='radio';r.name='sad-'+q.id;r.value=value;
  r.checked=responses[q.id]===value;
  r.addEventListener('change',()=>{responses[q.id]=r.value;store();refreshProgress();clearReview(q.id[0]);});
  l.append(r);
  if(q.type==='mc')l.append(el('strong','',value));
  l.append(el('span','',label));return l;
 }
 function clearReview(section){
  $('review'+section).replaceChildren();
  $('status'+section).textContent='Answers changed. Check again when ready.';
 }
 function makeQuestion(q){
  const article=el('div','task');article.dataset.qid=q.id;
  const head=el('div','task-head');head.append(el('span','task-id',q.id),el('p','task-text',q.question));
  article.append(head);
  if(q.type==='match'){
   const block=el('div','match-answer');const s=el('select');
   s.id='answer-'+q.id;s.setAttribute('aria-label','Match explanation for '+q.id);
   const blank=el('option','','Select a letter');blank.value='';s.append(blank);
   for(const [letter,title] of data.variants[level].matchingBank){
    const option=el('option','',letter+' — '+title);option.value=letter;s.append(option);
   }
   s.value=responses[q.id]||'';
   s.addEventListener('change',()=>{
    const val=s.value;
    if(val&&api.REQUIRED.filter(id=>id[0]==='C'&&id!==q.id&&responses[id]===val).length){
     s.value=responses[q.id]||'';
     $('matchWarn').textContent='Each matching letter can only be used once.';
     return;
    }
    $('matchWarn').textContent='';responses[q.id]=val;store();refreshProgress();clearReview('C');
   });
   block.append(s);article.append(block);
  }else{
   const field=el('fieldset','task-field');
   // Section-level instructions are already visible; this legend labels the answer group for assistive technology.
   const legend=el('legend','sr-only-task-legend',q.id+': '+q.question);
   field.append(legend);const opts=el('div',q.type==='tns'?'options tns':'options');
   const values=q.type==='mc'?'ABCD'.split(''):api.TNS;
   for(let i=0;i<values.length;i++)opts.append(choiceRow(q,values[i],q.type==='mc'?q.options[i]:values[i]));
   field.append(opts);article.append(field);
  }
  return article;
 }
 function paintStatic(){
  $('topLevelText').textContent=level;
  for(const button of $('levelPills').querySelectorAll('button[data-level]')){
   const active=button.dataset.level===level;
   button.classList.toggle('active',active);
   button.setAttribute('aria-pressed',String(active));
   button.disabled=locked;
  }
  $('fixedNote').hidden=!locked;
  const variant=data.practice[level];
  $('goal').textContent=variant.objective;
  for(const [id,items] of [['preQuestions',variant.pre],['afterQuestions',variant.after]]){
   const node=$(id);node.replaceChildren();for(const text of items)node.append(el('li','',text));
  }
  $('vocabTasks').replaceChildren();
  for(const row of variant.vocabulary){
   const container=el('div','vocab-line');
   container.append(el('strong','',row.term),el('span','',row.cs+' · '+row.meaning));
   $('vocabTasks').append(container);
  }
  for(const sec of 'ABC'){
   const parent=$('questions'+sec);parent.replaceChildren();
   const part=data.variants[level].questionBank.filter(q=>q.id[0]===sec);
   for(const q of part)parent.append(makeQuestion(q));
   $('review'+sec).replaceChildren();$('status'+sec).textContent='Not checked yet.';
  }
  const bank=$('matchingBank');bank.replaceChildren();
  bank.append(el('h3','','Explanation bank A–G'));
  for(const [letter,meaning] of data.variants[level].matchingBank){
   const row=el('div','bank-row');row.append(el('strong','',letter),el('span','',meaning));bank.append(row);
  }
  $('matchWarn').textContent='';refreshProgress();renderSequence();
 }
 function check(section){
  const results=api.gradeAnswers(data,responses,level);
  const items=results.items.filter(x=>x.id[0]===section);
  const score=items.filter(x=>x.correct).length;
  $('status'+section).textContent='Correct answers: '+score+' / '+items.length+'. Review each explanation below.';
  const area=$('review'+section);area.replaceChildren();
  for(const q of items){
   const p=el('section','review '+(q.correct?'correct':'wrong'));
   p.append(el('strong','',q.id+' · '+(q.correct?'Correct':'Check this answer')));
   const dl=el('dl');
   for(const [term,value] of [['Your answer',q.selectedLabel],['Correct answer',q.expectedLabel]]){
    dl.append(el('dt','',term),el('dd','',value));
   }
   p.append(dl,el('p','',q.reason),el('p','note','Evidence in recording: approximately '+q.evidence));area.append(p);
  }
 }

 function installSequence(){
  const block=el('section','panel lsq');block.id='listeningReconstruction';
  const heading=el('div','stage-heading'),title=el('div');
  title.append(el('div','kicker','05 · Reconstruction'),el('h2','','Listen, order and explain'));
  heading.append(title,el('span','chip','Optional · separate from 17 questions'));
  block.append(heading,el('p','section-description',
   'Put the statements in the order in which they appear in the recording, not in historical or causal order. Tap a card, then its target position; with a mouse you can drag the card, or use the dotted handle on touchscreens.'));
  const guide=el('div','seq-guide');
  guide.append(el('span','', '① Tap one card, then its target position'),
   el('span','seq-guide-drag','⋮⋮ Drag the dotted handle'));
  block.append(guide);
  const list=el('ol','seq-list');list.id='sequenceList';
  const check=el('button','btn primary','✓ Check reconstruction');
  check.id='checkSequenceBtn';check.type='button';
  check.addEventListener('click',()=>reconstruction?.check());
  const status=el('p','seq-status');status.id='seqStatus';
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const review=el('div','seq-review');review.id='sequenceReview';
  block.append(list,check,status,review);
  $('third').after(block);
  const nav=document.querySelector('.side nav');
  const vocabLink=nav?.querySelector('a[href="#vocab"]');
  if(vocabLink){
   const link=el('a','','05 · Reconstruction');
   link.href='#listeningReconstruction';vocabLink.before(link);
   vocabLink.textContent='06 · Vocabulary';
   const after=nav.querySelector('a[href="#after"]');
   const finish=nav.querySelector('a[href="#finish"]');
   if(after)after.textContent='07 · After listening';
   if(finish)finish.textContent='08 · Practice review';
  }
  const vocabKicker=$('vocab').querySelector('.kicker');
  const afterKicker=$('after').querySelector('.kicker');
  if(vocabKicker)vocabKicker.textContent='06 · Optional vocabulary';
  if(afterKicker)afterKicker.textContent='07 · After listening';
 }
 function renderSequence(){
  const sequence=window.LSHListeningSequence;
  if(!sequence)throw Error('Shared Listening Studio reconstruction unavailable');
  const steps=sequence.bankFor(data.id,level);
  if(!steps)throw Error('Reconstruction missing for '+data.id+' '+level);
  let order=null;
  try{order=JSON.parse(localStorage.getItem(sequenceKey(level))||'null')}catch(_){}
  reconstruction?.destroy();
  reconstruction=sequence.mount({
   list:$('sequenceList'),status:$('seqStatus'),review:$('sequenceReview'),
   steps,order,onChange(value){
    try{localStorage.setItem(sequenceKey(level),JSON.stringify(value))}
    catch(_){return 'Reconstruction is not saved locally. Keep the page open.'}
   }
  });
 }

 function privacy(allLevels){
  const prompt=allLevels?'Delete all locally saved answers for all six SAD levels? This does not delete My Vocabulary.':'Clear saved answers for this level?';
  if(!window.confirm(prompt))return;
  try{for(const lv of allLevels?data.levels:[level]){
   localStorage.removeItem(key(lv));localStorage.removeItem(sequenceKey(lv));
  }}catch(_){}
  responses=api.normalizeResponses({});paintStatic();
  if(allLevels)location.href='../../index.html?skill=poslech';
 }
 function setup(){
  const savedTheme=(()=>{try{return localStorage.getItem('lsh-listening-theme')}catch(_){return null}})();
  if(savedTheme==='light'||savedTheme==='dark')document.documentElement.dataset.theme=savedTheme;
  const syncTheme=()=>{$('themeBtn').textContent=document.documentElement.dataset.theme==='light'?'☾ Dark mode':'☀ Light mode';};syncTheme();
  $('themeBtn').addEventListener('click',()=>{
   const value=document.documentElement.dataset.theme==='light'?'dark':'light';
   document.documentElement.dataset.theme=value;try{localStorage.setItem('lsh-listening-theme',value)}catch(_){}syncTheme();
  });
  $('fullscreenBtn').addEventListener('click',async()=>{
   try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
   catch(_){window.alert('Full-screen display is not supported on this device.');}
  });
  $('loadVideo').addEventListener('click',()=>{
   const frame=$('videoFrame'),cover=$('videoCover');
   if(!frame||!cover)return;
   const iframe=el('iframe');iframe.title='TED-Ed: Winter got you feeling down?';
   iframe.src='https://www.youtube-nocookie.com/embed/0RiDPisQAzM?rel=0';
   iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
   iframe.allowFullscreen=true;frame.replaceChildren(iframe);
   $('videoStatus').textContent='If the embedded player is blocked, use the original TED-Ed or YouTube link above.';
  });
  $('printBtn').addEventListener('click',()=>window.print());
  $('clearBtn').addEventListener('click',()=>privacy(false));
  $('privacyBtn').addEventListener('click',()=>privacy(true));
  for(const section of 'ABC')$('check'+section).addEventListener('click',()=>check(section));
  for(const button of $('levelPills').querySelectorAll('button[data-level]'))button.addEventListener('click',()=>{
   if(locked)return;
   level=button.dataset.level;responses=saved(level);paintStatic();
   const next=new URL(location.href);next.searchParams.set('level',level);history.replaceState(null,'',next.href);
  });
  installSequence();responses=saved(level);paintStatic();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();
