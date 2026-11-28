# Christmas Quest JP5b — checkpoint 2026-11-28

**Status: integrated v0.9.0 source persisted; catalog gate PASS; isolated Chromium harness pending at last observation; NO-GO for production.**

## Authoritative recovery
- Branch: cq/japan-v0.9.0-jp5b. Original baseline d8d032ee1fc51a009df3d20d8fb64135f9b23be3.
- Candidate source commit: adfeae9179158ef7a1d541d18309c2ccd2b72aff. This is the exact code under test; later documentation-only commits do not replace it.
- Exact user-uploaded recovery archive: docs/christmas-quest/jp5b-recovery/INTEGRATION_HANDOFF.zip.b64, stored at commit 40b37aebd2f312abfd9cb72409637531c6dfcda2; Git blob 8241b493500742f5909a827b0a43537a7cbef229. Decode with base64 -d; original ZIP SHA-256 80e13ea8f58c3a3dc61745fd488cbf9444247e8767c5eb2da731a446f4d8b7b8.
- Approved source JP5a SHA-256 1155be298079e37d8d64b4cc20a401cd0b50c1e7878c36fff77f8ccb33f9053a. Integrated child SHA-256 0ce40f4d57a71730f45d391f95b478d0126cca3ac1e6e43625146875d4dd096b.
- Full candidate SHA-256 7f29f1048e3c6a53c8bc621ff98559cf32bb52948c5d13643afc69606c269d96; gated runtime CSP hash tswruc8n3IZ5HGCdHFVpAYaFWGRJbgeuCUwhJjgXErw=. Two independent build routes produced matching candidate hashes. GitHub Actions Python builder and runtime JS syntax passed; exact source and synchronized version/catalog-test/documentation pins persisted.
- GitHub Actions run 46156226979: https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/actions/runs/46156226979. Recovery build, persistence, existing catalog release test and Chromium preparation PASS. Real isolated browser harness and evidence upload: check latest job status; do not assume pass.
- Local checkout and local HTTP are blocked (DNS, ERR_BLOCKED_BY_ADMINISTRATOR). Large connector write failed. Use existing GitHub Actions for builds; avoid repeated failed routes.

## Historical evidence (from exact uploaded archive, not newly executed)
- JP5a: 48/48 variants, 1056/1056 controlled fixture checks, 0 JS errors and 0 external requests; not natural uninterrupted gameplay/physical device certification.
- JP5b reducer: 2595 assertions, 48 variants; archived static source/CSP checks PASS. Source and child hashes matched. No need to rerun unchanged hash-matched tests absent a specific reason.
- Other previous-thread reports without exact candidate provenance are not treated as certified.

## Next action
1. Inspect actual workflow run and evidence. Resolve any Chromium harness failure with targeted changes, then persist code and test evidence tied to exact hashes.
2. Reconcile with current main before complete LSH gate. At observation main=2bd5812d58158e2e5c6b32d6c0719cec0abd9e01, 31 commits ahead of old common base, 174 changed files; overlap with JP5b modifications is language-skills-hub/version.json. Do not overwrite concurrent LSH changes; merge/rebase in isolated development branch, retaining all unrelated current pins. Re-check actual latest main before doing so.
3. Full LSH build and regression, natural gameplay, lock, CSP, offline/network, persistence, other missions, replay/reset and migration/rollback. Physical iPad/Safari requires real device evidence or explicit limitation. Teacher changelog without invented release date.
4. Final release gate; explicit owner approval required for merge or deployment. Developer lock retained.

## Working rules
ChatGPT implements and audits. No Codex. Claude only on explicit owner decision. Persist exact source after meaningful checkpoints, compact reports in repository; avoid duplicate certs, scope creep and repeated technical failure. Keep recovery archive outside allowlisted LSH publish path. No new runtime network requests. This document and original archive are sufficient for next thread; no reupload required.
