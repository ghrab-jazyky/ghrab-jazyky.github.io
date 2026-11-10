# R34 – samostatné Reading testové sady: EN A1–C2, téma Can Mistakes

**Stav:** AUTORSKÝ NÁVRH, bez schválení učitelem a bez publikace studentům.  
**Závislost:** R32 EN/B2 (PR #39) → R33 EN/B1 (PR #40) → R34 EN A1/A2/C1/C2 (navazující draft).  
**Úroveň:** šest samostatných CEFR variant A1, A2, B1, B2, C1, C2.  
**Věková skupina:** gymnázium, orientačně 12–19 let podle úrovně; neklasifikovat ročník pouze podle CEFR.  
**Cíl:** samostatně prověřit porozumění novému textu, příčinám, závěrům a přenosu poznatků. Žádná sada není pouhým zkrácením původní practice banky.  
**Čas:** A1/A2 15 min, B1/B2 20 min, C1/C2 25 min; odhad, nikoli ověřený normovaný čas.  
**Diferenciace:** pro slabší úrovně méně abstrakce a kratší věty, pro silnější vyšší míra inference, evaluace a transferu; zároveň zachovat skutečný původní text příslušné úrovně.

## Obsahový stav

| Úroveň | Zdrojový text | Practice otázky | Nové testové otázky | Předběžný čas |
|---|---|---:|---:|---:|
| A1 | I Can Try Again (Mia) | 9 | 10 | 15 min |
| A2 | A Small Change, a Better Result (Daniel) | 9 | 10 | 15 min |
| B1 | The Problem with Being Good at Everything (Lara) | 12 | 10 | 20 min |
| B2 | When Feedback Feels Like Failure | 18 | 10 | 20 min |
| C1 | The Hidden Cost of Constant Improvement | 21 | 10 | 25 min |
| C2 | When Resilience Becomes an Obligation | 21 | 10 | 25 min |

Každá testová úloha má své vlastní ID, zadání, čtyři odpovědi, označenou správnou možnost, písemné zdůvodnění a odkaz na podpůrný odstavec. Nově autorsky vytvořené banky A1/A2/C1/C2 mají označení `R34-AUTHOR-DRAFT-1`, nikoli tvrzení o jejich učitelském schválení. Všechny banky mají `published:false` a explicitní `DRAFT_PENDING_TEACHER_CONTENT_APPROVAL`.

## Obsahový audit – požadavek před Claude

- Zkontrolovat jednoznačnost všech **60** správných odpovědí a nesprávných možností, zvlášť případné alternativně obhajitelné odpovědi.
- Nezávisle zkontrolovat gramatiku, přirozenost vyjadřování a odpovídající CEFR obtížnost úloh, nikoli jen textů.
- Ověřit, že reference `sourceParagraph` skutečně obsahuje oporu pro správné řešení.
- Změřit významovou blízkost nových úloh ke stávajícím practice otázkám. Syntax/ID test nevylučuje kognitivně podobnou otázku.
- Ověřit použitelnost 10× MC / 20–25 min a stávající pracovní stupnice 88/74/59/44. U pouhých 10 otázek je známka citlivá na jedinou chybu (10 procentních bodů).
- Zvážit zda formát 10× MC dostatečně měří zamýšlenou dovednost, nebo pro vyšší úrovně vytvořit navíc jiné schválené typy.

## Funkčnost a bezpečnost

Testové banky se načítají jen z izolovaného QA náhledu `self-check/test-banks/reading/preview.html?level=A1&timer=15&attempt=teacherqa1` (A2 = 15, B1/B2 = 20, C1/C2 = 25). Zdrojový HTML text se ověřuje proti SHA-256 v `version.json` a validační jádro blokuje záměnu úrovně, názvu, délky testu, neschválené stavové změny a identifikátorů otázek. **Žádné studentské odkazy ani katalogové tlačítko** na tento návrh v produkční R31 neexistují.

Náhled používá lokální časovač, obnovu a přerušení z R30 a výsledek jen po odevzdání, se zpětnou vazbou pouze u chyb, dle R29. Odevzdané výsledky jsou místní, upravitelné a nejsou školním klasifikačním dokladem. Správné odpovědi ve statickém GitHub Pages **nejsou utajené**. Fyzické přijetí na Android/iOS/iPadOS/Windows musí být provedeno nezávisle.

## Pokrytí celého zadání

R34 **neznamená dokončení celého Language Skills Hubu**. Obsahuje jednu Reading kartu pouze v EN, nikoli všech 5 Reading témat ve 4 jazycích ani Listening referenční testové banky. Po technických testech bude třeba autorsky připravit a schválit další zdrojově specifické banky a odděleně řešit Listening (testové typy/počet určuje první referenční poslech). Nadále platí výchozí master addendum, stejně jako pozdější rozhodnutí R22 o ponechání Conversation v režimu procvičování.

## Akceptační brány

1. Unit testy všech 6 nezávislých EN bank, původní source hash, fail-closed a bodování.
2. Chromium + WebKit: start, timer, přesnost otázek, reload, per-level izolace, chybná odpověď, výsledky pouze po odevzdání, smazání lokálních dat.
3. Starší regresní kontrolní kontrakty R22–R31 a R32–R33.
4. Externí jazykově-didaktický audit Claude + učitelské schválení před jakýmkoliv použitím v klasifikaci.
5. **NO MERGE / NO PUBLICATION** pro stacked draft PR bez schválení.
