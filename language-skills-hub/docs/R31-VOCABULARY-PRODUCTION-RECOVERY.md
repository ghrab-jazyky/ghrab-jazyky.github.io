# Language Skills Hub R31 – produkční slovníček a izolace dat (hotfix candidate)

## Rozsah opravy
- Produkční slovníček je publikovatelný **jen** pod /language-skills-hub/slovnicek/.
- Propojovací modul 21 konverzačních karet ukládá do produkční IndexedDB **lsh**.
- Testovací prostředí /zkusebni/ zůstává beze změny, používá **lsh-test**.
- Odkaz "Zpět ke konverzační kartě" přijímá jen URL na stejném originu pod /language-skills-hub/konverzace/<slug>/ nebo /index.html; cizí návratové URL ignoruje.
- Můj slovníček podporuje ručně přidaná slova, seznam, filtry, procvičování, opakování a JSON zálohu. Přímé ukládání z Reading/Listening není v této verzi slíbeno.
- Stávajících 29 procvičovacích karet a jejich obsahových SHA se změna nedotýká.

## Bezpečná obnova historických slov
Před opravou některé ostré konverzační karty chybně ukládaly slova do zkušební databáze **lsh-test**. **Nesmí se provádět automatická migrace:** zkušební databáze může také obsahovat skutečná testovací slova a plošná migrace by smíchala izolované sady.

Na stejném zařízení a ve stejném profilu prohlížeče:
1. Otevři https://ghrab-jazyky.github.io/zkusebni/slovnicek/ a přes **Export JSON** vytvoř zálohu relevantních slov z lsh-test.
2. Před importem soubor zkontroluj a případně odstraň položky, které do ostré databáze nepatří. Soubor obsahuje slovíčka, překlady, poznámky a lokální metainformace; není vhodný pro veřejné sdílení.
3. Otevři https://ghrab-jazyky.github.io/language-skills-hub/slovnicek/ a zvol **Import JSON**, ideálně bez zaškrtnutí **Nahradit vše**.
4. Ověř počet a obsah importovaných položek a vytvoř nezávislou produkční JSON zálohu. Stará testovací data **automaticky nemaž**.

Žádná data se nepřenášejí na server. IndexedDB může být ztracena při smazání dat webu, v anonymním režimu nebo na sdíleném zařízení.

## Přejímací a release gate
- Node: ověření cest, CSP a explicitního režimu produkčního úložiště a neporušenosti konverzačních karet.
- Playwright Chromium/WebKit: reálná karta → přidat slovo → ověřit lsh/lsh-test izolaci → otevřít slovníček → obnovit → export JSON → smazat a importovat → návrat do karty.
- Nezávislé ruční ověření na Android Chrome, iOS Safari a sdíleném školním počítači včetně exportu JSON.
- **NEPROVÁDĚT MERGE**, dokud se nevyhodnotí všechny nové i stávající brány. GitHub Pages se aktualizuje až po sloučení do main.
- Nikdy nenastavovat LSH_CONFIG.mode = staging v produkčním slovníčku.
