# Víceleté rozhraní

## Výběr roku a zobrazení
index.html otevře nejnovější rok podle data/years.json. Ročníky jsou sestupně a bez dovětků. Parametry ?year=2025&view=map a ?year=2025&view=histogram určují přímý vstup; funguje historie zpět/vpřed. Zpětná kompatibilita samostatných starých ročníkových stránek se neudržuje.

Mapa i histogram používají společný datový model a ročníkově nezávislé komponenty v interních rámcích edition-view.html. Nejde o obalení starých stránek. Data roku se načítají jednou; pohledy mají vlastní ovládání a jejich stav se při přepnutí zachová. Skrytí mapy pozastaví přehrávání a zavře dialog. Po návratu se opraví velikost mapy bez ztráty pohledu. Chyby nejsou tiše nahrazovány jiným rokem.

Řazení nové mapy a jeho testy používají společný js/edition-team-order.js. Oficiální pořadí se neodvozuje z časů ani počtu stanovišť. Oficiální nuly nevytvářejí start nebo polohu. Alias histogramu nemění název týmu v mapě. GPS audit nemění pohyb. Potvrzené posuny: 2026 +7200 s, 2025 0 s. timeLimitSeconds je metadata, ne filtr událostí.

## Přidání dalšího roku
Přidat data/<rok>/source.json ve formátu edition-v1 a záznam do data/years.json. Není potřeba upravovat JavaScript; registr je explicitní datový soubor, ne automatické skenování složek.

Zdroj má schemaVersion:1, year, stations a teams. Stanoviště: id, name, lat, lon, nextId a případně zero:{lat,lon,name}, photo (název v foto/). Tým: id, name, scheduledStart, initialStationId, terminatedEarly, events. Událost: time (celé nezáporné sekundy před zobrazovacím posunem), stationId, zero, manual. nextId tvoří úplný okruh. Počet stanovišť, ID, rok a datum nejsou natvrdo ve view komponentách. Adaptéry čtou původní formáty 2025 a 2026 bez přepisování dat.

Volitelné soubory registru: officialResults, stories, audit, histogramConfig. Data, oficiální výsledky, fotografie a původní GPS archiv se při odstranění starého kódu zachovávají.

## Export a kontroly
export.html sbalí jeden rok do HTML s mapou a histogramem, vlastními moduly, styly, daty a případně fotografiemi. Leaflet a jeho styl zůstávají na CDN; mapové dlaždice jsou externí. Není to plně offline mapa.

Testy v tests/ chrání společný model, výsledky, řazení, histogram, sledování, příběhy, cache a export. Dosud provedené Node a simulované DOM kontroly nejsou úplným testem ve skutečném prohlížeči. Po dokončení úklidu znovu spustit celou sadu a ověřit oba ročníky, fotky, audit, CSV, historii a exporty v prohlížeči.
