# Jednorázový úklid DIOGEN

Pouze repozitář PObdr/pobdr.github.io. Adresa /dio/ zůstává.
Workflow po schváleném vložení spustí migraci; do main ji zapíše až po testech.
Přesune 47 souborů podle layout.json. Index a hlavní README zůstanou v dio/.
Font dio/fonts/Bahnschrift.ttf ani generovaná data dio/data/lamps se nepřesouvají.

Skript odmítne neznámé soubory, kolize cest, změněný font a jiný rodičovský commit.
Importy a URL vztažené k import.meta.url upraví podle původních cílů.
Relativní fetch() URL vztažené k dokumentu zůstanou beze změny.
Neformátuje ani nemění algoritmy aplikace. Pouze přesuny, cesty a dokumentace.
Před a po přesunu proběhnou existující Node testy a prohlížečové maskovací testy.
Font se v Chromium ověří jako načitatelný. Nejde o jeho zapojení do značek.

Workflow používá contents:write pro jediný refaktorovací commit a actions:write
pro spuštění již existujícího lighting-pages.yml. Nepoužívá force push.
Při selhání testů se přesuny do main necommitnou. Přidané nástroje však zůstanou.
Po úspěchu lze stejný workflow ručně spouštět pro kontrolu reorganizované verze.

Lokálně: node tools/dio-refactor/refactor.test.mjs
Kontrola po migraci: node tools/dio-refactor/refactor.mjs --validate
Testy neověřují živé zdroje ani funkčnost v Inkscapu.
