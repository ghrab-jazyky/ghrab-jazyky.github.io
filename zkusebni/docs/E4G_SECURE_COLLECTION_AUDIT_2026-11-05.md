# E4G – Uzávěrka a integrita soukromých výsledků Reading Lab

**Datum:** 5. listopadu 2026. **Stav:** DRAFT / NO-MERGE / NO-DEPLOY.  
**Návaznost:** E4F / PR #11, původní soukromý balíček Can Mistakes v4.3, master Reading Lab v3.4 §13E.

## Problém v E4F
Původní `collect_results.py` zapisoval přehledové CSV pro skórování
**předtím**, než vyhodnotil status `INVALID_INPUT` nebo `INCOMPLETE`.
Pokud se následně spustil scorer nad soubory v `COLLECTED`, mohl
zobrazit částečné/neplatné výsledky. Při opakovaném sběru hrozila
také záměna starých kompletních CSV za aktuální nekompletní data.

## E4G – oprava v soukromém ZIP
Distribuované zadání pro každého posuzovatele je **nezměněné**.
Mění se pouze soukromá složka `2_TEACHER_ONLY`:

1. Po spuštění sběru se nejprve zneplatní předchozí výsledky a vznikne
   `PROCESSING_OR_INTERRUPTED`.
2. Pokud sběr není kompletní nebo obsahuje chybu, vytvoří se **pouze**
   `COLLECTION_STATUS.json`, kde jsou vyjmenované chybějící případy
   a problémy. Nebudou vytvořeny skórovatelné CSV ani `COLLECTION_READY.json`.
3. Jen při **80/80 nezávadných případech a 528/528 úplných odpovědích**
   vzniknou CSV a `COLLECTION_READY.json`, který obsahuje SHA-256 otisky
   pěti povinných lokálních souborů.
4. Nový privátní `SCORE_QA_E4G_PRIVATE.cjs` před skórováním kontroluje
   `COLLECTION_STATUS.json`, `COLLECTION_READY.json`, přesný otisk
   původního studentského HTML a všech pět lokálních souborů. Při
   změně CSV, chybějících odpovědích, špatném otisku či opakovaném
   neúplném sběru skórování odmítne.
5. Windows `RUN_COLLECT_WINDOWS.bat` zkouší `py -3` nebo `python`,
   vypíše upozornění a nezaměňuje úplný sběr s pedagogickým schválením.
6. **Výsledek scoreru vždy `NO_GO`.** Číselná shoda nikdy není
   automatickým rozhodnutím o vydání karty.

## Opravdu ověřené lokální testy
- Prázdný sběr: INCOMPLETE, žádná skórovatelná CSV.
- Dvě přijaté odpovědi: INCOMPLETE, žádná skórovatelná CSV.
- Stejný alias pro blind i with-text: INVALID_INPUT.
- Všech 80 syntetických odpovědí a 528 polí: vydána pouze
  technická uzávěrka `COMPLETE_NEEDS_MANUAL_VALIDATION`, privátní scorer
  správně vrací `NO_GO`.
- Změna jediného CSV po uzávěrce: skórování odmítnuto.
- Po kompletním sběru odstranění jedné odpovědi a nový sběr:
  stará uzávěrka se zneplatní a skórování odmítne.
- Kompletní sběr následovaný chybným vstupem: INVALID_INPUT,
  uzávěrka a skórovací soubory zneplatněny.
- 80 jednotlivých ZIP pro posuzovatele je **byte-for-byte stejných**
  jako v E4F (ověřeno SHA-256 pro všechny).
- GitHub CI testuje **pouze obecnou bezpečnostní bránu** nad syntetickými
  daty. Žádné skutečné zadání či správné odpovědi do GitHubu nepatří.

## Co stále zbývá
- **0/80** reálných nezávislých posouzení; **0/528** skutečných odpovědí.
- Reálné otevření `file://` na Windows/iOS a předání souboru
  posuzovatelům **NEOVĚŘENO** v tomto izolovaném prostředí.
- Skutečné posouzení jednoznačnosti, CEFR úrovní, výhrad posuzovatelů
  a izolovaných slepých testů nelze nahradit syntetickými soubory.
- Bez nezávislé pedagogické revize a bezpečnostní/device QA nelze
  nasadit *Can Mistakes*, *Plastic Ocean* ani veřejný učitelský katalog.

**GO:** soukromá technická distribuce QA materiálů a sběr.
**NO-GO:** publikace, sloučení PR do `main`, uvolnění učitelských klíčů.
