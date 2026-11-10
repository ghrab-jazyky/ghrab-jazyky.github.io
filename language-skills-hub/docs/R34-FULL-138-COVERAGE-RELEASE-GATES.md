# R34 – kompletní technické pokrytí 138 Reading/Listening variant a přejímací brána

**Stav:** `DRAFT_NEVER_PUBLIC_STUDENT` · **Datum:** 10. 11. 2026 · Základ ostré verze: R31.  
**Repozitář:** `ghrab-jazyky/ghrab-jazyky.github.io` · **Pracovní větev:** `feat/lsh-r34-full-content-candidate-coverage-2026-11-10` (navazuje přes R33 na R32).

## Rozsah a dosažená připravenost

| Oblast | Počet variant | Charakter podkladů | Před zveřejněním nutné |
|---|---:|---|---|
| Reading – EN/ES/DE/FR A1–C2, 5 témat | 120 | 2 ručně napsané EN B1/B2 reference; **118 mechanicky vytvořených source-anchor kandidátů** (982 úloh) | U 118 sad **obsahové přepracování**, potom samostatný audit všech 120 |
| Listening – EN A1–C2, 3 témata | 18 | 192 nově napsaných zadání na základě metadat stávajících procvičovacích karet | **Kontrola přímo podle původního videa/zvuku** a nezávislý CEFR audit |
| Conversation – 21 témat | — | Pouze procvičovací režim | Testovací režim je výslovně zakázán pozdějším rozhodnutím R22 |
| Existující practice | 29 témat / 642 variant | Beze změny | Nepřepisovat |

**Pozor:** Datové pokrytí neznamená 138 hotových a ověřených nezávislých testů. Především automaticky sestavené Reading položky zkoušejí hlavně identifikaci úryvků, přiřazování odstavců a lokální návaznost; u C1–C2 neodpovídají požadované kognitivní náročnosti. **Nesmí se vydat studentům jako finální test ani označit za schválené.** Při obsahové kontrole je nutné tyto položky skutečně přepsat.

## Cíl aktivity a doporučené použití

- **CEFR:** A1–C2, Reading ve 4 jazycích; Listening nyní pouze angličtina.
- **Věková skupina:** gymnázium, orientačně 12–19 let. Úroveň ani čas se nesmějí odvozovat pouze od věku.
- **Cíl:** nezávislé ověřování práce s textem a poslechem pomocí skutečně odlišných hodnotitelných úloh, v lokálním dohledovém režimu.
- **Předběžný čas:** 20 min u pracovní referenční sady; po ověření lze použít učitelské nastavení časového limitu 5–120 min. U Listening řídí přehrání učitel (dvě přehrání).
- **Slabší žáci:** samostatné A1/A2/B1 obsahově přiměřené testy a dostupný čas; *nikoliv* pouze snadné označení stejné C1 sady.
- **Silnější žáci:** skutečné argumentační, inferenční, lexikální a diskurzivní úlohy pro B2–C2, nejen mechanické vyhledávání úryvků.

## Hotové technické součásti

