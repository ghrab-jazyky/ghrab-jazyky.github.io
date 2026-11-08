# Language Skills Hub R11 — offline revizní matice 642 variant

**Stav:** DRAFT, bez pedagogického schválení a bez nasazení do \`main\`.

## Cíl
V R10 existuje jeden offline ZIP se všemi 29 kartami. R11 do téhož kontrolního balíčku přidává **review.html**, ve kterém lze průběžně evidovat skutečnou jazykovou a pedagogickou kontrolu **642 kombinací**:

- Conversation Lab: 21 témat × 4 jazyky × 6 úrovní = 504.
- Reading Lab: 5 témat × 4 jazyky × 6 úrovní = 120.
- Listening Lab: 3 témata × angličtina × 6 úrovní = 18.

Každá varianta má přímý odkaz na odpovídající kartu, filtr podle dovednosti, jazyka, CEFR a stavu, poznámku do 1 000 znaků a tři pracovní stavy: **Ke kontrole**, **Posouzeno bez nálezu**, **Vyžaduje opravu**. Ani jeden z těchto stavů nepovoluje zveřejnění, použití ke klasifikaci ani označení \`teacherApproval=true\`.

## Bezpečné používání
1. Rozbalit celý ZIP, otevřít **review.html** a filtrovat konkrétní téma, jazyk a úroveň. 
2. Otevřít studentskou kartu tlačítkem a zkontrolovat všechny relevantní úlohy, jejich obtížnost, přirozenost a fungování.
3. V revizní matici zaznamenat stav a konkrétní nález. Stav zůstává lokální; při omezeném \`file://\` úložišti je nutné pravidelně **Exportovat stav JSON**.
4. Pro přesun na jiné zařízení použít **Importovat stav JSON**. Soubor je striktně vázán na SHA-256 všech 29 kontrolovaných studentských karet. Starší nebo neslučitelný export se odmítne.
5. Do poznámek nepatří jména studentů, osobní údaje ani soukromé učitelské klíče. Exportní JSON je pracovní soubor revizora, nikoli veřejný podklad ke zveřejnění.

## Čtyři samostatné kontrolní kopie R7
Dvě opravené Reading karty a dva sjednocené Listening kandidáti neměly v původním R10 ZIPu univerzální zámek varianty. R11 vytváří pro **rl-email-friend**, **rl-instant-messages**, **ll-harrison-ford** a **ll-peaky-no-fighting** samostatné soubory pod \`r11/variant-copies/\`. Přidává se pouze doslovný ověřený URL/QR adaptér z odpovídající existující integrační karty; po odebrání adaptéru musí studentský obsah odpovídat původnímu R10 souboru znak po znaku. Původní soubor R10 se nepřepisuje.

Zámek jazyka/úrovně je **pouze ovládací prvek**, nikoli zabezpečení proti změně URL nebo vývojářskými nástroji. Testování zůstává neaktivní.

## Kontroly v CI
Workflow \`.github/workflows/lsh-r10-unified-review.yml\` nově generuje R11 z kontrolovaného R10, provádí:
- statickou integritu všech 642 odkazů a kontrolních otisků 29 zdrojů;
- regresi přesné a reverzibilní změny čtyř R7 HTML pouze pro účely revize;
- offline test stránky review.html v Chromium/WebKit, filtrování, poznámek, exportu/importu a odmítnutí cizího bundle ID;
- otevření reprezentativních zamčených variant R8 Conversation, R7 Reading a R7 Listening.

**Rozsah:** automatické testy neověřují lingvistickou správnost všech 642 variant, skutečné iOS/Android zařízení, věkovou vhodnost Peaky Blinders ani externí video. U Reading nadále zbývá synchronizovat 17 obsahových oprav s neveřejnými učitelskými klíči. Žádný soubor s těmito klíči nesmí do veřejného GitHubu.

## Vydávací pravidlo
Ani 642 záznamů „Posouzeno bez nálezu“ automaticky nepřepne \`approvedForRelease\`, neaktivuje \`Testování\` a nesloučí DRAFT PR #27 do \`main\`. K tomu musí následovat zvláštní pedagogická přejímka, ověření klíčů a médií, fyzická UAT a výslovné povolení vydání.
