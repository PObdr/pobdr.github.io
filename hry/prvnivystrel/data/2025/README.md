# První výstřel 2025

Mapa: index_2025.html. Histogram: histogram_2025.html. Používat přes HTTP server.

Pořadí a celkový čas všech 84 týmů se načítají z official-results.json, přepsaného z Tabulka-vysledku-2025.xlsx. Párování je podle databázového ID; import ověřil jména po sjednocení mezer a velikosti písmen. Pokud oficiální data chybějí nebo jsou neplatná, aplikace oznámí chybu místo tichého použití vypočteného pořadí.

David Filip, Holky s HiV^2 a Skorskor mají oficiálně místa 82, 83, 84 a čas 00:00:00. Nemají však herní události, start ani polohu. Oficiální hodnoty nepřepisují start, elapsed ani polohové kotvy z logu. decode2025 zachovává interní rekonstrukci pořadí pro kontrolu; load2025 ji nahrazuje oficiálním pořadím.

Pohyb a histogram používají 1176 úspěšných příchodů včetně 39 ručně uznaných. source.json není úplný archiv všech 3985 logů; ostatní události zůstávají v původním Excelu. Neúspěšné pokusy ani 246 nápověd nejsou polohové kotvy. GPS audit 2026 se nepřenáší. Časy příchodů jsou z Excelu bez převodu pásma a bez posunu +2 h.

Fotografie: ID 5 -> 1-final.jpeg, 8 -> 2-final.jpeg, 9 -> 3-final.jpeg, 10 až 21 -> 4 až 15-final.jpeg. Fotografie, sdílené moduly, zdrojové příchody a rok 2026 zůstávají beze změn.

Testy: node --test tests/year2025.test.mjs tests/official2025.test.mjs. Kompletní prohlížečový test nebyl proveden.
