# PLURAL V6 – Implementation and audit closure (18. 11. 2026)
**Status: EDITORIAL CANDIDATE / NO-GO for production.** Source branch `feat/lsh-plural-v6-editorial`. No merge/deploy. This report is not a native-speaker or independent pedagogical certificate.

## Educational scope
- DE / ES / FR; A1–C2; upper-secondary (15–19 years).
- Learning aim: identify and form plurals in authentic noun phrases, select variants according to meaning and register, explain the morphological/semantic change, apply forms in communicative sentences.
- Time: typically 10–15 minutes per station (methodological estimate).
- Differentiation: **weaker students** choose 5 cards with visible rule, model sentence and Czech gloss; **stronger students** complete all 10 MAIN + 3 EXTRA and defend form/meaning/variant in two independent sentences. At B2–C2 encourage peer error correction and contextual explanation.

## What has been implemented in source data
- Original V5 technical and pedagogical fixes retained, including the 168 rewritten ES/FR EXTRA notes and 67 grammar tasks from V5.
- **160 curated ES/FR B1–C2 MAIN replacements:** 16 ES and 16 FR in each B1/B2, 24 ES and 24 FR in each C1/C2. Better distribution of invariable nouns, spelling/accent shifts, noun apposition, compounds, collective/semantic plurals, and register-sensitive variation. The replacements were editorial decisions, *not* mechanically matched to CEFR percentages.
- **64 station-specific MAIN speaking/writing prompts** (8 stations × 4 levels × 2 languages), replacing generic “use six plurals” instructions.
- **96 station-specific grammar challenges:** 29 residual DE generic tasks replaced in V6. Two ES C1 challenges updated to remain coherent with changed MAIN content.
- DE B1 rule -or, DE B2 rule -tum, DE C1 weak masculine rule corrected; 48 empty DE EXTRA morphology badges conservatively filled.
- Specific audit lexical/semantic fixes: ES/FR Epiphany fixed as a festival name with plural of `celebración/célébration`; ES `paladar`; FR `palais`, `flambée`, `critique musicale`, `solennité`, `encens`, `délicatesse`, `beau-fils`; DE `Brauchtum`; ES/FR `toponimia/toponymie`.
- FR A1 EXTRA `le riz` replaced by countable `le pois → les pois` with explanatory sentence. ES A2 `hobby` replaced by native `afición → aficiones`. `maníes / manís` contextualized. FR elision gender badges for `héritier/héritière`.
- Source of truth: `authoring/plural/content.json` and `glossary.json`. Exact V6 ledgers: `notes_es_v6.tsv` and `notes_fr_v6.tsv` (144 each), `tasks_v6.tsv` (96). V5 ledgers preserved as historical evidence. `V6_CHANGE_MATRIX.tsv` identifies every changed authoring field.
- Static integrity preflight: 144 stations, 1 872 entries, 0 duplicated MAIN singular entries within a station, complete card fields and 0 under-length EXTRA notes.

## Audit register disposition
Audit findings AUD-01..AUD-23 have a **source remediation proposal applied** where applicable; none is independently closed by a human proof. See `PLURAL_V6_AUDIT_DISPOSITION.md` and `V6_CHANGE_MATRIX.tsv`. 
- **AUD-01 / AUD-19:** didactic redesign applied, but CEFR alignment and lexical selection remain subject to independent assessment; do not equate a higher ratio of complex plurals with a formal C1/C2 certificate.
- **AUD-02..AUD-18, AUD-20..AUD-23:** targeted edits implemented, specific normative evidence is cited in the audit. Where a variant is disputed or rare, independent dictionary/native review is still required.

## Technical and release gates
1. Run `node language-skills-hub/authoring/plural/build.cjs --check`, `node --test language-skills-hub/tests/plural-grammar-contract.test.cjs`, `node --test language-skills-hub/tests/plural-v6-editorial.test.cjs`, `node --test language-skills-hub/tests/plural-v6-didactic.test.cjs`; then the full Node test suite.
2. Run HTTP Playwright Chromium and WebKit suites from `.github/workflows/lsh-plural-stage-qa.yml`; run every historical browser regression in a fully prepared environment.
3. Independently check all 1 872 items (lemma, gender, plural variants, meaning, Czech gloss, morphology/CEFR, contextual appropriateness) and all 90 rules / 96 tasks, logging evidence and reviewer identity.
4. Run axe-core WCAG 2.2 AA, keyboard and screen-reader checks, plus actual iPhone Safari and Android tests; test return focus and IndexedDB.
5. Compare/rebase against the newest production `main`; ensure unchanged original 22 Conversation engine, correct catalog/version hashes, and publish a validated teacher changelog.
6. Authorize release explicitly. `editorial_approval.json` deliberately keeps all four signoff flags **false**, and `release_authorized: false`. Do not turn these on based only on AI audit or CI.
   
## Known limitations
- This AI-assisted editorial pass uses independent source sampling and mechanical checks but is not a line-by-line normative human check of 1 872 words or a classroom pilot.
- The 2026-11-18 original audit explicitly rated overall release NO-GO. Implementation alone does not change that verdict. All four signoff gates remain open.
- Source representation includes potential region/register constraints that require a competent reviewer, especially medical, legal and rare plural meanings.

## Normative reference anchors
Duden (Motoren/Motore, Eigentume, Kontinente, Brauchtum): https://www.duden.de/sprachwissen/sprachratgeber/Deklination-von-Substantiven-auf-or ; https://www.duden.de/rechtschreibung/Eigentum ; https://www.duden.de/rechtschreibung/Kontinent .
Larousse (Épiphanie, beau-fils, solennité, ayants droit): https://www.larousse.fr/dictionnaires/francais/%C3%A9piphanie/30480 ; https://www.larousse.fr/dictionnaires/francais/beau-fils/8524 ; https://www.larousse.fr/dictionnaires/francais/solennit%C3%A9/73294 ; https://www.larousse.fr/dictionnaires/francais/ayant_droit/7205 .
Instituto Cervantes: https://cvc.cervantes.es/Ensenanza/Biblioteca_Ele/plan_curricular/niveles/02_gramatica_inventario_c1-c2.htm . RAE legal legitimate: https://dpej.rae.es/lema/leg%C3%ADtima/boe .
