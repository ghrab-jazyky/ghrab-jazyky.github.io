# R33 – nezávislá Reading EN/B1 testová reference (STACKED DRAFT)

**Závislost:** R33 staví na pracovní větvi R32 / PR #39. Je to návrh jako **samostatný PR vůči R32**, ne produkční vydání. Banka **není schválená ani zveřejněná v katalogu** a nemá se nasadit, dokud nezíská pedagogické schválení i její předchůdce R32.

## Didaktické zadání

- **Téma:** `rl-can-mistakes` / EN B1: „The Problem with Being Good at Everything“ (příběh Lary), 4 odstavce.
- **Cílová úroveň:** B1; **věk/ročník:** orientačně 14–17 let (nižší a střední ročníky gymnázia).
- **Cíl:** rozlišit přesvědčení postavy od jednání, objasnit její změnu postoje a využít princip práce s chybami v nových situacích.
- **Orientační čas:** 20 minut; potvrdit empiricky v pilotní třídě.
- **Varianta pro slabší:** samostatně navržená A2 banka s kratšími otázkami a nižší abstrakcí, nikoliv stejný B1 test s pozměněným štítkem.
- **Varianta pro silnější:** samostatná EN/B2 banka navržená v R32; C1/C2 až po samostatné didaktické validaci.

## Odlišnost od procvičovacího obsahu

| Parametr | Practice B1 | Independent draft B1 |
|---|---|---|
| Počet úloh | 12 | 10 |
| Počet možných odpovědí | 3 na původní MC | 4 v nové testové sadě |
| Čtecí text | původní, 4 odstavce | stejný, neměněný text |
| Otázky | gist, scanning, detail, structure | 3 nové okruhy: porozumění, odůvodnění, přenos |
| Hodnocení | procvičovací karta | 1 bod za položku / max. 10, neověřený lokální návrh |

**Žádná otázka ani její ID se doslovně neopakuje z practice B1.** Významové přesahy u stejného zdrojového příběhu nelze vyloučit syntaktickým testem. Zvlášť úlohy o konkrétní strategii mohou částečně měřit stejné čtenářské porozumění. Vyžaduje se lidská validace.

## Jazykový a obsahový audit – první autorská revize

| ID | Funkce položky | Klíč | Opora |
|---|---|---|---|
| UND-01 | Jak Lara přemýšlela o nadání před zkušeností | C | odst. 1 |
| UND-02 | Proč byly veřejné chyby nepříjemné | B | odst. 1–2 |
| UND-03 | Proč mohou opakované krátké pokusy pomoci | D | odst. 2 |
| REA-01 | Význam upozornění, že Lara nebyla geniální hudebnice | A | odst. 3 |
| REA-02 | Posun od hodnocení talentu ke konkrétním změnám | C | odst. 3 |
| REA-03 | Praktický důvod kontroly prvního chybného kroku | A | odst. 3 |
| APP-01 | Přenos do konverzace v cizím jazyce | B | odst. 1–2 |
| APP-02 | Smysl předání zkušenosti mladšímu žákovi | D | odst. 4 |
| APP-03 | Přenos strategie na prezentaci | B | odst. 2–3 |
| APP-04 | Rozdíl mezi užitečnou strategií a zárukou rychlého výsledku | D | odst. 4 |

Rozložení klíče: **A = 2, B = 3, C = 2, D = 3**. Správné odpovědi jsou významově konzistentní s originálním textem, ale autorský audit není ekvivalentem nezávislého externího jazykového posudku ani pilotního ověření B1.

## Technická implementace

- `self-check/test-banks/reading/rl-can-mistakes/en-B1.json`: 10 nových otázek, klíč a vysvětlení, `published:false`, `DRAFT_PENDING_TEACHER_CONTENT_APPROVAL`.
- `test-bank-core.js`: společný validátor návrhů EN/B1 a EN/B2; hlídá úroveň a správný název varianty, kontrolní SHA-256 původního HTML, jedinečné ID a otázky, platnost řešení a vyvážení A/B/C/D.
- `preview.html?level=B1&timer=20&attempt=r33teacherqa`: izolovaný technický QA náhled z checkoutu pracovní větve, ne veřejná studentská aplikace; `level=B2` zachovává původní R32 náhled.
- `r33-independent-reading-b1.test.cjs`: bodování, zdrojový text, nulová změna obsahu karet, zákaz záměny úrovně, zákaz publikace.
- `r33-independent-reading-b1.browser.test.cjs`: Chromium/WebKit, B1 9/10, obnovování a čtyřrohové gesto, zobrazení jediné chybné položky, 10/10, mazání, izolace B1/B2 a selhání při neplatném zdroji.
- `.github/workflows/lsh-r33-independent-b1-stacked-pilot.yml`: CI na stacked PR; regresní R32 a produkční kontraktní R22–R31 testy.

## Přijímací kritéria

1. [ ] Všechny automatické scénáře pro B1 i B2 v Chromium a WebKitu procházejí na přesném commitu.
2. [ ] Druhý učitel ověří jazykovou úroveň B1, jednoznačnost distraktorů, oporu v textu a faktickou odlišnost od původních 12 cvičných položek.
3. [ ] Školní pilot ověří přiměřenost 10 otázek / 20 minut a vhodnost prahů 88/74/59/44; 1 chyba znamená úbytek 10 p. b.
4. [ ] Praktické ověření na fyzickém PC, telefonu Android a iPhonu/iPadu včetně rozdělené obrazovky.
5. [ ] Učitel výslovně schválí R32 EN/B2 a R33 EN/B1 před jakýmkoliv zveřejněním. **Neprovádět merge do `main` automaticky.**

**Závažné omezení:** Na čistě statickém GitHub Pages lze správné odpovědi technicky prohlédnout ve zdrojovém kódu. Nové otázky proto nejsou bezpečnou náhradou autentizovaného testování v GIT a návrhy známek nejsou ověřeným školním záznamem.
