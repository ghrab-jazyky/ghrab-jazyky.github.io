# Language Skills Hub R22 — serverový kontrakt testů

**Datum:** 9. listopadu 2026. **Stav:** serverová architektura a testovací protokol, nikoliv zapnutý testovací režim. Veřejný katalog GitHub Pages zůstává pouze pro procvičování.

## Rozsah a priority

Aktuální rozhodnutí učitele z 9. 11. 2026 mají přednost před starším master doplňkem v1.2.1.

- Conversation Lab: žádná forma testování, žádné tlačítko Test.
- Reading Lab: test se stejnými *typy* úloh jako procvičování, ale s neveřejnou sadou testových otázek; zamčený jazyk/CEFR, bez slovníku, My Vocabulary, nápověd a průběžné zpětné vazby. Jedno souhrnné odevzdání.
- Listening Lab: jazyk pouze EN, CEFR určí učitel. Tři části: First Listening, Listen and Interpret, Listen, Write and Reconstruct. Bez Pre-listening, Optional Vocabulary a After Listening. Média přehrává pouze učitel, žádné studentské ovládání.
- Výsledek: až po úspěšném serverovém odevzdání. Automatická kontrola jasně hodnotitelných úloh, přehled správných řešení. Otevřené odpovědi vyžadující odborný úsudek zůstanou bez automatické známky až do učitelského posouzení.

## Implementované moduly

**src/contract.cjs**
- Striktní validátor soukromých Reading/Listening definic, podporovaných jazyků a úrovní A1–C2, bodů, variant úloh a tří částí Listening.
- Explicitní whitelist dat předaných studentovi. Odpovědi, vysvětlení, vzorová řešení, učitelská média a klíče se neposílají před odevzdáním.
- Bodování jednoznačných možností a výslovně uznaných krátkých odpovědí. Neslovně shodné, potenciálně správné odpovědi a rozsáhlejší psaní jde na učitelské přezkoumání.
- Výsledek má body, procenta pouze při úplném vyhodnocení, detailní opravy po odevzdání a pole grade=null. Školní klasifikační stupnice se nyní automaticky nepoužívá.

**src/handler.cjs**
- Fail-closed Node.js 24 HTTP handler, bez automatického spuštění serveru a bez produkčních tajemství.
- Povinné autentizační adaptéry zvlášť pro učitele a studenty. Nepřijímá klientem deklarované jméno nebo roli jako důkaz totožnosti.
- Soukromá bankovní vrstva, trvalé a transakčně atomické úložiště, distribuované omezení požadavků — vše povinné externí adaptéry.
- Serverem generované 24bajtové náhodné identifikátory testové relace a studentského pokusu, serverový časový limit, jednorázové odevzdání.
- Soukromý SHA-256 otisk plné definice testu, včetně klíče odpovědí, se uloží k relaci i pokusu. Jakákoli změna sady pod stejným označením revize způsobí bezpečné odmítnutí, nikoli tichou změnu hodnocení.
- Distribuovaný rate-limit se volá odděleně pro skutečného síťového protějška (`peer`) a token (`token`). Na neověřené `X-Forwarded-For` se nespoléhá; v produkci je nutný audit chování reverse proxy.
- Časový limit se ověřuje znovu po načtení a zpracování celého požadavku; produkční databáze musí atomicky potvrdit `submittedAt < stored expiresAt` před uložením výsledku.
- Odpovědi a opravy jsou dostupné až po úspěšném atomickém uložení výsledku.
- Omezení JSON těla na 32 KiB, přesné HTTPS origin v CORS, bez wildcard, bez cookies, bez cachování testových výsledků.

## API kontrakt (zatím neveřejný)

| Metoda | Cesta | Kdo | Chování |
|---|---|---|---|
| POST | /v1/teacher/sessions | učitel | vytvoří relaci se schváleným jazykem, úrovní a bankovní revizí |
| POST | /v1/student/attempts | student | jednou zahájí pokus pro konkrétní relaci |
| GET | /v1/student/attempts/:id | daný student | získá veřejnou, bezklíčovou podobu úloh |
| POST | /v1/student/attempts/:id/submit | daný student | jednou odevzdá a přijme serverové vyhodnocení |
| GET | /v1/student/attempts/:id/result | daný student po odevzdání | zobrazí opravy a výsledek |

