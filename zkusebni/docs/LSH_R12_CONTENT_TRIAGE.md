# Language Skills Hub – R12: obsahová triáž před pedagogickou přejímkou

**Stav: technický audit, žádné automatické schválení.** PR #27 zůstává DRAFT, větev main ani původní studentské karty se nemění.

## Co R12 doplňuje do jednotného R11 kontrolního balíku

- Soubor triage.html: přehled konkrétních změn a redakčních signálů s odkazy na přesnou studentskou variantu.
- R12_CONTENT_TRIAGE.json: verzovaný a kontrolovatelný záznam výsledků algoritmického auditu (bez učitelských klíčů).
- Přímý odkaz na obsahovou triáž v kontrolním index.html.
- Žádné zveřejnění, žádná změna zdrojového pedagogického obsahu.

### Ověřené strojové invarianty

- 29 původně evidovaných témat a 642 kombinací jazyk–CEFR.
- 120 čtecích variant se strojově ověřenými identifikátory úloh a existencí citovaných důkazů.
- 80 úloh na doplnění věty: správná možnost přesně odpovídá definované chybějící větě na začátku příslušného odstavce. Původní UI větu před kontrolou odpovědí skryje.
- Kontrolní otisky SHA-256 každé původní karty, žádná neautorizovaná změna studentských HTML.

Tyto kontroly **neprokazují**, že odpovědi pedagogicky dávají smysl nebo že jsou všechny výrazy na deklarované CEFR úrovni.

### Fronta odborných rozhodnutí

| Zdroje | Počet | Co je nutné udělat |
|---|---:|---|
| Conversation R8 | 7 + 5 | Potvrdit cílené A1 úpravy a dalších pět jazykových změn ve stanovištích |
| Reading R7 | 16 + 1 | Prověřit změněné matching otázky a vysvětlení, poté synchronizovat SOUKROMÉ učitelské klíče |
| Listening R7 | 1 | Posoudit opravenou C1 otázku v Peaky Blinders proti skutečnému audio/video zdroji |
| Listening – všechna témata | 3 | Ověřit přehrávání ve škole, přístupnost a vhodnost věkové skupiny |

### Redakční podněty (nikoli chyby pro automatickou opravu)

- Kratší texty Reading: interní heuristika méně než 13 slov textu na otázku. Nejde o oficiální normu CEFR a sama o sobě neznamená nevyhovující materiál.
- Identické jednoduché otázky ve více tématech Conversation, převážně A1. Mohou být účelným jazykovým opakováním; potřebují pouze kontrolu tematické relevance.
- Záměrně se neslučují distraktory v Instant Messages C2, které se liší interpunkcí a jsou součástí cílové jazykové úlohy.

## Workflow a bezpečnost

Nástroj zkusebni/tools/r12-content-triage.cjs běží **až po sestavení R10 a R11** ve stejném izolovaném adresáři na GitHub Actions. Jeho jediným výstupem je statický přehled a JSON. Před vytvořením reportu kontroluje originální otisky všech 29 karet.

Výstup R12 se testuje v Chromium i WebKit s blokovanou sítí. Strojová chyba zastaví workflow; pouze manuální učitelská přejímka může označit pedagogický obsah jako schválený. Automatická čísla ani status „Posouzeno bez nálezu“ z matice R11 nesmějí odemknout Testování, zveřejnit klíče nebo spojit PR do main.

## Co zbývá před vydáním

Odborně přejít uvedené konkrétní změny i celou požadovanou 642-variantní matici; aktualizovat soukromé Reading klíče; ověřit externí poslechová média a věkovou vhodnost; dokončit fyzickou UAT na Androidu, iPhonu/iPadu a ve školní síti. Publikace testového režimu je zvláštní projekt s hodnoticími pravidly.
