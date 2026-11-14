# R30 – časovaný lokální test Reading / Listening (pracovní pilot)

**Cílová úroveň:** Reading EN/ES/DE/FR A1–C2; Listening EN A1–C2.  
**Věková skupina:** gymnázium, orientačně 12–19 let.  
**Výukový cíl:** časově vymezené ověřování porozumění textu či poslechu, lokální obnova rozpracovaného pokusu a následná transparentní zpětná vazba.  
**Doporučený čas:** učitel stanovuje 5–120 minut, pro běžnou hodinu obvykle Reading 10–30 a Listening 15–30 minut.  
**Diferenciace:** slabším skupinám zvolit nižší CEFR a delší limit; pokročilejším C1/C2 a přiměřeně náročnější práci s argumentací a otevřenými odpověďmi. Bez porušení skutečné obsahové náročnosti původní karty.

## Architektura

R30 navazuje na R29 jako funkčně oddělený pilot pro školní používání pod dohledem. Statický GitHub Pages, žádný backend, studentské účty, POST výsledků ani serverové časování.

- V učitelském panelu se volí čas v celých minutách (5–120); studentské QR/URL obsahuje `timer` a neosobní identifikátor konkrétního učitelského odkazu `attempt`.
- Nová časovaná studentská stránka má úvodní obrazovku a tlačítko Start; od tohoto okamžiku je deadline `startedAt + timer*60000`. Používá se čas zařízení.
- Po změně odpovědi se lokální stav ukládá do `localStorage` pod klíčem odděleným pro dovednost/téma/jazyk/CEFR/čas/odkaz **a náhodnou relaci konkrétního otevření**. Každé nové otevření původního třídního odkazu získá vlastní lokální relaci (`#lsh_session=...`), aby žák na sdíleném počítači automaticky neviděl odpovědi předchozího žáka. Prosté obnovení otevřené stránky relaci zachová. Týká se Reading odpovědí a volitelné reflexe i Listening objektivních a písemných odpovědí.
- Obnovení stejné URL ve stejném prohlížeči zobrazí uložené odpovědi a pokračující čas, nikoli novou plnou časomíru.
- Opuštění viditelné stránky nebo ukončení již skutečně zapnutého fullscreen vyvolá překryv přerušení. Čas pokračuje. Gesto **levý horní → pravý horní → levý dolní → pravý dolní** obnoví práci, ale není to autentizace učitele.
- Při vypršení času se provede automatické lokální odevzdání i při nevyplněných úlohách. Výsledek se načte ze stávajícího hodnoticího jádra R28/R29.
- Původní přímé studentské URL bez `timer` zůstávají beze změn.
- Režim neobsahuje nové testové úlohy ani změny původních 29 procvičovacích karet / 642 variant.

## Nepřekročitelné limity

**R30 není zabezpečená školní zkouška.** Žák může upravit URL, otevřít nový prohlížeč, smazat data, pozměnit systémový čas či najít veřejný klíč v procvičovacích kartách. Učitelský servisní postup pro pokračování není autentizace. Události visibility/fullscreen nejsou spolehlivý důkaz podvodu, zejména na iPadOS ve Split View/Slide Over; neschopnost je zaznamenat se nesmí vydávat za nepřítomnost incidentu.

Při zakázaném či zaplněném `localStorage` pokus funguje pouze do obnovení stránky; zobrazí se upozornění. Na sdílených školních zařízeních mohou lokálně přetrvávat **studentské písemné odpovědi**. Po odevzdání má student/učitel možnost **Smazat místní odpovědi**, která vymaže právě tuto lokální relaci; na společných zařízeních ji doporučujeme provést po převzetí ověřeného výsledku. Vymazání dat není ochranou před manipulací ani vzdáleným uložením. Z R30 se nepřenášejí na server, do GitHubu ani do Bakalářů. Nezadávat osobní údaje do odpovědí, pokud to není nezbytné pro pedagogický cíl.

U Listening se po odevzdání obnovují studentské odpovědi, ale **ruční známky 0/1 udělené učitelem se po reloadu zatím neukládají**. Před uzavřením pracovní klasifikace je nutné provést učitelskou kontrolu a dokumentovat výsledek podle pravidel školy.

## Přejímací scénáře

1. Učitel: otevřít Reading/Listening, nastavit 15 minut, změnit téma a CEFR, ověřit shodu QR/URL, že URL neobsahuje jméno ani identitu žáka.
2. Student: před Start je test uzamčený v úvodním stavu; Start aktivuje odpočítávání, žádná správná odpověď se průběžně nezobrazuje.
3. Student: odpovědět na několik uzavřených/písemných úloh, obnovit stránku, zkontrolovat odpovědi a menší zbývající čas.
4. Student: přejít do jiné aplikace/karty a vrátit se; podle dostupného prohlížečového signálu očekávat přerušení, nikoliv falešný důkaz podvodu.
5. Učitel: použít servisní postup pro pokračování (sdělený učitelům zvlášť), ověřit pokračování s původním časem a odpověďmi.
6. Student: nechat doběhnout čas – odevzdání musí fungovat i s prázdnými položkami, bez POST/odeslání soukromých dat.
7. Student: po odevzdání obnovit stejnou URL; stav se nevrátí do rozpracovaného testu. Na sdíleném PC otevřít původní třídní QR ve druhé záložce – musí vzniknout jiná místní relace bez cizích odpovědí. Po převzetí výsledku použít **Smazat místní odpovědi**; stránka už nesmí ukazovat smazané odpovědi.
8. Mobilní přejímka: skutečný Android Chrome, iPhone Safari, iPadOS Safari včetně rozdělené obrazovky; Windows Chrome/Edge a Firefox. Vždy vizuální kontrola focusu, scrollu a dotykových cílů.
9. Školní síť: u Listening ověřit příslušný externí videozdroj na zařízení učitele; studentská stránka nemá audio ovladač.
10. Pedagogika: samostatně rozhodnout o časovém limitu a případné redukci testových úloh; R30 nepředstírá, že celá procvičovací sada je vhodná pro každý test.

## Publikační brána

GitHub Actions `lsh-r30-timer-recovery.yml` musí projít na přesném HEAD (Node a Chromium/WebKit). Pak následuje nezávislá funkční a pedagogická přejímka. **Slučovat teprve po úspěšných testech na přesném commitu.** R29 zůstává rollback bodem; ověření na fyzických Android/iOS/iPadOS zařízeních je samostatnou následnou přejímkou.

