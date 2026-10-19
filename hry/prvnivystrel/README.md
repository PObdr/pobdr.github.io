# První výstřel 2026
Statický web bez buildu, backendu a importu Excelu. Změny pouze commity do hry/prvnivystrel/.

## Model pohybu — confirmed-stations
Animace, trasy i výpočet možných blízkostí používají pouze úspěšná potvrzení stanovišť a nultých míst. Vždy se bere známá souřadnice stanoviště/nultého místa, nikoli GPS připojená k pokusu. GPS mezibody neovlivňují pohyb ani tehdy, když prošly rychlostním filtrem a nejsou v auditu. To odstraňuje falešné odbočky typu Janus 6296 severně od Dvoreckého mostu. Žádná oblast Prahy není plošně zakázána a žádné stanoviště není odstraněno.

Zůstává zachováno všech 992 úspěšných událostí u 88 týmů (83 se záznamy). Čas potvrzení není přesný příchod/odchod. Mezi potvrzeními je přímková interpolace, ne rekonstrukce ulic, MHD či pobytu. Model může procházet i místy, kterými tým skutečně nešel; možné blízkosti proto nejsou důkaz setkání. Před prvním a po posledním potvrzení polohu neznáme a tým nezobrazujeme. Posun +2 h je nepotvrzený předpoklad.

## Data
source.json obsahuje stanoviště, nultá místa, týmy, plánované starty a časy úspěšných událostí. gps.json zachovává 2109 GPS bodů s původním limitem přesnosti do 100 m a zaokrouhlením na 5 desetinných míst. GPS se stále dekódují do raw.t, ale prepare z nich NEVYTVÁŘÍ animační body. suspicious.json zůstává beze změny: 243 kandidátů, nikoli potvrzených chyb. Zapnutí červených auditních značek nemění výpočty.

GPS tok je gzip-base64 s unsigned varint počtem bodů pro každý tým v teamIds; pro každý bod následují tři ZigZag-varint rozdíly času a souřadnic vůči předchozímu bodu. Počáteční hodnoty nula, souřadnice v 1e-5 stupně s počátkem [50,14]. Dekodér kontroluje úplnost a rozsah. Původní data se nemažou.

Data jsou místní, bez historického HTML a GitHub API. Internet je potřeba pro Leaflet a OSM. Lokálně používat HTTP server, ne file://. npm test nevyžaduje npm install. Po aktualizaci provést úplné obnovení stránky včetně cache. Testy kontrolují potvrzení bez GPS, ignorování neoznačených GPS odboček, nultá místa a stejný model pro setkání.
