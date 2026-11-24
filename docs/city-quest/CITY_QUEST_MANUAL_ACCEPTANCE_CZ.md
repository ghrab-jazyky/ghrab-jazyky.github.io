# City Quest — manuál závěrečné lidské přejímky

**Datum podkladů:** 23. 11. 2026  
**Produkt:** Language Skills Hub → City Quest, Riverton  
**Rozsah:** PR #173 (etapy 1–2) + navazující PR #175 (etapa 3 a auditní opravy)  
**Stav:** **KANDIDÁT / NO-GO pro produkční vydání**, dokud nejsou dokončeny níže uvedené lidské a publikační brány.

## 1. Co je a není ověřeno

- Automatizované cesty pro všech **40 konfigurací** (4 jazyky × A1/A2 město; B1–C2 město nebo město+metro) dokončily **320 misí** v Chromiu v běhu [GitHub Actions 45249477816](https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/actions/runs/45249477816). To je evidence pro tehdejší SHA `cd41b908d7b1c14b10757a0efb8fed32a5ede917`.
- V následné jazykové revizi byly opraveny místní názvy městských míst a zadání CITY 08/C2: povinné pořadí **Market Square → Library → City Museum** nelze vyjednáváním změnit. Nová verze musí projít vlastními CI testy na **svém přesném SHA**. Starší PASS není automatickým důkazem pro novější soubor.
- Test automaticky **neověřuje kvalitu mluveného projevu**, volbu správného registru, přirozenost všech jazyků, fyzická zařízení, publikaci Pages ani skutečné lidské schválení.
- Čtyři jazykové autorské soubory obsahují **144 doplňkových zadání B2–C2**. Celý herní katalog má **256 jazykově-úrovňových variant**: 192 CITY + 64 METRO. Jedná se o dvě různé matice.
- Ve starší přejímací evidenci F5C je **releaseDecision=NO_GO** a všechny ruční brány **PENDING**; tento dokument je nemění ani nenahrazuje.

## 2. Rychlá učitelská přejímka ve třídě

**Cílová úroveň:** A1–C2 (nové autentické úkoly B2–C2).  
**Skupina:** přibližně 12–19 let, studenti gymnázia.  
**Cíl:** ověřit, že žáci zvládnou samostatně zvolit misi, orientovat se na mapě a skutečně vyslovit smysluplnou odpověď, nikoliv jen kliknout.  
**Čas:** 45 minut pro reprezentativní vyzkoušení několika misí; **nenahrazuje** kompletní redakční kontrolu 256 řádků.  
**Slabší žáci:** slovníček a mapa k dispozici; učitel předvede jednu navigační repliku, poté žák samostatně zkusí další.  
**Silnější žáci:** popis trasy bez ukazování mapy, zdůvodnění alternativy, oprava nejasnosti a zdvořilé vyjednání priorit.

**Postup učitele:**
1. Vyber jazyk a CEFR; zkontroluj, že A1–A2 nemají metro a B1–C2 mohou přepnout režim.
2. Vyzkoušej městskou misi 02, konverzační misi 03 a misi 08. U B2–C2 před otevřením vzorového řešení vyžaduj nahlas zdůvodnění, vysvětlení nebo mediaci.
3. Ve dvojici nech žáka A popsat situaci a žáka B reagovat **bez čtení modelu**; potom si role vymění.
4. Ověř, že výsledek mise není prezentován jako automatická známka za mluvení.
5. Zkus přepnutí Město ↔ Město + metro s rozpracovanou misí 05–08; zavření potvrzení nesmí ztratit postup, potvrzené přepnutí zachová dokončené mise 01–04.
6. U C2/CITY 08 ověř, že komunikační úkol respektuje pořadí **náměstí → knihovna → muzeum**. Výběr jiné povinné posloupnosti nemá být prezentován jako platná možnost.

## 3. Úroveň B2–C2 — podmínky jazykové přejímky

| CEFR | Znalost, kterou má výstup doložit | Co má posuzovatel zaznamenat |
|---|---|---|
| B2 | Poskytne srozumitelnou, mapově správnou trasu a porovná vhodnou a nevhodnou možnost | Přesnost instrukcí, srozumitelnost zdůvodnění, návaznost vět |
| C1 | Identifikuje nejasnou informaci, vhodně se doptá a zohlední omezení či objížďku | Přesnost formulace, souvislost, vhodná alternativní strategie |
| C2 | Vyřeší rozpor mezi dvěma radami či prioritami a přizpůsobí registr posluchači | Nuance, pragmatická přiměřenost, důsledné respektování faktů na mapě |

**Pozor:** Tyto tři soubory aspektů jsou kontrolní pomůcka, nikoli nová známkovací rubrika žáků. Při skutečném hodnocení použij předem zadaná školní kritéria.

