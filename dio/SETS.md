# Tematické sady DIO

Předvolba Pro DIO: základ + doprava + vybavení. Rozšířený: všechny povrchové sady. Vlastní: přepínače sad, základ je povinný. Stav rozlišuje nenačteno, načteno, částečně, chyba a skryto. Po přidání nenačtené sady je nutné použít tlačítko donačtení; do té doby je běžný export zakázán. Částečná data lze exportovat s upozorněním.

Sady se mapují z významu objektů (sets.js), nikoli jen ze zdroje. Společné služby IPR a OSM mohou při prvním čtení obsahovat více sad; v rámci stejného výřezu se úspěšné výsledky uchovávají a znovu nestahují. SMZ, TSK a THMP se spouští jen pro příslušné sady. Změna výřezu vymaže tuto paměťovou cache. Opakovaný pokus znovu dotazuje jen neúspěšné zdroje. HTTP cache lamp zůstává nezávislá.

Vypnutí sady neodstraňuje již načtená data z pracovního JSON. Běžné SVG ale obsahuje jen vybrané sady. Skryté detailní podvrstvy uvnitř vybrané sady zůstávají zachované. Původní zdrojové vrstvy se přibalují jen výslovnou volbou kontrolního exportu. Podzemí, pomocná a neurčená kresba jsou zvlášť v pokročilém kontrolním režimu.

SVG je seskupeno do skutečných vnořených vrstev Inkscape. Wrapper set-export.js využívá smluvený formát vrstev generovaný svg-export.js a při neznámém názvu vrstvy selže místo tichého zahození dat. Test: node --experimental-default-type=module dio/sets.test.mjs.

Tento commit nezavádí S-JTSK, severku ani nové názvy ulic. Základní sada proto zatím neobsahuje samostatné textové popisy ulic. Souřadnice, zdrojové symboly a dosavadní pravidla slučování se nemění.
