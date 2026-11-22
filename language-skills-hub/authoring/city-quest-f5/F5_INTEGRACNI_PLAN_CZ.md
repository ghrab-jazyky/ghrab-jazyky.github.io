# City Quest F5 — plán bezpečné integrace do aktuálního main

**Nynější stav:** dvě odlišné vývojové linie. Na zdrojovém certifikovaném F4 SHA `73d2781ab...` ve srovnání s tehdejším `main=88b8a7c2...`: **270 ahead / 100 behind / diverged**. `PR #161` je Draft cílený do F4 auditní větve, nikoli přímo do produkce.

## Release rozhodnutí a pořadí

1. **F5A** — auditní balíček + kontrolní důkazy, bez změn aplikační logiky a bez práce na `main`.
2. **F5B** — nezávislý Claude reviewer. Výsledky P0/P1/P2/P3, reprodukce, konkrétní soubory a návrhy oprav.
3. **F5C** — jen schválené opravy v oddělené feature větvi. U každého zásahu přidat regresní test a spustit znovu přesný HEAD všech relevantních City Quest CI. Pokud se změní HTML, nová hashovaná CSP, offline export a nové SHA-256.
4. **F5D** — fyzické iOS/Android a asistivní technologie; ruční jazyková/didaktická kontrola 256 kombinací; podpis vlastníka. Řádky matice ponechat PENDING, dokud reálně nejsou dokončené.
5. **F5E** — po explicitním povolení vlastníka vytvořit **novou čistou integrační větev z aktuálního `main`**, nikoliv sloučit celou historickou feature větev.

## Předpokládaná bezpečná integrační strategie (PŘED REALIZACÍ ZNOVU OVĚŘIT)

- Zaznamenat aktuální přesné SHA `main`, integračního kandidáta a jejich merge-base; `git diff --name-status` a `git diff --check`.
- Pomocí `git diff --name-status main...feature` a `git ls-files` identifikovat vše, co spadá do prefixů `language-skills-hub/authoring/city-quest-*`, `language-skills-hub/konverzace/city-quest-*`, `language-skills-hub/tests/city-quest-*`, `.github/workflows/lsh-city-quest-*`.
- Vyhnout se automatickému hromadnému cherry-picku 270 commitů. Je vhodnější **schválený přesný snapshot City Quest souborů**, plus jednotlivé nezbytné registrace v LSH katalogu — až po ověření cílových rozhraní v aktuálním `main`.
- Prověřit identitu modulů, importů, relativních cest, názvové kolize, CSP/iframe restrikce, katalog karet, přístupová pravidla LSH a všechny vedlejší změny, které by ovlivnily jiná labs nebo GIT.
- Vytvořit **Draft integrační PR** do `main` s izolovanými změnami a CI. Nikdy nespoléhat na zelené CI původního, historického F4 SHA jako důkaz průchodu integrace.
- Samostatně provést **cross-app regresi** GIT, Reading Lab, Listening Lab, PDF materiálů, ostatních karet a bezpečnostních prvků; kontrola musí být doložena konkrétními testy, ne slovní deklarací.
- Před převodem do prod zavést dostupný rollback bod: původní SHA `main`, připravený revert příslušného integračního PR a instrukce pro obnovení případné katalogové registrace.
- Pokud vznikne byť jediný nežádoucí diff nebo chybí důkaz kompatibility, držet `NO-GO`.

## Povinná katalogová integrace City Quest – odlišení od konverzačních karet

**Až po Claude review a schválení UI** vytvořit v čisté nové integrační větvi od aktuálního `main` registraci City Quest v Conversation Lab (`skill:"konverzace"`, ID `cl-city-quest-f2`), s existujícím rozsahem EN/ES/DE/FR a A1–C2, při zachování metra jen od B1 v samotné aplikaci. Nezapisovat nyní nic do produkčního katalogu.

V aktuálním `main` se obsah galerijní karty generuje z `language-skills-hub/data/cards.json` prostřednictvím `language-skills-hub/assets/hub.js` a styluje přes `language-skills-hub/assets/hub.css`. Render používá `article.card > .card-meta`, viditelný štítek laboratoře `.skill` a štítek aktuálně filtrovaného jazyka/CEFR `.catalog-variant`; **v `main` dosud není City Quest v `cards.json`**.

Implementovat **samostatný** přístupný typový štítek `🎮 Interaktivní jazyková hra` + viditelný kontextový popis `Nejde o klasickou konverzační kartu. Procvičuješ orientaci, rozhodování a komunikaci v interaktivních misích.`. Nesmí překrýt název, tlačítko `Otevřít aktivitu`, QR, jazyk/CEFR ani ostatní karty; ověřit v dark/light, s filtry, 320–390px, klávesnicí, screenreadery a 200% textem. Zajistit, aby nový typ nebyl aplikován globálně na ostatní témata Conversation Lab.

Konkrétní UX, vizuální hierarchii, pozici a copy před realizací zreviduje Claude podle `F5_PREMIOVY_PRODUKT_A_DIDAKTIKA_CZ.md`. Teprve poté izolovaný integrační PR a nové katalogové + cross-app CI; žádná změna produkční větve před samostatným souhlasem vlastníka.

## Zakázané zkratky

- Nepřesměrovávat PR #161 přímo na `main` jen proto, že v něm už vše funguje.
- Netvrdit, že GitHub `mergeable=true` v rámci F4 stacku znamená bezpečnou integraci do produkce.
- Neprovádět nasazení přímo z F5 dokumentační větve.
- Neoznačovat `F5 RELEASE GO` bez výsledků Clauda, fyzických zařízení, lidské přejímky a explicitního souhlasu vlastníka.

**Výsledek této fáze:** Integrační plán a podklady, nikoli merge ani deployment.
