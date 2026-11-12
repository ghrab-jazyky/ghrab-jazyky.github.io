/* LSH R54: a read-only, localized guide to Reading Lab practice strategies.
 * Cambridge-inspired pedagogical guidance, not official exam parts.
 * Does not touch questions, answers, progress, scoring or storage. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else{
  root.LSH_READING_SKILL_GUIDES=api;
  if(root.document){
   if(root.document.readyState==='loading')
    root.document.addEventListener('DOMContentLoaded',()=>api.mount(root.document),{once:true});
   else api.mount(root.document);
  }
 }
})(typeof window!=='undefined'?window:this,function(){
 'use strict';
 const COPY={
  en:{
   labels:{kicker:'CAMBRIDGE-STYLE READING STRATEGY',what:'What it means',how:'How to use it in a test',practice:'Now practise this skill with the three questions below.'},
   skills:{
    gist:{what:'Read quickly to understand the main idea and purpose of a text. You do not need every detail.',how:'Look at the title, opening lines and repeated ideas. Choose the answer about the whole text, not just one sentence.'},
    scan:{what:'Search a text quickly for a specific fact, such as a name, date, number or place. You do not need to read every word.',how:'Read the question first. Look for keywords or similar words, then read the relevant sentence carefully to confirm the answer.'},
    detail:{what:'Read a part of a text carefully to understand exactly what it says, including reasons, conditions and contrasts.',how:'Find the relevant lines and compare each answer with the text. Watch out for small but important differences.'},
    structure:{what:'Understand how sentences and paragraphs connect through pronouns, linking words and the order of ideas.',how:'For a missing-sentence task, read before and after the gap. Check references, contrast and the logical flow.'},
    inference:{what:'Understand an idea that the writer suggests without saying it directly.',how:'Use clues from the text to support your conclusion. Do not add assumptions that the writer has not supported.'},
    matching:{what:'Find the paragraph, person or short text that expresses a particular idea, even in different words.',how:'Scan for the meaning of the statement and its paraphrases. Check the whole relevant passage before matching.'},
    vocab:{what:'Work out what a word or phrase means from the sentences around it.',how:'Look for examples, contrasts and context clues. Try the possible meanings in the original sentence.'},
    tone:{what:'Recognise the writer’s attitude, tone or purpose, such as warning, explaining or persuading.',how:'Notice opinion words, emphasis, humour or caution. Ask why the writer chose this language.'},
    critical:{what:'Evaluate claims and evidence, and notice what the text does not prove.',how:'Separate facts from interpretation. Check the quality of evidence, limitations and hidden assumptions.'}
   }
  },
  es:{
   labels:{kicker:'ESTRATEGIA DE COMPRENSIÓN LECTORA',what:'¿En qué consiste?',how:'¿Cómo usarla en un examen?',practice:'Ahora practica esta destreza con las tres preguntas de abajo.'},
   skills:{
    gist:{what:'Lee rápidamente para comprender el tema y la idea principal del texto. No necesitas entender cada detalle.',how:'Mira el título, el inicio y las ideas que se repiten. Elige la respuesta sobre el texto completo.'},
    scan:{what:'Busca rápidamente un dato concreto, como un nombre, una fecha, un número o un lugar.',how:'Lee primero la pregunta. Busca palabras clave o sinónimos y comprueba la frase donde aparece el dato.'},
    detail:{what:'Lee con atención una parte del texto para entender hechos, causas, condiciones y diferencias.',how:'Encuentra el fragmento adecuado y compara cada respuesta con lo que dice realmente el texto.'},
    structure:{what:'Reconoce cómo se unen las frases y los párrafos mediante conectores, pronombres e ideas.',how:'Si falta una frase, lee antes y después del hueco. Comprueba las referencias y el orden lógico.'},
    inference:{what:'Deduce una idea que el autor sugiere, pero no expresa directamente.',how:'Apoya tu conclusión con pistas del texto. Evita suposiciones sin pruebas.'},
    matching:{what:'Relaciona una afirmación con el párrafo, la persona o el texto que expresa esa idea.',how:'Busca el mismo significado, aunque se usen otras palabras. Lee el fragmento completo antes de elegir.'},
    vocab:{what:'Descubre el sentido de una palabra o expresión gracias al contexto.',how:'Fíjate en ejemplos, contrastes y frases cercanas. Comprueba qué significado encaja.'},
    tone:{what:'Identifica la actitud, el tono o la intención del autor, por ejemplo informar, advertir o convencer.',how:'Observa las opiniones, las palabras de énfasis y el humor. Piensa por qué escribe así.'},
    critical:{what:'Valora las afirmaciones y las pruebas, y reconoce lo que el texto no demuestra.',how:'Distingue hechos e interpretaciones. Busca límites, suposiciones y pruebas insuficientes.'}
   }
  },
  de:{
   labels:{kicker:'LESESTRATEGIE',what:'Was bedeutet das?',how:'Wie hilft die Strategie in einer Prüfung?',practice:'Übe diese Strategie jetzt mit den drei Aufgaben unten.'},
   skills:{
    gist:{what:'Lies den Text zügig, um das Thema und die Hauptaussage zu verstehen. Du musst nicht jedes Detail kennen.',how:'Achte auf die Überschrift, den Anfang und wiederkehrende Ideen. Wähle eine Antwort zum ganzen Text.'},
    scan:{what:'Suche schnell nach einer bestimmten Information, zum Beispiel einem Namen, Datum, einer Zahl oder einem Ort.',how:'Lies zuerst die Frage. Suche nach Schlüsselwörtern oder ähnlichen Ausdrücken und prüfe den passenden Satz.'},
    detail:{what:'Lies einen Textabschnitt genau, um Fakten, Gründe, Bedingungen und Gegensätze zu verstehen.',how:'Finde die passende Stelle und vergleiche jede Antwort sorgfältig mit dem Wortlaut.'},
    structure:{what:'Erkenne, wie Sätze und Absätze durch Pronomen, Bindewörter und Gedanken zusammenhängen.',how:'Lies bei einer Satzlücke davor und danach. Prüfe Bezüge, Gegensätze und die logische Reihenfolge.'},
    inference:{what:'Erschließe eine Aussage, die der Autor andeutet, aber nicht direkt schreibt.',how:'Suche Hinweise im Text. Wähle nur Schlussfolgerungen, die sich damit begründen lassen.'},
    matching:{what:'Ordne Aussagen dem passenden Absatz, einer Person oder einem kurzen Text zu.',how:'Suche nach derselben Bedeutung, auch wenn andere Wörter verwendet werden. Prüfe den ganzen Abschnitt.'},
    vocab:{what:'Erschließe die Bedeutung eines Wortes oder Ausdrucks aus dem Zusammenhang.',how:'Achte auf Beispiele, Gegensätze und benachbarte Sätze. Prüfe, welche Bedeutung passt.'},
    tone:{what:'Erkenne die Haltung, den Ton oder die Absicht des Autors, etwa warnen, erklären oder überzeugen.',how:'Achte auf Wertungen, Betonungen, Humor und vorsichtige Formulierungen.'},
    critical:{what:'Bewerte Aussagen und Belege und erkenne, was der Text nicht beweist.',how:'Trenne Fakten von Deutungen. Prüfe Belege, Grenzen und unausgesprochene Annahmen.'}
   }
  },
  fr:{
   labels:{kicker:'STRATÉGIE DE LECTURE',what:'Qu’est-ce que c’est ?',how:'Comment l’utiliser à l’examen ?',practice:'Entraîne-toi maintenant avec les trois questions ci-dessous.'},
   skills:{
    gist:{what:'Lis rapidement pour comprendre le sujet et l’idée principale du texte. Tu n’as pas besoin de tous les détails.',how:'Regarde le titre, le début et les idées répétées. Choisis une réponse qui concerne le texte entier.'},
    scan:{what:'Cherche vite une information précise, comme un nom, une date, un nombre ou un lieu.',how:'Lis d’abord la question. Repère les mots-clés ou des synonymes, puis vérifie la phrase correspondante.'},
    detail:{what:'Lis attentivement un passage pour comprendre les faits, les causes, les conditions et les oppositions.',how:'Trouve la partie utile et compare chaque réponse avec ce que dit exactement le texte.'},
    structure:{what:'Comprends les liens entre les phrases et les paragraphes grâce aux pronoms, aux connecteurs et aux idées.',how:'Pour une phrase manquante, lis avant et après le trou. Vérifie les références et la logique.'},
    inference:{what:'Déduis une idée que l’auteur suggère sans l’exprimer directement.',how:'Trouve des indices dans le texte. Évite les conclusions qui ne reposent sur aucune preuve.'},
    matching:{what:'Associe une affirmation au paragraphe, à la personne ou au texte qui exprime la même idée.',how:'Cherche le sens, même si les mots changent. Relis le passage entier avant de choisir.'},
    vocab:{what:'Devine le sens d’un mot ou d’une expression à partir de son contexte.',how:'Observe les exemples, les contrastes et les phrases voisines. Vérifie le sens qui convient.'},
    tone:{what:'Identifie l’attitude, le ton ou le but de l’auteur : informer, avertir ou convaincre, par exemple.',how:'Observe les opinions, les mots insistants, l’humour et les nuances.'},
    critical:{what:'Évalue les affirmations et les preuves, et remarque ce que le texte ne démontre pas.',how:'Sépare les faits des interprétations. Cherche les limites, les preuves faibles et les suppositions.'}
   }
  }
 };
 const skillIds=Object.freeze(['gist','scan','detail','structure','inference','matching','vocab','tone','critical']);
 const languages=Object.freeze(['en','es','de','fr']);
 const guideFor=(language,skill)=>{
  const pack=COPY[language],skillData=pack&&pack.skills[skill];
  return pack&&skillData?{labels:pack.labels,what:skillData.what,how:skillData.how}:null;
 };
 function node(doc,tag,className,text){
  const element=doc.createElement(tag);
  if(className)element.className=className;
  if(text!==undefined)element.textContent=text;
  return element;
 }
 function render(doc){
  const tabs=doc.getElementById('skillTabs'),intro=doc.querySelector('.skill-intro');
  const original=doc.getElementById('tabDescription');
  const current=tabs&&tabs.querySelector('button[data-skill][aria-selected="true"]');
  if(!tabs||!intro||!original||!current)return false;
  const lang=doc.getElementById('language')?.value||doc.documentElement.lang||'en';
  const guide=guideFor(lang,current.dataset.skill);
  let panel=doc.getElementById('lshReadingSkillGuide');
  if(!guide){
   intro.classList.remove('lsh-reading-guided');
   original.hidden=false;
   if(panel)panel.remove();
   return false;
  }
  const tag=lang+':'+current.dataset.skill;
  if(panel&&panel.dataset.variant===tag&&panel.isConnected)return true;
  if(!panel){panel=node(doc,'section','lsh-reading-skill-guide');panel.id='lshReadingSkillGuide';panel.setAttribute('aria-label','Reading strategy guidance');}
  panel.dataset.variant=tag;
  const eyebrow=node(doc,'span','lsh-reading-guide-eyebrow',guide.labels.kicker);
  const grid=node(doc,'div','lsh-reading-guide-grid');
  for(const [label,text] of [[guide.labels.what,guide.what],[guide.labels.how,guide.how]]){
   const item=node(doc,'div','lsh-reading-guide-item');
   item.append(node(doc,'span','lsh-reading-guide-label',label),node(doc,'p','lsh-reading-guide-text',text));
   grid.append(item);
  }
  const practice=node(doc,'p','lsh-reading-guide-practice',guide.labels.practice);
  panel.replaceChildren(eyebrow,grid,practice);
  intro.classList.add('lsh-reading-guided');
  original.hidden=true; // Existing one-line description remains a no-script fallback.
  intro.append(panel);
  return true;
 }
 function mount(doc){
  const nav=doc.getElementById('skillTabs');
  if(!nav||!doc.querySelector('.skill-intro')||doc.getElementById('lshReadingSkillGuideStyles'))return false;
  const css=node(doc,'link');css.id='lshReadingSkillGuideStyles';css.rel='stylesheet';
  css.href='../../assets/lsh/v3/reading-skill-guides.css';doc.head.append(css);
  const observer=new MutationObserver(()=>render(doc));
  observer.observe(nav,{childList:true}); // The card replaces its tabs after each level/language change.
  render(doc);
  return true;
 }
 return Object.freeze({COPY,skillIds,languages,guideFor,render,mount});
});
