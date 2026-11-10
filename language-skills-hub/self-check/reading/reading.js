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
   security:'This test calculates a proposed grade 1–5 after submission. It is not a secure school exam: answer keys are public, attempts can be restarted, and no results are sent to a teacher. The teacher must verify the result.',
   reading:'READING TEXT',questions:'COMPREHENSION',remaining:'questions left',answered:'answered',
   gap:'This sentence has been removed. Choose the missing sentence in the tasks.',
   mc:'Choose one answer',match:'Match to the paragraph',gapType:'Choose the missing sentence',
   reflection:'Optional reflection · not scored',
   reflectionNote:'The reflection is not marked automatically and does not affect your result.',
   submitNote:'One submission in this page session. Reloading can start over; this is not an enforced one-attempt test.',
   submit:'Submit all answers',confirm:'Submit your answers now?',missing:'questions are unanswered.',
   result:'Self-check finished',resultKicker:'YOUR RESULT',correct:'Correct answers',
   points:'Points',percentage:'Success rate',grade:'No official school grade',
   review:'Review incorrect answers',right:'Correct',wrong:'Incorrect',
   notAnswered:'No answer',your:'Your answer',expected:'Correct answer',because:'Explanation',
   after:'The proposed grade uses exact unrounded percentages and a provisional language scale. It is not a verified school record.',
   reflectionAfter:'The optional open reflection was not assessed automatically.',
   footer:'Public practice content · no login, no uploaded student results, no official school grade.',
   gradeProposal:'Suggested grade (1–5)',gradeWarning:'Unverified local proposal. The teacher must confirm any school grade.',
   loadingFailed:'Loading failed'
  },
  es:{
   mode:'PROPUESTA DE NOTA 1–5 · REVISIÓN DOCENTE',themeLight:'☀ Claro',themeDark:'☾ Oscuro',
   topic:'READING LAB · AUTOEVALUACIÓN LOCAL',loading:'Cargando las actividades originales…',
   error:'No se ha podido cargar la actividad de lectura.',
   lead:'Lee el texto y responde a las preguntas. Las soluciones aparecerán solo después de entregar.',
   security:'Esta actividad calcula una nota propuesta (1–5) tras la entrega. No es un examen escolar seguro: las soluciones son públicas y puedes repetir. Las respuestas no se envían al docente, que debe verificar el resultado.',
   reading:'TEXTO',questions:'COMPRENSIÓN',remaining:'preguntas pendientes',answered:'respondidas',
   gap:'Se ha eliminado una oración. Elige la que falta en las actividades.',
   mc:'Elige una respuesta',match:'Relaciona con el párrafo',gapType:'Elige la oración que falta',
   reflection:'Reflexión opcional · sin puntuación',
   reflectionNote:'La reflexión no se corrige automáticamente ni afecta al resultado.',
   submitNote:'Una entrega en esta sesión. Al recargar la página puedes empezar de nuevo; no es un examen con intentos controlados.',
   submit:'Entregar todas las respuestas',confirm:'¿Quieres entregar tus respuestas?',missing:'preguntas sin responder.',
   result:'Autoevaluación terminada',resultKicker:'TU RESULTADO',correct:'Respuestas correctas',
   points:'Puntos',percentage:'Porcentaje',grade:'Sin calificación oficial',
   review:'Revisa las respuestas incorrectas',right:'Correcto',wrong:'Incorrecto',
   notAnswered:'Sin responder',your:'Tu respuesta',expected:'Respuesta correcta',because:'Explicación',
   after:'La propuesta usa el porcentaje exacto sin redondeo y una escala provisional. No es una calificación escolar verificada.',
   reflectionAfter:'La reflexión abierta opcional no se ha evaluado automáticamente.',
   footer:'Contenido público de práctica · sin registro ni envío de resultados · sin nota oficial.',
   gradeProposal:'Nota propuesta (1–5)',gradeWarning:'Propuesta local sin verificación. El docente debe confirmar la nota escolar.',
   loadingFailed:'Error de carga'
  },
  de:{
   mode:'NOTENVORSCHLAG 1–5 · LEHRKRAFT PRÜFT',themeLight:'☀ Hell',themeDark:'☾ Dunkel',
   topic:'READING LAB · LOKALER SELBSTTEST',loading:'Die ursprünglichen Leseaufgaben werden geladen…',
   error:'Der Lese-Selbsttest konnte nicht geladen werden.',
   lead:'Lies den Text und beantworte die Fragen. Lösungen erscheinen erst nach der Abgabe.',
   security:'Diese Aufgabe zeigt nach der Abgabe einen Notenvorschlag (1–5). Sie ist keine sichere Schulprüfung: Lösungen sind öffentlich, Versuche wiederholbar und Antworten werden nicht gesendet. Lehrkräfte müssen das Ergebnis prüfen.',
   reading:'LESETEXT',questions:'TEXTVERSTÄNDNIS',remaining:'Fragen offen',answered:'beantwortet',
   gap:'Ein Satz wurde entfernt. Wähle in den Aufgaben den passenden Satz aus.',
   mc:'Wähle eine Antwort',match:'Ordne dem Absatz zu',gapType:'Wähle den fehlenden Satz',
   reflection:'Freiwillige Reflexion · ohne Punkte',
   reflectionNote:'Die Reflexion wird nicht automatisch bewertet und beeinflusst dein Ergebnis nicht.',
   submitNote:'Eine Abgabe in dieser Sitzung. Nach dem Neuladen ist ein neuer Versuch möglich; dies ist keine Prüfung mit gesperrten Wiederholungen.',
   submit:'Alle Antworten abgeben',confirm:'Möchtest du deine Antworten jetzt abgeben?',missing:'Fragen sind unbeantwortet.',
   result:'Selbsttest abgeschlossen',resultKicker:'DEIN ERGEBNIS',correct:'Richtige Antworten',
   points:'Punkte',percentage:'Erfolgsquote',grade:'Keine offizielle Schulnote',
   review:'Falsche Antworten überprüfen',right:'Richtig',wrong:'Falsch',
   notAnswered:'Keine Antwort',your:'Deine Antwort',expected:'Richtige Antwort',because:'Erklärung',
   after:'Der Vorschlag basiert auf exakten Prozentwerten ohne Rundung und einer vorläufigen Skala. Er ist keine bestätigte Schulnote.',
   reflectionAfter:'Die freiwillige offene Reflexion wurde nicht automatisch bewertet.',
   footer:'Öffentliche Übungsinhalte · keine Anmeldung, keine Übermittlung der Antworten, keine Schulnote.',
   gradeProposal:'Notenvorschlag (1–5)',gradeWarning:'Unverifizierter Vorschlag. Die Lehrkraft muss jede Schulnote bestätigen.',
   loadingFailed:'Ladefehler'
  },
  fr:{
   mode:'PROPOSITION DE NOTE 1–5 · VALIDATION ENSEIGNANT',themeLight:'☀ Clair',themeDark:'☾ Sombre',
   topic:'READING LAB · AUTOÉVALUATION LOCALE',loading:'Chargement des exercices de lecture d’origine…',
   error:'Impossible de charger cette autoévaluation de lecture.',
   lead:'Lis le texte et réponds aux questions. Les solutions ne s’affichent qu’après l’envoi.',
   security:'Cette activité calcule une proposition de note (1–5) après la remise. Ce n’est pas un examen scolaire sécurisé : les corrigés sont publics et on peut recommencer. Les réponses ne sont pas envoyées à l’enseignant, qui doit vérifier le résultat.',
   reading:'TEXTE À LIRE',questions:'COMPRÉHENSION',remaining:'questions restantes',answered:'répondues',
   gap:'Une phrase a été retirée du texte. Choisis la phrase manquante dans les exercices.',
   mc:'Choisis une réponse',match:'Associe au paragraphe',gapType:'Choisis la phrase manquante',
   reflection:'Réflexion facultative · non notée',
   reflectionNote:'La réflexion n’est pas évaluée automatiquement et ne compte pas dans le résultat.',
   submitNote:'Un seul envoi pour cette session. Recharger la page permet de recommencer : ce n’est pas un examen à tentative unique garantie.',
   submit:'Envoyer toutes les réponses',confirm:'Envoyer tes réponses maintenant ?',missing:'questions sans réponse.',
   result:'Autoévaluation terminée',resultKicker:'TON RÉSULTAT',correct:'Bonnes réponses',
   points:'Points',percentage:'Taux de réussite',grade:'Aucune note scolaire officielle',
   review:'Vérifie tes réponses incorrectes',right:'Correct',wrong:'Incorrect',
   notAnswered:'Sans réponse',your:'Ta réponse',expected:'Bonne réponse',because:'Explication',
   after:'La proposition est calculée sur le pourcentage exact, sans arrondi, à partir d’un barème provisoire. Ce n’est pas une note scolaire vérifiée.',
   reflectionAfter:'La réflexion ouverte facultative n’a pas été évaluée automatiquement.',
   footer:'Exercices publics · sans connexion ni envoi des résultats · aucune note officielle.',
   gradeProposal:'Note proposée (1–5)',gradeWarning:'Proposition locale non vérifiée. L’enseignant doit confirmer la note scolaire.',
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
  en:{button:'Download anonymous CSV result',note:'Local and unverified. This file contains no student name, answers or reflections.',error:'The file could not be downloaded.'},
  es:{button:'Descargar resultado CSV sin datos personales',note:'Resultado local no verificado. El archivo no contiene nombres, respuestas ni reflexiones.',error:'No se pudo descargar el archivo.'},
  de:{button:'Anonymes CSV-Ergebnis herunterladen',note:'Lokales, nicht verifiziertes Ergebnis. Die Datei enthält keine Namen, Antworten oder Reflexionen.',error:'Die Datei konnte nicht heruntergeladen werden.'},
  fr:{button:'Télécharger le résultat CSV anonyme',note:'Résultat local non vérifié. Le fichier ne contient ni nom, ni réponses, ni réflexions.',error:'Le fichier n’a pas pu être téléchargé.'}
 }[locale];
 let variant=null;
 const answers=Object.create(null);
 let submitted=false,timedUI=null,lastReport=null;
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
  $('securityNotice').textContent=ui.security;
  $('loading').textContent=ui.loading;
  $('readingKicker').textContent=ui.reading;
  $('questionKicker').textContent=ui.questions;
  $('questionsHeading').textContent=ui.questions;
  $('reflectionHeading').textContent=ui.reflection;
  $('reflectionNote').textContent=ui.reflectionNote;
  $('submitNote').textContent=ui.submitNote;
  $('submitButton').textContent=ui.submit;
  $('resultHeading').textContent=ui.result;
  $('resultKicker').textContent=ui.resultKicker;
  $('footer').textContent=ui.footer;
  $('exportResult').textContent=exportsCopy.button;
  $('exportStatus').textContent=exportsCopy.note;
 }
 function renderReading(){
  $('readingHeading').textContent=variant.title;
  $('readingVariant').textContent=selected.lang.toUpperCase()+' · '+selected.level;
  $('readingParagraphs').replaceChildren();
  variant.paragraphs.forEach((_,i)=>{
   const p=add('p');
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
 function updateProgress(){
  const count=getAnsweredCount(),total=variant.questions.length;
  $('counter').textContent=count+' / '+total;
  $('remaining').textContent=(total-count)+' '+ui.remaining+' · '+count+' '+ui.answered;
  $('progress').setAttribute('aria-valuenow',String(Math.round(count/total*100)));
  $('progressFill').style.width=(count/total*100)+'%';
 }
 function renderQuestions(){
  const list=$('questionList');list.replaceChildren();
  let number=0;
  for(const tab of variant.tabs){
   const questions=variant.questions.filter(q=>q.tab===tab.id);
   if(!questions.length)continue;
   const stage=add('section','stage');
   stage.appendChild(add('h3',null,tab.title));
   if(tab.description)stage.appendChild(add('p',null,tab.description));
   list.appendChild(stage);
   for(const q of questions){
    number++;
    const card=add('fieldset','question');
    const legend=add('legend',null,number+'. '+q.q);
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
     label.append(radio,add('span',null,choice));
     card.appendChild(label);
    });
    list.appendChild(card);
   }
  }
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
 function renderResult(report){
  $('resultCaution').textContent=ui.after+' '+ui.grade+'.';
  const proposal=gradeCore.proposal(report.points,report.maxPoints);
  $('gradeProposal').replaceChildren();
  $('gradeProposal').append(
   add('span','grade-caption',ui.gradeProposal),
   add('strong','grade-number',String(proposal.grade)),
   add('p','small-note',ui.gradeWarning)
  );
  const normalized=resultsCore.reviewReading(report);
  const tiles=resultsCore.scoreTiles(normalized,{
   points:ui.points,objectivePercent:ui.percentage,
   completion:ui.answered,schoolGrade:ui.grade,noGrade:'—'
  },locale);
  $('scoreSummary').replaceChildren(...tiles.map(tile=>resultValue(tile.value,tile.label)));
  const details=$('resultDetails');details.replaceChildren();
  details.appendChild(add('h3',null,ui.review));
  const mistakes=report.details.filter(item=>!item.correct);
  if(!mistakes.length)details.appendChild(add('p','small-note',{
   en:'All answers are correct. There are no mistakes to review.',
   es:'Todas las respuestas son correctas. No hay errores que revisar.',
   de:'Alle Antworten sind richtig. Es gibt keine Fehler zu überprüfen.',
   fr:'Toutes les réponses sont correctes. Il n’y a aucune erreur à revoir.'
  }[locale]));
  for(const item of mistakes){
   const box=add('article','review '+(item.correct?'correct':'wrong'));
   box.appendChild(add('span','state',item.correct?ui.right:ui.wrong));
   box.appendChild(add('h3',null,item.prompt));
   line(box,ui.your,item.answered?item.selectedAnswer:ui.notAnswered);
   if(!item.correct)line(box,ui.expected,item.correctAnswer);
   if(item.explanation)line(box,ui.because,item.explanation);
   details.appendChild(box);
  }
  $('resultReflection').textContent=ui.reflectionAfter;
  $('exportResult').hidden=!exportCore;
  $('results').hidden=false;
  $('results').focus({preventScroll:true});
  $('results').scrollIntoView({behavior:'smooth',block:'start'});
 }
 function submit(automatic=false,restored=false){
  if(submitted||!variant)return;
  const missing=variant.questions.length-getAnsweredCount();
  const message=ui.confirm+(missing?' '+missing+' '+ui.missing:'');
  if(!automatic&&!window.confirm(message))return;
  const report=core.score(variant,answers);
  if(timedUI&&!restored)timedUI.finish();
  lastReport=report;
  submitted=true;
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
  $('exportResult').addEventListener('click',()=>{
   if(!submitted||!lastReport||!exportCore)return;
   try{
    const state=timedUI?.status();
    exportCore.download(exportCore.reading(lastReport,{
     topic:selected.topic,language:selected.lang,level:selected.level,
     submittedAt:state?.submittedAt??null,
     interruptionCount:state?.incidents?.length??0
    }));
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
   $('title').textContent=variant.title;
   $('lead').textContent=ui.lead;
   renderReading();renderQuestions();
   if(new URLSearchParams(location.search).has('timer')&&!window.LSHSessionUI)
    throw new Error('Timed test engine is unavailable.');
   timedUI=window.LSHSessionUI?.mount({
    skill:'reading',topic:selected.topic,lang:selected.lang,level:selected.level,
    workspace:$('workspace'),
    getAnswers:()=>({answers:{...answers},reflection:$('reflection').value}),
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
     updateProgress();
    },
    onSubmit:({automatic,restored})=>submit(automatic,restored)
   })||null;
   if(timedUI)timedUI.initialize();
   $('workspace').hidden=timedUI?timedUI.status().phase==='ready':false;
   $('loading').hidden=true;
  }catch(error){
   $('loading').classList.add('error');
   $('loading').textContent=ui.error+' ('+ui.loadingFailed+': '+String(error.message||error)+')';
   $('title').textContent=ui.error;
  }
 }
 start();
})();
