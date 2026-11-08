# Language Skills Hub R10 — jedna sada všech 29 karet k obsahové přejímce

**Stav:** DRAFT / NO MERGE / NO DEPLOY / NOT APPROVED / NO STUDENT GRADING.

Dřívější R8, Reading R7 a Listening R7 kandidáti byli rozděleni
do několika CI archivů a pro Conversation chyběly společné runtime
závislosti. R10 vytváří jeden kontrolní ZIP všech 29 témat.

## Obsah

| Dovednost | Počet | Výukový obsah k posouzení |
|---|---:|---|
| Conversation Lab | 21 | R8 obnovený původní obsah, 7 přesných A1 a 5 cílených jazykových návrhů |
| Reading Lab | 5 | R7 Email/Instant (16 matching oprav a 1 vysvětlení) a 3 nezměněné originály |
| Listening Lab | 3 | R7 třífázový Harrison/Peaky a nezměněný Matthew v3 |

Rozbalte ZIP a otevřete soubor **index.html**. Každá karta má přímý
odkaz a označený zdroj. Pro offline Conversation jsou přibaleny
všechny potřebné soubory v assets/lsh/. Manifest obsahuje SHA-256
všech 29 HTML a checklist jednotlivých témat je v REVIEW_CHECKLIST.md.

**Žádný soukromý učitelský klíč není součástí ZIPu.**
Externí Listening média nejsou přibalena; vyžadují internet.

## Spuštění a testy

.github/workflows/lsh-r10-unified-review.yml vytváří **GitHub Actions
artifact**, nikoliv veřejně publikované studentské stránky. Druhý job
ověřuje prohlížečový offline průchod 29 tématy v Chromium i WebKit.
Nejde o fyzickou přejímku Android / Safari.

Lokální spuštění (mimo repozitář):

    node zkusebni/tools/r10-unified-review-bundle.cjs /tmp/lsh-r10-review

Generátor odmítne zapisovat do samotného repozitáře.

## Vydávací brány

1. **Conversation:** pedagogické schválení 504 variant a 12 přesných
   cílených změn (7 A1 + 5 dalších). Zachovat tematický Support.
2. **Reading:** potvrdit 16 úloh a 1 vysvětlení, opravit a validovat
   neveřejné učitelské klíče mimo GitHub Pages.
3. **Listening:** ověřit dostupnost externích klipů a věkovou vhodnost
   Peaky Blinders, zejména vulgarity a agresivní výhrůžky.
4. **Testování:** 642 návrhů nejsou schválené testy. Neznámkovat.
5. **UAT:** reálný Android, iPhone/iPad Safari, QR, slovníček,
   offline a školní síť.
6. **Vydání:** PR #27 ponechat DRAFT; main ani zdroje neměnit
   bez výslovného schválení.

Automatický technický PASS není pedagogické schválení.
