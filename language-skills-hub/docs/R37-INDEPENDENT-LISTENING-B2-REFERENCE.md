# R37 – Listening Lab, nezávislá testová reference Harrison Ford EN/B2

**Stav:** DRAFT, `published:false`, před nezávislým pedagogickým auditem. Nezařazovat do ostrého učitelského katalogu.

## Pedagogické určení
- **Úroveň:** EN/B2, **věk/ročník:** vyšší gymnázium 16–19 let.
- **Cíl:** zachytit reflexi řečníka o životní cestě, sdíleném úspěchu, vděčnosti a odpovědnosti; u písemných položek uvést odpověď vlastními slovy.
- **Čas:** návrh 20 minut pro odpovědi po dvou učitelem řízených posleších, nutné reálně vyzkoušet. Audio/video přehrává výhradně učitel, žákovská stránka nemá přehrávač.
- **Pro slabší:** samostatně autorovat B1 test, nikoliv jen snižovat procentní prahy. **Pro silnější:** samostatně autorovat C1/C2 s hlubší argumentací.
- **Bodování:** 2 gist + 3 detail + 3 pořadí + 1 faktická písemná + 1 interpretační písemná = **10 bodů**. Poslední dvě položky jsou hodnoceny učitelem 0/1. Před posouzením všech písemných odpovědí se celkové procento a známka nevypočítávají. Pouze lokální neověřený návrh.

## Kontrast s procvičováním

Původní EN/B2 practice obsahuje 3 gist, 6 detail, 6 sequence, 3 facts a 2 open (celkem 20), plus další didaktické materiály; nový test obsahuje **10 odlišně formulovaných úloh**. Důležitý obsah se nutně tematicky překrývá se stejným projevem, ale testové zadání není totožnou kopií původních položek.

## Technické soubory

- `self-check/test-banks/listening/ll-harrison-ford/en-B2.json`: původní návrh varianty, `published:false`.
- `self-check/test-banks/listening/independent-schema.js`: validace hash zdroje, statutu, všech 10 položek, odlišných textů, správných odpovědí a explicitních dvou přehrání.
- `self-check/test-banks/listening/preview.html` + `preview.js`: izolovaný QA náhled na pracovní větvi, verifikace SHA-256 původního HTML, lokální časovač, automatické odevzdání, ruční hodnocení a neověřený CSV export.
- `tests/r37-independent-listening.test.cjs` a `tests/r37-independent-listening.browser.test.cjs`: unit a Chromium/WebKit kontroly.

## Akceptační / auditní stav

- [ ] Ověřit přesnost všech deseti otázek vůči autentickému projevu a původnímu testovému obsahu.
- [ ] Ověřit formulace EN/B2, jednoznačnost distractorů a reálnou časovou náročnost.
- [ ] Potvrdit pravidlo dvou učitelem řízených poslechů a dostupnost původního mediálního zdroje ve školní síti.
- [ ] Ověřit možnost férového 0/1 hodnocení písemných odpovědí bez nově vymyšlené rubriky – návrhová kritéria zatím nejsou školní rubrikou.
- [ ] Projít reálnou přejímkou Android Chrome, iPhone/iPad Safari, desktop Chrome/Edge/Firefox.
- [ ] Rozšířit další úrovně a obě zbývající Listening témata individuálními otázkami.

**Bezpečnost:** GitHub Pages není důvěryhodná zkušební infrastruktura. Klíče z klientského JSON lze zjistit, místní data a CSV lze změnit, přerušení není důkaz opisování. Žádné studentské účty ani vzdálený přenos výsledků.

**Publikační rozhodnutí:** R37 navazuje na R36 → R35 → R34 → R33 → R32, všechny jsou oddělené nepublikované pracovní drafty. Žádná z referencí se bez didaktického schválení nesmí objevit mezi schválenými testy.
