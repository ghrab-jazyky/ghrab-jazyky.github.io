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
