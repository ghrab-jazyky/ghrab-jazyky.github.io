# LSH R5F — celoplošný strukturální audit Conversation Lab a výchozí inventář Reading/Listening
**Datum:** 7. 11. 2026 · **Větev:** `feat/lsh-r5-reference-pilot-catalog-2026-11-07` · **PR:** #27 (**DRAFT**).

## 1. Výsledek Conversation Lab

Prošli jsme zdrojové studentské HTML všech **21** současných konverzačních témat (1 reference „Umělá inteligence“ + 20 dalších). Nepoužívaly se odhady z katalogových anotací: pro každý zdroj byl nezávisle parsován skutečný `const CONTENT = {...}` a ověřena struktura pro 4 jazyky × 6 CEFR úrovní.

- **20/21 konverzačních témat** splňuje kontrolovaný strukturální vzor reference: všech 24 variant, 8 stanovišť, 3 doplňující otázky na stanoviště, 12 výrazů slovní zásoby, 4 jazykové opory, Support/Challenge/Stretch a na vyšších úrovních Explain. To zahrnuje referenční AI a **19 nereferečních kandidátů**.
- Původní konverzační HTML nadále využívají již existující `?lang`/`?level` a UI `?zamek=1` (skript `assets/lsh/v2/lock.js`) a moduly `model.js`, `store.js`, `card-bridge.js`.
- **19 nereferečních kandidátů** je nyní viditelných v odděleném *technickém pilotním katalogu* spolu se třemi referencemi: **22 položek**. Původní HTML ani jejich obsah se nezměnily.
- Samostatný offline export těchto 19 karet je poctivě zakázán, neboť mají další lokální závislosti. Odkaz a QR fungují jako pilotní online sdílení. Testovací varianty zatím nejsou vyrobené.
- **Učitel zatím neschválil 19 karet jako jazykově/CEFR bezchybné a připravené k výuce.** Strukturální kompatibilita není totéž co pedagogická přejímka.

## 2. Zadržená karta: Škola — španělská A1

**Konkrétní nález:** V `zkusebni/konverzace/skola/index.html` (Git blob `f3d609bcd021ef812fb4821140a58b26bcc140fe`) je doslovně zopakována doplňující otázka:

- Stanoviště 1 „**Mi instituto**“ → otázka 1: `¿Es grande o pequeño?`
- Stanoviště 8 „**Mi instituto ideal**“ → otázka 1: `¿Es grande o pequeño?`

Anglická varianta tuto otázku kontextově rozlišuje (`Is your school big or small?` vs. `Is it big or small?`); španělská verze se takto navíc opakuje. **Návrh** vhodného odlišení na stanovišti 8: `¿Tu instituto ideal es grande o pequeño?` – zachovává velmi jednoduchou konstrukci A1 a výslovně odkazuje k ideálnímu institutu.

**Stav:** Návrh zaznamenán v `data/unification-tracker.json`. **Dosud není implementován** ani učitelem schválen. Karta Škola není zařazena mezi 19 ověřených pilotních kandidátů; její zdroj zůstal beze změn. Ostatních 23 variant této karty mělo požadovanou strukturu a nebyla detekována jiná doslovná duplicita tohoto typu.

## 3. Výsledky automatických kontrol

Nové CI `LSH reference integrity` ověřuje:
- tři referenční originály (SHA-256 a zachovaná data) plus tři integrační kopie;
- všech **19** původních CLB HTML (Git blob SHA-1, inline CSP hash);
- každou z **456 variant** 19 konverzačních kandidátů: 8 stanovišť, 24 doplňujících otázek, slovní zásobu, opory, vyplněnost, vnitrovariantní duplicity a výstupy pro B2–C2;
- všech **22** katalogových záznamů a jejich skutečnou validaci;
- **510** kombinací pevného odkazu (21 vícejazyčných karet × 24 variant + jedna EN poslechová × 6) a **22** volných odkazů;
- žádné nově zveřejněné učitelské klíče, žádný nový student login.

Kontrola `LSH reference integrity` má po opravě překlepu v Git blob kontrolním otisku úspěšný běh (commit `7b2a656448b922069573c103a4cd88d80d5616eb`, run `42352271509`). Ostatní regresní workflow na tomto commitu v čase kontroly ještě běžela; do hlavní větve se zatím nic neslučuje.

## 4. Technický průzkum dalších dvou laboratoří (zatím bez migrace)

Zdrojové veřejné náhledy:

| Laboratoř | Kandidát | Blob | Klíčový integrační rozdíl |
|---|---|---|---|
| Reading | Can Mistakes Help Us Learn? | `ca88591cbe890d6166605f5133486f5fc17a865e` | Čte jazyk a úroveň z URL, ale nemá UI zámek `zamek=1` |
| Reading | Plastic Ocean — Film Review | `444c7f027fb6f4c0fb9170aecf085363f90b5da3` | Stejné; nutný strukturální/pedagogický audit oproti Asteroids |
| Reading | Email to a Friend | `9178645eaa2d4fcd522a8a52bf2cd4741dfce05f` | Stejné |
| Reading | Instant Messages | `274140b4799bfaef6125063e554b86d741d01289` | Stejné |
| Listening | Harrison Ford v6 | `f816dbbbc2d9d2e7fc5b7a4c40d9e7dcfb331dbc` | EN A1–C2, zatím bez studentských `URLSearchParams` a zámku |
| Listening | Peaky Blinders v2 | `cfda1197882b8107ddce2f80665abd681526efc5` | EN A1–C2, stejné; před výukou navíc nezávisle ověřit věkovou vhodnost scénky |

Čtecí karty mají přibližně 1,2–1,4 milionu znaků a vestavěné víceúrovňové čtecí úlohy. Zámek a procvičovací kontrakt bude nutné přidat do samostatných integračních kopií, stejně jako u Asteroids. U poslechů je nutné nejen zprovoznit URL/QR, ale také **obsahově přeuspořádat pedagogickou strukturu** podle tříposlechové reference Matthew tam, kde to konkrétní zdroj umožňuje. Mechanicky kopírovat otázky ani počty nelze.

## 5. Definitivní význam stavu

- **Hotovo jako technický pilot:** katalog 22 položek; tři URL-integrace referencí; 19 strukturálně kompatibilních původních Conversation témat; přesné volné a pevné URL/QR; kontrola obsahu proti základní struktuře; nová CI brána.
- **Nedokončeno:** oprava „Škola“, skutečná migrace 4 Reading a 2 Listening témat, nezávislá jazyková a pedagogická revize, offline export starších CLB, oddělené kratší Test sady, fyzická mobilní UAT a pedagogické schválení všeho.
- **Počty:** 29 celkových existujících témat → 22 v technickém pilotu / 7 mimo pilot (1 Škola + 4 Reading + 2 Listening).
- **Nevydávat** 22 technických náhledů za 22 schválených výukových karet.

**Kontrolní zdroje:** `data/unification-tracker.json`, `data/reference-pilots.json`, `tests/reference-integrity.cjs`.
