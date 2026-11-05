# E4F – izolované předávání Reading Lab QA posuzovatelům

**Datum:** 2026-11-05  
**Stav:** DRAFT / NO-MERGE / NO-DEPLOY / PEDAGOGICKY NEOVĚŘENO  
**Odvozeno z:** E4E, PR #10; master Reading Lab v3.4 §13E.

## Proč E4F vzniklo
Předchozí soukromý QA ZIP spojoval všech 56 slepých a 24 testů s textem.
Kdyby jej dostal jediný posuzovatel, mohl by vidět celý článek nebo jiné
záložky a slepý test by ztratil nezávislost. E4F rozděluje materiály do
**80 oddělených individuálních archivů**.

Tento veřejný GitHub obsahuje pouze **metodiku a anonymní výsledky
technických kontrol**. Opravdový studentský HTML, učitelský klíč, 80
individuálních testovacích HTML ani žádný soubor posuzovatele zde není.

## Soukromý balíček předaný majiteli projektu
`Reading_Lab_Can_Mistakes_v4_3_E4F_ISOLATED_ASSESSOR_KIT_PRIVATE.zip`

Uvnitř:
- `1_SEND_ONE_CASE_ONLY/` – 80 individuálních ZIPů, po jednom HTML
  testovacím formuláři a krátkém návodu pro posuzovatele.
- `2_TEACHER_ONLY/` – soukromý manifest, tabulky přidělení,
  prázdné souhrnné odpovědi, integritní metadata, Python 3
  `collect_results.py`, lokální `SCORE_QA_E4F_PRIVATE.cjs`
  a Windows `RUN_COLLECT_WINDOWS.bat`.
- `READ_ME_FIRST_CZ.txt` – provozní postup.

**Nikdy neposílat posuzovateli hlavní ZIP.** Předat pouze konkrétní
`blind-...zip` NEBO `ft-...zip`, nikoli všechny materiály.
Každé individuální HTML funguje bez loginu či vzdálených služeb;
uvolní jediný `case-id.responses.json` se zvolenými písmeny, jistotou,
odůvodněním a deklarací podmínek. Správné možnosti ani učitelské klíče
HTML neobsahuje.

## Metodika izolace
1. C1/C2 slepý test: nejvýš jedna záložka dané úrovně jednomu
   pseudonymizovanému posuzovateli; text článku, učitelský klíč a
   jiné záložky jsou zakázány.
2. **NOVĚ zabezpečeno v E4E i E4F:** stejný posuzovatel nesmí získat
   žádný test s textem stejného tématu; pro slepý test by tím znal článek.
   Kolize aliasů se porovnávají case-insensitive.
3. WITH-TEXT: nezávislý posuzovatel dostává pouze variantu EN/ES/DE/FR
   s jejími otázkami, nikoliv učitelský klíč.
4. Každá odpověď musí mít písmeno v rozsahu daných možností, odhad
   jistoty 0–100 a stručné odůvodnění. Pokud pouze hádá, výslovně to uvede.
5. Používat pseudonymy (`QA01` atd.), nikoli jména studentů,
   e-maily ani jiné osobní údaje.

## Opravdu vykonané lokální QA (ne pedagogické hodnocení)
- **80/80** příloh má správná ID, deklarované varianty, počet úloh
  a pořadí; celkem **528/528** testovacích odpovědních polí.
- **56/56** slepých archivů neobsahuje celý odstavec referenčního
  článku; ve všech 80 případech byla ověřena shoda počtu alternativ
  s původními soukromými daty. Nezaznamenána vnější síťová závislost
  ani obsah učitelského klíče.
- **Chromium, 390 px:** 4 vzorky (EN C1 blind, FR C2 blind, EN A1
  with-text, ES C2 with-text) vykresleny a vyplněny, žádná JS chyba,
  žádné síťové požadavky ani vodorovný overflow. Exportovaný JSON
  ověřen ve formuláři.
- Sběr: **0/80** = `INCOMPLETE`, 2/80 = `INCOMPLETE`,
  uměle vyplněných 80/80 = `COMPLETE_NEEDS_MANUAL_VALIDATION`
  a stále `release_decision:NO_GO`.
- Negativní scénáře: smíšení blind/with-text u stejného aliasu,
  neplatné písmeno, odlišný otisk zadání a neúplné řádky správně
  vyvolávají `INVALID_INPUT`.
- Ověřena návaznost vytvořených CSV na soukromý hodnoticí E4E
  modul (všech 528 syntetických odpovědí lze spočítat, nikoli vydat).
- Aktuální E4E GitHub CI po doplnění **cross-mode** pravidla: PASS
  v běhu `42100457990`. Další úspěšné E3C/E3D regresní běhy:
  `42100458013` / `42100458010`.

## Neověřené a nezaměňovat
- Skutečných **0/80** nezávisle vypracovaných hodnocení, **0/528**
  odpovědí. Žádná pedagogická ani CEFR validace z E4F nevznikla.
- Real `file://` navigace v přísně spravovaném testovacím Chromiu
  byla zablokována `ERR_BLOCKED_BY_ADMINISTRATOR`; render přes
  `page.set_content` prošel, ale nelze jej vydávat za nezávislý
  test chování staženého HTML z Windows či iOS.
- WebKit/Safari a skutečná fyzická zařízení nebyla touto etapou
  prověřena. Není doložena provozní spolehlivost stahování JSON na iOS.
- Anonymní deklarace nezávislosti jsou pouze samopotvrzení; skutečné
  dodržení musí zajistit organizátor testování.
- Pedagogické body masteru v3.4 (blindy po záložkách, kontrola všech
  A1–C2 s textem, opravy a retest) se nadále čekají.

## Doporučený další krok
Organizátor rozdělí každému posuzovateli jediný samostatný ZIP a po
vyplnění shromáždí výstupní `*.responses.json` v soukromé složce.
Lokální Python sběrač zkontroluje úplnost a izolaci, vytvoří souhrnná
CSV; následně se spustí privátní Node hodnoticí skript proti původnímu
studentskému HTML. Všechny neshody a poznámky vyžadují ruční
pedagogický rozbor. Vydání Can Mistakes a úprava Plastic Ocean až
po zaznamenaném schválení.

**Zákaz:** sdílet celý hlavní ZIP s posuzovatelem; zveřejňovat klíč,
skutečné QA materiály, plné studentské HTML, jména, vyplněné odpovědi
nebo zpracované skóre na veřejném GitHubu. Neprovádět merge ani deploy.
