# Language Skills Hub – přejímka nových režimů Reading a Listening

**Pracovní náhled R26 – bez nasazení na veřejný katalog, bez klasifikace.**  
**Pro koho:** učitelé jazyků na gymnáziu a případně menší skupina dobrovolných testerů (bez osobních údajů).

## 1. Jak aplikaci spustit na Windows

1. Na stránce GitHub Actions příslušné větve stáhni artefakt **LSH-R26-LOCAL-PREVIEW**. Po rozbalení musí být ve stejném adresáři složka `language-skills-hub`, složka `preview-tools`, soubor `START-LSH-PREVIEW-WINDOWS.cmd` a tento návod.
2. Rozbal **všechny** soubory; nespouštěj HTML přímo dvojklikem ze ZIPu.
3. Dvojklikem spusť `START-LSH-PREVIEW-WINDOWS.cmd`. Počítač potřebuje **Node.js** nebo **Python 3**. Skript upřednostní Node, jinak zkusí Python.
4. Prohlížeč se otevře na `http://127.0.0.1:8765/language-skills-hub/`. Pokud se otevře dřív než server, obnov stránku. Server poslouchá výhradně na `127.0.0.1` (localhost); kolegové z jiného počítače se nepřipojí.
5. Po testování zavři okno lokálního serveru / stiskni `Ctrl+C`. Při příštím spuštění se nevrátí staré studentské odpovědi; maximálně se uchová volba světlého/tmavého vzhledu.

**Důležité:** Nezadávej skutečná jména, e-maily ani další osobní údaje studentů. Pro ověření formulářů použij fiktivní texty. Otevřené testy jsou na veřejném GitHub Pages technicky nezabezpečené a nikdy nepředstavují doložený klasifikovaný výkon. Počítač musí mít pro přístup k externím poslechovým médiím internet. Původní procvičovací karty používají již existující veřejná data.

## 2. Přímé adresy lokálního náhledu

| Režim | Lokální odkaz |
|---|---|
| Katalog | http://127.0.0.1:8765/language-skills-hub/ |
| Reading – Asteroids EN/B2 | http://127.0.0.1:8765/language-skills-hub/self-check/reading/index.html?topic=rl-asteroids&lang=en&level=B2 |
| Reading – Can Mistakes Help Us Learn ES/B1 | http://127.0.0.1:8765/language-skills-hub/self-check/reading/index.html?topic=rl-can-mistakes&lang=es&level=B1 |
| Listening – učitelský panel | http://127.0.0.1:8765/language-skills-hub/self-check/listening/teacher.html?topic=ll-matthew-oscars&level=B2 |
| Listening – studentské rozhraní | http://127.0.0.1:8765/language-skills-hub/self-check/listening/student.html?topic=ll-matthew-oscars&level=B2 |

**Pozor:** Učitelský a studentský panel nejsou propojené serverem. Tlačítka „První poslech dokončen“ a „Druhý poslech dokončen“ jsou pouze lokální pomůckou. Pro synchronizované přehrávání je potřeba, aby učitel pouštěl nahrávku celé třídě.

## 3. Přejímací scénář A – stávající katalog (cca 5–10 min)

Cíl: ověřit, že R22–R26 nepoškodily běžné procvičování.

- [ ] Katalog načte 29 témat a výběr Conversation, Reading, Listening.
- [ ] Přepínání světlého a tmavého vzhledu a návraty mezi laboratořemi fungují na PC i mobilní šířce.
- [ ] „Otevřít aktivitu“ funguje pro vybrané EN/ES/DE/FR a A1–C2.
- [ ] QR i kopírovaná adresa obsahují stejný vybraný odkaz.
- [ ] Pro režim „pevné nastavení“ je vysvětleno, že jde **pouze o omezení v UI**, nikoli technické uzamčení URL.
- [ ] Conversation nikde nenabízí tlačítko „Test“.
- [ ] Procvičovací karty si zachovají slovník i My Vocabulary tam, kde je karta již měla.

## 4. Přejímací scénář B – Reading Lab (cca 10–25 min)

**Cílová úroveň:** EN B2 na referenční kartě Asteroids; doplňkově ES B1.  
**Věková skupina:** gymnázium. **Cíl:** pochopení textu, výběr, přiřazení odstavců, chybějící věta, reflexe.  
**Pro slabší žáky:** A1/A2. **Pro pokročilé:** C1/C2 a písemná reflexe.

