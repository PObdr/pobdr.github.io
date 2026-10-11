# Komunální výsledky 2026

Statická aplikace pro GitHub Pages bez sestavování a bez ukládání volebních výsledků.

## Struktura
- index.html: struktura stránky
- assets/styles.css: vzhled
- js/config.js: konkrétní volební událost a zdrojové adresy
- js/api/elections.js: HTTP přístup, timeout a chyby
- js/parsers/municipal.js: XML do obyčejných datových objektů; chybějící číslo není nula
- js/calculations.js: kontrola úplnosti mandátů a většina
- js/state.js: stav výběru a URL
- js/views/results.js: bezpečné vykreslení přes textContent
- js/app.js: řízení aplikace a obnovování

Spouštění vyžaduje HTTP server (nikoli otevření přes file://), například `python -m http.server 8000` z kořene repozitáře a adresu `/volby/`.

## Kontrolní scénáře
1. Výchozí Klatovy: načtení bez ručního souboru.
2. Součet mandátů odpovídá VOLENO_ZASTUP.
3. Výběr většiny zůstane při obnově stejné obce zachovaný.
4. Změna obce výběr většiny resetuje.
5. Chyba obnovy stejné obce ponechá data s upozorněním na neověřenou aktuálnost.
6. Chyba načtení jiné obce nesmí zobrazovat výsledky předchozí obce.

## Omezení
Zatím bez vyhledávání obcí/adres, okrskových výsledků, mapy a úplného seznamu kandidátů. Více výsledkových bloků neagregujeme; většinu pro ně nevyhodnocujeme. Diagnostické HTML soubory jsou dočasně ponechané, ale nejsou propojené z hlavní aplikace.

Zdrojová dokumentace: https://volby.gov.cz/opendata/kv2026/KV2026_XML.htm
