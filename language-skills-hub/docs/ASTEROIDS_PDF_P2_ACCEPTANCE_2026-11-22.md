# Asteroids PDF — P2 release acceptance (2026-11-22)

## Scope
R-03 printed attribution/non-affiliation; R-04 full-byte regeneration parity and unexpected-file rejection. Base production commit: `b80f062c70202a7f7339e6bc4d4a5fd30783d48d`. Changes proposed only through PR #156.

## Required evidence / not all complete yet
- [x] Developer committed timestamp-aware full PDF-byte SHA-256 comparator for all 96 assets, masking exactly 14 digits of one CreationDate and ModDate.
- [x] Local unit tests: six checks for metadata-only differences, binary image changes, arbitrary byte changes, malformed or missing timestamps, and input immutability.
- [x] Developer made print `@page` margin carry (1) British Council thematic inspiration, (2) PDF preparation by LSH/Gymnázium Ostrava-Hrabůvka, (3) explicit non-affiliation disclaimer, without asserting all texts are independently school-authored.
- [x] Generated 96 PDF assets on the feature branch via GitHub Actions; actual CI and visual acceptance to be recorded below.
- [ ] Last human-triggered PR HEAD `pdf-scope`, `unit`, `browser`, `corpus`, `pdf-release-gate` PASS.
- [ ] Inspect rendered A4 PDFs across EN/ES/DE/FR, first and final page with two-line margin footer; verify no overlap/clipping, no new blank sheet; grayscale readability.
- [ ] Full canonical bytes match when regenerated; corrupted image stream mutation is rejected; stray non-PDF file is rejected.
- [ ] Mark draft PR as Ready and merge only after certification and owner-directed release decision.

## Legal and physical limitations
- Printed provenance names **PDF processing/distribution** by LSH / Gymnázium, **not** certified authorship of all text and questions or copyright permission. Original rightsholder evidence was administratively marked `not_planned` in issue #154, not cleared.
- Mobile/iPad/Android/Edge and school printer physical tests are NOT VERIFIED. Computer-generated greyscale checks do not substitute for physical school printer.
- All work is static. No server, account, external inference API or changes to the student-facing tests/grading.
- P3 issues on EN C1/C2 text page density and B1 answer spacing remain separate.

## CI references
- Workflows: `.github/workflows/lsh-reading-pdf-release-gate.yml`, `.github/workflows/lsh-reading-print-assets.yml`.
- Keep the exact latest PR SHA and required gate run recorded in PR comments; do not trust a prior SHA's success.
