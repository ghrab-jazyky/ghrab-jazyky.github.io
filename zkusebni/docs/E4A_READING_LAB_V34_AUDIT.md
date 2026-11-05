# E4A – Audit závazné kompatibility Reading Lab v3.4
Datum: 2026-11-05
Závazný podklad: uživatelem nahraný Reading_Lab_MASTER_PROMPT_v3_4.txt (v3.4, 05.11.2026)
Předmět: Language Skills Hub E4A, PR #6, pracovní větev
Verdikt: **NO-GO pro napojení skutečných Reading Lab karet a nasazení**.

## Rozsah ověření
Byl přečten celý master prompt v3.4 (407 řádků). Porovnání se stávajícím
E4A modelem, adapterem a syntetickými testy v GitHubu.
NENÍ k dispozici aktuální schválená referenční HTML v4.3+ ani finální
studentská karta; její skutečné implementační chování tedy není ověřeno.
Žádná ostrá karta nebyla změněna ani přidána do katalogu.

## Kritické rozpory

| Priorita | Předpis Reading Lab v3.4 | E4A před revizí | Rozhodnutí |
|---|---|---|---|
| CRITICAL | §12A: DB `reading-lab-vocabulary`, IndexedDB v1, store `words` / keyPath `id` | E3A/E4A používají oddělenou `lsh-test` a jiný model | NIKDY nepřepojovat automaticky; čtecí karty si musí ponechat existující DB |
| CRITICAL | §12A: záloha `reading-lab-vocabulary-backup`, pole `vocabulary`, slovo = `id` (jazyk+normalizovaný výraz+význam), `meaningCs`, `topicIds` | E3A/E4A: `lsh-slovnicek`, `words`, `translationCs`, `sources`, `senseId` | Žádná domnělá zaměnitelnost, import ani konverze bez předem odsouhlasené bezestrátové migrace |
| CRITICAL | §8, §10: aktuální Reading karta ukládá odpovědi do `sessionStorage`, oddělené podle topicId a verze; fallback do paměti | E4A ukládá snapshoty v `IndexedDB` | Nezasahovat do správce odpovědí v existujících kartách; prototyp není drop-in adapter |
| CRITICAL | §12: plně samostatný offline HTML, bez JS/CSS závislostí; funguje i přes `file://` | E4A modul je externí JS závislý na E3A modulech a hostovaném originu | Nepřidávat do samostatné Reading karty jako povinný externí skript |
| CRITICAL | §12A/12B: chráněný učitelský katalog až po schválení obou referencí; student výhradně přímý odkaz na kartu | E2 demo je veřejně přístupný katalog/čtecí ukázka | Demo nepovažovat za Reading Lab produkt; nic nepublikovat, klíče nehostovat veřejně |

## Další povinné shody a mezery

| Závažnost | Předpis v3.4 | Stav / opatření |
|---|---|---|
| HIGH | §8: `firstAttempt` se fixuje **až při první kontrole**, ne při zadání | OPRAVENO v E4A syntetickém adaptéru a testovacím scénáři; zůstává experiment |
| HIGH | §4/5/6: EN/ES/DE/FR x A1–C2, tj. 24 skutečných textů, záložky 3/3/4/6/7/7, přesně tři úlohy/záložku, 90 úloh/jazyk a 360/kartu | E4A ověřuje jen matici 24 syntetických variant se 2 úlohami; **NENÍ** validátor reálné Reading Lab karty |
| HIGH | §1/8: výchozí angličtina bez obnovy jazyka; `?lang=` a `?level=`; slovník po každém otevření OFF | Neověřeno; chybí aktuální skutečná HTML |
| HIGH | §7/8: barevné cíle, přesné evidence anchors, čísla odstavců mimo textContent, obousměrná navigace „zpět k otázce“ | Neověřeno; nesmí nahradit vlastní golden-master moduly karet |
| HIGH | §9/13: vestavěný slovník 100 % každé ze 24 variant, offline bez API a CDN | E4A pouze ukládá syntetická slova, nikoli pokrytí či funkci reálného slovníku |
| HIGH | §11/12A: učitelský klíč generovat z finálních dat, samostatně chránit | V E4A nejsou klíče, a tak je tento bod neověřený; do veřejného GitHubu je nedávat |
| MEDIUM | §13: bezpečnost, postupy didaktického slepého testu, 24 variant, rozlišení reálných vs. neověřených testů | Dřívější CI pro syntetický bridge nic nedokazuje o pedagogickém souladu skutečných karet |
| MEDIUM | §1/10: bez student loginu/PII, sdílení přímým QR, export/import v HTML | E4A vlastní syntetický prototyp nemá reálné UI ani kompletní export/import; nelze vydat jako hotové |

## Provedená korekce E4A
- Adapter `assets/lsh/v4/reading-bridge.js` nyní VÝSLOVNĚ vyžaduje
  `experimentalLegacyAdapter: true` a režim `staging`; jeho výstup deklaruje
  `readingLabV34Compatible: false`. Bez výslovného experimentálního opt-in selže.
- Záznam `firstAttempt` vzniká pouze při první kontrole `checked:true`.
  Vstupní uložení, nezkontrolované přepisování či zfalšování pole
  `firstAttempt` nepřepisuje původní první pokus.
- Aktualizovány syntetické Node a Chromium/WebKit testy. Žádné reálné
  čtecí karty ani slovníčky uživatelů se tím nemění.
- Původní E3A/E3C datový model zůstává zachován pro svou dosavadní
  experimentální větev; není přejmenován na Reading Lab DB.

## Neinvazivní integrační plán
1. Získat **konkrétní referenční Reading Lab HTML v4.3+** a odpovídající
   samostatné učitelské klíče / schválené balíčky. Bez nich nelze auditovat
   existující slovníček v1.2 ani implementovat bezpečný export/import/migraci.
2. Nejdřív read-only zmapovat skutečnou JS strukturu a stávající
   `sessionStorage`, `reading-lab-vocabulary`, data úloh, moduly navigace.
3. Čtecí student HTML ponechat samostatné a úplně offline. Pro katalog
   používat pouze přímé URL/QR; případné napojení slovníčku je volitelné
   a musí zachovat původní Reading DB a zálohovací formát.
4. Rozhodnout, zda společný slovníček napříč Conversation a Reading
   bude pouze UI nad dvěma schématy, nebo vyžádá explicitní uživatelem
   potvrzenou **bezeztrátovou migraci** s testem duplicit a rollbackem.
5. Auditovat první referenční kartu, pedagogicky ji schválit; teprve poté
   druhou; katalog až po obou schváleních (§12B).
6. Zabránit veřejnému hostování učitelských klíčů; oddělit auth-only
   teacher katalog od studentských veřejných jednotlivých HTML.
7. Ověřit všemi předepsanými testy §13 včetně reálných zařízení. Žádný
   jednotkový test syntetického E4A se nepočítá za compliance test karty.

## GO / NO-GO
- **GO:** audit architektury, technický syntetický výzkum (samostatná větev,
  pouze s explicitním experimentálním příznakem), čtení referencí a QA.
- **NO-GO:** zapojení E4A jako závislosti do Reading Lab karet,
  změna formátu slovníčku a odpovědí, tvorba nebo nasazení čtecího
  katalogu, jakékoliv publikování klíčů, merge PR #6 do main.
- Skutečný Reading Lab master v3.4 byl přečten a porovnán; skutečný HTML
  „golden master“ ještě přečten nebyl.

Způsob návratu: ponechat PR #6 ve stavu DRAFT; nepřepisovat ani nemažte
`reading-lab-vocabulary`, `lsh-test` nebo osobní sessionStorage.
