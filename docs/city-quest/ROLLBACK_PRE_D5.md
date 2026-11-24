# City Quest D5 rollback reference (not a deployment)

- Pre-release production baseline: 92c955686750729a1747379077987539c9093435
- Certified release candidate: 10baa3e2358fec631cac59133b0d6b38e26b3ffa
- This rollback tree is constructed from the complete old baseline. It retains the exact candidate Pages publisher and allowlist builder, exact-byte Reading integrity helper, approved R12 Asteroids digest, D3 integrity test and sharded R35 runner (72-file baseline inventory floor). It does not retain new City Quest code/tests because the previous runtime is deliberately restored.
- Old City Quest SHA-256: 34c6bb2662e2684c5808abab2519f6df2343c04a99948bfb82241101b51f41d0
- All other application runtime, PWA, PDF, data and other cards are inherited byte-for-byte from baseline. The manifest's only change against baseline is the verified Asteroids full-byte digest. No production changes or deployment from this branch.
- If the released main tree is still exactly 10baa3e2358fec631cac59133b0d6b38e26b3ffa's tree, a rollback PR from this branch can restore the prepared baseline runtime while keeping publishing infrastructure. Reconfirm main, diff, required checks and owner authorization before merge. Never force-push or reset main. If main changed further, construct a targeted forward rollback instead of reverting unrelated work. Rebuild and recheck actual rollback main SHA; dispatch publisher on main only with explicit approval. Verify HTTP hashes and public URLs afterward. If deployment fails before new release goes live, do not overwrite the previous live site unnecessarily.
- CI proof is required, not assumed. This is a technical rollback candidate, not approval to deploy it.
