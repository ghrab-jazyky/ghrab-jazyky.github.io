# Language Skills Hub – R25: sjednocené výsledky a závěrečná kontrola

**Verze rozhodnutí:** 9. listopadu 2026, bezpečný režim bez aplikačního serveru  
**Změnová větev:** `feat/lsh-r25-result-consistency-and-audit-2026-11-09`  
**Nasazení:** NENÍ, školní katalog zůstává na `https://ghrab-jazyky.github.io/language-skills-hub/`.

## 1. Výsledek etapy a rozsah

R25 **neaktivuje** klasifikované testování. Sjednocuje strukturu lokálního vyhodnocení u Reading (R23) a Listening (R24), zapisuje neschválenou pracovní stupnici pouze jako **dokumentační podklad** a připravuje regresní a přejímací bránu pro školu. R18–R21 v ostrém katalogu zůstávají beze změny; pilotní soubory R22–R25 jsou ve vzájemně navazujících pracovních větvích.

### Jednotná výsledková karta

Nový `self-check/results/result-core.js` je sdílená vrstva, která po jednom lokálním odevzdání standardizuje:

- **Objektivní body:** skutečně získané / skutečně dosažitelné; nezaměňuje se s počtem vyplněných otázek
- **Objektivní procento:** vypočítané přes poměr celých bodů; desetinné číslo zaokrouhlené pouze pro **zobrazení**, nikoliv pro známku
- **Dokončenost:** vyplněné / celkový počet položek, odděleně od bodování
- **Posouzení učitelem:** pro Listening počet písemných odpovědí čekajících na posouzení; i nevyplněné písemné otázky zůstávají nedořešenou součástí případného celkového hodnocení
- **Školní známka:** v obou aplikacích stále prázdná (—); `officialSchoolGrade:null`, `officialResult:false`. Reading navíc obsahuje volitelnou, automaticky nebodovanou reflexi, Listening má 84 písemných úloh napříč variantami a žádné „konečné celkové procento“.

Jazyková správnost již existujících výukových textů a obsahová správnost všech úloh nejsou dokázány pouhým úspěchem programových testů; následuje školní pedagogická přejímka.

## 2. Školní stupnice – bez prokázaného schválení

Původní zadání `Language_Skills_Hub_KOMPLETNI_ZADANI_UPRAV_R18_R25_2026-11-09.txt` v části 9 cituje `Pravidla hodnoceni_pracovní verze 2026.docx.pdf`, příloha č. 1, čl. 1, bod 24, jako **„orientační převod procentní úspěšnosti“** pro český a cizí jazyk:

| Pracovní známka | Celá procenta |
|---|---|
| 1 | 88–100 |
| 2 | 74–87 |
| 3 | 59–73 |
| 4 | 44–58 |
| 5 | 0–43 |

Tuto tabulku ani pracovní dokument nelze považovat za důkaz, že pravidla byla pro školu schválena. **Nelze bez rozhodnutí školy říci, jak klasifikovat 87,5 %, 73,5 %, 58,5 %, 43,5 % ani jak vážit písemné rekonstrukce.** Nepoužívat jinou stupnici pro ostatní předměty (90–100 / 75–89 / 50–74 / 25–49 / 0–24). Nepřidávat plusy, minusy ani svévolná pravidla.

Soubor `data/r25-grading-review.json` obsahuje pouze názornou celočíselnou tabulku se stavem `UNAPPROVED_WORKING_REFERENCE`, `enabled:false`, `schoolGradesEnabled:false`, `roundingRule:UNDECIDED` a `schoolApprovalVerified:false`. Aplikace jej nesmí používat ke známkování; sdílené výsledky neobsahují výpočet oficiální známky.

### Rozhodnutí potřebná od vedení školy před možnou klasifikací

1. Písemně určit **schválenou verzi**, účinnost a příslušnost škály pro konkrétní druh hodnocení
2. Stanovit pravidlo pro desetinné procento, hranice a způsob zaokrouhlení; např. 87,5 %
3. Schválit bodování jednotlivých druhů úloh a poměr objektivních a otevřených odpovědí
4. Stanovit, zda a jak učitel posuzuje významově přijatelné alternativy, reklamace a nedokončené odpovědi
5. Pokud by někdy mělo jít o zabezpečenou školní zkoušku: znovu otevřít otázku backendu, ověřené identity, databáze, důvěryhodných výsledků a právního rámce

## 3. Přehled technického auditu

