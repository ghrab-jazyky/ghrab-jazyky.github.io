# City Quest F5 — kontrolní brány a akceptace

## Výukový kontrakt

| Parametr | Hodnota |
| --- | --- |
| Cílové úrovně | město A1–C2; metro B1–C2 |
| Ročník / věk | gymnázium, cca 12–19 let |
| Cíl | samostatně vyhodnotit trasu, instruovat a zdůvodnit rozhodnutí v EN/ES/DE/FR; reflexe ústní komunikace |
| Čas | jedna mise 5–12 min; 3–4 mise 45 min; komplexní 8misový cyklus do 2×45 min podle pokročilosti |
| Slabší | kratší pomocné texty, glosář, viditelné šipky, nápověda a možnost zopakovat |
| Silnější | C1/C2 alternativa, výluka, argumentace, přesná situační registrace a partnerská reflexe |

## Matice rozhodovacích bran

| Brána | Akceptační důkaz | Stav k zahájení F5 | Kdo schvaluje |
| --- | --- | --- | --- |
| G0 — baseline a integrita | 11/11 relevantních GitHub Actions SUCCESS na F4 `73d2781`, offline HTML SHA/CSP | **PASS (F4 baseline)** | technický auditor |
| G1 — Claude nezávislý audit | `CLAUDE_F5_VERDICT.md`, `CLAUDE_F5_FINDINGS.csv`, konkrétní reprodukce, 256 auditních řádků | **PENDING** | nezávislý reviewer |
| G2 — náprava všech P0/P1 a schválených P2 | přesný diff, regresní test a opakované 11/11 CI na novém code SHA | **PENDING** | vývojář + reviewer |
| G3 — jazyk/didaktika | 256 lidských posouzení nebo výslovně dokumentovaná výjimka vlastníka; zvlášť B2–C2 a Metro 05–08 | **PENDING** | kompetentní učitelé / lingvisté |
| G4 — fyzická zařízení a a11y | iPhone Safari, iPad Split View, Android Chrome, VoiceOver, TalkBack; skutečný zoom, fokus, klikatelnost | **PENDING** | nezávislý tester |
| G5 — vizuál/pedagogika produktu | osobní přejímka mapy, stanic, 8/4 misí, zpětné vazby a PA | **PENDING** | vlastník produktu |
| G6 — integrace s aktuální `main` | samostatná integrační větev, minimální diff, cross-app regresní testy, rollback | **PENDING** | technický auditor |
| G7 — finální produkční vydání | písemné explicitní `GO` **po G1–G6**, sloučení schváleného integračního PR | **BLOCKED / NO-GO** | vlastník produktu |

**Poznámka k G3:** v původní `F4_256_variant_release_review_matrix.csv` musí lidské hodnoticí sloupce zůstat `PENDING`, dokud neexistuje reálný osobní podpis a zdůvodnění. Žádný automatický test ani Claude nemá právo je doplnit umělým PASS.

## Samostatné otevřené rozhodnutí: mluvená hlášení

Současná verze zobrazuje ručně psané PA texty a volitelné lokální signály; **neobsahuje nahrané profesionální hlasy**. Pro toto vydání doporučený scope: **textová simulace bez Listening nároku**. Pokud vlastník vyžaduje namluvená hlášení, vyžaduje to samostatný implementační backlog s licencí, nativní výslovností, offline balíčkem a novým QA. Nesmí se tiše přidat externí generování řeči.

## Jak zaznamenat podepsaný výsledek

Pro každou bránu: datum a čas, přesný SHA, jméno/role revizora (ne žáka), prostředí, důkaz (test/artifact/screenshot), verdikt PASS/FAIL/NOT TESTED a odkaz na nález. Vydání se povoluje až po potvrzení G7; žádná defaultní implicitní aprobace.
