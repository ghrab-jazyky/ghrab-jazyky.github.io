# LSH – dočasné uzamčení testů Reading/Listening (E1–E6)

Stav: dočasná blokace uživatelského rozhraní, nikoli autentizace či bezpečnostní hranice.

## Rozsah
- Katalog: tlačítko TEST zůstává viditelné, běžným návštěvníkům se zobrazí české informační okno.
- Přímé učitelské odkazy Reading/Listening: viditelné je pouze informační okno; konfigurátor se neaktivuje.
- Testové klíče na stránce VÝSLEDKY: běžný návštěvník může používat procvičovací verzi, testový režim je dočasně deaktivován.
- Studentské odkazy a QR, běžné výukové karty, Conversation a hodnocení zůstávají beze změny.
- Hodnota testUiEnabled v data/test-mode-policy.json se NEMĚNÍ.

## Jednorázová aktivace pro vývojáře
Ve vlastním prohlížeči na produkční doméně otevři F12 > Console a proveď:

    localStorage.setItem('lsh:temporary-test-lock:developer:v1','enabled');location.reload();

Deaktivace na stejném zařízení:

    localStorage.removeItem('lsh:temporary-test-lock:developer:v1');location.reload();

Platí pouze pro aktuální origin a profil prohlížeče, nikoli pro jiné zařízení. Jde o veřejně zjistitelný klientský příznak, který si může nastavit i jiný technicky zdatný uživatel. NENÍ to ověření identity.

Výjimka pro lokální regresní testy: http://localhost a http://127.0.0.1.

## E6 – úplné odstranění uzamčení
Z aktuální hlavní větve vytvořit novou pracovní větev a:
1. Odebrat importy temporary-test-lock.js/css z index.html, obou teacher.html a practice-answers/teacher.html; zároveň odstranit data-lsh-temporary-test-page="teacher" z obou učitelských HTML.
2. Odstranit dočasný posluchač kliknutí u TEST v assets/hub.js.
3. Odstranit úvodní podmínky guardTeacherPage z reading-teacher.js a listening-teacher.js.
4. Odstranit dočasné omezení testového klíče z practice-answers/teacher-key.js.
5. Smazat oba soubory assets/temporary-test-lock.*, testy temporary-test-lock.test.cjs a temporary-test-lock.browser.test.cjs, workflow .github/workflows/lsh-temporary-test-lock.yml a tuto dokumentaci.
6. Spustit statickou regresi, prohlížečové testy Chromium/WebKit a live smoke po vydání.
7. Ověřit z anonymního profilu, že TEST funguje bez příznaku localStorage; ověřit přímé učitelské odkazy i běžné klíče VÝSLEDKY.
8. Na vývojářově zařízení případně odstranit nepotřebný příznak z localStorage; klientská kontrola už nebude součástí kódu.

**NIKDY nevracet celou main na starý commit**: tím by se ztratily mezitím dokončené nové funkce Reading/Listening.

## Omezení
GitHub Pages je veřejný statický web. Technicky zdatný uživatel může blokaci v JavaScriptu obejít. Testové zdroje nejsou chráněny serverově. Již rozdávané studentské odkazy zůstávají funkční záměrně, aby se nezničily lokální pokusy.

## Ověření
    node --test language-skills-hub/tests/temporary-test-lock.test.cjs

Žádné nasazení z vývojové větve bez úspěšné CI a schválení vlastníka.