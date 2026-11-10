# LANGUAGE SKILLS HUB — NEZÁVISLÝ CLAUDE AUDIT: KONTRAKT PŘEDÁNÍ

## Předmět / zásady
Auditovat **výhradně přesný SHA** integrační větve `feat/lsh-r39-consolidated-authored-banks-2026-11-10` / PR #59 po dokončení interní QA. Claude nemá automaticky schvalovat, deployovat ani měnit `main`; jeho úkolem je **nezávislý odborný audit**, návrhy oprav a případně opravný commit jen na vyžádání. Zaznamenat přesný auditovaný SHA, datum, testované cesty a použité zdroje. Připravit seznam všech nálezů s prioritou CRITICAL/HIGH/MEDIUM/LOW.

### Rozsah
- Reading: 5 témat × 4 jazyky (EN/ES/DE/FR) × A1–C2 = 120 testových bank, 10 otázek každá, tedy **1 200 MC položek**.
- Listening: 3 témata × EN × A1–C2 = 18 bank, 6 objektivních MC a 2 písemně učitelem hodnocené otázky každá: **108 objektivních + 36 písemných položek**.
- Celkem 138 variant, **1 344 obsahových položek**, 29 veřejných practice karet musí zůstat identických.
- Conversation: 21 practice témat; **žádná klasifikovaná Conversation testová větev** podle pozdějšího R22 rozhodnutí.
- Žádná banka není pedagogicky schválena, ani po dokončení technické implementace. `published:false`, `status:DRAFT_PENDING_TEACHER_CONTENT_APPROVAL`.

### Dva oddělené audity

**A. Didaktika a lingvistika** pro *každou* položku. Dodat CSV/Markdown auditní protokol s minimálně těmito sloupci:
`topic | language | CEFR | bankFile | questionId | issueSeverity | issueType | evidenceInSource | observed | proposedFix | reviewerDecision`.

1. Vždy načíst skutečný text daného jazyka/CEFR ze zdrojového practice HTML, ověřit SHA-256 souboru proti `version.json.contentHashes` a porovnat každou otázku i odpověď se zdrojem. U Listening nezaměňovat practice klíč za autentický zvukový přepis: nutné reálně ověřit originální audio/video a neodvozovat fakta jen z jiné AI banky.
2. Testovat jednoznačnost správné odpovědi i plausibilitu všech tří distraktorů; identifikovat dvojznačné, částečně správné, fakticky nepravdivé či příliš snadné možnosti; u každé vyžadovat doložení odstavce / pasáže.
3. Ověřit CEFR přesnost zadání i možností EN/ES/DE/FR, přirozenou slovní zásobu, gramatiku, idiomatičnost, příslušnou kognitivní náročnost, kontrast A1/A2 vůči B1/B2 a C1/C2. Doporučit složitost podloženou textem, ne absolutní tvrzení typu „příliš snadné“ bez důkazu.
4. Porovnat všechny `q` a `choices` s practice otázkami: doslovné kopie = FAIL; významová duplicita = nález k revizi, zejména pokud jde jen o parafrázi. Označit opakující se koncepty a nevyvážené pokrytí textu.
5. U Listening zvlášť ověřit 2-playback protocol a faktickou správnost 108 MC klíčů, modelových odpovědí a učitelských kritérií 36 písemných otázek. V souladu s copyrightem nepublikovat celý cizí přepis ani audiovizuální dílo.
6. Ověřit dopady desetibodového Reading skórování a osmibodového Listening skórování na pracovní prahy známek 88/74/59/44 %. Žádné jiné prahy nevymýšlet; pouze označit pedagogické riziko nízké granularizace.

