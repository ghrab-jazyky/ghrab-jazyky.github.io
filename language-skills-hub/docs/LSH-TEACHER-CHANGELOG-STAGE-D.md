# Language Skills Hub – Etapa D: předprodukční integrace katalogu změn

**Datum:** 16. 11. 2026  
**Zdrojová větev:** `feat/lsh-teacher-changelog-stage-d-20261116`  
**Výchozí produkční commit:** `e176e95f20cee9d04db550202aa8538d08a1d7ce`  
**Produkce:** `main` bez změn.

## Co je integrováno

- Vizuální dialog a chronologický katalog změn přenesený z etapy C do reálného `language-skills-hub/index.html`.
- Přátelská komunikace autorským hlasem: „Připravil jsem krátký přehled toho, co je v LSH nového a jak ti to může usnadnit výuku.“
- Stálé tlačítko **Co je nového** v navigaci učitele.
- Oddělený datový soubor `data/teacher-changelog.json` a striktní JSON schema.
- Validace JSON na straně prohlížeče, bezpečné vykreslování pomocí `textContent` a kontrola oznámené sekvence.
- Záznam poslední vyřízené nabídky v `localStorage` pod klíčem `lsh:teacher-whats-new:last-offered-sequence:v1`.
- Dialog se otevře jen tehdy, pokud existuje nové schválené vydání, není již vyřízené a uživatel vstupuje na hlavní URL.
- Ano otevře katalog; Ne, křížek a Esc přejdou do výběru laboratoří.
- Při ručním otevření z laboratoře návrat z katalogu zachová aktuální laboratoř.
- Chyby připojení a invalidní data neblokují výběr laboratoří; první načtení čeká nejdéle 650 ms po ukončení úvodní sekvence.

## Co není součástí

- Žádné nové ani historické novinky bez ověření nasazení. Výchozí `releases: []` a `latestAnnouncementSequence: 0`.
- Žádné zásahy do student-facing procvičování, testové logiky, klíčů, výsledků, QR odkazů nebo hodnocení.
- Žádný backend, studentské účty či telemetrie.
- Žádné nasazení do `main`.

## Nové soubory

- `assets/whats-new.css`
- `assets/whats-new-view.js`
- `assets/whats-new-data.js`
- `assets/whats-new-app.js`
- `data/teacher-changelog.json`
- `data/teacher-changelog.schema.json`
- `tests/teacher-changelog-integration.test.cjs`
- `tests/teacher-changelog-integration.browser.test.cjs`
- `.github/workflows/lsh-teacher-changelog-stage-d.yml`

## Přejímka a další etapa

Etapa E: nezávisle ověřit běhy CI, přímé odkazy, funkčnost všech laboratoří, regrese testů, chování na mobilech/iPadech, offline stav, kompatibilitu CSS a kontrolu veřejného obsahu. Výslovně ověřit, že pravidelný automatický live-smoke produkce zůstává PASS. Produkční nasazení povolí až majitel projektu.
