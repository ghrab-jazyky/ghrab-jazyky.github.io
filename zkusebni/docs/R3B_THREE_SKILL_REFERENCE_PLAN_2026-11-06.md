# Language Skills Hub — R3B · tři katalogy a jedna reference v každé dovednosti

Datum: 6. listopadu 2026. Stav: **kandidát, bez publikace nových studentských karet**.

## Zadání

Nejprve zaevidovat co nejúplnější dostupný obsah ve třech kategoriích. V každé vybrat jeden referenční vzor, ten doladit ve všech požadovaných variantách a teprve po schválení sjednotit zbývající karty stejné dovednosti. Konverzace, čtení a poslech zůstávají **samostatné typy výukových aktivit**; společný bude výběr a sdílení.

Tento krok realizuje pouze **veřejně bezpečnou evidenci názvů**. Starší rozpracovaná studentská HTML a učitelské klíče do GitHub Pages **nepatří**, dokud nebyly ověřeny a schváleny.

## 1. Conversation Lab · mluvení

V aktivním technickém katalogu je 21 reálných samostatných konverzačních témat, 4 jazyky (EN/ES/DE/FR) × 6 úrovní (A1–C2); nejsou tím automaticky pedagogicky schváleny. Téma *Human Rights* je zaevidováno jako plánované a v aktivním manifestu zatím není.

**Referenční kandidát: Rodina** (již v existujícím katalogu). Před schválením ověřit:
- 24/24 jazykově-úrovňových variant, kvalitu formulací a výslovně definovaný CEFR standard;
- použitelný offline slovník, uložení slovíček do společného slovníčku, chování bez připojení;
- všechny ovládací prvky, jazykové mutace, přístupnost, tablet/mobile a odkaz/QR;
- striktní regresní test proti 20 ostatním již integrovaným kartám.

Po schválení reference z ní vytvořit **vývojový standard**, nikoliv zkopírovat texty nebo otázky do ostatních témat. Obsah a cílové úrovně každé karty zůstávají individuální.

## 2. Reading Lab · čtení

Pouze veřejné názvy, bez studentských odkazů:
- *Can Mistakes Help Us Learn?* v4.3 — referenční kandidát, původní soubor dříve auditován; aktuálně nedostupný, chybí nezávislé pedagogické posouzení master v3.4;
- *Plastic Ocean — Film Review* v2 — návazná karta, dřívější audit, zdroj obnovit;
- *Asteroids* — dohledat původní patch_nav.py a originální kartu;
- *Email to a Friend* — ve fázi zadání;
- *Instant Messages* — ve fázi plánování.

Referenční karta musí mít samostatný HTML soubor, 4 jazyky × 6 úrovní (24/24), slovníček a vypnutí/zapnutí slovníku, číslované odstavce, obousměrnou navigaci text ↔ otázka, pedagogicky ověřený klíč a bezchybný mobilní/offline provoz. Nesmí dojít ke ztrátě dat původního `reading-lab-vocabulary`.

Předchozí QA v3.4 požadovala 80 nezávislých případů a 528 odpovědí. V posledním doloženém stavu bylo **0/80 a 0/528** skutečných výsledků. Testovací scénář v GitHub Actions tuto skutečnost nenahrazuje.

## 3. Listening Lab · poslech

Byly dohledány a jako archivy ověřeny následující skutečné ZIPy; obsahují studentský HTML, oddělený učitelský klíč a protokol. ZIP archivy ani klíče nebyly nahrány do veřejného repozitáře:

| Kandidát | Zdroj | Dřívější verze | Stav |
| --- | --- | --- | --- |
| **Matthew McConaughey — Oscars 2014** | soukromý kompletní ZIP, oficiální YouTube (dostupnost před hodinou ověřit) | v1 | **referenční kandidát** |
| Harrison Ford — Life Achievement Speech | soukromý kompletní ZIP, video externě (Facebook/X) | v6 | potřebuje integrační QA a kontrolu dostupnosti zdroje |
| Peaky Blinders — No Fighting | soukromý kompletní ZIP, externí video | v2 | potřebuje QA, věkové omezení kvůli vulgarismům a dalším narážkám |

*Matthew McConaughey* je navržen jako reference: celá A1–C2 škála, srozumitelný ústřední zdroj a dostupnější školní scénář než sociální síť nebo obsah s vulgarismy. Jde o kandidáta, nikoliv učitelem potvrzenou referenci.

Ověřit zejména dostupnost **toho samého** videa, střih a časové body, aby se úlohy vztahovaly ke skutečně přehrávanému obsahu. Provést testy všech úrovní, úloh a odpovědního klíče, přehlednost ovládání, chyby během přehrávání, Android/iOS/iPad a odolnost vůči blokovanému iframe. A1/A2 označují náročnost úloh, nikoliv automaticky úroveň autentické nahrávky.

## Technická realizace

- `zkusebni/data/editorial-inventory.json` — veřejně bezpečná evidence pouze názvů, stavů a referenčních kandidátů, **nezávislá** na manifestu studentského katalogu.
- `zkusebni/assets/lsh/v3/inventory.js` a `inventory.css` — informativní sekce v každé kategorii. **Neexistuje** pro ně tlačítko „Sdílet studentům“, QR ani krátký kód.
- `zkusebni/data/manifest.json` zůstává nedotčen; reálně schválené výukové karty budeme přidávat teprve samostatným bezpečně schváleným PR.
- GitHub-only pilot zůstává veřejným statickým webem: přehled témat není bezpečně uzamčený učitelský účet.

## Podmínky dokončení

1. Dokončené zelené CI (Node + Chromium/WebKit) pro R3B v samostatné větvi, bez regresí.
2. Referenční kandidáti a katalogové názvy zkontrolovány vlastníkem projektu.
3. Návrh PR R3B je **závislý** na R3A a nesmí být sloučen do `main` před úspěšnou R3A.
4. Žádné soukromé HTML, učitelský klíč, výsledky hodnotitelů ani nezveřejněné osobní údaje na veřejný GitHub.
5. Samostatná integrační etapa pro každou referenční kartu včetně skutečného pedagogického schválení a zařízení.

**Zásada:** katalog nejprve, pak reference, potom ostatní karty. Úspěch CI není pedagogické schválení ani hotové otestování fyzických zařízení.
