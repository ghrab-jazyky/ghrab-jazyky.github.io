/* R32-R34 unapproved EN A1-C2 Reading preview. Strictly separate from public R31 student pages.
 * No telemetry, POST, student identity or client key secrecy guarantees.
 */
(()=>{
 'use strict';
 const reading=window.LSHReadingCore;
 const testBank=window.LSHIndependentTestBank;
 const grade=window.LSHGradeCore;
 const $=id=>document.getElementById(id);
 const make=(tag,cls,text)=>{
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(text!==undefined)el.textContent=String(text);
  return el;
 };
 const params=new URLSearchParams(location.search);
 const level=params.get('level')||'B2';
 const topic=params.get('topic')||'rl-can-mistakes';
 const lang=params.get('lang')||'en';
 const answers=Object.create(null);
 let variant=null,timed=null,submitted=false;
 function requireCondition(ok,message){if(!ok)throw new Error(message)}
 async function get(url,json=false){
  const response=await fetch(url,{credentials:'omit',redirect:'error',cache:'no-store'});
  if(!response.ok)throw new Error('Source HTTP '+response.status);
  return json?response.json():response.text();
 }
 async function sourceHash(source){
  requireCondition(!!window.crypto?.subtle&&!!window.TextEncoder,
   'Secure source verification is unavailable');
  const bytes=new TextEncoder().encode(source);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 }
 function renderText(){
  $('readingHeading').textContent=variant.title;
  const text=$('readingParagraphs');text.replaceChildren();
  variant.paragraphs.forEach(p=>text.appendChild(make('p',null,p)));
 }
 function progress(){
  const n=variant.questions.reduce((sum,q)=>sum+
   (Object.prototype.hasOwnProperty.call(answers,q.id)?1:0),0);
  $('counter').textContent=n+' / '+variant.questions.length;
  $('remaining').textContent=variant.questions.length-n+' unanswered';
  $('progress').setAttribute('aria-valuenow',String(n*100/variant.questions.length));
  $('progressFill').style.width=String(n*100/variant.questions.length)+'%';
 }
 function renderTasks(){
  const list=$('questionList');list.replaceChildren();
  let number=0;
  for(const tab of variant.tabs){
   list.appendChild(make('h3','stage-phase',tab.title));
   list.appendChild(make('p','small-note',tab.description||''));
   for(const q of variant.questions.filter(q=>q.tab===tab.id)){
    number++;
    const field=make('fieldset','question');
    field.appendChild(make('legend',null,number+'. '+q.q));
    field.appendChild(make('p','question-kind','Choose one answer.'));
    q.choices.forEach((choice,index)=>{
     const label=make('label','choice'),input=make('input');
     input.type='radio';input.name=q.id;input.value=String(index);
     input.setAttribute('aria-label',choice);
     input.addEventListener('change',()=>{
      if(submitted)return;
      answers[q.id]=index;progress();timed?.save();
     });
     label.append(input,make('span',null,choice));
     field.appendChild(label);
    });
    list.appendChild(field);
   }
  }
  progress();
 }
 function resultLine(box,label,value){
  const p=make('p');p.append(make('strong',null,label+': '),
   document.createTextNode(String(value)));
  box.appendChild(p);
 }
 function showResult(report){
  const summary=$('scoreSummary');summary.replaceChildren();
  const tile=make('div','score-value');
  tile.append(make('strong',null,report.points+' / '+report.maxPoints),
   make('span',null,'Correct answers'));
  summary.appendChild(tile);
  const candidate=grade.proposal(report.points,report.maxPoints);
  $('gradeProposal').replaceChildren(make('span','grade-caption',
   'Proposed local grade (not approved)'),make('strong','grade-number',String(candidate.grade)),
   make('p','small-note','Not a verified school grade. Review the independent questions and criteria before any classroom use.'));
  const details=$('resultDetails');details.replaceChildren();
  const mistakes=report.details.filter(item=>!item.correct);
  if(!mistakes.length)details.appendChild(make('p','small-note',
   'All ten answers are correct. No mistakes to display.'));
  for(const error of mistakes){
   const item=variant.questions.find(q=>q.id===error.id);
   const block=make('article','review wrong');
   block.appendChild(make('span','state','NEEDS REVIEW · PARAGRAPH '+item.sourceParagraph));
   block.appendChild(make('h3',null,error.prompt));
   resultLine(block,'Your answer',error.answered?error.selectedAnswer:'Not answered');
   resultLine(block,'Correct answer',error.correctAnswer);
   resultLine(block,'Evidence / rationale',error.explanation);
   details.appendChild(block);
  }
  $('results').hidden=false;
  $('results').focus({preventScroll:true});
 }
 function submit(automatic=false,restored=false){
  if(submitted||!variant)return;
  const n=variant.questions.length-Object.keys(answers).length;
  if(!automatic&&!window.confirm('Submit the draft test? '+n+' unanswered question(s).'))return;
  const result=reading.score(variant,answers);
  if(timed&&!restored)timed.finish();
  submitted=true;
  for(const input of $('questionList').querySelectorAll('input'))input.disabled=true;
  $('submitButton').disabled=true;
  $('submitButton').textContent='Submitted';
  showResult(result);
 }
 async function initialize(){
  try{
   requireCondition(reading&&testBank&&grade&&window.LSHSessionUI,
    'Required local assessment modules are unavailable');
   // Test duration is set per CEFR bank; never let a URL silently change it.
   // These student previews remain outside the public teacher catalog.
   requireCondition(['A1','A2','B1','B2','C1','C2'].includes(level),
    'Unsupported independent test level');
   requireCondition(/^rl-[a-z0-9-]+$/.test(topic),'Invalid independent Reading topic');
   requireCondition(['en','es','de','fr'].includes(lang),'Unsupported Reading language');
   requireCondition(/^[a-z0-9_-]{6,40}$/i.test(params.get('attempt')||''),
    'This draft preview needs a valid local attempt ID');
   const [manifest,catalog]=await Promise.all([
    get('../../../version.json',true),
    get('../../../data/cards.json',true)
   ]);
   const card=catalog.entries?.find(c=>c.id===topic&&c.skill==='cteni');
   requireCondition(!!card&&Array.isArray(card.languages)&&
    card.languages.includes(lang)&&Array.isArray(card.levels)&&card.levels.includes(level)&&
    /^cteni/[a-z0-9-]+/index.html$/.test(card.relative||''),
    'Unsupported or unpublished Reading variant');
   const [originalHtml,bank]=await Promise.all([
    get('../../../'+card.relative),
    get(topic+'/'+lang+'-'+level+'.json',true)
   ]);
   requireCondition(manifest.version==='R31'&&
    manifest.backendEnabled===false&&manifest.gradedTestsEnabled===false,
    'Unexpected production baseline');
   const actual=await sourceHash(originalHtml);
   requireCondition(actual===manifest.contentHashes[topic],
    'Original source checksum mismatch: draft preview disabled');
   const practice=reading.variantFromData(reading.parseReadingData(originalHtml),lang,level);
   variant=testBank.makeQaVariant(bank,practice,actual,{topic,language:lang,level});
   requireCondition(params.get('timer')===String(bank.durationMinutesSuggested),
    'Timer must match the CEFR-specific approved draft duration');
   reading.validateVariant(variant);
   $('title').textContent=practice.title;
   document.title='Independent Reading '+lang.toUpperCase()+'/'+level+' – unapproved QA preview';
   document.querySelector('.subtitle').textContent=card.title+' · '+lang.toUpperCase()+'/'+level+' · 10 independent questions · '+bank.durationMinutesSuggested+' minutes';
   document.querySelector('.mode').textContent='UNAPPROVED DRAFT · '+lang.toUpperCase()+'/'+level;
   document.querySelector('.reading-panel .pill').textContent=lang.toUpperCase()+' · '+level;
   renderText();renderTasks();
   timed=window.LSHSessionUI.mount({
    skill:'reading',topic,lang,level,
    workspace:$('workspace'),
    getAnswers:()=>({answers:{...answers}}),
    restoreAnswers:saved=>{
     for(const q of variant.questions){
      const index=saved?.answers?.[q.id];
      if(!Number.isInteger(index)||index<0||index>=q.choices.length)continue;
      const input=[...$('questionList').querySelectorAll('input')].find(
       input=>input.name===q.id&&input.value===String(index));
      if(input){input.checked=true;answers[q.id]=index;}
     }
     progress();
    },
    onSubmit:({automatic,restored})=>submit(automatic,restored)
   });
   requireCondition(timed,'R32 pilot may not run without the local timer');
   timed.initialize();
   $('workspace').hidden=timed.status().phase==='ready';
   $('loading').hidden=true;
  }catch(error){
   $('workspace').hidden=true;
   $('results').hidden=true;
   $('loading').hidden=false;
   $('loading').classList.add('error');
   $('loading').textContent='Unapproved draft unavailable: '+String(error.message||error);
  }
 }
 $('submitButton').addEventListener('click',()=>submit(false,false));
 initialize();
})();
