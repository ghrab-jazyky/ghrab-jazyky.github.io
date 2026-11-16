# Language Skills Hub – Etapa F: závěrečná certifikace katalogu změn

**Datum přípravy:** 16. listopadu 2026  
**Zdroj:** `feat/lsh-teacher-changelog-stage-d-20261116`  
**Zamrazený základ produkce:** `e176e95f20cee9d04db550202aa8538d08a1d7ce`  
**Produkce:** `main` – během přípravy nezměněna.  
**Stav:** připravený release kandidát, bez produkčního nasazení a bez závěrečné fyzické přejímky na iPadu.

## 1. Co přesně kolegyně uvidí

Po úvodní obrazovce LSH se otevře nabídka novinek pouze v případě, že v katalogu existuje nové vydání, které uživatel v tomto profilu prohlížeče dosud nevyřídil. Text:
> Připravil jsem krátký přehled toho, co je v LSH nového a jak ti to může usnadnit výuku.

Volba **Ano** otevře katalog; **Ne**, zavření či **Esc** pokračuje do nabídky laboratoří. Vyřízenou sekvenci si LSH uloží lokálně. Při ručním otevření tlačítkem **Co je nového** aplikace vrací uživatele do původní laboratoře a zůstávají zachované filtry i hledání. Obsah je veřejně čitelný stejně jako LSH; nikde se nezveřejňují klíče ani interní bezpečnostní detaily.

## 2. První katalog skutečně vydaných změn

Datový soubor: `language-skills-hub/data/teacher-changelog.json`.  
**3 datovaná vydání, 5 významných změn, sekvence 3/2/1, celkem 5 položek.** 
Datum `publishedAt` odpovídá datu nasazení příslušné již existující změny do `main`; nikoli datu zveřejnění tohoto nového katalogu. Katalog je tedy retrospektivní informací o posledních změnách.

| Datum | Oblast | Učitelský záznam | Ověřený zdroj |
|---|---|---|---|
| 16. 11. 2026 | Conversation Lab | Upravené konverzační scénáře „Jídlo, pití a restaurace“ v EN/ES/DE/FR | [commit `e176e95`](https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/commit/e176e95f20cee9d04db550202aa8538d08a1d7ce) |
| 15. 11. 2026 | Listening Lab | Nový poslech „How to Choose Your News“ A1–C2 | [commit `3a12b93`](https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/commit/3a12b931f3f60b5b9d93996d30b49cec6a7a67f0) |
| 15. 11. 2026 | Listening Lab | Sjednocení úloh pro správné pořadí výroků při procvičování | [commit `140f71f`](https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/commit/140f71fb9a64a6426c2d68aeca24bab050c10e0b) |
| 14. 11. 2026 | Listening Lab | Sjednocený vzhled procvičovacích karet SAD/Conlangs | [commit `c8d4e44`](https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/commit/c8d4e441cb62471df79230942e7387a756bf6e43) |
| 14. 11. 2026 | Listening Lab | Conlangs má varianty A1–C2 | [commit `c0a9177`](https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/commit/c0a9177f90500cc925d5717ffcfb2dbd2bd018cc) |

Všechny texty jsou záměrně psané srozumitelně, v osobním tónu a bez implementačních detailů. Učitelé z nich zjistí, co je nové a jak to využít ve výuce. Syntetická testovací data jsou výhradně v testovacích souborech.

## 3. Automatické QA – povinná kontrola

Workflow: `.github/workflows/lsh-teacher-changelog-stage-d.yml`.

Vyžadovaná QA nad stejným finálním commitem:
- syntaxe čtyř JS modulů a `hub.js`;
- nové datové a chronologické kontrakty (bez HTML injekcí, bez interních technických údajů);
- Stage D browser scénáře pro **Chromium + WebKit** (Ano, Ne, místní vyřízená sekvence, přímé odkazy, chybové stavy);
- Stage F browser scénáře pro **Chromium + WebKit** (skutečný katalog a řazení 3/2/1, 5 záznamů, zachování stavu po návratu, 320/390/768/1440 px, Esc, pomalé připojení);
- dřívější regresní testy `hub-audit-2026-11-11` a `r61-school-logo-header`.

**Povolení kandidáta k produkci pouze při 100 % PASS nad finálním HEAD** a bez očekávaných chyb. Historické PASS z jiných commitů se nepovažují za certifikaci. Součástí release musí být navíc audit odchylek a kontrola změn oproti `main`.

## 4. Fyzická uživatelská přejímka – zatím neprovedena

Pro přejímku na školním iPadu (Safari) a v Chrome na Windows:
1. Otevřít úvodní URL, po třech sekundách zvolit **Ano**. Zkontrolovat čitelnost a tlačítko pokračování; otestovat **Ne** a **Esc**.
2. Po uzavření katalogu zvolit každou ze tří laboratoří, ověřit stávající filtry a že novinky nezasahují do testů.
3. Z konkrétní laboratoře otevřít **Co je nového**, zavřít a zkontrolovat zachování výběru/filtru/pozice a fokus klávesnice.
4. Ověřit denní/noční režim, iPad na výšku/šířku, zobrazení softwarové klávesnice, dotykový posun karet, zavření a chování při obnovení stránky.
5. Otevřít studentské QR/přímé odkazy na Reading/Listening a ověřit, že žádné učitelské upozornění nesmí přerušit test.
6. V případě nedostupného souboru novinek musí nabídka laboratoří fungovat bez prodlevy a chybové stránky.
7. Výsledek zapsat **PASS/FAIL**, typ zařízení, prohlížeč, datum a případnou reprodukci. Bez této přejímky netvrdit „ověřeno na fyzickém iPadu“.

## 5. Povolený postup nasazení až po schválení vlastníkem

1. Potvrdit neměnný `main` baseline nebo novou změnu nejprve přezkoumat/rebasovat. Znovu zkontrolovat faktickou aktuálnost všech textů.
2. Otevřít/posoudit draft PR; přejít do review. Ověřit výsledek všech povinných CI a, kde relevantní, školní iPad.
3. **Teprve po jednoznačném písemném souhlasu vlastníka** sloučit PR do `main`; jiný postup není povolen.
4. Ověřit GitHub Pages, odpověď `version.json`, počet 33 témat, CSS a nové JS moduly, validní `teacher-changelog.json`, obsah 3 vydání a pop-up na čistém profilu prohlížeče.
5. Zkontrolovat `.github/workflows/lsh-live-site-smoke.yml` a projít minimálně jeden ruční smoke test na reálné HTTPS adrese.
6. Při regresi provést řízený revert produkčního PR; nevypínat studentské testy ani nepřepisovat nesouvisející soubory.

## 6. Příští aktualizace katalogu

Pro každý významný balík uživatelských změn zvýšit `latestAnnouncementSequence` a vytvořit nové vydání s datem skutečného nasazení a se schváleným popisem. Drobné opravy a interní QA sekvenci nezvyšují. `contentRevision` lze zvýšit při drobné redakční opravě již zveřejněného textu, aniž by uživatelé dostali další vyskakovací nabídku.

Nezveřejňovat studentské údaje, odpovědní klíče, servisní odemykání, interní bezpečnostní logiku ani neověřená produkční tvrzení.

## 7. Předprodukční závěr

**Etapa F:** vydání připravené k předprodukčnímu posouzení; žádná změna `main`. Finální rozhodnutí GO/NO-GO vychází výhradně z aktuálních CI, fyzické přejímky a schválení majitele projektu.  
