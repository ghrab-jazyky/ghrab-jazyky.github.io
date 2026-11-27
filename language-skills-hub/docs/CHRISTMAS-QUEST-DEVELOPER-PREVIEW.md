# Christmas Quest 0.8.1 v Language Skills Hub

Karta Christmas Quest v Conversation Lab nabízí pět destinací (IS, MX, ES, PH, CO), čtyři jazyky (EN, ES, DE, FR) a šest úrovní (A1–C2). S City Quest používá označení „Interaktivní hra“. Katalog zachovává parametry `lang`, `level`, `zamek` a `practice`. Sdílení se studenty a QR jsou vypnuté i ve vývojářském režimu.

## Vývojářský režim

Karta používá stávající vývojářský příznak testů Reading a Listening Lab ve stejném profilu prohlížeče a na stejném originu. Neaktivovaný profil zobrazí oznámení v katalogu i při přímém otevření hry. Zámek je klientská UI blokace. Zdrojový kód zůstává dostupný ve veřejném repozitáři. Pro lokální HTTP platí stejná výjimka pro localhost a 127.0.0.1 jako v Reading a Listening Lab.

Herní skript je ve výchozím stavu inertní. CSP povoluje přesné hashe původního skriptu a blokace. Při odebrání výjimky v jiné záložce nebo obnovení ze stránky v historii se stav znovu ověří. Postup zůstává uložený.

## Ověření vydání

Publikační allowlist pro Christmas Quest obsahuje jedinou cestu `language-skills-hub/konverzace/christmas-quest/index.html`. SHA-256 tohoto HTML je `efb43df3583bf3a920c5d3ec27b36ee7d7e9840f0a1fb4a0d864ecbe3e5283d0`. Původní neuzamčené HTML a podklady rollbacku patří mimo repozitář.

Omezené vydání vyžaduje ověřený changelog „Co je nového“ s potvrzeným datem, kontrolu migrace a rollbacku, prohlížečové regrese a nezávislou revizi konkrétního commitu. Publikaci z `main` provádí výhradně ruční workflow `lsh-pages-approved-publish.yml` po schválení přesného SHA vlastníkem. Studentský pilot do této etapy nepatří.

## Rollback

Integraci stáhněte cíleným novým commitem. Ponechte klíče `lsh.cq.progress.v1`, `lsh.cq.progress.v2` a jejich zálohy. Verze 0.7.4 může měnit v1. Verze 0.8.1 po návratu použije v2 a případné mezitím provedené změny v1 automaticky nesloučí. Při odvolání záznamu v učitelském changelogu zachovejte dosavadní historii a monotónní sekvenci oznámení. Sdílený příznak zámku a aktivaci ponechte, dokud je používá alespoň jedna část LSH.
