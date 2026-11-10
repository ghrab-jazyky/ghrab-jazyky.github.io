# R35 – obecný načítací kontrakt a Asteroids EN A1–C2

**Stav:** unapproved editorial draft. Produkce `main` zůstává R31. Všechny nové banky mají `published:false`.

## Autorský obsah

Téma `rl-asteroids` má originální návrh 10 MC úloh v každé anglické úrovni A1–C2 (celkem 60). Původní čtecí texty zůstávají zachovány. Úlohy ověřují porozumění, vysvětlení souvislostí a transfer znalostí o riziku asteroidů, měření, možnostech obrany a vědecké nejistotě.

**Cílová úroveň / věk:** A1–C2, gymnázium cca 12–19 let dle jazykových schopností.  
**Cíl:** zjistit porozumění originálnímu textu příslušné úrovně a schopnost aplikovat důležité souvislosti.  
**Předběžný čas:** A1/A2 15 min, B1/B2 20 min, C1/C2 25 min.  
**Slabší žáci:** odpovídající nižší úroveň s kratším textem a otázkami (nikoli přeštítkovaná B2). **Silnější žáci:** C1/C2 s epistemickou interpretací a argumentačním transferem.

## Obecný loader

`preview.html?topic=rl-asteroids&lang=en&level=B2&timer=20&attempt=classqa123`

1. Z `data/cards.json` vybere známé Reading téma a ověří podporovaný jazyk a CEFR.
2. Původní HTML načítá podle schválené katalogové relativní cesty a skutečné bajty ověřuje SHA-256 proti `version.json`.
3. Banku hledá v `self-check/test-banks/reading/<topic>/<lang>-<level>.json`.
4. Validuje soulad topic/lang/level, sourceTitle, hash, časového limitu, ID, jedinečnosti otázek, počtu a formálního klíče. Neznámá či chybějící banka neotevře žádné studentské otázky a nespustí časovač.
5. Při existující bance používá sdílenou místní session R30 a mistakes-only výsledky R29. Správné odpovědi jsou ve veřejném statickém zdroji viditelné technicky zdatnému uživateli.
6. Nezavádí backend, telemetrii, login, proctoring nebo soukromá data. Výsledek není ověřená školní známka.

## Akceptace

- R32–R35 Node testy, source hash, CEFR source matching a odmítnutí cizí banky.
- Chromium/WebKit náhledy všech šesti úrovní Asteroids i šesti úrovní Can Mistakes, včetně obnovení a pravidel zpětné vazby.
- Coverage report musí pravdivě uvádět 120 Reading a 18 Listening variant a přesné počty vypracovaných a chybějících bank.
- Nezávislá jazyková a faktická revize všech otázek (zejména historické hodnoty a vědecká tvrzení), po níž teprve následuje schválení učitelem.
- **NO MERGE / NO PUBLICATION.** PR je navázán na R34→R33→R32. Zbývající témata/jazyky nejsou implementována a nesmí se tvářit jako schválená.

## Rozsah dosud dokončených autorských návrhů

- Reading EN `rl-can-mistakes`: A1–C2, 6 variant.
- Reading EN `rl-asteroids`: A1–C2, 6 variant.
- Ostatní Reading 108 variant a Listening 18 variant: dosud bez nezávislých schválených testových bank.
- Conversation: podle pozdějšího provozního rozhodnutí R22 bez testovacího režimu.

**Technický audit nezastupuje jazykovou ani pedagogickou validaci.** Použití pracovních bank ke skutečné klasifikaci je předčasné.
