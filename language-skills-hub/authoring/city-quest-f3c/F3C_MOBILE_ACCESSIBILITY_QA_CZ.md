# City Quest – F3C: Mobilní použitelnost, přístupnost a mapa
**Datum:** 22. 11. 2026  
**Výchozí certifikovaný commit:** F3B `cae9131312ae18c29d89499a81213bb9e1b13c7b` (PR #152)  
**Cílová větev:** `feature/lsh-city-quest-f3c-mobile-a11y-map`  
**Režim:** offline, bez serveru, requestů, telemetrie, ukládání dat, TTS a záznamu hlasu.

## Funkční a UX cíle F3C
- **Mobilní město:** zachovat **jediný** navigační HUD a všechny 4 původní šipky u mapy. Uživatel si může zmenšit HUD na kompaktní D-pad, čímž odkryje podstatně více mapy; dalším stiskem okamžitě obnoví úplné jazykové zadání.
- **Metro mapa:** doplnit nativní seznam všech 14 stanic pro situace, kdy jsou uzly SVG v celkovém přehledu na mobilu příliš malé. Volba stanice nikdy neznamená přesun hráče ani splnění části úkolu.
- **Orientace:** tlačítko „Moje zastávka“ vycentruje aktuální herní polohu; „Mise“ vrací fokus k živému zadání, nikoliv jeho kopii. Přehled/čitelné detaily se přepínají stávajícím jediným tlačítkem.
- **Klávesnice a asistivní technologie:** šipky posouvají mapu metra jen při zaměření scrollovatelné oblasti, Enter/mezerník nad konkrétním SVG uzlem inspektuje stanici, `select` je přístupná alternativa pro touch/screen reader. Po změně fáze hry se fokus obnoví na novém platném tlačítku; stav akce je oznámen trvalou `aria-live=polite` oblastí.
- **Lokalizace:** ovládání mapy a kompaktního HUD je v EN, ES, DE, FR; názvy fiktivních stanic zůstávají anglickými vlastními jmény.
- **Responzivita:** 320×568, 375×812, 390×844, 568×320 (landscape), iPad 525px split-view, 768×1024, 1024×768, desktop 1366px. Žádný horizontální overflow dokumentu, minimální dotykový cíl 44×44 CSS pixelů.
- **Návrat:** F3A prezentační režim a F3B scénické animace, výluky i obsah se nemění. Při omezeném pohybu zůstává logika i výsledný obraz správný; žádný externí obsah.

## Důležité rozdíly: ovladač × mapa
Nativní `select` slouží **jen k prohlížení stanice**. Nemá žádné volání `RivertonMetroGame.act()`. Jediným zdrojem pravdy o postupu je existující deterministický herní engine. Není přípustné přidat „druhé“ tlačítko nastoupení, cestování, přestupu nebo další sadu navigačních šipek.

Kompaktní HUD je **alternativní zobrazení téhož jediného ovladače** a nemění uzly DOM ani event listenery směrových tlačítek. Plná jazyková instrukce zůstává okamžitě dostupná přes rozbalení HUD a v panelu mise.

## Pedagogická kritéria
| Parametr | Hodnota |
|---|---|
| Cílová úroveň | EN / ES / DE / FR, A1–C2 město; B1–C2 metro |
| Ročníky / věk | Gymnázium, přibližně 12–19 let |
| Cíl aktivity | Orientovat se ve městě i dopravní síti, dát instrukce, vysvětlit přestup a výluku v cílovém jazyce |
| Odhad času | 5–12 minut na stanici; 3–4 stanice na 45 minut |
| Pro slabší žáky | Kompaktní ovladač lze vypnout, opět zpřístupnit instrukci, kontrolovat názvy a směry přes seznam stanic |
| Pro silnější žáky | Porovnávat a zdůvodňovat řešení; ve dvojicích vysvětlit alternativu bez přímého ukazování na mapě |

## Automatické kontroly
1. **F2.1A regrese:** na telefonu jen 1 HUD, přesně 4 původní směrová tlačítka, žádné klonování, přemístění do desktopového sidebaru nad 1050px.
2. **F3C mobile:** kompaktní a plné zobrazení na 320/375/390/568/768/1024px, minimální plochy 44px, žádný vodorovný přesah.
3. **Metro seznam:** 14 položek; volba cílové stanice a „Moje zastávka“ nikdy nezmění aktuální pozici vlaku, historii ani krok.
4. **Klávesnice:** Enter na původních SVG uzlech, šipky nad scrollovatelným regionem; návrat do zadání zachová herní panel.
5. **Fokus:** po přijetí platné akce je fokusem nová volba, nikoli odstraněný DOM uzel, bez automatického přesunutí obrazovky.
6. **WebKit:** emulované iPad split-view 525×768, mobilní rozlišení a keyboard region.
7. **Celé HTML:** přísná hashovaná CSP, `connect-src 'none'`, bez jakýchkoli externích požadavků.
8. **Zpětná kompatibilita:** úplné F2, F2.1A–E, F3A a F3B workflow musí projít **na tomtéž HEAD commitu**.

## Ruční přejímka na reálných zařízeních – NENAHRAZOVAT emulací
Na fyzickém **iPhonu v Safari**, **iPadu v Safari (včetně Split View a otočení)**, **Androidu v Chrome** a na desktopu / dataprojektoru prověřit zejména:
- 320–390px viewporty a případný textový zoom 200 %; nic nesmí zmizet pod systémovou lištou.
- Zobrazení a dotyk všech šipek, velikost D-padu v kompaktním režimu, možnost návratu k plné instrukci.
- Ovládání `select` přes VoiceOver/TalkBack, správné čtení stanic a potvrzení, že výběr stanice neurychlí hru.
- Vyloučení gest Slide Over / Split View, která mohou měnit dostupnou šířku mapy.
- Test skutečné klávesnice i orientace v metru bez doteku.
- Žádné skoky stránky a ztráta fokusu při postupném cestování.
- Síť skutečně vypnutá: otevřít samostatné HTML a dokončit misi.

**Poznámka:** skutečná přístupnost dle WCAG 2.2 AA není prokázána pouze prohlížečovou emulací. Kritéria reálných čteček obrazovky, textového zoomu, kontrastu a vysvětlení jazykového obsahu musí potvrdit nezávislý lidský auditor.

## Gate k F3D / F4
F3C lze uzavřít jako **technicky PASS** jen po zeleném exact-HEAD CI a ověření certifikovaného exportu. Vizuální přejímka, fyzická zařízení a jazyková kontrola C1/C2 zůstávají **OPEN**. F3D je konsolidace F3, F4 je úplný nezávislý předprodukční audit a F5 řízené nasazení; tato větev **nesmí být bez výslovného schválení mergnuta ani vydána do produkce**.
