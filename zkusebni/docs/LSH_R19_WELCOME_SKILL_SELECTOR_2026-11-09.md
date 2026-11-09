# R19 – Language Skills Hub, úvodní obrazovka a výběr laboratoře
Datum: 9. listopadu 2026. Implementace po R18 bez změny studentských zdrojů.

## Požadavky a realizace

1. Při prvním vstupu na hlavní katalog se zobrazí úvod na 100 % výšky
   viewportu (100dvh), slogan „Tři dovednosti. Jedno místo.“,
   název Gymnázium Ostrava-Hrabůvka a počty 21 / 5 / 3.
2. Po 3 000 ms se objeví jediný překryv s panely Conversation, Reading,
   Listening Lab. Tlačítko „Vybrat laboratoř nyní“ čekání přeskočí.
   Uživatel s nastaveným omezením animací nemusí čekat tři sekundy.
   Esc nabídku zavře na úvod a umožní opětovné otevření.
3. Po volbě se zobrazí pouze příslušný katalog s 21, 5 nebo 3 kartami.
   Tlačítko „Změnit laboratoř“ vrací na výběr bez opětovného čekání.
4. Výchozí filtry jsou „Všechny jazyky“ a „Všechny úrovně“.
   Lze filtrovat téma, dostupný jazyk i CEFR. Časově nezávislá změna
   CEFR nemění počet karet, pokud všechny podporují A1–C2.
5. Po otevření aktivity bez obou filtrů se předá URL pro volné procvičování
   bez zámku. Při explicitní kombinaci jazyka+CEFR se zachovává
   původní R17 pevná varianta; při částečném výběru se předá jen
   odpovídající parametr bez zámku. R21 oddělí budoucí přepínač
   „určuje učitel“ versus „vybírá student“ pro sdílení.
6. Přímé odkazy ?skill=cteni&lang=de&level=C1 otevřou přímo katalog
   (bez třísekundového úvodu). Výběr a filtry jsou synchronizované s URL;
   prohlížečové Zpět / Vpřed vrací předchozí laboratoř a filtry.
7. Bezpečnost a přístupnost: role dialog, aria-modal, ovladatelnost
   klávesnicí, focus trap, Escape, inert pro skryté pozadí, mobile
   320px/390px, možnost reduced motion. Neodesílá osobní údaje.
8. R18 denní/noční režim, fullscreen a zjednodušená navigace beze změn.
   Původních 29 studentských HTML má stále přesné otisky SHA-256
   ve version.json; žádné veřejné učitelské klíče ani hodnocený test.

## Ověření

- Statické kontroly navigace, přesného počtu panelů, volitelných filtrů,
  integrity 29 student HTML, 642 variant a zachování R18.
- Chromium desktop 1366px: zpoždění, panely, filtr, sdílení QR,
  historie Zpět/Vpřed a čtyři variantové adaptéry.
- Chromium mobil 320px: okamžité přeskočení, Escape, poslech jen EN,
  bez horizontálního posunu a přepínání motivu.
- WebKit mobil 390px: výběr, hledání, změna laboratoře, přímý odkaz,
  bez horizontálního posunu.

## Bezpečné vydání

Selektivně pouze tyto tři soubory pod language-skills-hub:
- index.html
- assets/hub.js
- assets/hub.css

Původní 29 studentských karet, jiný školní web ani data/cards.json
se nesmí upravovat. Přejímka R20/R21 a klasifikované testování
zůstávají samostatnými nedokončenými etapami.
