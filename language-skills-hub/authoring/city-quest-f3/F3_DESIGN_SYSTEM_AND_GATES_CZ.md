# City Quest – F3 Prémiový design: specifikace a přejímka F3A
**Datum:** 21. 11. 2026 • **Repozitář:** ghrab-jazyky/ghrab-jazyky.github.io
**Základ:** F2.1E, commit `279c5e16cc93b951e11e5b7df2b158da10dcf7e9`

## Zaměření celé F3
Hlavní plán F0 → F1 → F2 → **F3** → F4 → F5 se nemění. F2.1A–E byly doplňující vývojové podetapy. F3 je samostatná fáze prémiového designu, **nikoli automaticky vydání do produkce**.

| Podetapa | Obsah | Přejímka |
| --- | --- | --- |
| **F3A** | Sjednocené materiály a tokeny město/metro, jemná animace, prezentační režim, zvýšení kontrastu, vypnutí animací, volitelné lokální zvuky, klávesnicové ovládání | Automatické regresní testy + vizuální přejímka |
| **F3B** | Výtvarně propracované přestupy, scénické přechody a pedagogicky smysluplné offline audio (např. názvy zastávek/hlášení, pokud budou právně a jazykově správná) | Samostatný akustický/vizuální návrh bez síťových volání |
| **F3C** | Mobilní a prezentační jemné ladění, čitelnost mapy metra, WCAG/screen-reader reálných zařízení | Testy na fyzickém iOS/Android, touch a orientace |
| **F3D** | Přejímka učitelem, jazyková korektura a uzavření designu před F4 | Výslovné schválení vlastníkem produktu |

## Co je implementováno ve F3A
1. **Vizuální systém:** střední kontrast tmavé základny, jemné akcenty aqua/mint, čisté zvýraznění vybrané mise, společný vzhled mapových panelů a stavu úkolů; světlé téma zůstává.
2. **Prezentace:** v nabídce Experience volba *Presentation mode*. Bez Fullscreen API: rozšíření obsahu, skrytí dekorací a průvodce, zhuštění horních ovladačů, větší herní plocha. Odchod viditelným tlačítkem nebo Esc; postup hry zůstává beze změny.
3. **Pohyb:** jemné časově omezené reakce na změnu mise a feedback; přepínač animací, který respektuje systémové `prefers-reduced-motion`. Nepodstatné animace nikdy nesmějí být nutné ke splnění úkolu.
4. **Zvukové signály:** **vypnuto ve výchozím stavu**. Po výslovném zapnutí přehrává webový prohlížeč krátké, tiché originální tóny pomocí lokálního Web Audio při úspěchu/chybě/dokončení. **Nejde o nahrávky hlasu ani jazykové audio**, to zůstává návrhem F3B.
5. **Přístupnost:** klávesnicový odkaz *Přejít k misím*, zřetelné focus kroužky, přepínatelný vyšší kontrast, zachování všech nativních ovladačů.
6. **Soukromí a provoz:** žádný server, CDN, síťové API, žádný mikrofon, žádná analýza řeči, žádné trvalé ukládání nastavení či osobních údajů; funguje samostatný HTML soubor s hashovanou CSP (`connect-src 'none'`).

## Pedagogické parametry
- **Úroveň:** angličtina, španělština, němčina, francouzština A1–C2; hratelné metro B1–C2.
- **Cílová skupina:** gymnázium, přibližně 12–19 let.
- **Cíl aktivity:** číst mapu, správně navigovat a jazykově vysvětlit trasu, výluku a přestup.
- **Čas:** orientačně 5–12 minut na stanici; 3–4 stanice na 45 minut.
- **Slabší žáci:** glosáře, krátké směrové kroky, odhalitelný model až v sebereflexi.
- **Silnější žáci:** zdůvodnění zvolené trasy, porovnání variant, důsledky výluk, formální/neformální registr podle úrovně.

## Otevřené brány a omezení
- **F3A PASS** vyžaduje úspěšné testy na **aktuálním SHA** včetně F2.1E regresí. Technický PASS nezakládá právo na merge.
- **Praktická přejímka:** vyzkoušet 320/390px telefon, tablet a desktop/projektor; zobrazení přes okraje, čitelnost koncových stanic a dotykové ovládání na skutečných zařízeních.
- **Zásadní pedagogická výhrada:** vysoké úrovně C1/C2 a modelové odpovědi potřebují odbornou korekturu. Syntetické audio signály tuto otázku neřeší.
- **Závěrečná F4:** vyžaduje nezávislý kompletní předprodukční audit a schválení před F5.

## Kontrolní scénáře pro vlastníka produktu
Otevřít exportovaný HTML lokálně, zvolit jazyk a úroveň, vyzkoušet městskou misi 02, metro 05 a smíšenou 08. V nabídce **Experience** zapnout **Presentation mode** a ukončit **Esc**. Poté vyzkoušet vyšší kontrast, zvuk (dobrovolně), vypnutí pohybu a přepnutí světlého/tmavého režimu. Na telefonu ověřit jedinou sadu navigačních šipek při pěší misi a ovládání metra umístěné bezprostředně u mapy.
