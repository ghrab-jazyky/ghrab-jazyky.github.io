# E4B — faktický audit dodané Reading Lab karty Plastic Ocean v2 (2026-11-05)

**Verdikt: NO-GO pro v3.4 compliance i publikaci.** Tento záznam neobsahuje studentský HTML zdroj ani žádná správná řešení. Učitelský klíč zůstává pouze v soukromém uživatelském ZIPu; do veřejného GitHubu nebyl nahrán.

## Původ podkladu
Soukromě dodaný balíček `Reading_Lab_Plastic_Ocean_and_Our_Choices_COMPLETE_v2_ALL_LANGUAGES.zip` má čtyři položky:
- studentský jednosouborový HTML (1,342,792 B);
- samostatný učitelský HTML klíč (359,565 B);
- README a VALIDATION.

Studentská karta: SHA-256 `6a87e08fad4f1fb8e6689fc5a95d811127f26097cf289f679ea17b7d5979be78`. README datuje pilot na 2026-11-04 a výslovně uvádí původní standard **master prompt v3.2**. Nejedná se o hotový produkt v3.4.

## Nezávislé statické testy (opravdu vykonané)
- ZIP CRC: **PASS**; 4/4 soubory.
- Jediná studentská HTML s vloženými JS/CSS; externích linků, skriptů, stylů a médií **0**. 3 vložené JavaScripty prošly `node --check`.
- JSON `DATA`: **24/24** kombinací EN/ES/DE/FR × A1–C2, **360/360** jedinečných ID, strategie 3/3/4/6/7/7, přesně 3 otázky na tab.
- Přímo z karty (nikoli z README): všechny deklarované důkazní textové úseky byly nalezeny v příslušném odstavci přesně jednou; **78** deklarovaných lokalizací cílových výrazů existuje; nenašli jsme odkaz jiné úlohy na vynechanou větu mimo soudržnost.
- Délky: EN 216/255/336/468/560/700; ES 97/150/216/337/421/540; DE 105/130/209/287/390/533; FR 115/154/242/338/437/605 slov.
- Kontrakt stávajícího osobního slovníčku **souhlasí s Reading Lab v3.4**, nikoli s experimentálním E4A: IndexedDB `reading-lab-vocabulary` v1, store `words`, `keyPath: id`, export `reading-lab-vocabulary-backup`; odpovědi v `sessionStorage` pod `reading-lab-answers:plastic-ocean-and-our-choices:v2`.
- Klíč jako samostatný HTML existuje a obsahuje 360 bloků odpovědí; jeho obsah a správnost nejsou zveřejněny a nebyly zde znovu nezávisle pedagogicky hodnoceny.

## Omezený Chromium test (skutečně spuštěný, nikoli HTTP či file://)
Testovací administrátorské prostředí blokovalo navigaci na `file://` a `localhost`. V Chromiu jsem proto pouze vykreslil celý HTML přes `page.set_content`. Ověřeno: 24 variant bez JS chyby, výchozí EN/B1 a slovník OFF, zobrazení tří otázek v aktivní záložce, první pokus zachován po opakovaném Check a Clear, přepnutí slovníku mění `aria-pressed` OFF/ON/OFF, screenshoty 1440×900 a 390×844 bez horizontálního přetékání.
**NEOVĚŘENO:** přímý file:// provoz, HTTPS, reálná IndexedDB přes obnovení stránky, dvě skutečné karty na stejném originu, export/import, Safari/iOS, Android a test s assistive technology. Předchozí tvrzení VALIDATION v2 o 44/44 Playwright PASS jsou podklad od autora, nikoli nově zopakovaný test.

## Kritické mezery proti master promptu v3.4
1. **Chybí vizuální čísla odstavců** `data-num` + CSS `::before`: render používá pouze `<p id="paragraph-0">` apod. Bez čísel v každé ze 24 variant. §7, §8.
2. **Chybí obousměrná navigace**: `showEvidence()` zvýrazní pasáž, ale neexistuje plovoucí `Back to question`, klikací návrat na pasáž, obnovení původní záložky/focus/Esc dle v3.4. §8.
3. **Nezávislý zkoušející s textem pro A1–B1 chybí** — přiložená VALIDATION v2 to výslovně přiznává; závěrečná oprava B2–C2 není ověřena novým kolem. §13E.
4. **Slepý test C1/C2 nebyl po záložkách.** v2 zkoušela všech 42 úloh dané varianty naráz, zatímco v3.4 je závazný test izolované jedné záložky a cílové limity ~50 % pouze u Scanning, Matching a Close reading. Staré výsledky (Scanning 71 %, Matching 46 %, Close reading 100 %) **nelze považovat za splnění aktuální metodiky**. §7A, §13E.
5. Plné 100% pokrytí offline slovníku je **tvrzením z přiložené VALIDATION**, nikoli výsledkem nezávislého opakovaného morfologického testu. Nadále REVIEW.
6. Některé doporučené délky ES/DE/FR jsou nižší; README riziko přiznává. v3.4 nevyžaduje automaticky prodlužovat existující ES/DE/FR. Posoudit pedagogicky.

## Dopad na roadmapu
- Použít balíček jako **existující skutečnou referenci pro audit**, ne jako schválenou v3.4 kartu a ne jako přímý release.
- Nedovolit připojení E4A legacy adapteru (`lsh-test`, `senseId`) k této kartě ani přepis formátu `reading-lab-vocabulary`.
- Nezveřejnit učitelský klíč, nezakládat veřejný studentský katalog.
- Podle §12B nejdřív schválit `Can Mistakes Help Us Learn?` v4.3, potom aktualizovat a schválit Plastic Ocean na v3.4 včetně navigace, číslování a všech QA; katalog až poté.
- Původní uživatelský ZIP je nezměněn; žádný soubor karty se neposílá na GitHub, Cloudflare ani do `main`.

**Tento audit nezahrnuje nezávislé hodnotící agenty pro všech 360 úloh ani reálné mobilní Safari.**

Detailní plný Markdown audit je dostupný jako samostatná příloha v konverzaci, nikoli jako veřejné zdrojové soubory karet.