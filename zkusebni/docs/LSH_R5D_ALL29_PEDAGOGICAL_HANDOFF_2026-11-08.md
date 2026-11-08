# Language Skills Hub – R5D ALL29: pracovní přejímka 642 kratších testových variant

**Stav:** návrhy pro pedagogy, **NENÍ SCHVÁLENO, NENASAZOVAT**. Datum: 8. 11. 2026. Pracovní PR #27.

## Co je vyvíjeno

| Oblast | Témata | Jazykové varianty | Model |
|---|---:|---:|---|
| Conversation Lab | 21 | 21 × 4 jazyky × 6 úrovní = **504** | 3 místo 8 stanovišť, vždy hlavní a jedna doplňující otázka |
| Reading Lab | 5 | 5 × 4 jazyky × 6 úrovní = **120** | celý původní text + 5 otázek A1/A2 nebo 6 otázek B1–C2 |
| Listening Lab | 3 | 3 × EN × 6 úrovní = **18** | 2× main idea, 2× detail, 1 písemná evidence a 1 rekonstrukce |
| **Celkem** | **29** | **642** | 29 samostatných témat v katalogu, testový návrh není další tématem |

Podklady se vytvářejí z 29 přesně verzovaných studentských HTML stávajícího **neschváleného** katalogu. **Nesmí se zaměnit za opravované izolované karty R7/R8, ani za pedagogicky schválené originály.** Zdrojový Git blob SHA-1 každé karty a samotný katalog jsou připnuty v `data/r5d-all29-source-pins.json`; výstup má nový SHA-256 pro každou variantu.

## Pedagogická metadata

- **Cílová úroveň:** A1–C2 podle varianty. **Skupina:** orientačně gymnázium 12–19 let, skutečné zařazení musí určit vyučující.
- **Mluvení (8–12 minut ve dvojici, návrh):** učitel pozoruje reakci a rozvíjení odpovědí. *Slabší:* přiměřený čas na přípravu a případná jazyková opora podle schválených podmínek. *Silnější:* protipříklad, zdůvodnění a doplňující otázka.
- **Čtení (12–25 minut podle úrovně, návrh):** výběrové otázky na hlavní sdělení, detail, inferenci a strukturu; u C2 v referenční podobě také tón. *Slabší:* případné časové přizpůsobení dle předem oznámených pravidel. *Silnější:* odůvodnění výběru citací konkrétní pasáže.
- **Poslech (20–30 minut včetně přehrání, návrh):** hlavní sdělení, detail a pořadí výpovědí. *Slabší:* povolené opakování/titulky jen za spravedlivě určených podmínek. *Silnější:* otevřená odpověď s odkazy na momenty projevu.
- **Hodnocení:** jakákoli známka, bodový limit, vážení jednotlivých dovedností i pravidla částečného uznání zůstávají **NESCHVÁLENÉ**. Není dovoleno si je domyslet.

## Kritické hranice a bezpečnost

1. Neexistuje žádná automatická klasifikace ani kontrola správných odpovědí, zobrazení klíčů, odeslání formuláře či ukládání odpovědí.
2. Žádné přihlášení žáků, jména, e-maily nebo měření chování. Vše jsou samostatná tisknutelná HTML pro **kontrolu učitelem**.
3. Referenční poslechová média nejsou přibalena; přehrávání i přístup ve školní síti jsou neověřené. Peaky Blinders vyžaduje věkovou a obsahovou přejímku.
4. U Reading Lab stále existují izolované návrhy R7 na 16 oprav matching + 1 vysvětlení. Veřejné kandidátní zdroje ALL29 tyto opravy automaticky nepřebírají.
5. U Conversation Lab existují izolované opravy R8/R8.1; tento balíček je nepovažuje za schválený nový základ. Obdobně u poslechových kandidátů R8 (Peaky C1 a stav hodnocení).
6. Github Pages a statické HTML nejsou bezpečné zkoušení: samotný „zámek“ URL není přístupová kontrola. Vystavení klíčů či budoucích neveřejných testů by vyžadovalo jinou architekturu a výslovné schválení.
7. Tlačítko **Testování zůstává deaktivované** u všech 29 katalogových témat. Nedochází ke změně `main`, katalogového JSON ani studentských originálů.

## Technické ověření

- `tools/r5d-all29-test-drafts.cjs` – hromadná generace mimo Git worktree, ověření zdrojových blobů a stavu katalogu.
- `tests/r5d-all29-test-drafts.test.cjs` – přesně 642 variant, 29 témat, jazyková a úrovňová úplnost, SHA-256, nepřítomnost klíčů, neměnnost zdrojů, negativní test pokusu o zápis do veřejného stromu.
- `tests/r5d-all29-test-drafts.browser.test.cjs` – reprezentativní matice 29 témat × 6 úrovní, Chromium/WebKit, offline zobrazení, mobilní horizontální rozměry, volitelné odpovědi bez zasílání.
- `.github/workflows/lsh-r5d-all29-test-drafts.yml` – dvě oddělené CI úlohy a po úspěchu krátkodobý neveřejný pracovní ZIP jako GitHub Actions artefakt.

**Neodvozovat „PASS“ automaticky z této dokumentace.** Platí jen výsledky aktuálních dokončených GitHub Actions; chybu je nutné opravit a přetestovat.

## K vydání jedné testové varianty bude nutné

- Ověřit přesnost zadání, CEFR, délku, cíl a vhodnost původního textu či nahrávky.
- Vybrat schválený základ (po R7/R8 korekcích) a znovu synchronizovat neveřejné učitelské klíče.
- Rozhodnout způsob realizace a hodnocení; bez hotových pravidel se automatické skóre nesmí implementovat.
- Otestovat fyzický telefon/tablet, školní síť, QR a externí média.
- Získat výslovné pedagogické schválení a teprve pak jednotlivě uvolnit tlačítko `Testování` v katalogu.

**Závěr:** R5D ALL29 je podklad pro rychlou hromadnou pedagogickou kontrolu; **není to vydaná ostrá testovací aplikace**.
