# R34 – dokončení první anglické Reading reference A1–C2 (pracovní návrhy)

**Stav:** šest obsahových návrhů EN/A1–C2 k tématu `rl-can-mistakes`; **žádná banka nebyla schválena, zveřejněna ani sloučena do produkční R31**.

## Pedagogický profil

- **Cílové úrovně:** A1, A2, B1, B2, C1, C2, každá se samostatným původním čtecím textem a samostatnými nově vytvořenými otázkami.
- **Věková skupina:** gymnázium přibližně 12–19 let. Nízké úrovně pro začátečníky, vyšší pro pokročilé.
- **Cíl:** nezávislé ověření porozumění konkrétnímu textu, vyvozování přiměřených závěrů a použití myšlenek v podobné situaci. Nevydávat A1 zadání s delším časem za B1 ani B1 za C1.
- **Čas:** pracovní návrh A1–C1 20 minut, C2 25 minut. Před rozhodnutím o skutečném použití empiricky ověřit.
- **Pro slabší žáky:** zvolit skutečnou A1/A2 banku a adekvátní čas; **pro silnější:** skutečnou C1/C2 banku, ne překlad či přeznačení té jednodušší.

## Pokrytí

| Položka | Počet |
|---|---:|
| Čtecí témata v ostrém katalogu | 5 |
| Reading varianty napříč EN/ES/DE/FR a A1–C2 | 120 |
| Listening varianty (EN a A1–C2) | 18 |
| **Celkem očekávaných samostatných Reading/Listening testových sad** | **138** |
| Autorsky navržené sady (pouze EN k `rl-can-mistakes`) | **6** |
| Chybějící samostatné sady | **132** |
| Pedagogicky schválené testové sady | **0** |

Strojově čitelná inventura: `self-check/test-banks/coverage.json` s úplným seznamem 138 kombinací, vazbou na originální zdroj a stavy `DRAFT_UNAPPROVED` / `MISSING`. Jakákoliv změna původního zdroje je důvodem k nové obsahové validaci.

## Vytvořené nezávislé sady

| Úroveň | Původní text | Nově navržené otázky | Navržený čas |
|---|---|---:|---:|
| A1 | I Can Try Again | 10 MC | 20 min |
| A2 | A Small Change, a Better Result | 10 MC | 20 min |
| B1 | The Problem with Being Good at Everything | 10 MC | 20 min |
| B2 | When Feedback Feels Like Failure | 10 MC | 20 min |
| C1 | The Hidden Cost of Constant Improvement | 10 MC | 20 min |
| C2 | When Resilience Becomes an Obligation | 10 MC | 25 min |

Sady mají vlastní ID, čtyři možnosti na otázku, explicitní `answer`, `explanation`, `sourceParagraph`, rovnoměrné rozložení klíče A/B/C/D 2–3–2–3 a tři dovednostní sekce. Neopakuje se doslovné ID ani celé zadání původní practice. **Strukturální unikátnost není zárukou didaktické nezávislosti**, zejména u omezeného počtu hlavních myšlenek každého textu.

## Technický kontrakt

- Základ je R31. R32 EN/B2 a R33 EN/B1 zůstávají otevřenými návrhy v PR #39 a #40; R34 navazuje jako další **stacked** PR.
- Studentům je poskytován pouze izolovaný **QA náhled** z pracovní větve:
  `self-check/test-banks/reading/preview.html?level=A1&timer=20&attempt=r34test01`.
  U C2 musí být `timer=25`; čas musí souhlasit s metadaty konkrétní banky.
- R34 `test-bank-core.js` kontroluje vazbu na skutečný titul odstavců v odpovídajícím CEFR, skutečný SHA-256 originálního HTML, počet otázek, vlastní identifikátory, platné správné odpovědi, evidence a stav `published:false`. Neplatný obsah musí být odmítnut před startem.
- Původní `cteni/*`, `poslech/*`, `konverzace/*`, katalog `assets/hub.js` a produkční stránka `self-check/reading/index.html` jsou **nedotčené**.
- Časovač, lokální obnova, přerušení a zobrazení pouze chybných odpovědí vycházejí ze stávajících režimů R30/R31. Správné odpovědi jsou v otevřeném zdroji JSON; nejde o bezpečnou zkoušku.

## Přejímací podmínky pro obsah

- Každá položka musí mít skutečnou oporu ve svém zdrojovém textu, jediné jednoznačně správné řešení, tři věrohodné, ale nesprávné možnosti a odpovídající rozsah jazykové obtížnosti.
- Druhý nezávislý reviewer má ověřit i sémantickou podobnost oproti původním procvičovacím otázkám; pouhé odlišné znění nestačí.
- Hodnoticí škála z produkční R31 je pracovní návrh; 10 položek znamená 10 procentních bodů za otázku. Škola musí potvrdit, zda je zvolená granularita vhodná.
- Pro fyzickou přejímku použít Windows Chrome/Edge, Android Chrome, iOS Safari a iPadOS Safari včetně Split View a Slide Over. Testy Chromium/WebKit v CI tyto fyzické kombinace **nenahrazují**.

## Další obsahové práce před závěrečným Claudovým auditem

1. Doplnit španělské, německé a francouzské **nezávislé** banky pro toto téma, šest úrovní na jazyk (18 bank).
2. Doplnit ostatní čtyři témata Reading ve čtyřech jazycích (96 bank).
3. Zpracovat referenční Listening a jeho vhodný formát úloh / hodnocení; následně další dvě poslechová témata, každé A1–C2 (18 bank celkem).
4. Dohledový režim Conversation řešit pouze po rozhodnutí o učitelské výkonové rubrice – **nepřidávat automatické známkování mluvení**.
5. Teprve po plném obsahovém pokrytí a funkčních testech sestavit jednotný balíček pro Clauda (jazykový, pedagogický, technický a bezpečnostní audit). Nesmí nahradit schválení vyučujícím.

**Publikační brána:** `DRAFT / NO MERGE` na všech stacked PR. Vydání R31 je bezpečný produkční bod návratu.
