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
 let answerSaveFailed=false;
 const key=lv=>'lsh:how-to-choose-your-news:practice:e3:'+lv;
 // E8: optional writing is independent of the 17 automatically scored answers.
 const MAX_DRAFT_CHARS=2000;
 const draftKey=lv=>'lsh:how-to-choose-your-news:writing:e8:'+lv;
 const clean=value=>typeof value==='string'?value.slice(0,MAX_DRAFT_CHARS):'';
 function loadDraft(lv){
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(draftKey(lv))||'{}')}catch(_){}
  if(!saved||typeof saved!=='object'||Array.isArray(saved))saved={};
  const wordCount=data.practice[lv].vocabulary.length;
  const vocab=Array.from({length:wordCount},(_,i)=>{
   const value=Array.isArray(saved.vocab)?saved.vocab[i]:null;
   return Number.isInteger(value)&&value>=0&&value<wordCount?value:null;
  });
  const steps=data.practice[lv].sequence;
  const defaultSequence=Array.from({length:steps.length},(_,i)=>i^1)
   .map((v,i)=>v<steps.length?v:i);
  const previous=saved.sequence;
  const valid=Array.isArray(previous)&&previous.length===steps.length&&
   previous.every(v=>Number.isInteger(v)&&v>=0&&v<steps.length)&&
   new Set(previous).size===steps.length;
  const sequence=valid?[...previous]:defaultSequence;
  return {notes:clean(saved.notes),sentence:clean(saved.sentence),vocab,sequence,
   challenge:data.practice[lv].challenge.map((_,i)=>clean(Array.isArray(saved.challenge)?saved.challenge[i]:'')),
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
 const DURATION=Object.freeze({
  A1:'30–40 min',A2:'35–45 min',B1:'40–50 min',
  B2:'45–55 min',C1:'50–65 min',C2:'55–70 min'
 });
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
  // Stale or manually altered local storage must not crash grading or export.
  for(const q of data.practiceVariants[lv].questionBank){
   const allowed=q.type==='mc'?['A','B','C','D']:
    q.type==='tns'?api.TNS:data.practiceVariants[lv].matchingBank.map(x=>x[0]);
   if(values[q.id]&&!allowed.includes(values[q.id]))values[q.id]='';
  }
  const used=new Set();
  for(const id of api.REQUIRED.filter(x=>x[0]==='C')){
   if(values[id]&&used.has(values[id]))values[id]='';
   else if(values[id])used.add(values[id]);
  }
  return values;
 }
 function store(){
  try{localStorage.setItem(key(level),JSON.stringify(responses));answerSaveFailed=false}
  catch(_){answerSaveFailed=true}
 }
 function progress(){
  const done=api.REQUIRED.filter(id=>!!responses[id]).length;
  $('progressBar').style.width=(done/17*100)+'%';
  $('progressStatus').textContent=done+' of 17 questions answered.'+
   (answerSaveFailed?' Local saving unavailable: export your answers before closing this tab.':'');
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
 function renderVocabPractice(){
  const words=data.practice[level].vocabulary,order=[3,6,1,5,0,4,2];
  const quiz=$('newsVocabQuiz');quiz.replaceChildren();
  if(words.length!==7)throw Error('NEWS vocabulary practice requires seven distinct words.');
  for(let i=0;i<words.length;i++){
   const row=el('div','news-vocab-question');
   const label=el('label','news-writing-label',words[i].term+' · choose its meaning');
   const select=el('select','news-vocab-select');
   select.id='newsVocabSelect'+i;label.htmlFor=select.id;
   const blank=el('option','','— Choose a meaning —');blank.value='';select.append(blank);
   for(let j=0;j<order.length;j++){
    const index=order[j],option=el('option','',
     String.fromCharCode(65+j)+' — '+words[index].meaning);
    option.value=String(index);select.append(option);
   }
   select.value=Number.isInteger(draft.vocab[i])?String(draft.vocab[i]):'';
   select.addEventListener('change',()=>{
    const picked=select.value===''?null:Number(select.value);
    if(picked!==null&&draft.vocab.some((x,j)=>j!==i&&x===picked)){
     select.value=Number.isInteger(draft.vocab[i])?String(draft.vocab[i]):'';
     $('newsVocabStatus').textContent='Use each meaning only once.';
     return;
    }
    draft.vocab[i]=picked;storeDraft();
    $('newsVocabStatus').textContent='Vocabulary answers changed. Check again when ready.';
    $('newsVocabReview').replaceChildren();
   });
   row.append(label,select);quiz.append(row);
  }
  $('newsVocabStatus').textContent='Optional vocabulary practice · 7 matches; not part of 17 listening questions.';
  $('newsVocabReview').replaceChildren();
 }
 function checkVocabPractice(){
  const words=data.practice[level].vocabulary;
  const answered=draft.vocab.filter(x=>x!==null).length;
  const correct=draft.vocab.filter((x,i)=>x===i).length;
  $('newsVocabStatus').textContent='Optional vocabulary: '+correct+' / '+words.length+
   ' correct · '+answered+' answered. Separate from the listening score.';
  const area=$('newsVocabReview');area.replaceChildren();
  for(let i=0;i<words.length;i++)if(draft.vocab[i]!==i){
   const result=el('div','review wrong');
   result.append(el('strong','',words[i].term),
    el('p','', 'Correct meaning: '+words[i].meaning));
   area.append(result);
  }
 }
 function renderSequence(){
  const steps=data.practice[level].sequence,list=$('newsSequenceItems');
  list.replaceChildren();
  for(let i=0;i<draft.sequence.length;i++){
   const index=draft.sequence[i],li=el('li','news-sequence-item');
   li.id='newsSeqRow'+i;
   li.append(el('span','news-sequence-position','Position '+(i+1)),
    el('p','news-sequence-text',steps[index]));
   const actions=el('div','news-sequence-actions');
   for(const [delta,action] of [[-1,'up'],[1,'down']]){
    const button=el('button','action news-sequence-move',
     delta<0?'↑ Up':'↓ Down');
    button.type='button';button.disabled=i+delta<0||i+delta>=steps.length;
    button.setAttribute('aria-label','Move statement in position '+(i+1)+' '+action);
    button.addEventListener('click',()=>{
     const j=i+delta;
     [draft.sequence[i],draft.sequence[j]]=[draft.sequence[j],draft.sequence[i]];
     storeDraft();renderSequence();
     const next=$('newsSeqRow'+j);
     (next?.querySelector('button:not(:disabled)')||next)?.focus();
    });
    actions.append(button);
   }
   li.append(actions);list.append(li);
  }
  $('newsSequenceStatus').textContent='Reorder the statements to match the original video. '+
   'Optional; not included in the 17-question listening score.';
  $('newsSequenceReview').replaceChildren();
 }
 function checkSequence(){
  const source=data.practice[level].sequence;
  const correct=draft.sequence.filter((index,i)=>index===i).length;
  $('newsSequenceStatus').textContent='Reconstruction: '+correct+' / '+source.length+
   ' in the correct position. Separate from the listening score.';
  const review=$('newsSequenceReview');review.replaceChildren();
  for(let i=0;i<source.length;i++)if(draft.sequence[i]!==i){
   const row=el('div','review wrong');
   row.append(el('strong','', 'Position '+(i+1)+' · Check the order'),
    el('p','', 'Your statement: '+source[draft.sequence[i]]),
    el('p','', 'Correct statement: '+source[i]));
   review.append(row);
  }
 }
 function renderChallenge(){
  const prompts=data.practice[level].challenge,section=$('newsChallengeSection');
  section.hidden=prompts.length===0;
  const list=$('newsChallengePrompts');list.replaceChildren();
  for(let i=0;i<prompts.length;i++){
   const li=el('li');
   const prompt=el('span','news-prompt',prompts[i]);prompt.id='newsChallengePrompt'+i;
   const field=writingBox('newsChallenge'+i,
    'Your critical response to question '+(i+1)+' (teacher-reviewed)',
    draft.challenge[i],v=>{draft.challenge[i]=v;storeDraft()},5);
   field.querySelector('textarea').setAttribute('aria-describedby',prompt.id);
   li.append(prompt,field);list.append(li);
  }
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
  $('newsDuration').textContent='Suggested '+DURATION[level]+' · incl. optional tasks';
  $('newsNotes').value=draft.notes;
  $('newsSentence').value=draft.sentence;
  $('preQuestions').replaceChildren();
  for(const value of practice.pre)$('preQuestions').append(el('li','',value));
  $('afterQuestions').replaceChildren();
  for(let i=0;i<practice.after.length;i++){
   const li=el('li');
   const prompt=el('span','news-prompt',practice.after[i]);
   prompt.id='newsAfterPrompt'+i;
   const response=writingBox('newsAfter'+i,
    'Your response to question '+(i+1)+' (optional · teacher reviewed)',
    draft.after[i],value=>{draft.after[i]=value;storeDraft()},level==='A1'?2:4);
   response.querySelector('textarea').setAttribute('aria-describedby',prompt.id);
   li.append(prompt,response);
   $('afterQuestions').append(li);
  }
  $('vocabTasks').replaceChildren();
  for(const item of practice.vocabulary){
   const row=el('div','vocab-line');
   row.append(el('strong','',item.term),el('span','',item.cs+' · '+item.meaning));
   $('vocabTasks').append(row);
  }
  renderVocabPractice();renderSequence();renderChallenge();
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
  lines.push('','RECONSTRUCTION OF IDEAS · optional; separate from the listening score');
  const steps=data.practice[level].sequence;
  for(let i=0;i<draft.sequence.length;i++)
   lines.push('Position '+(i+1)+': '+steps[draft.sequence[i]]);
  lines.push('','PERSONAL LISTENING NOTES · optional',draft.notes||'(not written)',
   '','AFTER LISTENING · optional, teacher-reviewed');
  for(let i=0;i<data.practice[level].after.length;i++)
   lines.push('',(i+1)+'. '+data.practice[level].after[i],
    draft.after[i]||'(not written)');
  if(data.practice[level].challenge.length){
   lines.push('','ADVANCED EXTENSION · C1-C2; teacher-reviewed');
   for(let i=0;i<data.practice[level].challenge.length;i++)
    lines.push('',(i+1)+'. '+data.practice[level].challenge[i],
     draft.challenge[i]||'(not written)');
  }
  lines.push('','VOCABULARY MATCHING · optional; separate from the listening score');
  const words=data.practice[level].vocabulary;
  for(let i=0;i<words.length;i++)
   lines.push(words[i].term+' — '+(draft.vocab[i]===null?'Not answered':
    words[draft.vocab[i]].meaning));
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
  const duration=document.querySelector('.hero .meta .chip:nth-child(2)');
  if(!duration)throw Error('NEWS lesson duration label missing');
  duration.id='newsDuration';
  const scaffold=el('p','news-scaffold');scaffold.id='newsScaffold';
  $('preQuestions').after(scaffold);
  scaffold.after(writingBox('newsNotes','My listening notes (optional)',draft.notes,
   value=>{draft.notes=value;storeDraft()},level==='A1'?2:4));
  const beforeHint=$('before').querySelector('p.note');
  if(beforeHint)beforeHint.textContent='Before listening: share your ideas. In the scored tasks, use evidence from the narrator.';
  const vocabPractice=el('details','news-vocab-practice');
  vocabPractice.id='newsVocabPractice';
  vocabPractice.append(el('summary','','Practise 7 vocabulary items · optional matching'));
  vocabPractice.append(el('p','note',
   'Study the words above, then match each word to its meaning. This does not affect your listening score.'));
  const quiz=el('div');quiz.id='newsVocabQuiz';vocabPractice.append(quiz);
  const checkVocab=el('button','action','✓ Check vocabulary');
  checkVocab.id='checkVocabBtn';checkVocab.type='button';
  checkVocab.addEventListener('click',checkVocabPractice);
  const vocabStatus=el('p','status');vocabStatus.id='newsVocabStatus';
  vocabStatus.setAttribute('role','status');vocabStatus.setAttribute('aria-live','polite');
  const vocabReview=el('div','news-vocab-review');vocabReview.id='newsVocabReview';
  vocabPractice.append(checkVocab,vocabStatus,vocabReview);
  $('vocabTasks').after(vocabPractice);
  vocabPractice.after(writingBox('newsSentence',
   'Use a new vocabulary word in your own sentence (optional)',
   draft.sentence,value=>{draft.sentence=value;storeDraft()},2));
  const sequenceSection=el('section','panel');sequenceSection.id='newsSequenceSection';
  const sequenceHead=el('div','stage-heading'),sequenceTitle=el('div');
  sequenceTitle.append(el('div','kicker','05 · Reconstruction'),
   el('h2','','Listen, order and explain'));
  sequenceHead.append(sequenceTitle,el('span','chip','Optional · not test-scored'));
  sequenceSection.append(sequenceHead,
   el('p','section-description','Put these ideas in the order they appear in the original recording. Use the up/down controls; you can check and retry.'));
  const seqList=el('ol','news-sequence-list');seqList.id='newsSequenceItems';
  const seqButton=el('button','btn primary','✓ Check reconstruction');
  seqButton.id='checkSequenceBtn';seqButton.type='button';
  seqButton.addEventListener('click',checkSequence);
  const seqStatus=el('p','status');seqStatus.id='newsSequenceStatus';
  seqStatus.setAttribute('role','status');seqStatus.setAttribute('aria-live','polite');
  const seqReview=el('div','news-sequence-review');seqReview.id='newsSequenceReview';
  sequenceSection.append(seqList,seqButton,seqStatus,seqReview);
  $('third').after(sequenceSection);
  const challenge=el('div','news-challenge');challenge.id='newsChallengeSection';
  challenge.hidden=true;
  challenge.append(el('h3','','Advanced extension · critical evaluation (C1–C2)'),
   el('p','note','Support your response with evidence from the video. This open writing requires teacher review.'));
  const challengePrompts=el('ol','questions-list');challengePrompts.id='newsChallengePrompts';
  challenge.append(challengePrompts);
  $('afterQuestions').after(challenge);
  const nav=document.querySelector('.side nav');
  if(!nav)throw Error('NEWS lesson navigation unavailable');
  const vocabNav=nav.querySelector('a[href="#vocab"]');
  if(!vocabNav)throw Error('NEWS vocabulary navigation unavailable');
  const seqLink=el('a','','05 · Reconstruction');seqLink.href='#newsSequenceSection';
  vocabNav.before(seqLink);
  vocabNav.textContent='06 · Vocabulary';
  nav.querySelector('a[href="#after"]').textContent='07 · After listening';
  nav.querySelector('a[href="#finish"]').textContent='08 · Practice review';
  $('vocab').querySelector('.kicker').textContent='06 · Optional vocabulary';
  $('after').querySelector('.kicker').textContent='07 · After listening';
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
  for(const section of ['first','second','third','newsSequenceSection']){
   const replay=el('a','action news-replay-link','▶ Open / replay original TED-Ed video');
   replay.href=data.video;replay.target='_blank';replay.rel='noopener noreferrer';
   $(section).querySelector('.section-description').after(replay);
  }
 }
 function removeSaved(all){
  if(!confirm(all?'Delete practice answers and writing for all six levels? My Vocabulary is kept.':
   'Clear this level’s practice answers and optional writing?'))return;
  const levelsToErase=all?api.LEVELS:[level];
  let verified=true;
  for(const lv of levelsToErase)for(const storageKey of [key(lv),draftKey(lv)]){
   try{
    localStorage.removeItem(storageKey);
    if(localStorage.getItem(storageKey)!==null)verified=false;
   }catch(_){verified=false}
  }
  if(!verified){
   alert('Deletion could not be verified. Your previous work may still be stored in this browser. Check site data in browser settings.');
   return;
  }
  answerSaveFailed=false;
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