**B. Technika, bezpečnost, UX / UAT**:
1. Statická architektura bez backendu: žádná centralizovaná kolekce výsledků, žádný soukromý klíč, žádný osobní údaj ani audio/video nahrávání. Ověřit i všechny nové QA náhledy a existující R31.
2. Každý draft má správný zdrojový hash, odpovídá katalogovému ID, jazyku a CEFR; mismatch musí fail-closed, ne načíst practice otázky.
3. Časovač 5–120 minut, start, běh, expiry, submit, autosave/localStorage, local-session separation, návrat při přerušení, gesto čtyř rohů, historie incidentů. R30 gesture není heslo, nelze tvrdit ochranu proti podvodu.
4. Studentský Reading QA nesmí odhalovat správné odpovědi v UI před odevzdáním a po odevzdání má ukazovat pouze chyby a správnou odpověď u těchto chyb.
5. Listening: 2 přehrání ovládá učitel; studentský klient nemá přehrávač. Dva písemné úkoly hodnotí učitel 0/1; celkový návrh známky teprve po hodnocení obou. Reload musí zachovat známky v místní relaci.
6. Export CSV je lokální, neobsahuje jména ani texty studentských odpovědí, není ověřeným školním záznamem. Vyzkoušet čitelnost v Excelu i bezpečnost CSV formula injection.
7. Prohlížeče: Chromium, WebKit a Firefox včetně mobilních viewportů, keyboard-only a focus; fyzická UAT Windows Chrome/Edge/Firefox, Android Chrome, iPhone Safari a iPad Safari (Split View/Slide Over) musí být v závěrečném protokolu označena **NOT TESTED**, dokud ji učitel reálně neprovede.
8. Učitelský QA rozcestník `self-check/test-banks/index.html` musí dát pravdivý stav všech 138 návrhů, nezpřístupnit neplatné banky a s přepnutím jazyk/CEFR ukazovat skutečně správný obsah.
9. Všechny původní public practice soubory a produkční katalog musí zůstat identické vůči R31; žádné neodsouhlasené publikování Draft bank v ostré nabídce.

### Vykazování
- `AUDIT_SUMMARY.md`: počty (138 bank, 1 344 položek), PASS/WARN/FAIL/NOT_TESTED s přesnými důkazy.
- `FINDINGS.csv`: každý konkrétní problém po jedné položce, přesný `bankFile` a `questionId`.
- `PROPOSED_PATCHES.md`: konkrétní náhradní texty, odpověď a opora ve zdroji bez hromadných nepřezkoumaných náhrad.
- `REGRESSION_REPORT.md`: spuštěné příkazy a CI SHA, seznam podporovaných zařízení vs. NOT TESTED.
- `RELEASE_DECISION.md`: jednoznačné GO / CONDITIONAL GO / NO-GO **pro další učitelskou přejímku**, nikoli automatické oprávnění publikovat.

Nezaměňovat „všechny soubory existují“, „validátor vrací true“, „CI zelené“, „autorsky navrženo“ a „didakticky schváleno“; jde o pět různých stavů.

## Klíčové odkazy v checkoutu
- `language-skills-hub/version.json`, `data/cards.json`, `data/test-mode-policy.json`
- `self-check/test-banks/reading/<topic>/<lang>-<CEFR>.json`
- `self-check/test-banks/listening/<topic>/en-<CEFR>.json`
- `self-check/test-banks/index.html` a `dashboard.js`
- `self-check/test-banks/reading/preview.js`, `listening/preview.js`, oba `test-bank-core.js`
- `self-check/session/attempt-core.js`, `session-ui.js`
- `self-check/results/grade-core.js`, `export-core.js`
- `tests/r35-content-coverage.cjs`, `r41-complete-reading-120.test.cjs`, `r39-consolidated-independent.test.cjs`
- `docs/R39-CONSOLIDATED-DRAFT-COVERAGE-AND-NEXT-STEPS.md`

**Závazná stop-podmínka:** po auditu nejprve opravit nálezy a znovu provést testy; pedagogické schválení vlastníkem a fyzická UAT před veřejným studentským nasazením. Nikdy nedeklarovat serverovou bezpečnost, kterou GitHub Pages nemá.
