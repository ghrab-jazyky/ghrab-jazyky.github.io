# Listening Lab — jednotný standard pro pět zdrojových témat a dvě tlačítka katalogu
**Rozhodnutí učitele 7. 11. 2026 · návrh pro DRAFT PR #27 · bez merge/deploy.**

## Jednotné poslechové karty
Všech pět témat musí mít **stejný studentský design a pedagogickou strukturu** podle jedné existující reference **Matthew McConaughey Listening v3**:
**The Video → Before Listening → First Listening → Second Listening → Third Listening (Written Evidence + Reconstruct the Speech) → Optional Language → After Listening → Check Answers.**
Vizuální komponenty, ovládání, přepínače, výsledky procvičování a mobilní ergonomie mají sdílet jeden standard; konkrétní obsah musí vždy vycházet ze správné nahrávky a konkrétní úrovně.

Všech pět témat cílově poskytuje *anglicky* šest pedagogicky odlišných úrovní A1, A2, B1, B2, C1, C2, s cílem, věkovým určením, časovou dotací, oporou slabších a rozšířením pro silnější. Nevyžadovat naprosto stejné počty úloh tam, kde se liší audio; vyžadovat stejné sekce a UX. Otevřené odpovědi kontroluje učitel, volitelná slovní zásoba se nepočítá do hlavního automatického skóre.

## Pět původních materiálů, nikoliv již pět položek katalogu
- **ll-matthew-oscars** – referenční studentské HTML v3, A1–C2, již integrováno v pilotu.
- **ll-harrison-ford** – starší A1–C2, již integrováno jako URL pilot; potřebuje samostatnou Third Listening a mediální UAT.
- **ll-peaky-no-fighting** – starší A1–C2, již integrováno jako URL pilot; potřebuje Third Listening a zvlášť věkovou přejímku (vulgarity/drogy).
- **ll-ted-conlangs** *(prozatímní ID pro příjem)* – nově dodaný studentský/učitelský ZIP A1–C2, dosud NENÍ v katalogu; potřebuje sjednocení a validovaný import.
- **ll-how-to-choose-news** *(prozatímní ID pro příjem)* – dodaný původní TEST jen B2/C1, dosud NENÍ v katalogu; pro jednotné procvičování je nutno skutečně vytvořit šest různých úrovní A1–C2. Původní známkování a localStorage studentName se do nové procvičovací karty nepřenáší.

Dosavadní pilotní inventář **3/3** zůstává po dobu migračního auditu beze změny; neoznačovat jej chybně za pět publikovaných karet. Nová soukromá učitelská dokumentace a odpovědní klíče se do veřejného repozitáře nepřidávají.

## Jedna katalogová položka = dvě tlačítka
**Procvičování**: otevře stejnou Matthew-v3 studentskou kartu přes přímé URL/QR; nastaví odpovídající jazykovou/CEFR variantu a volitelný UI-only `zamek=1`, `practice=1`.

**Testování**: samostatné tlačítko u **stejné katalogové položky**, nikoliv odlišná typová řada karet. Dokud neexistuje schválená samostatná kratší sada a pravidla hodnocení/přehrávání, tlačítko **zůstává deaktivované (not-ready)**. Pouhé skrytí slovníku neznamená samostatný test. Veřejné GitHub Pages/klientské HTML nejsou zabezpečené školní zkušební prostředí.

Původní `How to Choose Your News TEST` je historický zdroj úloh, ne nová defaultní UI šablona; nesmí se použít pro záměnu těchto režimů ani automaticky zveřejnit.

## Přijetí a vydání
Doložit zdrojový SHA-256, obsahovou kontrolu všech skutečných EN A1–C2 variant, kontrolu odpovědí vzhledem k médiu (u neověřené nahrávky explicitně označit blocker), JS/browser regresní testy, reálné zařízení/školní Wi-Fi, validaci URL/QR a výslovný souhlas učitele. Do veřejných zdrojů nevkládat soukromé teacher keys ani identifikovatelné žákovské výsledky. DRAFT/NO DEPLOY až do splnění bran.
