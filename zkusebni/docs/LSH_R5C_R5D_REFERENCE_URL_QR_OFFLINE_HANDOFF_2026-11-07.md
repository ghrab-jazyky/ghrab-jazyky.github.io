# R5C / R5D — integrace studentských referencí, QR a offline procvičování
**Datum:** 7. 11. 2026 · **Repo:** `ghrab-jazyky/ghrab-jazyky.github.io` · **Větev:** `feat/lsh-r5-reference-pilot-catalog-2026-11-07` · **Stav:** návrh (PR #27), nikoli pedagogické schválení ani nasazení do `main`.

## Dokončené změny v tomto návrhu

1. **Tři nové integrační kopie:** `integrace/konverzace/umela-inteligence/`, `integrace/cteni/asteroids/` a `integrace/poslech/matthew-mcconaughey/`. Původní referenční HTML zůstalo beze změn a nadále slouží k porovnání.
2. **Studentská procvičovací URL:** `?practice=1` = volná varianta; `?lang=es&level=B2&zamek=1&practice=1` = pevná varianta. Katalog nikdy nenabízí jazyk/úroveň, které karta nemá. Listening podporuje pouze `en`.
3. **Pevná varianta** z URL přednastaví jazyk a/nebo CEFR a vypne přepínání v běžném studentském UI. *Není to ochrana proti manipulaci s URL nebo zdrojovým kódem*. Volná varianta zachovává studentské přepínače.
4. **Reading Lab:** z katalogu v procvičovacím režimu zapne offline slovník. Originální samostatná karta bez `practice=1` si zachovává své původní výchozí nastavení.
5. **Učitelský katalog** `reference-karty/`: výběr *Volná volba / Pevná varianta*, při pevné variantě výběr jazyka a CEFR, zobrazení přesného URL, kopírování odkazu a vykreslení/stažení identického QR (SVG).
6. **Offline výstup:** tlačítko `Stáhnout procvičovací HTML do hodiny` stáhne samostatný soubor, který si nese vybranou volnou či pevnou konfiguraci v `window.LSH_OFFLINE_QS`. Původní studentský obsah se při přípravě stahování nemění. Poslechové video z YouTube se **nepřibaluje** a bez internetu se nepřehraje. Lokální úložiště/IndexedDB v režimu `file://` mohou mít různé možnosti podle prohlížeče.
7. **Schvalovací pravidlo:** tři pilotní karty **nejsou** automaticky schváleny pro výuku a akce Testování zůstává **neaktivní**, protože kratší samostatné testové sady ani rubriky nejsou hotové.

## Zdrojová integrita

| Reference | Původní studentské SHA-256 | Zachování zdroje |
|---|---|---|
| Conversation — Umělá inteligence | `0598c67e27a126385875155310a042104c2f1fafa59cbec0884d4deef58a7813` | Pouze přidaný samostatný skript; původní zdroj zachován |
| Reading — Asteroids v2.3 | `fc667a52f5f48407aa10dea31adda836ffdc88008e206a46727e94cc9991f82b` | Pouze přidaný samostatný skript; původní zdroj zachován |
| Listening — Matthew v3 | `403022392cbd045cef72ed3554960f922f81545e5e077ad2d1fc9be2ad91a1df` | Pouze přidaný samostatný skript; původní zdroj zachován |

Zprávy z GitHub connectoru: všechny tři nové HTML měly **přesně jeden** R5 integrační skript; po jeho odnětí se text rovnal původní GitHub referenci znak po znaku. Nový automatický test `tests/reference-integrity.cjs` navíc kontroluje SHA-256 originálů, úplnost pilotního manifestu a syntaxi inline JavaScriptu a všech tří bridge skriptů.

## Dosavadní testy (nezaměňovat s fyzickou UAT)

- **Izolovaný Chromium 390 px:** pro všechny tři reference byly ověřeny pevná a volná konfigurace, jazyk/CEFR, enabled/disabled controls, žádné pozorované chyby JS a žádné celostránkové horizontální přetečení. U Reading bylo ověřeno `dictionary aria-pressed=true`.
- **Stažená HTML (test místního souboru na izolované stránce):** tři pevné varianty se správným jazykem, úrovní a lockem; Reading se slovníkem ON. Všechny 3 kontroly prošly.
- **Technické omezení testu:** izolovaný test používal pro Asteroids a Matthew původní nahrané byte-identické zdroje; pro Conversation použil znovu dodaný soubor `Umela-inteligence.html`, který **není bajtově totožný** s verzí ve školním GitHubu. Přísnější kontrola integrity zdroje GitHub je nezávislá, skutečný browser E2E pro přesně nahranou GitHub verzi před vydáním zbývá.
- **Online GitHub Pages a QR z reálného telefonu:** zatím netestováno; prostředí blokuje přímou navigaci na testovací URL. Stejně tak nebylo ověřeno fyzické iOS Safari/Android/iPadOS, zejména otevření místních HTML a místní slovník.
- **GitHub CI:** nové workflow `LSH reference integrity` má běžet na push/PR. Výsledek nutno zkontrolovat před povolením merge. Ostatní starší regresní workflow nesmí být označeny za úspěšné před jejich dokončením.

## Zůstává otevřené

1. Ověření na reálném GitHub Pages a mobilech/tabletech včetně QR, stažení souborů a offline chování.
2. Nezávislý pedagogický souhlas se všemi třemi referenčními procvičovacími verzemi; u konverzace navíc porovnat samostatnou jazykovou revizi od Clauda.
3. Vypracovat a schválit **samostatné testové sady** pro Conversation, Reading i Listening. Nepřevádět celé procvičovací sady mechanicky na test.
4. Zbývající **20 + 4 + 2 = 26** karet migrovat postupně dle `LSH_R5_ALL_CARDS_UNIFICATION_ROADMAP_2026-11-07.md`. Všechny další karty procházejí stejnými branami.

**Vydávací brána:** PR #27 ponechat jako DRAFT do úspěšného CI + cílené browser QA + pedagogické a fyzické přejímky.
