# DIOGEN

# DIO – povrchový podklad

Vlastní implementace inspirovaná průzkumem projektu Profily ulic (Bára Soukupová, https://github.com/barasoukup/profily-ulic/). Nepřebírá kód generovaných značek ani ilustrace Streetmix.

Zdroje: IPR technická mapa, SMZ, parkování TSK a OSM. Veřejná dostupnost není zárukou licence pro další šíření. OSM: © přispěvatelé OpenStreetMap, ODbL. U otevřených dat Prahy uvádět IPR Praha, MHMP, TSK a provedené úpravy; ověřit konkrétní podmínky poskytovatelů.

Automatické párování stromů, výslovných lamp a jízdenkových automatů vyžaduje jediné kandidáty v obou směrech do 2 m, rozdíl do 1 m a žádný rozpor druhu. Polohy se neprůměrují; pracovní priorita IPR > SMZ > OSM není zárukou přesnosti. Rozhodnutí lze zrušit a exportovat v pracovním JSON. Lokální rozhodnutí jsou vázaná na otisk dat. Koleje se potlačují jen při úplném vzorkovaném souběhu stejné kategorie do 0,5 m, směr do přibližně 11,5 stupně; nejde o topologický důkaz. Budovy a ploty se automaticky neslučují.

V SVG zůstávají skryté vrstvy a volitelná původní data. Symboly jsou schematické, nikoli normově certifikované. Koruny mají skutečný rozměr jen z diameter_crown; výška ani VELIKOST se za průměr nepovažují. Neznámé, pomocné a podzemní kategorie jsou výchozím nastavením skryté. Záporný OSM layer sám o sobě není filtr podzemí.

Omezení: neúplné zdroje, žádný kompletní pasport značek TSK, žádné OSM relace, místní přibližná projekce. CORS a dostupnost serverů mohou selhat. Druhy se nepřekládají automaticky mezi češtinou a latinou; rozdílné názvy mohou vyvolat konzervativní konflikt. Pracovní JSON není obecný GIS import.

Offline testy: `node --experimental-default-type=module dio/tests/unit/test.mjs`. Neověřují živé služby ani prohlížeč.

## Struktura

- src/: aplikační moduly podle odpovědností; vstup src/app.js.
- styles/: styly rozhraní; assets/: statické obrázky a ikona.
- tests/unit/: Node testy; tests/browser/: testy vyžadující prohlížeč.
- docs/: podrobnosti geometrie, zdrojů, parkování a přechodů.
- fonts/Bahnschrift.ttf: zachovaná uživatelská kopie fontu.
- data/lamps/: generovaná data; stávající workflow a cache se nemění.

Úklid nepřidává knihovnu značek ani nezapojuje písmo do renderování.
