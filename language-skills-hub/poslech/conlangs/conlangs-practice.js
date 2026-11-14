/* LSH R69 Conlangs interactive listening practice – A1–C2, local only. */
(()=>{
 'use strict';
 const api=window.LSHConlangs;
 if(!api)throw Error('Conlangs practice core is unavailable');
 const $=id=>document.getElementById(id);
 const el=(name,cls,txt)=>{const n=document.createElement(name);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
 const url=new URL(location.href);
 const selected=(url.searchParams.get('level')||'B2').toUpperCase();
 const locked=url.searchParams.get('zamek')==='1';
 const data=api.validate(DATA);
 if(locked&&!data.levels.includes(selected))throw Error('This CEFR variant is not available.');
 let level=data.levels.includes(selected)?selected:'B2';
 let responses={};
 const key=lv=>'lsh:conlangs:practice:r69:'+lv;
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
  r.type='radio';r.name='conlangs-'+q.id;r.value=value;
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
   const legend=el('legend','note',q.type==='mc'?'Choose one correct answer.':'Choose True, False or Not Stated.');
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
  $('matchWarn').textContent='';refreshProgress();
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
 function privacy(allLevels){
  const prompt=allLevels?'Delete all locally saved answers for all six Conlangs levels? This does not delete My Vocabulary.':'Clear saved answers for this level?';
  if(!window.confirm(prompt))return;
  try{if(allLevels)for(const lv of data.levels)localStorage.removeItem(key(lv));else localStorage.removeItem(key(level));}catch(_){}
  responses=api.normalizeResponses({});paintStatic();
  if(allLevels)location.href='../../index.html?skill=poslech';
 }
 function setup(){
  const savedTheme=(()=>{try{return localStorage.getItem('lsh-listening-theme')}catch(_){return null}})();
  if(savedTheme==='light')document.documentElement.dataset.theme='light';
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
   const iframe=el('iframe');iframe.title='TED-Ed: Constructed languages';
   iframe.src='https://www.youtube-nocookie.com/embed/a5mZ0R3h8m0?rel=0';
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
  responses=saved(level);paintStatic();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();
