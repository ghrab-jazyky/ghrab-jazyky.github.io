# Language Skills Hub — kompletní sjednocení všech karet (závazná migrační roadmapa)

**Rozsah a datum:** R5, 7. 11. 2026 · pouze školní `ghrab-jazyky/ghrab-jazyky.github.io`, cesta `/zkusebni/`.

**Uživatelské upřesnění:** Dodělat samotnou aplikaci **nestačí**. Projekt bude dokončen teprve ve chvíli, kdy **všechny existující konverzační, čtecí a poslechové karty** budou sjednocené podle příslušných tří referenčních karet, pedagogicky i technicky ověřené a připravené v katalogu. Stejný standard platí automaticky také pro každou novou kartu při jejím přidání.

## 1. Inventář a definice rozsahu

| Laboratoř | Aktuálně existujících témat | Referenční vzor | Ještě k migraci po finalizaci reference |
|---|---:|---|---:|
| Conversation Lab | **21** | Umělá inteligence (EN/ES/DE/FR × A1–C2) | **20** |
| Reading Lab | **5** | Asteroids v2.3 (EN/ES/DE/FR × A1–C2) | **4** |
| Listening Lab | **3** | Matthew McConaughey v3 (EN × A1–C2) | **2** |
| **Celkem** | **29** | **3** | **26** |

Zdroj inventáře: veřejný `data/manifest.json` a `data/editorial-inventory.json` ze 7. 11. 2026. Fiktivní čtecí demonstrace *Muzeum Niva* se do 29 skutečných témat **nepočítá**. *Human Rights* je v redakčním backlogu jako plánované téma bez aktuálně publikovaného zdrojového HTML; při jeho dodání se inventář rozšíří. Přesný seznam a průběžný stav každé z 29 karet je v `data/unification-tracker.json`.

**Důležité:** reference je **vzorem pro sjednocení**, nikoli automatickým souhlasem s klasifikovanou testovou verzí. Učitel schválil vzhled procvičovacího Matthew v3; ostatní pedagogické i integrační brány zůstávají aktivní. Referenční AI má otevřenou jazykovou revizi a konflikt mezi nahraným a existujícím zdrojem; Asteroids vyžaduje doplnění nezávislé pedagogické kontroly. Nevydávat návrhy za schválené vydání.

## 2. Co znamená sjednocení: společný standard vs. pedagogika

### Společné napříč celým Language Skills Hub

- Jednotný vzhled a ovládání v rámci dané laboratoře: hlavička, navigace, přepínače, motivy, nápovědy, čitelnost, konzistentní komponenty, štítky a mobilní ergonomie.
- Jednotný model `topicId`, zdrojové verze, jazykové varianty a CEFR; konkrétní anotace opravdu odpovídají obsahu každé karty.
- Smlouva studentských parametrů: `?lang=en|es|de|fr`, `?level=A1..C2`, `?zamek=1`, při zachování stávajících platných odkazů; výběr jen variant skutečně dostupných v kartě. **Volná** a **pevná** varianta musí fungovat ve skutečném studentském HTML, nejen v katalogu.
- Procvičování a Testování = **dvě odlišné studentské realizace jednoho tématu** (nikoli duplikátní položky katalogu, ani pouhé vypnutí slovníku); schvalují se samostatně.
- Přímý odkaz, totožný QR, kopírování, stažení QR a funkční export/offline balíček procvičování podle technických vlastností karty. Externí YouTube video nelze označit za offline dostupné.
- Správná funkce na PC, iOS Safari, Android Chrome, iPadOS včetně práce s dialogy a rozdělenou obrazovkou; jasně dané chování resetu a uložení práce.
- Učitelské klíče a výsledky konkrétních žáků se **nesmějí** objevit ve veřejném repozitáři, katalogovém JSON, veřejném CI artefaktu ani ve studentských QR.
- Veřejný GitHub Pages není autentizovaný učitelský účet ani bezpečný zkouškový server. Bezpečnost testu a způsoby odevzdání se nesmějí nadhodnocovat.

### Conversation Lab — migrace podle Umělé inteligence

- Zachovat skutečný obsah a věkově přiměřenou jazykovou progresi původních témat. Vzor: strukturovaná konverzační stanoviště, hlavní a doplňující otázky, Explain / Support / Challenge / Stretch, jazykové opory, čtyřjazyčný offline slovník a smysluplná diferenciace A1–C2.
- Každou ze **21** karet prověřit zvlášť pro čtyři jazyky a šest úrovní (24 variant); technické prvky sjednotit bez kopírování identických otázek do jiných témat.
- Praktická testovací podoba má být samostatné kratší ústní zadání; hodnocení učitelem podle schválené rubriky. **Nevytvářet** automatické známkování mluvení ani nová hodnoticí kritéria.

### Reading Lab — migrace podle Asteroids v2.3

- Zachovat autentický text a pedagogickou strukturu podle úrovně: čtení s porozuměním, smysluplné typy úloh, odhalení podpůrných pasáží, kontrola správnosti, offline slovník zapínatelný/vypínatelný a osobní slovníček.
- Každou z **5** karet vyhodnotit pro skutečné 24variantní pokrytí, správnost jazyků, obtížnost, počet úloh, jednoznačnost klíče a odkazy na evidence; nesrovnalosti řešit individuálně.
- Test = **samostatně zvolený, zpravidla kratší set úloh**, bez průběžného prozrazování výsledků, s předem schváleným bodem/hodnocením.

### Listening Lab — migrace podle Matthew McConaughey v3

