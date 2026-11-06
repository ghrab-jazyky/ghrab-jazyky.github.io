# Conversation Lab — R4C: referenční kandidát „Umělá inteligence“
**Datum:** 6. listopadu 2026. **Stav:** ZVOLENA REFERENČNÍ KARTA, *zatím ne schválená pro plošnou migraci a není hotová testová verze*.

## 1. Vstup a priorita zdrojů

Učitel předal:
- `Umela-inteligence.html` — původní samostatné studentské HTML, **1 088 624 B**, SHA-256 `0598c67e27a126385875155310a042104c2f1fafa59cbec0884d4deef58a7813`, Git blob `8c220aa960a1cbc2d7733518570fbe68deb970b8`.
- `Convo lab - univerzální prompt na karty.txt` — skutečně jde o **AUDITNÍ MASTER PROMPT**, nikoli prompt pro generování nových karet; SHA-256 `647691791aa7d68a5b343fdd2e923e2b5b6afc2094aeb47cef070f85f24e3eaf`. Bajtově shodná kopie je v [`CONVERSATION_LAB_REFERENCE_AUDIT_PROMPT_2026-11-06.txt`](CONVERSATION_LAB_REFERENCE_AUDIT_PROMPT_2026-11-06.txt).

**Nezměněný originál** je uložen pouze pro ověřování na `/zkusebni/reference/konverzace/umela-inteligence/`. Public TEST-only soubor není součástí schváleného učitelského katalogu; existující školní karta `/zkusebni/konverzace/umela-inteligence/` zůstává nezměněna, protože nemá stejný Git blob/hash jako nahraná reference. Učitel měl výslovný požadavek původní soubor během auditu nepřepisovat.

Vše pod **`ghrab-jazyky/ghrab-jazyky.github.io`**, nikoli `Daniel22-dev`; QR odkazy a zobrazení pro žáky musí později pracovat se schváleným vydáním, nikoli s aktuálním testovacím souborem.

## 2. Nezávisle provedený technický audit

| Oblast z auditního promptu | Stav | Doklady a omezení |
| --- | --- | --- |
| 1. Funkčnost | **OK** pro původní procvičovací kartu | Chromium: 24 variant × 8 stanovišť; v každém 3 doplňující otázky, přepínání, Explain, Support, Challenge, Stretch, reset, časovač a motiv; bez JS výjimek. Samostatný TEST režim neexistuje. |
| 2. UX | **ČÁSTEČNĚ OVĚŘENO** | Chromium viewport 375, 390, 820, 1440, 1920 px, bez celostránkového horizontálního přetečení; reálná zařízení / odezva na školním plátně nebyly ověřeny. |
| 3. CEFR | **ČÁSTEČNĚ OVĚŘENO** | 24/24 variant úplných, přirozené postupné zvyšování obtížnosti; některé formulace A1 a opakování C2 je vhodné před schválením upravit (viz §4). Samostatné posouzení rodilým mluvčím pro každou jazykovou mutaci se neuskutečnilo. |
| 4. Kód | **S OPRAVAMI K INTEGRACI** | Inline HTML/CSS/JS bez externích skriptů/síťových URL; lokální preference. **Nezpracovává `?lang=`, `?level=` ani `?zamek=1`.** |
| 5. Kompatibilita | **ČÁSTEČNĚ / NEOVĚŘENO** | Test skutečného desktopového **Chromium** přes `page.set_content`, emulované šířky; Android/iOS Safari, Firefox/WebKit, file:// a iframe AI Studio nejsou tímto testem ověřeny. |
| 6. Čtyři jazyky | **DATOVĚ OK, LINGVISTICKY NEZAVŘENO** | EN/ES/DE/FR, všechny UI varianty mají data, 8 stanovišť na každé úrovni. 100% idiomatičnost a idiomatika slovníku zatím nebyly nezávisle zhodnoceny rodilými mluvčími. |
| 7. Default | **OK** | První otevření bez uloženého stavu = EN, B2, správné `<html lang=en>` a titul; dříve zvolený jazyk se běžně načítá z lokální preference. |
| 8. Offline slovník | **DROBNÉ NEDOSTATKY** | Čtyři vestavěné české slovníky a fráze; funkční dvojklik v Chromium. Automaticky zjištěné **přibližné**, nikoli kontextově ověřené pokrytí unikátních výrazů: EN 99,80 %, ES 99,66 %, DE 99,52 %, FR 99,62 %. |
| 9. Student-friendly | **S OPRAVAMI** | Obsahově má karta věkové scénáře, podporu slabších, výzvy silnějším a `Explain` u B2–C2. U několika formulací lze posílit přístupnost a odstranit obsahovou duplicitu bez snížení náročnosti. |

**Statická data**: 24 jazykově-úrovňových kombinací, **192 plných stanovišť**, **576 doplňujících diskusních otázek**, 8 hlavních otázek na variantu (192 celkem); na každé B2/C1/C2 variantě po třech vysvětleních každého ze 8 stanovišť (**288 doplňkových Explain**) a dalších 96 hlavních Explain (12 variant × 8). Každá varianta má 12 položek tématické slovní zásoby a 4 jazykové opory (toolkit). Žádná chybějící stanoviště/otázky ani duplicitní doslovné doplňující otázky v rámci varianty nebyly zjištěny.

**Spuštěné testy**: lokální Python strukturální analýza, JS aktivní test v desktop Chromium bez síťové navigace na file URL (policy blokuje), 24×8 skutečných renderů přes event-driven `click()` v prohlížeči, Playwright ukázky klikání do nápověd, změny motivu, nastavení/start/pozastavení/reset časovače, překlad dvojklikem, kontrola šířek a chyb JS (0). Nejde o fyzické iPhone/Android ani o nativní WebKit.

