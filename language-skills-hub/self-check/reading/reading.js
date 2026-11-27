/* R23 Reading Lab – standalone local self-check, not a protected exam.
 * No analytics, no student identifiers, no student submissions over the network.
 * Existing public practice cards are fetched as inert text; their scripts are never executed.
 */
(()=>{
 'use strict';
 const core=window.LSHReadingCore;
 const resultsCore=window.LSHResultCore;
 const gradeCore=window.LSHGradeCore;
 const exportCore=window.LSHExportCore;
 const $=id=>document.getElementById(id);
 const add=(tag,cls,text)=>{
  const e=document.createElement(tag);
  if(cls)e.className=cls;
  if(text!==undefined)e.textContent=text;
  return e;
 };
 const T={
  en:{
   mode:'LOCAL GRADE 1–5 · TEACHER REVIEW',themeLight:'☀ Light',themeDark:'☾ Dark',
   topic:'READING LAB · LOCAL SELF-CHECK',loading:'Loading the original reading questions…',
   error:'The Reading self-check could not be loaded.',
   lead:'Read the text and answer every question. Solutions appear only after you submit.',
   reading:'READING TEXT',questions:'COMPREHENSION',remaining:'questions left',answered:'answered',skills:'Reading skills',
   gap:'This sentence has been removed. Choose the missing sentence in the tasks.',
   mc:'Choose one answer',match:'Match to the paragraph',gapType:'Choose the missing sentence',
   reflection:'Optional reflection · not scored',
   reflectionNote:'The reflection is not marked automatically and does not affect your result.',
   submitNote:'One submission in this page session. Reloading can start over; this is not an enforced one-attempt test.',
   submitNoteTimed:'Your answers are saved in this browser. Reloading this page restores your attempt; it does not start a new one. This is not a secure exam.',
   submit:'Submit all answers',confirm:'Submit your answers now?',missing:'questions are unanswered.',
   result:'Self-check finished',resultKicker:'YOUR RESULT',correct:'Correct answers',
   points:'Points',percentage:'Success rate',grade:'No official school grade',
   review:'Review incorrect answers',right:'Correct',wrong:'Incorrect',
   notAnswered:'No answer',your:'Your answer',expected:'Correct answer',because:'Explanation',
   after:'For the proposed grade, the percentage is rounded to a whole number (0.5 rounds up) before applying the language scale. This is not a verified school record.',
   reflectionAfter:'The optional open reflection was not assessed automatically.',
   footer:'Public practice content · no login, no uploaded student results, no official school grade.',
   roundingLabel:'Rounding for grading',gradeProposal:'Suggested grade (1–5)',gradeWarning:'Unverified local proposal. The teacher must confirm any school grade.',
   loadingFailed:'Loading failed'
  },
  es:{
   mode:'PROPUESTA DE NOTA 1–5 · REVISIÓN DOCENTE',themeLight:'☀ Claro',themeDark:'☾ Oscuro',
   topic:'READING LAB · AUTOEVALUACIÓN LOCAL',loading:'Cargando las actividades originales…',
   error:'No se ha podido cargar la actividad de lectura.',
   lead:'Lee el texto y responde a las preguntas. Las soluciones aparecerán solo después de entregar.',
   reading:'TEXTO',questions:'COMPRENSIÓN',remaining:'preguntas pendientes',answered:'respondidas',skills:'Destrezas de lectura',
   gap:'Se ha eliminado una oración. Elige la que falta en las actividades.',
   mc:'Elige una respuesta',match:'Relaciona con el párrafo',gapType:'Elige la oración que falta',
   reflection:'Reflexión opcional · sin puntuación',
   reflectionNote:'La reflexión no se corrige automáticamente ni afecta al resultado.',
   submitNote:'Una entrega en esta sesión. Al recargar la página puedes empezar de nuevo; no es un examen con intentos controlados.',
   submitNoteTimed:'Tus respuestas se guardan en este navegador. Al recargar la página se recupera tu intento; no empieza uno nuevo. No es un examen seguro.',
   submit:'Entregar todas las respuestas',confirm:'¿Quieres entregar tus respuestas?',missing:'preguntas sin responder.',
   result:'Autoevaluación terminada',resultKicker:'TU RESULTADO',correct:'Respuestas correctas',
   points:'Puntos',percentage:'Porcentaje',grade:'Sin calificación oficial',
   review:'Revisa las respuestas incorrectas',right:'Correcto',wrong:'Incorrecto',
   notAnswered:'Sin responder',your:'Tu respuesta',expected:'Respuesta correcta',because:'Explicación',
   after:'Para proponer la nota, el porcentaje se redondea al entero más cercano (0,5 hacia arriba) antes de aplicar la escala. No es una calificación escolar verificada.',
   reflectionAfter:'La reflexión abierta opcional no se ha evaluado automáticamente.',
   footer:'Contenido público de práctica · sin registro ni envío de resultados · sin nota oficial.',
   roundingLabel:'Redondeo para la nota',gradeProposal:'Nota propuesta (1–5)',gradeWarning:'Propuesta local sin verificación. El docente debe confirmar la nota escolar.',
   loadingFailed:'Error de carga'
  },
  de:{
   mode:'NOTENVORSCHLAG 1–5 · LEHRKRAFT PRÜFT',themeLight:'☀ Hell',themeDark:'☾ Dunkel',
   topic:'READING LAB · LOKALER SELBSTTEST',loading:'Die ursprünglichen Leseaufgaben werden geladen…',
   error:'Der Lese-Selbsttest konnte nicht geladen werden.',
   lead:'Lies den Text und beantworte die Fragen. Lösungen erscheinen erst nach der Abgabe.',
   reading:'LESETEXT',questions:'TEXTVERSTÄNDNIS',remaining:'Fragen offen',answered:'beantwortet',skills:'Lesestrategien',
   gap:'Ein Satz wurde entfernt. Wähle in den Aufgaben den passenden Satz aus.',
   mc:'Wähle eine Antwort',match:'Ordne dem Absatz zu',gapType:'Wähle den fehlenden Satz',
   reflection:'Freiwillige Reflexion · ohne Punkte',
   reflectionNote:'Die Reflexion wird nicht automatisch bewertet und beeinflusst dein Ergebnis nicht.',
   submitNote:'Eine Abgabe in dieser Sitzung. Nach dem Neuladen ist ein neuer Versuch möglich; dies ist keine Prüfung mit gesperrten Wiederholungen.',
   submitNoteTimed:'Deine Antworten werden in diesem Browser gespeichert. Nach dem Neuladen wird dein Versuch wiederhergestellt, nicht neu begonnen. Dies ist keine sichere Prüfung.',
   submit:'Alle Antworten abgeben',confirm:'Möchtest du deine Antworten jetzt abgeben?',missing:'Fragen sind unbeantwortet.',
   result:'Selbsttest abgeschlossen',resultKicker:'DEIN ERGEBNIS',correct:'Richtige Antworten',
   points:'Punkte',percentage:'Erfolgsquote',grade:'Keine offizielle Schulnote',
   review:'Falsche Antworten überprüfen',right:'Richtig',wrong:'Falsch',
   notAnswered:'Keine Antwort',your:'Deine Antwort',expected:'Richtige Antwort',because:'Erklärung',
   after:'Für den Notenvorschlag wird der Prozentwert zunächst mathematisch auf ganze Prozent gerundet (ab 0,5 aufwärts). Dies ist keine bestätigte Schulnote.',
   reflectionAfter:'Die freiwillige offene Reflexion wurde nicht automatisch bewertet.',
   footer:'Öffentliche Übungsinhalte · keine Anmeldung, keine Übermittlung der Antworten, keine Schulnote.',
   roundingLabel:'Rundung für die Note',gradeProposal:'Notenvorschlag (1–5)',gradeWarning:'Unverifizierter Vorschlag. Die Lehrkraft muss jede Schulnote bestätigen.',
   loadingFailed:'Ladefehler'
  },
  fr:{
   mode:'PROPOSITION DE NOTE 1–5 · VALIDATION ENSEIGNANT',themeLight:'☀ Clair',themeDark:'☾ Sombre',
   topic:'READING LAB · AUTOÉVALUATION LOCALE',loading:'Chargement des exercices de lecture d’origine…',
   error:'Impossible de charger cette autoévaluation de lecture.',
   lead:'Lis le texte et réponds aux questions. Les solutions ne s’affichent qu’après l’envoi.',
   reading:'TEXTE À LIRE',questions:'COMPRÉHENSION',remaining:'questions restantes',answered:'répondues',skills:'Compétences de lecture',
   gap:'Une phrase a été retirée du texte. Choisis la phrase manquante dans les exercices.',
   mc:'Choisis une réponse',match:'Associe au paragraphe',gapType:'Choisis la phrase manquante',
   reflection:'Réflexion facultative · non notée',
   reflectionNote:'La réflexion n’est pas évaluée automatiquement et ne compte pas dans le résultat.',
   submitNote:'Un seul envoi pour cette session. Recharger la page permet de recommencer : ce n’est pas un examen à tentative unique garantie.',
   submitNoteTimed:'Tes réponses sont enregistrées dans ce navigateur. Recharger la page restaure ta tentative, sans en commencer une nouvelle. Ce n’est pas un examen sécurisé.',
   submit:'Envoyer toutes les réponses',confirm:'Envoyer tes réponses maintenant ?',missing:'questions sans réponse.',
   result:'Autoévaluation terminée',resultKicker:'TON RÉSULTAT',correct:'Bonnes réponses',
   points:'Points',percentage:'Taux de réussite',grade:'Aucune note scolaire officielle',
   review:'Vérifie tes réponses incorrectes',right:'Correct',wrong:'Incorrect',
   notAnswered:'Sans réponse',your:'Ta réponse',expected:'Bonne réponse',because:'Explication',
   after:'Pour proposer la note, le pourcentage est d’abord arrondi à l’entier le plus proche (0,5 vers le haut), puis le barème est appliqué. Ce n’est pas une note scolaire vérifiée.',
   reflectionAfter:'La réflexion ouverte facultative n’a pas été évaluée automatiquement.',
   footer:'Exercices publics · sans connexion ni envoi des résultats · aucune note officielle.',
   roundingLabel:'Arrondi pour la note',gradeProposal:'Note proposée (1–5)',gradeWarning:'Proposition locale non vérifiée. L’enseignant doit confirmer la note scolaire.',
   loadingFailed:'Échec du chargement'
  }
 };
 const search=new URLSearchParams(location.search);
 const selected={
  topic:search.get('topic')||'rl-asteroids',
  lang:search.get('lang')||'en',
  level:search.get('level')||'B2'
 };
 const locale=core.LANGUAGES.includes(selected.lang)?selected.lang:'en';
 const ui=T[locale];
 const exportsCopy={
  en:{"button":"Download detailed CSV (spreadsheet)","pdf":"Download complete test PDF","copy":"Copy complete test report","note":"PDF and copy include all questions, your answers, correct answers and mistakes. The document has no name; send it from your school email. Optional reflection, if written, is included but not scored.","done":"CSV downloaded.","pdfDone":"Complete PDF downloaded. Email it to your teacher.","copied":"Complete test copied. Send it to your teacher.","error":"Export failed."},
  es:{"button":"Descargar CSV para tabla","pdf":"Descargar PDF del examen completo","copy":"Copiar examen y respuestas","note":"El PDF incluye todas las preguntas, tus respuestas, las soluciones y los errores. No contiene tu nombre; envíalo desde el correo escolar. Se incluye la reflexión opcional sin puntuar.","done":"CSV descargado.","pdfDone":"PDF completo descargado. Envíalo al docente.","copied":"Examen completo copiado. Envíalo al docente.","error":"Error de exportación."},
  de:{"button":"Detaillierte CSV-Tabelle herunterladen","pdf":"Vollständigen PDF-Test herunterladen","copy":"Vollständiges Testergebnis kopieren","note":"Das PDF enthält alle Fragen, Antworten, Lösungen und Fehler. Ohne Namen; bitte vom Schulkonto versenden. Optionale Reflexion wird mitgesendet, aber nicht bewertet.","done":"CSV gespeichert.","pdfDone":"Vollständiges PDF gespeichert. Bitte der Lehrkraft zusenden.","copied":"Vollständiger Test kopiert. Bitte der Lehrkraft zusenden.","error":"Export fehlgeschlagen."},
  fr:{"button":"Télécharger CSV pour tableau","pdf":"Télécharger PDF complet du test","copy":"Copier le test complet","note":"Le PDF contient toutes les questions, tes réponses, les solutions et tes erreurs. Il ne contient pas de nom ; envoie-le depuis ton courriel scolaire. La réflexion facultative est incluse sans être notée.","done":"CSV téléchargé.","pdfDone":"PDF complet téléchargé. Transmets-le au professeur.","copied":"Test complet copié. Transmets-le au professeur.","error":"Échec de l'exportation."}
 }[locale];
 let variant=null;
 const answers=Object.create(null);
 let submitted=false,timedUI=null,lastReport=null,annotationAPI=null;
 let smartPilot=false,smartBank=null,smartLogoReady=false;
 const annotationKey=['lsh-reading-annotations-v1',selected.topic,selected.lang,selected.level].join(':');
 let annotationRaw=null,annotationReadable=false,timedAnnotationWrite=false;
 let annotationReadError='',retainedTimedAnnotations=[],timedBudget=100000,capacityWarning='';
 function themeSet(light,save){
  document.documentElement.dataset.theme=light?'light':'dark';
  $('themeButton').textContent=light?ui.themeDark:ui.themeLight;
  $('themeButton').setAttribute('aria-pressed',String(light));
  if(save){try{localStorage.setItem('lsh-selfcheck-theme',light?'light':'dark');}catch(_){}}
 }
 function themeInit(){
  let pref=null;try{pref=localStorage.getItem('lsh-selfcheck-theme')}catch(_){}
  themeSet(pref?pref==='light':!!window.matchMedia?.('(prefers-color-scheme: light)').matches,false);
  $('themeButton').addEventListener('click',()=>{
   themeSet(document.documentElement.dataset.theme!=='light',true);
  });
 }
 function translate(){
  document.documentElement.lang=locale;
  document.title='Reading Lab · '+ui.mode;
  $('topicLabel').textContent=ui.topic;
  $('modeTag').textContent=ui.mode;
  $('lead').textContent=ui.lead;
  $('loading').textContent=ui.loading;
  $('readingKicker').textContent=ui.reading;
  $('questionKicker').textContent=ui.questions;
  $('questionsHeading').textContent=ui.questions;
  $('readingSkillTabs').setAttribute('aria-label',ui.skills);
  $('reflectionHeading').textContent=ui.reflection;
  $('reflectionNote').textContent=ui.reflectionNote;
  $('submitNote').textContent=search.has('timer')?ui.submitNoteTimed:ui.submitNote;
  $('submitButton').textContent=ui.submit;
  $('resultHeading').textContent=ui.result;
  $('resultKicker').textContent=ui.resultKicker;
  $('footer').textContent=ui.footer;
  $('exportResult').textContent=exportsCopy.button;
  $('exportPdf').textContent=exportsCopy.pdf;
  $('exportCopy').textContent=exportsCopy.copy;
  $('exportStatus').textContent=exportsCopy.note;
 }
 function renderReading(){
  $('readingHeading').textContent=variant.title;
  $('readingVariant').textContent=selected.lang.toUpperCase()+' · '+selected.level;
  $('readingParagraphs').replaceChildren();
  variant.paragraphs.forEach((_,i)=>{
   const p=add('p');
   p.dataset.annotationAnchor='p:'+i;
   for(const part of core.readingParagraphParts(variant,i)){
    if(part.kind==='gap')p.appendChild(add('span','gap-marker',part.text));
    else p.appendChild(document.createTextNode(part.text));
   }
   $('readingParagraphs').appendChild(p);
  });
  const gap=variant.questions.some(q=>q.kind==='gap');
  $('readingGapNote').hidden=!gap;
  $('readingGapNote').textContent=gap?ui.gap:'';
 }
 function getAnsweredCount(){
  return variant.questions.reduce((sum,q)=>sum+
   (Object.prototype.hasOwnProperty.call(answers,q.id)?1:0),0);
 }
 // R58: same skill labels/order as practice; no Cambridge explanations in TEST.
 // Input elements stay mounted, so answers, timing and scoring cover every tab.
 let activeSkillTab=null;
 function selectSkillTab(skill,focus=false){
  const buttons=[...$('readingSkillTabs').querySelectorAll('[role="tab"]')];
  const target=buttons.find(button=>button.dataset.skill===skill);
  if(!target)return;
  activeSkillTab=skill;
  for(const button of buttons){
   const current=button===target;
   button.setAttribute('aria-selected',String(current));
   button.tabIndex=current?0:-1;
  }
  for(const panel of $('questionList').querySelectorAll('.reading-skill-panel'))
   panel.hidden=panel.dataset.skill!==skill;
  if(focus)target.focus();
 }
 function onSkillTabKey(event){
  const tabs=[...$('readingSkillTabs').querySelectorAll('[role="tab"]')];
  const current=tabs.indexOf(event.currentTarget);
  if(current<0)return;
  let next=current;
  if(event.key==='ArrowRight')next=(current+1)%tabs.length;
  else if(event.key==='ArrowLeft')next=(current+tabs.length-1)%tabs.length;
  else if(event.key==='Home')next=0;
  else if(event.key==='End')next=tabs.length-1;
  else return;
  event.preventDefault();
  selectSkillTab(tabs[next].dataset.skill,true);
 }
 function updateProgress(){
  const count=getAnsweredCount(),total=variant.questions.length;
  $('counter').textContent=count+' / '+total;
  $('remaining').textContent=(total-count)+' '+ui.remaining+' · '+count+' '+ui.answered;
  $('progress').setAttribute('aria-valuenow',String(Math.round(count/total*100)));
  $('progressFill').style.width=(count/total*100)+'%';
  for(const button of $('readingSkillTabs').querySelectorAll('[role="tab"]')){
   const group=variant.questions.filter(q=>q.tab===button.dataset.skill);
   const answered=group.filter(q=>Object.prototype.hasOwnProperty.call(answers,q.id)).length;
   button.querySelector('.reading-tab-count').textContent=answered+' / '+group.length;
   button.setAttribute('aria-label',button.dataset.title+' · '+answered+' / '+group.length+' '+ui.answered);
   button.classList.toggle('is-complete',answered===group.length);
  }
 }
 function renderQuestions(){
  const list=$('questionList'),navigation=$('readingSkillTabs');
  list.replaceChildren();navigation.replaceChildren();
  let number=0;
  for(const tab of variant.tabs){
   const questions=variant.questions.filter(q=>q.tab===tab.id);
   if(!questions.length)continue;
   const button=add('button','reading-skill-tab');
   button.type='button';button.id='reading-test-tab-'+tab.id;
   button.dataset.skill=tab.id;button.dataset.title=tab.title;
   button.setAttribute('role','tab');
   button.setAttribute('aria-controls','reading-test-panel-'+tab.id);
   button.setAttribute('aria-selected','false');
   button.tabIndex=-1;
   button.append(add('span','reading-tab-title',tab.title),
    add('span','reading-tab-count','0 / '+questions.length));
   button.addEventListener('click',()=>selectSkillTab(tab.id));
   button.addEventListener('keydown',onSkillTabKey);
   navigation.appendChild(button);
   const stage=add('section','stage reading-skill-panel');
   stage.id='reading-test-panel-'+tab.id;
   stage.dataset.skill=tab.id;
   stage.setAttribute('role','tabpanel');
   stage.setAttribute('aria-labelledby',button.id);
   stage.tabIndex=0;
   list.appendChild(stage);
   for(const q of questions){
    number++;
    const card=add('fieldset','question');
    const legend=add('legend',null,number+'. '+q.q);
    legend.dataset.annotationAnchor='q:'+q.id;
    card.appendChild(legend);
    const kind=q.kind==='gap'?ui.gapType:q.kind==='match'?ui.match:ui.mc;
    card.appendChild(add('p','question-kind',kind));
    q.choices.forEach((choice,i)=>{
     const label=add('label','choice');
     const radio=add('input');
     radio.type='radio';radio.name=q.id;radio.value=String(i);
     radio.setAttribute('aria-label',choice);
     radio.addEventListener('change',()=>{
      if(submitted)return;
      answers[q.id]=i;
      updateProgress();
      timedUI?.save();
     });
     const choiceText=add('span',null,choice);
     choiceText.dataset.annotationAnchor='c:'+q.id+':'+i;
     label.append(radio,choiceText);
     card.appendChild(label);
    });
    stage.appendChild(card);
   }
  }
  navigation.hidden=navigation.childElementCount===0;
  selectSkillTab(navigation.querySelector('[role="tab"]')?.dataset.skill);
  $('reflectionWrap').hidden=!(typeof variant.open==='string'&&variant.open.trim());
  $('reflectionPrompt').textContent=variant.open||'';
  updateProgress();
 }
 function resultValue(number,label){
  const tile=add('div','score-value');
  tile.appendChild(add('strong',null,String(number)));
  tile.appendChild(add('span',null,label));
  return tile;
 }
 function line(container,label,text){
  const p=add('p');
  p.appendChild(add('strong',null,label+': '));
  p.appendChild(document.createTextNode(text));
  container.appendChild(p);
 }
 // Student review contains only mistakes; the teacher archive uses the full report.
 function answerComparison(container,studentAnswer,correctAnswer){
  const pair=add('dl','feedback-compare');
  for(const [kind,label,value]of [
   ['submitted',ui.your,studentAnswer],
   ['expected',ui.expected,correctAnswer]
  ]){
   const cell=add('div','feedback-answer '+kind);
   cell.append(add('dt',null,label),add('dd',null,String(value)));
   pair.appendChild(cell);
  }
  container.appendChild(pair);
 }

 // F1: existing submitted snapshot remains the only source of score and answers.
 function renderSmartResults(report){
  const details=$('resultDetails');$('results').appendChild(details);
  details.lang='cs';details.classList.add('sf-results');
  let phase='PRE_SUBMISSION';
  const active=()=>submitted&&lastReport===report;
  const mistakes=report.details.filter(item=>!item.correct);
  const resolved=mistakes.map(item=>core.resolveSmartFeedback?.(item,smartBank,variant)||null);
  const premium=!!smartBank&&resolved.every(Boolean);
  function node(tag,cls,value,lang){
   const el=add(tag,cls,value);if(lang)el.lang=lang;return el;
  }
  function btn(id,label,cls,callback){
   const b=node('button','action '+cls,label);b.id=id;b.type='button';
   b.addEventListener('click',callback);return b;
  }
  function sectionText(parent,label,value,lang='cs'){
   const part=node('section','sf-part');part.append(node('h4',null,label),node('p',null,value,lang));parent.append(part);
  }
  function heading(label){
   const h=node('h3','sf-heading',label);h.id='sfHeading';h.tabIndex=-1;details.append(h);return h;
  }
  function transition(next,focus){
   if(!active()||!({PRE_SUBMISSION:['SUMMARY'],SUMMARY:['FEEDBACK','DECLINED'],FEEDBACK:['DONE']}[phase]||[]).includes(next))return;
   phase=next;details.dataset.sfPhase=phase;details.replaceChildren();
   let h;
   if(phase==='SUMMARY'){
    h=heading('Chceš zpětnou vazbu?');
    details.append(node('p','sf-intro','Podívej se, proč některé odpovědi nebyly správné a co si z toho můžeš odnést do příště.'));
    if(!mistakes.length)details.append(node('p','sf-intro','Všechny bodované úlohy máš správně.'));
    const actions=node('div','sf-actions');
    actions.append(btn('sfAccept','Chci zpětnou vazbu','primary',()=>transition('FEEDBACK',true)),
     btn('sfDecline','Nechci zpětnou vazbu','ghost',()=>transition('DECLINED',true)));
    details.append(actions);
   }else if(phase==='FEEDBACK'){
    h=heading('Tvoje zpětná vazba');
    details.append(node('p','sf-intro',mistakes.length?mistakes.length+' z '+report.total+' bodovaných úloh k projití.':'Všechny bodované úlohy máš správně. Není co opravovat.'));
    if(mistakes.length&&!premium)details.append(node('p','sf-unavailable','Rozšířená zpětná vazba není dostupná. Níže jsou původní vysvětlení úloh, pokud jsou k dispozici.'));
    mistakes.forEach((item,index)=>{
     const qIndex=variant.questions.findIndex(q=>q.id===item.id);
     const q=variant.questions[qIndex];
     const tab=variant.tabs.find(t=>t.id===q?.tab);
     const box=node('article','review wrong sf-card');box.dataset.questionId=item.id;
     const meta=node('div','sf-meta');
     meta.append(node('span','sf-number','Otázka '+(qIndex+1)),node('span','sf-skill',tab?.title||'',selected.lang),
      node('span','sf-state',item.answered?'Chybná odpověď':'Nezodpovězená'));
     box.append(meta,node('h4','sf-prompt',item.prompt,selected.lang));
     const pair=node('dl','feedback-compare');
     for(const [kind,label,value,lang] of [
      ['submitted','Tvoje odpověď',item.answered?item.selectedAnswer:'Bez odpovědi',item.answered?selected.lang:'cs'],
      ['expected','Správná odpověď',item.correctAnswer,selected.lang]
     ]){
      const cell=node('div','feedback-answer '+kind);
      cell.append(node('dt',null,label),node('dd',null,value,lang));pair.append(cell);
     }
     box.append(pair);
     if(!item.answered)sectionText(box,'Bez odpovědi','Tuhle otázku jsi nechal bez odpovědi.');
     const f=premium?resolved[index]:null;
     if(f){
      if(f.status==='wrong')sectionText(box,'Proč tvoje odpověď nesedí',f.whyWrong);
      sectionText(box,'Proč je to správně',f.correctWhy);
      const evidence=node('section','sf-evidence');evidence.append(node('h4',null,'Opora v textu'));
      for(const e of f.evidence){
       const quote=node('blockquote','sf-quote');
       quote.append(node('span','sf-quote-label','Odstavec '+(e.p+1)),node('p',null,e.text,selected.lang));evidence.append(quote);
      }
      box.append(evidence);
      const tip=node('section','sf-tip');tip.append(node('h4',null,'Tip pro příště'),node('p',null,f.tip));box.append(tip);
     }else{
      sectionText(box,'Původní vysvětlení',item.explanation||'Prober tuto úlohu s učitelem.',item.explanation?selected.lang:'cs');
     }
     details.append(box);
    });
    details.append(node('p','sf-intro','Pokud něčemu stále nerozumíš, můžeš úplný výsledkový protokol probrat s učitelem.'));
    const actions=node('div','sf-actions');
    actions.append(btn('sfDone','Dokončit','primary',()=>transition('DONE',true)));details.append(actions);
   }else{
    h=heading('Hotovo');
    details.append(node('p','sf-intro',smartLogoReady?'Stáhni si PDF a předej ho učiteli.':'Použij úplnou textovou kopii nebo CSV a předej výsledek učiteli. PDF nyní není dostupné.'));
   }
   if(focus){h.focus({preventScroll:true});h.scrollIntoView({block:'start'});}
  }
  transition('SUMMARY',false);
 }
 function renderResult(report){
  $('resultCaution').textContent=ui.after+' '+ui.grade+'.';
  const proposal=gradeCore.proposal(report.points,report.maxPoints);
  $('gradeProposal').replaceChildren();
  $('gradeProposal').append(
   add('span','grade-caption',ui.gradeProposal),
   add('strong','grade-number',String(proposal.grade)),
   add('p','small-note',ui.roundingLabel+': '+proposal.displayedPercent+' % → '+proposal.roundedPercent+' %'),
   add('p','small-note',ui.gradeWarning)
  );
  const normalized=resultsCore.reviewReading(report);
  const tiles=resultsCore.scoreTiles(normalized,{
   points:ui.points,objectivePercent:ui.percentage,
   completion:ui.answered,schoolGrade:ui.grade,noGrade:'—'
  },locale);
  $('scoreSummary').replaceChildren(...tiles.map(tile=>resultValue(tile.value,tile.label)));
  const details=$('resultDetails');details.replaceChildren();
  if(smartPilot)renderSmartResults(report);
  else{
  details.appendChild(add('h3',null,ui.review));
  const mistakes=report.details.filter(item=>!item.correct);
  if(!mistakes.length)details.appendChild(add('p','small-note',{
   en:'All answers are correct. There are no mistakes to review.',
   es:'Todas las respuestas son correctas. No hay errores que revisar.',
   de:'Alle Antworten sind richtig. Es gibt keine Fehler zu überprüfen.',
   fr:'Toutes les réponses sont correctes. Il n’y a aucune erreur à revoir.'
  }[locale]));
  for(const item of mistakes){
   const box=add('article','review wrong');
   box.appendChild(add('span','state',item.answered?ui.wrong:ui.notAnswered));
   box.appendChild(add('h3',null,item.prompt));
   answerComparison(box,item.answered?item.selectedAnswer:ui.notAnswered,item.correctAnswer);
   if(item.explanation){
    const explanation=add('div','feedback-explanation');
    line(explanation,ui.because,item.explanation);
    box.appendChild(explanation);
   }
   details.appendChild(box);
  }
  }
  $('resultReflection').textContent=ui.reflectionAfter;
  $('exportResult').hidden=!exportCore;
  $('exportCopy').hidden=!window.LSHPdfReport;
  $('exportPdf').hidden=!window.LSHPdfReport;
  if(smartPilot&&!smartLogoReady){
   $('exportPdf').disabled=true;
   const notice=add('p','sf-unavailable','PDF není dostupné: při načtení testu se nepodařilo připravit originální logo školy. Použij úplnou textovou kopii nebo CSV.');
   notice.lang='cs';notice.id='sfPdfUnavailable';$('exportStatus').before(notice);
  }
  $('results').hidden=false;
  $('results').focus({preventScroll:true});
  $('results').scrollIntoView({behavior:'smooth',block:'start'});
 }
 function showCapacityWarning(message){
  if(capacityWarning===message)return;
  capacityWarning=message;
  let notice=$('readingAnnotationCapacityWarning');
  if(!notice){
   notice=add('p','small-note lsh-anno-storage-warning');notice.id='readingAnnotationCapacityWarning';notice.lang='cs';
   notice.setAttribute('role','status');$('readingAnnotationTools').before(notice);
  }
  notice.textContent=message;notice.hidden=!message;
 }
 function currentTimedSnapshot(records=annotationAPI?.snapshot()||retainedTimedAnnotations){
  const data={answers:{...answers},reflection:$('reflection').value,annotations:[...records]};
  const fit=window.LSHReadingAnnotations?.timedSnapshot;
  if(typeof fit==='function')return fit(data.answers,data.reflection,data.annotations);
  // Fail-safe for mixed HTTP cache / a missing optional annotation script.
  while(data.annotations.length&&JSON.stringify(data).length>140000)data.annotations.pop();
  return data;
 }
 function updateCapacityWarning(records,fit){
  const omitted=records.length-fit.annotations.length;
  if(omitted>0)showCapacityWarning('Starší anotace přesahují kapacitu pokusu. Odpovědi a reflexe mají přednost. '+omitted+' anotací se při uložení nevejde do snímku a po obnovení stránky mohou chybět.'+
   (annotationAPI?' V otevřené stránce zůstávají dostupné. Kapacitu lze uvolnit postupným zkracováním nebo mazáním jednotlivých anotací.':' Tento prohlížeč neumožňuje anotace zobrazit ani upravit.'));
  else if(JSON.stringify(records).length>timedBudget)showCapacityWarning('Starší anotace překračují nový rozpočet. Při dosažení celkové kapacity mají přednost odpovědi a reflexe.'+
   (annotationAPI?' Další anotace nelze přidávat, dokud jejich velikost nesnížíte. Zkraťte nebo smažte jednotlivé anotace.':' Tento prohlížeč neumožňuje anotace zobrazit ani upravit.'));
  else showCapacityWarning('');
 }
 function timedAnswers(){
  const records=annotationAPI?.snapshot()||retainedTimedAnnotations,fit=currentTimedSnapshot(records);
  updateCapacityWarning(records,fit);return fit;
 }
 function disableAnnotations(error){
  $('readingAnnotationTools').hidden=true;
  const toggle=$('readingAnnotationToggle');toggle.disabled=true;toggle.textContent='Anotace nedostupné';
  toggle.setAttribute('aria-pressed','false');toggle.title='Anotační nástroje nejsou v tomto prohlížeči dostupné.';
  annotationAPI=null;
  if(error)console.warn('Reading annotations unavailable',error?.message||error);
 }
 function submit(automatic=false,restored=false){
  if(submitted||!variant)return;
  const missing=variant.questions.length-getAnsweredCount();
  let message=ui.confirm+(missing?' '+missing+' '+ui.missing:'');
  if(!automatic&&annotationAPI?.hasDraft())message+='\n\nRozpracovaná poznámka nebude uložena.';
  if(!automatic&&timedUI){
   const records=annotationAPI?.snapshot()||retainedTimedAnnotations;
   const omitted=records.length-currentTimedSnapshot(records).annotations.length;
   if(omitted)message+='\n\nKapacita starších anotací je překročena. Při uložení má '+omitted+' anotací nižší prioritu než odpovědi a reflexe a nebudou součástí uloženého snímku.';
  }
  if(!automatic&&!window.confirm(message))return;
  const report=core.score(variant,answers);
  if(timedUI&&!restored){
   try{timedUI.finish();}
   catch(error){
    // An exceptional save error must not appear as a successful submission.
    // Never modify the deadline, session state machine or scoring.
    if(!automatic)window.alert('Test se nepodařilo odevzdat. Vaše odpovědi jsou stále na stránce. Obraťte se na učitele.');
    console.warn('Reading submission failed',error?.message||error);return;
   }
  }
  lastReport=report;
  submitted=true;
  annotationAPI?.refresh();
  $('submitButton').disabled=true;
  $('submitButton').textContent=ui.result;
  for(const input of $('questionList').querySelectorAll('input'))input.disabled=true;
  $('reflection').disabled=true;
  renderResult(report);
 }
 async function fetchJson(path){
  const response=await fetch(path,{credentials:'omit',redirect:'error'});
  if(!response.ok)throw new Error('HTTP '+response.status);
  return response.json();
 }
 async function start(){
  translate();themeInit();
  $('submitButton').addEventListener('click',()=>submit(false,false));
  $('reflection').addEventListener('input',()=>timedUI?.save());
  const archiveData=()=>{
   if(!submitted||!lastReport||!exportCore)throw new Error('No submitted result.');
   const state=timedUI?.status();
   const receipt=exportCore.reading(lastReport,{
    topic:selected.topic,language:selected.lang,level:selected.level,
    submittedAt:state?.submittedAt??null,
    interruptionCount:state?.incidents?.length??0
   });
   return {receipt,rows:exportCore.questionRows(lastReport,'reading')};
  };
  $('exportResult').addEventListener('click',()=>{
   try{
    const {receipt,rows}=archiveData();
    exportCore.downloadDetailed(receipt,rows);
    $('exportStatus').textContent=exportsCopy.done;
   }catch(error){
    $('exportStatus').textContent=exportsCopy.error+' '+String(error.message||error);
   }
  });
  const completeReport=()=>{
   if(!lastReport||!variant||!window.LSHPdfReport)throw new Error('PDF report unavailable.');
   const proposal=gradeCore.proposal(lastReport.points,lastReport.maxPoints);
   return {
    skill:'reading',topicId:selected.topic,topic:variant.title,
    language:selected.lang,level:selected.level,generatedAt:Date.now(),
    readingText:variant.paragraphs.join('\n\n'),
    summary:{earned:proposal.earned,max:proposal.max,
     percent:proposal.displayedPercent,roundedPercent:proposal.roundedPercent,
     grade:proposal.grade},
    questions:lastReport.details.map(item=>({
     question:item.prompt,options:(variant.questions.find(q=>q.id===item.id)?.choices||[]),
     studentAnswer:item.answered?item.selectedAnswer:'Bez odpovědi',
     correctAnswer:item.correctAnswer,correct:item.correct,
     awarded:item.correct?1:0,explanation:item.explanation||''
    })),
    reflection:$('reflection').value.trim(),
    security:window.LSHPdfReport.securityFromAttempt(timedUI?.status())
   };
  };
  $('exportPdf').addEventListener('click',async()=>{
   try{
    if(smartPilot){
     if(!smartLogoReady)throw new Error('PDF není dostupné. Použij úplnou textovou kopii nebo CSV.');
     await window.LSHPdfReport.downloadLocal(completeReport());
    }else await window.LSHPdfReport.download(completeReport());
    $('exportStatus').textContent=exportsCopy.pdfDone;
   }catch(error){
    $('exportStatus').textContent=exportsCopy.error+' '+String(error.message||error);
   }
  });
  $('exportCopy').addEventListener('click',async()=>{
   try{
    await window.LSHPdfReport.copy(completeReport());
    $('exportStatus').textContent=exportsCopy.copied;
   }catch(error){
    $('exportStatus').textContent=exportsCopy.error+' '+String(error.message||error);
   }
  });
  try{
   const catalog=await fetchJson('../../data/cards.json');
   const entry=core.readingEntry(catalog,selected.topic);
   if(!entry.languages.includes(selected.lang)||!entry.levels.includes(selected.level))
    throw new Error('Varianta není v katalogu dostupná.');
   const url='../../'+entry.relative;
   const response=await fetch(url,{credentials:'omit',redirect:'error'});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const html=await response.text();
   const data=core.parseReadingData(html);
   variant=core.variantFromData(data,selected.lang,selected.level);
   // Scope is derived from the validated catalog entry and canonical variant.
   smartPilot=entry.id==='rl-asteroids';
   if(smartPilot){
    const [prepared,validated]=await Promise.all([
     Promise.resolve().then(()=>window.LSHPdfReport?.prepareLocalLogo(document,5000)).catch(()=>false),
     Promise.resolve().then(()=>core.validateSmartFeedback(html,entry.id,selected.lang,selected.level,variant)).catch(()=>null)
    ]);
    smartLogoReady=prepared===true;smartBank=validated;
   }
   $('title').textContent=variant.title;
   $('lead').textContent=ui.lead;
   renderReading();renderQuestions();
   if(window.LSHReadingAnnotations){
    try{
     const engine=window.LSHReadingAnnotations;
     if(typeof engine.timedAnnotationBudget!=='function'||typeof engine.timedSnapshot!=='function')throw Error('Annotation runtime version mismatch');
     timedBudget=engine.timedAnnotationBudget(variant.questions.map(q=>q.id));
     annotationAPI=engine.mount({
      host:$('readingAnnotationTools'),toggle:$('readingAnnotationToggle'),
      containers:[$('readingParagraphs'),$('questionList')],
      canEdit:()=>{
       if(submitted)return false;
       if(!timedUI)return true;
       const s=timedUI.status();return s.phase==='running'&&!s.expired;
      },
      onChange:(annotations,previous)=>{
       if(timedUI){
        timedAnnotationWrite=false;
        const before=timedUI.status();
        if(!before.persistent||before.expired||before.phase!=='running')return false;
        const size=JSON.stringify(annotations).length,oldSize=JSON.stringify(previous||[]).length;
        const fit=currentTimedSnapshot(annotations);
        const fits=fit.annotations.length===annotations.length;
        // Historical oversized attempts can be reduced incrementally. Never
        // grow their footprint above either the reserved or actual ceiling.
        if(size>oldSize&&(size>timedBudget||!fits))
         return 'Limit velikosti anotací v testu je vyčerpán. Odpovědi a reflexe mají přednost. Zkraťte nebo smažte anotace.';
        timedAnnotationWrite=true;
        timedUI.save();const after=timedUI.status();
        // A deadline may cross immediately after a synchronous save.
        // Verify the actual accepted snapshot, not merely the current phase.
        const accepted=after.persistent&&JSON.stringify(after.answers?.annotations)===JSON.stringify(fit.annotations);
        if(accepted)timedAnnotationWrite=false;
        return accepted;
       }
       try{
        if(!annotationReadable)return annotationReadError||'Úložiště anotací není dostupné.';
        if(localStorage.getItem(annotationKey)!==annotationRaw)return 'Anotace byly změněny v jiné záložce. Obnovte stránku; původní data nebyla přepsána.';
        const next=JSON.stringify(annotations);localStorage.setItem(annotationKey,next);annotationRaw=next;annotationAPI.reportStorageIssue('');return true;
       }catch(_){return false}
      },
      onRollback:()=>{
       // Reconcile a failed volatile attempt write through the existing API.
       // Never bypass the session guard or attempt to write a locked attempt.
       if(!timedAnnotationWrite||!timedUI)return;
       timedAnnotationWrite=false;const s=timedUI.status();
       if(s.phase==='running'&&!s.expired)timedUI.save();
      }
      });
      if(!search.has('timer')){
       try{
        annotationRaw=localStorage.getItem(annotationKey);
        const records=window.LSHReadingAnnotations.decodeLocalSnapshot(annotationRaw);
        annotationReadable=records!==null;
        if(annotationReadable)annotationAPI.restore(records);
        else annotationReadError='Uložené anotace nelze bezpečně načíst. Původní data nebyla přepsána.';
        }catch(_){annotationReadable=false;annotationReadError='Prohlížeč neumožňuje přístup k úložišti anotací. Povolte místní úložiště nebo použijte jiný prohlížeč.';}
        if(!annotationReadable)annotationAPI.reportStorageIssue(annotationReadError);
       window.addEventListener('storage',event=>{
        if((event.key===annotationKey&&event.newValue!==annotationRaw)||(event.key===null&&annotationRaw!==null))
         annotationAPI.reportStorageIssue('Anotace byly změněny v jiné záložce. Vaše poslední změna nemusela zůstat uložena. Před úpravami obnovte stránku.');
       });
      }
    }catch(error){disableAnnotations(error);}
    }else disableAnnotations();
   if(new URLSearchParams(location.search).has('timer')&&!window.LSHSessionUI)
    throw new Error('Timed test engine is unavailable.');
   // RL-02: scope the iPad long-press exception to Reading's annotation tools.
   // Register BEFORE LSHSessionUI.mount() so the shared guard remains immutable.
   // Native menus are suppressed only for actively annotated text / note input;
   // right-click elsewhere, clipboard, leaving the page, etc. remain guarded.
   if(search.has('timer')){
    document.addEventListener('contextmenu',event=>{
     const toolbar=$('readingAnnotationTools');
     if(!annotationAPI||!toolbar?.classList.contains('lsh-anno-enabled')||
        submitted||timedUI?.status().phase!=='running')return;
     const target=typeof event.target?.closest==='function'?
      event.target:event.target?.parentElement;
     if(target?.closest?.('#readingParagraphs [data-annotation-anchor],'+
        '#questionList [data-annotation-anchor],'+
        '#readingAnnotationTools [data-anno-note]')){
      event.preventDefault();
      event.stopImmediatePropagation();
     }
    },true);
   }
   timedUI=window.LSHSessionUI?.mount({
    skill:'reading',topic:selected.topic,lang:selected.lang,level:selected.level,
    workspace:$('workspace'),
    getAnswers:timedAnswers,
    restoreAnswers:saved=>{
     if(!saved||typeof saved!=='object')return;
     for(const q of variant.questions){
      const index=saved.answers?.[q.id];
      if(!Number.isInteger(index)||index<0||index>=q.choices.length)continue;
      const input=[...$('questionList').querySelectorAll('input')].find(el=>
       el.name===q.id&&el.value===String(index));
      if(input){input.checked=true;answers[q.id]=index;}
     }
     if(typeof saved.reflection==='string')$('reflection').value=saved.reflection.slice(0,5000);
     if(annotationAPI)annotationAPI.restore(saved.annotations);
     else retainedTimedAnnotations=Array.isArray(saved.annotations)?saved.annotations:[];
     const records=annotationAPI?.snapshot()||retainedTimedAnnotations;
     updateCapacityWarning(records,currentTimedSnapshot(records));
     updateProgress();
    },
    onSubmit:({automatic,restored})=>submit(automatic,restored)
   })||null;
   if(timedUI){
    // Observe the actual, existing session lock. Do not patch the guard or
    // close a draft on interruption; only invalidate unconfirmed selection.
    let wasInterrupted=false;
    const syncAnnotationLock=()=>{
     const interrupted=timedUI.status().phase==='interrupted';
     if(interrupted&&!wasInterrupted)annotationAPI?.suspend();
     else if(!interrupted&&wasInterrupted&&timedUI.status().phase==='running')annotationAPI?.refresh();
     wasInterrupted=interrupted;
    };
    new MutationObserver(syncAnnotationLock).observe($('workspace'),{attributes:true,attributeFilter:['inert']});
    timedUI.initialize();syncAnnotationLock();
   }
   $('workspace').hidden=timedUI?timedUI.status().phase==='ready':false;
   $('loading').hidden=true;
  }catch(error){
   $('loading').classList.add('error');
   if(error&&(error.code==='invalid-link'||error.code==='corrupted-registry')){
    $('workspace').hidden=true;
    $('loading').textContent=(({"en":{"invalid-link":"This test link is not valid. Please ask your teacher for a new link.","corrupted-registry":"The saved test on this device cannot be read. Please ask your teacher."},"es":{"invalid-link":"Este enlace de la prueba no es válido. Pide a tu profesor un enlace nuevo.","corrupted-registry":"No se puede leer la prueba guardada en este dispositivo. Avisa a tu profesor."},"de":{"invalid-link":"Dieser Testlink ist ungültig. Bitte deine Lehrkraft um einen neuen Link.","corrupted-registry":"Der gespeicherte Test auf diesem Gerät kann nicht gelesen werden. Bitte wende dich an deine Lehrkraft."},"fr":{"invalid-link":"Ce lien de test n’est pas valide. Demande un nouveau lien à ton enseignant.","corrupted-registry":"Le test enregistré sur cet appareil est illisible. Préviens ton enseignant."}})[locale]||({"en":{"invalid-link":"This test link is not valid. Please ask your teacher for a new link.","corrupted-registry":"The saved test on this device cannot be read. Please ask your teacher."},"es":{"invalid-link":"Este enlace de la prueba no es válido. Pide a tu profesor un enlace nuevo.","corrupted-registry":"No se puede leer la prueba guardada en este dispositivo. Avisa a tu profesor."},"de":{"invalid-link":"Dieser Testlink ist ungültig. Bitte deine Lehrkraft um einen neuen Link.","corrupted-registry":"Der gespeicherte Test auf diesem Gerät kann nicht gelesen werden. Bitte wende dich an deine Lehrkraft."},"fr":{"invalid-link":"Ce lien de test n’est pas valide. Demande un nouveau lien à ton enseignant.","corrupted-registry":"Le test enregistré sur cet appareil est illisible. Préviens ton enseignant."}}).en)[error.code];
    $('title').textContent=ui?.error||'Test unavailable';
    return;
   }
   $('loading').textContent=ui.error+' ('+ui.loadingFailed+': '+String(error.message||error)+')';
   $('title').textContent=ui.error;
  }
 }
 start();
})();
