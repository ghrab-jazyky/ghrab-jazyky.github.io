# R5H — čtyři Reading Lab karty: technické integrování URL/QR

**7. listopadu 2026 · PR #27 DRAFT · BEZ MERGE / BEZ VYDÁNÍ**

## Rozsah
- Can Mistakes Help Us Learn? (v4.3) — source blob `ca88591cbe890d6166605f5133486f5fc17a865e`
- Plastic in Our World / redakčně Plastic Ocean — Film Review (v2) — `444c7f027fb6f4c0fb9170aecf085363f90b5da3`
- An Email from a Friend (v2) — `9178645eaa2d4fcd522a8a52bf2cd4741dfce05f`
- Instant Messages (v2.1) — `274140b4799bfaef6125063e554b86d741d01289`

## Co bylo provedeno
U každého zdrojového HTML (původní cesta `nahledy/cteni/<slug>/index.html`) vznikla **oddělená integrační kopie** `integrace/cteni/<slug>/index.html`. Kód a studentský text originálu zůstaly bajtově nedotčené. Integrace přidává právě jeden identický bridge převzatý z Asteroids v2.3: volná URL `?practice=1`, pevná `?lang=es&level=B2&zamek=1&practice=1`, přednastavení, UI-only zámek jazykových a CEFR ovladačů a slovník ON v procvičování. Zámek není serverová ochrana.

Pro každou kartu ověřeno **EN/ES/DE/FR × A1–C2 = 24 existujících variant**, **15 úloh na variantu = 360** (4 karty: 96 variant a 1 440 záznamů otázek). To jsou **strukturální** kontroly, nikoli nezávislé lingvistické testování nebo pedagogické schválení. Učitelské klíče nebyly přidány.

Katalog `reference-karty/` obsahuje nyní **28 z 29** existujících karet jako **NESCHVÁLENÝ TECHNICKÝ PILOT**: 20 Conversation (včetně reference), 5 Reading (včetně reference) a 3 Listening (včetně reference). Všechny mají volnou/pevnou URL a QR. Přibylo **96 pevných kombinací**; celkem 618 pevných + 28 volných URL.

## Otevřené překážky a vydávací brána
1. **Škola (ES A1):** duplikát `¿Es grande o pequeño?` ve stanovištích 1 a 8; návrh úpravy dosud není schválen. Jediná existující karta mimo technický pilot.
2. **Reading obsah:** porovnat každou úroveň s Asteroids v2.3, ověřit jazykovou autenticitu, obtížnost, skutečné otázky, evidence a odpovědní klíče mimo veřejný repozitář. U *Plastic* je potřeba vyřešit **rozpor v názvu**: HTML se jmenuje `Plastic in Our World`, inventář `Plastic Ocean — Film Review`; nižší úrovně nejsou filmovou recenzí.
3. **Listening:** Harrison Ford a Peaky Blinders jsou zatím pouze URL-integrované. Pedagogická tříposlechová migrace, ověření médií a věková vhodnost čekají.
4. **Nezávislá QA:** prohlížeče a zařízení Android/iOS/iPadOS, školní síť, skutečné studentské QR, offline HTML a slovník; případný režim `file://` má prohlížečová omezení.
5. **Testování:** všech 29 karet vyžaduje samostatné kratší a schválené testové sady; **Test zůstává vypnutý**.
6. **Povolení vydání:** PR #27 zůstává DRAFT; bez souhlasů a fyzických UAT se nemerguje do main. Veřejné GitHub Pages není bezpečná autentizovaná zkušební služba.

**Nezaměňovat:** 28/29 URL-integrovaných neznamená 28/29 schválených pedagogicky sjednocených karet.
