# Language Skills Hub R14 — oddělené učitelské klíče a ověřování médií

Datum: 8. listopadu 2026 · PR #27 (DRAFT) · **NO PUBLISH / NO MERGE / NO TEST GRADING**

## 1. Reading Lab: soukromý výstup mimo tento repozitář

Pro dvě izolované opravené studentské karty R13 vznikl **samostatný soukromý balíček dostupný výhradně ve vlákně s vyučujícím**:

- soubor: `LSH_R14_SOUKROME_KLICE_READING_R13_48_VARIANT.zip`;
- obsah: 2 samostatné offline HTML klíče (*An Email from a Friend*, *Instant Messages*), rozcestník, CSV 720 správných odpovědí, CSV/HTML 17 změn a JSON manifest;
- pokrytí: 2 témata × 4 jazyky (EN/ES/DE/FR) × 6 úrovní (A1–C2) = **48 variant**;
- ověřená vazba na R13: 720 unikátních hodnocených otázkových záznamů, 769 doslovných důkazních citací, 32 úloh na chybějící větu, 16 změn matching a jedno vysvětlení de/B2, pět dvoudílných důkazních citací R13;
- SHA-256 soukromého balíčku: `75eb25a193e8cf0583d40ed91112d32a51a3ff680ead83f0cfa1325a54ec3aa7`;
- zdrojový commit kandidátů: `b8f72b0bb506e829d744918011633cd18bf01146`.

**ŽÁDNÝ UČITELSKÝ KLÍČ SE NEULOŽIL DO GITHUBU ANI DO CI ARTEFAKTŮ.** Soukromý ZIP nepatří do tohoto repozitáře, GitHub Pages, sdíleného studentského disku ani veřejného katalogu. Neobsahuje osobní údaje studentů.

Klíče jsou záměrně označené `teacherApproval=false`: synchronizace s **konkrétními R13 studentskými daty** je strojově doložena, ale původní existující soukromé učitelské dokumenty nebyly dohledány. **Neproběhla jejich aktualizace ani porovnání s historickou verzí.** Pedagogické posouzení jednoznačnosti všech správných odpovědí je stále potřebné.

### Bezpečnostní hranice

Procvičovací studentské HTML obsahuje správné odpovědi ve svých klientských datech pro okamžité vyhodnocení. Samotné vedení odděleného učitelského klíče z něj **nedělá bezpečný klasifikovaný test**. Do ostrého režimu Testování nepřecházet, dokud správné odpovědi nebudou oddělené od klienta (například vyhodnocení na serveru až po odevzdání) a dokud nebude schválena metodika hodnocení. Rozhraní Practice/Preview je jiný účel.

## 2. Listening Lab: skutečná média — předběžný stav 8. 11. 2026

| Karta | Zdroje přímo v aktuálním HTML | Ověření | Rozhodnutí |
|---|---|---|---|
| Matthew McConaughey (Oscars 2014) | [Oficiální Oscars YouTube](https://www.youtube.com/watch?v=wD2cVhC-63I), přímý úsek od 70 s | Oficiální kanál Oscars i popis ceny/vystoupení souhlasí se zadáním. Neproběhl fyzický test ve školní síti. | Nechat odkaz; na školních zařízeních ověřit přehrávání a načasování úloh. |
| Peaky Blinders: No Fighting | [Primární YouTube](https://www.youtube.com/watch?v=DRLSRX1nF0s) a [záložní záznam oficiálního kanálu](https://www.youtube.com/watch?v=_hzgUPl3YWU) | Primární adresa nebyla přes externí kontrolní prostředí spolehlivě načtena (to **neprokazuje**, že je video odstraněno). Záložní stránka existuje; totožnost všech časových úseků nebyla prokázána. Karta již obsahuje výslovné varování před vulgaritami, drogami a výhrůžkami. | Neswitchovat automaticky; v české školní síti ověřit obě verze a schválit výhradně pro vhodný věk. |
| Harrison Ford, Actor Awards/SAG 2026 | [Video Netflix na Facebooku](https://www.facebook.com/netflixus/videos/harrison-ford-sag-life-achievement-award/796302026840392/), [post Netflix](https://x.com/netflix/status/2028305176508170602), [pořad Netflix](https://www.netflix.com/title/81745786) | Událost 1. března 2026 a Fordovo ocenění potvrzuje SAG-AFTRA/Netflix. Facebookový přehrávač se nepodařilo externě ověřit bez omezení platformy. | Nezměnit zdroj naslepo; prověřit funkčnost bez přihlášení, dostupnost v učebně a obsahovou shodu případného oficiálního alternativního klipu. |

Primární nezávislé prameny k mediálním faktům:
- SAG-AFTRA: https://www.sagaftra.org/harrison-ford-be-honored-2025-sag-aftra-life-achievement-award
- SAG-AFTRA retrospektiva: https://www.sagaftra.org/harrison-ford-hero-our-hearts
- Netflix Actor Awards: https://www.netflix.com/tudum/articles/actor-awards-sag-2026-how-to-watch
- Oficiální kanál Oscars: https://www.youtube.com/watch?v=wD2cVhC-63I

**Pozor:** ověřit fyzicky školní zařízení a úrovně A1–C2. Dostupnost URL, soulad přehrávaného úseku s otázkami, externí licence, věková vhodnost ani blokování sociálních sítí školní sítí nejsou totožné věci.

## 3. Přejímací kroky před jakoukoliv publikací

1. Porovnat oba nové soukromé kandidátní klíče s případnými historickými originály, potvrdit 17 rozdílů (včetně 5 dvojitých důkazů).
2. Učitel/lingvista prověří jednoznačnost odpovědí a přiměřenost CEFR; ručně vedené otevřené úlohy nemají automatickou rubriku.
3. Na reálném školním Windows PC, Androidu, iPhonu/iPadu otevřít všechny tři poslechové zdroje, klipy porovnat s úlohami a písemně zaznamenat stav.
4. Peaky Blinders vyžaduje explicitní věkovou/pedagogickou přejímku; nižším ročníkům nenabízet automaticky.
5. PR #27 zůstává DRAFT; `main` ani originální studentské karty neměnit bez přejímky. Testování/klasifikace zůstává vypnuté.

Tento dokument je pouze **neutrální, veřejně bezpečný handoff bez odpovědí**. Samotný soukromý ZIP a učitelské odpovědi jsou výlučně mimo repozitář.
