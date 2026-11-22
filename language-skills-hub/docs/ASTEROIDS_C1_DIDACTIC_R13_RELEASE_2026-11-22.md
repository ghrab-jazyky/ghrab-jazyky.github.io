# Asteroids — opravná etapa R-13 (ES/FR C1)

**Datum:** 22. 11. 2026  
**Předchůdce:** audit R-12 / issue #157 a nezávislá revize 42 položek ES/FR C1.  
**Cíl:** odstranit obsahové nejednoznačnosti, zvýšit jazykovou a kognitivní náročnost vybraných úloh bez narušení ostatních jazyků a úrovní.

## Realizované změny

| Jazyk | Počet revidovaných položek | P1 | P2 |
| --- | ---: | --- | --- |
| ES/C1 | 9 | `inference-3` (veřejná důvěra) | `gist-3`, `inference-1/2`, `vocab-2/3`, `matching-1/2`, `structure-1` |
| FR/C1 | 11 | `gist-2` (úplná funkce odstavce) | `gist-3`, `detail-3`, `inference-1/2`, `vocab-2/3`, `matching-1/2/3`, `structure-1` |

Další zdrojová oprava: v prvním francouzském odstavci byl zpřesněn odkaz na množinu asteroidů (`seuls quelques-uns ... qui les rapprochent`); evidence v `fr-c1-matching-3` byla změněna současně.

- Gist: idiomatičtější titulky o pravděpodobnosti a komunikaci rizika.
- Inference: práce s epistemickou nejistotou, důvěrou veřejnosti a následným měřením změny oběžné dráhy po DART.
- Vocabulary: význam metafor `abanico/éventail` a kritického postoje `despreciar/indignes de toute préparation` místo základních významů `complementan/complètent`.
- Matching: přirozenější terminologie a parafrázování, nikoliv vyhledávání doslovně opsaného slova.
- Structure: věrohodnější tematicky příbuzné distraktory v otázce na kohezní přechod.

## Ochrana dat a kompatibilita

- Zachováno **21 položek C1 na jazyk**, **7 strategií × 3 otázky**, všechna původní ID, pořadí a indexy správných odpovědí; totéž platí pro dalších 22 jazykových/CEFR variant.
- U dotčených ES/FR položek se jednorázově zneplatní staré lokální odpovědi a prvotní pokusy; zkontrolované sekce s revidovanou položkou se otevřou k opětovnému vypracování.
- Zachovány odpovědi na nezměněné položky, jiné jazykové varianty a otevřená reflexe.
- Verze migrace `es-fr-c1-r13-20261122` oddělená od R-12; starší R-12 migrace zůstává funkční.
- Odpovědi a důkazy v JSON jsou společným zdrojem pro interaktivní kartu i předgenerované PDF. PDF nevypisují klíč ani vysvětlení.
- R-13 testy kontrolují ID, indexy, přesné textové důkazy, scoring, projekci `practice-all` i `test-all` a migraci v Chromium/WebKit.

## Podmínky vydání (neoznačovat před provedením)

- [ ] Automaticky přegenerovat **96 PDF**, manifest a SHA256 ze stejného zdrojového commitu.
- [ ] Vizuální kontrola skutečných ES/FR C1 PDF, zvlášť delších možností, a zkouška overflow.
- [ ] `pdf-scope`, `unit`, `browser`, `corpus`, `pdf-release-gate` SUCCESS na přesném posledním SHA.
- [ ] Související starší LSH CI (R27/R44/R49/R35 apod.) bez regresí.
- [ ] Sloučení pouze přes chráněný PR do `main`.
- [ ] Post-release PDF gate a GitHub Pages build/deploy SUCCESS na přesném merge SHA.

## Didaktická hranice a kontext

Cílová úroveň: **B2+ → C1**, vyšší ročníky gymnázia (17–19 let); čas 35–50 min na jeden jazyk. Cíl: práce s argumentací, příčinnými vztahy, autorským postojem a mírou jistoty. Slabším žákům pomůže krátký glosář a hledání textových důkazů; silnější vysvětlí odmítnutí nejbližšího distraktoru a vytvoří kriticky přesný titulek.

Nejde o standardizovaný certifikační test C1; bez studentského pilotu nebyla empiricky prokázána obtížnost ani diskriminační schopnost. Podle zadavatele jsou všechny čtecí texty původní; v rámci této opravné etapy se neotevírá agenda přejatých textů ani autorských práv. Praktická přejímka na zařízení a školní tiskárně je zvláštní provozní krok.

**Stav dokumentu:** implementace zdroje a testů dokončena na vývojové větvi, finální vydávací podmínky čekají na CI a PDF kontrolu.
