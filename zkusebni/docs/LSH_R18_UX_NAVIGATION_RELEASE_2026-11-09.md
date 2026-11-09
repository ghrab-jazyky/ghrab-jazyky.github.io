# Language Skills Hub R18 – učitelská navigace a vzhled

Datum 9. 11. 2026. ČÁST 1 z dohodnutých R18–R25. R18 nezasahuje do karet ani do studentských odpovědí.

## Změny
- Horní navigace: zůstává pouze „Jak to funguje“; „Katalog aktivit“ je nadbytečný a „Můj slovníček“ vede na starší učitelsky irelevantní rozcestník.
- Vpravo nahoře: přepínač denního a nočního režimu, přizpůsobené kontrastní barvy a uložení volby v localStorage. Před vykreslením CSS se použije uložený motiv, aby nedošlo k překreslení z tmavého na světlý.
- Vpravo nahoře: tlačítko fullscreen přes standardní Fullscreen API. Escape a systémové opuštění režimu správně změní stav tlačítka; na nepodporovaných prohlížečích (typicky některé mobilní Safari) zobrazí vysvětlení.
- Testy obsahují Chromium desktop 1366px, Chromium 320px a WebKit 390px; plnou obrazovku testují deterministicky simulovaným prohlížečovým API a současně ověřují chování při chybějící podpoře.
- Původní 29 studentských HTML jsou SHA-256 shodné s ostrou R17 a katalog obsahuje 642 variant. Klasifikované testování zůstává vypnuto.

## Bezpečnostní hranice vydání
- Publikovat selektivně jen 4 soubory pod language-skills-hub: index.html, assets/hub.css, assets/hub.js a nový assets/theme-boot.js.
- Nemenit main nebo jiné školní aplikace bez úspěšné CI. Před případným selektivním vydáním porovnat skutečné SHA/commity a původní soubory.
- Neobsahuje učitelské klíče, žákovská data ani žádné přihlašování.

## Následující kroky
R19: celoplošná úvodní obrazovka a výběr tří laboratoří; R20 české názvy a lokalizace; R21 dva režimy sdílení. R22–R25 bezpečné oddělené testování Reading/Listening a školní hodnoticí stupnice. 
