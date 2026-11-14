# ghrab-jazyky.github.io

## Language Skills Hub

**Veřejný katalog:** https://ghrab-jazyky.github.io/language-skills-hub/

Language Skills Hub spojuje Conversation Lab, Reading Lab a Listening Lab. Obsahuje **29 původních procvičovacích témat a 642 jazykových/úrovňových variant A1–C2**, všechny původní karty zůstávají nezměněny.

### Procvičování a hodnocené testy

- **Conversation Lab:** pouze procvičování a sdílení.
- **Reading Lab:** procvičování a **TEST** pro všech pět čtecích témat, EN/ES/DE/FR, A1–C2. Učitel nastaví variantu a pošle odkaz/QR. Student po odevzdání uvidí objektivní body, procenta, opravy a **návrh známky 1–5**.
- **Listening Lab:** procvičování a **TEST** pro tři poslechy EN A1–C2. Učitel řídí dvě přehrání původního externího videa. Student odevzdá uzavřené i písemné úlohy. **Celkové procento a návrh známky vzniknou až po učitelském posouzení všech písemných odpovědí** přímo na zařízení, každá písemná úloha za 0 nebo 1 bod.

### Převod na známky

Pracovní jazyková stupnice z dokumentu `Pravidla hodnoceni_pracovní verze 2026.docx.pdf`, příloha č. 1, čl. 1, bod 24:

- Známka 1: od 88 %
- Známka 2: od 74 %
- Známka 3: od 59 %
- Známka 4: od 44 %
- Známka 5: pod 44 %

Procenta se **zaokrouhlují na celé číslo, polovina nahoru** (R60), např. 87,5 % se počítá jako 88 % a znamená návrh známky 1. **Nebylo ověřeno, že tento pracovní návrh je platnou školní stupnicí** a že zvolený výpočet desetinných procent škola schválila. Proto aplikace výsledek označuje jako **návrh známky**, nikoli automaticky ověřený zápis do Bakalářů.

### R30 – časované lokální testy a obnova odpovědí

U Reading i Listening může učitel zvolit časový limit **5–120 minut** a vytvořit studentský odkaz či QR kód. Student musí kliknout na **Začít test**; čas běží od zahájení, při opuštění stránky se může aktivovat upozornění a místní přerušení, při vypršení času se test automaticky odevzdá. Přerušenou práci může v daném prohlížeči obnovit jen učitel servisním postupem; ten **není bezpečnostní autentizace**.

Studentovy odpovědi se během pokusu ukládají **pouze lokálně**. Od R64 platí **jeden pokus na zařízení**: opakované otevření téhož odkazu nebo QR kódu vrátí žáka do stejného pokusu se stejným limitem; po odevzdání a vymazání se test na tomtéž zařízení znovu nespustí. Odkaz bez časovače je označen jako **test bez dohledu**. Po odevzdání je možné místní odpovědi vymazat. Všechna tato opatření lze ze strany uživatele technicky obejít, nejsou proto zárukou zabezpečeného klasifikovaného testu. Doporučuje se osobní dohled a fyzická přejímka Android/iOS/iPadOS.

### R31 – uložení učitelských bodů a CSV export

U časovaného Listening Testu se ruční hodnocení **0/1 bod** za písemné odpovědi ukládá do stejné **místní relace v prohlížeči**. Po obnovení odkazu se hodnocení načte; návrh celkové známky vzniká až po posouzení všech písemných odpovědí. U starších nečasovaných odkazů nemusí být uchování výsledku k dispozici.

Reading po odevzdání a Listening po dokončení učitelské kontroly umožňují **stáhnout lokální CSV souhrn**. Obsahuje jen body, návrh známky, úroveň a téma; **nikdy jméno, e-mail ani text studentských odpovědí**. CSV není podepsaný ani ověřený školní záznam. Učitel jej musí nezávisle ověřit, nesmí jej automaticky importovat do klasifikace. Po přijetí výsledku lze místní odpovědi smazat, stažený soubor však zůstane na zařízení.

### Co bez backendu nelze zabezpečit

GitHub Pages je veřejný statický web. **Klíče správných odpovědí jsou dostupné v procvičovacích kartách**, studenta nelze bezpečně autentizovat, nelze zabránit novému pokusu ani dokázat pravost lokálního výsledku. Učitelské posuzování písemných odpovědí na zařízení žáka **není technicky chráněno proti manipulaci**. Žádné studentské odpovědi ani známky se neposílají na server.

Pokud má být známka použita pro oficiální školní klasifikaci, musí učitel **osobně ověřit skutečný výkon a výsledek** a převod podle účinných pravidel školy. Aplikace sama nedokáže zaručit podmínky zabezpečené klasifikované zkoušky.

## Související podklady

- [Rozhodnutí R22: statická architektura](language-skills-hub/docs/R22-STATIC-ONLY-DECISION.md)
- [Reading R23](language-skills-hub/docs/R23-READING-LOCAL-SELFCHECK-PILOT.md)
- [Listening R24](language-skills-hub/docs/R24-LISTENING-LOCAL-SELFCHECK-PILOT.md)
- [Audit R25](language-skills-hub/docs/R25-FINAL-AUDIT-AND-SCHOOL-ACCEPTANCE.md)
- [Publikace R27](language-skills-hub/docs/R27-PUBLIC-RELEASE-2026-11-09.md)
- [Opravy po auditu R64](language-skills-hub/docs/R64-AUDIT-OPRAVY.md)

Historická `zkusebni` aplikace a jiné školní aplikace nejsou tímto vydáním měněny.
