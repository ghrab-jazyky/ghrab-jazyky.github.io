# R35 – univerzální architektura nezávislých Reading testů (pracovní návrh)

**Status:** DRAFT, NO MERGE / NO PUBLICATION. Navazuje na R32 → R33 → R34 a na stabilní R31 jako produkční baseline.

## Výukový účel a rozsah

- **Cílové úrovně:** A1–C2, jazyky EN/ES/DE/FR, všech pět dosavadních Reading témat. Žádné překlady či přeštítkování jediné jazykové úrovně jako náhražka pedagogicky samostatného obsahu.
- **Ročník/věk:** gymnázium, orientačně 12–19 let; **cíl:** nezávisle posoudit porozumění autenticky působícím textům a interpretaci / aplikaci jejich významu.
- **Čas:** definovaný **pro každý bank zvlášť**, aktuální Asteroids EN/B2 20 minut; jiné varianty až na základě obsahové a časové přejímky.
- **Slabší žáci:** samostatné A1/A2 banky pro daný text a jazyk; **silnější:** C1/C2 banky vyžadující vyšší míru inference. Místo zjednodušených podkladů u pokročilých vždy zachovat náročnost zdrojové úrovně.

## Technický systém

- `generic-bank-core.js`: oddělený schvalovací/validační kontrakt `LSH_INDEPENDENT_READING_BANK_R35_V1`, bez možnosti označit rozpracovaný bank za publikovaný. Kontroluje existující kartu v katalogu, konkrétní topic/lang/level i **skutečně zvolenou** variantu, SHA-256 původního HTML, přesný původní název varianty, 6–30 nových položek, vlastní ID, shodu odpovědí, důkazy v odstavcích, čas a rozdělení správných možností.
- `universal-preview.html` + `universal-preview.js`: izolovaný náhled z pracovní větve, parametry `topic`, `lang`, `level`, `timer`, `attempt`. Načítá schválenou **procvičovací** kartu výhradně z existujícího katalogu, bank `<topic>/<lang>-<level>.json` a manifest R31. Pokud jakýkoliv vstup chybí či je neplatný, test se nespustí.
- Ukázková adresa z lokálního checkoutu pracovní větve:
  `http://127.0.0.1:8765/language-skills-hub/self-check/test-banks/reading/universal-preview.html?topic=rl-asteroids&lang=en&level=B2&timer=20&attempt=r35teacherreview`.
- Využívá R30 lokální časovač a obnovu, zobrazení pouze chybných odpovědí po odevzdání a dosavadní pracovní klasifikační stupnici. Zůstává bez backendu, identity, telemetrie a možnosti zabezpečeného utajení řešení.

## Vytvořená druhá obsahová reference

**Asteroids EN/B2**: 10 původních multiple-choice otázek zaměřených na interpretaci údajů o riziku, měření a nejistotu, experiment DART a odpovědnou komunikaci. Původní téma, text i 18 procvičovacích úloh jsou nezměněné. Všechny položky mají 4 možnosti, konkrétní oporu v odstavcích a učitelská vysvětlení.

**Obsahové omezení:** Některé položky nutně vycházejí ze stejných tvrzení jako procvičovací karta. To, že otázky mají jiný text a ID, není důkaz didaktické nezávislosti; vyžaduje pozdější důkladný audit.

## Pravdivé pokrytí

- Počet možných variant Reading: **120**.
- Počet možných variant Listening: **18**.
- Celkem: **138**.
- Obsahově nově navrženo: **7** (Can Mistakes EN A1–C2 = 6; Asteroids EN B2 = 1).
- Zbývající nové sady: **131**.
- Obsahově schválené: **0**.

`test-banks/coverage.json` tento stav eviduje. Nesmí automaticky přiřazovat `DRAFT_UNAPPROVED` variantám, které jsou pouze procvičovací, ani tvrdit, že nevyrobené jazykové mutace mají vlastní test.

## QA před publikací

1. Node validace R22–R35 a Chromium/WebKit: plné skóre, jedna chyba, obnovení pokusu, neexistující bank, podvržený jazyk/CEFR, změněný checksum, bezpečné nedostupné testy.
2. Externí audit pedagogické originality a jazykové přiměřenosti každého banku (s výpisem přesných chyb, navrženými opravami a re-testem).
3. Podložené rozhodnutí učitele o rozložení otázek/času/pracovní stupnici a případné přejímce na skutečných zařízeních.
4. Teprve po kompletním naplnění cílového obsahu a kontrolách připravit veřejné schvalování. Neaktivovat všechny možné úrovně pouhým přepnutím tlačítka.

**Pevná hranice:** GitHub Pages je statický veřejný web. Správná řešení v JSON nejsou utajená; bez serverového vyhodnocení nejde o nezfalšovatelnou zkoušku.
