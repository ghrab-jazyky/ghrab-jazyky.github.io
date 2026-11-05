# E4D — Can Mistakes Help Us Learn? v4.3: nezávislý technický audit a pedagogické brány

**Datum:** 2026-11-05. **Stav:** DRAFT / NO-MERGE / NO-DEPLOY.  
**Podklad:** soukromý uživatelský ZIP `Reading_Lab_Can_Mistakes_Help_Us_Learn_COMPLETE_v4_3_ALL_LANGUAGES.zip`.  
**SHA-256 původní studentské HTML:** `1e15ca8bd4625d1efc271684de6324cc4ff353269749cacf4a5a68abcd24c8e3`.  
**Učitelský klíč ani původní studentské HTML nebyly zveřejněny.**

## Ověřeno přímo z původního HTML
- Plná matice **24/24** variant (EN/ES/DE/FR × A1–C2).
- **360/360** úloh s požadovanými počty záložek **3/3/4/6/7/7** (po 3 úlohách); unikátní ID.
- **462** důkazních úryvků a **62** úloh s cílovými výrazy (celkem **64** cílových výskytů).
- Nulový počet kritických strukturálních chyb z datového auditu. Doložená shoda učitelského klíče s indexy odpovědí **360/360** je *technická*, nikoli nezávislé pedagogické posouzení správnosti.
- Nové varování: **fr:C1, záložka Gist, monotónně rostoucí pořadí pozic správných možností**. Nejde doslova o zakázaný vzor A–B–C (protože začíná jinde); je však vhodné jej pedagogicky posoudit jako potenciální vodítko pro hádání. Bez zveřejnění konkrétních odpovědí.

## Nová navigace podle master promptu Reading Lab v3.4
- Pracovní kopie `Can Mistakes v4.3` a `Plastic Ocean v2` byly pouze soukromě obohaceny o **stejný** inline modul nav v2.2.
- Původní studentské HTML, data úloh, učitelský klíč a datový model osobního slovníčku zůstaly beze změny.
- **48/48** reálně zobrazených kombinací tématu/jazyka/úrovně prošlo Chromium DOM kontrolou: vizuální čísla odstavců, 3 úlohy aktivní záložky, zpětné tlačítko po zobrazení důkazu.
- V samostatných prohlížečových scénářích ověřen návrat přes tlačítko i zvýrazněnou pasáž, přepnutí jiné záložky a návrat, Esc, přepnutí jazyka/úrovně, priorita zapnutého slovníku a fokus.
- Pro PR #9 je nově připraven **zdrojový gate `reading-nav-integrity.cjs`**, který vyžaduje byte-for-byte shodu s původní kartou plus dvě přesně definované inline přílohy (CSS a JS). Selže při jakékoli nechtěné změně úloh, textů, odpovědí nebo původního slovníčku. Tento gate není důkazem pedagogické správnosti.
- Testy na skutečném fyzickém iPhonu, iPadu a Androidu **neproběhly**. Sandbox blokuje navigaci na lokální a testovací HTTPS origin; persistence IndexedDB mezi dvěma kartami se proto nyní nezopakovala (původní validační protokol o ní svědčí, ale není to nová nezávislá kontrola).

## Jaký je stav pedagogického schválení?
**NEUDĚLENO**. Přiložený VALIDATION v4.3 uvádí testování s textem jen pro B2–C2 a pro C1/C2 starý blind test se všemi úlohami naráz. Aktuální master v3.4 požaduje:
- **s textem:** nový nezávislý posuzovatel bez klíče pro *všech 24 variant* A1–C2, včetně opakování po opravách;
- **bez textu:** izolovaný test jediné záložky C1/C2, každý posuzovatel maximálně jednu záložku z každé úrovně;
- závazný cíl cca **≤ 50 %** pro Scanning, Matching a Close Reading; pro ostatní typy uvést měření, nikoli násilně snižovat odhadnutelnost;
- další ověření 100% pokrytí slovníčku a skutečné mobilní QA.

**Pro tuto revizi vzniklo pouze v soukromém pracovním prostředí:**
- 56 izolovaných blind packetů C1/C2 (4 jazyky × 2 úrovně × 7 záložek; 168 otázek, bez textu a klíče);
- 24 packetů s textem pro A1–C2 (360 otázek, bez klíče, gapped sentence skryta);
- dvě prázdné CSV šablony odpovědí a lokální scorer proti původní studentské HTML.
**Žádný z těchto packetů nebyl nezávislým posuzovatelem dosud vyřešen.** Nemůže tedy existovat ani tvrzení o splnění blind testů či pedagogickém PASS.

## Co ještě brání uvolnění karty?
1. Předat a pedagogicky schválit výsledky testů všech úrovní / izolovaných záložek, zapracovat opravy bez zničení dříve ověřené jednoznačnosti.
2. Převést původní v4.3 na **novou verzovanou kartu**, aktualizovat odpovídající README a VALIDATION a učitelský klíč vždy generovat z finálních dat. Není přijatelná podvržená nová verze bez aktualizace verzového klíče `sessionStorage`.
3. Nezávisle dokončit browser/device QA včetně reálných iOS/Android, offline a sdílené IndexedDB.
4. Až poté po výslovném schválení Can Mistakes přejít na Plastic Ocean a později chráněný učitelský katalog.

**Rozhodnutí: DRAFT technická implementace GO pro pokračující testování, ostré vydání NO-GO.**
