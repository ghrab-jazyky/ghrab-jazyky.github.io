# R39 – integrace skutečně autorsky navržených testů (bez nasazení)

**Stav:** pracovní integrační větev, **DRAFT / NO MERGE do `main`**. Produkční R31 zůstává nedotčená. Audit Claudem odložit až po obsahovém doplnění všech variant.

## Pravdivá obsahová inventura

| Dovednost / téma | Návrhy existují | Celkem požadováno | Zbývá |
|---|---:|---:|---:|
| Reading – Can Mistakes Help Us Learn? | 24 | 24 | 0 |
| Reading – Asteroids | 24 | 24 | 0 |
| Reading – Plastic Ocean | 24 | 24 | 0 |
| Reading – An Email from a Friend | 6 (pouze EN) | 24 | 18 (ES/DE/FR A1–C2) |
| Reading – Instant Messages | 0 | 24 | 24 (EN/ES/DE/FR A1–C2) |
| **Reading celkem** | **78** | **120** | **42** |
| Listening – Harrison Ford | 6 | 6 | 0 |
| Listening – Matthew Oscars | 6 | 6 | 0 |
| Listening – Peaky Blinders | 6 | 6 | 0 |
| **Listening celkem** | **18** | **18** | **0** |
| **Celkem** | **96** | **138** | **42** |

Tento součet znamená **existující autorské návrhy**, nikoli 96 hotových pedagogicky schválených testů. Každý návrh musí projít jazykovou a didaktickou kontrolou: přiměřenost CEFR, pravdivost opory v původním textu/audiu, kvalitu distraktorů, jednoznačnost správné odpovědi a odlišnost od practice. Všechny zůstávají `published:false` a bez studentské veřejné nabídky.

## Technická integrace

- Výchozí čtecí větev `feat/lsh-r34-independent-test-coverage-2026-11-10`: 78 autorsky sestavených Reading bank, společná čtecí QA stránka, soupis očekávaných 138 variant a testy.
- Poslechové banky přeneseny bezeztrátově (identické Git blob SHA) z `feat/lsh-r37-all-eighteen-listening-banks-2026-11-10`: všech 18 EN/A1–C2. Přenesen i samostatný QA náhled, jeho validátor a existující kontrolní soubory.
- **Žádné mechanické kostry** z větve s 138/138 soubory nebyly označeny jako hotové autorské testy. Strukturní věty typu „Která věta se nachází v odstavci X?“ nejsou náhradou obsahově různorodé testové sady.
- Nezasahuje se do 29 veřejně schválených procvičovacích karet ani do produkčních učitelských/studentských URL.
- Lokální režim R30/R31 zůstává pouze učitelem dohlížený; odpovědi ani známky nejsou ověřené serverem, nezaručuje se utajení klientských klíčů.
- Listening zahrnuje šest objektivních a dvě písemné otázky na variantu, písemné hodnocení je závislé na vyučujícím. Záznamy nejsou důvěryhodná klasifikace.

## Zbývající obsahová výroba – přesné pořadí

1. **Email from a Friend – ES, DE, FR (18 sad).** Každý text se liší jazykem a CEFR. Pro každou variantu nově vytvořit deset úloh s vlastními otázkami, přiměřenou jazykovou náročností, oporou v odstavci, jednoznačným klíčem a vysvětlením. Nepřekládat mechanicky EN při odlišném zdroji.
2. **Instant Messages – EN, ES, DE, FR (24 sad).** Stejný individuální audit všech šesti úrovní; některé verze jsou formátově konverzace krátkých zpráv, ověřit strukturu odstavců a konkrétní komunikační záměry. Předem netvrdit, že automatický extraktor zachová pořadí a role zpráv.
3. **Sjednocení autorství a zdrojů Listening (18 sad).** Ačkoli všechny návrhy existují, jejich věcnou správnost musí před klasifikací ověřit druhý reviewer přímo proti audio/video. Vlastní modelové odpovědi nejsou důkazem přesného znění nahrávky.
4. **Učitelská správa a přejímka.** Teprve když bude 138/138 autorských bank, připravit seznam souborů, hash, přesný CEFR, počet bodů a testovací QR pro každou. Soukromé učitelské klíče nevkládat do public repo; JSON v GitHub Pages nelze pro studenta utajit.
5. **Finální integrační audit** Node/Playwright a fyzické Android/iOS/iPadOS přejímky. Až pak spustit **Claude audit** didaktiky a techniky; případné opravy podle konkrétních závěrů, nikoliv předstírané schválení.

## Pravidla pro závěrečný audit

Povinný automatický gate musí rozlišovat čtyři různé stavy:
- `MISSING` – fyzicky neexistuje banka.
- `DRAFT_UNAPPROVED` – autorsky navržený obsah, nebyl pedagogicky schválen.
- `INVALID` – nesoulad zdroje, schema, skórování či úrovně.
- `APPROVED_FOR_CLASSROOM` – až po explicitním učitelském schválení konkrétní verze a fyzické přejímce (aktuálně **0**).

Výsledek „všechny soubory existují“ nikdy nesmí automaticky znamenat „hotový test“; nevyvážené MC otázky či nesprávná audio evidence jsou didaktický FAIL i při syntaktickém PASS.

## Klíčová omezení

Pro plně zabezpečené klasifikované testy použít školní GIT/backend. Veřejný statický katalog slouží jako pomůcka při osobním dohledu. Při práci s reálnými výsledky žáků používat anonymizaci a schválený školní způsob evidence.

**Aktuální pravidlo:** nejprve dokončit všech 138 obsahových návrhů, poté samostatně provést Claude audit, následně učitelské schválení a teprve nakonec případné nasazení.
