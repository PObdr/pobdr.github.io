# Víceleté rozhraní — datový základ

První krok na pracovní větvi. Index ani zobrazení mapy a histogramu se tímto commitem ještě nemění. Stávající stránky a main zůstávají nedotčené.

Registr: data/years.json. Nejvyšší rok je výchozí; explicitní ?year=2025&view=histogram má přednost. Neznámý rok nebo view vyvolá chybu. Společné rozhraní a zachování stavu budou následovat.

Další ročník: přidat data/<rok>/source.json a záznam do years.json s format edition-v1. Bez úprav JavaScriptu; seznam ročníků je explicitní datový registr, nikoli skenování adresářů. Konfigurace obsahuje datum, offsetSeconds a případně výsledky, příběhy, audit či histogram. timeLimitSeconds je metadata, ne automatické vyřazování událostí.

Kanonický source.json: schemaVersion:1, year, stations a teams. Stanoviště: id, name, lat, lon, nextId, volitelně zero:{lat,lon,name} a photo (název souboru v foto/). nextId musí tvořit úplný okruh. Tým: id, name, scheduledStart, initialStationId, terminatedEarly, events. Událost: time (celé nezáporné sekundy od počátku herního dne před zobrazovacím posunem), stationId, zero, manual. Bez nultého místa použít zero:null. Jeden ročník může mít libovolné ID a počet stanovišť.

Adaptéry positions-v1 a dataset-v1 načítají dnešní data beze změny. Pohyb používá pouze potvrzená stanoviště, ne GPS mezibody. Oficiální výsledky jsou oddělené; chybějící výsledek je null, nikdy dopočítané pořadí. Oficiální nula nevytváří start ani polohu. Alias histogramu nemění název týmu v mapě. Audit a příběhy patří konkrétnímu roku.

2026 zachovává +7200 s jako dosavadní nepotvrzený předpoklad, 2025 nulový posun. Historické kódování 2026 neobsahuje příznak ručního uznání; jeho absence není důkaz automatického příchodu.

Ověřeno: sedm testů node --test tests/editions.test.mjs a kontrola adaptérů nad daty z Excelů (2025: 1176 příchodů, 2026: 992). Uživatelské rozhraní zatím není převedeno ani otestováno v prohlížeči.
