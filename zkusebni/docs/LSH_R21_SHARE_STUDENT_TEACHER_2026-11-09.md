# R21 – Sdílet se studenty: volný výběr vs. učitelské přednastavení
Datum: 9. listopadu 2026
Prostředí: ostrý Language Skills Hub (GitHub Pages, veřejné procvičování)

## Funkční zadání
- U každé z 29 karet zůstává "Otevřít aktivitu".
- "QR a odkaz" se mění na "Sdílet se studenty".
- Po kliknutí se otevře nativní dialog s přehledným rozhodnutím:
  (A) "Vybírá student" (výchozí při každém otevření dialogu)
  (B) "Určuje učitel" (učitel nastaví jazyk + CEFR)
- Volba se provádí v katalogu, nezávisle na výchozích volitelných filtrech
  katalogu. Aktuální jazyk a CEFR jsou v řízeném režimu nanejvýš
  předvyplněny; nikdy automaticky nepřepnou režim na pevný.
- Režim student: bez lang, level a zamek, tedy URL ?practice=1.
  Student může v kartě vybrat dostupný jazyk i úroveň.
  U Listening je jazyk jediný (EN), ale úroveň může student změnit.
- Režim učitel: oba parametry jsou povinné. Do té doby není dostupný
  QR ani tlačítko kopírování. Při kompletním výběru se vytvoří
  ?practice=1&lang=<dostupný jazyk>&level=<A1-C2>&zamek=1.
  U EN-only poslechů se automaticky předvyplní jediné možné EN.
- QR kód a textový odkaz se generují ze stejného jediného URL,
  a vždy se přegenerují při změně režimu či parametrů.
- URL je skutečná úplná adresa ve viditelném textarea (readonly),
  lze ji ručně označit a kopírovat. Tlačítko "Kopírovat odkaz"
  používá standardní Clipboard API, při chybě viditelné textové pole
  označí a zkusí klasické kopírování; pokud neuspěje, vysvětlí
  ruční Ctrl+C nebo nabídku Kopírovat na telefonu.
- QR lze stáhnout jako SVG. Pokud QR modul selže, zůstane
  kopírovatelný URL odkaz dostupný a je viditelná zpráva.
- Po novém otevření dialogu pro jinou kartu se režim i odkaz
  přepočítají, nemohou zůstat parametry cizí karty.
- UI je plně české a podporuje denní/noční režim, klávesnici,
  mobil 320px a WebKit/Safari 390px.
- Použití speciálních opravených variant je zachováno:
  r11/variant-copies/rl-email-friend.html
  r11/variant-copies/rl-instant-messages.html
  r11/variant-copies/ll-harrison-ford.html
  r11/variant-copies/ll-peaky-no-fighting.html

## Bezpečnostní vymezení
- Parametr zamek=1 je pouze UI zámek. Student ho může obejít
  změnou veřejného odkazu. NEPOUŽÍVAT jako zabezpečený test.
- R21 nerozšiřuje klientský kód studentských karet ani nepřidává
  serverové hodnocení, klasifikaci či přenos osobních údajů.
- Testovací režimy Reading/Listening a školní klasifikační tabulka
  zůstávají úkolem R22–R25.
- Ostatní školní aplikace a studentská data se nemění.

## QA a vydání
- Statická kontrola 29 free URLs a všech 642 fixed URLs, pouze
  povolené jazyky, úrovně, žádné cizí cesty nebo chybné parametry.
- Kontrola SHA-256 originálních 29 studentských HTML proti version.json.
- Playwright Chromium 1366px: volný/přednastavený výběr,
  QR, clipboard API, fallback, stažení QR SVG, R11 Reading.
- WebKit 390px: volné a zablokované ovládání v reálné studentské
  Reading kartě, funkční ruční kopírování a bez horizontálního posunu.
- Chromium 320px: EN-only Listening a úroveň A1, R18 světelný režim.
- Opakovat R19 a R20 prohlížečové a statické testy.
- Do ostré větve selektivně přenést pouze:
  language-skills-hub/index.html
  language-skills-hub/assets/hub.js
  language-skills-hub/assets/hub.css
- Ověřit veřejné HTTPS po publikaci.
