# LSH R62–R63: bezpečnostní dohled nad lokálními testy Reading / Listening

## Rozsah

Pouze časované studentské testy **Reading Lab** a **Listening Lab**, otevřené prostřednictvím učitelského odkazu obsahujícího parametr `timer`. Procvičovací karty, Conversation Lab a učitelské nastavovací stránky nejsou měněny.

Test není serverově zabezpečenou zkouškou, nepoužívá přihlášení a neukládá výsledky na školní server. Zámek, čas a incidenty běží na zařízení studenta; jakýkoli lokální protokol lze technicky změnit.

## Chování

- Přepnutí do jiné aplikace, skrytí záložky, opuštění skutečného fullscreenu, vybrané změny rozměrů, ztráta fokusu, interakce se schránkou a neautorizovaný refresh spustí přerušení.
- **R63:** `beforeprint` nebo zachycená klávesová zkratka `Ctrl/Cmd+P` uzamknou test s důvodem „pokus o tisk“. Styly studentského testu navíc při tisku skrývají celý obsah.
- **R63:** Na stejném originu a ve stejném profilu prohlížeče se aktivní testy oznamují pomocí `BroadcastChannel`. Při souběžném otevření jiného aktivního testu (může jít o Reading i Listening) se nový pokus zamkne. Zprávy obsahují pouze náhodné ID otevřené stránky, nikoli obsah testu, odpovědi, studentovo jméno ani identifikátor pokusu.
- Pokud `BroadcastChannel` chybí či je blokován, kontrola souběhu není zaručena; na obrazovce je upozornění. Různé profily, anonymní okna a různá zařízení nelze tímto způsobem spojit.
- Po zamčení je úprava odpovědí zablokována, ale odpočítávání pokračuje. Odemknout může jen učitel servisním postupem, který se sděluje učitelům zvlášť. Studentský zámek nezobrazuje žádný návod, šipky, indikátory ani tlačítko odemčení.
- Každý zachycený incident se lokálně uloží s časem; R63 nově uchovává i **časy odemčení** (maximálně 40 událostí každého druhu). Starší uložené pokusy bez této položky zůstávají čitelné.

## Archivace

**Kompletní PDF pro učitele** a jeho textová kopie obsahují vedle všech úloh, odpovědí a správných řešení i oddíl **Bezpečnostní protokol testu**. Protokol uvádí čas od zahájení, čas z lokálních hodin zařízení, druh incidentu a okamžik odemčení. Upozorňuje na to, že jde o lokální neověřené údaje.

CSV zůstává kompatibilní s původním schématem a nadále vykazuje počet přerušení, nikoli detailní události. Není automaticky odesílán žádný osobní údaj ani výsledek.

## Důležité limity

1. U starších studentských URL **bez `timer` se bezpečnostní dohled neaktivuje**. Nejde o zabezpečené zkušební odkazy. Učitel musí sdílet nově vytvořený časovaný test přímo z panelu TEST.
2. Parametry URL, lokální čas, lokální úložiště a výsledky jsou měnitelné uživatelem. Veřejná řešení zůstávají v klientských datech.
3. Snímky obrazovky, fotografie, použití druhého zařízení, jiného prohlížeče, systémový Slide Over a některé varianty Split View nelze spolehlivě odhalit běžnou webovou stránkou.
4. Detekce změny okna může chybně vyhodnotit legitimní systémovou událost. Incident není důkazem podvádění; o pedagogickém postupu rozhoduje učitel.
5. Učitelský servisní postup pro odemčení **není autentizace**. Pro vysokostakes školní písemky je nutná správní konfigurace zařízení / testový prohlížeč a samostatné řešení autenticity výsledků.

## Přejímací scénáře

- R30: obnovit rozpracovaný test, uchovat odpovědi a běžící čas, ověřit nutnost odemčení.
- R62: reagovat na `visibilitychange`, schránku, fullscreen a zobrazení správného důvodu zámku bez viditelných odemykacích značek.
- R63: otevřít druhý aktivní test v témže prohlížeči a ověřit zamknutí; po zavření první záložky musí učitel odemknout druhou.
- R63: při běžícím testu zavolat `beforeprint`, ověřit zámek a prázdný tiskový náhled; po dokončení stáhnout úplný PDF a ověřit část s časovou osou.
- R34: zachovat všechny úlohy, odpovědi, správná řešení, školní logo a import do PDF.
- Ruční: reálné iPadOS Safari (Split View, Slide Over, rotace, softwarová klávesnice), Android Chrome, Windows Chrome / Edge. CI WebKit není náhradou fyzického iPadu.

## Publikace

R62–R63 lze publikovat pouze po úspěšných CI testech a kontrole dostupnosti na živé adrese. Není dovoleno deklarovat absolutní zabezpečení nebo „nezfalšovatelný výsledek“.
