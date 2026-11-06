# Language Skills Hub — R3A: integrační připravenost Reading/Listening (GitHub-only)

Datum: 6. 11. 2026. Status: **TECHNICKÝ KANDIDÁT**. Žádné pedagogické schválení ani vydání nových karet.

## Co se mění

- Všechny katalogy používají `CORE.selectCatalogTopics`: veřejný sjednocený výběr zobrazuje pouze aktuální Conversation pilot a publikované Reading/Listening karty.
- Individuální čtecí katalog zobrazuje **jediné fiktivní demo Niva jen do doby, než existuje první publikovaná skutečná Reading karta**. Poté demo v nabídce zmizí (jeho původní testovací soubor se tím nemaže).
- Rozcestník i stránky čtení, poslechu a jednotného výběru odvozují text o dostupnosti z **jediného validovaného manifestu**. Historický statický text je fallback do načtení JS.
- Krátké kódy a lokální QR čtečka odmítají skutečné Reading/Listening položky ve stavu `ROZPRACOVANO`, `ZKONTROLOVANO` a `STAZENO`. Jedinou testovací výjimkou je výslovně fiktivní čtecí demo ve staging manifestu.
- Statický test odmítne jakýkoli nový adresář veřejné Reading/Listening HTML karty, pokud v manifestu není řádně publikovaná položka. Brání tak nejběžnější nechtěné publikaci draftů.
- Samostatný guard hlídá i **starší veřejný kořenový web**: ve složkách `/cteni/` a `/poslech/` se nesmí nechtěně objevit nový skutečný obsah ani v kořenovém manifestu. Kořenový historický Niva demo je výslovně ponechán a není považován za schválenou kartu.
- Browser test používá **pouze syntetickou příští schválenou kartu vloženou do odpovědi manifestu v paměti**. Skutečný studentský text ani správné odpovědi se nenahrávají na GitHub.

## Bezpečnostní hranice

**Publikační stav není autentizace.** GitHub Pages umí podmínit *zobrazení v UI*, ale soubor již nahraný do veřejného repozitáře je přístupný přímo URL. Proto student HTML nové skutečné karty **nesmí být zveřejněno ani jako neveřejný/draft podadresář**, dokud není pedagogicky a bezpečnostně schválené.

Učitelské klíče, QA odpovědi, reference a osobní údaje **nikdy neukládat do veřejného repozitáře ani do manifestu**. Pro učitelské klíče použít soukromý GitHub repozitář a jeho skutečná oprávnění. GitHub Pages nemá zabezpečené přihlášení učitelů.

Nový filtrovaný stav v UI nedokazuje, že odpovědi jsou správné nebo že přímý odkaz na připravovanou kartu je utajený.

## Co je nutné před první reálnou Can Mistakes kartou

1. Získat a ověřit původní referenční `Can Mistakes Help Us Learn? v4.3` (původní studentské HTML SHA-256: `1e15ca8bd4625d1efc271684de6324cc4ff353269749cacf4a5a68abcd24c8e3`), odpovídající správnou aktuální verzi klíče a master Reading Lab v3.4.
2. Dokončit **skutečnou** nezávislou revizi podle §13E: 56 izolovaných C1/C2 blind případů (168 odpovědí) + 24 s textem pro A1–C2 (360 odpovědí). Celkem 80/80 a 528/528, **bez syntetického nahrazování hodnotitelů**. Vyšetřit každou spornou položku a vzor fr:C1 Gist.
3. Po schválení vytvořit nový verzovaný samostatný offline HTML výstup s číslováním odstavců a obousměrnou otázka ↔ důkaz navigací ve všech 24 variantách. Originál, osobní slovníček `reading-lab-vocabulary` a datový obsah při technickém patchování zachovat. Výsledek prokázat SHA-256 integrity gate a reálnými browser testy.
4. **Ověřit přímo v cílové kartě** podporu URL parametrů `?lang=...`, `?level=...`, `?zamek=1` před vydáním QR. Nepředpokládat, že předchozí zamítnutý E4A bridge je kompatibilní.
5. Připravit jednotný, verzově shodný studentský HTML, soukromý klíč, README a VALIDATION. Fyzicky ověřit Android, iPhone/iPad Safari, offline `file://`, PWA a IndexedDB export/import (žádná automatická migrace mezi `reading-lab-vocabulary` a `lsh-test`).
6. Až po doloženém schválení vlastníkem projektu přidat do **veřejného** `zkusebni/cteni/<slug>/index.html` a manifestu položku `PUBLIKOVANO` s datem, platným shortCode a skutečně ověřenými variantami. Spustit CI na celém PR a ověřit Pages deployment. Žádné soukromé soubory do commitu.

Dále: teprve po schválení Can Mistakes upravit Plastic Ocean, zopakovat všechny brány a poté napojovat Listening.

## Stav hodnotitelské části

Historické E4B–E4G PR #7–#12 jsou **DRAFT / NO-MERGE** a zůstávají oddělené od `main`. E4G opravil sběrné/scoringové chyby, ale v předchozím ověřeném stavu bylo **0/80 skutečných nezávislých posouzení** a **0/528 reálných odpovědí**. Bez nových důkazů tento stav nelze prohlásit za dokončený.

R3A testy ověřují katalog, odkazy, QR, syntetický pozitivní scénář a souborové hranice, **nikoliv** CEFR, správnost klíče nebo první skutečnou Reading kartu.
