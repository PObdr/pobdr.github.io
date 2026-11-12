# S-JTSK – pracovní geometrie

Mapa, výsledné geometrie, vzdálenosti slučování a SVG používají EPSG:5514 (Krovak East North), metry. Růžice rozlišuje zeměpisný sever N a sever souřadnicové sítě Ns. Směr N se počítá v centru pohledu/výřezu, není zaměňován s magnetickým severem. Mapový podklad je ČÚZK ZTM WMS v EPSG:5514 (vrstva 0, WMS 1.1.1). Běžné OSM dlaždice v EPSG:3857 se v tomto režimu nepoužívají.

Dosavadní datové adaptéry a jejich cache zůstávají ve starém místním formátu. Na hranici aplikace se souřadnice matematicky vrátí do WGS84 a jednou převedou pomocí EPSG:1623 do EPSG:5514. Nejde o získání nativního zaměření ze všech zdrojů: existující převody přes WGS84 zůstávají, zvláště u lamp. Pravidla třídění se nemění. Čistě nativní výdej 5514 bez mezikroku WGS84 je případná další optimalizace.

Výsledná data mají version:3, crs:EPSG:5514 a origin:[E levé hrany,N horní hrany]. Lokální SVG souřadnice jsou E-originE, originN-N. Obálka se tvoří ze vzorků hran původního výběru a je zarovnaná na síť; může být větší než původní zeměpisný obdélník. Mapový SVG překryv je ukotvený v projektovaných rozích, nikoli roztažený mezi rohy zeměpisné obálky. Při animovaném zoomu se dočasně skryje.

Staré projekty version:2 se při importu převedou, nové projekty se nepřevádějí opakovaně. Změna počátku neoznačeného projektu je odmítnuta. SVG obsahuje CRS, počátek, obálku, jednotky a převodní vztah v metadatech, kontrolní křížky a růžici v samostatných podvrstvách. Běžné SVG se tím nestává univerzálním georeferencovaným GIS formátem.

Převod EPSG:1623 má deklarovanou přesnost 1 m. Numerická shoda s PROJ nebo přesný round-trip není geodetická přesnost. Podklad není zaměření, neřeší výšky ani magnetickou deklinaci. Existující chybné polohy ani neúplné pasporty projekce neopraví. Zobrazení mimo ČR je omezené.

Implementace projekce adaptuje sjtsk.js z projektu Profily ulic, Bára Soukupová; MIT oznámení je v PROJECTION-LICENSE.txt. Přebraný kód je rozšířený a přeformátovaný v novém souboru, existující zdroj se neminifikuje.

Test: node --experimental-default-type=module dio/jtsk.test.mjs. Živé WMS a chování Leafletu je nutné navíc ověřit v prohlížeči.
