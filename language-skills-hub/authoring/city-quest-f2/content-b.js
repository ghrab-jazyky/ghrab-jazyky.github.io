/* Static additional language packs for City Quest F2.
 * Loaded directly after content-a.js. No translation APIs, no requests.
 */
(function(root){
  "use strict";
  if(!root||!root.CityQuestF2Content)throw new Error("City Quest F2 base localization must load first");
  const content=root.CityQuestF2Content;
  const additions={
    de:{
      name:"German",native:"Deutsch",locale:"de",short:"DE",
      ui:{
        language:"Sprache",level:"Niveau",mode:"Übungsmodus",solo:"Allein",pair:"Zu zweit · Aufgaben",
        station:"Station",completed:"Missionen abgeschlossen",choose:"Wähle eine Antwort",
        next:"Nächste Station",restart:"Neu beginnen",undo:"Rückgängig",check:"Antwort prüfen",
        retry:"Versuche es erneut",correct:"Richtig!",notQuite:"Noch nicht ganz. Versuche es erneut.",
        mission:"Deine Mission",progress:"Fortschritt",model:"Musterantwort",reveal:"Beispiel anzeigen",
        selfcheck:"Sprich die Antwort zuerst laut aus. Das Sprechen wird weder aufgezeichnet noch automatisch bewertet.",
        selfdone:"Ich habe gesprochen und meine Antwort überprüft",finish:"Mission abgeschlossen",
        compass:"Einen Häuserblock weiter",east:"Osten",west:"Westen",north:"Norden",south:"Süden",
        from:"Von",to:"Nach",blocks:"Häuserblöcke",remaining:"Häuserblöcke bis zum Ziel",
        route:"Weg",line:"Linie",departure:"Abfahrt",arrival:"Ankunft",stop:"Zielhaltestelle",
        plan:"Fahrplan",closed:"STRASSE GESPERRT",map:"Stadtplan",hint:"Tipp",
        vocabulary:"Wortschatz",speaking:"Sprechaufgabe",yourTurn:"Du bist dran",
        feedback:"Rückmeldung",help:"Sprachhilfe",alternative:"Andere mögliche Route",
        checkpoint:"Zwischenziel",score:"Richtige Antworten",roleA:"Schüler/in A",roleB:"Schüler/in B",
        switch:"Rollen tauschen",goal:"Ziel",ready:"Bereit",review:"Überprüfen",
        changeSession:"Beim Wechsel der Sprache oder des Niveaus wird diese lokale Übung zurückgesetzt.",
        offline:"Funktioniert ohne Server. Es werden keine Schülerdaten übermittelt oder gespeichert.",
        skip:"Vorerst überspringen",narrator:"Tourist/in",answer:"Deine Antwort",restartScene:"Dialog neu starten",
        showHint:"Tipp anzeigen",arrived:"Du bist angekommen!",step:"Schritt",
        partnerIntro:"Arbeitet zu zweit. Eine Person liest oder erklärt die Situation, die andere antwortet ohne Musterlösung. Dann tauscht ihr die Rollen.",
        objective:"Kommuniziere klar; bloßes Anklicken reicht nicht.",
        wrongRoad:"Diese Straße ist gesperrt. Suche einen anderen Weg.",illegal:"Gehe immer nur einen Häuserblock weiter.",
        end:"Ende der Übung",restartStation:"Station neu starten",same:"Du bist schon hier.",
        guide:"Lies die nächste Wegbeschreibung und wähle die passende Straße.",
        transportWhy:"Erkläre, warum du diese Verbindung den anderen vorziehst.",
        noSpeechGrade:"Die mündliche Leistung wird durch Selbst- oder Partnerbeurteilung reflektiert, nicht automatisch bewertet.",
        select:"Bitte wählen ...",confirm:"Antwort bestätigen",dialogueError:"Versuche eine hilfreichere und genauere Antwort.",
        left:"Links",right:"Rechts",straight:"Geradeaus",
        via:"über",roleMode:"Partnerübung",checkRoute:"Route prüfen",passCheckpoint:"Zum nächsten Zwischenziel",
        training:"Sprachtraining",routeCompleted:"Route abgeschlossen",challengeFinished:"Aufgabe abgeschlossen",
        directions:"Wegbeschreibung",speakNow:"Erkläre den Weg laut",city:"Riverton",
        start:"Hauptbahnhof",museum:"Stadtmuseum",square:"Marktplatz",library:"Bibliothek",hospital:"Krankenhaus",
        departureBoard:"Abfahrtstafel",arrivalBefore:"Ankunft vor",accessible:"Barrierefreie Verbindung",
        feedbackGood:"Sehr gut. Weg und Auswahl sind richtig.",
        feedbackRetry:"Prüfe Straße, Richtung oder Bedingungen und versuche es erneut."
      },
      places:{
        station:"Hauptbahnhof",museum:"Stadtmuseum",hospital:"Krankenhaus",
        library:"Bibliothek",square:"Marktplatz",park:"Uferpark",
        cafe:"Café Sonnenaufgang",post:"Postamt"
      },
      mapLabels:{
        "CENTRAL STATION":"HAUPTBAHNHOF","CITY MUSEUM":"STADTMUSEUM",
        "FARMERS MARKET":"WOCHENMARKT","CITY SCHOOL":"SCHULE","THE HOTEL":"HOTEL",
        "HOSPITAL":"KRANKENHAUS","ROSE GARDEN":"ROSENGARTEN","GREEN SQUARE":"GRÜNER PLATZ",
        "MARKET SQUARE":"MARKTPLATZ","CITY GREEN":"STADTPARK",
        "RIVERSIDE PARK":"UFERPARK","BAKERY":"BÄCKEREI","SUNRISE CAFÉ":"CAFÉ SONNENAUFGANG",
        "THEATRE":"THEATER","LIBRARY":"BIBLIOTHEK","MAPLE GROVE":"AHORNHAIN",
        "POST OFFICE":"POSTAMT","CINEMA":"KINO","SHOPS":"GESCHÄFTE"
      },
      stations:[
        ["Erkunde die Stadt","Finde Orte anhand von Hinweisen und lerne neuen Wortschatz."],
        ["Finde den Weg","Wähle Straßen und erkläre die Route."],
        ["Frag nach dem Weg","Führe ein Gespräch mit einem Besucher."],
        ["Folge meiner Wegbeschreibung","Folge mehreren Weganweisungen nacheinander."],
        ["Nimm den richtigen Bus","Lies den Fahrplan und wähle die richtige Verbindung."],
        ["Ups! Falsch abgebogen","Erkenne und korrigiere eine falsche Wegbeschreibung."],
        ["Eine unerwartete Umleitung","Finde einen anderen Weg, wenn eine Straße gesperrt ist."],
        ["Die große Stadtmission","Besuche mehrere Zwischenziele und erkläre deine Entscheidungen."]
      ],
      clues:[
        "Dein Zug ist gerade angekommen. Wo bist du?",
        "Ein Besucher möchte historische Gegenstände ansehen. Wohin muss er gehen?",
        "Jemand braucht dringend medizinische Hilfe. Wohin soll er gehen?",
        "Du möchtest dir einen Roman ausleihen. Wohin gehst du?",
        "Triff deine Freundin am Brunnen im Stadtzentrum.",
        "Du möchtest zwischen Bäumen am Fluss spazieren gehen."
      ],
      travel:{
        opening:"Ich muss ins Krankenhaus. Welche Buslinie soll ich nehmen?",
        before:"Es ist 08:35 Uhr. Du musst bis 09:10 Uhr am Krankenhaus sein.",
        access:"Der Fahrgast braucht ein barrierefreies Fahrzeug und muss bis 09:10 Uhr am Krankenhaus sein.",
        complex:"Es ist 08:35 Uhr. Eine Person mit eingeschränkter Mobilität muss bis 09:10 Uhr am Krankenhaus sein. Empfiehl eine direkte, barrierefreie Verbindung und erläutere, weshalb die anderen Krankenhausbusse nicht geeignet sind.",
        line7:"Uferpark",line12:"Stadtmuseum",line24:"Krankenhaus",
        why:"Die Linie 24 fährt um 08:47 Uhr ab und kommt um 09:05 Uhr am Krankenhaus an. Sie ist direkt und barrierefrei.",
        lineWrong:"Diese Linie fährt zu einem anderen Ziel.",
        timeWrong:"Überprüfe die Abfahrtszeit der richtigen Linie.",
        stopWrong:"Die Zielhaltestelle muss das Krankenhaus sein.",
        late:"Dieser Bus kommt nach 09:10 Uhr an. Vergleiche die Ankunftszeiten, nicht nur das Ziel.",
        notAccessible:"Dieser Bus ist nicht barrierefrei. Wähle eine Verbindung ohne Stufen.",
        missing:"Wähle alle erforderlichen Angaben aus."
      },
      repair:{
        incorrect:"Gehe vom Hauptbahnhof drei Häuserblöcke nach Osten. Biege RECHTS ab und gehe zwei Häuserblöcke nach Norden zum Stadtmuseum.",
        identify:["Drei Häuserblöcke nach Osten gehen","RECHTS abbiegen","Zwei Häuserblöcke nach Norden gehen"],
        fixes:["LINKS abbiegen und nach Norden gehen","Zwei Häuserblöcke nach SÜDEN gehen","LINKS abbiegen und nach WESTEN gehen"],
        repairWhy:"Wenn du nach Osten schaust, führt rechts nach Süden. Nach Norden kommst du, indem du links abbiegst.",
        notYet:"Der Fehler liegt beim Abbiegen, nicht bei der Anzahl der Häuserblöcke.",
        polite:"Entschuldigung, ich habe mich geirrt. Biegen Sie bitte links ab und gehen Sie weiter nach Norden."
      },
      dialogue:{
        opening:"Entschuldigung, könnten Sie mir sagen, wie ich zum Stadtmuseum komme?",
        clarify:"Tut mir leid, ich kenne Riverton nicht. Könnten Sie das genauer erklären?",
        mistake:"Auf meinem Stadtplan liegt das Museum in der anderen Richtung. Sind Sie sicher?",
        followup:"Vielen Dank! Ist es weit zu Fuß?",
        end:"Vielen Dank für Ihre Hilfe. Einen schönen Tag noch!",
        vague:"Irgendwo im Zentrum. Sie werden es schon finden.",
        wrong:"Gehen Sie nach Westen zum Fluss.",
        fix:"Sie haben recht, Entschuldigung. Ich korrigiere die Wegbeschreibung.",
        badFix:"Ignorieren Sie den Stadtplan und gehen Sie einfach weiter.",
        distance:"Es sind ungefähr fünf kurze Häuserblöcke. Ich kann es Ihnen auf dem Stadtplan zeigen.",
        badDistance:"Keine Ahnung. Gehen Sie einfach weiter.",
        goodbye:"Gern geschehen! Viel Spaß im Museum.",
        good:"Klare und angemessene Wegbeschreibung.",
        repairGood:"Gut: Du hast den Fehler zugegeben und korrigiert.",
        unclear:"Der Besucher braucht genauere Anweisungen.",
        wrongFeedback:"Diese Richtung führt vom Museum weg.",
        final:"Du hast dem Besucher geholfen. Vergleiche deine Antwort mit dem Modell."
      },
      directions:{
        north:"Norden",east:"Osten",south:"Süden",west:"Westen",
        first:(dir,blocks)=>"Gehe "+(blocks===1?"einen":String(blocks))+" "+(blocks===1?"Häuserblock":"Häuserblöcke")+" nach "+dir+".",
        turn:(side,dir,blocks)=>"Biege "+side+" ab und gehe "+(blocks===1?"einen":String(blocks))+" "+(blocks===1?"Häuserblock":"Häuserblöcke")+" nach "+dir+".",
        continue:(dir,blocks)=>"Gehe noch "+(blocks===1?"einen":String(blocks))+" "+(blocks===1?"Häuserblock":"Häuserblöcke")+" nach "+dir+".",
        left:"links",right:"rechts",back:"um",
        uturn:(dir,blocks)=>"Dreh dich um und gehe "+(blocks===1?"einen":String(blocks))+" "+(blocks===1?"Häuserblock":"Häuserblöcke")+" nach "+dir+"."
      },
      // Student instructions use du, while advice to a tourist uses Sie.
      touristDirections:{
        north:"Norden",east:"Osten",south:"Süden",west:"Westen",
        first:(dir,blocks)=>"Gehen Sie "+(blocks===1?"einen":String(blocks))+" "+(blocks===1?"Häuserblock":"Häuserblöcke")+" nach "+dir+".",
        turn:(side,dir,blocks)=>"Biegen Sie "+side+" ab und gehen Sie "+(blocks===1?"einen":String(blocks))+" "+(blocks===1?"Häuserblock":"Häuserblöcke")+" nach "+dir+".",
        continue:(dir,blocks)=>"Gehen Sie noch "+(blocks===1?"einen":String(blocks))+" "+(blocks===1?"Häuserblock":"Häuserblöcke")+" nach "+dir+".",
        uturn:(dir,blocks)=>"Drehen Sie sich um und gehen Sie "+(blocks===1?"einen":String(blocks))+" "+(blocks===1?"Häuserblock":"Häuserblöcke")+" nach "+dir+".",
        left:"links",right:"rechts",back:"um"
      },
      pair:{
        general:"Person A beschreibt den Ort oder den Weg, ohne darauf zu zeigen. Person B hört zu, entscheidet und begründet die Antwort. Dann tauscht ihr.",
        route:"Person A erklärt den Weg, ohne die Lösung zu zeigen. Person B zeichnet die Route auf dem Stadtplan nach.",
        dialogue:"Person A spielt den Besucher, Person B hilft. Tauscht die Rollen und reagiert natürlich.",
        transit:"Person A erklärt den Fahrplan, Person B wählt die Verbindung und begründet die Entscheidung.",
        quest:"Eine Person navigiert, die andere stellt Fragen und überprüft alle Zwischenziele."
      },
      profiles:{
        A1:{focus:"Orte in der Stadt und einfache Richtungen",explore:"Nenne den Ort in einem einfachen Satz.",route:"Gehe vom Hauptbahnhof zum Marktplatz. Gib drei einfache Richtungen an.",dialogue:"Stelle eine kurze höfliche Frage und antworte.",guided:"Folge kurzen, klaren Anweisungen.",transit:"Finde die richtige Busnummer.",repair:"Wähle LINKS oder RECHTS und korrigiere den Fehler.",detour:"Finde einen neuen Weg und benenne die Richtungen.",quest:"Nenne jedes Ziel und gib eine einfache Anweisung.",model:"Gehen Sie geradeaus. Biegen Sie links ab. Hier ist der Marktplatz.",dialogueAnswer:"Ja. Gehen Sie geradeaus und biegen Sie am Platz links ab.",speaking:"Verwende kurze Sätze: Geradeaus. Links abbiegen.",stretch:"Ergänze einen Ort oder eine Präposition.",support:"Nutze die Pfeile und die Namen der Orte."},
        A2:{focus:"Reihenfolge, Orientierungspunkte und einfache Fragen",explore:"Erkläre, welcher Ort zum Hinweis passt.",route:"Finde das Museum und beschreibe den Weg in der richtigen Reihenfolge.",dialogue:"Bitte um Klärung und antworte höflich.",guided:"Folge einfachen Abbiegungen und Orientierungspunkten.",transit:"Wähle Linie und Abfahrtszeit.",repair:"Erkläre, welche Abbiegung falsch ist.",detour:"Beschreibe einen anderen Weg.",quest:"Gib an jeder Station zwei Weganweisungen.",model:"Gehen Sie drei Häuserblöcke geradeaus und biegen Sie dann links ab. Das Museum liegt weiter vorn.",dialogueAnswer:"Gerne. Gehen Sie vom Hauptbahnhof drei Häuserblöcke nach Osten, biegen Sie links ab und gehen Sie zwei weitere Häuserblöcke nach Norden. An dieser Kreuzung erreichen Sie das Stadtmuseum.",speaking:"Nutze zuerst, dann und schließlich.",stretch:"Ergänze eine ungefähre Entfernung oder einen Orientierungspunkt.",support:"Verwende Reihenfolgewörter und einfache Straßenbeschreibungen."},
        B1:{focus:"Selbstständige Wegbeschreibung und Klärung von Missverständnissen",explore:"Begründe deine Wahl mit einem Hinweis.",route:"Finde das Museum und erkläre die Route in ganzen Sätzen.",dialogue:"Erkläre den Weg und behebe Missverständnisse.",guided:"Folge einer längeren Wegbeschreibung.",transit:"Wähle Linie, Zeit und Zielhaltestelle.",repair:"Korrigiere und erläutere eine falsche Anweisung.",detour:"Erkläre die Folgen einer Straßensperrung.",quest:"Verbinde drei Orte durch klare Weganweisungen.",model:"Gehen Sie auf der Bahnhofstraße nach Osten, biegen Sie links ab und gehen Sie weiter nach Norden bis zum Stadtmuseum.",dialogueAnswer:"Natürlich. Gehen Sie drei Häuserblöcke nach Osten, biegen Sie links ab und gehen Sie dann zwei Häuserblöcke nach Norden. Dort sehen Sie das Museum.",speaking:"Nenne Richtungen, Orientierungspunkte und einen höflichen Abschluss.",stretch:"Vergleiche deinen Weg mit einer Alternative.",support:"Nutze klare Imperative und frage, ob die andere Person alles verstanden hat."},
        B2:{focus:"Alternativen, Begründungen und genaue Reihenfolge",explore:"Begründe deine Antwort mit einem passenden Argument.",route:"Gehe über den Marktplatz zum Museum und begründe diese Wahl.",dialogue:"Gib genaue Anweisungen und passe deine Antwort an.",guided:"Folge einer anderen Route und erläutere die Abbiegungen.",transit:"Wähle eine pünktliche Verbindung und begründe sie.",repair:"Erkläre, warum der Fehler zu Verwirrung führen kann.",detour:"Vergleiche zwei mögliche Umleitungen.",quest:"Vergleiche deinen Weg mit einer Alternative.",model:"Ich würde über den Marktplatz gehen und von dort zum Museum weiterlaufen, denn dieser Weg ist durch die markanten Gebäude leicht zu erkennen.",dialogueAnswer:"Gehen Sie vom Hauptbahnhof zwei Häuserblöcke nach Osten, biegen Sie links ab und gehen Sie einen Block nach Norden zum Marktplatz. Gehen Sie von dort einen Block nach Osten und folgen Sie anschließend der Straße nach Norden einen weiteren Block bis zum Stadtmuseum. Die zusätzliche Abzweigung nach Osten ist wichtig.",speaking:"Begründe deine Wahl und nenne eine Alternative.",stretch:"Berücksichtige Barrierefreiheit und persönliche Prioritäten.",support:"Nutze Formulierungen wie ich würde empfehlen, alternativ und weil."},
        C1:{focus:"Präzision, Sprachregister und unterschiedliche Anforderungen",explore:"Beschreibe die Lage präzise, ohne den Namen zu nennen.",route:"Gehe zunächst zur Bibliothek und dann zum Museum. Begründe deine Route.",dialogue:"Passe deinen Ton an und kläre Unsicherheiten.",guided:"Folge einer komplexen Wegbeschreibung ohne Orientierungsverlust.",transit:"Berücksichtige Barrierefreiheit und Ankunftsfrist.",repair:"Korrigiere die Anweisung taktvoll und eindeutig.",detour:"Begründe einen zweckmäßigen, barrierefreien Umweg.",quest:"Plane mehrere Stationen und erläutere die Entscheidungen.",model:"Da ein Zwischenstopp an der Bibliothek vorgesehen ist, würde ich vom Bahnhof aus zunächst Richtung Norden gehen, die Innenstadt durchqueren und mich dann von Osten dem Museum nähern.",dialogueAnswer:"Sehr gern. Gehen Sie vom Hauptbahnhof zwei Häuserblöcke nach Osten und biegen Sie links ab. Nach einem Häuserblock nach Norden erreichen Sie den Marktplatz. Dort biegen Sie rechts ab, gehen einen Block nach Osten und anschließend links einen Block nach Norden zum Stadtmuseum. Entscheidend ist die Abbiegung nach Osten am Platz.",speaking:"Kläre Voraussetzungen, begründe Prioritäten und achte auf den angemessenen Ton.",stretch:"Stelle eine Alternative mit Vor- und Nachteilen vor.",support:"Nutze Konditionalsätze, genaue Bezugspunkte und höfliche Rückfragen."},
        C2:{focus:"Sprachliche Nuancen, Mehrdeutigkeit und Vermittlung",explore:"Beschreibe einen Ort eindeutig und berücksichtige andere Deutungen.",route:"Gehe über die Bibliothek zum Museum, vermeide die Baustelle und erkläre die Zielkonflikte.",dialogue:"Löse Mehrdeutigkeiten diplomatisch bei wechselnden Bedingungen.",guided:"Deute komplexe Anweisungen und formuliere sie unmissverständlich um.",transit:"Begründe die zuverlässigste barrierefreie Fahrt unter Zeitdruck.",repair:"Erkenne den Widerspruch und formuliere die Anweisung diplomatisch neu.",detour:"Entwickle eine robuste Ausweichroute und erläutere die Gründe.",quest:"Führe jemanden zu drei Zielen und berücksichtige Unsicherheiten.",model:"Unter Berücksichtigung der Baustelle und des Zwischenstopps an der Bibliothek würde ich einen nördlichen Weg durch das Zentrum wählen und anschließend das Museum von Osten ansteuern.",dialogueAnswer:"Selbstverständlich. Für eine eindeutige Orientierung gehen Sie vom Hauptbahnhof zwei Häuserblöcke nach Osten, biegen links ab und erreichen nach einem Block nach Norden den Marktplatz. Dort gehen Sie rechts einen Block nach Osten und dann links einen Block nach Norden zum Stadtmuseum. Gehen Sie vom Platz aus nicht geradeaus weiter nach Norden: Die Abbiegung nach Osten ist unerlässlich.",speaking:"Formuliere differenziert, präzise und adressatengerecht; beuge Missverständnissen vor.",stretch:"Wäge widersprüchliche Ziele ab und begründe einen Ausweichplan.",support:"Unterscheide gesicherte Angaben von Schätzungen und prüfe das Verständnis."}
      }
    },
    fr:{
      name:"French",native:"Français",locale:"fr",short:"FR",
      ui:{
        language:"Langue",level:"Niveau",mode:"Mode d'entraînement",solo:"Individuel",pair:"Binôme · consignes",
        station:"Étape",completed:"missions terminées",choose:"Choisissez une réponse",
        next:"Étape suivante",restart:"Recommencer",undo:"Annuler",check:"Vérifier",
        retry:"Réessayez",correct:"Bonne réponse !",notQuite:"Pas tout à fait. Essayez encore.",
        mission:"Votre mission",progress:"Progression",model:"Réponse modèle",reveal:"Afficher l'exemple",
        selfcheck:"Répondez d'abord à voix haute. Votre production orale n'est ni enregistrée ni évaluée automatiquement.",
        selfdone:"J'ai parlé et vérifié ma réponse",finish:"Mission terminée",
        compass:"Avancez d'un pâté de maisons",east:"Est",west:"Ouest",north:"Nord",south:"Sud",
        from:"De",to:"À",blocks:"pâtés de maisons",remaining:"pâtés de maisons jusqu'à l'arrivée",
        route:"Itinéraire",line:"Ligne",departure:"Départ",arrival:"Arrivée",stop:"Destination",
        plan:"Planificateur de trajet",closed:"RUE BARRÉE",map:"Plan de la ville",hint:"Indice",
        vocabulary:"Vocabulaire",speaking:"Défi oral",yourTurn:"À vous de jouer",
        feedback:"Retour",help:"Aide linguistique",alternative:"Autre itinéraire possible",
        checkpoint:"Point de passage",score:"Bonnes réponses",roleA:"Élève A",roleB:"Élève B",
        switch:"Inversez les rôles",goal:"Objectif",ready:"Prêt",review:"Vérifier",
        changeSession:"Changer de langue ou de niveau réinitialise cette séance locale.",
        offline:"Fonctionne sans serveur. Aucune donnée d'élève n'est transmise ni enregistrée.",
        skip:"Passer pour le moment",narrator:"Touriste",answer:"Votre réponse",restartScene:"Recommencer le dialogue",
        showHint:"Afficher un indice",arrived:"Vous êtes à destination !",step:"Étape",
        partnerIntro:"Travaillez à deux. Une personne explique la situation, l'autre répond sans consulter le modèle. Puis inversez les rôles.",
        objective:"Communiquez clairement : cliquer sur la bonne option ne suffit pas.",
        wrongRoad:"La rue est barrée. Trouvez un autre chemin.",illegal:"Avancez d'un pâté de maisons à la fois.",
        end:"Fin de l'activité",restartStation:"Recommencer cette étape",same:"Vous êtes déjà ici.",
        guide:"Lisez l'indication et choisissez la bonne rue.",
        transportWhy:"Expliquez pourquoi vous avez choisi ce trajet plutôt que les autres.",
        noSpeechGrade:"L'oral fait l'objet d'une autoévaluation ou d'un retour entre pairs, et non d'une notation automatique.",
        select:"Sélectionnez...",confirm:"Valider le choix",dialogueError:"Essayez une réponse plus utile et plus précise.",
        left:"Gauche",right:"Droite",straight:"Tout droit",
        via:"en passant par",roleMode:"Activité en binôme",checkRoute:"Vérifier l'itinéraire",passCheckpoint:"Aller au point suivant",
        training:"Entraînement linguistique",routeCompleted:"Itinéraire terminé",challengeFinished:"Défi terminé",
        directions:"Indications",speakNow:"Expliquez l'itinéraire à voix haute",city:"Riverton",
        start:"Gare centrale",museum:"Musée municipal",square:"Place du Marché",library:"Bibliothèque",hospital:"Hôpital",
        departureBoard:"Tableau des départs",arrivalBefore:"Arrivée avant",accessible:"Service accessible sans marches",
        feedbackGood:"Très bien. L'itinéraire et les réponses sont corrects.",
        feedbackRetry:"Vérifiez la rue, la direction ou les contraintes et réessayez."
      },
      places:{
        station:"Gare centrale",museum:"Musée municipal",hospital:"Hôpital",
        library:"Bibliothèque",square:"Place du Marché",park:"Parc des Berges",
        cafe:"Café de l'Aurore",post:"Bureau de poste"
      },
      mapLabels:{
        "CENTRAL STATION":"GARE CENTRALE","CITY MUSEUM":"MUSÉE MUNICIPAL",
        "FARMERS MARKET":"MARCHÉ","CITY SCHOOL":"ÉCOLE","THE HOTEL":"HÔTEL",
        "HOSPITAL":"HÔPITAL","ROSE GARDEN":"ROSERAIE","GREEN SQUARE":"PLACE VERTE",
        "MARKET SQUARE":"PLACE DU MARCHÉ","CITY GREEN":"ESPACE VERT",
        "RIVERSIDE PARK":"PARC DES BERGES","BAKERY":"BOULANGERIE",
        "SUNRISE CAFÉ":"CAFÉ DE L'AURORE","THEATRE":"THÉÂTRE",
        "LIBRARY":"BIBLIOTHÈQUE","MAPLE GROVE":"ÉRABLIÈRE",
        "POST OFFICE":"BUREAU DE POSTE","CINEMA":"CINÉMA","SHOPS":"BOUTIQUES"
      },
      stations:[
        ["Explorez la ville","Identifiez les lieux et enrichissez le vocabulaire."],
        ["Trouvez l'itinéraire","Choisissez les rues et expliquez comment y arriver."],
        ["Demandez votre chemin","Participez à un échange avec un visiteur."],
        ["Suivez mes indications","Avancez en suivant les consignes successives."],
        ["Prenez le bon bus","Lisez les horaires et choisissez le trajet adapté."],
        ["Oups ! Mauvaise direction","Repérez et corrigez une indication inexacte."],
        ["Un détour inattendu","Adaptez votre itinéraire lorsqu'une rue est barrée."],
        ["Le grand défi urbain","Rejoignez plusieurs lieux et expliquez vos choix."]
      ],
      clues:[
        "Votre train vient d'arriver. Où êtes-vous ?",
        "Un visiteur veut voir des objets historiques. Où doit-il aller ?",
        "Quelqu'un a besoin de soins médicaux urgents. Où doit-il aller ?",
        "Vous souhaitez emprunter un roman. Où allez-vous ?",
        "Retrouvez une amie près de la fontaine, au centre-ville.",
        "Vous voulez vous promener parmi les arbres au bord de la rivière."
      ],
      travel:{
        opening:"Je dois aller à l'hôpital. Quelle ligne dois-je prendre ?",
        before:"Il est 8 h 35. Vous devez être à l'hôpital avant 9 h 10.",
        access:"La personne a besoin d'un véhicule accessible sans marches et doit arriver avant 9 h 10.",
        complex:"Il est 8 h 35. Une personne à mobilité réduite doit arriver à l'hôpital avant 9 h 10. Recommandez un trajet direct et accessible et justifiez pourquoi les autres bus vers l'hôpital ne conviennent pas.",
        line7:"Parc des Berges",line12:"Musée municipal",line24:"Hôpital",
        why:"La ligne 24 part à 8 h 47 et arrive à l'hôpital à 9 h 05. C'est un service direct et accessible.",
        lineWrong:"Cette ligne dessert une autre destination.",
        timeWrong:"Vérifiez l'heure de départ de la bonne ligne.",
        stopWrong:"Votre destination doit être l'hôpital.",
        late:"Ce bus arrive après 9 h 10. Comparez les heures d'arrivée, pas seulement la destination.",
        notAccessible:"Ce bus n'est pas accessible sans marches. Choisissez un service adapté aux besoins du voyageur.",
        missing:"Sélectionnez toutes les informations demandées."
      },
      repair:{
        incorrect:"Depuis la gare centrale, avancez de trois pâtés de maisons vers l'est. Tournez à DROITE puis avancez de deux pâtés de maisons vers le nord pour atteindre le musée.",
        identify:["Avancez de trois pâtés de maisons vers l'est","Tournez à DROITE","Avancez de deux pâtés de maisons vers le nord"],
        fixes:["Tournez à GAUCHE puis avancez vers le nord","Continuez vers le SUD sur deux pâtés de maisons","Tournez à GAUCHE puis avancez vers l'OUEST"],
        repairWhy:"Lorsque vous regardez vers l'est, tourner à droite mène au sud. Pour aller au nord, il faut tourner à gauche.",
        notYet:"L'erreur concerne le virage, pas le nombre de pâtés de maisons.",
        polite:"Veuillez m’excuser, je vous ai indiqué la mauvaise direction. Tournez plutôt à gauche et continuez vers le nord."
      },
      dialogue:{
        opening:"Excusez-moi, pourriez-vous m'indiquer le chemin du musée ?",
        clarify:"Désolé, je ne connais pas Riverton. Pourriez-vous être plus précis ?",
        mistake:"Mon plan indique la direction opposée. Vous êtes sûr ?",
        followup:"Merci beaucoup ! Est-ce loin à pied ?",
        end:"Merci pour votre aide. Bonne journée !",
        vague:"C'est quelque part dans le centre. Vous le trouverez.",
        wrong:"Allez vers l'ouest, en direction de la rivière.",
        fix:"Vous avez raison, excusez-moi. Je vais corriger mes indications.",
        badFix:"Ignorez votre plan et continuez simplement à marcher.",
        distance:"C'est à environ cinq petits pâtés de maisons. Je peux vous montrer sur le plan.",
        badDistance:"Je n'en ai aucune idée. Continuez à marcher.",
        goodbye:"Je vous en prie ! Bonne visite !",
        good:"Indications claires et adaptées.",
        repairGood:"Bien : vous avez reconnu l'erreur et l'avez corrigée.",
        unclear:"Le visiteur a besoin d'indications plus précises.",
        wrongFeedback:"Cette direction éloignerait le visiteur du musée.",
        final:"Vous avez aidé le visiteur. Comparez votre réponse au modèle."
      },
      directions:{
        north:"nord",east:"est",south:"sud",west:"ouest",
        first:(dir,blocks)=>"Avancez "+(blocks===1?"d’un":"de "+blocks)+" "+(blocks===1?"pâté":"pâtés")+" de maisons vers "+(/^(est|ouest)$/.test(dir)?"l'":"le ")+dir+".",
        turn:(side,dir,blocks)=>"Tournez à "+side+" et avancez "+(blocks===1?"d’un":"de "+blocks)+" "+(blocks===1?"pâté":"pâtés")+" de maisons vers "+(/^(est|ouest)$/.test(dir)?"l'":"le ")+dir+".",
        continue:(dir,blocks)=>"Continuez sur "+(blocks===1?"un":String(blocks))+" "+(blocks===1?"pâté":"pâtés")+" de maisons vers "+(/^(est|ouest)$/.test(dir)?"l'":"le ")+dir+".",
        left:"gauche",right:"droite",back:"demi-tour",
        uturn:(dir,blocks)=>"Faites demi-tour et avancez "+(blocks===1?"d'un":"de "+blocks)+" "+(blocks===1?"pâté":"pâtés")+" de maisons vers "+(/^(est|ouest)$/.test(dir)?"l'":"le ")+dir+"."
      },
      pair:{
        general:"L'élève A décrit le lieu ou le chemin sans montrer la carte. L'élève B écoute, décide puis justifie son choix. Inversez ensuite les rôles.",
        route:"L'élève A donne les indications sans dévoiler la solution. L'élève B trace le chemin sur le plan.",
        dialogue:"L'élève A joue le touriste et l'élève B l'aide. Inversez les rôles et réagissez naturellement.",
        transit:"L'élève A explique les horaires ; l'élève B choisit le bus et justifie son choix.",
        quest:"Une personne guide, l'autre pose des questions et vérifie chaque étape."
      },
      profiles:{
        A1:{focus:"Lieux de la ville et directions simples",explore:"Nommez le lieu dans une phrase simple.",route:"Allez de la gare centrale à la place du Marché. Donnez trois indications simples.",dialogue:"Posez une question courte et polie.",guided:"Suivez des indications courtes et claires.",transit:"Trouvez le bon numéro de bus.",repair:"Choisissez GAUCHE ou DROITE et corrigez l'erreur.",detour:"Trouvez un autre chemin et nommez les directions.",quest:"Nommez chaque destination et donnez une indication simple.",model:"Allez tout droit. Tournez à gauche. La place est ici.",dialogueAnswer:"Oui. Allez tout droit et tournez à gauche près de la place.",speaking:"Utilisez des phrases courtes : Tout droit. À gauche.",stretch:"Ajoutez un lieu ou une préposition.",support:"Utilisez les flèches et les noms des lieux."},
        A2:{focus:"Étapes, repères et questions simples",explore:"Expliquez quel lieu correspond à l'indice.",route:"Trouvez le musée et expliquez les étapes dans l'ordre.",dialogue:"Demandez une précision et répondez poliment.",guided:"Suivez des virages et des repères simples.",transit:"Choisissez la ligne et l'heure de départ.",repair:"Expliquez quel virage est incorrect.",detour:"Décrivez un autre itinéraire.",quest:"Donnez deux indications entre les étapes.",model:"Avancez de trois pâtés de maisons, puis tournez à gauche. Le musée est un peu plus loin.",dialogueAnswer:"Bien sûr. Depuis la gare centrale, avancez de trois pâtés de maisons vers l'est, tournez à gauche et poursuivez deux pâtés de maisons vers le nord. Vous arriverez au musée municipal à ce carrefour.",speaking:"Utilisez d'abord, puis et enfin.",stretch:"Ajoutez une distance approximative ou un repère.",support:"Utilisez des connecteurs et de courtes descriptions."},
        B1:{focus:"Indications autonomes et réparation des malentendus",explore:"Justifiez votre choix à l'aide d'un indice.",route:"Trouvez le musée et expliquez le parcours en phrases complètes.",dialogue:"Donnez des indications et clarifiez les malentendus.",guided:"Suivez plusieurs indications successives.",transit:"Choisissez la ligne, l'heure et l'arrêt d'arrivée.",repair:"Corrigez et expliquez une indication erronée.",detour:"Expliquez les conséquences d'une rue barrée.",quest:"Reliez trois lieux et donnez des indications claires.",model:"Allez vers l'est par la rue de la Gare, tournez à gauche et continuez vers le nord jusqu'au musée municipal.",dialogueAnswer:"Bien sûr. Avancez de trois pâtés de maisons vers l'est, tournez à gauche et continuez sur deux pâtés de maisons vers le nord. Vous verrez le musée.",speaking:"Précisez les directions, les repères et une formule de politesse.",stretch:"Comparez votre itinéraire à une autre possibilité.",support:"Utilisez l'impératif et vérifiez que votre interlocuteur comprend."},
        B2:{focus:"Alternatives, justifications et enchaînement précis",explore:"Justifiez votre réponse avec un argument pertinent.",route:"Passez par la place du Marché pour rejoindre le musée et expliquez ce choix.",dialogue:"Donnez des indications précises et adaptez votre réponse.",guided:"Suivez un autre parcours et expliquez chaque virage.",transit:"Choisissez un service ponctuel et justifiez votre choix.",repair:"Expliquez comment l'erreur pourrait créer une confusion.",detour:"Comparez deux détours possibles.",quest:"Comparez votre parcours à une solution alternative.",model:"Je vous conseillerais de passer par la place du Marché avant de rejoindre le musée : les repères y sont faciles à reconnaître.",dialogueAnswer:"Depuis la gare centrale, avancez de deux pâtés de maisons vers l'est, tournez à gauche et continuez sur un pâté de maisons vers le nord jusqu'à la place du Marché. De là, avancez d'un pâté de maisons vers l'est, puis suivez la rue vers le nord sur un dernier pâté de maisons jusqu'au musée municipal. Ce détour vers l'est est indispensable.",speaking:"Justifiez votre choix, proposez une alternative et clarifiez les doutes.",stretch:"Prenez en compte l'accessibilité et les priorités du visiteur.",support:"Utilisez je vous conseillerais, autrement ou puisque."},
        C1:{focus:"Précision, registre et contraintes",explore:"Décrivez précisément le lieu sans le nommer.",route:"Passez par la Bibliothèque avant le musée et justifiez votre parcours.",dialogue:"Adaptez votre registre et dissipez les incertitudes.",guided:"Suivez un itinéraire complexe sans perdre le fil.",transit:"Tenez compte de l'accessibilité et d'une heure limite.",repair:"Corrigez l'erreur avec tact et sans ambiguïté.",detour:"Défendez un autre itinéraire efficace et accessible.",quest:"Organisez plusieurs arrêts avec des explications précises.",model:"Puisqu'un passage par la Bibliothèque est prévu, je partirais vers le nord depuis la gare, traverserais le centre et rejoindrais ensuite le musée par l'est.",dialogueAnswer:"Avec plaisir. Depuis la gare centrale, avancez de deux pâtés de maisons vers l'est, puis tournez à gauche et marchez un pâté de maisons vers le nord jusqu'à la place du Marché. Tournez alors à droite, avancez un pâté de maisons vers l'est, puis à gauche pour un dernier pâté de maisons vers le nord jusqu'au musée municipal. Le virage vers l'est sur la place est essentiel.",speaking:"Clarifiez les hypothèses, hiérarchisez les priorités et adaptez le registre.",stretch:"Proposez une autre solution en évaluant ses avantages et limites.",support:"Utilisez des formulations conditionnelles, des repères précis et des demandes de confirmation."},
        C2:{focus:"Nuances, ambiguïtés et médiation pragmatique",explore:"Décrivez le lieu sans ambiguïté et envisagez des interprétations alternatives.",route:"Rejoignez le musée par la Bibliothèque tout en évitant les travaux ; justifiez les compromis.",dialogue:"Levez les ambiguïtés avec diplomatie lorsque les contraintes changent.",guided:"Interprétez des consignes détaillées et reformulez-les sans ambiguïté.",transit:"Défendez le trajet accessible le plus fiable dans un délai strict.",repair:"Identifiez la contradiction et reformulez les indications avec diplomatie.",detour:"Élaborez un détour robuste et justifiez votre raisonnement.",quest:"Guidez un visiteur par trois étapes tout en anticipant ses doutes.",model:"Compte tenu des travaux et de l'arrêt à la Bibliothèque, je privilégierais un passage par le nord du centre avant de rejoindre le musée depuis l'est.",dialogueAnswer:"Bien entendu. Pour éviter toute ambiguïté, depuis Central Station, avancez de deux pâtés de maisons vers l'est, tournez à gauche, puis marchez un pâté de maisons vers le nord jusqu'à la place du Marché. Sur la place, tournez à droite pour un pâté de maisons vers l'est, puis à gauche pour un dernier pâté de maisons vers le nord jusqu'au musée municipal. Ne continuez pas tout droit vers le nord depuis la place : ce virage vers l'est est indispensable.",speaking:"Donnez des indications nuancées, concises et adaptées à l'interlocuteur ; anticipez les malentendus.",stretch:"Pesez les priorités contradictoires et défendez un itinéraire de repli.",support:"Distinguez les faits des estimations et vérifiez explicitement la compréhension."}
      }
    }
  };
  for(const [lang,data] of Object.entries(additions)){
    if(content.packs[lang])throw new Error("Duplicate City Quest language pack: "+lang);
    content.packs[lang]=data;
  }
})(typeof globalThis!=="undefined"?globalThis:this);
