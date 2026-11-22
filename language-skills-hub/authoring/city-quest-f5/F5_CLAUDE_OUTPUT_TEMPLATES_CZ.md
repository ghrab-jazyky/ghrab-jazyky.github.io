# Claude F5 — povinná osnova výstupů a rozhodnutí

Zachovej **přesnou identitu auditovaného SHA**. Každý závěr musí mít ověřitelný důkaz (soubor, řádek, příkaz, screenshot, skutečná prohlížečová reprodukce).

## Soubor 1 — CLAUDE_F5_VERDICT.md

- Identita: datum, commit, repo/branch, stav CI a artefakty včetně SHA-256.
- Rozsah: co bylo otevřeno, co bylo vykonáno, co chybělo.
- Krátký executive summary.
- P0/P1/P2/P3 soupis s počty; P0/P1 blokují releas.
- Technická certifikace zvlášť (`PASS / FAIL / NOT TESTED`), lidská jazyková přejímka zvlášť, fyzické device/VoiceOver/TalkBack zvlášť.
- Oddělené závěry **„Pokračování vývoje“** a **„Produkční nasazení“** (GO / CONDITIONAL GO / NO-GO).
- Návrh pořadí oprav s konkrétními regresními testy.

## Soubor 2 — CLAUDE_F5_FINDINGS.csv

Hlavička:
`finding_id,severity,domain,language,cefr,mission,mode,path,line,original_excerpt,problem,proposed_fix,repro_steps,test_proposal,release_blocker,status,evidence_link`

Závažnosti:
- **P0:** únik dat, externí request, vážná chyba izolace/hodnocení či bezpečnosti
- **P1:** zásadní nehratelnost, ztráta stavu, chybný výsledek trasy, neprůchodnost přístupnosti
- **P2:** obsahová či UX chyba s reálným dopadem
- **P3:** drobný styl a konzistence

Neplň řádky pouhým `n/a`; každý nález musí umožnit reprodukci.

## Soubor 3 — CLAUDE_F5_LANGUAGE_REVIEW.csv

Přesně 256 řádků = jedna ku jedné proti úplnému originálnímu registru `F4_256_variant_release_review_matrix.csv`.

Ponech 4 původní lidské sloupce beze změny jako `PENDING` a přidej:
`ai_linguistic_status,ai_pedagogy_status,ai_evidence,ai_reviewer,reviewed_at,uncertainty`.
Možné AI statusy: `PASS`, `FAIL`, `NEEDS REVIEW`, `NOT TESTED`.

U každého zvlášť pracuj s tím, zda jsi četl kompletní jazykovou variantu, skutečně dohrál zadání nebo jen prohlížel texty. `NOT TESTED` není chyba, je to pravdivá evidence.

## Soubor 4 — CLAUDE_F5_TEST_EVIDENCE.md

Každý reálně provedený test: přesný příkaz, verze runtime/OS, počet PASS/FAIL, čas, digest vstupu, screenshot/artefakt. Neodvozuj vlastní testy z cizího logu. Rozliš `OVĚŘIL JSEM` vs `PŘEVZAL JSEM DŮKAZ`.

## Soubor 5 — CLAUDE_F5_RELEASE_PLAN.md

- Opravy seřazené podle priority, rizika a závislostí.
- Pokrytí 256 lidských položek, plán fyzických zařízení, VoiceOver/TalkBack, 200% skutečného zoomu.
- Plán minimální integrace z **aktuálního main**, **nikoli** slepý merge historické větve o 270 commitech.
- Cross-app regresní plán GIT/LSH, rollback, jasný soupis „před podpisem vlastníka“.
- Přesný stav F5 bran G1–G7.

**Finální ochrana:** souborová revize a testy jsou vhodné pro nezávislou technickou kontrolu, ale nenahrazují nativní jazykový podpis, fyzické zařízení ani finální souhlas vlastníka.
