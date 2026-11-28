# Christmas Quest JP5b — checkpoint

Updated 2026-11-28. Status: **BLOCKED: candidate bytes unavailable in current session. NO-GO for production.**

## Authoritative repository state
- Repository: ghrab-jazyky/ghrab-jazyky.github.io
- Development branch: cq/japan-v0.9.0-jp5b
- Verified before this documentation commit: main and development branch identical at d8d032ee1fc51a009df3d20d8fb64135f9b23be3; zero source changes.
- This checkpoint is documentation only, not integration or certification. Keep main unchanged; retain developer lock. Production release requires explicit owner approval.

## Prior evidence (reported by previous sessions; not independently reproduced here)
- JP5a v0.6 SOLO/PAIR completed and accepted in prior workflow.
- JP5b v0.9.0 candidate (six destinations) assembled locally, not committed.
- Most recent reported artifact: CQ_JP5b_RECONSTRUCTED_CANDIDATE_20261128.zip (30 files, approx. 10.2 MB).
- Earlier artifacts: CQ_JP5b_CERTIFICATION_HANDOFF_20261128.zip; CQ_JP5b_INTEGRATION_HANDOFF.zip.
- Prior report: 48/48 reducer variants, 2,595 unit assertions, 4,711 integrated application assertions, 2,832 simulated communication/lifecycle assertions, 107 static checks. Report also says 10,245 total new passes; counts are not independently verified and must not be added across potentially overlapping campaigns.
- Prior reports cite syntax, graphics, key functionality, CSP and rollback checks as passed. Actual test artifacts, candidate SHA-256 and exact source tree are not accessible in current session.
- Do not equate simulated browser behavior with real browser E2E or claim release certification from these reports.

## Next action (P0)
1. Recover the exact latest candidate ZIP (prefer the reconstructed candidate named above) from the owner's previous conversation or owner-provided upload. Do not rebuild JP5a/JP5b from scratch.
2. Check archive integrity, manifest, hashes and match the candidate against the pinned base. Preserve previous evidence; mark any missing provenance as unverified. Review diff for scope, dev-lock and unintended changes. Persist the actual candidate in development branch before further extended work, provided it is valid and safe to commit; record the exact resulting commit/tree and artifact SHA-256.
3. Reuse earlier test evidence only when its input version can be matched; rerun changed/affected checks. Real browser E2E, integration/LSH regressions, developer-lock behavior, mobile/iPad compatibility, teacher changelog remain open. No unapproved publication date.
4. Save compact results as machine-readable files tied to the exact candidate. Perform final release gate and await owner approval. Do not merge/deploy production.

## Working rules
- ChatGPT implements, tests and audits. No Codex. Claude only on explicit owner decision.
- Repository checkpoints are authoritative. Persist source and results after meaningful milestones; keep this state current.
- Avoid duplicate tests of unchanged, hash-matched components; final full regression remains required.
- At most two failed attempts via the same technical route; then use a materially different available method or report a concrete blocker. Keep logs in files, concise summaries in chat.
- No scope creep, no additional runtime network requests, no weakening of existing pedagogical, graphic, security, or functional requirements.
- Never mark a test PASS without evidence. If repository write is unavailable, package exact source, manifest, current results and next action for transfer.

## Handoff trigger
If the candidate bytes remain inaccessible, ask for **one** latest archive only; do not ask for previous chats or multiple redundant archives. The state above is sufficient to resume once candidate is recovered.

## Recovery build (2026-11-28)
Candidate rebuilt from the exact user-uploaded archive with the original Python builder, independently matched against connector-built candidate SHA-256 7f29f1048e3c6a53c8bc621ff98559cf32bb52948c5d13643afc69606c269d96. Source and release pins persisted to the isolated branch. Developer lock retained. NO-GO for production: real browser/full LSH regression and owner approval remain outstanding. Historical tests are not fresh certification. No Codex or Claude used.
