# PLURAL V6 – cílené nasazení do produkční větve

Datum: 18. listopadu 2026.
Základ pro integraci: `main` na `8be153f84299a17355ee9eee6f6dca262b506ff2`.
Obsahový zdroj: `feat/lsh-plural-v6-editorial` na `6e2da282a2c53dacadd9d56fe0622d3bc0fe67da`.

## Rozsah
- Nová karta `cl-plural` v Conversation Lab, DE/ES/FR a A1–C2, 144 stanic / 1872 položek.
- Přesně 34 témat, 702 kombinací jazyk/úroveň; ostatních 33 témat z produkce beze změny.
- Autorský zdroj, zreprodukovatelný HTML soubor a CSP/hash v `version.json`.
- Lokalizované katalogové názvy, odkazy na jediný společný slovníček.
- Doplňkové regression/WCAG testy a učitelský release changelog z 18. 11. 2026.
- Neobsahuje původní pracovní/staging commit chain ani nevrací novější produkční změny.

## Verifikace
Předprodukční V6 commit `6e2da28`: 341/341 testů PASS, včetně 3/3 axe-core scénářů (desktop a emulované mobilní prohlížeče). Evidence: https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/actions/runs/44257204836

**Samostatná produkční integrační regresní sada musí proběhnout na přesném releasovém commitu.** Výsledek se uvádí pouze po dokončení příslušných Github Actions.

## Vědomá redakční výjimka
Autor projektu v zadání 18. 11. 2026 explicitně požádal o nasazení do produkční větve i poté, co bylo uvedeno, že původní jazykový/didaktický signoff ještě není dokončen. To představuje provozní rozhodnutí vlastníka produktu, **nikoli dodatečný důkaz jazykové správnosti**.

K dnešnímu dni nejsou doloženy tyto nezávislé brány: úplná lidská korektura všech 1872 položek a českých glos, normativní recenze 90 pravidel/96 úloh, didaktický signoff gradace CEFR, pilotáže A2/B2 a testy na fyzickém iPhone/Android zařízení. `editorial_approval.json` obsahuje otevřené editoriální gate z důvodu prokazatelnosti; není fingován podpis recenzenta.

## Kontrola kompatibility
- Nezměnit režim testů ani příznaky oficiálního hodnocení.
- Nezahodit produkční changelog vydání 17. 11. 2026.
- Žádné přepsání jiných Reading, Listening nebo Conversation karet.
- Převést jen přidání `cl-plural`, manifest a nezbytné testy; publikaci ověřit po merge.

## Rollback
Revertovat jen produkční release commit `PLURAL V6`, nikoliv starší 33 karet; ověřit návrat `topicCount=33`, `variantCount=684` a odstranění odkazu `cl-plural` z katalogu. Nevymazat lokální společný slovníček studentů.
