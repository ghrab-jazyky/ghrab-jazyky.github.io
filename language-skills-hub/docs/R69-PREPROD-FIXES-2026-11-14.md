# R69 Conlangs — předprodukční opravy a release gate

**Stav: PREPROD / NO DEPLOY**, 14. 11. 2026. Toto není potvrzení produkčního nasazení.

## Co bylo opraveno

1. PR #105 byl znovu založen na aktuálním `main` po sloučení R64 (#103), se zachováním schválených jazykových a bezpečnostních oprav původních karet.
2. Procvičování a test Conlangs nyní používají dvě oddělené sady po 102 položkách. Procvičovací klíč a zpětná vazba používají svou vlastní banku; testovací klíč zůstává navázaný na testovou banku.
3. T/F/NOT STATED má v každé z úrovní A1–C2 samostatné pořadí se zachováním přesně dvou položek každé kategorie; klíče a zdrojová data jsou synchronizované.
4. Opraven nejednoznačný výrok A1 a odstraněna nepravdivá přesná časová značka `00:00–05:05`. Nyní se uvádějí pouze tematické odkazy na obsah přepisu s upozorněním, že přesný zvukový čas nebyl nezávisle ověřen.
5. Statické regresní testy ověřují oddělení obou bank, správné vyhodnocování, jedinečné odpovědní vzorce, synchronizaci učitelských klíčů, otisky obsahu a původní R68/R64.

## Předprodukční evidence

- Integrační workflow úspěšně provedl kontrolovaný merge R64 do R69 a potvrdil 164/164 statických testů PASS.
- **Tento dokument mění předprodukční větev záměrně tak, aby se znovu spustily všechny povinné GitHub Actions nad finální kombinací R64 + R69.**
- Žádný výsledek z předchozího R69 commitu se nepovažuje za certifikaci nové sestavy.

## Stále otevřeno před produkcí

- Nezávisle porovnat všech 204 nyní publikovaných položek (102 test + 102 practice) s původní nahrávkou; zkontrolovat zejména všechny NOT STATED, poslechovou oporu a úrovně A1/A2.
- Ověřit zdroj zvuku a všechny funkce na reálném školním iPadu v Safari, včetně zamykání/odemčení a exportů.
- Přezkoumat celý Chromium/WebKit CI nad nejnovějším HEAD; žádné povinné FAIL ani SKIP.
- Potvrdit, že veřejné zdrojové kódy nejsou vhodné k utajení klíčů ani k nefalšovatelnému klasifikovanému testu. Samostatné otázky v practice a test jsou pedagogickým opatřením, nikoli kryptografickým zabezpečením.
- Před nasazením nahradit PREPROD označení schválenou produkční verzí. Produkční merge provést teprve na výslovný pokyn vlastníka.

## Odkazy

- [Předprodukční PR #105](https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/pull/105)
- [Původní poslech TED-Ed](https://ed.ted.com/lessons/are-elvish-klingon-dothraki-and-na-vi-real-languages-john-mcwhorter)
