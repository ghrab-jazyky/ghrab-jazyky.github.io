# City Quest — F4R: závěrečná přejímka a předání do F5

**Datum:** 22. listopadu 2026  
**Větev:** `feature/lsh-city-quest-f4r-zoom-localization-fixes` (PR #161)  
**Výchozí nezávislý audit:** PR #160, baseline F3D `99905affda918cdd089c155864c4c1c5c438a945`  
**Zásada:** žádné sloučení do `main`, dokud není na **posledním HEAD** kompletní CI PASS a nedojde k výslovnému rozhodnutí F5.

## A. Rozsah (neměnit v rámci F4)

- Čtyři jazyky: EN, ES, DE, FR; šest úrovní A1–C2; osm městských misí (192 scénářů). Pro B1–C2 navíc čtyři alternativní mise metra (64 scénářů); **celkem 256 hratelných kombinací**.
- Cílová skupina: víceleté a čtyřleté gymnázium, cca 12–19 let.
- Výukový cíl: orientace podle mapy, čtení pokynů, volba správné trasy, řešení dopravních problémů a ústní vysvětlení postupu.
- Čas: 5–12 min / mise; 45 min typicky 3–4 mise; kompletní průchod až 2×45 min.
- Slabší žáci: lokální nápověda, vzorové výrazy, jednoduché instrukce a možnost opakování. Pokročilí: zdůvodnění, alternativní spojení, výluka, formální a neformální registr.
- Bez serveru, přihlašování, HTTP requestů, mikrofonu, automatického známkování mluvení a ukládání dat žáků.
- Zvuková nádražní hlášení: **pouze psaná simulace**, doplněná originálními lokálními signály. Namluvená hlášení čtyř jazyků nejsou součástí tohoto release kandidáta; případné přidání je samostatná produktová změna s vlastními QA.

## B. F4 nálezy a provedené korekce

| Nález | Náprava | Způsob důkazu |
| --- | --- | --- |
| P1 — 200% text, DE/C2 Metro 07 na 320/390 px | rem-aware adaptivní rozložení misí a učební lišty | F4R browser test + kontrola snímků; reálný zoom na zařízeních dál PENDING |
| P2 — anglické UI galerie, zastaralý EN/B1 popis | lokalizace okolních popisků a tooltipů, transparentní identifikace nehodnocené EN galerie | čtyřjazyčný DOM test |
| P2 — u mise Metro 05 ikona autobusu | 🚇 v aktivním metru, 🚌 v městské alternativě | regresní test |
| P2 — francouzská instruktáž přechází z `vous` na `tu` | sjednocení FR žákovského oslovení `vous`, přesná jazyková regrese | lingvistické statické testy |
| P2 — španělské zpětné vazby používají `usted` k žákovi | žákovi konzistentně `tú`, turistovi zdvořilé `usted` | lingvistický statický test |
| P2 — anglické popisky přímo v hratelném SVG metru | EN/ES/DE/FR v aktivní hře; samostatná EN galerie zůstává vědomě referenční | čtyřjazyčný browser test |
| P2 — vzorové trasy Metro 07/08 | ve všech jazycích správný terminál M2 **North Park**, přestup v University a výstup v Museum Quarter | nový statický test odpovědních klíčů |

Výše uvedené změny jsou **implementovány v PR**. Jejich výsledné technické přijetí je podmíněno úspěchem CI na posledním HEAD. Předchozí zelený commit nestačí.

## C. Strojově ověřit — povinné uzavírací podmínky F4

1. Jediný přesný commit HEAD, bez nového push po certifikaci.
2. Všechna relevantní CI F2, F2.1A–E, F3A–D a F4: výsledek `SUCCESS`; v F4 musí oba joby (`f4-static-independent-and-matrix`, `f4-browser-independent-and-regression`) uspět.
3. Regresní testy: 256 DOM variant; 320/390/768/1024/1366; 200% text; 44px dotykové cíle; klávesnice; WebKit; EN/ES/DE/FR; single map HUD; metro vozidlo/nástupiště bez neoprávněného posunu.
4. Znovu sestavit single-file HTML; ověřit SHA-256 CSP, `connect-src 'none'`, `file://` bez síťových requestů, žádná JS výjimka, beze změn herního enginu mimo schválený audit.
5. Uložit přesný SHA, workflow run ID, artefakt HTML a vizuální doklady přímo do komentáře PR #161. Pokud některá kontrola selže, F4 = **TECH NO-GO**.

## D. Co nelze automaticky vydávat za schválené

**Registr:** `F4_256_variant_release_review_matrix.csv` má 256 unikátních kombinací `jazyk × CEFR × mise × CITY/METRO`. Sloupce `linguistic_review`, `pedagogical_review`, `accessibility_review`, `owner_approval` ponechat **PENDING**, dokud odpovědný člověk danou skutečnou přejímku nezapíše.

### Přejímka na zařízení — konkrétní krátký scénář

- **iPhone Safari** (portrét i landscape, šířka cca 320–390): FR/C2 Metro 07, DE/C2 Metro 07, bez ztráty názvu mise; vyzkoušet navigační šipky, změnu velikosti textu 200 %, viditelnost zpětné vazby.
- **iPad Safari Split View**: přepnout 1/2 obrazovky; ověřit, že existuje jediná sada směrových tlačítek a že se při změně režimu neztratí aktuální poloha. Vyzkoušet klávesnicový fokus.
- **Android Chrome**: ES/B1 Metro 05, EN/B2 Metro 08; změny orientace, scroll, dotykové cíle, správné přesuny.
- **VoiceOver/TalkBack**: mapový seznam stanic je dosažitelný, inspekce **nepřemisťuje hráče**, učitelská zpětná vazba se oznamuje, po akci se neztratí fokus; kontrolovat kontrast / reduced motion.
- **Pedagogická/lingvistická revize**: reálně projít všech 256 variant s důrazem na B2–C2; ověřit věcnou správnost tras, jazykovou přirozenost, registr, úrovňovou přiměřenost a že žák nemá k dispozici řešení dříve, než sám odpoví.

Pro každý scénář zapisovat datum, zařízení/OS nebo jazykovou kvalifikaci, výsledek PASS/FAIL, reprodukci chyby a odpovědnou osobu. Automatická kontrola technické struktury není náhradou těchto podpisů.

## E. Rozhodovací pravidlo

- **F4 TECH PASS:** jen úspěšná certifikace všech požadovaných workflow na přesném finálním SHA + ověřený offline artefakt.
- **F4 AUDIT CLOSED:** dokumentované technické nálezy vyřešeny nebo výslovně ponechány jako známé limitace; matice a další lidské brány nejsou předstíraně označené PASS.
- **F5 RELEASE GO:** teprve po lidské jazykové/pedagogické přejímce, reálných mobilních a asistivních testech, vizuálním schválení vlastníka a jeho výslovném povolení nasazení.

**Výchozí release rozhodnutí zůstává NO-GO, dokud nejsou všechny relevantní důkazy doloženy.**
