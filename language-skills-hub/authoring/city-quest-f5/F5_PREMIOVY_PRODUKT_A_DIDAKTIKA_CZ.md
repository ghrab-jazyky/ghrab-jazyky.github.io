# City Quest — závazný produktový a didaktický standard F5

**Verze zadání:** F5A/Q1, 22. 11. 2026. **Mandát:** revize před produkčním vydáním. Není to doklad, že níže uvedené cíle již byly splněny.

## 1. Vymezení produktu a označení karty v LSH

City Quest patří organizačně do **Conversation Lab / Konverzace**, avšak není konvenční konverzační kartou (souborem otázek k diskusi). Je to **interaktivní jazyková hra se situační navigací, mapou města a metrem, rozhodováním a podpůrnými ústními aktivitami**. Nejde ani o automaticky známkovaný mluvní test.

### Závazné rozlišení v katalogu — navržený design

- **Umístění:** v galerii aktivit v Conversation Lab na kartě City Quest, přímo v její viditelné metadatové oblasti; **nepřepisovat kategorii `konverzace`** a neskrývat původní štítek jazyka / CEFR.
- **Primární nepřehlédnutelný typový štítek:** **`🎮 Interaktivní jazyková hra`**. Vizuálně prémiový, ale střídmý; se zřejmým kontrastem v dark i light tématu a rozumným zalomením na telefonu.
- **Doprovodná věta** pod krátkým souhrnem nebo v trvale dostupném vysvětlení, nikoli jen v hover tooltipu: **„Nejde o klasickou konverzační kartu. Procvičuješ orientaci, rozhodování a komunikaci v interaktivních misích.“**
- **Stručné shrnutí do budoucího katalogu:** „Prozkoumej Riverton, vyber trasu a řeš situace ve městě i v metru. Své řešení vysvětli v cílovém jazyce. Ústní projev se automaticky nehodnotí.“
- **Zpřístupnění:** informační věta musí být čitelná dotykem, klávesnicí a čtečkou (ne pouze hover), označení nesmí zakrývat název, jazykový/úrovňový štítek ani CTA.
- **Datová integrace:** katalogová registrace dosud **není v `language-skills-hub/data/cards.json` na `main`**, takže implementaci štítku provést až v budoucí *samostatné integrační větvi z aktuálního `main`*. Nezasahovat do produkčního `assets/hub.js` či `assets/hub.css` nyní. Při integraci použít explicitní metadata jen pro City Quest (např. deklarativní typ aktivity) a prověřit existující render `.card-meta`, `.skill`, `.catalog-variant` v `assets/hub.js`; nevytvářet obecný „game badge“ pro jiné karty bez požadavku.
- **Kontrola:** jednotný vizuální vzhled 320–1920 px, 200% text; screenreader přečte typ produktu i vysvětlení, štítek nezmizí při jazykovém/CEFR filtru, nemá klikací falešnou funkci. Odkaz přes QR stále míří na původní hru.

## 2. Kritérium špičkové kvality – nikoli „zelené CI stačí“

**P0/P1 release blockery:** nehratelná či nedokončitelná mise, nesprávně vyhodnocená trasa, nečitelná/zakrytá tlačítka na telefonu, ztráta stavu, znepřístupněné zásadní ovládání, zavádějící známka za neověřenou řeč, nezvratné chyby při přepnutí režimu, síťový request nebo soukromá data studentů.

**P2 release gate podle vlastníka:** prokázaná jazyková chyba / nepřirozenost zadání, podstatná didaktická nejasnost, nedostatečně rozlišené C1/C2, chybějící označení typu karty, nejednotná vizuální hierarchie, rozbité nebo rušivé animace a zásadní grafický nedostatek. O finálním akceptování P2 rozhoduje vlastník po nezávislé revizi.

