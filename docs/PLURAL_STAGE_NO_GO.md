# PLURAL – staging only / NO-GO

New branch based on current `main`. The staged catalog has `34` entries vs `33` on production, with `cl-plural` exposing only `de/es/fr` × `A1–C2` (18 variants). This is a review candidate, not approved content.

Release blockers: independent DE/ES/FR language + pedagogy signoff, review editorial queue, browser E2E of hosted LSH shared IndexedDB vocabulary/teacher UI lock and mobile accessibility, update version.json topic/variant counts + contentHashes/revision through the official build pipeline, full repository regression, owner approval. No merge, PR, production publish, or approval flags before these are complete.

The current card saves a singular lemma in `<b>` and displays its plural separately, matching the existing v3 `card-bridge.js` contract. The generated glossary contains conservative recommended Czech meanings for unambiguous terms; ambiguous Czech glosses remain explanations rather than asserted translations.

Test evidence from isolated Chromium: static 25/25, editorial regression 35/35, interactions 104/104, all-station DOM 1873/1873. Localhost and external navigation are blocked by the QA runtime. Hosted end-to-end tests have **not** passed and are **not** claimed.

Main unchanged. Older, diverged source branch remains preserved as historical WIP.
