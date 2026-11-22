/* City Quest F2.1D — manually authored metro languages and CEFR pedagogy.
 * Proper nouns on Riverton's fictional signage deliberately stay in English.
 * All practice material is embedded; no translation services, login or requests.
 */
(function(root,factory){
 "use strict";
 const api=factory();
 if(root)root.RivertonMetroLanguage=api;
 if(typeof module==="object"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const levels=["B1","B2","C1","C2"],languages=["en","es","de","fr"],missions=[5,6,7,8];
 const content={
  en:{
   native:"English",pilot:"Play interactive metro missions",back:"Return to classic city missions",
   title:"Riverton City + Metro Quest",header:"Above and below Riverton: four city missions and four metro challenges.",
   kicker:"RIVERTON METRO · ACTIVE MISSION",overview:"Choose a line, direction and platform; travel stop by stop. Complete speaking self-checks without recording.",
   offline:"Offline · Speaking self-assessed",training:"Metro language training",pilotTag:"MULTILINGUAL METRO",enterTitle:"City navigation",metroTitle:"Metro navigation",
   labels:{model:"Show sample answer",glossary:"Useful expressions & vocabulary",criteria:"Speaking self-check · focus points",
    support:"Support",stretch:"Extra challenge",restart:"Restart this metro mission",next:"Continue to the next station",
    noLine:"no line selected",position:"Current metro position",step:"Step",platform:"Platform",platformBoard:"Departure board · read the signs",towards:"Towards",noService:"No departure listed",level:"Language level",
    checkpoint:"Speaking checkpoints confirmed",prompt:"Practise the route aloud, then confirm your self-check.",
    scenePlatform:"Platform view",sceneTrain:"On-board experience",concourse:"Station concourse",
    choice:"Only the buttons in the mission panel advance the journey.",preview:"Metro visual preview",
    verified:"Route verified locally. Spoken language was self-assessed, not recorded or automatically graded.",
    complete:"Destination reached",boarded:"Train boarded",line:"Line"},
   actions:{ENTER:"Enter the metro",READ_NOTICE:"Read service notice",BOARD:"Board the train",NEXT_STOP:"Travel to next stop",
    CHANGE_LINE:"Follow transfer signs",STAY_ON_LINE:"Stay on this line",EXIT:"Exit at destination",CONTINUE_PAST_EXIT:"Continue on the train",SELF_CHECK:"✓ I have practised aloud · continue"},
   titles:{5:"Find the Right Line",6:"Change Lines",7:"Metro Disruption",8:"City + Metro Quest"},
   goals:{5:"Find a metro route from Central Station to Museum Quarter. Use the network map to choose a line, direction and platform.",
    6:"Get from Market Square to Stadium by metro. Work out where to change trains and which direction to take.",
    7:"The M1 section between Old Town and Museum Quarter is closed. Get from Central Station to Museum Quarter without using that section.",
    8:"Walk to Market Square and collect a colleague waiting at University metro station before visiting City Museum together. The direct M1 service from Central Station does not stop at University. Choose and justify a route that meets both obligations."},
   pair:{5:"Navigator: explain the line, terminus and platform without pointing. Traveller: check the signs and repeat the instructions.",
    6:"Traveller: ask how to reach Stadium. Navigator: use the network to work out the transfer and explain it. Exchange roles.",
    7:"Dispatcher: announce the closure. Navigator: recommend an alternative and justify the decision.",
    8:"Traveller and Navigator: take turns explaining the walk, transfer and final approach to City Museum."},
   phases:{"walk-to-entrance":"Walk from Central Station to Market Square. Use the city compass or adjacent crossroads.",
    enter:"You are at Market Square. Enter the metro.",
    notice:"Read the service disruption notice: the M1 segment from Old Town to Museum Quarter is closed.",
    "select-line":"Study the metro map. Which line is appropriate from {station}?",
    "select-direction":"Choose the train's destination terminus, not simply the next station.",
    "select-platform":"Match the correct line and terminus to the platform sign.",
    board:"Your line, terminus and platform are selected. Board the train.",
    ride:"Travel exactly one stop at a time and track your location.",
    transfer:"You are at an interchange. Follow the signs to the connecting line.",
    exit:"You have reached the correct metro destination. Leave the train.",
    "walk-to-museum":"Leave Museum Quarter. Walk one city block north to City Museum.",
    checkpoint:"Explain this leg of your journey aloud before continuing.",
    meetUniversity:"You have reached University. Meet your colleague before changing to M3. Explain why the direct M1 from Central Station would not meet this requirement.",
    speech:"Explain the entire route aloud and complete a speaking self-check."},
   hints:{walk:"Move exactly one adjacent street block using the map, compass or keyboard.",
    map:"The animated network and platform reflect your choices. No future steps are revealed."},
   success:{UNDO_WALK:"The previous walking step was undone.",WALK:"One city block completed.",
    ENTER:"You entered Market Square metro station. Choose a line.",READ_NOTICE:"The M1 closure is acknowledged. Find another connection.",
    SELECT_LINE:"Correct line. Now choose the train's direction.",SELECT_DIRECTION:"Correct terminus. Find the platform.",
    SELECT_PLATFORM:"Correct platform. You can board.",BOARD:"Train boarded. Advance one stop at a time.",
    NEXT_STOP:"Next stop: {station}.",CHANGE_LINE:"Transfer signs followed. Select the connecting line.",
    EXIT:"You have exited at the destination.",SELF_CHECK:"Speaking self-check confirmed."},
   errors:{completed:"This mission has already been completed.",undoPhase:"Undo is available only while walking in the city.",
    undoStart:"There is no previous walking step to undo.",walkPhase:"City walking is not available now.",
    nonadjacent:"Move exactly one adjacent block; you cannot jump across the map.",longRoute:"This route is too long. Restart and try a shorter one.",
    entrance:"Reach the Market Square entrance before entering the metro.",notice:"Read a notice only at the designated stage.",
    linePhase:"Choose a line on the station concourse.",wrongLine:"That line does not take you along the required route. Read the network connections.",
    directionPhase:"Choose the metro line first.",wrongDirection:"That train travels in the opposite direction. Check the terminus.",
    platformPhase:"Choose the line and direction before the platform.",wrongPlatform:"Incorrect platform. Read the line and terminus on the station signs.",
    boardPhase:"Verify the line, direction and platform before boarding.",boardMismatch:"Departure details do not match this route.",
    ridePhase:"Board the correct train before travelling.",blocked:"The next segment is closed or not connected.",
    transferPhase:"You can change only at a valid interchange.",transferInvalid:"There is no connecting line at this location.",stayOnLine:"This line will not reach your destination. Check the interchange map.",wrongTransfer:"This is not the connecting line. Check the transfer signs.",continuePastExit:"Your destination is here. Continuing would take you past the exit.",
    exit:"Exit only at the designated destination.",speech:"Finish the route leg before the oral checkpoint.",invalid:"That action is not available in this state."},
   models:{5:"Take M1 at Central Station, towards East Gardens, from platform 2. Get off at Museum Quarter.",
    6:"At Market Square, take M2 towards North Park from platform 1. Change at University to M3 towards Harbour from platform 3 and get off at Stadium.",
    7:"Because the M1 link between Old Town and Museum Quarter is closed, take M2 towards North Park from platform 3, change at University to M3 towards Harbour from platform 3, and get off at Museum Quarter.",
    8:"Although M1 runs directly from Central Station to Museum Quarter, it would miss our required meeting at University. Walk from Central Station to Market Square. Take M2 towards North Park from platform 1 and meet the colleague at University. Then change to M3 towards Harbour from platform 3, get off at Museum Quarter, and walk north to City Museum together."},
   glossary:[["terminus","the final station shown as a train's direction"],["platform","where passengers wait to board"],["interchange","station where two lines connect"],["disruption","service problem affecting a route"],["diversion","alternative way around a closure"],["exit","way back to street level"]],
   levels:{
    B1:{focus:"Give a clear, sequential set of directions.",task:"Use short, accurate directions: line, terminus, platform, transfer and exit.",
      criteria:["I named the correct line and direction.","I explained the sequence in order.","My partner could follow my instructions."],
      support:"Start with: First…, then…, change at…, finally…",stretch:"Give the instructions once without looking at the model.",
      extension:"Keep the order clear and check that your partner understands."},
    B2:{focus:"Explain and compare plausible route choices.",task:"Justify the route with at least one reason; compare it with a less suitable option.",
      criteria:["I justified a route choice.","I explained a transfer or disruption clearly.","I compared at least two possibilities."],
      support:"Use: I would recommend… because…; compared with…",stretch:"Discuss which route you would recommend during a delay.",
      extension:"Compared with the other connection, this route avoids an unnecessary change and is easier to follow."},
    C1:{focus:"Negotiate constraints and reformulate complex instructions.",task:"Give precise advice, anticipate a misunderstanding and explain a contingency.",
      criteria:["I clarified a possible misunderstanding.","I explained a constraint and its consequence.","My instructions were precise and well structured."],
      support:"Use: Provided that…, in the event of…, to avoid confusion…",stretch:"Explain the option to a traveller with limited mobility.",
      extension:"Provided that the connection is operating normally, the recommended route is straightforward; if it is disrupted, revise the transfer plan."},
    C2:{focus:"Produce nuanced, concise wayfinding advice with register control.",task:"Evaluate the route critically, address trade-offs and adapt your register to the traveller.",
      criteria:["I evaluated a meaningful trade-off.","I used concise, unambiguous language.","I adapted tone and detail to the traveller's needs."],
      support:"Use: On balance…, notwithstanding…, the most robust option…",stretch:"Give both a formal announcement and a reassuring informal explanation.",
      extension:"On balance, the most robust route minimises uncertainty at interchanges; should conditions deteriorate, the alternative can be explained without ambiguity."}
   }
  },
  es:{
   native:"Español",pilot:"Jugar las misiones del metro",back:"Volver a las misiones clásicas",
   title:"Riverton: ciudad y metro",header:"Explora Riverton a pie y bajo tierra: cuatro misiones urbanas y cuatro desafíos en metro.",
   kicker:"METRO DE RIVERTON · MISIÓN ACTIVA",overview:"Elige línea, sentido y andén; avanza parada a parada. La expresión oral se autoevalúa sin grabaciones.",
   offline:"Sin conexión · Autoevaluación oral",training:"Práctica comunicativa en el metro",pilotTag:"METRO MULTILINGÜE",enterTitle:"Orientación urbana",metroTitle:"Orientación en el metro",
   labels:{model:"Mostrar respuesta modelo",glossary:"Expresiones útiles y vocabulario",criteria:"Autoevaluación oral · objetivos",
    support:"Ayuda",stretch:"Reto adicional",restart:"Reiniciar esta misión de metro",next:"Siguiente misión",
    noLine:"ninguna línea seleccionada",position:"Ubicación actual",step:"Paso",platform:"Andén",platformBoard:"Panel de salidas · lee los carteles",towards:"Dirección",noService:"Sin salida anunciada",level:"Nivel",
    checkpoint:"Puntos orales confirmados",prompt:"Explica el recorrido en voz alta y confirma tu autoevaluación.",
    scenePlatform:"Vista del andén",sceneTrain:"Dentro del tren",concourse:"Vestíbulo de la estación",
    choice:"Solo los controles de la misión hacen avanzar el recorrido.",preview:"Vista previa del metro",
    verified:"Recorrido comprobado localmente. La expresión oral se autoevaluó; no se grabó ni calificó automáticamente.",
    complete:"Destino alcanzado",boarded:"Has subido al tren",line:"Línea"},
   actions:{ENTER:"Entrar en el metro",READ_NOTICE:"Leer el aviso de servicio",BOARD:"Subir al tren",NEXT_STOP:"Avanzar a la siguiente estación",
    CHANGE_LINE:"Seguir las señales de transbordo",STAY_ON_LINE:"Seguir en esta línea",EXIT:"Salir en el destino",CONTINUE_PAST_EXIT:"Continuar en el tren",SELF_CHECK:"✓ He practicado en voz alta · continuar"},
   titles:{5:"Encuentra la línea correcta",6:"Haz un transbordo",7:"Incidencia en el metro",8:"A pie y en metro"},
   goals:{5:"Encuentra un trayecto en metro de Central Station a Museum Quarter. Usa el plano para elegir la línea, el sentido y el andén.",
    6:"Ve de Market Square a Stadium en metro. Averigua dónde hacer transbordo y qué dirección tomar.",
    7:"Está cortado el tramo de la M1 entre Old Town y Museum Quarter. Llega de Central Station a Museum Quarter sin pasar por el tramo cerrado.",
    8:"Camina hasta Market Square y recoge a una compañera que te espera en la estación de metro University antes de visitar juntos City Museum. La M1 directa desde Central Station no pasa por University. Elige y justifica una ruta que permita cumplir ambos objetivos."},
   pair:{5:"Guía: explica la línea, el destino final y el andén sin señalar. Viajero: comprueba los carteles y repite las instrucciones.",
    6:"Viajero: pregunta cómo llegar a Stadium. Guía: consulta el plano, deduce el transbordo y explícalo. Intercambiad los papeles.",
    7:"Personal de estación: anuncia la incidencia. Guía: recomienda una ruta alternativa y justifica su elección.",
    8:"Viajero y guía: alternad las explicaciones del recorrido a pie, el transbordo y la llegada al museo."},
   phases:{"walk-to-entrance":"Camina de Central Station a Market Square. Usa la brújula o los cruces adyacentes.",
    enter:"Ya estás en Market Square. Entra en el metro.",
    notice:"Lee el aviso: el tramo de la M1 entre Old Town y Museum Quarter está cerrado.",
    "select-line":"Observa el plano. ¿Qué línea debes tomar desde {station}?",
    "select-direction":"Elige la estación terminal indicada en el tren, no la siguiente parada.",
    "select-platform":"Relaciona la línea y el destino con el andén indicado.",
    board:"Has elegido línea, destino y andén. Sube al tren.",
    ride:"Avanza una sola parada cada vez y comprueba dónde estás.",
    transfer:"Has llegado a una estación de correspondencia. Sigue las señales para cambiar de línea.",
    exit:"Has llegado a la estación de destino. Sal del tren.",
    "walk-to-museum":"Sal en Museum Quarter. Camina una manzana hacia el norte hasta City Museum.",
    checkpoint:"Explica esta parte del trayecto en voz alta antes de continuar.",
    meetUniversity:"Has llegado a University. Reúnete con tu compañera antes de cambiar a la M3. Explica por qué la M1 directa desde Central Station no serviría para recogerla.",
    speech:"Explica el recorrido completo en voz alta y autoevalúa tu respuesta."},
   hints:{walk:"Avanza de un cruce al siguiente, sin saltar manzanas.",map:"El plano y la escena reflejan tus decisiones, sin mostrarte la ruta futura."},
   success:{UNDO_WALK:"Has deshecho el último paso a pie.",WALK:"Has avanzado una manzana.",ENTER:"Has entrado en Market Square. Elige una línea.",
    READ_NOTICE:"Aviso leído: busca una alternativa al corte de la M1.",SELECT_LINE:"Línea correcta. Elige ahora el sentido.",
    SELECT_DIRECTION:"Destino final correcto. Busca el andén.",SELECT_PLATFORM:"Andén correcto. Puedes subir.",
    BOARD:"Has subido al tren. Avanza parada a parada.",NEXT_STOP:"Siguiente estación: {station}.",
    CHANGE_LINE:"Has seguido las señales. Elige la línea de enlace.",EXIT:"Has salido en el destino.",
    SELF_CHECK:"Autoevaluación oral confirmada."},
   errors:{completed:"Esta misión ya está completada.",undoPhase:"Solo puedes retroceder mientras caminas por la ciudad.",
    undoStart:"No hay ningún paso anterior.",walkPhase:"Ahora no puedes caminar por la ciudad.",
    nonadjacent:"Avanza solo una manzana: no puedes saltar cruces.",longRoute:"Recorrido demasiado largo. Reinicia e intenta uno más corto.",
    entrance:"Primero llega a la entrada del metro en Market Square.",notice:"Lee el aviso en la fase indicada.",
    linePhase:"Elige una línea en el vestíbulo.",wrongLine:"Esa línea no sirve para este tramo. Revisa el plano.",
    directionPhase:"Primero elige la línea.",wrongDirection:"Ese tren va en sentido contrario. Comprueba la estación terminal.",
    platformPhase:"Elige línea y sentido antes del andén.",wrongPlatform:"Andén incorrecto. Lee los carteles.",
    boardPhase:"Comprueba línea, sentido y andén antes de subir.",boardMismatch:"Los datos de salida no coinciden con la ruta.",
    ridePhase:"Sube al tren correcto antes de avanzar.",blocked:"El siguiente tramo está cerrado o no está conectado.",
    transferPhase:"Solo puedes cambiar de línea en una estación de correspondencia.",transferInvalid:"Aquí no existe ese enlace.",stayOnLine:"Esta línea no llega a tu destino. Comprueba el plano de transbordos.",wrongTransfer:"Esta no es la línea de enlace. Comprueba los carteles de transbordo.",continuePastExit:"Ya has llegado a tu destino. Si continúas, te pasarás de parada.",
    exit:"Sal únicamente en la estación de destino.",speech:"Termina este tramo antes de la actividad oral.",invalid:"Esta acción no está disponible ahora."},
   models:{5:"Toma la línea M1 en Central Station, en dirección East Gardens, desde el andén 2. Baja en Museum Quarter.",
    6:"En Market Square, toma la M2 hacia North Park desde el andén 1. Cambia en University a la M3 hacia Harbour desde el andén 3 y baja en Stadium.",
    7:"Como el tramo de la M1 entre Old Town y Museum Quarter está cerrado, toma la M2 hacia North Park desde el andén 3, cambia en University a la M3 hacia Harbour desde el andén 3 y baja en Museum Quarter.",
    8:"Aunque la M1 conecta directamente Central Station con Museum Quarter, no permite recoger a la compañera en University. Camina desde Central Station hasta Market Square. Toma la M2 hacia North Park desde el andén 1, reúnete con ella en University y cambia a la M3 hacia Harbour desde el andén 3. Baja en Museum Quarter y camina hacia el norte hasta City Museum."},
   glossary:[["cabecera","estación final que indica el sentido del tren"],["andén","zona donde se espera para subir al tren"],["transbordo","cambio de una línea a otra"],["incidencia","problema que afecta al servicio"],["desvío","trayecto alternativo ante un corte"],["salida","acceso de la estación a la calle"]],
   levels:{
    B1:{focus:"Dar indicaciones claras y ordenadas.",task:"Explica la línea, el destino final, el andén y los transbordos con frases sencillas.",
      criteria:["He nombrado la línea y el sentido correctos.","He explicado los pasos en orden.","Mi compañero ha entendido las indicaciones."],
      support:"Empieza con: Primero…, después…, cambia en…, por último…",stretch:"Repite las indicaciones sin consultar el ejemplo.",
      extension:"Mantén el orden e invita a tu compañero a confirmar la información."},
    B2:{focus:"Comparar opciones y justificar una ruta.",task:"Justifica la elección con una razón y compárala con otra ruta menos adecuada.",
      criteria:["He justificado la ruta elegida.","He explicado claramente el transbordo o la incidencia.","He comparado dos alternativas."],
      support:"Utiliza: Recomendaría… porque…; en comparación con…",stretch:"Debate qué ruta recomendarías si hubiera retrasos.",
      extension:"En comparación con la otra combinación, esta ruta evita un transbordo innecesario y resulta más fácil de seguir."},
    C1:{focus:"Explicar limitaciones y reformular instrucciones complejas.",task:"Anticipa un malentendido y ofrece una alternativa si cambia la situación.",
      criteria:["He aclarado un posible malentendido.","He explicado una limitación y sus consecuencias.","He usado instrucciones precisas y estructuradas."],
      support:"Utiliza: Siempre que…, en caso de que…, para evitar confusiones…",stretch:"Adapta las instrucciones a alguien con movilidad reducida.",
      extension:"Siempre que el enlace funcione con normalidad, esta ruta es sencilla; si se interrumpe, habrá que revisar el transbordo."},
    C2:{focus:"Ofrecer recomendaciones matizadas con registro adecuado.",task:"Valora ventajas e inconvenientes y adapta la información al interlocutor con precisión.",
      criteria:["He evaluado ventajas e inconvenientes reales.","He evitado ambigüedades innecesarias.","He adaptado el tono al viajero."],
      support:"Utiliza: En conjunto…, no obstante…, la opción más fiable…",stretch:"Formula un anuncio formal y una explicación cercana para un turista.",
      extension:"En conjunto, conviene priorizar una conexión fiable frente al ahorro marginal de tiempo; ante una nueva incidencia, podemos precisar la alternativa sin generar confusión."}
   }
  },
  de:{
   native:"Deutsch",pilot:"Interaktive Metro-Missionen spielen",back:"Zurück zu den klassischen Stadtmissionen",
   title:"Riverton: Stadt und Metro",header:"Entdecke Riverton zu Fuß und mit der Metro: vier Stadt- und vier Metro-Missionen.",
   kicker:"RIVERTON METRO · AKTIVE MISSION",overview:"Wähle Linie, Richtung und Bahnsteig. Fahre Station für Station und überprüfe das Sprechen selbst.",
   offline:"Offline · Selbsteinschätzung beim Sprechen",training:"Sprachtraining im Nahverkehr",pilotTag:"MEHRSPRACHIGE METRO",enterTitle:"Orientierung in der Stadt",metroTitle:"Orientierung in der Metro",
   labels:{model:"Musterantwort anzeigen",glossary:"Wichtige Ausdrücke und Wortschatz",criteria:"Sprechen · Selbstkontrolle",
    support:"Hilfestellung",stretch:"Zusatzaufgabe",restart:"Metro-Mission neu starten",next:"Nächste Mission",
    noLine:"noch keine Linie gewählt",position:"Aktueller Standort",step:"Schritt",platform:"Bahnsteig",platformBoard:"Abfahrtstafel · lies die Schilder",towards:"Richtung",noService:"Keine Abfahrt angezeigt",level:"Sprachniveau",
    checkpoint:"Bestätigte Sprechaufgaben",prompt:"Erkläre die Route laut und bestätige deine Selbstkontrolle.",
    scenePlatform:"Bahnsteigansicht",sceneTrain:"Im Zug",concourse:"Bahnhofshalle",
    choice:"Nur die Schaltflächen im Missionsfeld steuern die Fahrt.",preview:"Metro-Vorschau",
    verified:"Die Route wurde lokal geprüft. Die Sprechleistung wurde nur selbst eingeschätzt – ohne Aufnahme oder automatische Bewertung.",
    complete:"Ziel erreicht",boarded:"Eingestiegen",line:"Linie"},
   actions:{ENTER:"Die Metro betreten",READ_NOTICE:"Störungsmeldung lesen",BOARD:"In den Zug einsteigen",NEXT_STOP:"Zur nächsten Station fahren",
    CHANGE_LINE:"Den Umsteigeschildern folgen",STAY_ON_LINE:"Auf dieser Linie bleiben",EXIT:"Am Ziel aussteigen",CONTINUE_PAST_EXIT:"Im Zug weiterfahren",SELF_CHECK:"✓ Ich habe laut geübt · weiter"},
   titles:{5:"Die richtige Linie finden",6:"Richtig umsteigen",7:"Störung im Metroverkehr",8:"Zu Fuß und mit der Metro"},
   goals:{5:"Finde eine Metroverbindung von Central Station nach Museum Quarter. Bestimme anhand des Netzplans die Linie, die Richtung und den Bahnsteig.",
    6:"Fahre mit der Metro von Market Square zum Stadium. Finde heraus, wo du umsteigen musst und welche Fahrtrichtung richtig ist.",
    7:"Der M1-Abschnitt zwischen Old Town und Museum Quarter ist gesperrt. Finde eine Verbindung von Central Station nach Museum Quarter ohne diesen Abschnitt.",
    8:"Gehe zunächst zu Fuß zum Market Square. Du musst einen Kollegen an der U-Bahn-Station University abholen, bevor ihr gemeinsam das City Museum besucht. Die direkte M1 von Central Station hält dort nicht. Wähle und begründe eine Route, die beide Ziele erfüllt."},
   pair:{5:"Lotse: Erkläre Linie, Endstation und Bahnsteig ohne zu zeigen. Fahrgast: Prüfe die Schilder und wiederhole die Angaben.",
    6:"Fahrgast: Frage nach dem Weg zum Stadium. Lotse: Ermittle den nötigen Umstieg anhand des Netzplans und erkläre ihn. Tauscht die Rollen.",
    7:"Servicepersonal: Melde die Sperrung. Lotse: Empfiehl eine Alternative und begründe deine Entscheidung.",
    8:"Fahrgast und Lotse: Erklärt abwechselnd den Fußweg, das Umsteigen und den letzten Weg zum Museum."},
   phases:{"walk-to-entrance":"Gehe von Central Station nach Market Square. Nutze die Richtungstasten oder benachbarte Kreuzungen.",
    enter:"Du bist bei Market Square. Betritt die Metro.",
    notice:"Lies die Meldung: Die M1 ist zwischen Old Town und Museum Quarter gesperrt.",
    "select-line":"Sieh dir den Netzplan an. Welche Linie passt ab {station}?",
    "select-direction":"Wähle die angezeigte Endstation des Zuges, nicht die nächste Haltestelle.",
    "select-platform":"Vergleiche Linie und Endstation mit den Bahnsteigschildern.",
    board:"Linie, Richtung und Bahnsteig sind gewählt. Steige ein.",
    ride:"Fahre jeweils genau eine Station weiter und prüfe deinen Standort.",
    transfer:"Du bist an einem Umsteigebahnhof. Folge den Schildern zur Anschlusslinie.",
    exit:"Du hast die Zielstation erreicht. Steige aus.",
    "walk-to-museum":"Verlasse Museum Quarter und gehe einen Häuserblock nach Norden zum City Museum.",
    checkpoint:"Erkläre diesen Teil deiner Route laut, bevor du weitermachst.",
    meetUniversity:"Du bist an der Station University angekommen. Triff deinen Kollegen vor dem Umstieg in die M3 und erkläre, warum die direkte M1 ab Central Station das Treffen nicht ermöglichen würde.",
    speech:"Beschreibe die gesamte Strecke laut und schätze dein Sprechen selbst ein."},
   hints:{walk:"Gehe jeweils nur zur nächsten Kreuzung. Nutze Karte, Tasten oder Tastatur.",
    map:"Netzplan und Zugansicht zeigen deine Entscheidungen, aber nicht die zukünftige Route."},
   success:{UNDO_WALK:"Der letzte Fußweg-Schritt wurde rückgängig gemacht.",WALK:"Du bist einen Häuserblock weitergegangen.",
    ENTER:"Du bist in Market Square. Wähle eine Linie.",READ_NOTICE:"Sperrung zur Kenntnis genommen. Suche eine andere Verbindung.",
    SELECT_LINE:"Richtige Linie. Wähle jetzt die Richtung.",SELECT_DIRECTION:"Richtige Endstation. Suche den Bahnsteig.",
    SELECT_PLATFORM:"Richtiger Bahnsteig. Du kannst einsteigen.",BOARD:"Eingestiegen. Fahre Station für Station.",
    NEXT_STOP:"Nächste Station: {station}.",CHANGE_LINE:"Umsteigeschilder beachtet. Wähle die Anschlusslinie.",
    EXIT:"Du bist am Ziel ausgestiegen.",SELF_CHECK:"Sprechaufgabe selbst bestätigt."},
   errors:{completed:"Diese Mission ist bereits abgeschlossen.",undoPhase:"Rückgängig geht nur beim Fußweg.",
    undoStart:"Es gibt noch keinen Schritt zum Zurückgehen.",walkPhase:"Jetzt kannst du nicht zu Fuß gehen.",
    nonadjacent:"Gehe nur einen Häuserblock weiter. Du kannst keine Kreuzungen überspringen.",longRoute:"Der Weg ist zu lang. Starte die Mission neu.",
    entrance:"Gehe zuerst zum Metroeingang bei Market Square.",notice:"Lies die Meldung erst in der vorgesehenen Phase.",
    linePhase:"Wähle die Linie in der Bahnhofshalle.",wrongLine:"Diese Linie passt nicht zum nächsten Abschnitt. Prüfe den Netzplan.",
    directionPhase:"Wähle zuerst eine Linie.",wrongDirection:"Dieser Zug fährt in die falsche Richtung. Prüfe die Endstation.",
    platformPhase:"Wähle erst Linie und Richtung.",wrongPlatform:"Falscher Bahnsteig. Lies die Schilder.",
    boardPhase:"Prüfe Linie, Richtung und Bahnsteig vor dem Einsteigen.",boardMismatch:"Die Abfahrtsangaben passen nicht zur Route.",
    ridePhase:"Steige zuerst in den richtigen Zug.",blocked:"Die nächste Verbindung ist gesperrt oder nicht vorhanden.",
    transferPhase:"Umsteigen ist nur an einer gültigen Umsteigestation möglich.",transferInvalid:"Hier gibt es keine passende Anschlusslinie.",stayOnLine:"Diese Linie führt nicht zum Ziel. Prüfe den Umsteigeplan.",wrongTransfer:"Das ist nicht die richtige Anschlusslinie. Prüfe die Umsteigeschilder.",continuePastExit:"Du hast dein Ziel erreicht. Wenn du weiterfährst, verpasst du den Ausstieg.",
    exit:"Steige erst an deiner Zielstation aus.",speech:"Beende den Abschnitt vor der Sprechaufgabe.",invalid:"Diese Aktion ist jetzt nicht möglich."},
   models:{5:"Nimm an Central Station die M1 in Richtung East Gardens von Bahnsteig 2. Steige an Museum Quarter aus.",
    6:"Fahre ab Market Square mit der M2 Richtung North Park von Bahnsteig 1 bis University. Steige dort an Bahnsteig 3 in die M3 Richtung Harbour um und steige am Stadium aus.",
    7:"Da der M1-Abschnitt zwischen Old Town und Museum Quarter gesperrt ist, fahre von Bahnsteig 3 mit der M2 Richtung North Park bis University, steige dort an Bahnsteig 3 in die M3 Richtung Harbour um und steige an Museum Quarter aus.",
    8:"Die direkte M1 von Central Station nach Museum Quarter wäre zwar kürzer, aber wir müssen zuerst einen Kollegen an der Station University abholen. Gehe von Central Station nach Market Square. Fahre von Bahnsteig 1 mit der M2 Richtung North Park bis University, triff dort den Kollegen und steige an Bahnsteig 3 in die M3 Richtung Harbour um. Steige an Museum Quarter aus und gehe mit ihm nach Norden zum City Museum."},
   glossary:[["Endstation","letzte Station, die die Fahrtrichtung angibt"],["Bahnsteig","Bereich zum Warten und Einsteigen"],["umsteigen","von einer Linie in eine andere wechseln"],["Störung","Problem im regulären Betrieb"],["Umleitung","Ersatzweg bei einer Sperrung"],["Ausgang","Weg vom Bahnhof auf die Straße"]],
   levels:{
    B1:{focus:"Klare und geordnete Wegbeschreibungen geben.",task:"Erkläre mit einfachen Sätzen Linie, Endstation, Bahnsteig und Umsteigen.",
      criteria:["Ich habe Linie und Richtung richtig genannt.","Ich habe alle Schritte in der richtigen Reihenfolge erklärt.","Mein Partner konnte mir folgen."],
      support:"Beginne mit: Zuerst…, dann…, steig um in…, zum Schluss…",stretch:"Erkläre alles noch einmal ohne Muster.",
      extension:"Erkläre die Schritte nacheinander und frage nach, ob alles verständlich ist."},
    B2:{focus:"Routen vergleichen und Entscheidungen begründen.",task:"Begründe die Verbindung und vergleiche sie mit einer weniger geeigneten Möglichkeit.",
      criteria:["Ich habe die Verbindung begründet.","Ich habe Umsteigen oder Störung verständlich erklärt.","Ich habe zwei Möglichkeiten verglichen."],
      support:"Nutze: Ich würde empfehlen…, weil…; im Vergleich zu…",stretch:"Diskutiere, welche Route bei einer Verspätung sinnvoller wäre.",
      extension:"Im Vergleich zur anderen Verbindung ist diese Route übersichtlicher und vermeidet unnötiges Umsteigen."},
    C1:{focus:"Einschränkungen erläutern und komplexe Hinweise präzisieren.",task:"Kläre ein mögliches Missverständnis und gib einen Alternativplan bei einer Störung.",
      criteria:["Ich habe Missverständnisse vermieden.","Ich habe Einschränkungen und Folgen erklärt.","Meine Anweisungen waren präzise und gut strukturiert."],
      support:"Nutze: Vorausgesetzt, dass…, falls…, um Missverständnisse zu vermeiden…",stretch:"Passe die Beschreibung an eine Person mit eingeschränkter Mobilität an.",
      extension:"Vorausgesetzt, die Anschlusslinie verkehrt planmäßig, ist der Weg eindeutig; bei weiteren Störungen muss die Verbindung neu geplant werden."},
    C2:{focus:"Nuanciert beraten und situationsgerecht formulieren.",task:"Wäge Vor- und Nachteile ab, bleibe präzise und passe den Tonfall an.",
      criteria:["Ich habe Vor- und Nachteile abgewogen.","Ich habe mehrdeutige Angaben vermieden.","Ich habe den Sprachstil an den Fahrgast angepasst."],
      support:"Nutze: Alles in allem…, ungeachtet dessen…, die verlässlichste Option…",stretch:"Formuliere eine formelle Durchsage und anschließend eine freundliche Kurzberatung.",
      extension:"Alles in allem ist eine zuverlässige Umsteigeverbindung wichtiger als ein minimaler Zeitgewinn; selbst bei kurzfristigen Änderungen lassen sich die Alternativen eindeutig erklären."}
   }
  },
  fr:{
   native:"Français",pilot:"Jouer aux missions de métro",back:"Revenir aux missions classiques",
   title:"Riverton : ville et métro",header:"Explorez Riverton à pied et sous terre : quatre missions en ville et quatre défis en métro.",
   kicker:"MÉTRO DE RIVERTON · MISSION ACTIVE",overview:"Choisissez la ligne, la direction et le quai. Avancez station par station et autoévaluez votre prise de parole.",
   offline:"Hors ligne · Expression orale autoévaluée",training:"Entraînement à la communication dans le métro",pilotTag:"MÉTRO MULTILINGUE",enterTitle:"Orientation en ville",metroTitle:"Orientation dans le métro",
   labels:{model:"Afficher une réponse modèle",glossary:"Expressions et vocabulaire utiles",criteria:"Autoévaluation orale · points à vérifier",
    support:"Aide",stretch:"Défi supplémentaire",restart:"Recommencer cette mission de métro",next:"Mission suivante",
    noLine:"aucune ligne sélectionnée",position:"Position actuelle",step:"Étape",platform:"Quai",platformBoard:"Tableau des départs · lisez les panneaux",towards:"Direction",noService:"Aucun départ indiqué",level:"Niveau",
    checkpoint:"Étapes orales confirmées",prompt:"Expliquez le trajet à voix haute puis confirmez votre autoévaluation.",
    scenePlatform:"Vue du quai",sceneTrain:"À bord du train",concourse:"Hall de la station",
    choice:"Seuls les boutons de la mission font avancer le trajet.",preview:"Aperçu du métro",
    verified:"Itinéraire vérifié localement. L'expression orale est autoévaluée, sans enregistrement ni note automatique.",
    complete:"Destination atteinte",boarded:"À bord du train",line:"Ligne"},
   actions:{ENTER:"Entrer dans le métro",READ_NOTICE:"Lire l'avis de perturbation",BOARD:"Monter dans le train",NEXT_STOP:"Aller à la station suivante",
    CHANGE_LINE:"Suivre les panneaux de correspondance",STAY_ON_LINE:"Rester sur cette ligne",EXIT:"Sortir à destination",CONTINUE_PAST_EXIT:"Rester à bord du train",SELF_CHECK:"✓ J'ai parlé à voix haute · continuer"},
   titles:{5:"Trouver la bonne ligne",6:"Changer de ligne",7:"Perturbation du métro",8:"De la ville au métro"},
   goals:{5:"Trouvez un itinéraire en métro de Central Station à Museum Quarter. Utilisez le plan pour choisir la ligne, la direction et le quai.",
    6:"Rejoignez Stadium en métro depuis Market Square. Déterminez où changer de ligne et quelle direction prendre.",
    7:"Le tronçon M1 entre Old Town et Museum Quarter est fermé. Rejoignez Museum Quarter depuis Central Station sans emprunter ce tronçon.",
    8:"Rejoignez Market Square à pied. Vous devez retrouver une collègue à la station University avant de visiter City Museum ensemble. La ligne directe M1 depuis Central Station ne dessert pas University. Choisissez et justifiez un itinéraire qui respecte ces deux objectifs."},
   pair:{5:"Guide : expliquez la ligne, le terminus et le quai sans montrer le plan. Voyageur : vérifiez les panneaux et reformulez.",
    6:"Voyageur : demandez comment rejoindre Stadium. Guide : déterminez la correspondance avec le plan et expliquez-la. Échangez les rôles.",
    7:"Agent : annoncez la perturbation. Guide : proposez une solution de remplacement et justifiez votre choix.",
    8:"Voyageur et guide : expliquez à tour de rôle la marche, la correspondance et le dernier trajet vers le musée."},
   phases:{"walk-to-entrance":"Marchez de Central Station à Market Square. Utilisez les flèches ou les carrefours voisins.",
    enter:"Vous êtes à Market Square. Entrez dans le métro.",
    notice:"Lisez l'avis : le tronçon M1 entre Old Town et Museum Quarter est fermé.",
    "select-line":"Observez le plan. Quelle ligne prendre depuis {station} ?",
    "select-direction":"Choisissez le terminus affiché sur le train, et non la station suivante.",
    "select-platform":"Vérifiez la ligne et le terminus sur le panneau du quai.",
    board:"Vous avez choisi la ligne, la direction et le quai. Montez dans le train.",
    ride:"Avancez d'une seule station à la fois et suivez votre position.",
    transfer:"Vous êtes à une station de correspondance. Suivez les panneaux vers l'autre ligne.",
    exit:"Vous avez atteint la bonne station. Descendez du train.",
    "walk-to-museum":"Sortez à Museum Quarter. Marchez un pâté de maisons vers le nord jusqu'à City Museum.",
    checkpoint:"Expliquez cette partie du trajet à voix haute avant de continuer.",
    meetUniversity:"Vous êtes arrivé à University. Retrouvez votre collègue avant de prendre la M3. Expliquez pourquoi la M1 directe depuis Central Station ne permettrait pas ce rendez-vous.",
    speech:"Expliquez tout l'itinéraire à voix haute et autoévaluez votre réponse."},
   hints:{walk:"Avancez d'un carrefour voisin à l'autre, sans sauter de rue.",
    map:"Le plan et la scène suivent vos décisions sans révéler le reste de l'itinéraire."},
   success:{UNDO_WALK:"Le dernier déplacement à pied a été annulé.",WALK:"Vous avez avancé d'un pâté de maisons.",
    ENTER:"Vous avez rejoint le métro à Market Square. Choisissez une ligne.",READ_NOTICE:"Avis compris. Cherchez une autre correspondance.",
    SELECT_LINE:"Bonne ligne. Choisissez maintenant la direction.",SELECT_DIRECTION:"Bon terminus. Cherchez le quai.",
    SELECT_PLATFORM:"Bon quai. Vous pouvez monter.",BOARD:"Vous êtes à bord. Avancez station par station.",
    NEXT_STOP:"Station suivante : {station}.",CHANGE_LINE:"Vous avez suivi les panneaux. Choisissez la ligne de correspondance.",
    EXIT:"Vous avez quitté le métro à destination.",SELF_CHECK:"Autoévaluation orale confirmée."},
   errors:{completed:"Cette mission est déjà terminée.",undoPhase:"Annuler n'est possible que pendant la marche.",
    undoStart:"Aucun déplacement précédent à annuler.",walkPhase:"La marche n'est pas disponible à ce stade.",
    nonadjacent:"Avancez d'un seul pâté de maisons, sans sauter de carrefour.",longRoute:"Trajet trop long. Recommencez avec un itinéraire plus court.",
    entrance:"Rejoignez d'abord l'entrée du métro à Market Square.",notice:"Lisez l'avis au moment prévu.",
    linePhase:"Choisissez une ligne dans le hall de la station.",wrongLine:"Cette ligne ne convient pas au trajet. Observez le plan.",
    directionPhase:"Choisissez d'abord la ligne.",wrongDirection:"Ce train va dans l'autre sens. Vérifiez le terminus.",
    platformPhase:"Choisissez la ligne et la direction avant le quai.",wrongPlatform:"Mauvais quai. Relisez les panneaux.",
    boardPhase:"Vérifiez la ligne, la direction et le quai avant de monter.",boardMismatch:"Les informations de départ ne correspondent pas.",
    ridePhase:"Montez d'abord dans le bon train.",blocked:"Le tronçon suivant est fermé ou non relié.",
    transferPhase:"Le changement de ligne n'est possible qu'à une correspondance.",transferInvalid:"Aucune liaison n'est disponible ici.",stayOnLine:"Cette ligne ne rejoint pas votre destination. Consultez le plan des correspondances.",wrongTransfer:"Ce n'est pas la bonne ligne de correspondance. Consultez les panneaux.",continuePastExit:"Vous êtes à destination. Si vous continuez, vous dépasserez votre arrêt.",
    exit:"Descendez uniquement à la station de destination.",speech:"Terminez cette étape avant de prendre la parole.",invalid:"Cette action n'est pas possible maintenant."},
   models:{5:"À Central Station, prenez la M1 en direction d'East Gardens depuis le quai 2. Descendez à Museum Quarter.",
    6:"À Market Square, prenez la M2 en direction de North Park depuis le quai 1. Changez à University pour la M3 en direction de Harbour depuis le quai 3, puis descendez à Stadium.",
    7:"Le tronçon M1 entre Old Town et Museum Quarter étant fermé, prenez la M2 en direction de North Park depuis le quai 3 jusqu'à University, puis la M3 en direction de Harbour depuis le quai 3 et descendez à Museum Quarter.",
    8:"Bien que la M1 relie directement Central Station à Museum Quarter, elle ne permet pas de retrouver la collègue à University. Marchez de Central Station à Market Square. Prenez la M2 en direction de North Park depuis le quai 1 jusqu'à University et retrouvez-y votre collègue. Puis prenez la M3 en direction de Harbour depuis le quai 3, descendez à Museum Quarter et marchez vers le nord jusqu'à City Museum."},
   glossary:[["terminus","dernière station indiquant la direction"],["quai","espace où l'on attend le train"],["correspondance","changement d'une ligne à une autre"],["perturbation","incident qui modifie le service"],["déviation","autre itinéraire en cas de fermeture"],["sortie","accès du métro vers la rue"]],
   levels:{
    B1:{focus:"Donner des indications simples et ordonnées.",task:"Indiquez la ligne, le terminus, le quai et les correspondances avec des phrases claires.",
      criteria:["J'ai indiqué la bonne ligne et la bonne direction.","J'ai présenté les étapes dans l'ordre.","Mon partenaire a compris les indications."],
      support:"Commencez par : D'abord…, ensuite…, changez à…, enfin…",stretch:"Répétez les instructions sans regarder l'exemple.",
      extension:"Présentez les étapes dans l'ordre et vérifiez que votre partenaire a compris."},
    B2:{focus:"Comparer des possibilités et justifier un itinéraire.",task:"Expliquez votre choix et comparez-le avec une option moins adaptée.",
      criteria:["J'ai justifié l'itinéraire.","J'ai clairement expliqué la correspondance ou la perturbation.","J'ai comparé deux possibilités."],
      support:"Utilisez : Je conseillerais… parce que… ; par rapport à…",stretch:"Discutez du meilleur itinéraire en cas de retard.",
      extension:"Par rapport à l'autre correspondance, cet itinéraire évite un changement inutile et reste plus facile à suivre."},
    C1:{focus:"Expliquer des contraintes et reformuler avec précision.",task:"Anticipez un malentendu et indiquez une solution de rechange en cas de problème.",
      criteria:["J'ai clarifié un risque de malentendu.","J'ai expliqué une contrainte et ses conséquences.","Mes instructions sont précises et structurées."],
      support:"Utilisez : À condition que…, en cas de…, afin d'éviter toute confusion…",stretch:"Adaptez vos conseils à une personne à mobilité réduite.",
      extension:"À condition que la correspondance fonctionne normalement, cet itinéraire reste simple ; si le service est perturbé, il faut revoir le changement de ligne."},
    C2:{focus:"Conseiller avec nuance et adapter le registre.",task:"Évaluez les compromis du trajet, restez précis et adaptez votre discours au voyageur.",
      criteria:["J'ai évalué les avantages et les inconvénients.","J'ai évité toute ambiguïté.","J'ai adapté mon registre au voyageur."],
      support:"Utilisez : Tout bien considéré…, néanmoins…, l'option la plus fiable…",stretch:"Formulez une annonce officielle puis des conseils rassurants et informels.",
      extension:"Tout bien considéré, la fiabilité d'une correspondance prime sur un gain de temps marginal ; si la situation évolue, on peut préciser l'alternative sans créer d'ambiguïté."}
   }
  }
 };
 // CQ-F5-007: mission-specific language tasks/models. Unlike generic CEFR
 // suffixes, these force explanations of each actual trip constraint.
 const advanced={en:{"B2":{"5":{"task":"Compare a direct service with an option involving a transfer and justify the clearer route.","lead":"For a traveller who wants the least complicated journey, a direct service is preferable.","reason":"The alternative via University involves an unnecessary transfer and adds an opportunity for confusion."},"6":{"task":"Explain why changing lines is necessary and distinguish the interchange from the final stop.","lead":"A transfer is necessary because Stadium is served by M3, not by the first line of the journey.","reason":"University is the interchange, whereas Harbour is the displayed terminus of M3 rather than the place where the traveller should get off."},"7":{"task":"Explain the impact of a closed segment and justify a feasible alternative using the map.","lead":"The normal direct connection cannot be used because one M1 section is closed.","reason":"The route through University is valid because it bypasses the closed Old Town–Museum Quarter segment; the traveller must not treat the familiar direct route as available."},"8":{"task":"Justify the route against the required University appointment and compare it with a direct service.","lead":"The fastest-looking journey would miss a compulsory stop: we must collect our colleague at University.","reason":"The apparent backtracking is justified by the appointment, whereas taking M1 directly to Museum Quarter would fail the task."}},"C1":{"5":{"task":"Explain the difference between terminus and exit, anticipate confusion, and choose the least error-prone service.","lead":"I would distinguish the terminus shown on the train from the station at which the passenger actually needs to leave it.","reason":"East Gardens is the direction displayed, not the passenger's destination. The direct connection minimises transfers, but I would still advise checking the platform information before boarding."},"6":{"task":"Give precise transfer instructions and anticipate a misunderstanding about direction displays.","lead":"The essential distinction here is between University, the interchange, and Harbour, the terminus displayed on the connecting service.","reason":"The passenger should change at University, not continue to North Park, and should leave M3 at Stadium rather than ride to Harbour. The platform display is worth verifying."},"7":{"task":"Assess a closure announcement, defend a viable route and state how additional disruption would change your advice.","lead":"In view of the Old Town–Museum Quarter closure, suggesting the usual M1 service would be misleading.","reason":"The M2/M3 connection avoids that known closure. If a further disruption is announced, I would check the new service information instead of promising that the original alternative still works."},"8":{"task":"Weigh the University meeting against the apparent convenience of M1 and communicate each stage tactfully.","lead":"Although a direct train would be easier for someone visiting only the museum, the appointment at University is a binding condition.","reason":"Collecting the colleague before continuing makes the transfer necessary. I would clarify that this is a planned meeting, not an accidental wrong turn through Central Station."}},"C2":{"5":{"task":"Mediate a potentially ambiguous direction display and offer a defensible recommendation with a contingency.","lead":"To avoid a costly misunderstanding, I would separate three concepts: the line, its displayed terminus, and the traveller's actual exit.","reason":"The train displays East Gardens, yet the correct exit is Museum Quarter. A direct service reduces complexity; should operations change, a fresh check is safer than an unfounded assurance."},"6":{"task":"Disambiguate terminus, interchange and final destination, defending a transfer while addressing likely objections.","lead":"The main risk is mistaking a terminus on a display for the station where a traveller should change or leave the train.","reason":"University is the required interchange, North Park only the M2 terminus, and Harbour only the M3 terminus. Stadium is the actual exit; staying on M2 would be unproductive."},"7":{"task":"Evaluate incomplete service information, distinguish known restrictions from assumptions and articulate a resilient alternative.","lead":"The intuitively direct M1 journey is not a valid recommendation under the published closure, regardless of how familiar it appears.","reason":"The suggested M2/M3 route avoids the documented closed edge. I would make the contingency explicit: any new disruption must be verified rather than guessed from an old map."},"8":{"task":"Justify an indirect journey against a fixed appointment, resolve the backtracking objection and state the governing trade-off.","lead":"Route efficiency is not simply the fewest stops: we must first meet our colleague at University.","reason":"The M1 shortcut would omit that obligation. Passing back through Central Station on M2 is a deliberate consequence of starting on foot at Market Square; the subsequent M3 connection lets the group reach the museum together."}}},es:{"B2":{"5":{"task":"Compara un servicio directo con otro que exige transbordo y justifica cuál resulta más claro.","lead":"Para una persona que busca un trayecto sencillo, conviene elegir una conexión directa.","reason":"La alternativa por University exigiría un transbordo innecesario y aumentaría el riesgo de confusión."},"6":{"task":"Explica por qué es necesario cambiar de línea y diferencia la estación de transbordo de la parada final.","lead":"Es imprescindible cambiar de línea porque Stadium pertenece a la M3 y no a la primera línea del recorrido.","reason":"University es la estación de correspondencia; Harbour es la cabecera indicada en la M3, no la parada donde debe bajar el viajero."},"7":{"task":"Explica las consecuencias del cierre y justifica una alternativa que realmente pueda utilizarse.","lead":"La conexión directa habitual no puede usarse porque un tramo de la M1 está cerrado.","reason":"El itinerario por University evita el corte Old Town–Museum Quarter; no sería correcto recomendar la ruta directa como si el servicio funcionara con normalidad."},"8":{"task":"Justifica la elección teniendo en cuenta la cita en University y compárala con la ruta directa.","lead":"La ruta aparentemente más rápida dejaría sin cumplir una condición esencial: recoger a nuestra compañera en University.","reason":"El aparente rodeo se debe a la cita; tomar directamente la M1 hasta Museum Quarter no cumpliría el objetivo de la misión."}},"C1":{"5":{"task":"Diferencia la cabecera del tren y la parada de salida, prevé un malentendido y valora el riesgo del transbordo.","lead":"Conviene distinguir la cabecera que figura en el tren de la estación donde el pasajero realmente debe bajarse.","reason":"East Gardens es la dirección anunciada, no el destino del viajero. El servicio directo evita transbordos, aunque recomendaría comprobar el panel del andén antes de subir."},"6":{"task":"Da instrucciones precisas para el transbordo y anticipa confusiones con los destinos mostrados en las pantallas.","lead":"La clave es distinguir University, donde se hace transbordo, de Harbour, la cabecera anunciada por la línea de enlace.","reason":"Hay que cambiar en University, no continuar hasta North Park, y bajar de la M3 en Stadium, no llegar a Harbour. También conviene comprobar el andén."},"7":{"task":"Valora el aviso de cierre, defiende una ruta viable y explica qué harías ante una incidencia adicional.","lead":"Dado el cierre entre Old Town y Museum Quarter, sugerir la M1 habitual induciría al viajero a error.","reason":"La combinación M2/M3 evita el corte conocido. Si se anunciara otra incidencia, comprobaría la nueva información antes de asegurar que la alternativa sigue disponible."},"8":{"task":"Sopesa la cita en University frente a la comodidad aparente de la M1 y explica cada etapa con precisión.","lead":"Aunque un tren directo resultaría más cómodo si solo fuéramos al museo, recoger a nuestra compañera en University es una condición imprescindible.","reason":"La reunión hace necesario el transbordo. Aclararía que volver a pasar por Central Station es parte del plan, no una equivocación."}},"C2":{"5":{"task":"Aclara una indicación potencialmente ambigua y formula una recomendación defendible con una contingencia.","lead":"Para evitar un malentendido importante, distinguiría entre la línea, su cabecera anunciada y la parada donde el viajero debe salir.","reason":"En el tren figura East Gardens, pero la salida correcta es Museum Quarter. Un servicio directo reduce la complejidad; si la situación cambiara, sería mejor revisar los avisos que garantizar algo sin pruebas."},"6":{"task":"Diferencia con precisión cabecera, transbordo y destino final, y responde a una posible objeción.","lead":"El principal riesgo consiste en confundir una cabecera con el punto donde hay que cambiar o abandonar el tren.","reason":"University es el transbordo obligatorio; North Park es solo la cabecera de la M2 y Harbour la de la M3. La salida real es Stadium; continuar en la M2 no resolvería el viaje."},"7":{"task":"Evalúa la información disponible, separa hechos de suposiciones y propone una alternativa prudente.","lead":"La M1 parece la opción evidente, pero el cierre publicado impide recomendarla, por familiar que resulte.","reason":"La combinación M2/M3 evita el tramo clausurado. Añadiría una reserva explícita: ante otra incidencia habría que comprobar el servicio, no deducirlo de un plano anterior."},"8":{"task":"Justifica un itinerario indirecto frente a una cita inaplazable y explica por qué el regreso parcial no es un error.","lead":"La eficiencia del recorrido no depende solo de cuántas estaciones haya: debemos recoger primero a nuestra compañera en University.","reason":"El atajo de la M1 no cumpliría esa obligación. Volver a pasar por Central Station en la M2 es una consecuencia deliberada de empezar a pie en Market Square; luego el enlace con M3 permite llegar juntos al museo."}}},de:{"B2":{"5":{"task":"Vergleiche eine Direktverbindung mit einer Umsteigeverbindung und begründe die verständlichere Empfehlung.","lead":"Für einen Fahrgast, der sich möglichst einfach orientieren möchte, ist eine direkte Verbindung sinnvoller.","reason":"Die Alternative über University würde einen unnötigen Umstieg erfordern und damit zusätzliche Verwirrung riskieren."},"6":{"task":"Erkläre, warum ein Umstieg erforderlich ist, und unterscheide Umsteigebahnhof und Zielstation.","lead":"Ein Umstieg ist nötig, denn Stadium wird von der M3 bedient und nicht von der ersten Linie der Fahrt.","reason":"University ist der Umsteigebahnhof. Harbour steht als Endstation auf der M3, ist aber nicht der Ort, an dem der Fahrgast aussteigen soll."},"7":{"task":"Beschreibe die Folgen der Streckensperrung und begründe eine tatsächlich verfügbare Alternative.","lead":"Die übliche Direktverbindung ist wegen eines gesperrten M1-Abschnitts nicht benutzbar.","reason":"Die Route über University umgeht die Sperrung zwischen Old Town und Museum Quarter. Es wäre falsch, die direkte M1 trotzdem als verfügbar zu empfehlen."},"8":{"task":"Begründe die Route unter Berücksichtigung des Treffens in University und vergleiche sie mit der Direktverbindung.","lead":"Die scheinbar kürzere Verbindung würde eine notwendige Aufgabe auslassen: unseren Kollegen in University abzuholen.","reason":"Der Umweg ist wegen des Treffens gerechtfertigt. Die direkte M1 bis Museum Quarter würde das eigentliche Ziel der Aufgabe verfehlen."}},"C1":{"5":{"task":"Unterscheide angezeigte Endstation und tatsächlichen Ausstieg und berücksichtige mögliche Verwechslungen.","lead":"Ich würde ausdrücklich zwischen der angezeigten Endstation des Zuges und der Station unterscheiden, an der der Fahrgast aussteigen muss.","reason":"East Gardens ist die Fahrtrichtung, nicht das Ziel des Reisenden. Die Direktverbindung verringert das Risiko beim Umsteigen; vor dem Einstieg würde ich dennoch die Bahnsteiganzeige prüfen."},"6":{"task":"Erläutere die Umsteigesituation präzise und beuge Missverständnissen bei Richtungsanzeigen vor.","lead":"Entscheidend ist die Unterscheidung zwischen University als Umsteigebahnhof und Harbour als angezeigter Endstation der Anschlusslinie.","reason":"Der Fahrgast muss in University umsteigen, darf nicht bis North Park weiterfahren und sollte die M3 bereits in Stadium verlassen, nicht erst in Harbour. Ein Blick auf die Anzeige des Anschlussbahnsteigs hilft."},"7":{"task":"Bewerte die Sperrmeldung, begründe eine verfügbare Route und erläutere den Umgang mit weiteren Störungen.","lead":"Angesichts der Sperrung zwischen Old Town und Museum Quarter wäre die Empfehlung der gewohnten M1 irreführend.","reason":"Die Verbindung mit M2 und M3 umgeht den gesperrten Abschnitt. Sollte eine weitere Störung auftreten, würde ich die aktuellen Informationen erneut prüfen, statt die Verfügbarkeit der Alternative zu behaupten."},"8":{"task":"Wäge den Termin in University gegen die bequemere Direktverbindung ab und erkläre die Schritte verständlich.","lead":"Obwohl ein direkter Zug für einen reinen Museumsbesuch bequemer wäre, ist die Abholung unseres Kollegen in University eine feste Vorgabe.","reason":"Wegen des Treffens ist der Umstieg notwendig. Ich würde klarstellen, dass die erneute Fahrt über Central Station geplant ist und nicht auf einem Orientierungsfehler beruht."}},"C2":{"5":{"task":"Kläre eine missverständliche Zielanzeige, begründe eine belastbare Empfehlung und nenne einen Vorbehalt.","lead":"Um ein folgenreiches Missverständnis zu vermeiden, würde ich zwischen Linie, angezeigter Endstation und tatsächlichem Ausstieg unterscheiden.","reason":"Am Zug steht East Gardens, ausgestiegen wird aber an Museum Quarter. Eine Direktfahrt ist weniger kompliziert; bei einer Betriebsänderung sollte man die Angaben neu prüfen, statt unbegründete Zusagen zu machen."},"6":{"task":"Differenziere Endstation, Umsteigepunkt und Fahrtziel und entkräfte einen möglichen Einwand.","lead":"Das größte Risiko besteht darin, eine angezeigte Endstation mit dem Umsteigepunkt oder dem eigentlichen Reiseziel zu verwechseln.","reason":"University ist der notwendige Umsteigepunkt; North Park ist lediglich die Endstation der M2 und Harbour die der M3. Ausgestiegen wird in Stadium. Auf der M2 zu bleiben, würde nicht zum Ziel führen."},"7":{"task":"Trenne nachgewiesene Sperrungen von Vermutungen und formuliere eine widerstandsfähige Alternative.","lead":"Die direkte M1 mag naheliegend erscheinen, doch aufgrund der veröffentlichten Sperrung wäre sie keine vertretbare Empfehlung.","reason":"Die M2/M3-Verbindung umgeht die bekannte Sperrung. Weitere Änderungen müssten allerdings neu überprüft werden, statt sich auf einen möglicherweise veralteten Netzplan zu verlassen."},"8":{"task":"Begründe einen indirekten Weg anhand einer verbindlichen Verabredung und erkläre das scheinbare Zurückfahren.","lead":"Die effizienteste Route ist nicht automatisch die mit den wenigsten Haltestellen: Zunächst müssen wir unseren Kollegen in University treffen.","reason":"Die direkte M1 würde diesen Termin auslassen. Dass wir mit der M2 noch einmal durch Central Station fahren, ergibt sich bewusst aus dem Start zu Fuß am Market Square; anschließend bringt uns die M3 gemeinsam zum Museum."}}},fr:{}};
 const codeByMessage={
  "This mission has already been completed.":"completed",
  "You can undo walking steps only while exploring the city.":"undoPhase",
  "There is no previous walking step to undo.":"undoStart",
  "Walking is unavailable at this stage.":"walkPhase",
  "Move one adjacent city block at a time.":"nonadjacent",
  "Route too long. Restart this mission and choose a shorter route.":"longRoute",
  "Find the Market Square metro entrance first.":"entrance",
  "There is no service notice to acknowledge here.":"notice",
  "Choose a line when you are on the station concourse.":"linePhase",
  "That line does not take you along the required route. Read the network connections.":"wrongLine",
  "Choose the metro line first.":"directionPhase",
  "That train travels in the opposite direction. Check the terminus.":"wrongDirection",
  "Choose the line and direction before the platform.":"platformPhase",
  "Incorrect platform. Read the line and terminus on the station signs.":"wrongPlatform",
  "Confirm your line, direction and platform first.":"boardPhase",
  "The departure details no longer match the approved route.":"boardMismatch",
  "Board the correct train before travelling.":"ridePhase",
  "Movement is blocked or the next station is not connected.":"blocked",
  "You can change lines only at a valid interchange.":"transferPhase",
  "This station has no valid connection to the next line.":"transferInvalid",
  "Remaining on this line will not reach the required destination. Check the interchange map.":"stayOnLine",
  "That is not the connecting line for this route. Check the transfer signs.":"wrongTransfer",
  "You have reached your destination. Continuing would take you past the required exit.":"continuePastExit",
  "Exit only after arriving at your destination.":"exit",
  "Finish this route section before the speaking checkpoint.":"speech",
  "Unknown action.":"invalid"
 };
 const replace=(s,vars)=>s.replace(/\{(\w+)\}/g,(_,key)=>String(vars?.[key]??""));
 function pack(lang,level,mission){
  if(!languages.includes(lang)||!levels.includes(level)||!missions.includes(mission))
   throw RangeError("Unsupported metro content configuration "+[lang,level,mission].join("/"));
  const p=content[lang],authored=advanced[lang]?.[level]?.[mission],
    cefr=authored?Object.freeze({...p.levels[level],task:authored.task}):p.levels[level];
  return Object.freeze({...p,mission,level,cefr,
    titleMission:p.titles[mission],goal:p.goals[mission]+" "+cefr.task});
 }
 function stage(lang,level,mission,phase,vars){
  const p=pack(lang,level,mission);
  // Metro08's University meeting is the actual reason for taking M2/M3
  // instead of the direct M1 route. The checkpoint must mention it explicitly.
  const key=mission===8&&phase==="checkpoint"&&vars?.station==="University"?
    "meetUniversity":phase;
  return replace(p.phases[key]||p.errors.invalid,vars);
 }
 function model(lang,level,mission){
  const p=pack(lang,level,mission);
  const authored=advanced[lang]?.[level]?.[mission];
  return authored?authored.lead+" "+p.models[mission]+" "+authored.reason:
    p.models[mission];
 }
 function feedback(lang,result,action,stationLabel){
  if(lang==="en")return result.message;
  const p=content[lang];
  if(!p)throw RangeError("Unsupported language");
  if(!result.accepted)return p.errors[codeByMessage[result.message]||"invalid"];
  const type=action.type,state=result.state;
  if(type==="WALK"&&state.phase==="checkpoint")return p.phases.checkpoint;
  if(type==="WALK"&&state.phase==="speech")return p.phases.speech;
  if(type==="NEXT_STOP"){
   if(state.phase==="transfer"||state.phase==="checkpoint")return p.phases.transfer;
   if(state.phase==="exit")return p.phases.exit;
  }
  if(type==="EXIT"&&state.phase==="walk-to-museum")return p.phases["walk-to-museum"];
  if(type==="SELF_CHECK"&&state.phase==="complete")return p.labels.verified;
  if(type==="SELF_CHECK"&&state.phase==="enter")return p.phases.enter;
  if(type==="SELF_CHECK"&&state.phase==="transfer")return p.phases.transfer;
  return replace(p.success[type]||p.errors.invalid,
    // The UI supplies the authoritative labelEn from the Riverton network.
    // The fallback remains a properly capitalized fictional station name
    // for pure Node unit tests that do not include a DOM or metro renderer.
    {station:stationLabel||state.metroStation.split("_").map(part=>
      part.charAt(0).toUpperCase()+part.slice(1)).join(" ")});
 }
 function validate(){
  for(const lang of languages){
   const p=content[lang];
   for(const key of ["native","pilot","back","title","header","labels","phases","goals","pair","models","glossary","levels","success","errors"])
    if(!p[key])throw Error("Missing "+lang+" "+key);
   for(const [message,key] of Object.entries(codeByMessage))
    if(!p.errors[key])throw Error("Missing "+lang+" error translation "+key+": "+message);
   for(const level of levels){
    const c=p.levels[level];
    if(!c||c.criteria.length!==3||!c.focus||!c.support||!c.stretch||!c.task||!c.extension)
     throw Error("Incomplete CEFR profile "+lang+"/"+level);
    for(const n of missions){
     const x=pack(lang,level,n);
     if(!x.titleMission||!x.goal||!p.models[n]||!p.pair[n]||model(lang,level,n).length<40)
      throw Error("Incomplete metro mission "+lang+"/"+level+"/"+n);
    }
   }
   if(p.glossary.length<6)throw Error("Incomplete metro glossary "+lang);
  }
  return true;
 }
 validate();
 return Object.freeze({languages,levels,missions,content,pack,stage,model,feedback,validate});
});
