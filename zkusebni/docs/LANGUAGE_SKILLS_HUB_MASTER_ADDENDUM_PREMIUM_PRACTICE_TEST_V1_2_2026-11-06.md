# Language Skills Hub — ZÁVAZNÝ DOPLNĚK MASTER PROMPTU
## Prémiový učitelský katalog, procvičovací režim, testovací režim a bezpečné sdílení
**Verze zadání:** 1.2 — návrh k implementaci · 6. 11. 2026  
**Rozsah:** Conversation Lab, Reading Lab, Listening Lab  
**Repozitář a hosting:** VÝHRADNĚ `ghrab-jazyky/ghrab-jazyky.github.io`, GitHub Pages pod `/zkusebni/` (nikoli `Daniel22-dev` ani Cloudflare).

> Tato specifikace je rozšíření původního master promptu, nikoli potvrzení hotové implementace. Před zahájením plošné úpravy nejprve schválit jednu referenční kartu pro každou ze tří laboratoří.

## 1. Produktový cíl a zásady

Language Skills Hub je jednotné, profesionální učitelské prostředí, které zprostředkuje tři oddělené výukové dovednosti: **mluvení, čtení a poslech**. Učitel má rychle vyhledat pedagogicky schválenou kartu, připravit ji do hodiny či do testu, získat přesně nastavený studentský odkaz a QR kód nebo stáhnout samostatnou procvičovací verzi.

- **Prémiový design bez složitosti:** prostorová a typografická hierarchie, jednotná designová soustava, konzistentní karty, přehledné popisky, kontrast, důraz na přístupnost a responzivní rozvržení, rychlé ovládání na PC/tabletu/telefonu. Nepoužívat dekorace na úkor čitelnosti.
- **Jedna karta — dva jasné režimy:** *Procvičování* a *Testování*. Režim je součástí stejné kanonické karty a definovaného integračního kontraktu; nevytvářet nesouvisející kopie obsahů.
- **Schvalovací brána:** běžný katalog smí nabízet pouze konkrétně schválené, otestované a sjednocené karty. Stávající veřejné TEST náhledy zůstávají oddělené od ostrého výběru.
- **Nenarušovat odlišnou pedagogiku:** Conversation/Reading/Listening mohou mít jiné úlohy, ale musí podporovat stejný režimový kontrakt a povinné sdílecí možnosti.
- **Oddělení rolí:** rozhraní katalogu je pro učitele; studenti otevírají přímé karty přes odkaz/QR a nepotřebují účet. To neznamená, že veřejný GitHub Pages poskytuje učitelskou autentizaci.
- **Soukromí:** učitelské klíče, reálná žákovská data a neveřejné hodnoticí podklady nikdy nesmějí být součástí veřejného zdrojového repozitáře.

## 2. Učitelský katalog — navigace a karta

1. Vstupní stránka: tři stejně hodnotné, výrazně identifikovatelné sekce **Conversation Lab**, **Reading Lab** a **Listening Lab**.
2. Po volbě sekce učitel vidí mřížku schválených karet, hledání a rozumné filtry (jazyk, CEFR, téma). Nezahlcovat rozhraní.
3. Každá karta obsahuje **název**, **konkrétní anotaci, o čem se v ní skutečně hovoří/čte/poslouchá**, dostupné jazyky/úrovně a nejméně dvě hlavní akce: **Procvičování** a **Testování**.
4. Procvičování a Testování otevřou kompaktní kontextový dialog/drawer s nastavením a akcí pro zkopírování odkazu, promítnutí/stáhnutí QR. Při procvičování navíc **Stáhnout HTML do hodiny**.
5. Po schválení testu jej lze spustit pro studenty přímo z učitelské karty. Student má vidět odpovídající konkrétní obsah, nikoli seznam učitelských karet nebo redakční evidenci.
6. Výchozí interakce musí být rychlá: uživatel má dojít ke QR nejvýše v několika srozumitelných krocích; žádný účet, žákovské identifikační kódy ani technické nastavení pro běžnou hodinu.

