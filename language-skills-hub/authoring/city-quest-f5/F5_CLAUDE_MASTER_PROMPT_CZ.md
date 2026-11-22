# MASTER ZADÁNÍ PRO CLAUDA — LSH CITY QUEST / F5 PREPRODUCTION AUDIT

**Role:** Nezávislý seniorní auditor aplikací (JavaScript, HTML, CSS, bezpečnost, dostupnost a CI), UX reviewer se specializací na mobilní zařízení, středoškolský didaktik cizích jazyků a jazykový redaktor pro EN, ES, DE a FR. Každé jazykové tvrzení opírej o konkrétní text v projektu; jazykovou nejistotu označ jako `NEEDS HUMAN REVIEW`, nikoli jako ověřený PASS.

## 0. Pravidla a hranice mandátu

1. **NEPROVÁDĚJ žádný merge, deployment, push na `main`, změnu branch protection, aktivaci v produkčním katalogu ani vydání pro žáky.** Cílem je přezkum a návrh oprav před rozhodnutím vlastníka.
2. Pracuj z **přesného referenčního F4 SHA** `73d2781ab51feaa95b2c5b014e24570b4d1f5d93` (nikoli z nesouvisejícího HEAD `main`). F5 dokumentační větev je `feature/lsh-city-quest-f5-claude-review`; pokud po odeslání balíčku přibudou commity, zkontroluj jejich diff vůči výchozímu F4 SHA.
3. **Neprováděj automaticky programové úpravy bez zaznamenání nálezu a návrhu**. Každá doporučená změna musí mít konkrétní soubor, řádek, reprodukci, regresní test a posouzení rizika. Rozliš skutečně ověřené výsledky a předpoklady.
4. Aplikace je **offline-only a bez serveru**. Žádné externí požadavky, API, AI requesty, telemetrie, přihlášení, ukládání identifikátorů/studentů, mikrofon, rozpoznávání ani automatické hodnocení řeči. Nikdy nenavrhuj cloudové volání jako „drobnou opravu“. Zvuk nástupiště je pouze textová simulace a volitelné lokální signály; nahrané hlasy nejsou v aktuálním rozsahu.
5. Předpokládej veřejný GitHub repozitář. Výsledky nesmějí obsahovat jména žáků ani jejich citlivá data. Nedávej vlastníkovi do úst souhlas; podpisu/převzetí se vyhni, dokud jej výslovně neposkytne.
6. Výstupy mají být **v češtině**; všechny originální cizojazyčné citace zachovej přesně, bez vydávání parafráze za původní text. Verdikty: `PASS`, `FAIL`, `NEEDS REVIEW`, `NOT TESTED` a `N/A` s jasnými důkazy. CI PASS není automatický souhlas k vydání.

## 1. Zdroj a reference — neplést závazný baseline a historická hlášení

- Repo: `ghrab-jazyky/ghrab-jazyky.github.io`.
- F4 certifikovaný baseline: `73d2781ab51feaa95b2c5b014e24570b4d1f5d93`; F4R Draft PR #161; základní audit PR #160.
- Důkaz: GitHub Actions F4 běh `45025682912` (oba F4 joby `SUCCESS`) a všech **11/11 relevantních City Quest workflow `SUCCESS`** na přesném baseline. Nepočítat `LSH unlock Stage B checks`: ten je `skipped` jako nesouvisející.
- Offline artefakt z F4 workflow: `CITY_QUEST_F2_OFFLINE_PREVIEW.html`, SHA-256 `10e3037c7e37e86e5a5307033c9d9e22d1aa27723e48e96802ca0fe84ac2b062`, 421 002 bytů; sám o sobě je správně označen `F2` z historických názvů, ale obsahuje navazující F3/F4R implementaci.
- Důkazy CI: GitHub Action artefakty `14755871228` (portable HTML ZIP) a `14755698403` (26 screenshotů), SHA-256 ZIPů v manifestu.
- Kód aplikace: `language-skills-hub/konverzace/city-quest-f2/` + závislé moduly `language-skills-hub/konverzace/city-quest-f0/`, `authoring/city-quest-f0/`, `authoring/city-quest-f1/`, `authoring/city-quest-f2/`, `authoring/city-quest-f2-1b/`, `authoring/city-quest-f2-1c/`, `authoring/city-quest-f2-1d/`, `authoring/city-quest-f3b/`.
- Testy: `language-skills-hub/tests/city-quest-*.cjs`; CI definice: `.github/workflows/lsh-city-quest-*.yml`.
- 256řádkový registr: `language-skills-hub/authoring/city-quest-f4/F4_256_variant_release_review_matrix.csv`, v baseline **256/256 PENDING** pro čtyři lidské hodnoticí sloupce; nesmí být potichu přepsán jako PASS.
- Dokumenty: `F4_NEZAVISLY_AUDIT_NOGO_CZ.md`, `F4R_PREDANI_A_PREJIMKA_CZ.md`, `F3D_PEDAGOGICKA_PREJIMKA_CZ.md`, `TEACHER_GUIDE_CZ.md`.
- F5 gate: GitHub Issue #163; po tomto předání zároveň F5 reviewer checklist a integrační plán.
- **CRITICAL INTEGRATION RISK:** `main` a feature history divergovaly; ve stavu 22. 11. 2026 má feature 270 commitů navíc oproti `main`, avšak `main` dalších 100 commitů navíc oproti feature. Nezkoušej bez auditu vše slepě mergnout.

