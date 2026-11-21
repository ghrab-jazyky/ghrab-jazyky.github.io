# City Quest — F3B: metro scény a hlášení (návrh k přejímce)
**Vývojový základ:** certifikované F3A, commit `0c05d1573d1ec0cee115346e740bc5437669889b`  
**Rozsah:** City Quest / LSH; práce na samostatné větvi; žádný merge ani produkční nasazení.

## Účel
Zlepšit věrohodnost a didaktickou hodnotu pohybu metrem bez zásahů do deterministického herního jádra, bez serveru, síťových požadavků, mikrofonu a automatického hodnocení mluveného výkonu.

## Implementace F3B — scénická a vizuálně-zvuková vrstva

1. **Perón (2,5D SVG):** dvojice posuvných dveří; otevírá se **jen tehdy**, když herní engine potvrzuje `phase === "board"`. Sám o sobě nevyvolá nastoupení ani pohyb hráče.
2. **Jízda (2,5D SVG):** mírný parallax městské siluety za okny; informační tabule s **nejbližší zastávkou až po nastoupení**; stav ani trasu nemění animace.
3. **Přestup:** samostatné nasvícené označení „INTERCHANGE“, aniž by se před volbou cesty zobrazila správná návazná linka.
4. **Výluka:** kontrastní výstraha o uzavřeném segmentu M1; nikde se předčasně neprozrazuje cesta přes University ani linky M2/M3.
5. **Simulovaná hlášení:** ručně sestavené a kontextově řízené texty v **EN, ES, DE, FR**, v každé misi a pro **B1, B2, C1, C2**. Stanice mají neměnné oficiální názvy v angličtině. Úroveň určuje návaznou mluvní mikroaktivitu, např. jednoduché shrnutí B1 vs. vhodná formální i neformální verze C2.
6. **Lokální zvuk:** po výslovném zapnutí v nabídce Experience generuje Web Audio krátké **originální signály** pro nástup, další zastávku, přestup, výluku a příjezd. Zvuk je ve výchozím stavu vypnutý; žádné soubory se nestahují; aplikace zůstává použitelná i při chybě zvukového zařízení.

### Důležité omezení: nahrávky mluvených hlášení
Tato etapa **zatím neobsahuje hlasově namluvená hlášení**. Nápisy na tabuli nesmějí být zaměňovány za poslechové cvičení. Používání systémového `speechSynthesis` není automaticky považováno za offline: konkrétní hlasy prohlížeče mohou mít nejasnou dostupnost, kvalitu i síťové chování.

**Pro skutečně prémiový jazykový poslech** doporučuji v navazující podetapě schválit sady profesionálních, právně použitelných **předem nahraných a do distribučního HTML vložených** hlášení ve čtyřech jazycích. Až po ověření výslovnosti rodilými mluvčími a pedagogickém auditu je lze označit jako `Listening` obsah. Za běhu stránky nesmí probíhat generování hlasu ani žádný externí request.

## Pedagogické parametry
- **Cílová úroveň:** město A1–C2, metro B1–C2; čtyři jazyky.
- **Věková skupina:** gymnázium, orientačně 12–19 let.
- **Cíl:** funkční navigace, čtení mapy, porozumění veřejným informačním tabulím, vysvětlení výluky, přestupu a alternativy.
- **Čas:** 5–12 minut na stanici; soubor 3–4 stanic do 45 minut.
- **Slabší:** textově podporovaná krátká hlášení, glosář, jasné pořadí pokynů, možnost odhalit model až v závěru.
- **Silnější:** shrnutí, porovnání, vysvětlení omezení a změna jazykového registru (B2–C2).

## Testovací brány
| Kontrola | Očekávaný výsledek |
|---|---|
| 64 úplných průchodů (4 jazyky × 4 úrovně × mise 05–08) | Všechny stavové přechody a tabule bez výjimky |
| Antispoiler | Před výběrem nezobrazovat správnou linku, terminus, nástupiště či odklon |
| WebKit/Chromium | Stavová logika, grafika, 320/390/768/1366 px, no overflow |
| Omezený pohyb | Bez animací při OS reduced motion či uživatelském vypnutí |
| Audio | Jen opt-in originální signály, žádné nahrávání ani přenos dat |
| Offline CSP | Jediné HTML, `connect-src 'none'`, bez externích požadavků |
| Regrese F2/F2.1A–E/F3A | Zachována dosavadní hratelnost a bezpečnost |

## Požadovaná přejímka
1. Ruční vizuální kontrola perónu, interiéru vlaku, výluky a přestupu.
2. Nativní jazyková revize PA ve španělštině, němčině a francouzštině a pedagogické vyhodnocení rozdílů B1–C2.
3. Testy na skutečném Androidu, iPhonu a iPadu, včetně Safari, rotace a odezvy dotyku.
4. Teprve potom rozhodnutí, zda je scénická část F3B vizuálně přijata, a zda může začít **offline hlasový balíček** a F3C.

**Release:** produkci nenastavovat. F4 (nezávislý předprodukční audit) a F5 (řízené vydání) zůstávají samostatnými etapami.
