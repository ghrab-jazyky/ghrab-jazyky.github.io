# Language Skills Hub — R4A: technický audit referenčních kandidátů

**Datum:** 6. listopadu 2026  
**Rep:** ghrab-jazyky/ghrab-jazyky.github.io  
**Stav:** technický předběžný audit, bez pedagogického schválení karet.

## Posloupnost

Nejprve vyzkoušet všechny stávající karty online, potom na jedné referenční kartě z každé kategorie schválit výsledný technický a pedagogický standard a teprve následně jej aplikovat na další karty. Každá dovednost si ponechává vlastní výukovou logiku.

**Navržení, zatím neschválení kandidáti:** Conversation — Rodina; Reading — Can Mistakes Help Us Learn?; Listening — Matthew McConaughey, Oscars 2014.

## Automaticky ověřená struktura

| Oblast | Dokončené ověření | Omezení |
| --- | --- | --- |
| Conversation, Rodina | 24 variant (EN/ES/DE/FR × A1–C2) v aktivním technickém manifestu; stav ROZPRACOVANO | Detailní jazykové a pedagogické hodnocení není hotové |
| Reading, 5 studentských karet | Každá obsahuje 24 variant, celkem 120 variant | Různá obtížnost variant ještě není pedagogicky ověřena |
| Reading, otázky | 5 × 360 = 1 800 otázek; platné indexy odpovědí, identifikátory a prokazatelná existence evidence pasáže v příslušném odstavci | Nedokazuje jednoznačnost otázky, pravdivost argumentace ani úroveň CEFR |
| Listening, 3 studentské karty | 3 × 6 = 18 úrovňových verzí a 161 uzavřených gist/detail otázek | Neověřuje shodu s aktuálně dostupným videem nebo správnost výkladu |
| Zdrojové balíčky | Osm původních studentských HTML je dostupných jako veřejné TEST náhledy; odpovídající učitelské klíče byly drženy mimo veřejný repozitář | Není hotová nezávislá pedagogická ani fyzická mobilní UAT |

### Odlišnosti kandidátů

**Reading Lab:** všech šest úrovní a čtyři jazyky; offline český slovník, lokální slovníček reading-lab-vocabulary; parametrické přepnutí podle jazyka a úrovně v URL. Chybí úplné pedagogické hodnocení v3.4 a konečné obousměrné propojení otázka ↔ číslovaný odstavec.

**Listening Lab:** šest úrovní a automatické vyhodnocování, ale prozatím chybí načtení požadované úrovně přímo z URL. Video se načítá z externí služby; aktuální dostupnost iframe a konkrétního časového úseku je nutné potvrdit v reálném zařízení.

**Conversation Lab:** kandidát Rodina má 24 manifestových variant a samostatné konverzační HTML. Chybí závěrečný standard jazykové revize a kontrola všech funkčních cest na fyzických zařízeních.

**Společná funkcionalita:** školní GitHub Pages neřeší autentizaci učitele. Nepřesouvat soukromé klíče na veřejné Pages. Sjednocení slovníčků vyžaduje oddělený projekt migrace s ochranou dříve uložených dat.

### Opravená redakční evidence

Před touto etapou redakční katalog nepřesně tvrdil, že některé originální Reading karty nejsou dostupné. Nyní všech osm online originálních studentských náhledů označuje jako public-test-preview, nikoli jako schválené studentské karty. Nová regresní kontrola porovnává katalog a skutečně dostupné soubory.

## Nový přímý online kontrolní list

Adresa: https://ghrab-jazyky.github.io/zkusebni/revize/

Zapisuje zvolenou referenci, zařízení, prohlížeč, jazyk, CEFR úroveň, ověřené oblasti, výsledek a kroky reprodukce. Vše se ukládá **jen do místního prohlížeče**, nikam se neposílá. Uživatelský záznam lze exportovat do LSH-referencni-testy.json pro následné opravy. Výslovně nezapisovat osobní údaje studentů.

Doporučený postup testování:
- **Úroveň/věk:** A1–C2, gymnázium; podle konkrétního tématu cca 12–19 let. Pro autentický Listening je A1/A2 úroveň úloh, ne automaticky úroveň nahrávky.
- **Cíl:** odhalit chyby ovládání, konzistence jazykových variant, obtížnosti, rozhraní a ověřování odpovědí.
- **Doba:** přibližně 15–25 minut na jednu variantu, plus samostatné kontroly zařízení a jazyků.
- **Slabší žáci:** ověřit podpůrné instrukce, návaznost kroků a případný slovník; u poslechu krátké opakované úseky.
- **Silnější žáci:** ověřit interpretaci C1/C2, kvalitu distraktorů a oporu odpovědí v textu či médiu.

## Co zatím není hotové

1. Skutečná nezávislá revize referenčního Reading Lab podle původní brány 80 případů / 528 odpovědí. Poslední doložený stav byl 0/80 a 0/528.
2. Plnohodnotná referenční navigace mezi otázkou a očíslovaným odstavcem, bez ztráty původních dat.
3. Přímé nastavení CEFR úrovně poslechu pomocí URL a doplnění dalších technických požadavků Listening Lab.
4. Jeden studentský slovníček napříč třemi laboratořemi s bezpečným importem/exportem.
5. Nezávislé fyzické testy Android, iPhone, iPad a různých prohlížečů, včetně přehrávání konkrétního videa.
6. Učitelské klíče mimo veřejné Pages a jejich pedagogicky ověřená aktuální verze.

## Brána pro sloučení R4A

Očekáváme průchod všemi již existujícími CI, plus novými strukturálními testy Reading a Listening a prohlížečovým testem lokálního QA kontrolního listu. **Neměníme byte obsah osmi originálních studentských HTML, schválený manifest ani učitelské klíče.** R4A není finální vydání referenčních karet.
