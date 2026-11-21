# City Quest / LSH — F2.1E integrační audit (21. 11. 2026)

**Předmět:** City Quest F2, F2.1A–D a připravenost k přechodu na F3 (prémiový design).

**Zdrojový základ:** F2.1D Draft PR #149, commit `a931593fdb77b732b50851b73224f9c9f23a9ad0`; všechny předchozí relevantní CI workflow SUCCESS. Tato větev F2.1E na uvedený commit navazuje. Žádný merge ani produkční vydání.

## 1. Rozsah a úrovně

- **Původní městská hra:** 4 jazyky × 6 úrovní A1–C2 × 8 stanic = **192 kombinací obrazovka/profil/stanice**.
- **Volitelná hra s metrem:** 4 jazyky × 4 úrovně B1–C2 × 4 stanice 05–08 = **64 kombinací**.
- Úrovně A1–A2 zůstávají bez hratelného metra; městské stanice fungují dál.
- Doporučená skupina: studenti gymnázia, orientačně 12–19 let. Dílčí stanice 5–12 minut, 3–4 stanice zpravidla na 45 minut.
- Cíl: praktické porozumění mapě, vysvětlování cesty, orientace v síti, rozhodování při přestupu či výluce.
- Diferenciace: B1 — jasné kroky; B2 — porovnání a zdůvodnění; C1 — alternativy a objasnění omezení; C2 — přesná, situačně vhodná komunikace. Každá jazyková verze má podporu i rozšíření.

## 2. Co kontrolují nové testy F2.1E

| Kontrola | Automatizovaný důkaz | Omezení |
|---|---|---|
| 192 klasických kombinací | Otevření každé stanice, existence panelu, přepínač metra, JS výjimky | **Smoke test**, ne kompletní průchod všemi 192 hrami |
| 64 metro kombinací | Nadpis, úrovňový úkol, glosář, městská/metro scéna, jediný panel | **Smoke test**; skutečné průchody kryjí F2.1C/D |
| Mise 08 | Stav u Central Station, pěší přesun, přesná lokalizovaná poloha, nikoli podzemní výchozí bod | Fyzický telefon prověřit zvlášť |
| Responzivita | 320, 390, 768, 1050, 1051 a 1366 px, panel, jediný navigační HUD, tlačítka, horizontální overflow | Nejde o ruční iOS/Android test |
| Offline a CSP | Jeden exportovaný HTML soubor, hashovaná inline JS/CSS, `connect-src 'none'`, žádné síťové requesty | Nehodnotí bezpečnost systému/správu identity (aplikace je bez serveru) |
| Zpětná kompatibilita | Stávající F0/F1/F2/F2.1A–D testy se spouštějí i ve F2.1E | Testy musí být zelené na posledním přesném commitu |

### Nález INTEG-01 — opraveno ve F2.1E

**Symptom:** V misi 08, kdy žák teprve šel pěšky od Central Station, informační panel uváděl aktuální polohu v metru (Market Square). Šlo o směšování `surface` a `metroStation` stavu. **Oprava:** při chůzi se vždy vykresluje aktuální poloha z městského grafu; po přesunu se aktuální poloha neztratí ani při zobrazování zpětné vazby. Regresní test kontroluje počátek, mezikrok i příchod ke vstupu do metra.

## 3. Otevřené neautomatizovatelné brány

1. **Vlastník produktu:** reálné přijetí vzhledu mapy města i metra, velkých/smalých obrazovek, vizuálních přechodů, zvukové a animační koncepce.
2. **Jazyková revize:** nezávislé odborné korektury španělštiny, němčiny a francouzštiny, pedagogické přiměřenosti B1/B2/C1/C2 a reálných dialogů.
3. **Fyzická zařízení:** iOS Safari/iPadOS a Android Chrome, portrét i landscape, při skutečném dotykovém ovládání, přístupnost a odezva.
4. **Mluvní sebehodnocení:** potvrzovací tlačítko je z principu subjektivní; hra **nesnímá řeč ani ji neznámkuje**. Učitel musí při hodnoticí aktivitě zajistit vlastní posouzení výkonu.
5. **Audio:** případné offline audio výslovnosti a doprovodné ozvučení není součástí F2.1D pilotu; vyžaduje pedagogické/autorské a technické rozhodnutí před F3.
6. **F4 (celkový předprodukční audit):** F2.1E nenahrazuje plnou závěrečnou certifikaci F4 z původního plánu.

## 4. Stop pravidlo

F2.1E lze označit **technicky PASS** jen při zeleném CI na aktuálním SHA (včetně regresních testů). To **neznamená schválení pro produkci** ani uzavření F3/F4. Do F3 se přechází s vyjmenovanými otevřenými estetickými/pedagogickými rozhodnutími, nikoli na základě pouhých automatických testů.

**Stav dokumentu:** auditní podklad; aktualizace finálního SHA a výsledku CI bude doplněna po certifikaci.