### Designové standardy

- Jednotné komponenty pro 3 sekce a konfigurátory; komponenty znovupoužitelné, kontrast přiměřený WCAG AA, klávesnicové ovládání, viditelný focus, čitelné chybové a potvrzovací zprávy.
- Funkční dialogy na iOS Safari, Android Chrome i iPadOS, správný scroll/focus trap, bezpečné oblasti viewportu a čitelné QR.
- Jasné vizuální rozlišení **Procvičování**, **Testování**, **TECHNICKÝ PILOT** a **SCHVÁLENO**, aby nebylo možné zaměnit náhled s použitelnou ostrou kartou.
- Jednotný popis obsahu a pedagogický rozsah; anotace nesmí být obecné či zavádějící.

## 3. Procvičování (PRACTICE)

### Vstup učitele

Učitel zvolí **Procvičování** a jednu z možností:

- **Volná volba** — student po otevření přímého odkazu/QR může v kartě sám přepínat **všechny skutečně dostupné jazyky a CEFR úrovně**. Tam, kde karta nabízí jen EN, žádné další jazyky nenabízet.
- **Pevná varianta** — učitel zvolí konkrétní jazyk a úroveň. Studentovi se otevře příslušná varianta se skrytými/znepřístupněnými přepínači. Jde o *uživatelský zámek*, nikoli neprůstřelný bezpečnostní zámek proti manipulaci s veřejným HTML/URL.

### Výstup

- Přímý URL a QR kód k naprosto stejnému nastavení; kopírovat URL, zobrazit/promítnout QR, stáhnout QR.
- **Stáhnout procvičovací HTML do hodiny**: bezpečný samostatný offline soubor pro relevantní přednastavenou konfiguraci; zachovat kompatibilní slovníček a nastavené funkce. Pokud původní karta vyžaduje související lokální soubory, poskytovat kompletní balíček, ne nefunkční osamocené HTML.
- Výchozí funkce: offline slovník **zapnutý** u Reading a Conversation (tam, kde funkce v referenci existuje), osobní slovníček dostupný, vysvětlivky/nápověda a práce s důkazovými pasážemi povolené, automatická průběžná zpětná vazba podle charakteru úlohy.
- Listening: video/stream z externí služby není samo o sobě offline součástí staženého HTML. Offline zvuk/video nelze garantovat bez legálně dostupného média a jeho zvláštního přibalení. Offline balíček musí toto omezení transparentně sdělit.

## 4. Testování (TEST — dohledový režim)

### Vstup učitele

Po zvolení **Testování** se otevře jednoduchý konfigurátor s povinnými volbami:

- Jedna konkrétní **jazyková varianta**, jen pokud ji karta podporuje (Listening EN-only ⇒ nelze nabídnout ES/DE/FR).
- Jedna konkrétní **úroveň CEFR A1–C2**.
- **Časový limit v minutách**. Konfigurovatelný, validovaný, s jasným zobrazením studentovi.
- Jediná akce **Vytvořit testovací QR a odkaz**. Žádné studentské přihlašování a žádné identifikační kódy.

Test vždy otevírá *pevnou* variantu. Student nemůže běžnými ovládacími prvky přepnout jazyk/úroveň ani aktivovat zakázané funkce.

### Studentské testovací prostředí

