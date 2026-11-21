# Asteroids – Materiály PDF: předprodukční přejímka (21. 11. 2026)

**Rozsah:** LSH Reading Lab / Asteroids, 4 jazyky × 6 úrovní × 2 režimy × 2 formáty = 96 PDF.  
**PR:** https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/pull/146  
**Stav:** DRAFT / NO DEPLOY. Tento checklist **není podpis schválení**.

## Automatické technické podmínky

- [ ] Na **aktuální** hlavě PR úspěšný agregovaný status `pdf-release-gate` (nikoli starší zelený commit).
- [ ] Jobs `unit`, `browser` a `corpus` PASS, včetně regenerace a porovnání všech 96 PDF.
- [ ] `sourceSha256` odpovídá zdrojům, manifest obsahuje 96 očekávaných souborů a SHA256 sedí.
- [ ] Všechna PDF jsou A4, mají logo školy, správné počty úloh, žádný klíč ani žákovské údaje.
- [ ] EN B2 `test-text.pdf` má jednu stránku; DE C2 `practice-text.pdf` a `test-text.pdf` ideálně jednu stránku (ověřit v QA).
- [ ] V `practice-all` B1–C2 je skutečně vynechaná věta; `practice-text` ji obsahuje úplnou.

## Dodatečná regrese stránkování (při převzetí auditu)

- [x] Nález: v původní verzi EN/B1 `practice-all.pdf` i `test-all.pdf` měly 4 stránky; poslední obsahovala jen automatické zápatí bez úloh.
- [x] Ve vývojové větvi upravena sazba reflexe EN/B1 bez snížení velikosti písma textu.
- [x] Po automatickém přegenerování 96 PDF: ze skutečných binárních PDF na commitu `0f8df6b35c15` ověřeno `en/B1/practice-all.pdf` = 3 stránky a `en/B1/test-all.pdf` = 3 stránky (původně 4).
- [x] Do `verify-reading-print-assets.cjs` přidán test obsahu **každé stránky**, který po odečtení zápatí odmítne prázdnou / téměř prázdnou stránku.
- [ ] Nový `pdf-release-gate` PASS na skutečném posledním HEAD včetně přegenerovaného korpusu a nové kontroly prázdných stran.
- [ ] Ručně prohlédnout finální první, prostřední a poslední stránky (automatický test nenahrazuje kontrolu tisku).

## Povinné kroky administrátora repozitáře

- [ ] GitHub → Settings → Branches / Rulesets → pravidlo pro `main`.
- [ ] Povinná úspěšná kontrola `pdf-release-gate` při každém pull requestu (stabilní název jobu); nevolit jednotlivé podmíněné jobs, které se mohou přeskočit.
- [ ] Zakázat běžné přímé zápisy a obcházení ochrany `main`.
- [ ] Zkusit PR s nepříslušnou změnou: `pdf-release-gate` zelený i při přeskočených nákladných jobs.
- [ ] Zkusit v izolované větvi záměrně zastaralý PDF manifest: `pdf-release-gate` musí být červený. Neprovádět tento test na `main`.

## Ruční přejímka funkce a tisku

- [ ] Edge/Windows: otevřít katalog Reading Lab → Asteroids → Materiály PDF. Přepínat EN/ES/DE/FR, A1–C2, všechny čtyři exporty; stahování/otevření/obsah se shoduje s volbou.
- [ ] Na telefonu Chrome/Android a Safari/iPad: modal se nepřekrývá, soubory se otevírají, náhled nevyžaduje vodorovný posun. Otestovat také Edge/Chrome na desktopu.
- [ ] Při nepřístupném manifestu: jasná hláška a funkční tiskový náhled namísto falešného odkazu na `.pdf`.
- [ ] ČB tiskárna A4: EN B2 `test-all`, ES B2 `practice-all`, DE C2 `test-all`, FR C1 `practice-all`. Ověřit čitelnost 7pt zápatí, školní logo, odstavce, zalomení, dostatek místa pro odpovědi.
- [ ] Ověřit všechny stránky vybraných PDF, ne jen první a poslední; zvlášť EN B1 `practice-all` / `test-all`, které mohou mít samostatnou poslední stranu s reflexí.
- [ ] Žákovské čtecí/testové obrazovky zůstávají beze změny, bez exportních tlačítek; jejich odpovědi, hodnocení a anotace se nemění.

## Původ textů a práva – výslovné rozhodnutí vlastníka

British Council Terms of Use (https://www.britishcouncil.org/terms) dovolují vybrané osobní nekomerční užití, nikoliv bez dalšího veřejnou republikační kopii či úpravu jejich obsahu.

- [ ] Odpovědná osoba potvrdí, zda školní texty a otázky byly **samostatně vytvořeny pouze na základě tématu**, nikoliv převzaty či přeloženy/adaptovány z British Council; případně založí písemné oprávnění k opětovnému zveřejnění.
- [ ] Vydané zápatí uvádí **„Téma inspirováno: British Council LearnEnglish – Asteroids“**, nikoli nepravdivé tvrzení, že British Council materiál vydal.
- [ ] Založit interní záznam o autorství/zdrojích a schválení veřejné distribuce všech jazykových verzí.

## Vydávací rozhodnutí

- [ ] Všechny body výše potvrzeny s datem, revizí PR a odpovědnou osobou.
- [ ] Větev připravena k merge; až po potvrzení je možné změnit PR z Draft na Ready a sloučit do `main`.
- [ ] Po vydání ověřit 96 URL / manifest v živém GitHub Pages, stahování EN B2 a kontrolu první/poslední stránky.

**Pravidlo:** Automatický PASS sám o sobě **není** GO do produkce. Zejména ochrana `main`, fyzická přejímka a práva vyžadují samostatnou evidenci.
