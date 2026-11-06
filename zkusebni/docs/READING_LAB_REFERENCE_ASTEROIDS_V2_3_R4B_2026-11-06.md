# Reading Lab — přijetí referenční karty Asteroids v2.3 (R4B)

**Datum:** 6. listopadu 2026  
**Stav:** **URČENA REFERENČNÍ KARTA**, zatím **neschválena jako hotový klasifikovaný test**.  
**Vlastník a hosting:** výhradně [školní GitHub organizace `ghrab-jazyky`](https://github.com/ghrab-jazyky) a GitHub Pages; žádný osobní `Daniel22-dev`.

## 1. Kanonické soubory a kontrola původu

Učitel předal:
- `Reading_Lab_Asteroids_COMPLETE_v2_3_ALL_LANGUAGES.zip` — SHA-256 `0b1a125fe52cd11f9dfd8c1d650d86d3db101f0e387173d31c8f5bd2baf01603`.
- `Reading_Lab_MASTER_PROMPT_v3_5.txt` — byte-exact kopie v [`docs/READING_LAB_MASTER_PROMPT_v3_5.txt`](READING_LAB_MASTER_PROMPT_v3_5.txt), SHA-256 `3ca303c966fbf438c77691e180b417af7e765a361b508078eab3b1099a34f5a3`.
- **Studentský HTML v2.3** — přesně 1 442 681 B, SHA-256 `fc667a52f5f48407aa10dea31adda836ffdc88008e206a46727e94cc9991f82b`, Git blob `3f9f477e3c40ff71fc9403fac587cd9cce1ef4e2`.
- **Samostatný učitelský klíč v2.3** — SHA-256 `db785e1031f1726dada7c15848218347210ec73b276191669989c41d90058f0c`: **nesmí být ve veřejném GitHub Pages**.

**Veřejný studentský TEST náhled:** `/zkusebni/nahledy/cteni/asteroids/`. V rámci této etapy je původní veřejná v2.2 **nahrazena přesně původními bajty v2.3**. Původní v2.2 zůstává dostupná pro rollback přes historii repozitáře. Katalog i validační `preview-provenance.json` jsou přepnuty na v2.3, učitelské řešení není publikováno.

## 2. Co bylo ověřeno nezávisle při převzetí

| Kontrola | Výsledek |
|---|---|
| Integrita ZIP a 4 požadované soubory | PASS |
| Jazyky a úrovně | EN/ES/DE/FR × A1–C2, **24/24** |
| Počty a identifikátory otázek | **360/360**, 9/9/12/18/21/21 na jazyk; žádná duplicitní ID |
| Evidence anchors v konkrétních odstavcích | **391/391** přesných výskytů, žádná chyba |
| Multiple Matching B2–C2 | **12/12** sad se třemi různými odpověďmi |
| Rozsah správných odpovědí | všechny indexy platné |
| B2–C2 „správná odpověď jednoznačně nejdelší“ | v kontrolovaných variantách nejvýš **4/18 nebo 4/21**; nikde delší o více než 5 znaků |
| Javascript syntaxe | **4/4** inline skriptů prošly `node --check` |
| Studentská karta vs. samostatný učitelský klíč | **360/360** shoda ID, zadání, správné odpovědi a všech variant možností |
| Chromium základní vizualizace | funguje vykreslení, jazyk EN, výchozí slovník OFF, jeho ON/OFF, šířka 1440 i 390 px, bez JS výjimek či horizontálního přetečení |
| Test na skutečném HTTPS URL/iOS/Androidu | **NEOVĚŘENO** v době převzetí; GitHub CI provede další regresní kontrolu, fyzická UAT stále zbývá |

Chromium náhled byl testován přes `page.set_content` (prostředí blokovalo HTTP/file navigaci), proto tento dílčí test **nepotvrzuje** chování URL parametrů, IndexedDB na produkčním originu ani skutečný Safari.

## 3. Pedagogická omezení podle souboru VALIDATION v2.3

Následující hodnoty jsou **deklarované v přiloženém protokolu**, nikoli nově provedené nezávislé hodnocení:
- Zkoušející s textem: v kolech 1–3 byla nahlášena shoda 360/360, ale **po finálních drobných opravách v kole 3b nebylo provedeno nové nezávislé hodnocení**.
- Slepý test po záložkách se po opravách **nedostal na cílovou mez kolem 50 %**: Scanning 79 %, Multiple Matching 67 %, Close reading 92 %. To je zásadní pro rozhodnutí o pozdějším známkování.
- Doporučené délky v master promptu jsou orientační; referenční EN A1 obsahuje 265 slov (nad novým doporučeným pásmem 180–230), podobné odchylky nejsou důvodem k mechanickému zkracování všech starších nebo budoucích textů.
- Studentské `meta description` stále označuje „v2“, zatímco `title` a skutečná karta jsou `v2.3`. Při příští schválené verzi opravit tento drobný metadatový nedostatek; **nyní neměnit byte-identický originál**.

**Rozhodnutí:** Asteroids v2.3 je **referenční vzor datového modelu, vzhledu, ovládání, evidence a výukové struktury pro procvičování**, **nikoli hotová klasifikovaná testová varianta**.

## 4. Jak se uplatní společný Language Skills Hub

Původní master v3.5 obsahuje historické pasáže o budoucím Cloudflare katalogu. **Jde o starší architektonický kontext, nikoli požadavek zrušit školní GitHub.** Novější rozhodnutí projektu má pro hosting přednost: celý Language Skills Hub a veřejné studentské karty jsou na `ghrab-jazyky.github.io`.

Dále jsou dva **záměrně oddělené režimy**, dle společného doplňku master zadání v1.2.1 (v době příjmu v PR #23):
1. **Procvičování (PRACTICE):** zachovat 24 výukových variant, čtenářské strategie, otázky, důkazové pasáže, přístupný osobní slovníček a offline dictionary. Původní Asteroids má po každém otevření **slovník OFF** dle v3.5; **budoucí procvičovací odkaz z učitelského katalogu jej má explicitně zapínat** podle produktového kontraktu, bez samovolné změny fungování originálního offline HTML.
2. **Testování (TEST):** vytvořit **vlastní, případně kratší, pedagogicky samostatně schválenou sadu testových úloh**, zamčenou konkrétní jazykovou/úrovňovou variantu, učitelem nastavený čas, deaktivované nápovědy, slovník a odhalení řešení během testu, základní prohlížečové signály přerušení a návrat k pokusu. **Tento režim v originálu v2.3 ještě neexistuje.** Jeho počet úloh, bodování a pravidla musí určit učitel; nepřenášet všech 9/9/12/18/21/21 úloh automaticky do testu.

**Bezpečnost:** GitHub Pages jako veřejný statický web neumí zabránit prohlédnutí JavaScriptu/správných odpovědí, manipulaci časem a URL, jiným programům a všem podobám split-screenu. „Testování“ tedy nejvýš představuje **dohledové prostředí pod přímým učitelem**, nikoli zaručenou ochranu pro vysoce důležité známkování. Učitelské klíče neukládat na veřejné Pages.

## 5. Přenos reference na další čtecí karty

Po schválení **obou** režimů na Asteroids v2.3 (resp. na nové verzované následné referenci) sjednotit:
- *Can Mistakes Help Us Learn?*,
- *Plastic Ocean*,
- *Email from a Friend*,
- *Instant Messages*.

Nezkopírovat stejné texty či otázky; přenést pouze ověřenou strukturu, funkční a vizuální standard. Při aktualizacích zachovat `topicId`, verzovaná lokální data, společný slovníček a správnou evidence navigaci. Schválení ostatních karet musí být samostatné.

**Výukové parametry reference:** gymnázium přibližně **13–19 let**, **A1–C2**, cíl rozvoje vyhledávání informací, gist, detailního čtení, inference a kritického posuzování informací o planetkách. Doporučený čas všech záložek přibližně **20–68 minut** podle jazyka/úrovně; B2 s výběrem záložek do jedné hodiny, C1/C2 zpravidla na dvě hodiny. Slabším žákům poskytnout kratší sekvenci a volitelný slovník, silnějším náročnější inference, důkaz a kritické posouzení.

## 6. Závěrečná brána

- Byte-identický originál studentského HTML a master promptu ve školní organizaci.
- Nové regresní testy v GitHub Actions zelené, včetně integrity SHA-256, 24 variant, 360 otázek, 391 evidence úryvků, 12 matching sad a nepřítomnosti soukromého učitelského klíče.
- Referenční kandidát označen `approved:false`; žádné schválení vydávání testové varianty ani automatických známek.
- Před přesunem do ostrého učitelského katalogu získat pedagogické schválení a dokončit testovací režim, fyzickou UAT a ověřit split-screen/visibility limity.
