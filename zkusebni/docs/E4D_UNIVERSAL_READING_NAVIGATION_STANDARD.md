# E4D — ZÁVAZNÝ standard pro VŠECHNY Reading Lab karty

**Datum:** 2026-11-05. **Schválil zadavatel:** Číslování odstavců a obousměrnou navigaci zavést ve **všech** stávajících i budoucích Reading Lab kartách.
**Master prompt:** Reading Lab v3.4, §7, §8 body 8 a 14, §12B, §13.
**Status implementace:** DRAFT, NO-MERGE, NO-DEPLOY. Tohle je závazná specifikace, nikoli schválení studentského obsahu.

## Jednotná funkčnost (24 variant na kartu)

### 1. Vizuální čísla odstavců
- Každý skutečný studentský odstavec v levém panelu: `data-num="1"`, `"2"`… podle pořadí.
- Číslo vykreslit **výhradně** přes CSS `p[data-num]::before { content: attr(data-num) }`, nikoliv vložením znaků do `textContent` odstavce.
- Zachovat evidence anchors, cílové výrazy, slovník, gapped sentence, přepočet slov; skrytá věta nesmí měnit čísla odstavců.
- Funguje EN/ES/DE/FR, A1–C2, dark/light, tisk, mobil a 200% zoom, bez horizontálního přetékání.

### 2. Obousměrná navigace text ↔ otázka
- Po `Show in text / Ukázat v textu` **nebo** `Show supporting evidence / Zobrazit důkaz` se zobrazí plovoucí tlačítko `Back to question N / 3`, lokalizované pro EN/ES/DE/FR.
- Po kliknutí na tlačítko nebo na skutečně zvýrazněnou pasáž: vrať původní záložku, posuň pravý panel/stránku na přesnou otázku, krátce ji zvýrazni a nastav fokus.
- Kliknutí na pasáž **nesmí** vracet, pokud je slovník ON; slovník má prioritu.
- Esc, změna jazyka nebo úrovně a reset návratový kontext skryjí.
- Tlačítko je skryté při tisku, respektuje `prefers-reduced-motion`; funguje i klávesnicí.

### 3. Architektura a ochrana
- Jeden sdílený modul určený ke vložení **přímo do samostatného HTML** každé Reading Lab karty, bez CDN, vzdálených skriptů a nového serveru.
- Original HTML soubory nechat nedotčené; generovat novou jasně verzovanou studentskou kartu a provést vlastní regresi.
- Nepřepisovat `reading-lab-vocabulary` ani `reading-lab-vocabulary-backup`, nepřevádět na E4A `lsh-test`; neměnit `topicId`, data úloh, odpovědi a učitelské klíče.
- Implementační vzor v promptu: `patch_nav.py v2.2` z Asteroids. Tento originální soubor dosud nebyl k dispozici pro porovnání. Nově vytvořený společný modul je **kandidát odpovídající kontraktu v2.2**, nikoli prokazatelně totožná kopie existujícího modulu.

## Opravdu vykonané testy (jen modulu, bez pedagogické certifikace)
Místní pracovní kopie dvou dodaných studentských HTML:
- `Can Mistakes Help Us Learn? v4.3` – SHA256 originálu `1e15ca8bd4625d1efc271684de6324cc4ff353269749cacf4a5a68abcd24c8e3`.
- `Plastic Ocean v2` – SHA256 originálu `6a87e08fad4f1fb8e6689fc5a95d811127f26097cf289f679ea17b7d5979be78`.
- `24/24` jazykově-úrovňových variant u obou témat, celkem **48/48**: vizuální číslování odpovídá počtu odstavců; v aktivní záložce jsou 3 otázky; po Check/Show evidence vzniká návratový kontext; tlačítko vede zpět.
- Scénáře desktop 1440 px a mobil 390 px na Chromiu: zpět tlačítkem a kliknutím na pasáž, změna záložky a návrat, Esc, slovník ON bez nežádoucího návratu, změna jazyka/úrovně, lokalizace.
- Původní data, slovník, HTML a učitelský klíč **nebyly měněny**; do GitHubu **nebyly nahrány** ani nové testovací studentské HTML.
- **NEOVĚŘENO:** fyzické iOS/Android/iPad, Safari/WebKit, otevření `file://` (prostředí jej blokuje), dlouhodobé uložení, skutečné hodnocení 360 úloh proti klíči a nezávislé pedagogické testy v3.4.

## Povinný rollout pro celý Reading Lab
1. Can Mistakes v4.3 — nový verzovaný kandidát s modulem; úplná regresní QA a pedagogické schválení.
2. Plastic Ocean v2 — stejný modul, samostatné QA v3.4, až po schválení reference.
3. Asteroids v2.2 — doložit původní `patch_nav.py` / HTML a ověřit stejné chování; nepředpokládat automaticky splnění.
4. Instant Messages a Email from a Friend — po zpřístupnění HTML znovu použít přesně stejný modul.
5. **Každá nová karta** — podmínka přijetí před dodáním, včetně 24/24 variant.

## GO / NO-GO
**GO:** univerzální module QA, revize specifikace, privátní testovací kopie a další audit.
**NO-GO:** prohlásit karty v3.4-ready, nahrávat učitelské klíče, nasadit studentský katalog nebo slučovat do `main` bez úplné QA a schválení.

**Poznámka k datům:** 48/48 výsledků ověřuje jen navigační funkčnost a číslování při skutečném renderování v Chromiu, nikoli správnost jednotlivých pedagogických otázek.