Jazykový reviewer pro EN/ES/DE/FR musí prohlédnout všechna příslušná CITY i METRO zadání včetně jazykových nápověd, zpětné vazby a 144 nových ústních zadání. Přirozenost a CEFR přiměřenost se **nesmí** uzavřít jen na základě automatického „144/144 PASS“.

## 4. Povinné fyzické a přístupnostní testy

| Brána | Test v ruce | Minimální akceptace |
|---|---|---|
| iPhone / Safari | portrét, krajina, dlouhý německý/francouzský text, klikání na mapu, rozbalení úkolu | Bez překryvu ovládání, ztraceného fokusu, nedosažitelných tlačítek či náhodného resetu |
| iPad / Safari + Split View | plná šířka, 1/2 obrazovky, 1/3 obrazovky, přepnutí zpět, dvě rozehrané mise | Hra zůstane ovladatelná; mapa, navigační šipky a texty se přizpůsobí |
| Android / Chrome | portrét, krajina, systémově větší písmo, interaktivní metro | Čitelný text bez neúmyslného horizontálního přetékání celé stránky |
| VoiceOver | titulky, výběr mise, formuláře, stav odpovědi, modální potvrzení | Ohlášená jména a stavy ovládacích prvků; logické pořadí fokusu |
| TalkBack | stejné kritické kroky jako VoiceOver v Android Chrome | Ovládání bez vizuální orientace a správné hlášení chybových stavů |
| Klávesnice / 200% text | Tab/Shift+Tab, Enter/Space, rozbalení kritérií, dialog resetu | Žádné uvěznění fokusu a žádný nezobrazený důležitý obsah |

**Formát záznamu:** `brána | PASS / FAIL / PENDING | jméno nebo role hodnotitele | datum | zařízení + OS/prohlížeč | odkaz na důkaz | závada / poznámka`.

Při nahrávání obrazovky, fotografií či žákovských výkonů **anonymizuj osobní údaje studentů**. Nepoužívej skutečné studentské účty či jména v testovací evidenci.

## 5. Formální release bezpečnost

- Vlastník nebo správce musí doložit, **z čeho se GitHub Pages publikuje**. Zelený test izolace karet nedokazuje, že se do veřejné distribuce nedostanou další autorské soubory, prototypy nebo interní dokumenty.
- Pokud Pages vydává přímo kořen `main`, neslučovat návrhy s interními testy a autorskými materiály bez zvlášť schválené publikační izolace.
- Před vydáním musí existovat **konkrétní** SHA-256 schváleného `index.html`, navazující úspěšné CI na konečném integrovaném commitu a důkaz, že ostatních 34 karet zůstává dostupných.
- Nutné výslovné **GO** vlastníka. Zelené Actions, Draft PR ani tento manuál nejsou autorizace k merge nebo deployi.
- Při hypotetickém zamítnutí některé ruční brány se stav vrací do **NO-GO** s konkrétní opravou a opětovným ověřením.

## 6. Přehled pro předávací protokol

| Položka | Stav bez lidského dokladu |
|---|---|
| Autorizované jazykové a pedagogické záznamy 256 variant | PENDING |
| Nezávislá obsahová kontrola 144 ústních zadání | AI předkontrola provedena; člověk PENDING |
| Fyzický iPhone / iPad Split View / Android | PENDING |
| VoiceOver / TalkBack a školní přístupnost | PENDING |
| Audit nastavení GitHub Pages a publikační izolace | PENDING |
| Finální vizuální a funkční rozhodnutí vlastníka | PENDING |

**Rozhodnutí:** `NO-GO` do úplného doložení výše uvedeného. Nikdy nevydávat jen na základě zelené CI.

## Dodatek – opravy Claude stupně A (po kontrole 23. 11. 2026)

Po opravách textů, ovládání a přístupnosti na PR #175 je nutné znovu spustit 40/40 na NOVÉM SHA; historický PASS #45249477816 platí pouze pro cd41b908. Dosud neověřené ruční brány zůstávají PENDING. Vlastník musí výslovně rozhodnout o publikaci docs/city-quest/* v kořeni GitHub Pages; automaticky neslučovat PR.


