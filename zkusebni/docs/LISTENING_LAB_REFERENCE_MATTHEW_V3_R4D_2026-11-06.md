# Listening Lab — referenční karta Matthew McConaughey v3 (R4D)
**Datum:** 6. 11. 2026 · **Vlastník:** školní organizace `ghrab-jazyky` · **Stav:** veřejný TEST náhled, **nikoli schválený známkovaný test**.

## Volba referenčního poslechu

Učitel určil **Matthew McConaughey — Oscars 2014** jako referenční poslech a požádal o tři **výslovně samostatné** poslechy v procvičovacím prostředí. **Originální úlohy ani data klíče se nemění**; upravuje se struktura, označení částí, kontrola a metodika.

**[Otevřít referenční studentskou kartu v3](../reference/poslech/matthew-mcconaughey/index.html)**. Referenční HTML se nachází pouze pod veřejným `/zkusebni/reference/poslech/matthew-mcconaughey/`, stávající starší v1 zůstává dostupná v `/zkusebni/nahledy/poslech/matthew-mcconaughey/` kvůli srovnání a případnému návratu.

## Nové rozvržení

| Fáze | Účel | Kontrola |
| --- | --- | --- |
| Before Listening | Úvodní diskuse a predikce | Bez bodů |
| **First Listening — Listen for the Big Picture** | Gist, základní sdělení, nálada | Samostatné `Check First Listening` |
| **Second Listening — Listen and Interpret** | Detaily, interpretace a stavba sdělení | Samostatné `Check Second Listening` |
| **Third Listening — Written Evidence + Reconstruct the Speech** | Vlastní formulace odpovědí + řazení výroku | `Check Third Listening`: pouze pořadí automaticky; psaní učitel |
| **Optional — Language of the Speech** | Výrazy a jejich významy | Vlastní `Check Optional Vocabulary`, **mimo celkové skóre** |
| After Listening — Beyond the Speech | Diskuse a reflexe | Bez bodů |
| Check Your Understanding | Souhrn všech tří poslechů | `Check All Listening Tasks` |

Pojmy **First Listening** a **Second Listening** nahrazují původní nejednotná označení „First Listen“ / „Second Listen“. Každá fáze má vlastní přímý odkaz k opětovnému poslechu.

### Úrovně a bodové maximum automatického jádra

| CEFR | First | Second | Pořadí (Third) | Automatické jádro | Written Evidence (pouze učitel) | Volitelná slovní zásoba |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A1 | 3 | 4 | 3 | 10 | 3 | 4 |
| A2 | 3 | 5 | 4 | 12 | 3 | 4 |
| B1 | 3 | 6 | 5 | 14 | 5 | 5 |
| B2 | 3 | 6 | 6 | 15 | 5 | 6 |
| C1 | 3 | 7 | 6 | 16 | 6 | 6 |
| C2 | 4 | 7 | 6 | 17 | 6 | 6 |

Pozn.: C2 má v původním originálu **4 gist otázky**; záměrně jsme je bez pedagogického rozhodnutí nekrátili na tři. Úrovně A1–C2 označují obtížnost **úloh**, nikoli samotné autentické řeči.

### Pravidla vyhodnocování

1. Každý ze tří poslechů se dá vyhodnotit zvlášť. Změna odpovědi zruší pouze odpovídající předchozí kontrolu.
2. `Check All Listening Tasks` vyhodnotí všechny tři části dohromady. **Jediné automatické body**: gist + detail + správné pořadí.
3. **Written Evidence**: krátká fakta mohou být v určitých formátech rozpoznána, ovšem jako **orientační shoda**, nikoliv automatická správná známka. Jiná formulace může být správná. Interpretace a argumentaci hodnotí **výhradně vyučující** pomocí **soukromého učitelského klíče**.
4. Optional Vocabulary lze kontrolovat samostatně a nenavyšuje hlavní bodový zisk. `Beyond the Speech` nemá číselné hodnocení.
5. Stejná data se zachovávají v rámci otevřeného panelu přes sessionStorage, práci lze exportovat do TXT. Automatické odeslání učiteli ani identifikace studentů neexistuje.

## Integrita a bezpečnost

- Zdroj: uživatelem dodaný `Matthew McConaughey - Oscars.zip` se studentskou kartou v2, soukromým klíčem a kontrolní zprávou.
- Původní literal `DATA` je v nové v3 **bajtově identický**: SHA-256 `6b95af7f65ca5fd63032a1dc881be7e22937ec169280b4d9339bf12b58313fc6`.
- Referenční studentská v3 (101 767 bajtů): SHA-256 `403022392cbd045cef72ed3554960f922f81545e5e077ad2d1fc9be2ad91a1df`.
- Nový učitelský klíč v3 je pouze v **privátním ZIPu** dodaném učiteli; GitHub Pages ani jeho repozitář nesmí obsahovat tento klíč.
- Učitel provedl zadání implementace, ale **nepotvrdil definitivní pedagogické schválení**; `referenceCandidates.poslech.approved=false` zůstává.
- Původní rozpracovaná konverzační reference „Umělá inteligence“, kterou reviduje Claude, zůstává v této etapě **nedotčená**.

## Technická přejímka

Lokalní funkční test přes Chromium: izolovaně všech šest úrovní, 43 kontrol na každou (celkem 258), doplňkový 390×844 px B2 (43 kontrol). Součástí: odpovědi, pořadí, tři individuální kontroly, společné skóre, separátní slovní zásoba, obnovování, TXT export a reset. Statická kontrola soukromého klíče: 143 původních promptů, výrazů a položek pořadí ve všech šesti verzích. Script `node --check` bez chyby.

Po tomto PR GitHub Actions automaticky provede statické testy a Chromium/WebKit na stagingu; **fyzická UAT** na Android/iOS/iPadOS a skutečné přehrání vybraného klipu na školní Wi-Fi ještě zbývá. U dlouhého kombinovaného lokálního Playwright běhu se vyskytla nestabilita testovacího runneru; izolované úrovně fungovaly.

**Video:** https://www.youtube.com/watch?v=wD2cVhC-63I. Přímé odkazy startují zhruba v 1:10, přesný začátek a soulad úloh se zdrojem učitel ověří před hodinou.

## Pedagogické parametry reference

- **Úrovně:** A1–C2; **cílová skupina:** gymnázium, přibližně 15–19 let.
- **Cíl:** porozumění hlavnímu sdělení, faktům, argumentům a rétorické struktuře autentického projevu.
- **Čas:** přibližně 35–75 minut podle úrovně, přehrávání a práce ve třídě.
- **Slabší:** využít krátké úseky, základní oporu a titulky až při dalším poslechu; vybrat odpovídající počet písemných úloh.
- **Silnější:** interpretace C1/C2, práce s protinázory, argumentace založená na konkrétních prvcích projevu.
- Respektovat zmínky o víře, zemřelém otci a pivu; žáky nenutit sdílet osobní zkušenosti.

## Co zůstává pro další etapu

**Toto je referenční PROCVIČOVACÍ varianta.** Zcela samostatná budoucí **TESTOVACÍ varianta** bude mít menší, nově vybraný a samostatně schválený počet úloh, pevný jazyk/úroveň, časový limit a omezené pomůcky. Tuto část vytvoříme až po domluvě konkrétního testového rozsahu a pravidel hodnocení; nelze předstírat neobejitelné zabezpečení na statickém GitHub Pages.