1. Pět kompletních Reading kolekcí v `self-check/test-banks/reading/collections/*.json` a dvě dříve vytvořené ruční reference EN/B1 a EN/B2.
2. Tři Listening kolekce s originálně sepsanými variantami `self-check/test-banks/listening/collections/*.json`: každá úroveň má 2 gist MC, 3 detail MC, 3–4 řadicí úlohy, 1 krátkou písemnou a 1 otevřenou interpretační úlohu. Otázky nejsou ověřeny proti skutečnému záznamu.
3. `self-check/test-banks/candidate-core.js`: kontrola struktury, nezveřejněného statusu, zdrojových SHA, jedinečných otázek, bodů a oddělení CEFR; odmítá chybný/měněný zdroj.
4. `self-check/test-banks/reading/preview.html` a `listening/preview.html`: pracovní přímé studentské náhledy. Načítají *pouze pracovní banku*, před startem kontrolují SHA-256 skutečného původního HTML, využívají R30 lokální časovač, obnovu, 4 rohy, odevzdání a zpětnou vazbu jen k chybám. Listening navazuje na učitelské 0/1 a místní CSV (R31).
5. `self-check/test-banks/qa.html`: pracovní přejímací katalog Reading/Listening, jednotlivé QA odkazy, export anonymního balíčku pro jednu variantu nebo celé téma **bez žákovských údajů**. Při exportu se opět kontroluje SHA-256 originálu.
6. `self-check/test-banks/review-matrix.json`: 138 samostatných položek; všechny s `studentPublicationApproved:false` a `teacherApproved:false`, stav auditu a kontrolní součty.
7. `.github/workflows/lsh-r34-full-coverage.yml`: smluvní kontrola všech 138 variant a regrese R22–R33; Chromium/WebKit + všech 120 Reading náhledů v jednom browser QA běhu.

Vše zůstává ve **stacked DRAFT** větvi. Nevzniká žádný veřejný produkční odkaz/QR pro nové banky. V `main` zůstává R31 a původních 29 schválených procvičovacích karet.

## Lokální provoz testovací větve

Po stažení/checkoutu **pracovní větve R34** spustit webový server v kořeni repozitáře, například `python3 -m http.server 8765 --bind 127.0.0.1` (neotevírat HTML přímo přes `file://` kvůli fetch a Web Crypto). Otevřít:

`http://127.0.0.1:8765/language-skills-hub/self-check/test-banks/qa.html`

Na stránce vybrat dovednost, téma, jazyk a úroveň, spustit QA náhled a stáhnout jeden soubor pro audit varianty nebo celé téma. Žádný přístup k serveru s výsledky není nutný. **Není to odkaz do ostrého katalogu.**

## Společné stop-podmínky

- Ověření syntaxe/kódu ani 100% zobrazení 138 variant **není nezávislé ověření obsahové správnosti**.
- Přepsat všech 118 mechanických Reading sad; zkontrolovat u všech variant úroveň, autenticitu, jediné správné řešení, přiměřené distraktory a návaznost na text. Nespoléhat jen na vyloučení doslovně shodných zadání.
- U Listening zhlédnout/vyslechnout skutečné zdroje: význam, časování, jednotlivá fakta, přiměřenost dvěma přehráním a otevřené hodnocení. Bez skutečné kontroly nahrávky neoznačit za schválené.
- Udělat samostatnou reálnou UAT na Windows Chrome/Edge/Firefox, Android Chrome, iOS Safari a iPadOS Safari včetně Split View / návratu ze skryté karty.
- Schválit rozsah 6/8/10 čtecích otázek podle CEFR, rozsah 8–11 poslechových úloh, čas a 1bodové váhy; při 10 úlohách může jedna chyba posunout výsledek o 10 procentních bodů.
- Pracovní známkovací prahy 88/74/59/44 nejsou automaticky závazným školním pravidlem; konverzi na oficiální známku musí schválit škola.
- **GitHub Pages je veřejný statický web; klíče jsou technicky dostupné**. Místní návrhy známek a CSV nejsou důvěryhodná evidence. Pro zabezpečené klasifikované zkoušky použít GIT/backend.
- Do schválení nepřidávat nové banky do ostrého učitelského katalogu a neprovádět merge do `main`.

## Co znamená dokončení R34

Dokončená **technická infrastruktura** znamená, že všechny kombinace mají vlastní pracovní banku, kontrolovatelný zdroj a funkční testovací cestu, bez dopadu na původní practice a bez narušení bezpečnostních omezení. Úplné **obsahové a pedagogické dokončení** znamená další revizi a autorizaci všech 138 variant. Tyto dva milníky nesmějí být zaměněny.

Více podrobností a instrukce pro Clauda: `docs/R34-CLAUDE-CONTENT-AUDIT-PROMPT.md`.
