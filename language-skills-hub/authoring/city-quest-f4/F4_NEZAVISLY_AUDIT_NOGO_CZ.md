# City Quest F4 — nezávislý předprodukční audit (výchozí F3D)

**Datum provedení:** 22. 11. 2026  
**Auditovaná baseline:** `99905affda918cdd089c155864c4c1c5c438a945` (F3D, PR #158)  
**Přesný distribuční artefakt:** `City_Quest_F3D_offline.html`, SHA-256 `8947f3314e75f732b4ace7a690b757ffce846d62defa2a713c42d137facf7f8a`, 405 556 bytů  
**Režim:** lokální, pouze klient, žádný server; automatické mluvené hodnocení nepovoleno.  
**Předběžné uvolňovací rozhodnutí:** **NO-GO pro F5**. Technické kontroly z F3D jsou PASS, ale nové F4 nálezy a neprovedená lidská přejímka dosud blokují vydání.

## 1. Metodika a skutečně provedené ověření

Při nezávislém lokálním průchodu jsme nespouštěli pouze předchozí F3D testy; načetli jsme přesné vydávané HTML do samostatného Chromium procesu, podchytili JS chyby a jakékoliv síťové requesty a iterovali všechny přístupné režimy.

- **Kombinační matice:** **256** skutečně dostupných profilů: `4 jazyky × 6 úrovní × 8 městských misí = 192` a **64** dalších B1–C2 metro misí 05–08. **256/256 základních DOM průchodů PASS**. Ve všech se zobrazilo jedno zadání a jedna aktuální pedagogická fáze; A1/A2 nemá přepínač metra.
- **Metro navigační inspektor:** volba pěti odlišných stanic (včetně University a Harbour) **nikdy nepřemístila hráče**. Graf je nadále deterministicky řízen původními volbami mise.
- **Mobilní základ:** **14 kombinací** (7 viewportů × město/metro: 320×568, 375×812, 390×844, 568×320, 768×1024, 1024×768, 1366×900): bez dokumentového vodorovného overflow a bez podměrečných viditelných dotykových tlačítek ve zkoušených stavech.
- **Offline a ochrana dat:** SHA-256 CSP hashe skriptu a stylů přesně odpovídají HTML, `default-src 'none'`, `connect-src 'none'`, žádné síťové requesty ani JS pageerrors při kompletní 256matici. Žádné nepovolené formuláře či externě odkazované skripty. Samostatné F3D workflow mělo 10 relevantních workflow SUCCESS.
- **Základní výkon:** inicializace v místním Chromiu orientačně 0,4 s; 256 kombinací vykreslení cca 20,5 s celkově (jediné místní prostředí, **nikoliv** garantovaná latence na iPhonu).
- **Další test:** simulované zvětšení root textu na 200 % pro všechna čtyři jazyky a reprezentativní úrovně; navzdory nulovému vodorovnému overflow dokumentu je **obsah některých komponent prakticky nečitelný či ořezaný**.
- **Limity metodiky:** další nezávislé F4 CI prohlížeče/WebKit ještě potřebují přesný PASS výsledný commit; místní náhled není náhradou za VoiceOver, TalkBack ani skutečný pinch zoom a text zoom na fyzických zařízeních.

## 2. Nálezy a priority

### F4-P1-01 — ztráta čitelnosti při zvětšení textu 200 %

**Závažnost P1 — blokátor produkce / přístupnost.**

Reprodukce: v Chromiu otevřít F3D HTML na 320/390px viewportu → DE/C2 → metro → mise 07 → zvednout velikost kořenového písma na 200 %. Záhlaví vybrané mise, názvy výukových fází a navigační dlaždice stanic se nepřiměřeně lámou; ve 390px vizuální kontrole byl text názvu mise 07 **oříznut**. Podobné zalamování u výukových fází `Lesen`, `Üben`, `Reflektieren`. **Pouhé měření scrollWidth = 0 tento problém nezachytí**. Neprohlašovat dosažení WCAG 2.2 AA.

**Návrh nápravy:** u úzkých viewportů a zvětšených fontů převést třífázový přehled na vertikální layout, rozvolnit dvousloupcový titulek, zajistit zobrazení celého názvu stanice i na 200 % bez skrytého overflow a znovu ověřit klávesnici/screen reader. Ověřit 320, 390 px a skutečný browser text zoom.

### F4-P2-02 — EN texty v již čtyřjazyčném prostředí

**Závažnost P2 — obsahová nekonzistence / jazyková redakce.**

Při zvolených ES/DE/FR se stále zobrazuje tlačítko `🚇 Riverton Metro · EN visual preview (B1+)` a anglický `title` přepínače metra. V indexu zároveň přetrvává metadata `interactive EN/B1 ... pilot` a označení `F2.1B · METRO DESIGN`, přestože už jde o F3D se čtyřjazyčnými hratelnými misemi. Reprodukováno skutečným načtením se všemi čtyřmi jazyky.

**Náprava:** autorské lokalizace všech uživatelsky viditelných textů; správně oddělit nehodnocenou galerii od hratelného metra, odstranit zastaralý popis pilotu z produktové hlavičky a HTML metadat.

### F4-P2-03 — původní učitelská matice nepokrývala všechna dostupná prostředí

**Závažnost P2 — procesní úplnost.**

F3D matice zahrnuje 192 kombinací s primárně 64 metro scénáři B1–C2 a jen 128 městskými. U B1–C2 však zůstává **dalších 64 klasických městských/autobusových alternativ**, které v téže kombinaci jazyk/CEFR/mise může žák hrát. To neznamená, že jejich kód nefunguje; znamená to, že jejich **lidská přejímka není pokrytá původní evidencí**.

**Náprava:** F4 vytváří novou úplnou `F4_256_variant_release_review_matrix.csv` se stavem `PENDING` ve všech lidských sloupcích. Nesmí se převést na PASS pouze na základě automatického render-testu.

### F4-GATE-04 — chybí lidská výuková a nativní jazyková přejímka

**Stav OPEN — blokátor F5.** Není doložena nezávislá kontrola idiomatičnosti EN/ES/DE/FR v kontextu a lingvistická přiměřenost zejména B2/C1/C2; není doloženo vlastníkovo vizuální a pedagogické schválení. **Všech 256 případů má nadále `PENDING`**.

### F4-GATE-05 — nejsou fyzické mobilní a asistivní testy

**Stav OPEN — blokátor F5.** Chybí fyzický iPhone/Safari, iPad Safari Split View a rotace, Android/Chrome, VoiceOver a TalkBack, režim skutečného 200% zvětšení. Emulovaný WebKit/Chromium není plnohodnotná náhrada.

### F4-GATE-06 — zvuková řečová hlášení nejsou součástí balíčku

**Stav SCOPE DECISION — rozhodnutí vlastníka.** F3B obsahuje psané PA a volitelné syntetizované originální signály, nikoliv nahrávky lidských hlasů v EN/ES/DE/FR. Jestliže mají být namluvená hlášení součástí slíbeného F3 produktu, je nutné před F5 dodat a redakčně schválit **předem vložený offline zvukový balíček**. Není přípustné zaměnit vizuální hlášení za ověřenou poslechovou úlohu.

## 3. Výrok auditora

| Oblast | Závěr | Důkaz / omezení |
|---|---|---|
| Identita a integrita F3D | PASS | Přesný SHA-256 artefaktu a obou CSP hashů |
| Offline, síťová izolace, bez automatického audia/mikrofonu | PASS v provedených scénářích | Žádný request při 256 lokálních kombinacích |
| Výchozí vykreslení 192 City + 64 Metro | PASS | 256/256; jediný panel, žádné JavaScript výjimky |
| Základní mobilní rozlišení | PASS v testovaných stavech | 14 standardních variant bez overflow |
| Text zoom a čitelnost | **FAIL P1** | 320/390 px, německá C2 mise 07, 200% text |
| Lokální jazykové označení | **FAIL P2** | Anglické galerijní labely a tooltip v ES/DE/FR |
| Procesní úplnost recenzí | PENDING | Rozšířeno na 256, ale bez podpisu učitele |
| Fyzická přístupnost a přejímka | PENDING | Nelze automaticky suplovat |
| Nezávislé F4 CI | PENDING (před tímto dokončením) | Výsledky se doplní po skutečném doběhnutí |

**Release decision: NO-GO.** Žádný merge do produkční větve, žádná aktivace v katalogu LSH. Opravy P1/P2 řešit v **oddělené remediation větvi**, pak přepočítat CSP, spustit novou F4 regresi na přesném commitu a teprve po lidském a vlastnickém souhlasu uvažovat o F5.

## 4. Reprodukční přílohy

- `F4_256_variant_release_review_matrix.csv` — úplný registr 256 lidských přejímek.
- `city-quest-f4.independent.static.test.cjs` — samostatné kontroly CSP, izolace a matice.
- `city-quest-f4.independent.browser.test.cjs` — 256 kombinací, citlivé mobilní rozměry, zaměření klávesnice, offline a WebKit.
- Lokální průzkum: `City_Quest_F4_independent_results.json`; snímky `F4_200pct_zoom_mobile.png`, `F4_200pct_zoom_390.png`; negativní nálezy reprodukovány před jakoukoliv nápravou.

*Důležitá poznámka:* Výrok o přístupnosti je záměrně konzervativní. Test, který kontroluje pouze to, že nepřetéká šířka stránky, není certifikací 200% čitelnosti ani WCAG 2.2 AA.
