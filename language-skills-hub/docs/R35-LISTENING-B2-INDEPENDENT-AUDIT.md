# R35 – nezávislý Listening Test EN/B2, Harrison Ford (pracovní referenční draft)

## Didaktické parametry
- **Cílová úroveň:** B2, **věk/ročník:** vyšší gymnázium, cca 16–19 let.
- **Cíl aktivity:** porozumět významovým souvislostem autentického projevu, interpretovat důvody mluvčího, příspěvek dalších lidí a přenos sdělení do situací.
- **Orientační čas:** 18 minut po zahájení, učitel ovládá dvě kompletní přehrání. Ověřit pedagogicky podle skutečné délky nahrávky.
- **Pro slabší:** samostatně vypracovaná A2/B1 banka s přiměřenou formulací, delší čas nebo pomoc s instrukcemi **před zahájením**; pro silnější C1/C2 s hlubší interpretací a náročnějšími modelovými situacemi.
- **Rozsah:** 6 nových MC objektivních otázek po 1 bodu + 2 písemné odpovědi, které učitel po odevzdání manuálně ohodnotí 0/1. Celkem 8 bodů. Návrh známky 1–5 až po dokončení celé učitelské kontroly, nikoli automaticky.

## Oddělení od procvičování
Původní `poslech/harrison-ford/index.html` se nemění. Nezávislá banka používá původní schválenou nahrávku ovládanou učitelem, ale nové znění zadání a jiný počet/strukturu úloh. Správnost klíče je momentálně autorsky odvozena z původního referenčního obsahu a **musí být znovu ověřena přímo proti zvukové nahrávce**, nikoliv pouze proti cvičné kartě. Stejný motiv jako v procvičování není automaticky porušením nezávislosti, ale pouhé parafráze existujících otázek je potřeba při auditu odstranit.

## Obsahové odpovědi – auditní kontrolní matice
| Otázka | Schopnost | Klíč | Obsahový důkaz |
|---|---|---|---|
| 01 | Interpretace humoru o předčasném ocenění | B | Mluvčí považuje kariéru za pokračující |
| 02 | Důsledky obtížného profesního začátku | D | Patnáctiletý boj o průlom, tesařina mezi rolemi |
| 03 | Význam kolektivu v době studií | A | Divadelní komunita mu pomohla najít směr |
| 04 | Filmařina jako kolektivní dílo | C | Poděkování hercům, režisérům, scénáristům a štábu |
| 05 | Etická odpovědnost úspěšného člověka | B | Otevírat příležitosti ostatním |
| 06 | Přenos významu příběhů na školní divadlo | D | Emocionální spojení a společná zkušenost |
| W1 | Humor i vděčnost – příklady a význam | 0/1 učitel | Dva konkrétní prvky, ne jen obecné tvrzení |
| W2 | Význam sounáležitosti pro profesní orientaci | 0/1 učitel | Vztah college theatre a hledání směru |

## Technické vlastnosti
- `self-check/test-banks/listening/ll-harrison-ford/en-B2.json` – vlastní verze, stav `DRAFT_PENDING_TEACHER_CONTENT_APPROVAL`, `published:false`.
- `test-bank-core.js` – kontroluje počet, ID, 4 možnosti, odpovědi, krátké podklady a hash původní karty; skóruje jen 6 objektivních položek do doby, než učitel ručně ohodnotí W1/W2.
- `preview.html?timer=18&attempt=r35teacherpilot` – izolovaný studentský náhled pouze pro lokální či CI QA, **ne v produkčním katalogu**.
- Nahrávku přehrává učitel, student nemá tlačítko ani zabudovaný přehrávač. Aplikace nereprodukuje nelegálně žádnou nahrávku a nevyžaduje kameru/mikrofon.
- Stav časovače, odpovědi a známky 0/1 zůstávají lokálně v prohlížeči; po reloadu stejné relace se obnoví. Po odevzdání se zobrazí pouze nesprávné objektivní odpovědi a učitelský formulář pro písemné části.
- Po úplném manuálním hodnocení lze stáhnout **anonymní a NEOVĚŘENÝ CSV přehled**. Nepřenáší studentské písemné odpovědi.
- Při neplatném hash původní HTML karty nebo při chybném published flag se náhled zablokuje (žádný fallback).

## Nepřekročitelné podmínky
1. Návrh musí projít přesné Node a Chromium/WebKit testy i nezávislou lingvistickou kontrolu původního projevu.
2. Je třeba učitelsky schválit četnost přehrávání, limit 18 minut, 8bodové hodnocení, kritéria W1/W2 a CEFR B2.
3. Z R35 nelze vyvozovat kvalitu testů pro jiné úrovně či témata; ty vyžadují vlastní banky.
4. Kontrola reálného Androidu, iPhonu a iPadu má vlastní UAT; automatický mobilní viewport ji nenahrazuje.
5. **DRAFT / NO MERGE / NO PUBLICATION.** Pravé výsledky a klíče nejsou na veřejném GitHub Pages technicky utajitelné; pro důvěryhodnou zkoušku se použije GIT/backend.
