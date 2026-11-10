/* R32 unapproved B2 Reading preview. Strictly separate from public R31 student pages.
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
 const lang=params.get('lang')||'en';
 const topic=params.get('topic')||'rl-can-mistakes';
 const timer=params.get('timer');
 const answers=Object.create(null);
 let variant=null,timed=null,submitted=false,currentBank=null;
 const locale={en:{choose:'Choose one answer.',remaining:'unanswered',correct:'Correct answer',yours:'Your answer',notAnswered:'Not answered',review:'NEEDS REVIEW · PARAGRAPH ',evidence:'Evidence / rationale',all:'All ten answers are correct. No mistakes to display.',submit:'Submit draft test'},es:{choose:'Elige una respuesta.',remaining:'sin responder',correct:'Respuesta correcta',yours:'Tu respuesta',notAnswered:'Sin responder',review:'REVISAR · PÁRRAFO ',evidence:'Prueba / explicación',all:'Las diez respuestas son correctas.',submit:'Entregar prueba de borrador'},de:{choose:'Wähle eine Antwort.',remaining:'unbeantwortet',correct:'Richtige Antwort',yours:'Deine Antwort',notAnswered:'Nicht beantwortet',review:'PRÜFEN · ABSATZ ',evidence:'Beleg / Erklärung',all:'Alle zehn Antworten sind richtig.',submit:'Testentwurf abgeben'},fr:{choose:'Choisis une réponse.',remaining:'sans réponse',correct:'Bonne réponse',yours:'Ta réponse',notAnswered:'Sans réponse',review:'À REVOIR · PARAGRAPHE ',evidence:'Preuve / explication',all:'Les dix réponses sont correctes.',submit:'Remettre le test provisoire'}};
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
  $('remaining').textContent=variant.questions.length-n+' '+locale[lang].remaining;
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
    field.appendChild(make('p','question-kind',locale[lang].choose));
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
  if(currentBank.editorialStatus==='AUTO_GENERATED_NOT_PEDAGOGICALLY_VALIDATED'){
   $('gradeProposal').replaceChildren(make('p','small-note',
    'NOT SCORED AS AN ASSESSMENT: automatically generated content has not been independently written or CEFR-validated. Points are technical QA only.'));
  }else{
   const candidate=grade.proposal(report.points,report.maxPoints);
   $('gradeProposal').replaceChildren(make('span','grade-caption',
    'Proposed local grade (not approved)'),make('strong','grade-number',String(candidate.grade)),
    make('p','small-note','Not a verified school grade. Teacher review is required.'));
  }
  const details=$('resultDetails');details.replaceChildren();
  const mistakes=report.details.filter(item=>!item.correct);
  if(!mistakes.length)details.appendChild(make('p','small-note',locale[lang].all));
  for(const error of mistakes){
   const item=variant.questions.find(q=>q.id===error.id);
   const block=make('article','review wrong');
   block.appendChild(make('span','state',locale[lang].review+item.sourceParagraph));
   block.appendChild(make('h3',null,error.prompt));
   resultLine(block,locale[lang].yours,error.answered?error.selectedAnswer:locale[lang].notAnswered);
   resultLine(block,locale[lang].correct,error.correctAnswer);
   resultLine(block,locale[lang].evidence,error.explanation);
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
   requireCondition(testBank.LEVELS.includes(level)&&testBank.LANGUAGES.includes(lang)&&
    testBank.TOPICS.includes(topic),'Unsupported independent test level, language or topic');
   requireCondition(/^[1-9][0-9]{0,2}$/.test(timer||'')&&
    Number(timer)>=5&&Number(timer)<=120&&
    /^[a-z0-9_-]{6,40}$/i.test(params.get('attempt')||''),
    'This draft preview requires a valid topic, lang, level, timer 5–120 and attempt.');
   const [manifest,catalog,bank]=await Promise.all([
    get('../../../version.json',true),
    get('../../../data/cards.json',true),
    get(topic+'/'+lang+'-'+level+'.json',true)
   ]);
   const entry=reading.readingEntry(catalog,topic);
   requireCondition(entry.languages.includes(lang)&&entry.levels.includes(level),
    'This variant is not available in the public source card');
   const originalHtml=await get('../../../'+entry.relative);
   requireCondition(manifest.version==='R31'&&
    manifest.backendEnabled===false&&manifest.gradedTestsEnabled===false,
    'Unexpected production baseline');
   const actual=await sourceHash(originalHtml);
   requireCondition(actual===manifest.contentHashes[topic],
    'Original source checksum mismatch: draft preview disabled');
   const practice=reading.variantFromData(reading.parseReadingData(originalHtml),lang,level);
   currentBank=bank;
   variant=testBank.makeQaVariant(bank,practice,actual,{topic,lang,level});
   reading.validateVariant(variant);
   $('title').textContent=practice.title;
   document.documentElement.lang=lang;
   document.title='Reading '+topic+' '+lang.toUpperCase()+'/'+level+' – unapproved QA';
   document.querySelector('.subtitle').textContent=entry.title+' · '+lang.toUpperCase()+'/'+level+
    ' · 10 draft questions · '+timer+' minutes';
   document.querySelector('.mode').textContent='UNAPPROVED DRAFT · '+lang.toUpperCase()+'/'+level;
   document.querySelector('.reading-panel .pill').textContent=lang.toUpperCase()+' · '+level;
   if(bank.editorialStatus==='AUTO_GENERATED_NOT_PEDAGOGICALLY_VALIDATED'){
    $('pilotWarning').textContent='AUTOMATED CONTENT SCAFFOLD – not a finished CEFR-level assessment. No grade is available. Teacher and editorial review required; do not share with pupils.';
   }
   $('submitButton').textContent=locale[lang].submit;
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
   requireCondition(timed,'Independent draft may not run without the local timer');
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
