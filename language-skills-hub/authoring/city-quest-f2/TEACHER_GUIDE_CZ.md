# CITY QUEST – F2: pedagogický a jazykový manuál

**Stav:** předprodukční kandidát k jazykové a pedagogické přejímce (EN/ES/DE/FR, CEFR A1–C2). Není součástí produkčního katalogu LSH.

## 1. Parametry

- **Cílová úroveň:** A1, A2, B1, B2, C1, C2 dle CEFR. Výchozí náhled EN/B1.
- **Věková skupina:** gymnázium, přibližně 12–19 let; užitečné i pro samostatné dospělé studenty.
- **Cíl aktivity:** porozumět pokynům pro orientaci ve městě, vyhledat trasu, podat srozumitelné a přiměřené instrukce, opravovat komunikační nedorozumění a vhodně argumentovat při volbě dopravního spojení.
- **Čas:** 45 minut pro doporučené 4 stanice; 60–90 minut pro většinu nebo všech osm stanic. Jedna kratší samostatná aktivita 5–12 minut podle úrovně.
- **Režimy:** Solo (výběr, mapové aktivity a hlasitá sebekontrola), Pair (role turista / průvodce / kontrolor, na jednom zařízení).
- **Jazyky:** angličtina, španělština, němčina a francouzština. Všechny obsahové texty jsou staticky vložené; není používána strojová translace ani API.

## 2. Diferenciace podle CEFR

| Úroveň | Jazykový výkon | Herní rozdíl |
|---|---|---|
| A1 | Pojmenovat místa, jednoduché imperativy a strany | 3 slovníkové úlohy (2 možnosti), kratší cesta na náměstí, 3 kroky navigace, v dopravě jen číslo linky, 2 závěrečné zastávky |
| A2 | Krátké řetězce pokynů, čas a jednoduché otázky | 4 slovníkové úlohy, muzeum, 5 navigačních kroků, linka a odjezd |
| B1 | Vlastní souvislý popis cesty, vysvětlení a oprava | 6 úloh, 5 navigačních kroků, tři údaje z jízdního řádu, 3 závěrečná stanoviště |
| B2 | Alternativy, přiměřené zdůvodnění a přesnost | Povinná průjezdní Plaza/Market Square a komplexnější mluvní úkol |
| C1 | Přesnější vyjadřování, jazykový registr, omezení | Povinná návštěva knihovny, 7 navigačních kroků, požadavek bezbariérovosti |
| C2 | Prevence nejasností, diplomatická oprava, priority | Knihovna + blokovaná ulice, propracovanější formulace, důraz na kompromisy a rizika |

**Slabší žáci:** nabídnout profil o jednu úroveň níže, povolit mapu a nápovědu, pracovat se slovy pro směry a s krátkými větami; u mluvení vzorová formulace po vlastním pokusu.

**Silnější žáci:** vypnout užívání nápovědy, vyžadovat přesvědčivé zdůvodnění, zdvořilé opravy a alternativní návrhy; u C1–C2 analyzovat případné nejednoznačnosti navigace a porovnat více tras.

## 3. Osm stanic

1. **Explore the City:** odvodit místo z textové nápovědy a vysvětlit, proč odpověď odpovídá situaci.
2. **Find the Route:** spojit start a cíl, přičemž od B2 jsou některé zastávky povinné. C2 obsahuje také blokovanou ulici.
3. **Ask for Directions:** větvený dialog s turistou (jasná odpověď / neurčitá odpověď / chybná odpověď, oprava a závěrečná zdvořilá reakce).
4. **Follow My Directions:** podle instrukcí v daném jazyce zvolit další sousední křižovatku. Délka a konfigurace cesty se mění podle úrovně.
5. **Catch the Right Bus:** z fiktivního jízdního řádu zvolit linku, odjezd a případně cílovou zastávku; úrovně C1–C2 přidávají bezbariérovost a spolehlivost.
6. **Oops! Wrong Turn:** najít chybný pokyn, vybrat opravu a formulovat taktní vysvětlení.
7. **The Unexpected Detour:** vyhnout se blokovanému úseku ulice a obhájit jinou trasu.
8. **The Ultimate City Quest:** projít 2 (A1) nebo 3 (A2–C2) zastávky, u každé vysvětlit úsek trasy a porovnat se vzorem.

## 4. Doporučená hodina 45 minut

- 5 min: výběr jazyka/CEFR, orientace v mapě, slovní zásoba
- 10 min: stanice 1 a 2
- 12 min: stanice 3 nebo 4 (konverzace ve dvojici)
- 12 min: stanice 5 nebo 7 (řešení situace)
- 6 min: reflexe — co bylo jasné, co žák dokáže vysvětlit jinému člověku

Nejde o automaticky známkovaný test. **Aplikace automaticky vyhodnocuje jen uzavřené volby a trasování.** Mluvené formulace student vyslovuje sám, případně je hodnotí partner nebo učitel. Neprobíhá nahrávání hlasu ani rozpoznávání řeči.

## 5. Lokalizační a bezpečnostní kritéria před uvolněním

1. Každý jazyk samostatně zrevidovat s učitelem daného jazyka: přirozenost imperativů, vykání/tykání, zájmena, kulturní přiměřenost.
2. Zvlášť ověřit B2–C2: jazyková obtížnost nesmí spočívat pouze v delších slovech; musí přinášet náročnější komunikační záměr.
3. U každého jazyka/úrovně projít všech osm stanic včetně správné a chybné volby.
4. Ověřit přeložené popisky mapy, kontrast, ovládání iPad/iPhone Safari a Android Chrome na reálných zařízeních.
5. **Produkční nasazení je zakázáno do dokončení přejímky.** F2 je závislá na pracovních větvích F1/F0 a nemá nahrazovat aktuální produkční kartu.

## 6. Offline provoz a data

- Žádné API, backend, geolokace, uživatelské účty, ukládání osobních údajů či logování výkonu.
- Postup v rámci osmi stanic se uchovává pouze v paměti otevřeného listu. Změna jazyka/úrovně resetuje relaci.
- Samostatné offline HTML je součástí GitHub Actions artifactu. Nepoužívá vzdálené mapové podklady.
- Obrázkové mapové prostředí je původní vektorová ilustrace projektu.

**Limity:** Certifikace CI ověřuje datovou úplnost a funkci her. Sama o sobě nepotvrzuje přirozenost jednotlivých promluv na úrovni C2 ani pedagogickou přiměřenost všech 24 variant. Je nutná lidská jazyková přejímka.