## Dodatek A+ — 24. 11. 2026 (revidovaný kandidát; bez GO)
- Opravy F-17/R-01: smíšený režim lokalizuje název povrchového muzea v patičce mapy, ponechává oficiální anglické názvy stanic metra; popis vstupu Museum Quarter lokalizován pro ES/DE/FR.
- Opravy F-25: vybrané francouzské instrukce a generátor kroků používají počítání křižovatek místo opakování `pâtés de maisons`; pořadí kroků, jejich počet a stavový automat zůstávají beze změny.
- Opravy F-26: U+202F doplněno do francouzského C1 feedbacku, přepínače režimu, oznámení metra a popisků stanice.
- Kontroly: statické invarianty rozšířeny o lokalizaci a francouzské texty; browser regresní test kontroluje patičku ve všech 4 jazycích; průchodových 40 E2E kontrol nyní zachytává i `console.error`.
- Poslední **historicky úspěšný** běh před A+: [Actions #45263480226](https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/actions/runs/45263480226), `d6367bb4f9ade9acab554d793c95b3aa94580eb2`. Není důkazem průchodnosti právě změněného HEAD. Ověřit nový přesný commit a připsat jeho výsledek.
- Neuzavřeno: nezávislé negativní E2E pokrytí všech nesprávných kroků, jazyková redakce všech variant, iPhone/iPad/Android/assistivní technologie, integrovaný release a publikační izolace Pages. **NO-GO**, ruční brány **PENDING**.


## Dodatek B — práce s mluveným projevem bez nahrávání (24. 11. 2026)
**Cílová úroveň:** B2–C2 (původní úlohy A1–B1 zůstávají beze změny).  
**Ročník / věková skupina:** gymnázium, přibližně 15–19 let.  
**Cíl:** oddělit skutečně řečenou odpověď od úspěchu ve hře a vyvolat konkrétní sebereflexi nebo zpětnou vazbu partnera.  
**Čas:** 3–5 minut na jednu ústní výzvu, podle náročnosti úkolu.  
**Slabší žáci:** před odpovědí si otevřou slovní oporu a po odpovědi posoudí nejprve jedno kritérium.  
**Silnější žáci:** vysvětlí dvě alternativy, vyjednají priority a požádají partnera o kritický komentář.
 
**Práce s novým ovládáním:**
1. Žák nejprve nahlas vyřeší zadanou situaci a **teprve poté** otevře část „Kritéria úspěšné odpovědi“.
2. Podle skutečně vyslovené odpovědi zaškrtne nejvýše tři dostupná kritéria. Nemusí vyplnit všechna. Výsledek typu `2/3` vyjadřuje pouze jeho **vlastní prohlášení**, nikoliv jazykovou známku nebo automatické vyhodnocení.
3. V režimu dvojic může spolužák samostatně potvrdit, že poslouchal a poskytl zpětnou vazbu. Software nijak neověřuje jeho totožnost ani skutečný obsah mluvení.
4. Reflexe je nepovinná a **neblokuje postup hrou**; nijak neupravuje herní skóre nebo přijaté odpovědi.
5. Volba zůstává pouze v paměti otevřeného prohlížeče. Reset mise ji vymaže. Při změně jazyka nebo úrovně se vymaže celá lokální relace. Při přepnutí prostředí se obnoví počáteční stav pozdějších misí; potvrzení partnera se ruší při změně Solo/Pair.
6. Bez mikrofonu, rozpoznávání řeči, serveru, přenosu osobních údajů a dalších externích síťových požadavků.
 
**Jazyková korekce:** V rozšířeném C1 zadání při hledání místa na mapě byla v ES a DE dospělá kolegiální role upravena na školní spolužáky.
 
**Doklady automatizace:** Přidány regresní testy jazykové matice 144 úloh, přepínání režimů, resetu, přístupnosti nativních checkboxů a čtyřjazyčných negativních tras (povinný průchozí bod + nesprávné odbočení). Automatizace neprokazuje kvalitu mluveného projevu a nezastupuje lidskou CEFR, jazykovou, didaktickou ani zařízeníovou přejímku. Evidovat aktuální SHA a výsledek nového GitHub Actions běhu.
 
**Rozhodnutí o vydání:** nadále `NO-GO` — nejde o povolení k merge, publikaci nebo nakládání s reálnými osobními údaji žáků.


## Dodatek C — alternativní trasy, diferenciace CEFR a skutečný průchod (24. 11. 2026)
**Cílová úroveň:** B2–C2 pro nové rozhodovací úlohy a alternativní metro trasy; relativní pěší pokyny od A2.  
**Věková skupina:** gymnázium, přibližně 12–19 let podle úrovně.  
**Cíl:** samostatně ověřovat platnost trasy, rozlišovat podmínky a doložená fakta, formulovat vlastní použitelné instrukce.  
**Čas:** 3–5 minut navíc na ústní zdůvodnění; nové objektivní rozhodnutí obvykle do 1–2 minut.  
**Slabší:** použít mapu, značení, kontextovou nápovědu a nejprve projít základní trasu.  
**Silnější:** porovnat dvě platné trasy, vysvětlit změnu podmínek a reagovat na protichůdné informace.
 
**C1 / F-20:** B2–C2 mise 05 a 06 přijímají skutečné souvislé alternativy grafu se správným směrem a nástupištním značením. Vygenerované jednoduché trasy mají nejvýše dvě změny linky a toleranci 7 simulovaných minut proti nejkratší. Nejde o živá dopravní data. Očekávané nezávislé referenční hodnoty:
- 05: M1 (2 úseky, 0 přestupů, 6 min); alternativně M2 přes University a M3 (3 úseky, 1 přestup, 13 min).
- 06: M2/M3 přes University (5 úseků, 1 přestup, 19 min); alternativně M2/M1/M3 přes Central Station a Museum Quarter (4 úseky, 2 přestupy, 20 min).
- B1 ponechává autorskou vedenou trasu. Mise 07 zachovává výluku; mise 08 zachovává povinný sběr vstupenek, setkání na University a pěší dokončení. Geometrie mapy, cílové muzeum a portál se nemění.
- Trasa nesmí využít neexistující spojení, vynechat závaznou podmínku nebo překročit uzavřený úsek. Přejetí a návrat se zachycují jako skutečně projeté úseky, nikoli jako plán.
 
**C2 / F-05/F-06:** U B2 nové rozhodnutí vyžaduje porovnání skutečných počtů úseků a přestupů; C1 řeší konkrétní změněnou podmínku, C2 řeší rozporné nebo neověřené informace. City 01/03 mají navíc objektivní rozhodnutí podle stejné úrovňové logiky. Nesprávná volba neumožní dokončení mise. Tím se ověřuje porozumění a argumentační rozhodnutí, nikoli kvalita vlastního projevu. Zachováno 144 samostatných orálních zadání; 24 z nich v metro 05/06 nyní respektuje více platných tras. Sebehodnocení z B zůstává nepovinné.
 
**C3 / F-12, F-33, F-38:** Po první světové straně v misi 04 používají A2–C2 relativní instrukce. Skutečná cesta je podkladem modelu: v metru evidence nastoupení, přestupů, zastávek, návratů a absolvovaných pěších etap; v City 08 oddělené dokončené úseky mezi povinnými body. Závěr po 8/8 rekapituluje mise a slovní zásobu, nepřiděluje jazykovou známku. Lišta fází je neinteraktivní; nápověda pro City 01/02/03/04/07/08 využívá konkrétní kontext.
 
**Povinné technické důkazy:** nové izolované testy enginu s nezávisle sestavenými trasami, průchody alternativ 05/06 ve 4 jazycích × 3 úrovních, negativní scénáře, CEFR brány, regresní průchod 40 konfiguracemi a závěrečná rekapitulace. Výsledky uvádět jen pro přesný SHA. 
 
**NO-GO:** Lidské CEFR/jazykové posouzení, fyzické telefony/tablety a asistivní technologie, integrační strom s aktuálním main a publikační izolace podkladů zůstávají PENDING. Bez souhlasu vlastníka nic neslučovat ani nenasazovat. Ústní výkon neznámkovat automaticky; případné žákovské doklady anonymizovat. Žádné API, síťové požadavky z herního kódu, mikrofon, server nebo trvalé ukládání žákovských dat.


## Dodatek D1 — cílené opravy po etapě D (24. 11. 2026)
- D-02: povrchová budova muzea má lokální název na mapě, v aria-label a ve skutečném finálním HUD; názvy metro stanic zůstávají kanonické. Geometrie a engine nezměněny.
- D-03: při odhalení příkladu jsou oddělené souvislé vzorové věty a faktický ledger. Model se sestavuje z reálných nástupů, projetých stanic, přestupů a návratů, nikoli z kanonické trasy. B2 porovnává plánovanou alternativu a skutečný průchod, C1 vysvětluje hypotetickou podmínku, C2 rozlišuje ověřená fakta od garancí. Průběžný checkpoint neprohlašuje budoucí etapu za hotovou.
- D-08: souhrn 8/8 má neprůhledné pozadí a explicitní kontrastní barvy pro světlé i tmavé téma, plus systémové barvy v forced-colors. Cílený axe a numerický kontrastní test ve 4 jazycích × 2 režimech × 2 tématech × 2 šířkách; vynucený kontrast emulován.
- D-04/D-06: dílčí redakce německého označení stanic a francouzské typografie; instrukce ústního úkolu nyní zohledňuje model příslušné etapy, nejen konec mise.
- D-01 (Asteroids) a D-07 (Pages) jsou samostatné neuzavřené release brány. D-05 a úplná ruční jazyková přejímka zůstávají k učitelskému ověření. Nepřepisovat cizí hash, neměnit Pages ani neprovádět merge/deploy. Technický výsledek musí být doložen novým přesným SHA.
