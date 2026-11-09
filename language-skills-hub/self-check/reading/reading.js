/* R23 Reading Lab – standalone local self-check, not a protected exam.
 * No analytics, no student identifiers, no student submissions over the network.
 * Existing public practice cards are fetched as inert text; never eval() their JS.
 */
(()=>{
 'use strict';
 const core=window.LSHReadingCore;
 const $=id=>document.getElementById(id);
 const add=(tag,cls,text)=>{
  const e=document.createElement(tag);
  if(cls)e.className=cls;
  if(text!==undefined)e.textContent=text;
  return e;
 };
 const T={
  en:{
   mode:'SELF-CHECK · NOT GRADED',themeLight:'☀ Light',themeDark:'☾ Dark',
   topic:'READING LAB · LOCAL SELF-CHECK',loading:'Loading the original reading questions…',
   error:'The Reading self-check could not be loaded.',
   lead:'Read the text and answer every question. Solutions appear only after you submit.',
   security:'This is a local practice self-check, NOT a secure or graded exam. Answer keys are publicly available in the existing practice cards. Your responses are not sent anywhere.',
   reading:'READING TEXT',questions:'COMPREHENSION',remaining:'questions left',answered:'answered',
   gap:'This sentence has been removed. Choose the missing sentence in the tasks.',
   mc:'Choose one answer',match:'Match to the paragraph',gapType:'Choose the missing sentence',
   reflection:'Optional reflection · not scored',
   reflectionNote:'The reflection is not marked automatically and does not affect your result.',
   submitNote:'One submission in this page session. Reloading can start over; this is not an enforced one-attempt test.',
   submit:'Submit all answers',confirm:'Submit your answers now?',missing:'questions are unanswered.',
   result:'Self-check finished',resultKicker:'YOUR RESULT',correct:'Correct answers',
   points:'Points',percentage:'Success rate',grade:'No official school grade',
   review:'Review your answers',right:'Correct',wrong:'Incorrect',
   notAnswered:'No answer',your:'Your answer',expected:'Correct answer',because:'Explanation',
   after:'The result is local, can be modified and is not verified by the school. No grade was issued.',
   reflectionAfter:'The optional open reflection was not assessed automatically.',
   footer:'Public practice content · no login, no uploaded student results, no official school grade.',
   loadingFailed:'Loading failed'
  },
  es:{
   mode:'AUTOEVALUACIÓN · SIN NOTA',themeLight:'☀ Claro',themeDark:'☾ Oscuro',
   topic:'READING LAB · AUTOEVALUACIÓN LOCAL',loading:'Cargando las actividades originales…',
   error:'No se ha podido cargar la actividad de lectura.',
   lead:'Lee el texto y responde a las preguntas. Las soluciones aparecerán solo después de entregar.',
   security:'Esta es una actividad local de autoevaluación, NO un examen seguro ni calificado. Las soluciones están disponibles en las tarjetas públicas de práctica. Tus respuestas no se envían a ningún servidor.',
   reading:'TEXTO',questions:'COMPRENSIÓN',remaining:'preguntas pendientes',answered:'respondidas',
   gap:'Se ha eliminado una oración. Elige la que falta en las actividades.',
   mc:'Elige una respuesta',match:'Relaciona con el párrafo',gapType:'Elige la oración que falta',
   reflection:'Reflexión opcional · sin puntuación',
   reflectionNote:'La reflexión no se corrige automáticamente ni afecta al resultado.',
   submitNote:'Una entrega en esta sesión. Al recargar la página puedes empezar de nuevo; no es un examen con intentos controlados.',
   submit:'Entregar todas las respuestas',confirm:'¿Quieres entregar tus respuestas?',missing:'preguntas sin responder.',
   result:'Autoevaluación terminada',resultKicker:'TU RESULTADO',correct:'Respuestas correctas',
   points:'Puntos',percentage:'Porcentaje',grade:'Sin calificación oficial',
   review:'Revisa tus respuestas',right:'Correcto',wrong:'Incorrecto',
   notAnswered:'Sin responder',your:'Tu respuesta',expected:'Respuesta correcta',because:'Explicación',
   after:'El resultado es local, se puede modificar y no está verificado por el centro. No se ha asignado ninguna nota.',
   reflectionAfter:'La reflexión abierta opcional no se ha evaluado automáticamente.',
   footer:'Contenido público de práctica · sin registro ni envío de resultados · sin nota oficial.',
   loadingFailed:'Error de carga'
  },
  de:{
   mode:'SELBSTTEST · OHNE NOTE',themeLight:'☀ Hell',themeDark:'☾ Dunkel',
   topic:'READING LAB · LOKALER SELBSTTEST',loading:'Die ursprünglichen Leseaufgaben werden geladen…',
   error:'Der Lese-Selbsttest konnte nicht geladen werden.',
   lead:'Lies den Text und beantworte die Fragen. Lösungen erscheinen erst nach der Abgabe.',
   security:'Dies ist ein lokaler Selbsttest zum Üben, KEINE gesicherte oder benotete Prüfung. Die Lösungen sind in den öffentlichen Übungskarten zugänglich. Deine Antworten werden nicht an einen Server gesendet.',
   reading:'LESETEXT',questions:'TEXTVERSTÄNDNIS',remaining:'Fragen offen',answered:'beantwortet',
   gap:'Ein Satz wurde entfernt. Wähle in den Aufgaben den passenden Satz aus.',
   mc:'Wähle eine Antwort',match:'Ordne dem Absatz zu',gapType:'Wähle den fehlenden Satz',
   reflection:'Freiwillige Reflexion · ohne Punkte',
   reflectionNote:'Die Reflexion wird nicht automatisch bewertet und beeinflusst dein Ergebnis nicht.',
   submitNote:'Eine Abgabe in dieser Sitzung. Nach dem Neuladen ist ein neuer Versuch möglich; dies ist keine Prüfung mit gesperrten Wiederholungen.',
   submit:'Alle Antworten abgeben',confirm:'Möchtest du deine Antworten jetzt abgeben?',missing:'Fragen sind unbeantwortet.',
   result:'Selbsttest abgeschlossen',resultKicker:'DEIN ERGEBNIS',correct:'Richtige Antworten',
   points:'Punkte',percentage:'Erfolgsquote',grade:'Keine offizielle Schulnote',
   review:'Antworten überprüfen',right:'Richtig',wrong:'Falsch',
   notAnswered:'Keine Antwort',your:'Deine Antwort',expected:'Richtige Antwort',because:'Erklärung',
   after:'Das Ergebnis ist lokal, veränderbar und nicht von der Schule überprüft. Es wurde keine Note vergeben.',
   reflectionAfter:'Die freiwillige offene Reflexion wurde nicht automatisch bewertet.',
   footer:'Öffentliche Übungsinhalte · keine Anmeldung, keine Übermittlung der Antworten, keine Schulnote.',
   loadingFailed:'Ladefehler'
  },
  fr:{
   mode:'AUTOÉVALUATION · SANS NOTE',themeLight:'☀ Clair',themeDark:'☾ Sombre',
   topic:'READING LAB · AUTOÉVALUATION LOCALE',loading:'Chargement des exercices de lecture d’origine…',
   error:'Impossible de charger cette autoévaluation de lecture.',
   lead:'Lis le texte et réponds aux questions. Les solutions ne s’affichent qu’après l’envoi.',
   security:'Il s’agit d’une autoévaluation locale, PAS d’un examen sécurisé ou noté. Les corrigés figurent dans les cartes d’entraînement publiques. Tes réponses ne sont transmises à aucun serveur.',
   reading:'TEXTE À LIRE',questions:'COMPRÉHENSION',remaining:'questions restantes',answered:'répondues',
   gap:'Une phrase a été retirée du texte. Choisis la phrase manquante dans les exercices.',
   mc:'Choisis une réponse',match:'Associe au paragraphe',gapType:'Choisis la phrase manquante',
   reflection:'Réflexion facultative · non notée',
   reflectionNote:'La réflexion n’est pas évaluée automatiquement et ne compte pas dans le résultat.',
   submitNote:'Un seul envoi pour cette session. Recharger la page permet de recommencer : ce n’est pas un examen à tentative unique garantie.',
   submit:'Envoyer toutes les réponses',confirm:'Envoyer tes réponses maintenant ?',missing:'questions sans réponse.',
   result:'Autoévaluation terminée',resultKicker:'TON RÉSULTAT',correct:'Bonnes réponses',
   points:'Points',percentage:'Taux de réussite',grade:'Aucune note scolaire officielle',
   review:'Vérifie tes réponses',right:'Correct',wrong:'Incorrect',
   notAnswered:'Sans réponse',your:'Ta réponse',expected:'Bonne réponse',because:'Explication',
   after:'Le résultat est local, modifiable et non vérifié par l’établissement. Aucune note n’a été attribuée.',
   reflectionAfter:'La réflexion ouverte facultative n’a pas été évaluée automatiquement.',
   footer:'Exercices publics · sans connexion ni envoi des résultats · aucune note officielle.',
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
 let variant=null;
 const answers=Object.create(null);
 let submitted=false;
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
  $('scoreSummary').replaceChildren(
   resultValue(report.correct+' / '+report.total,ui.correct),
   resultValue(report.points+' / '+report.maxPoints,ui.points),
   resultValue(new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(report.percentage)+' %',ui.percentage)
  );
  const details=$('resultDetails');details.replaceChildren();
  details.appendChild(add('h3',null,ui.review));
  for(const item of report.details){
   const box=add('article','review '+(item.correct?'correct':'wrong'));
   box.appendChild(add('span','state',item.correct?ui.right:ui.wrong));
   box.appendChild(add('h3',null,item.prompt));
   line(box,ui.your,item.answered?item.selectedAnswer:ui.notAnswered);
   if(!item.correct)line(box,ui.expected,item.correctAnswer);
   if(item.explanation)line(box,ui.because,item.explanation);
   details.appendChild(box);
  }
  $('resultReflection').textContent=ui.reflectionAfter;
  $('results').hidden=false;
  $('results').focus({preventScroll:true});
  $('results').scrollIntoView({behavior:'smooth',block:'start'});
 }
 function submit(){
  if(submitted||!variant)return;
  const missing=variant.questions.length-getAnsweredCount();
  const message=ui.confirm+(missing?' '+missing+' '+ui.missing:'');
  if(!window.confirm(message))return;
  const report=core.score(variant,answers);
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
  $('submitButton').addEventListener('click',submit);
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
   $('workspace').hidden=false;
   $('loading').hidden=true;
  }catch(error){
   $('loading').classList.add('error');
   $('loading').textContent=ui.error+' ('+ui.loadingFailed+': '+String(error.message||error)+')';
   $('title').textContent=ui.error;
  }
 }
 start();
})();