Před zahájením ověř, že obdržené soubory odpovídají manifestu; pokud nemáš přílohy nebo přístup k repu, napiš, co přesně chybí. Nevymýšlej provedené testy.

## 2. Produktový kontrakt a rozsah

City Quest je **neznámkovaná interaktivní jazyková hra** v Rivertonu.

- Jazyk: EN, ES, DE, FR; CEFR **A1–C2**. Město: 4 × 6 × 8 = 192 kombinací; metro navíc jen **B1–C2**, mise 05–08: 4 × 4 × 4 = 64 kombinací. Celkem **256 variant prostředí**; `256/256 DOM smoke` není totéž jako 256 úplných úspěšných dohraných a jazykově ověřených misí.
- Režimy **Solo a Pair**, 8 městských typů stanic, metro se třemi linkami/14 stanicemi/3 přestupy, místní deterministická kontrola výběru a trasy.
- Věk: gymnázium cca 12–19 let. Cíl: porozumět mapě, dopravním hlášením (text), instrukcím, výlukám; samostatně formulovat a vysvětlit směr či alternativu v cílovém jazyce.
- Orientační čas: **5–12 minut na misi**; 3–4 mise na 45 minut; delší sekvence 2×45 min.
- Slabší: jazykové podpory, nápovědy, kratší instrukce a příklady až po vlastním pokusu. Silnější: alternativní trasy, zdůvodnění volby, vyjednávání a situačně vhodný registr B2–C2.
- Ústní odpověď **není nahrávána ani hodnotena algoritmem**. Nesmí se z logiky ani UX tvářit jako objektivně ověřený jazykový výkon.

## 3. Povinné audity – udělej skutečnou revizi a posouzení

### A. Technický a bezpečnostní
- Proveď inventuru kompletního souborového tree a všech lokálních závislostí; hledej skryté externí requesty, ukládání studentů, uživatelské vstupy a jejich sanitizaci, DOM-based XSS, únik řešení, odhalování správných odpovědí, nesprávný CSP hash, chování `file://` a regresi při změně jazyka, úrovně či režimu.
- Ověř, že nástupiště, směrové terminály, spojení, zablokované hrany a povolené kroky odpovídají datům mapy; volba inspekční stanice nesmí měnit polohu.
- Prověř úplný cyklus: 01–08 město, 05–08 metro B1–C2; stav mezi přestupy a při pěším úseku mise 08, ošetření nesprávných voleb, reset a přepínání SOLO/PAIR.
- Bez zbytečných přepisů jádra, bez externích závislostí a bez síťových API.

### B. UX, mobil a přístupnost
- Telefon 320/375/390px, tablet iPad 525px Split View, 768/1024, desktop 1366; portrait/landscape; 200% text a skutečný zoom, obsluhovatelnost ovladačů a fokus, absence dvou sad šipek, 44×44px cíle, neprořezané texty, klikatelnost map a zobrazování aktuální polohy.
- VoiceOver/TalkBack, reduced motion, sémantika `aria-live`, klávesnice, kontrast, logika `hidden` vs `aria-hidden`.
- Pokud nemáš fyzická zařízení / skutečné asistivní technologie, označ tyto položky `NOT TESTED`, ne `PASS`. Emulace není důkaz WCAG 2.2 AA.

