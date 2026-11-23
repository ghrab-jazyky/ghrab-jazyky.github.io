# City Quest F5C — bezpečné publikování a předprodukční rozhodnutí

**Datum:** 23. 11. 2026
**Stav:** návrh řešení — zatím pouze READ-ONLY / NO-GO.
**Větev:** Draft PR #166. Produkční konfigurace GitHub Pages ani main se tímto dokumentem nemění.

## 1. Technická skutečnost

Veřejný katalog Language Skills Hub odkazuje na relativní cestu:

    konverzace/city-quest-f2/index.html

V kontextu hlavního webu to znamená:

    /language-skills-hub/konverzace/city-quest-f2/index.html

Jednosouborový offline export obsahuje vložené styly i JavaScript a ověřuje jejich CSP SHA-256. Skript stage-public.cjs připravuje **právě jeden HTML soubor na uvedené finální cestě**, žádné soubory autorství ani prototypy. Tento balíček představuje **overlay určený k přidání do úplného veřejného webu** — nesmí se publikovat jako kompletní náhrada stávajícího LSH, protože by ostatní karty zmizely.

**Zásadní rozdíl:** kontrola izolovaného balíčku neprokazuje, že běžící GitHub Pages web servíruje pouze tento balíček. Zdrojové soubory v hlavní větvi veřejného repozitáře lze obecně číst na GitHubu bez ohledu na to, zda je Pages zveřejní jako stránky. Nikdy tedy neukládat tajné klíče, soukromá data žáků či jiné neveřejné informace do repozitáře.

## 2. Před nasazením vyřešit a písemně potvrdit

1. Správce repozitáře ověří nastavení **Settings → Pages → Build and deployment**. V dostupných podkladech není doloženo, zda zdrojem webu je větev main, gh-pages, nebo GitHub Actions; samotné CI workflow to nedokazuje.
2. Pokud Pages publikuje přímo kořen zdrojové větve, **sloučení PR s adresářem authoring, testy a prototypy není způsob izolovaného vydání**. Tuto možnost bez nápravy nepovolovat.
3. Pro existující web zvolit bezpečný model **úplného publikačního artefaktu**, který obsahuje všechny stávající schválené veřejné stránky a navíc pouze izolovaný HTML City Quest. Do artifactu nesmějí proniknout city-quest authoring, testy, interní dokumenty ani F0/F1 prototypy.
4. Samostatná izolovaná publikace v jiném repozitáři/doméně je alternativou; vyžaduje změnu odkazu, souvisejícího CSP a samostatný live smoke test. Současná katalogová karta má pouze relativní odkaz a pro tento alternativní způsob není připravena.
5. Nesmí se přepsat existující web, změnit Pages source ani vygenerovat veřejný deployment bez explicitního souhlasu vlastníka.

## 3. Kontrolní release kontrakt

- Automatická CI: přesný commit a všechny hlavní City Quest workflow PASS, včetně F4, plus informativní Chromium + WebKit job se skutečným úspěchem testovacího jobu.
- Úplná lidská matice: 192 CITY + 64 METRO = 256; pro každý řádek jazyková, pedagogická, přístupnostní a vlastnická kontrola, s doloženým reviewerem, datem a konkrétním důkazem.
- Dodatečné manuální brány: nezávislá Claude revize, finální redakce, vizuální schválení, fyzický iPhone, iPad Split View, Android, VoiceOver, TalkBack, ověřené izolované publikování a výslovné konečné GO vlastníka.
- Vazba na obsah: schválení musí být spojeno s SHA-256 přesného jednoho HTML souboru, nikoli pouze se zeleným workflow nebo datem revize.
- Release-readiness.cjs má dva **nepublikační** režimy: --report poskytuje přehled a vrací úspěšný proces i při stavu NO-GO; --enforce vrací nenulový exit code, dokud některé potvrzení chybí. Ani --enforce nikdy nic nenasazuje.
- Aktuální F5C_RELEASE_APPROVALS.json zůstává NO_GO a všude PENDING; nevyplňovat strojově, nezaměňovat umělé testovací signatury za lidskou přejímku.

Formát důkazu pro jednu buňku lidské matice:

    Jméno / role hodnotitele | 2026-11-23 | odkaz na revizní záznam

Pro záznamy v JSON použít samostatná pole reviewer, date (YYYY-MM-DD) a evidence. Samotný formát důkazu není elektronický podpis a skutečnou identitu člověka automaticky neověřuje.

## 4. Předání Claude + lidskému reviewerovi

- Přesný SHA PR #166, diff a komentář s výsledky certifikačních jobů.
- Jednosouborový HTML z F4 artefaktu a kontrolní SHA-256 z REVIEW_MANIFEST.json.
- Rozšířenou F4_256_variant_release_review_matrix.csv (256 řádků, 4 rozhodnutí a 4 důkazy).
- TEACHER_GUIDE_CZ.md jako aktuální pedagogický záměr, nikoli důkaz samostatného jazykového schválení.
- Report release-readiness.cjs --report: musí nadále uvádět NO_GO, dokud nejsou skutečné podklady.
- Při testování žáky anonymizovat obrazové a jiné záznamy.

## 5. Vlastní release až po schválení — návrh postupu

1. Zmrazit souborovou verzi hry a její HTML SHA-256.
2. Doložit všechna jednotlivá jazyková, pedagogická a fyzická schválení.
3. Nezávisle rozhodnout o bezpečné Pages architektuře a veřejném URL. Vytvořit a ověřit **úplný** izolovaný artifact stávajícího LSH se zachováním všech karet.
4. Ověřit, že na veřejné cestě funguje hra a její SHA-256 odpovídá schválenému souboru. Zkontrolovat dostupnost ostatních veřejných karet i nedostupnost nevhodných vývojových adres přes Pages.
5. Teprve po explicitním GO vydat přes odsouhlasený deploy mechanismus; hned poté provést live smoke včetně regresní kontroly všech stávajících funkcí.

**Tento dokument není pokyn k nasazení a nic automaticky nepovoluje.**
