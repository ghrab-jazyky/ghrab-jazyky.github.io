# Claude — audit Language Skills Hubu, organizační protokol

**29 původních témat, tři referenční vzory.** Technická registrace není jazyková ani pedagogická přejímka.

Auditní fronta: \`zkusebni/data/claude-audit-queue.json\`.

Příprava auditních zadání: \`node zkusebni/tools/card-intake.cjs --audit-export ./claude-packets\`.

Pořadí: reference AI / Asteroids / Matthew jako měřítko; potom skupiny Conversation po 5; čtyři další Reading společně; Harrison Ford a Peaky Blinders samostatná dvojice. Téma Škola nese již známou duplicitu ES A1.

Claude má:
- kontrolovat každou skutečně existující kombinaci jazyka a CEFR, ne jen EN B2;
- uvádět konkrétní P0/P1/P2 nalezené chyby a prokazatelné opravy bez mechanického zjednodušování;
- odlišit strojovou strukturu od gramatiky, idiomatičnosti, věkové vhodnosti a pedagogické účinnosti;
- u Reading zkontrolovat úplnost klíče a evidence jen pokud má klíč k dispozici v soukromém kontrolovaném kontextu;
- u Listening zkontrolovat střih/čas videa, shodu zadání a nahrávky, strukturu First / Second / Third Listening, věkovou vhodnost;
- zaznamenat neověřená zařízení a média místo nepravdivého PASS;
- vracet strojově čitelný JSON včetně \`topicId\`, \`sourceSha256\`, \`findings[]\` a \`requiresTeacherDecision:true\`.

Výsledky se ukládají nejprve **mimo veřejné repozitáře**; veřejná je jen bezpečná evidence stavu bez učitelských klíčů nebo identifikovatelných žáků. Claude Pro není samo o sobě automatické API propojení s GitHubem. Pro úplnou automatizaci je nutná samostatná a bezpečně schválená integrace; do té doby se jednotlivá zadání předávají Claude řízeně.

Přesun karet do ostrého katalogu se neděje při importu, dokončení Claudeovy kontroly ani při zeleném CI. Až učitel pedagogicky potvrdí konkrétní varianty a UAT, je možné zvážit vydání.

## Dávkový export a ověřování zpráv

`/zkusebni/revize-claude/` — zvolit laboratoř a automaticky připravenou dávku až 5 karet, stáhnout ZIP se student-only source HTML, individuálními prompty a SHA-256. Claude vrací JSON report `schemaVersion:1, reports:[...]`. Import nejprve ověřte bez zápisu:

```bash
node zkusebni/tools/claude-audit-import.cjs --report ./private/claude-reports.json
node zkusebni/tools/claude-audit-import.cjs --report ./private/claude-reports.json --apply
```

Do veřejného GitHubu se zapíší jen souhrnné počty P0/P1/P2 a kontrolní otisk zdroje. Celý report se ponechává v soukromém úložišti; ani dokončený audit není souhlasem s publikací.

## Auditní ZIPy přímo z GitHub Actions (bez čekání na Pages)

Workflow `.github/workflows/lsh-claude-audit-packages.yml` automaticky vytváří **tolik ZIP balíčků, kolik právě vyžaduje auditní fronta** (maximálně pět karet na dávku; aktuálně sedm dávek pro 29 témat) s originálními studentskými HTML, individuálními SHA-256 prompty a bezpečným reportovým JSON vzorem. Najdete je jako artefakt `lsh-claude-source-batches` (historické běhy R5M mají původní název `lsh-claude-seven-batches`) u příslušného běhu GitHub Actions. Archiv se uchovává 30 dní. Po vypršení lze workflow znovu spustit z oprávněného GitHub účtu, až bude dostupný ve výchozí větvi.
