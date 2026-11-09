# Language Skills Hub R16 — osobní přejímka všech 29 karet

**Stav:** připravený podklad pro osobní UAT (user acceptance testing). NIKOLIV automatické schválení pedagogického obsahu, žádný merge do main, žádné ostré ani klasifikované testy.

## Co se přidává

Do předchozího izolovaného ZIPu R15 se po kontrolách přidává stránka start-test.html. Uživatel může volit:

- Conversation Lab – 21 témat;
- Reading Lab – 5 témat;
- Listening Lab – 3 témata;
- jazyk podle dostupných jazyků karty a úroveň A1–C2;
- pevně nastavenou jazykovou/úrovňovou variantu nebo volné otevření.

Pevně nastavené odkazy pocházejí přímo z validované R11 matice
642 variant, včetně čtyř kontrolních kopií R7.

Stránka umožňuje zaznamenat pro konkrétní variantu závadu P1/P2/P3,
zařadit oblast, popsat problém a uložit/obnovit JSON report.
Export se neposílá automaticky na GitHub, do e-mailu ani nikam jinam.
Lokální úložiště může být na iOS u file:// omezené; pravidelný export
je proto nutný. Neuvádět osobní údaje žáků ani učitelské klíče.

## Jak si stáhnout a spustit test

1. Na GitHubu otevřít PR #27, najít poslední úspěšné GitHub Actions
   LSH R16 personal UAT launch (NO deployment).
2. Stáhnout artefakt lsh-r16-personal-uat-29-cards-642-variants-NO-KEYS.
3. ZIP **celý rozbalit** na disk. Nespouštět HTML z náhledu ZIPu.
4. Otevřít start-test.html na PC v Chrome / Edge / Firefox. Pro iOS,
   Android a iPad při fyzickém testu poznamenat, jaký způsob otevření
   místního HTML dané zařízení skutečně dovolí.
5. Vybrat téma, jazyk, CEFR a otevřít studentskou kartu. Případnou chybu
   zaznamenat dole na stránce a exportovat report JSON.
6. review.html zůstává pro systematickou 642-položkovou pedagogickou
   kontrolu, triage.html pro nálezy a release-check.html pro 14 UAT bodů.

Vhodné první scénáře: ES A1 Škola, EN/ES B2 Instant Messages a jedno
video Listening. Dále jiné jazyky, C1/C2, slovníček, přepínače a mobilní
šířka. Poslechová média vyžadují internet a jejich provoz ve školní síti
stále není potvrzen.

## Rozsah strojového ověření

- 29 studentských HTML je ověřeno SHA-256 a generátor je nepřepisuje.
- Všech 642 variant má přesný lokální cíl; nepublikované učitelské klíče
  se do ZIPu nepřikládají.
- Stav vydání zůstává false; klasifikované testování má trvalé NO-GO.
- Chromium desktop + WebKit mobil testují start-test.html offline,
  filtr témat, pevnou/volnou variantu, export/import, odmítnutí nesprávné
  verze a skutečné otevření zamčené Reading karty.
- CI nenahrazuje fyzický test iPhonu/iPadu ani jazykovou revizi.

## Co tato etapa NEDĚLÁ

Nenasazuje ani nepřepisuje ostré GitHub Pages. GitHub Actions artefakt
je ke stažení, není to nová veřejná online adresa. Pokud po osobním
testu bude požadováno živé webové URL, je třeba samostatně připravit
řízený staging a rozhodnout o jeho publikování.

Nikdy nebrat položku "otestováno" jako souhlas s klasifikací.
