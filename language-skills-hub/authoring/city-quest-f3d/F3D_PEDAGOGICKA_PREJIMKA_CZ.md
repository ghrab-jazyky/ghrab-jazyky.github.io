# City Quest — F3D: sjednocení designu a pedagogická přejímka

**Datum:** 22. listopadu 2026  
**Výchozí baseline:** F3C, PR #155, commit `d1c3692388b577f28d66804dcc90177f1199fc6b` (9 relevantních CI workflow SUCCESS).  
**Rozsah:** úprava UX, textového přechodu město ⇄ metro a dostupnosti učebních kroků, **bez změny herní logiky**.

## 1. Výukové parametry

| Parametr | Požadavek |
| --- | --- |
| Cílová úroveň | EN, ES, DE, FR × A1–C2; interaktivní metro B1–C2, město a klasická autobusová cesta pro A1–A2 |
| Žáci | 12–19 let, víceleté / čtyřleté gymnázium |
| Cíl | Porozumět cestovnímu zadání, zvolit trasu / reagovat v situaci a následně **ústně zdůvodnit** rozhodnutí v cílovém jazyce |
| Čas | Zpravidla 5–12 minut na misi; na 45 minut vybrat 3–4 stanice; úplná sada na cca 2×45 minut |
| Slabší žáci | ponechat plné vysvětlení, pracovat s nápovědou, mapovým seznamem stanic a jednoduššími větami odpovídajícími CEFR |
| Silnější žáci | vysvětlit kompromisy, změnu trasy při výluce, alternativy přestupu a zdvořilostní registr; ve dvojici obhájit jiný postup |

## 2. Co F3D mění

### Jednotný vizuální systém City / Metro
V obou prostředích používá jediný živý panel zadání stejnou hierarchii: záhlaví stanice → zadání s cílem → vlastní rozhodnutí (tlačítka / pohyb) → lokální zpětná vazba → jazyková nápověda → vyslovené zdůvodnění. Barvy, velikosti dotykových cílů, rámečky a stav fokusu jsou sjednoceny. Nevzniká druhý herní panel ani druhé šipky.

### Přehledná třífázová orientace
Diskrétní lišta **Přečti / Procvič / Zhodnoť** (přeložená do EN/ES/DE/FR) zobrazuje aktuální režim, číslo a název mise, Solo/Pair a úroveň CEFR. Aktivní fázi odvozuje **pouze z již existujícího lokálního stavu**. Tato lišta není skóre, hodnoticí rubrika ani důkaz, že student skutečně mluvil.

- **Přečti:** výchozí stav nové mise, ještě nebyl proveden herní pokus.
- **Procvič:** první smysluplný úkon / pokus (včetně chybného); bez uměle vymyšlené procentní úspěšnosti.
- **Zhodnoť:** dosažený dialogový / jazykový checkpoint nebo dokončení mise. Student má mluvit nahlas a porovnat svoji odpověď s modelem, přesto **nedochází k automatickému hodnocení mluvení**.

### Ochrana postupu a přístupnost
Vedle volby jazyka a CEFR je viditelná informace, že tato změna resetuje celou lokální relaci. Při možnosti zapnout metro je doplněno přesné upozornění, že změna režimu město/metro vynuluje **mise 05–08**, ale **01–04 zůstávají**. Informace je také `aria-describedby` jazykových ovladačů.

Po kliknutí na nové zadání přes panel osmi misí zůstává **klávesnicový fokus** na téže pozici v novém panelu navigace. Po městských interakcích s překreslením nabídky se fokus vrací na první platnou volbu nebo na nadpis, když nejsou volby k dispozici. Existující F3C strategie pro metro zůstává nedotčena. Zprávy o městských akcích se zároveň oznamují přes **trvalou slušnou oblast živého stavu**, aby nebyla závislá na odstraněném DOM uzlu.

## 3. Jazyková a pedagogická revize — pravidla

Každá kombinace musí splnit tato pozorovatelná kritéria:

