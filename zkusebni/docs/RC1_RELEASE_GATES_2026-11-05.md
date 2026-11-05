# Language Skills Hub — RC1 technický pilot a vydávací brány
Datum: 2026-11-05. Rozhodnutí vlastníka: schváleny všechny technické části,
které mají doložené regresní testy a neohrožují obsah, data ani soukromí.

## Rozsah RC1
Základ: E3D `e39173a4`, obsahuje E2+E3A+B+C+D. Nová větev
`release/lsh-rc1-staging-safe-2026-11-05` upravuje jen pravdivé
popisky, metadata a kontrolní testy. Originálních 21 Conversation HTML
se nedotýká. Neobsahuje zablokovaný experimentální E4A adapter ani
soukromé Reading HTML/učitelské klíče z QA.

Pouze technický preview: `/zkusebni/` (veřejná cesta na GitHub Pages
**AŽ PO případném sloučení do main**).
- Conversation Lab: 21 karet včetně 24 CEFR × jazykových variant,
  lokální slovníček, QR/kódy, oblíbené a filtry, stále ROZPRACOVANO.
- Reading Lab: 1 výslovně fiktivní demo, NENÍ výuková karta.
- Listening Lab: přístupný katalog bez skutečných poslechových karet.
- PWA: offline základ, cache dříve otevřených stránek; lokální data,
  export/import JSON bez automatické synchronizace.

## Co není schváleno ani dokončeno
- Úplné pedagogické ověření referenční Can Mistakes v4.3 a Plastic
  Ocean dle v3.4 (skuteční nezávislí posuzovatelé dosud nevyplnili
  žádné ze 80 testovacích zadání; správná čísla nelze domýšlet).
- Native QR scanner na iOS/Safari; při absenci BarcodeDetector se
  používá běžný fotoaparát nebo krátký kód.
- Učitelský přístup není autentizovaný. **GitHub Pages je veřejný.**
  Bez externího Cloudflare Access/školního OAuth není možné mít
  uzavřený učitelský katalog ani klíče. Do veřejného Pages žádné
  učitelské klíče nepatří.
- Listening Lab neobsahuje skutečné schválené poslechové karty.
- Fyzická UAT Android/iPhone/iPad, offline/cache eviction,
  zprovoznění offline JSON na iOS, dlouhodobá IndexedDB persistence.
- Přímé spojení `lsh-test` a `reading-lab-vocabulary` je datově
  nekompatibilní; neprovádět automatickou migraci.

## Vydávací stupně a pravidla
- **RC1 technický pilot**: GO pro izolované testování po dokončení
  GitHub CI, kontrole veřejných cest, a odstranění nalezených chyb;
  není to produkt pro studenty. Veřejné zpřístupnění umožní QA
  kolegům, ale nejde o kontrolu přístupu.
- **Ostrá verze Conversation Lab**: vyžaduje redakční schválení
  vybraných karet a reálné UAT zařízení; povolení vlastníka projektu
  neprokazuje jazykovou správnost 504 variant.
- **Ostrý Reading Lab katalog**: schválení prvních dvou referenčních
  karet, ochrana učitelských klíčů, přímé odkazy a QR studentům.
- **Ostrý Listening Lab**: skutečné karty, řádné zdrojové licence,
  testy dostupnosti audio/video a mobilní QA.
- **Jednotný chráněný AI Studio rozcestník**: učitelské přihlášení/
  Cloudflare Access; studentské karty přes vlastní veřejné URL,
  bez přihlášení. **Nikdy** nevydávat veřejnou GH Pages katalogovou
  stránku za učitelsky zabezpečenou.

## Regrese RC1
`node --test zkusebni/tests/e3a.test.cjs zkusebni/tests/e3b.static.test.cjs
zkusebni/tests/e3c.test.cjs zkusebni/tests/e3d.test.cjs
zkusebni/tests/rc1-gates.test.cjs`.
Chromium/WebKit scénáře E3C/E3D se spouští ve workflow podle
branch/PR; skutečný iOS/Android UAT se tím nenahrazuje.

## Rollback
Před nasazením: zavřít RC1 PR / zahodit větev. Při nasazení
pilotních souborů do `main` zpětně vrátit pilotní commit; nesmazat
uživatelské browser storage. Neautomatizovat smazání IndexedDB.
