# R32 – návrh samostatné testové sady Reading (PRACOVNÍ REFERENCE)

**Stav:** `DRAFT_PENDING_TEACHER_CONTENT_APPROVAL`; **nespouštět v katalogu a neslučovat automaticky**. První pedagogická reference odlišná od procvičování.

## Rozsah a didaktika

- **Téma:** Can Mistakes Help Us Learn? – výchozí **EN/B2** text „When Feedback Feels Like Failure“.
- **Cílová úroveň:** B2; **věk/ročník:** vyšší gymnázium, typicky 16–19 let.
- **Výukový cíl:** ověřit porozumění argumentaci, kvalifikacím tvrzení a praktické aplikaci klíčových myšlenek, nikoli pouze dohledávat doslovné údaje.
- **Orientační čas:** 20 minut, před nasazením ověřit na pilotní třídě.
- **Diferenciace:** slabší žáci – samostatná plánovaná A2/B1 varianta a přiměřený čas; silnější – teprve po schválení připravit C1/C2 variantu s náročnější inferencí. Záměrně neměnit EN/B2 zadání jen přes limit, aby se úroveň nevydávala za jinou.
- **Výchozí text:** zůstává beze změny a čte se ze schválené původní karty. Zdrojový obsah je připnutý přes `contentHashes['rl-can-mistakes']` v manifestu R31. Změna originálu musí banku pozastavit.

## Dvě oddělené sady, ne přeznačené procvičování

| | Practice EN/B2 | R32 testový návrh EN/B2 |
|---|---|---|
| Počet hodnotitelných otázek | 18 | 10 |
| Typy úloh | mc, match, gap | 10 **nově napsaných** multiple-choice otázek |
| Odstavce čtecího textu | 4 | stejné 4 |
| Rozvržení | 6 učebních oddílů | 3 testové oddíly |
| Nápovědy / slovníček | podle procvičovací karty | nepovolovat v běžícím testu |
| Hodnocení | procvičovací pravidla | 1 bod za správnou odpověď, max. 10, známka jen jako lokální návrh podle stávající stupnice |

Nové otázky cílí na výklad významu, logiku argumentace a přenos do modelových situací. Po první nezávislé revizi byly upraveny příliš snadné distraktory a vyváženo rozložení klíče A/B/C/D (2/3/2/3). Nejde o kopii ID, zadání ani přesných možností procvičovacích otázek. Automatický test ověřuje rozdílnost zadání a úplnost klíče, **nedokáže však prokázat jazykovou správnost ani absenci významové podobnosti**. To vyžaduje pedagoga.

## Nutné schválení před aktivací

1. Učitel zkontroluje všech 10 otázek, jednoznačnost čtyř možností, věcnou oporu v původním čtecím textu a adekvátnost úrovni B2.
2. Stanoví, zda je 10 otázek / 20 minut a stupnice 88/74/59/44 vhodná. U 10 položek znamená 9/10 návrh známky 1; chyba ovlivní výsledek o 10 %. Zvážit počet a váhy až po didaktickém ověření.
3. Ověří provoz v režimu R31 na PC, Androidu, iPhonu a iPadu. V průběhu testu se nesmí zobrazovat klíč ani nápověda, výsledky a opravy až po odevzdání.
4. Potvrdí banku jako pedagogicky schválenou pouze pro EN/B2 (ne automaticky pro EN/ES/DE/FR A1–C2). Až potom připravit runtime přepínač, který v katalogu jasně označí schválenou variantu.
5. Při nedostupnosti banky má být v ostré verzi jednoznačné označení nevalidovaného testu; nedělat tichý fallback na procvičovací otázky vydávané za oddělený test.

## Technický stav

- `self-check/test-banks/reading/rl-can-mistakes/en-B2.json` – původní sada 10 testových otázek, vlastní ID, taby, odpovědi a vysvětlení, **draft/published=false**.
- `test-bank-core.js` – validátor pro status, odlišná ID a zadání, počet, CEFR, checksum původní karty; sestaví QA variantu bez původní maskované gap věty.
- `tests/r32-independent-reading-pilot.test.cjs` – automatické kontrakty, skutečný SHA-256 původního HTML, vyvážení klíče a skórování, které nezmění původní practice.
- `preview.html?timer=20&attempt=r32localqa1` – izolovaný náhled dostupný pouze z lokálního checkoutu pracovní větve (na veřejné R31 neexistuje), používá stávající časovač a zpětnou vazbu.
- `tests/r32-independent-reading.browser.test.cjs` – Chromium/WebKit QA pro odevzdání, obnovu, bezchybné řešení a odmítnutí porušených dat.
- Samostatný položkový audit v `docs/R32-EN-B2-INDEPENDENT-CONTENT-AUDIT.md`.
- Testová banka není zařazena do veřejného studentského menu ani do produkčního renderovacího toku R31. Má pouze pracovní QA stránku v PR #39, která **nesmí být publikována v ostrém katalogu** bez pedagogického schválení.

**Bezpečnost:** HTML/JS a správné odpovědi zůstanou veřejné při nasazení na GitHub Pages. Nové otázky tedy nejsou tajným zabezpečeným testem. Pro reálně zabezpečenou klasifikaci by se musel použít GIT / serverové vyhodnocení.
