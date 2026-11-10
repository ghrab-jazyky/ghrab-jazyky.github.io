# R34 – kompletní technická matrice testových variant (pracovní návrhy)

**Stav:** izolovaná vývojová větev nad PR #40 (R33) a PR #39 (R32), **nepublikovat do `main`**. Produkční R31 se nemění. Specifikace z 6. 11. 2026 stanoví obsahově odlišné režimy, ale pozdější rozhodnutí R22 výslovně vylučuje domněle zabezpečené/automaticky známkované Conversation Testy.

## Úplný rozsah katalogu

| Dovednost | Témata | Jazyky | Úrovně | Varianty | Skutečně pedagogicky schválené |
|---|---:|---|---|---:|---:|
| Reading Lab | 5 | EN/ES/DE/FR | A1–C2 | 120 | 0 |
| Listening Lab | 3 | EN | A1–C2 | 18 | 0 |
| **Celkem** | **8** | | | **138** | **0** |

Každá varianta má přesný zdrojový HTML soubor, SHA-256 odkaz na kanonickou R31, záznam v `self-check/test-banks/assessment-matrix.json` a odpovídající soubor pod `self-check/test-banks/{reading|listening}`. Testy automaticky ověřují strukturu, identitu zdroje a odmítnutí záměny.

## Pravdivá úroveň dokončení obsahu

**2 autorsky navržené sady:** Can Mistakes Help Us Learn? EN/B1 a EN/B2, po deseti originálních MC otázkách, včetně výkladu klíčů a první autorské revize. Obě stále vyžadují druhý nezávislý jazykový a didaktický posudek.

**118 čtecích strukturálních návrhů:** každá má deset technicky deterministických otázek typu „Která věta se nachází v odstavci X?“, s doslovně dohledatelnou oporou v daném schváleném textu. Byly vytvořeny mechanicky pro kontrolu architektury, **nejde o hotové obsahově nezávislé, CEFR kalibrované testy**. Jde o kostru vyžadující přepsání otázek, různorodé typy čtenářských operací a kontrolu věrohodnosti distraktorů. V náhledu u těchto 118 sad nesmí být zobrazena ani doporučovaná známka.

**18 poslechových blueprintů:** pro každý ze tří autentických zdrojů a šesti úrovní je sestaven kratší strukturovaný výběr (2 gist, 3 detail, 3 posloupnost, 1 fact a 1 open), **nikoli autorsky nová sada poslechových otázek**. Referenční texty úloh se berou z původních schválených materiálů, nikoli z kopie nahrávky. Dokončení vyžaduje samostatné poslechové otázky, kontrolu audio/video včetně copyright a ověření referenčních odpovědí. V náhledu nejsou dostupné oficiální známky ani export výsledků.

## Architektura a bezpečnostní hranice

- Učitelský redakční přehled: `self-check/test-banks/index.html` – filtrování Reading/Listening, téma, jazyk, CEFR, čas 5–120 minut a jasně označené pracovní URL.
- Reading QA: `self-check/test-banks/reading/preview.html?topic=rl-can-mistakes&lang=en&level=B2&timer=20&attempt=r34teacherqa`.
- Listening QA: `self-check/test-banks/listening/preview.html?topic=ll-harrison-ford&lang=en&level=B2&timer=20&attempt=r34teacherqa`.
- Všechny studentské QA odkazy záměrně vyžadují platný limit a neosobní identifikátor pokusu. Původní R30 jádro řeší start, běžící hodiny, lokální uložení, přerušení, gesto, auto-submit a smazání místního stavu.
- Reading/Listening data se před spuštěním **ověřují SHA-256 proti originálnímu HTML a R31 manifestu**; při chybě test nesmí naběhnout.
- QA neobsahuje registrační systém, automatické POST/telemetrii, žákovská jména, požadavky na kameru/mikrofon či tajné učitelské klíče.
- U všech 138 variant je `published:false`, `pedagogicallyApproved:false`, `studentPublic:false`. **Nepřidávat odkazy na QA do ostrého katalogu**, dokud není konkrétní varianta obsahově a technicky schválena.
- Statický GitHub Pages i izolovaná QA stránka obsahují čitelné odpovědi ve veřejném JS/JSON. Toto není náhrada bezpečně ověřovaného GIT testu.

## Regresní a přejímací scénáře

1. Inventura musí vždy obsahovat **120 Reading + 18 Listening**, bez Conversation Testu.
2. Přesné součty: 2 autorské dosud neschválené návrhy, 118 mechanických čtecích kosterních sad, 18 poslechových návrhů výběru.
3. Každá Reading varianta musí mít 10 úloh a validní odpovědi s vazbou na původní text; 10 správných → 10/10, deset chybných → 0/10. Autorské B1/B2 jsou přísněji kontrolovány.
4. Každá Listening varianta musí obsahovat 10 vybraných úloh a bez úprav původní karty projít validátorem; poslech je řízen učitelem.
5. Žádné předčasné zobrazení správných odpovědí přes UI; žádný automatický návrh známky pro 118 mechanických Reading sad ani 18 Listening výběrů.
6. Testované Chromium a WebKit musí zvládnout oba QA režimy, čas, obnovu a blokování neplatného SHA/blueprintu.
7. Rozhraní se musí testovat na fyzickém Windows/Android/iPhone/iPadu; webové automatické enginy nenahrazují skutečný hardware ani iPadOS Split View/Slide Over.
8. Schválení pedagoga se musí evidovat **pro konkrétní téma + jazyk + CEFR + verzi banky**. Oprava otázky staré schválení ruší.
9. Teprve po dodání autorských a ověřených 138 testů smí nový katalog nabídnout „Test“ vedle „Procvičování“ podle publikačního kontraktu.

## Příprava pro následný Claude audit (až po dokončení obsahu)

Budoucí nezávislý audit musí mít dvě oddělené části: **pedagogika/lingvistika** (CEFR, obsahová opora, skutečná nezávislost od practice, klíče a distraktory) a **technika** (integrita/QA, lokální stav, mobilní ovládání, žádné úniky a falešné tvrzení o zabezpečení).

**Nezaměňovat:** „120 souborů validních pro QA“ neznamená „120 připravených testů pro žáky“. Funkční doplnění architektury a hromadné mechanické návrhy jsou pouze etapa realizace před skutečným dokončením obsahových testů.
