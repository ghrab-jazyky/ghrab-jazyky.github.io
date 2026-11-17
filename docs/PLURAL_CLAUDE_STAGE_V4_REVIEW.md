# PLURAL – předání k nezávislému finálnímu auditu (staging V4)

**Stav: NO-GO. Tento dokument neschvaluje nasazení.**

## Zdroj pravdy
Repozitář: `ghrab-jazyky/ghrab-jazyky.github.io`  
Větev: `feat/lsh-plural-cards-r70-stage` (nikoli produkční `main`)  
Karta: `language-skills-hub/konverzace/plural/index.html`  
Katalog: `language-skills-hub/data/cards.json` a `data/catalog-i18n.json`  
Kontrakt: `language-skills-hub/tests/plural-grammar-contract.test.cjs`  
Browser E2E: `language-skills-hub/tests/plural-grammar.browser.test.cjs`  
CI: `.github/workflows/lsh-plural-stage-qa.yml`

Neprováděj revizi podle starého archivu samostatně: rozhodující je aktuální obsah **této větve**. Stávající kartu „Umělá inteligence“ použij jako funkční referenci rozhraní, nikoliv jako schéma jazykové slovní zásoby Plural.

## Závazná varianta A
- Pouze **němčina, španělština, francouzština** (výchozí DE); všechny tři jazyky procvičují **vlastní** tvorbu plurálu.
- V každém jazyce A1–C2, na úroveň 8 stanic, na stanici 10 běžných + 3 EXTRA. Celkem **1 872 výukových položek** (624 na jazyk).
- Zachovat otočné kartičky, české významy, EXTRA poznámky, pravidla, časovač, světlý/tmavý režim, mobilní ovládání a slovníček.
- Plural je typ `grammar-flashcards`. Původních 22 Conversation Lab karet musí zachovat shodný původní engine.
- Učitelský zámek `?zamek=1` je pouze **zámek ovládacích prvků**, nikoliv bezpečnostní anti-cheat systém.

## Úkol pro Clauda
Proveď skutečně nezávislý odborný audit; výsledky předchozích kontrol nepovažuj za důkaz jazykové správnosti.

1. **Kompletní jazyková kontrola DE/ES/FR:** Projdi všech 1 872 položek včetně singuláru s rodem/členem, plurálu, variant, štítků tvoření plurálu, českého významu a 288 EXTRA položek v ES/FR. Věnuj pozornost nepočitatelným podstatným jménům, hromadným jménům, vlastním jménům, sporným regionalismům, lexikálním dvojznačnostem a vzácným plurálům.
2. **Cílený audit nových EXTRA výkladů:** Původních 212 generických ES/FR poznámek bylo přepracováno. Ověř, že každá nová poznámka opravdu vysvětluje **správný konkrétní jev** a neobsahuje falešné pravidlo, nepravdivou etymologii ani pedagogicky zavádějící tvrzení.
3. **Metodika:** Ověř návaznost A1→C2; 96 gramatických výzev pro B1–C2 a 28 doplněných pokročilých příkladů. Dolož, proč náročnost odpovídá CEFR: pouhá nízká frekvence slova není dostatečnou gramatickou gradací.
4. **České významy a slovníček:** Mapování `CZ_GLOSSARY.recommended` obsahuje 1 358 jednoznačných hesel. Ověř význam a správnost členu; víceznačná hesla se nesmějí měnit na nepodložený jediný překlad. Sdílený slovníček musí ukládat **singulárové heslo**, nikoli řetězec `singulár → plurál`. Samotný plurál se zobrazuje odděleně.
5. **Technika a přístupnost:** Otestuj všechny jazyky a úrovně, 8 stanic, 10+3 kartiček, klávesnici, mobilní a desktopové zobrazení, EXTRA, časovač, fullscreen, offline slovník, CSP, učitelský zámek a IndexedDB. Ověř integraci do katalogu a přitom regresní izolaci původních karet.
6. **Ověření důkazů:** CI běží ve skutečném GitHub Actions s lokálním HTTP serverem; testy Playwright ověřují Chromium i WebKit. **Není to produkční GitHub Pages.** Lokální/browser testy nedokazují jazykovou správnost ani kompatibilitu se všemi zařízeními. Výsledky CI ověř podle konkrétních běhů a commitů.
7. **Audit změn:** Prohlédni všechny rozdíly větve proti `main`; zvlášť ověř, že úpravy 21 starších testů **nesnižují přísnost** kontrol původních karet, ale pouze izolují nový typ a přepočítávají inventář.

## Požadovaný výstup
- Přehled nálezů P0/P1/P2/P3, každý s přesnou cestou, jazykem, úrovní, stanicí, položkou, původní hodnotou, opraveným návrhem a ověřitelným odůvodněním.
- Samostatná matice všech nezrevidovaných položek – žádné tvrzení „zkontrolováno vše“, pokud zůstaly jen vzorky.
- Skutečný rozdíl mezi testem, jenž **prošel**, testem **neprovedeným** a testem **blokovaným prostředím**.
- Závazný závěr **GO / CONDITIONAL GO / NO-GO** pro jazykovou část, technickou část a celkový release.
- Pořadí oprav a konkrétní akceptační test každé závažné chyby.

## Schvalovací brány – zatím neuzavřené
V autorských zdrojích zůstává `editorial_approval.json` se čtyřmi hodnotami `false`: kontrola ES/FR EXTRA, osnovy B1–C2, problematická substantiva/české glosy, integrační revize. Původních **961 položek fronty** jsou položky k přezkoumání, nikoli 961 prokázaných chyb.

**První zadání:** audituj a reportuj; **neimplementuj, nezapínej approvals, nezakládej merge a nenasazuj do produkce.**