- Vzor pro poslechy: **Before Listening → First Listening (big picture) → Second Listening (interpretation) → Third Listening (written evidence + reconstruction) → Optional Language → After Listening**, pokud tyto aktivity dávají pedagogický smysl pro konkrétní nahrávku. Zachovat rozlišení automaticky bodovatelného jádra a písemné odpovědi kontrolované učitelem; pomocná slovní zásoba mimo hlavní skóre.
- U **3** existujících poslechů prověřit věkovou vhodnost média, přesný čas ve videu, dostupnost přehrávání na školní síti, všechny dostupné CEFR varianty a skutečný soulad úloh s nahrávkou. Nepřenášet mechanicky počet otázek nebo konkrétní části projevu z Matthew.
- Test = samostatný kratší výběr úloh a samostatně schválená pravidla přehrávání/hodnocení.

## 3. Postup bez rizikového hromadného přepisu

1. **R5A — katalog:** dokončit pracovní učitelské rozhraní pro tři laboratoře, hledání, filtry, procvičování/testování a sdílení. PR #27 je *výhradně první pilotní krok*; zatím nenasazovat jako kompletní výsledek.
2. **R5B — uzavření 3 referencí:** schválit přesné zdrojové verze, zapracovat potřebné opravy a vytvořit samostatně ověřené integrační kontrakty; ponechat originály a učitelské klíče v bezpečí.
3. **R5C — skutečné studentské URL/QR:** na všech třech referencích implementovat volnou a pevnou volbu jazykové a úrovňové varianty; provést E2E QR → správná studentská varianta. Implementace katalogu nesmí předstírat funkcionalitu, kterou karta nemá.
4. **R5D — odlišné testy:** pro každou ze tří referencí navrhnout a samostatně schválit obsahově kratší testovací variantu, podmínky spuštění, hodnoticí kritéria a práci s výsledkem. Nesmí se pouze skrýt slovník v procvičování.
5. **R5E — série konverzačních karet:** zbývajících 20 karet migrovat v malých kontrolovatelných balíčcích; prověřit 24 variant na každou kartu a dopady na obsah a slovník.
6. **R5F — série čtecích karet:** zbývající čtyři témata migrovat po jednom, se samostatným pedagogickým auditem a ověřením učitelských klíčů mimo veřejný repo.
7. **R5G — série poslechových karet:** zbývající dva poslechy migrovat individuálně se skutečným audiovizuálním zdrojem a ověřením opakovatelného přehrávání.
8. **R5H — společné QA a vydání:** automatizované regresní testy, Chromium/WebKit, testovací zařízení a školní Wi‑Fi, kontrola každého odkazu/QR, absence veřejných klíčů, fyzická UAT, pedagogické potvrzení, teprve poté vydat všechny schválené karty do standardního katalogu. Nezavádět žáky na stále nezrevidované návrhy.

**Průběžné doplňování:** Nová karta musí při přijetí projít stejnou migrační/publikační branou. Bez kontrol a schválení ji neoznačovat za připravenou.

## 4. Definition of Done — pro KAŽDOU kartu

- [ ] Doložen zdrojový HTML, verze, checksum a průkazně vyřešené rozdíly proti stávajícímu GitHub souboru.
- [ ] Pedagogická osnova odpovídá příslušné referenci a současně tématu, věku a úrovni; u výukového materiálu zdokumentovány cílová úroveň, skupina, cíl, čas, podpora slabších a rozšíření pro silnější.
- [ ] Všechny deklarované jazykové a CEFR kombinace fyzicky a datově existují a jsou jazykově ověřeny.
- [ ] Interaktivní ovládání, průběžná kontrola, uložení/reset, offline slovník / osobní slovníček (je-li relevantní) i klávesnice bez chyb.
- [ ] Volná i pevná URL varianta fungují, `lang/level/zamek` odpovídají skutečnému studentskému zobrazení. Starší odkazy nezůstávají rozbité.
- [ ] QR při otevření vede na totožnou konkrétní variantu; testy čárového kódu na mobilu a tabletu úspěšné.
- [ ] Procvičovací export je použitelný offline v rozsahu jeho skutečné funkčnosti; případná streamovaná média mají srozumitelně uvedené omezení.
- [ ] Testovací sada je samostatná a schválená; žádné nepodložené známky/rubriky a žádné vydávání lokálního prohlížečového omezení za neprůstřelné zabezpečení.
- [ ] Studentům ani do veřejného GitHub repozitáře neunikají soukromé učitelské klíče či identifikovatelné výsledky.
- [ ] Regresní test desktop + Android + iOS/iPadOS, zejména dialogy, fullscreen a split-screen, bez JS chyb/overflow.
- [ ] Učitel provedl finální pedagogickou přejímku. Teprve poté přesun do sdíleného schváleného katalogu.

## 5. Definice dokončení celého projektu

**Není hotovo:** existuje pěkný rozcestník a tři referenční HTML, ale zbývajících 26 témat jsou odlišné verze bez jednotného kontraktu.

**Je hotovo:** stabilní katalog plus všech 29 aktuálních karet převedených a auditovaných podle odpovídající reference; přesné QR, volné/pevné varianty, prověřené offline exporty a samostatně řešené testovací režimy; obsah nové karty podléhá stejným pravidlům. Pokud se u konkrétní karty vyskytnou legitimní pedagogické odchylky, musí být zdokumentovány a schváleny, nikoli mechanicky odstraněny.

**Stav 7. 11. 2026:** Scope a checklist zapsány. Neznamená to, že migrace existujících karet už proběhla.
