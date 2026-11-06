# Language Skills Hub — Online testovací karty (R3C)

**Datum:** 6. 11. 2026. **Umístění:** výhradně v GitHub organizaci `ghrab-jazyky`, repozitář `ghrab-jazyky/ghrab-jazyky.github.io`, větev `main`, GitHub Pages.

- Hlavní pilot: `https://ghrab-jazyky.github.io/zkusebni/`
- Online testovací karty: `https://ghrab-jazyky.github.io/zkusebni/nahledy/`
- Kategorie: `/zkusebni/cteni/`, `/zkusebni/poslech/` a již existující `/zkusebni/konverzace/`
- **Daniel22-dev**: žádné nové soubory Language Skills Hub, žádný hosting ani publikace z osobního účtu. Soukromý starší `conversation-lab-source` nebyl měněn.

## Materiály

- Reading Lab: **5/5 originálních** studentských HTML z pěti přiložených ZIP souborů: Can Mistakes v4.3, Plastic Ocean v2, Asteroids v2.2, Email from a Friend v2, Instant Messages v2.1.
- Listening Lab: **3/3 originálních** studentských HTML z balíčků Matthew McConaughey v1, Harrison Ford v6, Peaky Blinders v2.
- Conversation Lab: dosavadních 21 technicky integrovaných konverzačních HTML je k dispozici přes původní katalog.

**Integrita:** přesných osm SHA-256 kontrolních součtů a původních délek souborů v bajtech je v `zkusebni/data/preview-provenance.json`. Kontrolní test ověřuje shodu s přiloženým originálem. Soubory tedy není dovoleno v této etapě automaticky přepisovat nebo měnit jejich úlohy, skripty či grafiku.

**Nezahrnuto:** učitelské klíče (oddělené), hodnoticí protokoly, původní soukromé ZIP archivy, osobní údaje, nezávislé pedagogické schválení, nové přihlašování ani migrace osobních slovníčků.

## Publikování vs. schvalování

Všech osm původních studentských HTML je umístěno výhradně pod `/zkusebni/nahledy/{cteni|poslech}/...`, nikoli ve schváleném katalogu `manifest.json`. Jsou označena **TEST** na viditelných navigačních stránkách. Nedostávají krátké kódy, QR tlačítka ani status `PUBLIKOVANO`.

Toto **není autentizace**. GitHub Pages jsou veřejné: kdokoliv s přímým odkazem může načíst původní studentský HTML soubor, včetně všech klientských kontrolních algoritmů uvnitř. Označení TEST nechrání ani neskrývá samotný zdrojový soubor. Učitel musí před sdílením s žáky ověřit úroveň, věcnou správnost úloh, autorská práva, dostupnost externích médií a věkovou vhodnost.

## Zkoušení

1. Otevřít na notebooku, telefonu a tabletu `/zkusebni/` a tlačítko **8 čtecích a poslechových karet · TEST**.
2. Otevřít přímo některou kartu z Reading nebo Listening katalogu a ověřit všechny jazykové úrovně, navigaci, slovníček, dostupnost cvičení a kontrolní mechanismus; zachovat poznámky k chybám.
3. Otestovat videa se stejnou původní scénou/projevem (externí videa mohou být nedostupná, blokovaná či změněná).
4. Teprve po praktickém otestování společně vybrat jednu referenci z každé dovednosti a vytvořit standard pro další 20/4/2 karty.
5. Pro pilot nevyžadovat přihlášení ani zakládat nový repozitář.

## CI a náprava

- `online-previews.test.cjs`: osm správných cest a sha256, validní HTML, žádné soukromé klíče ani schválené položky přidané do manifestu.
- `github-only-catalog.browser.test.cjs`: navigace, dostupnost všech osmi online cest, zobrazení alespoň jednoho Reading a Listening HTML v Chromium.
- `sw.js` přidává jen malý rozcestník do offline shell cache. Originální velká studentská HTML se načítají až při otevření online; offline režim těchto nových karet zatím není předmětem záruky.
- Po zeleném CI je možné sloučit do školního `main`, ověřit nasazení GitHub Pages a předat jeden přímý odkaz na testování.

**Hotové technické nasazení neznamená dokončený pedagogický ani bezpečnostní audit samotných karet.**
