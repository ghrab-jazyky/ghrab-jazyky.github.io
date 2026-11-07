# R5G — dvě zbývající Listening karty připojeny do technického pilotu
**Datum:** 7. 11. 2026 · **PR:** #27, **DRAFT** · **Hosting:** veřejný školní GitHub Pages pod `/zkusebni/`, nikoliv produkční vydání.

## Změny

Obě dosud existující studentské poslechové karty jsou **zdrojově zachovány** a mají nové samostatné integrační kopie s `?lang=en&level=A1..C2&zamek=1&practice=1` a volnou procvičovací variantou. Použit je stejný nebezpečnostně nepředstíraný UI lock jako u referenčního Matthew.

| Poslech | Původní veřejné HTML (Git blob) | Nová technická integrační kopie |
|---|---|---|
| Harrison Ford — Life Achievement Speech v6 | `f816dbbbc2d9d2e7fc5b7a4c40d9e7dcfb331dbc` | `integrace/poslech/harrison-ford/` |
| Peaky Blinders — No Fighting v2 | `cfda1197882b8107ddce2f80665abd681526efc5` | `integrace/poslech/peaky-blinders/` |

Pro každé téma je doloženo **EN A1–C2**, celkem šest dostupných úrovní. Z katalogu je možné vytvořit volný/pevný odkaz, identický QR a stáhnout samostatné HTML se zachovaným nastavením (externí video není přibaleno). HTML zdroje nejsou změněny v žádné původní cestě ani ve studentských datech. Obě nová HTML obsahují přesně jednu R5 integrační vrstvu.

## Co tato etapa NENÍ

**Není to pedagogické sjednocení s referencí Matthew McConaughey v3.** Starší poslechy mají jinou strukturu úloh; pro skutečné dokončení se musí zvlášť posoudit a případně přestavět podle Before Listening → First Listening → Second Listening → Third Listening (Written Evidence + Reconstruction) → Optional Language → After Listening. Pořadí a množství úloh nelze mechanicky převzít. Písemné odpovědi hodnotí učitel, krátké samostatné testové verze dosud neexistují.

**Externí audio/video stále potřebuje internet.** Není doloženo fyzické ověření přehrání na školní Wi-Fi, přesného časování nebo kompatibility mobilního Safari. Harrison Ford může mít omezení konkrétního hostitele videa. Peaky Blinders vyžaduje **učitelské posouzení věkové vhodnosti**, případných vulgarismů, násilí a drogových narážek. Pilot tuto skutečnost přímo uvádí v katalogovém popisu; nejde o souhlas s použitím pro mladší studenty.

## Kontrola

- Nový `tests/reference-integrity.cjs` kontroluje u obou poslechů původní Git blob, přesně jediný přidaný integrační skript, shodu originálu po odnětí skriptu, syntaxi JavaScriptu, pouze anglický jazyk a varování o externím médiu.
- Pilot má nyní **24 z 29 existujících témat**: 3 reference, 19 strukturálně auditovaných původních konverzací a 2 URL-integrované poslechy.
- Zbývá **5 témat k technickému dopracování**: Conversation „Škola“ (konkrétní duplicita ES A1), a 4 Reading (Can Mistakes, Plastic Ocean, Email to a Friend, Instant Messages).
- Dále u všech trvá nezávislá jazyková/CEFR přejímka, fyzické UAT, úplný offline export pro původní konverzační HTML a samostatné, obsahově odlišné a schválené testové sady.

**Závěr:** technické připojení do pilotního katalogu dokončeno, **pedagogické sjednocení obou poslechů nedokončeno**. Do `main` zatím nevydávat.
