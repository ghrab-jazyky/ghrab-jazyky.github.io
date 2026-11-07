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
