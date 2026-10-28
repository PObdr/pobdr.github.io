# První výstřel 2025

Mapa: /hry/prvnivystrel/index.html?year=2025&view=map
Histogram: /hry/prvnivystrel/index.html?year=2025&view=histogram
Exportér: /hry/prvnivystrel/export.html
Používat přes HTTP/HTTPS.

Ročník načítá společný edition-loader.js a edition-model.js podle data/years.json. Oficiální pořadí a čas všech 84 týmů pocházejí z official-results.json, importovaného z Tabulka-vysledku-2025.xlsx. Chybné nebo chybějící povinné výsledky vyvolají chybu, nikoli dopočítané pořadí.

David Filip, Holky s HiV^2 a Skorskor mají místa 82, 83, 84 a oficiální čas 00:00:00. Bez herních událostí ale nemají start ani polohu. Výsledky nepřepisují startTime, elapsed ani polohové kotvy.

Model používá 1176 úspěšných příchodů včetně 39 ručně uznaných. source.json není úplný archiv 3985 logů; ostatní události zůstávají v původním Excelu. Neúspěšné pokusy a 246 nápověd nejsou polohové kotvy. Časy jsou z Excelu bez posunu; GPS audit 2026 se sem nepřenáší.

Fotografie: ID 5 -> 1-final.jpeg, 8 -> 2-final.jpeg, 9 -> 3-final.jpeg, 10 až 21 -> 4 až 15-final.jpeg. Data a fotografie se nemažou.

Testy: node --test tests/year2025.test.mjs tests/official2025.test.mjs. Testy používají společné decodeEdition a applyResults, ne původní ročníkové helpery.