| Kontrolovaná oblast | Závěr |
|---|---|
| 29 veřejných témat (21 Conversation, 5 Reading, 3 Listening) | Neměnit a kontrolovat proti SHA-256 soupisu |
| 642 veřejných jazykových variant | Neměnit, pravidelně ověřovat |
| R22 – bez serveru/úložiště a bez studentské identity | Zachováno |
| R23 – 5 Reading témat, 120 variant, 1 800 objektivních položek | Automatická regresní kontrola |
| R24 – 3 Listening témata, 18 variant, 251 objektivních + 84 písemných položek | Automatická regresní kontrola |
| R23/R24 – správné odpovědi v klientovi | Nevyhnutelná vlastnost statické aplikace; **nesplňuje** původní požadavek zabezpečené zkoušky |
| Tlačítko Test v Conversation / ostrém katalogu | Vypnuto; piloty nesmí být volně vydávány za klasifikované testy |
| Jazyk/CEFR podle učitele | V UI pevné, URL lze upravit; nejde o zabezpečené uzamčení |
| Studentský offline slovník/My Vocabulary v pilotu | Není přítomen; původní procvičovací karty se nemění |
| Jediné odevzdání | V aktuální instanci prohlížeče, nikoliv neobejitelně napříč relacemi |
| Přehrávání poslechu | Učitelské externí video, manuální 2 přehrání, žádný studentův přehrávač |
| Reading/Listening výsledky | Stejné body, procenta, dokončenost a značení školní známky |
| Otevřené odpovědi | Bez automatické klasifikace; lidské posouzení nutné |
| Výsledky a osobní údaje | Neodesílají se studentova jména, odpovědi ani výsledek; běží pouze same-origin GET původního veřejného obsahu |
| Přenos správných řešení spolužákům | Bez backendu nelze zabránit; nutné didaktické opatření |
| Synchronizované zobrazení odpovědí celé třídě | Bez backendu nelze garantovat |
| Školní stupnice a známky | **NO-GO** do prokazatelného schválení a rozhodnutí o bezpečnosti |

## 4. Automatizované testy a manuální přejímka

Spustit nový `.github/workflows/lsh-r25-final-audit.yml`:
- `r22-static-policy.test.cjs`, `r23-reading-selfcheck.test.cjs`, `r24-listening-selfcheck.test.cjs`, `r25-result-contract.test.cjs`
- Chromium a WebKit: skutečné R23, R24 a R25 prohlížečové scénáře desktop/mobil, opravy chyb, oddělené výsledky a zákaz školní známky
- CI výsledek doložit konkrétním GitHub Actions během; uvedení **PASS** je podmíněno skutečným úspěchem po posledním commitu

### Zbývající stop-podmínky (před publikací pilotu)

- [ ] Školou schválená metodika využití jako **neklasifikované ověřování znalostí** (žáci nesmějí chápat jako zabezpečený test)
- [ ] Pedagogický audit jednotlivých typů úloh, rozumného času a srozumitelnosti výsledků
- [ ] Ruční kontrola studentského UX na skutečných zařízeních (Windows/Android/iPad/iPhone)
- [ ] Ověření přehrání všech tří externích zdrojů videa ve skutečné školní síti; Facebook/X může být omezen
- [ ] Promyslet strategii odhalení správných odpovědí po odevzdání pro souběžně píšící třídu
- [ ] Rozhodnout výslovně o uvolnění či dalším ponechání pilotních stránek odděleně od katalogu
- [ ] Schválení finální školy hodnoticí stupnice, pravidla pro desetinná procenta a váhy písemných úloh; **do té doby žádné automatické školní známky**

## 5. Doporučené pořadí bezpečné publikace

Neprovádět automatický merge na `main` jen na základě úspěchu CI. Návrhy jsou navázané takto:

1. R22 static-only PR #29
2. R23 Reading PR #30
3. R24 Listening PR #31
4. R25 sjednocení výsledků, stupnice a audit (aktuální PR)

Po skutečné přejímce a povolení neklasifikovaných pilotů může správce rozhodnout o odděleném zveřejnění/testování. Změny v `main` a URL katalogu musí projít kontrolou nasazení, regresí 29 původních karet a rozhodnutím o přidání tlačítka *Ověřit znalosti*. Pro klasifikované zkoušky platí **NO-GO**.

**Veřejný katalog:** https://ghrab-jazyky.github.io/language-skills-hub/
