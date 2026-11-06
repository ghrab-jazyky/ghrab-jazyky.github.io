# Language Skills Hub — jednotný výběr na GitHub Pages (R1)

**Datum:** 6. 11. 2026. **Závazná architektura:** GitHub-only.
**Cesta po schváleném sloučení:** `https://ghrab-jazyky.github.io/zkusebni/vyber/`
**Status obsahu:** TECHNICKÝ PILOT; nejsou tím nahrazena pedagogická ani fyzická UAT schválení.

## Co učitel získává
Jeden výběrový katalog na GitHub Pages, který čte přímo
`/zkusebni/data/manifest.json` a používá **stávající** ověřený
`core.js`, `app.js` a `qr.js`. Nezavádí vlastní katalogová data,
server, přihlášení ani další platformu.

Postup: otevřít `/zkusebni/vyber/`, zvolit dovednost
(Mluvení/Čtení/Poslech), jazyk (EN/ES/DE/FR), úroveň (A1–C2),
případně hledat téma; kliknout na **Sdílet studentům**.
Dialog přebere vybraný jazyk a úroveň, vygeneruje přímý odkaz,
QR (offline SVG) a krátký kód. Student může naskenovat QR kamerou
systému nebo vložit kód v `/zkusebni/k/`. Volitelný zámek
`?zamek=1` pouze omezuje změnu volby v UI a není autentizací.

Aktuálně:
- **21/21 konverzačních karet**, nadále `ROZPRACOVANO`
  a viditelně označených jako pilot.
- **Reading Lab:** 0 skutečně schválených karet, proto se **fiktivní
  Niva demo nezobrazuje v jednotném výběru**, ač nadále zůstává
  k dispozici na technickém čtecím katalogu.
- **Listening Lab:** 0 integrovaných karet, filtr ukáže informaci
  namísto vymyšleného obsahu.

## Veřejný katalog vs. privátní data učitelů
GitHub Pages je **veřejný statický web** a **neposkytuje
bezpečné přihlášení učitelů ani oprávnění k privátním souborům**.
Jednotný výběr je proto přístupný komukoli s odkazem,
ale neobsahuje žádné učitelské klíče, řešení, jména žáků,
přihlášení, tokeny ani neveřejná školní data.

Učitelské klíče a neveřejné hodnoticí podklady **oddělit do
soukromého GitHub repozitáře**, kde lze oprávnění přidělovat
konkrétním GitHub účtům. Učitel je otevře přímo na GitHubu po
přihlášení; veřejný katalog nesmí falešně slibovat zabezpečení
skrytým tlačítkem nebo klientským heslem.

`core.validateManifest` nyní u veřejného manifestu **odmítá**
jakékoliv `hasTeacherKey:true` nebo neprázdné
`teacherKeyUrl`, nezávisle na cílové doméně.

## Pravidla přidávání dalších karet (bez nové platformy)
1. Po pedagogickém schválení připravit samostatné studentské
   `index.html` pro `zkusebni/<skill>/<slug>/`.
   U Reading Lab dodržet aktuální master v3.4 včetně offline
   slovníčku, čísel odstavců a obousměrné navigace.
2. Přidat **jediný nový záznam** do veřejného manifestu,
   s jedinečným `id`, `shortCode`, bezpečným `cardPath`,
   seznamem skutečně přítomných `variants`, stavem a verzí.
3. Důsledně nenahrávat učitelské klíče ani jejich URL.
   Reading `reading-lab-vocabulary` a Conversation `lsh-test`
   nejsou zaměnitelné; žádná automatická migrace.
4. Spustit Node a Chromium/WebKit regresní testy,
   fyzickou UAT na Android/iPhone/iPad a prověřit odkaz,
   QR, přístupnost a offline provoz.
5. Teprve pak slučovat do GitHub `main`.
   GitHub Pages automaticky publikuje odpovídající obsah;
   katalog zahrne novou kartu bez dalších ručních zásahů.

## Testy
- `zkusebni/tests/github-only-catalog.test.cjs`:
  jednotný katalog, absence demo, GitHub-only cesty,
  zákaz teacher-key URL a offline scope.
- `zkusebni/tests/github-only-catalog.browser.test.cjs`:
  Chromium desktop/mobil, WebKit mobilní šířka:
  výběr, filtr, hledání bez diakritiky, generování QR/URL
  a převzetí výchozího jazyka/úrovně; Chromium offline PWA.
- Dosavadní E3A–E3D a RC1 testy se spouštějí také.

**Neověřené:** fyzická iOS/Android UAT, skutečné pedagogické
schválení všech Reading/Listening karet, zabezpečená webová
učitelská část (GitHub Pages ji neumí bez další služby).