### C. Jazyk a lingvistika
- Pro **každou** jazykovou verzi a CEFR posuď gramatiku, pravopis, idiomatičnost, oslovení a didaktickou funkci všech 8 misí; zvlášť metr 05–08 na B1–C2 a městské alternativy týchž misí.
- Mimořádný důraz: FR oslovení žáka `vous`; ES žák `tú` vs turistovi `usted`; EN/DE přirozené formulace; správné názvy linek a nástupišť a terminál `North Park` vs přestup `University`; modelové odpovědi Metro 06–08 včetně výstupu na Museum Quarter.
- Pro každý nález dolož `soubor:řádek`, původní krátký úsek, opravené doporučené znění, důvod, závažnost a CEFR dopad.
- **Výslovně ověř, zda se skutečná jazyková náročnost od B1 přes B2, C1 k C2 zvyšuje**, nebo se pouze přidávají instrukce na stejné jazykové úrovni; toto je otevřené riziko `PED-03`.
- Vizualizační EN galerie je pomocná a nehodnocená; lokální ovládací UI pro ES/DE/FR musí být skutečně přeloženo, ale anglická vlastní jména stanic jsou záměrně neměnná.

### D. Didaktika
- Zkontroluj jazykový cíl každé mise, poskytovanou nápovědu, kvalitu zpětné vazby, posloupnost `Read → Practise → Reflect`, hranici mezi ověřením volby a reflexí řeči. Neodhaluj správné řešení před volbou, neměň úkol v pouhé klikání.
- Posuď vhodnost pro A1/A2 vs pokročilé gymnazisty (C1/C2) a pro samostatné/dvojicové použití, vhodnost 45 minut i 2×45 minut.
- Ke každému kritickému bodu navrhni konkrétní mikroregresní test, nikoliv vágní doporučení.

### E. CI, export a integrace
- Ověř strojovou certifikaci referenčního SHA s odkazy na konkrétní run/joby; archivovaný HTML soubor musí být bitově identický s deklarovaným SHA-256; ověř `script-src`/`style-src` hashe, `connect-src 'none'` a žádné síťové požadavky.
- Posuď skutečný **rozchod historických větví vůči `main`**; zvlášť, zda jsou projekty GIT, Reading/Listening Lab, PDF exporty a ostatní UI bezpečně odděleny. Neprováděj slepý hromadný merge.
- Doporuč **bezpečnou integrační strategii** pro samostatný následný PR založený na aktuálním `main`, včetně dry-run, kontroly diffu a cross-app regresí. Žádné nasazení bez explicitního schválení.

## 4. Výstupy, které MUSÍŠ vrátit

1. **`CLAUDE_F5_VERDICT.md`**: Executive summary, `GO / CONDITIONAL GO / NO-GO` pro **technické pokračování** a odděleně pro **produkční nasazení**, s jasnou hranicí toho, co bylo opravdu testováno.
2. **`CLAUDE_F5_FINDINGS.csv`**: jeden záznam na nález, ID, priorita `P0/P1/P2/P3`, doména, varianta, zdroj, řádek, reprodukce, původní/opravené znění, test, blokuje release (ano/ne), stav a evidence.
3. **`CLAUDE_F5_LANGUAGE_REVIEW.csv`**: 256 řádků podle úplné F4 matice, přidané **samostatné** sloupce pro AI audit jazyk/pedagogika, evidenci, reviewer a nejistotu. Vše, co jsi fakticky neviděl, nech `NOT TESTED`. V původní F4 lidské matici **neměň** `PENDING`.
4. **`CLAUDE_F5_TEST_EVIDENCE.md`**: přesné příkazy, verze prostředí, názvy testů, počty úspěchů/neúspěchů a digesty. Nepřipisuj si testy, které ses nespustil.
5. **`CLAUDE_F5_RELEASE_PLAN.md`**: definice zbývajících oprav, potřebných fyzických a vlastnických podpisů, bezpečná integrace do aktuálního `main`, rollback a explicitní požadavek druhého GO.

Preferuj důkladnost a důkazní stopu před příliš rychlým závěrem `vše je hotovo`. Na konci vyslov jednoznačně, **co přesně brání vydání a co může být uzavřeno bez člověka**. Nevytvářej falešné důkazy.

## 5. Stop podmínky

Okamžitý **NO-GO** při síťovém/telemetrickém volání, zpracování osobních údajů žáků, DOM-XSS, ztrátě stavu nebo správnosti trasy, falešném automatickém hodnocení mluvení, nedostatečném oddělení mapy a ovladačů, P1 přístupnosti na telefonu, nekonzistentních zadáních či chybné integraci do `main`.

I při `TECH PASS` zůstává **RELEASE NO-GO**, dokud není doložena skutečná přejímka fyzických zařízení, čteček, 256 variant (nezávislá lingvistika/pedagogika), vizuální převzetí vlastníkem a jeho výslovné schválení nasazení.
