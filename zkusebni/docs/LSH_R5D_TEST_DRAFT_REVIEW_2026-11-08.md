# Language Skills Hub — R5D: samostatné kratší testy, pracovní přejímka

**8. 11. 2026 · PR #27 · DRAFT / NO MERGE / NO DEPLOY**

## Co je skutečně připraveno

R5D poskytuje první **54 samostatných návrhů testovacích zadání** odvozených od původních SHA-256 a Git-blobem ověřených referencí. Vznikají pouze ve zvláštním dočasném adresáři GitHub Actions, **nikoli v katalogu, zdrojových kartách nebo na GitHub Pages**.

| Dovednost | Reference | Počet variant | Návrh kratšího zadání |
|---|---|---:|---|
| Conversation Lab | Umělá inteligence | 4 jazyky × A1–C2 = 24 | Tři z osmi stanovišť; každé má hlavní a jednu doplňující otázku. Hodnocení pouze učitelem, kritéria zatím neschválena. |
| Reading Lab | Asteroids v2.3 | 4 jazyky × A1–C2 = 24 | Původní text a 5 otázek na A1/A2, 6 na B1–C2. Bez průběžné zpětné vazby, správných odpovědí, vysvětlení a zvýraznění důkazů. |
| Listening Lab | Matthew McConaughey v3 | EN × A1–C2 = 6 | First Listening: 2 úlohy; Second Listening: 2 úlohy; Third Listening: písemná odpověď + rekonstrukce v úmyslně zpřeházeném pořadí. Přehrávání zajišťuje učitel. |

**Celkem 54/54** pouze tehdy, pokud tuto úplnost potvrdí aktuální CI. Každá varianta je označena jako neschválená. Generátor pracuje s původními referencemi, nikoli s nepublikovanými R7/R8 kandidátními opravami; případný přechod na schválený obsah musí být doložen a znovu otestován.

## Pedagogické metadata – výchozí NÁVRH, nikoli schválený test

| Dovednost | Cílová úroveň a skupina | Cíl | Odhad času | Slabší žáci | Silnější žáci |
|---|---|---|---|---|---|
| Mluvení | A1–C2 podle jazykové skupiny, orientačně gymnázium 12–19 let | Reagovat na otázky, srozumitelně vysvětlit názor a uvést příklad | 8–12 minut ve dvojici | Příprava a větné opory, jen jsou-li v daném testu povoleny | Protipříklad, krátká argumentace a doplňující otázka |
| Čtení | A1–C2 podle jazykové skupiny, orientačně gymnázium 12–19 let | Vyhledat informace, porozumět hlavnímu sdělení a souvislostem | 12–25 minut podle úrovně | Přiměřená časová úprava či jiná schválená podpora | Po úloze doložit odpověď pasáží v textu (bez automatických bodů) |
| Poslech | EN A1–C2 podle jazykové skupiny, orientačně gymnázium 12–19 let | Zachytit hlavní sdělení, detaily a posloupnost řeči | 20–30 minut včetně přehrávání | Počet přehrání/titulky pouze podle předem oznámených pravidel | U písemné odpovědi žádat konkrétní oporu ve výroku |

## Technické bezpečnostní hranice

- Žádné automatické skóre, klasifikace, místní ukládání odpovědí, formulář pro odevzdání ani sběr identifikace žáka.
- Ve studentských náhledech se neukládá pole `correct`, `answer`, `why`, `explanation`, `evidence` ani učitelský klíč.
- Generátor odmítne výstup uvnitř repozitáře. Místo se určuje výhradně mimo Git worktree.
- `reference-pilots.json`, `unification-tracker.json`, `claude-audit-queue.json` a všechny původní HTML se nemění.
- Všech 29 katalogových položek má nadále `Testování:not-ready`. Návrhy nejsou na katalogové položky napojeny.
- GitHub Pages a statické HTML nejsou chráněné zkušební prostředí. Náhledové HTML, odvozené z veřejných zdrojů, nemůže zaručit ochranu před nahlédnutím do původních materiálů.
- Externí video Matthew není obsaženo v ZIP. Přístup přes školní Wi-Fi a pravidla přehrávání nebyly ověřeny.

## Co musí schválit učitel, než se přiblížíme k ostrému režimu

1. Přiměřenost a jednoznačnost vybraných úloh každé konkrétní jazykové/CEFR varianty.
2. Zda zkrácení zadání zachovává cíle hodiny, testovou validitu, obtížnost a vhodnost pro daný ročník.
3. Jaká konkrétní rubrika, bodová váha a pravidla hodnocení už platí nebo budou schválena; bez toho nesmí aplikace automaticky hodnotit.
4. Podmínky výkonu (čas, přehrání, přístup k textu, slovníku, pomocným otázkám, individuální úpravy) a způsob odevzdání.
5. Pedagogická kontrola originálních podkladů i všech mezitím vytvořených R7/R8 oprav, ověření videa, fyzický Android/iPhone/iPad a školní Wi-Fi.
6. Výslovná rozhodovací brána „GO“ pro každou dovednost, ne hromadné povolení všech 29 témat.

**Další technický krok:** po schválení testové koncepce převést generator z původních tří referencí na zdrojově validované jednotlivé kandidáty; následně rozšířit katalog tak, aby `Procvičování` a `Testování` zůstaly dvěma oddělenými, skutečně schválenými realizacemi **jediného tématu**. Dokud tento krok není dokončen, `Testování` zůstává deaktivované.

## R5D correction: sentence-gap answer disclosure (2026-11-08)

The initial generated review ZIP included reading structure questions whose answer was visible verbatim in the full reading text. Both preview generators now remove the exact missing sentence from the passage and replace it with `[ … ]`; if the match is ambiguous or absent they fail closed. Automated tests assert that the answer is not visibly repeated. Previous review ZIP is superseded. No student use, grading, or release without pedagogical approval.
