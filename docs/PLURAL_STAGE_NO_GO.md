# Plural – staging V4 / NO-GO for production

## Scope and isolation
- Branch: `feat/lsh-plural-cards-r70-stage`; production `main` unchanged.
- Branch was merged **from** latest `main` at commit `b7489a349d0d0fa7b4d56dcfdb44e2ad95c92905`; no main commits missing.
- `cl-plural`: `grammar-flashcards`, DE/ES/FR, A1–C2, 144 stations, 1,872 items.
- Stage-only catalog contains **34 topics / 702 variants**; main remains **33 / 684**.
- The original 22 standard Conversation Lab cards keep their common engine and own regression assertions.
- Existing language card JavaScript and shared LSH modules are unchanged; only scoped catalog/manifest metadata, new Plural HTML, tests, and non-production docs have been added or updated.

## Verified in real GitHub Actions
Baseline merge-from-main commit: `b7489a349d0d0fa7b4d56dcfdb44e2ad95c92905`; latest tested browser-test commit: `615d92b1d60f55ca686af63bcafcbcd6aba27b45`.  
Latest GitHub Actions run: https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/actions/runs/44166766786 (commit `615d92b1d60f55ca686af63bcafcbcd6aba27b45`, all checks passed)

| Suite | Pass | Fail |
|---|---:|---:|
| Legacy Node regression (all non-browser Node tests) | 291 | 0 |
| Plural-specific Node contract | 5 | 0 |
| Plural HTTP browser tests in Chromium and WebKit (including keyboard focus and controls) | 8 | 0 |
| Catalog and CEFR badges browser regression | 2 | 0 |
| Shared vocabulary across original/new cards and IndexedDB | 4 | 0 |
| Non-graded public Reading/Listening actions | 6 | 0 |
| Legacy Reading/Listening results browser regression (historically misnamed Node-style file) | 6 | 0 |
| Listening Studio responsive regression | 4 | 0 |
| **TOTAL** | **326** | **0** |

The CI uses an actual local HTTP server in GitHub Actions and real Playwright Chromium/WebKit browsers. This is NOT a check of the public GitHub Pages domain. This browser suite is *targeted*, not every browser test in the repository.

## Specific verified behaviors
- Teacher-selected `?practice=1&lang=es&level=B2&zamek=1` has UI-only lock and correct language/level; unsupported `lang=en` does not force an invalid lock.
- All supported languages render 10+3 cards and B1–C2 grammar challenges; desktop/mobile layout and card flips/EXTRA work.
- Existing `card-bridge.js` saves an individual singular lemma from `#vocabGrid .vocab-item b`; plural is a separate visual line.
- Canonical browser IndexedDB `lsh` persists the saved word after reload; My Vocabulary displays it in both Chromium and WebKit.
- No browser page errors or CSP errors in tested paths. Keyboard regression also validates Enter/Space card flips, arrow focus navigation, EXTRA keyboard operation and Escape on the timer editor in Chromium and WebKit.
- Stage commit graph is ahead of latest `main` and not behind it. No PR, merge **into** main, or deployment.

## Non-negotiable blockers
1. Independent native-language/editorial review of ES/FR EXTRA notes (212 rewritten generic explanations), questionable countability and Czech glosses, and B1–C2 CEFR grammar progression. The review queue contains 961 prompts for manual inspection, NOT 961 confirmed errors.
2. `authoring/editorial_approval.json` in the source handoff keeps **all four approval booleans false**. Do not switch them without expert evidence.
3. Browser evidence does not include the public GitHub Pages deployment origin, every desktop/mobile OS, keyboard/screen-reader audit, or all 60+ historical browser test files.
4. An official release version and content integrity regeneration, publisher approval, and merge to main have NOT been authorized.

## Claud(e) independent review handoff
See `docs/PLURAL_CLAUDE_STAGE_V4_REVIEW.md` in this branch. Reviewer must provide separately justified language and integration verdicts.

**Overall release decision: NO-GO (pending independent editorial approval).**