## Nevyhnutelné vstupní podmínky pro školní server

1. Ověřené učitelské a studentské identity či jednorázová student-specific oprávnění. Ověření podpisu, expirace a role musí probíhat serverově. Volba identity studenta teprve čeká na provozní rozhodnutí.
2. Soukromá banka schválených testových otázek, dostupná výhradně školnímu serveru. Reálné klíče nikdy nevkládat do veřejného GitHub repozitáře, GitHub Pages ani Actions artefaktů.
3. Trvalé úložiště s transakční jedinečností (relace, student) a atomickým jednorázovým finalizačním zápisem (např. PostgreSQL). Paměť jediného procesu není dostatečná.
4. Distribuované omezení žádostí, kontrola přístupu a nastavená pravidla soukromí/retence; do testových URL nepatří jména studentů. Používat anonymizované/pseudonymizované záznamy.
5. Soukromé média pro učitele a ovládání přehrávání budou předmětem R24; studentova testová odpověď nedostává učitelský odkaz na média.

Povinné metody adaptérů: teacherAuth, studentAuth, bank.load, store.createSession, store.getSession, store.createAttempt, store.getAttempt, store.finalizeAttempt, throttle.check. Produkční `throttle.check` musí nezávisle uplatnit obě `scope` (peer a token). `store.finalizeAttempt` musí atomicky porovnat uložený konec pokusu a časy odevzdání; pouhá deklarace `atomicFinalize:true` není důkaz skutečného DB omezení. Runtime vyžaduje explicitní enabled=true a vynucuje bank.serverOnly, store.durable, store.atomicAttemptStart a store.atomicFinalize. Tyto značky nenahrazují audit skutečné implementace databáze.

## Bezpečnostní omezení a otevřené úkoly

- GitHub Pages nemůže tajit otázky/odpovědi obsažené ve veřejných procvičovacích kartách. **Stejné typy cvičení neznamenají totožné testové otázky**: test musí používat neveřejnou banku a pedagogické schválení.
- Signály opuštění obrazovky, fullscreen a Split View/Slide Over jsou pouze indikativní; nejsou důkazem podvádění. Další práce R23/R24.
- Zobrazení správných odpovědí ihned po odevzdání umožňuje studentům předávat řešení spolužákům. Pokud by bylo potřeba řešení odložit až na konec testu, vyžaduje to zvláštní rozhodnutí.
- Po vypršení času se ve fázi R22 odmítne pozdní odevzdání, ale zatím není implementováno automatické odeslání neodevzdaného pokusu.
- Školní stupnice z pracovního návrhu Pravidel hodnocení 2026: 1 = 88–100 %, 2 = 74–87 %, 3 = 59–73 %, 4 = 44–58 %, 5 = 0–43 %. Jelikož jde o pracovní/orientační text, bez potvrzení konečného znění a pravidel zaokrouhlování se **nepoužije**. Doplnit v R25.
- Kód zatím neobsahuje produkční auth adapter, skutečné DB, schválené testové banky, spuštění Dockeru ani provozní deployment. Úspěšná CI sama neznamená připravenost klasifikovaných testů.

## Testy

Node 24, bez externích balíčků:

    cd server/lsh-test-service
    node --test tests/*.test.cjs

Automatické testy používají pouze **fiktivní** otázky a odpovědi. Kontrolují validaci, čisté klientské payloady, oddělení rolí a studentů, čas, opakované a paralelní odevzdání, manuální kontrolu psaní, 29 neměnných procvičovacích HTML a deaktivované klasifikované testy.

Další fáze: R23 = Reading Test, R24 = Listening Test + ovládání přehrávání, R25 = definitivní známkování, pedagogický a bezpečnostní audit.
