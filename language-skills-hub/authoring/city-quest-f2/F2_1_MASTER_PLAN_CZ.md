# LSH CITY QUEST — F2.1 MASTER PLAN
## Mobile Navigation HUD + Riverton Metro / Premium Game Expansion
**Verze:** návrh 1.0 · 20. 11. 2026  
**Stav:** implementační specifikace k vývoji a vizuální přejímce; **NEJDE O IMPLEMENTACI**.  
**Podklad:** F0.1 (PR #138), F1 (PR #141), F2 EN/ES/DE/FR × A1–C2 (PR #143).  
**Produkce:** beze změny. Změny implementovat pouze izolovaně a po testech.

### 0. Výchozí audit skutečného kódu
V \`language-skills-hub/konverzace/city-quest-f2/f2.js\` je u mapy generována komponenta \`#f2Quick\` (vkládá se přes \`viewport.insertAdjacentElement("afterend",quick)\`), zatímco funkce \`controls(panel,...)\` v jednotlivých mapových úlohách generuje další \`.f2-controls\` v panelu úlohy. Tyto ovladače jsou na mobilu z hlediska studenta duplicitní a nutí přeskakovat pohledem mezi mapou a spodní částí stránky. Ve zděděném F0 HTML existují rovněž \`.direction-tools\` pro starší trasovací režim, byť je v F2 schovaný.

**Designové rozhodnutí:** nespravit problém pouze přesunutím nebo překrytím CSS. V F2.1 musí být **jediná autoritativní komponenta směrového ovládání** pro aktuální mapovou misi a jediný handler akcí. Klávesnice, dotyk na křižovatku a D-pad mohou volat tutéž herní akci, nikoli soupeřit o stav.

### 1. Cíl a pedagogické parametry
- **Výsledek:** prémiově působící interaktivní dobrodružství ve fiktivním městě Riverton, které od B1 přirozeně pokračuje do sítě metra; žák řeší orientaci, rozhoduje se a **komunikuje**, nikoli jen kliká na testové možnosti.
- **Jazyky:** angličtina, španělština, němčina, francouzština, bez živého překladu a bez API.
- **Úrovně:** A1, A2, B1, B2, C1, C2. Každá musí mít skutečně odpovídající jazykový výkon, nejen odlišný počet slov.
- **Cílová skupina:** gymnázium, přibližně 12–19 let.
- **Čas:** jedna stanice 5–12 minut, doporučená hodina 45 minut pro 3–4 stanice; kompletní dobrodružství rozdělit do 2 × 45 minut nebo více.
- **Režimy:** Solo (simulace, výběr, nahlas vyslovené odpovědi se sebekontrolou), Pair (informační mezera, role cestující / navigátor / dispečer a vzájemná kontrola), volitelně učitelská projekce bez studentských účtů.
- **Slabší žáci:** vizuální zvýraznění, nabídka klíčových frází a vzor až po pokusu, kratší trasy, možnost znovu poslechnout/číst hlášení.
- **Silnější žáci:** bez nápovědy, omezení trasy, více alternativ, zdůvodnění kompromisu, formální a neformální registr, aktivní oprava nejasností.
- **Hodnocení:** automatika smí kontrolovat jen deterministické kroky, trasu, přestupy a uzavřené volby. Spontánní výslovnost a argumentaci **nehodnotit jako AI skóre**. Bez serveru nelze tvrdit průkazné testové zabezpečení.

### 2. Definitivní skladba osmi stanic
Zachovat čísla a rozložení. U A1–A2 **osm městských misí**; od B1 se mění stanice 05–07 na metro a stanice 08 propojí oba světy.

| # | A1–A2: město | B1–B2: město + metro | C1–C2: vyspělé město + metro |
|---|---|---|---|
| **01** | Explore the City – místa a základní fráze | Explore the City – funkce míst, kontext | Explore the City – přesná terminologie, nejasnosti |
| **02** | Find the Route – jednoduchá pěší cesta | Find the Route – popis a odůvodnění | Find the Route – přístupnost, časové priority |
| **03** | Ask for Directions – krátký dialog | Ask for Directions – zdvořilá žádost, upřesnění | Ask for Directions – registr, nepřímé požadavky |
| **04** | Follow My Directions – kroková navigace | Follow My Directions – sekvence a kontrola porozumění | Follow My Directions – složené informace, opravy |
| **05** | Catch the Right Bus | **Metro Basics: Find the Right Line** | **Metro Navigator: Weigh the Options** |
| **06** | Oops! Wrong Turn (ulice) | **Change Lines: Transfer Mission** | **Platform Confusion: Explain and Negotiate** |
| **07** | The Unexpected Detour (ulice) | **Metro Disruption: Reroute** | **Service Crisis: Multi-Constraint Decision** |
| **08** | Ultimate City Quest (jen ulice) | **Final Mixed Quest: City + Metro** | **Final Expedition: City + Metro + Constraints** |

**Důsledek:** stále existuje 8 herních stanic a 24 jazykově-úrovňových konfigurací, nikoli devátá či desátá laboratoř. Z pohledu pokrytí jde o 8 × 4 × 6 = **192 kombinací stanice–jazyk–úroveň**. Společné enginy se neopakují 192krát.

### 3. Diferenciace metra od B1
| Úroveň | Herní složitost metra | Očekávaný jazykový výkon |
|---|---|---|
| **A1** | Žádné metro, jen pěší orientace a základní městská doprava | Místo, směr, jednoduchý imperativ |
| **A2** | Žádné metro; čtení jednoduchého jízdního řádu autobusu | Krátká řada pokynů a jednoduchá otázka |
| **B1** | 3 linky, 1 přestup v misích 06–08, názvy směrů a nástupišť | Souvisle vysvětlit trasu a opravit omyl |
| **B2** | Porovnat dvě validní trasy, omezení času, hlášení o změně | Odůvodnit volbu, nabídnout alternativu |
| **C1** | Přístupnost, priority cestujícího, neúplné informace, vhodný registr | Vysvětlit řešení a ověřit porozumění |
| **C2** | Kombinované výluky / nejistota, konfliktní podklady, více kritérií | Nuancované doporučení a vyjednání nejlepší varianty |

**Pozor:** stanice nesmí vytvářet nemožnou situaci jen kvůli obtížnosti. Každá scénářová změna sítě musí mít v testovacích datech alespoň jedno ověřené dosažitelné řešení.

### 4. Riverton Metro — jednotná fiktivní síť
**Značka:** RIVERTON METRO. **Výtvarný směr:** prémiová vektorová mapa na samostatné herní vrstvě, nikoliv statická fotografie. Linky mají kód, barvu i odlišný symbol; kontrast obstojí i u barevné vady zraku.

**M1 / Azure Line (západ–východ)**  
West End → **Central Station** → Old Town → **Museum Quarter** → Riverside → East Gardens.

**M2 / Emerald Line (sever–jih)**  
North Park → **University** → **Central Station** → **Market Square** → South Gate.

**M3 / Coral Line (severozápad–jihovýchod)**  
Hilltop → **University** → Science Centre → **Museum Quarter** → Stadium → Harbour.

Celkem **14 unikátních stanic** (6 + 5 + 6 minus tři přestupní průsečíky). Přestupní uzly:
- Central Station: **M1 ↔ M2**
- University: **M2 ↔ M3**
- Museum Quarter: **M1 ↔ M3**

**Propojení s povrchovým městem:**  
Central Station ↔ povrchová křižovatka F2 \`{c:0,r:3}\`; Market Square ↔ \`{c:2,r:2}\`; Museum Quarter ↔ nově zakreslený vstup k muzeu \`{c:3,r:2}\` (odtud jeden blok severně k City Museum, \`{c:3,r:1}\`); Riverside ↔ povrchový Riverside Park. Portály definovat v datech, nikoli odvozovat z pixelů SVG.

**Síťová data:** \`stationId\`, \`lineId\`, \`orderedStops\`, \`edges\` (páry sousedů), \`minutes\` (fiktivní pevné hodnoty), \`directionTerminus\`, \`platform\`, \`transferEdges\`, \`closureId\`, \`accessible\`, \`surfacePortal\`, \`scenarioId\`. Přestup není „teleport“, ale explicitní akce s informačním panelem.

**Pravidlo časů:** jen simulované, výslovně fiktivní jízdní řády a pevná scénářová data; žádná zdánlivě živá dopravní data či vymyšlené aktuální odjezdy.

### 5. Čtyři metro-mise od B1: detailní storyboard
#### 05 — Find the Right Line / Metro Basics
**Zadání B1:** Jsi na Central Station. Chceš k muzeu. Vyhledej **M1 směr East Gardens**, nastup na správné nástupiště a vystup na **Museum Quarter**.  
**Interakce:** vybrat linku, směr (terminus), nástupiště, potvrdit nástup, sledovat postup po stanicích a vystoupit. V jednom bodě příjezdová tabule nabízí lákavý **špatný směr**.  
**Zpětná vazba:** důvod správné volby + možnost říct: *Take M1 towards East Gardens. Get off at Museum Quarter.*  
**Vyšší CEFR:** přidat čas odjezdu, přístupnost a porovnání variant.

#### 06 — Change Lines / Transfer Mission
**Zadání B1:** Z **Market Square** na **Stadium**: M2 přes Central Station do **University**, přestoupit na **M3** směrem Harbour a vystoupit na Stadium.  
**Interakce:** vyznačit místo přestupu, zvolit výstupní nástupiště, přejít simulovanou halou s ukazateli, nastoupit do správného vlaku.  
**Chybové větve:** špatný směr / zmeškaný přestup / záměna nástupišť; náprava bez resetování celé mise.  
**Vyšší CEFR:** zdvořilé vysvětlení alternativ a realistických omezení.

#### 07 — Metro Disruption / Service Crisis
**Zadání B1:** Úsek **M1 Old Town ↔ Museum Quarter** je uzavřen. Z Central Station se přesto musíš dostat do Museum Quarter.  
**Vzor validního řešení:** M2 z Central Station na **University**, zde přestup na M3 směrem Harbour, výstup Museum Quarter.  
**Interakce:** přečíst výlukové hlášení, vyhledat alternativu, vybrat správnou platformu; červené blokování příslušné hrany v mapě.  
**B2–C2:** časové limity, dvě možná řešení, nutnost obhájit přístupnost, spolehlivost či nejmenší počet přestupů. Připravit oddělené testované scénáře, ne improvizované náhodné výluky.

#### 08 — The Ultimate City & Metro Quest
**B1 mixed quest, po sobě:**  
1. **City:** dojít pěšky od Central Station k Market Square a vysvětlit cestu.  
2. **Metro:** vstoupit do M2 na Market Square, jet směr North Park k University.  
3. **Transfer:** na University přestoupit na M3 směr Harbour a vystoupit Museum Quarter.  
4. **City:** projít výstupem z metra a dojít od portálu \`{c:3,r:2}\` jeden blok severně k City Museum.  
5. **Language:** souvisle vysvětlit trasu turistovi, případně vysvětlit přestup ve dvojici.

**Herní checkpointy:** každý přechod mezi městem, mapou metra, nástupištěm a pěší cestou se děje vědomou akcí. Žák nikdy nesmí skončit v neznámém prostoru bez informace, kde se nachází a co má udělat.

### 6. F2.1A — jediné mobilní ovládání (BLOCKER)
**Výchozí chyba v kódu:** paralelní \`.f2-controls\` (v panelu úlohy) a \`#f2Quick\` (u mapy). Legacy \`.direction-tools\` je nutné prověřit jako potenciální zdroj další duplicity.

**Cílová komponenta:** \`NavigationHUD\` žije **uvnitř \`.map-card\` přímo za mapovým viewportem**. Existuje právě jedna instance na obrazovce. Při mapových misích se zobrazuje; při výběrových úlohách se neuplatní.

**Mobilní skladba:**
\`\`\`text
[ City / Metro / Platform | Mission 04 | 2/5 ]
┌──────────────────────────────────────────┐
│                                          │
│     MAP / NETWORK / PLATFORM SCENE       │
│     player ●     destination ◎           │
│                                          │
├──────────────────────────────────────────┤
│ Turn LEFT. Walk one block north.         │
│             [ ↑ ]                        │
│        [ ← ][ ↓ ][ → ]                   │
│     ✓ Feedback / 🚧 Closure / Undo       │
└──────────────────────────────────────────┘
[ Extra context, explanations, pair challenge ]
\`\`\`
- D-pad **neumisťovat daleko do spodního panelu**. Druhé šipky v \`.f2-controls\` z UI odstranit (nepouze skrýt při jednom breakpointu). Obsluha \`move(direction)\` je jednotná.
- **Viditelná mapa + všechny 4 ovladače současně** na mobilní šířce 320–430 CSS px, bez přeskakování stránky. Mapový výřez má omezenou výšku přibližně \`clamp(240px, 40dvh, 420px)\`; skutečnou hodnotu ověřit i na 320×568.
- Ovládání min. 44×44 CSS px (cílově 48–56), \`env(safe-area-inset-bottom)\` pro mobilní UI; žádné překrytí systémovými lištami nebo gesty.
- Mapa je samostatně posuvná a zvětšovatelná; tlačítka musí zůstat ve stejném vizuálním rámci. Při tahu mapy nesmí D-pad zachycovat gesto.
- Stav: destinace, aktuální poloha, instrukce, počet kroků, feedback. Jazykové texty z lokálního balíčku, **nikoliv natvrdo anglicky**.
- Přístupnost: sémantické button, přístupné názvy N/E/S/W v daném jazyce, živé oznámení výsledku kroku, rozumné pořadí Tab; klávesové šipky i klepnutí do mapy volají stejný dispatch.
- Při přechodu City↔Metro mění HUD kontext: pěší šipky → výběr linky/směru, přestupu a tlačítko **Board / Transfer / Exit**. V metru netvářit se, že vlak jede po libovolném bloku mřížky.

**Tvrdý test:** na 320×568 a 390×844 musí být při navigaci **přesně jeden viditelný D-pad**; mapa i D-pad současně v záběru. Lokátor \`[data-testid="navigation-hud"]\` ukazuje jednu instanci. Žádná shodně významová tlačítka v \`.sidebar\`.

### 7. F2.1B — prémiový vizuální design / Riverton Transit World
Zachovat identitu F0.1 Riverton (detailní 2,5D stavby, jemná světla, kvalitní typografie, tmavý/světlý režim) a rozšířit o tři propojené scény:

**A. Metro Network (schematická interaktivní mapa)**  
Samostatné původní SVG s linkami M1 (azurová), M2 (zelená), M3 (korálová), velkými přestupními uzly, kontrastními popisky, směry konečných stanic a viditelným označením nástupišť. Použít mřížku tras ve 45° a 90°, vhodné label-anchor a bezkolizní bubliny; aktivní trasa má animovanou stopu, nežádoucí úsek se vykreslí odlišným vzorem, nikoli pouze barvou. Zobrazit **You are here** a **Destination**.

**B. Station Concourse / Platform (mini 2,5D scéna)**  
Vektorová hala metra, navigační cedule, schody, výtah, dva směry linky, informační tabule (např. \`M2 · NORTH PARK · PLATFORM 1\`). Vlak může přijet krátkou CSS animací, otevřít dveře a umožnit volbu **Board**. Bez skutečného 3D enginu a bez neověřených externích assetů.

**C. Onboard Metro / Route Tracker**  
Pohyblivý bod vlaku po ověřené trase, řada nadcházejících stanic, oznámení **Next stop**, přestupní značení a změna stavu při příjezdu do stanice. Pohyb musí odpovídat stavu enginu: žádné dekorativní vlaky na nesouvisející lince.

**Mikrointerakce:** stisk tlačítka, správný/špatný směr, příjezd vlaku, průjezd stanicí, přestup, odemčení checkpointu. Krátké animace převážně 150–350 ms; „příjezd vlaku“ může být delší, musí jít přeskočit. Plná alternativa při \`prefers-reduced-motion: reduce\`. Bez blikání či závislosti úspěchu na rychlých reflexech.

**Vizuální QA:** na 320px mapové popisky čitelné; žádné překryvy; na iPadu dost prostoru pro dva sloupce; měřítko vektorové mapy nemění význam herních uzlů. Všechny jazyky mají své vlastní popiskové rozvržení (FR/DE delší texty). Zkontrolovat i protanopii/deuteranopii, kontrast a režim vysokého přiblížení.

### 8. F2.1C — graf, engine a stavový automat
Oddělit **data sítě**, **herní rozhodnutí** a **render**:
- \`metro-network.js\`: kanonická stanoviště a linky, propojení, přístupnost, fiktivní časy, uzavírky, portály do města.
- \`metro-engine.js\`: ověřování sousedních stanic, nastoupení do správné linky/směru, přestupů, dosažitelnosti, alternativních tras (BFS/Dijkstra podle kritéria), chyb a restartů.
- \`metro-art.js\`: vizuální model metra / 2,5D nástupiště bez přístupu k herní logice.
- \`metro-content-*.js\`: EN/ES/DE/FR × B1–C2: lokalizace, situace, nápověda, oznámení, dialogy, vzory.
- \`NavigationHUD\`: jediný ovladač nad aktuálním kontextem; **ne** paralelní implementace pro město a metro.
- \`city-metro-bridge.js\`: portály City↔Metro a návrat z podzemí na správný uzel města.

**Stavy:** \`CITY_MAP\` → \`METRO_ENTRANCE\` → \`NETWORK_MAP\` → \`PLATFORM\` → \`ON_TRAIN\` → \`TRANSFER\` / \`EXIT\` → \`CITY_MAP\`.  
**Události:** \`WALK\`, \`ENTER\`, \`SELECT_LINE\`, \`SELECT_DIRECTION\`, \`SELECT_PLATFORM\`, \`BOARD\`, \`TRAVEL_TO_NEXT_STOP\`, \`CHANGE_LINE\`, \`READ_NOTICE\`, \`EXIT\`, \`SPEAK_SELF_CHECK\`.  
**Invarianta:** nelze nastoupit na jinou než přítomnou linku, přeskočit stanici, projet uzavřeným úsekem, přestoupit tam, kde přestup neexistuje, nebo bez potvrzení přeskočit mluvní checkpoint. Restart stanice nesmaže jiné dokončené stanice.

### 9. Herní efekt a férové vyhodnocení
**Gamifikace:** kapitoly City/Metro, postup 0/8, lokální odznaky **Navigator**, **Transfer Expert**, **Crisis Solver** a **City Quest Complete**, krátké zvukově nezávislé vizuální efekty, odemykání dalšího checkpointu. Nezavádět náhodné „správné odpovědi“ či frustrující tresty.

**Skórovat pouze:** správnou linku, směr, nástupiště, přestup, validní cestu, splnění času a kritérií, práci s výlukou a práci s uzavřenými otázkami.  
**Neskórovat automaticky:** skutečnou úroveň mluveného projevu, výslovnost nebo argumentaci. Použít modelové věty, peer feedback a učitelskou rubriku, označenou jako dobrovolná. Bez záznamu hlasu.

### 10. Testy a přejímací kritéria (Definition of Done)
**F2.1A mobile HUD – blokátor:**
1. Na telefonu s mapovou navigací přesně 1 D-pad v DOM/viditelném UI, žádné druhé směrové ovládání v panelu.
2. Na 320×568, 375×812, 390×844, iPadu a desktopu lze vidět mapu i D-pad bez svislého skákání při každém kroku. 
3. Swipe/pan/zoom mapy, tap na uzel, čtyři šipky, klávesnice, undo, restart, fullscreen a orientace na výšku/šířku bez chyb.
4. Dotykové cíle ≥44×44 CSS px, podporované VoiceOver/TalkBack, \`prefers-reduced-motion\` a safe-area.

**F2.1B/C metro a herní logika:**
5. Graf má přesně 14 unikátních stanic, 3 linky, 3 přestupní uzly; všechny hrany jsou validní a testované.
6. Zadané B1 scénáře 05–08 jsou dokončitelné; špatná linka, směr, platforma a výluka jsou detekovány se srozumitelnou opravou.
7. Uzavřená hrana se nikdy nedá projet; všechny scénáře mají dosažitelný cíl; alternativní trasa splňuje reálné fiktivní omezení.
8. Vlak/animace a skutečný stav sítě se nesmí rozcházet; během animace nesmí dvojklik provést dvojitý přestup nebo příjezd.
9. Jeden mobilní HUD funguje v obou světech; portál vrací žáka na odpovídající povrchové místo.
10. Při změně EN/ES/DE/FR nebo CEFR se resetuje jen lokální relace, nic se neposílá ani neukládá.

**Jazyky, offline, vizuál:**
11. Všechna rozhraní, hlášení i modelové odpovědi existují v EN/ES/DE/FR pro příslušné úrovně; žádné nechtěné anglické fallbacky. Názvy jazyků bez vlajek / \`GB\`, \`ES\`, \`DE\`, \`FR\` před popisem.
12. A1–A2 bez stanice metra, B1–C2 s metro misemi 05–08; ověřit **192 konfigurací** (sémantické testy úloh, ne pouze samotné vykreslení).
13. Kontrola kontrastu, delších DE/FR nápisů, překrývání uzlů, platform signage, mobilních screenshotů; skutečný iPhone/iPad Safari a Android Chrome.
14. Offline \`file://\` náhled se spustí bez API, bez CDN, bez externích obrázků, bez runtime fetch requestů; CSP \`connect-src 'none'\` a funkční fallback pro animace.
15. Jazyková přejímka učitelem / rodilým mluvčím zejména B2–C2, audit navigačních frází a registru. CI green **není** náhradou za didaktické schválení.
16. Žádný merge do \`main\`, žádná registrace produkční karty před písemným schválením vlastníkem.

### 11. Implementační etapizace a rozhodovací brány
| Fáze | Závazný výstup | Přejímka |
|---|---|---|
| **F2.1A – Mobile HUD Repair** | Jeden ovladač u mapy, odstranění duplicit, aktualizované testy a screenshoty | 320px + iPad funkční, bez duplicit |
| **F2.1B – Metro Art + Graph** | Originální prémiová mapa sítě, nástupiště, portály, datový graf | Vizuální přejímka a graf 14/3/3 |
| **F2.1C – B1 Playable Pilot** | EN/B1 funkční stanice 05–08 v metru a smíšeném světě | End-to-end bez nemožné trasy |
| **F2.1D – Multilingual + CEFR** | EN/ES/DE/FR × B1–C2, návaznost na A1–A2 city-only | Úplnost 192 kombinací |
| **F2.1E – Hardening + Release Review** | Desktop/mobile WebKit/Chromium, reálný iPad/iPhone, a11y, offline, jazyková revize | No-Go blokátory = 0; schválení vlastníka |

**Zásada:** schválení grafiky metra následuje po B, nikoliv až po napsání desítek jazykových variant. Nepokračovat masovým naplňováním obsahu do graficky neodsouhlaseného prostředí.

### 12. Co se výslovně nedělá
- Nevyvíjet skutečný 3D engine ani realistický dopravní simulátor. Zaměřit se na kvalitní 2,5D/SVG/CSS iluzi, která funguje na školních iPadech.
- Nevyužívat Google Maps, dopravní API, vzdálené TTS, online AI scoring, sledování polohy, studentské účty ani server.
- Nevydávat fiktivní příjezdy nebo výluky za reálnou MHD.
- Nevkládat cizí značky nebo neuvolněné grafické assety bez ověření licence.
- Nedoplňovat devátou stanici; zachovat osm kroků a jednotnou navigaci.

### 13. Ověřený výchozí stav
V aktuální F2 jsou úrovně, lokalizace a osm stanic již založeny; metro **dosud není implementováno**. Existují dva oddělené ovladače pohybu (\`#f2Quick\` a \`.f2-controls\`) — řešit architektonicky. Zdrojové soubory:
- \`language-skills-hub/konverzace/city-quest-f2/f2.js\`
- \`language-skills-hub/konverzace/city-quest-f2/f2.css\`
- \`language-skills-hub/konverzace/city-quest-f2/index.html\`
- \`language-skills-hub/authoring/city-quest-f2/engine.js\`
- \`language-skills-hub/authoring/city-quest-f2/TEACHER_GUIDE_CZ.md\`

**Rozhodnutí k realizaci:** bezprostředně začít F2.1A (blokující mobilní UX), pak vytvořit samostatný vizuálně hratelný EN/B1 prototyp metra F2.1B/C a nechat jej schválit před rozšířením na ostatní varianty.  
