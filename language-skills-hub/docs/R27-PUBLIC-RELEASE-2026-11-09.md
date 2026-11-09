# R27 – veřejné zpřístupnění Reading/Listening Testu bez známky

**Cílový web:** https://ghrab-jazyky.github.io/language-skills-hub/  
**Repo:** `ghrab-jazyky/ghrab-jazyky.github.io`, branch `main` po úspěšném sloučení release PR  
**Zdroj požadavků:** `Language_Skills_Hub_KOMPLETNI_ZADANI_UPRAV_R18_R25_2026-11-09.txt`  
**Změna oproti původnímu zadání:** majitel projektu dne 9. 11. 2026 potvrdil **GitHub Pages bez backendu a databáze** a následně výslovně požádal o produkční nasazení připravených úprav.

## Co se zpřístupňuje

- **R18–R21:** v katalogu již fungují světlý/tmavý režim, fullscreen s podporovanými alternativami, úvod a tři laboratoře, české názvy témat/překlady, vyhledávání, procvičování, QR sdílení a pevný/volný výběr.
- **Reading Lab:** u každé z pěti karet navíc **Test bez známky** → český učitelský panel pro volbu tématu, EN/ES/DE/FR, CEFR A1–C2 → studentský odkaz a QR → samostatná studentská stránka se stejnými typy otázek jako zdrojová karta, bez slovníčku a průběžných řešení; po odevzdání lokální body, procenta a přehled chyb. Otevřená reflexe se automaticky nehodnotí.
- **Listening Lab:** u každé ze tří karet navíc **Test bez známky** → český učitelský panel pro volbu tématu/CEFR, původní mediální odkazy a učitelem řízené 2 poslechy → studentský odkaz/QR a tři oddíly *First Listening*, *Listen and Interpret*, *Listen, Write and Reconstruct*. Žák nemá přehrávač. Otevřené a rekonstruované odpovědi se nehodnotí automaticky jako konečné.
- **Conversation Lab:** zůstává pouze procvičování; žádná testová možnost.
- **Veřejná původní data:** 29 nezměněných studentských procvičovacích karet; 642 jazykových variant; stejná SHA-256 kontrola obsahu.

## Důležitá omezení, která není technicky možné splnit bez backendu

1. **Odpovědní klíče zůstávají technicky zjistitelné** v původních veřejných kartách. Skrytí zpětné vazby do odevzdání je jen funkce UI, nikoliv kryptografické utajení.
2. **Pokus není neobejitelně jednorázový.** Student může obnovit stránku nebo pozměnit URL; pevná jazyková úroveň se vynucuje pouze v UI.
3. **Studentské výsledky se neověřují a neodesílají učiteli.** Neexistuje centrální evidence ani studentská autentizace. Nenahrazovat tím bezpečné školní testy.
4. **Školní známky jsou VYPNUTÉ.** Pracovní stupnice 88–100 / 74–87 / 59–73 / 44–58 / 0–43 % není prokazatelně schválena v platné školní dokumentaci a neřeší desetinná procenta; písemné odpovědi potřebují učitele.
5. **Dva poslechy jsou organizační pravidlo učitele**, nikoli synchronizované vynucené spuštění na studentském zařízení. Externí video může být nedostupné ve školní síti či vyžadovat přihlášení.
6. **Anticheat nemá zaručenou detekci** přepnutí aplikace, iPad Split View/Slide Over apod. V tomto samostatném neklasifikovaném režimu se nepořizují ani neukládají záznamy o žácích.
7. **Řešení lze sdílet mezi žáky** ještě během práce ostatních; nelze garantovat jednotný čas zveřejnění po celé třídě.

Proto tlačítko záměrně zní **„Test bez známky“**, nikoliv zabezpečený či klasifikovaný Test. Učitelské panely výslovně upozorňují na omezení.

## Validace a publikace

1. Release větev: `release/lsh-r27-public-nongraded-reading-listening-2026-11-09`; otevřít samostatný PR do `main`.
2. Validace: všechny R22–R25 integritní/datové/bezpečnostní testy a nové R27 testy + Playwright Chromium/WebKit desktop i mobil. **Neslučovat při FAIL.**
3. Po PASS sloučit release PR, až poté sledovat GitHub Pages build a `.github/workflows/lsh-live-site-smoke.yml` s požadavkem na `version.json.version == R27`, stejné 29 karet a dostupné nové veřejné učitelské/studentské cesty.
4. Finální ověření z reálné veřejné HTTPS adresy, nikoliv pouze existence GitHub commitů.
5. Zachovat známý poslední veřejný commit `c430a001a2c8b7c619959a092134faa9eefb88be` (R21) jako výchozí rollback bod. Při regresi přepnout/vrátit `main` pouze přes řízený revert release merge PR a znovu ověřit GitHub Pages.

**Přejímka uživatelských zařízení a pedagogické vhodnosti** je samostatnou činností učitele a školy; úspěch prohlížečového CI nezaručuje reálné fungování Facebooku/YouTube ve všech sítích. Pro obsah používaný žáky neukládat osobní údaje do veřejného repozitáře ani do URL.

## Instrukce pro učitele

**Cílová úroveň:** Reading EN/ES/DE/FR A1–C2; Listening EN A1–C2.  
**Ročník/věk:** gymnázium, přibližně 12–19 let.  
**Cíl:** samostatně procvičit a ověřit porozumění textu/nahrávce s následnou zpětnou vazbou.  
**Odhad času:** Reading 10–30 minut, Listening 15–30 minut.  
**Slabší žáci:** předem zvolit A1/A2. **Silnější žáci:** volit C1/C2 a vést otevřené odpovědi k obsahovému zdůvodnění.

Otevři katalog → Reading nebo Listening → vyber téma → **Test bez známky** → v učitelském panelu nastav CEFR a jazyk (Reading) → zkopíruj odkaz nebo QR studentům. Klasifikaci z těchto lokálních výsledků nevydávej za bezpečně ověřený test.
