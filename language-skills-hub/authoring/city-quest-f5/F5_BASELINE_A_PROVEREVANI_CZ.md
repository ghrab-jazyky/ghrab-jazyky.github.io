# City Quest F5 — inventura důkazů a počáteční verdikt

**Výchozí kód:** `73d2781ab51feaa95b2c5b014e24570b4d1f5d93` z F4R Draft PR #161. Dokumentační práce F5 běží pouze na samostatné větvi `feature/lsh-city-quest-f5-claude-review`. Jakýkoliv další nový commit musí být porovnán s tímto závazným baseline.

## 1. Co je prokazatelně hotové

- **11/11 relevantních City Quest GitHub Actions na přesném F4 SHA = SUCCESS**, bez neúspěchu; nesouvisející `LSH unlock Stage B checks` je legitimně `skipped`. F4 run #45025682912 obsahuje `f4-static-independent-and-matrix` i `f4-browser-independent-and-regression`, oba SUCCESS.
- Vygenerovaný samostatný `CITY_QUEST_F2_OFFLINE_PREVIEW.html` má **421 002 bytů**, SHA-256 `10e3037c7e37e86e5a5307033c9d9e22d1aa27723e48e96802ca0fe84ac2b062`. Z názvu F2 nevysuzovat rozsah: obsahuje F3/F4R implementaci.
- Samostatně provedená kontrola exportu potvrdila 1 inline `<script>`, 1 inline `<style>`, jejich skutečné SHA-256 odpovídají deklarovanému CSP; `default-src 'none'`, `connect-src 'none'`, žádné externí `<script/src>`, `<link/href>` a žádný výskyt volání `fetch`, `XMLHttpRequest`, `WebSocket`, `getUserMedia`, `localStorage` nebo `sessionStorage`. Tato syntaktická kontrola doplňuje — nenahrazuje — plné browser CI.
- F4 workflow uložilo artefakty: offline ZIP #14755871228 (SHA-256 `4d8272632406b2de7368946630afcf219023d9085cdad668768bbead695ba766`), ZIP 26 screenů #14755698403 (SHA-256 `2d02289a8e976697083a250d7586447ff1b5de9e293198afee0622a91cb111a8`).
- Existuje **256 unikátních kombinací** 192 City (EN/ES/DE/FR × A1–C2 × 01–08) a 64 Metro (EN/ES/DE/FR × B1–C2 × 05–08), každá zastoupena v `F4_256_variant_release_review_matrix.csv`.

## 2. Co NENÍ prokázané

- Všech **256/256** záznamů má **`PENDING` ve všech 4 lidských sloupcích**: jazyk, pedagogika, přístupnost, vlastník. `256/256 DOM/render PASS` je pouze funkční smoke-test, nikoliv 256 nezávislých kompletních jazykových průchodů.
- Neexistuje doložené testování na fyzickém iPhone Safari, iPad Safari Split View, Android Chrome, VoiceOver ani TalkBack; emulované WebKit / Chromium nebo CSS `fontSize=200%` nejsou jejich náhradou.
- Není doloženo nezávislé odborné ověření nativní idiomatičnosti a úrovňové přiměřenosti C1/C2; dokument F2.1E už označil riziko **PED-03** (modelový popis je na vyšších úrovních někdy obdobný jako B1, jen doplněný instrukcí).
- Textová simulace PA a opt-in signály **neobsahují skutečné namluvené poslechové hlášení**. Tato skutečnost není chyba, pokud F5 vydání zůstane výslovně bez poslechového audia.
- Finální vizuální přijetí a vydávací souhlas vlastníka zůstávají neudělené.

## 3. Riziko integrace vůči `main`

Z GitHub compare `main...73d2781` dne 22.11.2026: `status=diverged`, feature má **270 ahead**, `main` **100 behind** z pohledu feature; aktuální produkční `main` v okamžiku ověření `88b8a7c212faef3178ecc44539477c2f2d757f2b`. Většina City Quest souborů jsou na feature nově přidané; to samo nedokazuje bezpečný merge celé dlouho žijící historie.

Žádné automatické přejímání staré feature historie do `main`. Po Claude revizi připravit zvláštní integraci proti **novému přesnému** `main`, se soupisem **jen** zamýšlených souborů, dry-run konflikty a celorepozitářovými regresními testy ostatních aplikací, až poté samostatné explicitní GO.

## 4. Cíl F5

**F5A (nyní):** vytvořit nezávislé a reprodukovatelné podklady a review checklist. **F5B:** Claude kontrola s důkazy. **F5C:** reakce na nálezy, CI na novém přesném SHA. **F5D:** fyzická zařízení, linguistika a vlastnická přejímka. **F5E:** bezpečná integrace a samostatné schválení nasazení.

**Rozhodnutí:** `F4 TECH PASS / F5 PREPRODUCTION IN PROGRESS / PRODUCTION NO-GO`. Historické auditní soubory s „F4 NO-GO“ jsou stav v čase původního auditu, nikoliv důvod ignorovat pozdější zelené certifikace.
