/* City Quest F2: fully local client-side user interface for 4 languages x 6 CEFR levels.
 * Reuses verified F0 map artwork and F1 route/transit engines; no requests.
 */
(() => {
  "use strict";
  const C=window.CityQuestF2Content,G=window.CityQuestF2Engine,F=window.CityQuestF1Engine,E=window.CityQuestEngine,MG=window.RivertonMetroGame,LC=window.RivertonMetroLanguage;
  if(!C||!G||!F||!E)throw Error("City Quest F2 modules did not load in dependency order.");
  const $=id=>document.getElementById(id);
  // Data favicon: no network request and no external resource in offline export.
  const icon=document.createElement("link");icon.rel="icon";icon.type="image/svg+xml";
  icon.href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Crect width=%2764%27 height=%2764%27 rx=%2714%27 fill=%27%230d3a51%27/%3E%3Ctext x=%2732%27 y=%2742%27 text-anchor=%27middle%27 font-size=%2727%27 fill=%27white%27 font-family=%27sans-serif%27 font-weight=%27800%27%3ECQ%3C/text%3E%3C/svg%3E";
  document.head.appendChild(icon);
  const panel=$("f1Panel"),map=$("cityMap"),viewport=$("mapViewport");
  const cityLayout=document.querySelector(".layout"),citySidebar=panel.parentElement;
  const metroLab=$("metroLab"),metroSidebar=metroLab.querySelector(".metro-side");
  const metroNetworkCard=metroLab.querySelector(".metro-network-card"),metroPhoneQuery=window.matchMedia("(max-width:740px)");
  const NS="http://www.w3.org/2000/svg";
  const icons=["🗺️","🧭","💬","👣","🚌","↩️","🚧","🏆"];
  const stationKeys=["explore","route","dialogue","guided","transit","repair","detour","quest"];
  // Optional participation tracker. It verifies confirmations, never oral quality.
  const pairCopy={
    en:{title:"Pair speaking turns",first:"Person A speaks next",second:"Person B speaks next",
      action:"I have spoken · swap roles",complete:"Both turns confirmed · self-reported, not graded"},
    es:{title:"Turnos de conversación en pareja",first:"Ahora habla la persona A",second:"Ahora habla la persona B",
      action:"He hablado · cambiar los papeles",complete:"Dos turnos confirmados · autoevaluación, sin nota"},
    de:{title:"Sprechwechsel zu zweit",first:"Person A spricht jetzt",second:"Person B spricht jetzt",
      action:"Ich habe gesprochen · Rollen wechseln",complete:"Beide Beiträge bestätigt · Selbstauskunft, keine Benotung"},
    fr:{title:"Tours de parole en binôme",first:"À la personne A de parler",second:"À la personne B de parler",
      action:"J’ai parlé · échanger les rôles",complete:"Deux tours confirmés · autoévaluation, sans note"}
  };
  const gameType={en:"Interactive language game · city quest",es:"Juego interactivo de idiomas · aventura urbana",de:"Interaktives Sprachspiel · Stadtquest",fr:"Jeu de langue interactif · aventure urbaine"};
  const chromeCopy={
    en:{theme:"Toggle light/dark theme",detail:"Map detail",whole:"Whole city",tip:"Select Map detail to zoom in on street names",tipZoom:"Swipe across the city map to explore",kicker:"EXPLORE · NAVIGATE · COMMUNICATE",caption:"CITY ADVENTURE · WALKING MAP",compact:"Make direction pad smaller",expand:"Show full directions"},
    es:{theme:"Cambiar tema claro u oscuro",detail:"Ampliar mapa",whole:"Toda la ciudad",tip:"Amplía el mapa para leer las calles",tipZoom:"Desliza el mapa para explorar la ciudad",kicker:"EXPLORA · ORIÉNTATE · COMUNICA",caption:"AVENTURA URBANA · MAPA A PIE",compact:"Reducir controles",expand:"Mostrar indicaciones completas"},
    de:{theme:"Hell- oder Dunkelmodus wechseln",detail:"Kartendetails",whole:"Gesamte Stadt",tip:"Vergrößere die Karte, um Straßennamen zu lesen",tipZoom:"Wische über die Karte, um die Stadt zu erkunden",kicker:"ERKUNDEN · ORIENTIEREN · SPRECHEN",caption:"STADTABENTEUER · FUSSGÄNGERKARTE",compact:"Steuerfeld verkleinern",expand:"Alle Richtungen anzeigen"},
    fr:{theme:"Changer de thème clair ou sombre",detail:"Détail du plan",whole:"Vue générale",tip:"Agrandissez le plan pour lire les noms de rues",tipZoom:"Faites glisser le plan pour explorer la ville",kicker:"EXPLORER · S'ORIENTER · ÉCHANGER",caption:"AVENTURE URBAINE · PLAN PIÉTON",compact:"Réduire les commandes",expand:"Afficher toutes les directions"}
  };
  // CQ-F5-008: level-appropriate authored reception clues; correct landmark
  // answers remain the same, so the underlying verified evaluation is stable.
  const advancedExploreClues={"en":{"C1":["After an intercity rail journey, a traveller needs the building where the train arrived, not a local bus stop.","A visitor wishes to see curated artefacts illustrating the city's past, rather than borrow reference books.","A person injured in an accident needs urgent assessment by medical professionals, not a routine public service.","A reader hopes to take a novel home temporarily, without buying it or attending an exhibition.","Two colleagues need an outdoor public meeting point in the civic centre, not a station or private business. Choose the open space recognizable by its water feature.","The visitor wants a peaceful walk among trees adjoining the river rather than an indoor attraction."],"C2":["Distinguish the arrival point of an intercity rail service from nearby urban transport facilities. Which building does the situation imply?","The intention is to interpret objects preserved from earlier periods, not consult a circulating collection of books. Which institution meets that purpose?","When an injury requires prompt clinical intervention, which public institution is appropriate rather than a venue devoted to leisure or administration?","Unlike an exhibition venue, this institution allows reading material to circulate beyond its premises. Where should the reader go?","The meeting place must be central, outdoors, free to enter and distinct from both commercial premises and transport facilities. Which civic location satisfies every condition?","The destination combines public recreation, substantial greenery and proximity to a waterway, rather than the paved civic centre. Which site is intended?"],"B2":["The intercity train has just arrived, and travellers are collecting their luggage before leaving the building. Where are they?","A visitor wants to understand local history through objects on display rather than borrow books. Which place is most appropriate?","After an accident, someone requires prompt medical care, not merely advice about medicines. Which building should they find?","You need to borrow a novel to read at home without purchasing it. Which public service should you use?","Two friends agree to meet outdoors beside the central fountain, not at a café. Which location is best?","A tourist would like to walk among trees and relax close to the river. Which public place matches that plan?"]},"es":{"C1":["Después de llegar en un tren de larga distancia, una persona busca el edificio donde ha terminado su viaje, no una parada de autobús urbano.","Una visitante quiere contemplar objetos conservados que explican la historia de la ciudad, no llevarse libros prestados.","Una persona herida en un accidente necesita atención médica urgente, no acudir a un servicio administrativo.","Alguien quiere llevarse una novela a casa durante unos días sin comprarla ni visitar una exposición.","Dos colegas necesitan un punto de encuentro al aire libre en el centro, no una estación ni un negocio. Elige el espacio público reconocible por su elemento de agua ornamental.","La visitante prefiere pasear tranquilamente entre árboles cerca del río en lugar de entrar en un edificio."],"C2":["Distingue el punto de llegada de un ferrocarril interurbano de las instalaciones del transporte local. ¿Qué edificio se deduce de la situación?","La finalidad es interpretar objetos de épocas pasadas, no consultar una colección de libros disponibles para préstamo. ¿Qué institución corresponde?","Ante una lesión que exige una intervención clínica inmediata, ¿qué institución pública resulta adecuada, a diferencia de un espacio de ocio o administración?","A diferencia de un recinto expositivo, este servicio permite llevar material de lectura fuera del edificio durante un plazo determinado. ¿De cuál se trata?","El lugar de encuentro debe estar en el centro, ser público, abierto y gratuito, y no coincidir ni con un establecimiento comercial ni con una instalación de transporte. ¿Cuál reúne todos los requisitos?","El destino reúne vegetación, acceso público y cercanía inmediata a un curso de agua, frente a las zonas pavimentadas del centro. ¿Cuál sería?"],"B2":["El tren interurbano acaba de llegar y los viajeros recogen su equipaje antes de salir del edificio. ¿Dónde están?","Un visitante quiere conocer la historia local a través de objetos expuestos, no pedir libros prestados. ¿Qué lugar le recomendarías?","Después de un accidente, una persona necesita atención médica rápida y no solo consejos sobre medicamentos. ¿Qué edificio debe buscar?","Quieres llevarte una novela a casa durante unos días sin comprarla. ¿A qué servicio público debes acudir?","Dos amigos han quedado al aire libre junto a la fuente central, no dentro de una cafetería. ¿Dónde deberían encontrarse?","Una turista quiere pasear entre árboles y descansar cerca del río. ¿Qué espacio público responde a ese plan?"]},"de":{"C1":["Nach einer Fahrt mit dem Fernzug sucht eine Reisende das Gebäude, in dem ihr Zug angekommen ist, nicht die Haltestelle eines Stadtbusses.","Ein Besucher möchte historische Gegenstände in einer Ausstellung betrachten, statt Bücher auszuleihen.","Nach einem Unfall benötigt jemand dringend eine ärztliche Untersuchung und keinen allgemeinen Verwaltungsdienst.","Eine Leserin möchte einen Roman für einige Tage mit nach Hause nehmen, ohne ihn zu kaufen oder eine Ausstellung zu besuchen.","Zwei Kollegen suchen einen öffentlichen Treffpunkt im Freien im Stadtzentrum, nicht am Bahnhof oder in einem Geschäft. Welche offene Fläche ist an einer gestalteten Wasseranlage erkennbar?","Die Besucherin möchte in Ruhe zwischen Bäumen am Fluss spazieren gehen, statt eine Sehenswürdigkeit im Gebäude zu besuchen."],"C2":["Unterscheide den Ankunftsort eines Fernzuges von den Einrichtungen des städtischen Nahverkehrs. Welches Gebäude ist mit der Beschreibung gemeint?","Gesucht ist eine Einrichtung, in der Zeugnisse vergangener Epochen erschlossen werden, nicht eine Sammlung, aus der man Bücher mitnimmt. Welche ist es?","Welche öffentliche Einrichtung eignet sich bei einer Verletzung, die eine sofortige medizinische Behandlung erfordert, statt für Freizeit- oder Verwaltungstätigkeiten?","Im Gegensatz zu einer Ausstellung dürfen hier Bücher für einen befristeten Zeitraum außer Haus genutzt werden. Welche Einrichtung wird beschrieben?","Der Treffpunkt muss zentral, öffentlich, im Freien und ohne Eintritt zugänglich sein und darf weder ein Geschäft noch ein Verkehrsknotenpunkt sein. Welcher Ort erfüllt sämtliche Bedingungen?","Gesucht wird ein öffentlich zugänglicher Erholungsort mit Bäumen unmittelbar an einem Fluss und nicht die versiegelte Mitte der Stadt. Wo befindet er sich?"],"B2":["Der Fernzug ist gerade angekommen, und die Reisenden holen ihr Gepäck ab, bevor sie das Gebäude verlassen. Wo befinden sie sich?","Ein Besucher möchte die Stadtgeschichte anhand ausgestellter Gegenstände kennenlernen und keine Bücher ausleihen. Welcher Ort passt?","Nach einem Unfall benötigt jemand schnell ärztliche Hilfe und nicht nur Ratschläge zu Medikamenten. Welches Gebäude sollte die Person aufsuchen?","Du möchtest einen Roman einige Tage zu Hause lesen, ohne ihn zu kaufen. Welche öffentliche Einrichtung hilft dir dabei?","Zwei Freunde wollen sich draußen am zentralen Brunnen treffen, nicht in einem Café. Welcher Ort eignet sich?","Eine Touristin möchte zwischen Bäumen spazieren gehen und sich in Flussnähe erholen. Welche öffentliche Anlage passt dazu?"]},"fr":{"C1":["Après un trajet en train interurbain, une personne cherche le bâtiment où son train est arrivé, et non un arrêt de bus local.","Une visiteuse souhaite découvrir des objets exposés qui témoignent de l'histoire de la ville, plutôt qu'emprunter des livres.","À la suite d'un accident, une personne blessée a besoin de soins médicaux urgents, et non d'un service administratif.","Une lectrice souhaite emporter un roman chez elle pour quelques jours sans l'acheter ni visiter une exposition.","Deux collègues souhaitent se retrouver dans un espace public en plein air au centre-ville, plutôt qu'à la gare ou dans un commerce. Quel lieu est reconnaissable à son aménagement d'eau décoratif ?","Le visiteur préfère se promener parmi les arbres au bord de la rivière plutôt que visiter un lieu couvert."],"C2":["Distinguez le lieu d'arrivée d'un train interurbain des installations de transport urbain voisines. Quel bâtiment la situation désigne-t-elle ?","Le but est d'interpréter des objets conservés d'époques anciennes, et non de consulter une collection de livres destinés au prêt. Quelle institution convient ?","Lorsqu'une blessure exige une prise en charge médicale immédiate, quelle institution publique est adaptée, plutôt qu'un lieu de loisirs ou d'administration ?","À la différence d'un espace d'exposition, ce service permet d'emporter des ouvrages pour une durée limitée. De quel établissement s'agit-il ?","Le lieu de rendez-vous doit être central, public, à ciel ouvert et d'accès gratuit, sans être un commerce ni un pôle de transport. Quel espace répond à l'ensemble de ces conditions ?","L'endroit recherché associe végétation, loisirs accessibles au public et proximité immédiate d'un cours d'eau, plutôt que le centre pavé. Où faut-il aller ?"],"B2":["Le train interurbain vient d'arriver et les voyageurs récupèrent leurs bagages avant de quitter le bâtiment. Où se trouvent-ils ?","Un visiteur souhaite découvrir l'histoire locale grâce à des objets exposés plutôt qu'emprunter des livres. Quel lieu lui conviendrait ?","Après un accident, une personne a besoin de soins médicaux rapides, et non simplement de conseils sur les médicaments. Quel bâtiment doit-elle chercher ?","Vous souhaitez emprunter un roman pour le lire chez vous pendant quelques jours sans l'acheter. À quel service public vous adresser ?","Deux amis ont rendez-vous dehors près de la fontaine centrale, et non dans un café. Quel endroit devraient-ils choisir ?","Une touriste souhaite se promener parmi les arbres et se reposer au bord de la rivière. Quel espace public correspond à son projet ?"]}};
  // CQ-F5-008: advanced visitor prompts require precise clarification and
  // pragmatic repair, while preserving the same fully local choice engine.
  const advancedDialogueScenes={"en":{"C1":{"start":"Excuse me. I am visiting for the first time and would prefer directions using definite crossroads rather than vague landmarks. Could you explain how to reach City Museum?","clarify":"I can follow street directions, but I do not know the centre yet. Could you specify the number of blocks and the precise turn?","wrong":"My map suggests that the direction you gave leads away from the museum. Could you check the turning point and clarify it before I set off?","distance":"I can walk, but I need to plan my time. Approximately how many blocks is it, and what will confirm that I am close?"},"C2":{"start":"Sorry to interrupt. I have received conflicting directions, and I do not know Riverton. Could you reconcile the uncertainty and guide me to City Museum without assuming local knowledge?","clarify":"That still leaves the crucial junction ambiguous. I need an explicit direction, a sequence of blocks and an identifiable point at which to verify the route.","wrong":"Unless I am misreading this map, that instruction takes me away from my destination. Would you reconsider it and explain the discrepancy rather than repeat it?","distance":"I have limited time and cannot afford to misjudge the distance. What is a realistic estimate, and how would you make the final turn unmistakable?"},"B2":{"start":"Excuse me, I'm trying to get to City Museum. Could you give me clear step-by-step directions, perhaps using crossroads as reference points?","clarify":"I am unfamiliar with the city. Could you specify where I should turn and roughly how many blocks I should walk?","wrong":"That doesn't seem to agree with my map. Could you double-check the turn and explain how to avoid going the wrong way?","distance":"Thank you. Approximately how far is the museum on foot, and is there a reliable point where I can check that I'm close?"}},"es":{"C1":{"start":"Disculpe, es mi primera visita y preferiría indicaciones con cruces concretos en lugar de referencias vagas. ¿Podría explicarme cómo llegar a City Museum?","clarify":"Puedo seguir las indicaciones, pero todavía no conozco el centro. ¿Podría precisar cuántas manzanas debo avanzar y dónde girar?","wrong":"Según mi mapa, la dirección que me ha indicado parece alejarme del museo. ¿Podría comprobar ese giro y aclarármelo antes de que salga?","distance":"Puedo ir a pie, pero necesito calcular el tiempo. ¿A cuántas manzanas está aproximadamente y cómo sabré que ya estoy cerca?"},"C2":{"start":"Disculpe la interrupción. He recibido indicaciones contradictorias y no conozco Riverton. ¿Podría aclarar la discrepancia y guiarme hasta City Museum sin dar por supuesto que conozco la ciudad?","clarify":"La explicación todavía deja ambiguo el cruce decisivo. Necesitaría una dirección precisa, la secuencia de manzanas y un punto donde comprobar que voy bien.","wrong":"Salvo que esté interpretando mal este mapa, esa instrucción me aleja de mi destino. ¿Podría revisarla y explicar la contradicción en vez de repetirla?","distance":"Dispongo de poco tiempo y no quisiera calcular mal la distancia. ¿Cuál sería una estimación realista y cómo aclararía el último giro para evitar errores?"},"B2":{"start":"Disculpe, estoy intentando llegar a City Museum. ¿Podría darme indicaciones claras paso a paso, utilizando los cruces como referencia?","clarify":"No conozco la ciudad. ¿Podría precisar dónde tengo que girar y cuántas manzanas debo caminar aproximadamente?","wrong":"Eso parece contradecir mi plano. ¿Podría comprobar el giro y aclararme cómo evitar equivocarme de camino?","distance":"Gracias. ¿A qué distancia está el museo a pie, aproximadamente, y hay algún punto donde pueda comprobar que estoy cerca?"}},"de":{"C1":{"start":"Entschuldigen Sie, ich bin zum ersten Mal hier und hätte lieber genaue Kreuzungen als unklare Orientierungspunkte. Könnten Sie mir erklären, wie ich zum City Museum komme?","clarify":"Straßenanweisungen kann ich befolgen, aber ich kenne das Zentrum noch nicht. Können Sie die Anzahl der Häuserblöcke und die richtige Abzweigung genauer nennen?","wrong":"Laut meiner Karte scheint mich diese Richtung vom Museum wegzuführen. Könnten Sie die Abzweigung bitte noch einmal prüfen und erläutern, bevor ich losgehe?","distance":"Ich kann zu Fuß gehen, muss aber die Zeit einplanen. Wie viele Häuserblöcke sind es ungefähr, und woran erkenne ich, dass ich fast da bin?"},"C2":{"start":"Entschuldigen Sie die Störung. Ich habe widersprüchliche Wegbeschreibungen erhalten und kenne Riverton nicht. Könnten Sie diese Unklarheit auflösen und mich zum City Museum führen, ohne Ortskenntnisse vorauszusetzen?","clarify":"Die entscheidende Kreuzung bleibt dabei unklar. Ich bräuchte eine eindeutige Richtung, eine genaue Reihenfolge der Häuserblöcke und einen Punkt zur Orientierung.","wrong":"Sofern ich die Karte nicht falsch lese, führt mich diese Anweisung von meinem Ziel weg. Würden Sie sie bitte überdenken und den Widerspruch erläutern, statt sie nur zu wiederholen?","distance":"Ich habe wenig Zeit und möchte die Entfernung nicht unterschätzen. Was wäre eine realistische Einschätzung, und wie ließe sich die letzte Abzweigung unmissverständlich beschreiben?"},"B2":{"start":"Entschuldigen Sie, ich möchte zum City Museum. Könnten Sie mir den Weg Schritt für Schritt erklären und dabei Kreuzungen als Orientierung nutzen?","clarify":"Ich kenne die Stadt nicht. Können Sie bitte genauer sagen, wo ich abbiegen muss und wie viele Häuserblöcke ich ungefähr gehe?","wrong":"Das scheint nicht mit meiner Karte übereinzustimmen. Könnten Sie die Abzweigung noch einmal prüfen und mir helfen, den falschen Weg zu vermeiden?","distance":"Vielen Dank. Wie weit ist es ungefähr zu Fuß bis zum Museum, und woran erkenne ich, dass ich fast angekommen bin?"}},"fr":{"C1":{"start":"Excusez-moi, je viens ici pour la première fois et je préférerais des indications fondées sur des carrefours précis plutôt que sur des repères vagues. Pourriez-vous m'expliquer comment rejoindre City Museum ?","clarify":"Je peux suivre un itinéraire, mais je ne connais pas encore le centre. Pourriez-vous préciser le nombre de pâtés de maisons et le virage à prendre ?","wrong":"D'après mon plan, la direction que vous m'indiquez semble m'éloigner du musée. Pourriez-vous vérifier ce tournant et me l'expliquer avant mon départ ?","distance":"Je peux marcher, mais je dois prévoir le temps nécessaire. À combien de pâtés de maisons se trouve le musée, et comment saurai-je que j'approche ?"},"C2":{"start":"Pardonnez-moi de vous interrompre. J'ai reçu des indications contradictoires et je ne connais pas Riverton. Pourriez-vous lever cette ambiguïté et m'orienter vers City Museum sans supposer que je connais les lieux ?","clarify":"Le carrefour décisif reste pourtant ambigu. Il me faudrait une direction explicite, une succession précise de pâtés de maisons et un repère permettant de vérifier le trajet.","wrong":"À moins que je n'interprète mal ce plan, cette indication m'éloigne de ma destination. Pourriez-vous la réexaminer et expliquer cette contradiction plutôt que la répéter ?","distance":"Je dispose de peu de temps et ne voudrais pas sous-estimer la distance. Quelle estimation serait raisonnable, et comment pourriez-vous rendre le dernier virage sans équivoque ?"},"B2":{"start":"Excusez-moi, je cherche City Museum. Pourriez-vous m'indiquer le chemin étape par étape en utilisant les carrefours comme repères ?","clarify":"Je ne connais pas cette ville. Pourriez-vous préciser où je dois tourner et combien de pâtés de maisons je dois parcourir environ ?","wrong":"Cela ne semble pas correspondre à mon plan. Pourriez-vous vérifier le virage et m'expliquer comment éviter de prendre la mauvaise direction ?","distance":"Merci. À quelle distance se trouve le musée à pied, approximativement, et existe-t-il un repère fiable pour vérifier que je suis presque arrivé ?"}}};
  // CQ-F5-027: model after completing lexical inference must explain place
  // functions; a generic route-description example tests the wrong skill.
  const exploreReflectionModels={"en":{"A1":"Trains arrive at the station. The museum shows old things. The hospital helps sick people. You borrow books at the library. Friends meet in the square. The park has trees.","A2":"A traveller arrives at the station by train. Someone who wants to see objects from the past visits the museum; a person who needs medical care goes to the hospital. You can borrow a book at the library.","B1":"I matched each place to the clue about its purpose. A museum displays historical objects, whereas a library lends books. A park is suitable for a walk beside the river, and a square is an outdoor meeting place.","B2":"The choice depends on what the person actually needs. Although both the library and the museum are educational places, only the library lends books, while the museum displays artefacts. The river and trees point to the park rather than the paved square.","C1":"I would infer the intended destination from its function rather than from a repeated place name. Someone arriving by intercity train needs a railway station; a visitor studying preserved artefacts needs a museum. A medical emergency, by contrast, requires the hospital.","C2":"To avoid a superficial word match, I would distinguish overlapping features from decisive evidence. Both a museum and a library support learning, but a request to borrow material identifies the latter; an interest in curated artefacts identifies the former. Likewise, a riverside walk implies the park, not simply any public space."},"es":{"A1":"Los trenes llegan a la estación. El museo muestra objetos antiguos. El hospital atiende a las personas enfermas. En la biblioteca prestan libros. Nos reunimos en la plaza. El parque tiene árboles.","A2":"Una persona que viaja en tren llega a la estación. Quien quiere conocer objetos del pasado visita el museo; quien necesita atención médica va al hospital. En la biblioteca se pueden tomar libros prestados.","B1":"He relacionado cada lugar con su función. En un museo se exponen objetos históricos, mientras que en una biblioteca se prestan libros. El parque sirve para pasear junto al río y la plaza es un lugar de encuentro al aire libre.","B2":"La elección depende de la necesidad del visitante. Aunque la biblioteca y el museo son espacios culturales, solo la biblioteca presta libros y el museo expone piezas históricas. Los árboles y el río indican el parque, no la plaza pavimentada.","C1":"Deduciría el destino a partir de la función del lugar, no de la repetición de su nombre. Quien llega en un tren de larga distancia necesita la estación; quien quiere estudiar objetos conservados necesita el museo. Una urgencia médica, en cambio, exige ir al hospital.","C2":"Para no quedarme en una simple coincidencia léxica, distinguiría los rasgos compartidos de los decisivos. El museo y la biblioteca favorecen el aprendizaje, pero el préstamo de materiales identifica a esta última, mientras que las piezas expuestas apuntan al primero. Del mismo modo, pasear junto al río indica el parque y no cualquier espacio público."},"de":{"A1":"Züge kommen am Bahnhof an. Im Museum sieht man alte Dinge. Im Krankenhaus helfen Ärztinnen und Ärzte. In der Bibliothek kann man Bücher ausleihen. Freunde treffen sich auf dem Platz. Im Park stehen Bäume.","A2":"Wer mit dem Zug reist, kommt am Bahnhof an. Wer Gegenstände aus früheren Zeiten sehen möchte, besucht das Museum; wer medizinische Hilfe braucht, geht ins Krankenhaus. In der Bibliothek kann man Bücher ausleihen.","B1":"Ich habe jeden Ort nach seiner Funktion ausgewählt. Im Museum werden historische Gegenstände gezeigt, in der Bibliothek leiht man Bücher aus. Der Park eignet sich für einen Spaziergang am Fluss, während der Platz als Treffpunkt dient.","B2":"Entscheidend ist, was die Person tatsächlich benötigt. Obwohl Bibliothek und Museum kulturelle Einrichtungen sind, kann man nur in der Bibliothek Bücher ausleihen; im Museum sieht man Ausstellungsstücke. Bäume und Fluss weisen auf den Park hin, nicht auf den gepflasterten Platz.","C1":"Ich würde den Zielort aus seiner Funktion erschließen, statt lediglich einen Ortsnamen zu wiederholen. Wer mit dem Fernzug ankommt, braucht den Bahnhof; wer historische Objekte untersuchen möchte, das Museum. Eine medizinische Notlage erfordert dagegen das Krankenhaus.","C2":"Um oberflächliche Wortzuordnungen zu vermeiden, muss man gemeinsame Eigenschaften von entscheidenden Hinweisen unterscheiden. Museum und Bibliothek dienen beide dem Lernen, doch die Ausleihe kennzeichnet Letztere, ausgestellte historische Gegenstände Ersteres. Ein Spaziergang am Fluss deutet auf den Park hin und nicht auf irgendeinen öffentlichen Platz."},"fr":{"A1":"Les trains arrivent à la gare. Le musée présente des objets anciens. L'hôpital soigne les malades. À la bibliothèque, on emprunte des livres. On se retrouve sur la place. Le parc a des arbres.","A2":"Une personne qui voyage en train arrive à la gare. Quelqu'un qui souhaite voir des objets du passé visite le musée; une personne qui a besoin de soins va à l'hôpital. On peut emprunter des livres à la bibliothèque.","B1":"J'ai associé chaque lieu à sa fonction. Dans un musée, on présente des objets historiques, tandis qu'une bibliothèque prête des livres. Le parc convient à une promenade au bord de la rivière et la place est un lieu de rencontre en plein air.","B2":"Le choix dépend du besoin réel de la personne. Bien que la bibliothèque et le musée soient des lieux culturels, seule la bibliothèque prête des livres, tandis que le musée expose des objets historiques. Les arbres et la rivière désignent le parc, et non la place pavée.","C1":"Je déduirais la destination de sa fonction plutôt que de répéter son nom. Une personne arrivant par un train interurbain a besoin de la gare, tandis qu'un visiteur souhaitant étudier des objets préservés se rend au musée. Une urgence médicale exige, en revanche, l'hôpital.","C2":"Pour éviter une simple association de mots, je distinguerais les caractéristiques communes des indices décisifs. Le musée et la bibliothèque permettent tous deux d'apprendre, mais l'emprunt d'ouvrages désigne cette dernière, alors que les objets conservés renvoient au premier. De même, une promenade au bord de la rivière indique le parc et non n'importe quel espace public."}};
  // CQ-F5-008: all 4 languages share semantic action IDs but have authored
  // map-specific reasoning and appropriate pragmatic correction prompts.
  const advancedPractice={"en":{"guided":{"B2":{"question":"You have travelled east along the northern road for three blocks. Which relative turn now leads north towards City Museum?","options":[["right","Turn right from east to face north"],["left","Turn left from east to face north"],["straight","Keep walking east without turning"]],"explanation":"When facing east, a left turn points north. The museum is one block north of this crossroads."},"C1":{"question":"You have visited the Library as required. Which final two-block sequence reaches the museum without retracing your entire route?","options":[["south","Go south and then east"],["library","Go one block north, then one block west"],["straight","Continue east for two blocks"]],"explanation":"From the Library (column 5, row 3), go north to the next junction, then west one block to City Museum."},"C2":{"question":"Why is the northern route via the Library a defensible alternative to taking the familiar section of Station Road?","options":[["ignore","The roadworks apply to buses, but pedestrians can always ignore the closure"],["shortcut","The northern route is valid because it omits the mandatory Library stop"],["closure","It visits the Library and avoids the closed Station Road section"]],"explanation":"The route respects both constraints: the Library waypoint and the blocked section of Station Road. Do not infer that a road closure can be crossed on foot."}},"repair":{"reason":{"question":"After walking east, why can't the traveller turn right and still head north?","options":[["distance","The problem is that three blocks is too far"],["south","Facing east, turning right leads south; turning left leads north"],["north","North and east are the same direction at this crossing"]],"retry":"Reconstruct the turn from an east-facing position: right and left lead to different compass bearings."},"apology":{"C1":{"question":"A tourist says your first direction contradicted the map. Which response is clear and appropriately courteous?","options":[["blame","You must have misheard me; my first instructions were correct"],["apology","I'm sorry, I confused left and right. After going east, turn left to head north for two blocks"],["dismiss","Just keep walking and you will find the museum eventually"]],"retry":"A useful repair acknowledges the mistake and replaces the misleading instruction with a precise alternative."},"C2":{"question":"The visitor is already unsure which way to turn. Which response resolves the ambiguity without blaming them?","options":[["dismiss","The original instruction was ambiguous, so choose whichever way you prefer"],["blame","If you had paid attention, you would know which direction I meant"],["apology","I apologise for the contradictory turn. At the eastbound junction, turn left towards the north, continue two blocks and check that the museum is ahead; does that clarify the route?"]],"retry":"A professional correction takes responsibility, provides an unambiguous direction and checks understanding."}}}},"es":{"guided":{"B2":{"question":"Has avanzado tres manzanas hacia el este por la calle del norte. ¿Qué giro te permite dirigirte al norte hacia City Museum?","options":[["right","Gira a la derecha mirando al este para ir al norte"],["left","Gira a la izquierda mirando al este para ir al norte"],["straight","Sigue recto hacia el este sin girar"]],"explanation":"Si miras al este, girar a la izquierda te orienta hacia el norte. El museo está una manzana al norte."},"C1":{"question":"Ya has pasado por la Biblioteca, como exigía la misión. ¿Qué dos movimientos finales te llevan al museo sin repetir toda la ruta?","options":[["south","Avanza al sur y después al este"],["library","Avanza una manzana al norte y después otra al oeste"],["straight","Continúa dos manzanas hacia el este"]],"explanation":"Desde la Biblioteca, camina una manzana al norte hasta el siguiente cruce y luego otra al oeste hasta City Museum."},"C2":{"question":"¿Por qué la ruta del norte que pasa por la Biblioteca es mejor que tomar el tramo habitual de Station Road?","options":[["ignore","Las obras solo afectan a autobuses y siempre se puede cruzar a pie"],["shortcut","Es válida porque permite evitar la parada obligatoria en la Biblioteca"],["closure","Pasa por la Biblioteca y evita el tramo cerrado de Station Road"]],"explanation":"La ruta respeta ambas condiciones: pasar por la Biblioteca y no cruzar el tramo cortado. No se debe suponer que las obras permiten el paso peatonal."}},"repair":{"reason":{"question":"Después de caminar hacia el este, ¿por qué no puedes girar a la derecha y continuar hacia el norte?","options":[["distance","El error es haber avanzado tres manzanas"],["south","Si miras al este, girar a la derecha te lleva al sur; para ir al norte hay que girar a la izquierda"],["north","En ese cruce, el norte y el este son la misma dirección"]],"retry":"Imagina que miras hacia el este: la izquierda y la derecha corresponden a rumbos distintos."},"apology":{"C1":{"question":"Un turista observa que tu primera indicación contradice el plano. ¿Qué respuesta es clara y cortés?","options":[["blame","Usted lo ha entendido mal; mi primera explicación era correcta"],["apology","Disculpe, he confundido izquierda y derecha. Después de avanzar al este, gire a la izquierda y siga dos manzanas hacia el norte"],["dismiss","Siga caminando y acabará encontrando el museo"]],"retry":"Una buena rectificación reconoce el error y sustituye la indicación incorrecta por otra precisa."},"C2":{"question":"El visitante ya no sabe dónde girar. ¿Qué respuesta elimina la ambigüedad sin echarle la culpa?","options":[["dismiss","La indicación original era ambigua, así que elija el camino que prefiera"],["blame","Si hubiera prestado atención, habría entendido perfectamente la dirección"],["apology","Le pido disculpas por la contradicción. En el cruce, después de caminar hacia el este, gire a la izquierda para dirigirse al norte; avance dos manzanas y compruebe que tiene el museo delante. ¿Queda más claro?"]],"retry":"Una rectificación adecuada asume la responsabilidad, precisa el giro y comprueba que el visitante lo ha entendido."}}}},"de":{"guided":{"B2":{"question":"Du bist auf der nördlichen Straße drei Häuserblöcke nach Osten gegangen. Welche Abbiegung führt nun nach Norden zum City Museum?","options":[["right","Von Osten aus rechts abbiegen, um nach Norden zu gehen"],["left","Von Osten aus links abbiegen, um nach Norden zu gehen"],["straight","Ohne Abbiegen geradeaus nach Osten weitergehen"]],"explanation":"Wer nach Osten schaut, erreicht den Norden durch eine Linkskurve. Das Museum liegt einen Block nördlich der Kreuzung."},"C1":{"question":"Du hast wie vorgesehen die Bibliothek besucht. Welche letzten zwei Schritte führen zum Museum, ohne den ganzen Weg zurückzugehen?","options":[["south","Einen Block nach Süden und dann nach Osten gehen"],["library","Einen Block nach Norden und anschließend einen nach Westen gehen"],["straight","Zwei weitere Blöcke geradeaus nach Osten gehen"]],"explanation":"Gehe von der Bibliothek einen Block nach Norden bis zur nächsten Kreuzung und dann einen Block nach Westen zum City Museum."},"C2":{"question":"Warum ist der nördliche Weg über die Bibliothek sinnvoller als der gewohnte Abschnitt der Station Road?","options":[["ignore","Die Baustelle gilt nur für Busse und Fußgänger dürfen eine Sperrung grundsätzlich ignorieren"],["shortcut","Der nördliche Weg ist richtig, weil die Bibliothek ausgelassen werden kann"],["closure","Er führt über die Bibliothek und umgeht den gesperrten Abschnitt der Station Road"]],"explanation":"Der Weg erfüllt beide Bedingungen: Besuch der Bibliothek und Vermeidung der Straßensperrung. Eine Sperrung darf nicht einfach zu Fuß überquert werden."}},"repair":{"reason":{"question":"Warum kann man nach einem Weg nach Osten nicht rechts abbiegen und gleichzeitig nach Norden weitergehen?","options":[["distance","Der Fehler liegt darin, dass drei Häuserblöcke zu weit sind"],["south","Wer nach Osten schaut, biegt rechts nach Süden und links nach Norden ab"],["north","An dieser Kreuzung liegen Osten und Norden in derselben Richtung"]],"retry":"Stelle dir vor, du schaust nach Osten: Links und rechts führen in unterschiedliche Himmelsrichtungen."},"apology":{"C1":{"question":"Ein Tourist erklärt, dass deine erste Wegbeschreibung der Karte widerspricht. Welche Antwort ist höflich und eindeutig?","options":[["blame","Sie haben mich falsch verstanden; meine erste Erklärung war richtig"],["apology","Entschuldigung, ich habe links und rechts verwechselt. Gehen Sie erst nach Osten, biegen Sie dann links ab und folgen Sie der Straße zwei Blöcke nach Norden"],["dismiss","Gehen Sie einfach weiter, irgendwann finden Sie das Museum"]],"retry":"Eine gute Korrektur übernimmt Verantwortung und ersetzt die falsche Richtung durch eine eindeutige Anweisung."},"C2":{"question":"Der Besucher ist bereits verunsichert. Welche Antwort löst den Widerspruch, ohne ihm die Schuld zuzuschieben?","options":[["dismiss","Meine erste Anweisung war mehrdeutig; entscheiden Sie sich einfach selbst"],["blame","Wenn Sie aufgepasst hätten, wüssten Sie, was ich meinte"],["apology","Ich entschuldige mich für die widersprüchliche Anweisung. Gehen Sie zunächst nach Osten; an der Kreuzung biegen Sie links nach Norden ab und gehen zwei Blöcke weiter bis zum Museum. Ist der Weg jetzt eindeutig?"]],"retry":"Eine angemessene Berichtigung räumt den Fehler ein, nennt den genauen Weg und stellt sicher, dass die Erklärung verstanden wurde."}}}},"fr":{"guided":{"B2":{"question":"Vous avez avancé de trois pâtés de maisons vers l'est par la rue du nord. Quel virage vous permet maintenant de vous diriger vers le nord et City Museum ?","options":[["right","Tourner à droite quand on regarde vers l'est pour aller au nord"],["left","Tourner à gauche quand on regarde vers l'est pour aller au nord"],["straight","Continuer tout droit vers l'est sans tourner"]],"explanation":"Quand on regarde vers l'est, un virage à gauche mène au nord. Le musée est à un pâté de maisons au nord."},"C1":{"question":"Vous êtes passé par la Bibliothèque, comme demandé. Quels sont les deux derniers déplacements qui mènent au musée sans refaire tout le chemin ?","options":[["south","Avancer vers le sud, puis vers l'est"],["library","Avancer d'un pâté de maisons vers le nord, puis d'un autre vers l'ouest"],["straight","Continuer deux pâtés de maisons vers l'est"]],"explanation":"Depuis la Bibliothèque, avancez d'un pâté de maisons vers le nord jusqu'au carrefour suivant, puis d'un autre vers l'ouest jusqu'à City Museum."},"C2":{"question":"Pourquoi l'itinéraire du nord passant par la Bibliothèque est-il préférable au tronçon habituel de Station Road ?","options":[["ignore","Les travaux concernent seulement les bus et les piétons peuvent toujours ignorer une fermeture"],["shortcut","Cet itinéraire est valable parce qu'il permet de sauter la visite obligatoire de la Bibliothèque"],["closure","Il passe par la Bibliothèque et évite le tronçon fermé de Station Road"]],"explanation":"L'itinéraire respecte deux contraintes : passer par la Bibliothèque et éviter la rue fermée. Il serait dangereux de supposer que la fermeture ne concerne pas les piétons."}},"repair":{"reason":{"question":"Après avoir marché vers l'est, pourquoi ne peut-on pas tourner à droite tout en continuant vers le nord ?","options":[["distance","Le problème vient des trois pâtés de maisons parcourus"],["south","Quand on regarde vers l'est, tourner à droite mène au sud; pour aller au nord, il faut tourner à gauche"],["north","À ce carrefour, le nord et l'est correspondent à la même direction"]],"retry":"Imaginez-vous tourné vers l'est : la droite et la gauche correspondent à deux directions différentes."},"apology":{"C1":{"question":"Un touriste remarque que votre première indication contredit le plan. Quelle réponse est claire et courtoise ?","options":[["blame","Vous avez mal compris; mes premières indications étaient correctes"],["apology","Je suis désolé, j'ai confondu la gauche et la droite. Après avoir marché vers l'est, tournez à gauche et continuez deux pâtés de maisons vers le nord"],["dismiss","Continuez à marcher et vous finirez par trouver le musée"]],"retry":"Une bonne correction reconnaît l'erreur et remplace la mauvaise indication par une consigne précise."},"C2":{"question":"Le visiteur hésite déjà sur la direction à prendre. Quelle réponse lève l'ambiguïté sans lui faire porter la responsabilité ?","options":[["dismiss","Mes premières indications étaient ambiguës, alors choisissez le chemin qui vous convient"],["blame","Si vous m'aviez bien écouté, vous sauriez où tourner"],["apology","Je vous prie de m'excuser pour cette contradiction. Au carrefour après votre trajet vers l'est, tournez à gauche vers le nord, avancez deux pâtés de maisons et vérifiez que le musée est devant vous. Est-ce plus clair ainsi ?"]],"retry":"Une rectification professionnelle assume l'erreur, précise la direction et vérifie la compréhension."}}}}};
  // F3D: identical, authored pedagogical headings for the city and metro
  // modes. These only describe the lesson flow; they never modify scoring.
  const lessonCopy={
    en:{city:"CITY · RIVERTON",metro:"METRO · RIVERTON",
      read:"Read",practise:"Practise",reflect:"Reflect",
      phases:"Three learning phases",mission:"Mission",mode:"Mode",
      note:"Explain your choices aloud. Speaking is self-checked, never automatically graded.",
      metroReset:"Switching City/Metro restarts missions 05–08; missions 01–04 stay."},
    es:{city:"CIUDAD · RIVERTON",metro:"METRO · RIVERTON",
      read:"Lee",practise:"Practica",reflect:"Reflexiona",
      phases:"Tres fases de aprendizaje",mission:"Misión",mode:"Modalidad",
      note:"Explica tus decisiones en voz alta. La expresión oral se autoevalúa, no recibe una nota automática.",
      metroReset:"Cambiar entre ciudad y metro reinicia las misiones 05–08; se conservan las misiones 01–04."},
    de:{city:"STADT · RIVERTON",metro:"U-BAHN · RIVERTON",
      read:"Lesen",practise:"Üben",reflect:"Reflektieren",
      phases:"Drei Lernphasen",mission:"Aufgabe",mode:"Modus",
      note:"Begründe deine Entscheidungen mündlich. Das Sprechen wird selbst eingeschätzt und nicht automatisch bewertet.",
      metroReset:"Beim Wechsel zwischen Stadt und U-Bahn starten die Aufgaben 05–08 neu; 01–04 bleiben erhalten."},
    fr:{city:"VILLE · RIVERTON",metro:"MÉTRO · RIVERTON",
      read:"Lire",practise:"S'entraîner",reflect:"Faire le bilan",
      phases:"Trois étapes d'apprentissage",mission:"Mission",mode:"Mode",
      note:"Expliquez vos choix à l'oral. Votre prise de parole fait l'objet d'une autoévaluation, jamais d'une note automatique.",
      metroReset:"Passer de la ville au métro réinitialise les missions 05–08 ; les missions 01–04 sont conservées."}
  };
  const lesson=()=>lessonCopy[state.language]||lessonCopy.en;
  // Explicit, four-language mission 07 roadworks learning objective.
  // This checkpoint is an actual map node, not an invented second closure.
  const roadworksCopy={
    en:{task:"Roadworks block the normal direct approaches to City Museum. Find another route using only open streets. Check the red markings on the map.",missing:"Complete the required waypoint before entering City Museum."},
    es:{task:"Las obras cortan los accesos directos habituales al museo. Busca otra ruta utilizando únicamente calles abiertas. Consulta los tramos marcados en rojo.",missing:"Pasa primero por el lugar obligatorio antes de llegar al museo."},
    de:{task:"Die üblichen direkten Zugänge zum Stadtmuseum sind wegen Bauarbeiten gesperrt. Finde einen anderen Weg über offene Straßen und beachte die roten Markierungen.",missing:"Besuche zuerst den vorgeschriebenen Zwischenstopp, bevor du das Museum erreichst."},
    fr:{task:"Les travaux bloquent les accès directs habituels au musée. Trouvez un autre itinéraire par les rues ouvertes et tenez compte des tronçons indiqués en rouge.",missing:"Passez d'abord par l'étape obligatoire avant de rejoindre le musée."}
  };
  const roadworks=()=>roadworksCopy[state.language]||roadworksCopy.en;

  // Catalog links contain ?lang=; treat all URL parameters as untrusted and
  // accept only authored languages/levels. No remote requests or persistence.
  const launchParams=new URLSearchParams(window.location.search);
  const launchLanguage=launchParams.get("lang"),launchLevel=launchParams.get("level");
  const initialLanguage=C.languages.includes(launchLanguage)?launchLanguage:"en";
  const initialLevel=C.levels.includes(launchLevel)?launchLevel:"B1";
  const skipLabels={
    en:["Skip to missions","Skip to active task"],
    es:["Saltar a las misiones","Saltar a la actividad actual"],
    de:["Zu den Missionen springen","Zur aktuellen Aufgabe springen"],
    fr:["Aller aux missions","Aller à l'activité en cours"]
  };
  let metroEnabled=false;
  let state=makeSession(initialLanguage,initialLevel,"solo");
  let flash=null;
  function makeSession(language,level,mode){
    return {language,level,mode:mode||"solo",station:1,done:new Set(),
      pairTurns:Object.create(null),explore:{round:0,misses:0},route:G.routeStart(),dialogue:G.dialogueStart(),
      guided:G.guidedStart(),metro:MG?Object.fromEntries([5,6,7,8].map(n=>[n,MG.start(n)])):null,
      transit:{done:false,tries:0,selection:{}},
      repair:G.repairStart(),detour:G.routeStart(),quest:G.questStart()};
  }
  const pack=()=>C.pack(state.language),profile=()=>C.profile(state.language,state.level),ui=()=>pack().ui;
  const metroAvailable=()=>!!MG&&!!LC&&LC.languages.includes(state.language)&&LC.levels.includes(state.level);
  const metroPilot=()=>metroEnabled&&metroAvailable()&&state.station>=5&&state.station<=8;
  const metroCopy=()=>LC.pack(state.language,state.level,state.station);
  const metroState=()=>metroPilot()?state.metro[state.station]:null;
  const metroCityPhase=()=>metroPilot()&&state.station===8&&(
    ["walk-to-entrance","enter","walk-to-museum"].includes(metroState().phase)||
    metroState().phase==="checkpoint"&&metroState().resumePhase==="enter"||
    ["speech","complete"].includes(metroState().phase)&&MG.same(metroState().surface,MG.museum));
  const metroCityWalk=()=>metroPilot()&&state.station===8&&["walk-to-entrance","walk-to-museum"].includes(metroState().phase);
  const metroScene=()=>metroPilot()&&!metroCityPhase();
  // Public read-only bridge for the existing F2.1B metro illustration.
  window.CityQuestF2MetroBridge=Object.freeze({pilotActive:metroPilot,metroVisible:metroScene,current:metroState});
  function updateMetroPresentation(){
    const visible=metroScene();
    cityLayout.hidden=visible;
    metroLab.dataset.mode=visible?"game":"preview";
    if(visible){
      const target=metroPhoneQuery.matches?metroNetworkCard:metroSidebar;
      if(panel.parentElement!==target){
        if(target===metroNetworkCard)target.insertBefore(panel,$("metroNetworkViewport"));
        else target.insertBefore(panel,target.firstChild);
      }
      metroLab.hidden=false;
    }else{
      if(panel.parentElement!==citySidebar)citySidebar.appendChild(panel);
      metroLab.hidden=metroPilot()||["A1","A2"].includes(state.level);
    }
    if(window.RivertonMetroVisual)window.RivertonMetroVisual.sync(visible?metroState():null);
  }
  function el(tag,parent,cls,content){
    const n=document.createElement(tag);if(cls)n.className=cls;
    if(content!==undefined&&content!==null)n.textContent=String(content);
    if(parent)parent.appendChild(n);
    return n;
  }
  function svg(tag,attrs){
    const n=document.createElementNS(NS,tag);
    Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,String(v)));
    return n;
  }
  function btn(parent,title,onClick,cls){
    const b=el("button",parent,"btn"+(cls?" "+cls:""),title);
    b.type="button";b.addEventListener("click",onClick);return b;
  }
  function para(parent,content,cls){return el("p",parent,cls||"",content);}
  function note(parent,title,body){
    const div=el("div",parent,"f2-objective");
    el("strong",div,"",title);para(div,body);return div;
  }
  function status(parent,message,tone){
    const div=el("div",parent,"f2-status",message||ui().ready);
    div.setAttribute("role","status");div.setAttribute("aria-live","polite");
    if(tone)div.dataset.tone=tone;
    return div;
  }
  function actions(parent){return el("div",parent,"f2-actions");}
  function choices(parent,items,onChoose){
    const holder=el("div",parent,"f2-choice-list");
    items.forEach((choice,index)=>{
      btn(holder,choice.label,()=>onChoose(choice.value,index));
    });
  }
  function help(parent){
    const details=el("details",parent,"f2-help");
    el("summary",details,"",ui().help);
    para(details,profile().support);
    return details;
  }
  function objective(index){
    const alt=metroPilot()?metroCopy():null;
    const title=alt?alt.titleMission:pack().stations[index-1][0],
      desc=alt?alt.kicker+" · "+alt.native+" "+state.level:pack().stations[index-1][1],
      goal=alt?alt.goal:profile()[stationKeys[index-1]];
    const head=el("div",panel,"f2-card-head");
    el("span",head,"f2-kicker",ui().station+" "+String(index).padStart(2,"0")+" / 08 · "+pack().native+" "+state.level);
    el("h2",head,"",(alt&&index===5?"🚇":icons[index-1])+" "+title);
    para(head,desc);
    note(panel,"🎯 "+ui().mission,goal);
    if(state.mode==="pair"){
      const div=el("div",panel,"f2-pair");
      el("strong",div,"","👥 "+ui().roleMode);
      para(div,alt?alt.pair[index]:pack().pair[stationKeys[index-1]]||pack().pair.general);
      // CQ-F5-028: two explicit local speaking turns, without speech capture
      // or automatic grading. Station instructions define the actual roles.
      const copy=pairCopy[state.language],progress=el("p",div,"f2-pair-progress");
      progress.setAttribute("role","status");
      progress.setAttribute("aria-live","polite");
      const action=btn(div,copy.action,()=>{
        if(state.mode!=="pair"||state.station!==index)return;
        state.pairTurns[index]=Math.min(2,(state.pairTurns[index]||0)+1);
        sync();
      },"f2-pair-turn");
      function sync(){
        const turns=state.pairTurns[index]||0;
        progress.textContent=copy.title+" · "+turns+"/2 · "+
          (turns===0?copy.first:turns===1?copy.second:copy.complete);
        action.disabled=turns>=2;
        action.setAttribute("aria-disabled",String(turns>=2));
      }
      sync();
    }
  }
  function speaking(parent,model){
    const tip=el("div",parent,"f2-help");
    el("strong",tip,"", "🗣️ "+ui().speaking);
    para(tip,profile().speaking);
    para(tip,ui().selfcheck,"f2-small");
    const example=el("p",tip,"f2-small");example.hidden=true;
    btn(tip,ui().reveal,()=>{example.textContent=model||profile().model;example.hidden=false;});
    return tip;
  }
  function complete(number,extra,model){
    state.done.add(number);
    updateProgress();
    const div=el("div",panel,"f2-finish");
    el("strong",div,"","✓ "+ui().finish);
    para(div,extra||ui().feedbackGood);
    speaking(panel,model);
    const row=actions(panel);
    if(number<8)btn(row,ui().next+" →",()=>selectStation(number+1),"primary");
    btn(row,"↺ "+ui().restartStation,resetStation);
  }
  function screen(){
    const taskHadFocus=panel.contains(document.activeElement),isMetro=metroPilot();
    panel.hidden=false;panel.replaceChildren();
    updateMetroPresentation();
    translateCity();
    objective(state.station);
    if(isMetro)renderMetroMission();
    else switch(state.station){
      case 1:renderExplore();break;
      case 2:renderRoute();break;
      case 3:renderDialogue();break;
      case 4:renderGuided();break;
      case 5:renderTransport();break;
      case 6:renderRepair();break;
      case 7:renderDetour();break;
      case 8:renderQuest();break;
      default:throw Error("Unknown station");
    }
    // Persist feedback outside a dynamically replaced panel. No recording,
    // network, telemetry, artificial grades or automatic model validation.
    if(flash?.text)$("f3Status").textContent=flash.text;
    updateLessonRail();
    if(taskHadFocus&&!isMetro)window.requestAnimationFrame(()=>{
      if(panel.hidden)return;
      const next=panel.querySelector(
        ".f2-choice-list button:not(:disabled), .f2-actions button:not(:disabled), "+
        ".f2-select-group select:not(:disabled), .f2-help button:not(:disabled)"
      );
      if(next)next.focus({preventScroll:true});
      else{
        const title=panel.querySelector(".f2-card-head h2");
        if(title){title.tabIndex=-1;title.focus({preventScroll:true});}
      }
    });
  }
  // B1 pilot: all metro choices go through the pure deterministic game engine.
  // The live scene stays inside the F2.1B map card, not a second independent controller.
  function metroAction(action){
    const number=state.station,previousScene=metroScene(),previous=state.metro[number];
    const hadTaskFocus=panel.contains(document.activeElement);
    const result=MG.act(previous,action);
    state.metro[number]=result.state;
    // F3B: sound is optional and generated locally only AFTER a real,
    // deterministic engine decision. It never advances the journey.
    const cue=!result.accepted?"error":result.complete?"complete":
      action.type==="READ_NOTICE"?"warning":
      action.type==="BOARD"?"board":
      action.type==="CHANGE_LINE"||action.type==="TRANSFER_HERE"?"transfer":
      action.type==="EXIT_HERE"||action.type==="EXIT"?"arrival":
      action.type==="NEXT_STOP"?"ride":"advance";
    window.CityQuestF3?.feedback(cue);
    flash={text:LC.feedback(state.language,result,action,
      window.RivertonMetro?.station(result.state.metroStation)?.labelEn),tone:result.accepted?"success":"warning"};
    // Persistent polite status survives rebuilding the mission panel and is
    // announced by assistive technology without an audio or network request.
    $("f3Status").textContent=flash.text;
    if(result.complete)state.done.add(number);
    screen();renderMap();
    // Mission action buttons are recreated with new phases. Return keyboard
    // focus to the NEW valid action; never steal focus from map inspection.
    if(hadTaskFocus)window.requestAnimationFrame(()=>{
      const next=panel.querySelector(".f2-choice-list button:not(:disabled), .f2-actions button:not(:disabled)");
      if(next)next.focus({preventScroll:true});
    });
    window.CityQuestF3?.sceneUpdated();
    if(previousScene!==metroScene()){
      const target=metroScene()?metroLab:cityLayout;
      window.requestAnimationFrame(()=>target.scrollIntoView({behavior:"auto",block:"start"}));
    }
  }
  function renderMetroMission(){
    const game=metroState(),stage=game.phase,n=state.station,c=metroCopy(),
      place=window.RivertonMetro?.station(game.metroStation)?.labelEn||game.metroStation;
    if(game.completed)return complete(n,c.labels.verified,LC.model(state.language,state.level,n));
    // CQ-F5-032: a compact localized progress fraction, never the
    // unnatural '0 Speaking checkpoints confirmed'. Only mission 08 has
    // three distinct spoken checkpoints; 05-07 end with one self-check.
    const speakingTotal=window.RivertonMetro?.scenario(game.scenarioId)?.speakingCheckpoints||1;
    el("p",panel,"f2-small",c.native+" · "+state.level+" · "+c.offline+
      " · "+c.labels.checkpointProgress+": "+game.speakingDone+"/"+speakingTotal);
    note(panel,"🚇 "+(["walk-to-entrance","walk-to-museum"].includes(stage)?c.enterTitle:c.metroTitle),
      LC.stage(state.language,state.level,n,stage,{station:place}));
    if(stage==="speech"||stage==="checkpoint"){
      note(panel,"🎯 "+c.labels.criteria,c.cefr.task);
      const checklist=el("ul",panel,"metro-selfcheck-criteria");
      c.cefr.criteria.forEach(criterion=>el("li",checklist,"",criterion));
      note(panel,"💡 "+c.labels.support,c.cefr.support);
      const ext=el("details",panel,"metro-language-details");
      el("summary",ext,"",c.labels.stretch);
      para(ext,c.cefr.stretch);
    }
    // The mixed City–Metro mission has two physical layers. While the player
    // walks, report their ACTUAL surface position rather than the underground
    // start/goal stored separately in the metro engine.
    const outdoors=n===8&&metroCityPhase()&&!!game.surface;
    const surfaceName=outdoors&&MG.same(game.surface,MG.portalEnd)?
      window.RivertonMetro.station("museum_quarter").labelEn:
      outdoors?pointName(game.surface):"";
    // Unnamed crossroads remain a numbered step in the player's own route;
    // avoid displaying the confusing duplicate label "Riverton: Riverton".
    const surfacePosition=surfaceName===ui().city?
      ui().city+" · "+ui().step+" "+Math.max(0,game.cityPath.length-1):
      ui().city+": "+surfaceName;
    const positionText=outdoors?surfacePosition:
      c.labels.position+": "+place+" · "+(game.lineId||c.labels.noLine);
    status(panel,outdoors?positionText:(flash?.text||positionText),outdoors?null:flash?.tone);
    if(outdoors&&flash?.text)para(panel,flash.text,"f2-small");
    if(stage==="walk-to-entrance"||stage==="walk-to-museum"){
      para(panel,c.hints.walk,"f2-small");
    }else if(["select-line","select-direction","select-platform"].includes(stage)){
      if(stage==="select-platform"){
        // CQ-F5-004: genuine readable station information BEFORE selecting a
        // platform. Entries come from validated graph fixtures, not from the
        // currently correct answer. One sign is not itself a forced solution.
        const metro=window.RivertonMetro,signs=metro.platformSigns(game.metroStation);
        const board=el("section",panel,"metro-platform-board");
        board.setAttribute("role","group");
        board.setAttribute("aria-label",c.labels.platformBoard+" · "+place);
        el("h3",board,"metro-platform-board-heading","🚉 "+c.labels.platformBoard);
        const signList=el("ol",board,"metro-platform-board-list");
        for(const number of ["1","2","3"]){
          const sign=signs.find(item=>item.platform===number);
          const item=el("li",signList,"metro-platform-board-item");
          el("strong",item,"metro-platform-board-number",c.labels.platform+" "+number);
          const description=sign?
            sign.line+" · "+c.labels.towards+" "+metro.station(sign.directionTerminus).labelEn:
            c.labels.noService;
          el("span",item,"metro-platform-board-sign"+(sign?"":" metro-platform-board-empty"),description);
          if(sign)item.style.setProperty("--platform-line-colour",metro.line(sign.line).color);
        }
      }
      const type=stage==="select-line"?"SELECT_LINE":stage==="select-direction"?"SELECT_DIRECTION":"SELECT_PLATFORM";
      const opts=MG.options(game).map(opt=>stage==="select-platform"?
        {value:opt.value,label:c.labels.platform+" "+opt.value}:opt);
      choices(panel,stage==="select-platform"?opts:
        G.orderChoices(opts,state.language,state.level,n,stage),value=>metroAction({type,value}));
    }else if(stage==="ride"){
      // One real decision at every metro stop: carry on, change here or get off.
      const row=actions(panel);
      for(const type of ["NEXT_STOP","TRANSFER_HERE","EXIT_HERE"])
        btn(row,c.actions[type],()=>metroAction({type}),type==="NEXT_STOP"?"primary":"");
    }else if(stage==="checkpoint"||stage==="speech"){
      const tip=el("div",panel,"f2-help");
      el("strong",tip,"","🗣️ "+c.labels.prompt);
      const example=el("p",tip,"f2-small");example.hidden=true;
      btn(tip,c.labels.model,()=>{example.textContent=LC.model(state.language,state.level,n);example.hidden=false;});
      const row=actions(panel);
      btn(row,c.actions.SELF_CHECK,()=>metroAction({type:"SELF_CHECK"}),"primary");
    }else if(stage==="transfer"){
      // CQ-F5-005: no more unconditional automatic transfer button. The
      // learner reads the network and decides whether to remain on the
      // arriving line or follow the connecting service.
      const lines=window.RivertonMetro.joined(game.metroStation);
      const decisions=lines.map(value=>({
        value,label:(value===game.lineId?c.actions.STAY_ON_LINE:c.actions.CHANGE_LINE)+" · "+value
      }));
      choices(panel,G.orderChoices(decisions,state.language,state.level,n,"transfer"),value=>
        metroAction({type:value===game.lineId?"STAY_ON_LINE":"CHANGE_LINE",value}));
    }else if(stage==="exit"){
      // A student chooses when to get off. Staying aboard is a safe, locally
      // explained wrong answer; it never moves or completes the mission.
      const decisions=[
        {value:"exit",label:c.actions.EXIT},
        {value:"continue",label:c.actions.CONTINUE_PAST_EXIT}
      ];
      choices(panel,G.orderChoices(decisions,state.language,state.level,n,"exit"),value=>
        metroAction({type:value==="exit"?"EXIT":"CONTINUE_PAST_EXIT"}));
    }else{
      const actionMap={enter:"ENTER",notice:"READ_NOTICE",board:"BOARD"};
      if(actionMap[stage]){
        const row=actions(panel),type=actionMap[stage];
        btn(row,c.actions[type],()=>metroAction({type}),"primary");
      }
    }
    const vocab=el("details",panel,"metro-language-details");
    el("summary",vocab,"","📖 "+c.labels.glossary);
    const dl=el("dl",vocab,"metro-glossary");
    c.glossary.forEach(([term,definition])=>{el("dt",dl,"",term);el("dd",dl,"",definition);});
    const controls=actions(panel);
    btn(controls,"↺ "+c.labels.restart,resetStation);
    if(metroScene())para(panel,c.hints.map,"f2-small");
  }
  function renderExplore(){
    const game=state.explore,total=G.answerCount(state.level);
    el("h3",panel,"","🗺️ "+ui().vocabulary);
    const grid=el("div",panel,"f2-landmarks");
    F.places.forEach(place=>{
      const div=el("div",grid,"f2-landmark");
      el("span",div,"",place.icon);
      el("span",div,"",pack().places[place.id]);
    });
    if(game.round>=total)return complete(1,profile().explore,
      exploreReflectionModels[state.language]?.[state.level]||profile().explore);
    el("div",panel,"f2-progress-dots");
    para(panel,ui().step+" "+(game.round+1)+" / "+total,"f2-small");
    const question=F.explore[game.round];
    const clue=advancedExploreClues[state.language]?.[state.level]?.[game.round]||
      pack().clues[game.round];
    para(panel,clue,"f2-prompt");
    const ids=G.exploreChoices(question,state.level,game.round);
    const ordered=G.orderChoices(ids,state.language,state.level,1,game.round);
    choices(panel,ordered.map(id=>({value:id,label:(F.findPlace(id)?.icon||"📍")+" "+pack().places[id]})),id=>{
      const verdict=F.answerExplore(game.round,id);
      if(verdict.correct){game.round++;flash={text:ui().correct,tone:"success"};screen();}
      else{game.misses++;flash={text:ui().notQuite,tone:"warning"};screen();}
    });
    status(panel,flash?.text||ui().choose,flash?.tone);
    help(panel);
  }
  function pointName(p){
    const names=[
      {node:E.start,name:ui().start},{node:E.goal,name:ui().museum},
      {node:{c:2,r:2},name:ui().square},{node:{c:4,r:2},name:ui().library}
    ];
    if(metroPilot()&&state.station===8){
      const alias=[
        {node:E.start,name:"Central Station"},{node:E.goal,name:"City Museum"},
        {node:{c:2,r:2},name:"Market Square"}
      ].find(x=>E.same(x.node,p));
      if(alias)return alias.name;
    }
    return names.find(x=>E.same(x.node,p))?.name||ui().city;
  }
  function renderRoute(){
    const game=state.route,c=G.config(state.level);
    if(game.done)return complete(2,ui().routeCompleted,G.routeModel(pack(),game.route));
    const target=ui()[state.level==="A1"?"square":"museum"];
    el("h3",panel,"",ui().from+" "+ui().start+" → "+target);
    para(panel,ui().goal+": "+target,"f2-prompt");
    if(c.via.length)note(panel,ui().via,c.via.map(pointName).join(", "));
    if(c.blocked)note(panel,"🚧 "+ui().closed,ui().wrongRoad);
    para(panel,ui().step+": "+(game.route.length-1)+" · "+ui().remaining+": "+E.distance(game.route.at(-1),c.target),"f2-small");
    status(panel,flash?.text||ui().guide,flash?.tone);
    const row=actions(panel);
    btn(row,"↺ "+ui().restartStation,resetStation);
    help(panel);
  }
  function renderDialogue(){
    const game=state.dialogue,d=pack().dialogue,p=profile(),
      distractors=G.dialogueDistractors(p.dialogueAnswer,state.language);
    if(game.done)return complete(3,d.final,p.dialogueAnswer+" "+d.distance+" "+d.goodbye);
    const scenes={start:d.opening,clarify:d.clarify,wrong:d.mistake,distance:d.followup,
      ...advancedDialogueScenes[state.language]?.[state.level]};
    el("h3",panel,"","💬 "+ui().narrator);
    para(el("div",panel,"f2-dialogue-bubble"),scenes[game.stage]);
    const options={
      start:[{value:"help",label:p.dialogueAnswer},{value:"vague",label:distractors.vague},{value:"wrong",label:distractors.wrong}],
      clarify:[{value:"help",label:p.dialogueAnswer},{value:"vague",label:distractors.vague}],
      wrong:[{value:"repair",label:d.fix+" "+p.dialogueAnswer},{value:"insist",label:distractors.insist}],
      distance:[{value:"distance",label:d.distance},{value:"nohelp",label:d.badDistance}]
    };
    choices(panel,G.orderChoices(options[game.stage],state.language,state.level,3,game.stage),id=>{
      const r=G.dialogueChoose(game,id);
      if(!r.accepted)return;
      state.dialogue=r.state;
      flash={text:r.kind==="retry"?d.unclear:d.good,tone:r.kind==="retry"?"warning":"success"};
      screen();
    });
    status(panel,flash?.text||ui().yourTurn,flash?.tone);
    help(panel);
    const row=actions(panel);btn(row,"↺ "+ui().restartScene,resetStation);
  }
  function renderGuided(){
    const game=state.guided,plan=G.guidedPaths[state.level];
    const reason=advancedPractice[state.language]?.guided?.[state.level];
    if(game.done&&reason&&!game.reviewed){
      note(panel,"🧭 "+ui().mission,reason.question);
      choices(panel,G.orderChoices(reason.options.map(([value,label])=>({value,label})),
        state.language,state.level,4,"explain"),choice=>{
        const verdict=G.guidedReview(state.guided,state.level,choice);
        state.guided=verdict.state;
        flash={text:verdict.accepted?reason.explanation:ui().feedbackRetry,
          tone:verdict.accepted?"success":"warning"};
        screen();renderMap();
      });
      status(panel,flash?.text||ui().choose,flash?.tone);
      return;
    }
    if(game.done)return complete(4,
      reason?.explanation||ui().arrived,G.routeModel(pack(),game.route));
    const dots=el("div",panel,"f2-progress-dots");
    plan.forEach((dir,i)=>el("span",dots,"f2-dot"+(game.step>i?" done":game.step===i?" current":""),String(i+1)));
    el("h3",panel,"",ui().step+" "+(game.step+1)+"/"+plan.length);
    para(panel,G.instruction(pack(),state.level,game.step),"f2-prompt");
    status(panel,flash?.text||ui().guide,flash?.tone);
    const row=actions(panel);
    btn(row,ui().showHint,()=>{flash={text:profile().support,tone:"warning"};screen();});
    btn(row,"↺ "+ui().restartStation,resetStation);
  }
  function renderTransport(){
    const game=state.transit;
    if(game.done)return complete(5,pack().travel.why,pack().travel.why+" "+profile().transit);
    const travel=pack().travel;
    const ask=state.level==="A1"?travel.opening:state.level==="A2"?travel.before:
      ["B1","B2"].includes(state.level)?travel.before:state.level==="C1"?travel.access:travel.complex;
    note(panel,"🚌 "+ui().plan,ask);
    // A labelled local scroll region keeps all five timetable columns readable
    // at 200% text size without overflowing the whole page on 320px phones.
    const timetable=el("div",panel,"f2-transit-scroll");
    timetable.setAttribute("role","region");
    timetable.setAttribute("tabindex","0");
    timetable.setAttribute("aria-label","🚌 "+ui().plan);
    const table=el("table",timetable,"f2-transit-table"),thead=el("thead",table),theadRow=el("tr",thead);
    const swipeText={en:"Swipe the timetable sideways to view all columns.",es:"Desliza la tabla hacia los lados para ver todas las columnas.",de:"Wische die Tabelle seitlich, um alle Spalten zu sehen.",fr:"Faites défiler le tableau horizontalement pour voir toutes les colonnes."};
    para(panel,swipeText[state.language]||swipeText.en,"f2-transit-scroll-hint");
    [ui().line,ui().departure,ui().stop,ui().arrival,ui().accessible].forEach(label=>el("th",theadRow,"",label));
    const body=el("tbody",table);
    const services=G.servicesForLevel(state.level),options=G.transportOptions(state.level);
    services.forEach(line=>{
      const row=el("tr",body);
      const destination=line.to==="Hospital"?travel.line24:line.to==="City Museum"?travel.line12:travel.line7;
      [line.line,line.depart,destination,line.arrival,line.accessible?"✓":"—"].forEach(val=>el("td",row,"",val));
    });
    const required=G.requiredFields(state.level),wrap=el("div",panel,"f2-select-group");
    const selected={};
    const items=[
      {key:"line",choices:options.lines.map(x=>({value:x,label:x})),label:ui().line},
      {key:"depart",choices:options.departures.map(x=>({value:x,label:x})),label:ui().departure},
      {key:"stop",choices:options.stops.map(value=>({
        value,label:value==="Hospital"?travel.line24:value==="City Museum"?travel.line12:travel.line7
      })),label:ui().stop}
    ];
    items.filter(x=>required.includes(x.key)).forEach(item=>{
      const field=el("label",wrap,"",item.label);
      const select=el("select",field);select.setAttribute("aria-label",item.label);
      const placeholder=el("option",select,"",ui().select);placeholder.value="";
      item.choices.forEach(c=>{const option=el("option",select,"",c.label);option.value=c.value;});
      select.value=game.selection[item.key]||"";
      select.addEventListener("change",()=>{game.selection[item.key]=select.value;});
      selected[item.key]=select;
    });
    status(panel,flash?.text||ui().choose,flash?.tone);
    const row=actions(panel);
    btn(row,ui().check,()=>{
      const input=Object.fromEntries(Object.entries(selected).map(([key,select])=>[key,select.value]));
      const verdict=G.checkTransport(input,state.level);
      game.tries++;
      if(verdict.correct){game.done=true;flash={text:ui().correct,tone:"success"};}
      else{
        const map={missing:travel.missing,line:travel.lineWrong,depart:travel.timeWrong,stop:travel.stopWrong,late:travel.late,access:travel.notAccessible};
        flash={text:map[verdict.kind]||ui().feedbackRetry,tone:"warning"};
      }
      screen();
    },"primary");
    help(panel);
  }
  function renderRepair(){
    const game=state.repair,r=pack().repair,
      practice=advancedPractice[state.language].repair,
      stages=G.repairStages(state.level);
    if(game.done){
      const advancedModel=practice.apology[state.level]?.options.find(x=>x[0]==="apology")?.[1];
      return complete(6,r.repairWhy,advancedModel||r.polite);
    }
    note(panel,"⚠️ "+ui().directions,r.incorrect);
    el("h3",panel,"",ui().step+" "+(game.phase+1)+" / "+stages);
    const phase=game.phase;
    const scenario=phase===2?practice.reason:phase===3?practice.apology[state.level]:null;
    para(panel,scenario?.question|| (phase===0?profile().repair:ui().yourTurn),"f2-prompt");
    const choicesForStage=phase===0?
      r.identify.map((label,i)=>({label,value:["straight","turn","distance"][i]})):
      phase===1?
      r.fixes.map((label,i)=>({label,value:["left","keep-south","west"][i]})):
      scenario.options.map(([value,label])=>({value,label}));
    choices(panel,G.orderChoices(choicesForStage,state.language,state.level,6,phase),value=>{
      const result=G.repairChoice(state.repair,state.level,value);
      state.repair=result.state;
      flash={text:result.accepted?
        (phase>=2?r.repairWhy:ui().correct):
        (scenario?.retry||r.notYet),
        tone:result.accepted?"success":"warning"};
      screen();
    });
    status(panel,flash?.text||ui().choose,flash?.tone);
    help(panel);
  }
  function renderDetour(){
    const game=state.detour,c=G.config(state.level);
    if(game.done)return complete(7,profile().detour,G.routeModel(pack(),game.route));
    note(panel,"🚧 "+ui().closed,roadworks().task);
    if(c.via.length)note(panel,ui().via,c.via.map(pointName).join(", "));
    para(panel,ui().from+" "+ui().start+" → "+ui().museum,"f2-prompt");
    para(panel,ui().step+": "+(game.route.length-1),"f2-small");
    status(panel,flash?.text||ui().guide,flash?.tone);
    const row=actions(panel);
    btn(row,"↺ "+ui().restartStation,resetStation);
    help(panel);
  }
  function renderQuest(){
    const game=state.quest,list=G.questCheckpoints(state.level);
    if(game.done)return complete(8,profile().quest,profile().model);
    const dots=el("div",panel,"f2-progress-dots");
    list.forEach((x,i)=>el("span",dots,"f2-dot"+(i<game.stage?" done":i===game.stage?" current":""),String(i+1)));
    const cp=list[game.stage],name=pack().places[cp.id];
    el("h3",panel,"",ui().checkpoint+" "+(game.stage+1)+"/"+list.length+" · "+name);
    if(game.awaitingSpeech){
      note(panel,"🗣️ "+ui().speaking,profile().quest+" "+profile().speaking);
      const example=G.routeModel(pack(),game.leg);
      speaking(panel,example);
      const row=actions(panel);
      btn(row,ui().selfdone+" →",()=>{
        const result=G.questSpeak(state.quest,state.level);
        if(result.accepted){state.quest=result.state;flash={text:ui().correct,tone:"success"};screen();renderMap();}
      },"primary");
      return;
    }
    para(panel,ui().from+" "+pointName(game.leg[0])+" → "+name,"f2-prompt");
    status(panel,flash?.text||ui().guide,flash?.tone);
    const row=actions(panel);
    btn(row,"↺ "+ui().restartStation,resetStation);
    help(panel);
  }
  function activePath(){
    // Keep the final walking leg and the player's museum location visible
    // through the self-check and the completed-state presentation.
    if(metroPilot())return state.station===8&&metroCityPhase()?metroState().cityPath:null;
    switch(state.station){
      case 2:return state.route.route;
      case 4:return state.guided.route;
      case 7:return state.detour.route;
      case 8:return state.quest.route;
      default:return null;
    }
  }
  function activePoint(){
    const path=activePath();return path?.[path.length-1]||null;
  }
  function isMovementLocked(){
    if(metroPilot())return !metroCityWalk();
    if(state.station===2)return state.route.done;
    if(state.station===4)return state.guided.done;
    if(state.station===7)return state.detour.done;
    if(state.station===8)return state.quest.done||state.quest.awaitingSpeech;
    return true;
  }
  function onMove(next){
    // Claude F5-016: a visible surface path during a metro checkpoint is NOT
    // permission to run the independent city quest engine behind the scene.
    if(isMovementLocked())return;
    if(metroCityWalk())return metroAction({type:"WALK",node:next});
    let outcome;
    switch(state.station){
      case 2:outcome=G.moveRoute(state.route,next,state.level,false);state.route=outcome.state;break;
      case 4:outcome=G.guidedMove(state.guided,next,state.level);state.guided=outcome.state;break;
      case 7:outcome=G.moveRoute(state.detour,next,state.level,true);state.detour=outcome.state;break;
      case 8:outcome=G.questMove(state.quest,next,state.level);state.quest=outcome.state;break;
      default:return;
    }
    if(outcome.kind==="closed")flash={text:ui().wrongRoad,tone:"warning"};
    else if(outcome.kind==="speak")flash={text:ui().selfcheck,tone:"warning"};
    else if(outcome.kind==="missing-via")flash={text:state.station===7?
      roadworks().missing:ui().via+" · "+ui().feedbackRetry,tone:"warning"};
    else if(!outcome.accepted)flash={text:ui().feedbackRetry,tone:"warning"};
    else flash={text:ui().correct,tone:"success"};
    screen();renderMap();
  }
  const layer=svg("g",{id:"f2MapLayer","class":"f2-map-layer","pointer-events":"none"}),
    trail=svg("polyline",{id:"f2MapRoute","class":"f2-map-route",points:""}),
    marker=svg("circle",{id:"f2MapMarker","class":"f2-map-marker",r:16,cx:168,cy:580}),
    blocked=svg("g",{id:"f2ClosedRoad"});
  layer.append(trail,marker,blocked);map.appendChild(layer);
  // One stable, accessible navigation component for ALL map missions.
  // The entire HUD belongs to the map viewport frame, not the lower task panel.
  const mapStage=el("div",null,"f2-map-stage");
  mapStage.id="f2MapStage";
  viewport.parentNode.insertBefore(mapStage,viewport);
  mapStage.appendChild(viewport);
  const quick=el("div",mapStage,"f2-quick");
  quick.id="f2Quick";quick.hidden=true;
  quick.dataset.testid="navigation-hud";
  quick.setAttribute("role","group");
  quick.setAttribute("aria-label",ui().compass);
  const hudTop=el("div",quick,"f2-hud-top");
  const hudLoc=el("span",hudTop,"f2-hud-location");
  const quickTitle=el("strong",hudTop,"f2-hud-instruction");
  const quickCaption=el("span",quick,"f2-quick-caption");
  quickCaption.setAttribute("role","status");
  quickCaption.setAttribute("aria-live","polite");
  quickCaption.setAttribute("aria-atomic","true");
  const quickPad=el("div",quick,"f2-quick-pad");
  quickPad.dataset.testid="hud-dpad";
  quickPad.setAttribute("role","group");
  const hudButtons=Object.create(null);
  for(const [dir,arrow] of [["north","↑"],["west","←"],["south","↓"],["east","→"]]){
    const button=el("button",quickPad,"f2-quick-"+dir,arrow);
    button.type="button";
    button.dataset.direction=dir;
    button.addEventListener("click",()=>dispatchDirection(dir));
    hudButtons[dir]=button;
  }
  const hudTools=el("div",quick,"f2-hud-tools");
  const hudUndo=btn(hudTools,"↶",()=>undoMapStep(),"f2-hud-undo");
  let hudCompact=false;
  const hudSize=btn(hudTools,"▣",()=>{
    hudCompact=!hudCompact;updateHudDensity();
  },"f3c-hud-toggle");
  hudSize.id="f3cHudSize";
  hudSize.dataset.testid="hud-size-toggle";
  // One HUD, two responsive placements. Desktop uses the right mission sidebar;
  // phones keep the overlay inside the map frame. Never clone the button nodes.
  const hudDock=panel.parentElement;
  // Match the actual layout breakpoint: the sidebar sits beside the map only above 1050px.
  const phoneQuery=window.matchMedia("(max-width:1050px)");
  function updateHudDensity(){
    const overlay=phoneQuery.matches,compact=overlay&&hudCompact;
    const t=chromeCopy[state.language]||chromeCopy.en;
    quick.dataset.compact=String(compact);
    hudSize.hidden=!overlay;
    hudSize.setAttribute("aria-pressed",String(compact));
    hudSize.setAttribute("aria-label",compact?t.expand:t.compact);
    hudSize.title=compact?t.expand:t.compact;
    hudSize.textContent=compact?"⤢":"▣";
    // Icon-only Undo retains its full translated accessible name and a real
    // 44px touch target beside the compact toggle on small screens.
    hudUndo.textContent=overlay?"↶":"↶ "+ui().undo;
  }
  function placeHud(){
    const overlay=phoneQuery.matches;
    const destination=overlay?mapStage:hudDock;
    if(quick.parentElement!==destination){
      const focused=quick.contains(document.activeElement)?document.activeElement:null;
      if(overlay)mapStage.appendChild(quick);
      else if(panel.parentElement===hudDock)hudDock.insertBefore(quick,panel);
      else hudDock.appendChild(quick);
      if(focused)focused.focus({preventScroll:true});
    }
    quick.dataset.placement=overlay?"map-overlay":"sidebar";
    updateHudDensity();
  }
  placeHud();
  if(phoneQuery.addEventListener)phoneQuery.addEventListener("change",placeHud);
  else phoneQuery.addListener(placeHud);
  // Reconcile HUD placement immediately on viewport resize (not only media-query changes).
  window.addEventListener("resize",placeHud,{passive:true});

  function dispatchDirection(direction){
    if(isMovementLocked())return;
    const current=activePoint();
    if(!current)return;
    const next=F.nextFromDirection(current,direction);
    if(!E.isNode(next))return;
    onMove(next);
  }
  function canUndo(){
    if(isMovementLocked())return false;
    if(metroCityWalk())return metroState().cityPath.length>1;
    if(state.station===8)return state.quest.leg.length>1;
    if(state.station===2)return state.route.route.length>1;
    if(state.station===7)return state.detour.route.length>1;
    return false;
  }
  function undoMapStep(){
    if(!canUndo())return;
    if(metroCityWalk())return metroAction({type:"UNDO_WALK"});
    const path=state.station===8?state.quest.leg:activePath();
    onMove(path[path.length-2]);
  }
  function updateQuick(){
    const path=activePath(),current=activePoint(),active=!!path;
    // Keep the travelled route visible during checkpoint/completion, but
    // remove inactive directional buttons so they do not obscure the map.
    quick.hidden=!active||(metroPilot()&&!metroCityWalk());
    if(quick.hidden)return;
    const p=pack(),u=ui();
    quick.setAttribute("aria-label",u.compass);
    quickPad.setAttribute("aria-label",u.compass);
    hudUndo.setAttribute("aria-label",u.undo);
    hudUndo.disabled=!canUndo();
    updateHudDensity();
    const cp=state.station===8&&!metroPilot()&&!state.quest.done?
      G.questCheckpoints(state.level)[state.quest.stage]:null;
    const done=isMovementLocked();
    hudLoc.textContent=u.station+" "+String(state.station).padStart(2,"0")+
      " · "+state.level+(state.station===4?" · "+(done?G.guidedPaths[state.level].length:state.guided.step+1)+"/"+G.guidedPaths[state.level].length:"");
    const metroWalkHud={
      en:{"walk-to-entrance":"Walk to Market Square metro entrance","walk-to-museum":"Walk north to City Museum"},
      es:{"walk-to-entrance":"Ve a la entrada del metro en Market Square","walk-to-museum":"Camina hacia el norte hasta City Museum"},
      de:{"walk-to-entrance":"Gehe zum U-Bahn-Eingang am Market Square","walk-to-museum":"Gehe nach Norden zum City Museum"},
      fr:{"walk-to-entrance":"Allez à l'entrée du métro de Market Square","walk-to-museum":"Marchez vers le nord jusqu'à City Museum"}
    };
    quickTitle.textContent=metroCityWalk()?metroWalkHud[state.language][metroState().phase]:
      state.station===4&&!state.guided.done?
      G.instruction(p,state.level,state.guided.step):
      cp?p.places[cp.id]:
      state.station===2?profile().route:
      state.station===7?u.wrongRoad:u.arrived;
    quickCaption.textContent=flash?.text||u.compass;
    quickCaption.dataset.tone=flash?.tone||"";
    for(const [dir,button] of Object.entries(hudButtons)){
      button.setAttribute("aria-label",u[dir]+" · "+u.compass);
      button.disabled=done||!current||!E.isNode(F.nextFromDirection(current,dir));
    }
  }
  function showClosure(){
    blocked.replaceChildren();
    const need=!metroPilot()&&(state.station===7||state.level==="C2"&&[2,4,8].includes(state.station));
    if(!need)return;
    const edges=state.station===7?G.detourClosures(state.level):[F.closure];
    for(const edge of edges){
      const p=E.position(edge.a),q=E.position(edge.b),x=(p.x+q.x)/2,y=(p.y+q.y)/2;
      blocked.appendChild(svg("line",{x1:p.x,y1:p.y,x2:q.x,y2:q.y,class:"f2-road-close"}));
      blocked.appendChild(svg("circle",{cx:x,cy:y,r:14,fill:"#a82e3c",stroke:"#fff5ee","stroke-width":2}));
      const mark=svg("text",{x,y:y+7,"font-family":"system-ui,sans-serif","font-size":23,"font-weight":900,"text-anchor":"middle",fill:"#ffffff"});
      mark.textContent="×";blocked.appendChild(mark);
    }
  }
  function followMap(){
    if(!viewport.classList.contains("detail"))return;
    const point=activePoint();if(!point)return;
    const p=E.position(point),scale=map.getBoundingClientRect().width/1196;
    const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    viewport.scrollTo({left:Math.max(0,p.x*scale-viewport.clientWidth*.4),
      // Keep the marker ABOVE the floating HUD, rather than under the arrow pad.
      top:Math.max(0,p.y*scale-viewport.clientHeight*.30),behavior:reduce?"auto":"smooth"});
  }
  function renderMap(){
    const path=activePath();
    // Claude CQ-F5-017: F0 keeps its own legacy route state, whereas F2 owns
    // the visible game. Keep SVG accessibility state tied to the F2 route,
    // including when changing language, mission, or City/Metro mode.
    const accessibleNodes={
      en:["Crossroads","column","row","Current position","Visited"],
      es:["Cruce","columna","fila","Posición actual","Recorrido"],
      de:["Kreuzung","Spalte","Reihe","Aktueller Standort","Besucht"],
      fr:["Carrefour","colonne","rangée","Position actuelle","Parcouru"]
    };
    const words=accessibleNodes[state.language]||accessibleNodes.en;
    const near={en:"near",es:"cerca de",de:"bei",fr:"près de"}[state.language]||"near";
    const referencePlaces=[E.start,E.goal,{c:2,r:2},{c:4,r:2}];
    const current=path?.at(-1)||null;
    for(const node of map.querySelectorAll("[data-node]")){
      const [c,r]=node.dataset.node.split("-").map(Number),point={c,r};
      const isCurrent=!!current&&E.same(current,point);
      const visited=!!path&&path.some(p=>E.same(p,point));
      const location=pointName(point),named=location!==ui().city?location:"";
      const reference=referencePlaces.reduce((best,anchor)=>{
        const distance=Math.abs(anchor.c-c)+Math.abs(anchor.r-r);
        return !best||distance<best.distance?{anchor,distance}:best;
      },null);
      const context=named||near+" "+pointName(reference.anchor);
      const label=words[0]+" "+words[1]+" "+(c+1)+", "+words[2]+" "+(r+1)+
        ", "+context+(isCurrent?", "+words[3]:visited?", "+words[4]:"");
      node.setAttribute("aria-label",label);
      // City map is one keyboard Tab stop (viewport); all 24 crossroads
      // remain mouse/touch selectable and available to screen reader browse.
      node.setAttribute("tabindex","-1");
      node.setAttribute("aria-pressed",String(visited));
      if(isCurrent)node.setAttribute("aria-current","location");
      else node.removeAttribute("aria-current");
    }
    layer.style.display=path?"":"none";
    if(path){
      trail.setAttribute("points",path.map(p=>{const q=E.position(p);return q.x+","+q.y;}).join(" "));
      const here=E.position(path.at(-1));marker.setAttribute("cx",here.x);marker.setAttribute("cy",here.y);
      $("mapLocation").textContent=pointName(path.at(-1));
      $("mapProgress").textContent=ui().step+": "+(path.length-1)+" · "+state.level;
      followMap();
    }else{
      $("mapLocation").textContent=ui().city;
      $("mapProgress").textContent=pack().stations[state.station-1][0]+" · "+state.level;
    }
    showClosure();updateQuick();
  }
  let translatedMapVersion="";
  function translateCity(){
    const metroCanonical=metroPilot()&&state.station===8,
      signature=state.language+"|"+String(metroCanonical);
    if(signature===translatedMapVersion)return;
    const p=pack();
    map.querySelectorAll("[data-landmark-label]").forEach(group=>{
      const original=group.dataset.landmarkLabel;
      // Metro navigation signs carry canonical proper names. In mission 08
      // the walking map uses the same names, while city-only tasks preserve
      // their existing localized labels.
      const sameStop=metroCanonical&&["CENTRAL STATION","MARKET SQUARE","CITY MUSEUM"].includes(original);
      const translated=sameStop?original:(p.mapLabels[original]||original);
      const label=group.querySelector("text");
      if(!label)return;
      label.textContent=translated;
      label.setAttribute("font-size",translated.length>16?"9":translated.length>12?"10.7":"12.6");
      const cx=Number(label.getAttribute("x")),width=Math.min(140,Math.max(66,label.getComputedTextLength()+20));
      const rects=group.querySelectorAll("rect");
      rects.forEach((r,i)=>{r.setAttribute("width",width);
        r.setAttribute("x",cx-width/2+(i===0?2:0));});
      const alias=p.mapLabels[original]||original;
      group.setAttribute("aria-label",sameStop&&alias!==original?original+" · "+alias:translated);
    });
    const roads={
      en:{"STATION ROAD":"STATION ROAD","MARKET AVENUE":"MARKET AVENUE","RIVERSIDE":"RIVERSIDE"},
      es:{"STATION ROAD":"CALLE DE LA ESTACIÓN","MARKET AVENUE":"AVENIDA DEL MERCADO","RIVERSIDE":"RIBERA"},
      de:{"STATION ROAD":"BAHNHOFSTRASSE","MARKET AVENUE":"MARKTALLEE","RIVERSIDE":"FLUSSUFER"},
      fr:{"STATION ROAD":"RUE DE LA GARE","MARKET AVENUE":"AVENUE DU MARCHÉ","RIVERSIDE":"BERGES"}
    };
    map.querySelectorAll("text").forEach(t=>{
      const initial=t.dataset.f2Original||t.textContent;
      if(!t.dataset.f2Original)t.dataset.f2Original=initial;
      if(roads[state.language][initial])t.textContent=roads[state.language][initial];
      if(initial==="CITY ADVENTURE · WALKING MAP")t.textContent=chromeCopy[state.language].caption;
    });
    translatedMapVersion=signature;
  }
  function applyChromeLabels(){
    const l=chromeCopy[state.language],detail=viewport.classList.contains("detail");
    $("themeBtn").textContent=document.documentElement.dataset.theme==="dark"?"☀":"☾";
    $("themeBtn").setAttribute("aria-label",l.theme);
    $("mapZoom").textContent=detail?"− "+l.whole:"＋ "+l.detail;
    $("mapTouchTip").textContent=detail?l.tipZoom:l.tip;
    document.querySelector(".hero .kicker").textContent=l.kicker;
  }
  function applyLanguageUI(){
    const u=ui(),p=pack(),prof=profile();
    document.documentElement.lang=p.locale;
    document.title="City Quest · "+p.native+" "+state.level+" · Language Skills Hub";
    $("f2LanguageLabel").textContent=u.language;
    $("f2LevelLabel").textContent=u.level+" CEFR";
    $("f2Profile").textContent=state.level+" · "+prof.focus;
    $("f2HeroLanguage").textContent=p.native;
    $("f2HeroLevel").textContent=state.level;
    $("cityQuestGameType").textContent=gameType[state.language];
    $("cityQuestHeaderType").textContent="Language Skills Hub · "+gameType[state.language];
    $("f3Skip").textContent=skipLabels[state.language][0];
    $("f3SkipTask").textContent=skipLabels[state.language][1];
    $("f2HeroText").textContent=p.stations[0][1]+" "+u.objective;
    document.querySelector(".hero h1").textContent=p.stations[7][0];
    document.querySelector(".f1-mode>span").textContent=u.mode;
    $("f1Solo").textContent="👤 "+u.solo;
    $("f1Pair").textContent="👥 "+u.pair;
    $("resetBtn").textContent="↺ "+u.restartStation;
    $("mapReset").textContent="↺ "+u.restart;
    applyChromeLabels();
    document.querySelector(".map-head .section-label").textContent=u.city.toUpperCase();
    document.querySelector(".map-head h2").textContent=u.map;
    const mapFooter=document.querySelector(".map-footer");
    if(mapFooter)mapFooter.textContent="🧭 "+u.route+" · 🚉 "+u.start+" · 🏛️ "+u.museum;
    document.querySelector(".f1-progress small").textContent=u.offline+" "+u.noSpeechGrade;
    $("f2GuideTitle").textContent=u.training+" · "+state.level;
    $("f2GuideText").textContent=prof.focus+". "+prof.stretch+" "+u.offline+" "+u.noSpeechGrade;
    translateCity();updateMetroToggle();
    for(const id of ["f2Language","f2Level","metroPilotToggle"])
      $(id).setAttribute("aria-describedby","f3dSessionAdvice");
    updateLessonRail();
  }
  function lessonPhase(){
    if(state.done.has(state.station))return 2;
    if(metroPilot()){
      const game=metroState();
      if(["checkpoint","speech","complete"].includes(game.phase))return 2;
      return game.history.length>0||game.attempts>0||game.cityPath.length>1?1:0;
    }
    const m=state.station;
    if(m===8&&state.quest.awaitingSpeech)return 2;
    const worked=m===1?(state.explore.round>0||state.explore.misses>0):
      m===2?state.route.route.length>1:
      m===3?state.dialogue.stage!=="start":
      m===4?state.guided.step>0:
      m===5?(state.transit.tries>0||Object.keys(state.transit.selection).length>0):
      m===6?(state.repair.phase>0||state.repair.tries>0):
      m===7?state.detour.route.length>1:
      m===8?(state.quest.stage>0||state.quest.leg.length>1):false;
    return worked?1:0;
  }
  function updateLessonRail(){
    const x=lesson(),phase=lessonPhase(),metro=metroPilot(),
      title=metro?metroCopy().titleMission:pack().stations[state.station-1][0];
    $("f3dWorld").textContent=metro?x.metro:x.city;
    $("f3dRailTitle").textContent=x.mission+" "+String(state.station).padStart(2,"0")+" · "+title;
    $("f3dRailMode").textContent=(state.mode==="pair"?ui().pair:ui().solo)+
      " · "+pack().native+" "+state.level;
    $("f3dLearningSteps").setAttribute("aria-label",x.phases);
    for(const [i,id,label]of [[0,"f3dRead",x.read],[1,"f3dPractise",x.practise],[2,"f3dReflect",x.reflect]]){
      const node=$(id);
      node.querySelector("strong").textContent=label;
      node.dataset.state=i<phase?"done":i===phase?"current":"upcoming";
      if(i===phase)node.setAttribute("aria-current","step");
      else node.removeAttribute("aria-current");
    }
    $("f3dRailNote").textContent=x.note;
    $("f3dSessionAdvice").textContent=ui().changeSession+
      (metroAvailable()?" "+x.metroReset:"");
  }
  function updateProgress(){
    const u=ui(),nav=$("f1Stations");
    // Preserve the selected mission button on keyboard navigation: rebuilding
    // the nav must not dump focus to the document body.
    const focusIndex=nav.contains(document.activeElement)?
      Array.from(nav.children).indexOf(document.activeElement):-1;
    nav.replaceChildren();
    $("f1ProgressText").textContent=state.done.size+" / 8 · "+u.completed;
    $("f1ProgressTrack").setAttribute("aria-valuenow",String(state.done.size));
    $("f1ProgressFill").style.width=state.done.size*12.5+"%";
    F.stations.forEach((st,i)=>{
      const button=el("button",nav,"f1-station");
      button.type="button";
      const missionTitle=metroEnabled&&metroAvailable()&&st.id>=5?
        LC.pack(state.language,state.level,st.id).titleMission:pack().stations[i][0];
      button.setAttribute("aria-label",u.station+" "+st.id+": "+missionTitle);
      if(state.station===st.id)button.setAttribute("aria-current","step");
      const icon=metroEnabled&&metroAvailable()&&st.id===5?"🚇":icons[i];
      const ic=el("span",button,"f1-station-icon",icon);ic.setAttribute("aria-hidden","true");
      const cap=el("span",button,"f1-station-caption");
      el("small",cap,"",u.station+" "+String(st.id).padStart(2,"0"));
      el("strong",cap,"",missionTitle);
      if(state.done.has(st.id))el("span",button,"f1-station-complete","✓");
      button.addEventListener("click",()=>selectStation(st.id));
    });
    if(focusIndex>=0&&nav.children[focusIndex])
      nav.children[focusIndex].focus({preventScroll:true});
    updateLessonRail();
  }
  function selectStation(n){
    if(!Number.isInteger(n)||n<1||n>8)return;
    state.station=n;flash=null;
    updateProgress();screen();renderMap();
    window.CityQuestF3?.sceneUpdated();
  }
  function resetStation(){
    const n=state.station;
    if(n===1)state.explore={round:0,misses:0};
    if(n===2)state.route=G.routeStart();
    if(n===3)state.dialogue=G.dialogueStart();
    if(n===4)state.guided=G.guidedStart();
    if(n>=5&&state.metro)state.metro[n]=MG.start(n);
    if(n===5)state.transit={done:false,tries:0,selection:{}};
    if(n===6)state.repair=G.repairStart();
    if(n===7)state.detour=G.routeStart();
    if(n===8)state.quest=G.questStart();
    delete state.pairTurns[n];state.done.delete(n);flash=null;
    updateProgress();screen();renderMap();
  }
  function resetSession(lang,level){
    metroEnabled=false;
    const mode=state.mode;
    state=makeSession(lang,level,mode);flash=null;
    applyLanguageUI();updateProgress();screen();renderMap();
  }
  function updateMetroToggle(){
    const b=$("metroPilotToggle");if(!b)return;
    const available=metroAvailable(),content=available?LC.pack(state.language,state.level,5):null;
    b.hidden=!available;
    b.title=lesson().metroReset;
    b.textContent=metroEnabled&&available?"↶ "+content.back:content?"🚇 "+content.pilot:"";
    b.setAttribute("aria-pressed",String(metroEnabled&&available));
    const pilot=metroEnabled&&available,hero=document.querySelector(".hero h1"),
      heroText=$("f2HeroText"),headerTag=document.querySelector(".topbar .header-actions .tag"),
      variantTag=$("cityQuestVariant");
    if(pilot){hero.textContent=content.title;heroText.textContent=content.header;}
    else{hero.textContent=pack().stations[7][0];heroText.textContent=pack().stations[0][1]+" "+ui().objective;}
    const modeLabel=lesson().metro.split(" · ")[0];
    if(headerTag)headerTag.textContent=pilot?"CITY QUEST · "+state.level+" "+modeLabel:"CITY QUEST · PREMIUM";
    if(variantTag)variantTag.textContent=pilot?state.language.toUpperCase()+" · "+state.level+" "+modeLabel:"8 × 4 × 6";
    // Never overwrite the visible game-type badge with numeric statistics.
    $("cityQuestGameType").textContent=gameType[state.language];
    document.title=pilot?content.title+" · "+content.native+" "+state.level+" · LSH":
      "City Quest · "+pack().native+" "+state.level+" · Language Skills Hub";
  }
  function toggleMetroPilot(){
    if(!metroAvailable())return;
    metroEnabled=!metroEnabled;
    // Switching gameplay modes resets only missions 05-08, preserving 01-04.
    state.done=new Set([...state.done].filter(n=>n<=4));
    state.metro=Object.fromEntries([5,6,7,8].map(n=>[n,MG.start(n)]));
    for(const n of [5,6,7,8])delete state.pairTurns[n];
    state.transit={done:false,tries:0,selection:{}};
    state.repair={phase:0,done:false,tries:0};
    state.detour=G.routeStart();state.quest=G.questStart();
    flash=null;
    updateMetroToggle();updateProgress();screen();renderMap();
    window.CityQuestF3?.sceneUpdated();
  }
  function setMode(mode){
    if(!["solo","pair"].includes(mode))return;
    state.mode=mode;
    for(const kind of ["solo","pair"]){
      const b=$(kind==="solo"?"f1Solo":"f1Pair");
      b.setAttribute("aria-pressed",String(kind===mode));
      b.classList.toggle("active",kind===mode);
    }
    screen();renderMap();
  }
  // F0's map listeners stay active, but its legacy route mode is disabled.
  // F2 explicitly handles the same crossroads through a separate verified engine.
  $("dialogueTab").click();
  $("routeView").hidden=true;$("dialogueView").hidden=true;
  // Capture reset clicks so the F0 legacy handler cannot re-enable its route mode.
  for(const id of ["resetBtn","mapReset"]){
    $(id).addEventListener("click",e=>{e.stopImmediatePropagation();e.preventDefault();resetStation();},true);
  }
  $("f2Language").addEventListener("change",e=>resetSession(e.target.value,state.level));
  $("f2Level").addEventListener("change",e=>resetSession(state.language,e.target.value));
  if(metroPhoneQuery.addEventListener)metroPhoneQuery.addEventListener("change",()=>{if(metroScene())updateMetroPresentation();});
  else metroPhoneQuery.addListener(()=>{if(metroScene())updateMetroPresentation();});
  $("metroPilotToggle").addEventListener("click",toggleMetroPilot);
  $("f1Solo").addEventListener("click",()=>setMode("solo"));
  $("f1Pair").addEventListener("click",()=>setMode("pair"));
  $("themeBtn").addEventListener("click",applyChromeLabels);
  $("mapZoom").addEventListener("click",()=>{applyChromeLabels();window.requestAnimationFrame(followMap);});
  map.querySelectorAll("[data-node]").forEach(node=>{
    const [c,r]=node.dataset.node.split("-").map(Number);
    node.addEventListener("click",()=>{if(activePath()&&!isMovementLocked())onMove({c,r});});
    node.addEventListener("keydown",e=>{
      if((e.key==="Enter"||e.key===" ")&&activePath()&&!isMovementLocked()){e.preventDefault();onMove({c,r});}
    });
  });
  viewport.addEventListener("keydown",e=>{
    if(e.target!==viewport||!activePath()||isMovementLocked())return;
    const direction={ArrowUp:"north",ArrowDown:"south",ArrowLeft:"west",ArrowRight:"east"}[e.key];
    if(direction){e.preventDefault();onMove(F.nextFromDirection(activePoint(),direction));}
  });
  $("f2Language").value=state.language;
  $("f2Level").value=state.level;
  applyLanguageUI();updateProgress();screen();renderMap();
})();
