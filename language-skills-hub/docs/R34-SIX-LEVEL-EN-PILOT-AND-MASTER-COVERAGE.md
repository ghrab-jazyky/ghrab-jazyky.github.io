# R34 – Reading Can Mistakes, šest EN úrovní (obsahové návrhy)

## Stav

**Stacked draft nad R33 → R32 → R31.** Žádná změna `main`, žádné nové studentské odkazy v učitelském katalogu. Všech šest sad je `DRAFT_PENDING_TEACHER_CONTENT_APPROVAL` a `published:false`. Učitelské kontroly Claudem a fyzická UAT proběhnou až po dokončení ostatních obsahových sad; automatický PASS není pedagogické schválení.

## Výukové použití

- **Cílové úrovně:** EN A1, A2, B1, B2, C1, C2, každá samostatný čtecí text původní karty.
- **Věk a ročníky:** přibližně 12–19 let, podle úrovně jazykového výkonu, nikoli pevně podle ročníku.
- **Cíl:** ověřit porozumění výchozímu textu jinými úlohami než ve veřejném procvičování. A1/A2 – význam, změny a jednoduchý přenos; B1/B2 – příčiny, postoj, argumentace; C1/C2 – kvalifikace tvrzení, instituce, měření, cíle.
- **Orientační čas:** 20 minut / deset otázek; před ostrým použitím je nutná empirická kalibrace náročnosti.
- **Slabší žáci:** zvolit skutečně nižší CEFR, delší přiměřený čas po pilotu; **nepřejmenovávat B2 na B1**.
- **Silnější žáci:** samostatné C1/C2 otázky s vyšší náročností argumentační interpretace.
- **Bodování:** 10 samostatných MC položek, každá 0/1; celkem 10. Výsledek v prohlížeči je pouze neověřený návrh klasifikace podle stávajících hranic 88/74/59/44. Desetibodová stupnice je hrubá; před použitím se známkou zkontrolovat její vhodnost.

## Rozsah

| Úroveň | Původní text | Návrh nezávislé banky | Auditní status |
|---|---|---|---|
| A1 | I Can Try Again | 10 nových MC | R34, čeká na vnější kontrolu |
| A2 | A Small Change, a Better Result | 10 nových MC | R34, čeká na vnější kontrolu |
| B1 | The Problem with Being Good at Everything | 10 nových MC | R33, čeká na vnější kontrolu |
| B2 | When Feedback Feels Like Failure | 10 nových MC | R32, čeká na vnější kontrolu |
| C1 | The Hidden Cost of Constant Improvement | 10 nových MC | R34, čeká na vnější kontrolu |
| C2 | When Resilience Becomes an Obligation | 10 nových MC | R34, čeká na vnější kontrolu |

Všechny soubory jsou v `self-check/test-banks/reading/rl-can-mistakes/en-<LEVEL>.json`. Obsahují unikátní ID, zdrojový odstavec, čtyři odpovědi, jedno správné řešení a vysvětlení. Současná implementace nepředstírá, že didaktická kvalita prošla druhým pedagogem. Klíč je u každého testu rovnoměrně rozložen A/B/C/D = 2/3/2/3.

**Důležitá poznámka k obsahové nezávislosti:** otázky nejsou doslovnými kopiemi procvičovacích otázek. Jelikož měří porozumění témuž textu, některé významové oblasti se nutně překrývají. Před použitím je nutné ověřit, zda případný překryv neumožňuje pouze memorování cvičných odpovědí.

## Technická přejímka

- `test-bank-core.js`: úroveň A1–C2 je přesně spárovaná s názvem textu, typem sady, auditní revizí a zdrojovým SHA-256; validace neumožňuje záměnu.
- `preview.html?level=<LEVEL>&timer=20&attempt=<ID>`: pracovní, nezveřejněný návrh; bez přihlašování; lokální časovač, obnova a zobrazení oprav až po odevzdání.
- `r32-independent-reading-pilot.test.cjs`, `r33-independent-reading-b1.test.cjs`, `r34-six-level-en.test.cjs`: kontraktní testy validace všech šesti sad.
- `r32-independent-reading.browser.test.cjs`, `r33-independent-reading-b1.browser.test.cjs`, `r34-six-level-en.browser.test.cjs`: Chromium + WebKit, chybná odpověď, správné řešení, odmítnutí záměny, zachování výsledku a veřejné odpovědi až po odevzdání.
- Původních 29 procvičovacích karet a manifest R31 se v této etapě **nemění**.

## Co stále chybí pro úplné master zadání

Katalog má 5 Reading témat × 4 jazyky × 6 CEFR = **120 čtecích variant** a 3 Listening témata × 6 CEFR = **18 poslechových variant**. Opravdu samostatné testové banky existují po R34 pouze pro **6 EN variant jednoho Reading tématu**; pro **114 ostatních Reading variant a 18 Listening variant** ještě nezávislé testové otázky nebyly vytvořeny a obsahově prověřeny.

Rozcestník má nyní lokální generátor testů Reading/Listening nad procvičovacím obsahem; ten nesmí být bez schválení vydáván za obsahově nezávislý test. Vyřešení této mezery je samostatný obsahový a integrační projekt, nikoliv přepsání položek automatickou mechanickou parafrází.

Po dokončení všech obsahů a integračních testů následuje **Claude review**: každá jednotlivá otázka, jednoznačnost klíče, opora ve zdroji, úroveň CEFR, funkčnost na PC/tabletu/mobilu, GDPR a jasné rozlišení návrhu známky od oficiální klasifikace.

**Zákaz publikace:** nezahrnovat testové banky do běžného GitHub Pages nasazení před schválením a regresní kontrolou. Statická aplikace nijak neskrývá správné odpovědi před znalým žákem.
