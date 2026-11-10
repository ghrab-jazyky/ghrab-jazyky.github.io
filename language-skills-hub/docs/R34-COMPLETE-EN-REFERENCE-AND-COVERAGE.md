# R34 – šest úrovní nezávislé Reading reference a kompletní inventář 138 variant

**Stav:** pracovní stacked DRAFT nad R33 → R32 → produkční R31. Bez publikace studentům, bez aktualizace `main`.

## Didaktický rozsah
- **Téma:** Can Mistakes Help Us Learn? / `rl-can-mistakes`, angličtina.
- **Úrovně:** A1, A2, B1, B2, C1, C2, každá využívá vlastní schválený referenční čtecí text odpovídající její úrovni.
- **Ročníky/věk:** A1–A2 orientačně 12–15 let; B1–B2 14–19 let; C1–C2 vyspělí středoškoláci / 16–19 let.
- **Cíl aktivity:** nezávisle ověřit porozumění sdělení, inferenci, argumentaci (C1/C2) a aplikaci čtenářských poznatků do situací.
- **Odhad času:** pracovně 20 minut pro 10 MC otázek; potvrdit na skutečném pilotu.
- **Slabší studenti:** použij variantu s reálně nižší úrovní textu a úloh (A1/A2) a pedagogicky vhodný čas, nikoli pouze přeznačení B2; **silnější:** C1/C2 s náročnějšími implikacemi a hodnotícími závěry. Každá úroveň je vlastní obsahová realizace.

## Artefakty
- `self-check/test-banks/reading/rl-can-mistakes/en-{A1,A2,B1,B2,C1,C2}.json`: samostatné sady po 10 otázkách, vlastní ID, 4 možnosti, jedno řešení a textové zdůvodnění, vazba na podpůrný odstavec. Všechny `published:false` a `DRAFT_PENDING_TEACHER_CONTENT_APPROVAL`.
- `self-check/test-banks/reading/test-bank-core.js`: ověřuje přesnou úroveň, výchozí název čtecí karty, SHA-256 zdroje, formát otázek, vyvážení A/B/C/D a neschválený status.
- `self-check/test-banks/reading/preview.html?level=A1&timer=20&attempt=r34localpilot` – v checkoutu pracovní větve přepni `level` mezi A1/A2/B1/B2/C1/C2. Preview nepodporuje neznámé jazykové kombinace; žádný tichý fallback na procvičovací úlohy.
- `self-check/test-banks/assessment-coverage.json` – inventář veškerých **138 kombinací Reading + Listening**. Výslovně rozlišuje obsahově připravenou neschválenou banku od chybějícího zadání a neoznačuje nic jako schválené.

## Skutečný rozsah původního master zadání

| Dovednost | Témata | Jazykové varianty | CEFR | Počet variant |
|---|---:|---|---:|---:|
| Reading | 5 | EN, ES, DE, FR | 6 | 120 |
| Listening | 3 | EN | 6 | 18 |
| **Celkem** | **8** |  |  | **138** |

**Obsahově autorsky připraveno:** 6 EN variant k jediné Reading kartě. **Zatím bez nezávislé testové banky:** 132 variant. Obě skupiny nejsou schválené. Conversation nemá lokální test dle stávajícího bezpečnostního rozhodnutí R22; master doplněk v obecné rovině zmiňuje pozdější ústní režim, který vyžaduje vlastní schválenou rubriku.

Tento inventář zabraňuje vydávat technickou funkčnost aplikace za hotový pedagogický obsah. Všechny zbývající varianty se musí nejprve samostatně autorsky připravit. Automatické kopírování nebo přeskupení procvičovacích otázek by porušilo požadavek na obsahově jiné testové zadání.

## Způsob následné kontroly Claude

Po dokončení dalších obsahových sad se Claudeovi předají originální zdrojová HTML, všechny nové banky, manifest zdrojových hashů, datový inventář, testové scénáře a pedagogické auditní záznamy. U každé úlohy vyžadovat: potvrzení jednoznačné odpovědi **přímo z originálního textu či zvuku**, analýzu všech distraktorů, CEFR vhodnost, jazykovou správnost, významovou podobnost s procvičovací otázkou a riziko úniku klíče před odevzdáním. Chybné položky opravit a znovu testovat na **exact commit SHA**. Claudeův audit nenahrazuje závěrečné rozhodnutí vyučujícího.

## Akceptační podmínky
1. Všechny 6 EN bank načíst z původního podkladu s validním hash a nezaměnit úroveň.
2. Ověřit deset otázek, jejich zdůvodnění, klíč a 4 možnosti bez nejednoznačných distraktorů.
3. Otestovat lokální start, časovač, reload, přerušení, čtyřrohové odemčení, správné body a zobrazení jen chybných odpovědí v Chromium + WebKit.
4. Učitel ověří odhad 20 minut, vhodnost hranic známek 88/74/59/44 při 10 položkách a věkovou přiměřenost.
5. Fyzická UAT na Android Chrome, iOS Safari a iPadOS (včetně Split View) zůstává samostatná a nelze ji prohlásit za splněnou automatickým emulátorem.
6. Větev ani stacked PR neslučovat do `main`, dokud se nesjednotí obsah všech požadovaných variant a nenastane samostatné schválení publikace.

**Bezpečnost:** GitHub Pages je statický server. Správné odpovědi nelze utajit před žákem, který si otevře soubory; výsledky ani incidenty nejsou ověřené školní záznamy. Pro zabezpečené zkoušení patří hodnocení na backend GIT.
