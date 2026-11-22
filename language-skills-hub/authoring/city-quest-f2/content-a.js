/* City Quest F2: original, manually authored EN/ES/DE/FR content.
 * No runtime translation service or network requests.
 * Canonical situation IDs and map coordinates remain language-neutral.
 */
(function(root, factory){
  "use strict";
  const data=factory();
  if(typeof module==="object"&&module.exports)module.exports=data;
  if(root)root.CityQuestF2Content=data;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const levels=["A1","A2","B1","B2","C1","C2"];
  const languages=["en","es","de","fr"];
  const packs={
    en:{
      name:"English",native:"English",locale:"en",short:"EN",
      ui:{
        language:"Language",level:"Level",mode:"Practice mode",solo:"Solo",pair:"Pair",
        station:"Station",completed:"missions completed",choose:"Choose an answer",
        next:"Next station",restart:"Start again",undo:"Undo",check:"Check answer",
        retry:"Try again",correct:"Correct!",notQuite:"Not quite. Try another answer.",
        mission:"Your mission",progress:"Progress",model:"Model response",reveal:"Reveal example",
        selfcheck:"Say your answer aloud before revealing the model. Speaking is not recorded or automatically graded.",
        selfdone:"I've spoken and checked my answer",finish:"Mission completed",
        compass:"Move one block",east:"East",west:"West",north:"North",south:"South",
        from:"From",to:"To",blocks:"blocks",remaining:"blocks to destination",
        route:"Route",line:"Line",departure:"Departure",arrival:"Arrival",stop:"Destination",
        plan:"Journey planner",closed:"ROAD CLOSED",map:"City map",hint:"Hint",
        vocabulary:"Vocabulary",speaking:"Speaking challenge",yourTurn:"Your turn",
        feedback:"Feedback",help:"Language support",alternative:"Other possible route",
        checkpoint:"Checkpoint",score:"Correct choices",roleA:"Student A",roleB:"Student B",
        switch:"Switch roles",goal:"Goal",ready:"Ready",review:"Review",
        changeSession:"Changing the language or CEFR level resets this local practice session.",
        offline:"Works without a server. No student data are sent or saved.",
        skip:"Skip for now",narrator:"Tourist",answer:"Your response",restartScene:"Restart dialogue",
        showHint:"Show a hint",arrived:"You have arrived!",step:"Step",
        partnerIntro:"Work with a partner. One student reads or explains the situation; the other responds without reading the model. Swap roles.",
        objective:"Communicate clearly, not just click the right option.",
        wrongRoad:"This road is closed. Find another way.",illegal:"Travel one block at a time.",
        end:"End of activity",restartStation:"Restart this station",same:"You're already here.",
        guide:"Read the next direction and choose the corresponding street.",
        transportWhy:"Explain why you chose this service rather than the alternatives.",
        noSpeechGrade:"Spoken language is assessed through self-check or peer feedback, not by an algorithm.",
        select:"Select...",confirm:"Confirm your choice",dialogueError:"Try a more helpful and accurate response.",
        left:"Left",right:"Right",straight:"Straight on",
        via:"via",roleMode:"Partner activity",checkRoute:"Check your route",passCheckpoint:"Continue to next checkpoint",
        training:"Language training",routeCompleted:"Route completed",challengeFinished:"Challenge finished",
        directions:"Directions",speakNow:"Explain the directions aloud",city:"Riverton",
        start:"Central Station",museum:"City Museum",square:"Market Square",library:"Library",hospital:"Hospital",
        departureBoard:"Departure board",arrivalBefore:"Arrive before",accessible:"Step-free service",
        feedbackGood:"Well done. The route and choices are correct.",
        feedbackRetry:"Check the street, direction or requirement and try again."
      },
      places:{
        station:"Central Station",museum:"City Museum",hospital:"Hospital",library:"Library",
        square:"Market Square",park:"Riverside Park",cafe:"Sunrise Café",post:"Post Office"
      },
      mapLabels:{
        "CENTRAL STATION":"CENTRAL STATION","CITY MUSEUM":"CITY MUSEUM","FARMERS MARKET":"FARMERS MARKET",
        "CITY SCHOOL":"CITY SCHOOL","THE HOTEL":"HOTEL","HOSPITAL":"HOSPITAL",
        "ROSE GARDEN":"ROSE GARDEN","GREEN SQUARE":"GREEN SQUARE",
        "MARKET SQUARE":"MARKET SQUARE","CITY GREEN":"CITY GREEN",
        "RIVERSIDE PARK":"RIVERSIDE PARK","BAKERY":"BAKERY","SUNRISE CAFÉ":"SUNRISE CAFÉ",
        "THEATRE":"THEATRE","LIBRARY":"LIBRARY","MAPLE GROVE":"MAPLE GROVE",
        "POST OFFICE":"POST OFFICE","CINEMA":"CINEMA","SHOPS":"SHOPS"
      },
      stations:[
        ["Explore the City","Find places from clues and build your city vocabulary."],
        ["Find the Route","Choose the streets and explain how to get there."],
        ["Ask for Directions","Handle a realistic conversation with a visitor."],
        ["Follow My Directions","Navigate while following successive instructions."],
        ["Catch the Right Bus","Read the departure board and choose a suitable service."],
        ["Oops! Wrong Turn","Spot and correct an inaccurate instruction."],
        ["The Unexpected Detour","Adapt your route when a street is closed."],
        ["The Ultimate City Quest","Reach several checkpoints and explain your decisions."]
      ],
      clues:[
        "Your train has just arrived. Where are you?",
        "A visitor wants to see historical objects. Where should they go?",
        "Someone needs urgent medical care. Which place can help?",
        "You need to borrow a book. Where do you go?",
        "Meet your friend by the fountain in the town centre.",
        "You want to walk among trees beside the river."
      ],
      travel:{
        opening:"I need to reach the hospital. Which service should I take?",
        before:"It is 08:35. You must reach the hospital by 09:10.",
        access:"The passenger needs a step-free vehicle and must reach the hospital by 09:10.",
        complex:"It is 08:35. A passenger with reduced mobility must reach the hospital by 09:10. Recommend a direct, step-free service, justify its reliability and explain why the other hospital-bound buses are unsuitable.",
        line7:"Riverside Park",line12:"City Museum",line24:"Hospital",
        why:"Line 24 leaves at 08:47 and arrives at the hospital at 09:05. It is a direct, step-free service.",
        lineWrong:"That bus goes to a different destination.",
        timeWrong:"Check the departure time for the correct line.",
        stopWrong:"The destination stop must be the hospital.",
        late:"This bus arrives after 09:10. Compare the arrival times, not just the destination.",
        notAccessible:"This service is not step-free. Choose a bus that meets the passenger's accessibility needs.",
        missing:"Complete all the required choices."
      },
      repair:{
        incorrect:"From Central Station, go east for three blocks. Turn RIGHT and go north for two blocks to the museum.",
        identify:["Go east for three blocks","Turn RIGHT","Go north for two blocks"],
        fixes:["Turn LEFT and head north","Continue SOUTH for two blocks","Turn LEFT and head WEST"],
        repairWhy:"When you are facing east, turning right leads south. To go north, turn left.",
        notYet:"The error is in the turn, not in the number of blocks.",
        polite:"Sorry, I gave you the wrong turn. Turn left instead and continue north."
      },
      dialogue:{
        opening:"Excuse me, could you tell me how to get to the museum?",
        clarify:"I'm sorry, I don't know Riverton. Could you be more specific?",
        mistake:"My map points in the opposite direction. Are you certain?",
        followup:"Thank you! Is it far to walk?",
        end:"Thanks for your help. Have a lovely day!",
        vague:"Somewhere around the centre. You'll find it.",
        wrong:"Go west, towards the river.",
        fix:"You're right, sorry. Let me correct the directions.",
        badFix:"Just ignore the map and keep going.",
        distance:"It's roughly five short blocks. I can show you on the map.",
        badDistance:"I have absolutely no idea; just keep walking.",
        goodbye:"You're welcome! Enjoy the museum.",
        good:"Clear, appropriate directions.",
        repairGood:"Good communication repair: you acknowledged the mistake.",
        unclear:"The visitor still needs a clear direction.",
        wrongFeedback:"That direction would lead the visitor away from the museum.",
        final:"You helped the visitor. Compare your words with a model response."
      },
      directions:{
        north:"north",east:"east",south:"south",west:"west",
        first:(dir,blocks)=>"Walk "+(blocks===1?"one":String(blocks))+" "+(blocks===1?"block":"blocks")+" "+dir+".",
        turn:(side,dir,blocks)=>"Turn "+side+" and walk "+(blocks===1?"one":String(blocks))+" "+(blocks===1?"block":"blocks")+" "+dir+".",
        continue:(dir,blocks)=>"Continue "+(blocks===1?"one":String(blocks))+" "+(blocks===1?"block":"blocks")+" "+dir+".",
        left:"left",right:"right",back:"around"
      },
      pair:{
        general:"Student A describes the place or route without pointing. Student B listens, chooses or moves, then explains the decision. Swap roles.",
        route:"Student A gives spoken directions without showing the solution. Student B traces the route on the map.",
        dialogue:"Student A is the tourist; Student B helps. Change roles and react naturally, without reading the options aloud.",
        transit:"Student A explains the timetable; Student B chooses the service and justifies it.",
        quest:"One student navigates, the other asks questions and checks every checkpoint."
      },
      profiles:{
        A1:{focus:"Names of places; basic directions",explore:"Name the place in a simple sentence.",route:"Go from Central Station to Market Square. Give three simple directions.",dialogue:"Use a short and polite question and reply.",guided:"Follow short, clearly stated directions.",transit:"Identify the correct bus number.",repair:"Choose LEFT or RIGHT and correct the mistake.",detour:"Follow a new path and name the directions.",quest:"Name each destination and give one simple direction.",model:"Go straight. Turn left. The square is here.",dialogueAnswer:"Yes. Go straight and turn left near the square.",speaking:"Use a short sentence such as: Go straight. Turn left.",stretch:"Add one place word or preposition.",support:"Use the compass arrows and the name of the place."},
        A2:{focus:"Sequencing, landmarks and simple questions",explore:"Explain which building matches the clue.",route:"Find the museum and give directions in order.",dialogue:"Ask for clarification and answer politely.",guided:"Follow turns and simple landmark references.",transit:"Choose the right bus and departure time.",repair:"Explain which turn is incorrect.",detour:"Describe an alternative route.",quest:"Give two-step directions between checkpoints.",model:"Go straight for three blocks, then turn left. The museum is ahead.",dialogueAnswer:"Of course. From Central Station, walk east for three blocks. Turn left and walk north for two more blocks. City Museum is at that crossroads.",speaking:"Use first, then and finally.",stretch:"Add an approximate distance or a landmark.",support:"Use sequence words and a simple street description."},
        B1:{focus:"Independent directions and conversation repair",explore:"Justify your choice using the clue.",route:"Find the museum and explain the route in full sentences.",dialogue:"Explain directions and repair misunderstandings.",guided:"Follow a multi-step set of directions.",transit:"Choose the service, departure and destination stop.",repair:"Correct and explain an inaccurate instruction.",detour:"Explain the impact of a street closure.",quest:"Connect three locations and give clear spoken directions.",model:"Walk east along Station Road, then turn left and continue north to the City Museum.",dialogueAnswer:"Certainly. Walk east for three blocks, turn left and continue north for two blocks. You'll see the museum.",speaking:"Use directions, landmarks and a polite ending.",stretch:"Compare your route with a different possible route.",support:"Use clear imperatives and ask if the listener understands."},
        B2:{focus:"Alternatives, reasons and accurate sequencing",explore:"Support your answer with a relevant explanation.",route:"Visit Market Square on your way to the museum and justify that choice.",dialogue:"Give precise directions and adapt your answer.",guided:"Follow an alternative route and explain each turn.",transit:"Select a service arriving on time and justify your choice.",repair:"Explain why the mistake could cause confusion.",detour:"Compare two viable routes around roadworks.",quest:"Compare your chosen route with a possible alternative.",model:"I would go via Market Square, then continue towards the museum; this route makes the main landmarks easy to identify.",dialogueAnswer:"I'd suggest heading east towards Market Square, then taking the northbound street to the museum. It's a straightforward route with visible landmarks.",speaking:"Give a reason, an alternative and a clarification.",stretch:"Consider accessibility or the traveller's priorities.",support:"Use expressions such as I'd recommend, alternatively and because."},
        C1:{focus:"Precision, register and negotiating constraints",explore:"Explain the location accurately without relying on the name.",route:"Pass the Library before reaching the museum and justify your itinerary.",dialogue:"Adapt your register and handle a visitor's uncertainty.",guided:"Follow complex directions without losing orientation.",transit:"Account for step-free access and a strict arrival deadline.",repair:"Correct the error tactfully and eliminate ambiguity.",detour:"Defend an efficient and accessible alternative.",quest:"Manage a multi-stop itinerary with clear explanations.",model:"Given the requirement to pass the library, I'd head north from the station, cross the centre towards the library and then approach the museum from the east.",dialogueAnswer:"Certainly. From Central Station, walk two blocks east, then turn left and go one block north to Market Square. Turn right, go one block east, then left for one block north to City Museum. The key is to turn east at Market Square rather than continue north.",speaking:"Clarify assumptions, justify priorities and adapt your register.",stretch:"Offer an alternative and discuss its trade-offs.",support:"Use conditional phrasing, precise landmarks and tactful clarification."},
        C2:{focus:"Nuance, ambiguity and pragmatic mediation",explore:"Give an unambiguous description and consider alternative interpretations.",route:"Reach the museum via the Library while avoiding roadworks; explain any trade-offs.",dialogue:"Resolve ambiguity and respond diplomatically under changing constraints.",guided:"Interpret detailed directions and restate them without ambiguity.",transit:"Defend the most reliable step-free journey under time pressure.",repair:"Identify the hidden contradiction and reformulate diplomatically.",detour:"Develop a robust contingency route and explain the decision.",quest:"Guide a visitor through three stops while managing uncertainty and expectations.",model:"In view of the closure and the planned stop at the library, I'd recommend a northbound approach via the centre, followed by a short westward section towards the museum.",dialogueAnswer:"Of course. To make the directions unambiguous, walk two blocks east from Central Station, turn left and go one block north to Market Square. From there, turn right for one block east, then left for one block north to City Museum. Please do not keep going north from the square: the eastward turn is essential.",speaking:"Use nuanced, concise, audience-aware directions and anticipate misunderstandings.",stretch:"Reflect on competing priorities and defend a contingency plan.",support:"Distinguish facts from estimates and explicitly check the listener's understanding."}
      }
    },
    es:{
      name:"Spanish",native:"Español",locale:"es",short:"ES",
      ui:{
        language:"Idioma",level:"Nivel",mode:"Modalidad",solo:"Individual",pair:"En parejas",
        station:"Estación",completed:"misiones completadas",choose:"Elige una respuesta",
        next:"Siguiente estación",restart:"Empezar de nuevo",undo:"Deshacer",check:"Comprobar",
        retry:"Inténtalo otra vez",correct:"¡Correcto!",notQuite:"No exactamente. Prueba otra respuesta.",
        mission:"Tu misión",progress:"Progreso",model:"Respuesta modelo",reveal:"Mostrar ejemplo",
        selfcheck:"Di tu respuesta en voz alta antes de consultar el modelo. La expresión oral no se graba ni se califica automáticamente.",
        selfdone:"He hablado y comprobado mi respuesta",finish:"Misión completada",
        compass:"Avanza una manzana",east:"Este",west:"Oeste",north:"Norte",south:"Sur",
        from:"Desde",to:"Hasta",blocks:"manzanas",remaining:"manzanas hasta el destino",
        route:"Ruta",line:"Línea",departure:"Salida",arrival:"Llegada",stop:"Destino",
        plan:"Planifica el trayecto",closed:"CALLE CORTADA",map:"Mapa de la ciudad",hint:"Pista",
        vocabulary:"Vocabulario",speaking:"Reto oral",yourTurn:"Tu turno",
        feedback:"Comentarios",help:"Ayuda lingüística",alternative:"Otra ruta posible",
        checkpoint:"Parada",score:"Respuestas correctas",roleA:"Estudiante A",roleB:"Estudiante B",
        switch:"Cambiad los papeles",goal:"Objetivo",ready:"Listo",review:"Revisar",
        changeSession:"Cambiar de idioma o nivel reinicia esta sesión local.",
        offline:"Funciona sin servidor. No se envían ni guardan datos del alumnado.",
        skip:"Saltar por ahora",narrator:"Turista",answer:"Tu respuesta",restartScene:"Reiniciar diálogo",
        showHint:"Mostrar pista",arrived:"¡Has llegado!",step:"Paso",
        partnerIntro:"Trabajad en parejas. Una persona lee la situación y la otra responde sin consultar el modelo. Después, intercambiad los papeles.",
        objective:"Comunica con claridad; no basta con elegir una opción.",
        wrongRoad:"La calle está cortada. Busca otra ruta.",illegal:"Avanza solo una manzana cada vez.",
        end:"Fin de la actividad",restartStation:"Reiniciar estación",same:"Ya estás aquí.",
        guide:"Lee las indicaciones y elige la calle correspondiente.",
        transportWhy:"Explica por qué has elegido este servicio y no los otros.",
        noSpeechGrade:"La expresión oral se valora mediante autoevaluación o evaluación entre compañeros, no con un algoritmo.",
        select:"Selecciona...",confirm:"Confirmar respuesta",dialogueError:"Intenta responder de forma más útil y precisa.",
        left:"Izquierda",right:"Derecha",straight:"Todo recto",
        via:"pasando por",roleMode:"Actividad en parejas",checkRoute:"Comprobar ruta",passCheckpoint:"Continuar a la siguiente parada",
        training:"Práctica del idioma",routeCompleted:"Ruta completada",challengeFinished:"Reto completado",
        directions:"Indicaciones",speakNow:"Explica la ruta en voz alta",city:"Riverton",
        start:"Estación Central",museum:"Museo de la Ciudad",square:"Plaza del Mercado",library:"Biblioteca",hospital:"Hospital",
        departureBoard:"Panel de salidas",arrivalBefore:"Llegar antes de",accessible:"Servicio accesible, sin escalones",
        feedbackGood:"Muy bien. La ruta y las respuestas son correctas.",
        feedbackRetry:"Revisa la calle, la dirección o los requisitos e inténtalo de nuevo."
      },
      places:{station:"Estación Central",museum:"Museo de la Ciudad",hospital:"Hospital",library:"Biblioteca",square:"Plaza del Mercado",park:"Parque de la Ribera",cafe:"Cafetería Amanecer",post:"Oficina de Correos"},
      mapLabels:{
        "CENTRAL STATION":"ESTACIÓN CENTRAL","CITY MUSEUM":"MUSEO DE LA CIUDAD",
        "FARMERS MARKET":"MERCADO","CITY SCHOOL":"ESCUELA","THE HOTEL":"HOTEL","HOSPITAL":"HOSPITAL",
        "ROSE GARDEN":"ROSAL","GREEN SQUARE":"PLAZA VERDE","MARKET SQUARE":"PLAZA DEL MERCADO",
        "CITY GREEN":"ZONA VERDE","RIVERSIDE PARK":"PARQUE RIBEREÑO","BAKERY":"PANADERÍA",
        "SUNRISE CAFÉ":"CAFETERÍA","THEATRE":"TEATRO","LIBRARY":"BIBLIOTECA",
        "MAPLE GROVE":"ARBOLEDA","POST OFFICE":"CORREOS","CINEMA":"CINE","SHOPS":"TIENDAS"
      },
      stations:[
        ["Explora la ciudad","Identifica lugares con pistas y amplía el vocabulario."],
        ["Encuentra la ruta","Elige las calles y explica cómo llegar."],
        ["Pide indicaciones","Participa en una conversación con un turista."],
        ["Sigue mis indicaciones","Avanza siguiendo instrucciones sucesivas."],
        ["Coge el autobús correcto","Lee los horarios y elige el servicio adecuado."],
        ["¡Te has equivocado de calle!","Detecta y corrige indicaciones erróneas."],
        ["Un desvío inesperado","Adapta la ruta cuando hay una calle cortada."],
        ["La gran misión urbana","Visita varias paradas y explica tus decisiones."]
      ],
      clues:[
        "Tu tren acaba de llegar. ¿Dónde estás?",
        "Una persona quiere ver objetos históricos. ¿Adónde debe ir?",
        "Alguien necesita atención médica urgente. ¿A qué lugar va?",
        "Quieres llevarte una novela prestada. ¿Adónde vas?",
        "Quedas con una amiga junto a la fuente del centro.",
        "Quieres pasear entre árboles al lado del río."
      ],
      travel:{
        opening:"Necesito ir al hospital. ¿Qué línea debo coger?",
        before:"Son las 08:35 y necesitas llegar al hospital antes de las 09:10.",
        access:"La persona necesita un vehículo accesible, sin escalones, y debe llegar antes de las 09:10.",
        complex:"Son las 08:35. Una persona con movilidad reducida debe llegar al hospital antes de las 09:10. Recomienda un servicio directo y accesible, justifica su fiabilidad y explica por qué las otras líneas al hospital no son adecuadas.",
        line7:"Parque de la Ribera",line12:"Museo de la Ciudad",line24:"Hospital",
        why:"La línea 24 sale a las 08:47 y llega al hospital a las 09:05. Es un servicio directo y accesible.",
        lineWrong:"Esa línea tiene otro destino.",
        timeWrong:"Comprueba la hora de salida de la línea correcta.",
        stopWrong:"La parada de destino debe ser el hospital.",
        late:"Este autobús llega después de las 09:10. Compara las horas de llegada, no solo el destino.",
        notAccessible:"Este servicio no es accesible sin escalones. Elige uno adecuado para la persona.",
        missing:"Completa todas las opciones necesarias."
      },
      repair:{
        incorrect:"Desde la Estación Central, camina tres manzanas hacia el este. Gira a la DERECHA y sigue dos manzanas hacia el norte para llegar al museo.",
        identify:["Camina tres manzanas hacia el este","Gira a la DERECHA","Sigue dos manzanas hacia el norte"],
        fixes:["Gira a la IZQUIERDA y sigue hacia el norte","Continúa hacia el SUR dos manzanas","Gira a la IZQUIERDA y sigue hacia el OESTE"],
        repairWhy:"Si miras al este, al girar a la derecha vas hacia el sur. Para ir al norte, gira a la izquierda.",
        notYet:"El error está en el giro, no en el número de manzanas.",
        polite:"Perdone, le he indicado mal el giro. Gire a la izquierda y continúe hacia el norte."
      },
      dialogue:{
        opening:"Disculpe, ¿podría indicarme cómo llegar al museo?",
        clarify:"Lo siento, no conozco Riverton. ¿Podría explicármelo mejor?",
        mistake:"Mi mapa señala la dirección contraria. ¿Está seguro?",
        followup:"¡Gracias! ¿Está muy lejos andando?",
        end:"Muchas gracias por su ayuda. ¡Que tenga un buen día!",
        vague:"Está por el centro, más o menos. Lo encontrará.",
        wrong:"Vaya hacia el oeste, en dirección al río.",
        fix:"Tiene razón, disculpe. Voy a corregir mis indicaciones.",
        badFix:"Ignore el mapa y siga andando.",
        distance:"Está a unas cinco manzanas. Si quiere, se lo enseño en el mapa.",
        badDistance:"No tengo ni idea. Siga andando.",
        goodbye:"¡De nada! Disfrute de la visita.",
        good:"Indicaciones claras y adecuadas.",
        repairGood:"Bien: has reconocido el error y lo has corregido.",
        unclear:"El turista necesita indicaciones más concretas.",
        wrongFeedback:"Esa dirección alejaría al turista del museo.",
        final:"Has ayudado al turista. Compara tu respuesta con el modelo."
      },
      directions:{
        north:"norte",east:"este",south:"sur",west:"oeste",
        first:(dir,blocks)=>"Camina "+(blocks===1?"una":String(blocks))+" "+(blocks===1?"manzana":"manzanas")+" hacia el "+dir+".",
        turn:(side,dir,blocks)=>"Gira a la "+side+" y camina "+(blocks===1?"una":String(blocks))+" "+(blocks===1?"manzana":"manzanas")+" hacia el "+dir+".",
        continue:(dir,blocks)=>"Sigue "+(blocks===1?"una":String(blocks))+" "+(blocks===1?"manzana":"manzanas")+" hacia el "+dir+".",
        left:"izquierda",right:"derecha",back:"vuelve atrás"
      },
      pair:{
        general:"El estudiante A describe el lugar o la ruta sin señalarlo. El B escucha, elige o se desplaza y explica su decisión. Después, intercambiad los papeles.",
        route:"El estudiante A da indicaciones orales sin mostrar la solución. El B traza la ruta en el mapa.",
        dialogue:"El estudiante A hace de turista y el B le ayuda. Intercambiad los papeles y reaccionad de forma natural.",
        transit:"El estudiante A explica el horario; el B elige el autobús y justifica la decisión.",
        quest:"Una persona guía y la otra pregunta y comprueba cada parada."
      },
      profiles:{
        A1:{focus:"Lugares de la ciudad y direcciones básicas",explore:"Di el nombre del lugar en una frase sencilla.",route:"Ve de la Estación Central a la Plaza del Mercado. Da tres indicaciones sencillas.",dialogue:"Haz una pregunta breve y educada.",guided:"Sigue indicaciones cortas y claras.",transit:"Identifica el número de autobús correcto.",repair:"Elige IZQUIERDA o DERECHA y corrige el error.",detour:"Busca otra ruta y nombra las direcciones.",quest:"Nombra cada lugar y da una indicación sencilla.",model:"Sigue recto. Gira a la izquierda. La plaza está aquí.",dialogueAnswer:"Sí. Siga recto y gire a la izquierda cerca de la plaza.",speaking:"Usa frases cortas: Sigue recto. Gira a la izquierda.",stretch:"Añade un lugar o una preposición.",support:"Utiliza las flechas y el nombre del lugar."},
        A2:{focus:"Secuencias, puntos de referencia y preguntas",explore:"Explica qué lugar corresponde a la pista.",route:"Encuentra el museo y explica los pasos en orden.",dialogue:"Pide aclaraciones y responde con cortesía.",guided:"Sigue giros y referencias sencillas.",transit:"Elige la línea y la hora de salida.",repair:"Explica qué giro es incorrecto.",detour:"Describe una ruta alternativa.",quest:"Da indicaciones de dos pasos entre paradas.",model:"Sigue recto tres manzanas y después gira a la izquierda. El museo está más adelante.",dialogueAnswer:"Claro. Desde Central Station, camine tres manzanas hacia el este, gire a la izquierda y avance otras dos manzanas hacia el norte. Encontrará City Museum en ese cruce.",speaking:"Utiliza primero, después y por último.",stretch:"Añade una distancia aproximada o un punto de referencia.",support:"Utiliza conectores y descripciones sencillas."},
        B1:{focus:"Indicaciones autónomas y aclaración de errores",explore:"Justifica la respuesta con información de la pista.",route:"Encuentra el museo y explica la ruta con frases completas.",dialogue:"Da indicaciones y resuelve malentendidos.",guided:"Sigue varias instrucciones consecutivas.",transit:"Elige línea, hora y parada de destino.",repair:"Corrige y explica una indicación equivocada.",detour:"Explica las consecuencias de una calle cortada.",quest:"Conecta tres lugares y explica cómo llegar.",model:"Camina hacia el este por la calle de la Estación, gira a la izquierda y sigue hacia el norte hasta el museo.",dialogueAnswer:"Por supuesto. Camine tres manzanas hacia el este, gire a la izquierda y continúe dos manzanas hacia el norte. Verá el museo.",speaking:"Incluye direcciones, referencias y una despedida cortés.",stretch:"Compara tu ruta con otra posibilidad.",support:"Utiliza el imperativo y comprueba que la otra persona entiende."},
        B2:{focus:"Alternativas, justificación y precisión",explore:"Justifica tu elección con un razonamiento.",route:"Pasa por la Plaza del Mercado y explica por qué has elegido esa ruta.",dialogue:"Da indicaciones precisas y adapta la respuesta.",guided:"Sigue una ruta alternativa y explica los giros.",transit:"Elige un servicio puntual y justifica la elección.",repair:"Explica por qué el error puede causar confusión.",detour:"Compara dos rutas posibles para evitar las obras.",quest:"Compara tu itinerario con otra alternativa.",model:"Recomendaría pasar por la Plaza del Mercado y continuar hacia el museo; así resulta más fácil reconocer los puntos de referencia.",dialogueAnswer:"Le aconsejaría dirigirse hacia la Plaza del Mercado y continuar por la calle que va hacia el norte hasta el museo. Es una ruta fácil de seguir.",speaking:"Justifica tu propuesta, ofrece otra opción y aclara dudas.",stretch:"Ten en cuenta la accesibilidad y las prioridades del visitante.",support:"Usa expresiones como recomendaría, en cambio o ya que."},
        C1:{focus:"Precisión, registro y negociación de condiciones",explore:"Describe el lugar con precisión sin mencionar su nombre.",route:"Pasa por la Biblioteca antes del museo y justifica el itinerario.",dialogue:"Adapta el registro y responde a las dudas del visitante.",guided:"Sigue indicaciones complejas sin perder la orientación.",transit:"Ten en cuenta la accesibilidad y la hora límite.",repair:"Corrige con tacto y elimina la ambigüedad.",detour:"Defiende una alternativa eficaz y accesible.",quest:"Organiza varias paradas con explicaciones claras.",model:"Dado que debe pasar por la Biblioteca, iría hacia el norte desde la estación, cruzaría el centro y finalmente llegaría al museo desde el este.",dialogueAnswer:"Con mucho gusto. Desde Central Station, avance dos manzanas hacia el este y gire a la izquierda: tras una manzana al norte llegará a Market Square. Allí gire a la derecha, camine una manzana hacia el este y después gire a la izquierda para avanzar una manzana al norte hasta City Museum. El giro al este en la plaza es fundamental.",speaking:"Aclara suposiciones, justifica prioridades y adapta el registro.",stretch:"Ofrece otra opción y explica sus ventajas e inconvenientes.",support:"Usa estructuras condicionales, referencias precisas y fórmulas corteses."},
        C2:{focus:"Matices, ambigüedad y mediación pragmática",explore:"Describe el lugar sin ambigüedades y considera interpretaciones alternativas.",route:"Llega al museo pasando por la Biblioteca y evitando las obras; justifica las prioridades.",dialogue:"Resuelve ambigüedades con tacto ante condiciones cambiantes.",guided:"Interpreta indicaciones detalladas y reformúlalas sin ambigüedades.",transit:"Defiende el trayecto accesible más fiable bajo presión temporal.",repair:"Identifica la contradicción y reformula las instrucciones de manera diplomática.",detour:"Elabora un itinerario alternativo fiable y explica la decisión.",quest:"Guía a una persona por tres lugares, gestionando dudas y expectativas.",model:"Teniendo en cuenta las obras y la parada en la Biblioteca, convendría atravesar el centro por el norte y acercarse después al museo desde el este.",dialogueAnswer:"Desde luego. Para evitar cualquier ambigüedad, desde Central Station camine dos manzanas hacia el este, gire a la izquierda y avance una manzana al norte hasta Market Square. Desde la plaza, gire a la derecha una manzana hacia el este y luego a la izquierda una manzana hacia el norte hasta City Museum. No continúe recto hacia el norte desde la plaza: debe girar al este.",speaking:"Da indicaciones concisas, matizadas y adaptadas al interlocutor; anticipa confusiones.",stretch:"Sopesa prioridades contrapuestas y justifica un plan alternativo.",support:"Distingue hechos de estimaciones y comprueba explícitamente la comprensión."}
      }
    }
  };
  return Object.freeze({languages:Object.freeze(languages),levels:Object.freeze(levels),packs:packs,
    pack:function(code){const p=packs[code];if(!p)throw new RangeError("Unsupported language: "+code);return p;},
    profile:function(code,level){const p=this.pack(code);if(!levels.includes(level))throw new RangeError("Unsupported CEFR level: "+level);return p.profiles[level];}
  });
});
