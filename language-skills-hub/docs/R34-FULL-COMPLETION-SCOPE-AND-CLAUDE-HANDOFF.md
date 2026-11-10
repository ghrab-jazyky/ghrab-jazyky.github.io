# R34 – dodělání všech nezávislých testových sad: technická hranice a předávka

## Závazný rozsah

Produkční větev `main` obsahuje verzi **R31**. PR #39 (R32) a PR #40 (R33) jsou úmyslně neschválené vrstvené piloty. PR #55 (R34) navazuje na obě a **není pro produkci**. Tato architektura chrání původní výukové karty i stabilní katalog.

Původní katalog obsahuje:
- Reading Lab: **5 témat × 4 jazyky × 6 úrovní = 120 samostatných obsahových testových variant**.
- Listening Lab: **3 témata × 1 jazyk × 6 úrovní = 18 samostatných testových variant**.
- Conversation Lab: **21 procvičovacích témat × 4 jazyky × 6 úrovní**. Mluvení nelze automaticky známkovat a testovací rubrika nebyla samostatně schválena. Rozhodnutí R22 o absenci ostrého tlačítka Test platí do změny vlastníkem.

Celkem očekáváme **138 Reading/Listening testových bank**. To neznamená, že musí existovat 138 jednotlivých katalogových témat: ID tématu zůstává kanonické a varianta je určena jazykem/CEFR.

## Co bylo skutečně vytvořeno

V pracovních větvích:
- R32: původní nezávislá EN/B2 testová sada k `rl-can-mistakes`, deset nově formulovaných MC úloh a obsahový audit.
- R33: vlastní EN/B1 sada k témuž tématu, deset nových MC úloh a audit.
- R34: EN/A1, A2, C1, C2 k `rl-can-mistakes`, pro každou úroveň 10 vlastních úloh, vysvětlení a opora v původních odstavcích. Všech šest anglických úrovní tak má **pracovní návrh**, nikoli schválený test.
- `tools/independent-coverage.cjs`: čte celý současný katalog, původní HTML a banky, ověřuje SHA-256, jedinečnost úloh a minimální obsahový kontrakt, počítá explicitní chybějící banky, **nikdy nenahrazuje chybějící banku procvičovacími úlohami**.
- `tools/build-audit-pack.cjs`: generuje `coverage.json`, úplný soupis nehotových variant, pro skutečné autorské návrhy porovnání s původním textem a practice otázkami a nezávislý auditní brief pro Claude.
- `.github/workflows/lsh-r34-content-coverage.yml`: reprodukovatelný CI běh, kontrola zdrojových dat, regresí a QA v Chromium/WebKit; artefakty GitHub Actions ke stažení pro audit.

**Obsahové banky jsou stále `published:false`.** I úspěšný test JSON, bodování a UI není pedagogickým schválením CEFR, jednoznačnosti správné odpovědi ani fairness testu.

## Zásada pro zbytek 138 variant

Každou jednotlivou chybějící variantu vytvořit jako původní sadu s vlastním klíčem. **Zakázáno** vydávat praxi s jiným pořadím otázek, jednoduché přeformulování nebo algoritmické generování distraktorů bez opory v textu za hotový nezávislý test.

Pořadí dalšího dokončení: všech 5 Reading témat v EN A1–C2, jazykově samostatně ověřené ES/DE/FR A1–C2, poté Listening se samostatnou referencí ke konkrétnímu médiu. Pro každou Listening referenci nutno nejprve schválit počet/typ poslechových úloh, maximální skóre, dvě přehrání a režim ručního hodnocení otevřených odpovědí. Zvolený limit, četnost a klíč musí být nezávisle ověřené podle skutečného audio/video obsahu.

Při dalších bankách:
1. Získat originální zdroj a jeho přesný SHA-256 z `version.json`.
2. Napsat vlastní úlohy na základě originálu, přidat správnou odpověď, neprůhledné ale férové distraktory, vysvětlení a odkazy na příslušnou pasáž.
3. Nezměnit existující procvičovací text, otázky ani originální obsah.
4. Přidat banku jako **nepublikovanou**. Po CI vytvořit Claude review pack a provést jazykovou/didaktickou kontrolu.
5. Po lidském schválení vytvořit samostatnou **release manifest** bránu s explicitně schváleným source hash a revizí obsahu. Teprve pak možnost použít banku ve studentském testu z katalogu.
6. Po otestování celku na fyzických telefonech/tabletech a pedagogické UAT lze připravit vydání.

## Dočasná technická omezení

- Původní master zadání pracovalo s nasazením pod `/zkusebni/`, aktivní katalog je však dnes pod `/language-skills-hub/`. Výběr produkční cesty je před případnou další migrací třeba sjednotit; nepřesouvat automaticky.
- Testové podklady jsou ve veřejném statickém repozitáři a obsahují správné odpovědi. Nejde o zabezpečený test ani ověřený klasifikační doklad.
- Lokální výstupy a záznamy incidentů nelze považovat za důkaz konkrétního žáka. U sdílených počítačů používat oddělené místní relace, po převzetí výsledku mazat data.
- Skutečný iOS/Android/iPadOS UX a Split View/Slide Over stále potřebuje fyzickou přejímku.
- Nejsou k dispozici ověřené úplné přepisy všech zdrojových videí ani schválené hodnoticí rubriky pro konverzaci.

## Předání pro Claude

V CI běhu R34 otevřít artefakt `lsh-r34-claude-review-dossier` a spolu se samotným PR poslat Claudovi. Součástí jsou originální odstavce, practice a nezávislé otázky, klíče, evidence, pokyny k identifikaci kolizí, chybných distraktorů a neodpovídajícího CEFR. Další artefakt `lsh-r34-coverage-and-backlog` je strojově čitelný inventář.

**Gate NO-GO:** neexistuje lidský obsahový souhlas pro všech 138 Reading/Listening variant; nová banka nesmí být označena jako schválená ani automaticky zprovozněná jen díky PASS v CI.