- Zřetelná úvodní obrazovka: název karty, jazyk, CEFR, časový limit, shrnutí pravidel a tlačítko **Začít test**. Čas běží od startu na daném zařízení.
- V testu **vypnout nebo skrýt**: offline a osobní slovník, nápovědy, podpůrné pasáže odhalující odpověď, průběžné řešení, okamžitou kontrolu správnosti, libovolné přepínání variant.
- Na obrazovce zbývající čas, tlačítko odevzdání, jasný stav (připraveno → probíhá → přerušeno → odevzdáno/čas vypršel).
- Reading/Listening: kontrolu správných odpovědí a zpětnou vazbu povolit nejdříve po odevzdání dle rozhodnutí vyučujícího; žádné odhalování odpovědí během běhu.
- Conversation: jde o výkonovou úlohu, nikoli automaticky bodovatelný test s jednoznačně správnými odpověďmi. Výsledek může hodnotit učitel podle existujícího zadání/rubriky. Nevymýšlet automatické hodnocení mluvení bez samostatného zadání.
- Při vypršení času automaticky uzavřít přístup k dalším změnám, zachovat místní stav a zřetelně zobrazit status. Nelze tvrdit, že je zajištěno odeslání učiteli: GitHub Pages nemá studentský backend.
- Při obnově stránky na *stejném zařízení a ve stejném prohlížeči* vrátit vyplněné odpovědi, již uplynulý čas, počítadlo incidentů a stav odevzdání, pokud existuje lokální úložiště a nebylo smazáno. Úmyslný reset lokálního úložiště z veřejného webu nelze bezpečně blokovat. Čas se při opětovném otevření nemá automaticky vracet zpět.

### Základní detekce incidentů a znovuodemčení

Pouze tam, kde prohlížeč poskytuje dostupné signály:

- `document.visibilitychange` (opuštění aktivní karty, minimalizace, přepnutí aplikace); `window.blur/focus` s opatrným vyhodnocením, aby se běžné systémové dialogy nepovažovaly automaticky za podvod.
- `fullscreenchange` při skutečné podpoře fullscreen režimu. Reagovat na ukončení fullscreen; nikdy automaticky netvrdit, že fullscreen funguje na všech iPhonech.
- Výrazné změny viewportu/split-screen/Slide Over považovat nejvýš za **indicie**, nikoli za spolehlivý důkaz. Rozpoznávání může mít falešné pozitivní i negativní výsledky.
- Po důvěryhodné detekci přerušení uložit stav, při návratu zobrazit překryv „Test byl přerušen, přivolej učitele“; nedovolovat dál upravovat odpovědi, dokud jej učitel neobnoví. Časový limit při přerušení běží dál.
- Jednoduché servisní gesto učitele v pořadí **levý horní → pravý horní → levý dolní → pravý dolní roh** může obnovit obrazovku a ponechat odpovědi. **Pozor: gesto není tajné heslo ani bezpečná autentizace**, student je může napodobit; může se používat pouze jako pohodlný zásah vyučujícího při osobním dozoru.
- Incidenty ukládat lokálně jako základní technické události a zobrazit v testovém přehledu. **Nevytvářet bez souhlasu nové vzdálené logování, nahrávání obrazovky, identifikaci studentů nebo přístup ke kameře/mikrofonu.**
- Pokud API není dostupné, nabídnout provozní alternativu („test pod přímým dohledem“) nebo upozornění. Test nezhroutit; neoznačit nemožné kontroly jako aktivní.

## 5. Nepřekročitelná bezpečnostní hranice GitHub Pages

Všechno výše může vzniknout jako *přehledný dohledový režim pro běžné školní ověřování*, ale **nejde o technicky neprůstřelné zabezpečené zkoušení**:

