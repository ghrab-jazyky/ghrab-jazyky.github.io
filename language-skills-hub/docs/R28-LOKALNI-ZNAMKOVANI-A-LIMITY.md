# R28 – návrh známky 1–5 v Language Skills Hub bez backendu

**Datum:** 9. 11. 2026  
**Stav:** produkční release kandidát; nasazovat až po CI a skutečném schválení rozsahu známkování.  
**Web:** https://ghrab-jazyky.github.io/language-skills-hub/

## 1. Zadání a kompromis

Majitel projektu výslovně opravil požadavek: **Reading a Listening Test budou známkované**. Současně potvrdil, že neplánuje žádný backend, databázi ani autentizaci žáků. V tomto prostředí aplikace **může matematicky spočítat známku 1–5**, nemůže však prokázat pravost, autorství a nezměnitelnost výsledku. Zobrazuje proto **návrh známky k potvrzení učitelem**.

Nezamlčovat, že žák může opakovat test otevřením další relace, měnit URL a získat klíče z veřejných procvičovacích karet; ovládací prvky pro učitelské hodnocení písemných odpovědí na studentském zařízení nejsou autentizované. Nikde se netvrdí, že jde o zabezpečený klasifikovaný test. Žádné odpovědi, známky ani osobní údaje se neposílají na server.

## 2. Pracovní jazyková stupnice

**Zdroj:** `Pravidla hodnoceni_pracovní verze 2026.docx.pdf`, příloha č. 1, článek 1 bod 24, výslovně **orientační** procentní převod. Novější schválenou verzi a její účinnost se nepodařilo nezávisle ověřit.

| Návrh známky | Přesné procento (bez zaokrouhlování před rozhodnutím) |
|---|---|
| 1 | >= 88 |
| 2 | >= 74 a méně než 88 |
| 3 | >= 59 a méně než 74 |
| 4 | >= 44 a méně než 59 |
| 5 | méně než 44 |

Tato implementace vědomě upřesňuje dosud **nevyřešené** zacházení s desetinnými procenty: hranice se porovnávají přesným poměrem `získané_body*100 >= hranice*maximum`. Například **87,5 % → návrh 2; 73,5 % → návrh 3; 58,5 % → návrh 4; 43,5 % → návrh 5**. Je to **prozatímní technické pravidlo**, nikoli doložené rozhodnutí školy. Celková procenta zobrazená na dvě desetinná místa nemají na klasifikaci vliv.

V kódu `self-check/results/grade-core.js` není dostupná funkce pro zápis oficiální známky. `officialGradesEnabled:false`, `backendEnabled:false`, `gradedTestsEnabled:false` zůstávají zachované; `localGradeProposalsEnabled:true` se týká pouze nezaručeného místního návrhu.

## 3. Reading Test

- Úroveň A1–C2; **gymnázium**, věkově cca 12–19 let
- Cíl: ověřit porozumění textu a práci s textovými důkazy; **10–30 minut**
- Slabší žáci A1/A2, pokročilí C1/C2
- Všech pět původních Reading témat, čtyři jazyky, 120 variant a 1 800 objektivních úloh
- Uzavřené úlohy mají po **jednom bodu**; nezodpovězená položka = 0 bodů
- Po souhrnném odevzdání zobrazit správné a chybné odpovědi, body, přesné procento a **návrh známky 1–5**
- Volitelná reflexe zůstává **nebodovaná**; pokud ji chce vyučující známkovat, musí přijmout zvláštní hodnoticí postup

## 4. Listening Test

- Úroveň EN A1–C2; **gymnázium**, cca 12–19 let, **15–30 minut**
- Slabší žáci A1/A2, pokročilí C1/C2
- Tři videa, 18 variant: 251 objektivních dílčích úloh a 84 písemných úloh napříč variantami
- Učitel řídí dvě poslechnutí externí nahrávky, student nemá audio přehrávač
- Objektivní úlohy: jeden bod za správný výsledek, jinak nula
- **Písemné úlohy:** po odevzdání učitel posoudí odpovědi na studentově aktuálním zařízení podle reference a významové přijatelnosti. Každá položka má 1 bod (uznáno), 0 bodů (neuznáno/nezodpovězeno) nebo stav **čeká na posouzení**.
- **Dokud existuje alespoň jedna písemná položka bez posouzení, celková známka se nezobrazí.** Po všech rozhodnutích se sečtou objektivní i písemné body a vypočítá návrh známky 1–5.
- Ovládací prvky hodnocení **nejsou autentizované**. Nelze tím garantovat, že je ovládal skutečně učitel. Výsledek musí učitel osobně ověřit a rozhodnout, zda jej může použít.
- Jednobodová váha písemných úloh nebyla potvrzena vedením školy; zvolena jako transparentní pracovní výchozí nastavení, ne jako závazná rubrika. Významově přijatelnou odpověď posuzuje učitel.

## 5. Co je potřeba potvrdit před oficiální klasifikací

1. Platnost školní klasifikační stupnice a účinnost konkrétního dokumentu
2. Zacházení s desetinnými hodnotami (návrh je přesný poměr bez zaokrouhlování)
3. Hodnoticí kritéria a váhy otevřených písemných odpovědí
4. Proces osobního ověření výkonu a bezpečný zápis výsledku; bez backendu nelze zaručit nezměnitelnost a autorství

## 6. Přejímka a rollback

R28 regresní testy ověří všechny hranice známek, správnost 120 Reading a 18 Listening variant, možnost dokončit/pozastavit učitelské posouzení, žádné student POST, zachování 29 původních karet a správnou funkci v Chromium/WebKit na PC/mobilní šířce. Po sloučení do `main` ověřit GitHub Pages release `version.json.version == R28`, dostupnost `grade-core.js` i studentských stránek, následně proveď praktickou pedagogickou přejímku na Windows, Androidu a iOS.

Pro rychlý rollback lze vytvořit revert release PR na `main`; poslední verifikované produkční vydání **R27** má commit `a898e841f6518c71a43f7fc3f15aa8868558f789`.