**F5 povinně ověřit:**
1. **Funkčnost a výsledky:** zacílit 8 městských + 4 metro typy, schopnost **dohrát každou úroveň a jazykovou verzi**, nejen vykreslení 256 DOM panelů. Důkaz = scénář + očekávaný/herní stav + při selhání screenshot/log, rozlišovat automatické testy a lidskou výukovou přejímku.
2. **Jazyková správnost:** EN/ES/DE/FR, A1–C2, terminologie map, dialog, zadání, rozšířená zpětná vazba, nápovědy, registr. Idiomatičnost a gramatika, žádná špatná či zavádějící rada. Rozhodnutí o C1/C2 musí vycházet z náročnosti jazyka i mentální práce, ne jen z délky formulace.
3. **Mobile-first bez kompromisů:** skutečný iPhone/Safari a Android/Chrome před PC; portrét, landscape, při 200% textu, reálné dotykové ovládání, návrat z kompaktního HUD, UI bez kolizí mapy a šipek, viditelná aktuální pozice, žádné horizontální přetékání, při rotaci zachovaný stav. Další režimy iPad Safari Split View, PC Chrome/Edge/Firefox, klávesnice; VoiceOver/TalkBack a reduced-motion. Testovaná emulace `WebKit` nestačí pro fyzické PASS.
4. **Prémiový vizuál:** mapa a její náhled mají jasnou vizuální prioritu, grafické styly jsou jednotné, kontrast a velikost písma odpovídají dostupnosti, panely i karty se nerozpadají v úzkém okně. Přechody a pohyb nejsou zbytečně přehlcené.
5. **Smysluplné animace:** pohyb městem, interakce metra (perón, vlak, výluka, přestup, informační panel) jsou napojené na skutečný stav a neprozrazují budoucí cestu; nesmějí zakrýt navigaci, blokovat vstup, měnit herní stav nebo způsobit nevolnost. Při `prefers-reduced-motion` / vypnutých efektech zůstává vše stejně hratelné a čitelné. Hladkost ověřit v reálném mobilním prohlížeči; **nepředstírat změřené FPS z vizuálního dojmu**.
6. **Přesnost očekávání:** učitel i student mají vědět, že jde o hra/simulaci; PA je psaná simulace, nikoli autentický poslech, a ústní výkon se automaticky neposuzuje.

## 3. Didaktická mapa každé stanice — povinná odborná kontrola

| Prostředí / stanice | Reálná jazyková dovednost | Co musí žák vykonat | Jak se ověří didaktická hodnota |
| --- | --- | --- | --- |
| CITY 01 – Explore the City | Porozumění popisu místa a slovní zásoba města | Z textových indicií identifikovat místo a zdůvodnit výběr | Rozumí nápovědě a dokáže vysvětlit, proč místo odpovídá; nevyřeší pouze barvou či obrázkem |
| CITY 02 – Find the Route | Instrukce k cestě, směry, prostorové vztahy | Nalézt platnou trasu a případně povinné průjezdní body | Správná sousednost kroků a ústní vysvětlení; vyšší úrovně zohlední omezení |
| CITY 03 – Ask for Directions | Dialog, zdvořilost a komunikační oprava | Odpovědět turistovi, reagovat na nejasnost a opravit ji | Dialog má skutečnou potřebu sdělení, smysluplnou zpětnou vazbu a správný registr |
| CITY 04 – Follow My Directions | Porozumění postupným instrukcím | Vybrat další křižovatku podle zadání | Nejde o náhodné klikání; instrukce i mapový stav si odpovídají |
| CITY 05 – Catch the Right Bus | Čtení jízdního řádu, čas, dopravní informace | Zvolit linku, odjezd a zastávku, posoudit omezení | Úloha ověřuje porozumění jízdnímu řádu a odůvodnění volby |
| CITY 06 – Oops! Wrong Turn | Chybová analýza a taktní korekce | Rozpoznat chybnou instrukci a formulovat opravu | Reálná práce s významem, přirozená oprava i následná reflexe |
| CITY 07 – The Unexpected Detour | Výluka, alternativy a argumentace | Vyhnout se uzavřené cestě a obhájit jinou | Ověření průchodnosti trasy a věcně správného zdůvodnění |
| CITY 08 – The Ultimate City Quest | Integrované čtení mapy a mluvená produkce | Projít více bodů, každou část vysvětlit a reflektovat | Skutečný transfer dovedností napříč mapou, ne pouze opakování 02 |
| METRO 05 – Find the Right Line | Čtení plánku metra a nástupištních informací | Vybrat linku M1, směr k terminálu East Gardens a správné nástupiště | Dokáže vysvětlit vztah linka → terminál → perón a výstup |
| METRO 06 – Change Lines | Přestupní instrukce, sled kroků a dialog | Z Market Square do Stadium správně přestoupit na University | Přesný směr, nástupiště a přesvědčivé ústní vysvětlení |
| METRO 07 – Metro Disruption | Porozumění oznámení o výluce a zdůvodnění alternativy | Vyhnout se zablokovanému M1 a bezpečně navrhnout M2/M3 trasu | Samostatná detekce omezení, absence spoilerů, správná náhrada |
| METRO 08 – City + Metro Quest | Transfer pěší a metro navigace | Chůze k Market Square → metro s přestupem → pěšky k muzeu | Orientace a jazykový popis napříč oběma mapami bez ztráty stavu |

