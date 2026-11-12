# Language Skills Hub — převzetí Claude R6 do pracovní větve

**Stav:** R6 STAGING ONLY; 7. 11. 2026; `ghrab-jazyky/ghrab-jazyky.github.io`, DRAFT PR #27. Nejde o pedagogické schválení, publikaci ani výměnu kanonických HTML.

## Technicky ověřeno

- 21/21 nových souborů `zkusebni/konverzace/k/cl-*.html` nahráno do větve; každý Git blob byl po zápisu porovnán s bajtově přesným zdrojovým souborem dávky 06. Všechny kontrolní otisky souhlasily.
- 21×4×6 = **504** deklarovaných variant; 4032 konverzačních stanovišť a 12096 doplňujících otázek. Každá varianta má 8 stanovišť, každé 3 doplňující otázky, 12 slovníkových položek a 4 jazykové opory.
- 21/21 kontrol syntaxe interního JavaScriptu a správných CSP SHA-256 hashů prošlo.
- Nezávislý render v Chromium: 504 kombinací při 390 px a 504 při 1280 px; žádné neodchycené chyby JS ani horizontální přetékání. Při testu bylo HTML injektováno přes `set_content`; **externí moduly, URL parametry ani QR nebyly reálně otestovány**.
- Proti dávce 05 se změnily jen 3 HTML: Sociální média, Hraní her a Ceny nemovitostí. Ostatních 18 HTML je shodných.
- Původní Git blob SHA jednotlivých 21 kanonických HTML byly zkopírovány do manifestu R6 jako ochrana proti kolizi při pozdějším přepisování.

## Otevřené brány

1. **Jazyková revize ES/DE/FR všech úrovní** se zaměřením na nové vysvětlivky. Poslední Claudeův ZIP obsahuje pouze textový protokol, ne všechny strukturované auditní JSON reporty.
2. **Reference AI:** pracovní kandidát je upraven oproti původnímu referenčnímu zdroji; nelze jej bez rozhodnutí učitele nahradit za referenci.
3. **Katalog a runtime:** pět sdílených CSS/JS závislostí je odkazováno z každého HTML, ale nebylo součástí ZIPu dávky 06. Stávající katalog nadále používá původní cesty `konverzace/<slug>/index.html` a oddělenou AI integraci.
4. **Učitelská přejímka, nativní zařízení, externí slovník, offline, školní Wi-Fi a QR** stále neověřeno.
5. **Samostatné testy** v katalogu zůstanou `not-ready` až do schválení odlišné kratší testovací sady a hodnoticích kritérií.

## Další krok

Větvový CI test `conversation-r6-candidates.test.cjs` ověří 21 přesných zdrojů a jejich původní Git blobs. Po nezávislé jazykové/pedagogické přejímce se teprve připraví přenos do kanonických cest a synchronizace bezpečnostních kontrol. **Neprovádět merge do main ani nepřepínat katalog na tyto kandidáty automaticky.**
