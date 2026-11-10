# R31 – uchování učitelského hodnocení a export lokálního výsledku

Stav: pracovní implementace (PR); nezávislé prohlížečové testy musí projít před nasazením.

## Výukové použití
- **Cílová úroveň:** Reading EN/ES/DE/FR A1–C2; Listening EN A1–C2.
- **Ročníky / věk:** gymnázium, přibližně 12–19 let.
- **Cíl:** průkaznější pedagogická zpětná vazba, neztratit rozpracované místní učitelské hodnocení písemných odpovědí, mít jednoduchý souhrn bodů pro učitele.
- **Čas:** v návaznosti na R30 nastavuje učitel 5–120 minut; samotná kontrola písemných odpovědí běží po odevzdání mimo časový limit.
- **Slabší žáci:** nižší CEFR, delší čas, citlivé hodnocení významové správnosti písemných odpovědí; silnější: vyšší CEFR, vyšší nároky na důkaz/argumentaci v rámci stávajících úloh.

## Funkce
1. **Listening:** učitel hodnotí každou písemnou odpověď 0 nebo 1 bodem až po odevzdání. Průběžné známky 0/1/neposouzeno se v časovaném režimu ukládají do stejné místní relace R30 jako žákovy odpovědi. Po obnovení otevřeného odkazu se znovu načtou, stejně jako původní deadline a podoba odpovědí.
2. **Zpětná kompatibilita:** staré uložené pokusy R30 bez pole `reviewMarks` zůstávají čitelné. U původních nečasovaných odkazů není lokální obnova odpovědí zaručena; neslibovat ji v uživatelském textu.
3. **Výsledkový CSV export:** Reading umožňuje stažení po odevzdání; Listening až po posouzení **všech** písemných odpovědí. Při zrušení jediného hodnocení export znovu znepřístupníme a návrh celkové známky skryjeme.
4. CSV obsahuje pouze: technický typ nepotvrzeného výsledku, Reading/Listening, název tématu (ID), jazyk, úroveň CEFR, objektivní body, ručně přidělené body 0/1, celkový počet bodů, procenta, návrh známky, počet nehodnocených úloh, datum odevzdání (pokud bylo uložené), počet místních přerušení. **Neobsahuje jméno, e-mail, osobní identifikátor, studentský text, reflexi, otázky, adresu odkazu ani identifikátor místní relace.**
5. Výstup je text CSV v kódování UTF-8 se značkou BOM; soubor se generuje v prohlížeči, bez API, serveru, Google Sheets nebo Bakalářů.

## Omezení a bezpečnost
- Soubor je **místně upravitelný**. Výsledek ani CSV nejsou důkazem identity či pravosti, školním záznamem ani zabezpečenou klasifikací. Učitel musí výsledek ověřit vlastním procesem. Pracovní klasifikační stupnice R28 (88/74/59/44 %) zůstává nezměněná.
- `localStorage` není šifrovaný trezor a klient je manipulovatelný. Přidělené známky 0/1 může upravit i žák, pokud má přístup ke stejnému zařízení. Soubory neobsahují jména, ale i souhrn hodnocení je **citlivá školní informace**. Nepropojovat jej s identitou žáka ve veřejném úložišti. Při předání doporučujeme anonymizaci.
- Po školní přejímce lze lokální pokus smazat již zavedenou funkcí R30. Smazání v aplikaci neodstraní již stažené CSV soubory.
- CSV se nemá automaticky importovat do klasifikace. Přenášet údaje pouze po vědomém ověření a v souladu s pravidly školy a zásadami GDPR.

## Testy a nasazení
- Unit/regrese: R22–R31, včetně zpětného načtení snapshotu R30 a odmítnutí chybných bodů.
- Prohlížeče: Chromium a WebKit. Listening neúplné → doplnit známky → reload → stejná celková známka → export CSV → změnit bod na nehodnoceno → export opět zakázán. Reading EN/ES export bez textu otevřené reflexe.
- Produkční brána: všechny testy na přesném SHA, bez chyb JavaScriptu a bez POST/telemetrie. Potom sloučit a ověřit GitHub Pages HTTPS a původních 29 karet.
- **Následující R32:** samostatné pedagogicky navržené testové sady, jejichž zadání a správné odpovědi se liší od procvičovacích verzí. Nezaměňovat pouhé časování či výběr otázek se skutečně nezávislým testem.
