# Language Skills Hub — independent TEST content completion matrix (R35)

**Date:** 10 November 2026. **Status:** UNAPPROVED CONTENT DRAFT, NO MAIN MERGE.  
**Baseline:** production R31, GitHub Pages static-only, no backend or verified school grades.  
**Source of truth:** `language-skills-hub/tests/r35-content-coverage.cjs` generates machine-readable 138-row coverage.

## Planned scope derived from the live catalogue

| Skill | Themes | Languages | CEFR | Planned independent test banks |
|---|---:|---:|---:|---:|
| Reading | 5 | EN, ES, DE, FR | A1–C2 | 120 |
| Listening | 3 | EN only | A1–C2 | 18 |
| Conversation | 21 | — | — | 0 — school static-mode decision R22 forbids a Test action |
| **Total** | | | | **138** |

## Content status at R35

| Reading topic | EN | ES | DE | FR | Draft banks | Questions |
|---|---|---|---|---|---:|---:|
| Can Mistakes Help Us Learn? | A1–C2 | A1–C2 | A1–C2 | A1–C2 | 24/24 | 240 |
| Asteroids | missing | missing | missing | missing | 0/24 | 0 |
| Plastic Ocean | missing | missing | missing | missing | 0/24 | 0 |
| An Email from a Friend | missing | missing | missing | missing | 0/24 | 0 |
| Instant Messages | missing | missing | missing | missing | 0/24 | 0 |
| **Reading total** | | | | | **24/120** | **240** |
| Listening: Matthew Oscars | — | — | — | — | 0/6 | 0 |
| Listening: Harrison Ford | — | — | — | — | 0/6 | 0 |
| Listening: Peaky Blinders | — | — | — | — | 0/6 | 0 |
| **Whole project** | | | | | **24/138 drafts, 114 missing** | **240** |

**No variants are pedagogically approved** merely because schema, score and browser tests pass. Do not represent 24 draft banks as 24 classroom-approved tests. No test bank is linked from the public student catalogue.

## Reference architecture implemented

1. A single source-verified Reading assessment preview can load `?topic=...&lang=...&level=...&timer=20&attempt=...`. The query is validated against the public catalogue; sources are constrained to approved catalogue entries and SHA-256 matches the R31 manifest.
2. Each authored independent bank has its own JSON file `self-check/test-banks/reading/<topic>/<lang>-<CEFR>.json` with an exact original `sourceTitle`, versioned status `DRAFT_PENDING_TEACHER_CONTENT_APPROVAL`, evidence paragraph for every answer, original question IDs, four candidate answers, and a review explanation.
3. The same established R30 timed session, autosave, interruption and four-corner return logic drives the test; students see no correctness feedback before submission. R31 scoring remains an unverified local proposal.
4. Each bank is assessed for syntax, matching source title and content hash, valid answer indices, independently labelled questions, correct 10-point scoring, and no accidental public activation.
5. Chromium/WebKit smoke tests run across languages and levels in a mobile viewport, including submitting nine correct and one wrong answer. The original practice cards remain unchanged.
6. CI publishes a JSON inventory of all 138 expected variants; absence of a bank is explicit and not represented as success.

## Content requirements for all remaining independent banks

- Original test questions must match the **actual text or legal audio source** for that language and level, not be copied from practice or blindly translated from a longer English passage.
- A1/A2 require simple, accessible instructions and realistic distractors; B1/B2 more inference and application; C1/C2 rhetorical reasoning, nuance and evaluation.
- For each bank include a uniquely defensible correct answer and source evidence; no outside facts necessary to answer. Avoid accidental extra correct distractors and language beyond the claimed CEFR.
- Listening needs its own **teacher-controlled two-playback protocol**, reviewable written responses and distinct listening test content; do not copy its larger practice exercise bank. Do not invent dialogue or transcript quotations that cannot be checked against the original recording.
- Reconcile time/point scales and grade thresholds with the teacher's established school rules before official use. A ten-item 10-point test has coarse 10-percentage-point increments.

## Production and audit gates

Until all remaining variants exist, **the independent-content rollout is not functionally complete**. Even when the content matrix reaches 138/138, do not publish without:

- Independent linguistic and pedagogical audit (Claude + teacher) per CEFR and language.
- Browser and physical-device tests on Android, Windows, iPhone and iPad; split-screen visibility detections are only advisory.
- Privacy/security assessment and no new student identity collection or network submission.
- Verified control that direct public catalogue links expose only expressly approved tests; private teacher keys must never enter static pages.
- Explicit teacher sign-off and a versioned release PR separate from this draft.

The current task is to **finish content first, audit second, deploy last**. This document and the machine-readable inventory prevent the team from mistaking a valid QA infrastructure for a finished test corpus.
