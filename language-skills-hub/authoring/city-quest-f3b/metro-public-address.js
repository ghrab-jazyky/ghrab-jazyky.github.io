/* CITY QUEST F3B — public-address simulation and scene semantics.
 * The scripted PA is TEXT ONLY. Brief original chimes are synthesised locally
 * by the F3A sound engine when the user explicitly enables them.
 * Never synthesize remote speech, call fetch, or infer answers the learner has
 * not yet chosen. Official Riverton station names remain in English.
 */
(function(root,factory){
 "use strict";
 const network=root.RivertonMetro||(typeof require==="function"?require("../city-quest-f2-1b/metro-network.js"):null);
 const api=factory(network);
 if(root)root.RivertonMetroPublicAddress=api;
 if(typeof module==="object"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(M){
 "use strict";
 if(!M)throw Error("Metro network missing for F3B public-address simulation.");
 const languages=["en","es","de","fr"],levels=["B1","B2","C1","C2"];
 const phaseMap=Object.freeze({
  "walk-to-entrance":"city",enter:"city",notice:"notice",
  "select-line":"wayfinding","select-direction":"direction","select-platform":"platform",
  board:"boarding",ride:"onboard",transfer:"transfer",exit:"arrival",
  checkpoint:"speaking","walk-to-museum":"city",speech:"speaking",complete:"complete"
 });
 const levelPrompt={
  en:{
   B1:"Say the main information in a short, clear sentence.",
   B2:"Explain why this information matters for your route.",
   C1:"Rephrase the notice for someone who misunderstood it.",
   C2:"Give a concise formal announcement and a reassuring informal version."
  },
  es:{
   B1:"Repite la información esencial en una frase clara.",
   B2:"Explica por qué esta información importa para tu trayecto.",
   C1:"Reformula el aviso para alguien que no lo ha entendido.",
   C2:"Da un anuncio formal y una explicación informal, ambos concisos."
  },
  de:{
   B1:"Gib die wichtigste Information in einem kurzen Satz wieder.",
   B2:"Begründe, warum diese Information für deinen Weg wichtig ist.",
   C1:"Formuliere den Hinweis für eine Person um, die ihn falsch verstanden hat.",
   C2:"Gib eine knappe formelle Durchsage und eine beruhigende informelle Erklärung."
  },
  fr:{
   B1:"Reformule l'information essentielle en une phrase claire.",
   B2:"Explique pourquoi cette information compte pour ton trajet.",
   C1:"Reformule l'avis pour une personne qui l'a mal compris.",
   C2:"Propose une annonce formelle concise et une explication informelle rassurante."
  }
 };
 const dict={
  en:{
   marker:"RIVERTON PUBLIC ADDRESS · TEXT SIMULATION",
   status:"Service information",city:["WAYFINDING","Follow the city map to the metro entrance. The line choice is yours."],
   notice:["SERVICE NOTICE","The M1 link between Old Town and Museum Quarter is closed. Check the network before choosing your route."],
   wayfinding:["STATION CONCOURSE","You are at {station}. Check the network and decide which line to take."],
   direction:["DEPARTURE BOARD","Read the terminus on the train sign carefully. The next stop and the terminus are different."],
   platform:["PLATFORM INFORMATION","Match the line and final destination to the platform signs before boarding."],
   boarding:["READY TO BOARD","Line {line}, towards {terminus}, platform {platform}. Please stand clear of the doors."],
   onboard:["ON BOARD","You are travelling on {line}. Next station: {next}."],
   transfer:["INTERCHANGE","You are at {station}. Follow the interchange signs, then choose the connecting line."],
   arrival:["DESTINATION","You have reached {station}. Follow the exit signs and explain your route."],
   speaking:["SPEAKING CHECKPOINT","Explain your journey aloud. The application does not record or grade your speech."],
   complete:["JOURNEY COMPLETE","Your route has been verified. Spoken language was self-assessed."],
   noNext:"destination",open:"TRAIN DOORS OPEN",ride:"NEXT STATION"
  },
  es:{
   marker:"MEGAFONÍA DE RIVERTON · SIMULACIÓN ESCRITA",
   status:"Información de servicio",city:["ORIENTACIÓN","Consulta el plano urbano para llegar a la entrada del metro. Tú decides la línea."],
   notice:["AVISO DE SERVICIO","Está cortado el tramo M1 entre Old Town y Museum Quarter. Consulta la red antes de elegir una ruta."],
   wayfinding:["VESTÍBULO","Estás en {station}. Consulta el plano y decide qué línea tomar."],
   direction:["PANEL DE SALIDAS","Fíjate en la estación terminal que aparece en el tren. No es lo mismo que la próxima parada."],
   platform:["INFORMACIÓN DEL ANDÉN","Comprueba la línea y el destino final en los carteles antes de subir."],
   boarding:["EMBARQUE","Línea {line}, dirección {terminus}, andén {platform}. Mantente alejado de las puertas."],
   onboard:["A BORDO","Viajas en la línea {line}. Próxima estación: {next}."],
   transfer:["TRANSBORDO","Estás en {station}. Sigue las señales de correspondencia y elige la línea de conexión."],
   arrival:["DESTINO","Has llegado a {station}. Sigue las señales de salida y explica el trayecto."],
   speaking:["PRÁCTICA ORAL","Explica el trayecto en voz alta. La aplicación no graba ni califica tu intervención."],
   complete:["VIAJE COMPLETADO","Tu recorrido se ha comprobado. La expresión oral se ha autoevaluado."],
   noNext:"destino",open:"PUERTAS ABIERTAS",ride:"PRÓXIMA ESTACIÓN"
  },
  de:{
   marker:"RIVERTON-BAHNHOFSDURCHSAGE · TEXTSIMULATION",
   status:"Fahrgastinformation",city:["ORIENTIERUNG","Folge dem Stadtplan bis zum Metroeingang. Die Wahl der Linie liegt bei dir."],
   notice:["BETRIEBSMELDUNG","Der M1-Abschnitt zwischen Old Town und Museum Quarter ist gesperrt. Prüfe das Netz vor der Routenwahl."],
   wayfinding:["BAHNHOFSHALLE","Du bist an der Station {station}. Lies den Linienplan und entscheide selbst, welche Linie passt."],
   direction:["ABFAHRTSTAFEL","Achte auf die Endstation am Zug. Endstation und nächste Haltestelle sind nicht dasselbe."],
   platform:["BAHNSTEIGINFORMATION","Gleiche Linie und Endstation mit der Beschilderung ab, bevor du einsteigst."],
   boarding:["EINSTIEG","Linie {line}, Richtung {terminus}, Bahnsteig {platform}. Bitte von den Türen zurückbleiben."],
   onboard:["IM METROZUG","Du fährst mit Linie {line}. Nächste Station: {next}."],
   transfer:["UMSTEIGEN","Du bist an der Station {station}. Folge den Umsteigeschildern und wähle dann die Anschlusslinie."],
   arrival:["ZIELSTATION","Du hast {station} erreicht. Folge den Ausgängen und erkläre die Strecke."],
   speaking:["SPRECHAUFGABE","Erkläre deinen Weg laut. Die Anwendung zeichnet Sprache nicht auf und bewertet sie nicht."],
   complete:["FAHRT BEENDET","Der Fahrweg wurde überprüft. Die Sprechleistung wurde selbst eingeschätzt."],
   noNext:"Ziel",open:"TÜREN GEÖFFNET",ride:"NÄCHSTE STATION"
  },
  fr:{
   marker:"SONORISATION DE RIVERTON · SIMULATION ÉCRITE",
   status:"Information voyageurs",city:["ORIENTATION","Suis le plan de la ville jusqu'à l'entrée du métro. À toi de choisir la ligne."],
   notice:["AVIS DE PERTURBATION","Le tronçon M1 entre Old Town et Museum Quarter est fermé. Consulte le plan avant de choisir ton itinéraire."],
   wayfinding:["HALL DE STATION","Tu es à {station}. Consulte le plan et choisis toi-même la ligne à emprunter."],
   direction:["TABLEAU DES DÉPARTS","Vérifie le terminus indiqué sur le train. Le terminus n'est pas forcément le prochain arrêt."],
   platform:["INFORMATION QUAI","Vérifie la ligne et la destination finale sur les panneaux avant de monter."],
   boarding:["EMBARQUEMENT","Ligne {line}, direction {terminus}, quai {platform}. Éloignez-vous des portes, s'il vous plaît."],
   onboard:["À BORD DU MÉTRO","Tu voyages sur la ligne {line}. Prochaine station : {next}."],
   transfer:["CORRESPONDANCE","Tu es à {station}. Suis les panneaux de correspondance avant de choisir la ligne suivante."],
   arrival:["ARRIVÉE","Tu es arrivé à {station}. Suis les panneaux de sortie et explique ton trajet."],
   speaking:["EXPRESSION ORALE","Explique ton trajet à voix haute. L'application n'enregistre ni ne note ta parole."],
   complete:["TRAJET TERMINÉ","Ton trajet a été vérifié. L'expression orale a été autoévaluée."],
   noNext:"destination",open:"PORTES OUVERTES",ride:"PROCHAINE STATION"
  }
 };
 const replace=(text,vars)=>text.replace(/\{(station|next|terminus|line|platform)\}/g,
  (_,key)=>String(vars[key]??""));
 function validateState(state){
  if(!state||![5,6,7,8].includes(state.stationNumber)||!phaseMap[state.phase])
   throw TypeError("Unsupported metro scene state.");
  const scenario=M.scenario(state.scenarioId);
  if(!scenario||scenario.stationNumber!==state.stationNumber)
   throw Error("Mission and metro scenario mismatch.");
  const station=M.station(state.metroStation);
  if(!station)throw Error("Unknown current metro station.");
  return {scenario,station};
 }
 function pack(lang,level,state){
  if(!languages.includes(lang)||!levels.includes(level))throw RangeError("Unsupported language or CEFR.");
  const {scenario,station}=validateState(state),copy=dict[lang],kind=phaseMap[state.phase];
  const activeLeg=scenario.legs[state.legIndex],
   nextId=activeLeg?.stops[state.stopIndex+1]||null;
  const vars={
   station:station.labelEn,
   // Do not reveal a future answer before it has been selected by the player.
   line:state.lineId||"",
   platform:state.platform||"",
   terminus:state.direction?M.station(state.direction).labelEn:"",
   next:nextId?M.station(nextId).labelEn:copy.noNext
  };
  const [headline,body]=copy[kind];
  const cue=kind==="notice"?"warning":kind==="boarding"?"board":
   kind==="transfer"?"transfer":kind==="arrival"?"arrival":
   kind==="complete"?"complete":kind==="onboard"?"ride":null;
  const output=Object.freeze({
   kind,headline:replace(headline,vars),body:replace(body,vars),
   marker:copy.marker,focus:levelPrompt[lang][level],status:copy.status,
   cue,station:station.labelEn,phase:state.phase,terminus:vars.terminus,
   line:vars.line,platform:vars.platform,next:kind==="onboard"?vars.next:null,
   display:kind==="onboard"?copy.ride:kind==="boarding"?copy.open:headline,
   locale:lang,level,mission:state.stationNumber,warning:kind==="notice"
  });
  return output;
 }
 function validate(){
  for(const lang of languages){
   const c=dict[lang];if(!c||!c.marker||!c.status)throw Error("Missing PA locale "+lang);
   for(const kind of new Set(Object.values(phaseMap))){
    if(!Array.isArray(c[kind])||c[kind].some(s=>typeof s!=="string"||s.length<7))
     throw Error("Missing or too short "+lang+"/"+kind+" PA copy");
   }
   for(const level of levels)if(!levelPrompt[lang][level]||levelPrompt[lang][level].length<25)
    throw Error("Missing CEFR PA differentiation "+lang+"/"+level);
  }
  return true;
 }
 validate();
 return Object.freeze({languages,levels,phaseMap,dict,levelPrompt,pack,validate});
});
