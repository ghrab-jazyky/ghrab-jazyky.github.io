# RL-PDF-01 + RL-02 — vydávací kontrola Asteroids
Historický checklist ze dne 2026-11-19. **Aktualizace 2026-11-21:** PR #126 byl 2026-11-19 sloučen do `main`; funkce se tak dostala do distribuované statické větve. Původní označení „draft / neprodukční“ již není platným popisem stavu. Následující kroky jsou přejímací požadavky, nikoli doložený záznam, že byly všechny ručně splněny.

Aktuální nápravná větev: `feature/lsh-asteroids-pdf-hardening-20261120` (bez automatického nasazení). Než bude možné změny začlenit, musí projít nová PDF release gate, kontrola všech 96 přegenerovaných souborů, fyzická přejímka a rozhodnutí o autorských právech.

## Architektura
- Statické LSH na GitHub Pages; žádný server a žádné nové přihlašování.
- Dvě varianty PDF: pouze text / text a všechna cvičení, výuková i testová verze; exportní ovládání je v učitelském panelu.
- 4 jazyky × 6 úrovní × 2 režimy × 2 exporty = 96 předgenerovaných PDF; školní logo a sazba A4, jazykové dělení slov; tiskový náhled jako záloha.
- RL-02: tři barvy zvýraznění, podtržení, poznámka, editace/smazání, lokální ukládání, běžná karta i test; anotace nejsou hodnoceny.
- Obsah karty je neměnný. Soubor Asteroids přidává jen přesně určené externí skripty/styl; `tests/reading-content-integrity.cjs` před kontrolou původních hashů ignoruje **pouze** tyto známé vložené odkazy. Jiná změna zdroje musí vyvolat FAIL.

## Automatická regresní brána (před nasazením vše PASS)
1. R22–R27: statická politika, neměnné otázky a výsledky, žádné klasifikované známky
2. R44: 120 variant a navigace k důkazům v textu
3. R56: 120 variant QR v lokálních prohlížečích; veřejný QR test spouštět až po nasazení na main a zpřístupnění testů
4. R58: shoda testových záložek s původním členěním
5. R62–R63: zámky, gesta, report a zabezpečený test
6. RL-PDF-01/RL-02: osm lokálních prohlížečových scénářů, PDF/test/poznámky
7. 96 PDF: kontrola hlaviček, délek a SHA-256; vizuální revize reprezentativních A4 podle všech jazyků

## Ruční přejímka na fyzických zařízeních
Účet ani připojení ke školnímu serveru nejsou potřeba. Testovat na stejné vývojové sestavě po zpřístupnění náhledu; nevykonávat v produkci bez souhlasu vlastníka.

- PC (Chrome, Edge): běžná karta, označit 3–8 slov myší, 3 barvy, podtržení, poznámka k textu a otázce, úprava a smazání. Změnit záložku, úroveň a jazyk; obnovit stránku. Očekávání: poznámka se vrátí k odpovídající variantě, odpovědi se nezmění.
- iPad (aktuální Safari): dlouhým podržením vybrat text a část otázky, označit/podtrhnout, přidat poznámku. Běžný posun a výběr odpovědí musí fungovat bez nechtěného klikání na slovník.
- Android telefon (Chrome): totéž na úzké obrazovce, bez vodorovného přetečení a překryvu ovládání.
- Zabezpečený test: vytvořit jednu odpověď a jednu anotaci, ověřit stejné body bez anotace. Odejít z obrazovky a vrátit se; test se uzamkne. Po učitelském gestu se anotace i odpověď zachovají. Při zamčení nelze anotace upravovat.
- iPad test: dlouhé podržení v textu v aktivním anotačním režimu nesmí způsobit falešné uzamčení; skutečné opuštění, split screen/Slide Over a nepovolená nabídka musí spouštět existující ochrany v rozsahu, který browser umožňuje.
- Tisk: na učitelském počítači stáhnout oba PDF formáty pro B2 v běžné i testové variantě. Ověřit logo školy, přirozené zalomení, odstavce, české/španělské/německé/francouzské znaky, čísla stran, zdroj; testové PDF nesmí obsahovat klíč ani odkrytý vynechaný text.
- Student: nikde ve své kartě nesmí mít ovládací prvky PDF exportu.
- Ochrana: zamknutí a odemknutí testu nesmí resetovat bodování ani anotace; výsledek musí stále ignorovat všechny poznámky.

## Nevydat, pokud
- Kterákoli relevantní regresní kontrola FAIL
- Na skutečném iPadu či telefonu je nemožné přirozeně vybrat text/otázku
- Učitel vidí v PDF nesprávně rozdělené věty, chyby v diakritice, nečitelný tisk nebo chybějící logo
- Studentova anotace ovlivňuje automaticky vypočtené skóre
- Převzatý materiál nemá vyjasněné oprávnění k požadovanému tisku a redistribuci

## Rozhodnutí
Původní PR #126 byl sloučen 19. 11. 2026; předchozí závěrečná formulace byla zastaralá. Nápravná sada je ve vývojové větvi a nesmí být automaticky sloučena. Automatický PASS **nenahrazuje** ruční přejímku na iPadu/Androidu a školní tiskárně ani doložené rozhodnutí o původu a redistribuci inspirativního materiálu British Council. Přímé adresy PDF jsou veřejné; vlastník toto riziko pro serverless LSH výslovně přijal. Rozšíření na ostatní karty až po schválení vlastníka.
