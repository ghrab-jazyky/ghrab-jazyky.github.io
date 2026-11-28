# F5.1 integration correction — no deployment

Previous candidate: d6d6b8542c1fb58794d7fe37109f9fc89988a20a
Production: d8d032ee1fc51a009df3d20d8fb64135f9b23be3
PR: #182 (draft). Initial broad PR regression: 21/35 workflow PASS, 14 failure.

- R23/R25/R58: explicitly verify summary with no feedback before consent, then full errors-only legacy cardinality and existing score/session/archive/security assertions after opt-in. Non-Asteroids behavior unchanged. R58 live gate distinguishes byte-verified previously published source from current source because Pages publication is separately authorized.
- R73: reviewed exact shared PDF-report blob 2ca55784edbf97d70269ee7e53b77474f1e18665; original blob 460908927f4e23b4eeb1c653cb2aa4990bbbff19. Only additive bounded logo preparation, local download and reuse of identical savePdf body. Other E4 blob pins unchanged.
- Six broad static workflows: full Git history for historical exact-SHA integrity tests; no assertions removed.
- R35 browser: complete disjoint test inventory unchanged, full history, actual pinned baseline worktree/server on port 8766 for parity test and explicit server readiness.
- F3 historical corpus writer: superseded by read-only approved-delta + original committed-corpus regeneration parity. No automatic candidate rewrites after F4.2.
- Teacher changelog WebKit ResizeObserver error: one intermittent failure in PR, prior exact F4 passed. Hub/PWA/changelog runtime is unchanged compared with production. No suppression, no claim of fixed browser defect; strict baseline and candidate replay added. If reproducible, diagnose separately. Existing complete strict changelog tests retained.
- New F4: includes legacy R23/R25/R58, R73 and strict replay. All original F4 suites retained; new PR runs and exact-head evidence required.

No product runtime, card data, scoring, PDF assets, published changelog or deployment changed in this commit. No production authorization. F0 evidence limitations, physical device acceptance, external independent sign-off (or explicit owner waiver) and release date remain open.
