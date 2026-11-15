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
 // E8: optional writing is independent of the 17 automatically scored answers.
 const MAX_DRAFT_CHARS=2000;
 const draftKey=lv=>'lsh:how-to-choose-your-news:writing:e8:'+lv;
 const clean=value=>typeof value==='string'?value.slice(0,MAX_DRAFT_CHARS):'';
 function loadDraft(lv){
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(draftKey(lv))||'{}')}catch(_){}
  if(!saved||typeof saved!=='object'||Array.isArray(saved))saved={};
  return {notes:clean(saved.notes),sentence:clean(saved.sentence),
   after:data.practice[lv].after.map((_,i)=>clean(Array.isArray(saved.after)?saved.after[i]:''))};
 }
 let draft=loadDraft(level);
 function updateDraftStatus(){
  const target=$('writingStatus');if(!target)return;
  const count=draft.after.filter(x=>x.trim()).length;
  target.textContent='Optional writing: '+count+' / '+draft.after.length+
   ' after-listening responses drafted. Writing is not automatically graded.';
 }
 function storeDraft(){
  try{localStorage.setItem(draftKey(level),JSON.stringify(draft));updateDraftStatus()}
  catch(_){const target=$('writingStatus');if(target)target.textContent=
   'Writing could not be saved locally. Export your work before closing this tab.'}
 }
 function writingBox(id,label,initial,onInput,rows=3){
  const wrap=el('div','news-writing-group');
  const lab=el('label','news-writing-label',label);lab.htmlFor=id;
  const textarea=el('textarea','news-writing');textarea.id=id;
  textarea.rows=rows;textarea.maxLength=MAX_DRAFT_CHARS;textarea.value=initial;
  textarea.addEventListener('input',()=>onInput(textarea.value));
  wrap.append(lab,textarea);return wrap;
 }
 const COACHING=Object.freeze({
  A1:'Try one short sentence. Start with: “I check a story by ...”',
  A2:'Use simple connectors: “First ... Then ...” Give one example from the video.',
  B1:'Explain your idea and support it with one detail from the recording.',
  B2:'Give an argument, a contrasting point and an example from the narrator.',
  C1:'Distinguish evidence, inference and opinion; consider a limitation or exception.',
  C2:'Evaluate assumptions, counterarguments and the limits of source verification.'
 });
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
  $('newsScaffold').textContent='Level '+level+' · '+COACHING[level];
  $('newsNotes').value=draft.notes;
  $('newsSentence').value=draft.sentence;
  $('preQuestions').replaceChildren();
  for(const value of practice.pre)$('preQuestions').append(el('li','',value));
  $('afterQuestions').replaceChildren();
  for(let i=0;i<practice.after.length;i++){
   const li=el('li');
   li.append(el('span','news-prompt',practice.after[i]),
    writingBox('newsAfter'+i,'Your response (optional · teacher reviewed)',
     draft.after[i],value=>{draft.after[i]=value;storeDraft()},level==='A1'?2:4));
   $('afterQuestions').append(li);
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
  $('matchWarn').textContent='';progress();updateDraftStatus();
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
 function exportAnswers(){
  const bank=data.practiceVariants[level];
  const matches=Object.fromEntries(bank.matchingBank);
  const lines=['LANGUAGE SKILLS HUB · Listening Lab · PRACTICE',
   'How to Choose Your News · '+level,
   'Original video: '+data.video,
   'Saved locally by the student. Not an official school test or verified grade.',
   '', 'AUTOMATICALLY CHECKABLE PRACTICE · 17 tasks'];
  for(const q of bank.questionBank){
   const value=responses[q.id]||'';
   const shown=!value?'Not answered':q.type==='mc'?
    value+' — '+q.options[value.charCodeAt(0)-65]:
    q.type==='match'?value+' — '+(matches[value]||''):value;
   lines.push('',q.id+' · '+q.question,'My answer: '+shown);
  }
  lines.push('','PERSONAL LISTENING NOTES · optional',draft.notes||'(not written)',
   '','AFTER LISTENING · optional, teacher-reviewed');
  for(let i=0;i<data.practice[level].after.length;i++)
   lines.push('',(i+1)+'. '+data.practice[level].after[i],
    draft.after[i]||'(not written)');
  lines.push('','MY VOCABULARY SENTENCE · optional',draft.sentence||'(not written)',
   '','Open writing is not automatically scored. Teacher review may be needed.');
  const blob=new Blob([lines.join('\n')+'\n'],{type:'text/plain;charset=utf-8'});
  const blobUrl=URL.createObjectURL(blob),a=el('a');
  a.href=blobUrl;a.download='LSH_News_Practice_'+level+'_Answers.txt';a.hidden=true;
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(blobUrl),2000);
 }
 function installPracticeExtras(){
  // Separate scoped stylesheet: do not change shared Listening Studio or TEST.
  const style=el('link');style.rel='stylesheet';style.href='news-practice-extras.css';
  document.head.append(style);
  const scaffold=el('p','news-scaffold');scaffold.id='newsScaffold';
  $('preQuestions').after(scaffold);
  scaffold.after(writingBox('newsNotes','My listening notes (optional)',draft.notes,
   value=>{draft.notes=value;storeDraft()},level==='A1'?2:4));
  const beforeHint=$('before').querySelector('p.note');
  if(beforeHint)beforeHint.textContent='Before listening: share your ideas. In the scored tasks, use evidence from the narrator.';
  $('vocabTasks').after(writingBox('newsSentence',
   'Use a new vocabulary word in your own sentence (optional)',
   draft.sentence,value=>{draft.sentence=value;storeDraft()},2));
  const summary=$('finish').querySelector('.source-actions');
  const written=el('p','news-writing-status');written.id='writingStatus';
  summary.before(written);
  const checkAll=el('button','action primary','✓ Check all three sections');
  checkAll.id='checkAllBtn';checkAll.type='button';
  checkAll.addEventListener('click',()=>{
   for(const section of 'ABC')check(section);
   $('finish').scrollIntoView({behavior:'smooth',block:'start'});
  });
  const exportBtn=el('button','action','↓ Save my answers (.txt)');
  exportBtn.id='exportBtn';exportBtn.type='button';
  exportBtn.addEventListener('click',exportAnswers);
  summary.insertBefore(checkAll,$('printBtn'));summary.insertBefore(exportBtn,$('printBtn'));
  const frame=$('videoFrame'),cover=$('videoCover');
  const close=el('button','action','× Close embedded video');
  close.id='closeVideoBtn';close.type='button';close.hidden=true;
  $('videoStatus').after(close);
  close.addEventListener('click',()=>{
   frame.replaceChildren(cover);close.hidden=true;
   $('videoStatus').textContent='Embedded playback closed. Load the video again or open the official source.';
  });
  for(const section of ['first','second','third']){
   const replay=el('a','action news-replay-link','▶ Open / replay original TED-Ed video');
   replay.href=data.video;replay.target='_blank';replay.rel='noopener noreferrer';
   $(section).querySelector('.section-description').after(replay);
  }
 }
 function removeSaved(all){
  if(!confirm(all?'Delete practice answers and writing for all six levels? My Vocabulary is kept.':
   'Clear this level’s practice answers and optional writing?'))return;
  try{
   if(all){for(const lv of api.LEVELS){localStorage.removeItem(key(lv));localStorage.removeItem(draftKey(lv))}}
   else{localStorage.removeItem(key(level));localStorage.removeItem(draftKey(level))}
  }catch(_){}
  responses=api.normalizeResponses({});draft=loadDraft(level);render();
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
   $('closeVideoBtn').hidden=false;
   $('videoStatus').textContent='If embedded playback is blocked, open the original TED-Ed or YouTube page.';
  });
  $('printBtn').addEventListener('click',()=>window.print());
  $('clearBtn').addEventListener('click',()=>removeSaved(false));
  $('privacyBtn').addEventListener('click',()=>removeSaved(true));
  for(const section of 'ABC')$('check'+section).addEventListener('click',()=>check(section));
  for(const button of $('levelPills').querySelectorAll('button[data-level]'))
   button.addEventListener('click',()=>{
    if(locked)return;
    level=button.dataset.level;responses=load(level);draft=loadDraft(level);render();
    const url=new URL(location.href);url.searchParams.set('level',level);
    history.replaceState(null,'',url.href);
   });
  installPracticeExtras();responses=load(level);draft=loadDraft(level);render();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();
