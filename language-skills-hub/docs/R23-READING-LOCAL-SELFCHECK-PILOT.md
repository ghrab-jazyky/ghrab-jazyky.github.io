# R23 – Reading Lab: samostatné ověření znalostí (pracovní pilot)

**Stav:** připravené samostatné neklasifikované studentské rozhraní ve větvi PR; NENÍ připojeno ke katalogu ani zveřejněno jako školní klasifikovaný test. R22 rozhodnutí o statickém provozu je podkladem této větve.

## Zdroj a kompatibilita

Pět existujících Reading karet je čteno beze změn, pouze jako **text** přes same-origin `fetch`; z jejich původního `const DATA={...}` se bezpečně parsuje JSON. Kód se neprovádí přes `eval`, `Function`, `innerHTML` ani injekci skriptů. Je to transparentní mechanismus nad veřejnými procvičovacími daty.

- Témata: `rl-asteroids`, `rl-can-mistakes`, `rl-plastic-ocean`, `rl-email-friend`, `rl-instant-messages`.
- Každé téma: 4 jazyky EN/ES/DE/FR × 6 úrovní A1–C2.
- Auditováno: 120 jazykových/úrovňových variant, celkem 1 800 uzavřených úloh; z toho 1 540 výběrů odpovědi (`mc`), 180 přiřazování odstavců (`match`) a 80 doplnění věty (`gap`).
- Každá varianta má navíc volitelnou otevřenou reflexi, která **není skórována**. Nenahrazuje individuální učitelské hodnocení.

## Pilotní stránka

`/language-skills-hub/self-check/reading/index.html?topic=rl-asteroids&lang=en&level=B2`

Jde o adresu použitelnou až po případném schválení a zveřejnění daných souborů v GitHub Pages. Dokud je větev pouze PR, není touto adresou pilot nasazen na ostrém webu.

Parametry `topic`, `lang` a `level` musí ukazovat na schválenou kartu a dostupnou variantu. V pilotním studentském rozhraní nejsou přepínače jazyka a úrovně; změna URL však není bezpečnostně vyloučena.

Rozhraní je plně lokální: neužívá studentské účty, studentská jména ani evidenci výsledků. Ukládá maximálně obecnou volbu vzhledu, nikoli odpovědi. Učitel nedostává žádnou automatickou kopii výsledku. Případný ruční snímek obrazovky není důkazem zabezpečeného testu.

## Průběh aktivity

1. Student otevře učitelem sestavený odkaz, přečte odpovídající autentický výukový text a pracuje s otázkami ze všech oddílů původní karty.
2. Doplňovaná věta se v textu nahradí zástupnou mezerou, aby nebyla vyzrazena přímo v odstavci. Počet vyplněných úloh není známka ani bodový výsledek.
3. V režimu nejsou nápovědy, offline slovník ani osobní slovníček. Nezobrazují se průběžná řešení.
4. Souhrnné odevzdání vyžaduje potvrzení; při neúplném vypracování upozorní na počet nezodpovězených úloh.
5. Po odevzdání zobrazí počet správných odpovědí, dosažené body (1 za každou uzavřenou úlohu), procenta, vlastní odpovědi, správná řešení a vysvětlení. Oficiální známka zůstává `null`. Otevřená reflexe není počítána do skóre.
6. V běžící instanci stránky už nelze znovu odeslat. Po obnovení stránky je ale opakování možné — neslibujeme garantovaný jednorázový pokus.

## Technické a pedagogické limity

- Řešení a klíče jsou dostupné v původních veřejných procvičovacích kartách; JavaScript je nemůže skutečně utajit před zkoumáním DevTools.
- Neexistuje ochrana proti opisování, změně URL, zfalšování lokálních výsledků ani přenosu správných odpovědí mezi žáky.
- Nepoužívat jako zabezpečenou klasifikovanou zkoušku, nepřenášet automaticky do školní klasifikace.
- Cílové úrovně: A1–C2; věková skupina: gymnázium. Cíl: samostatně prověřit porozumění autenticky koncipovanému textu a strategiím čtení. Orientační čas: A1/A2 10–15 min, B1/B2 15–25 min, C1/C2 20–30 min, podle délky textu a individuálních potřeb.
- Slabším žákům volit A1/A2 a odpovídající jazyk, silnějším C1/C2. Neměnit ručně obsah či klíče původních variant bez redakčního auditu.

## Regresní brány

- Node test `language-skills-hub/tests/r23-reading-selfcheck.test.cjs` načítá a validuje skutečných 120 variant z pěti existujících HTML, ověřuje všech 1 800 otázek, chybějící větu, kompletní/částečné/chybné podání, neměnnost 29 původních karet a vypnuté klasifikované testy.
- Browser test `language-skills-hub/tests/r23-reading-selfcheck.browser.test.cjs` je připraven pro Chromium a WebKit na desktopu a mobilní šířce (EN/B2 Asteroids a ES/B1 Can Mistakes). Ověřuje načtení, počet úloh, reakci na volbu, odevzdání, výsledky, vzhled, mobilní overflow a nepřítomnost POST.
- Testovací workflow `lsh-r23-reading-selfcheck.yml` nic nenasazuje. Je nutné sledovat skutečný běh GitHub Actions a nepovažovat existenci testovacího souboru za jeho úspěšné provedení.
- Samostatně provést manuální UX/pedagogickou přejímku na skutečných telefonech (Android/iOS) a notebooku; prohlížečové testy nejsou náhradou fyzického zařízení.

## Co není součástí R23

- Tlačítko Test v ostrém učitelském katalogu.
- Učitelské ovládání audia a třífázový Listening Test (R24).
- Klasifikace, uzamčený režim proti obcházení, úschova výsledků, autentizace, externí server.
- Automatické známky podle dosud nepotvrzené školní stupnice (R25).
