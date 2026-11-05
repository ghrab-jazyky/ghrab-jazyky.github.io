# E4C – kontrola dat skutečné karty Plastic Ocean v2 (bez publikace HTML)

**Datum:** 2026-11-05. **Závazný standard:** Reading Lab master v3.4. **Status:** DRAFT / NO-MERGE / NO-DEPLOY.
**Soukromý podklad:** `Reading_Lab_Plastic_Ocean_and_Our_Choices_COMPLETE_v2_ALL_LANGUAGES.zip`, pouze studentský HTML, bez zveřejnění klíče nebo obsahu karty.
**SHA256 studentského HTML:** `6a87e08fad4f1fb8e6689fc5a95d811127f26097cf289f679ea17b7d5979be78`.

## Nový nezávislý read-only datový audit
Dodaný studentský HTML byl analyzován lokálně bez spuštění jeho JS – z inline `const DATA=` byl parsován čistý JSON. Nevynášej texty, zadání, volby ani správné odpovědi do veřejného CI. Rozsah:
- 24/24 variant EN/ES/DE/FR x A1–C2 a 360/360 úloh.
- Správné počty záložek 3/3/4/6/7/7 a tři úlohy v každé; globálně jedinečná ID.
- Validní indexy odpovědí, důkazy v uvedených odstavcích, cílové výrazy, zjevné úniky skryté věty, nepředvídatelné pořadí A/B/C, identické vzory napříč záložkami, poměr neobvykle nejdelších správných odpovědí.
- **0 kritických a 0 závažných nálezů**, **1 mírná výhrada:** `de:C2`, odpověď výrazně delší než alternativy u **5/18 relevantních úloh (27,8 %)**, tedy mírně nad metodickým cílem cca 25 %. Samotná délka neznamená chybnou otázku.
- Max. úspěšnost strategie opakovaného tipování vzoru A–B–C bez textu byla 33,3 %, pod metodickým cílem cca 45 %.

## Co to NEDOKAZUJE
Tato kontrola neověřuje CEFR, přirozenost textů, jednoznačnost všech správných odpovědí, nezávislý blind test po záložkách, skutečné 100% slovníkové pokrytí, správnost soukromého klíče, IndexedDB persistence, iOS/Android ani úplnou offline funkčnost při `file://`.
V2 stále **nesplňuje nové požadavky v3.4** na číslování odstavců, návrat od pasáže k otázce a aktualizované pedagogické testy. Více v `E4B_PLASTIC_V2_REAL_REFERENCE_AUDIT_2026-11-05.md`.

## Rozsah kódu E4C
- `zkusebni/tools/reading-v34-data-audit.cjs`: pouze lokální HTML soubor; parsuje inline JSON **bez eval** a vydává pouze redigované metriky a ID problémových otázek; vždy vrací `releaseDecision:NO_GO`.
- `zkusebni/tests/e4c.test.cjs` a `.github/workflows/lsh-e4c-tests.yml`: výhradně syntetická testovací data, **žádná skutečná karta v repozitáři**.
- GitHub CI ověřuje nástroj; výsledky na skutečném Plastic v2 byly pořízeny odděleně lokálně v privátním pracovním prostředí.

## Další brány
1. Reálně načíst schválenou referenci `Can Mistakes Help Us Learn?` v4.3+ podle §12B, zkontrolovat i její vložený slovníček a uložení.
2. Neodvozovat datový kontrakt Reading Lab ze starého E4A `lsh-test`; zachovat `reading-lab-vocabulary`, `reading-lab-vocabulary-backup` a samostatnou offline kartu.
3. Po schválení první karty opravit Plastic Ocean podle v3.4; pak oba reálně pedagogicky a technicky ověřit.
4. Chráněný učitelský katalog až po schválení obou karet; studentům později pouze přímé URL/QR, nikdy klíče.

**Zákaz sloučení do `main` a publikace.** Soubory uživatele zůstaly nedotčeny.