# Language Skills Hub – R7: nezávislé QA bez předplatného Clauda
**Datum:** 8. listopadu 2026 · **Repo:** ghrab-jazyky/ghrab-jazyky.github.io · **DRAFT PR #27**  
**Publikace:** NO MERGE · žádný přepis main, schválených referencí ani soukromých učitelských klíčů.

## 1. Conversation Lab (R6)
- 21 ověřených kandidátů, EN/ES/DE/FR × A1–C2 = 504 variant, 4032 stanovišť, 16 128 hlavních/doplňujících otázek.
- První heuristický screening vytkl 4 španělské A1 otázky se subjunktivem; opravy byly aplikovány **pouze v R6 kandidátech**, s novými SHA-256, Git blobs a CSP hash.
- Následný screening těchto konkrétních kategorií: 0 otevřených nálezů. Meziúrovňová QA matice otestovala 420 přechodů CEFR a nevykázala hromadně identické otázkové sady nebo přesné duplicity slovní zásoby.
- Automatická data ukazují rostoucí průměrnou délku otázek A1–C2; **to nedokazuje správnost CEFR, přirozenost DE/FR ani úplné pedagogické schválení**.
- Skripty `tools/r6-content-audit.cjs`, `tools/r6-pedagogy-matrix.cjs`; CI výstupy `lsh-r6-independent-content-screen`, `lsh-r6-cross-level-content-matrix`.
- Claude ZIP export zůstává volitelným CLI nástrojem, **neprovádí se automaticky při každém commitu**.

## 2. Reading Lab (R7)
- Ověřeno všech pět Reading témat: jedna reference Asteroids v2.3 a čtyři další čtecí karty.
- 5 originálních studentských HTML beze změny; 120 jazykových/CEFR variant, 1800 úloh a 2000 doslovně ověřených evidence úryvků. Chybějící doslovné evidence: **0**. Sémantická správnost odpovědí a externí učitelský klíč z toho neplynou.
- Automatický audit původních zdrojů: 16 sad Multiple Matching se dvěma otázkami na stejný odstavec, 15 příliš stručných vysvětlení (nutno posoudit podle typu úlohy), 10 EN délek mimo orientační doporučení v3.5.
- Čtyři původně hlášené duplicitní možnosti byly **falešné pozitivní**: `sure` a `sure!!` nejsou ekvivalentní pro pragmatickou úlohu; audit nyní zachovává význam interpunkce.
- Opravy 16 matching zadání připraveny **v jedné koordinované dávce pro dvě karty**: `An Email from a Friend` (4 jazykové varianty) a `Instant Messages` (12). Každá cílová otázka nově odkazuje na ověřený třetí odstavec.
- Generátor `tools/reading-r7-candidates.cjs` a přesný návrh `data/reading-r7-matching-proposals.json`: zdrojový blob předem ověřen, změněno pouze 16 objektů otázek v pracovních kopiích, všechny 24 sad na B2/C1/C2 mají nyní tři různé odpovědní odstavce.
- Kandidátní HTML vznikají **pouze jako artefakt GitHub Actions**, nejsou commitována do veřejných studentských cest a nejsou vydána. Soukromé učitelské klíče musí být před vydáním synchronizovány.
- Délky EN *Can Mistakes Help Us Learn?*: 184/214/271/333/342/400 slov na A1/A2/B1/B2/C1/C2. Náročnější úrovně potřebují odborně promyšlenou práci s textem; nezvyšovat délku mechanickým paddingem bez revize klíče.
- *Plastic in Our World* obsahuje více žánrů; katalog jej nesmí zavádějícím způsobem označovat za filmovou recenzi na všech šesti úrovních.
- CI výstupy: `lsh-reading-five-content-evidence-qa` a `lsh-reading-r7-16-matching-repairs-candidates`.

## 3. Listening Lab (R7)
- Tři existující zdrojové karty ověřeny proti Git blobs, EN A1–C2 = **18 variant**.
- **Matthew McConaughey v3** má tři explicitní fáze, Written Evidence i Reconstruct the Speech.
- **Harrison Ford v6 a Peaky Blinders v2** mají podobné datové položky (`gist`, `detail`, `facts`, `open`, `sequence`, `vocab`), ale stále nemají sjednocené třífázové studentské UI podle Matthew. Tento rozpor je skutečný, nestačí změnit URL/QR.
- Harrison obsahuje legitimní `type:multi` otázky se dvěma správnými volbami. Nález `OBJECTIVE_QUESTION_INVALID` byl opraven ve validátoru, **nikoliv** změnou těchto správných úloh. Kontrolují se nyní typy single i multi.
- Harrison postrádá části lokalizovaných pomůcek `beforeHelp`/`talkHelp`. Je třeba rozhodnout, zda doplnit obsah na všech úrovních, nebo transparentně skrývat nepoužitelné ovladače.
- Peaky Blinders vyžaduje věkovou přejímku a skutečné ověření klipu; žádná média nebyla stažena ani přehrána v auditu.
- Dva nově dodané materiály `TED Conlangs` a `How to Choose Your News` stále nejsou součástí 29karetního pilotu; první obsahuje šest úrovní, druhý původně jen B2/C1 a potřebuje nově vytvořené úrovně.
- Skript `tools/listening-reference-parity.cjs`; CI artefakt `lsh-listening-matthew-v3-parity-audit`.

## 4. Důležité vydávací brány
1. Všechny položky katalogu jsou nadále technické piloty; `teacherApproval:false`, `Testování:not-ready`, DRAFT.
2. Nezávisle posoudit významovou správnost otázek, úrovně CEFR, pedagogickou vhodnost a u poslechů shodu s reálně dostupným médiem.
3. Po validaci Reading kandidátů dořešit bezpečné aktualizace soukromých učitelských klíčů; žádný klíč do veřejného repozitáře.
4. Sjednotit dvě starší poslechové karty podle Matthew v3 a integrovat dvě další dodané studentské karty podle příslušného kontraktu.
5. Dokončit samostatnou kratší testovací variantu každé dovednosti a schválit její pravidla.
6. Fyzická přejímka Android, iPhone/iPad Safari, školní Wi-Fi, studentská QR, offline ZIP a lokální osobní slovníček.
7. Sloučení do `main` až po výslovném schválení. Nikdy nepřevádět automatický PASS na pedagogické schválení.

## 5. Praktické odkazy
- PR: https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/pull/27
- R6 CI matice: https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/actions/runs/42446386814
- Reading + Listening R7 CI: https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/actions/runs/42446806240

**Stav této etapy:** reprodukovatelné, bezplatné, zdrojově vázané kontroly všech tří dovedností zavedeny; skutečné opravy konverzačních variant R6 i kandidáti 16 úloh Reading R7 připraveny. Kompletní obsahová přejímka a sjednocení Listening zůstávají nedokončené.
