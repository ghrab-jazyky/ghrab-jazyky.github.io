# Language Skills Hub R22 – rozhodnutí: pouze statický provoz

**Stav:** architektonická specifikace, žádné testovací rozhraní není aktivováno.
**Datum rozhodnutí:** 9. listopadu 2026.
**Provoz:** veřejný GitHub Pages katalog `/language-skills-hub/`; bez vlastního backendu, externí databáze, studentského přihlašování a automatického odesílání výsledků.

## 1. Změna oproti zadání R18–R25 v1.0

Původní R22 požadoval serverové ověřování, ochranu odpovědních klíčů mimo klienta, trvalé uložení odevzdání a bezpečné klasifikované testy. Zadavatel následně výslovně potvrdil, že Language Skills Hub **zatím žádný aplikační server ani externí backend používat nebude**.

To mění možnost splnit bezpečnostní podmínky. **Statická aplikace nemůže současně automaticky vyhodnotit odpovědi na zařízení studenta a garantovat, že správné odpovědi nebudou před odevzdáním z klienta zjistitelné.** Kdo má přístup k HTML/JS a datům staženým prohlížečem, může zkoumat nebo měnit mechanismus vyhodnocení. Skrytí tlačítek, minifikace, šifrování s klíčem přítomným v klientovi ani lokální úložiště toto neřeší.

**Rozhodnutí:** Zabezpečené klasifikované testování je `NO-GO`. Dříve připravený serverový návrh R22 v PR #28 zůstává pouze odloženým podkladem pro případný budoucí backend; neslučovat kvůli současnému statickému provozu. Není tím automaticky schválené jiné technické řešení pro klasifikaci.

## 2. Dva jasně oddělené režimy

### A. Dosavadní procvičování (beze změny)

- Conversation Lab, Reading Lab a Listening Lab; 29 témat / 642 variant.
- Stávající tlačítko „Otevřít aktivitu“, sdílení QR a URL, lokální slovníček, nápovědy a postupné procvičování fungují dál.
- Zůstává veřejné. Správné odpovědi uvnitř existujících *procvičovacích* karet nejsou tajným zkušebním klíčem.

### B. Připravovaný „Samostatný test“ / „Ověření znalostí“ (R23–R25)

- **Pouze Reading a Listening.** Conversation nikdy nemá tlačítko Test.
- Samostatné rozhraní odlišné od běžné procvičovací karty, avšak bez tvrzení o zabezpečené zkoušce.
- Učitel před vytvořením odkazu volí konkrétní jazyk a CEFR. Studentovi se příslušné ovladače v UI skryjí/deaktivují; není to ochrana proti úpravě URL, zdrojového kódu či opětovnému otevření.
- Slovník, My Vocabulary, nápovědy, supporting passages a průběžná kontrola správnosti jsou v tomto režimu vypnuté **v UI**.
- Jedno souhrnné odevzdání, potvrzení, počítadlo vyplněných/nevyplněných otázek a výsledková karta. „Jednou odevzdat“ znamená pouze omezení v právě běžící instanci rozhraní; nelze zaručit jediné podání napříč zařízeními, novými relacemi nebo po vymazání dat.
- Automaticky se mohou vyhodnocovat jen jednoznačně skórovatelné úlohy. Smysluplné otevřené odpovědi, parafráze a rekonstrukce vyžadují férové ruční posouzení; do té doby procento a známku nevydávat jako konečné.
- Správné odpovědi se mají v rozhraní zobrazovat nejdříve po souhrnném odevzdání; **technicky však zůstávají přístupné v klientu**. Také mohou být po odevzdání předány spolužákům, kteří ještě pracují.
- Výsledky se zobrazují výhradně lokálně studentovi. Není zde ověřená identita, centrální záznam, automatické odeslání učiteli ani důvěryhodná evidence známek. Případný ruční export je neověřený podklad, nikoli důkaz odevzdání.
- Nezavádět automatický sběr jmen, e-mailů ani dalších identifikátorů studentů, a to ani v URL.
- Klientské události `visibilitychange`, `blur` a fullscreen změny lze pouze indikovat jako možná přerušení práce; žádné tvrzení o úplné detekci opisování či iPad Split View/Slide Over.

