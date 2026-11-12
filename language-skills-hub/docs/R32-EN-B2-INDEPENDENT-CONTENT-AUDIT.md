# R32 – nezávislý didaktický a jazykový audit reference EN/B2

**Datum:** 10. 11. 2026 · **Stav:** technicky přezkoumáno, **pedagogické schválení zadavatelem PENDING**. Nejde o validovaný standardizovaný test.

**Cílová úroveň:** B2 · **věk:** cca 16–19 let (vyšší gymnázium) · **výukový cíl:** komplexní čtenářská interpretace, argumentace a využití závěrů textu · **odhad:** 20 min na 10 uzavřených otázek. Pro slabší žáky vyžaduje skutečně novou B1 banku, nikoli pouze více času; pro silnější úroveň C1/C2 samostatné náročnější banky.

## Výsledek nezávislé revize návrhu R32

Původní technická sada s deseti otázkami byla validní, ale didakticky **ještě nevyhovovala**. Nalezené problémy:

1. Distraktory obsahovaly snadno vyloučitelné absolutní výroky (*always*, *only*, *completely*, *all*) a odpovědi se někdy lišily svou věrohodností více než porozuměním.
2. V žádné z deseti otázek nebyla správná odpověď D; rozmístění správných možností nebylo vyvážené.
3. Otázka na kvalifikaci uvedenou *Of course* významově příliš připomínala procvičovací úlohu `en-b2-structure-2`.
4. Některé položky testovaly velmi blízké formulace téhož argumentu. Přenosové položky bylo vhodné více zasadit do realistických situací.
5. Chyběla explicitní reference na odstavec, podle kterého může reviewer věcnou správnost ověřit.

Upravená banka `R32-CONTENT-AUDIT-1` obsahuje důvěryhodnější distraktory, jednu otázku na tón autora (místo téměř duplicitní strukturové otázky) a pro každou položku číslo podpůrného odstavce. Klíč je vyvážený **A 2×, B 3×, C 2×, D 3×**. Jazyk otázek je konzistentní a bez zjištěných gramatických chyb, avšak věrohodnost distraktorů a náročnost B2 je stále nutné empiricky ověřit.

## Kontrola všech deseti položek

| Úloha | Dovednost | Klíč | Opora (odstavec) | Auditní závěr |
|---|---|---|---|---|
| INT-01 | Interpretace zpětné vazby | B | 1 | Uvěřitelnější nesprávné možnosti; přímá podpora v textu |
| INT-02 | Účel přepsání části eseje | D | 2 | Testuje praktický účel, nikoli jen doslovný údaj o odstavci |
| INT-03 | Důsledky úzce hodnoceného stylu | C | 3 | Inference podporovaná tvrzením o systému hodnocení |
| ARG-01 | Kontrast dvou reakcí | A | 2 | Rozlišuje minulou známku a budoucí učení |
| ARG-02 | Tón autora vůči zklamanému žákovi | D | 1 a 4 | Nahrazuje nadměrně podobnou původní otázku |
| ARG-03 | Přesah argumentu mimo školu | B | 4 | Ptá se na funkci příkladů, nikoli na doslovný obsah |
| APP-01 | Zpětná vazba k nejasné argumentaci | C | 3 | Praktické použití principu důkazů a přesných otázek |
| APP-02 | Emoce versus užitečnost rady | D | 4 | Přenos argumentu do dialogu se spolužákem |
| APP-03 | Zaměření na starou známku | B | 2 | Aplikace směřující ke zlepšení další práce |
| APP-04 | Neúplná perspektiva trenéra | A | 4 | Přenos do situace mimo školu |

**Upozornění k obsahové validitě:** Otázky se mohou významově dotýkat témat ze stejného zdrojového textu. Automatické testy ověřují, že nejsou totožná zadání, že odpovědi jsou v banku formálně správně a že se nezměnily původní zdroje. **Neumí dokázat skutečnou nezávislost měřených kognitivních operací, jednoznačnost všech distraktorů ani správné zařazení B2**. To musí v pilotu posoudit další učitel a studenti.

## Technický QA náhled

V oddělené větvi PR #39 (nikoliv v produkční R31) existuje:

`language-skills-hub/self-check/test-banks/reading/preview.html?timer=20&attempt=r32localqa1`

- Na lokálním webovém serveru z kořene repozitáře lze otevřít: `http://127.0.0.1:8765/language-skills-hub/self-check/test-banks/reading/preview.html?timer=20&attempt=r32localqa1`.
- Náhled kontroluje SHA-256 **skutečných bajtů** originální HTML karty proti manifestu R31 a kontroluje stav banky `published:false`. Selhání ověřování znamená zablokování testu – **žádné tiché přepnutí na procvičovací otázky**.
- Zachovává R30 lokální časovač, izolované relace, základní přerušení, gesto čtyř rohů, obnovu, odevzdání a smazání lokálních dat.
- Odpovědi a vysvětlení se zobrazí až po odevzdání, ve zpětné vazbě pouze u chybně či vůbec nezodpovězených otázek. Známka je výslovně neověřený návrh podle dosavadní pracovní stupnice.
- Jedná se pouze o lokální/CI náhled, **není distribuován studentům ani zařazen do veřejného katalogu**. Public PR zdrojová data a klíč technicky zveřejňuje uživateli s přístupem k repozitáři; toto není bezpečně utajený test.

## Akceptační rozhodnutí pro další iteraci

Po automatickém testu v Chromium/WebKit zbývá:
- [ ] Nezávislé učitelské schválení každého distraktoru a správného řešení.
- [ ] Potvrzení rozsahu 10 otázek / 20 minut a metodiky známkování na základě reálného pilotu.
- [ ] Praktická UAT na fyzických zařízeních Windows, Android, iPhone a iPad.
- [ ] Rozhodnutí, zda obsahové pokrytí B2 vyžaduje také jiné typy úloh než MC.
- [ ] Teprve potom lze plánovat veřejný obsahový režim a rozšíření dalších CEFR/jazykových variant.

**Publikační brána:** PR #39 je **DRAFT / NO MERGE** až do výše uvedeného pedagogického souhlasu. Úspěch automatických testů sám o sobě nestačí.
