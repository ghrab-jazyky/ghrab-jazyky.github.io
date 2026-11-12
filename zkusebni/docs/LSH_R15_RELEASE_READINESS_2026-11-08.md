# Language Skills Hub R15 – offline přejímka a ochrana vydání

Datum: 8. listopadu 2026. PR #27 DRAFT; NO DEPLOY; NO MERGE; NO STUDENT DATA.

## Účel

R15 přidává do samostatného offline revizního balíčku 29 témat/642 variant
soubor release-check.html, 14 kontrolních bodů a možnost načíst revize R11.
Kontrola celého R11 JSON je svázaná s bundleId a všemi platnými ID. Panel
umožňuje export/import stavu R15, ale NEVYTVÁŘÍ schvalovací certifikát.

## Dvě odlišné věci

- Procvičování: lze o jeho případném zveřejnění rozhodnout teprve po skutečné
  pedagogické a provozní přejímce. Žádné automatické vydání neexistuje.
- Klasifikované testování: NO-GO. Správné odpovědi jsou v klientském HTML.
  Je nutné bezpečné oddělené hodnocení a nová technická a metodická brána.
  Zaškrtnutí všech 14 položek ani revize 642/642 tento problém neřeší.
- Soukromé klíče Reading R14 (2 témata, 48 variant, 720 odpovědí):
  nepřenášet do GitHubu, GitHub Pages ani CI. Historické soukromé klíče
  nebyly porovnány a pedagogické schválení chybí.

## Integrační soubory

- zkusebni/assets/lsh/r15/release-template.html: offline kontrolní panel;
  lokální stav, dobrovolný JSON import/export, bez odesílání dat na server.
- zkusebni/tools/r15-release-guard.cjs: generátor, výstup pouze mimo
  repozitář, kontrola SHA-256 všech 29 karet a 642 položek; žádné klíče.
- zkusebni/tests/r15-release-guard.test.cjs: statické fail-closed kontroly.
- zkusebni/tests/r15-release-guard.browser.test.cjs: skutečný lokální
  test Chromium desktop + WebKit mobil 390 px, import/export a NO-GO.

Do existujícího workflow lsh-r10-unified-review.yml za R12 a před upload
artefaktu přidat přesně tyto kroky:

    node --test zkusebni/tests/r15-release-guard.test.cjs
    node zkusebni/tools/r15-release-guard.cjs "$RUNNER_TEMP/lsh-r10-review"

Do prohlížečového jobu přidat:

    node --test zkusebni/tests/r15-release-guard.browser.test.cjs

Výsledkem je jen stažitelný GitHub Actions REVIEW-ONLY ZIP. NEPŘIDÁVAT
deploy step a NEVKLÁDAT soukromé klíče do žádného veřejného artefaktu.

## Povinné manuální kroky

1. Odborně posoudit 642 variant, 12 návrhů Conversation R8 a 17 změn Reading R7.
2. Zkontrolovat nové Reading R14 klíče proti historickým a učitelsky schválit.
3. Na skutečné školní síti ověřit Peaky, Harrison a Matthew video; rozhodnout
   o věkovém určení Peaky Blinders.
4. Provést UAT na Windows, Androidu, iPhonu a iPadu Safari/Split View,
   včetně offline HTML, QR, slovníčku a horizontálního posunu.
5. Řízené vydávací rozhodnutí vedení až po přejímce; PR #27 zůstává DRAFT.

CI PASS není pedagogický souhlas, auditní certifikát ani povolení klasifikace.
