# První výstřel 2025

Mapa: index_2025.html. Histogram: histogram_2025.html. Používat přes HTTP server.

Zdroj export_db.xlsx: 15 stanovišť, 12 nultých míst, 84 týmů, 81 se záznamy. Pohyb a histogram používají 1176 úspěšných příchodů včetně 39 ručně uznaných. Neúspěšné pokusy ani 246 nápověd nejsou polohové kotvy. source.json není úplný archiv všech 3985 logů; původní Excel zůstává úplným zdrojem ostatních událostí. GPS audit 2026 se nepřenáší a zpětná filtrace bez historie accuracy_threshold se neprovádí.

Časy jsou z Excelu bez převodu pásma a bez posunu +2 h. Pořadí se počítá podle počtu různých běžných potvrzení sestupně a času od nultého do posledního potvrzení vzestupně. Není oficiální výsledkovou listinou. Týmy bez záznamu nemají pořadí. Trasa vychází z next_position_id.

Fotografie: ID 5 -> 1-final.jpeg, 8 -> 2-final.jpeg, 9 -> 3-final.jpeg, 10 až 21 -> 4 až 15-final.jpeg. Fotografie se nepřepisují. Texty příběhů a nápověd nejsou součástí tohoto importu. Sdílené moduly a soubory 2026 zůstávají beze změn.

Test: node --test tests/year2025.test.mjs. Syntaxe modulu byla ověřena; kompletní prohlížečový test zatím nebyl proveden.
