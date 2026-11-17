# Plural – Stage v3 / NO-GO for production

This stage branch is based on the current **main** (R70 at time of staging). Production main is unchanged. The original diverged branch `feat/lsh-plural-cards` is retained as WIP history.

## Scope

- New `konverzace/plural/index.html` with 3 languages DE/ES/FR, levels A1–C2, 8 stations per level, 10 ordinary + 3 EXTRA flip-cards per station (1,872 items).
- `data/cards.json`: one additional `cl-plural` entry with **explicit `cardType: "grammar-flashcards"`** so this engine can be distinguished from the 22 existing Conversation Lab cards.
- `data/catalog-i18n.json`: new CS/DE/ES/FR catalog metadata. The language exception is local to this card.
- `version.json`: stage-only internal count/hash reconciliation (34 topics, 702 variants; new card hash `91ce4932293f7d9bf8019816d04835024c422badd2352f88ee8f235a8c8387e0`). This is **not** an official new release identity.
- New scoped `tests/plural-grammar-contract.test.cjs`: grammar schema, inventory, localizations, CSP, and shared vocabulary contract. No existing tests were weakened or modified.

## Key integration correction

The stock `assets/lsh/v3/card-bridge.js` uses the first `<b>` in each `#vocabGrid .vocab-item` as the **saved term** and the first `<span>` as its definition. The previous candidate displayed `singular → plural` in that `<b>`, causing an invalid composite dictionary lemma.

The staged card saves only the singular with article; the plural is rendered in a separate `.plural-form` element. A conservative `CZ_GLOSSARY.recommended` map provides 1,358 unambiguous Czech senses across DE/ES/FR, leaving ambiguous glosses as explanations.

## Verified

- Local isolated HTML static tests: **25/25**; editorial regression: **35/35**.
- Chromium interactive tests via `page.set_content`: **104/104**.
- Full 144-station DOM/content test: **1,873/1,873**.
- Separate scoped Node test against a **synthetic one-card catalog fixture**: **5/5**.
- Staged HTML Git blob matches the byte-for-byte locally tested integration HTML: `c6a5b85aa7a6e792f91ebe02f441fefdfe50b13e`.
- Branch comparison with main: only Plural card, scoped catalogue/i18n/version updates, tests and WIP documentation.

## Not yet verified – blocking release

1. Legacy full-repository CI tests currently assume exactly 22 Conversation Lab cards with one engine, 33 total topics and 684 variants. Their assertions must be updated **narrowly** to keep all old-engine invariants for the original 22 cards and to test Plural separately. Do not disable tests, blanket-ignore errors or replace static checks with weaker counts. Full CI has NOT been run in the actual GitHub repository.
2. Real hosted browser E2E, including `?practice=1&lang=es&level=B2&zamek=1`, actual `card-bridge.js`, IndexedDB persistence/reload, cross-browser/assistive technology QA. The local Chromium runtime **blocks localhost and external navigation**; `page.set_content` cannot prove hosted behavior or durable IndexedDB.
3. Independent expert review of all ES/FR EXTRA explanations, B1–C2 syllabus, disputed countability and Czech glosses. `editorial_approval.json` remains **false** in all gates; no approval is implied by passing structural tests.
4. Official version/hash/revision regeneration via existing repository pipeline, complete old-card regression and explicit owner release authorization.
5. Staged catalogue entry must not be deployed/merged without owner approval.

**Decision: NO-GO.** No PR, merge or production deployment was performed.
