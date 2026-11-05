# E4B – Read-only předběžná kontrola Reading Lab v3.4

**Datum:** 5. 11. 2026. **Stav:** DRAFT, NO-MERGE, NO-DEPLOY.
**Větev:** `feat/lsh-e4b-reading-v34-preflight-2026-11-05`, od E3D.
**Nezávislé na blokované E4A:** E4B se neodvozuje od PR #6 a neobsahuje jeho experimentální adapter.
**Zdroj:** uživatelský `Reading_Lab_MASTER_PROMPT_v3_4.txt` z 05.11.2026.

## Důvod
Vlastní samostatné HTML v4.3+ zatím není k dispozici přes dostupný GitHub,
knihovnu souborů ani připojený Google Drive. Jde pouze o automatický
preflight budoucího referenčního HTML, **nikoli o tvrzení, že Reading Lab
v3.4 byl otestován**. Aktuální společný LSH slovníček (`lsh-test`,
`lsh-slovnicek`) není identický s `reading-lab-vocabulary` ani s jeho
zálohovacím schématem. Nesmí nastat nevyžádaná konverze.

## Použití po dodání finálního HTML
```bash
node zkusebni/tools/reading-v34-preflight.cjs "/cesta/k/referencni-karte-v4.3.html" > preflight.json
```
Zpracuje pouze **místní kopii HTML**. Nic nenačítá ze sítě, nevykonává
JavaScript v kartě, neodesílá data a neupravuje původní soubor.
Pro ZIP nejprve lokálně extrahuj schválený studentský HTML, učitelský klíč
při analýze studentského souboru nepřidávej do veřejného repozitáře.

Význam výsledků:
- **FAIL:** prokázaný statický problém (např. externí CSS, externí JavaScript,
  zakázaný zoom, zjevně nechráněný odkaz na učitelský klíč).
- **PASS:** pouze konkrétní statické pravidlo splněno.
- **REVIEW:** kontrola vyžaduje analýzu skutečných dat, ruční pedagogické
  posouzení nebo spuštěný prohlížečový test.
- **NO_GO:** závazný výsledek každého běhu této kontroly. Ani zelený
  statický preflight **NIKDY NENÍ SOUHLAS S NASAZENÍM**.

## Povinné další samostatné kontroly
1. Faktické struktury 24 variant a 360 úloh, jedinečné stabilní ID,
   úrovně a 3/3/4/6/7/7 záložek – teprve s referenčními daty.
2. Ukládání sessionStorage `reading-lab-answers:{topicId}:{version}`,
   oddělení variant a první pokus pouze při prvním Check.
3. Skutečný `reading-lab-vocabulary` (verze 1) a export kind
   `reading-lab-vocabulary-backup`, importy bez ztráty,
   100% slovníkové pokrytí každé varianty.
4. Viditelné číslice odstavců přes CSS, evidence anchors, návrat
   k otázce přes společný nav modul, skrytá věta.
5. EN jako výchozí při novém otevření, slovník OFF při každém otevření,
   aria přístupnost, fullscreen/focus fallback, nezávislý desktop scroll,
   mobil bez horizontálního přetečení.
6. Nezávislé pedagogické kontroly CEFR a §7A, blind test po záložkách,
   testování v reálných prohlížečích a na fyzických mobilních zařízeních.
7. Schválení obou prvních Reading Lab karet před spuštěním **učitelského**
   katalogu; učitelské klíče výhradně mimo veřejný hosting.
8. Explicitní rozhodnutí majitele projektu před nasazením/merge.

## Bezpečnost
Předběžná kontrola je záměrně konzervativní. Nezpracovává ani nespouští
kód z analyzované karty. Použití síťových zdrojů mimo přímé
`script`/`stylesheet`/media atributy vyžaduje zvláštní runtime audit.
Částečně minifikovaný či generovaný HTML kód nelze spolehlivě validovat
jednoduchým hledáním slov: indikátory jsou proto označeny REVIEW.

## Rollback
Zavřít Draft PR / odstranit větev E4B. Nepoškodí E3D, E4A, původní
Reading Lab ani jeho osobní slovníček.
