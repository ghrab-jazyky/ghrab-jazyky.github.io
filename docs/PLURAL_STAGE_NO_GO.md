# PLURAL – staging V5 / NO-GO pro produkci (17. 11. 2026)

## Bezpečný rozsah změn

- **Zdroj pravdy:** větev `feat/lsh-plural-cards-r70-stage` v repozitáři `ghrab-jazyky/ghrab-jazyky.github.io`.
- **Produkční `main` beze změny.** Stav větví je nutno znovu porovnat před integrací; při poslední kontrole měl staging 5 commitů k doplnění z `main`.
- Staging katalog: **34 témat / 702 jazykových variant**. Produkční katalog: **33 / 684**.
- `cl-plural`, typ `grammar-flashcards`: DE/ES/FR, A1–C2, 8 stanic/úroveň, 10 MAIN + 3 EXTRA/stanici = **1 872 kartiček**.
- Původních 22 Conversation Lab karet používá dál původní engine. Žádné změny sdílených `assets/lsh/`.
- Stávající obsahové schvalovací příznaky jsou **FALSE**; nic nebylo sloučeno do main, publikováno ani označeno za schválený release.

## Opravy V5 podle nezávislého auditu Clauda V4

- **P1-L01:** nově napsáno 168 vysvětlení EXTRA (84 ES + 84 FR); konkrétní slovní nebo gramatický jev místo původní univerzální šablony. Autorské přepisy v `authoring/plural/notes_es_v5.tsv` a `notes_fr_v5.tsv`.
- **P1-L03:** nově napsáno 67 gramatických výzev (32 ES, 32 FR, 3 DE C2). Zbývajících 29 DE B1–C2 výzev je původních a čeká na nezávislou kontrolu; soubor `authoring/plural/tasks_v5.tsv`.
- **P2/P3:** doložené opravy španělských akcentů (`turrón/turrones`, `belén/belenes`), `arroz/arroces`, části duplicit, shody a českých významů, znění pravidel a oslovení v ES/FR.
- **P2-D03:** seznam doporučených slov zobrazuje singulár a českou glosu, ale **skryje plurál**, dokud není příslušná MAIN kartička otočena; otočení zpět plurál opět skryje. `Otočit všechny`/vrátit všechny mění všech 10 řádků konzistentně. Sdílený slovníček stále ukládá pouze singulárové heslo.
- **P2-T01:** neaktivní strana flip karty je skrytá přes CSS `visibility`. Lokální DOM test tuto skutečnost ověřil; **nezávislý axe-core WCAG 2.2 AA audit zůstává otevřený**.
- **Build:** `authoring/plural/{content.json,glossary.json,template.html,build.cjs}` je reprodukovatelný a CI porovnává bajtovou shodu. Staging `version.json` obsahuje aktualizovaný obsahový hash.
- Evidence 328 cílených datových změn: archiv `PLURAL_LSH_WIP_V5_HANDOFF_2026-11-17.zip` předaný vlastníku projektu. **328 změn není totéž jako 328 ověřených jazykových chyb.**

## Ověřené testy

Staging HTML SHA-256: `ded6d2d62e441cddab8b33a87533ccf6bad02892defb727ec9efa974444a2b75`.

**GitHub Actions, commit `c1a6b340b211ce77fdf76cf9e6917a2070b470d6`:**  
https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/actions/runs/44176813222

| Kontrolní sada | Výsledek |
|---|---:|
| Plural Node kontrakt včetně individuálních přepisů | 6/6 PASS |
| Všechny Node statické regrese repozitáře | 292/292 PASS |
| Plural HTTP browser testy Chromium/WebKit, včetně skrytých plurálů | 10/10 PASS |
| Katalog a CEFR browser testy včetně EN původních 22 karet | 2/2 PASS |
| Společný slovníček / IndexedDB | 4/4 PASS |
| Public Reading/Listening links | 6/6 PASS |
| Historická výsledková browser sada | 6/6 PASS |
| Listening studio responsive regrese | 4/4 PASS |
| **Celkem** | **330/330 PASS** |

Doplňkové izolované lokální testy: 9/9 statických a 969/969 Chromium DOM kontrol na 144 stanicích. Reálné browser CI běží proti lokálnímu HTTP serveru v GitHub Actions, **nikoliv na publikované doméně GitHub Pages**. Nejde o všechny historické browser testy repozitáře.

## Neuzavřené blokery – důvod NO-GO

1. **P1-L02 – obsahová gradace B1–C2 ES/FR:** většina MAIN slov má stále základní plurálové štítky. Orientační heuristika počítá v 80 MAIN kartách/úroveň: ES B1 78, B2 80, C1 77, C2 70; FR B1 76, B2 78, C1 75, C2 76. Tyto počty vycházejí jen z klasifikace štítku, nikoli z normativního CEFR hodnocení; potřebují důkladný lidský jazykový audit a přepracování hlavních karet.
2. Native-speaker / pedagogická kontrola všech nových ES/FR EXTRA vysvětlení, pokročilých úloh, sporných substantiv a českých glos – **neprovedeno**.
3. Axe-core WCAG 2.2 AA, skutečný iPhone Safari a Android, všechny historické browser testy – **neprovedeno**.
4. Synchronizace stagingu s nejnovějším `main`, oficiální nové release označení, učitelský changelog a vlastníkovo finální schválení – **neprovedeno**.
5. Všechna čtyři schvalovací pole v `editorial_approval.json` zůstávají `false`; neměnit bez důkazů.

**Celkový verdikt: NO-GO pro produkční nasazení.** Technická regrese stagingové verze je úspěšná; jazykové schválení a didaktická gradace dosud nejsou uzavřené.
