# E4E – uzavření metodiky nezávislého QA Reading Lab v3.4

**Datum:** 5. 11. 2026  
**Stav:** DRAFT, NO-MERGE, NO-DEPLOY, PEDAGOGICKY NEOVĚŘENO  
**Základ:** E4D / PR #9, referenční Can Mistakes v4.3 (pouze lokální soukromý soubor)  
**Master:** Reading Lab v3.4, část §13E.

## Zásadní zjištění
Původní lokální `SCORE_RESPONSES_PRIVATE.cjs` skóroval i podmnožinu odpovědí
bez kontroly, že obsahuje **všech 80 předepsaných případů**. Pokus s pouhými
3 řádky místo 168 slepých otázek ukázal podstatné riziko metodického
zkreslení. Stav `INCOMPLETE` byl sice uveden, ale rozsah vyhodnocení nebyl
úplně zabezpečen. V E4E tento nedostatek odstraňujeme.

## Nový nástroj (jen obecný kód, bez originálního textu)
`zkusebni/tools/reading-v34-assessor-score.cjs`:
- vyžaduje **56** samostatných slepých případů C1/C2 a **24** případů
  s textem A1–C2, tj. **80 případů a 528 odpovědních polí**
  (168 blind + 360 with-text; nejde o 528 unikátních otázek);
- validuje SHA-256 původního student HTML proti soukromému manifestu;
- ověřuje jednoznačný seznam očekávaných případů, otázky, přípustná
  písmena A–D podle počtu možností a úplnost/duplicitní/neočekávané řádky;
- pro každého slepého posuzovatele umožňuje nejvýš **jednu záložku v C1
  a jednu v C2**, požaduje izolovanou relaci a deklarovaný zákaz přístupu
  k článku, klíči a jiným záložkám;
- skóruje závazné typy `scan`, `matching`, `detail` odděleně od
  sledovaných typů a upozorňuje nad cca 50 %; při pouze třech otázkách
  v záložce vznikají hodnoty 0/33,3/66,7/100 %;
- odpovědi/obsah student HTML ani správné možnosti neodesílá do sítě;
- **vždy** vrací `releaseDecision:NO_GO`, protože ani správné výsledky,
  ani prohlášení posuzovatele sama o sobě neprokazují nezávislost nebo
  jednoznačnost klíče. O schválení rozhoduje až odborný posuzovatel a učitel.

## Nezávislé testy v CI
`zkusebni/tests/e4e-assessor-score.test.cjs` používá **výlučně
syntetické podvržené otázky**; kontroluje odstraněné řádky, chybná
písmena, duplicitní ID, odlišný SHA-256 zdroje, porušení izolace
posuzovatelů, únik celé původní pasáže a to, že ani 528 vyplněných
**fiktivních** odpovědí nedá souhlas k vydání.

## Soukromá kontrola konkrétního v4.3 balíčku
Soukromý ZIP
`Reading_Lab_Can_Mistakes_v4_3_Independent_QA_Packets_REVIEW_ONLY.zip`
byl porovnán s originálním studentským HTML SHA-256
`1e15ca8bd4625d1efc271684de6324cc4ff353269749cacf4a5a68abcd24c8e3`.

- **80/80** případů sedí s úlohami originálu.
- **528/528** polí v obou šablonách existuje a je skutečně prázdných.
- Každá otázka i všechny možnosti jsou ve svém příslušném packetu
  přítomné; u slepých packetů nebyl zjištěn úplný odstavec článku.
- ZIP CRC, cesty, identifikátory, duplicity: bez statického nálezu.
- **0/80** případů posouzených nezávislým posuzovatelem;
  **0/528** dodaných nezávislých odpovědí.
- V soukromém pracovním prostředí vznikla revidovaná verze balíčku E4E
  obsahující přidělovací tabulku, deklarace izolace, notes pro odborné
  komentáře a opravené lokální vyhodnocení. **Do GitHubu se nenahrává**.

## Bezpečnost a nutná další práce
1. Zadání se musí **skutečně** předat samostatným posuzovatelům;
   jeden posuzovatel nejvýš jedna záložka z každé úrovně C1/C2.
   Neexistují-li nezávislé výstupy, **nesmí se vymýšlet** úspěšnost.
2. Všechny neshody z WITH TEXT, všechna odůvodnění i nejistoty
   analyzovat, opravit úlohy a opakovat příslušné slepé testy.
3. Závazné blind kategorie držet oddělené (Scanning/Matching/
   Close Reading); ostatní typy pouze vykazovat.
4. Souběžně je třeba revize fr:C1 Gist a fyzické iOS/Android/iPad,
   offline a IndexedDB testování.
5. Teprve po schválení Can Mistakes připravit verzovaný studentský
   HTML, učitelský klíč, README, VALIDATION a následně Plastic Ocean.
6. **Nikdy nepřenášet** učitelské klíče, skutečné podkladové odpovědi
   nebo privátní pracovní ZIP do veřejného GitHubu.

**GO:** nasadit QA protokol pro nezávislé posuzovatele a opravit obsah
podle doložených výsledků.
**NO-GO:** prohlašovat současné v4.3 za schválenou v3.4 kartu,
zveřejňovat klíče, spojovat PR do main či publikovat katalog/Cloudflare.
