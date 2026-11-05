# Language Skills Hub – chráněný katalog pro učitele (Cloudflare Worker)

**Stav:** technický kandidát. Bez Cloudflare konfigurace **není nasazen**.
**Vazba na RC1:** aktuální manifest z `zkusebni/data/manifest.json`,
21 konverzačních témat + 1 fiktivní čtecí ukázka + 0 poslechů.
**GitHub Pages zůstává výhradně veřejným studentským pilotem**; není
učitelskou autentizací.

## Architektura (2 oddělená publika)
- **Učitelé:** jeden Cloudflare Worker s adresou `/teacher/`,
  aktivní **Cloudflare Access** přímo na Workeru. Platforma předá
  ověřenou identitu přes `ctx.access.getIdentity()`. Server navíc
  vyžaduje konkrétní email v `AUTHORIZED_TEACHERS` (pouze učitelé
  po školení). Nepoužíváme klientem podvrhnutelné HTTP hlavičky.
- **Studenti:** na konkrétní veřejné HTML chodí **bez přihlášení**
  přes QR, krátký kód nebo přímé URL v `STUDENT_BASE_URL`.
- **Učitelské klíče:** stahování pouze z neveřejného `TEACHER_KEYS`
  KV bindingu, výhradně u témat označených jako schválená a s
  `hasTeacherKey=true`. Nikdy nezapisovat správné odpovědi do
  veřejného manifestu, HTML katalogu, GitHubu ani Cloudflare
  statických assets. Vyžadují zcela novou přílohu z privátního KV.
- **Aktuální manifest:** všech 21 konverzačních karet má stav
  `ROZPRACOVANO`. Nejsou nově prohlášeny za pedagogicky ověřené.
  Žádný klíč není ve veřejném manifestu aktivován.

## Před nasazením – povinné kroky správce Cloudflare
1. Vytvořit samostatný Worker `lsh-teacher-gateway` v účtu se
   zapnutou službou Zero Trust. Připravit kopii projektu v Cloudflare.
2. **Nejprve** u Workeru zapnout **Cloudflare Access**, rozhodovací
   politiku `Allow` jen pro schválené učitele/Access skupinu;
   pro školní OAuth podle konfigurace identity providera. ŽÁDNÉ
   `Bypass` pro `Everyone`. Access musí chránit i preview URLs.
   Bez Access by `ctx.access` nebylo k dispozici a Worker
   bude bezpečně vracet **403** i po nasazení.
3. Nastavit Worker secret `AUTHORIZED_TEACHERS` jako seznam
   emailů po školení oddělených čárkou. **NIKDY** nezapisovat
   seznam do verzovaného `wrangler.toml`. Z rootu repozitáře jej lze zadat příkazem
   `npx wrangler secret put AUTHORIZED_TEACHERS --config teacher-gateway/wrangler.toml`.
   Do budoucna nahradit
   allowlist správou skupin s jasnou revokací přístupu.
4. `STUDENT_BASE_URL` před ostrým spuštěním přepnout ze
   zkušební GitHub Pages cesty na schválenou veřejnou Cloudflare
   adresu studentských karet. Pouze platné `https://` s
   koncovým `/`; neplatná konfigurace vrací **503**.
5. **Volitelně** založit soukromý Workers KV namespace a připojit
   jako `TEACHER_KEYS`. Klíče ukládat pod
   `lsh:teacher-key:<topic.id>:<topic.version>` až po
   schválení každé karty a aktualizaci interních metadat.
   Bez bindingu koncový bod vrátí **404** a nic neprozradí.
6. Z rootu repozitáře nasadit Worker přes
   `npx wrangler deploy --config teacher-gateway/wrangler.toml`.
   Cloudflare Access a skutečné oprávnění je nutné ověřit
   v dashboardu – není součástí GitHub Actions.
7. Z reálného prohlížeče ověřit: nezaškolený učitel 403/Access
   blokace, schválený učitel úspěch; všechny 3 katalogy,
   21 karet, filtry/QR/krátké kódy, Safari/iPad/Android,
   kopírování, export SVG, stahování schváleného klíče
   a zamítnutí jakéhokoli nepovoleného klíče.

## Klíčová bezpečnostní pravidla
- Žádné pouhé skrytí tlačítka v JS: kontrola identity je **před**
  každou HTML, CSS, JS i API odpovědí, včetně KV.
- `ctx.access` je dostupný pouze při přímém, službou Access
  ověřeném volání Workeru. Nepoužívat jiný Worker přes
  Service Binding (kontext by se nepřenesl), ani Workers Static
  Assets middleware před auth. Proto všechny UI assets vrací
  tentýž bezpečný Worker.
- Všechny odpovědi `Cache-Control: private, no-store`, CSP s
  `script-src 'self'`, `frame-ancestors 'none'`, žádné CDN,
  trackers, analytics ani sběr studentských údajů.
- Přístup do katalogu není sám o sobě pedagogickým schválením.
  `ROZPRACOVANO` je zřetelně označeno.
- Pokud Cloudflare Access není konfigurace dostupná, Worker
  zůstane nepřístupný. **Nenasazovat alternativu s heslem v JS.**

## Ověření před vydáním
- `node --test teacher-gateway/tests/worker.test.mjs` — testy
  zamítnutí bez Access, seznamu oprávněných, vynesení dat,
  neplatných cest, externích skriptů, soukromého KV klíče,
  správného QR a bezpečnostních hlaviček.
- Před produkcí nutný staging Cloudflare s reálným Access,
  nikoliv jen mock `ctx.access` v Node.
- Prvních 21 karet zůstanou do pedagogického schválení
  jen pilotní. Reading a Listening naplňovat přímými
  schválenými HTML, nikoli pouze katalogovými kartami.

**Blokátor aktivace:** přístup správce do Cloudflare Zero Trust,
nastavení Access policy a allowlistu; žádné jejich hodnoty
zatím v repo ani chatu nejsou. Bez nich nelze uvést chráněný
učitelský katalog do provozu, i když je zdrojový kód hotový.
