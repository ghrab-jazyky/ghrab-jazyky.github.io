# Language Skills Hub — R5E: první dvě dávky sjednocení Conversation Lab
**Datum:** 7. 11. 2026 · **GitHub:** `ghrab-jazyky/ghrab-jazyky.github.io` · **PR:** #27 (**DRAFT; bez nasazení**).

## 1. Provedená práce a podstatné rozlišení

Vedle referenčních karet (AI / Asteroids / Matthew) jsou v samostatném *pilotním* katalogu nyní další **6 konverzačních témat**. Všech šest již existovalo v původním technickém RC1 katalogu a má své vlastní HTML, otázky a výklad. **Nepřepsali jsme žádný původní studentský soubor ani otázku**; prověřili jsme, že využívají stejnou základní pedagogickou strukturu jako referenční AI. Fungující existující `?lang`, `?level` a `?zamek=1` jsou znovu využity v pilotním sdílení.

| Dávka | Téma | Git blob původního studentského HTML |
|---|---|---|
| R5E-01 | Sociální média | `c81683e238dcdb96f3d4f39768a5d2d0d9b5f0da` |
| R5E-01 | Hraní počítačových her | `1cafcbaa0a9f35d2ff1d0a152e915c5010743364` |
| R5E-02 | Rodina | `d93d87f587f29c7afa5c1946faa7c81f608ab855` |
| R5E-02 | Prázdniny a cestování | `7c92c7808b7eac5c1a8f489921914ca3b85e97ec` |
| R5E-02 | Jídlo, pití a restaurace | `9d16d00de0e79baea3f9f87201678c326bc80989` |
| R5E-02 | Vánoce | `e07f24575f2dc131c3ad9226f10b78579295df03` |

## 2. Nezávislý strukturální audit

Z každého konkrétního zdrojového HTML jsme přečetli **skutečné literal `CONTENT`**. Všechny níže uvedené hodnoty vyšly shodně pro **všech 24 variant každé karty** a odpovídají referenční AI:

| Kontrola | Každá z 6 karet | Celkem 6 karet |
|---|---:|---:|
| Jazyky | EN / ES / DE / FR | — |
| Úrovně na jazyk | A1–C2 | — |
| Jazykově-úrovňové varianty | 24 | **144** |
| Konverzační stanoviště na variantu | 8 | **1 152** stanovišť |
| Doplňující otázky na variantu | 24 | **3 456** otázek |
| Výrazy ve slovní zásobě na variantu | 12 | **1 728** položek |
| Jazykové opory na variantu | 4 | **576** položek |

- Všechny hlavní otázky a názvy stanovišť jsou neprázdné.
- V každé variantě jsou doplňující otázky neprázdné a uvnitř varianty bez doslovných duplicit.
- U každého stanoviště existuje podpora **Support**, rozšíření **Challenge** i náročnější **Stretch**; v B2–C2 jsou dostupná tři **Explain** k doplňujícím otázkám.
- V HTML funguje integrované přednastavení jazyka a CEFR; na kartách je přítomen původní `assets/lsh/v2/lock.js` pro UI zámek. Společné moduly `model.js`, `store.js` a `card-bridge.js` slouží pro osobní slovníček. Ověřování chování na skutečných mobilních zařízeních je ještě otevřené.
- Původní HTML soubory se **nemění**; průběžný test `reference-integrity.cjs` porovnává Git blob SHA a inline JavaScript hash s jejich CSP pravidlem, syntax a skutečnou 24variantní strukturu.
- Sdílená volná a pevná varianta nyní existuje i ve **společném pilotním katalogu**. QR zobrazuje přesný vytvořený odkaz, bez předstírání bezpečného vzdáleného zkoušení.

**Co tato kontrola NEDOKAZUJE:** Neprovádí 100% posouzení idiomatičnosti a věcné správnosti EN/ES/DE/FR, nezávislé CEFR zhodnocení, skutečnou školní mobilní UAT ani pedagogické schválení. Jde o **strukturální kompatibilitu se zvolenou referencí**, nikoli definitivní vydání.

## 3. Co dál chybí u šesti karet

1. **Pedagogická/lingvistická revize:** srovnat skutečnou obtížnost A1–C2, srozumitelnost, příklady a nechtěné duplicity obsahu.
2. **Offline balíček:** původní CLB RC1 HTML odkazuje na společné externí skripty. Proto pilotní katalog **správně deaktivuje** tlačítko pro stažení jediného offline HTML; bez vyřešení závislostí by bylo nefunkční. Pro referenční tři samostatné HTML stahování funguje.
3. **Samostatná testová verze:** není navržen samostatný krátký ústní test ani učitelem schválená rubrika. Nelze jej nahradit vypnutím slovníku.
4. **Fyzická UAT:** kontrola skutečného odkazu a QR na Android/iOS/iPadOS, školní Wi‑Fi, Safari/WebKit, mobilní menu, slovník a split-screen.
5. **Vydání:** pouze po schválení; do hlavního manifestu schválených karet nezasahovat.

## 4. Parametry pro přípravu výuky

- **Úroveň:** A1–C2 dle zvolené studentské varianty.
- **Cílová skupina:** studenti gymnázia, přibližně 11–19 let; volbu varianty musí přizpůsobit vyučující skutečné skupině.
- **Cíl:** interakce ve dvojici či skupině, formulace názoru, doplňující otázky a argumentace v autentickém tematickém kontextu.
- **Odhad času:** cca 45 minut podle původního katalogového manifestu; jednotlivé sekce lze vybírat samostatně.
- **Slabší žáci:** A1–A2, 3–4 stanoviště, Support a jazykové opory; učitel může vést odpovědi v párech.
- **Silnější žáci:** B2–C2, rozšíření Challenge/Stretch, reakce na protiargument, zdůvodnění s příklady.

## 5. Co je nyní v evidenci

- Výchozí rozsah: **29 existujících** témat (**21 Conversation, 5 Reading, 3 Listening**), z nich **3 reference**.
- Přehledně otestováno a do *pilotního* výběru připojeno **6 dalších Conversation** témat.
- Zůstává dalších **14 Conversation + 4 Reading + 2 Listening = 20** nereferečních témat k takovéto kontrole a sjednocení.
- Součástí úplného dokončení je navíc pedagogické schválení, offline kompatibilita a samostatné testové sady pro každou kartu.
- Plánované `cl-human-rights` je mimo aktuální počet 29 do doby doložení zdroje.

**Zdrojové soubory:** `data/reference-pilots.json`, `data/unification-tracker.json`, `tests/reference-integrity.cjs`. **Zveřejněný učitelský klíč:** žádný.

## 6. Akceptační brána

PR #27 zůstává **DRAFT**. Automatické zelené kontroly potvrzují konkrétní technické vlastnosti, **nikoli** dokončení celé migrace nebo schválený klasifikovaný test. Fyzickou UAT ani pedagogický souhlas nelze nahradit výstupem CI.
