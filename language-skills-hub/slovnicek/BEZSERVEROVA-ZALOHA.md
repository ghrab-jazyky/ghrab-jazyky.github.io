# My Vocabulary – bezserverová ochrana a přenos (R43)

Student otevírá **přímo konverzační, čtecí nebo poslechovou kartu** pomocí učitelského odkazu/QR a vstoupí do My Vocabulary v kartě. Rozcestník LSH nepotřebuje.

## Data a omezení

- Slovíčka zůstávají v IndexedDB `lsh` na konkrétním zařízení a v konkrétním profilu prohlížeče.
- Automatická synchronizace mezi zařízeními **není bez serveru či externí synchronizační služby možná**. Aplikace nepoužívá vlastní server ani studentský účet a nic neodesílá.
- Safari může podle pravidel WebKit ITP odstranit skriptově zapisovatelná data po sedmi dnech používání Safari bez interakce s webem. Místní persistence nemůže být považována za garantovanou.
- Při umístění webové aplikace na plochu iOS mohou být data oddělená od Safari; nelze automaticky očekávat společný slovníček. Proto se nespoléháme na PWA jako jedinou ochranu.

## Postup pro studenty

1. Otevři v libovolné kartě **My Vocabulary**.
2. Po práci zvol **Stáhnout zálohu (.json)**, případně **Sdílet zálohu** (pokud jej zařízení podporuje).
3. Ulož JSON mimo prohlížeč: do aplikace Soubory, iCloud Drive, Google Drive, na USB nebo přenes přes AirDrop.
4. Po skutečném uložení souboru klikni **Potvrdit uložení zálohy mimo prohlížeč**. Toto potvrzení je jen místní upomínka, není důkazem existence souboru.
5. Na dalším zařízení otevři *jakoukoli studentskou kartu* → **My Vocabulary** → **Nahrát zálohu (.json)** → **Sloučit**. Režim **Nahradit** použij jen po ověřeném zálohování aktuálního stavu.
6. Máš-li slovíčka upravená na dvou zařízeních, proveď export a sloučení na obou; po importu znovu ulož výslednou zálohu. Bez serveru se změny nespojí samy.

## Kontroly

- Kontrola SHA-256 zjišťuje změnu od posledního *potvrzeného* exportu. Neodesílá data.
- Po sedmi dnech připomínáme vytvoření nové zálohy (nejde o automatickou zálohu ani pravidlo přístupu Safari).
- `navigator.storage.persisted()` / `persist()` používáme pouze jako indikátor či žádost, nikoli záruku ochrany.
- Existující hry, testování, importní formát, studentské karty a jejich otisky zůstávají beze změny.
- Citlivé údaje do slovníčku nevkládat. JSON soubor obsahuje slovíčka a poznámky v otevřené podobě.

## Apple: omezení, které bez serveru nelze obejít automaticky

- **Běžné Safari otevřené z učitelského QR kódu:** WebKit ITP může vymazat IndexedDB po sedmi dnech používání Safari bez kliknutí, klepnutí nebo psaní na tomto webu (ne po sedmi kalendářních dnech). Trvalé úložiště `navigator.storage.persist()` toto riziko jednoznačně neodstraňuje.
- **Samostatná webová aplikace přidaná na plochu:** výjimka z konkrétního sedmidenního ITP limitu, pokud se **opravdu otevře a používá v samostatném režimu**. Nejde však o univerzální ochranu před ztrátou dat.
- **Pozor na oddělené úložiště:** iOS odděluje IndexedDB Safari od samostatně instalované webové aplikace a často i mezi více ikonami téže aplikace. Je třeba exportovat JSON ze Safari a importovat jej v cílové aplikaci.
- **Učitelský QR kód:** po naskenování fotoaparátem se karta běžně otevře v prohlížeči, nikoli v již instalované webové aplikaci. Bez změny studentského workflow nelze výjimku pro Home Screen aplikace zaručit.
- **Nezaručovat nesmazatelnost:** plnou automatickou trvalost při přímém otevírání karet z QR při současných omezeních nelze zajistit.
