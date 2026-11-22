# LSH City Quest — F5C: City 04/06, B2–C2 a jazykové opravy (2026-11-22)

**Branch:** `feature/lsh-city-quest-f5c-claude-remediation`  
**PR:** https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/pull/166  
**Tracking F5:** https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/issues/163  
**Release decision:** **DRAFT / NO-GO; `main` is unchanged.**

This is the *third authoring wave* after Claude's original `CLAUDE_F5_FINDINGS.csv` (32 findings, 0 P0 / 1 P1 / 19 P2 / 12 P3). It is **not** a second independent Claude review, a CEFR certificate or a real-device acceptance sign-off. Do not infer current CI success from earlier green SHAs.

## Implemented in this wave

### CQ-F5-008 — City progression (PARTIAL; authoring complete for sections below)

- **City 01:** 24 B2 inference prompts added to the previously authored 48 C1/C2 prompts, across EN/ES/DE/FR. Therefore **72 B2–C2 reception prompts** are authored and distinct from the original B1 formulations. Answers still map to the validated city-place IDs. Final vocabulary reflection remains level-specific in 24 EN/ES/DE/FR × A1–C2 variants (CQ-F5-027).
- **City 03:** 16 B2 visitor lines added to 32 C1/C2 lines, across the four states: opening, clarify, wrong, distance. Therefore **48 B2–C2 authored interaction prompts** are distinct from the original B1 narrator. Tourist model directions fixed earlier on A2/C1/C2.
- **City 04:** B2/C1/C2 map routes now require an additional *deterministic, grounded reason* before receiving mission-complete credit. B2 interprets relative turns; C1 verifies the Library waypoint and final north/west approach; C2 justifies avoiding the closed Station Road section while visiting the Library. The C2 map shows the road closure during this mission. A1–B1 retains the previously certified simple direction-following flow.
- **City 06:** formerly a two-choice repair at every level. A1–B1 preserves the existing two stages. B2 adds a reason for the contradiction between eastbound travel and turning right toward north. C1/C2 additionally select a tactful, unambiguous tourist-facing apology/reformulation. Wrong answers cannot advance; the 2/3/4-stage state machine lives in the pure engine, not only the DOM.
- **City 05/07:** prior-wave improvements remain: differentiated deadline/accessibility bus schedules; a real far-side meeting point around an actual street closure.
- **Remaining scope of CQ-F5-008:** not all C1/C2 urban station prompts and final models have original, human-verified pragmatic tasks. Route models in City 02/04/07 still rely on deterministic language templates, though the new City 04 *decision* is specific. Do not close the entire 008 finding without targeted native/didactic review.

### CQ-F5-013 and 018 — language P2 remedies

- **ES/DE tourist register:** `routeModel` uses the new localized `touristDirections` with formal **usted/Sie**. The student-facing `instruction` still uses **tú/du**. Updated A1/A2/B1 tourist sample imperatives. The intentional register distinction is a source-level invariant, not automatic determination of the real speaker.
- **Rose-garden labels:** ES **ROSALEDA**, FR **ROSERAIE**, not a single rosebush or the non-standard earlier variant.

### P3 quality remedies

- **CQ-F5-019:** Spanish map labels for Riverside Park, Sunrise Café and Post Office now match the exact place names presented in City 01.
- **CQ-F5-023:** ES/DE/FR U-turns use dedicated language-specific constructions, never ungrammatical concatenations of a normal `turn()` and a back-word.
- **CQ-F5-024:** learner-facing German metro terms in the localized metro pack consistently use **U-Bahn**.
- **CQ-F5-025:** FR success announcement and apology avoid unnecessarily fixed masculine gender; broader typography still needs editorial review.
- **CQ-F5-026:** French City 06 title changed to natural **« Oups ! Mauvaise direction »**. Native idiomatic QA across the rest of the app remains necessary.
- **CQ-F5-030:** every metro language shows an explicit note that the network diagram is *schematic and not north-aligned with the street map*. Station positions/graph were not modified.
- **CQ-F5-032:** visible spoken-checkpoint progress is localized as **0/1** (Metro 05–07) or **0/3** (Metro 08), not the misleading `0 Speaking checkpoints confirmed`.

