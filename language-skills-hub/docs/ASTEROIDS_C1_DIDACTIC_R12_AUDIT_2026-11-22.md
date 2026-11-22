# Asteroids / Reading Lab – nezávislý didakticko-lingvistický audit R-12

**Datum:** 22. 11. 2026  
**Výchozí revize:** `main` `bf1d0f3fa35874d41a117b5f67bf3b7d061e4c2f`  
**Rozsah:** španělská a francouzská karta C1 (2 původní čtecí texty, **42 otázek**, 7 druhů čtenářských aktivit × 3 otázky v každém jazyce).  
**Podklad:** nezávislý Claude R-12 v [issue #157](https://github.com/ghrab-jazyky/ghrab-jazyky.github.io/issues/157), přímé ověření proti skutečným textům, otázkám, možnostem, klíčům a textovým důkazům.  
**Kritérium:** CEFR Companion volume, zejména *Reading for information and argument* C1: podrobné porozumění komplexním textům, vztahům, výslovným i implicitním postojům. Oficiální [Council of Europe descriptor](https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4).

## Didaktické rozhodnutí

**R-12 potvrzen, ale nikoli plošná chyba úrovně C1.** Karta kombinuje gist, scan/repérage, detail, inference, contextual vocabulary, paragraph matching a cohesion. Nižší kognitivní náročnost části úloh je funkční pro procvičení rychlé orientace; nelze požadovat, aby všech 21 otázek ověřovalo inferenci. Naopak tři původní španělské a tři francouzské *scan* otázky byly mechanickým výběrem doslovné fráze/slova z textu, což je pro C1 slabší evidence skutečného vyhledávání s porozuměním. Dále `Que llaman por teléfono` a `Qui donne des coups` byly nevěrohodně snadné lexikální distraktory.

**Schválený nápravný princip:** vyhledávat **soubory souvisejících informací, relevantní podmínky a míru jistoty**, nikoliv lovit slovo podle shodného znění. *Scan* však zůstává odlišný od *inference*. Slovníková úloha požaduje správnou interpretaci v kontextu, nikoli pouze obecný slovníkový ekvivalent. Všechny distraktory musí být gramaticky rovnocenné a jeden nejlepší výklad obhajitelný konkrétní pasáží.

## Matice zásahů

| Jazyk | Otázka / ID | Dřívější problém | Ověřený nový cíl | Správná možnost, 0-based | Odstavec |
|---|---|---|---|---:|---:|
| ES | Q4 `es-c1-scan-1` | Opsat „una garantía universal“ | Tři podmínky přenositelnosti DART | 0 | 3 |
| ES | Q5 `es-c1-scan-2` | Opsat „razonable“ | Klíčové podmínky přípravy: monitoring, data, komunikace | 0 | 4 |
| ES | Q6 `es-c1-scan-3` | Doplnit „rotundo“ | Rozpoznat rozdíl mezi stupněm jistoty titulku a důkazů | 1 | 1 |
| ES | Q13 `es-c1-vocab-1` | Nesmyslný distraktor „Que llaman por teléfono“ | Kontextové rozlišení upoutání pozornosti a informativní hodnoty | 1 | 1 |
| FR | Q4 `fr-c1-scan-1` | Opsat „une garantie universelle“ | Tři parametry předvídání účinnosti odklonu | 0 | 3 |
| FR | Q5 `fr-c1-scan-2` | Opsat „essentielle“ | Pro výklad pravděpodobnosti hledat datum a chybovou mez | 2 | 2 |
| FR | Q6 `fr-c1-scan-3` | Doplnit „affirmatif“ | Rozpoznat přehnanou jistotu novinového titulku | 1 | 1 |
| FR | Q13 `fr-c1-vocab-1` | Nesmyslný distraktor „Qui donne des coups“ | Kontextový účinek výrazu „frappante“ | 1 | 1 |

*Čísla odstavců jsou ve výukové interpretaci 1-based; JSON `evidence.p` je 0-based.*

## Textová opora a rozlišení správných odpovědí

- **ES Q4:** „la estructura física del asteroide, de la dirección en que habría que desviarlo y, sobre todo, del tiempo disponible“. Na rozdíl od optického pozorování či medializace jde o výslovně uvedenou trojici parametrů.
- **ES Q5:** „Los programas de observación, el intercambio internacional de datos y las explicaciones públicas cuidadosas [...] son esenciales para cualquier intervención posterior“. Všechny tři složky se musejí sejít.
- **ES Q6:** „un titular mucho más rotundo de lo que permiten los datos disponibles“. Přehnaná jistota **není** totéž jako doložená hrozba.
- **ES Q13:** „advertencias llamativas pero poco útiles“. *Llamativo* znamená nápadný/poutavý; druhá část spojení kritizuje informační přínos, nikoli frekvenci nebo telefonování.
- **FR Q4:** „de la structure physique du corps, de la direction souhaitée pour la déviation et surtout du temps restant avant un éventuel impact“. Upravená možnost výslovně zachovává nejistotu „impact éventuel“.
- **FR Q5:** „Un chiffre isolé perd son sens si l’on ignore la date des observations et la marge d’erreur“. Datum a interval/mez nejistoty jsou oba nutné kontexty.
- **FR Q6:** „un titre beaucoup plus affirmatif que ne le permettent les données scientifiques“. Rozdíl je míra kategorického tvrzení proti síle důkazů.
- **FR Q13:** „une alerte frappante mais peu instructive“. *Frappante* zdůrazňuje účinek na pozornost, ne skutečnost, opakování nebo fyzický úder.

## Validace zbytku karty

- **Bez úpravy:** 34 dalších položek v ES/FR C1. Gist/inference/detail/structure zachovávají odlišné cíle; některé jsou záměrně snazší, protože ověřují hledání, referenci a lexikální orientaci. *R12 není důkazem*, že všech 42 položek má psychometricky stanovenou obtížnost C1.
- **Beze změny:** všechny původní odstavce, otevřené reflexe, gap-sentence, předúlohy; všechny ostatní jazyky a úrovně; všech 16 gap variant; 7 sekcí a **21 otázek/variantu**.
- **Stabilita vyhodnocování:** všech osm `id` a správných **číselných indexů** zůstalo zachováno (ES `0,0,1,1`; FR `0,2,1,1`). Nový text správných odpovědí se samozřejmě liší; výsledky z původní a nové sady nelze považovat za identickou testovou formu.
- **Ochrana testů:** samostatný regresní test `rl-pdf-asteroids-c1-didactic.test.cjs` kontroluje přímé citace v odstavcích, správný klíč, jednoznačnost čtyř textových možností, lokální skórování správné/chybné volby a shodu otázek na PDF pracovních listech `practice-all` / `test-all`, bez úniku klíčů.
- **Zdrojová omezení:** oficiální CEFR deskriptory umožňují kvalifikovanou obsahovou revizi, ale **bez empirického pilotního testování** studentů nelze certifikovat statistickou obtížnost či diskriminační schopnost položek. Karta je veřejný statický zdroj; žádná lokální znalost klíčů nemůže tvořit silné bezpečnostní tajemství.

## Release acceptance – povinné podmínky

- [ ] Bot vygeneroval z posledního zdroje všech **96 PDF** a manifest se správným fingerprintem.
- [ ] Regresní test R-12 je zařazen do povinné unit CI a všechny nové i staré unit testy procházejí.
- [ ] Závěrečný `pdf-scope`, `unit`, `browser`, `corpus` a `pdf-release-gate` mají **SUCCESS na posledním HEAD**.
- [ ] Kontrola skutečně regenerovaných PDF ES/C1 a FR/C1 potvrzuje všech 8 nových znění, vyvážené možnosti, žádnou starou chybně formulovanou možnost a žádný tiskový overflow.
- [ ] Obsah jiných 22 variant a studentské bezpečnostní prvky se nezměnily.
- [ ] Standardní PR merge přes chráněný `main`; po merge GitHub Pages a PDF CI SUCCESS na merge SHA.

**Stav tohoto dokumentu:** analytická přejímka dokončena; technická a produkční certifikace čeká na výsledky CI. Žádné automatické nasazení bez zelené brány.
