# PŘEDÁNÍ PRO CLAUDA — City Quest F5

**Režim:** nezávislé předschvalovací hodnocení, žádné produkční nasazení.

## Rozbalení a zahájení review

Základ tvoří **tři samostatné důkazové přílohy**. Je-li k dispozici jeden agregovaný balíček `CITY_QUEST_F5_KOMPLET_CLAUDE.zip`, je v něm vše pohromadě.

1. `CITY_QUEST_F5_CLAUDE_SOURCE_REVIEW.zip` – kompletní relevantní zdrojové moduly a testy City Quest včetně původních dokumentů, F4 matice všech 256 profilů, F5 auditního zadání a interního SHA-256 manifestu každého přibaleného souboru. Vyrobeno na F5 dokumentační větvi, která podle preflight **nemění žádný F4 certifikovaný aplikační zdroj**.
2. `F4_CityQuest_offline_certified.zip` – certifikovaný jediný offline HTML soubor z F4 Actions run #45025682912; nespoléhej na název `F2`, obsahuje aktuální F4R kód.
3. `F4_CityQuest_screenshots_certified.zip` – 26 screenshotů z prohlížečových regresí, důkazní materiál, ne náhrada za fyzickou přejímku.

**První soubor, který má Claude přečíst:** `language-skills-hub/authoring/city-quest-f5/F5_CLAUDE_MASTER_PROMPT_CZ.md`. Následuje `F5_EVIDENCE_MANIFEST.json`, `F5_BASELINE_A_PROVEREVANI_CZ.md`, `F5_GATE_PLAN_AKCEPTACE_CZ.md` a `F5_INTEGRACNI_PLAN_CZ.md`. Originální všech 256 profilů je v `language-skills-hub/authoring/city-quest-f4/F4_256_variant_release_review_matrix.csv`; pro fyzické a jazykové kontroly je navíc `F5_MANUAL_DEVICE_AND_CONTENT_QA.csv`.

## Co se smí považovat za prokázané

- F4 source SHA `73d2781ab51feaa95b2c5b014e24570b4d1f5d93`.
- 11/11 relevantních workflow City Quest SUCCESS, run #45025682912; oba jeho F4 joby SUCCESS.
- Důkaz o shodě SHA-256 exportovaného HTML: `10e3037c7e37e86e5a5307033c9d9e22d1aa27723e48e96802ca0fe84ac2b062`.
- Offline CSP: vložené styly/skripty s SHA-256, `connect-src 'none'`.
- Nezávislá historická F4 smoke-matice pokrývá 192 City + 64 Metro DOM variant.

## Co stále PENDING

- Všechny čtyři lidské podpisové sloupce v 256řádkové F4 matici.
- Fyzický iPhone/iPad/Android, VoiceOver, TalkBack, skutečný 200% text/zoom.
- Nezávislá nativní kontrola EN/ES/DE/FR, především C1/C2 a rozdíly mezi úrovněmi.
- Vizuální/pedagogické převzetí vlastníkem, rozhodnutí k offline hlasům a výslovné povolení vydání.
- Bezpečná izolovaná integrace z aktuální `main` po vyhodnocení rozdílu 270/100 historických commitů.

## Důležité odkazy

- Repo: https://github.com/ghrab-jazyky/ghrab-jazyky.github.io
- F4 remediation: https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/pull/161
- F4 exact-head CI: https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/actions/runs/45025682912
- F5 human gates: https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/issues/163
- F5 review PR: teprve po založení; ověř jeho číslo přímo v GitHubu.

**Poznámka ke zdrojovému balíčku:** testy Playwright obsahují předpoklady pro lokální HTTP server pro načítání při automatizovaných browser regresích; finální distribuční HTML funguje bez síťových požadavků. Nepleť lokální testovací server `127.0.0.1:8765` s externí službou aplikace.

**Závěr:** Vlastník chce kompletní a kritickou revizi Claudem **před** nasazením. Nyní je povolena pouze revize a případné samostatně schválené opravné PR; vydání zůstává `NO-GO`.
