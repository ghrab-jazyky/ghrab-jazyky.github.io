# Language Skills Hub — přidání nové karty (INTAKE_V1)

**Architektura:** školní GitHub \`ghrab-jazyky/ghrab-jazyky.github.io\`; pouze veřejné STUDENTSKÉ HTML; vždy nejprve DRAFT a pedagogická kontrola. Žádné učitelské klíče ani osobní údaje žáků.

## Proč se nenahrává přímo na GitHub Pages
GitHub Pages je veřejný statický web bez bezpečného serverového zápisu. Do stránky nepřidávejte tokeny GitHub, hesla ani tajný upload endpoint. Publikaci do školního repozitáře provádí oprávněný učitel přes GitHub (nebo asistent s již připojeným a oprávněným konektorem). To umožňuje zpětné vrácení změny, kontrolu CI a schvalování.

## Základní postup bez editace katalogových souborů
1. Připravte nové **studentské** \`.html\` (bez učitelského klíče), název, konkrétní obsahovou anotaci, typ dovednosti a verzi.
2. V jedné místní složce uložte HTML i \`cards.json\` dle schématu níže. \`sourceFile\` je název HTML v této složce.
3. Na kopii školního repozitáře spusťte \`node zkusebni/tools/card-intake.cjs --batch ./incoming/cards.json\` (nejprve **dry-run**).
4. Pokud validace projde, spusťte stejný příkaz s \`--apply\`. Je možné přidat až **12 nových karet najednou**.
5. Vznikne bezpečně oddělená originální kopie, URL/QR integrační HTML nebo CLB asset cesta, zápis do \`data/reference-pilots.json\`, záznam v \`data/unification-tracker.json\` a v \`data/claude-audit-queue.json\`. Není potřeba ručně opravovat seznam karet.
6. Odešlete změny do **DRAFT PR**. GitHub Actions provede integritu všech referencí, nové karty i kontrolu auditní fronty. Až po skutečné UAT a schválení pedagogického obsahu lze rozhodnout o běžném vydání.

### Ukázka \`cards.json\`
\`\`\`json
{
  "schemaVersion": 1,
  "cards": [
    {
      "id": "cl-human-rights",
      "skill": "konverzace",
      "title": "Human Rights",
      "summary": "Studenti diskutují o základních právech, svobodě projevu, diskriminaci a odpovědnosti v každodenních situacích.",
      "focus": "Argumentace · příklady · kritické myšlení",
      "version": "v1",
      "sourceFile": "human-rights.html",
      "defaultLevel": "B2"
    }
  ]
}
\`\`\`

\`cl\` = konverzace, \`rl\` = čtení, \`ll\` = poslech. ID používá pouze malá ASCII písmena, číslice a pomlčky. Nové téma *Human Rights* zatím není ve výchozím inventáři publikováno; uvedená cesta je pouze **příklad**, bez odpovídajícího studentského HTML jej importer nevytvoří.

### Co importer ověřuje
- Jestli se ID neopakuje, zda jsou vstupy konzistentní a zda HTML obsahuje deklarované úrovně (EN/ES/DE/FR × A1–C2 pro Conversation a Reading; EN × A1–C2 pro Listening).
- Základní datové schéma podle konkrétní laboratoře: Conversation osm stanovišť, Reading strukturované úlohy, Listening šest CEFR úrovní.
- Zda karta odpovídá jedné z podporovaných runtime šablon. Nepodporovanou nebo neúplnou kartu **odmítne**, nebude falešně tvrdit funkční QR.
- Zachová originál; integrační vrstva se přidává pouze do **oddělené kopie**.
- Zjevné soukromé klíče a učitelské klíče blokuje. Automatické skenování není náhradou za ruční kontrolu soukromí.

### Co automatická validace NEUMÍ
- Zhodnotit skutečnou jazykovou úroveň, autentičnost obsahu, vhodnost videa nebo správné odpovědi. Vyžaduje to nezávislou obsahovou revizi a rozhodnutí učitele; Claude je jen volitelný pomocník, nikoli podmínka pokračování.
- Ověřit nativní Safari/iOS/iPadOS, školní Wi-Fi a skutečně funkční offline IndexedDB. Je nutná fyzická UAT.
- Vytvořit samostatně schválenou testovací sadu. \`Testování\` zůstává do schválení vypnuté.
- Poskytovat přímé nahrání HTML na Pages bez autentizovaného backendu.

## Zabezpečení hromadného importu (R8, 8. 11. 2026)

Příkaz `--apply` je určen pro **pracovní kopii repozitáře ve vývojové větvi**. Před každým zápisem znovu zkontroluje celkovou konzistenci existujícího katalogu a založí lokální zámek `data/.card-intake.lock`, aby se nepotkaly dvě současné instance importeru.

- Vytvářené HTML se zapisuje v režimu **exclusive create**. Existující soubor se nepřepíše; originály karet zůstávají zachované.
- Původní tři evidence (`reference-pilots.json`, `unification-tracker.json`, `claude-audit-queue.json`) se před zápisem uchovají v byte-identických kopiích v paměti; nové evidence se nejprve připraví do dočasného souboru a poté atomicky přejmenují.
- Pokud během importu nastane zachycená chyba, obnoví se dokončené zápisy evidencí a odstraní se pouze soubory vytvořené danou instancí. Jde o **best-effort rollback při výjimce**; přerušení napájení nebo násilné ukončení procesu uprostřed více zápisů nemůže běžný filesystem garantovat jako jednu databázovou transakci. Před commitem je proto povinný `--verify`.
- CI umí záměrně vyvolat chybu po prvním HTML a po první evidenci, porovnat všechny tři evidence byte-for-byte, zkontrolovat nepřítomnost částečných souborů a poté dokončit skutečný tříkartový smoke import.

**Platí nadále:** importer nic neposílá na veřejné Pages, neaktivuje `Testování`, nepovažuje technický PASS za pedagogické schválení a nepřijímá učitelské klíče.

## Claude — export fronty pro nezávislé kontroly
\`\`\`bash
node zkusebni/tools/card-intake.cjs --audit-export ./claude-packets
\`\`\`
Vznikne \`INDEX.md\` a jednotlivá zadání \`cl-*.md\`, \`rl-*.md\`, \`ll-*.md\`. Claude pracuje v sériích po cca pěti kartách, u každé uvádí konkrétní nálezy pro jazyk/CEFR/stanoviště/úlohu. Výstup musí být navázán na SHA-256 revidovaného source HTML. Karta získá status „zkontrolováno“ teprve po importu a ověření zprávy; samotné spuštění Claude není automatické. Učitelovo pedagogické schválení je další samostatná brána.

## Doporučený uživatelský postup v ChatGPT
Přiložit nové studentské HTML a sdělit dovednost, název, konkrétní anotaci a verzi. Asistent přes oprávněný konektor nebo připravený intake balíček provede validaci a zápis do DRAFT PR. **Není nutné opakovaně zadávat, jak ručně doplnit seznam 29 karet.**

## Webové rozhraní příjmu

`/zkusebni/pridat-kartu/` — přetažení až 12 studentských HTML, doplnění metadata, stažení místně vygenerovaného ZIP. ZIP lze vložit do ChatGPT pro přidání přes oprávněný GitHub konektor; statická stránka **nikdy sama nepublikuje**. Node importer použije uvnitř ZIP obsažené `cards.json` a zdroje.

## Offline ZIP pro dvacet starších konverzačních karet (R5N)

U všech 20 starších Conversation Lab karet byl potvrzen stejný seznam pěti závislostí. Pilot nabízí kompletní ZIP: `konverzace/<slug>/index.html` a soubory `assets/lsh/v2/lock.js`, `assets/lsh/v3/card-bridge.css`, `assets/lsh/v3/model.js`, `assets/lsh/v3/store.js`, `assets/lsh/v3/card-bridge.js` plus návod. Při exportu se nejprve ověří CSP SHA-256 původního inline skriptu. Pevná varianta a zámek se upraví jen v offline kopii s novým CSP hashem. Původní HTML a Git blob zůstávají nedotčené. Ukládání slovníčku při `file://` může být na některých zařízeních omezené; fyzická UAT je samostatná.