1. **Věcná správnost:** mapa, odstupy, přestupy, nástupiště, výluky i vysvětlení jsou v souladu s grafem Rivertonu. Žádná neplatná rada či předčasné odhalení řešení.
2. **Jazyk:** správný pravopis, gramatika, vhodný registr, přirozené instrukce a nutná slovní zásoba v EN/ES/DE/FR.
3. **Úroveň:** A1/A2 nezačíná metrem; B1–C2 obsahuje progresivně náročnější porozumění, zdůvodnění a jazykovou podporu.
4. **Pedagogika:** student rozumí tomu, co má říci, aniž by četl hotový model; nejprve vlastní odpověď, poté nápověda a porovnání; upozornění, že systém neměří skutečnou výslovnost.
5. **Přístupnost a UX:** při 320px šířce, iPadu Split View, klávesnici a čtečce VoiceOver/TalkBack je jasná právě jedna herní cesta, ne 2 nekonzistentní ovladače.
6. **Data a offline provoz:** nulové HTTP requesty, nahrávání zvuku, přihlášení či ukládání výsledků. Jen čistě lokální interakce.

**Nevymýšlet pedagogické hodnocení:** software může zkontrolovat volbu linky/trasu, ale **nemůže rozhodnout o jazykové kvalitě studentovy ústní odpovědi**.

## 4. Přehled validační matice

Soubor `F3D_192_variant_teacher_acceptance_matrix.csv` obsahuje přesně **4 jazyky × 6 úrovní × 8 misí = 192 unikátních řádků**. Sloupce `teacher_linguistic`, `teacher_pedagogy`, `teacher_accessibility` a `owner_approval` jsou **PENDING**. Automatický test hlídá úplnost matice, **nesmí změnit PENDING na PASS**.

U B1–C2 je pro mise 05–08 hlavním přejímkovým scénářem metro (celkem 64 kombinací); klasický autobusový a městský režim zůstává samostatným regresním fallbackem. U A1/A2 je hlavním scénářem město.

## 5. Přejímkový scénář pro učitele

**V každém z jazyků** otevřít B1 a C2, vyzkoušet jednu městskou misi s více kroky a metro 05 a 07; v misi 08 projít přechody město → metro → město. Při scénáři „chybný přestup“ ověřit, že systém studentovi poskytne užitečnou opravu bez prozrazení celé trasy. Pro CEFR A1 a A2 ověřit, že není možné zapnout metro pilot.

Na telefonu (320–390 px) ověřit přepínání plného/kompaktního HUD, po otočení neztratit aktivní bod, přejít k jazykové podpoře, dokončit trasu a mluvit nahlas. Na iPadu Split View a s klávesnicí ověřit bez ztráty fokusu všech osm položek navigace i přepínání podmínek. V prezentačním režimu vyzkoušet zobrazení na projektoru, kontrast a omezené animace.

Při rychlém přepnutí jazyka/CEFR si učitel všimne **předem viditelného upozornění na reset**. V hotové misi zkontroluje, že není uvedena falešná procentní známka za mluvení.

## 6. Akceptační brány

- **TECH PASS:** nezávislá F3D statická CI a reálná browser QA na přesném commitu + regrese F2, F2.1A–E, F3A–C + offline `file://` s CSP hash. Tyto testy se teprve musejí spustit; jejich výsledek se zapíše až po doběhnutí.
- **TEACHER PENDING:** jazyková redakce všech 192 kombinací, zejména nativní revize C1/C2 a kontrola didaktické přiměřenosti jednotlivých misí.
- **DEVICE PENDING:** skutečný iPhone, Android, iPad/Safari Split View, VoiceOver/TalkBack, 200% zoom.
- **OWNER PENDING:** osobní schválení vizuálního návrhu, obsahu, hierarchie a školního využití.
- **RELEASE BLOCKED:** F4 nezávislý audit a až potom F5 nasazení. Draft PR není produkce, žádná změna hlavní větve.

### Závěr
F3D je **konzistentní návrh pro učitelskou přejímku**, nikoliv automaticky schválený výukový materiál nebo hotové vydání. Cizojazyčné verze byly napsány do kódu ručně a před vydáním potřebují kontrolu rodilým či jazykově kompetentním hodnotitelem.
