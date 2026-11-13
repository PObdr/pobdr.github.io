# S-JTSK – pracovní geometrie a náhled OSM

Pracovní geometrie, vzdálenosti slučování a export SVG používají EPSG:5514 (Krovak East North), metry. Orientační mapa používá OSM v EPSG:3857. OSM není součástí exportovaného SVG. Podklad ČÚZK ZTM už není výchozím náhledem.

Růžice v rose.js přebírá vektorové cesty hvězdice, vnitřního kruhu a obrysové nápisy S/JTSK z uživatelem dodaného 1711-Albertov_zabor_DIO_2026.svg, nikoli okolní výkres. Původní orientace není závazná. S označuje zeměpisný sever, přidaný modrý Ns sever sítě 5514. JTSK je popisek souřadnicového systému, nikoli druhá severka. V OSM míří S nahoru a Ns se dopočítává; v exportu míří Ns nahoru a dopočítává se S. Rozdíl se vyhodnocuje v centru pohledu/výřezu; nejde o magnetický sever.

Dosavadní datové adaptéry a jejich cache zůstávají ve starém místním formátu. Na hranici aplikace se souřadnice matematicky vrátí do WGS84 a jednou převedou pomocí EPSG:1623 do EPSG:5514. Existující převody přes WGS84 zůstávají, zvláště u lamp. Pravidla třídění se nemění. Nejde o získání nativního zaměření ze všech zdrojů.

Výsledná data mají version:3, crs:EPSG:5514 a origin:[E levé hrany,N horní hrany]. Lokální SVG souřadnice jsou E-originE, originN-N. Exportní obálka je zarovnaná na síť S-JTSK; může být větší než původní zeměpisný obdélník.

Pro náhled se přepočítává pouze dočasná kopie SVG DOM. Každý vrchol čáry/plochy a kotva symbolu se převádí přes WGS84 do Web Mercatoru. Malé symboly, text a koruny používají lokální Jacobian pro velikost a natočení; ořezová hranice má vzorkované hrany. Nejde o roztažení celého SVG mezi dva rohy. Náhled mění jen zobrazovací DOM, nikoli data, rozhodnutí slučování, projektový JSON nebo finální export. Při animovaném zoomu se překryv dočasně skryje. Neočekávaná struktura zdrojového SVG vyvolá chybu místo tichého chybného převodu.

Staré projekty version:2 se při importu převedou, nové se nepřevádějí opakovaně. SVG obsahuje CRS, počátek, obálku, jednotky a převodní vztah v metadatech, kontrolní křížky a růžici v samostatných podvrstvách. Běžné SVG se tím nestává univerzálním georeferencovaným GIS formátem.

Převod EPSG:1623 má deklarovanou přesnost 1 m. Numerická shoda s PROJ nebo přesný round-trip není geodetická přesnost. Podklad není zaměření, neřeší výšky ani magnetickou deklinaci. Existující chybné polohy ani neúplné pasporty projekce neopraví.

Implementace projekce adaptuje sjtsk.js z projektu Profily ulic, Bára Soukupová; MIT oznámení je v PROJECTION-LICENSE.txt.

Testy: node --experimental-default-type=module dio/tests/unit/jtsk.test.mjs a node --experimental-default-type=module dio/tests/unit/preview.test.mjs. Dostupnost živých OSM dlaždic je nezávislá na geometrii a musí se ověřovat v prohlížeči.
