# Víceleté rozhraní

Víceleté rozhraní připravené ve větvi hry/prvnivystrel-multiyear.

Index přímo otevře nejnovější rok z data/years.json; vpravo nahoře je výběr roku a archivu. Parametry ?year=2025&view=histogram určují přímý vstup. Zpět/vpřed v prohlížeči funguje přes historii URL. Staré adresy se v tomto kroku nepřesměrovávají.

Mapa i histogram používají jeden datový model a společné ročníkově nezávislé komponenty. Obsah je oddělen do stejně původních rámců edition-view.html kvůli izolaci DOM a stylů. Nejde o obalení starých ročníkových stránek. Data jednoho ročníku se načtou jednou; rámy a jejich nastavení zůstávají po přepnutí zachované. Skrytí mapy pozastaví přehrávání a zavře dialog. Při návratu se mapa přizpůsobí velikosti bez ztráty pohledu. Chyby načítání nejsou tiše nahrazovány jiným rokem; lze je opakovat tlačítkem.

Další rok: data/<rok>/source.json ve formátu edition-v1 a záznam v data/years.json. Formát zdroje: schemaVersion:1, year, stations a teams. Stanoviště má id, name, lat, lon, nextId a případně zero:{lat,lon,name}, photo (název souboru v foto/). Tým má id, name, scheduledStart, initialStationId, terminatedEarly, events. Událost má time (sekundy před zobrazovacím posunem), stationId, zero, manual. nextId tvoří úplný okruh. Počet stanovišť, jejich ID, rok a datum nejsou natvrdo v zobrazovacích komponentách. Adaptéry čtou staré formáty 2025 a 2026 bez přepisování dat.

Volitelné soubory registru: officialResults, stories, audit, histogramConfig. Výsledky se neodvozují; nuly nevytvářejí start ani polohu. Histogram zachovává aliasy a výjimky ročníku, nikoli změny jmen v mapě. GPS audit nemění pohyb. timeLimitSeconds je metadata, ne filtr událostí. Časové posuny jsou potvrzené podle skutečného startu her kolem 9:00: 2026 +7200 s, 2025 0 s.

Ověřeno: syntaxe nových modulů; testy cache, opakování chyb a zachování stavu; simulované DOM kontroly mapy, oficiálních nul, escapování, fotek, příběhů a pozastavení. Dřívější kontrola adaptérů nad Excelem: 1176 a 992 potvrzení. Kompletní test ve skutečném prohlížeči nebyl proveden. Před sloučením ověřit obě mapy, histogramy, fotky, audit, CSV, historii a rychlé přepínání.
