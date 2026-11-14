# LSH R64: opravy po nezávislém auditu (P1)

Výchozí stav: `9bb59ff` (R62–R63). Zdroj: audit z 12. 11. 2026, nálezy F-01 až F-06.

## 1. Katalogové kopie jsou zrcadlem kanonických karet

Katalog otevírá `lockSource || relative`. Čtyři kopie v `r11/variant-copies/` zůstaly ve stavu před R42/R44/R49:
dvě poslechové neměly žádný slovníček, dvě čtecí používaly starý slovníček (`reading-lab-vocabulary`) a neměly návrat
„Back to question“.

- Most pro přednastavení jazyka a úrovně (LSH-R5) je nově přímo v kanonických kartách `poslech/harrison-ford`,
  `poslech/peaky-no-fighting`, `cteni/email-friend`, `cteni/instant-messages`.
- Kopie v `r11/variant-copies/` jsou **bajtově shodné** s kanonickým souborem. Adresy z dříve rozdaných QR kódů
  platí dál.
- `assets/lsh/v3/card-vocabulary.js` a návratový odkaz ve slovníčku rozpoznávají i cestu `r11/variant-copies/`.
- `version.json`: nové otisky čtyř karet.
- Testy: `r64-real-catalog-sources` (jednotkový i prohlížečový nad všemi 29 skutečnými adresami); R42 a R49 nově
  otevírají `lockSource || relative`; R55 hlídá shodu zrcadla.

**Pravidlo pro další úpravy:** kanonickou kartu a její kopii měnit vždy společně (zkopírovat soubor); test R64 jinak selže.

## 2. Listening TEST: férové klíče doplňování

`normalizeCloze` nově z odpovědi i z klíče vypouští slova bez poslechové informace (členy, přivlastňovací zájmena,
`and`, `about`, `at`, `in`, `years old` …) a sjednocuje uzavřený seznam fonetických zápisů vlastních jmen
(Kamila → Camila, Valley → Vallée, Stephen → Steven, calvary → cavalry …). Neúplná jména a chybná čísla zůstávají
nesprávně. Test: `r64-listening-cloze-fairness` (18 odpovědí, které musí projít, 12, které nesmí).

## 3. Jeden pokus na zařízení

Rozhodnutí z 13. 11. 2026: na jednom zařízení (profilu prohlížeče) je pro daný test jeden pokus.

- První otevření učitelského odkazu zapíše do `localStorage` registr
  `lsh:device-attempt:r64:<lab>:<kód pokusu>:<téma|jazyk|úroveň>`.
- Každé další otevření téhož QR/odkazu se vrací do **téhož** pokusu (zamčený, běžící nebo odevzdaný) a platí
  časový limit prvního otevření; přepsání `timer` v adrese limit nezmění.
- Po smazání odevzdaných odpovědí zůstává pokus spotřebovaný; stránka oznámí, že test už na zařízení proběhl.
- Pro další test stačí, aby učitel vygeneroval nový odkaz (nový kód pokusu).
- Protokol (PDF i textová kopie) nově uvádí kód pokusu, časový limit, čas zahájení a odevzdání; pokud adresa žádala
  jiný limit, je to v protokolu výslovně uvedeno.
- Odkaz bez `timer` je na obrazovce i v protokolu označen jako test bez dohledu.

Meze se nemění: jiný prohlížeč, anonymní okno, smazání dat webu nebo jiné zařízení statická stránka nepozná.
Učitelský servisní postup pro odemčení zůstává beze změny; popis se v dokumentaci neuvádí.

## Ověření

Jednotkové testy 140/140. Prohlížečové testy v Chromiu: celá sada včetně R56 (120 QR). WebKit a fyzická zařízení
v auditním prostředí nebyly k dispozici – ověřit v CI a ručně podle R63.
