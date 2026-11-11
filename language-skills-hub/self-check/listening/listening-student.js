/* R24 Listening: no student media player, no telemetry, no grading backend. */
(()=>{
 'use strict';
 const core=window.LSHListeningCore;
 const resultsCore=window.LSHResultCore;
 const gradeCore=window.LSHGradeCore;
 const exportCore=window.LSHExportCore;
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
 let chosen=null,submitted=false,timedUI=null;
 const answers={gist:[],detail:[],sequence:[],match:[]};
 const phases=[
  {id:'first-listening',heading:'First Listening',
   caption:'Pass 1 – listen for the main ideas. The teacher starts the recording.'},
  {id:'listen-and-interpret',heading:'Listen and Interpret',
   caption:'Pass 2 – listen for details and interpret what the speaker means.'},
  {id:'listen-write-and-reconstruct',heading:'Listen, Match and Reconstruct',
   caption:'Place the excerpts in order, then match prompts with authored statements. All tasks are scored automatically.'}
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
  for(const x of answers.match)if(Number.isInteger(x))n++;
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
     progress();timedUI?.save();
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
    progress();timedUI?.save();
   });
   row.append(label,select);list.appendChild(row);
  }
 }
 function matchingTask(){
  const list=$('taskList'),bank=core.matching(chosen);
  list.appendChild(element('p','quiz-hint',
   'D. Match each listening prompt to the correct statement. Use each letter only once. No free-text answers are required.'));
  const choices=element('section','matching-bank');
  choices.setAttribute('aria-label','Answer statements for matching');
  bank.options.forEach(option=>{
   const p=element('p');
   p.append(element('strong',null,option.letter+'. '),
    document.createTextNode(option.text));
   choices.appendChild(p);
  });
  list.appendChild(choices);
  bank.prompts.forEach((prompt,i)=>{
   const row=element('div','matching-row'),id='match-'+i;
   const label=element('label',null,(i+1)+'. '+prompt.question);
   label.htmlFor=id;
   const select=element('select','matching-select');
   select.id=id;select.setAttribute('aria-label','Match answer '+(i+1));
   const empty=element('option',null,'— Select a letter —');
   empty.value='';select.appendChild(empty);
   bank.options.forEach((choice,j)=>{
    const option=element('option',null,choice.letter);
    option.value=String(j);select.appendChild(option);
   });
   select.addEventListener('change',()=>{
    if(submitted)return;
    const value=select.value===''?null:Number(select.value);
    if(Number.isInteger(value)){
     for(let j=0;j<bank.prompts.length;j++)if(j!==i&&answers.match[j]===value){
      answers.match[j]=null;
      $('match-'+j).value='';
     }
    }
    answers.match[i]=value;
    progress();timedUI?.save();
   });
   row.append(label,select);list.appendChild(row);
  });
 }
 function render(){
  const list=$('taskList');list.replaceChildren();
  list.appendChild(heading(phases[0]));choices('gist');
  list.appendChild(heading(phases[1]));choices('detail');
  list.appendChild(heading(phases[2]));
  sequence();
  matchingTask();
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
 function gradeBadge(container,gradeResult,label){
  container.replaceChildren();
  container.append(
   element('span','grade-caption',label),
   element('strong','grade-number',String(gradeResult.grade)),
   element('p','small-note','Návrh známky podle přesného poměru '+gradeResult.earned+' / '+gradeResult.max+
    ' bodů ('+gradeResult.displayedPercent.toFixed(2)+' %). Bez ověření identity a výsledku nejde o platný školní záznam.')
  );
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
   'All choices, sequencing and matching are scored automatically. The proposed grade appears immediately but is NOT a verified school grade. This public local result can be changed or restarted; your teacher must verify it before recording any school grade.';
  const list=$('resultDetails');list.replaceChildren();
  const segment=(phase)=>phase==='gist'?'First Listening':
   phase==='detail'?'Listen and Interpret':'Listen, Write and Reconstruct';
  const mistakes=report.reviewed.filter(task=>!task.correct);
  if(!mistakes.length)list.appendChild(element('p','small-note',
   'All automatically assessed answers are correct. No objective mistakes to review.'));
  for(const task of mistakes){
   const box=element('article','review '+(task.correct?'correct':'wrong'));
   box.appendChild(element('span','state',(task.correct?'CORRECT':'NOT CORRECT')+' · '+segment(task.phase)));
   box.appendChild(element('h3',null,task.question));
   kv(box,'Your answer',task.chosen.length?task.chosen.join(' · '):'Not answered');
   if(!task.correct)kv(box,'Correct answer',task.correctAnswers.join(' · '));
   if(task.reason)kv(box,'Explanation',task.reason);
   list.appendChild(box);
  }
  const proposed=gradeCore.proposal(normalized.points.earned,normalized.points.max);
  gradeBadge($('gradeProposal'),proposed,'Automatically calculated proposed grade (1–5)');
  $('exportCopy').hidden=!window.LSHPdfReport;
  $('exportPdf').hidden=!window.LSHPdfReport;
  $('exportResult').hidden=!exportCore;
  $('exportStatus').textContent=
   'The PDF and copy contain the complete test, your answers, correct answers and mistakes. They do not contain your name or email. Send the file from your school email; this local report is not independently verified.';
  const archiveData=()=>{
   if(!exportCore)throw new Error('Export module unavailable.');
   const state=timedUI?.status();
   const receipt=exportCore.listeningAuto(normalized,{
    topic:selection.topic,language:'en',level:selection.level,
    submittedAt:state?.submittedAt??null,
    interruptionCount:state?.incidents?.length??0
   });
   return {receipt,rows:exportCore.questionRows(normalized,'listening')};
  };
  $('exportResult').onclick=()=>{
   try{
    const {receipt,rows}=archiveData();
    exportCore.downloadDetailed(receipt,rows);
    $('exportStatus').textContent='Detailed CSV report downloaded. Give it to your teacher.';
   }catch(error){
    $('exportStatus').textContent='Download failed: '+String(error.message||error);
   }
  };
  const completeReport=()=>{
   if(!window.LSHPdfReport)throw new Error('PDF export module unavailable.');
   const grade=gradeCore.proposal(normalized.points.earned,normalized.points.max);
   return {
    skill:'listening',topicId:selection.topic,
    topic:$('title').textContent,language:'en',level:selection.level,
    generatedAt:Date.now(),
    summary:{earned:grade.earned,max:grade.max,
     percent:grade.displayedPercent,grade:grade.grade},
    questions:report.reviewed.map(task=>({
     question:(task.phase==='gist'?'FIRST LISTENING':task.phase==='detail'?
      'LISTEN AND INTERPRET':task.phase==='sequence'?'RECONSTRUCTION':'MATCHING')+
      ' · '+task.question,
     studentAnswer:task.chosen&&task.chosen.length?task.chosen.join(' | '):'Bez odpovědi',
     correctAnswer:task.correctAnswers.join(' | '),
     correct:!!task.correct,awarded:task.correct?1:0,
     explanation:task.reason||''
    }))
   };
  };
  $('exportPdf').onclick=()=>{
   try{
    window.LSHPdfReport.download(completeReport());
    $('exportStatus').textContent='Full test PDF downloaded. Send it to your teacher using school email.';
   }catch(error){
    $('exportStatus').textContent='PDF export failed: '+String(error.message||error);
   }
  };
  $('exportCopy').onclick=async()=>{
   try{
    await window.LSHPdfReport.copy(completeReport());
    $('exportStatus').textContent='Complete test report copied. Send it to your teacher using school email.';
   }catch(error){
    $('exportStatus').textContent='Copy failed: '+String(error.message||error);
   }
  };
  $('results').hidden=false;
  $('results').focus({preventScroll:true});
  $('results').scrollIntoView({behavior:'smooth',block:'start'});
 }
 function submit(automatic=false,restored=false){
  if(submitted||!chosen)return;
  const pending=totalTasks()-completed();
  const question='Submit your answers now?'+(pending?' '+pending+' task(s) are still unanswered.':'');
  if(!automatic&&!window.confirm(question))return;
  let report;
  try{report=core.assessAuto(chosen,answers)}
  catch(_){if(!automatic)window.alert('Please review the reconstruction order. Use each statement at most once.');return}
  if(timedUI&&!restored)timedUI.finish();
  submitted=true;
  for(const el of $('taskList').querySelectorAll('input,textarea,select'))el.disabled=true;
  $('submitButton').disabled=true;
  $('submitButton').textContent='Submitted';
  results(report);
 }
 async function load(){
  themeInit();
  $('submitButton').addEventListener('click',()=>submit(false,false));
  try{
   const res=await fetch('../../data/cards.json',{credentials:'omit',redirect:'error'});
   if(!res.ok)throw new Error('Catalogue HTTP '+res.status);
   const entry=core.catalogEntry(await res.json(),selection.topic);
   if(!entry.levels.includes(selection.level)||!core.LEVELS.includes(selection.level))
    throw new Error('The chosen CEFR level is not available.');
   const resource=await fetch('../../'+entry.relative,{credentials:'omit',redirect:'error'});
   if(!resource.ok)throw new Error('Source HTTP '+resource.status);
   chosen=core.variant(core.extractJson(await resource.text(),'DATA'),selection.level);
   if(new URLSearchParams(location.search).has('timer')&&!window.LSHSessionUI)
    throw new Error('Timed test engine is unavailable.');
   render();
   timedUI=window.LSHSessionUI?.mount({
    skill:'listening',topic:selection.topic,lang:'en',level:selection.level,
    workspace:$('workspace'),
    getAnswers:()=>JSON.parse(JSON.stringify(answers)),
    restoreAnswers:saved=>{
     if(!saved||typeof saved!=='object')return;
     for(const part of ['gist','detail']){
      const arr=Array.isArray(saved[part])?saved[part]:[];
      for(let i=0;i<chosen[part].length;i++){
       const q=chosen[part][i],picked=arr[i];
       const indices=q.type==='single'?(Number.isInteger(picked)?[picked]:[]):
        (Array.isArray(picked)?picked:[]);
       if(q.type==='single'){
        if(indices.length===1&&indices[0]>=0&&indices[0]<q.options.length)
         answers[part][i]=indices[0];
       }else{
        const clean=indices.filter(n=>Number.isInteger(n)&&n>=0&&n<q.options.length);
        answers[part][i]=[...new Set(clean)];
       }
       for(const input of $('taskList').querySelectorAll('input')){
        if(input.name===part+'-'+i&&indices.includes(Number(input.value)))input.checked=true;
       }
      }
     }
     const usedSequence=new Set();
     for(let i=0;i<chosen.sequence.length;i++){
      const value=saved.sequence?.[i];
      if(!Number.isInteger(value)||value<0||value>=chosen.sequence.length||usedSequence.has(value))continue;
      usedSequence.add(value);
      answers.sequence[i]=value;
      const sel=$('seq-'+i);if(sel)sel.value=String(value);
     }
     const matchCount=core.matching(chosen).prompts.length;
     const usedMatch=new Set();
     for(let i=0;i<matchCount;i++){
      const value=saved.match?.[i];
      if(!Number.isInteger(value)||value<0||value>=matchCount||usedMatch.has(value))continue;
      usedMatch.add(value);answers.match[i]=value;
      const field=$('match-'+i);if(field)field.value=String(value);
     }
     progress();
    },
    onSubmit:({automatic,restored})=>submit(automatic,restored)
   })||null;
   if(timedUI)timedUI.initialize();
   $('workspace').hidden=timedUI?timedUI.status().phase==='ready':false;
  }catch(error){
   $('workspace').hidden=true;
   $('loading').classList.add('error');
   $('loading').textContent='Listening activity unavailable: '+String(error.message||error);
   $('title').textContent='Unable to load Listening Lab';
  }
 }
 load();
})();