## 3. Nejpodstatnější zjištění, opravy před schválením

- **P1 / všechny jazyky a úrovně / QR:** původní karta není propojena s katalogovým `?lang=`, `?level=`, `?zamek=1`. Reprodukce: zdroj nečte `URLSearchParams` ani `location.search`; používá jen uložené preference. Náprava: po schválení reference zavést validaci parametrů se školním integračním kontraktem a běžné UI zamčení při fixed variantě. Na GitHub Pages jde jen o uživatelský zámek, nikoli proti obejití URL/zdroje.
- **P1 / všechny jazyky a úrovně / režimy:** testovací podoba není v originálu vytvořena. Není to chyba původní procvičovací karty; jde o nově dohodnutý produktový požadavek. Test má být **obsahově odlišný** (kratší strukturovaná ústní zkouška, hodnoticí postup učitele), ne jen skrytí nápovědy. Hodnoticí rubriku a délku nastaví až učitel s referencí; nevymýšlet známkovací kritéria.
- **P2 / EN+ES+DE+FR / A1, stanoviště 1 „AI Every Day“ / otázka 2:** `How does the app know what you like?` a její ekvivalenty směřují spíše k vysvětlování technického mechanismu než k začínající konverzaci. Návrh: EN „What songs or videos does the app show you?“; ES „¿Qué canciones o vídeos te recomienda la aplicación?“; DE „Welche Lieder oder Videos schlägt dir die App vor?“; FR „Quelles chansons ou vidéos l’application te propose-t-elle ?“; zachová téma osobních doporučení, lépe dosáhne A1.
- **P2 / EN+ES+DE+FR / C2, stanoviště 8 „The Rules We Want“ / otázka 3:** prakticky opakuje centrální otázku, kdo má mít poslední slovo při neshodě expertů a žáků/veřejnosti. Nahradit konkrétním interaktivním krokem: EN „What argument from the student council would make you reconsider your decision?“; ES „¿Qué argumento del consejo estudiantil te haría reconsiderar tu decisión?“; DE „Welches Argument des Schülerrats könnte dich dazu bringen, deine Entscheidung zu überdenken?“; FR „Quel argument du conseil des élèves pourrait te faire reconsidérer ta décision ?“. Zachovává náročnost C2, vyžaduje reakci na protiargument.
- **P2 / slovník / jednotlivé výrazy:** automatická kontrola nezachytila EN `rephrases`; ES `aclarar`, `verás`; DE `tatsachen`, `trenne`; FR `saisissez`, `reformulation` (výběr, ne úplný seznam). Doplnit ověřené české kontextové významy; nesplývat s pouhým pokrytím jednotlivých hesel.
- **P2 / B1 lokalizace:** EN varianta používá navíc `uiB1` se samostatnými formulacemi některých UI popisků, ostatní jazyky jej nemají. Posoudit, zda jde o účelnou lokalizaci, nebo nechtěnou asymetrii; nejde o doloženou chybu UI.

Z uvedených návrhů **nic není implementováno v originálním HTML**. Samostatná referenční verze se začne měnit až po souhlasu s implementační etapou.

## 4. Akceptační kritéria pro budoucí dva režimy Language Skills Hub

1. **Jeden učitelský záznam „Umělá inteligence“**, dvě akce **Procvičování** a **Testování**, dvě samostatně schválené sady úloh.
2. Procvičování zachová scénáře, 8 stanovišť, podporu, jazykové opory a offline slovník, budoucí učitelský QR povolí volnou/fixní variantu.
3. Pro nový **TEST** vytvořit vlastní kratší výběr **hodnotitelných ústních výkonových úloh** a hodnoticí postup podle zadání učitele. Nevydávat automatické body za mluvení bez pravidel a bez ověřeného nástroje na záznam výkonu.
4. Konfigurace testu: jazyk, CEFR, čas, povolené funkce, QR, dohledové detekce opuštění stránky. **Pozor:** statický GitHub Pages neumí vynucovat neobejitelné zámky, kontrolovat všechny formy split screen nebo garantovat autenticitu hodnocení.
5. Publikace: po samostatném schválení reference vytvořit regresní standard pro 20 zbývajících konverzačních karet. Ostatní HTML neměnit hromadně v této etapě.

### Výukové parametry reference

- **Cílová úroveň:** A1–C2; **věk/ročník:** 11–19 let (nižší i vyšší gymnázium).
- **Cíl:** přirozeně vést dialog o každodenních i společenských dopadech AI, formulovat příklady, argumenty a reagovat na spolužáka.
- **Čas:** podle originální karty přibližně 15–55 minut dle CEFR; doporučeno vybrat 3–6 stanovišť na lekci, ne nutně všech 8.
- **Slabší:** A1/A2, větné začátky, počet stanovišť 3–4, situace ze školního života. **Silnější:** B2–C2, Explain pouze pro pochopení otázky, Challenge, Stretch, protinázor a obhajoba.

## 5. Závěr, co je a není hotové

**REFERENČNÍ KANDIDÁT „UMĚLÁ INTELIGENCE“ — S OPRAVAMI**. Technicky soudržný a použitelný jako zvolený vzor procvičovacích konverzačních karet. Nejde o formálně schválenou finální referenci ani hotový test; zbývá integrační kontrakt `?lang` / `?level` / `?zamek`, nezávislá jazyková UAT a samostatná podoba testu. **Nyní ponechat originál nezměněný.**

**Odkazy k ověřování:** `https://ghrab-jazyky.github.io/zkusebni/reference/konverzace/umela-inteligence/` (po sloučení PR a nasazení Pages), učitelský kontrolní list `https://ghrab-jazyky.github.io/zkusebni/revize/`. Veřejný testovací odkaz není určen k známkování.