**Každý řádek je auditní hypotéza, ne již potvrzená realizace.** Claude musí v kódu i ve skutečné hře ověřit, že aktivity skutečně cíl naplňují. Pokud stanice procvičuje jen výběr tlačítka a deklarovanou dovednost nesplní, musí to být nález. Jedna stanice nesmí existovat pouze kvůli vizuální atrakci.

### Pedagogické minimum pro každou kombinaci jazyk × CEFR × typ stanice

- Jasně formulovaný **jazykový cíl** a činnost, kterou žák reálně dělá (recepce / interakce / produkce / mediace podle konkrétního úkolu).
- **Pozorovatelný výstup** a smysluplná zpětná vazba. Automaticky kontrolovaná volba se nesmí vydávat za ověřenou kvalitu výslovnosti či spontánní řeči.
- Nápověda, která podporuje učení, ale **neprozradí řešení** před samostatným pokusem.
- U Solo a Pair režimů explicitní funkční rozdíl, pokud je slibován.
- **Slabší žáci:** dostupná vhodná podpora pro konkrétní úroveň bez zahlcení. **Silnější žáci:** autentická vyšší náročnost, argumentace, alternativy, register; zejména C1/C2 nesmí být jen kosmeticky prodloužené B1.
- Přiměřená délka: cca **5–12 min / stanici**, 3–4 stanice za 45 min, pro 12–19leté gymnazisty.

## 4. Vizuální a device gate — doložit, ne prohlásit

### Kritické testovací průchody

- 320/375/390/430 px portrait, skutečný iPhone/Android; landscape.
- 200% text, dynamická velikost textu, otevřená softwarová klávesnice pokud relevantní.
- iPad Safari Split View s různými dostupnými šířkami, otočení během metra a navigace, ztráta/zisk fokusu.
- Desktop 1366 a 1920, myš, klávesnice, projektor.
- VoiceOver/TalkBack, `prefers-reduced-motion`, vypnutí efektů, kontrast světlé/tmavé varianty.
- Bez horizontálního overflow, bez překrytí ovladačů/mapy, všechny skutečně nutné cíle přístupné i dotykem (stávající projektový limit 44×44 CSS px), žádný neobnovitelný stav.
- Po dokončení všech typů stanic musí být jasné, co se žák **naučil**, ne pouze že hru dohrál.

### Katalogový štítek — povinný akceptační scénář

Po budoucí registraci `cl-city-quest-f2` do `language-skills-hub/data/cards.json` se ověří:
- Při filtru **Konverzace** je City Quest přítomen.
- Má jednoznačný, nepřehlédnutelný a čtečkami přístupný štítek **„🎮 Interaktivní jazyková hra“** a vysvětlení, že **nejde o klasickou konverzační kartu**.
- Štítek nesmí klamat, že jde o generátor volné konverzace, automatické mluvené hodnocení nebo skutečný poslechový test.
- Přežije přepínání jazyků, A1–C2, světlý/tmavý režim, mobilní 320px a skutečné zoomování; nic nezakrývá ani nevytváří druhý ovladač.
- Nezmění označení, filtrování nebo vzhled ostatních Conversation Lab karet.

## 5. Povinný výrok nezávislého reviewera

Claude vrátí:
1. Didaktickou tabulku pro **všech 12 typů stanic** (8 City + 4 Metro): zamýšlený jazykový cíl, reálná mechanika, kontrola CEFR progresu, zpětná vazba, přínos vůči ostatním stanicím, nález a evidence.
2. Samostatné **mobile-first a premium UX/UI** hodnocení. Ukaž přesně, co bylo testováno na fyzickém zařízení a co pouze emulací; jednotlivé scénáře PENDING nelze označit PASS bez výkonu.
3. Samostatné posouzení **animací**, závislosti na stavu, ergonomie, reduced motion a performance; oddělit estetickou preferenci od funkčního defektu.
4. Návrh konkrétního implementačního PR pro katalogový štítek s ověřením `cards.json`, `hub.js`, `hub.css` a lokalizačního katalogu, **bez sloučení do produkce**.
5. Verdikt `GO/NO-GO` pro každou oblast a seznam prioritizovaných reprodukovatelných chyb.

**Před schválením F5 není přijatelné:** „vypadá to dobře“, „funguje v testu“, „256 DOM PASS“, „C2 má delší text“ bez konkrétního pedagogického a produktového důkazu.