1. GitHub Pages je veřejné statické hostování. Student může otevřít zdroj HTML/JS, upravovat URL parametry, manipulovat s lokálním časem/úložištěm, otevřít jiný prohlížeč nebo zařízení. Předpokládané „uzamčení jazyka, úrovně a času“ je v této architektuře především **UI omezení a kontrola chování běžného uživatele**, ne ověřitelná serverová politika.
2. Skrýt slovník, nápovědu nebo správné odpovědi v UI lze; **ukrýt správné odpovědi před znalým uživatelem statické stránky nelze**. Pro závěrečný vysoce důležitý hodnoticí test je vhodný školní GIT/backend s ověřováním na serveru.
3. Při běžném prohlížení lze detekovat události jako změna viditelnosti, nikoli zaručit, že student nevyužívá jiný program, druhý monitor/telefon, screenshot či všechny podoby split-screen. Automatické snímání obsahu celé obrazovky není možné provádět skrytě; `getDisplayMedia` vyžaduje souhlas a není všeobecně dostupné.
4. Gesture 4 rohů lze použít pro návrat učitele k práci, ale nelze jej nazývat bezpečným heslem. Požadavky na autentické proctoring/fraud prevention **odložit nebo napojit na GIT**, ne předstírat je klientským JS.
5. Bez serveru nelze shromažďovat důvěryhodné studentovy výsledky, jednoznačně identifikovat účastníky ani zaručit běh času vůči manipulaci. Lokální test je pedagogická pomůcka při osobním dozoru.
6. Pokud by se někdy měly sbírat osobní záznamy o studentově chování, vyžaduje to samostatné školní rozhodnutí o ochraně dat a transparentní informování, nikoli tiché zapnutí.

**Normativní copy:** „Test — dohledový režim, základní kontrola opuštění stránky, bez záruky proti opisování.“ Nepoužívat tvrzení „neprolomitelný test“ či „100% kontrola obrazovky“.

## 6. Technický integrační kontrakt pro všechny tři reference

Zavést společnou konfigurační vrstvu, nikoli třikrát různě zakódovanou logiku:

- `lessonId`, `skill`, `availableLanguages[]`, `availableLevelsByLanguage{}`, `referenceVersion` a `publicationStatus`.
- `mode` = `practice` | `test`; `selection` = `free` | `fixed`; volitelné `lang`, `level`, `timerMinutes`; capability flags (vocabulary, hints, review, export, media).
- Vstupní parametry musí být validovány, nikdy nesmějí spustit nepodporovanou variantu ani samovolně odemknout již rozběhnutý test; zároveň je nutné v UI vysvětlit, že je může zkušený uživatel obejít.
- U všech tří referenčních karet definovat kompatibilní funkce: `openPractice`, `openTest`, `lockVariant`, `setVocabularyEnabled`, `startTimer`, `submitAttempt`, `saveState`, `restoreState`, `reportVisibilityIncident`, `teacherResume`, `exportPracticeHtml`. Konkrétní API se stanoví během návrhu reference, ne bez auditu původní karty.
- Zachovat existující `?lang=`, `?level=`, `?zamek=1` a krátké kódy tam, kde fungují. Nová parametra nemusí být kompatibilní se starými klienty; navrhnout konverzi bez narušení již vydaných odkazů.
- U testového QR neskrývat do URL žádné heslo, osobní data ani učitelský klíč. Změna URL není autorizovaný způsob změny testového nastavení; bez backendu však nejde změny spolehlivě zamezit.
- Původní studentské HTML zachovat jako kontrolní baseline. Nový režim implementovat a testovat nejprve na schválených referencích. Bez zvláštního schválení žádná hromadná migrace osobního slovníčku.

## 7. Závazné akceptační scénáře

