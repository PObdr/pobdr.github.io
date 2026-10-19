# První výstřel 2026
Statický web bez buildu a importu Excelu. Osm JS modulů, styles.css, audit, testy. Změny pouze commity. npm test nepotřebuje npm install. Lokálně používat HTTP server.

source.json odkazuje na původní dataset v index.html v neměnném commitu 11efe9ff9d4b94bb25d7cc2655ea2c3f10d7be87 stejného repozitáře. Archivní HTML se jen parsuje, nespouští. Vyžaduje veřejný raw.githubusercontent.com, záloha je GitHub Contents API s limitem. Není to závislost na novém index.html. Pro pozdější lokální uložení nahraďte source.json objektem {"dataset":{"p":[...],"t":[...]}} původního formátu. Samostatné stations/teams/events JSON tato migrace nevytváří.

suspicious.json: existující gzip-base64 audit, rozbalený nativním DecompressionStream. 243 kandidátů: sjednocení předchozích 43 vyřazení, konců 91 rychlých úseků a 21 konfliktů ve stejné sekundě. Kategorie se překrývají; nejde o potvrzené chyby. Sloupce a důvody jsou uvnitř. latE5/lonE5 jsou souřadnice krát 100000.

Podezřelé GPS nikdy nevstupují do pohybu/setkání. Výchozí checkbox vypnut; zapnutí pouze přidá červené auditní značky napříč dnem. Úspěšná potvrzení zůstávají jako odvozená stanoviště. +2 h je nepotvrzený předpoklad. Přesuny a blízkosti jsou modelové odhady. Potřeba internetu pro archiv, Leaflet a OSM.

Ověřeny 4 testy, syntaxe 8 modulů a rozhraní v Chromium s náhradním Leafletem a zachyceným archivním zdrojem. Reálné dlaždice, dostupnost veřejného archivu a nasazení Pages nejsou ověřeny. V testovacích datech zachováno 88 týmů a 992 úspěšných událostí; podezřelé GPS vyloučeny. Znovunačtěte cache po aktualizaci.
