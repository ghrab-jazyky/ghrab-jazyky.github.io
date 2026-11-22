# Asteroids PDF – P3 final polish and release acceptance

Date: 2026-11-22. Based on Claude's `LSH_Asteroids_POSTRELEASE_audit_Claude_2026-11-21.txt`.
Baseline `main`: `47d33af5de74e258c6047295456c1d8678e90042` (P2 released). This PR affects only the teacher-facing Asteroids PDF package, print/export UX, and the two dedicated PDF workflows.

## Implemented in this candidate
- **R-05 layout:** special compact print typography for EN C1/C2 text-only, preserving 11pt Georgia. Require reading-layout QA on the **new actual PDFs**, especially EN C1 practice-text/test-text and EN C2 test-text. Long final pages must not have only 3–6 lines.
- **R-06 writing room:** B1 (all four languages) restores a 20pt answer line and 70pt ruled reflection block (~3 lines) while tightening the inter-question gaps, not shrinking the reading font. Darken answer/reflection lines for grayscale legibility. EN B1 all must not gain an orphan page.
- **R-07 reuse warning:** teacher PDF selector explicitly states that practice/test questions are identical and that they should not be used sequentially for grading the same group. No change to the actual questions or student test.
- **R-08 release procedure:** see approval steps below; use the required status check, never bypass a ruleset or force push.
- **R-09 provenance:** record the installed `hyphen` version in the PDF manifest instead of hard-coding it.
- **R-10 recovery:** keep manifest-based download links, but warn that manifest is not an HTTP existence check; expose a per-mode/per-format backup print preview even when manifest lists the PDF.
- **R-11 cache:** append a digest-derived `?v=` query parameter to the static same-origin PDF links so a refreshed manifest does not reference a cached older PDF.
- **R-13 actions maintenance (PDF workflows only):** Node24-based `checkout@v5`, `setup-node@v5`, `upload-artifact@v6`; disable automatic package-manager caching where not needed. Other LSH workflows are not changed here.

## Deliberately separate from this PDF-only PR
- **R-12 linguistic review:** ES C1 Q4–6, Q13 and FR C1 Q6 require content/distractor review, plus answer keys and student test consistency. Changing these in a PDF-layout PR would risk silently changing already published graded tasks. Open a separate content-review issue with exact editorial acceptance tests before editing the source.

## IMPORTANT: bot and GitHub Actions check approval (R-08)
1. On a `feature/lsh-asteroids-pdf-*` branch, changing the source CSS/HTML/generator automatically starts `lsh-reading-print-assets.yml`. It regenerates all 96 PDFs plus manifest and commits only on the feature branch.
2. A `github-actions[bot]` commit may trigger a `pull_request` workflow that requires a human to select **Approve and run** in the GitHub Actions UI. Until the exact PR HEAD is tested, do NOT merge.
3. After the robot changes the HEAD, record the new full HEAD SHA. Verify `pdf-release-gate` **SUCCESS on this HEAD**, including `unit`, `browser` and `corpus` (and `pdf-scope`). Approve a run if GitHub asks; do not call an old green run proof of a new commit.
4. If an unapproved run expires, use a manual permitted workflow dispatch, or a new reviewed source/doc commit to trigger a fresh run, never a force push or direct `main` update.
5. Once approved and visually checked, merge via protected PR. Verify the post-merge `main` SHA, GitHub Pages build/deploy, and a fresh production PDF release gate.
6. A test failure is NO-GO until diagnosed and remedied; do not weaken checks to force success.

## P3 GO conditions
- [x] Bot regenerated and committed exactly 96 PDFs with an updated manifest (branch robot commit `4a1fd8696ad41f28cc01de8dd93cf36f9c37b713`; confirm that the final PR head still contains it).
- [ ] Exact current PR HEAD passes `pdf-scope`, `unit`, `browser`, `corpus`, `pdf-release-gate`.
- [ ] EN C1 practice-text/test-text and EN C2 test-text: no nearly empty final page; readable 11pt font, no clipping, correct paragraphs.
- [ ] EN, ES, DE, FR B1 `practice-all` and `test-all`: writing room ~3 ruled lines, 20pt answer lines; no extra/orphan page; print grayscale contrast satisfactory.
- [ ] Dialog shows explicit warning; PDF links include expected SHA-derived version; a missing PDF has a visible print-preview fallback for the same mode/format (without additional API requests).
- [ ] Browser tests in Chromium and WebKit confirm the new links, warning and fallback.
- [ ] Verify no student scoring, question data, language variants, gesture locks or graded test behavior changed.
- [ ] No unauthorized rights claim; British Council non-affiliation/footer remains as in P2.
- [ ] After merge, GitHub Pages and exact-merge-SHA PDF gate both pass.

## External limits
Physical school grayscale printer, actual Edge/Windows, Safari/iPad, Chrome/Android, and full legal provenance attestation remain unverified by automated checks. Record those independently; an emulator cannot certify actual equipment.

## Final P3 pagination decision (after automated asset regeneration)
- Robot regenerated the 96-variant corpus on `01605013b9a37099deeb01d5841d044f47f34e6e`. This bot-origin commit triggered a PR run requiring approval. The current human-reviewed acceptance update will request **a fresh exact-HEAD PR release gate**; no approval bypass or direct main push is permitted.
- Verified directly from committed PDF page-tree objects: **EN C1 practice-text 1, test-text 1; EN C2 practice-text 2, test-text 2**. EN C2 intentionally uses a paragraph-boundary page break for a balanced, readable continuation rather than a cramped one-page sheet.
- **B1 practice-all** remains exactly three pages in EN/ES/DE/FR; EN B1 test-all remains three pages, with full 20pt answer space and 70pt reflection lines in the new CSS.
- Reproducible PDF binary parity, last-page content density and actual raster QA on the new artifact remain mandatory. Do not declare release GO solely from the page counts.

## Early binary geometry check (pre-CI approval)
- On the regenerated branch at robot commit `4a1fd8696ad41f28cc01de8dd93cf36f9c37b713`: EN C1 practice-text and test-text = **1 page** each (was 2). EN C2 practice-text and test-text = **2 pages** each, so the last-page content-density assertion requires independent CI review; no claim of final R-05 PASS yet.
- EN/ES/DE/FR B1 `practice-all` = **3 pages** each; EN B1 `test-all` = **3 pages**. Writing-space geometry still requires PDF visual inspection.
- Run the exact-HEAD gate after this meaningful acceptance-document update. If bot-origin workflow is awaiting GitHub authorization, approve the run explicitly; do not bypass rulesets.