- [ ] Otevře se správný text a jazyk/úroveň, bez možnosti přepnutí přímo na studentské obrazovce.
- [ ] Původní věta určená k doplnění je v textu skutečně skrytá a nahrazena značkou mezery.
- [ ] Jsou přítomné všechny tři typy uzavřených úloh v příslušných oddílech.
- [ ] Žádný slovník, vlastní slovníček, supporting passages ani průběžné správné řešení.
- [ ] Procenta a správné odpovědi nejsou viditelné před potvrzeným souhrnným odevzdáním.
- [ ] Po výběru odpovědi se správně mění počítadlo vyplněných položek.
- [ ] Při pokusu o odevzdání neúplného testu zazní upozornění na nezodpovězené otázky.
- [ ] Po odevzdání již v dané instanci nelze znovu upravovat odpovědi.
- [ ] Výsledek správně odlišuje body, procenta a dokončenost; špatná odpověď uvádí správné řešení a případné vysvětlení.
- [ ] Výsledková karta **nepřiděluje školní známku**.
- [ ] Mobilní rozložení je bez horizontálního přetékání.

## 5. Přejímací scénář C – Listening Lab (cca 15–30 min)

**Cílová úroveň:** EN B2; doplňkově A1/C1 podle potřeby.  
**Věková skupina:** gymnázium. **Cíl:** porozumění, interpretace a rekonstrukce slyšeného.  
**Pro slabší žáky:** A1/A2. **Pro pokročilé:** C1/C2 s otevřenými interpretacemi.

- [ ] Učitelský panel umožňuje zvolit všechna 3 témata a 6 úrovní.
- [ ] Původní mediální odkaz lze otevřít a skutečně přehrát ze školní sítě (YouTube/Facebook/X mohou být omezené).
- [ ] Učitel může označit první a druhé přehrání; počítadlo se zastaví na **2/2** a lze je resetovat.
- [ ] Panel poctivě vysvětluje, že tlačítka nesynchronizují studenty.
- [ ] Zkopírovaný studentský odkaz skutečně odkazuje na vybranou úroveň a téma.
- [ ] Student nevidí žádný přehrávač, Play ani přímý mediální odkaz.
- [ ] Zobrazují se **přesně** sekce First Listening / Listen and Interpret / Listen, Write and Reconstruct.
- [ ] Nejsou přítomny Pre-listening Activity, Optional Vocabulary, After Listening, slovník ani My Vocabulary.
- [ ] Ověř jednu otázku s více správnými odpověďmi, jednu rekonstrukci pořadí a jednu otevřenou odpověď.
- [ ] Odevzdání je souhrnné, přičemž výsledky písemných odpovědí vyžadují učitele a nejsou započteny do objektivního procenta.
- [ ] Výsledková karta neobsahuje konečnou známku; ukazuje referenční odpovědi až po odevzdání.
- [ ] Po zahájení testování u třídy se vhodně řeší riziko, že jeden student po odevzdání prozradí řešení ostatním.

## 6. Kritická rozhodnutí před případným zveřejněním

- [ ] Vedení školy výslovně schválí označení jako **neklasifikované lokální ověřování**, nikoli zabezpečenou zkoušku.
- [ ] Proběhne pedagogická revize všech typů úloh a odpovídajících textů.
- [ ] Otestuje se Chrome na Windows, Android Chrome, Safari na iOS/iPadOS a režimy na telefonu/tabletu.
- [ ] Všechny 3 skutečné poslechy jsou dostupné a obsahově vhodné pro příslušné žáky.
- [ ] Je odsouhlasen způsob sdílení výsledků **bez neoprávněného sběru osobních údajů**.
- [ ] Před jakýmkoli **oficiálním** známkováním musí existovat aktuálně schválená pravidla školy, hodnoticí stupnice, desetinná pravidla a spravedlivá metodika písemných odpovědí. Bez důvěryhodného backendu se však ani tato rozhodnutí nesmějí vydávat za zabezpečený test.

## 7. Záznam z přejímky

**Datum:** ____________________  **Zařízení a prohlížeč:** ____________________

**Téma/úroveň:** ____________________  **Scénář:** A / B / C

**Co fungovalo:** __________________________________________________________

**Co selhalo (přesný postup reprodukce):** __________________________________

**Závěr:** [ ] Přijato pouze jako neklasifikovaný pilot  [ ] Vrátit k opravě

**Poznámka ke známkování:** Žádná z těchto odpovědí ani lokálních procentních hodnot není spolehlivým školním klasifikačním záznamem.

---

**Skutečný veřejný katalog (beze změn):** https://ghrab-jazyky.github.io/language-skills-hub/
