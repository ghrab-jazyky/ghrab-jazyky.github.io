# R24 – Listening Lab: statické ověření znalostí (pracovní pilot)

**Stav:** kód je připraven pouze v pracovní větvi; **není připojen k ostrému katalogu** a není určen k zabezpečené klasifikaci. Navazuje na rozhodnutí R22 (bez serveru) a na oddělený Reading pilot R23.

## 1. Rozsah a pedagogické zadání

- **Cílová úroveň:** angličtina A1–C2; **věková skupina:** studenti gymnázia, zhruba 12–19 let.
- **Cíl:** samostatně ověřit hlavní sdělení, interpretaci a rekonstrukci slyšeného; písemně doložit porozumění bez falešně přesného automatického známkování.
- **Odhad času:** přibližně 15–30 min podle úrovně a délky nahrávky; učitel musí ověřit délku a dostupnost médií před hodinou.
- **Slabší žáci:** A1/A2, kratší formulace, učitelem vedená příprava mimo testovou obrazovku. **Pokročilí:** C1/C2, více interpretace, rekonstrukcí a argumentace.
- **Témata:** Matthew McConaughey – Oscars 2014; Harrison Ford – Life Achievement Speech; Peaky Blinders – No Fighting. Pouze EN, šest úrovní každého tématu.

Všechny tři původní `poslech/**/index.html` zůstávají nezměněny. Nový modul čte jejich veřejné `const DATA={…}` jako inertní text a parsuje JSON; žádné skripty původních karet se nespouštějí. Původní `const SOURCES={…}` načítá pouze učitelská stránka pro ověřené původní externí mediální odkazy. Aplikace nahrávky ani úplné přepisy nepřebírá či nehostuje.

### Obsahový audit všech 18 variant

- 57 úloh First Listening (`gist`)
- 104 úloh Listen and Interpret (`detail`)
- 90 pozic rekonstrukce (`sequence`)
- 45 krátkých faktických písemných odpovědí (`facts`)
- 39 rozšířených odpovědí (`open`)
- **Celkem 251 objektivních dílčích položek a 84 písemných úloh**; originály obsahují také 4 otázky s více správnými možnostmi. Nezapočítává se Pre-listening, Optional Vocabulary ani After Listening.

## 2. Stránky a pracovní postup

**Učitel:** `/language-skills-hub/self-check/listening/teacher.html?topic=ll-matthew-oscars&level=B2`

1. Vybere téma a jazykovou úroveň A1–C2.
2. Otevře originální video/projev na **vlastním zařízení** přes povolené externí odkazy. YouTube/Facebook/X nemusí fungovat bez přihlášení nebo ve všech sítích; u Peaky Blinders je obsahové upozornění na vulgarismy, drogy a agresivní komunikaci.
3. Nahrávku pustí **celkem dvakrát**. Po každém přehrání si místním tlačítkem zaznamená dokončení poslechu (0/2 → 1/2 → 2/2). Toto počítadlo **neovládá externí přehrávač** ani **nesynchronizuje zařízení žáků**.
4. Pošle odkaz na studentskou stránku. Sdílení pouze přednastaví konkrétní téma a úroveň v klientském rozhraní; URL lze upravit. Panel je veřejný a není přístupově chráněn.

**Student:** `/language-skills-hub/self-check/listening/student.html?topic=ll-matthew-oscars&level=B2`

1. **First Listening** – hlavní smysl a celkové porozumění (první poslech řízený učitelem).
2. **Listen and Interpret** – detaily, postoj a kontext (druhý poslech řízený učitelem).
3. **Listen, Write and Reconstruct** – seřazení slyšených částí, krátké a otevřené odpovědi z poznámek a zapamatovaného obsahu po druhém poslechu.
4. Průběžně vidí počet vyplněných položek, ale žádný klíč; chybí přehrávač, tlačítko Play, slovník, My Vocabulary, nápovědy a sekce Pre-listening / Optional Vocabulary / After Listening.
5. Jediným potvrzeným tlačítkem v relaci stránky odevzdá souhrn odpovědí. Po odevzdání se formuláře zneaktivní; obnovením stránky lze ale začít znovu, protože neexistuje backend.
6. Výsledek ukazuje **pouze úspěšnost objektivních úloh**, správná řešení a jejich vysvětlení; písemné odpovědi se **neznámkují automaticky**, musí je posoudit učitel. **Výsledné procento z celého testu ani oficiální školní známka se nevydává.**

**Předávání řešení spolužákům:** Zveřejnění zpětné vazby jednomu žákovi před dokončením testu ostatními může ovlivnit férovost. Bez serveru není možné spolehlivě oddálit zveřejnění řešení pro celou třídu. Učitel musí této okolnosti přizpůsobit použití aktivity; nelze ji označovat za zabezpečenou zkoušku.

## 3. Bezpečnostní limity a soukromí

- Statický GitHub Pages obsahuje původní veřejné odpovědní klíče; nic je skutečně neutají před technicky zdatným studentem.
- Stránka neidentifikuje studenty, neukládá jména, e-maily ani výsledky na server. Neexistuje ověřený centrální sběr odpovědí či spolehlivý audit druhých pokusů.
- Šifrování/omezení na úrovni URL nebo ztráta focusu nesmí být vydávána za ochranu před opisováním, iPadem Split View nebo DevTools.
- Dva poslechy jsou **organizace práce učitele**, nikoli vynutitelná digitální blokace přehrávání jiným způsobem.
- `gradedTestsEnabled:false`, `selfCheckEnabled:false`, `testUiEnabled:false`, `officialGradesEnabled:false` zůstávají v katalogu a bezpečnostní politice; bez výslovného rozhodnutí se nezveřejňují tlačítka Test.
- Dosavadních 29 procvičovacích HTML a QR sdílení zůstává zachováno.

## 4. Regresní testy a přejímka

- Node testy načítají všechny skutečné původní poslechové datové varianty A1–C2 a ověřují jednotné a vícenásobné odpovědi, pořadí, písemné otázky, nenastavení školní známky a neměnnost originálů.
- Playwright testy: Chromium a WebKit, desktop/mobil, studentské tři fáze bez přehrávače, správný počet úloh, lokální odevzdání bez POST, učitelský výběr, dva manuální poslechy, reset, odkazy a overflow.
- **Nedeklarovat PASS**, dokud aktuální CI neproběhne a nevrátí `success`.
- Samostatně ověřit reálné zdroje videa a pedagogickou přejímku na školní síti, Windows, Androidu a iPadu/iOS.
- Etapa R25 řeší školní stupnici a finální audit; bez potvrzeného schválení a skutečné kontroly písemných odpovědí nesmí vzniknout automatická známka.

**Kanonický veřejný katalog (pro učitele):** https://ghrab-jazyky.github.io/language-skills-hub/

**Poznámka:** URL pilotních stránek výše začnou fungovat z ostrého GitHub Pages teprve po schválení a odpovídajícím merge; PR draft nejsou automaticky produkčně publikovány.
