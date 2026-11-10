/* R35–R37 isolated three-topic EN/A1-C2 Listening teacher QA, not part of catalog.
 * Original audio/video is played by teacher; original source hash is checked.
 */
(()=>{
 'use strict';
 const sourceCore=window.LSHListeningCore;
 const draftCore=window.LSHIndependentListeningCore;
 const gradeCore=window.LSHGradeCore;
 const exportCore=window.LSHExportCore;
 const $=id=>document.getElementById(id);
 const el=(tag,cls,text)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined)node.textContent=text;
  return node;
 };
 let bank=null,timed=null,submitted=false;
 const answers=Object.create(null);
 const marks=[null,null];
 const params=new URLSearchParams(location.search);
 const topics={
  'll-harrison-ford':{slug:'harrison-ford',title:'Harrison Ford · Life Achievement Speech'},
  'll-matthew-oscars':{slug:'matthew-oscars',title:'Matthew McConaughey · Oscars 2014'},
  'll-peaky-no-fighting':{slug:'peaky-no-fighting',title:'Peaky Blinders · No Fighting'}
 };
 const originalTopic=params.get('topic')||'ll-harrison-ford';
 const topic=Object.prototype.hasOwnProperty.call(topics,originalTopic)?topics[originalTopic]:null;
 const level=params.get('level')||'B2';
 const valid=(ok,msg)=>{if(!ok)throw new Error(msg)};
 async function get(url,isJson=false){
  const res=await fetch(url,{credentials:'omit',cache:'no-store',redirect:'error'});
  valid(res.ok,'Source HTTP '+res.status);
  return isJson?res.json():res.text();
 }
 async function sha256(input){
  valid(!!crypto?.subtle,'Source checksum unavailable');
  const value=new TextEncoder().encode(input);
  const array=await crypto.subtle.digest('SHA-256',value);
  return Array.from(new Uint8Array(array),x=>x.toString(16).padStart(2,'0')).join('');
 }
 function count(){
  let n=0;
  for(const q of [...bank.objective,...bank.written]){
   const a=answers[q.id];
   if(Number.isInteger(a)||(typeof a==='string'&&a.trim()))n++;
  }
  $('progressLabel').textContent=n+' / 8 answered · '+(8-n)+' remaining';
  $('progress').setAttribute('aria-valuenow',String(n/8*100));
  $('progressFill').style.width=String(n/8*100)+'%';
 }
 function render(){
  const list=$('taskList');list.replaceChildren();
  list.append(el('h3','stage-phase','First listening · understanding and meaning'));
  list.append(el('p','small-note','The teacher plays the original speech. Answer the first three questions.'));
  for(let index=0;index<bank.objective.length;index++){
   if(index===3){
    list.append(el('h3','stage-phase','Second listening · details and implications'));
    list.append(el('p','small-note','During the second playback, think about reasons and the wider message.'));
   }
   const q=bank.objective[index],field=el('fieldset','question');
   field.append(el('legend',null,(index+1)+'. '+q.q));
   q.options.forEach((option,choice)=>{
    const label=el('label','choice'),input=el('input');
    input.type='radio';input.name=q.id;input.value=String(choice);
    input.addEventListener('change',()=>{
     if(submitted)return;
     answers[q.id]=choice;count();timed?.save();
    });
    label.append(input,el('span',null,option));field.append(label);
   });
   list.append(field);
  }
  list.append(el('h3','stage-phase','After both playbacks · written interpretation'));
  for(let i=0;i<bank.written.length;i++){
   const q=bank.written[i],div=el('div','question'),label=el('label','written-label',(i+1)+'. '+q.q);
   label.htmlFor=q.id;
   const input=el('textarea','written-response');
   input.id=q.id;input.rows=4;input.maxLength=5000;
   input.addEventListener('input',()=>{
    if(submitted)return;
    answers[q.id]=input.value;count();timed?.save();
   });
   div.append(label,input);list.append(div);
  }
  count();
 }
 function line(node,label,value){
  const p=el('p');
  p.append(el('strong',null,label+': '),document.createTextNode(String(value)));
  node.append(p);
 }
 function normalized(score){
  return {
   kind:'LSH_LOCAL_RESULT_R25_V1',
   skill:'listening',officialSchoolGrade:null,officialResult:false,
   points:{earned:score.objectiveEarned,max:6},
   writtenReview:score.written.map(x=>({question:x.prompt,answer:x.response}))
  };
 }
 function update(){
  const score=draftCore.score(bank,answers,marks);
  const grade=$('gradeProposal');
  grade.replaceChildren();
  if(score.pending===0){
   const proposal=gradeCore.proposal(score.totalEarned,score.totalMax);
   grade.append(el('span','grade-caption','Teacher-reviewed local grade proposal'),
    el('strong','grade-number',String(proposal.grade)),
    el('p','small-note',score.totalEarned+' / 8 points · '+proposal.displayedPercent+
     '% · local unverified assessment, not a school record'));
   $('exportResult').disabled=false;
   $('teacherStatus').textContent='Both written responses reviewed. The grade is a local proposal only.';
  }else{
   $('exportResult').disabled=true;
   $('teacherStatus').textContent=score.pending+' teacher assessment(s) still required; overall grade is not available.';
  }
  const box=$('scoreSummary');box.replaceChildren();
  const card=el('div','score-value');
  card.append(el('strong',null,score.objectiveEarned+' / 6'),
   el('span',null,'Objective questions'));
  box.append(card);
 }
 function teacherControls(){
  const container=$('teacherTasks');container.replaceChildren();
  const existing=timed?.status()?.reviewMarks;
  if(Array.isArray(existing)&&existing.length===2&&existing.every(x=>x===0||x===1||x===null)){
   marks[0]=existing[0];marks[1]=existing[1];
  }
  for(let i=0;i<bank.written.length;i++){
   const q=bank.written[i],outer=el('div','question'),title=el('h4',null,(i+1)+'. '+q.q);
   line(outer,'Student response',answers[q.id]?.trim()||'Not answered');
   line(outer,'Model answer',q.modelAnswer);
   line(outer,'Teacher criterion',q.teacherCriterion);
   const label=el('label',null,'Teacher points: '),select=el('select','select-response');
   const options=[['','Not assessed'],['0','0 points'],['1','1 point']];
   for(const [value,text]of options){const option=el('option',null,text);option.value=value;select.append(option)}
   label.append(select);select.value=marks[i]===null?'':String(marks[i]);
   select.addEventListener('change',()=>{
    marks[i]=select.value===''?null:Number(select.value);
    timed?.saveReviewMarks(marks);
    update();
   });
   outer.prepend(title);outer.append(label);container.append(outer);
  }
  $('teacherReview').hidden=false;
  update();
 }
 function results(){
  const score=draftCore.score(bank,answers,marks),box=$('resultDetails');box.replaceChildren();
  const missed=score.details.filter(q=>!q.correct);
  if(!missed.length)box.append(el('p','small-note','All six objective answers are correct.'));
  for(const q of missed){
   const item=el('article','review wrong');
   item.append(el('span','state','INCORRECT / UNANSWERED'),el('h3',null,q.prompt));
   line(item,'Your answer',q.answered?q.picked:'Not answered');
   line(item,'Correct answer',q.answer);
   line(item,'Explanation',q.explanation);
   box.append(item);
  }
  teacherControls();
  $('results').hidden=false;
  $('results').focus({preventScroll:true});
 }
 function submit(automatic=false,restored=false){
  if(submitted||!bank)return;
  const missed=8-Object.values(answers).filter(x=>Number.isInteger(x)||
   (typeof x==='string'&&x.trim())).length;
  if(!automatic&&!confirm('Submit independent Listening draft? '+missed+' unanswered task(s).'))return;
  if(timed&&!restored)timed.finish();
  submitted=true;
  $('taskList').querySelectorAll('input,textarea').forEach(node=>node.disabled=true);
  $('submitButton').disabled=true;
  $('submitButton').textContent='Submitted';
  results();
 }
 function exportResult(){
  const result=draftCore.score(bank,answers,marks);
  if(result.pending!==0)return;
  const state=timed?.status();
  try{
   exportCore.download(exportCore.listening(normalized(result),marks,{
    topic:originalTopic,language:'en',level,
    submittedAt:state?.submittedAt??null,interruptionCount:state?.incidents?.length??0
   }));
  }catch(e){$('exportStatus').textContent='CSV export unavailable: '+String(e.message||e)}
 }
 async function init(){
  try{
   valid(!!sourceCore&&!!draftCore&&!!gradeCore&&!!exportCore&&!!window.LSHSessionUI,
    'Required Listening QA modules are unavailable');
   const requestedMinutes=Number(params.get('timer'));
   valid(sourceCore.LEVELS.includes(level),'Unsupported Listening CEFR level');
   valid(Number.isInteger(requestedMinutes)&&requestedMinutes>=5&&
    requestedMinutes<=120&&/^r3[567][a-z0-9_-]{4,36}$/i.test(params.get('attempt')||''),
    'Required ?topic=ll-...&level=A1-C2&timer=minutes&attempt=r35/r36/r37... for teacher QA');
   valid(!!topic,'Unsupported independent Listening topic');
   const [manifest,html,independent]=await Promise.all([
    get('../../../version.json',true),
    get('../../../poslech/'+topic.slug+'/index.html'),
    get(originalTopic+'/en-'+level+'.json',true)
   ]);
   valid(manifest.version==='R31'&&manifest.backendEnabled===false,
    'Unexpected production source baseline');
   const actual=await sha256(html);
   valid(actual===manifest.contentHashes[originalTopic],'Original media source checksum mismatch');
   const source=sourceCore.variant(sourceCore.extractJson(html,'DATA'),level);
   valid(independent.level===level&&independent.topic===originalTopic,
    'Listening bank is not the requested level and topic');
   draftCore.validate(independent,source,actual);
   valid(independent.durationMinutesSuggested===requestedMinutes,
    'The source-specific time limit does not match the reviewed draft');
   bank=independent;
   document.title='Independent Listening '+level+' – '+topic.title+' – unapproved QA';
   const revision=originalTopic==='ll-harrison-ford'?(level==='B2'?'R35':'R36'):'R37';
   document.querySelector('.mode').textContent=revision+' DRAFT · EN/'+level;
   $('title').textContent=topic.title;
   document.querySelector('.hero .subtitle').textContent='English '+level+
    ' · 6 objective items + 2 teacher-reviewed responses · '+requestedMinutes+' minutes';
   document.querySelector('.listening-heading .pill').textContent='EN · '+level;
   document.querySelector('.listening-heading .kicker').textContent=
    'ENGLISH '+level+' · TWO TEACHER-CONTROLLED PLAYBACKS';
   if(originalTopic==='ll-peaky-no-fighting'){
    const notice=document.querySelector('.r35-warning');
    notice.textContent+=' The original dialogue includes aggressive language and profanity; teacher must check age suitability.';
   }
   render();
   timed=window.LSHSessionUI.mount({
    skill:'listening',topic:originalTopic,lang:'en',level,
    workspace:$('workspace'),
    getAnswers:()=>({...answers}),
    restoreAnswers:saved=>{
     if(!saved||typeof saved!=='object')return;
     for(const q of bank.objective){
      const chosen=saved[q.id];
      if(!Number.isInteger(chosen)||chosen<0||chosen>=4)continue;
      answers[q.id]=chosen;
      const radio=[...$('taskList').querySelectorAll('input')].find(x=>
       x.name===q.id&&x.value===String(chosen));
      if(radio)radio.checked=true;
     }
     for(const q of bank.written){
      if(typeof saved[q.id]!=='string')continue;
      answers[q.id]=saved[q.id].slice(0,5000);
      $(q.id).value=answers[q.id];
     }
     count();
    },
    onSubmit:({automatic,restored})=>submit(automatic,restored)
   });
   valid(!!timed,'Independent Listening draft must have local timer');
   timed.initialize();
   $('workspace').hidden=timed.status().phase==='ready';
   $('loading').hidden=true;
  }catch(e){
   $('workspace').hidden=true;
   $('results').hidden=true;
   $('loading').hidden=false;
   $('loading').classList.add('error');
   $('loading').textContent='Independent Listening draft unavailable: '+String(e.message||e);
  }
 }
 $('submitButton').addEventListener('click',()=>submit(false,false));
 $('exportResult').addEventListener('click',exportResult);
 init();
})();
