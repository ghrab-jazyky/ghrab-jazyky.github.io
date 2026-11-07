# Language Skills Hub R6 — nezávislá revize bez Clauda
**Datum:** 7. 11. 2026 · **Repo:** ghrab-jazyky/ghrab-jazyky.github.io · **PR:** #27 DRAFT / NO-MERGE

## Změna postupu
Čekání na placený Claude Pro **není technickou ani pedagogickou podmínkou** pokračování projektu. Původní dávkové exporty pro Claude se ponechávají jen jako volitelný alternativní způsob hodnocení. Vlastní kontroly nyní probíhají nad přesnými zdroji kandidátů R6 prostřednictvím `zkusebni/tools/r6-content-audit.cjs`, bez Anthropic/OpenAI API a bez žákovských dat.

## Výsledek prvního úplného automatizovaného screeningu
- 21/21 kandidátních HTML ověřeno proti SHA-256 v `data/conversation-r6-candidates.json`.
- 504/504 deklarovaných variant EN/ES/DE/FR × A1–C2, 4032 stanovišť, 16 128 hlavních a doplňujících otázek.
- **0** automaticky zjištěných přesných duplicit hlavních/doplňujících otázek (v rámci stejného jazyka a CEFR úrovně).
- **4** konkrétní podněty k odborné úpravě španělské A1: složitá vedlejší věta se subjunktivem. Níže přesné znění a navržené zjednodušení.
- Výsledky generuje CI jako dva soubory `R6_CONTENT_AUDIT.json` a `R6_CONTENT_AUDIT_SUMMARY.md` v artefaktu `lsh-r6-independent-content-screen`.

**Pozor:** Technický screening **není** nezávislý kompletní lingvistický a pedagogický audit. Nulový počet duplicit nezaručuje kvalitní obsah, idiomatičnost ani správné CEFR. Kandidáti zůstávají `CANDIDATES_ONLY`, `teacherApproval:false`, `published:false`.

## Čtyři obsahové nálezy k revizi (P1 / ES A1)
| Karta / stanoviště | Původní otázka | Doporučená pracovní náhrada |
|---|---|---|
| `cl-ceny-nemovitosti`, stanoviště 7, hlavní | `¿Qué hace que una casa sea buena para una persona?` | `¿Qué necesita una persona en su casa?` |
| `cl-ceny-nemovitosti`, stanoviště 8, otázka 3 | `¿Qué puede hacer que un piso pequeño parezca más grande?` | `¿Cómo puedes tener más espacio en un piso pequeño?` |
| `cl-majetkove-nerovnosti`, stanoviště 4, hlavní | `¿Qué hace que una casa sea segura y cómoda?` | `¿Cómo es una casa segura y cómoda?` |
| `cl-muzi-a-zeny`, stanoviště 4, hlavní | `¿Qué hace que alguien sea un buen amigo?` | `¿Cómo es un buen amigo?` |

Všechny navržené úpravy zachovávají základní význam, ale vynechávají konstrukci `hacer que + subjuntivo`. Konkrétní formulace mají být ještě potvrzeny v kontextu celé aktivity. **V této etapě jsou pouze zaznamenané; dosud nebyly aplikovány do HTML.** Při aplikaci je povinné přepočítat CSP SHA-256 inline skriptu, kontrolní SHA-256 souboru a Git blob v manifestu R6. Kanonické originály bez přejímky nepřepisovat.

## Další kontrolní brány
1. Doložit obsahovou přejímku ve všech skutečných jazykových a úrovňových variantách. Automatický screening odhaluje jen vybrané typy chyb; zejména gramatiku DE/FR, užitečnost Explain a skutečnou diferenciaci CEFR je nutné posoudit zvlášť.
2. Ověřit každé nalezené riziko proti celému kontextu stanoviště, nejen izolované větě.
3. Po schválených obsahových úpravách znovu spustit R6 strukturální test, kompletní obsahový screening, CSP a 29karetní regresi.
4. Nezaměňovat kontrolu zdrojové integrity, automatický screening a finální učitelské schválení. `Testování` zůstává `not-ready`.
5. Před jakýmkoli vydáním provést skutečnou UAT telefonu, iPhonu/iPadu, školní Wi-Fi, QR a offline ukládání.

**Rozhodnutí:** pokračovat bez Clauda, bez publikace do main a bez vydávání automatické kontroly za úplné pedagogické schválení.
