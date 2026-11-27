# F1 technical pilot – audit checkpoint

Baseline: fde581f864093a0b87d60afbc552e5c4e021e7e5. Implementation commit: ff55189fb7666a7452d2cc4e75ffd61ed7dfaf4b. Scope: verified rl-asteroids EN/B2 Reading self-check only; no deploy. Other 23 variants and other topics keep legacy feedback in F1.

## Observed evidence
- Actual source, bank and candidate core evaluated in isolated JS with an injected SHA-256 implementation (known-answer test abc), not native browser Web Crypto: 93/93 answer states, 72/72 report comparisons, 5/5 negative cases, exact original HTML after stripping the one appended bank. Syntax parse of three edited JS files passed. Candidate card 1,442,967 UTF-8 bytes / 1,367,113 JS characters; original 1,421,182 / 1,347,053. Candidate SHA-256 8865189403becf1feb76b9ae9dfb3b05ac0361f762fe0261ababbe8341b5f343.
- Browser, native Web Crypto, real device, timer/guard/annotation/corpus and independent content review not certified by the above. Browser harness is provided for evidence. Full HTML hash changed intentionally; F3 must update published integrity metadata and verify/regenerate 96 print PDFs via canonical process. Do NOT merge, publish, weaken integrity checks or substitute this pilot for F2–F4.
- Rollback development branch by standard revert of F1 commits if necessary; no main change.