| ID | Podmínka |
| --- | --- |
| CAT-01 | Učitel zvolí Conversation, Reading nebo Listening a vidí pouze pedagogicky schválené karty s pravdivou anotací. |
| CAT-02 | Všechny karty mají dvojici akcí Procvičování a Testování v jednotném prémiovém UI. |
| PR-01 | Practice/free link a QR otevře všechny existující dostupné jazykové/CEFR varianty a slovník, pokud je v kartě podporován. |
| PR-02 | Practice/fixed link a QR zobrazí požadovanou variantu bez běžné možnosti přepnutí. |
| PR-03 | Stáhnuté procvičovací HTML/ZIP se spustí bez neexistujících lokálních závislostí; media offline omezení je pravdivě označené. |
| TE-01 | Test dialog nabízí jen podporované jazyky/CEFR a povinný validovaný časový limit. |
| TE-02 | Test QR otevře správný obsah, startovací obrazovku a viditelné odpočítávání; slovník, nápovědy a přepínače jsou mimo dosah běžného UI. |
| TE-03 | Test nepovolí zobrazení správných odpovědí před odevzdáním přes běžné ovládací prvky. |
| TE-04 | Při opuštění stránky se zaznamená dostupná událost, aktivuje se obnovovací překryv a čas nepřestane běžet. |
| TE-05 | Obnovení ve stejném prohlížeči zachová již zadané odpovědi a uplynulý čas; gesto učitele odemkne pokračování, ale není prezentováno jako zabezpečené heslo. |
| TE-06 | Na iPhone/iPadu/Androidu chybějící fullscreen/split-screen signály nevyvolají falešné tvrzení o zajištěném monitoringu. |
| SEC-01 | Žádné soukromé klíče, identifikace žáků, screenshoty, videozáznam obrazovky, přístupy k mikrofonu/kameře nebo neodsouhlasené vzdálené logování. |
| QA-01 | Funkční reálná UAT: desktop Chrome/Firefox/Edge, Android Chrome, iPhone Safari, iPad Safari, včetně výpadku internetu a návratu do testu. |
| QA-02 | Automatické regresní testy pro stejný režimový kontrakt ve všech 3 referencích; následné rozšíření na zbylé karty až po schválení jednotlivých referencí. |

## 8. Implementační pořadí — nevynechat žádný krok

**A. Design system a učitelský tok:** prémiová karta, stručná pravdivá anotace, dva hlavní režimy, sdílení volné/pevné varianty, QR a stažení procvičovací HTML. Založit technický kontrakt a testovat jej na první Reading referenci dodané vlastníkem.

**B. Společné jádro testového režimu:** časomíra, stav pokusu, vypnutí nápověd a slovníků, obnova po přerušení, lokální incidenty, jednoduché gesto učitele. Výslovná kompatibilita a omezení na telefonech/tabletech.

**C. Tři reference:** samostatný pedagogický, bezpečnostní, UX a technický audit Reading/Conversation/Listening; schválení vlastníkem; teprve pak přenos společných funkcí a designu na zbytek kategorií.

**D. Závěrečná přejímka:** všechny skutečné uživatelské cesty, správnost QR/odkazů, offline data, testy zařízení, učitelské klíče oddělené, shoda PDF/HTML dokumentace a přehledné instrukce.

### Ověřené současné implementační rozdíly

- V `zkusebni/assets/lsh/v2/app.js` již existuje `Sdílet studentům`, volba jazyka a úrovně, QR, krátký kód a checkbox `Zamknout volbu na kartě`.
- V `zkusebni/assets/lsh/v2/core.js` `studentUrl()` zatím generuje `lang`, `level`, volitelně `zamek`. Neexistuje schválený jednotný `test` kontrakt s časomírou/incidenty ani generátor offline procvičovacího balíčku.
- `zkusebni/data/manifest.json` zůstává technický staging se schválenou publikační bránou. Nezveřejňovat rozpracované původní materiály jako schválené karty.
- Pro Listening originály je aktuálně EN + šest úrovní. Rozhraní nesmí slibovat ES/DE/FR, dokud nejsou vyrobené a schválené.

### Referenční technické zdroje pro browserová omezení

- MDN Page Visibility API: https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
- MDN Fullscreen API: https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
- MDN Screen Capture, explicitní svolení uživatele: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia

**Souhrn:** Návrh je společný, jednoduchý a realizovatelný v části UX a dohledových signálů na GitHub Pages. Pro skutečně vynutitelné zabezpečení závěrečných zkoušek je nutná serverová část nebo existující školní GIT; neslibovat nesplnitelné browserové zámky.