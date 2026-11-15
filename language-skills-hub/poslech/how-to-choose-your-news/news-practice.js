/* LSH E3 practice, same data/UI contract as Listening Studio R70/R71. */
(()=>{
 'use strict';
 const api=window.LSHNewsListening;
 if(!api)throw Error('News Listening core unavailable');
 const $=id=>document.getElementById(id);
 const el=(tag,cls,txt)=>{const n=document.createElement(tag);
  if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
 const params=new URLSearchParams(location.search);
 const selected=(params.get('level')||'B2').toUpperCase();
 const locked=params.get('zamek')==='1';
 const data=api.validate(DATA);
 if(locked&&!data.levels.includes(selected))throw Error('Teacher-selected level unavailable');
 let level=data.levels.includes(selected)?selected:'B2',responses={};
 const key=lv=>'lsh:how-to-choose-your-news:practice:e3:'+lv;
 function load(lv){
  let values={};
  try{values=api.normalizeResponses(JSON.parse(localStorage.getItem(key(lv))||'{}'))}
  catch(_){values=api.normalizeResponses({})}
  const used=new Set();
  for(const id of api.REQUIRED.filter(x=>x[0]==='C')){
   if(values[id]&&used.has(values[id]))values[id]='';
   else if(values[id])used.add(values[id]);
  }
  return values;
 }
 function store(){
  try{localStorage.setItem(key(level),JSON.stringify(responses))}
  catch(_){$('progressStatus').textContent='Local saving unavailable. Your work remains in this tab.'}
 }
 function progress(){
  const done=api.REQUIRED.filter(id=>!!responses[id]).length;
  $('progressBar').style.width=(done/17*100)+'%';
  $('progressStatus').textContent=done+' of 17 questions answered.';
 }
 function clearReview(section){
  $('review'+section).replaceChildren();
  $('status'+section).textContent='Answers changed. Check again when ready.';
 }
 function option(q,value,label){
  const l=el('label','option'),r=el('input');r.type='radio';
  r.name='news-'+q.id;r.value=value;r.checked=responses[q.id]===value;
  r.addEventListener('change',()=>{
   responses[q.id]=r.value;store();progress();clearReview(q.id[0]);
  });
  l.append(r);
  if(q.type==='mc')l.append(el('strong','',value));
  l.append(el('span','',label));
  return l;
 }
 function renderQuestion(q){
  const article=el('div','task');article.dataset.qid=q.id;
  const head=el('div','task-head');
  head.append(el('span','task-id',q.id),el('p','task-text',q.question));
  article.append(head);
  if(q.type==='match'){
   const block=el('div','match-answer'),select=el('select');
   select.id='answer-'+q.id;
   select.setAttribute('aria-label','Match explanation for '+q.id);
   const blank=el('option','','Select a letter');blank.value='';select.append(blank);
   for(const [letter,meaning]of data.practiceVariants[level].matchingBank){
    const row=el('option','',letter+' — '+meaning);row.value=letter;select.append(row);
   }
   select.value=responses[q.id]||'';
   select.addEventListener('change',()=>{
    const value=select.value;
    if(value&&api.REQUIRED.some(id=>id[0]==='C'&&id!==q.id&&responses[id]===value)){
     select.value=responses[q.id]||'';
     $('matchWarn').textContent='Each matching letter can only be used once.';
     return;
    }
    $('matchWarn').textContent='';responses[q.id]=value;store();progress();clearReview('C');
   });
   block.append(select);article.append(block);
  }else{
   const field=el('fieldset','task-field');
   // One instruction per section; semantic legend stays accessible but visually hidden (R71).
   field.append(el('legend','sr-only-task-legend',q.id+': '+q.question));
   const options=el('div',q.type==='tns'?'options tns':'options');
   const values=q.type==='mc'?'ABCD'.split(''):api.TNS;
   values.forEach((value,i)=>options.append(option(q,value,q.type==='mc'?q.options[i]:value)));
   field.append(options);article.append(field);
  }
  return article;
 }
 function render(){
  $('topLevelText').textContent=level;
  for(const button of $('levelPills').querySelectorAll('button[data-level]')){
   const active=button.dataset.level===level;
   button.classList.toggle('active',active);
   button.setAttribute('aria-pressed',String(active));button.disabled=locked;
  }
  $('fixedNote').hidden=!locked;
  const practice=data.practice[level];
  $('goal').textContent=practice.objective;
  for(const [id,values] of [['preQuestions',practice.pre],['afterQuestions',practice.after]]){
   const parent=$(id);parent.replaceChildren();
   for(const value of values)parent.append(el('li','',value));
  }
  $('vocabTasks').replaceChildren();
  for(const item of practice.vocabulary){
   const row=el('div','vocab-line');
   row.append(el('strong','',item.term),el('span','',item.cs+' · '+item.meaning));
   $('vocabTasks').append(row);
  }
  for(const section of 'ABC'){
   $('questions'+section).replaceChildren();
   for(const q of data.practiceVariants[level].questionBank.filter(x=>x.id[0]===section))
    $('questions'+section).append(renderQuestion(q));
   $('review'+section).replaceChildren();
   $('status'+section).textContent='Not checked yet.';
  }
  $('matchingBank').replaceChildren(el('h3','','Explanation bank A–G'));
  for(const [letter,meaning] of data.practiceVariants[level].matchingBank){
   const row=el('div','bank-row');row.append(el('strong','',letter),el('span','',meaning));
   $('matchingBank').append(row);
  }
  $('matchWarn').textContent='';progress();
 }
 function check(section){
  const result=api.gradeAnswers(data,responses,level,'practice');
  const items=result.items.filter(q=>q.id[0]===section);
  const score=items.filter(q=>q.correct).length;
  $('status'+section).textContent='Correct answers: '+score+' / '+items.length+'. Review your answers below.';
  const area=$('review'+section);area.replaceChildren();
  for(const q of items){
   const block=el('section','review '+(q.correct?'correct':'wrong'));
   block.append(el('strong','',q.id+' · '+(q.correct?'Correct':'Check this answer')));
   const dl=el('dl');
   for(const [name,value]of [['Your answer',q.selectedLabel],['Correct answer',q.expectedLabel]])
    dl.append(el('dt','',name),el('dd','',value));
   block.append(dl,el('p','',q.reason),el('p','note',
    'Transcript-based listening clue: '+q.evidence+'. Precise audio time not independently confirmed.'));
   area.append(block);
  }
 }
 function removeSaved(all){
  if(!confirm(all?'Delete answers for all six levels? This does not remove My Vocabulary.':
   'Clear answers for this level?'))return;
  try{
   if(all){for(const lv of api.LEVELS)localStorage.removeItem(key(lv))}
   else localStorage.removeItem(key(level));
  }catch(_){}
  responses=api.normalizeResponses({});render();
  if(all)location.href='../../index.html?skill=poslech';
 }
 function setup(){
  const savedTheme=(()=>{try{return localStorage.getItem('lsh-listening-theme')}catch(_){return null}})();
  if(savedTheme==='light'||savedTheme==='dark')document.documentElement.dataset.theme=savedTheme;
  function themeLabel(){
   $('themeBtn').textContent=document.documentElement.dataset.theme==='light'?'☾ Dark mode':'☀ Light mode';
  }
  themeLabel();
  $('themeBtn').addEventListener('click',()=>{
   const mode=document.documentElement.dataset.theme==='light'?'dark':'light';
   document.documentElement.dataset.theme=mode;
   try{localStorage.setItem('lsh-listening-theme',mode)}catch(_){}
   themeLabel();
  });
  $('fullscreenBtn').addEventListener('click',async()=>{
   try{
    if(document.fullscreenElement)await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
   }catch(_){alert('Full-screen display is not supported on this device.')}
  });
  $('loadVideo').addEventListener('click',()=>{
   const frame=$('videoFrame');if(!frame)return;
   const iframe=el('iframe');iframe.title='TED-Ed: How to choose your news';
   iframe.src='https://www.youtube-nocookie.com/embed/q-Y-z6HmRgI?rel=0';
   iframe.referrerPolicy='strict-origin-when-cross-origin';
   iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
   iframe.allowFullscreen=true;
   frame.replaceChildren(iframe);
   $('videoStatus').textContent='If embedded playback is blocked, open the original TED-Ed or YouTube page.';
  });
  $('printBtn').addEventListener('click',()=>window.print());
  $('clearBtn').addEventListener('click',()=>removeSaved(false));
  $('privacyBtn').addEventListener('click',()=>removeSaved(true));
  for(const section of 'ABC')$('check'+section).addEventListener('click',()=>check(section));
  for(const button of $('levelPills').querySelectorAll('button[data-level]'))
   button.addEventListener('click',()=>{
    if(locked)return;
    level=button.dataset.level;responses=load(level);render();
    const url=new URL(location.href);url.searchParams.set('level',level);
    history.replaceState(null,'',url.href);
   });
  responses=load(level);render();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();