## 3. Reading R23 – realizační kontrakt

1. Ověřit první referenční Reading kartu a její přesné typy interaktivních úloh (včetně jazykových a úrovňových variant) **před** změnou jejího UI. Neměnit obsah ani správná řešení bez pedagogického auditu.
2. Test je samostatná stránka/komponenta. Nemá měnit stávající procvičovací HTML.
3. Zachovat všechny skutečně dostupné typy úloh; počet vyplněných položek není bodové skóre.
4. Nezobrazovat průběžné klíče či vysvětlení. Jedno potvrzované odevzdání v UI; přehled odpovědí po odevzdání.
5. Pokud by ke skórování bylo nutné převzít učitelský neveřejný klíč, **nezveřejňovat jej**. Pro danou úlohu zvolit otevřený neklasifikovaný klíč, nebo automatické vyhodnocení neprovádět.
6. Před zpřístupněním tlačítka v katalogu: QA desktop/mobil, jazykové úrovně, bezpečnostní upozornění, potvrzení výchozího označení režimu a test čitelnosti výsledků.

## 4. Listening R24 – realizační kontrakt

- Pouze EN v aktuálním katalogu, učitel volí CEFR.
- Učitel fyzicky ovládá přehrávání nahrávky na svém zařízení. **Bez serveru se nepřenáší synchronizace přehrávání mezi zařízeními.**
- Ve studentském rozhraní bez přehrávače; dvě učitelem řízená poslechnutí; přesně tři oddíly: First Listening / Listen and Interpret / Listen, Write and Reconstruct.
- Pre-listening Activity, Optional Vocabulary a After Listening do testového režimu nepřenášet.
- Testovat dostupnost externích médií ve školní síti. Volný internetový zdroj nelze považovat za garantovaně offline dostupný.

## 5. R25 – procenta a známky

- Původní návrh uvádí orientační stupnici cizích jazyků: 88–100 / 74–87 / 59–73 / 44–58 / 0–43 %. Jde o **nepotvrzenou pracovní podobu školních pravidel**, nikoli automaticky závaznou tabulku.
- Dokud nejsou právně/pedagogicky schváleny intervaly, desetinné hodnoty a zaokrouhlování, **automatické školní známky zůstanou vypnuté**.
- I po potvrzení stupnice je výsledek ze statického rozhraní pouze lokální sebehodnocení. O přiznání klasifikace rozhoduje učitel podle skutečně platných pravidel.

## 6. Stop-podmínky a přejímka

Nesmí se:
- Zapnout klasifikovaný režim nebo tvrdit, že test zaručeně utajuje klíče, brání druhému pokusu nebo detekuje opisování.
- Vystavit neveřejný učitelský klíč či studentské osobní údaje do public GitHub repozitáře.
- Změnit či znefunkčnit aktuálních 29 procvičovacích karet.
- Zpřístupnit tlačítko Test před implementací a regresním ověřením konkrétního režimu.
- Vypočítávat finální známku tam, kde se čeká na lidské hodnocení nebo schválenou školní stupnici.

**Kanonický přepínač stavu:** `language-skills-hub/data/test-mode-policy.json`.
V R22 musí zůstat `testUiEnabled:false`, `selfCheckEnabled:false`, `gradedTestsEnabled:false` a `officialGradesEnabled:false`. Při návrhu R23 se smí aktivovat nejvýše výslovně popsaný lokální *neklasifikovaný* režim po samostatném schválení a testování.

**Poznámka k budoucnosti:** Přidání backendu by vyžadovalo nové bezpečnostní rozhodnutí; netvoří součást této architektonické větve.