## Verification evidence; limits

- Focused pure-engine checks passed on A1–C2 for graded City04/06 progression; wrong actions did not advance, correct ones did.
- Focused code-level checks passed for all **12** authored advanced City04 reasoning scenarios, **12** repair-content bundles, **72** high-level City01 clues, **48** high-level City03 dialogue strings and **24** City01 reflection texts.
- Checked programmatic tourist-route output: Spanish formal `Camine … Gire …` vs learner `Camina …`, German formal `Gehen Sie … Biegen Sie …` vs learner `Gehe …`; ES/DE/FR U-turns are grammatical. English and French source terminology remains coherent.
- Added GitHub CI pure regressions in `language-skills-hub/tests/city-quest-f2.test.cjs`, vocabulary/register/naming checks in `city-quest-f5c.language.test.cjs`, and full UI click-path checks in `city-quest-f5c.state.browser.test.cjs` (City 04: 12 EN/ES/DE/FR × B2–C2; City 06: 24 × EN/ES/DE/FR × A1–C2; plus City 01/03 B2–C2 and checkpoint statuses).
- **Browser CI is NOT certified as of authoring**. GitHub Actions were reporting queued jobs without a runner on recent exact-head commits. A queued run is neither PASS nor FAIL. Check the **latest PR #166 HEAD SHA**, not earlier SHA-only green certification, before deciding on integration.
- No new API, `fetch`, websocket, geolocation, speech capture, remote AI or student-data persistence.

## Required independent Claude follow-up

1. Compare the **current PR #166 HEAD**, not its superseded handoff archives, against all 32 original Claude findings. For each ID record `FIXED_BY_CODE`, `PARTIAL`, `NOT_FIXED`, or `HUMAN_GATE` with source paths, reproduction and an explicit test.
2. Independently assess accuracy and CEFR progression of **City04/06 B2/C1/C2**, the new B2 City01/03, all four spoken-correction registers and the actual Riverton graph coordinates. Does C2 demand genuine inference/mediation rather than mere longer sentences?
3. Review all EN/ES/DE/FR texts for tourist/student register, lexical nuance and naturalness; treat P3 idiom/typography as editorial approval requirements, not automatically certified because tests pass.
4. Run full current-head GitHub CI, **256 variant smoke coverage**, complete playable route regressions including **City04/06 in all languages**, iPhone/Android/iPad + 200% text/split view and actual screen-reader checks. Record real device OS and screenshots; emulator results are a separate evidence class.
5. Verify 4-language product consistency: the City and Metro worlds are schematic, map overlays accurately reflect state, reference gallery remains learner-hidden and is **not a security boundary** (offline source is public).
6. Return a second independent findings matrix with exact HEAD, evidence and a clear `GO/NO-GO` recommendation. Owner sign-off and safe integration into current `main` remain separate.

## Teaching-use scope (for teacher validation)

- **Levels:** CEFR A1–C2; advanced reasoning tested at B2–C2, extra pragmatic correction at C1–C2.
- **Age/grade:** gymnázium, approximately 15–19 years, adapted by CEFR rather than strictly by grade.
- **Activity aim:** interpret directions, orient using street/metro networks, resolve contradictory advice and explain a decision politely.
- **Estimated time:** 5–10 minutes per mission, depending on reading level and whether answers are practised aloud.
- **Weaker students:** A1/A2 explicit compass and shorter interactions; pair support and visible map.
- **Stronger students:** B2–C2 map-constrained choices, comparison, clarification and register-aware mediation; oral reflection is **self-assessed**, not machine-scored.

**Release gate:** original issue #163 must remain OPEN. Do not merge PR #166 or deploy to production without owner approval and fresh CI + human evidence.
