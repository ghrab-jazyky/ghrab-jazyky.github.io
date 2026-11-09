/* R24 Listening: no student media player, no telemetry, no grading backend. */
(()=>{
 'use strict';
 const core=window.LSHListeningCore;
 const resultsCore=window.LSHResultCore;
 const $=id=>document.getElementById(id);
 const element=(tag,cls,text)=>{
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(text!==undefined)el.textContent=String(text);
  return el;
 };
 const params=new URLSearchParams(location.search);
 const selection={topic:params.get('topic')||'ll-matthew-oscars',
  level:params.get('level')||'B2'};
 let chosen=null,submitted=false;
 const answers={gist:[],detail:[],sequence:[],facts:[],open:[]};
 const phases=[
  {id:'first-listening',heading:'First Listening',
   caption:'Pass 1 – listen for the main ideas. The teacher starts the recording.'},
  {id:'listen-and-interpret',heading:'Listen and Interpret',
   caption:'Pass 2 – listen for details and interpret what the speaker means.'},
  {id:'listen-write-and-reconstruct',heading:'Listen, Write and Reconstruct',
   caption:'Use what you heard in the two playbacks, your notes and your own words. Written answers need teacher review.'}
 ];
 function theme(light,save){
  document.documentElement.dataset.theme=light?'light':'dark';
  $('themeButton').textContent=light?'☾ Dark':'☀ Light';
  $('themeButton').setAttribute('aria-pressed',String(light));
  if(save){try{localStorage.setItem('lsh-listening-theme',light?'light':'dark')}catch(_){}}
 }
 function themeInit(){
  let stored=null;try{stored=localStorage.getItem('lsh-listening-theme')}catch(_){}
  theme(stored?stored==='light':!!window.matchMedia?.('(prefers-color-scheme: light)').matches,false);
  $('themeButton').addEventListener('click',()=>{
   theme(document.documentElement.dataset.theme!=='light',true);
  });
 }
 const totalTasks=()=>chosen.gist.length+chosen.detail.length+chosen.sequence.length+
  chosen.facts.length+chosen.open.length;
 function completed(){
  if(!chosen)return 0;
  let n=0;
  for(const part of ['gist','detail'])for(let i=0;i<chosen[part].length;i++){
   const x=answers[part][i];
   if(Array.isArray(x)?x.length>0:Number.isInteger(x))n++;
  }
  for(const x of answers.sequence)if(Number.isInteger(x))n++;
  for(const part of ['facts','open'])for(const x of answers[part])if(typeof x==='string'&&x.trim())n++;
  return n;
 }
 function progress(){
  const count=completed(),total=totalTasks();
  $('progressLabel').textContent=count+' / '+total+' tasks answered · '+(total-count)+' remaining';
  $('progress').setAttribute('aria-valuenow',String(Math.round(100*count/total)));
  $('progressFill').style.width=String(100*count/total)+'%';
 }
 function heading(phase){
  const box=element('div','stage');
  box.id=phase.id;
  box.appendChild(element('h3','stage-phase',phase.heading));
  box.appendChild(element('p','stage-help',phase.caption));
  return box;
 }
 function choices(part){
  const list=$('taskList'),questionSet=chosen[part],isGist=part==='gist';
  for(let i=0;i<questionSet.length;i++){
   const q=questionSet[i],item=element('fieldset','question');
   item.appendChild(element('legend',null,(isGist?'A':'B')+(i+1)+'. '+q.title));
   item.appendChild(element('p','question-kind',
    q.type==='multi'?'Select '+q.correct.length+' answers.':'Choose one answer.'));
   q.options.forEach((option,j)=>{
    const label=element('label','choice');
    const input=element('input');
    input.type=q.type==='multi'?'checkbox':'radio';
    input.name=part+'-'+i;
    input.value=String(j);
    input.setAttribute('aria-label',option);
    input.addEventListener('change',()=>{
     if(submitted)return;
     if(q.type==='single')answers[part][i]=j;
     else answers[part][i]=[...item.querySelectorAll('input:checked')].map(x=>Number(x.value));
     progress();
    });
    label.append(input,element('span',null,option));
    item.appendChild(label);
   });
   list.appendChild(item);
  }
 }
 function shuffled(n){
  const arr=Array.from({length:n},(_,i)=>i);
  for(let i=n-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  if(n>1&&arr.every((v,i)=>v===i))[arr[0],arr[1]]=[arr[1],arr[0]];
  return arr;
 }
 function sequence(){
  const list=$('taskList'),bank=element('section','sequence-bank'),
   order=shuffled(chosen.sequence.length);
  bank.setAttribute('aria-label','Statements to put in order');
  for(let i=0;i<order.length;i++){
   const text=chosen.sequence[order[i]];
   const card=element('p');
   card.appendChild(element('strong',null,String.fromCharCode(65+i)+'. '));
   card.appendChild(document.createTextNode(text));
   bank.appendChild(card);
  }
  list.appendChild(element('p','quiz-hint','C. Put the statements in the correct order. Each letter can be used only once.'));
  list.appendChild(bank);
  for(let i=0;i<chosen.sequence.length;i++){
   const row=element('div','sequence-row');
   const id='seq-'+i;
   const label=element('label',null,'Position '+(i+1));label.htmlFor=id;
   const select=element('select','select-response');select.id=id;
   select.setAttribute('aria-label','Reconstruction position '+(i+1));
   const empty=element('option',null,'— Select a statement —');empty.value='';
   select.appendChild(empty);
   for(let k=0;k<order.length;k++){
    const option=element('option',null,String.fromCharCode(65+k)+' — '+chosen.sequence[order[k]]);
    option.value=String(order[k]);select.appendChild(option);
   }
   select.addEventListener('change',()=>{
    if(submitted)return;
    const value=select.value===''?null:Number(select.value);
    if(Number.isInteger(value)){
     for(let j=0;j<chosen.sequence.length;j++)if(j!==i&&answers.sequence[j]===value){
      answers.sequence[j]=null;
      $('seq-'+j).value='';
     }
    }
    answers.sequence[i]=value;
    progress();
   });
   row.append(label,select);list.appendChild(row);
  }
 }
 function writing(part){
  const list=$('taskList');
  for(let i=0;i<chosen[part].length;i++){
   const q=chosen[part][i],block=element('div','question'),
    id='write-'+part+'-'+i;
   const title=element('label','written-label',
    (part==='facts'?'D':'E')+(i+1)+'. '+q.title);
   title.htmlFor=id;
   block.appendChild(title);
   if(part==='open'&&q.criteria)block.appendChild(element('p','quiz-hint',
     'Explain your reasoning; your teacher will review meaning and evidence.'));
   const input=element('textarea','written-response');
   input.id=id;input.rows=part==='facts'?2:4;input.maxLength=5000;
   input.setAttribute('aria-label',q.title);
   input.addEventListener('input',()=>{if(!submitted){answers[part][i]=input.value;progress()}});
   block.appendChild(input);
   list.appendChild(block);
  }
 }
 function render(){
  const list=$('taskList');list.replaceChildren();
  list.appendChild(heading(phases[0]));choices('gist');
  list.appendChild(heading(phases[1]));choices('detail');
  list.appendChild(heading(phases[2]));
  sequence();
  list.appendChild(element('p','quiz-hint','Write short factual answers. Even plausible alternatives need teacher review.'));
  writing('facts');
  list.appendChild(element('p','quiz-hint','Write your interpretations in your own words.'));
  writing('open');
  $('levelLabel').textContent='EN · '+selection.level;
  $('title').textContent=({
   'll-matthew-oscars':'Matthew McConaughey · Oscars 2014',
   'll-harrison-ford':'Harrison Ford · Life Achievement Speech',
   'll-peaky-no-fighting':'Peaky Blinders · No Fighting'
  })[selection.topic];
  $('goal').textContent=chosen.goal;
  $('loading').hidden=true;
  $('workspace').hidden=false;
  progress();
 }
 function kv(box,key,value){
  const row=element('p');
  row.append(element('strong',null,key+': '),document.createTextNode(String(value)));
  box.appendChild(row);
 }
 function results(report){
  const normalized=resultsCore.reviewListening(report);
  const summary=$('scoreSummary');summary.replaceChildren();
  const tiles=resultsCore.scoreTiles(normalized,{
   points:'Objective tasks (points earned)',objectivePercent:'Objective success rate',
   completion:'Tasks answered',manualReview:'Written answers requiring teacher review',
   schoolGrade:'Official school grade',noGrade:'—'
  },'en');
  for(const tile of tiles){
   const item=element('div','score-value');
   item.append(element('strong',null,tile.value),element('span',null,tile.label));
   summary.appendChild(item);
  }
  $('resultCaution').textContent=
   'The percentage covers only automatically checked choices and sequencing, not the written answers. The overall result is NOT final and no official school grade is issued. Answers and references are shown only after this page submission. This local result can be changed or restarted.';
  const list=$('resultDetails');list.replaceChildren();
  const segment=(phase)=>phase==='gist'?'First Listening':
   phase==='detail'?'Listen and Interpret':'Listen, Write and Reconstruct';
  for(const task of report.reviewed){
   const box=element('article','review '+(task.correct?'correct':'wrong'));
   box.appendChild(element('span','state',(task.correct?'CORRECT':'NOT CORRECT')+' · '+segment(task.phase)));
   box.appendChild(element('h3',null,task.question));
   kv(box,'Your answer',task.chosen.length?task.chosen.join(' · '):'Not answered');
   if(!task.correct)kv(box,'Correct answer',task.correctAnswers.join(' · '));
   if(task.reason)kv(box,'Explanation',task.reason);
   list.appendChild(box);
  }
  for(const task of report.writing){
   const box=element('article','review manual');
   box.appendChild(element('span','state',
    (task.state==='teacher_review_required'?'TEACHER REVIEW REQUIRED':'NOT ANSWERED')+' · '+segment(task.phase)));
   box.appendChild(element('h3',null,task.question));
   kv(box,'Your answer',task.answer||'Not answered');
   kv(box,'Reference answer',task.reference);
   if(task.criteria)kv(box,'Assessment guidance',task.criteria);
   list.appendChild(box);
  }
  $('results').hidden=false;
  $('results').focus({preventScroll:true});
  $('results').scrollIntoView({behavior:'smooth',block:'start'});
 }
 function submit(){
  if(submitted||!chosen)return;
  const pending=totalTasks()-completed();
  const question='Submit your answers now?'+(pending?' '+pending+' task(s) are still unanswered.':'');
  if(!window.confirm(question))return;
  let report;
  try{report=core.assess(chosen,answers)}
  catch(_){window.alert('Please review the reconstruction order. Use each statement at most once.');return}
  submitted=true;
  for(const el of $('taskList').querySelectorAll('input,textarea,select'))el.disabled=true;
  $('submitButton').disabled=true;
  $('submitButton').textContent='Submitted';
  results(report);
 }
 async function load(){
  themeInit();
  $('submitButton').addEventListener('click',submit);
  try{
   const res=await fetch('../../data/cards.json',{credentials:'omit',redirect:'error'});
   if(!res.ok)throw new Error('Catalogue HTTP '+res.status);
   const entry=core.catalogEntry(await res.json(),selection.topic);
   if(!entry.levels.includes(selection.level)||!core.LEVELS.includes(selection.level))
    throw new Error('The chosen CEFR level is not available.');
   const resource=await fetch('../../'+entry.relative,{credentials:'omit',redirect:'error'});
   if(!resource.ok)throw new Error('Source HTTP '+resource.status);
   chosen=core.variant(core.extractJson(await resource.text(),'DATA'),selection.level);
   render();
  }catch(error){
   $('loading').classList.add('error');
   $('loading').textContent='Listening activity unavailable: '+String(error.message||error);
   $('title').textContent='Unable to load Listening Lab';
  }
 }
 load();
})();
